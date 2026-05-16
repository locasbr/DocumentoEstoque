'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Produto } from '@/lib/types'
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { formatarMoeda, formatarData } from '@/lib/utils'

interface RelatorioVenda {
  produto_id: string
  produto_nome: string
  quantidade_vendida: number
  valor_total: number
}

interface RelatorioMovimento {
  data: string
  entradas: number
  saidas: number
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [vendas, setVendas] = useState<any[]>([])
  const [movimentos, setMovimentos] = useState<any[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [filtroData, setFiltroData] = useState('7d') // 7d, 30d, 90d
  const [vendasPorProduto, setVendasPorProduto] = useState<RelatorioVenda[]>([])

  const fetchRelatorios = useCallback(async () => {
    try {
      // Definir data de início baseado no filtro
      const hoje = new Date()
      let dataInicio = new Date()

      if (filtroData === '7d') {
        dataInicio.setDate(hoje.getDate() - 7)
      } else if (filtroData === '30d') {
        dataInicio.setDate(hoje.getDate() - 30)
      } else if (filtroData === '90d') {
        dataInicio.setDate(hoje.getDate() - 90)
      }

      const [movimentosRes, produtosRes] = await Promise.all([
        supabase
          .from('movimentos_estoque')
          .select('*')
          .gte('criado_em', dataInicio.toISOString()),
        supabase.from('produtos').select('*'),
      ])

      if (!movimentosRes.error && movimentosRes.data) {
        setMovimentos(movimentosRes.data)

        // Processar vendas (saídas)
        const vendas = movimentosRes.data.filter(
          (m: any) => m.tipo_movimento === 'saida'
        )
        setVendas(vendas)

        // Agrupar vendas por produto
        const vendasPorProduto: { [key: string]: RelatorioVenda } = {}

        for (const venda of vendas) {
          if (!vendasPorProduto[venda.produto_id]) {
            const produto = produtosRes.data?.find(
              (p: any) => p.id === venda.produto_id
            )
            vendasPorProduto[venda.produto_id] = {
              produto_id: venda.produto_id,
              produto_nome: produto?.nome || 'Produto Desconhecido',
              quantidade_vendida: 0,
              valor_total: 0,
            }
          }

          vendasPorProduto[venda.produto_id].quantidade_vendida +=
            venda.quantidade
          vendasPorProduto[venda.produto_id].valor_total +=
            venda.quantidade * (produtos.find((p) => p.id === venda.produto_id)?.preco_venda || 0)
        }

        setVendasPorProduto(
          Object.values(vendasPorProduto).sort(
            (a: RelatorioVenda, b: RelatorioVenda) => b.valor_total - a.valor_total
          )
        )
      }

      if (!produtosRes.error && produtosRes.data) {
        setProdutos(produtosRes.data)
      }
    } catch (error) {
      console.error('Error fetching relatorios:', error)
    } finally {
      setLoading(false)
    }
  }, [filtroData, produtos])

  useEffect(() => {
    fetchRelatorios()
  }, [filtroData, fetchRelatorios])

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const totalVendas = vendas.reduce((acc, v) => acc + v.quantidade, 0)
    const totalEntradas = movimentos
      .filter((m) => m.tipo_movimento === 'entrada')
      .reduce((acc, v) => acc + v.quantidade, 0)

    const valorTotalVendas = vendasPorProduto.reduce(
      (acc, v) => acc + v.valor_total,
      0
    )

    return {
      totalVendas,
      totalEntradas,
      valorTotalVendas,
      quantidadeTransacoes: movimentos.length,
    }
  }

  const stats = calcularEstatisticas()

  // Agrupar movimentos por dia
  const movimentosPorDia: { [key: string]: RelatorioMovimento } = {}
  movimentos.forEach((mov: any) => {
    const data = new Date(mov.criado_em).toLocaleDateString('pt-BR')
    if (!movimentosPorDia[data]) {
      movimentosPorDia[data] = { data, entradas: 0, saidas: 0 }
    }
    if (mov.tipo_movimento === 'entrada') {
      movimentosPorDia[data].entradas += mov.quantidade
    } else {
      movimentosPorDia[data].saidas += mov.quantidade
    }
  })

