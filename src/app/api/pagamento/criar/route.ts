import { NextRequest, NextResponse } from 'next/server'

const PLANOS = {
  iniciante: {
    nome: 'EstoqueSystem - Plano Iniciante (1 mes)',
    preco: 39.90,
  },
  profissional: {
    nome: 'EstoqueSystem - Plano Profissional (1 mes)',
    preco: 79.90,
  },
  negocio: {
    nome: 'EstoqueSystem - Plano Negocio (1 mes)',
    preco: 149.90,
  },
}

export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail, tipoPlano } = await req.json()

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const planoEscolhido = PLANOS[tipoPlano as keyof typeof PLANOS]
    if (!planoEscolhido) {
      return NextResponse.json(
        { error: 'Plano invalido' },
        { status: 400 }
      )
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Configuracao do servidor incompleta' },
        { status: 500 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://estoquesystem.com.br'

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: planoEscolhido.nome,
            quantity: 1,
            unit_price: planoEscolhido.preco,
            currency_id: 'BRL',
          },
        ],
        payer: {
          email: userEmail,
        },
        external_reference: `${userId}|${tipoPlano}`,
        back_urls: {
          success: `${siteUrl}/dashboard?pagamento=sucesso`,
          failure: `${siteUrl}/assinar?pagamento=falhou`,
          pending: `${siteUrl}/assinar?pagamento=pendente`,
        },
        auto_return: 'approved',
        payment_methods: {
          excluded_payment_types: [],
          installments: 1,
        },
        notification_url: `${siteUrl}/api/webhook/mercadopago`,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro Mercado Pago:', data)
      return NextResponse.json(
        { error: 'Erro ao criar pagamento', detalhes: data },
        { status: 500 }
      )
    }

    return NextResponse.json({
      init_point: data.init_point,
      preference_id: data.id,
      plano: tipoPlano,
      valor: planoEscolhido.preco,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro inesperado'
    console.error('Erro na API:', err)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}