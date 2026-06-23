// src/components/sugestao-preco-ia.tsx
'use client'

import { TrendingDown, Target, TrendingUp, AlertTriangle, X } from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'
import type { SugestaoPreco } from '@/hooks/useIAPreco'

interface Props {
  sugestao: SugestaoPreco
  onSelecionar: (preco: number) => void
  onFechar: () => void
}

export default function SugestaoPrecoIA({
  sugestao,
  onSelecionar,
  onFechar,
}: Props) {
  const opcoes = [
    {
      tipo: 'conservador' as const,
      label: 'Conservador',
      icone: TrendingDown,
      preco: sugestao.preco_conservador,
      margem: sugestao.margem_conservadora_pct,
      desc: 'Mais competitivo, foco em volume',
      cor: 'blue',
    },
    {
      tipo: 'equilibrado' as const,
      label: 'Equilibrado',
      icone: Target,
      preco: sugestao.preco_equilibrado,
      margem: sugestao.margem_equilibrada_pct,
      desc: 'Lucro e competitividade balanceados',
      cor: 'purple',
    },
    {
      tipo: 'agressivo' as const,
      label: 'Agressivo',
      icone: TrendingUp,
      preco: sugestao.preco_agressivo,
      margem: sugestao.margem_agressiva_pct,
      desc: 'Maior lucro por unidade',
      cor: 'pink',
    },
  ]

  return (
    <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border border-purple-200 dark:border-purple-800 relative">
      <button
        onClick={onFechar}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
        title="Fechar sugestões"
      >
        <X size={16} />
      </button>

      <div className="mb-3 pr-6">
        <p className="text-sm font-bold text-purple-900 dark:text-purple-200 mb-1">
          ✨ Sugestões da IA
        </p>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          {sugestao.explicacao}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        {opcoes.map(({ tipo, label, icone: Icone, preco, margem, desc, cor }) => {
          const recomendado = sugestao.recomendacao === tipo
          return (
            <button
              key={tipo}
              onClick={() => onSelecionar(preco)}
              className={`relative text-left p-3 rounded-lg border-2 transition hover:scale-105 active:scale-95 ${
                recomendado
                  ? `border-${cor}-500 bg-${cor}-100 dark:bg-${cor}-900/30 shadow-md`
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300'
              }`}
            >
              {recomendado && (
                <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow">
                  RECOMENDADO
                </span>
              )}
              <div className="flex items-center gap-1.5 mb-1">
                <Icone size={14} className="text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {label}
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatarMoeda(preco)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Margem: {margem}%
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                {desc}
              </p>
            </button>
          )
        })}
      </div>

      {sugestao.alerta && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle
            size={14}
            className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
          />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            {sugestao.alerta}
          </p>
        </div>
      )}

      <p className="text-[10px] text-center text-gray-500 dark:text-gray-400 mt-3">
        💡 Clique numa opção pra preencher automaticamente
      </p>
    </div>
  )
}