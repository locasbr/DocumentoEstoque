'use client'

import { useState } from 'react'
import { DadosCupom, ItemCupom } from '@/components/cupom-impressao'
import { supabase } from '@/lib/supabase'

export function useCupom() {
  const [cupomAberto, setCupomAberto] = useState(false)
  const [dadosCupom, setDadosCupom] = useState<DadosCupom | null>(null)

  async function gerarCupom(params: {
    itens: ItemCupom[]
    desconto?: number
    forma_pagamento: string
    valor_recebido?: number
  }) {
    // Busca nome do negócio do perfil
    const { data: perfil } = await supabase
      .from('perfis')
      .select('nome_negocio')
      .single()

    // Busca nome do usuário logado
    const { data: { user } } = await supabase.auth.getUser()

    const subtotal = params.itens.reduce((acc, item) => acc + item.subtotal, 0)
    const desconto = params.desconto || 0
    const total = subtotal - desconto
    const troco =
      params.valor_recebido && params.valor_recebido > total
        ? params.valor_recebido - total
        : 0

    // Número de venda baseado em timestamp
    const numero_venda = Date.now().toString().slice(-6)

    const dados: DadosCupom = {
      numero_venda,
      itens: params.itens,
      subtotal,
      desconto,
      total,
      forma_pagamento: params.forma_pagamento,
      valor_recebido: params.valor_recebido,
      troco,
      nome_negocio: perfil?.nome_negocio || 'Meu Mercado',
      data: new Date(),
      operador: user?.email?.split('@')[0],
    }

    setDadosCupom(dados)
    setCupomAberto(true)
    return dados
  }

  function fecharCupom() {
    setCupomAberto(false)
    setDadosCupom(null)
  }

  return { cupomAberto, dadosCupom, gerarCupom, fecharCupom }
}
