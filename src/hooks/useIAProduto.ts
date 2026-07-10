// src/hooks/useIAProduto.ts
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/contexts/NotificationContext'

export interface DadosIAProduto {
  nome: string
  descricao: string
  categoria: string
  marca?: string
  preco_sugerido_min?: number
  preco_sugerido_max?: number
  confianca: 'alta' | 'media' | 'baixa'
  observacao?: string
}

export function useIAProduto() {
  const [carregando, setCarregando] = useState(false)
  const { addNotification } = useNotification()

  const completarComIA = async (params: {
    sku?: string
    nomeOriginal?: string
    marca?: string
    descricaoOriginal?: string
  }): Promise<DadosIAProduto | null> => {
    // ✨ Validação no frontend (UX rápida)
    if (!params.nomeOriginal || params.nomeOriginal.trim().length < 3) {
      addNotification(
        '✏️ Digite o nome do produto primeiro pra IA te ajudar',
        'warning',
        4000
      )
      return null
    }

    setCarregando(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        addNotification('Usuário não autenticado', 'error')
        return null
      }

      const response = await fetch('/api/ia/produto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...params,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.upgrade) {
          addNotification(
            '🔒 IA disponível apenas no plano Negócio',
            'warning',
            5000
          )
        } else if (data.motivo === 'nome_obrigatorio') {
          addNotification(
            '✏️ Digite o nome do produto primeiro pra IA te ajudar',
            'warning',
            4000
          )
        } else {
          addNotification(data.erro || 'Erro ao chamar IA', 'error')
        }
        return null
      }

      // ✨ Feedback baseado na confiança
      const dados = data.dados as DadosIAProduto
      if (dados.confianca === 'alta') {
        addNotification('✨ IA completou com alta precisão!', 'success', 3000)
      } else if (dados.confianca === 'media') {
        addNotification(
          '✨ IA completou — confira os dados',
          'info',
          4000
        )
      } else {
        addNotification(
          '⚠️ IA com pouca info — revise antes de salvar',
          'warning',
          5000
        )
      }

      return dados
    } catch (error: any) {
      console.error('Erro IA:', error)
      addNotification('Erro ao processar com IA', 'error')
      return null
    } finally {
      setCarregando(false)
    }
  }

  return { completarComIA, carregando }
} 