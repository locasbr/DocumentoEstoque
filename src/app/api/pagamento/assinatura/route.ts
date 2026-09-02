import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const PLANOS = {
  iniciante: { nome: 'EstoqueSystem - Plano Iniciante', preco: 39.9 },
  profissional: { nome: 'EstoqueSystem - Plano Profissional', preco: 79.9 },
} as const

type PlanoDisponivel = keyof typeof PLANOS

function isPlanoDisponivel(valor: unknown): valor is PlanoDisponivel {
  return valor === 'iniciante' || valor === 'profissional'
}

function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status })
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://estoquesystem.com.br'

    if (!supabaseUrl || !publishableKey || !serviceRoleKey || !accessToken) {
      console.error('Configuração ausente na criação de assinatura')
      return erro('Configuração do servidor incompleta', 500)
    }

    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return erro('Não autenticado', 401)
    const token = authHeader.slice(7).trim()
    if (!token) return erro('Não autenticado', 401)

    const supabaseAuth = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

    if (authError || !user?.email) return erro('Sessão inválida ou expirada', 401)

    let body: { tipoPlano?: unknown }
    try {
      body = (await req.json()) as { tipoPlano?: unknown }
    } catch {
      return erro('Corpo da requisição inválido', 400)
    }

    if (!isPlanoDisponivel(body.tipoPlano)) {
      return erro('Plano indisponível para novas assinaturas', 400)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfis')
      .select('plano, tipo_plano, tipo_pagamento, subscription_id, plano_fim')
      .eq('id', user.id)
      .maybeSingle()

    if (perfilError) {
      console.error('Erro ao consultar perfil:', perfilError)
      return erro('Não foi possível verificar o plano atual', 500)
    }
    if (!perfil) return erro('Perfil não encontrado', 404)
    if (perfil.tipo_plano === 'negocio') {
      return erro('O plano Negócio legado deve ser gerenciado pelo suporte', 409)
    }

    if (
      perfil.plano === 'ativo' &&
      perfil.tipo_plano === 'profissional' &&
      body.tipoPlano === 'iniciante'
    ) {
      return erro(
        'O downgrade de Profissional para Iniciante deve ser solicitado ao suporte.',
        409,
      )
    }

    if (perfil.plano === 'ativo') {
      return erro(
        perfil.tipo_pagamento === 'cartao'
          ? 'Sua assinatura já é recorrente. Solicite a troca de plano pelo suporte para evitar cobrança duplicada.'
          : 'Para trocar um plano ativo por cartão, solicite atendimento ao suporte.',
        409,
      )
    }

    const plano = PLANOS[body.tipoPlano]
    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: plano.nome,
        external_reference: `${user.id}|${body.tipoPlano}`,
        payer_email: user.email,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plano.preco,
          currency_id: 'BRL',
        },
        back_url: `${siteUrl}/dashboard?pagamento=sucesso`,
        status: 'pending',
      }),
    })

    const data = (await mpResponse.json()) as {
      id?: string
      init_point?: string
      message?: string
    }

    if (!mpResponse.ok || !data.init_point || !data.id) {
      console.error('Erro Mercado Pago ao criar assinatura:', data)
      return erro('Não foi possível criar a assinatura', 502)
    }

    return NextResponse.json({ init_point: data.init_point })
  } catch (error: unknown) {
    console.error('Erro inesperado ao criar assinatura:', error)
    return erro('Erro interno ao criar assinatura', 500)
  }
}
