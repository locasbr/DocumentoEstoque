'use client'
import { useEffect, useRef, useState } from 'react'
import { X, RotateCw } from 'lucide-react'

interface Props {
  onDetected: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [erro, setErro] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [cameraAtual, setCameraAtual] = useState<string | null>(null)
  const [mostrarSeletor, setMostrarSeletor] = useState(false)

  // 1. Listar câmeras e escolher a melhor automaticamente
  useEffect(() => {
    const iniciar = async () => {
      try {
        // Pede permissão para acessar câmeras (necessário para obter labels)
        await navigator.mediaDevices.getUserMedia({ video: true })
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(d => d.kind === 'videoinput')
        setCameras(videoDevices)

        if (videoDevices.length === 0) {
          setErro('Nenhuma câmera encontrada')
          return
        }

        // Escolhe a melhor câmera traseira
        const melhorCamera = await escolherMelhorCamera(videoDevices)
        setCameraAtual(melhorCamera?.deviceId || videoDevices[0].deviceId)
      } catch {
        setErro('Permissão de câmera negada')
      }
    }
    iniciar()
  }, [])

  // Função que escolhe a câmera com maior resolução máxima (evita wide)
  async function escolherMelhorCamera(cameras: MediaDeviceInfo[]): Promise<MediaDeviceInfo | null> {
    const backCameras: MediaDeviceInfo[] = []
    const wideKeywords = ['wide', 'ultra', '0.6', '0.5', 'angle', 'grande angular']

    // Filtra câmeras que provavelmente são traseiras
    for (const cam of cameras) {
      const label = cam.label.toLowerCase()
      if (label.includes('back') || label.includes('traseira') || label.includes('environment') || !label.includes('front')) {
        backCameras.push(cam)
      }
    }

    if (backCameras.length === 0) return null

    // Tenta obter as capacidades de cada câmera (resolução máxima)
    const camerasComResolucao = await Promise.all(
      backCameras.map(async (cam) => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: cam.deviceId } }
          })
          const track = stream.getVideoTracks()[0]
          const capabilities = track.getCapabilities ? track.getCapabilities() : null
          const maxWidth = capabilities?.width?.max || 0
          const maxHeight = capabilities?.height?.max || 0
          const resolucao = maxWidth * maxHeight
          stream.getTracks().forEach(t => t.stop())
          return { cam, resolucao, label: cam.label.toLowerCase() }
        } catch {
          return { cam, resolucao: 0, label: cam.label.toLowerCase() }
        }
      })
    )

    // Ordena por resolução (maior primeiro)
    const ordenadas = camerasComResolucao.sort((a, b) => b.resolucao - a.resolucao)

    // Pega a primeira que não é wide-angle
    const normal = ordenadas.find(c => !wideKeywords.some(kw => c.label.includes(kw)))
    if (normal) return normal.cam

    // Fallback: a de maior resolução (geralmente a principal)
    return ordenadas[0]?.cam || null
  }

  // 2. Iniciar a stream da câmera escolhida
  useEffect(() => {
    if (!cameraAtual) return

    let stream: MediaStream | null = null
    let intervalo: NodeJS.Timeout

    const iniciarStream = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: cameraAtual } }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => videoRef.current?.play()
        }

        if (!('BarcodeDetector' in window)) {
          setErro('Navegador não suporta leitura automática')
          return
        }

        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']
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
          } catch {
            // silencia erros de detecção
          }
        }, 300)
      } catch {
        setErro('Erro ao iniciar a câmera. Tente outra.')
        setMostrarSeletor(true)
      }
    }

    iniciarStream()

    return () => {
      clearInterval(intervalo)
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [cameraAtual, onDetected])

  const handleSubmitManual = () => {
    if (manualInput.trim()) {
      onDetected(manualInput.trim())
      setManualInput('')
    }
  }

  const trocarCamera = (deviceId: string) => {
    setCameraAtual(deviceId)
    setMostrarSeletor(false)
    setErro('')
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black border-b border-gray-700">
        <p className="text-white font-medium text-sm">Leitor de código de barras</p>
        <button onClick={onClose} className="text-white p-2 hover:bg-gray-800 rounded">
          <X size={24} />
        </button>
      </div>

      {/* Vídeo */}
      <div className="relative flex-1">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-yellow-400 w-40 h-32 rounded-lg opacity-70" />
        </div>
      </div>

      {/* Seletor de câmera (aparece se falhar ou se usuário quiser) */}
      {(mostrarSeletor || cameras.length > 1) && (
        <div className="p-3 bg-gray-900 border-t border-gray-700">
          <button
            onClick={() => setMostrarSeletor(!mostrarSeletor)}
            className="text-gray-300 text-xs flex items-center gap-1 mb-2 hover:text-white"
          >
            <RotateCw size={12} /> {mostrarSeletor ? 'Ocultar' : 'Trocar câmera'}
          </button>
          {mostrarSeletor && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {cameras.map((cam, idx) => (
                <button
                  key={cam.deviceId}
                  onClick={() => trocarCamera(cam.deviceId)}
                  className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
                    cameraAtual === cam.deviceId
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {cam.label || `Câmera ${idx + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fallback manual */}
      {erro && (
        <div className="p-4 bg-black border-t border-gray-700">
          <p className="text-red-400 text-sm mb-2">{erro}</p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitManual()}
              placeholder="Digite o código de barras"
              className="flex-1 px-3 py-2 bg-gray-800 text-white rounded"
              autoFocus
            />
            <button
              onClick={handleSubmitManual}
              className="px-4 py-2 bg-green-600 rounded text-white"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Rodapé corrigido (sem aspas não escapadas) */}
      <div className="p-2 bg-black text-center text-gray-500 text-xs">
        📱 Aponte para o código | Se não focar, toque em Trocar câmera
      </div>
    </div>
  )
}