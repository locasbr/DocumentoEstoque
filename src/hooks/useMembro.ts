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
  // 🆕 Flag que distingue "não tem row" de "deu erro na query"
  const [semMembrosRow, setSemMembrosRow] = useState(false)

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
          // ✅ PGRST116 = "no rows found" — legítimo!
          // User é dono do próprio negócio (signup novo, nunca foi convidado)
          if (queryError.code === 'PGRST116') {
            setMembro(null)
            setSemMembrosRow(true) // confirma que NÃO TEM row (é dono)
            setError(null)
          } else {
            // ❌ Outros erros (network, RLS, timeout) — NÃO assume isDono
            console.error('Erro ao buscar membro:', queryError)
            setMembro(null)
            setSemMembrosRow(false) // deu erro real, NÃO confirma nada
            setError(new Error(queryError.message))
          }
          setIsLoading(false)
          return
        }

        // Sucesso: encontrou row de membro (dono ou funcionario)
        setMembro(data)
        setSemMembrosRow(false)
        setError(null)
      } catch (err) {
        console.error('Erro inesperado no fetchMembro:', err)
        setError(err instanceof Error ? err : new Error('Erro ao buscar membro'))
        setSemMembrosRow(false)
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
    // 🔒 isDono SÓ é true se:
    //    1. Tem row e nivel === 'dono', OU
    //    2. Confirmou que NÃO TEM row (PGRST116)
    // Se deu erro de rede/RLS/timeout, isDono = FALSE (defensivo!)
    isDono: membro?.nivel === 'dono' || semMembrosRow,
    isFuncionario: membro?.nivel === 'funcionario',
  }
}