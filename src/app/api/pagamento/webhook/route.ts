// src/app/api/pagamento/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ══════════ PAGAMENTO ÚNICO (PIX ou cartão avulso) ══════════
    if (body.type === 'payment') {
      const paymentId = body.data?.id
      if (!paymentId) return NextResponse.json({ ok: false }, { status: 400 })

      const mpRes = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
      )
      const payment = await mpRes.json()

      if (payment.status === 'approved') {
        const userId = payment.metadata?.user_id || payment.external_reference

        // Detecta forma de pagamento
        const tipoPagamento =
          payment.payment_type_id === 'credit_card' ||
          payment.payment_type_id === 'debit_card'
            ? 'cartao'
            : 'pix'

        // Define vencimento: 30 dias a partir de agora
        const planoFim = new Date()
        planoFim.setDate(planoFim.getDate() + 30)

        await supabase
          .from('perfis')
          .update({
            plano: 'ativo',
            trial_fim: null,
            plano_fim: planoFim.toISOString(),
            tipo_pagamento: tipoPagamento,
          })
          .eq('id', userId)
      }
    }

    // ══════════ ASSINATURA RECORRENTE (cartão) ══════════
    if (body.type === 'subscription_preapproval') {
      const preapprovalId = body.data?.id

      const mpRes = await fetch(
        `https://api.mercadopago.com/preapproval/${preapprovalId}`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
      )
      const subscription = await mpRes.json()

      const userId = subscription.external_reference

      if (subscription.status === 'authorized') {
        const planoFim = new Date()
        planoFim.setDate(planoFim.getDate() + 30)

        await supabase
          .from('perfis')
          .update({
            plano: 'ativo',
            plano_fim: planoFim.toISOString(),
            tipo_pagamento: 'cartao',
            subscription_id: preapprovalId,
          })
          .eq('id', userId)
      } else if (
        subscription.status === 'paused' ||
        subscription.status === 'cancelled'
      ) {
        await supabase
          .from('perfis')
          .update({ plano: 'expirado' })
          .eq('id', userId)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro webhook:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}