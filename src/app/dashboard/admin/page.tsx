'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Command,
  Copy,
  Crown,
  Eye,
  FileClock,
  Filter,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Package,
  RefreshCw,
  Search,
  Store,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'

import { useNotification } from '@/contexts/NotificationContext'
import { supabase } from '@/lib/supabase'
import { formatarData, formatarMoeda } from '@/lib/utils'

type StatusConta =
  | 'todos'
  | 'trial'
  | 'ativo'
  | 'expirado'
  | 'cancelado'
  | 'inativo'
  | 'inadimplente'
  | 'pendente'

type TipoPlano = 'todos' | 'iniciante' | 'profissional' | 'negocio'
type Ordenacao = 'recente' | 'antigo' | 'nome' | 'receita'
type AcaoAdmin =
  | 'estender_trial'
  | 'alterar_plano_local'
  | 'bloquear_acesso_local'
  | 'restaurar_acesso_local'
  | 'atualizar_nota_admin'

interface Conta {
  id: string
  nome_negocio: string | null
  plano: string
  tipo_plano: string | null
  trial_fim: string | null
  plano_fim: string | null
  created_at: string | null
  email: string | null
  telefone: string | null
  cidade: string | null
  estado: string | null
  notas_admin: string | null
  last_sign_in_at: string | null
}

interface Metricas {
  total_contas: number
  contas_ativas: number
  contas_trial: number
  contas_encerradas: number
  trials_expirando: number
  receita_mensal_estimada: number
  projecao_anual_estimada: number
  por_plano: {
    iniciante: number
    profissional: number
    negocio: number
  }
}

interface RespostaContas {
  contas: Conta[]
  metricas: Metricas
  aviso_financeiro: string
}

interface IndicadoresConta {
  total_produtos: number
  produtos_criticos: number
  valor_estoque_custo: number
  total_movimentos: number
  alertas_pendentes: number
  usuarios_adicionais: number
  vendas_hoje: number
  valor_vendas_hoje: number
}

interface Movimento {
  id: string
  tipo_movimento: string
  quantidade: number
  criado_em: string
  produto: { nome: string } | { nome: string }[] | null
}

interface Auditoria {
  id: string
  admin_id: string
  acao: string
  motivo: string
  sucesso: boolean
  erro: string | null
  criado_em: string
}

interface DetalhesConta {
  perfil: Conta
  indicadores: IndicadoresConta
  membros: Array<{
    id: string
    email: string
    nivel: string
    status: string
    created_at: string
  }>
  movimentos_recentes: Movimento[]
  auditoria: Auditoria[]
}

interface ModalComando {
  conta: Conta
  acao: AcaoAdmin
  titulo: string
  descricao: string
  tipoPlano?: Exclude<TipoPlano, 'todos'>
  dias?: 7 | 15
  nota?: string
}

const PRECOS: Record<string, number> = {
  iniciante: 39.9,
  profissional: 79.9,
  negocio: 149.9,
}

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function diasRestantes(data: string | null) {
  if (!data) return null
  const timestamp = new Date(data).getTime()
  if (Number.isNaN(timestamp)) return null
  return Math.ceil((timestamp - Date.now()) / 86_400_000)
}

function nomeProduto(movimento: Movimento) {
  if (Array.isArray(movimento.produto)) {
    return movimento.produto[0]?.nome || 'Produto não identificado'
  }
  return movimento.produto?.nome || 'Produto não identificado'
}

async function obterToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token || null
}

async function lerJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string }
  if (!response.ok) {
    throw new Error(data.error || 'A operação não pôde ser concluída.')
  }
  return data
}

