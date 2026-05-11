'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Alerta, Produto } from '@/lib/types'
import { Package, BarChart3, AlertCircle, TrendingUp } from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProdutos: 0,
    totalMovimentos: 0,
    alertas: 0,
    valorEstoque: 0,
  })
  const [alertasRecentes, setAlertasRecentes] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Total de produtos
        const { data: produtos, error: produtosError } = await supabase
          .from('produtos')
          .select('*')

        if (!produtosError && produtos) {
          const valorTotal = produtos.reduce(
            (sum: number, p: Produto) => sum + p.preco_venda * p.quantidade_atual,
            0
          )
          setStats((prev) => ({
            ...prev,
            totalProdutos: produtos.length,
            valorEstoque: valorTotal,
          }))
        }

        // Total de movimentos
        const { data: movimentos, error: movimentosError } = await supabase
          .from('movimentos_estoque')
          .select('*')
          .order('criado_em', { ascending: false })
          .limit(100)

        if (!movimentosError && movimentos) {
          setStats((prev) => ({
            ...prev,
            totalMovimentos: movimentos.length,
          }))
        }

        // Alertas
        const { data: alertas, error: alertasError } = await supabase
          .from('alertas')
          .select('*, produtos(*)')
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
          label="Movimentos"
          value={stats.totalMovimentos}
          color="bg-green-500"
        />
        <StatCard
          icon={AlertCircle}
          label="Alertas"
          value={stats.alertas}
          color="bg-warning"
        />
        <StatCard
          icon={TrendingUp}
          label="Valor Total"
          value={formatarMoeda(stats.valorEstoque)}
          color="bg-purple-500"
        />
      </div>

      {alertasRecentes.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Alertas Recentes</h2>
          <div className="space-y-2">
            {alertasRecentes.slice(0, 5).map((alerta) => (
              <div
                key={alerta.id}
                className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <p className="font-medium">
                  {alerta.tipo_alerta === 'estoque_baixo'
                    ? 'Estoque baixo: '
                    : 'Estoque crítico: '}
                  {alerta.produto?.nome}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
