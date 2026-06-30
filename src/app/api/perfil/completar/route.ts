// src/app/api/perfil/completar/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // ════════════════════════════════════════════════════
    // 🔒 Autenticação via JWT
    // ════════════════════════════════════════════════════
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // ════════════════════════════════════════════════════
    // 📥 Pega o WhatsApp do body
    // ════════════════════════════════════════════════════
    const { whatsapp } = await req.json()

    if (!whatsapp) {
      return NextResponse.json(
        { error: 'WhatsApp é obrigatório' },
        { status: 400 }
      )
    }

    const whatsappNumeros = whatsapp.replace(/\D/g, '')

    if (whatsappNumeros.length < 10 || whatsappNumeros.length > 11) {
      return NextResponse.json(
        { error: 'WhatsApp inválido. Use o formato (XX) XXXXX-XXXX' },
        { status: 400 }
      )
    }

    // ════════════════════════════════════════════════════
    // 🛡️ Admin client
    // ════════════════════════════════════════════════════
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ════════════════════════════════════════════════════
    // 🔍 Busca dados do user atual
    // ════════════════════════════════════════════════════
    const { data: perfilAtual } = await supabaseAdmin
      .from('perfis')
      .select('id, nome_negocio')
      .eq('id', user.id)
      .single()

    if (!perfilAtual) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      )
    }

    // ════════════════════════════════════════════════════
    // 🕵️ DETECTA FANTASMAS: outras contas do mesmo dono
    // (mesmo prefixo de email OU mesmo nome de negócio)
    // ════════════════════════════════════════════════════
    const emailUser = user.email?.toLowerCase() || ''
    const prefixoEmail = emailUser.split('@')[0]
    const nomeNegocio = perfilAtual.nome_negocio?.toLowerCase().trim() || ''

    // Busca via view perfis_completos (que tem o email)
    const { data: contasSuspeitas } = await supabaseAdmin
      .from('perfis_completos')
      .select('id, email, nome_negocio, telefone')
      .neq('id', user.id) // Exclui o próprio user
      .or(
        `email.ilike.${prefixoEmail}@%,nome_negocio.ilike.${nomeNegocio}%`
      )

    const fantasmas = (contasSuspeitas || []).filter((c) => {
      // Só considera fantasma se TEM mesmo prefixo OU mesmo nome
      const cEmail = c.email?.toLowerCase() || ''
      const cPrefixo = cEmail.split('@')[0]
      const cNome = c.nome_negocio?.toLowerCase().trim() || ''

      return cPrefixo === prefixoEmail || (cNome === nomeNegocio && nomeNegocio.length > 2)
    })

    console.log(
      `🕵️ User ${emailUser} tem ${fantasmas.length} fantasma(s) detectado(s)`
    )

    // ════════════════════════════════════════════════════
    // 🗑️ DELETA OS FANTASMAS (se houver)
    // ════════════════════════════════════════════════════
    const fantasmasDeletados: string[] = []

    if (fantasmas.length > 0) {
      for (const fantasma of fantasmas) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
          fantasma.id
        )

        if (!deleteError) {
          fantasmasDeletados.push(fantasma.email)
          console.log(`🗑️ Fantasma deletado: ${fantasma.email}`)
        } else {
          console.error(`❌ Erro ao deletar ${fantasma.email}:`, deleteError)
        }
      }
    }

    // ════════════════════════════════════════════════════
    // 📝 ATUALIZA o perfil com o WhatsApp
    // ════════════════════════════════════════════════════
    const { error: updateError } = await supabaseAdmin
      .from('perfis')
      .update({ telefone: whatsappNumeros })
      .eq('id', user.id)

    if (updateError) {
      // Se for erro de telefone duplicado (do índice unique)
      if (updateError.message?.includes('unique') || updateError.message?.includes('duplicate')) {
        return NextResponse.json(
          {
            error: 'Este WhatsApp já está cadastrado em outra conta. Use outro número ou faça login na conta correta.',
          },
          { status: 409 }
        )
      }
      throw updateError
    }

    // ════════════════════════════════════════════════════
    // ✅ Sucesso
    // ════════════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      message: 'WhatsApp cadastrado com sucesso',
      fantasmas_deletados: fantasmasDeletados.length,
      detalhes: fantasmasDeletados,
    })
  } catch (error: any) {
    console.error('Erro ao completar perfil:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}