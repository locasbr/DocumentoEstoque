'use client'

import Link from 'next/link'

interface TrialBannerProps {
  diasRestantes: number
}

export default function TrialBanner({ diasRestantes }: TrialBannerProps) {
  const texto =
    diasRestantes === 0
      ? '⏰ Seu teste expira HOJE!'
      : diasRestantes === 1
        ? '⏰ Seu teste termina amanhã!'
        : `⏰ Seu teste termina em ${diasRestantes} dias`

  return (
    <div className="w-full bg-yellow-400 text-yellow-900 px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-3 flex-wrap fixed top-0 left-0 z-[60]">
      <span>{texto}</span>
      <span className="hidden sm:inline">—</span>
      <Link
        href="/assinar"
        className="inline-flex items-center gap-1.5 bg-yellow-900 text-yellow-50 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-yellow-800 transition-colors"
      >
        Assinar agora 🚀
      </Link>
    </div>
  )
}