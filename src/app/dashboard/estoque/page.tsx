'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MovimentoEstoque, Produto } from '@/lib/types'
import {
  Plus,
  ArrowDown,
  ArrowUp,
  ShoppingCart,
  Download,
  AlertTriangle,
  Crown,
  Search,
  X,
  Package,
  DollarSign,
  Calendar,
  Filter,
  Boxes,
  ArrowRight,
  PackageX,
  Eye,
  RotateCw,
} from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'
import { useNotification } from '@/contexts/NotificationContext'
import { exportMovimentosDiariosCSV } from '@/lib/export-utils'
import { SkeletonTable } from '@/components/skeleton-loaders'
import { usePlano } from '@/hooks/usePlano'

type TipoFiltro = 'todos' | 'entrada' | 'saida'
type PeriodoFiltro = 'hoje' | '7d' | '30d' | 'todos'

// ════════════════════════════════════════════════════
// 🎨 KPI CARD PRO
// ════════════════════════════════════════════════════
function KPICardPro({
  label,
  valor,
  sublabel,
  icon: Icon,
  cor,
  destaque,
}: {
  label: string
  valor: string | number
  sublabel?: string
  icon: typeof Boxes
  cor: 'green' | 'red' | 'yellow' | 'blue' | 'emerald'
  destaque?: boolean
}) {
  const cores = {
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
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
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
    emerald: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
  }
  const c = cores[cor]

  return (
    <div
      className={`bg-white dark:bg-gray-900 border rounded-xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${
        destaque ? c.border : 'border-gray-200 dark:border-gray-800'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${c.text}`} />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 truncate">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
        {valor}
      </p>
      {sublabel && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 truncate">
          {sublabel}
        </p>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════
// 🎯 PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════
export default function EstoquePage() {
  const [movimentos, setMovimentos] = useState<MovimentoEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('todos')
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>('todos')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [criticosVisivel, setCriticosVisivel] = useState(true)
  const { addNotification } = useNotification()

  const { temExportarCSV } = usePlano()

  const fetchData = useCallback(async () => {
    try {
      const [movimentosRes, produtosRes] = await Promise.all([
        supabase
          .from('movimentos_estoque')
          .select('*, produtos(*)')
          .order('criado_em', { ascending: false })
          .limit(500),
        supabase.from('produtos').select('*'),
      ])

      if (!movimentosRes.error && movimentosRes.data) {
        setMovimentos(movimentosRes.data)
      }

      if (!produtosRes.error && produtosRes.data) {
        setProdutos(produtosRes.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      addNotification('Erro ao carregar dados', 'error')
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ────────────────────────────────────────────────
  // 📊 ESTATÍSTICAS
  // ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const hoje = new Date().toDateString()
    const movimentosHoje = movimentos.filter(
      (m) => new Date(m.criado_em).toDateString() === hoje
    )

    const entradasHoje = movimentosHoje
      .filter((m) => m.tipo_movimento === 'entrada')
      .reduce((acc, m) => acc + m.quantidade, 0)

    const saidasHoje = movimentosHoje
      .filter((m) => m.tipo_movimento === 'saida')
      .reduce((acc, m) => acc + m.quantidade, 0)

    // 🆕 Faturamento de saídas hoje (valor real!)
    const faturamentoHoje = movimentosHoje
      .filter((m) => m.tipo_movimento === 'saida')
      .reduce(
        (acc, m) => acc + m.quantidade * (m.produto?.preco_venda || 0),
        0
      )

    const produtosBaixoEstoque = produtos.filter(
      (p) => p.quantidade_atual < p.quantidade_minima && p.quantidade_atual > 0
    )
    const produtosCriticos = produtos.filter((p) => p.quantidade_atual === 0)

    // 🆕 Valor total em estoque
    const valorEstoque = produtos.reduce(
      (acc, p) => acc + p.quantidade_atual * (p.preco_venda || 0),
      0
    )

    return {
      entradasHoje,
      saidasHoje,
      faturamentoHoje,
      produtosBaixoEstoque,
      produtosCriticos,
      valorEstoque,
      totalProdutos: produtos.length,
    }
  }, [movimentos, produtos])

  // ────────────────────────────────────────────────
  // 🔍 FILTROS APLICADOS
  // ────────────────────────────────────────────────
  const movimentosFiltrados = useMemo(() => {
    let resultado = movimentos

    // Filtro por período
    if (periodoFiltro !== 'todos') {
      const agora = new Date()
      const dataLimite = new Date()
      if (periodoFiltro === 'hoje') {
        dataLimite.setHours(0, 0, 0, 0)
      } else if (periodoFiltro === '7d') {
        dataLimite.setDate(agora.getDate() - 7)
      } else if (periodoFiltro === '30d') {
        dataLimite.setDate(agora.getDate() - 30)
      }
      resultado = resultado.filter(
        (m) => new Date(m.criado_em) >= dataLimite
      )
    }

    // Filtro por tipo
    if (tipoFiltro !== 'todos') {
      resultado = resultado.filter((m) => m.tipo_movimento === tipoFiltro)
    }

    // Busca (nome OU sku OU motivo)
    if (filtro.trim()) {
      const termo = filtro.toLowerCase()
      resultado = resultado.filter(
        (m) =>
          m.produto?.nome?.toLowerCase().includes(termo) ||
          m.produto?.sku?.toLowerCase().includes(termo) ||
          m.motivo?.toLowerCase().includes(termo)
      )
    }

    return resultado
  }, [movimentos, filtro, tipoFiltro, periodoFiltro])

  // 🆕 Agrupa movimentos por data (visual estilo Linear/Notion)
  const movimentosAgrupados = useMemo(() => {
    const grupos: Record<string, MovimentoEstoque[]> = {}

    movimentosFiltrados.forEach((m) => {
      const data = new Date(m.criado_em)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const ontem = new Date(hoje)
      ontem.setDate(ontem.getDate() - 1)

      let chave: string
      if (data >= hoje) {
        chave = 'Hoje'
      } else if (data >= ontem) {
        chave = 'Ontem'
      } else {
        chave = data.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year:
            data.getFullYear() !== hoje.getFullYear() ? 'numeric' : undefined,
        })
      }

      if (!grupos[chave]) grupos[chave] = []
      grupos[chave].push(m)
    })

    return grupos
  }, [movimentosFiltrados])

  // ────────────────────────────────────────────────
  // 🎬 AÇÕES
  // ────────────────────────────────────────────────
  const handleExportarMovimentos = () => {
    if (!temExportarCSV) {
      addNotification(
        'Exportação CSV disponível no plano Profissional',
        'warning'
      )
      return
    }

    const hoje = new Date()
    const dataStr = hoje.toLocaleDateString('pt-BR')
    const movimentosPorDia = [
      {
        data: dataStr,
        entradas: stats.entradasHoje,
        saidas: stats.saidasHoje,
      },
    ]
    exportMovimentosDiariosCSV(movimentosPorDia, 'hoje')
    addNotification('Movimentos exportados!', 'success', 3000)
  }

  const handleAtualizar = () => {
    setLoading(true)
    fetchData()
    addNotification('Dados atualizados ✓', 'success', 1500)
  }

  if (loading) {
    return <SkeletonTable />
  }

  return (
    <div className="space-y-6">
      {/* ══════════ HEADER PRO ══════════ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Estoque
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Acompanhe entradas, saídas e movimentação em tempo real
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={handleAtualizar}
            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg transition"
            title="Atualizar"
          >
            <RotateCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          <Link
            href="/dashboard/pdv"
            className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">PDV</span>
          </Link>

          {temExportarCSV ? (
            <button
              onClick={handleExportarMovimentos}
              className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          ) : (
            <Link
              href="/assinar"
              className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition font-semibold text-sm"
              title="Disponível no plano Profissional"
            >
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar PRO</span>
            </Link>
          )}

          <Link
            href="/dashboard/estoque/movimento"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 text-white font-semibold rounded-lg transition text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo</span>
            Movimento
          </Link>
        </div>
      </div>

      {/* ══════════ ALERTA CRÍTICOS (DISMISSÍVEL) ══════════ */}
      {stats.produtosCriticos.length > 0 && criticosVisivel && (
        <div className="relative bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 animate-slideDown">
          <div className="flex items-start gap-3 pr-8">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
              <PackageX className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-bold text-red-900 dark:text-red-100">
                  Estoque Zerado
                </h3>
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 text-xs font-bold rounded-full">
                  {stats.produtosCriticos.length}{' '}
                  {stats.produtosCriticos.length === 1 ? 'produto' : 'produtos'}
                </span>
              </div>
              <p className="text-sm text-red-800 dark:text-red-200 mb-3 break-words">
                {stats.produtosCriticos.slice(0, 5).map((p) => p.nome).join(', ')}
                {stats.produtosCriticos.length > 5 &&
                  ` e mais ${stats.produtosCriticos.length - 5}...`}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/dashboard/produtos"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-300 hover:underline"
                >
                  Ver produtos <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
          <button
            onClick={() => setCriticosVisivel(false)}
            className="absolute top-3 right-3 text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ══════════ KPIs ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICardPro
          label="Faturamento hoje"
          valor={formatarMoeda(stats.faturamentoHoje)}
          icon={DollarSign}
          cor="emerald"
          destaque={stats.faturamentoHoje > 0}
        />
        <KPICardPro
          label="Entradas hoje"
          valor={stats.entradasHoje}
          sublabel="unidades"
          icon={ArrowDown}
          cor="green"
        />
        <KPICardPro
          label="Saídas hoje"
          valor={stats.saidasHoje}
          sublabel="unidades"
          icon={ArrowUp}
          cor="red"
        />
        <KPICardPro
          label="Valor em estoque"
          valor={formatarMoeda(stats.valorEstoque)}
          icon={Package}
          cor="blue"
        />
        <KPICardPro
          label="Baixo estoque"
          valor={stats.produtosBaixoEstoque.length}
          icon={AlertTriangle}
          cor="yellow"
          destaque={stats.produtosBaixoEstoque.length > 0}
        />
        <KPICardPro
          label="Total produtos"
          valor={stats.totalProdutos}
          icon={Boxes}
          cor="blue"
        />
      </div>

      {/* ══════════ AVISO BAIXO ESTOQUE (mais discreto) ══════════ */}
      {stats.produtosBaixoEstoque.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200 flex-1 min-w-0 truncate">
            <strong>{stats.produtosBaixoEstoque.length}</strong> produto(s) com baixo
            estoque:{' '}
            <span className="text-yellow-700 dark:text-yellow-300">
              {stats.produtosBaixoEstoque.slice(0, 3).map((p) => p.nome).join(', ')}
              {stats.produtosBaixoEstoque.length > 3 && '...'}
            </span>
          </p>
          <Link
            href="/dashboard/alertas"
            className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 hover:underline whitespace-nowrap flex items-center gap-1"
          >
            Ver alertas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ══════════ TOOLBAR DE FILTROS ══════════ */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por produto, SKU ou motivo..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {filtro && (
              <button
                onClick={() => setFiltro('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro de período */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {[
              { id: 'hoje' as const, label: 'Hoje' },
              { id: '7d' as const, label: '7 dias' },
              { id: '30d' as const, label: '30 dias' },
              { id: 'todos' as const, label: 'Todos' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setPeriodoFiltro(id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                  periodoFiltro === id
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filtro de tipo */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {(
              [
                { id: 'todos' as const, label: 'Todos', cor: 'gray' },
                { id: 'entrada' as const, label: 'Entradas', cor: 'green' },
                { id: 'saida' as const, label: 'Saídas', cor: 'red' },
              ] as const
            ).map(({ id, label, cor }) => (
              <button
                key={id}
                onClick={() => setTipoFiltro(id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                  tipoFiltro === id
                    ? cor === 'green'
                      ? 'bg-green-600 text-white shadow-sm'
                      : cor === 'red'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {id === 'entrada' && <ArrowDown className="w-3 h-3" />}
                {id === 'saida' && <ArrowUp className="w-3 h-3" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Contador de resultados */}
        {(filtro || tipoFiltro !== 'todos' || periodoFiltro !== 'todos') && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Filter className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {movimentosFiltrados.length} resultado(s)
            </span>
            <button
              onClick={() => {
                setFiltro('')
                setTipoFiltro('todos')
                setPeriodoFiltro('todos')
              }}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline ml-auto"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* ══════════ LISTA AGRUPADA ══════════ */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">
              Histórico de Movimentos
            </h2>
            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full font-semibold">
              {movimentosFiltrados.length}
            </span>
          </div>
        </div>

        {movimentosFiltrados.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
              <Boxes className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
              {filtro || tipoFiltro !== 'todos' || periodoFiltro !== 'todos'
                ? 'Nenhum movimento encontrado'
                : 'Nenhum movimento ainda'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
              {filtro || tipoFiltro !== 'todos' || periodoFiltro !== 'todos'
                ? 'Tente ajustar os filtros pra ver mais resultados.'
                : 'Registre uma entrada ou faça uma venda no PDV pra começar.'}
            </p>
            {!filtro && tipoFiltro === 'todos' && periodoFiltro === 'todos' && (
              <Link
                href="/dashboard/estoque/movimento"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Registrar primeiro movimento
              </Link>
            )}
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {Object.entries(movimentosAgrupados).map(([data, movs]) => (
              <div key={data}>
                {/* Header do grupo */}
                <div className="sticky top-0 z-10 px-5 py-2 bg-gray-50 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {data}
                    </h3>
                    <span className="text-xs text-gray-400">
                      {movs.length} movimento{movs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Movimentos do grupo */}
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {movs.map((movimento) => {
                    const isEntrada = movimento.tipo_movimento === 'entrada'
                    const valor =
                      movimento.quantidade *
                      (movimento.produto?.preco_venda || 0)

                    return (
                      <div
                        key={movimento.id}
                        className="group flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                      >
                        {/* Ícone */}
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isEntrada
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}
                        >
                          {isEntrada ? (
                            <ArrowDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <ArrowUp className="w-4 h-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>

                        {/* Info do produto */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                              {movimento.produto?.nome || 'Produto removido'}
                            </p>
                            {movimento.produto?.sku && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded font-mono">
                                {movimento.produto.sku}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {movimento.motivo || (
                              <span className="italic">Sem motivo informado</span>
                            )}{' '}
                            ·{' '}
                            {new Date(movimento.criado_em).toLocaleTimeString(
                              'pt-BR',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                        </div>

                        {/* Quantidade + valor */}
                        <div className="text-right flex-shrink-0">
                          <p
                            className={`font-bold text-base ${
                              isEntrada
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {isEntrada ? '+' : '-'}
                            {movimento.quantidade}
                          </p>
                          {!isEntrada && valor > 0 && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              {formatarMoeda(valor)}
                            </p>
                          )}
                        </div>

                        {/* Ação rápida */}
{movimento.produto?.id && (
  <Link
    href={`/dashboard/produtos/${movimento.produto.id}`}
    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
    title="Ver produto"
  >
    <Eye className="w-3.5 h-3.5" />
  </Link>
)}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
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
          animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}