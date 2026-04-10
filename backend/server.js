const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 1. Rota para listar arquivos com dados do JSON
app.get('/arquivos', (req, res) => {
    fs.readdir(config.caminhoPendentes, (err, arquivos) => {
        if (err) return res.status(500).json({ erro: 'Erro ao ler pasta' });
        const arquivosJson = arquivos.filter(arq => arq.endsWith('.json') && !arq.includes('_assinado'));

        const leituras = arquivosJson.map(nome => {
            return new Promise((resolve) => {
                const caminho = path.join(config.caminhoPendentes, nome);
                fs.readFile(caminho, 'utf8', (erroLeitura, conteudo) => {
                    if (erroLeitura) return resolve({ nome });
                    try {
                        const dados = JSON.parse(conteudo);
                        resolve({
                            nome,
                            cliente: dados.cliente ?? '-',
                            numeroPedido: dados.numeroPedido ?? '-',
                            valor: dados.valor ?? '-',
                            dataPedido: dados.dataPedido ?? '-',
                        });
                    } catch {
                        resolve({ nome });
                    }
                });
            });
        });

        Promise.all(leituras).then(resultado => res.json(resultado));
    });
});

// 2. NOVA ROTA: Ler o conteúdo de um arquivo específico
app.get('/pedido/:nomeArquivo', (req, res) => {
    const nomeArquivo = req.params.nomeArquivo;
    const caminhoCompleto = path.join(config.caminhoPendentes, nomeArquivo);

    fs.readFile(caminhoCompleto, 'utf8', (err, data) => {
        if (err) return res.status(404).json({ erro: 'Pedido não encontrado' });
        res.json(JSON.parse(data));
    });
});

// 3. Rota para salvar assinatura
app.post('/salvar-assinatura', async (req, res) => {
    const { nomeArquivo, base64, documento } = req.body;
    console.log(`[salvar-assinatura] Recebido: ${nomeArquivo || 'sem-nome'}`);

    if (!nomeArquivo || !base64 || !documento) {
        return res.status(400).json({ erro: 'nomeArquivo, base64 e documento são obrigatórios' });
    }

    // Nome de destino é sempre estritamente ID_assinado.json, sem sufixos numéricos
    const nomeBase = path.parse(nomeArquivo).name.replace(/_assinado$/, '');
    const nomeAssinado = `${nomeBase}_assinado.json`;
    const caminhoDestino = path.join(config.caminhoPendentes, nomeAssinado);
    const caminhoPendente = path.join(config.caminhoPendentes, nomeArquivo);

    const registroAssinado = {
        ...documento,
        nomeArquivoOriginal: nomeArquivo,
        assinadoEm: new Date().toISOString(),
        assinaturaBase64: String(base64),
    };

    try {
        // Exclui o _assinado anterior se existir, garantindo substituição limpa
        try {
            await fs.promises.unlink(caminhoDestino);
            console.log(`[salvar-assinatura] Assinado anterior removido: ${nomeAssinado}`);
        } catch (e) {
            if (e.code !== 'ENOENT') throw e; // erro real, propaga
            // ENOENT = não existia, tudo bem
        }

        // Salva o novo arquivo assinado
        await fs.promises.writeFile(caminhoDestino, JSON.stringify(registroAssinado), 'utf8');
        const stats = await fs.promises.stat(caminhoDestino);
        console.log(`[salvar-assinatura] Arquivado: ${nomeAssinado} (${(stats.size / 1024).toFixed(2)} KB)`);
    } catch (erroSalvar) {
        console.error(`[salvar-assinatura] Erro ao salvar:`, erroSalvar.message);
        return res.status(500).json({ erro: 'Erro ao salvar assinatura' });
    }

    // Exclui o pendente original (sem _assinado)
    try {
        await fs.promises.unlink(caminhoPendente);
        console.log(`[salvar-assinatura] Pendente removido: ${nomeArquivo}`);
    } catch (erroRemover) {
        if (erroRemover.code !== 'ENOENT') {
            console.error(`[salvar-assinatura] Nao foi possivel remover pendente (${nomeArquivo}):`, erroRemover.message);
        }
        // Não trava o servidor — assinatura já foi salva com sucesso
    }

    return res.status(200).json({
        mensagem: 'Documento assinado e arquivado!',
        arquivo: nomeAssinado,
    });
});


app.listen(config.porta, () => {
    console.log(`Servidor OTX ON: http://localhost:${config.porta}`);
});