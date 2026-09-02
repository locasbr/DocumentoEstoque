'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import { supabase } from '@/lib/supabase'

export type TipoPlano =
  | 'iniciante'
  | 'profissional'
  | 'negocio'

export interface LimitesPlano {
  produtos: number
  usuarios: number
  temFiado: boolean
  temValidade: boolean
  temRelatoriosAvancados: boolean
  temExportarCSV: boolean
  temCupomWhatsApp: boolean
  temIA: boolean
  temIACadastroAutomatico: boolean
  temIASugestaoPreco: boolean
  temIAAnaliseMensal: boolean
}

const LIMITE_ILIMITADO = 999999

const LIMITES: Record<
  TipoPlano,
  LimitesPlano
> = {
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
    produtos: LIMITE_ILIMITADO,

    // Mantido temporariamente para compatibilidade
    // com as regras atuais da área de Equipe.
    usuarios: 3,

    temFiado: true,
    temValidade: true,
    temRelatoriosAvancados: true,
    temExportarCSV: true,
    temCupomWhatsApp: true,

    // Estrutura de IA disponível no Profissional.
    // A interface decide quais recursos exibir.
    temIA: true,
    temIACadastroAutomatico: true,
    temIASugestaoPreco: true,
    temIAAnaliseMensal: true,
  },

  // Plano legado mantido para contas antigas,
  // administradores, webhooks e compatibilidade.
  // Ele não será oferecido para novas assinaturas.
  negocio: {
    produtos: LIMITE_ILIMITADO,
    usuarios: 10,
    temFiado: true,
    temValidade: true,
    temRelatoriosAvancados: true,
    temExportarCSV: true,
    temCupomWhatsApp: true,
    temIA: true,
    temIACadastroAutomatico: true,
    temIASugestaoPreco: true,
    temIAAnaliseMensal: true,
  },
}

function isTipoPlano(
  valor: unknown
): valor is TipoPlano {
  return (
    valor === 'iniciante' ||
    valor === 'profissional' ||
    valor === 'negocio'
  )
}

export function usePlano() {
  // Começa no plano mais restritivo.
  // Recursos pagos só são liberados depois
  // da confirmação feita no Supabase.
  const [tipoPlano, setTipoPlano] =
    useState<TipoPlano>('iniciante')

  const [isAdmin, setIsAdmin] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [totalProdutos, setTotalProdutos] =
    useState(0)

  const [error, setError] =
    useState<string | null>(null)

  const recarregar =
    useCallback(async () => {
      setLoading(true)
      setError(null)

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setTipoPlano('iniciante')
          setIsAdmin(false)
          setTotalProdutos(0)

          if (userError) {
            console.error(
              'Erro ao verificar usuário:',
              userError
            )
          }

          setError(
            'Não foi possível identificar o usuário.'
          )

          return
        }

        // Por padrão, o usuário é considerado
        // dono da própria conta.
        let donoId = user.id

        const {
          data: membro,
          error: membroError,
        } = await supabase
          .from('membros')
          .select(
            'dono_id, nivel, status'
          )
          .eq('user_id', user.id)
          .maybeSingle()

        if (membroError) {
          console.error(
            'Erro ao verificar vínculo do membro:',
            membroError
          )

          // Não interrompe o carregamento.
          // Na ausência de um vínculo confirmado,
          // o usuário continua como dono da conta.
        }

        if (
          membro?.nivel === 'funcionario' &&
          membro.status === 'ativo' &&
          typeof membro.dono_id === 'string' &&
          membro.dono_id.trim()
        ) {
          donoId = membro.dono_id
        }

        const {
          data: perfil,
          error: perfilError,
        } = await supabase
          .from('perfis')
          .select(
            'tipo_plano, is_admin'
          )
          .eq('id', donoId)
          .maybeSingle()

        if (perfilError) {
          console.error(
            'Erro ao carregar plano:',
            perfilError
          )

          setTipoPlano('iniciante')
          setIsAdmin(false)

          setError(
            'Não foi possível confirmar o plano. Os limites básicos foram aplicados.'
          )
        } else if (!perfil) {
          setTipoPlano('iniciante')
          setIsAdmin(false)

          setError(
            'Perfil do plano não encontrado. Os limites básicos foram aplicados.'
          )
        } else {
          const planoConfirmado =
            isTipoPlano(perfil.tipo_plano)
              ? perfil.tipo_plano
              : 'iniciante'

          setTipoPlano(planoConfirmado)
          setIsAdmin(
            perfil.is_admin === true
          )
        }

        const {
          count,
          error: produtosError,
        } = await supabase
          .from('produtos')
          .select('*', {
            count: 'exact',
            head: true,
          })
          .eq('usuario_id', donoId)

        if (produtosError) {
          console.error(
            'Erro ao contar produtos:',
            produtosError
          )

          setTotalProdutos(0)

          setError((erroAtual) =>
            erroAtual
              ? erroAtual
              : 'Não foi possível verificar a quantidade de produtos.'
          )
        } else {
          setTotalProdutos(count ?? 0)
        }
      } catch (erro: unknown) {
        console.error(
          'Erro inesperado ao carregar plano:',
          erro
        )

        // Falha de maneira restritiva.
        setTipoPlano('iniciante')
        setIsAdmin(false)
        setTotalProdutos(0)

        setError(
          'Ocorreu um erro ao verificar o plano. Os limites básicos foram aplicados.'
        )
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  // O administrador mantém acesso completo.
  const limites = isAdmin
    ? LIMITES.negocio
    : LIMITES[tipoPlano]

  const isIniciante =
    tipoPlano === 'iniciante' &&
    !isAdmin

  const isProfissional =
    tipoPlano === 'profissional' &&
    !isAdmin

  // Negócio permanece reconhecido internamente
  // para contas legadas.
  const isNegocio =
    tipoPlano === 'negocio' &&
    !isAdmin

  const podeAdicionarProduto =
    isAdmin ||
    totalProdutos < limites.produtos

  return {
    tipoPlano,
    isAdmin,
    loading,
    error,
    limites,
    totalProdutos,
    recarregar,

    // Limites
    podeAdicionarProduto,

    // Recursos dos planos
    temFiado: limites.temFiado,
    temValidade: limites.temValidade,
    temRelatoriosAvancados:
      limites.temRelatoriosAvancados,
    temExportarCSV:
      limites.temExportarCSV,
    temCupomWhatsApp:
      limites.temCupomWhatsApp,

    // Recursos de IA
    temIA: limites.temIA,
    temIACadastroAutomatico:
      limites.temIACadastroAutomatico,
    temIASugestaoPreco:
      limites.temIASugestaoPreco,
    temIAAnaliseMensal:
      limites.temIAAnaliseMensal,

    // Identificação do plano
    isIniciante,
    isProfissional,
    isNegocio,
  }
}