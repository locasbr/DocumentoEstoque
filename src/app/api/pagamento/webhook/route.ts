import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.type === 'payment') {
      const paymentId = body.data?.id

      if (!paymentId) {
        return NextResponse.json({ received: true })
      }

      // Busca detalhes do pagamento direto na API do MP
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          },
        }
      )

      const paymentData = await response.json()

      console.log('Pagamento recebido:', {
        id: paymentData.id,
        status: paymentData.status,
        external_reference: paymentData.external_reference,
      })

      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference

        if (!userId) {
          console.error('external_reference (userId) não encontrado')
          return NextResponse.json({ received: true })
        }

        const { error } = await supabaseAdmin
          .from('perfis')
          .update({
            plano: 'ativo',
            trial_fim: null,
          })
          .eq('id', userId)

        if (error) {
          console.error('Erro ao ativar plano:', error)
        } else {
          console.log(`✅ Plano ativado para usuário ${userId}`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json({ received: true })
  }
}