// src/components/botao-ia.tsx
'use client'

import { Sparkles, Crown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { usePlano } from '@/hooks/usePlano'

interface BotaoIAProps {
  onClick: () => void
  carregando?: boolean
  label?: string
  className?: string
}

export default function BotaoIA({
  onClick,
  carregando = false,
  label = '✨ Completar com IA',
  className = '',
}: BotaoIAProps) {
  const { temIA, loading } = usePlano()

  // Loading do plano
  if (loading) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-400 rounded-lg ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando...
      </button>
    )
  }

  // 🔒 BLOQUEIO: sem plano Negócio
  if (!temIA) {
    return (
      <Link
        href="/assinar"
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition font-medium ${className}`}
        title="Disponível no plano Negócio"
      >
        <Crown className="w-4 h-4" />
        IA — Plano Negócio
      </Link>
    )
  }

  // ✅ Liberado
  return (
    <button
      onClick={onClick}
      disabled={carregando}
      className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {carregando ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          IA pensando...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          {label}
        </>
      )}
    </button>
  )
}