'use client'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  onDetected: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [erro, setErro] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [temCamera, setTemCamera] = useState(true)

  useEffect(() => {
    let stream: MediaStream | undefined
    let intervalo: NodeJS.Timeout

    async function iniciar() {
      // Verifica suporte a BarcodeDetector
      if (!('BarcodeDetector' in window)) {
        console.log('BarcodeDetector não suportado, usando input manual')
        setTemCamera(false)
        inputRef.current?.focus()
        return
      }

      try {
        // 1. Lista todas as câmeras disponíveis
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        
        // 2. Identifica a câmera traseira normal (evita grande angular)
        let cameraId: string | undefined
        
        // Função para testar se a câmera é provavelmente grande angular
        const isWideAngle = (label: string) => {
          const l = label.toLowerCase()
          return l.includes('wide') || l.includes('ultra') || 
                 l.includes('0.6') || l.includes('0.5') ||
                 l.includes('angle') || l.includes('grande angular')
        }

        // Filtra câmeras traseiras
        const backCameras = videoDevices.filter(device => {
          const label = device.label.toLowerCase()
          return label.includes('back') || label.includes('traseira') || 
                 label.includes('principal') || label.includes('main') ||
                 (label.includes('camera') && !label.includes('front'))
        })

        // Tentativa 1: pegar a primeira câmera traseira que NÃO é wide-angle
        const normalBack = backCameras.find(cam => !isWideAngle(cam.label))
        if (normalBack) {
          cameraId = normalBack.deviceId
        } 
        // Tentativa 2: se não achou, usar a primeira câmera traseira disponível (sem filtro)
        else if (backCameras.length > 0) {
          cameraId = backCameras[0].deviceId
        }

        // 3. Define as constraints de vídeo
        const constraints: MediaStreamConstraints = {
          video: cameraId 
            ? { deviceId: { exact: cameraId } }   // força o deviceId específico
            : {
                facingMode: { exact: 'environment' }, // fallback: traseira padrão
                width: { min: 1280, ideal: 1920 },    // força resolução alta (evita wide)
                height: { min: 720, ideal: 1080 }
              }
        }

        stream = await navigator.mediaDevices.getUserMedia(constraints)
        
        // Verifica se a resolução está muito baixa (possível wide-angle)
        const track = stream.getVideoTracks()[0]
        const settings = track.getSettings()
        if (settings.width && settings.width < 1280) {
          console.warn('Resolução baixa detectada, pode ser wide-angle.')
          // Se quiser, pode tentar trocar para outra câmera aqui (opcional)
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(err => {
              console.error('Erro ao dar play no vídeo:', err)
              setErro('Erro ao iniciar vídeo. Tente recarregar.')
            })
          }
        }

        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
        })

        intervalo = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState !== 4) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0) {
              clearInterval(intervalo)
              stream?.getTracks().forEach(t => t.stop())
              onDetected(codes[0].rawValue)
            }
          } catch (e) {
            // Silencia erros de detecção
          }
        }, 300)

      } catch (e: any) {
        console.error('Erro ao acessar câmera:', e)
        if (e.name === 'NotAllowedError') {
          setErro('Permissão de câmera negada. Digite o código abaixo.')
        } else if (e.name === 'NotFoundError') {
          setErro('Nenhuma câmera encontrada. Digite o código abaixo.')
        } else {
          setErro('Erro ao acessar câmera. Digite o código abaixo.')
        }
        setTemCamera(false)
        inputRef.current?.focus()
      }
    }

    iniciar()

    return () => {
      clearInterval(intervalo)
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [onDetected])

  const handleSubmitManual = () => {
    if (manualInput.trim()) {
      onDetected(manualInput.trim())
      setManualInput('')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black border-b border-gray-700">
        <p className="text-white font-medium text-sm">
          {temCamera ? 'Aponte para o código de barras' : 'Digite o código'}
        </p>
        <button onClick={onClose} className="text-white p-2 hover:bg-gray-800 rounded">
          <X size={24} />
        </button>
      </div>

      {temCamera && !erro ? (
        <>
          <video
            ref={videoRef}
            className="flex-1 w-full h-full object-cover bg-black"
            playsInline
            muted
            autoPlay
          />
          
          {/* Guia visual */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-dashed border-yellow-400 w-40 h-32 rounded-lg opacity-70"></div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          {erro && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg max-w-xs">
              <p className="text-red-300 text-sm">{erro}</p>
            </div>
          )}
          
          <div className="w-full max-w-xs">
            <p className="text-white mb-4 font-medium">Digite o código de barras:</p>
            <input
              ref={inputRef}
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitManual()
              }}
              placeholder="1234567890123"
              className="w-full px-4 py-3 text-center text-lg border-2 border-white rounded-lg bg-transparent text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
              autoFocus
            />
            <button
              onClick={handleSubmitManual}
              className="w-full mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      <div className="p-3 bg-black border-t border-gray-700 text-center">
        <p className="text-gray-400 text-xs">
          {temCamera ? '📱 Chrome Android ou Firefox · Ou toque aqui para digitar' : '⌨️ Digite manualmente'}
        </p>
      </div>
    </div>
  )
}