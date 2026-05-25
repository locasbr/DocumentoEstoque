'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface Membro {
  id: string
  dono_id: string
  user_id: string
  email: string
  nivel: 'dono' | 'funcionario'
  status: 'pendente' | 'ativo' | 'inativo'
  created_at: string
}

interface UseMembro {
  membro: Membro | null
  nivel: 'dono' | 'funcionario' | null
  donoId: string | null
  isLoading: boolean
  error: Error | null
  isDono: boolean
  isFuncionario: boolean
}

export function useMembro(): UseMembro {
  const [membro, setMembro] = useState<Membro | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchMembro = async () => {
      try {
        setIsLoading(true)
        const { data: session } = await supabase.auth.getSession()

        if (!session?.session?.user?.id) {
          setError(new Error('Usuário não autenticado'))
          setIsLoading(false)
          return
        }

        const { data, error: queryError } = await supabase
          .from('membros')
          .select('*')
          .eq('user_id', session.session.user.id)
          .single()

        if (queryError) {
          // Se não encontrou membro, trata como dono (para compatibilidade)
          console.warn('Membro não encontrado:', queryError)
          setMembro(null)
          setIsLoading(false)
          return
        }

        setMembro(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao buscar membro'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembro()
  }, [])

  return {
    membro,
    nivel: membro?.nivel ?? null,
    donoId: membro?.dono_id ?? null,
    isLoading,
    error,
    isDono: membro?.nivel === 'dono' || membro === null,
    isFuncionario: membro?.nivel === 'funcionario',
  }
}
