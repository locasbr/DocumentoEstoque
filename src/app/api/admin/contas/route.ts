import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const PRECOS: Record<string, number> = {
  iniciante: 39.9,
  profissional: 79.9,
  negocio: 149.9,
}

function respostaErro(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

async function obterAdmin(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const authHeader = req.headers.get('authorization')

  if (!url || !key || !authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7).trim()
  if (!token) return null

  const auth = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user }, error } = await auth.auth.getUser(token)
  if (error || !user) return null

  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from('perfis')
    .select('id, is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (perfilError || !perfil?.is_admin) return null
  return user
}

export async function GET(req: NextRequest) {
  const admin = await obterAdmin(req)
  if (!admin) return respostaErro('Acesso administrativo não autorizado.', 403)

  try {
    const { searchParams } = new URL(req.url)
    const busca = normalizar(searchParams.get('busca') || '')
    const status = searchParams.get('status') || 'todos'
    const tipo = searchParams.get('tipo') || 'todos'

    const { data, error } = await supabaseAdmin
      .from('perfis_completos')
      .select(
        'id, nome_negocio, plano, tipo_plano, trial_fim, plano_fim, created_at, email, telefone, cidade, estado, notas_admin, last_sign_in_at'
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    const contas = (data ?? []).filter((conta) => {
      if (status !== 'todos' && conta.plano !== status) return false
      if (tipo !== 'todos' && conta.tipo_plano !== tipo) return false
      if (!busca) return true

      const telefone = String(conta.telefone || '').replace(/\D/g, '')
      const buscaNumeros = busca.replace(/\D/g, '')
      const conteudo = normalizar(
        [conta.nome_negocio, conta.email, conta.cidade, conta.estado, conta.id]
          .filter(Boolean)
          .join(' ')
      )

      return conteudo.includes(busca) || Boolean(buscaNumeros && telefone.includes(buscaNumeros))
    })

    const agora = Date.now()
    const ativas = contas.filter((conta) => conta.plano === 'ativo')
    const receitaEstimada = ativas.reduce(
      (total, conta) => total + (PRECOS[String(conta.tipo_plano)] || 0),
      0
    )
    const trialsExpirando = contas.filter((conta) => {
      if (conta.plano !== 'trial' || !conta.trial_fim) return false
      const diferenca = Math.ceil((new Date(conta.trial_fim).getTime() - agora) / 86_400_000)
      return diferenca >= 0 && diferenca <= 3
    }).length

    return NextResponse.json({
      contas,
      metricas: {
        total_contas: contas.length,
        contas_ativas: ativas.length,
        contas_trial: contas.filter((conta) => conta.plano === 'trial').length,
        contas_encerradas: contas.filter((conta) =>
          ['expirado', 'cancelado', 'inativo', 'inadimplente'].includes(String(conta.plano))
        ).length,
        trials_expirando: trialsExpirando,
        receita_mensal_estimada: receitaEstimada,
        projecao_anual_estimada: receitaEstimada * 12,
        por_plano: {
          iniciante: ativas.filter((conta) => conta.tipo_plano === 'iniciante').length,
          profissional: ativas.filter((conta) => conta.tipo_plano === 'profissional').length,
          negocio: ativas.filter((conta) => conta.tipo_plano === 'negocio').length,
        },
      },
      aviso_financeiro:
        'Valores estimados pelos perfis ativos e preços atuais. Não representam pagamentos confirmados pelo Mercado Pago.',
    })
  } catch (error) {
    console.error('Erro ao listar contas do Admin:', error)
    return respostaErro('Não foi possível carregar as contas.', 500)
  }
}
