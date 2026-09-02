import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { enviarConfirmacaoPagamento } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type PlanoInterno = 'iniciante' | 'profissional' | 'negocio'

interface WebhookBody {
  type?: string
  action?: string
  data?: { id?: string | number }
}

function isPlanoInterno(valor: string): valor is PlanoInterno {
  return valor === 'iniciante' || valor === 'profissional' || valor === 'negocio'
}

function somarUmMes(base: Date): Date {
  const resultado = new Date(base)
  resultado.setMonth(resultado.getMonth() + 1)
  return resultado
}

function respostaOk() {
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

  if (!supabaseUrl || !serviceRoleKey || !accessToken) {
    console.error('Configuração ausente no webhook Mercado Pago')
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    let body: WebhookBody
    try {
      body = (await req.json()) as WebhookBody
    } catch {
      return respostaOk()
    }

    const isPayment =
      body.type === 'payment' ||
      body.action === 'payment.created' ||
      body.action === 'payment.updated'

    if (isPayment) {
      const paymentId = String(body.data?.id ?? '').trim()
      if (!paymentId) return respostaOk()

      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )

      if (!mpResponse.ok) {
        console.error('Falha ao consultar pagamento:', paymentId, mpResponse.status)
        return NextResponse.json({ ok: false }, { status: 502 })
      }

      const payment = (await mpResponse.json()) as {
        id?: string | number
        status?: string
        external_reference?: string
        payment_method_id?: string
      }

      if (String(payment.id ?? '') !== paymentId || payment.status !== 'approved') {
        return respostaOk()
      }

      const [userId, planoRecebido] = (payment.external_reference ?? '').split('|')
      if (!userId || !isPlanoInterno(planoRecebido)) {
        console.error('Referência externa inválida no pagamento:', paymentId)
        return respostaOk()
      }

      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('plano, tipo_plano, plano_fim, tipo_pagamento, subscription_id')
        .eq('id', userId)
        .maybeSingle()

      if (perfilError) throw perfilError
      if (!perfil) return respostaOk()

      if (
        planoRecebido === 'negocio' &&
        perfil.tipo_plano !== 'negocio'
      ) {
        console.error('Tentativa de ativação nova do plano Negócio:', paymentId)
        return respostaOk()
      }

      const { error: claimError } = await supabase
        .from('pagamentos_processados')
        .insert({
          mercado_pago_id: paymentId,
          tipo_evento: 'payment.approved',
          user_id: userId,
          tipo_plano: planoRecebido,
        })

      if (claimError?.code === '23505') return respostaOk()
      if (claimError) throw claimError

      try {
        const agora = new Date()
        const fimAtual = perfil.plano_fim ? new Date(perfil.plano_fim) : null
        const base =
          fimAtual && !Number.isNaN(fimAtual.getTime()) && fimAtual > agora
            ? fimAtual
            : agora
        const novoPlanoFim = somarUmMes(base)

        const recorrente = Boolean(perfil.subscription_id)
        const tipoPagamento = recorrente
          ? 'cartao'
          : payment.payment_method_id === 'pix'
            ? 'pix'
            : 'cartao'

        const { error: updateError } = await supabase
          .from('perfis')
          .update({
            plano: 'ativo',
            tipo_plano: planoRecebido,
            plano_fim: novoPlanoFim.toISOString(),
            tipo_pagamento: tipoPagamento,
          })
          .eq('id', userId)

        if (updateError) throw updateError

        await enviarEmailConfirmacao(supabase, userId, planoRecebido)
      } catch (error) {
        await supabase
          .from('pagamentos_processados')
          .delete()
          .eq('mercado_pago_id', paymentId)
        throw error
      }

      return respostaOk()
    }

    const isSubscription =
      body.type === 'subscription_preapproval' ||
      body.action === 'subscription_preapproval.created' ||
      body.action === 'subscription_preapproval.updated'

    if (isSubscription) {
      const subscriptionId = String(body.data?.id ?? '').trim()
      if (!subscriptionId) return respostaOk()

      const mpResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${encodeURIComponent(subscriptionId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )

      if (!mpResponse.ok) {
        console.error('Falha ao consultar assinatura:', subscriptionId, mpResponse.status)
        return NextResponse.json({ ok: false }, { status: 502 })
      }

      const subscription = (await mpResponse.json()) as {
        id?: string
        status?: string
        external_reference?: string
      }

      if (subscription.id !== subscriptionId) return respostaOk()

      const [userId, planoRecebido] = (subscription.external_reference ?? '').split('|')
      if (!userId || !isPlanoInterno(planoRecebido)) return respostaOk()

      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('tipo_plano, subscription_id')
        .eq('id', userId)
        .maybeSingle()

      if (perfilError) throw perfilError
      if (!perfil) return respostaOk()
      if (planoRecebido === 'negocio' && perfil.tipo_plano !== 'negocio') {
        return respostaOk()
      }

      if (subscription.status === 'authorized') {
        const { error } = await supabase
          .from('perfis')
          .update({ subscription_id: subscriptionId, tipo_pagamento: 'cartao' })
          .eq('id', userId)
        if (error) throw error
      }

      if (
        subscription.status === 'cancelled' ||
        subscription.status === 'paused'
      ) {
        const { error } = await supabase
          .from('perfis')
          .update({ tipo_pagamento: null })
          .eq('id', userId)
          .eq('subscription_id', subscriptionId)
        if (error) throw error
      }

      // A autorização da assinatura não ativa nem renova o plano.
      // A ativação ocorre somente quando o payment correspondente fica approved.
      return respostaOk()
    }

    return respostaOk()
  } catch (error: unknown) {
    console.error('Erro no webhook Mercado Pago:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

async function enviarEmailConfirmacao(
  supabase: SupabaseClient,
  userId: string,
  tipoPlano: PlanoInterno,
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(userId)

    if (!user?.email) return

    const { data: perfil } = await supabase
      .from('perfis')
      .select('nome_negocio')
      .eq('id', userId)
      .maybeSingle()

    const nome = perfil?.nome_negocio || user.user_metadata?.nome_completo || ''
    await enviarConfirmacaoPagamento(user.email, nome, tipoPlano)
  } catch (error: unknown) {
    console.error('Erro ao enviar confirmação de pagamento:', error)
  }
}
