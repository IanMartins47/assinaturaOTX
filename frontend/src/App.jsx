import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Assinatura from './pages/Assinatura.jsx'
import AssinaturaTelaCheia from './pages/AssinaturaTelaCheia.jsx'

function App() {
  const location = useLocation()
  const telaCheiaAtiva = location.pathname === '/assinatura-tela-cheia'

  if (telaCheiaAtiva) {
    return (
      <Routes>
        <Route path="/assinatura-tela-cheia" element={<AssinaturaTelaCheia />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700 bg-slate-950/80 px-6 py-5 backdrop-blur">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold tracking-wide">OTX Signature</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/assinatura/:nomeArquivo" element={<Assinatura />} />
          <Route path="/assinatura-tela-cheia" element={<AssinaturaTelaCheia />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
