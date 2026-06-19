'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type TipoPlano = 'iniciante' | 'profissional' | 'negocio'

interface LimitesPlano {
  produtos: number
  usuarios: number
  filiais: number
  temFiado: boolean
  temValidade: boolean
  temRelatoriosAvancados: boolean
  temExportarCSV: boolean
  temCupomWhatsApp: boolean
  temBackupAutomatico: boolean
  temComparativoMensal: boolean
}

const LIMITES: Record<TipoPlano, LimitesPlano> = {
  iniciante: {
    produtos: 100,
    usuarios: 1,
    filiais: 1,
    temFiado: false,
    temValidade: false,
    temRelatoriosAvancados: false,
    temExportarCSV: false,
    temCupomWhatsApp: false,
    temBackupAutomatico: false,
    temComparativoMensal: false,
  },
  profissional: {
    produtos: 999999,
    usuarios: 3,
    filiais: 1,
    temFiado: true,
    temValidade: true,
    temRelatoriosAvancados: true,
    temExportarCSV: true,
    temCupomWhatsApp: true,
    temBackupAutomatico: false,
    temComparativoMensal: false,
  },
  negocio: {
    produtos: 999999,
    usuarios: 10,
    filiais: 2,
    temFiado: true,
    temValidade: true,
    temRelatoriosAvancados: true,
    temExportarCSV: true,
    temCupomWhatsApp: true,
    temBackupAutomatico: true,
    temComparativoMensal: true,
  },
}

export function usePlano() {
  const [tipoPlano, setTipoPlano] = useState<TipoPlano>('profissional')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [totalProdutos, setTotalProdutos] = useState(0)

  const recarregar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Busca plano + admin
    const { data: perfil } = await supabase
      .from('perfis')
      .select('tipo_plano, is_admin')
      .eq('id', user.id)
      .single()

    if (perfil) {
      setTipoPlano((perfil.tipo_plano as TipoPlano) || 'profissional')
    //  setIsAdmin(false)
      setIsAdmin(perfil.is_admin === true)
    }

    // Conta produtos atuais
    const { count } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', user.id)

    if (count !== null) setTotalProdutos(count)
    setLoading(false)
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  // Admin tem acesso a TUDO sem limite
  const limites = isAdmin ? LIMITES.negocio : LIMITES[tipoPlano]

  return {
    tipoPlano,
    isAdmin,
    loading,
    limites,
    totalProdutos,
    recarregar,

    // Helpers booleanos
    podeAdicionarProduto: isAdmin || totalProdutos < limites.produtos,
    temFiado: limites.temFiado,
    temValidade: limites.temValidade,
    temRelatoriosAvancados: limites.temRelatoriosAvancados,
    temExportarCSV: limites.temExportarCSV,
    temCupomWhatsApp: limites.temCupomWhatsApp,
    temBackupAutomatico: limites.temBackupAutomatico,
    temComparativoMensal: limites.temComparativoMensal,

    // Plano atual
    isIniciante: tipoPlano === 'iniciante' && !isAdmin,
    isProfissional: tipoPlano === 'profissional',
    isNegocio: tipoPlano === 'negocio',
  }
}