import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type DeleteBody = {
  senha?: unknown
  confirmacao?: unknown
}

async function deletarRegistrosPorTabela(
  tabela: string,
  coluna: string,
  userId: string
) {
  const { error } = await supabaseAdmin.from(tabela).delete().eq(coluna, userId)

  if (error) {
    throw new Error(`Erro ao deletar ${tabela}: ${error.message}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 401 })
    }

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

    const body = (await req.json()) as DeleteBody
    const senha = typeof body.senha === 'string' ? body.senha : ''
    const confirmacao =
      typeof body.confirmacao === 'string' ? body.confirmacao : ''

    if (confirmacao !== 'DELETAR MINHA CONTA') {
      return NextResponse.json(
        {
          error: 'Digite exatamente "DELETAR MINHA CONTA" para confirmar',
        },
        { status: 400 }
      )
    }

    if (!senha) {
      return NextResponse.json(
        { error: 'Senha é obrigatória para confirmar exclusão' },
        { status: 400 }
      )
    }

    const { error: senhaError } = await supabaseAuth.auth.signInWithPassword(
      {
        email: user.email || '',
        password: senha,
      }
    )

    if (senhaError) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
    }

    const userId = user.id

    await deletarRegistrosPorTabela('itens_venda', 'usuario_id', userId)
    await deletarRegistrosPorTabela('vendas', 'usuario_id', userId)
    await deletarRegistrosPorTabela('fiado', 'usuario_id', userId)
    await deletarRegistrosPorTabela('clientes', 'usuario_id', userId)
    await deletarRegistrosPorTabela('alertas', 'usuario_id', userId)
    await deletarRegistrosPorTabela('movimentos_estoque', 'usuario_id', userId)
    await deletarRegistrosPorTabela('produtos', 'usuario_id', userId)
    await deletarRegistrosPorTabela('uso_ia_insights', 'usuario_id', userId)
    await deletarRegistrosPorTabela('membros', 'dono_id', userId)
    await deletarRegistrosPorTabela('perfis', 'id', userId)

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    )

    if (deleteAuthError) {
      console.error('Erro ao deletar auth user:', deleteAuthError)
    }

    console.log(
      `🗑️ [LGPD] Conta ${user.email} deletada em ${new Date().toISOString()}`
    )

    return NextResponse.json({
      success: true,
      message: 'Conta e todos os dados foram permanentemente deletados.',
      deletado_em: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('Erro ao deletar conta LGPD:', error)

    const message = error instanceof Error ? error.message : 'Erro ao deletar conta'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}