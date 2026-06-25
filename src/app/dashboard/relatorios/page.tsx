'use client'

import AnaliseIA from '@/components/analise-ia'
import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Wallet,
  AlertTriangle,
  Crown,
  Receipt,
  ShoppingCart,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Lightbulb,
  Sparkles,
  Package,
} from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'
import { useNotification } from '@/contexts/NotificationContext'
import { exportVendasCSV, exportMovimentosDiariosCSV } from '@/lib/export-utils'
import { usePlano } from '@/hooks/usePlano'
import UpgradeBlock from '@/components/upgrade-block'

interface RelatorioVenda {
  produto_id: string
  produto_nome: string
  categoria: string
  quantidade_vendida: number
  valor_total: number
  custo_total: number
  lucro: number
  tem_custo: boolean
}

interface RelatorioMovimento {
  data: string
  entradas: number
  saidas: number
  faturamento: number
}

interface VendaPorCategoria {
  categoria: string
  valor: number
  porcentagem: number
}

interface VendaPorDiaSemana {
  dia: string
  vendas: number
}

const PERIODOS = [
  { label: 'Hoje', value: '1d' },
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
  { label: '90 dias', value: '90d' },
]

// 🎨 Cores pra gráfico de pizza
const CORES_PIZZA = [
  '#10b981', // green
  '#3b82f6', // blue
  '#a855f7', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#6366f1', // indigo
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// ════════════════════════════════════════════════════
// 🎨 HELPER: Calcula variação % entre 2 valores
// ════════════════════════════════════════════════════
function calcularVariacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual > 0 ? 100 : null
  return ((atual - anterior) / anterior) * 100
}

// ════════════════════════════════════════════════════
// 🎨 KPI Card PRO
// ════════════════════════════════════════════════════
interface KPICardProps {
  label: string
  valor: string | number
  variacao: number | null
  icon: any
  cor: 'blue' | 'green' | 'purple' | 'orange' | 'emerald' | 'red'
  subtitulo?: string
}