export default function AdminPage() {
  const { addNotification } = useNotification()
  const [contas, setContas] = useState<Conta[]>([])
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [avisoFinanceiro, setAvisoFinanceiro] = useState('')
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<StatusConta>('todos')
  const [tipo, setTipo] = useState<TipoPlano>('todos')
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('recente')
  const [contaSelecionada, setContaSelecionada] = useState<Conta | null>(null)
  const [detalhes, setDetalhes] = useState<DetalhesConta | null>(null)
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)
  const [modal, setModal] = useState<ModalComando | null>(null)
  const [motivo, setMotivo] = useState('')
  const [nota, setNota] = useState('')
  const [processando, setProcessando] = useState(false)
  const [paletaAberta, setPaletaAberta] = useState(false)

  const carregarContas = useCallback(
    async (feedback = false) => {
      feedback ? setAtualizando(true) : setLoading(true)
      setErro(null)

      try {
        const token = await obterToken()
        if (!token) throw new Error('Sessão expirada. Entre novamente.')

        const params = new URLSearchParams()
        if (busca.trim()) params.set('busca', busca.trim())
        if (status !== 'todos') params.set('status', status)
        if (tipo !== 'todos') params.set('tipo', tipo)

        const response = await fetch(`/api/admin/contas?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        const data = await lerJson<RespostaContas>(response)
        setContas(data.contas)
        setMetricas(data.metricas)
        setAvisoFinanceiro(data.aviso_financeiro)

        if (feedback) addNotification('Console atualizado.', 'success', 1800)
      } catch (error) {
        console.error('Erro no Console Admin:', error)
        setErro(error instanceof Error ? error.message : 'Erro ao carregar o Admin.')
      } finally {
        setLoading(false)
        setAtualizando(false)
      }
    },
    [addNotification, busca, status, tipo]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => void carregarContas(), 250)
    return () => window.clearTimeout(timer)
  }, [carregarContas])

  useEffect(() => {
    const atalhos = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletaAberta((atual) => !atual)
      }
      if (event.key === 'Escape') {
        setPaletaAberta(false)
        if (!processando) setModal(null)
      }
    }
    window.addEventListener('keydown', atalhos)
    return () => window.removeEventListener('keydown', atalhos)
  }, [processando])

  const contasOrdenadas = useMemo(() => {
    return [...contas].sort((a, b) => {
      if (ordenacao === 'nome') {
        return (a.nome_negocio || '').localeCompare(b.nome_negocio || '', 'pt-BR')
      }
      if (ordenacao === 'antigo') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      }
      if (ordenacao === 'receita') {
        const valorA = a.plano === 'ativo' ? PRECOS[a.tipo_plano || ''] || 0 : 0
        const valorB = b.plano === 'ativo' ? PRECOS[b.tipo_plano || ''] || 0 : 0
        return valorB - valorA
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  }, [contas, ordenacao])

  const abrirConta = async (conta: Conta) => {
    setContaSelecionada(conta)
    setDetalhes(null)
    setLoadingDetalhes(true)

    try {
      const token = await obterToken()
      if (!token) throw new Error('Sessão expirada.')
      const response = await fetch(`/api/admin/contas/${conta.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      setDetalhes(await lerJson<DetalhesConta>(response))
    } catch (error) {
      addNotification(
        error instanceof Error ? error.message : 'Erro ao carregar detalhes.',
        'error'
      )
    } finally {
      setLoadingDetalhes(false)
    }
  }

  const abrirComando = (config: ModalComando) => {
    setModal(config)
    setMotivo('')
    setNota(config.nota || '')
  }

  const executarComando = async () => {
    if (!modal || processando) return
    if (motivo.trim().length < 5) {
      addNotification('Informe uma justificativa com pelo menos 5 caracteres.', 'warning')
      return
    }

    setProcessando(true)
    try {
      const token = await obterToken()
      if (!token) throw new Error('Sessão expirada.')

      const response = await fetch(
        `/api/admin/contas/${modal.conta.id}/comando`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            acao: modal.acao,
            motivo: motivo.trim(),
            tipo_plano: modal.tipoPlano,
            dias: modal.dias,
            nota: modal.acao === 'atualizar_nota_admin' ? nota : undefined,
          }),
        }
      )

      const data = await lerJson<{ success: boolean; aviso?: string }>(response)
      addNotification(data.aviso || 'Comando aplicado e auditado.', 'success', 4500)
      setModal(null)
      await carregarContas()
      if (contaSelecionada?.id === modal.conta.id) await abrirConta(modal.conta)
    } catch (error) {
      addNotification(
        error instanceof Error ? error.message : 'Erro ao executar comando.',
        'error',
        5000
      )
    } finally {
      setProcessando(false)
    }
  }

  const copiar = async (texto: string, label: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      addNotification(`${label} copiado.`, 'success', 1500)
    } catch {
      addNotification(`Não foi possível copiar ${label.toLowerCase()}.`, 'error')
    }
  }

  const abrirWhatsApp = (conta: Conta) => {
    if (!conta.telefone) {
      addNotification('Esta conta não possui telefone cadastrado.', 'warning')
      return
    }
    const numero = conta.telefone.replace(/\D/g, '')
    const destino = numero.length === 10 || numero.length === 11 ? `55${numero}` : numero
    const mensagem = encodeURIComponent(
      `Olá! Aqui é o Lucas, do EstoqueSystem. Estou entrando em contato para acompanhar o uso da sua conta.`
    )
    window.open(`https://wa.me/${destino}?text=${mensagem}`, '_blank', 'noopener,noreferrer')
  }

  if (loading) return <SkeletonAdmin />

  if (erro) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
        <AlertCircle className="h-8 w-8" />
        <h1 className="mt-3 text-xl font-bold">Console indisponível</h1>
        <p className="mt-1 text-sm">{erro}</p>
        <button
          type="button"
          onClick={() => void carregarContas()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen space-y-6 pb-12">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-indigo-500/10 to-transparent" />

      <header className="overflow-hidden rounded-2xl border border-indigo-200 bg-gray-950 p-6 text-white shadow-xl dark:border-indigo-900 md:p-8">
        <div className="absolute opacity-20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/25">
              <Crown className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-300">
                  Console administrativo
                </p>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  ACESSO PROTEGIDO
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                EstoqueSystem Control
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                Contas, acesso local, operação e auditoria em um único console.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPaletaAberta(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold hover:bg-white/10"
            >
              <Command className="h-4 w-4" /> Comandos
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
            </button>
            <button
              type="button"
              onClick={() => void carregarContas(true)}
              disabled={atualizando}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold hover:bg-indigo-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${atualizando ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
      </header>

      {metricas && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricaCard icon={Store} label="Estabelecimentos" valor={metricas.total_contas} cor="blue" />
          <MetricaCard icon={CheckCircle2} label="Acessos ativos" valor={metricas.contas_ativas} cor="green" />
          <MetricaCard icon={Clock3} label="Em avaliação" valor={metricas.contas_trial} detalhe={`${metricas.trials_expirando} terminando em breve`} cor="amber" />
          <MetricaCard icon={CircleDollarSign} label="Receita mensal estimada" valor={formatarMoeda(metricas.receita_mensal_estimada)} detalhe={`Projeção anual ${formatarMoeda(metricas.projecao_anual_estimada)}`} cor="purple" />
        </section>
      )}

      {avisoFinanceiro && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {avisoFinanceiro}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por negócio, e-mail, telefone, cidade ou ID..."
              className="input-field w-full pl-10 pr-10"
            />
            {busca && (
              <button type="button" onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusConta)} className="input-field min-w-44">
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="trial">Avaliação</option>
            <option value="expirado">Expirados</option>
            <option value="cancelado">Cancelados</option>
            <option value="pendente">Pendentes</option>
            <option value="inadimplente">Não confirmados</option>
          </select>
          <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as Ordenacao)} className="input-field min-w-44">
            <option value="recente">Mais recentes</option>
            <option value="antigo">Mais antigos</option>
            <option value="nome">Nome A a Z</option>
            <option value="receita">Maior estimativa</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
          <Filter className="h-4 w-4 text-gray-400" />
          {(['todos', 'iniciante', 'profissional', 'negocio'] as TipoPlano[]).map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setTipo(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${tipo === item ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}
            >
              {item}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">{contasOrdenadas.length} resultado(s)</span>
        </div>
      </section>

      <section className="space-y-3">
        {contasOrdenadas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 py-14 text-center dark:border-gray-700">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 font-bold text-gray-700 dark:text-gray-300">Nenhuma conta encontrada</p>
          </div>
        ) : (
          contasOrdenadas.map((conta, index) => (
            <ContaCard
              key={conta.id}
              conta={conta}
              index={index}
              onAbrir={() => void abrirConta(conta)}
              onCopiar={copiar}
              onWhatsApp={() => abrirWhatsApp(conta)}
            />
          ))
        )}
      </section>

      {contaSelecionada && (
        <PainelDetalhes
          conta={contaSelecionada}
          detalhes={detalhes}
          loading={loadingDetalhes}
          onFechar={() => {
            setContaSelecionada(null)
            setDetalhes(null)
          }}
          onCopiar={copiar}
          onWhatsApp={() => abrirWhatsApp(contaSelecionada)}
          onComando={abrirComando}
        />
      )}

      {modal && (
        <ModalComandoAdmin
          modal={modal}
          motivo={motivo}
          nota={nota}
          processando={processando}
          onMotivo={setMotivo}
          onNota={setNota}
          onFechar={() => !processando && setModal(null)}
          onConfirmar={() => void executarComando()}
        />
      )}

      {paletaAberta && (
        <PaletaComandos
          contas={contasOrdenadas}
          onFechar={() => setPaletaAberta(false)}
          onAbrir={(conta) => {
            setPaletaAberta(false)
            void abrirConta(conta)
          }}
          onAtualizar={() => {
            setPaletaAberta(false)
            void carregarContas(true)
          }}
          onFiltro={(novoStatus) => {
            setStatus(novoStatus)
            setPaletaAberta(false)
          }}
        />
      )}
    </div>
  )
}

