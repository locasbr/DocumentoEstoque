'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Package,
  ShoppingCart,
  BarChart3,
  X,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react'

interface OnboardingProps {
  userId: string
  onComplete: () => void
}

interface Passo {
  id: 'produto' | 'pdv' | 'relatorio'
  icon: typeof Package
  titulo: string
  desc: string
  cta: string
  href: string
  cor: string
}

const PASSOS: Passo[] = [
  {
    id: 'produto',
    icon: Package,
    titulo: 'Adicione seus primeiros produtos',
    desc: 'Cadastre manualmente OU importe vários de uma vez via planilha CSV.',
    cta: 'Cadastrar produto',
    href: '/dashboard/produtos/novo',
    cor: 'bg-blue-500',
  },
  {
    id: 'pdv',
    icon: ShoppingCart,
    titulo: 'Faça uma venda teste no PDV',
    desc: 'Experimente o ponto de venda — selecione um produto e finalize a venda.',
    cta: 'Abrir PDV',
    href: '/dashboard/pdv',
    cor: 'bg-green-500',
  },
  {
    id: 'relatorio',
    icon: BarChart3,
    titulo: 'Veja seus relatórios',
    desc: 'Acompanhe vendas, lucro e movimentação em tempo real.',
    cta: 'Ver relatórios',
    href: '/dashboard/relatorios',
    cor: 'bg-purple-500',
  },
]

const STORAGE_KEY = 'onboarding_passos_completos'

export default function Onboarding({ userId, onComplete }: OnboardingProps) {
  const [passoAtual, setPassoAtual] = useState(0)
  const [fechando, setFechando] = useState(false)
  const [passosCompletos, setPassosCompletos] = useState<Set<string>>(new Set())

  // 🆕 Carrega progresso do localStorage
  useEffect(() => {
    try {
      const salvos = localStorage.getItem(STORAGE_KEY)
      if (salvos) {
        const ids = JSON.parse(salvos) as string[]
        setPassosCompletos(new Set(ids))
        // Avança automaticamente pro primeiro passo não-completo
        const proximoIndex = PASSOS.findIndex((p) => !ids.includes(p.id))
        if (proximoIndex !== -1) {
          setPassoAtual(proximoIndex)
        } else {
          // Todos completos? Marca como finalizado
          handleFinalizar()
        }
      }
    } catch (err) {
      console.error('Erro ao carregar progresso:', err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 🆕 Marca passo atual como concluído quando user clica no CTA
  const handleConcluirPasso = () => {
    const novoSet = new Set(passosCompletos)
    novoSet.add(PASSOS[passoAtual].id)
    setPassosCompletos(novoSet)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(novoSet)))
    } catch (err) {
      console.error('Erro ao salvar progresso:', err)
    }
  }

  // 🆕 Finaliza o onboarding (todos os passos OU "pular" clicado)
  const handleFinalizar = async () => {
    setFechando(true)
    try {
      await supabase
        .from('perfis')
        .update({ onboarding_completo: true })
        .eq('id', userId)
      // Limpa o localStorage (não precisa mais)
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      console.error('Erro ao marcar onboarding como completo:', err)
    }
    onComplete()
  }

  const handleProximo = () => {
    if (passoAtual < PASSOS.length - 1) {
      setPassoAtual(passoAtual + 1)
    } else {
      handleFinalizar()
    }
  }

  if (fechando) return null

  const passo = PASSOS[passoAtual]
  const Icon = passo.icon
  const totalCompletos = passosCompletos.size

  return (
    <div className="bg-white dark:bg-gray-900 border-2 border-green-500/30 rounded-2xl p-6 space-y-5 shadow-lg relative">
      {/* 🆕 Botão X destacado pra fechar */}
      <button
        onClick={handleFinalizar}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        title="Pular tutorial (você não verá mais)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="flex items-center justify-between pr-8">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xl">🚀</span>
          <h3 className="font-bold text-gray-900 dark:text-white">
            Primeiros passos
          </h3>
          {totalCompletos > 0 && (
            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-semibold">
              {totalCompletos} de {PASSOS.length} ✓
            </span>
          )}
        </div>
      </div>

      {/* 🆕 Indicador de progresso com checkmarks */}
      <div className="flex gap-2">
        {PASSOS.map((p, idx) => {
          const completo = passosCompletos.has(p.id)
          const atual = idx === passoAtual
          return (
            <div
              key={p.id}
              className={`h-2 flex-1 rounded-full transition-all flex items-center justify-center relative ${
                completo
                  ? 'bg-green-500'
                  : atual
                    ? 'bg-blue-500'
                    : 'bg-gray-200 dark:bg-gray-700'
              }`}
              title={p.titulo}
            >
              {completo && (
                <CheckCircle2 className="w-3 h-3 text-white absolute -top-0.5" />
              )}
            </div>
          )
        })}
      </div>

      {/* Conteúdo do passo */}
      <div className="flex items-start gap-4">
        <div className={`${passo.cor} p-3 rounded-xl shrink-0 relative`}>
          <Icon className="w-6 h-6 text-white" />
          {passosCompletos.has(passo.id) && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div className="space-y-1 flex-1">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
            Passo {passoAtual + 1} de {PASSOS.length}
            {passosCompletos.has(passo.id) && (
              <span className="ml-2 text-green-600 dark:text-green-400">
                ✓ Concluído
              </span>
            )}
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
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {/* CTA principal */}
          <Link
            href={passo.href}
            onClick={handleConcluirPasso}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition shadow-md hover:shadow-lg"
          >
            {passo.cta}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={handleProximo}
            className="px-4 py-3 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl"
          >
            {passoAtual < PASSOS.length - 1 ? 'Pular →' : 'Concluir ✓'}
          </button>
        </div>

        {/* 🆕 ALTERNATIVA: Importar CSV (só aparece no passo 1) */}
        {passo.id === 'produto' && (
          <Link
            href="/dashboard/produtos/importar"
            onClick={handleConcluirPasso}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 font-semibold rounded-xl transition text-sm group"
          >
            <FileSpreadsheet className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>OU importar vários produtos via CSV</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold">
              RÁPIDO
            </span>
          </Link>
        )}
      </div>

      {/* 🆕 Dica embaixo */}
      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        💡 Você pode fechar e voltar quando quiser
      </p>
    </div>
  )
}