import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Webhook recebido:', body)

    // Webhook de pagamento unico (PIX/Cartao)
    if (body.type === 'payment' || body.action === 'payment.updated') {
      const paymentId = body.data?.id
      if (!paymentId) return NextResponse.json({ ok: true })

      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          },
        }
      )
      const payment = await paymentResponse.json()

      const [userId, tipoPlano] = (payment.external_reference || '').split('|')

      if (payment.status === 'approved' && userId) {
        const planoFim = new Date()
        planoFim.setMonth(planoFim.getMonth() + 1)

        const { error } = await supabase
          .from('perfis')
          .update({
            plano: 'ativo',
            tipo_plano: tipoPlano || 'profissional',
            plano_fim: planoFim.toISOString(),
            tipo_pagamento: payment.payment_method_id === 'pix' ? 'pix' : 'cartao',
          })
          .eq('id', userId)

        if (error) console.error('Erro ao atualizar perfil:', error)
      }
    }

    // Webhook de assinatura recorrente (preapproval)
    if (body.type === 'subscription_preapproval' || body.action === 'updated') {
      const subscriptionId = body.data?.id
      if (!subscriptionId) return NextResponse.json({ ok: true })

      const subResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${subscriptionId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          },
        }
      )
      const subscription = await subResponse.json()

      const [userId, tipoPlano] = (subscription.external_reference || '').split('|')

      if (subscription.status === 'authorized' && userId) {
        const planoFim = new Date()
        planoFim.setMonth(planoFim.getMonth() + 1)

        await supabase
          .from('perfis')
          .update({
            plano: 'ativo',
            tipo_plano: tipoPlano || 'profissional',
            plano_fim: planoFim.toISOString(),
            tipo_pagamento: 'cartao',
          })
          .eq('id', userId)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro no webhook:', err)
    return NextResponse.json({ ok: true })
  }
}