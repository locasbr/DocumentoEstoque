import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function respostaErro(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

async function validarAdmin(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const header = req.headers.get('authorization')
  if (!url || !key || !header?.startsWith('Bearer ')) return false

  const token = header.slice(7).trim()
  const auth = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error } = await auth.auth.getUser(token)
  if (error || !user) return false

  const { data, error: perfilError } = await supabaseAdmin
    .from('perfis')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  return !perfilError && data?.is_admin === true
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await validarAdmin(req))) {
    return respostaErro('Acesso administrativo não autorizado.', 403)
  }

  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return respostaErro('ID inválido.', 400)

  try {
    const [perfil, produtos, movimentosCount, alertasCount, membros, vendasHoje, auditoria] =
      await Promise.all([
        supabaseAdmin.from('perfis_completos').select('*').eq('id', id).maybeSingle(),
        supabaseAdmin
          .from('produtos')
          .select('id, nome, quantidade_atual, quantidade_minima, preco_custo, ativo')
          .eq('usuario_id', id),
        supabaseAdmin
          .from('movimentos_estoque')
          .select('id', { count: 'exact', head: true })
          .eq('usuario_id', id),
        supabaseAdmin
          .from('alertas')
          .select('id', { count: 'exact', head: true })
          .eq('usuario_id', id)
          .eq('visualizado', false),
        supabaseAdmin
          .from('membros')
          .select('id, user_id, email, nivel, status, created_at')
          .eq('dono_id', id),
        supabaseAdmin
          .from('vendas')
          .select('id, total, criado_em')
          .eq('usuario_id', id)
          .gte('criado_em', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabaseAdmin
          .from('admin_auditoria')
          .select('id, admin_id, acao, motivo, dados_anteriores, dados_novos, sucesso, erro, criado_em')
          .eq('conta_id', id)
          .order('criado_em', { ascending: false })
          .limit(20),
      ])

    const resultados = [perfil, produtos, movimentosCount, alertasCount, membros, vendasHoje, auditoria]
    const falha = resultados.find((resultado) => resultado.error)
    if (falha?.error) throw falha.error
    if (!perfil.data) return respostaErro('Conta não encontrada.', 404)

    const { data: movimentosRecentes, error: movimentosError } = await supabaseAdmin
      .from('movimentos_estoque')
      .select('id, tipo_movimento, quantidade, criado_em, produto:produto_id(nome)')
      .eq('usuario_id', id)
      .order('criado_em', { ascending: false })
      .limit(8)

    if (movimentosError) throw movimentosError

    const listaProdutos = produtos.data ?? []
    const valorEstoqueCusto = listaProdutos.reduce(
      (total, produto) =>
        total + Math.max(Number(produto.quantidade_atual) || 0, 0) * Math.max(Number(produto.preco_custo) || 0, 0),
      0
    )
    const produtosCriticos = listaProdutos.filter((produto) =>
      produto.ativo !== false &&
      Number(produto.quantidade_minima) > 0 &&
      Number(produto.quantidade_atual) < Number(produto.quantidade_minima)
    ).length

    return NextResponse.json({
      perfil: perfil.data,
      indicadores: {
        total_produtos: listaProdutos.length,
        produtos_criticos: produtosCriticos,
        valor_estoque_custo: valorEstoqueCusto,
        total_movimentos: movimentosCount.count ?? 0,
        alertas_pendentes: alertasCount.count ?? 0,
        usuarios_adicionais: (membros.data ?? []).filter((membro) => membro.nivel === 'funcionario').length,
        vendas_hoje: vendasHoje.data?.length ?? 0,
        valor_vendas_hoje: (vendasHoje.data ?? []).reduce(
          (total, venda) => total + (Number(venda.total) || 0),
          0
        ),
      },
      membros: membros.data ?? [],
      movimentos_recentes: movimentosRecentes ?? [],
      auditoria: auditoria.data ?? [],
    })
  } catch (error) {
    console.error('Erro nos detalhes da conta Admin:', error)
    return respostaErro('Não foi possível carregar os detalhes da conta.', 500)
  }
}
