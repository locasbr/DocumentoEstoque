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
    setCarregando(true)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        addNotification('Usuário não autenticado', 'error')
        return null
      }

      const response = await fetch('/api/ia/produto', {
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
        } else {
          addNotification(data.erro || 'Erro ao chamar IA', 'error')
        }
        return null
      }

      addNotification('✨ IA completou os dados!', 'success', 3000)
      return data.dados as DadosIAProduto
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