// src/app/api/pagamento/assinatura/route.ts
import { NextRequest, NextResponse } from 'next/server'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail } = await req.json()

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'EstoqueSystem - Plano Profissional',
        external_reference: userId,
        payer_email: userEmail,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 79.90,
          currency_id: 'BRL',
        },
        back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?pagamento=sucesso`,
        status: 'pending',
      }),
    })

    const data = await response.json()

    if (data.init_point) {
      return NextResponse.json({ init_point: data.init_point, id: data.id })
    }

    return NextResponse.json({ error: 'Erro ao criar assinatura' }, { status: 500 })
  } catch (error) {
    console.error('Erro ao criar assinatura:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