function KPICardPro({ label, valor, variacao, icon: Icon, cor, subtitulo }: KPICardProps) {
  const cores = {
    blue: { iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
    green: { iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
    purple: { iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
    orange: { iconBg: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
    emerald: { iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    red: { iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' },
  }
  const c = cores[cor]

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${c.iconColor}`} />
        </div>
        {variacao !== null && variacao !== 0 && (
          <div
            className={`flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
              variacao > 0
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {variacao > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(variacao).toFixed(0)}%
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 truncate">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">{valor}</p>
      {subtitulo && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 truncate">{subtitulo}</p>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════
// 🎨 Tooltip customizado pros gráficos
// ════════════════════════════════════════════════════
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          <span className="font-semibold">{entry.name}:</span>{' '}
          {typeof entry.value === 'number' && entry.value > 100
            ? formatarMoeda(entry.value)
            : entry.value}
        </p>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════
export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [movimentos, setMovimentos] = useState<any[]>([])
  const [movimentosAnteriores, setMovimentosAnteriores] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [filtroData, setFiltroData] = useState('7d')
  const [vendasPorProduto, setVendasPorProduto] = useState<RelatorioVenda[]>([])
  const { addNotification } = useNotification()

  const { temRelatoriosAvancados, temExportarCSV, loading: loadingPlano } = usePlano()

  const fetchRelatorios = useCallback(async () => {
    setLoading(true)
    try {
      const hoje = new Date()
      let dataInicio = new Date()
      let dataInicioAnterior = new Date()
      let dataFimAnterior = new Date()

      if (filtroData === '1d') {
        dataInicio.setHours(0, 0, 0, 0)
        dataInicioAnterior = new Date(dataInicio)
        dataInicioAnterior.setDate(dataInicioAnterior.getDate() - 1)
        dataFimAnterior = new Date(dataInicio)
      } else if (filtroData === '7d') {
        dataInicio.setDate(hoje.getDate() - 7)
        dataInicioAnterior = new Date(dataInicio)
        dataInicioAnterior.setDate(dataInicioAnterior.getDate() - 7)
        dataFimAnterior = new Date(dataInicio)
      } else if (filtroData === '30d') {
        dataInicio.setDate(hoje.getDate() - 30)
        dataInicioAnterior = new Date(dataInicio)
        dataInicioAnterior.setDate(dataInicioAnterior.getDate() - 30)
        dataFimAnterior = new Date(dataInicio)
      } else if (filtroData === '90d') {
        dataInicio.setDate(hoje.getDate() - 90)
        dataInicioAnterior = new Date(dataInicio)
        dataInicioAnterior.setDate(dataInicioAnterior.getDate() - 90)
        dataFimAnterior = new Date(dataInicio)
      }

      const [movRes, movAntRes, prodRes] = await Promise.all([
        supabase
          .from('movimentos_estoque')
          .select('*')
          .gte('criado_em', dataInicio.toISOString())
          .order('criado_em', { ascending: false })
          .limit(5000),
        supabase
          .from('movimentos_estoque')
          .select('*')
          .gte('criado_em', dataInicioAnterior.toISOString())
          .lt('criado_em', dataFimAnterior.toISOString())
          .limit(5000),
        supabase.from('produtos').select('*'),
      ])

      const produtosData = prodRes.data || []
      const movimentosData = movRes.data || []
      const movimentosAntData = movAntRes.data || []

      setProdutos(produtosData)
      setMovimentos(movimentosData)
      setMovimentosAnteriores(movimentosAntData)

      // Agrupa vendas por produto
      const vendas = movimentosData.filter((m: any) => m.tipo_movimento === 'saida')
      const agrupado: { [key: string]: RelatorioVenda } = {}

      for (const venda of vendas) {
        const produto = produtosData.find((p: any) => p.id === venda.produto_id)
        if (!agrupado[venda.produto_id]) {
          agrupado[venda.produto_id] = {
            produto_id: venda.produto_id,
            produto_nome: produto?.nome || 'Desconhecido',
            categoria: produto?.categoria || 'Sem categoria',
            quantidade_vendida: 0,
            valor_total: 0,
            custo_total: 0,
            lucro: 0,
            tem_custo: (produto?.preco_custo || 0) > 0,
          }
        }

        const precoVenda = produto?.preco_venda || 0
        const precoCusto = produto?.preco_custo || 0

        agrupado[venda.produto_id].quantidade_vendida += venda.quantidade
        agrupado[venda.produto_id].valor_total += venda.quantidade * precoVenda
        agrupado[venda.produto_id].custo_total += venda.quantidade * precoCusto
        agrupado[venda.produto_id].lucro += venda.quantidade * (precoVenda - precoCusto)
      }

      setVendasPorProduto(
        Object.values(agrupado).sort((a, b) => b.valor_total - a.valor_total)
      )
    } catch (error) {
      console.error('Error:', error)
      addNotification('Erro ao carregar relatórios', 'error')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroData])

  useEffect(() => {
    fetchRelatorios()
  }, [fetchRelatorios])

  // ════════════════════════════════════════════════════
  // 📊 CÁLCULOS
  // ════════════════════════════════════════════════════
  const vendas = movimentos.filter((m) => m.tipo_movimento === 'saida')
  const entradas = movimentos.filter((m) => m.tipo_movimento === 'entrada')

  const totalVendas = vendas.reduce((acc, v) => acc + v.quantidade, 0)
  const totalEntradas = entradas.reduce((acc, v) => acc + v.quantidade, 0)
  const valorTotalVendas = vendasPorProduto.reduce((acc, v) => acc + v.valor_total, 0)
  const lucroTotal = vendasPorProduto.reduce((acc, v) => acc + v.lucro, 0)
  const margemMedia = valorTotalVendas > 0 ? (lucroTotal / valorTotalVendas) * 100 : 0

  // 🆕 Cálculos do período anterior pra comparação
  const calcularKPIsAnteriores = () => {
    const vendasAnt = movimentosAnteriores.filter((m) => m.tipo_movimento === 'saida')
    let faturamento = 0
    let lucro = 0
    let itens = 0

    vendasAnt.forEach((v) => {
      const p = produtos.find((prod) => prod.id === v.produto_id)
      const precoV = p?.preco_venda || 0
      const precoC = p?.preco_custo || 0
      faturamento += v.quantidade * precoV
      lucro += v.quantidade * (precoV - precoC)
      itens += v.quantidade
    })

    const numVendasUnicas = new Set(vendasAnt.map((v) => v.motivo).filter(Boolean)).size
    const ticketMedio = numVendasUnicas > 0 ? faturamento / numVendasUnicas : 0

    return { faturamento, lucro, itens, ticketMedio }
  }

  const kpisAnteriores = calcularKPIsAnteriores()
  const numVendasUnicasAtuais = new Set(vendas.map((v) => v.motivo).filter(Boolean)).size
  const ticketMedio = numVendasUnicasAtuais > 0 ? valorTotalVendas / numVendasUnicasAtuais : 0

  const produtosSemCusto = vendasPorProduto.filter(
    (v) => !v.tem_custo && v.quantidade_vendida > 0
  )
  const temProdutosSemCusto = produtosSemCusto.length > 0

  // ════════════════════════════════════════════════════
  // 📊 DADOS PROS GRÁFICOS
  // ════════════════════════════════════════════════════

  // Evolução diária (faturamento + entradas/saídas)
  const movimentosPorDia: { [key: string]: RelatorioMovimento } = {}
  movimentos.forEach((mov: any) => {
    const data = new Date(mov.criado_em).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    })
    if (!movimentosPorDia[data])
      movimentosPorDia[data] = { data, entradas: 0, saidas: 0, faturamento: 0 }

    if (mov.tipo_movimento === 'entrada') {
      movimentosPorDia[data].entradas += mov.quantidade
    } else {
      const p = produtos.find((prod) => prod.id === mov.produto_id)
      const precoV = p?.preco_venda || 0
      movimentosPorDia[data].saidas += mov.quantidade
      movimentosPorDia[data].faturamento += mov.quantidade * precoV
    }
  })

  const movimentosPorDiaArray = Object.values(movimentosPorDia).sort((a, b) => {
    const [diaA, mesA] = a.data.split('/').map(Number)
    const [diaB, mesB] = b.data.split('/').map(Number)
    if (mesA !== mesB) return mesA - mesB
    return diaA - diaB
  })

  // 🆕 Vendas por categoria (pra pizza)
  const vendasPorCategoria: VendaPorCategoria[] = useMemo(() => {
    const agrupado: Record<string, number> = {}
    vendasPorProduto.forEach((v) => {
      const cat = v.categoria || 'Sem categoria'
      agrupado[cat] = (agrupado[cat] || 0) + v.valor_total
    })

    const total = Object.values(agrupado).reduce((acc, v) => acc + v, 0)

    return Object.entries(agrupado)
      .map(([categoria, valor]) => ({
        categoria,
        valor,
        porcentagem: total > 0 ? (valor / total) * 100 : 0,
      }))
      .sort((a, b) => b.valor - a.valor)
  }, [vendasPorProduto])

  // 🆕 Vendas por dia da semana (heatmap)
  const vendasPorDiaSemana: VendaPorDiaSemana[] = useMemo(() => {
    const contagem = [0, 0, 0, 0, 0, 0, 0]
    vendas.forEach((v) => {
      const dia = new Date(v.criado_em).getDay()
      const p = produtos.find((prod) => prod.id === v.produto_id)
      const precoV = p?.preco_venda || 0
      contagem[dia] += v.quantidade * precoV
    })

    return DIAS_SEMANA.map((dia, idx) => ({
      dia,
      vendas: contagem[idx],
    }))
  }, [vendas, produtos])

  const maxVenda = vendasPorProduto[0]?.valor_total || 1

  // ════════════════════════════════════════════════════
  // 💡 INSIGHTS AUTOMÁTICOS
  // ════════════════════════════════════════════════════
  const insights = useMemo(() => {
    const ins: { tipo: 'success' | 'warning' | 'info'; texto: string }[] = []

    // Top produto
    if (vendasPorProduto.length > 0) {
      const top = vendasPorProduto[0]
      ins.push({
        tipo: 'success',
        texto: `🏆 Top produto: **${top.produto_nome}** (${formatarMoeda(top.valor_total)})`,
      })
    }

    // Top categoria
    if (vendasPorCategoria.length > 0) {
      const topCat = vendasPorCategoria[0]
      ins.push({
        tipo: 'info',
        texto: `📊 Categoria líder: **${topCat.categoria}** (${topCat.porcentagem.toFixed(0)}% das vendas)`,
      })
    }

    // Melhor dia
    const melhorDia = vendasPorDiaSemana.reduce(
      (max, dia) => (dia.vendas > max.vendas ? dia : max),
      vendasPorDiaSemana[0]
    )
    if (melhorDia && melhorDia.vendas > 0) {
      ins.push({
        tipo: 'info',
        texto: `📅 Melhor dia da semana: **${melhorDia.dia}** (${formatarMoeda(melhorDia.vendas)})`,
      })
    }

    // Margem baixa
    if (margemMedia < 20 && valorTotalVendas > 0) {
      ins.push({
        tipo: 'warning',
        texto: `⚠️ Margem média de ${margemMedia.toFixed(0)}% está baixa. Revise preços.`,
      })
    }

    return ins
  }, [vendasPorProduto, vendasPorCategoria, vendasPorDiaSemana, margemMedia, valorTotalVendas])

  // ════════════════════════════════════════════════════
  // EXPORTAÇÃO
  // ════════════════════════════════════════════════════
  const handleExportarVendas = () => {
    if (!temExportarCSV) {
      addNotification('Exportação CSV disponível no plano Profissional', 'warning')
      return
    }
    exportVendasCSV(vendasPorProduto, 'vendas', filtroData)
    addNotification('Vendas exportadas!', 'success', 2000)
  }

  const handleExportarMovimentos = () => {
    if (!temExportarCSV) {
      addNotification('Exportação CSV disponível no plano Profissional', 'warning')
      return
    }
    exportMovimentosDiariosCSV(movimentosPorDiaArray, filtroData)
    addNotification('Movimentos exportados!', 'success', 2000)
  }

  if (loading || loadingPlano)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <div className="text-gray-500 text-sm">Carregando relatórios...</div>
        </div>
      </div>
    )

  // ══════════════════════════════════════════════════
  // 🔒 BLOQUEIO INICIANTE (mantém como tava)
  // ══════════════════════════════════════════════════
  if (!temRelatoriosAvancados) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Relatórios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Versão básica do plano Iniciante
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {PERIODOS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFiltroData(value)}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition ${
                filtroData === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Itens vendidos</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {totalVendas}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Itens recebidos</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {totalEntradas}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 blur-sm select-none pointer-events-none">
            {[
              { label: 'Receita total', value: 'R$ ???', icon: DollarSign },
              { label: 'Lucro estimado', value: 'R$ ???', icon: Wallet },
              { label: 'Margem média', value: '??%', icon: TrendingUp },
              { label: 'Top produtos', value: '???', icon: BarChart3 },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400">{label}</span>
                </div>
                <div className="text-2xl font-bold text-gray-400">{value}</div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold text-sm shadow-lg">
              <Crown className="w-4 h-4" />
              Disponível no Profissional
            </div>
          </div>
        </div>

        <UpgradeBlock
          titulo="Desbloqueie Relatórios Completos"
          descricao="Veja receita total, lucro estimado, margem por produto, gráficos detalhados de movimentação e exporte tudo em CSV pra analisar onde quiser. Tome decisões inteligentes baseadas em dados reais do seu negócio."
          planoNecessario="profissional"
        />
      </div>
    )
  }

  // ══════════════════════════════════════════════════
  // ✅ VERSÃO COMPLETA PRO
  // ══════════════════════════════════════════════════
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* ══════════ HEADER PRO ══════════ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                PRO
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Análise inteligente do seu negócio
            </p>
          </div>
        </div>

        {/* Filtro de período PRO */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          {PERIODOS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFiltroData(value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                filtroData === value
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 💡 INSIGHTS AUTOMÁTICOS */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Insights do período</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {insights.map((ins, i) => (
              <div
                key={i}
                className={`text-xs px-3 py-2 rounded-lg ${
                  ins.tipo === 'success'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : ins.tipo === 'warning'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                }`}
                dangerouslySetInnerHTML={{
                  __html: ins.texto.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Alerta produtos sem custo */}
      {temProdutosSemCusto && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800 dark:text-yellow-300">
              {produtosSemCusto.length} produto(s) sem preço de custo
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              O lucro pode estar incorreto. Cadastre o preço de custo.
            </p>
          </div>
        </div>
      )}

      {/* ══════════ KPIs PRO COM VARIAÇÃO ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICardPro
          label="Faturamento"
          valor={formatarMoeda(valorTotalVendas)}
          variacao={calcularVariacao(valorTotalVendas, kpisAnteriores.faturamento)}
          icon={DollarSign}
          cor="green"
        />
        <KPICardPro
          label="Lucro estimado"
          valor={formatarMoeda(lucroTotal)}
          variacao={calcularVariacao(lucroTotal, kpisAnteriores.lucro)}
          icon={Wallet}
          cor="emerald"
          subtitulo={`Margem ${margemMedia.toFixed(0)}%`}
        />
        <KPICardPro
          label="Ticket médio"
          valor={formatarMoeda(ticketMedio)}
          variacao={calcularVariacao(ticketMedio, kpisAnteriores.ticketMedio)}
          icon={Receipt}
          cor="blue"
        />
        <KPICardPro
          label="Itens vendidos"
          valor={totalVendas}
          variacao={calcularVariacao(totalVendas, kpisAnteriores.itens)}
          icon={ShoppingCart}
          cor="purple"
        />
        <KPICardPro
          label="Entradas"
          valor={totalEntradas}
          variacao={null}
          icon={TrendingUp}
          cor="green"
        />
        <KPICardPro
          label="Produtos vendidos"
          valor={vendasPorProduto.length}
          variacao={null}
          icon={Package}
          cor="orange"
          subtitulo="únicos"
        />
      </div>

      {/* Análise IA */}
      <AnaliseIA />

      {/* ══════════ GRÁFICOS LADO A LADO ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 📈 EVOLUÇÃO DO FATURAMENTO */}
        {movimentosPorDiaArray.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Evolução do faturamento</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receita ao longo do período
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={movimentosPorDiaArray}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="data" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="faturamento"
                  name="Faturamento"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 🥧 VENDAS POR CATEGORIA */}
        {vendasPorCategoria.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <PieChartIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Vendas por categoria</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Distribuição do faturamento
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={vendasPorCategoria}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="valor"
                  nameKey="categoria"
                >
                  {vendasPorCategoria.map((_, idx) => (
                    <Cell key={idx} fill={CORES_PIZZA[idx % CORES_PIZZA.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatarMoeda(Number(value) || 0)}
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ══════════ ENTRADAS vs SAÍDAS + DIA DA SEMANA ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Entradas vs Saídas */}
        {movimentosPorDiaArray.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white">Movimentação diária</h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={movimentosPorDiaArray}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="data" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="entradas" fill="#10b981" name="Entradas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="#ef4444" name="Saídas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Vendas por dia da semana */}
        {vendasPorDiaSemana.some((d) => d.vendas > 0) && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Vendas por dia da semana</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Qual dia vende mais?
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={vendasPorDiaSemana}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="dia" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="vendas" fill="#f59e0b" name="Vendas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ══════════ TOP PRODUTOS (barra horizontal) ══════════ */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-white">Top Produtos</h2>
          </div>
          <button
            onClick={handleExportarVendas}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg text-white rounded-lg text-xs md:text-sm font-semibold transition"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {vendasPorProduto.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Sem vendas no período
          </div>
        ) : (
          <div className="space-y-3">
            {vendasPorProduto.slice(0, 10).map((v, idx) => {
              const porcentagem = (v.valor_total / maxVenda) * 100
              return (
                <div key={v.produto_id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                      <span className="text-gray-400 mr-2">#{idx + 1}</span>
                      {v.produto_nome}
                    </span>
                    <div className="flex items-center gap-2 text-xs flex-shrink-0">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatarMoeda(v.valor_total)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {v.quantidade_vendida} un
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all"
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══════════ DETALHAMENTO POR PRODUTO ══════════ */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Detalhamento por produto
        </h2>

        {vendasPorProduto.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Sem vendas no período
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase">
                    <th className="text-left py-2 font-medium">Produto</th>
                    <th className="text-left py-2 font-medium">Categoria</th>
                    <th className="text-right py-2 font-medium">Qtd</th>
                    <th className="text-right py-2 font-medium">Receita</th>
                    <th className="text-right py-2 font-medium">Lucro</th>
                    <th className="text-right py-2 font-medium">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasPorProduto.map((v) => {
                    const margem = v.valor_total > 0 ? (v.lucro / v.valor_total) * 100 : 0
                    return (
                      <tr key={v.produto_id} className="border-b dark:border-gray-800 text-sm">
                        <td className="py-3 text-gray-900 dark:text-white font-medium">
                          {v.produto_nome}
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-400 text-xs">
                          {v.categoria}
                        </td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                          {v.quantidade_vendida}
                        </td>
                        <td className="py-3 text-right text-gray-900 dark:text-white font-semibold">
                          {formatarMoeda(v.valor_total)}
                        </td>
                        <td className="py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatarMoeda(v.lucro)}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              margem >= 30
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : margem >= 15
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {v.tem_custo ? margem.toFixed(1) + '%' : '~'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {vendasPorProduto.map((v) => {
                const margem = v.valor_total > 0 ? (v.lucro / v.valor_total) * 100 : 0
                const porcentagem = (v.valor_total / maxVenda) * 100
                return (
                  <div
                    key={v.produto_id}
                    className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2"
                  >
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {v.produto_nome}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {v.categoria}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Qtd</span>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {v.quantidade_vendida}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Receita</span>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {formatarMoeda(v.valor_total)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Lucro</span>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatarMoeda(v.lucro)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Margem</span>
                        <div
                          className={`font-semibold ${
                            margem >= 30
                              ? 'text-green-600 dark:text-green-400'
                              : margem >= 15
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {v.tem_custo ? margem.toFixed(1) + '%' : '~'}
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${porcentagem}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ══════════ MOVIMENTAÇÃO DIÁRIA (mantém da versão antiga) ══════════ */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Movimentação diária</h2>
          <button
            onClick={handleExportarMovimentos}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs md:text-sm font-medium transition"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {movimentosPorDiaArray.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Sem movimentos no período
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="text-left py-2 font-medium">Data</th>
                  <th className="text-right py-2 font-medium">Entradas</th>
                  <th className="text-right py-2 font-medium">Saídas</th>
                  <th className="text-right py-2 font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {movimentosPorDiaArray.map((mov) => {
                  const saldo = mov.entradas - mov.saidas
                  return (
                    <tr key={mov.data} className="border-b dark:border-gray-800 text-sm">
                      <td className="py-3 text-gray-900 dark:text-white font-medium">{mov.data}</td>
                      <td className="py-3 text-right text-green-600 dark:text-green-400 font-semibold">
                        +{mov.entradas}
                      </td>
                      <td className="py-3 text-right text-red-600 dark:text-red-400 font-semibold">
                        -{mov.saidas}
                      </td>
                      <td
                        className={`py-3 text-right font-bold ${
                          saldo >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {saldo >= 0 ? '+' : ''}
                        {saldo}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}