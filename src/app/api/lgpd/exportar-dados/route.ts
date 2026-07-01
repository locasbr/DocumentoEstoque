import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type QueryResult<T> = {
  data: T | null
  error: { message: string } | null
}

export async function GET(req: NextRequest) {
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

    const [perfil, produtos, movimentos, alertas, clientes, fiado, vendas, membros] =
      (await Promise.all([
        supabaseAdmin.from('perfis').select('*').eq('id', user.id).maybeSingle(),
        supabaseAdmin.from('produtos').select('*').eq('usuario_id', user.id),
        supabaseAdmin
          .from('movimentos_estoque')
          .select('*')
          .eq('usuario_id', user.id),
        supabaseAdmin.from('alertas').select('*').eq('usuario_id', user.id),
        supabaseAdmin.from('clientes').select('*').eq('usuario_id', user.id),
        supabaseAdmin.from('fiado').select('*').eq('usuario_id', user.id),
        supabaseAdmin.from('vendas').select('*').eq('usuario_id', user.id),
        supabaseAdmin.from('membros').select('*').eq('dono_id', user.id),
      ])) as [
        QueryResult<Record<string, unknown>>,
        QueryResult<Record<string, unknown>[]>,
        QueryResult<Record<string, unknown>[]>,
        QueryResult<Record<string, unknown>[]>,
        QueryResult<Record<string, unknown>[]>,
        QueryResult<Record<string, unknown>[]>,
        QueryResult<Record<string, unknown>[]>,
        QueryResult<Record<string, unknown>[]>,
      ]

    const queryErrors = [
      perfil.error,
      produtos.error,
      movimentos.error,
      alertas.error,
      clientes.error,
      fiado.error,
      vendas.error,
      membros.error,
    ].filter(Boolean)

    if (queryErrors.length > 0) {
      throw new Error(
        `Erro ao consultar dados para exportação: ${queryErrors
          .map((item) => item?.message)
          .join(' | ')}`
      )
    }

    const dadosExportados = {
      _metadata: {
        exportado_em: new Date().toISOString(),
        usuario_id: user.id,
        email: user.email,
        formato: 'LGPD Art. 18, V - Portabilidade de dados',
        sistema: 'EstoqueSystem',
        versao: '1.0',
      },
      conta: {
        id: user.id,
        email: user.email,
        criado_em: user.created_at,
        ultimo_login: user.last_sign_in_at,
      },
      perfil: perfil.data,
      produtos: produtos.data || [],
      movimentos_estoque: movimentos.data || [],
      alertas: alertas.data || [],
      clientes: clientes.data || [],
      registros_fiado: fiado.data || [],
      vendas: vendas.data || [],
      membros_equipe: membros.data || [],
      totais: {
        produtos: produtos.data?.length || 0,
        movimentos: movimentos.data?.length || 0,
        clientes: clientes.data?.length || 0,
        vendas: vendas.data?.length || 0,
        membros: membros.data?.length || 0,
      },
    }

    const nomeArquivo = `meus-dados-estoquesystem-${new Date()
      .toISOString()
      .split('T')[0]}.json`

    return new NextResponse(JSON.stringify(dadosExportados, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: unknown) {
    console.error('Erro ao exportar dados LGPD:', error)

    const message = error instanceof Error ? error.message : 'Erro ao exportar dados'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}