  const movimentosPorDiaArray = Object.values(movimentosPorDia).sort((a: RelatorioMovimento, b: RelatorioMovimento) =>
    new Date(a.data.split('/').reverse().join('-')).getTime() -
    new Date(b.data.split('/').reverse().join('-')).getTime()
  )

  if (loading) {
    return <div className="text-center py-8">Carregando relatórios...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600 mt-2">Análise de vendas e movimentação de estoque</p>
      </div>

      {/* Filtro de período */}
      <div className="flex gap-2 flex-wrap">
        {(['7d', '30d', '90d'] as const).map((periodo) => (
          <button
            key={periodo}
            onClick={() => setFiltroData(periodo)}
            className={`px-4 py-2 rounded font-medium transition ${
              filtroData === periodo
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Últimos {periodo === '7d' ? '7 dias' : periodo === '30d' ? '30 dias' : '90 dias'}
          </button>
        ))}
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Vendas</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalVendas} unid.
              </p>
            </div>
            <TrendingDown className="text-blue-300" size={40} />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Entradas</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalEntradas} unid.
              </p>
            </div>
            <TrendingUp className="text-green-300" size={40} />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Receita em Vendas</p>
              <p className="text-3xl font-bold text-purple-600">
                {formatarMoeda(stats.valorTotalVendas)}
              </p>
            </div>
            <DollarSign className="text-purple-300" size={40} />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Transações</p>
              <p className="text-3xl font-bold text-orange-600">
                {stats.quantidadeTransacoes}
              </p>
            </div>
            <BarChart3 className="text-orange-300" size={40} />
          </div>
        </div>
      </div>

      {/* Produtos Mais Vendidos */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Produtos Mais Vendidos</h2>
        {vendasPorProduto.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Nenhuma venda registrada</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Produto</th>
                  <th className="px-6 py-3 text-right font-semibold">Quantidade</th>
                  <th className="px-6 py-3 text-right font-semibold">Valor Total</th>
                  <th className="px-6 py-3 text-right font-semibold">Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
                {vendasPorProduto.slice(0, 10).map((venda) => (
                  <tr key={venda.produto_id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{venda.produto_nome}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="badge-info">{venda.quantidade_vendida}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">
                      {formatarMoeda(venda.valor_total)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatarMoeda(venda.valor_total / venda.quantidade_vendida)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movimentação por Dia */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Movimentação Diária</h2>
        {movimentosPorDiaArray.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Sem movimentos no período</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Data</th>
                  <th className="px-6 py-3 text-center font-semibold">
                    <span className="text-green-600">Entradas</span>
                  </th>
                  <th className="px-6 py-3 text-center font-semibold">
                    <span className="text-red-600">Saídas</span>
                  </th>
                  <th className="px-6 py-3 text-center font-semibold">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {movimentosPorDiaArray.map((mov) => (
                  <tr key={mov.data} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{mov.data}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-600 font-semibold">+{mov.entradas}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-red-600 font-semibold">-{mov.saidas}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">
                      {mov.entradas - mov.saidas > 0 ? (
                        <span className="text-green-600">+{mov.entradas - mov.saidas}</span>
                      ) : (
                        <span className="text-red-600">{mov.entradas - mov.saidas}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Todos os Movimentos Detalhados */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Todos os Movimentos</h2>
        {movimentos.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Sem movimentos no período</p>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-6 py-3 text-left font-semibold">Produto</th>
                  <th className="px-6 py-3 text-right font-semibold">Quantidade</th>
                  <th className="px-6 py-3 text-left font-semibold">Motivo</th>
                  <th className="px-6 py-3 text-left font-semibold">Data</th>
                </tr>
              </thead>
              <tbody>
                {movimentos.map((mov) => {
                  const produto = produtos.find((p) => p.id === mov.produto_id)
                  return (
                    <tr key={mov.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            mov.tipo_movimento === 'entrada'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {mov.tipo_movimento === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{produto?.nome || 'N/A'}</td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {mov.tipo_movimento === 'entrada'
                          ? '+' + mov.quantidade
                          : '-' + mov.quantidade}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {mov.motivo || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
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
