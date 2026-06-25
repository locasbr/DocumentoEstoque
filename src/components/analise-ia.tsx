'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Sparkles, Loader2, TrendingUp, Lock } from 'lucide-react'
import { useNotification } from '@/contexts/NotificationContext'
import Link from 'next/link'

export default function AnaliseIA() {
  const [loading, setLoading] = useState(false)
  const [analise, setAnalise] = useState('')
  const [bloqueado, setBloqueado] = useState(false)
  const { addNotification } = useNotification()

  const gerarAnalise = async () => {
    setLoading(true)
    setAnalise('')
    setBloqueado(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        addNotification('Faça login novamente', 'error')
        return
      }

      const res = await fetch('/api/ia/analise-vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await res.json()

      if (res.status === 403) {
        setBloqueado(true)
        return
      }

      if (!res.ok) {
        addNotification(data.message || 'Erro ao gerar análise', 'error')
        return
      }

      setAnalise(data.analise)
      addNotification('✨ Análise gerada!', 'success', 2000)
    } catch (err) {
      console.error(err)
      addNotification('Erro ao conectar com a IA', 'error')
    } finally {
      setLoading(false)
    }
  }

  const renderAnalise = (texto: string) => {
    const linhas = texto.split('\n').filter(Boolean)
    return linhas.map((linha, i) => {
      const formatada = linha.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return (
        <p
          key={i}
          className="text-gray-700 dark:text-gray-300 mb-2 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatada }}
        />
      )
    })
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-5 md:p-6 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">
            Análise Inteligente com IA
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Powered by Gemini Flash 2.0 • Últimos 30 dias
          </p>
        </div>
      </div>

      {bloqueado ? (
        <div className="text-center py-6">
          <Lock className="w-10 h-10 text-purple-400 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
            Recurso exclusivo dos planos Profissional e Negócio
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Faça upgrade pra ter um consultor de IA analisando suas vendas todo mês.
          </p>
          <Link
            href="/dashboard/perfil"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition"
          >
            <TrendingUp className="w-4 h-4" />
            Ver planos
          </Link>
        </div>
      ) : analise ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
          {renderAnalise(analise)}
          <button
            onClick={gerarAnalise}
            disabled={loading}
            className="mt-4 text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
          >
            🔄 Gerar nova análise
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Deixe a IA analisar seus 30 dias de vendas e te dar sugestões práticas pra crescer.
          </p>
          <button
            onClick={gerarAnalise}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analisando suas vendas...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar análise do mês
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}