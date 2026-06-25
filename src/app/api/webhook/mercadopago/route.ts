import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enviarConfirmacaoPagamento } from '@/lib/email'

// 🔧 Força rota dinâmica (webhook não pode ser pré-renderizado)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // ✅ Cria o client DENTRO da função (lazy initialization)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await req.json()
    console.log('📨 Webhook MP recebido:', {
      type: body.type,
      action: body.action,
      id: body.data?.id,
    })

    // ══════════════════════════════════════════════════
    // 💸 PAGAMENTO ÚNICO (PIX / Cartão de crédito avulso)
    // ══════════════════════════════════════════════════
    const isPayment =
      body.type === 'payment' ||
      body.action === 'payment.created' ||
      body.action === 'payment.updated'

    if (isPayment) {
      const paymentId = body.data?.id
      if (!paymentId) {
        console.warn('⚠️ Payment sem ID, ignorando')
        return NextResponse.json({ ok: true })
      }

      console.log(`💸 Processando pagamento ${paymentId}`)

      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          },
        }
      )

      if (!paymentResponse.ok) {
        console.error(
          `❌ Erro ao buscar payment ${paymentId}:`,
          paymentResponse.status
        )
        return NextResponse.json({ ok: true })
      }

      const payment = await paymentResponse.json()
      const [userId, tipoPlano] = (payment.external_reference || '').split('|')

      // ✅ Só ativa se aprovado E tem userId
      if (payment.status === 'approved' && userId) {
        const planoFim = new Date()
        planoFim.setMonth(planoFim.getMonth() + 1)

        const planoFinal = tipoPlano || 'profissional'

        const { error } = await supabase
          .from('perfis')
          .update({
            plano: 'ativo',
            tipo_plano: planoFinal,
            plano_fim: planoFim.toISOString(),
            tipo_pagamento: payment.payment_method_id === 'pix' ? 'pix' : 'cartao',
          })
          .eq('id', userId)

        if (error) {
          console.error('❌ Erro ao ativar plano via pagamento:', error)
        } else {
          console.log(`✅ Plano ${planoFinal} ATIVADO pro user ${userId}`)

          // 🆕 ENVIA EMAIL DE CONFIRMAÇÃO
          await enviarEmailConfirmacao(supabase, userId, planoFinal)
        }
      } else {
        console.log(
          `ℹ️ Pagamento ${paymentId} status=${payment.status} — não ativado`
        )
      }

      return NextResponse.json({ ok: true })
    }

    // ══════════════════════════════════════════════════
    // 🔄 ASSINATURA RECORRENTE (preapproval — cartão)
    // ══════════════════════════════════════════════════
    const isSubscription =
      body.type === 'subscription_preapproval' ||
      body.action === 'subscription_preapproval.created' ||
      body.action === 'subscription_preapproval.updated'

    if (isSubscription) {
      const subscriptionId = body.data?.id
      if (!subscriptionId) {
        console.warn('⚠️ Subscription sem ID, ignorando')
        return NextResponse.json({ ok: true })
      }

      console.log(`🔄 Processando assinatura ${subscriptionId}`)

      const subResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          },
        }
      )

      if (!subResponse.ok) {
        console.error(
          `❌ Erro ao buscar subscription ${subscriptionId}:`,
          subResponse.status
        )
        return NextResponse.json({ ok: true })
      }

      const subscription = await subResponse.json()
      const [userId, tipoPlano] = (subscription.external_reference || '').split(
        '|'
      )

      if (subscription.status === 'authorized' && userId) {
        const planoFim = new Date()
        planoFim.setMonth(planoFim.getMonth() + 1)

        const planoFinal = tipoPlano || 'profissional'

        // 🆕 Verifica se já era ativo (pra não mandar email duplicado em renovação)
        const { data: perfilAntigo } = await supabase
          .from('perfis')
          .select('plano, subscription_id')
          .eq('id', userId)
          .single()

        const eraAtivo = perfilAntigo?.plano === 'ativo'
        const mesmaAssinatura = perfilAntigo?.subscription_id === subscriptionId

        const { error } = await supabase
          .from('perfis')
          .update({
            plano: 'ativo',
            tipo_plano: planoFinal,
            plano_fim: planoFim.toISOString(),
            tipo_pagamento: 'cartao',
            subscription_id: subscriptionId,
          })
          .eq('id', userId)

        if (error) {
          console.error('❌ Erro ao ativar plano via assinatura:', error)
        } else {
          console.log(
            `✅ Assinatura ${planoFinal} ATIVADA pro user ${userId} (sub: ${subscriptionId})`
          )

          // 🆕 Só envia email se for nova assinatura (não em renovação automática)
          if (!eraAtivo || !mesmaAssinatura) {
            await enviarEmailConfirmacao(supabase, userId, planoFinal)
          } else {
            console.log(`📧 Email pulado (renovação automática)`)
          }
        }
      } else {
        console.log(
          `ℹ️ Subscription ${subscriptionId} status=${subscription.status} — não ativada`
        )
      }

      return NextResponse.json({ ok: true })
    }

    // ══════════════════════════════════════════════════
    // 🔴 CANCELAMENTO DE ASSINATURA
    // ══════════════════════════════════════════════════
    const isSubscriptionCancelled =
      body.action === 'subscription_preapproval.cancelled' ||
      body.action === 'subscription_preapproval.paused'

    if (isSubscriptionCancelled) {
      const subscriptionId = body.data?.id
      if (!subscriptionId) {
        return NextResponse.json({ ok: true })
      }

      console.log(`🔴 Assinatura ${subscriptionId} cancelada/pausada`)

      // Acha o perfil pelo subscription_id e remove o método de pagamento recorrente
      const { error } = await supabase
        .from('perfis')
        .update({
          tipo_pagamento: null,
        })
        .eq('subscription_id', subscriptionId)

      if (error) {
        console.error('❌ Erro ao processar cancelamento:', error)
      } else {
        console.log(
          `✅ Cancelamento registrado para subscription ${subscriptionId}`
        )
      }

      return NextResponse.json({ ok: true })
    }

    // ══════════════════════════════════════════════════
    // ⚠️ Evento desconhecido — só loga e retorna OK
    // ══════════════════════════════════════════════════
    console.log(`ℹ️ Evento ignorado: type=${body.type} action=${body.action}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('❌ Erro fatal no webhook:', err)
    // ✅ SEMPRE retorna 200 pro MP não ficar reenviando
    return NextResponse.json({ ok: true })
  }
}

// ════════════════════════════════════════════════════
// 📧 HELPER: Envia email de confirmação de pagamento
// ════════════════════════════════════════════════════
async function enviarEmailConfirmacao(
  supabase: any,
  userId: string,
  tipoPlano: string
) {
  try {
    // Busca dados do user pra enviar email
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    if (!user?.email) {
      console.warn(`⚠️ Email do user ${userId} não encontrado, pulando notificação`)
      return
    }

    // Busca nome do negócio (pra personalizar o "Olá")
    const { data: perfil } = await supabase
      .from('perfis')
      .select('nome_negocio')
      .eq('id', userId)
      .single()

    const nome = perfil?.nome_negocio || user.user_metadata?.nome_completo || ''

    await enviarConfirmacaoPagamento(user.email, nome, tipoPlano)
    console.log(`📧 Email de confirmação enviado pra ${user.email}`)
  } catch (err) {
    console.error('❌ Erro ao enviar email de confirmação:', err)
    // Não relança o erro — não queremos quebrar o webhook se o email falhar
  }
}