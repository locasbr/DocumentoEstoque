import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status })
}

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !publishableKey) {
    console.error('Configuração do Supabase ausente na exportação.')
    return erro('Configuração interna indisponível.', 500)
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return erro('Não autenticado.', 401)
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) return erro('Token ausente.', 401)

  const supabaseAuth = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser(token)

  if (authError || !user) return erro('Token inválido ou expirado.', 401)

  try {
    const { data: vinculos, error: vinculosError } = await supabaseAdmin
      .from('membros')
      .select('id, nivel, dono_id, status')
      .eq('user_id', user.id)

    if (vinculosError) throw vinculosError

    const ehFuncionario = (vinculos ?? []).some(
      (vinculo) =>
        vinculo.nivel === 'funcionario' && vinculo.status !== 'inativo'
    )

    if (ehFuncionario) {
      return erro(
        'A exportação dos dados do estabelecimento está disponível somente para o proprietário.',
        403
      )
    }

    const donoId = user.id

    const [perfil, produtos, movimentos, alertas, clientes, fiado, vendas, membros] =
      await Promise.all([
        supabaseAdmin.from('perfis').select('*').eq('id', donoId).maybeSingle(),
        supabaseAdmin.from('produtos').select('*').eq('usuario_id', donoId),
        supabaseAdmin
          .from('movimentos_estoque')
          .select('*')
          .eq('usuario_id', donoId),
        supabaseAdmin.from('alertas').select('*').eq('usuario_id', donoId),
        supabaseAdmin.from('clientes').select('*').eq('usuario_id', donoId),
        supabaseAdmin.from('fiado').select('*').eq('usuario_id', donoId),
        supabaseAdmin.from('vendas').select('*').eq('usuario_id', donoId),
        supabaseAdmin
          .from('membros')
          .select('id, dono_id, user_id, email, nivel, status, created_at')
          .eq('dono_id', donoId),
      ])

    const consultas = {
      perfil,
      produtos,
      movimentos,
      alertas,
      clientes,
      fiado,
      vendas,
      membros,
    }

    for (const [nome, resultado] of Object.entries(consultas)) {
      if (resultado.error) {
        console.error(`Erro na exportação de ${nome}:`, resultado.error)
        throw new Error(`Falha ao consultar ${nome}.`)
      }
    }

    if (!perfil.data) {
      return erro('Perfil do proprietário não encontrado.', 404)
    }

    const vendaIds = (vendas.data ?? []).map((venda) => venda.id)
    let itensVenda: Record<string, unknown>[] = []

    if (vendaIds.length > 0) {
      const { data, error: itensError } = await supabaseAdmin
        .from('itens_venda')
        .select('*')
        .in('venda_id', vendaIds)

      if (itensError) {
        console.error('Erro ao consultar itens_venda:', itensError)
        throw new Error('Falha ao consultar itens das vendas.')
      }

      itensVenda = (data as Record<string, unknown>[] | null) ?? []
    }

    const dadosExportados = {
      _metadata: {
        exportado_em: new Date().toISOString(),
        proprietario_id: donoId,
        finalidade: 'Cópia dos dados associados ao estabelecimento',
        sistema: 'EstoqueSystem',
        aviso:
          'Este arquivo pode conter dados pessoais de clientes e informações comerciais. Armazene-o em local seguro.',
      },
      conta: {
        id: user.id,
        email: user.email,
        criado_em: user.created_at,
        ultimo_login: user.last_sign_in_at,
      },
      perfil: perfil.data,
      produtos: produtos.data ?? [],
      movimentos_estoque: movimentos.data ?? [],
      alertas: alertas.data ?? [],
      clientes: clientes.data ?? [],
      registros_fiado: fiado.data ?? [],
      vendas: vendas.data ?? [],
      itens_venda: itensVenda,
      membros_equipe: membros.data ?? [],
      totais: {
        produtos: produtos.data?.length ?? 0,
        movimentos: movimentos.data?.length ?? 0,
        alertas: alertas.data?.length ?? 0,
        clientes: clientes.data?.length ?? 0,
        registros_fiado: fiado.data?.length ?? 0,
        vendas: vendas.data?.length ?? 0,
        itens_venda: itensVenda.length,
        membros: membros.data?.length ?? 0,
      },
    }

    const dataArquivo = new Date().toISOString().slice(0, 10)

    return new NextResponse(JSON.stringify(dadosExportados, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="dados-estoquesystem-${dataArquivo}.json"`,
        'Cache-Control': 'no-store, max-age=0',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: unknown) {
    console.error('Erro ao exportar dados:', error)
    return erro('Não foi possível gerar a exportação dos dados.', 500)
  }
}
