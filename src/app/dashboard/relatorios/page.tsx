'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Produto } from '@/lib/types'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Wallet,
  AlertTriangle,
} from 'lucide-react'
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
        supabase
          .from('movimentos_estoque')
          .select('*')
          .gte('criado_em', dataInicio.toISOString())
          .order('criado_em', { ascending: false })
          .limit(5000),
        supabase.from('produtos').select('*'),
      ])

      const produtosData: Produto[] = produtosRes.data || []
      const movimentosData = movimentosRes.data || []

      setProdutos(produtosData)
      setMovimentos(movimentosData)

      // Agrupa vendas por produto
      const vendas = movimentosData.filter(
        (m: any) => m.tipo_movimento === 'saida'
      )
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
            tem_custo: (produto?.preco_custo || 0) > 0,
          }
        }

        const precoVenda = produto?.preco_venda || 0
        const precoCusto = produto?.preco_custo || 0

        agrupado[venda.produto_id].quantidade_vendida += venda.quantidade
        agrupado[venda.produto_id].valor_total +=
          venda.quantidade * precoVenda
        agrupado[venda.produto_id].custo_total +=
          venda.quantidade * precoCusto
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

  // Estatísticas
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

  // Produtos sem preço de custo
  const produtosSemCusto = vendasPorProduto.filter(
    (v) => !v.tem_custo && v.quantidade_vendida > 0
  )
  const temProdutosSemCusto = produtosSemCusto.length > 0

  // Lucro só dos produtos COM custo cadastrado (pra mostrar valor confiável)
  const lucroConfiavel = vendasPorProduto
    .filter((v) => v.tem_custo)
    .reduce((acc, v) => acc + v.lucro, 0)

  // Movimentos por dia
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

  if (loading)
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Carregando relatórios...
      </div>
    )

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50">
          Relatórios
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Análise de vendas e movimentação
        </p>
      </div>

      {/* Filtro de período */}
      <div className="flex gap-2 flex-wrap">
        {PERIODOS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFiltroData(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filtroData === value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Alerta: produtos sem preço de custo */}
      {temProdutosSemCusto && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-800 dark:text-yellow-300 font-medium text-sm">
              {produtosSemCusto.length} produto(s) sem preço de custo cadastrado
            </p>
            <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
              O lucro desses produtos pode estar incorreto. Cadastre o preço de
              custo em cada produto para ter relatórios mais precisos.
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {produtosSemCusto.slice(0, 5).map((v) => (
                <span
                  key={v.produto_id}
                  className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full"
                >
                  {v.produto_nome}
                </span>
              ))}
              {produtosSemCusto.length > 5 && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  +{produtosSemCusto.length - 5} mais
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            label: temProdutosSemCusto
              ? 'Lucro estimado* (' + margemMedia.toFixed(0) + '%)'
              : 'Lucro estimado (' + margemMedia.toFixed(0) + '%)',
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
            className={bg + ' rounded-xl p-4 border border-transparent'}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={'w-4 h-4 ' + color} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {label}
              </span>
            </div>
            <p className={'text-xl md:text-2xl font-bold ' + color}>{value}</p>
          </div>
        ))}
      </div>

      {/* Nota sobre lucro estimado */}
      {temProdutosSemCusto && (
        <p className="text-xs text-gray-400 -mt-3">
          * O lucro pode estar impreciso porque {produtosSemCusto.length} produto(s) não têm preço de custo cadastrado.
          Lucro dos produtos com custo: <span className="font-semibold text-emerald-500">{formatarMoeda(lucroConfiavel)}</span>
        </p>
      )}

      {/* Gráfico top produtos */}
      {vendasPorProduto.length > 0 && (
        <div className="card dark:bg-gray-900 dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold dark:text-white">
              Top Produtos
            </h2>
            <button
              onClick={handleExportarVendas}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Download size={14} />
              Exportar
            </button>
          </div>

          <div className="space-y-3">
            {vendasPorProduto.slice(0, 7).map((v) => (
              <div key={v.produto_id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    {v.produto_nome}
                    {!v.tem_custo && (
                      <span title="Sem preço de custo">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                      </span>
                    )}
                  </span>
                  <span className="font-medium dark:text-gray-200">
                    {formatarMoeda(v.valor_total)} ({v.quantidade_vendida} un)
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4">
                  <div
                    className="h-4 bg-green-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${(v.valor_total / maxVenda) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela detalhamento */}
      <div className="card dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-bold mb-4 dark:text-white">
          Detalhamento por produto
        </h2>

        {vendasPorProduto.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Nenhuma venda no período
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  {['Produto', 'Qtd', 'Receita', 'Custo', 'Lucro', 'Margem'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendasPorProduto.map((v) => {
                  const margem =
                    v.valor_total > 0 ? (v.lucro / v.valor_total) * 100 : 0
                  return (
                    <tr
                      key={v.produto_id}
                      className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-2 font-medium dark:text-gray-200">
                        <div className="flex items-center gap-1">
                          {v.produto_nome}
                          {!v.tem_custo && (
                            <span title="Sem preço de custo">
                              <AlertTriangle className="w-3 h-3 text-yellow-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 dark:text-gray-300">
                        {v.quantidade_vendida}
                      </td>
                      <td className="py-3 px-2 dark:text-gray-300">
                        {formatarMoeda(v.valor_total)}
                      </td>
                      <td className="py-3 px-2 dark:text-gray-300">
                        {v.tem_custo ? (
                          formatarMoeda(v.custo_total)
                        ) : (
                          <span className="text-yellow-500 text-xs">Não informado</span>
                        )}
                      </td>
                      <td className={'py-3 px-2 font-medium ' + (
                        v.tem_custo
                          ? v.lucro >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600'
                          : 'text-yellow-500'
                      )}>
                        {v.tem_custo ? (
                          formatarMoeda(v.lucro)
                        ) : (
                          <span className="text-xs">~{formatarMoeda(v.lucro)}</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + (
                          !v.tem_custo
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : margem >= 30
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : margem >= 15
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        )}>
                          {v.tem_custo ? margem.toFixed(1) + '%' : '~'}
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
      <div className="card dark:bg-gray-900 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold dark:text-white">
            Movimentação diária
          </h2>
          <button
            onClick={handleExportarMovimentos}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Download size={14} />
            Exportar
          </button>
        </div>

        {movimentosPorDiaArray.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Sem movimentos no período
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  {['Data', 'Entradas', 'Saídas', 'Saldo'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimentosPorDiaArray.map((mov) => {
                  const saldo = mov.entradas - mov.saidas
                  return (
                    <tr
                      key={mov.data}
                      className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-2 font-medium dark:text-gray-200">
                        {mov.data}
                      </td>
                      <td className="py-3 px-2 text-green-600 dark:text-green-400">
                        +{mov.entradas}
                      </td>
                      <td className="py-3 px-2 text-red-600 dark:text-red-400">
                        -{mov.saidas}
                      </td>
                      <td className={'py-3 px-2 font-medium ' + (
                        saldo >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      )}>
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
      <div className="card dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-bold mb-4 dark:text-white">
          Todos os movimentos
        </h2>

        {movimentos.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Sem movimentos no período
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  {['Tipo', 'Produto', 'Qtd', 'Motivo', 'Data'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimentos.map((mov) => {
                  const produto = produtos.find((p) => p.id === mov.produto_id)
                  return (
                    <tr
                      key={mov.id}
                      className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-2">
                        <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + (
                          mov.tipo_movimento === 'entrada'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        )}>
                          {mov.tipo_movimento === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-medium dark:text-gray-200">
                        {produto?.nome || '—'}
                      </td>
                      <td className={'py-3 px-2 font-medium ' + (
                        mov.tipo_movimento === 'entrada'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      )}>
                        {mov.tipo_movimento === 'entrada' ? '+' : '-'}{mov.quantidade}
                      </td>
                      <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                        {mov.motivo || '—'}
                      </td>
                      <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                        {formatarData(mov.criado_em)}
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
