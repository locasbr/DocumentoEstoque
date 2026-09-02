import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

interface CompletarPerfilBody {
  whatsapp?: unknown
}

function respostaErro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status })
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return respostaErro('Não autenticado', 401)
    }

    const token = authHeader.slice('Bearer '.length).trim()

    if (!token) {
      return respostaErro('Token ausente', 401)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabasePublishableKey || !serviceRoleKey) {
      console.error('Variáveis do Supabase ausentes na API de completar perfil')
      return respostaErro('Configuração interna indisponível', 500)
    }

    const supabaseAuth = createClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return respostaErro('Sessão inválida ou expirada', 401)
    }

    let body: CompletarPerfilBody

    try {
      body = (await req.json()) as CompletarPerfilBody
    } catch {
      return respostaErro('Corpo da requisição inválido', 400)
    }

    if (typeof body.whatsapp !== 'string') {
      return respostaErro('WhatsApp é obrigatório', 400)
    }

    const whatsappNumeros = body.whatsapp.replace(/\D/g, '')

    if (!/^\d{10,11}$/.test(whatsappNumeros)) {
      return respostaErro(
        'WhatsApp inválido. Use um número com DDD',
        400
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data: perfilAtual, error: perfilError } = await supabaseAdmin
      .from('perfis')
      .select('id, telefone')
      .eq('id', user.id)
      .maybeSingle()

    if (perfilError) {
      console.error('Erro ao localizar perfil:', perfilError)
      return respostaErro('Não foi possível localizar o perfil', 500)
    }

    if (!perfilAtual) {
      return respostaErro('Perfil não encontrado', 404)
    }

    const { data: perfilComMesmoTelefone, error: duplicidadeError } =
      await supabaseAdmin
        .from('perfis')
        .select('id')
        .eq('telefone', whatsappNumeros)
        .neq('id', user.id)
        .maybeSingle()

    if (duplicidadeError) {
      console.error('Erro ao verificar WhatsApp:', duplicidadeError)
      return respostaErro('Não foi possível validar o WhatsApp', 500)
    }

    if (perfilComMesmoTelefone) {
      return respostaErro(
        'Este WhatsApp já está cadastrado em outra conta. Entre na conta correta ou use outro número.',
        409
      )
    }

    if (perfilAtual.telefone === whatsappNumeros) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp já estava cadastrado',
      })
    }

    const { error: updateError } = await supabaseAdmin
      .from('perfis')
      .update({ telefone: whatsappNumeros })
      .eq('id', user.id)

    if (updateError) {
      console.error('Erro ao atualizar WhatsApp:', updateError)

      if (updateError.code === '23505') {
        return respostaErro(
          'Este WhatsApp já está cadastrado em outra conta. Entre na conta correta ou use outro número.',
          409
        )
      }

      return respostaErro('Não foi possível salvar o WhatsApp', 500)
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp cadastrado com sucesso',
    })
  } catch (error: unknown) {
    console.error('Erro inesperado ao completar perfil:', error)
    return respostaErro('Erro interno ao completar perfil', 500)
  }
}
