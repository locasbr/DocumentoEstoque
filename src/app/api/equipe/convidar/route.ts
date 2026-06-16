import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Cria o client DENTRO da função (evita erro no build)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { email, donoId } = await req.json()

    if (!email || !donoId) {
      return NextResponse.json(
        { error: 'Email e donoId são obrigatórios' },
        { status: 400 }
      )
    }

    // 1. Verifica se o donoId é válido
    const { data: perfil } = await supabaseAdmin
      .from('perfis')
      .select('id')
      .eq('id', donoId)
      .single()

    if (!perfil) {
      return NextResponse.json(
        { error: 'Dono não encontrado' },
        { status: 403 }
      )
    }

    // 2. Verifica se já foi convidado
    const { data: existente } = await supabaseAdmin
      .from('membros')
      .select('id')
      .eq('email', email)
      .eq('dono_id', donoId)
      .single()

    if (existente) {
      return NextResponse.json(
        { error: 'Este funcionário já foi convidado' },
        { status: 409 }
      )
    }

    // 3. Gera senha temporária
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let tempPassword = ''
    for (let i = 0; i < 12; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // 4. Cria o usuário via Admin API
    let userId: string | null = null

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        const { data: existingUsers } =
          await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(
          (u) => u.email === email
        )
        userId = existingUser?.id || null
      } else {
        throw authError
      }
    } else {
      userId = authData?.user?.id || null
    }

    // 5. Registra na tabela membros
    const { error: insertError } = await supabaseAdmin.from('membros').insert({
      dono_id: donoId,
      user_id: userId,
      email,
      nivel: 'funcionario',
      status: 'pendente',
    })

    if (insertError) throw insertError

    // 6. Retorna sucesso
    return NextResponse.json({
      success: true,
      tempPassword,
      message: `Funcionário ${email} convidado com sucesso!`,
    })
  } catch (error: any) {
    console.error('Erro ao convidar funcionário:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}