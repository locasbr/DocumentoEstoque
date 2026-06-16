"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, RotateCw, Keyboard } from 'lucide-react'

interface Props {
  onDetected: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const quaggaRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const [erro, setErro] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [cameraAtual, setCameraAtual] = useState<string | null>(null)
  const [mostrarSeletor, setMostrarSeletor] = useState(false)
  const [modoManual, setModoManual] = useState(false)
  const [usandoQuagga, setUsandoQuagga] = useState(false)
  const [scannerAtivo, setScannerAtivo] = useState(false)

  // ══════════════════════════════════════════════════
  //  CLEANUP GERAL — para streams, intervalos e Quagga
  // ══════════════════════════════════════════════════
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    if (quaggaRef.current) {
      try {
        quaggaRef.current.stop()
        quaggaRef.current.offDetected()
      } catch {}
      quaggaRef.current = null
    }

    setScannerAtivo(false)
  }, [])

  // ══════════════════════════════════════════════════
  //  CALLBACK AO DETECTAR CÓDIGO
  // ══════════════════════════════════════════════════
  const handleDetected = useCallback(
    (code: string) => {
      cleanup()

      // Vibração de feedback (mobile)
      if (navigator.vibrate) {
        navigator.vibrate(200)
      }

      onDetected(code)
    },
    [cleanup, onDetected]
  )

  // ══════════════════════════════════════════════════
  //  SELEÇÃO INTELIGENTE DE CÂMERA TRASEIRA
  //  → Evita wide-angle, prefere maior resolução
  // ══════════════════════════════════════════════════
  async function escolherMelhorCamera(
    videoDevices: MediaDeviceInfo[]
  ): Promise<MediaDeviceInfo | null> {
    const wideKeywords = [
      'wide',
      'ultra',
      '0.6',
      '0.5',
      'angle',
      'grande angular',
    ]

    const backCameras: MediaDeviceInfo[] = []
    for (const cam of videoDevices) {
      const label = cam.label.toLowerCase()
      if (
        label.includes('back') ||
        label.includes('traseira') ||
        label.includes('environment') ||
        !label.includes('front')
      ) {
        backCameras.push(cam)
      }
    }

    if (backCameras.length === 0) return null

    const camerasComResolucao = await Promise.all(
      backCameras.map(async (cam) => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: cam.deviceId } },
          })
          const track = stream.getVideoTracks()[0]
          const capabilities = track.getCapabilities
            ? track.getCapabilities()
            : null
          const maxWidth = (capabilities as any)?.width?.max || 0
          const maxHeight = (capabilities as any)?.height?.max || 0
          const resolucao = maxWidth * maxHeight
          stream.getTracks().forEach(t => t.stop())
          return { cam, resolucao, label: cam.label.toLowerCase() }
        } catch {
          return { cam, resolucao: 0, label: cam.label.toLowerCase() }
        }
      })
    )

    const ordenadas = camerasComResolucao.sort(
      (a, b) => b.resolucao - a.resolucao
    )

    // Prefere câmera que NÃO seja wide-angle
    const normal = ordenadas.find(
      c => !wideKeywords.some(kw => c.label.includes(kw))
    )

    return normal?.cam || ordenadas[0]?.cam || null
  }

  // ══════════════════════════════════════════════════
  //  LISTAR CÂMERAS AO MONTAR
  // ══════════════════════════════════════════════════
  useEffect(() => {
    const iniciar = async () => {
      try {
        // Pede permissão primeiro
        const permStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        })
        permStream.getTracks().forEach(t => t.stop())

        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(d => d.kind === 'videoinput')
        setCameras(videoDevices)

        if (videoDevices.length === 0) {
          setErro(
            'Nenhuma câmera encontrada. Use o campo abaixo para digitar o código.'
          )
          setModoManual(true)
          return
        }

        const melhorCamera = await escolherMelhorCamera(videoDevices)
        setCameraAtual(melhorCamera?.deviceId || videoDevices[0].deviceId)
      } catch {
        setErro(
          'Permissão de câmera negada. Use o campo abaixo para digitar o código.'
        )
        setModoManual(true)
      }
    }

    iniciar()
    return () => cleanup()
  }, [cleanup])

  // ══════════════════════════════════════════════════
  //  INICIAR SCANNER QUANDO CÂMERA É SELECIONADA
  //
  //  Estratégia:
  //  1. Se BarcodeDetector existe → usa (Chrome Android, rápido)
  //  2. Se não existe → importa Quagga2 dinamicamente (iPhone, Firefox)
  //  3. Se Quagga falha → modo manual
  // ══════════════════════════════════════════════════
  useEffect(() => {
    if (!cameraAtual || modoManual) return

    let cancelled = false

    const iniciarScanner = async () => {
      cleanup()

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: cameraAtual },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => videoRef.current?.play()
        }

        // ── MÉTODO 1: BarcodeDetector nativo ──
        if ('BarcodeDetector' in window) {
          setUsandoQuagga(false)
          setScannerAtivo(true)

          const detector = new (window as any).BarcodeDetector({
            formats: [
              'ean_13',
              'ean_8',
              'code_128',
              'code_39',
              'upc_a',
              'upc_e',
            ],
          })

          intervalRef.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState !== 4) return
            try {
              const codes = await detector.detect(videoRef.current)
              if (codes.length > 0 && codes[0].rawValue) {
                handleDetected(codes[0].rawValue)
              }
            } catch {
              // Silencia erros de detecção entre frames
            }
          }, 250)

          return
        }

        // ── MÉTODO 2: Fallback com Quagga2 ──
        try {
          const Quagga = (await import('@ericblade/quagga2')).default

          // Quagga gerencia o próprio stream, então para o nosso
          stream.getTracks().forEach(t => t.stop())
          streamRef.current = null

          if (cancelled) return

          quaggaRef.current = Quagga
          setUsandoQuagga(true)

          await new Promise<void>((resolve, reject) => {
            Quagga.init(
              {
                inputStream: {
                  type: 'LiveStream',
                  target: videoRef.current || undefined,
                  constraints: {
                    deviceId: cameraAtual,
                    facingMode: 'environment',
                    width: { min: 640, ideal: 1280 },
                    height: { min: 480, ideal: 720 },
                  },
                },
                decoder: {
                  readers: [
                    'ean_reader',
                    'ean_8_reader',
                    'code_128_reader',
                    'code_39_reader',
                    'upc_reader',
                    'upc_e_reader',
                  ],
                },
                locate: true,
                frequency: 5,
              },
              (err: any) => {
                if (err) {
                  reject(err)
                  return
                }
                resolve()
              }
            )
          })

          if (cancelled) {
            Quagga.stop()
            quaggaRef.current = null
            return
          }

          Quagga.start()
          setScannerAtivo(true)

          // Validação: confirma o código 2x para evitar falsos positivos
          let lastCode = ''
          let confirmCount = 0

          Quagga.onDetected((result: any) => {
            const code = result?.codeResult?.code
            if (!code) return

            if (code === lastCode) {
              confirmCount++
              if (confirmCount >= 2) {
                try {
                  Quagga.offDetected()
                  Quagga.stop()
                } catch {}
                quaggaRef.current = null
                handleDetected(code)
              }
            } else {
              lastCode = code
              confirmCount = 1
            }
          })
        } catch (quaggaError) {
          console.error('Quagga2 não disponível:', quaggaError)
          setErro(
            'Seu navegador não suporta leitura automática. Use o campo abaixo para digitar o código de barras.'
          )
          // Não entra em modo manual automaticamente — deixa o usuário decidir
        }
      } catch {
        if (!cancelled) {
          setErro(
            'Erro ao iniciar câmera. Tente trocar a câmera ou use o campo manual.'
          )
          setMostrarSeletor(true)
        }
      }
    }

    iniciarScanner()

    return () => {
      cancelled = true
      cleanup()
    }
  }, [cameraAtual, modoManual, cleanup, handleDetected])

  // ══════════════════════════════════════════════════
  //  TROCAR CÂMERA
  // ══════════════════════════════════════════════════
  const trocarCamera = (deviceId: string) => {
    setCameraAtual(deviceId)
    setMostrarSeletor(false)
    setErro('')
  }

  // ══════════════════════════════════════════════════
  //  INPUT MANUAL
  // ══════════════════════════════════════════════════
  const handleSubmitManual = () => {
    const code = manualInput.trim()
    if (code.length >= 4) {
      handleDetected(code)
      setManualInput('')
    }
  }

  // ══════════════════════════════════════════════════
  //  FECHAR SCANNER
  // ══════════════════════════════════════════════════
  const handleClose = () => {
    cleanup()
    onClose()
  }

  // ══════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm z-10">
        <h3 className="text-white font-semibold text-lg">
          📷 Leitor de Código de Barras
        </h3>
        <button
          onClick={handleClose}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* ── Seletor de câmera ── */}
      {cameras.length > 1 && (
        <div className="px-4 py-2 bg-black/60 z-10">
          <button
            onClick={() => setMostrarSeletor(!mostrarSeletor)}
            className="text-gray-300 text-xs flex items-center gap-1 hover:text-white transition"
          >
            <RotateCw className="w-3 h-3" />
            {mostrarSeletor ? 'Ocultar câmeras' : 'Trocar câmera'}
          </button>

          {mostrarSeletor && (
            <div className="flex flex-wrap gap-2 mt-2">
              {cameras.map((cam, idx) => (
                <button
                  key={cam.deviceId}
                  onClick={() => trocarCamera(cam.deviceId)}
                  className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition ${
                    cameraAtual === cam.deviceId
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cam.label || `Câmera ${idx + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Área do vídeo ── */}
      {!modoManual && (
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />

          {/* Crosshair / Guia visual */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-40 border-2 border-green-400/60 rounded-2xl relative">
              {/* Cantos destacados */}
              <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-xl" />
              <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-xl" />
              <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-xl" />

              {/* Linha de scan animada */}
              {scannerAtivo && (
                <div
                  className="absolute left-2 right-2 h-0.5 bg-green-400 rounded-full"
                  style={{
                    animation: 'scanLine 2s ease-in-out infinite',
                  }}
                />
              )}
            </div>
          </div>

          {/* Status do scanner */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-white text-sm bg-black/60 inline-block px-4 py-2 rounded-full">
              {scannerAtivo
                ? '📱 Aponte para o código de barras'
                : '⏳ Iniciando câmera...'}
            </p>
            {usandoQuagga && scannerAtivo && (
              <p className="text-gray-400 text-xs mt-1">
                Modo compatibilidade ativo (funciona em todos os navegadores)
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Modo manual em tela cheia ── */}
      {modoManual && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="text-6xl mb-4">⌨️</div>
            <h3 className="text-white text-xl font-bold mb-2">
              Modo Manual
            </h3>
            <p className="text-gray-400 mb-6">
              Digite ou escaneie o código de barras usando o campo abaixo.
            </p>
          </div>
        </div>
      )}

      {/* ── Erro ── */}
      {erro && (
        <div className="px-4 py-3 bg-red-900/50 border-t border-red-800">
          <p className="text-red-300 text-sm">{erro}</p>
        </div>
      )}

      {/* ── Input manual (SEMPRE visível na parte inferior) ── */}
      <div className="p-4 bg-gray-900 border-t border-gray-800 safe-area-bottom">
        <div className="flex items-center gap-2 mb-2">
          <Keyboard className="w-4 h-4 text-gray-400" />
          <p className="text-gray-400 text-xs">
            {modoManual
              ? 'Digite o código de barras:'
              : 'Ou digite o código manualmente:'}
          </p>
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitManual()}
            placeholder="Ex: 7891234567890"
            className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition text-lg"
            autoFocus={modoManual}
          />
          <button
            onClick={handleSubmitManual}
            disabled={manualInput.trim().length < 4}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition"
          >
            OK
          </button>
        </div>

        {/* Aviso sobre base de produtos */}
        <p className="text-center text-gray-500 text-[11px] leading-tight px-4">
          {'Nossa base p\u00FAblica cobre milhares de produtos, mas alguns c\u00F3digos podem n\u00E3o ser encontrados. Nesse caso, voc\u00EA pode cadastrar manualmente em segundos.'}
        </p>

        {/* Alternar câmera ↔ manual */}
        <div className="mt-3 text-center">
          {!modoManual && (
            <button
              onClick={() => {
                setModoManual(true)
                cleanup()
              }}
              className="text-gray-400 text-sm hover:text-white transition"
            >
              ⌨️ Prefiro digitar o código
            </button>
          )}
          {modoManual && cameras.length > 0 && (
            <button
              onClick={() => {
                setModoManual(false)
                setErro('')
              }}
              className="text-gray-400 text-sm hover:text-white transition"
            >
              📷 Voltar para câmera
            </button>
          )}
        </div>
      </div>

      {/* ── CSS animação da linha de scan ── */}
      <style jsx>{`
        @keyframes scanLine {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(140px);
          }
        }
        .safe-area-bottom {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  )
}