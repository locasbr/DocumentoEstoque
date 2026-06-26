// src/app/api/equipe/convidar/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    // ════════════════════════════════════════════════════
    // 🔒 SEGURANÇA: Pega o token do header
    // ════════════════════════════════════════════════════
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // ════════════════════════════════════════════════════
    // 🔍 Verifica o token e descobre QUEM é o usuário
    // ════════════════════════════════════════════════════
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    // ✅ donoId vem da SESSÃO AUTENTICADA, não do body!
    const donoId = user.id

    // ════════════════════════════════════════════════════
    // 📥 Pega o email do body (e SÓ o email!)
    // ════════════════════════════════════════════════════
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // ✅ Validação de email com regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // ════════════════════════════════════════════════════
    // 🛡️ Cria client admin SOMENTE pra ações privilegiadas
    // ════════════════════════════════════════════════════
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ════════════════════════════════════════════════════
    // 🔍 Verifica se o usuário autenticado É DONO
    // (não funcionário tentando convidar outro funcionário)
    // ════════════════════════════════════════════════════
    const { data: membroAtual } = await supabaseAdmin
      .from('membros')
      .select('nivel, dono_id')
      .eq('user_id', donoId)
      .maybeSingle()

    // Se tem row em membros E é funcionário → BLOQUEIA
    if (membroAtual && membroAtual.nivel === 'funcionario') {
      return NextResponse.json(
        {
          error: 'Apenas donos podem convidar funcionários',
        },
        { status: 403 }
      )
    }

    // ════════════════════════════════════════════════════
    // ✅ Verifica se o perfil do dono existe
    // ════════════════════════════════════════════════════
    const { data: perfil } = await supabaseAdmin
      .from('perfis')
      .select('id')
      .eq('id', donoId)
      .single()

    if (!perfil) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      )
    }

    // ════════════════════════════════════════════════════
    // 🔍 Verifica se o email já foi convidado por este dono
    // ════════════════════════════════════════════════════
    const { data: existente } = await supabaseAdmin
      .from('membros')
      .select('id')
      .eq('email', email)
      .eq('dono_id', donoId)
      .maybeSingle()

    if (existente) {
      return NextResponse.json(
        { error: 'Este funcionário já foi convidado' },
        { status: 409 }
      )
    }

    // ════════════════════════════════════════════════════
    // 🔐 Gera senha temporária SEGURA usando crypto
    // (não usa mais Math.random())
    // ════════════════════════════════════════════════════
    const tempPassword = gerarSenhaSegura(12)

    // ════════════════════════════════════════════════════
    // 👤 Cria o usuário via Admin API
    // ════════════════════════════════════════════════════
    let userId: string | null = null

    const { data: authData, error: authCreateError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      })

    if (authCreateError) {
      // Se o user já existe em auth, busca ele
      if (authCreateError.message.includes('already been registered')) {
        const { data: existingUsers } =
          await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(
          (u) => u.email === email
        )
        userId = existingUser?.id || null
      } else {
        throw authCreateError
      }
    } else {
      userId = authData?.user?.id || null
    }

    if (!userId) {
      throw new Error('Não foi possível criar/encontrar o usuário')
    }

    // ════════════════════════════════════════════════════
    // 📝 Registra na tabela membros
    // ════════════════════════════════════════════════════
    const { error: insertError } = await supabaseAdmin
      .from('membros')
      .insert({
        dono_id: donoId,
        user_id: userId,
        email,
        nivel: 'funcionario',
        status: 'pendente',
      })

    if (insertError) throw insertError

    // ════════════════════════════════════════════════════
    // ✅ Retorna sucesso com senha temporária
    // ════════════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      tempPassword,
      message: `Funcionário ${email} convidado com sucesso!`,
    })
  } catch (error: any) {
    console.error('Erro ao convidar funcionário:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════
// 🔐 Gera senha temporária criptograficamente segura
// ════════════════════════════════════════════════════
function gerarSenhaSegura(length: number = 12): string {
  // Caracteres pra senha (sem ambíguos como 0/O, 1/l/I)
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  const bytes = randomBytes(length)
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length]
  }
  return password
}
