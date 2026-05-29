import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.type === 'payment') {
      const paymentId = body.data?.id

      if (!paymentId) {
        return NextResponse.json({ received: true })
      }

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

        // Import dinâmico pra evitar erro no build
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error } = await supabase
          .from('perfis')
          .update({ plano: 'ativo', trial_fim: null })
          .eq('id', userId)

        if (error) {
          console.error('Erro ao ativar plano:', error)
        } else {
          console.log(`✅ Plano ativado para usuário ${userId}`)

          // Envia email
          try {
            const { enviarConfirmacaoPagamento } = await import('@/lib/email')
            const { data: perfilData } = await supabase
              .from('perfis')
              .select('nome_negocio')
              .eq('id', userId)
              .single()

            const payerEmail = paymentData.payer?.email
            if (payerEmail) {
              await enviarConfirmacaoPagamento(payerEmail, perfilData?.nome_negocio || '')
            }
          } catch (emailErr) {
            console.error('Erro ao enviar email:', emailErr)
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json({ received: true })
  }
}