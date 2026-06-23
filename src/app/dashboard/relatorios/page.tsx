"use client"

import { useEffect, useState, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
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
} from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'
import { useNotification } from '@/contexts/NotificationContext'
import { exportVendasCSV, exportMovimentosDiariosCSV } from '@/lib/export-utils'
import { usePlano } from '@/hooks/usePlano'
import UpgradeBlock from '@/components/upgrade-block'

interface RelatorioVenda {
  produto_id: string
  produto_nome: string
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
}

const PERIODOS = [
  { label: 'Hoje', value: '1d' },
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
  { label: '90 dias', value: '90d' },
]

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [movimentos, setMovimentos] = useState<any[]>([])
  const [, setProdutos] = useState<any[]>([])
  const [filtroData, setFiltroData] = useState('7d')
  const [vendasPorProduto, setVendasPorProduto] = useState<RelatorioVenda[]>([])
  const { addNotification } = useNotification()

  // 🔒 BLOQUEIO POR PLANO
  const { temRelatoriosAvancados, temExportarCSV, loading: loadingPlano } = usePlano()

  const fetchRelatorios = useCallback(async () => {
    setLoading(true)
    try {
      const hoje = new Date()
      let dataInicio = new Date()

      if (filtroData === '1d') dataInicio.setHours(0, 0, 0, 0)
      else if (filtroData === '7d') dataInicio.setDate(hoje.getDate() - 7)
      else if (filtroData === '30d') dataInicio.setDate(hoje.getDate() - 30)
      else if (filtroData === '90d') dataInicio.setDate(hoje.getDate() - 90)

      const [movimentosRes, produtosRes] = await Promise.all([
        supabase
          .from('movimentos_estoque')
          .select('*')
          .gte('criado_em', dataInicio.toISOString())
          .order('criado_em', { ascending: false })
          .limit(5000),
        supabase.from('produtos').select('*'),
      ])

      const produtosData = produtosRes.data || []
      const movimentosData = movimentosRes.data || []

      setProdutos(produtosData)
      setMovimentos(movimentosData)

      const vendas = movimentosData.filter(
        (m: any) => m.tipo_movimento === 'saida'
      )

      const agrupado: { [key: string]: RelatorioVenda } = {}

      for (const venda of vendas) {
        const produto = produtosData.find((p: any) => p.id === venda.produto_id)
        if (!agrupado[venda.produto_id]) {
          agrupado[venda.produto_id] = {
            produto_id: venda.produto_id,
            produto_nome: produto?.nome || 'Desconhecido',
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
        agrupado[venda.produto_id].lucro +=
          venda.quantidade * (precoVenda - precoCusto)
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

  const vendas = movimentos.filter((m) => m.tipo_movimento === 'saida')
  const entradas = movimentos.filter((m) => m.tipo_movimento === 'entrada')

  const totalVendas = vendas.reduce((acc, v) => acc + v.quantidade, 0)
  const totalEntradas = entradas.reduce((acc, v) => acc + v.quantidade, 0)
  const valorTotalVendas = vendasPorProduto.reduce(
    (acc, v) => acc + v.valor_total,
    0
  )
  const lucroTotal = vendasPorProduto.reduce((acc, v) => acc + v.lucro, 0)
  const margemMedia =
    valorTotalVendas > 0 ? (lucroTotal / valorTotalVendas) * 100 : 0

  const produtosSemCusto = vendasPorProduto.filter(
    (v) => !v.tem_custo && v.quantidade_vendida > 0
  )
  const temProdutosSemCusto = produtosSemCusto.length > 0

  const movimentosPorDia: { [key: string]: RelatorioMovimento } = {}
  movimentos.forEach((mov: any) => {
    const data = new Date(mov.criado_em).toLocaleDateString('pt-BR')
    if (!movimentosPorDia[data])
      movimentosPorDia[data] = { data, entradas: 0, saidas: 0 }
    if (mov.tipo_movimento === 'entrada')
      movimentosPorDia[data].entradas += mov.quantidade
    else movimentosPorDia[data].saidas += mov.quantidade
  })

  const movimentosPorDiaArray = Object.values(movimentosPorDia).sort(
    (a, b) =>
      new Date(a.data.split('/').reverse().join('-')).getTime() -
      new Date(b.data.split('/').reverse().join('-')).getTime()
  )

  const maxVenda = vendasPorProduto[0]?.valor_total || 1

  // 🔒 Funções protegidas — segurança extra contra burla via console
  const handleExportarVendas = () => {
    if (!temExportarCSV) {
      addNotification(
        'Exportação CSV disponível no plano Profissional',
        'warning'
      )
      return
    }
    exportVendasCSV(vendasPorProduto, 'vendas', filtroData)
    addNotification('Vendas exportadas!', 'success', 2000)
  }

  const handleExportarMovimentos = () => {
    if (!temExportarCSV) {
      addNotification(
        'Exportação CSV disponível no plano Profissional',
        'warning'
      )
      return
    }
    exportMovimentosDiariosCSV(movimentosPorDiaArray, filtroData)
    addNotification('Movimentos exportados!', 'success', 2000)
  }

  if (loading || loadingPlano)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Carregando relatórios...</div>
      </div>
    )

  // ══════════════════════════════════════════════════
  // 🔒 BLOQUEIO: INICIANTE VÊ VERSÃO SIMPLIFICADA
  // ══════════════════════════════════════════════════
  if (!temRelatoriosAvancados) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Relatórios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Versão básica do plano Iniciante
          </p>
        </div>

        {/* Filtros de período */}
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

        {/* Métricas BÁSICAS — só quantidades */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Itens vendidos
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {totalVendas}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Itens recebidos
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {totalEntradas}
            </div>
          </div>
        </div>

        {/* Preview borrado das métricas avançadas — pra mostrar o que o cara perde */}
        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 blur-sm select-none pointer-events-none">
            {[
              { label: 'Receita total', value: 'R$ ???', icon: DollarSign },
              { label: 'Lucro estimado', value: 'R$ ???', icon: Wallet },
              { label: 'Margem média', value: '??%', icon: TrendingUp },
              { label: 'Top produtos', value: '???', icon: BarChart },
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
          {/* Selo PRO no overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold text-sm shadow-lg">
              <Crown className="w-4 h-4" />
              Disponível no Profissional
            </div>
          </div>
        </div>

        {/* CTA principal de upgrade */}
        <UpgradeBlock
          titulo="Desbloqueie Relatórios Completos"
          descricao="Veja receita total, lucro estimado, margem por produto, gráficos detalhados de movimentação e exporte tudo em CSV pra analisar onde quiser. Tome decisões inteligentes baseadas em dados reais do seu negócio."
          planoNecessario="profissional"
        />
      </div>
    )
  }

  // ══════════════════════════════════════════════════
  // ✅ VERSÃO COMPLETA — Profissional + Negócio + Admin
  // ══════════════════════════════════════════════════
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Relatórios
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Análise de vendas e movimentação
        </p>
      </div>

      {/* Filtro */}
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

      {/* Alerta */}
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

      {/* ══════════ MÉTRICAS ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            label: 'Itens vendidos',
            value: totalVendas,
            icon: TrendingDown,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
          },
          {
            label: 'Itens recebidos',
            value: totalEntradas,
            icon: TrendingUp,
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-900/20',
          },
          {
            label: 'Receita total',
            value: formatarMoeda(valorTotalVendas),
            icon: DollarSign,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
          },
          {
            label: `Lucro estimado (${margemMedia.toFixed(0)}%)`,
            value: formatarMoeda(lucroTotal),
            icon: Wallet,
            color:
              lucroTotal >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                {label}
              </span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ══════════ GRÁFICO DE MOVIMENTAÇÃO ══════════ */}
      {movimentosPorDiaArray.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            📊 Movimentação no período
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={movimentosPorDiaArray}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="data" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
              <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ══════════ TOP PRODUTOS ══════════ */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Top Produtos
          </h2>
          <button
            onClick={handleExportarVendas}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs md:text-sm font-medium transition"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {vendasPorProduto.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Sem vendas no período
          </div>
        ) : (
          <div className="space-y-3">
            {vendasPorProduto.slice(0, 10).map((v) => {
              const porcentagem = (v.valor_total / maxVenda) * 100
              return (
                <div key={v.produto_id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
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
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
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
            {/* Desktop: Tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase">
                    <th className="text-left py-2 font-medium">Produto</th>
                    <th className="text-right py-2 font-medium">Qtd</th>
                    <th className="text-right py-2 font-medium">Receita</th>
                    <th className="text-right py-2 font-medium">Custo</th>
                    <th className="text-right py-2 font-medium">Lucro</th>
                    <th className="text-right py-2 font-medium">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasPorProduto.map((v) => {
                    const margem =
                      v.valor_total > 0 ? (v.lucro / v.valor_total) * 100 : 0
                    return (
                      <tr
                        key={v.produto_id}
                        className="border-b dark:border-gray-800 text-sm"
                      >
                        <td className="py-3 text-gray-900 dark:text-white font-medium">
                          {v.produto_nome}
                        </td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                          {v.quantidade_vendida}
                        </td>
                        <td className="py-3 text-right text-gray-900 dark:text-white">
                          {formatarMoeda(v.valor_total)}
                        </td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                          {formatarMoeda(v.custo_total)}
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

            {/* Mobile: Cards */}
            <div className="md:hidden space-y-3">
              {vendasPorProduto.map((v) => {
                const margem =
                  v.valor_total > 0 ? (v.lucro / v.valor_total) * 100 : 0
                const porcentagem = (v.valor_total / maxVenda) * 100
                return (
                  <div
                    key={v.produto_id}
                    className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2"
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {v.produto_nome}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Qtd
                        </span>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {v.quantidade_vendida}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Receita
                        </span>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {formatarMoeda(v.valor_total)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Lucro
                        </span>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatarMoeda(v.lucro)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Margem
                        </span>
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

      {/* ══════════ MOVIMENTAÇÃO DIÁRIA ══════════ */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Movimentação diária
          </h2>
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
          <>
            {/* Desktop: Tabela */}
            <div className="hidden md:block overflow-x-auto">
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
                      <tr
                        key={mov.data}
                        className="border-b dark:border-gray-800 text-sm"
                      >
                        <td className="py-3 text-gray-900 dark:text-white font-medium">
                          {mov.data}
                        </td>
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

            {/* Mobile: Cards */}
            <div className="md:hidden space-y-2">
              {movimentosPorDiaArray.map((mov) => {
                const saldo = mov.entradas - mov.saidas
                return (
                  <div
                    key={mov.data}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {mov.data}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        ↑ +{mov.entradas}
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-semibold">
                        ↓ -{mov.saidas}
                      </span>
                      <span
                        className={`font-bold ${
                          saldo >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {saldo >= 0 ? '+' : ''}
                        {saldo}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}