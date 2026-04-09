import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const [arquivos, setArquivos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const mensagemArquivamento = location.state?.documentoArquivado ?? ''

  useEffect(() => {
    const carregarArquivos = async () => {
      try {
        const response = await fetch('/api/arquivos')

        if (!response.ok) {
          throw new Error('Nao foi possivel carregar os arquivos.')
        }

        const data = await response.json()
        setArquivos(Array.isArray(data) ? data : [])
      } catch {
        setErro('Erro ao conectar com o backend.')
      } finally {
        setCarregando(false)
      }
    }

    carregarArquivos()
  }, [])

  return (
    <>
      <h2 className="mb-6 text-xl font-semibold text-slate-100">Pedidos pendentes</h2>
      {mensagemArquivamento && (
        <p className="mb-4 rounded-md bg-green-500/20 p-3 text-green-100">
          {mensagemArquivamento}
        </p>
      )}

      {carregando && <p className="text-slate-200">Carregando arquivos...</p>}
      {erro && <p className="rounded-md bg-red-500/20 p-3 text-red-200">{erro}</p>}

      {!carregando && !erro && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {arquivos.map((arquivo) => (
            <button
              key={arquivo.nome}
              type="button"
              onClick={() =>
                navigate(`/assinatura/${encodeURIComponent(arquivo.nome)}`, {
                  state: { arquivoSelecionado: true },
                })
              }
              className="cursor-pointer rounded-lg border border-slate-700 bg-white p-4 text-left text-slate-900 shadow-md transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-base font-semibold text-slate-900">{arquivo.cliente}</span>
                <span className="whitespace-nowrap text-sm font-medium text-slate-500">#{arquivo.numeroPedido}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                <span>
                  {typeof arquivo.valor === 'number'
                    ? arquivo.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : arquivo.valor}
                </span>
                <span>{arquivo.dataPedido}</span>
              </div>
            </button>
          ))}
        </section>
      )}

      {!carregando && !erro && arquivos.length === 0 && (
        <p className="text-slate-300">Nenhum arquivo encontrado.</p>
      )}
    </>
  )
}

export default Home
