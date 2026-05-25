'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Produto } from '@/lib/types'
import { TrendingUp, TrendingDown, DollarSign, Download, Wallet } from 'lucide-react'
import { formatarMoeda, formatarData } from '@/lib/utils'
import { useNotification } from '@/contexts/NotificationContext'
import { exportVendasCSV, exportMovimentosDiariosCSV } from '@/lib/export-utils'

interface RelatorioVenda {
  produto_id: string
  produto_nome: string
  quantidade_vendida: number
  valor_total: number
  custo_total: number
  lucro: number
}

interface RelatorioMovimento {
  data: string
  entradas: number
  saidas: number
}

const PERIODOS = [
  { label: 'Hoje',     value: '1d' },
  { label: '7 dias',   value: '7d' },
  { label: '30 dias',  value: '30d' },
  { label: '90 dias',  value: '90d' },
]

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [movimentos, setMovimentos] = useState<any[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
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
        supabase.from('movimentos_estoque').select('*').gte('criado_em', dataInicio.toISOString()),
        supabase.from('produtos').select('*'),
      ])

      const produtosData: Produto[] = produtosRes.data || []
      const movimentosData = movimentosRes.data || []

      setProdutos(produtosData)
      setMovimentos(movimentosData)

      // Agrupa vendas por produto — usa produtosData (não o estado)
      const vendas = movimentosData.filter((m: any) => m.tipo_movimento === 'saida')
      const agrupado: { [key: string]: RelatorioVenda } = {}

      for (const venda of vendas) {
        const produto = produtosData.find((p) => p.id === venda.produto_id)
        if (!agrupado[venda.produto_id]) {
          agrupado[venda.produto_id] = {
            produto_id: venda.produto_id,
            produto_nome: produto?.nome || 'Desconhecido',
            quantidade_vendida: 0,
            valor_total: 0,
            custo_total: 0,
            lucro: 0,
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

  // Estatísticas
  const vendas = movimentos.filter((m) => m.tipo_movimento === 'saida')
  const entradas = movimentos.filter((m) => m.tipo_movimento === 'entrada')
  const totalVendas = vendas.reduce((acc, v) => acc + v.quantidade, 0)
  const totalEntradas = entradas.reduce((acc, v) => acc + v.quantidade, 0)
  const valorTotalVendas = vendasPorProduto.reduce((acc, v) => acc + v.valor_total, 0)
  const lucroTotal = vendasPorProduto.reduce((acc, v) => acc + v.lucro, 0)
  const margemMedia = valorTotalVendas > 0 ? (lucroTotal / valorTotalVendas) * 100 : 0

  // Movimentos por dia
  const movimentosPorDia: { [key: string]: RelatorioMovimento } = {}
  movimentos.forEach((mov: any) => {
    const data = new Date(mov.criado_em).toLocaleDateString('pt-BR')
    if (!movimentosPorDia[data]) movimentosPorDia[data] = { data, entradas: 0, saidas: 0 }
    if (mov.tipo_movimento === 'entrada') movimentosPorDia[data].entradas += mov.quantidade
    else movimentosPorDia[data].saidas += mov.quantidade
  })
  const movimentosPorDiaArray = Object.values(movimentosPorDia).sort((a, b) =>
    new Date(a.data.split('/').reverse().join('-')).getTime() -
    new Date(b.data.split('/').reverse().join('-')).getTime()
  )

  // Gráfico de barras simples
  const maxVenda = vendasPorProduto[0]?.valor_total || 1

  const handleExportarVendas = () => {
    exportVendasCSV(vendasPorProduto, 'vendas', filtroData)
    addNotification('Vendas exportadas!', 'success', 2000)
  }

  const handleExportarMovimentos = () => {
    exportMovimentosDiariosCSV(movimentosPorDiaArray, filtroData)
    addNotification('Movimentos exportados!', 'success', 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="space-y-6 p-4 md:p-0">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50">Relatórios</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Análise de vendas e movimentação</p>
        </div>
        {/* Filtro de período */}
        <div className="flex gap-2 flex-wrap">
          {PERIODOS.map(({ label, value }) => (
            <button key={value} onClick={() => setFiltroData(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filtroData === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Itens vendidos',    value: totalVendas,                icon: TrendingDown, color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Itens recebidos',   value: totalEntradas,              icon: TrendingUp,   color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Receita total',     value: formatarMoeda(valorTotalVendas), icon: DollarSign,   color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: `Lucro estimado (${margemMedia.toFixed(0)}%)`, value: formatarMoeda(lucroTotal), icon: Wallet, color: lucroTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} border border-gray-200 dark:border-gray-800 rounded-xl p-4`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1 truncate">{label}</p>
                <p className={`text-xl md:text-2xl font-bold truncate ${color}`}>{value}</p>
              </div>
              <Icon size={20} className={`${color} opacity-40 flex-shrink-0 mt-1`} />
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico top produtos */}
      {vendasPorProduto.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 dark:text-gray-50">Top Produtos</h2>
            <button onClick={handleExportarVendas} className="btn-secondary text-xs flex items-center gap-1.5">
              <Download size={14} />Exportar
            </button>
          </div>
          <div className="space-y-3">
            {vendasPorProduto.slice(0, 7).map((v) => (
              <div key={v.produto_id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[60%]">{v.produto_nome}</span>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatarMoeda(v.valor_total)}</span>
                    <span className="text-xs text-gray-400 ml-2">({v.quantidade_vendida} un)</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${(v.valor_total / maxVenda) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela produtos mais vendidos */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-gray-50">Detalhamento por produto</h2>
        </div>
        {vendasPorProduto.length === 0 ? (
          <p className="text-gray-400 text-center py-10 text-sm">Nenhuma venda no período</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  {['Produto', 'Qtd', 'Receita', 'Custo', 'Lucro', 'Margem'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {vendasPorProduto.map((v) => {
                  const margem = v.valor_total > 0 ? (v.lucro / v.valor_total) * 100 : 0
                  return (
                    <tr key={v.produto_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{v.produto_nome}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{v.quantidade_vendida}</td>
                      <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">{formatarMoeda(v.valor_total)}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatarMoeda(v.custo_total)}</td>
                      <td className={`px-4 py-3 font-semibold ${v.lucro >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                        {formatarMoeda(v.lucro)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          margem >= 30 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          margem >= 15 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {margem.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movimentação diária */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-gray-50">Movimentação diária</h2>
          <button onClick={handleExportarMovimentos} className="btn-secondary text-xs flex items-center gap-1.5"
            disabled={movimentosPorDiaArray.length === 0}>
            <Download size={14} />Exportar
          </button>
        </div>
        {movimentosPorDiaArray.length === 0 ? (
          <p className="text-gray-400 text-center py-10 text-sm">Sem movimentos no período</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  {['Data', 'Entradas', 'Saídas', 'Saldo'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {movimentosPorDiaArray.map((mov) => {
                  const saldo = mov.entradas - mov.saidas
                  return (
                    <tr key={mov.data} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{mov.data}</td>
                      <td className="px-4 py-3 text-green-600 dark:text-green-400 font-semibold">+{mov.entradas}</td>
                      <td className="px-4 py-3 text-red-600 dark:text-red-400 font-semibold">-{mov.saidas}</td>
                      <td className={`px-4 py-3 font-bold ${saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {saldo >= 0 ? '+' : ''}{saldo}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Todos os movimentos */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-gray-50">Todos os movimentos</h2>
        </div>
        {movimentos.length === 0 ? (
          <p className="text-gray-400 text-center py-10 text-sm">Sem movimentos no período</p>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="bg-gray-50 dark:bg-gray-800">
                  {['Tipo', 'Produto', 'Qtd', 'Motivo', 'Data'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {movimentos.map((mov) => {
                  const produto = produtos.find((p) => p.id === mov.produto_id)
                  return (
                    <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          mov.tipo_movimento === 'entrada'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {mov.tipo_movimento === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{produto?.nome || '—'}</td>
                      <td className={`px-4 py-3 font-semibold ${mov.tipo_movimento === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {mov.tipo_movimento === 'entrada' ? '+' : '-'}{mov.quantidade}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{mov.motivo || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatarData(mov.criado_em)}</td>
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
