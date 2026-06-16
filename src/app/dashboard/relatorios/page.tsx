"use client"

import { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { supabase } from '@/lib/supabase'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Wallet,
  AlertTriangle,
} from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'
import { useNotification } from '@/contexts/NotificationContext'
import { exportVendasCSV, exportMovimentosDiariosCSV } from '@/lib/export-utils'

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

  const handleExportarVendas = () => {
    exportVendasCSV(vendasPorProduto, 'vendas', filtroData)
    addNotification('Vendas exportadas!', 'success', 2000)
  }

  const handleExportarMovimentos = () => {
    exportMovimentosDiariosCSV(movimentosPorDiaArray, filtroData)
    addNotification('Movimentos exportados!', 'success', 2000)
  }

  if (loading)
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-500">
          Carregando relatórios...
        </div>
      </div>
    )

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6 space-y-5 box-border">
      {/* Header */}
      <div className="min-w-0">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          Relatórios
        </h2>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
          Análise de vendas e movimentação
        </p>
      </div>

      {/* Filtro */}
      <div className="flex flex-wrap gap-2">
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
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 min-w-0 overflow-hidden">
          <div className="flex items-start gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 overflow-hidden">
              <p className="font-semibold text-yellow-800 dark:text-yellow-200 text-xs truncate">
                {produtosSemCusto.length} produto(s) sem preço de custo
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                O lucro pode estar incorreto. Cadastre o preço de custo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MÉTRICAS ══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 min-w-0">
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
            className={`${bg} rounded-xl p-2.5 md:p-4 border border-gray-100 dark:border-gray-800 min-w-0 overflow-hidden`}
          >
            <div className="flex items-center gap-1.5 mb-1 min-w-0">
              <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${color} flex-shrink-0`} />
              <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                {label}
              </span>
            </div>
            <p className={`text-base md:text-2xl font-bold ${color} truncate`}>
              {value}
            </p>
          </div>
        ))}
      </div>

        {/* ══════════ GRÁFICO DE MOVIMENTAÇÃO ══════════ */}
        {movimentosPorDiaArray.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              📊 Movimentação no período
            </h3>
            <div className="w-full h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movimentosPorDiaArray}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis 
                    dataKey="data" 
                    tick={{ fontSize: 11 }} 
                    stroke="#9CA3AF"
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: '#F9FAFB' 
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="entradas" name="Entradas" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      {/* ══════════ TOP PRODUTOS ══════════ */}
      <div className="card p-3 md:p-6 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-4 min-w-0">
          <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">
            Top Produtos
          </h3>
          <button
            onClick={handleExportarVendas}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>

        {vendasPorProduto.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            Sem vendas no período
          </p>
        ) : (
          <div className="space-y-4 min-w-0">
            {vendasPorProduto.slice(0, 10).map((v) => {
              const porcentagem = (v.valor_total / maxVenda) * 100
              return (
                <div key={v.produto_id} className="space-y-1.5 min-w-0 overflow-hidden">
                  {/* Nome truncado */}
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 truncate">
                      {v.produto_nome}
                    </p>
                  </div>
                  {/* Valor + Qtd */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
                      {formatarMoeda(v.valor_total)}
                    </p>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {v.quantidade_vendida} un
                    </span>
                  </div>
                  {/* Barra */}
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
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
      <div className="card p-3 md:p-6 min-w-0 overflow-hidden">
        <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white mb-4">
          Detalhamento por produto
        </h3>

        {vendasPorProduto.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            Sem vendas no período
          </p>
        ) : (
          <>
            {/* Desktop: Tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b dark:border-gray-700 text-left">
                    <th className="pb-2 text-gray-500 font-medium">Produto</th>
                    <th className="pb-2 text-gray-500 font-medium text-right">Qtd</th>
                    <th className="pb-2 text-gray-500 font-medium text-right">Receita</th>
                    <th className="pb-2 text-gray-500 font-medium text-right">Custo</th>
                    <th className="pb-2 text-gray-500 font-medium text-right">Lucro</th>
                    <th className="pb-2 text-gray-500 font-medium text-right">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasPorProduto.map((v) => {
                    const margem =
                      v.valor_total > 0 ? (v.lucro / v.valor_total) * 100 : 0
                    return (
                      <tr
                        key={v.produto_id}
                        className="border-b dark:border-gray-800"
                      >
                        <td className="py-2.5 pr-3 max-w-[200px]">
                          <span className="block truncate text-gray-800 dark:text-gray-200">
                            {v.produto_nome}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-gray-600 dark:text-gray-400">
                          {v.quantidade_vendida}
                        </td>
                        <td className="py-2.5 text-right text-gray-800 dark:text-gray-200 font-medium">
                          {formatarMoeda(v.valor_total)}
                        </td>
                        <td className="py-2.5 text-right text-gray-500">
                          {formatarMoeda(v.custo_total)}
                        </td>
                        <td className="py-2.5 text-right font-medium text-green-600 dark:text-green-400">
                          {formatarMoeda(v.lucro)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
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
            <div className="md:hidden space-y-3 min-w-0">
              {vendasPorProduto.map((v) => {
                const margem =
                  v.valor_total > 0 ? (v.lucro / v.valor_total) * 100 : 0
                const porcentagem = (v.valor_total / maxVenda) * 100
                return (
                  <div
                    key={v.produto_id}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700 min-w-0 overflow-hidden"
                  >
                    {/* Nome truncado */}
                    <div className="min-w-0 overflow-hidden mb-2">
                      <p className="font-medium text-gray-900 dark:text-white text-xs truncate">
                        {v.produto_nome}
                      </p>
                    </div>

                    {/* Grid 2x2 */}
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 min-w-0">
                        <span className="text-gray-500">Qtd</span>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                          {v.quantidade_vendida}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 min-w-0">
                        <span className="text-gray-500">Receita</span>
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                          {formatarMoeda(v.valor_total)}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 min-w-0">
                        <span className="text-gray-500">Lucro</span>
                        <p className="font-bold text-green-600 dark:text-green-400 text-sm truncate">
                          {formatarMoeda(v.lucro)}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 min-w-0">
                        <span className="text-gray-500">Margem</span>
                        <p
                          className={`font-bold text-sm ${
                            margem >= 30
                              ? 'text-green-600 dark:text-green-400'
                              : margem >= 15
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {v.tem_custo ? margem.toFixed(1) + '%' : '~'}
                        </p>
                      </div>
                    </div>

                    {/* Barra */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
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
      <div className="card p-3 md:p-6 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-4 min-w-0">
          <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">
            Movimentação diária
          </h3>
          <button
            onClick={handleExportarMovimentos}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>

        {movimentosPorDiaArray.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            Sem movimentos no período
          </p>
        ) : (
          <>
            {/* Desktop: Tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700 text-left">
                    <th className="pb-2 text-gray-500 font-medium">Data</th>
                    <th className="pb-2 text-gray-500 font-medium text-right">Entradas</th>
                    <th className="pb-2 text-gray-500 font-medium text-right">Saídas</th>
                    <th className="pb-2 text-gray-500 font-medium text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentosPorDiaArray.map((mov) => {
                    const saldo = mov.entradas - mov.saidas
                    return (
                      <tr
                        key={mov.data}
                        className="border-b dark:border-gray-800"
                      >
                        <td className="py-2.5 text-gray-800 dark:text-gray-200">
                          {mov.data}
                        </td>
                        <td className="py-2.5 text-right text-green-600 dark:text-green-400 font-medium">
                          +{mov.entradas}
                        </td>
                        <td className="py-2.5 text-right text-red-600 dark:text-red-400 font-medium">
                          -{mov.saidas}
                        </td>
                        <td
                          className={`py-2.5 text-right font-bold ${
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
            <div className="md:hidden space-y-2 min-w-0">
              {movimentosPorDiaArray.map((mov) => {
                const saldo = mov.entradas - mov.saidas
                return (
                  <div
                    key={mov.data}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700 min-w-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-xs text-gray-900 dark:text-white">
                        {mov.data}
                      </p>
                      <div className="flex gap-3 mt-1 text-[11px]">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          ↑ +{mov.entradas}
                        </span>
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          ↓ -{mov.saidas}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`text-base font-bold flex-shrink-0 ${
                        saldo >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {saldo >= 0 ? '+' : ''}
                      {saldo}
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
