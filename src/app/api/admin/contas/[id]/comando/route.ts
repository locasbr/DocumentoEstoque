  import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type Acao =
  | 'estender_trial'
  | 'alterar_plano_local'
  | 'bloquear_acesso_local'
  | 'restaurar_acesso_local'
  | 'atualizar_nota_admin'

interface CorpoComando {
  acao?: unknown
  motivo?: unknown
  tipo_plano?: unknown
  dias?: unknown
  nota?: unknown
}

function respostaErro(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

async function obterAdmin(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const header = req.headers.get('authorization')
  if (!url || !key || !header?.startsWith('Bearer ')) return null

  const token = header.slice(7).trim()
  const auth = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error } = await auth.auth.getUser(token)
  if (error || !user) return null

  const { data, error: perfilError } = await supabaseAdmin
    .from('perfis')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  return !perfilError && data?.is_admin === true ? user : null
}

async function auditar(params: {
  adminId: string
  contaId: string
  acao: Acao
  motivo: string
  anteriores: unknown
  novos: unknown
  sucesso: boolean
  erro?: string
}) {
  const { error } = await supabaseAdmin.from('admin_auditoria').insert({
    admin_id: params.adminId,
    conta_id: params.contaId,
    acao: params.acao,
    motivo: params.motivo,
    dados_anteriores: params.anteriores,
    dados_novos: params.novos,
    sucesso: params.sucesso,
    erro: params.erro || null,
  })
  if (error) console.error('Falha ao gravar auditoria:', error)
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await obterAdmin(req)
  if (!admin) return respostaErro('Acesso administrativo não autorizado.', 403)

  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return respostaErro('ID inválido.', 400)
  if (id === admin.id) return respostaErro('Esta ação não pode ser aplicada à própria conta administrativa.', 400)

  let body: CorpoComando
  try {
    body = (await req.json()) as CorpoComando
  } catch {
    return respostaErro('Corpo da requisição inválido.', 400)
  }

  const acao = String(body.acao || '') as Acao
  const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : ''
  const acoes: Acao[] = [
    'estender_trial',
    'alterar_plano_local',
    'bloquear_acesso_local',
    'restaurar_acesso_local',
    'atualizar_nota_admin',
  ]

  if (!acoes.includes(acao)) return respostaErro('Comando administrativo inválido.', 400)
  if (motivo.length < 5 || motivo.length > 500) {
    return respostaErro('Informe uma justificativa entre 5 e 500 caracteres.', 400)
  }

  const { data: anterior, error: anteriorError } = await supabaseAdmin
    .from('perfis')
    .select('id, plano, tipo_plano, trial_fim, plano_fim, notas_admin')
    .eq('id', id)
    .maybeSingle()

  if (anteriorError) return respostaErro('Não foi possível consultar a conta.', 500)
  if (!anterior) return respostaErro('Conta não encontrada.', 404)

  try {
    const alteracoes: Record<string, unknown> = {}

    if (acao === 'estender_trial') {
      const dias = Number(body.dias)
      if (![7, 15].includes(dias)) return respostaErro('Use 7 ou 15 dias.', 400)
      const atual = anterior.trial_fim ? new Date(anterior.trial_fim) : new Date()
      const base = atual.getTime() > Date.now() ? atual : new Date()
      base.setDate(base.getDate() + dias)
      alteracoes.plano = 'trial'
      alteracoes.trial_fim = base.toISOString()
    }

    if (acao === 'alterar_plano_local') {
      const tipo = String(body.tipo_plano || '')
      if (!['iniciante', 'profissional', 'negocio'].includes(tipo)) {
        return respostaErro('Tipo de plano inválido.', 400)
      }
      alteracoes.plano = 'ativo'
      alteracoes.tipo_plano = tipo
      alteracoes.trial_fim = null
      // Não altera plano_fim nem cobrança. É um override local auditado.
    }

    if (acao === 'bloquear_acesso_local') {
      alteracoes.plano = 'expirado'
    }

    if (acao === 'restaurar_acesso_local') {
      if (!anterior.tipo_plano) {
        return respostaErro('A conta não possui tipo de plano para restauração.', 400)
      }
      alteracoes.plano = 'ativo'
    }

    if (acao === 'atualizar_nota_admin') {
      const nota = typeof body.nota === 'string' ? body.nota.trim() : ''
      if (nota.length > 2000) return respostaErro('A nota deve ter no máximo 2.000 caracteres.', 400)
      alteracoes.notas_admin = nota || null
    }

    const { data: novo, error: updateError } = await supabaseAdmin
      .from('perfis')
      .update(alteracoes)
      .eq('id', id)
      .select('id, plano, tipo_plano, trial_fim, plano_fim, notas_admin')
      .maybeSingle()

    if (updateError) throw updateError
    if (!novo) throw new Error('Nenhuma conta foi alterada.')

    await auditar({
      adminId: admin.id,
      contaId: id,
      acao,
      motivo,
      anteriores: anterior,
      novos: novo,
      sucesso: true,
    })

    return NextResponse.json({
      success: true,
      conta: novo,
      aviso:
        'Comando aplicado somente ao acesso local do EstoqueSystem. Nenhuma cobrança do Mercado Pago foi alterada.',
    })
  } catch (error) {
    console.error('Erro em comando administrativo:', error)
    await auditar({
      adminId: admin.id,
      contaId: id,
      acao,
      motivo,
      anteriores: anterior,
      novos: null,
      sucesso: false,
      erro: 'Falha ao aplicar comando.',
    })
    return respostaErro('Não foi possível aplicar o comando administrativo.', 500)
  }
}
