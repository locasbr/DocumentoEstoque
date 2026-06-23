// src/hooks/useIAPreco.ts
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/contexts/NotificationContext'

export interface SugestaoPreco {
  preco_conservador: number
  preco_equilibrado: number
  preco_agressivo: number
  margem_conservadora_pct: number
  margem_equilibrada_pct: number
  margem_agressiva_pct: number
  explicacao: string
  recomendacao: 'conservador' | 'equilibrado' | 'agressivo'
  alerta?: string
}

export function useIAPreco() {
  const [carregando, setCarregando] = useState(false)
  const { addNotification } = useNotification()

  const sugerirPreco = async (params: {
    nome: string
    categoria?: string
    marca?: string
    descricao?: string
    precoCusto: number
  }): Promise<SugestaoPreco | null> => {
    // ✨ Validações no front
    if (!params.nome || params.nome.trim().length < 3) {
      addNotification('✏️ Digite o nome do produto primeiro', 'warning', 4000)
      return null
    }

    if (!params.precoCusto || params.precoCusto <= 0) {
      addNotification(
        '💰 Digite o preço de custo primeiro pra IA calcular',
        'warning',
        4000
      )
      return null
    }

    setCarregando(true)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        addNotification('Usuário não autenticado', 'error')
        return null
      }

      const response = await fetch('/api/ia/preco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          userId: userData.user.id,
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
        }  else if (data.motivo === 'custo_obrigatorio') {
          addNotification(
            '💰 Digite o preço de custo primeiro',
            'warning',
            4000
          )
        }   else if (data.motivo === 'nome_obrigatorio') {
          addNotification(
            '✏️ Digite o nome do produto primeiro',
            'warning',
            4000
          )
        } else {
          addNotification(data.erro || 'Erro ao chamar IA', 'error')
        }
        return null
      }

      addNotification('✨ IA calculou os preços!', 'success', 3000)
      return data.dados as SugestaoPreco
    } catch (error: any) {
      console.error('Erro IA preço:', error)
      addNotification('Erro ao processar com IA', 'error')
      return null
    } finally {
      setCarregando(false)
    }
  }

  return { sugerirPreco, carregando }
}