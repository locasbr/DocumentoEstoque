'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/contexts/NotificationContext'
import { useMembro } from '@/hooks/useMembro'
import { formatarData, formatarMoeda } from '@/lib/utils'
import {
  Users,
  Crown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Shield,
  ChevronDown,
  ChevronUp,
  Package,
  BarChart3,
  ShoppingCart,
  Calendar,
  Hash,
  Store,
  TrendingUp,
} from 'lucide-react'

interface Perfil {
  id: string
  nome_negocio: string | null
  plano: 'trial' | 'ativo' | 'expirado'
  trial_fim: string | null
  created_at: string | null
  email?: string
}

interface DetalhesUsuario {
  totalProdutos: number
  totalMovimentos: number
  totalAlertas: number
  totalMembros: number
  valorEstoque: number
  vendasHoje: number
  ultimoAcesso: string | null
  produtosCriticos: number
  movimentosRecentes: {
    tipo: string
    produto: string
    quantidade: number
    data: string
  }[]
}

type FiltroPlano = 'todos' | 'trial' | 'ativo' | 'expirado'

// ╔══════════════════════════════════════════════════╗
// ║  COLOQUE AQUI O SEU EMAIL DE ADMIN              ║
// ╚══════════════════════════════════════════════════╝
const ADMIN_EMAILS = [
  'seu-email-admin@email.com',
]

