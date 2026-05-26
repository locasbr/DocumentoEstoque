'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { X, Loader } from 'lucide-react'

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onBarcodeDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastDetectedCode, setLastDetectedCode] = useState('')
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    let isMounted = true
    let scanning = true

    const initializeCamera = async () => {
      try {
        setError('')
        const codeReader = new BrowserMultiFormatReader()
        readerRef.current = codeReader

        if (isMounted && videoRef.current) {
          setLoading(false)

          // Usar decodeFromVideoDevice com callback contínuo
          await codeReader.decodeFromVideoDevice(
            undefined, // deviceId - undefined usa câmera padrão (traseira no mobile)
            videoRef.current, // elemento de vídeo
            (result: any) => {
              if (!scanning || !isMounted) return

              if (result) {
                const detectedCode = result.getText()
                
                // Evitar duplicatas
                if (detectedCode !== lastDetectedCode) {
                  setLastDetectedCode(detectedCode)

                  // Feedback visual
                  if (videoRef.current) {
                    videoRef.current.style.borderColor = '#10b981'
                    videoRef.current.style.boxShadow = '0 0 10px #10b981'
                  }

                  // Aguardar um pouco antes de chamar o callback para exibir feedback
                  setTimeout(() => {
                    onBarcodeDetected(detectedCode)
                    if (isMounted) {
                      closeCamera()
                    }
                  }, 600)
                }
              }
            }
          )
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            if (err.message.includes('Permission denied')) {
              setError('Permissão de câmera negada. Por favor, ative a câmera nas configurações.')
            } else if (err.message.includes('NotFound')) {
              setError('Nenhuma câmera encontrada no dispositivo.')
            } else {
              setError(`Erro ao acessar câmera: ${err.message}`)
            }
          } else {
            setError('Erro ao acessar câmera')
          }
          setLoading(false)
        }
      }
    }

    initializeCamera()

    return () => {
      isMounted = false
      scanning = false
      BrowserMultiFormatReader.releaseAllStreams()
    }
  }, [lastDetectedCode, onBarcodeDetected])

  const closeCamera = () => {
    BrowserMultiFormatReader.releaseAllStreams()
    onClose()
  }

  const handleClose = () => {
    closeCamera()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Leitor de Código de Barras</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-blue-800 rounded-full transition"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 text-sm">
              ❌ {error}
            </div>
          )}

          {loading && !error && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader className="animate-spin mb-3 text-blue-600" size={32} />
              <p className="text-gray-600 dark:text-gray-400">Iniciando câmera...</p>
            </div>
          )}

          {!loading && !error && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 rounded-lg bg-black border-4 border-blue-600 transition-all"
                style={{
                  objectFit: 'cover',
                }}
              />

              {/* Overlay de guia visual */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-dashed border-white opacity-60 w-48 h-40 rounded-lg"></div>
              </div>

              {/* Indicador de scanning */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                <div className="text-white text-xs font-medium bg-black bg-opacity-50 px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Procurando código de barras...
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            📱 Aponte a câmera para o código de barras para ler automaticamente
          </p>
        </div>
      </div>
    </div>
  )
}
