  // src/app/api/equipe/resetar-senha/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    // ════════════════════════════════════════════════════
    // 🔒 Autenticação via JWT
    // ════════════════════════════════════════════════════
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const donoId = user.id

    // ════════════════════════════════════════════════════
    // 📥 Pega memberId do body
    // ════════════════════════════════════════════════════
    const { memberId } = await req.json()

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId é obrigatório' },
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
    // 🔍 Busca o membro e VERIFICA SE PERTENCE AO DONO
    // (segurança crítica!)
    // ════════════════════════════════════════════════════
    const { data: membro, error: membroError } = await supabaseAdmin
      .from('membros')
      .select('user_id, dono_id, email')
      .eq('id', memberId)
      .single()

    if (membroError || !membro) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // ✅ Verifica se o membro PERTENCE ao dono autenticado
    if (membro.dono_id !== donoId) {
      return NextResponse.json(
        { error: 'Você não tem permissão pra resetar a senha deste membro' },
        { status: 403 }
      )
    }

    if (!membro.user_id) {
      return NextResponse.json(
        { error: 'Este membro não tem usuário válido' },
        { status: 400 }
      )
    }

    // ════════════════════════════════════════════════════
    // 🔐 Gera nova senha
    // ════════════════════════════════════════════════════
    const tempPassword = gerarSenhaSegura(12)

    // ════════════════════════════════════════════════════
    // 🔄 Atualiza a senha no auth do Supabase
    // ════════════════════════════════════════════════════
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(membro.user_id, {
        password: tempPassword,
      })

    if (updateError) {
      throw updateError
    }

    // ════════════════════════════════════════════════════
    // 📝 Marca status como pendente novamente
    // (força o user a trocar a senha)
    // ════════════════════════════════════════════════════
    await supabaseAdmin
      .from('membros')
      .update({ status: 'pendente' })
      .eq('id', memberId)

    return NextResponse.json({
      success: true,
      tempPassword,
      message: `Senha resetada para ${membro.email}`,
    })
  } catch (error: any) {
    console.error('Erro ao resetar senha:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}

function gerarSenhaSegura(length: number = 12): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  const bytes = randomBytes(length)
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length]
  }
  return password
}