function ContaCard({ conta, index, onAbrir, onCopiar, onWhatsApp }: {
  conta: Conta
  index: number
  onAbrir: () => void
  onCopiar: (texto: string, label: string) => Promise<void>
  onWhatsApp: () => void
}) {
  const dias = diasRestantes(conta.trial_fim)
  return (
    <article
      className="group animate-[fadeIn_.35s_ease-out_both] rounded-2xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-800"
      style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <button type="button" onClick={onAbrir} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-black text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
            {(conta.nome_negocio || conta.email || 'E').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-bold text-gray-900 dark:text-white">{conta.nome_negocio || 'Estabelecimento sem nome'}</h2>
              <StatusBadge status={conta.plano} dias={dias} />
              {conta.tipo_plano && <PlanoBadge tipo={conta.tipo_plano} />}
            </div>
            <p className="mt-1 truncate text-sm text-gray-500">{conta.email || 'E-mail não informado'}</p>
            <p className="mt-1 text-[11px] text-gray-400">
              {conta.cidade ? `${conta.cidade}${conta.estado ? `/${conta.estado}` : ''}` : 'Localização não informada'} · Cadastro {conta.created_at ? formatarData(conta.created_at) : 'sem data'}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:translate-x-1 group-hover:text-indigo-500" />
        </button>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button type="button" onClick={() => void onCopiar(conta.id, 'ID')} className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300" title="Copiar ID">
            <Copy className="h-4 w-4" />
          </button>
          {conta.email && (
            <a href={`mailto:${conta.email}`} className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" title="Enviar e-mail">
              <Mail className="h-4 w-4" />
            </a>
          )}
          <button type="button" onClick={onWhatsApp} className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" title="Abrir WhatsApp">
            <MessageCircle className="h-4 w-4" />
          </button>
          <button type="button" onClick={onAbrir} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white">
            <Eye className="h-3.5 w-3.5" /> Detalhes
          </button>
        </div>
      </div>
    </article>
  )
}

function PainelDetalhes({ conta, detalhes, loading, onFechar, onCopiar, onWhatsApp, onComando }: {
  conta: Conta
  detalhes: DetalhesConta | null
  loading: boolean
  onFechar: () => void
  onCopiar: (texto: string, label: string) => Promise<void>
  onWhatsApp: () => void
  onComando: (config: ModalComando) => void
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onFechar()}>
      <aside className="ml-auto h-full w-full max-w-2xl animate-[slideIn_.25s_ease-out] overflow-y-auto border-l border-gray-200 bg-gray-50 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 p-5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Detalhes da conta</p>
              <h2 className="mt-1 truncate text-2xl font-black">{conta.nome_negocio || 'Sem nome'}</h2>
              <p className="truncate text-sm text-gray-500">{conta.email}</p>
            </div>
            <button type="button" onClick={onFechar} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => void onCopiar(conta.id, 'ID')} className="btn-secondary inline-flex items-center gap-2 text-xs"><Copy className="h-3.5 w-3.5" /> Copiar ID</button>
            <button type="button" onClick={onWhatsApp} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
          ) : detalhes ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniCard icon={Package} label="Produtos" valor={detalhes.indicadores.total_produtos} />
                <MiniCard icon={BarChart3} label="Movimentos" valor={detalhes.indicadores.total_movimentos} />
                <MiniCard icon={Zap} label="Vendas hoje" valor={detalhes.indicadores.vendas_hoje} />
                <MiniCard icon={TrendingUp} label="Vendas hoje R$" valor={formatarMoeda(detalhes.indicadores.valor_vendas_hoje)} />
              </div>

              <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="font-bold">Operação</h3>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <Linha label="Valor do estoque a custo" valor={formatarMoeda(detalhes.indicadores.valor_estoque_custo)} />
                  <Linha label="Produtos críticos" valor={String(detalhes.indicadores.produtos_criticos)} />
                  <Linha label="Alertas pendentes" valor={String(detalhes.indicadores.alertas_pendentes)} />
                  <Linha label="Usuários adicionais" valor={String(detalhes.indicadores.usuarios_adicionais)} />
                </div>
              </section>

              <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
                <div className="flex items-center gap-2"><Lock className="h-5 w-5 text-indigo-600" /><h3 className="font-bold">Central de comandos</h3></div>
                <p className="mt-1 text-xs text-gray-500">Toda ação exige justificativa e entra na auditoria. Não altera cobranças do Mercado Pago.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <ComandoButton label="Estender 7 dias" onClick={() => onComando({ conta, acao: 'estender_trial', dias: 7, titulo: 'Estender avaliação em 7 dias', descricao: 'O prazo local será ampliado e a ação será auditada.' })} />
                  <ComandoButton label="Estender 15 dias" onClick={() => onComando({ conta, acao: 'estender_trial', dias: 15, titulo: 'Estender avaliação em 15 dias', descricao: 'O prazo local será ampliado e a ação será auditada.' })} />
                  {(['iniciante', 'profissional', 'negocio'] as const).map((plano) => (
                    <ComandoButton key={plano} label={`Plano ${plano}`} onClick={() => onComando({ conta, acao: 'alterar_plano_local', tipoPlano: plano, titulo: `Alterar acesso local para ${plano}`, descricao: 'Este comando não muda cobrança, assinatura ou ciclo no Mercado Pago.' })} />
                  ))}
                  {conta.plano === 'ativo' ? (
                    <ComandoButton danger label="Bloquear acesso local" onClick={() => onComando({ conta, acao: 'bloquear_acesso_local', titulo: 'Bloquear acesso local', descricao: 'A conta perderá o acesso no EstoqueSystem. A cobrança externa não será cancelada.' })} />
                  ) : (
                    <ComandoButton label="Restaurar acesso local" onClick={() => onComando({ conta, acao: 'restaurar_acesso_local', titulo: 'Restaurar acesso local', descricao: 'A conta voltará ao tipo de plano registrado anteriormente.' })} />
                  )}
                  <ComandoButton label="Editar nota administrativa" onClick={() => onComando({ conta, acao: 'atualizar_nota_admin', titulo: 'Atualizar nota administrativa', descricao: 'A nota ficará disponível somente no console.', nota: detalhes.perfil.notas_admin || '' })} />
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-2"><Activity className="h-5 w-5 text-emerald-600" /><h3 className="font-bold">Movimentos recentes</h3></div>
                <div className="mt-3 space-y-2">
                  {detalhes.movimentos_recentes.length === 0 ? <p className="text-sm text-gray-500">Nenhuma movimentação.</p> : detalhes.movimentos_recentes.map((movimento) => (
                    <div key={movimento.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800/60">
                      <div className="min-w-0"><p className="truncate font-semibold">{nomeProduto(movimento)}</p><p className="text-xs text-gray-400">{formatarData(movimento.criado_em)}</p></div>
                      <span className="shrink-0 font-bold">{movimento.tipo_movimento} · {movimento.quantidade}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-2"><FileClock className="h-5 w-5 text-purple-600" /><h3 className="font-bold">Auditoria administrativa</h3></div>
                <div className="mt-3 space-y-2">
                  {detalhes.auditoria.length === 0 ? <p className="text-sm text-gray-500">Nenhum comando registrado.</p> : detalhes.auditoria.map((item) => (
                    <div key={item.id} className="rounded-lg border border-gray-100 p-3 text-sm dark:border-gray-800">
                      <div className="flex items-center justify-between gap-2"><span className="font-bold">{item.acao.replace(/_/g, ' ')}</span><span className={item.sucesso ? 'text-emerald-600' : 'text-red-600'}>{item.sucesso ? 'Sucesso' : 'Falha'}</span></div>
                      <p className="mt-1 text-gray-500">{item.motivo}</p>
                      <p className="mt-1 text-[11px] text-gray-400">{formatarData(item.criado_em)}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <p className="text-sm text-gray-500">Não foi possível carregar os detalhes.</p>
          )}
        </div>
      </aside>
    </div>
  )
}

function ModalComandoAdmin({ modal, motivo, nota, processando, onMotivo, onNota, onFechar, onConfirmar }: {
  modal: ModalComando
  motivo: string
  nota: string
  processando: boolean
  onMotivo: (valor: string) => void
  onNota: (valor: string) => void
  onFechar: () => void
  onConfirmar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Comando auditado</p><h2 className="mt-1 text-xl font-black">{modal.titulo}</h2><p className="mt-2 text-sm text-gray-500">{modal.descricao}</p></div><button type="button" onClick={onFechar} disabled={processando}><X className="h-5 w-5 text-gray-400" /></button></div>
        {modal.acao === 'atualizar_nota_admin' && <textarea value={nota} onChange={(e) => onNota(e.target.value)} maxLength={2000} rows={4} className="input-field mt-5 w-full resize-none" placeholder="Nota administrativa..." />}
        <label className="mt-5 block text-sm font-bold">Justificativa obrigatória</label>
        <textarea value={motivo} onChange={(e) => onMotivo(e.target.value)} maxLength={500} rows={3} className="input-field mt-2 w-full resize-none" placeholder="Explique por que este comando está sendo executado..." />
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">Esta ação modifica apenas o acesso local do EstoqueSystem. Não altera cobranças no Mercado Pago.</div>
        <div className="mt-5 flex gap-3"><button type="button" onClick={onFechar} disabled={processando} className="btn-secondary flex-1">Cancelar</button><button type="button" onClick={onConfirmar} disabled={processando || motivo.trim().length < 5} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{processando && <Loader2 className="h-4 w-4 animate-spin" />}Executar comando</button></div>
      </div>
    </div>
  )
}

function PaletaComandos({ contas, onFechar, onAbrir, onAtualizar, onFiltro }: { contas: Conta[]; onFechar: () => void; onAbrir: (conta: Conta) => void; onAtualizar: () => void; onFiltro: (status: StatusConta) => void }) {
  const [termo, setTermo] = useState('')
  const filtradas = contas.filter((conta) => normalizar(`${conta.nome_negocio} ${conta.email} ${conta.id}`).includes(normalizar(termo))).slice(0, 6)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[10vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-700 bg-gray-950 text-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-gray-800 px-4"><Search className="h-5 w-5 text-gray-500" /><input autoFocus value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar conta ou executar comando..." className="w-full bg-transparent py-4 outline-none" /><button onClick={onFechar}><X className="h-5 w-5 text-gray-500" /></button></div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!termo && <><PaletaItem icon={RefreshCw} label="Atualizar console" onClick={onAtualizar} /><PaletaItem icon={CheckCircle2} label="Mostrar contas ativas" onClick={() => onFiltro('ativo')} /><PaletaItem icon={Clock3} label="Mostrar avaliações" onClick={() => onFiltro('trial')} /><PaletaItem icon={AlertTriangle} label="Mostrar contas expiradas" onClick={() => onFiltro('expirado')} /></>}
          {filtradas.map((conta) => <PaletaItem key={conta.id} icon={Store} label={conta.nome_negocio || 'Sem nome'} detalhe={conta.email || conta.id} onClick={() => onAbrir(conta)} />)}
        </div>
      </div>
    </div>
  )
}

function PaletaItem({ icon: Icon, label, detalhe, onClick }: { icon: typeof Store; label: string; detalhe?: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-white/10"><Icon className="h-5 w-5 text-indigo-400" /><span className="min-w-0 flex-1"><span className="block font-semibold">{label}</span>{detalhe && <span className="block truncate text-xs text-gray-500">{detalhe}</span>}</span><ChevronRight className="h-4 w-4 text-gray-600" /></button> }
function ComandoButton({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) { return <button type="button" onClick={onClick} className={`rounded-lg px-3 py-2.5 text-left text-xs font-bold transition ${danger ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-gray-900 dark:text-indigo-300'}`}>{label}</button> }
function Linha({ label, valor }: { label: string; valor: string }) { return <div className="flex justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/60"><span className="text-gray-500">{label}</span><strong>{valor}</strong></div> }
function MiniCard({ icon: Icon, label, valor }: { icon: typeof Package; label: string; valor: string | number }) { return <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"><Icon className="h-4 w-4 text-indigo-600" /><p className="mt-2 text-[10px] uppercase text-gray-400">{label}</p><p className="mt-0.5 font-black">{valor}</p></div> }
function PlanoBadge({ tipo }: { tipo: string }) { const cores: Record<string, string> = { iniciante: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', profissional: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', negocio: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' }; return <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${cores[tipo] || cores.iniciante}`}>{tipo}</span> }
function StatusBadge({ status, dias }: { status: string; dias: number | null }) { const mapa: Record<string, string> = { ativo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', expirado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', cancelado: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', inadimplente: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' }; return <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${mapa[status] || mapa.cancelado}`}>{status === 'trial' && dias !== null ? `trial ${dias}d` : status}</span> }
function MetricaCard({ icon: Icon, label, valor, detalhe, cor }: { icon: typeof Store; label: string; valor: string | number; detalhe?: string; cor: 'blue' | 'green' | 'amber' | 'purple' }) { const estilos = { blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30', green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30', amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30', purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' }; return <article className="animate-[fadeIn_.4s_ease-out_both] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${estilos[cor]}`}><Icon className="h-5 w-5" /></div><p className="mt-4 text-xs text-gray-500">{label}</p><p className="mt-1 text-2xl font-black">{valor}</p>{detalhe && <p className="mt-1 text-[11px] text-gray-400">{detalhe}</p>}</article> }
function SkeletonAdmin() { return <div className="space-y-5 animate-pulse"><div className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-800" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((i) => <div key={i} className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-800" />)}</div><div className="h-20 rounded-2xl bg-gray-200 dark:bg-gray-800" />{[1,2,3].map((i) => <div key={i} className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800" />)}</div> }
