'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type TipoPlano = 'iniciante' | 'profissional' | 'negocio'

interface LimitesPlano {
  produtos: number
  usuarios: number
  temFiado: boolean
  temValidade: boolean
  temRelatoriosAvancados: boolean
  temExportarCSV: boolean
  temCupomWhatsApp: boolean
  // ✨ IA — exclusivo Negócio
  temIA: boolean
  temIACadastroAutomatico: boolean
  temIASugestaoPreco: boolean
  temIAAnaliseMensal: boolean
}

const LIMITES: Record<TipoPlano, LimitesPlano> = {
  iniciante: {
    produtos: 100,
    usuarios: 1,
    temFiado: false,
    temValidade: false,
    temRelatoriosAvancados: false,
    temExportarCSV: false,
    temCupomWhatsApp: false,
    temIA: false,
    temIACadastroAutomatico: false,
    temIASugestaoPreco: false,
    temIAAnaliseMensal: false,
  },
  profissional: {
  produtos: 999999,
  usuarios: 3,
  temFiado: true,
  temValidade: true,
  temRelatoriosAvancados: true,
  temExportarCSV: true,
  temCupomWhatsApp: true,
  temIA: true,                       // ✅ Liga IA básica
  temIACadastroAutomatico: false,    // Mantém bloqueado (só Negócio)
  temIASugestaoPreco: false,         // Mantém bloqueado (só Negócio)
  temIAAnaliseMensal: true,          // ✅ Libera análise mensal
},
  negocio: {
    produtos: 999999,
    usuarios: 10,
    temFiado: true,
    temValidade: true,
    temRelatoriosAvancados: true,
    temExportarCSV: true,
    temCupomWhatsApp: true,
    // ✨ IA liberada só no Negócio
    temIA: true,
    temIACadastroAutomatico: true,
    temIASugestaoPreco: true,
    temIAAnaliseMensal: true,
  },
}

export function usePlano() {
  const [tipoPlano, setTipoPlano] = useState<TipoPlano>('profissional')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [totalProdutos, setTotalProdutos] = useState(0)

  const recarregar = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // ════════════════════════════════════════════════════
    // 🔍 PASSO 1: Descobre QUEM é o dono
    // ════════════════════════════════════════════════════
    // Se o user é dono → ele mesmo
    // Se é funcionário → busca o dono_id na tabela membros
    let donoId = user.id

    try {
      const { data: membro } = await supabase
        .from('membros')
        .select('dono_id, nivel')
        .eq('user_id', user.id)
        .single()

      if (membro && membro.nivel === 'funcionario') {
        donoId = membro.dono_id
      }
    } catch (err) {
      // Se não tem row em membros, é dono do próprio negócio (signup direto)
      // donoId continua sendo user.id
    }

    // ════════════════════════════════════════════════════
    // 🔍 PASSO 2: Busca o plano DO DONO
    // ════════════════════════════════════════════════════
    const { data: perfil } = await supabase
      .from('perfis')
      .select('tipo_plano, is_admin')
      .eq('id', donoId)
      .single()

    if (perfil) {
      setTipoPlano((perfil.tipo_plano as TipoPlano) || 'profissional')
      setIsAdmin(perfil.is_admin === true)
    }

    // ════════════════════════════════════════════════════
    // 🔍 PASSO 3: Conta produtos DO DONO
    // ════════════════════════════════════════════════════
    const { count } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', donoId)

    if (count !== null) setTotalProdutos(count)

    setLoading(false)
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  // Admin tem acesso a TUDO
  const limites = isAdmin ? LIMITES.negocio : LIMITES[tipoPlano]

  return {
    tipoPlano,
    isAdmin,
    loading,
    limites,
    totalProdutos,
    recarregar,
    // Helpers de limite
    podeAdicionarProduto: isAdmin || totalProdutos < limites.produtos,
    // Helpers de features (Profissional + Negócio)
    temFiado: limites.temFiado,
    temValidade: limites.temValidade,
    temRelatoriosAvancados: limites.temRelatoriosAvancados,
    temExportarCSV: limites.temExportarCSV,
    temCupomWhatsApp: limites.temCupomWhatsApp,
    // Helpers de IA (exclusivo Negócio)
    temIA: limites.temIA,
    temIACadastroAutomatico: limites.temIACadastroAutomatico,
    temIASugestaoPreco: limites.temIASugestaoPreco,
    temIAAnaliseMensal: limites.temIAAnaliseMensal,
    // Plano atual
    isIniciante: tipoPlano === 'iniciante' && !isAdmin,
    isProfissional: tipoPlano === 'profissional' && !isAdmin,
    isNegocio: tipoPlano === 'negocio' || isAdmin,
  }
} 