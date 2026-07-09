'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, X } from 'lucide-react'

export default function AvisoVencimento() {
  const router = useRouter()
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null)
  const [tipoPlano, setTipoPlano] = useState<string | null>(null)
  const [fechado, setFechado] = useState(false)

  useEffect(() => {
    const verificar = async () => {
      const { data: sessao } = await supabase.auth.getSession()
      if (!sessao.session) return

      const { data: perfil } = await supabase
        .from('perfis')
        .select('plano, tipo_pagamento, plano_fim, tipo_plano')
        .eq('id', sessao.session.user.id)
        .single()

      // Só interessa: plano ativo, pago via PIX, com data de fim
      if (
        perfil?.plano !== 'ativo' ||
        perfil?.tipo_pagamento !== 'pix' ||
        !perfil?.plano_fim
      ) {
        return
      }

      const hoje = new Date()
      const fim = new Date(perfil.plano_fim)
      const dias = Math.ceil(
        (fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Mostra só quando falta 3 dias ou menos (e ainda não venceu)
      if (dias <= 3 && dias >= 0) {
        setDiasRestantes(dias)
        setTipoPlano(perfil.tipo_plano ?? null)
      }
    }

    verificar()
  }, [])

  // Não mostra nada se não tá vencendo ou se o user fechou
  if (diasRestantes === null || fechado) return null

  const texto =
    diasRestantes === 0
      ? 'Seu plano vence hoje!'
      : diasRestantes === 1
      ? 'Seu plano vence amanhã!'
      : `Seu plano vence em ${diasRestantes} dias`

  return (
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-300 dark:border-amber-700 rounded-2xl">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 flex-shrink-0 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="font-bold text-amber-900 dark:text-amber-200">
            ⏰ {texto}
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Como você paga via PIX, ele não renova sozinho. Renove pra não
            perder o acesso ao seu estoque e PDV.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          onClick={() =>
            router.push(`/assinar?renovar=1&plano=${tipoPlano ?? ''}`)
          }
          className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors whitespace-nowrap"
        >
          Renovar agora
        </button>
        <button
          onClick={() => setFechado(true)}
          className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-full transition-colors"
          aria-label="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}