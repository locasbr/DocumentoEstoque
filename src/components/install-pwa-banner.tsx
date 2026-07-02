'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    const dispensado = localStorage.getItem('pwa_banner_dispensado')
    if (dispensado) return

    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const handler = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      timeoutId = setTimeout(() => setMostrar(true), 10000)
    }

    const handleAppInstalled = () => {
      setMostrar(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', handleAppInstalled)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const handleInstalar = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted' && typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'pwa_instalado')
    }

    setDeferredPrompt(null)
    setMostrar(false)
  }

  const handleDispensar = () => {
    localStorage.setItem('pwa_banner_dispensado', 'true')
    setMostrar(false)
  }

  if (!mostrar || !deferredPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border-2 border-green-500 bg-white p-4 shadow-2xl dark:bg-gray-900 md:bottom-6 md:left-auto md:right-6 md:max-w-sm animate-slideDown">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-2xl">
          📦
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Instale o EstoqueSystem
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Acesso rápido pela tela inicial, funciona igual app!
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstalar}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:shadow-lg"
            >
              <Download className="h-3.5 w-3.5" />
              Instalar
            </button>
            <button
              onClick={handleDispensar}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Agora não
            </button>
          </div>
        </div>
        <button onClick={handleDispensar} className="p-1 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}