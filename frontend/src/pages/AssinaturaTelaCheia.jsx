import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function getTrimmedCanvas(sourceCanvas) {
  const ctx = sourceCanvas.getContext('2d')
  const { width, height } = sourceCanvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  let top = height
  let left = width
  let right = 0
  let bottom = 0
  let hasInk = false

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const a = data[idx + 3]

      if (a > 0 && (r < 245 || g < 245 || b < 245)) {
        hasInk = true
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }

  if (!hasInk) {
    return null
  }

  const trimWidth = right - left + 1
  const trimHeight = bottom - top + 1
  const trimmed = document.createElement('canvas')
  trimmed.width = trimWidth
  trimmed.height = trimHeight

  const trimmedCtx = trimmed.getContext('2d')
  trimmedCtx.fillStyle = '#ffffff'
  trimmedCtx.fillRect(0, 0, trimWidth, trimHeight)
  trimmedCtx.drawImage(sourceCanvas, left, top, trimWidth, trimHeight, 0, 0, trimWidth, trimHeight)

  return trimmed
}

function AssinaturaTelaCheia() {
  const navigate = useNavigate()
  const location = useLocation()
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const desenhandoRef = useRef(false)
  const ultimoPontoRef = useRef({ x: 0, y: 0 })
  const [salvando, setSalvando] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const nomeArquivo = location.state?.nomeArquivo ?? ''
  const pedido = location.state?.pedido ?? null
  const veioDaSelecao = Boolean(location.state?.arquivoSelecionado)

  const empresa = pedido?.empresa ?? '-'
  const cliente = pedido?.cliente ?? '-'
  const numero = pedido?.numeroPedido ?? '-'
  const valor = pedido?.valor ?? '-'
  const data = pedido?.dataPedido ?? '-'

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ajustarCanvas = () => {
      setCanvasSize({
        width: container.clientWidth,
        height: container.clientHeight,
      })
    }

    ajustarCanvas()
    window.addEventListener('resize', ajustarCanvas)
    return () => window.removeEventListener('resize', ajustarCanvas)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasSize.width <= 0 || canvasSize.height <= 0) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [canvasSize])

  const obterPosicao = (event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const iniciarAssinatura = (event) => {
    const pos = obterPosicao(event)
    desenhandoRef.current = true
    ultimoPontoRef.current = pos
  }

  const desenharAssinatura = (event) => {
    if (!desenhandoRef.current) return
    const pos = obterPosicao(event)
    const ctx = canvasRef.current.getContext('2d')

    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#111111'
    ctx.beginPath()
    ctx.moveTo(ultimoPontoRef.current.x, ultimoPontoRef.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    ultimoPontoRef.current = pos
  }

  const finalizarAssinatura = () => {
    desenhandoRef.current = false
  }

  const limparAssinatura = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const confirmarAssinatura = async () => {
    if (!nomeArquivo || !pedido) return
    console.log('Iniciando salvamento...')
    setSalvando(true)

    try {
      const trimmedCanvas = getTrimmedCanvas(canvasRef.current)

      if (!trimmedCanvas) {
        window.alert('Desenhe a assinatura antes de confirmar.')
        setSalvando(false)
        return
      }

      const assinaturaBase64 = trimmedCanvas.toDataURL('image/jpeg', 0.7)

      const documentoPayload = {
        cliente: pedido?.cliente ?? pedido?.Cliente ?? null,
        valor: pedido?.valor ?? pedido?.Valor ?? null,
        numero: pedido?.numero ?? pedido?.Numero ?? null,
        data: pedido?.data ?? pedido?.Data ?? null,
        ...pedido,
      }

      const response = await fetch('http://192.168.50.53:3000/salvar-assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeArquivo,
          base64: assinaturaBase64,
          documento: documentoPayload,
        }),
      })

      if (!response.ok) {
        const erroApi = await response.json().catch(() => null)
        throw new Error(erroApi?.erro || 'Falha ao salvar assinatura')
      }

      navigate('/', {
        state: { documentoArquivado: 'Documento assinado e arquivado!' },
      })
    } catch (error) {
      window.alert(error?.message || 'Nao foi possivel salvar a assinatura.')
    } finally {
      setSalvando(false)
    }
  }

  if (!veioDaSelecao || !nomeArquivo || !pedido) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-full border-2 border-black px-6 py-3 font-semibold text-black"
        >
          Voltar para a lista
        </button>
      </div>
    )
  }

  return (
    <section className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-white">
      {/* Faixa superior com dados do pedido */}
      <div className="flex-shrink-0 border-b-2 border-black/10 bg-slate-50 px-4 py-3">
        <h2 className="mb-2 text-center text-sm font-bold uppercase tracking-wide text-slate-500">
          Detalhes do Pedido
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-800 sm:grid-cols-3">
          <p><span className="font-semibold">Empresa:</span> {empresa}</p>
          <p><span className="font-semibold">Cliente:</span> {cliente}</p>
          <p><span className="font-semibold">Numero:</span> {numero}</p>
          <p>
            <span className="font-semibold">Valor:</span>{' '}
            {typeof valor === 'number' ? `R$ ${valor.toFixed(2)}` : valor}
          </p>
          <p><span className="font-semibold">Data:</span> {data}</p>
        </div>
      </div>

      {/* Área de assinatura — ocupa o restante (~70%) */}
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onPointerDown={iniciarAssinatura}
          onPointerMove={desenharAssinatura}
          onPointerUp={finalizarAssinatura}
          onPointerLeave={finalizarAssinatura}
          className="h-full w-full touch-none bg-white"
        />
      </div>

      {/* Botões */}
      <div className="flex-shrink-0 z-20 flex flex-wrap items-center justify-center gap-3 border-t border-black/20 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full rounded-full border-2 border-black bg-white px-6 py-3 font-bold text-black shadow-lg sm:w-auto"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={limparAssinatura}
          className="w-full rounded-full border-2 border-black bg-white px-6 py-3 font-bold text-black shadow-lg sm:w-auto"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={confirmarAssinatura}
          disabled={salvando}
          className="w-full rounded-full bg-green-600 px-6 py-3 font-bold text-white shadow-lg disabled:opacity-70 sm:w-auto"
        >
          {salvando ? 'Salvando...' : 'Confirmar Assinatura'}
        </button>
      </div>
    </section>
  )
}

export default AssinaturaTelaCheia
