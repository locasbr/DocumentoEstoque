'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Alerta, Produto, MovimentoEstoque } from '@/lib/types'
import { Package, BarChart3, AlertCircle, TrendingUp, AlertTriangle, Clock, ArrowRight } from 'lucide-react'
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
        // Total de produtos e produtos críticos
        const { data: produtos, error: produtosError } = await supabase
          .from('produtos')
          .select('*')

        if (!produtosError && produtos) {
          const valorTotal = produtos.reduce(
            (sum: number, p: Produto) => sum + p.preco_venda * p.quantidade_atual,
            0
          )
          const criticos = produtos
            .filter((p: Produto) => p.quantidade_atual < p.quantidade_minima)
            .sort((a: Produto, b: Produto) => a.quantidade_atual - b.quantidade_atual)
            .slice(0, 5)
          
          setStats((prev) => ({
            ...prev,
            totalProdutos: produtos.length,
            valorEstoque: valorTotal,
          }))
          setProdutosCriticos(criticos)
        }

        // Movimentos de hoje
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const { data: movimentos, error: movimentosError } = await supabase
          .from('movimentos_estoque')
          .select('*, produto(*)')
          .gte('criado_em', hoje.toISOString())
          .order('criado_em', { ascending: false })
          .limit(100)

        if (!movimentosError && movimentos) {
          setStats((prev) => ({
            ...prev,
            totalMovimentos: movimentos.length,
          }))
          setMovimentosHoje(movimentos)
        }

        // Alertas
        const { data: alertas, error: alertasError } = await supabase
          .from('alertas')
          .select('*, produto:produto_id(nome)')
          .eq('visualizado', false)
          .order('criado_em', { ascending: false })
          .limit(10)

        if (!alertasError && alertas) {
          setStats((prev) => ({
            ...prev,
            alertas: alertas.length,
          }))
          setAlertasRecentes(alertas)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-gray-600 text-sm">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  )

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bem-vindo ao seu sistema de estoque</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Package}
          label="Total de Produtos"
          value={stats.totalProdutos}
          color="bg-blue-500"
        />
        <StatCard
          icon={BarChart3}
          label="Movimentos Hoje"
          value={stats.totalMovimentos}
          color="bg-green-500"
        />
        <StatCard
          icon={AlertCircle}
          label="Alertas Críticos"
          value={stats.alertas}
          color={stats.alertas > 0 ? "bg-red-500" : "bg-gray-400"}
        />
        <StatCard
          icon={TrendingUp}
          label="Valor Total"
          value={formatarMoeda(stats.valorEstoque)}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos Críticos */}
        {produtosCriticos.length > 0 && (
          <div className="card border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={24} className="text-red-500" />
              <h2 className="text-xl font-bold">Produtos Críticos</h2>
            </div>
            <div className="space-y-3">
              {produtosCriticos.map((produto) => (
                <Link
                  key={produto.id}
                  href={`/dashboard/produtos/${produto.id}`}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{produto.nome}</p>
                      <p className="text-sm text-gray-600">SKU: {produto.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{produto.quantidade_atual}</p>
                      <p className="text-xs text-gray-500">Min: {produto.quantidade_minima}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Movimentos de Hoje */}
        {movimentosHoje.length > 0 && (
          <div className="card border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={24} className="text-blue-500" />
              <h2 className="text-xl font-bold">Movimentos de Hoje</h2>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {movimentosHoje.slice(0, 8).map((movimento) => (
                <div
                  key={movimento.id}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {movimento.tipo_movimento === 'entrada' ? (
                        <ArrowRight className="text-green-600 rotate-180" size={18} />
                      ) : (
                        <ArrowRight className="text-red-600" size={18} />
                      )}
                      <div>
                        <p className="font-medium text-sm">{movimento.produto?.nome}</p>
                        <p className="text-xs text-gray-600">{movimento.motivo || 'Sem motivo'}</p>
                      </div>
                    </div>
                    <p className={`font-bold text-sm ${movimento.tipo_movimento === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {movimento.tipo_movimento === 'entrada' ? '+' : '-'}{movimento.quantidade}
                    </p>
                  </div>
                </div>
              ))}
              {movimentosHoje.length === 0 && (
                <p className="text-gray-500 text-center py-4">Nenhum movimento hoje</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Alertas Recentes */}
      {alertasRecentes.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-500" />
            Alertas Pendentes
          </h2>
          <div className="space-y-2">
            {alertasRecentes.slice(0, 5).map((alerta) => (
              <Link
                key={alerta.id}
                href="/dashboard/alertas"
                className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg hover:bg-yellow-100 transition"
              >
                <p className="font-medium">
                  {alerta.tipo_alerta === 'estoque_baixo'
                    ? '⚠️ Estoque Baixo: '
                    : '🔴 Estoque Crítico: '}
                  <span className="text-red-600">{alerta.produto?.nome}</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
