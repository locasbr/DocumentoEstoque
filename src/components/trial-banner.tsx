'use client'
import Link from 'next/link'

interface TrialBannerProps {
  diasRestantes: number
  tipo?: 'trial' | 'renovacao'
}

export default function TrialBanner({ diasRestantes, tipo = 'trial' }: TrialBannerProps) {
  const texto =
    tipo === 'renovacao'
      ? diasRestantes === 0
        ? '💳 Seu plano vence HOJE! Renove para não perder acesso.'
        : diasRestantes === 1
          ? '💳 Seu plano vence amanhã!'
          : `💳 Seu plano vence em ${diasRestantes} dias`
      : diasRestantes === 0
        ? '⏰ Seu teste expira HOJE!'
        : diasRestantes === 1
          ? '⏰ Seu teste termina amanhã!'
          : `⏰ Seu teste termina em ${diasRestantes} dias`

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 text-center text-sm font-medium">
      {texto} —{' '}
      <Link href="/assinar" className="underline font-bold hover:text-white/90">
        {tipo === 'renovacao' ? 'Renovar agora 🚀' : 'Assinar agora 🚀'}
      </Link>
    </div>
  )
}