export default function AdminPage() {
  const { isLoading: loadingMembro } = useMembro()
  const { addNotification } = useNotification()

  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [filtroPlano, setFiltroPlano] = useState<FiltroPlano>('todos')
  const [isAdmin, setIsAdmin] = useState(false)
  const [atualizando, setAtualizando] = useState<string | null>(null)

  // Expandir detalhes
  const [expandido, setExpandido] = useState<string | null>(null)
  const [detalhes, setDetalhes] = useState<Record<string, DetalhesUsuario>>({})
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        const email = data.session.user.email ?? ''
        setIsAdmin(ADMIN_EMAILS.includes(email))
      }
    }
    checkAdmin()
  }, [])

  const fetchPerfis = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPerfis(data ?? [])
    } catch (error) {
      console.error('Erro ao buscar perfis:', error)
      addNotification('Erro ao carregar usuários', 'error')
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    if (!loadingMembro && isAdmin) {
      fetchPerfis()
    }
  }, [loadingMembro, isAdmin, fetchPerfis])

  // Busca detalhes do usuário ao expandir
  const fetchDetalhes = async (userId: string) => {
    if (detalhes[userId]) return // já carregou

    setCarregandoDetalhes(true)
    try {
      // Busca tudo em paralelo
      const [produtosRes, movimentosRes, alertasRes, membrosRes] =
        await Promise.all([
          supabase
            .from('produtos')
            .select('id, nome, quantidade_atual, quantidade_minima, preco_venda')
            .eq('usuario_id', userId),
          supabase
            .from('movimentos_estoque')
            .select('id, tipo_movimento, quantidade, criado_em, produto:produto_id(nome)')
            .eq('usuario_id', userId)
            .order('criado_em', { ascending: false })
            .limit(10),
          supabase
            .from('alertas')
            .select('id')
            .eq('usuario_id', userId)
            .eq('visualizado', false),
          supabase
            .from('membros')
            .select('id, email, nivel, status')
            .eq('dono_id', userId),
        ])

      const produtos = produtosRes.data ?? []
      const movimentos = movimentosRes.data ?? []
      const alertas = alertasRes.data ?? []
      const membros = membrosRes.data ?? []

      const valorEstoque = produtos.reduce(
  (sum: number, p: any) => sum + (p.preco_venda ?? 0) * (p.quantidade_atual ?? 0),
  0
      )

      const produtosCriticos = produtos.filter(
  (p: any) => p.quantidade_atual < p.quantidade_minima
    ).length

      const hoje = new Date().toDateString()
const vendasHoje = movimentos.filter(
  (m: any) =>
    m.tipo_movimento === 'saida' &&
    new Date(m.criado_em).toDateString() === hoje
).length

      const ultimoMov = movimentos[0]?.criado_em ?? null

      setDetalhes((prev) => ({
        ...prev,
        [userId]: {
          totalProdutos: produtos.length,
          totalMovimentos: movimentos.length,
          totalAlertas: alertas.length,
          totalMembros: membros.length,
          valorEstoque,
          vendasHoje,
          ultimoAcesso: ultimoMov,
          produtosCriticos,
          movimentosRecentes: movimentos.slice(0, 5).map((m: any) => ({
            tipo: m.tipo_movimento,
            produto: m.produto?.nome ?? '—',
            quantidade: m.quantidade,
            data: m.criado_em,
          })),
        },
      }))
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error)
      addNotification('Erro ao carregar detalhes do usuário', 'error')
    } finally {
      setCarregandoDetalhes(false)
    }
  }

  const toggleExpandir = (userId: string) => {
    if (expandido === userId) {
      setExpandido(null)
    } else {
      setExpandido(userId)
      fetchDetalhes(userId)
    }
  }

  // Altera plano
  const alterarPlano = async (
    userId: string,
    novoPlano: 'trial' | 'ativo' | 'expirado'
  ) => {
    setAtualizando(userId)
    try {
      const updateData: Record<string, unknown> = { plano: novoPlano }

      if (novoPlano === 'ativo') {
        updateData.trial_fim = null
      }
      if (novoPlano === 'trial') {
        const novaData = new Date()
        novaData.setDate(novaData.getDate() + 15)
        updateData.trial_fim = novaData.toISOString()
      }

      const { error } = await supabase
        .from('perfis')
        .update(updateData)
        .eq('id', userId)

      if (error) throw error

      addNotification(`Plano alterado para "${novoPlano}"!`, 'success')
      fetchPerfis()
    } catch (error) {
      console.error('Erro ao alterar plano:', error)
      addNotification('Erro ao alterar plano', 'error')
    } finally {
      setAtualizando(null)
    }
  }

  const estenderTrial = async (userId: string, dias: number) => {
    setAtualizando(userId)
    try {
      const perfil = perfis.find((p) => p.id === userId)
      const baseDate = perfil?.trial_fim
        ? new Date(perfil.trial_fim)
        : new Date()

      const inicio = baseDate < new Date() ? new Date() : baseDate
      inicio.setDate(inicio.getDate() + dias)

      const { error } = await supabase
        .from('perfis')
        .update({ plano: 'trial', trial_fim: inicio.toISOString() })
        .eq('id', userId)

      if (error) throw error

      addNotification(`Trial estendido em +${dias} dias!`, 'success')
      fetchPerfis()
    } catch (error) {
      console.error('Erro ao estender trial:', error)
      addNotification('Erro ao estender trial', 'error')
    } finally {
      setAtualizando(null)
    }
  }

  // Métricas
  const totalUsuarios = perfis.length
  const totalAtivos = perfis.filter((p) => p.plano === 'ativo').length
  const totalTrial = perfis.filter((p) => p.plano === 'trial').length
  const totalExpirados = perfis.filter((p) => p.plano === 'expirado').length

  const trialsExpirando = perfis.filter((p) => {
    if (p.plano !== 'trial' || !p.trial_fim) return false
    const fim = new Date(p.trial_fim)
    const diffDias = Math.ceil(
      (fim.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return diffDias >= 0 && diffDias <= 3
  }).length

  // Filtros
  const perfisFiltrados = perfis.filter((p) => {
    if (filtroPlano !== 'todos' && p.plano !== filtroPlano) return false
    if (filtro) {
      const busca = filtro.toLowerCase()
      return (
        p.nome_negocio?.toLowerCase().includes(busca) ||
        p.id.toLowerCase().includes(busca) ||
        p.email?.toLowerCase().includes(busca)
      )
    }
    return true
  })

  const diasRestantes = (trialFim: string | null): number | null => {
    if (!trialFim) return null
    return Math.ceil(
      (new Date(trialFim).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
  }

  const planoBadge = (plano: string, trialFim: string | null) => {
    const dias = diasRestantes(trialFim)
    const trialExpirado = plano === 'trial' && dias !== null && dias < 0

    if (plano === 'ativo') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          <CheckCircle className="w-3 h-3" /> Ativo
        </span>
      )
    }
    if (plano === 'expirado' || trialExpirado) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
          <XCircle className="w-3 h-3" /> Expirado
        </span>
      )
    }
    if (plano === 'trial') {
      const cor =
        dias !== null && dias <= 3
          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cor}`}
        >
          <Clock className="w-3 h-3" /> Trial {dias !== null && `(${dias}d)`}
        </span>
      )
    }
    return <span className="text-xs text-gray-500">{plano}</span>
  }

  // Bloqueio: não é admin
  if (!loadingMembro && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="w-16 h-16 text-red-400" />
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Acesso restrito
        </p>
        <p className="text-gray-500">
          Apenas administradores podem acessar esta página.
        </p>
      </div>
    )
  }

  if (loading || loadingMembro) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Painel Admin
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie assinantes e trials do EstoqueSystem
          </p>
        </div>
        <button
          onClick={fetchPerfis}
          className="btn-secondary flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Usuários',
            value: totalUsuarios,
            icon: Users,
            color: 'bg-blue-50 dark:bg-blue-900/20',
            textColor: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Ativos (pagantes)',
            value: totalAtivos,
            icon: CheckCircle,
            color: 'bg-green-50 dark:bg-green-900/20',
            textColor: 'text-green-600 dark:text-green-400',
          },
          {
            label: 'Em Trial',
            value: totalTrial,
            icon: Clock,
            color: 'bg-yellow-50 dark:bg-yellow-900/20',
            textColor: 'text-yellow-600 dark:text-yellow-400',
          },
          {
            label: 'Expirados',
            value: totalExpirados,
            icon: XCircle,
            color: 'bg-red-50 dark:bg-red-900/20',
            textColor: 'text-red-600 dark:text-red-400',
          },
        ].map(({ label, value, icon: Icon, color, textColor }) => (
          <div key={label} className={`${color} rounded-xl p-4 flex flex-col gap-2`}>
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${textColor}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
            </div>
            <span className={`text-3xl font-bold ${textColor}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Alerta */}
      {trialsExpirando > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">
            ⚠️ {trialsExpirando} usuário(s) com trial expirando nos próximos 3 dias!
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou ID..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(
            [
              { label: 'Todos', value: 'todos' },
              { label: 'Ativos', value: 'ativo' },
              { label: 'Trial', value: 'trial' },
              { label: 'Expirados', value: 'expirado' },
            ] as const
          ).map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFiltroPlano(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroPlano === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {perfisFiltrados.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Nenhum usuário encontrado
        </div>
      ) : (
        <div className="space-y-3">
          {perfisFiltrados.map((perfil) => {
            const dias = diasRestantes(perfil.trial_fim)
            const isProcessando = atualizando === perfil.id
            const isExpandido = expandido === perfil.id
            const det = detalhes[perfil.id]

            return (
              <div
                key={perfil.id}
                className={`bg-white dark:bg-gray-800 border rounded-xl overflow-hidden transition ${
                  isProcessando
                    ? 'opacity-50 pointer-events-none'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Linha principal — clicável */}
                <div
                  onClick={() => toggleExpandir(perfil.id)}
                  className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {perfil.nome_negocio || 'Sem nome'}
                        </h3>
                        {planoBadge(perfil.plano, perfil.trial_fim)}
                        {isExpandido ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="truncate font-mono text-xs">
                          ID: {perfil.id.substring(0, 8)}...
                        </span>
                        {perfil.created_at && (
                          <span>Cadastro: {formatarData(perfil.created_at)}</span>
                        )}
                        {perfil.trial_fim && (
                          <span>
                            Trial até:{' '}
                            {new Date(perfil.trial_fim).toLocaleDateString('pt-BR')}
                            {dias !== null && dias >= 0 && (
                              <span className="ml-1 text-yellow-600">
                                ({dias}d restantes)
                              </span>
                            )}
                            {dias !== null && dias < 0 && (
                              <span className="ml-1 text-red-500">
                                (expirado há {Math.abs(dias)}d)
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div
                      className="flex items-center gap-2 flex-wrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {perfil.plano !== 'ativo' && (
                        <button
                          onClick={() => alterarPlano(perfil.id, 'ativo')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800 transition"
                        >
                          ✅ Ativar
                        </button>
                      )}
                      {perfil.plano === 'ativo' && (
                        <button
                          onClick={() => alterarPlano(perfil.id, 'expirado')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition"
                        >
                          ❌ Suspender
                        </button>
                      )}
                      {perfil.plano !== 'ativo' && (
                        <>
                          <button
                            onClick={() => estenderTrial(perfil.id, 7)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                          >
                            +7 dias
                          </button>
                          <button
                            onClick={() => estenderTrial(perfil.id, 15)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                          >
                            +15 dias
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── PAINEL EXPANDIDO ── */}
                {isExpandido && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 p-4 sm:p-6">
                    {carregandoDetalhes && !det ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      </div>
                    ) : det ? (
                      <div className="space-y-5">
                        {/* Info completa */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-3 text-sm">
                            <Hash className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500">ID completo:</span>
                            <code className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded select-all">
                              {perfil.id}
                            </code>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Store className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500">Negócio:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {perfil.nome_negocio || '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500">Cadastro:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {perfil.created_at
                                ? formatarData(perfil.created_at)
                                : '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500">Última atividade:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {det.ultimoAcesso
                                ? formatarData(det.ultimoAcesso)
                                : 'Nenhuma'}
                            </span>
                          </div>
                        </div>

                        {/* Mini métricas */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            {
                              label: 'Produtos',
                              value: det.totalProdutos,
                              icon: Package,
                              color: 'text-blue-600 dark:text-blue-400',
                            },
                            {
                              label: 'Movimentos',
                              value: det.totalMovimentos,
                              icon: BarChart3,
                              color: 'text-green-600 dark:text-green-400',
                            },
                            {
                              label: 'Vendas hoje',
                              value: det.vendasHoje,
                              icon: ShoppingCart,
                              color: 'text-purple-600 dark:text-purple-400',
                            },
                            {
                              label: 'Valor estoque',
                              value: formatarMoeda(det.valorEstoque),
                              icon: TrendingUp,
                              color: 'text-emerald-600 dark:text-emerald-400',
                            },
                          ].map(({ label, value, icon: Icon, color }) => (
                            <div
                              key={label}
                              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-4 h-4 ${color}`} />
                                <span className="text-xs text-gray-500">
                                  {label}
                                </span>
                              </div>
                              <span className={`text-lg font-bold ${color}`}>
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Alertas rápidos */}
                        <div className="flex flex-wrap gap-3">
                          {det.produtosCriticos > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {det.produtosCriticos} produto(s) com estoque
                              crítico
                            </span>
                          )}
                          {det.totalAlertas > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {det.totalAlertas} alerta(s) pendente(s)
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            <Users className="w-3.5 h-3.5" />
                            {det.totalMembros} membro(s) na equipe
                          </span>
                        </div>

                        {/* Movimentos recentes */}
                        {det.movimentosRecentes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Últimos movimentos
                            </h4>
                            <div className="space-y-2">
                              {det.movimentosRecentes.map((mov, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm"
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                        mov.tipo === 'entrada'
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                      }`}
                                    >
                                      {mov.tipo === 'entrada' ? '↓ Entrada' : '↑ Saída'}
                                    </span>
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {mov.produto}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span
                                      className={`font-semibold ${
                                        mov.tipo === 'entrada'
                                          ? 'text-green-600'
                                          : 'text-red-600'
                                      }`}
                                    >
                                      {mov.tipo === 'entrada' ? '+' : '-'}
                                      {mov.quantidade}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {formatarData(mov.data)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {det.movimentosRecentes.length === 0 &&
                          det.totalProdutos === 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              👤 Usuário ainda não usou o sistema
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        Erro ao carregar detalhes
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Receita */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
        <p className="text-sm text-green-700 dark:text-green-400 font-medium">
          💰 Receita mensal estimada
        </p>
        <p className="text-3xl font-bold text-green-800 dark:text-green-300 mt-1">
          R$ {(totalAtivos * 79.9).toFixed(2).replace('.', ',')}
        </p>
        <p className="text-xs text-green-600 dark:text-green-500 mt-1">
          {totalAtivos} assinante(s) × R$ 79,90/mês
        </p>
      </div>
    </div>
  )
}