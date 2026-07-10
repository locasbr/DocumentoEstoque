// src/components/botao-ia.tsx
'use client'

import { Sparkles, Crown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { usePlano } from '@/hooks/usePlano'

type FeatureIA = 'cadastro' | 'preco' | 'analise'

interface BotaoIAProps {
  onClick: () => void
  carregando?: boolean
  label?: string
  className?: string
  feature?: FeatureIA
}

export default function BotaoIA({
  onClick,
  carregando = false,
  label = '✨ Completar com IA',
  className = '',
  feature = 'cadastro',
}: BotaoIAProps) {
  const {
    temIACadastroAutomatico,
    temIASugestaoPreco,
    temIAAnaliseMensal,
    loading,
  } = usePlano()

  const podeUsarIA =
    feature === 'cadastro'
      ? temIACadastroAutomatico
      : feature === 'preco'
        ? temIASugestaoPreco
        : temIAAnaliseMensal

  const textoUpsell =
    feature === 'cadastro'
      ? '👑 Cadastro automático — Plano Negócio'
      : feature === 'preco'
        ? '👑 Sugestão de preço — Plano Negócio'
        : '👑 Análise com IA — Plano Profissional'

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
  if (!podeUsarIA) {
    return (
      <Link
        href="/assinar"
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition font-medium ${className}`}
        title={textoUpsell}
      >
        <Crown className="w-4 h-4" />
        {textoUpsell}
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