'use client'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  onDetected: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let stream: MediaStream | undefined
    let intervalo: NodeJS.Timeout

    async function iniciar() {
      // Verifica suporte
      if (!('BarcodeDetector' in window)) {
        setErro('Seu navegador não suporta leitura automática. Use o Chrome no Android.')
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
        })

        intervalo = setInterval(async () => {
          if (!videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0) {
              clearInterval(intervalo)
              stream?.getTracks().forEach(t => t.stop())
              onDetected(codes[0].rawValue)
            }
          } catch {}
        }, 300)

      } catch (e) {
        setErro('Não foi possível acessar a câmera. Verifique as permissões.')
      }
    }

    iniciar()

    return () => {
      clearInterval(intervalo)
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [onDetected])

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black">
        <p className="text-white font-medium">Aponte para o código de barras</p>
        <button onClick={onClose} className="text-white p-2">
          <X size={24} />
        </button>
      </div>

      {erro ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-white text-lg mb-4">{erro}</p>
            <button onClick={onClose} className="bg-white text-black px-6 py-3 rounded-lg font-medium">
              Fechar
            </button>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="flex-1 object-cover w-full"
          playsInline
          muted
          autoPlay
        />
      )}

      <div className="p-4 bg-black text-center">
        <p className="text-gray-400 text-sm">
          Funciona no Chrome Android · Desktop use leitor USB
        </p>
      </div>
    </div>
  )
}
