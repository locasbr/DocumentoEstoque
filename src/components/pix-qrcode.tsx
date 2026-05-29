'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { gerarPixPayload } from '@/lib/pix'

interface PixQRCodeProps {
  chavePix: string
  nomeRecebedor: string
  cidadeRecebedor: string
  valor?: number
}

export default function PixQRCode({
  chavePix,
  nomeRecebedor,
  cidadeRecebedor,
  valor,
}: PixQRCodeProps) {
  const [copiado, setCopiado] = useState(false)

  const payload = gerarPixPayload({
    chavePix,
    nomeRecebedor,
    cidadeRecebedor,
    valor,
    identificador: 'ESTOQUESYSTEM',
  })

  const handleCopiar = () => {
    navigator.clipboard.writeText(payload)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Code */}
      <div className="bg-white p-4 rounded-2xl">
        <QRCodeSVG
          value={payload}
          size={220}
          level="M"
          includeMargin={false}
        />
      </div>

      <p className="text-gray-400 text-xs text-center">
        Abra o app do seu banco → Pix → Pagar com QR Code
      </p>

      {/* Copia e Cola */}
      <button
        onClick={handleCopiar}
        className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
      >
        {copiado ? '✅ Código copiado!' : '📋 Copiar PIX Copia e Cola'}
      </button>
    </div>
  )
}