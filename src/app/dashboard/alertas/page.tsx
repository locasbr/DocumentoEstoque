'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Alerta } from '@/lib/types'
import {
  AlertCircle,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Search,
  ArrowUpDown,
  Radio,
  Package,
  Sparkles,
  X,
  Bell,
  TrendingDown,
  PackageCheck,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { formatarData } from '@/lib/utils'
import { useNotification } from '@/contexts/NotificationContext'

type Filtro = 'todos' | 'nao_visualizados' | 'visualizados'
type Ordenacao = 'recente' | 'antigo' | 'urgencia'

// ════════════════════════════════════════════════════
// 🎨 SKELETON LOADER
// ════════════════════════════════════════════════════
function SkeletonAlerta() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        </div>
        <div className="w-20 h-8 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════
// 🗑️ MODAL DE CONFIRMAÇÃO CUSTOM
// ════════════════════════════════════════════════════
interface ModalConfirmacao {
  titulo: string
  descricao: string
  textoBotao: string
  cor: 'red' | 'green'
  onConfirmar: () => void
}

function ModalConfirmacao({
  modal,
  onFechar,
}: {
  modal: ModalConfirmacao | null
  onFechar: () => void
}) {
  if (!modal) return null

  const corBotao =
    modal.cor === 'red'
      ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
      : 'bg-green-600 hover:bg-green-700 shadow-green-600/30'

  const corIcon =
    modal.cor === 'red'
      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
      : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onFechar}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${corIcon}`}
          >
            {modal.cor === 'red' ? (
              <Trash2 className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {modal.titulo}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {modal.descricao}
            </p>
          </div>
          <button
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              modal.onConfirmar()
              onFechar()
            }}
            className={`flex-1 py-2.5 px-4 text-white font-semibold rounded-xl transition shadow-lg ${corBotao}`}
          >
            {modal.textoBotao}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  )
}

// ════════════════════════════════════════════════════
// 📊 KPI CARD
// ════════════════════════════════════════════════════
function KPICard({
  label,
  value,
  icon: Icon,
  cor,
  destaque,
}: {
  label: string
  value: number
  icon: typeof Bell
  cor: 'blue' | 'red' | 'yellow' | 'green'
  destaque?: boolean
}) {
  const cores = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
    },
  }
  const c = cores[cor]

  return (
    <div
      className={`bg-white dark:bg-gray-900 border rounded-xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${
        destaque ? c.border : 'border-gray-200 dark:border-gray-800'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${c.text}`} />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════
// 🎯 COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════
export default function AlertasPage() {
  const { addNotification } = useNotification()

  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('nao_visualizados')
  const [busca, setBusca] = useState('')
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('recente')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalConfirmacao | null>(null)
  const [processando, setProcessando] = useState(false)
  const [novoAlertaPiscando, setNovoAlertaPiscando] = useState(false)

  // ────────────────────────────────────────────────
  // 📡 FETCH + REALTIME
  // ────────────────────────────────────────────────
  const fetchAlertas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('alertas')
        .select('*, produto:produto_id(*)')
        .order('criado_em', { ascending: false })

      if (!error && data) {
        setAlertas(data)
      }
    } catch (error) {
      console.error('Erro ao buscar alertas:', error)
      addNotification('Erro ao carregar alertas', 'error')
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    fetchAlertas()

    const subscription = supabase
      .channel('alertas')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alertas' },
        (payload) => {
          fetchAlertas()
          // Pisca o indicador "Ao vivo" pra mostrar que chegou novo
          if (payload.eventType === 'INSERT') {
            setNovoAlertaPiscando(true)
            setTimeout(() => setNovoAlertaPiscando(false), 2000)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchAlertas])

  // ────────────────────────────────────────────────
  // 🔢 STATS
  // ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = alertas.length
    const naoVistos = alertas.filter((a) => !a.visualizado)
    const criticos = naoVistos.filter((a) => a.tipo_alerta === 'estoque_critico').length
    const baixos = naoVistos.filter((a) => a.tipo_alerta === 'estoque_baixo').length
    return {
      total,
      naoVistos: naoVistos.length,
      criticos,
      baixos,
    }
  }, [alertas])

  // ────────────────────────────────────────────────
  // 🔍 FILTROS + BUSCA + ORDENAÇÃO
  // ────────────────────────────────────────────────
  const alertasFiltrados = useMemo(() => {
    let resultado = alertas

    // Filtro de status
    if (filtro === 'nao_visualizados') {
      resultado = resultado.filter((a) => !a.visualizado)
    } else if (filtro === 'visualizados') {
      resultado = resultado.filter((a) => a.visualizado)
    }

    // Busca por nome
    if (busca.trim()) {
      const termo = busca.toLowerCase()
      resultado = resultado.filter((a) =>
        a.produto?.nome?.toLowerCase().includes(termo)
      )
    }

    // Ordenação
    resultado = [...resultado].sort((a, b) => {
      if (ordenacao === 'antigo') {
        return new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
      }
      if (ordenacao === 'urgencia') {
        // Críticos primeiro
        if (a.tipo_alerta === b.tipo_alerta) {
          return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
        }
        return a.tipo_alerta === 'estoque_critico' ? -1 : 1
      }
      // recente (default)
      return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
    })

    return resultado
  }, [alertas, filtro, busca, ordenacao])

  // ────────────────────────────────────────────────
  // ✅ AÇÕES
  // ────────────────────────────────────────────────
  const handleMarcarComoVisto = async (id: string) => {
    setProcessando(true)
    try {
      const { error } = await supabase
        .from('alertas')
        .update({ visualizado: true })
        .eq('id', id)

      if (!error) {
        addNotification('✅ Marcado como visualizado', 'success', 2000)
        fetchAlertas()
      } else {
        addNotification('Erro ao atualizar', 'error')
      }
    } catch {
      addNotification('Erro ao atualizar', 'error')
    } finally {
      setProcessando(false)
    }
  }

  const handleDeletar = (id: string, nome: string) => {
    setModal({
      titulo: 'Deletar alerta?',
      descricao: `O alerta de "${nome}" será removido permanentemente. Essa ação não pode ser desfeita.`,
      textoBotao: 'Deletar',
      cor: 'red',
      onConfirmar: async () => {
        setProcessando(true)
        try {
          const { error } = await supabase.from('alertas').delete().eq('id', id)
          if (!error) {
            addNotification('🗑️ Alerta removido', 'success', 2000)
            fetchAlertas()
          } else {
            addNotification('Erro ao deletar', 'error')
          }
        } catch {
          addNotification('Erro ao deletar', 'error')
        } finally {
          setProcessando(false)
        }
      },
    })
  }

  const handleMarcarTodosComoVistos = () => {
    const naoVistos = alertas.filter((a) => !a.visualizado)
    if (naoVistos.length === 0) {
      addNotification('Nada pra marcar', 'info', 2000)
      return
    }

    setModal({
      titulo: `Marcar ${naoVistos.length} como lidos?`,
      descricao: `Todos os alertas não visualizados serão marcados como lidos.`,
      textoBotao: 'Marcar todos',
      cor: 'green',
      onConfirmar: async () => {
        setProcessando(true)
        try {
          const ids = naoVistos.map((a) => a.id)
          const { error } = await supabase
            .from('alertas')
            .update({ visualizado: true })
            .in('id', ids)

          if (!error) {
            addNotification(
              `✅ ${naoVistos.length} alerta(s) marcado(s) como lido(s)`,
              'success',
              3000
            )
            fetchAlertas()
          } else {
            addNotification('Erro ao marcar', 'error')
          }
        } catch {
          addNotification('Erro ao marcar', 'error')
        } finally {
          setProcessando(false)
        }
      },
    })
  }

  // ────────────────────────────────────────────────
  // ☑️ SELEÇÃO MÚLTIPLA
  // ────────────────────────────────────────────────
  const toggleSelecao = (id: string) => {
    const novo = new Set(selecionados)
    if (novo.has(id)) novo.delete(id)
    else novo.add(id)
    setSelecionados(novo)
  }

  const toggleSelecionarTodos = () => {
    if (selecionados.size === alertasFiltrados.length) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(alertasFiltrados.map((a) => a.id)))
    }
  }

  const handleMarcarSelecionados = () => {
    if (selecionados.size === 0) return

    setModal({
      titulo: `Marcar ${selecionados.size} como lidos?`,
      descricao: `Os alertas selecionados serão marcados como visualizados.`,
      textoBotao: 'Marcar',
      cor: 'green',
      onConfirmar: async () => {
        setProcessando(true)
        try {
          const { error } = await supabase
            .from('alertas')
            .update({ visualizado: true })
            .in('id', Array.from(selecionados))

          if (!error) {
            addNotification(`✅ ${selecionados.size} marcado(s)`, 'success', 2000)
            setSelecionados(new Set())
            fetchAlertas()
          }
        } catch {
          addNotification('Erro ao marcar', 'error')
        } finally {
          setProcessando(false)
        }
      },
    })
  }

  const handleDeletarSelecionados = () => {
    if (selecionados.size === 0) return

    setModal({
      titulo: `Deletar ${selecionados.size} alerta(s)?`,
      descricao: `Os alertas selecionados serão removidos permanentemente. Essa ação não pode ser desfeita.`,
      textoBotao: 'Deletar todos',
      cor: 'red',
      onConfirmar: async () => {
        setProcessando(true)
        try {
          const { error } = await supabase
            .from('alertas')
            .delete()
            .in('id', Array.from(selecionados))

          if (!error) {
            addNotification(`🗑️ ${selecionados.size} removido(s)`, 'success', 2000)
            setSelecionados(new Set())
            fetchAlertas()
          }
        } catch {
          addNotification('Erro ao deletar', 'error')
        } finally {
          setProcessando(false)
        }
      },
    })
  }

  // ────────────────────────────────────────────────
  // 🎨 RENDER
  // ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ══════════ HEADER ══════════ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Alertas de Estoque
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  novoAlertaPiscando
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 scale-110'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                }`}
              >
                <Radio
                  className={`w-2.5 h-2.5 ${
                    novoAlertaPiscando ? 'animate-pulse' : ''
                  }`}
                />
                {novoAlertaPiscando ? 'Novo!' : 'Ao vivo'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Monitore produtos com estoque baixo ou crítico em tempo real
            </p>
          </div>
        </div>

        {stats.naoVistos > 0 && (
          <button
            onClick={handleMarcarTodosComoVistos}
            disabled={processando}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 text-white font-semibold rounded-lg transition text-sm disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            Marcar todos como lidos
          </button>
        )}
      </div>

      {/* ══════════ KPIs ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total" value={stats.total} icon={Bell} cor="blue" />
        <KPICard
          label="Não vistos"
          value={stats.naoVistos}
          icon={Sparkles}
          cor="yellow"
          destaque={stats.naoVistos > 0}
        />
        <KPICard
          label="Críticos"
          value={stats.criticos}
          icon={AlertCircle}
          cor="red"
          destaque={stats.criticos > 0}
        />
        <KPICard
          label="Baixo estoque"
          value={stats.baixos}
          icon={TrendingDown}
          cor="yellow"
        />
      </div>

      {/* ══════════ TOOLBAR ══════════ */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome do produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto">
          {[
            { id: 'nao_visualizados' as const, label: 'Não vistos', count: stats.naoVistos },
            { id: 'todos' as const, label: 'Todos', count: stats.total },
            { id: 'visualizados' as const, label: 'Vistos', count: stats.total - stats.naoVistos },
          ].map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setFiltro(id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                filtro === id
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filtro === id
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Ordenação */}
        <div className="relative">
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
            className="appearance-none pl-9 pr-8 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
          >
            <option value="recente">Mais recentes</option>
            <option value="antigo">Mais antigos</option>
            <option value="urgencia">Por urgência</option>
          </select>
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* ══════════ BULK ACTIONS ══════════ */}
      {selecionados.size > 0 && (
        <div className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl animate-slideDown">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-blue-900 dark:text-blue-100">
              {selecionados.size} selecionado(s)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarcarSelecionados}
              disabled={processando}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Marcar como lidos
            </button>
            <button
              onClick={handleDeletarSelecionados}
              disabled={processando}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Deletar
            </button>
            <button
              onClick={() => setSelecionados(new Set())}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium px-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ══════════ LISTA / SKELETON / EMPTY ══════════ */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <SkeletonAlerta key={i} />
          ))}
        </div>
      ) : alertasFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 items-center justify-center mb-4">
            <PackageCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">
            {busca
              ? 'Nenhum alerta encontrado'
              : filtro === 'nao_visualizados'
              ? 'Tudo em ordem! ✨'
              : 'Nenhum alerta ainda'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {busca
              ? `Nenhum produto encontrado com "${busca}"`
              : filtro === 'nao_visualizados'
              ? 'Você não tem alertas pendentes. Estoques saudáveis!'
              : 'Quando produtos atingirem o estoque mínimo, vão aparecer aqui.'}
          </p>
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="mt-4 text-sm text-green-600 dark:text-green-400 font-semibold hover:underline"
            >
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Checkbox "selecionar todos" */}
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={toggleSelecionarTodos}
              className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
            >
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                  selecionados.size === alertasFiltrados.length &&
                  alertasFiltrados.length > 0
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {selecionados.size === alertasFiltrados.length &&
                  alertasFiltrados.length > 0 && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
              </div>
              {selecionados.size === alertasFiltrados.length
                ? 'Desmarcar todos'
                : 'Selecionar todos'}
            </button>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {alertasFiltrados.length} resultado(s)
            </span>
          </div>

          {/* Cards de alerta */}
          {alertasFiltrados.map((alerta, idx) => {
            const isCritico = alerta.tipo_alerta === 'estoque_critico'
            const isSelecionado = selecionados.has(alerta.id)

            return (
              <div
                key={alerta.id}
                className={`group relative bg-white dark:bg-gray-900 border rounded-xl p-4 transition-all hover:shadow-md ${
                  alerta.visualizado
                    ? 'border-gray-200 dark:border-gray-800 opacity-70'
                    : isCritico
                    ? 'border-red-200 dark:border-red-900/50 shadow-sm shadow-red-500/5'
                    : 'border-yellow-200 dark:border-yellow-900/50 shadow-sm shadow-yellow-500/5'
                } ${isSelecionado ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                style={{ animation: `slideUp 0.3s ease-out ${idx * 30}ms backwards` }}
              >
                {/* Barra lateral de urgência */}
                {!alerta.visualizado && (
                  <div
                    className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${
                      isCritico ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                  />
                )}

                <div className="flex items-start gap-3 md:gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelecao(alerta.id)}
                    className={`flex-shrink-0 mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                      isSelecionado
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    }`}
                  >
                    {isSelecionado && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </button>

                  {/* Ícone */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      isCritico
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-yellow-100 dark:bg-yellow-900/30'
                    }`}
                  >
                    {isCritico ? (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white break-words">
                          {alerta.produto?.nome || 'Produto removido'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isCritico
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            }`}
                          >
                            {isCritico ? '🔴 Crítico' : '🟡 Baixo'}
                          </span>
                          {alerta.visualizado && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              ✓ Visualizado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantidades */}
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Atual: </span>
                        <span
                          className={`font-bold text-base ${
                            isCritico
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}
                        >
                          {alerta.produto?.quantidade_atual ?? '?'}
                        </span>
                      </div>
                      <div className="text-gray-300 dark:text-gray-700">/</div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Mínimo: </span>
                        <span className="font-bold text-base text-gray-700 dark:text-gray-300">
                          {alerta.produto?.quantidade_minima ?? '?'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {formatarData(alerta.criado_em)}
                    </p>
                  </div>

                 {/* Ações */}
                  <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                    {alerta.produto?.id && (
                      <Link
                        href={`/dashboard/estoque/movimento?tipo=entrada&produto=${alerta.produto.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-md hover:shadow-green-500/30 text-white text-xs font-semibold rounded-lg transition whitespace-nowrap"
                        title="Repor estoque"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Repor</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                    {!alerta.visualizado && (
                      <button
                        onClick={() => handleMarcarComoVisto(alerta.id)}
                        disabled={processando}
                        className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition disabled:opacity-50"
                        title="Marcar como visualizado"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleDeletar(alerta.id, alerta.produto?.nome || 'item')
                      }
                      disabled={processando}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition disabled:opacity-50"
                      title="Deletar alerta"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══════════ LOADING OVERLAY ══════════ */}
      {processando && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-2xl text-sm font-semibold">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processando...
        </div>
      )}

      {/* ══════════ MODAL ══════════ */}
      <ModalConfirmacao modal={modal} onFechar={() => setModal(null)} />

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}