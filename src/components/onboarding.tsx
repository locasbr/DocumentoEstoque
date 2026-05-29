'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Package, ShoppingCart, BarChart3, X, ArrowRight } from 'lucide-react'
interface OnboardingProps {
  userId: string
  onComplete: () => void
}

const PASSOS = [
  {
    icon: Package,
    titulo: 'Cadastre seu primeiro produto',
    desc: 'Adicione os produtos do seu comércio com nome, preço e quantidade.',
    cta: 'Cadastrar produto',
    href: '/dashboard/produtos/novo',
    cor: 'bg-blue-500',
  },
  {
    icon: ShoppingCart,
    titulo: 'Faça uma venda teste no PDV',
    desc: 'Experimente o ponto de venda — selecione um produto e finalize a venda.',
    cta: 'Abrir PDV',
    href: '/dashboard/pdv',
    cor: 'bg-green-500',
  },
  {
    icon: BarChart3,
    titulo: 'Veja seus relatórios',
    desc: 'Acompanhe vendas, lucro e movimentação em tempo real.',
    cta: 'Ver relatórios',
    href: '/dashboard/relatorios',
    cor: 'bg-purple-500',
  },
]

export default function Onboarding({ userId, onComplete }: OnboardingProps) {
  const [passoAtual, setPassoAtual] = useState(0)
  const [fechando, setFechando] = useState(false)

  const handlePular = async () => {
    setFechando(true)
    await supabase
      .from('perfis')
      .update({ onboarding_completo: true })
      .eq('id', userId)
    onComplete()
  }

  const handleProximo = () => {
    if (passoAtual < PASSOS.length - 1) {
      setPassoAtual(passoAtual + 1)
    } else {
      handlePular()
    }
  }

  if (fechando) return null

  const passo = PASSOS[passoAtual]
  const Icon = passo.icon

  return (
    <div className="bg-white dark:bg-gray-900 border-2 border-green-500/30 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <h3 className="font-bold text-gray-900 dark:text-white">
            Primeiros passos
          </h3>
        </div>
        <button
          onClick={handlePular}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          title="Pular tutorial"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Indicador de progresso */}
      <div className="flex gap-2">
        {PASSOS.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              idx <= passoAtual
                ? 'bg-green-500'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Conteúdo do passo */}
      <div className="flex items-start gap-4">
        <div className={`${passo.cor} p-3 rounded-xl shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
            Passo {passoAtual + 1} de {PASSOS.length}
          </p>
          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
            {passo.titulo}
          </h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {passo.desc}
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3">
        <Link
          href={passo.href}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition"
        >
          {passo.cta}
          <ArrowRight className="w-4 h-4" />
        </Link>
        <button
          onClick={handleProximo}
          className="px-4 py-3 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition"
        >
          {passoAtual < PASSOS.length - 1 ? 'Próximo →' : 'Concluir ✓'}
        </button>
      </div>
    </div>
  )
}