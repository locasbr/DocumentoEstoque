import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

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

    const preference = new Preference(client)

    const response = await preference.create({
      body: {
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
        // Referência para identificar o usuário no webhook
        external_reference: userId,
        // Dados do comprador
        payer: {
          email: userEmail,
        },
        // Sem parcelamento — só à vista
        payment_methods: {
          installments: 1,
          excluded_payment_types: [
            { id: 'ticket' }, // remove boleto (opcional)
          ],
        },
        // URLs de retorno
        back_urls: {
          success: `${appUrl}/dashboard?pagamento=sucesso`,
          failure: `${appUrl}/assinar?pagamento=falhou`,
          pending: `${appUrl}/assinar?pagamento=pendente`,
        },
        auto_return: 'approved',
        // Webhook
        notification_url: `${appUrl}/api/pagamento/webhook`,
      },
    })

    return NextResponse.json({
      id: response.id,
      init_point: response.init_point,
    })
  } catch (error: any) {
    console.error('Erro ao criar preferência:', error)
    return NextResponse.json(
      { error: 'Erro ao criar pagamento' },
      { status: 500 }
    )
  }
}