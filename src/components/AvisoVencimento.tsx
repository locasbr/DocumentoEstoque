'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CalendarClock,
  X,
} from 'lucide-react'

import { supabase } from '@/lib/supabase'

type PlanoDisponivel =
  | 'iniciante'
  | 'profissional'

interface PerfilVencimento {
  plano: string | null
  tipo_pagamento: string | null
  plano_fim: string | null
  tipo_plano: string | null
}

const UM_DIA_EM_MS = 86_400_000
const DIAS_PARA_MOSTRAR_AVISO = 7

function isPlanoDisponivel(
  valor: unknown
): valor is PlanoDisponivel {
  return (
    valor === 'iniciante' ||
    valor === 'profissional'
  )
}

function calcularDiasRestantes(
  dataFim: string
): number | null {
  const fim = new Date(dataFim)

  if (Number.isNaN(fim.getTime())) {
    return null
  }

  const agora = new Date()

  return Math.ceil(
    (fim.getTime() - agora.getTime()) /
      UM_DIA_EM_MS
  )
}

export default function AvisoVencimento() {
  const router = useRouter()

  const [diasRestantes, setDiasRestantes] =
    useState<number | null>(null)

  const [tipoPlano, setTipoPlano] =
    useState<PlanoDisponivel | null>(null)

  const [fechado, setFechado] =
    useState(false)

  useEffect(() => {
    let componenteAtivo = true

    async function verificarVencimento() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (
          userError ||
          !user ||
          !componenteAtivo
        ) {
          return
        }

        const {
          data,
          error: perfilError,
        } = await supabase
          .from('perfis')
          .select(
            'plano, tipo_pagamento, plano_fim, tipo_plano'
          )
          .eq('id', user.id)
          .maybeSingle()

        if (!componenteAtivo) {
          return
        }

        if (perfilError) {
          console.error(
            'Erro ao verificar vencimento:',
            perfilError
          )
          return
        }

        const perfil =
          data as PerfilVencimento | null

        /*
         * O aviso é exclusivo para período pago
         * manualmente.
         *
         * Assinaturas no cartão são renovadas
         * automaticamente e não devem receber
         * este aviso.
         */
        if (
          perfil?.plano !== 'ativo' ||
          perfil.tipo_pagamento !== 'pix' ||
          !perfil.plano_fim
        ) {
          return
        }

        const dias = calcularDiasRestantes(
          perfil.plano_fim
        )

        if (
          dias === null ||
          dias < 0 ||
          dias > DIAS_PARA_MOSTRAR_AVISO
        ) {
          return
        }

        setDiasRestantes(dias)

        setTipoPlano(
          isPlanoDisponivel(perfil.tipo_plano)
            ? perfil.tipo_plano
            : null
        )
      } catch (error: unknown) {
        console.error(
          'Erro inesperado ao verificar vencimento:',
          error
        )
      }
    }

    void verificarVencimento()

    return () => {
      componenteAtivo = false
    }
  }, [])

  if (
    diasRestantes === null ||
    fechado
  ) {
    return null
  }

  const textoVencimento =
    diasRestantes === 0
      ? 'Seu período termina hoje'
      : diasRestantes === 1
        ? 'Seu período termina amanhã'
        : `Seu período termina em ${diasRestantes} dias`

  const descricao =
    diasRestantes === 0
      ? 'Faça a renovação para continuar acessando seu estoque sem interrupções.'
      : 'Seu pagamento é renovado manualmente. Você já pode acrescentar mais um mês sem perder os dias restantes.'

  const destinoRenovacao =
    tipoPlano !== null
      ? `/assinar?renovar=1&plano=${tipoPlano}`
      : '/assinar?renovar=1'

  return (
    <section
      aria-labelledby="aviso-vencimento-titulo"
      className="relative flex flex-col gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
          {diasRestantes === 0 ? (
            <AlertTriangle
              aria-hidden="true"
              className="h-5 w-5 text-amber-700 dark:text-amber-400"
            />
          ) : (
            <CalendarClock
              aria-hidden="true"
              className="h-5 w-5 text-amber-700 dark:text-amber-400"
            />
          )}
        </div>

        <div className="min-w-0">
          <h2
            id="aviso-vencimento-titulo"
            className="font-bold text-amber-900 dark:text-amber-200"
          >
            {textoVencimento}
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-300">
            {descricao}
          </p>
        </div>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <button
          type="button"
          onClick={() =>
            router.push(destinoRenovacao)
          }
          className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 sm:flex-none"
        >
          Renovar período
        </button>

        <button
          type="button"
          onClick={() => setFechado(true)}
          aria-label="Fechar aviso de vencimento"
          title="Fechar aviso"
          className="rounded-lg p-2.5 text-amber-700 transition-colors hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
        >
          <X
            aria-hidden="true"
            className="h-4 w-4"
          />
        </button>
      </div>
    </section>
  )
}