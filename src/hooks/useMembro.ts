'use client'

import { useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'
import type { Membro } from '@/lib/types'

interface UseMembro {
  membro: Membro | null
  nivel: 'dono' | 'funcionario' | null
  donoId: string | null
  usuarioEfetivoId: string | null
  isLoading: boolean
  error: Error | null
  isDono: boolean
  isFuncionario: boolean
  isFuncionarioPendente: boolean
  isFuncionarioInativo: boolean
}

export function useMembro(): UseMembro {
  const [membro, setMembro] = useState<Membro | null>(null)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [usuarioSemVinculo, setUsuarioSemVinculo] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let componenteAtivo = true

    async function fetchMembro() {
      setIsLoading(true)
      setError(null)

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (!componenteAtivo) {
          return
        }

        if (authError || !user) {
          setUsuarioId(null)
          setMembro(null)
          setUsuarioSemVinculo(false)
          setError(
            new Error(
              authError?.message || 'Usuário não autenticado'
            )
          )
          return
        }

        setUsuarioId(user.id)

        const {
          data,
          error: queryError,
        } = await supabase
          .from('membros')
          .select(
            'id, dono_id, user_id, email, nivel, status, created_at'
          )
          .eq('user_id', user.id)
          .maybeSingle()

        if (!componenteAtivo) {
          return
        }

        if (queryError) {
          console.error('Erro ao buscar membro:', queryError)

          setMembro(null)
          setUsuarioSemVinculo(false)
          setError(new Error(queryError.message))
          return
        }

        if (!data) {
          setMembro(null)
          setUsuarioSemVinculo(true)
          setError(null)
          return
        }

        setMembro(data as Membro)
        setUsuarioSemVinculo(false)
        setError(null)
      } catch (erroDesconhecido) {
        if (!componenteAtivo) {
          return
        }

        console.error(
          'Erro inesperado ao buscar membro:',
          erroDesconhecido
        )

        setMembro(null)
        setUsuarioSemVinculo(false)
        setError(
          erroDesconhecido instanceof Error
            ? erroDesconhecido
            : new Error('Erro inesperado ao buscar membro')
        )
      } finally {
        if (componenteAtivo) {
          setIsLoading(false)
        }
      }
    }

    fetchMembro()

    return () => {
      componenteAtivo = false
    }
  }, [])

  const isFuncionarioAtivo =
    membro?.nivel === 'funcionario' &&
    membro?.status === 'ativo'

  const isFuncionarioPendente =
    membro?.nivel === 'funcionario' &&
    membro?.status === 'pendente'

  const isFuncionarioInativo =
    membro?.nivel === 'funcionario' &&
    membro?.status === 'inativo'

  const isDono =
    Boolean(usuarioId) &&
    !error &&
    (membro?.nivel === 'dono' || usuarioSemVinculo)

  const usuarioEfetivoId = isFuncionarioAtivo
    ? membro?.dono_id ?? null
    : isDono
      ? usuarioId
      : null

  return {
    membro,
    nivel: isDono
      ? 'dono'
      : isFuncionarioAtivo
        ? 'funcionario'
        : null,
    donoId: isFuncionarioAtivo
      ? membro?.dono_id ?? null
      : isDono
        ? usuarioId
        : null,
    usuarioEfetivoId,
    isLoading,
    error,
    isDono,
    isFuncionario: isFuncionarioAtivo,
    isFuncionarioPendente,
    isFuncionarioInativo,
  }
}