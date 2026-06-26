'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/contexts/NotificationContext'
import { useMembro } from '@/hooks/useMembro'
import { formatarData, formatarMoeda } from '@/lib/utils'
import {
  Users, Crown, Clock, AlertTriangle, CheckCircle, XCircle,
  Search, RefreshCw, Shield, ChevronDown, ChevronUp, Package,
  BarChart3, ShoppingCart, Calendar, Hash, Store, TrendingUp,
  TrendingDown, MessageCircle, Download, DollarSign, Zap, X,
  ArrowUpDown, Sparkles, Target, Trash2, Mail, Phone, MapPin,
} from 'lucide-react'

interface Perfil {
  id: string
  nome_negocio: string | null
  plano: 'trial' | 'ativo' | 'expirado'
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

interface ModalConfirmacao {
  titulo: string
  descricao: string
  textoBotao: string
  cor: 'red' | 'green' | 'blue'
  onConfirmar: () => void
}

type FiltroPlano = 'todos' | 'trial' | 'ativo' | 'expirado'
type FiltroTipo = 'todos' | 'iniciante' | 'profissional' | 'negocio'
type Ordenacao = 'recente' | 'antigo' | 'nome' | 'receita'

const PRECOS = {
  iniciante: 39.9,
  profissional: 79.9,
  negocio: 149.9,
}

function formatarTelefone(tel: string | null): string {
  if (!tel) return ''
  const nums = tel.replace(/\D/g, '')
  if (nums.length === 11) {
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
  }
  if (nums.length === 10) {
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`
  }
  return tel
}

export default function AdminPage() {
  const { isLoading: loadingMembro } = useMembro()
  const { addNotification } = useNotification()

  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [filtroPlano, setFiltroPlano] = useState<FiltroPlano>('todos')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('recente')
  const [isAdmin, setIsAdmin] = useState(false)
  const [atualizando, setAtualizando] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalConfirmacao | null>(null)

  const [expandido, setExpandido] = useState<string | null>(null)
  const [detalhes, setDetalhes] = useState<Record<string, DetalhesUsuario>>({})
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        const { data: perfil } = await supabase
          .from('perfis')
          .select('is_admin')
          .eq('id', data.session.user.id)
          .single()
        setIsAdmin(perfil?.is_admin === true)
      }
    }
    checkAdmin()
  }, [])

  const fetchPerfis = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('perfis_completos')
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

  const fetchDetalhes = async (userId: string) => {
    if (detalhes[userId]) return
    setCarregandoDetalhes(true)
    try {
      const [produtosRes, movimentosRes, alertasRes, membrosRes] =
        await Promise.all([
          supabase.from('produtos').select('id, nome, quantidade_atual, quantidade_minima, preco_venda').eq('usuario_id', userId),
          supabase.from('movimentos_estoque').select('id, tipo_movimento, quantidade, criado_em, produto:produto_id(nome)').eq('usuario_id', userId).order('criado_em', { ascending: false }).limit(10),
          supabase.from('alertas').select('id').eq('usuario_id', userId).eq('visualizado', false),
          supabase.from('membros').select('id, email, nivel, status').eq('dono_id', userId),
        ])

      const produtos = produtosRes.data ?? []
      const movimentos = movimentosRes.data ?? []
      const alertas = alertasRes.data ?? []
      const membros = membrosRes.data ?? []

      const valorEstoque = produtos.reduce(
        (sum: number, p: any) => sum + (p.preco_venda ?? 0) * (p.quantidade_atual ?? 0), 0
      )
      const produtosCriticos = produtos.filter((p: any) => p.quantidade_atual < p.quantidade_minima).length
      const hoje = new Date().toDateString()
      const vendasHoje = movimentos.filter((m: any) => m.tipo_movimento === 'saida' && new Date(m.criado_em).toDateString() === hoje).length
      const ultimoMov = movimentos[0]?.criado_em ?? null

      setDetalhes((prev) => ({
        ...prev,
        [userId]: {
          totalProdutos: produtos.length,
          totalMovimentos: movimentos.length,
          totalAlertas: alertas.length,
          totalMembros: membros.length,
          valorEstoque, vendasHoje, ultimoAcesso: ultimoMov, produtosCriticos,
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
    if (expandido === userId) setExpandido(null)
    else {
      setExpandido(userId)
      fetchDetalhes(userId)
    }
  }

  const alterarPlano = async (userId: string, novoPlano: 'trial' | 'ativo' | 'expirado', novoTipo?: string) => {
    setAtualizando(userId)
    try {
      const updateData: Record<string, unknown> = { plano: novoPlano }
      if (novoPlano === 'ativo') {
        updateData.trial_fim = null
        if (novoTipo) updateData.tipo_plano = novoTipo
        const fim = new Date()
        fim.setMonth(fim.getMonth() + 1)
        updateData.plano_fim = fim.toISOString()
      }
      if (novoPlano === 'trial') {
        const nova = new Date()
        nova.setDate(nova.getDate() + 15)
        updateData.trial_fim = nova.toISOString()
      }
      const { error } = await supabase.from('perfis').update(updateData).eq('id', userId)
      if (error) throw error
      addNotification(`✅ Plano alterado!`, 'success', 2500)
      fetchPerfis()
    } catch (error) {
      console.error('Erro:', error)
      addNotification('Erro ao alterar plano', 'error')
    } finally {
      setAtualizando(null)
    }
  }

  const estenderTrial = async (userId: string, dias: number) => {
    setAtualizando(userId)
    try {
      const perfil = perfis.find((p) => p.id === userId)
      const baseDate = perfil?.trial_fim ? new Date(perfil.trial_fim) : new Date()
      const inicio = baseDate < new Date() ? new Date() : baseDate
      inicio.setDate(inicio.getDate() + dias)
      const { error } = await supabase.from('perfis').update({ plano: 'trial', trial_fim: inicio.toISOString() }).eq('id', userId)
      if (error) throw error
      addNotification(`⏰ Trial estendido +${dias} dias!`, 'success', 2500)
      fetchPerfis()
    } catch (error) {
      console.error('Erro:', error)
      addNotification('Erro ao estender trial', 'error')
    } finally {
      setAtualizando(null)
    }
  }

  const confirmarAcao = (config: ModalConfirmacao) => setModal(config)

  const abrirWhatsApp = (perfil: Perfil) => {
    const nome = perfil.nome_negocio || 'Cliente'
    const msg = encodeURIComponent(
      `Olá ${nome}! Aqui é o Lucas do EstoqueSystem 👋\n\nVi que você está usando nosso sistema, posso te ajudar com alguma coisa?`
    )
    if (perfil.telefone) {
      const numero = perfil.telefone.replace(/\D/g, '')
      const comDDI = numero.length === 11 || numero.length === 10 ? `55${numero}` : numero
      window.open(`https://wa.me/${comDDI}?text=${msg}`, '_blank')
      addNotification('📱 Abrindo WhatsApp...', 'info', 2000)
    } else {
      navigator.clipboard.writeText(decodeURIComponent(msg))
      addNotification('⚠️ Cliente sem WhatsApp cadastrado. Mensagem copiada!', 'warning', 4000)
    }
  }
  const metricas = useMemo(() => { 
    const ativos = perfis.filter((p) => p.plano === 'ativo')
    const ativosIniciante = ativos.filter((p) => p.tipo_plano === 'iniciante').length
    const ativosProfissional = ativos.filter((p) => p.tipo_plano === 'profissional').length
    const ativosNegocio = ativos.filter((p) => p.tipo_plano === 'negocio').length

    const mrr =
      ativosIniciante * PRECOS.iniciante +
      ativosProfissional * PRECOS.profissional +
      ativosNegocio * PRECOS.negocio

    const arr = mrr * 12
    const totalUsuarios = perfis.length
    const totalTrial = perfis.filter((p) => p.plano === 'trial').length
    const totalExpirados = perfis.filter((p) => p.plano === 'expirado').length

    const totalQueTentou = ativos.length + totalExpirados
    const conversao = totalQueTentou > 0 ? (ativos.length / totalQueTentou) * 100 : 0

    const trialsExpirando = perfis.filter((p) => {
      if (p.plano !== 'trial' || !p.trial_fim) return false
      const fim = new Date(p.trial_fim)
      const diff = Math.ceil((fim.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return diff >= 0 && diff <= 3
    }).length

    const mrrPotencial = mrr + totalTrial * PRECOS.profissional

    return {
      mrr, arr, totalUsuarios,
      totalAtivos: ativos.length,
      totalTrial, totalExpirados,
      ativosIniciante, ativosProfissional, ativosNegocio,
      conversao, trialsExpirando, mrrPotencial,
    }
  }, [perfis])

  const diasRestantes = (trialFim: string | null): number | null => {
    if (!trialFim) return null
    return Math.ceil(
      (new Date(trialFim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  const perfisFiltrados = useMemo(() => {
    let resultado = perfis

    if (filtroPlano !== 'todos') {
      resultado = resultado.filter((p) => p.plano === filtroPlano)
    }
    if (filtroTipo !== 'todos') {
      resultado = resultado.filter((p) => p.tipo_plano === filtroTipo)
    }
    if (filtro.trim()) {
      const busca = filtro.toLowerCase()
      const buscaNumeros = filtro.replace(/\D/g, '')
      resultado = resultado.filter(
        (p) =>
          p.nome_negocio?.toLowerCase().includes(busca) ||
          p.id.toLowerCase().includes(busca) ||
          p.email?.toLowerCase().includes(busca) ||
          (buscaNumeros && p.telefone?.includes(buscaNumeros)) ||
          p.cidade?.toLowerCase().includes(busca)
      )
    }

    return [...resultado].sort((a, b) => {
      if (ordenacao === 'recente') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
      if (ordenacao === 'antigo') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      }
      if (ordenacao === 'nome') {
        return (a.nome_negocio || '').localeCompare(b.nome_negocio || '')
      }
      if (ordenacao === 'receita') {
        const ra = a.plano === 'ativo' ? PRECOS[a.tipo_plano as keyof typeof PRECOS] || 0 : 0
        const rb = b.plano === 'ativo' ? PRECOS[b.tipo_plano as keyof typeof PRECOS] || 0 : 0
        return rb - ra
      }
      return 0
    })
  }, [perfis, filtro, filtroPlano, filtroTipo, ordenacao])

  const exportarCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Cidade', 'Estado', 'ID', 'Plano', 'Tipo', 'Trial Fim', 'Cadastro', 'Receita/mês']
    const linhas = perfisFiltrados.map((p) => {
      const receita = p.plano === 'ativo' ? PRECOS[p.tipo_plano as keyof typeof PRECOS] || 0 : 0
      return [
        p.nome_negocio || 'Sem nome',
        p.email || '-',
        p.telefone || '-',
        p.cidade || '-',
        p.estado || '-',
        p.id,
        p.plano,
        p.tipo_plano || '-',
        p.trial_fim || '-',
        p.created_at || '-',
        receita.toFixed(2),
      ]
    })
    const csv = [headers.join(';'), ...linhas.map(l => l.join(';'))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    addNotification('📥 CSV exportado!', 'success', 2000)
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
      const cor = dias !== null && dias <= 3
        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cor}`}>
          <Clock className="w-3 h-3" /> Trial {dias !== null && `(${dias}d)`}
        </span>
      )
    }
    return <span className="text-xs text-gray-500">{plano}</span>
  }

  const tipoPlanoBadge = (tipoPlano: string | null) => {
    if (!tipoPlano) return null
    const cores: Record<string, string> = {
      iniciante: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      profissional: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      negocio: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cores[tipoPlano] || cores.iniciante}`}>
        {tipoPlano}
      </span>
    )
  }

  if (!loadingMembro && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="w-16 h-16 text-red-400" />
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Acesso restrito</p>
        <p className="text-gray-500">Apenas administradores podem acessar esta página.</p>
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
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Painel Admin</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {metricas.totalUsuarios} usuário(s) · {metricas.totalAtivos} pagante(s)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarCSV} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition text-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button onClick={fetchPerfis} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 text-white font-semibold rounded-lg transition text-sm">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* MRR / ARR / CONVERSÃO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-green-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase opacity-80">MRR</span>
          </div>
          <p className="text-3xl md:text-4xl font-extrabold mb-1">{formatarMoeda(metricas.mrr)}</p>
          <p className="text-xs opacity-90">Receita recorrente mensal</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase opacity-80">ARR</span>
          </div>
          <p className="text-3xl md:text-4xl font-extrabold mb-1">{formatarMoeda(metricas.arr)}</p>
          <p className="text-xs opacity-90">Receita anualizada</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase opacity-80">Conversão</span>
          </div>
          <p className="text-3xl md:text-4xl font-extrabold mb-1">{metricas.conversao.toFixed(1)}%</p>
          <p className="text-xs opacity-90">Trial → Pagante</p>
        </div>
      </div>

      {/* MÉTRICAS DETALHADAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total usuários', value: metricas.totalUsuarios, icon: Users, cor: 'blue' },
          { label: 'Em trial', value: metricas.totalTrial, icon: Clock, cor: 'yellow' },
          { label: 'Ativos pagantes', value: metricas.totalAtivos, icon: CheckCircle, cor: 'green' },
          { label: 'Expirados/Churn', value: metricas.totalExpirados, icon: TrendingDown, cor: 'red' },
        ].map(({ label, value, icon: Icon, cor }) => {
          const cores: Record<string, { bg: string; text: string }> = {
            blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
            yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' },
            green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
            red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
          }
          const c = cores[cor]
          return (
            <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${c.text}`} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          )
        })}
      </div>

      {/* RECEITA POR PLANO */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          Receita por Plano
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">⚡ Iniciante</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {metricas.ativosIniciante} × {formatarMoeda(PRECOS.iniciante)}
            </p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">
              = {formatarMoeda(metricas.ativosIniciante * PRECOS.iniciante)}
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-400 mb-1">⭐ Profissional</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {metricas.ativosProfissional} × {formatarMoeda(PRECOS.profissional)}
            </p>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400 mt-1">
              = {formatarMoeda(metricas.ativosProfissional * PRECOS.profissional)}
            </p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-700 dark:text-purple-400 mb-1">👑 Negócio</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {metricas.ativosNegocio} × {formatarMoeda(PRECOS.negocio)}
            </p>
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-400 mt-1">
              = {formatarMoeda(metricas.ativosNegocio * PRECOS.negocio)}
            </p>
          </div>
        </div>

        {metricas.totalTrial > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Potencial:</strong> Se os {metricas.totalTrial} trials virassem Profissional, MRR seria{' '}
                <strong>{formatarMoeda(metricas.mrrPotencial)}</strong>{' '}
                <span className="text-green-600 font-bold">
                  (+{formatarMoeda(metricas.mrrPotencial - metricas.mrr)})
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ALERTA TRIALS EXPIRANDO */}
      {metricas.trialsExpirando > 0 && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <p className="text-yellow-800 dark:text-yellow-200 text-sm font-semibold flex-1">
            ⚠️ {metricas.trialsExpirando} trial(s) expirando nos próximos 3 dias — hora de fazer follow-up!
          </p>
        </div>
      )}

      {/* FILTROS */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email, telefone, cidade..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {filtro && (
              <button onClick={() => setFiltro('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
              className="appearance-none pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="recente">📅 Mais recentes</option>
              <option value="antigo">📅 Mais antigos</option>
              <option value="nome">🔤 Nome (A-Z)</option>
              <option value="receita">💰 Maior receita</option>
            </select>
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center font-semibold uppercase tracking-wider">Status:</span>
          {([
            { label: 'Todos', value: 'todos' as const },
            { label: 'Ativos', value: 'ativo' as const },
            { label: 'Trial', value: 'trial' as const },
            { label: 'Expirados', value: 'expirado' as const },
          ]).map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFiltroPlano(value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                filtroPlano === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center font-semibold uppercase tracking-wider">Plano:</span>
          {([
            { label: 'Todos', value: 'todos' as const },
            { label: '⚡ Iniciante', value: 'iniciante' as const },
            { label: '⭐ Profissional', value: 'profissional' as const },
            { label: '👑 Negócio', value: 'negocio' as const },
          ]).map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFiltroTipo(value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                filtroTipo === value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE PERFIS */}
      {perfisFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {perfisFiltrados.map((perfil) => {
            const dias = diasRestantes(perfil.trial_fim)
            const isProcessando = atualizando === perfil.id
            const isExpandido = expandido === perfil.id
            const det = detalhes[perfil.id]
            const receita = perfil.plano === 'ativo' ? PRECOS[perfil.tipo_plano as keyof typeof PRECOS] || 0 : 0

            return (
              <div
                key={perfil.id}
                className={`bg-white dark:bg-gray-900 border rounded-xl overflow-hidden transition ${
                  isProcessando ? 'opacity-50 pointer-events-none' : 'border-gray-200 dark:border-gray-800 hover:shadow-md'
                }`}
              >
                <div onClick={() => toggleExpandir(perfil.id)} className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{perfil.nome_negocio || 'Sem nome'}</h3>
                        {planoBadge(perfil.plano, perfil.trial_fim)}
                        {tipoPlanoBadge(perfil.tipo_plano)}
                        {receita > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-bold">
                            {formatarMoeda(receita)}/mês
                          </span>
                        )}
                        {isExpandido ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>

                      <div className="mt-1.5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-1 gap-x-3 text-xs text-gray-600 dark:text-gray-400">
                        {perfil.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{perfil.email}</span>
                          </span>
                        )}
                        {perfil.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" />
                            {formatarTelefone(perfil.telefone)}
                          </span>
                        )}
                        {perfil.cidade && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {perfil.cidade}{perfil.estado && `/${perfil.estado}`}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-0.5 gap-x-3 text-[10px] text-gray-500 dark:text-gray-400">
                        <span className="truncate font-mono">ID: {perfil.id.substring(0, 8)}...</span>
                        {perfil.created_at && <span>📅 Cadastro: {formatarData(perfil.created_at)}</span>}
                        {perfil.last_sign_in_at && <span>🕐 Último login: {formatarData(perfil.last_sign_in_at)}</span>}
                        {perfil.trial_fim && dias !== null && dias >= 0 && (
                          <span className="text-yellow-600 font-semibold">⏰ {dias}d restantes</span>
                        )}
                        {perfil.trial_fim && dias !== null && dias < 0 && (
                          <span className="text-red-500 font-semibold">❌ Expirado há {Math.abs(dias)}d</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => abrirWhatsApp(perfil)}
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 transition flex items-center gap-1"
                        title={perfil.telefone ? 'Abrir WhatsApp' : 'Copiar mensagem'}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>

                      {perfil.plano !== 'ativo' && (
                        <>
                          <button
                            onClick={() => confirmarAcao({
                              titulo: 'Ativar Profissional?',
                              descricao: `Ativar plano Profissional (R$ 79,90/mês) para "${perfil.nome_negocio}"?`,
                              textoBotao: 'Ativar',
                              cor: 'green',
                              onConfirmar: () => alterarPlano(perfil.id, 'ativo', 'profissional'),
                            })}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 transition"
                          >
                            ✅ Ativar
                          </button>
                          <button onClick={() => estenderTrial(perfil.id, 7)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 transition">
                            +7d
                          </button>
                          <button onClick={() => estenderTrial(perfil.id, 15)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 transition">
                            +15d
                          </button>
                        </>
                      )}

                      {perfil.plano === 'ativo' && (
                        <button
                          onClick={() => confirmarAcao({
                            titulo: 'Suspender plano?',
                            descricao: `Tem certeza que deseja suspender o plano de "${perfil.nome_negocio}"?`,
                            textoBotao: 'Suspender',
                            cor: 'red',
                            onConfirmar: () => alterarPlano(perfil.id, 'expirado'),
                          })}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 transition"
                        >
                          ❌ Suspender
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* PAINEL EXPANDIDO */}
                {isExpandido && (
                  <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-6">
                    {carregandoDetalhes && !det ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      </div>
                    ) : det ? (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Hash className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500">ID:</span>
                            <code className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded select-all truncate">{perfil.id}</code>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Store className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500">Negócio:</span>
                            <span className="font-medium text-gray-900 dark:text-white truncate">{perfil.nome_negocio || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500">Email:</span>
                            <a href={`mailto:${perfil.email}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline truncate">{perfil.email || '—'}</a>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500">Telefone:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatarTelefone(perfil.telefone) || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500">Localização:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {perfil.cidade ? `${perfil.cidade}${perfil.estado ? `/${perfil.estado}` : ''}` : '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500">Cadastro:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{perfil.created_at ? formatarData(perfil.created_at) : '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500">Último login:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{perfil.last_sign_in_at ? formatarData(perfil.last_sign_in_at) : 'Nunca'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <BarChart3 className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500">Última atividade:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{det.ultimoAcesso ? formatarData(det.ultimoAcesso) : 'Nenhuma'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: 'Produtos', value: det.totalProdutos, icon: Package, color: 'text-blue-600 dark:text-blue-400' },
                            { label: 'Movimentos', value: det.totalMovimentos, icon: BarChart3, color: 'text-green-600 dark:text-green-400' },
                            { label: 'Vendas hoje', value: det.vendasHoje, icon: ShoppingCart, color: 'text-purple-600 dark:text-purple-400' },
                            { label: 'Valor estoque', value: formatarMoeda(det.valorEstoque), icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400' },
                          ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-4 h-4 ${color}`} />
                                <span className="text-xs text-gray-500">{label}</span>
                              </div>
                              <span className={`text-lg font-bold ${color}`}>{value}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {det.produtosCriticos > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {det.produtosCriticos} produto(s) com estoque crítico
                            </span>
                          )}
                          {det.totalAlertas > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {det.totalAlertas} alerta(s) pendente(s)
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            <Users className="w-3.5 h-3.5" />
                            {det.totalMembros} membro(s) na equipe
                          </span>
                        </div>

                        {perfil.plano === 'ativo' && (
                          <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Alterar tipo de plano:</p>
                            <div className="flex gap-2 flex-wrap">
                              {(['iniciante', 'profissional', 'negocio'] as const).map((tipo) => (
                                <button
                                  key={tipo}
                                  onClick={() => alterarPlano(perfil.id, 'ativo', tipo)}
                                  disabled={perfil.tipo_plano === tipo}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    perfil.tipo_plano === tipo
                                      ? 'bg-blue-600 text-white cursor-default'
                                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  {tipo === 'iniciante' && '⚡'}
                                  {tipo === 'profissional' && '⭐'}
                                  {tipo === 'negocio' && '👑'}
                                  {' '}{tipo} ({formatarMoeda(PRECOS[tipo])})
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {det.movimentosRecentes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Últimos movimentos</h4>
                            <div className="space-y-2">
                              {det.movimentosRecentes.map((mov, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${
                                      mov.tipo === 'entrada'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    }`}>
                                      {mov.tipo === 'entrada' ? '↓' : '↑'}
                                    </span>
                                    <span className="text-gray-700 dark:text-gray-300 truncate">{mov.produto}</span>
                                  </div>
                                  <div className="flex items-center gap-4 shrink-0">
                                    <span className={`font-semibold text-sm ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                      {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                                    </span>
                                    <span className="text-xs text-gray-400">{formatarData(mov.data)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {det.movimentosRecentes.length === 0 && det.totalProdutos === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            👤 Usuário ainda não usou o sistema
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">Erro ao carregar detalhes</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                modal.cor === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                modal.cor === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
              }`}>
                {modal.cor === 'red' ? <Trash2 className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{modal.titulo}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{modal.descricao}</p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition">
                Cancelar
              </button>
              <button
                onClick={() => { modal.onConfirmar(); setModal(null) }}
                className={`flex-1 py-2.5 px-4 text-white font-semibold rounded-xl transition shadow-lg ${
                  modal.cor === 'red' ? 'bg-red-600 hover:bg-red-700' :
                  modal.cor === 'green' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {modal.textoBotao}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}