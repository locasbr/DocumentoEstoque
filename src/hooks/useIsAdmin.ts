'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Hook que retorna se o usuário logado é admin do sistema.
 * Busca do perfil uma vez e cacheia em memória.
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsAdmin(false)
          setLoading(false)
          return
        }

        const { data: perfil } = await supabase
          .from('perfis')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        setIsAdmin(perfil?.is_admin === true)
      } catch (error) {
        console.error('Erro ao verificar admin:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [])

  return { isAdmin, loading }
}