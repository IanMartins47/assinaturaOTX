import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

function Assinatura() {
  const navigate = useNavigate()
  const location = useLocation()
  const { nomeArquivo = '' } = useParams()
  const nomeDecodificado = decodeURIComponent(nomeArquivo)
  const [pedido, setPedido] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const veioDaSelecao = Boolean(location.state?.arquivoSelecionado)

  useEffect(() => {
    const carregarPedido = async () => {
      setCarregando(true)
      setErro('')

      try {
        const response = await fetch(`/api/pedido/${encodeURIComponent(nomeDecodificado)}`)

        if (!response.ok) {
          throw new Error('Nao foi possivel carregar os detalhes do pedido.')
        }

        const data = await response.json()
        setPedido(data)
      } catch {
        setErro('Erro ao buscar detalhes do pedido.')
        setPedido(null)
      } finally {
        setCarregando(false)
      }
    }

    if (!veioDaSelecao) {
      setCarregando(false)
      return
    }

    if (nomeDecodificado) {
      carregarPedido()
    } else {
      setCarregando(false)
      setErro('Arquivo invalido.')
    }
  }, [nomeDecodificado, veioDaSelecao])

  const cliente = pedido?.cliente ?? pedido?.Cliente ?? '-'
  const numero = pedido?.numeroPedido ?? pedido?.Numero ?? '-'
  const valor = pedido?.valor ?? pedido?.Valor ?? '-'
  const data = pedido?.dataPedido ?? pedido?.Data ?? '-'

  return (
    <section className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-3xl rounded-xl bg-slate-900 p-4">
        {!veioDaSelecao && (
          <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-center text-red-100">
            Selecione um arquivo na lista para abrir a ficha de assinatura.
          </div>
        )}

        {carregando && <p className="mt-6 text-center text-slate-200">Carregando detalhes...</p>}
        {erro && <p className="mt-6 rounded-md bg-red-500/20 p-3 text-center text-red-200">{erro}</p>}

        {!carregando && !erro && pedido && veioDaSelecao && (
          <div className="mt-2 rounded-xl border-4 border-black bg-white p-8 text-slate-900 shadow-2xl">
            <h2 className="text-center text-2xl font-bold">Ficha de Assinatura</h2>
            <p className="mt-2 text-center text-sm">Arquivo: {nomeDecodificado || '-'}</p>

            <ul className="mt-6 space-y-2 text-left text-base">
              <li><strong>Cliente:</strong> {String(cliente)}</li>
              <li><strong>Numero:</strong> {String(numero)}</li>
              <li><strong>Valor:</strong> {String(valor)}</li>
              <li><strong>Data:</strong> {String(data)}</li>
            </ul>

            <button
              type="button"
              onClick={() =>
                navigate('/assinatura-tela-cheia', {
                  state: {
                    nomeArquivo: nomeDecodificado,
                    pedido,
                    arquivoSelecionado: true,
                  },
                })
              }
              className="mt-8 w-full rounded-full border-2 border-black bg-slate-900 px-6 py-3 text-lg font-bold text-white transition hover:bg-slate-800"
            >
              Clique aqui para assinar
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 w-full rounded-lg border border-slate-500 px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
        >
          Voltar
        </button>
      </div>
    </section>
  )
}

export default Assinatura
