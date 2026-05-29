import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { supabaseAdmin } from '@/lib/supabase-admin'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Mercado Pago envia diferentes tipos de notificação
    if (body.type === 'payment') {
      const paymentId = body.data?.id

      if (!paymentId) {
        return NextResponse.json({ received: true })
      }

      // Busca detalhes do pagamento
      const payment = new Payment(client)
      const paymentData = await payment.get({ id: paymentId })

      console.log('Pagamento recebido:', {
        id: paymentData.id,
        status: paymentData.status,
        external_reference: paymentData.external_reference,
      })

      // Se o pagamento foi aprovado
      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference

        if (!userId) {
          console.error('external_reference (userId) não encontrado')
          return NextResponse.json({ received: true })
        }

        // Ativa o plano do usuário
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
    // Retorna 200 mesmo com erro pra evitar retry infinito do MP
    return NextResponse.json({ received: true })
  }
}