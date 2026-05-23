'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Alerta, Produto, MovimentoEstoque } from '@/lib/types'
import {
  Package, BarChart3, AlertCircle, TrendingUp,
  AlertTriangle, Clock, ArrowDownLeft, ArrowUpRight
} from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProdutos: 0,
    totalMovimentos: 0,
    alertas: 0,
    valorEstoque: 0,
  })
  const [produtosCriticos, setProdutosCriticos] = useState<Produto[]>([])
  const [movimentosHoje, setMovimentosHoje] = useState<MovimentoEstoque[]>([])
  const [alertasRecentes, setAlertasRecentes] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: produtos } = await supabase.from('produtos').select('*')
        if (produtos) {
          const valorTotal = produtos.reduce(
            (sum: number, p: Produto) => sum + p.preco_venda * p.quantidade_atual, 0
          )
          const criticos = produtos
            .filter((p: Produto) => p.quantidade_atual < p.quantidade_minima)
            .sort((a: Produto, b: Produto) => a.quantidade_atual - b.quantidade_atual)
            .slice(0, 5)
          setStats((prev) => ({ ...prev, totalProdutos: produtos.length, valorEstoque: valorTotal }))
          setProdutosCriticos(criticos)
        }

        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const { data: movimentos } = await supabase
          .from('movimentos_estoque')
          .select('*, produto(*)')
          .gte('criado_em', hoje.toISOString())
          .order('criado_em', { ascending: false })
          .limit(100)
        if (movimentos) {
          setStats((prev) => ({ ...prev, totalMovimentos: movimentos.length }))
          setMovimentosHoje(movimentos)
        }

        const { data: alertas } = await supabase
          .from('alertas')
          .select('*, produto:produto_id(nome)')
          .eq('visualizado', false)
          .order('criado_em', { ascending: false })
          .limit(10)
        if (alertas) {
          setStats((prev) => ({ ...prev, alertas: alertas.length }))
          setAlertasRecentes(alertas)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-0">

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Bem-vindo ao seu sistema de estoque</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { icon: Package,     label: 'Total de Produtos', value: stats.totalProdutos,                color: 'bg-blue-500' },
          { icon: BarChart3,   label: 'Movimentos Hoje',   value: stats.totalMovimentos,               color: 'bg-green-500' },
          { icon: AlertCircle, label: 'Alertas Críticos',  value: stats.alertas,                       color: stats.alertas > 0 ? 'bg-red-500' : 'bg-gray-400' },
          { icon: TrendingUp,  label: 'Valor em Estoque',  value: formatarMoeda(stats.valorEstoque),   color: 'bg-purple-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-3">
            <div className={`${color} p-2.5 rounded-lg flex-shrink-0`}>
              <Icon size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-50 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Produtos críticos + Movimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {produtosCriticos.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/40">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
              <h2 className="font-bold text-gray-900 dark:text-gray-50">Produtos Críticos</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {produtosCriticos.map((produto) => (
                <Link
                  key={produto.id}
                  href={`/dashboard/produtos/${produto.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{produto.nome}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {produto.sku}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="font-bold text-red-600 dark:text-red-400">{produto.quantidade_atual}</p>
                    <p className="text-xs text-gray-400">Min: {produto.quantidade_minima}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {movimentosHoje.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/40">
              <Clock size={18} className="text-blue-500 flex-shrink-0" />
              <h2 className="font-bold text-gray-900 dark:text-gray-50">Movimentos de Hoje</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
              {movimentosHoje.slice(0, 8).map((movimento) => (
                <div key={movimento.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-1.5 rounded-full flex-shrink-0 ${
                      movimento.tipo_movimento === 'entrada'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {movimento.tipo_movimento === 'entrada'
                        ? <ArrowDownLeft size={14} className="text-green-600 dark:text-green-400" />
                        : <ArrowUpRight size={14} className="text-red-600 dark:text-red-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{movimento.produto?.nome}</p>
                      <p className="text-xs text-gray-400 truncate">{movimento.motivo || '—'}</p>
                    </div>
                  </div>
                  <p className={`font-bold text-sm ml-3 flex-shrink-0 ${
                    movimento.tipo_movimento === 'entrada'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {movimento.tipo_movimento === 'entrada' ? '+' : '-'}{movimento.quantidade}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alertas */}
      {alertasRecentes.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-900/40">
            <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0" />
            <h2 className="font-bold text-gray-900 dark:text-gray-50">Alertas Pendentes</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {alertasRecentes.slice(0, 5).map((alerta) => (
              <Link
                key={alerta.id}
                href="/dashboard/alertas"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  alerta.tipo_alerta === 'estoque_critico' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">
                    {alerta.tipo_alerta === 'estoque_baixo' ? 'Estoque Baixo' : 'Estoque Crítico'}:
                  </span>{' '}
                  <span className="text-red-600 dark:text-red-400">{alerta.produto?.nome}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {produtosCriticos.length === 0 && movimentosHoje.length === 0 && alertasRecentes.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum dado ainda</p>
          <p className="text-sm mt-1">Adicione produtos para começar</p>
          <Link href="/dashboard/produtos/novo" className="inline-block mt-4 btn-primary text-sm px-4 py-2">
            + Adicionar produto
          </Link>
        </div>
      )}
    </div>
  )
}