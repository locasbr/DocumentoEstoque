import { NextRequest, NextResponse } from 'next/server'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userEmail } = body

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'userId e userEmail são obrigatórios' },
        { status: 400 }
      )
    }

    const response = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          items: [
            {
              id: 'estoquesystem-mensal',
              title: 'EstoqueSystem — Plano Profissional (Mensal)',
              description: 'Acesso completo ao sistema de estoque, PDV e relatórios',
              quantity: 1,
              currency_id: 'BRL',
              unit_price: 79.90,
            },
          ],
          external_reference: userId,
          payer: {
            email: userEmail,
          },
          payment_methods: {
            installments: 1,
          },
          back_urls: {
            success: `${appUrl}/dashboard?pagamento=sucesso`,
            failure: `${appUrl}/assinar?pagamento=falhou`,
            pending: `${appUrl}/assinar?pagamento=pendente`,
          },
          auto_return: 'approved',
          notification_url: `${appUrl}/api/pagamento/webhook`,
        }),
      }
    )

    const data = await response.json()

    return NextResponse.json({
      id: data.id,
      init_point: data.init_point,
    })
  } catch (error: any) {
    console.error('Erro ao criar preferência:', error)
    return NextResponse.json(
      { error: 'Erro ao criar pagamento' },
      { status: 500 }
    )
  }
}