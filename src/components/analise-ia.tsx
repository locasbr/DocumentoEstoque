'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Sparkles, TrendingUp, Lock } from 'lucide-react'
import { useNotification } from '@/contexts/NotificationContext'
import Link from 'next/link'
import BotaoIA from '@/components/botao-ia'

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
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        addNotification('Faça login novamente', 'error')
        return
      }

      const res = await fetch('/api/ia/analise-vendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
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
    let formatada = linha.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // 🆕 Detecta bullets (linha começa com * ou -)
    const isBullet = /^[\*\-]\s/.test(linha.trim())
    // 🆕 Detecta títulos (linha só com **texto**)
    const isTitulo = /^\*\*(.+)\*\*:?$/.test(linha.trim())
    // 🆕 Detecta numeração (1., 2., 3.)
    const isNumerado = /^\d+\.\s/.test(linha.trim())
    
    if (isBullet) {
      formatada = formatada.replace(/^[\*\-]\s*/, '')
      return (
        <div key={i} className="flex gap-2 mb-2 text-gray-700 dark:text-gray-300 leading-relaxed">
          <span className="text-purple-500 font-bold flex-shrink-0">●</span>
          <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatada }} />
        </div>
      )
    }
    
    if (isTitulo) {
      return (
        <h4 key={i} className="text-gray-900 dark:text-white font-bold text-base mt-4 mb-2"
          dangerouslySetInnerHTML={{ __html: formatada }} />
      )
    }
    
    if (isNumerado) {
      return (
        <p key={i} className="text-gray-700 dark:text-gray-300 mb-2 leading-relaxed ml-4"
          dangerouslySetInnerHTML={{ __html: formatada }} />
      )
    }
    
    return (
      <p key={i} className="text-gray-700 dark:text-gray-300 mb-2 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatada }} />
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
            Powered by Google Gemini • Últimos 30 dias
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
          <BotaoIA
            onClick={gerarAnalise}
            carregando={loading}
            label="🔄 Gerar nova análise"
            feature="analise"
            className="mt-4 w-full justify-center text-sm"
          />
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Deixe a IA analisar seus 30 dias de vendas e te dar sugestões práticas pra crescer.
          </p>
          <BotaoIA
            onClick={gerarAnalise}
            carregando={loading}
            label="Gerar análise do mês"
            feature="analise"
            className="w-full justify-center"
          />
        </div>
      )}
    </div>
  )
}