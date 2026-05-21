'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MovimentoEstoque, Produto } from '@/lib/types'
import { Plus, ArrowDown, ArrowUp, ShoppingCart, TrendingUp, Download, AlertTriangle } from 'lucide-react'
import { formatarData } from '@/lib/utils'
import { useNotification } from '@/contexts/NotificationContext'
import { exportMovimentosDiariosCSV } from '@/lib/export-utils'
import { SkeletonTable } from '@/components/skeleton-loaders'

export default function EstoquePage() {
  const [movimentos, setMovimentos] = useState<MovimentoEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'entrada' | 'saida'>('todos')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const { addNotification } = useNotification()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [movimentosRes, produtosRes] = await Promise.all([
        supabase
          .from('movimentos_estoque')
          .select('*, produtos(*)')
          .order('criado_em', { ascending: false })
          .limit(500),
        supabase
          .from('produtos')
          .select('*'),
      ])

      if (!movimentosRes.error && movimentosRes.data) {
        setMovimentos(movimentosRes.data)
      }

      if (!produtosRes.error && produtosRes.data) {
        setProdutos(produtosRes.data)
        // Notificar sobre produtos com estoque crítico
        const criticos = produtosRes.data.filter((p: Produto) => p.quantidade_atual === 0)
        if (criticos.length > 0) {
          addNotification(
            `⚠️ ${criticos.length} produto(s) com ESTOQUE ZERADO!`,
            'warning',
            0
          )
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      addNotification('Erro ao carregar dados', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Calcular estatísticas do dia
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
  const produtosBaixoEstoque = produtos.filter(
    (p) => p.quantidade_atual < p.quantidade_minima
  )
  const produtosCriticos = produtos.filter(p => p.quantidade_atual === 0)

  const movimentosFiltrados = movimentos
    .filter(
      (m) =>
        m.produto?.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        m.motivo?.toLowerCase().includes(filtro.toLowerCase())
    )
    .filter((m) => {
      if (tipoFiltro === 'todos') return true
      return m.tipo_movimento === tipoFiltro
    })

  const handleExportarMovimentos = () => {
    const hoje = new Date()
    const dataStr = hoje.toLocaleDateString('pt-BR')
    const movimentosPorDia = [
      {
        data: dataStr,
        entradas: entradasHoje,
        saidas: saidasHoje,
      }
    ]
    exportMovimentosDiariosCSV(movimentosPorDia, 'hoje')
    addNotification('Movimentos exportados com sucesso!', 'success', 3000)
  }

  if (loading) {
    return <SkeletonTable />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Estoque</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gerenciar movimentação de produtos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/estoque/movimento" className="btn-primary">
            <Plus size={20} className="inline mr-2" />
            <span className="hidden sm:inline">Novo</span> Movimento
          </Link>
          <Link href="/dashboard/pdv" className="btn-secondary">
            <ShoppingCart size={20} className="inline mr-2" />
            <span className="hidden sm:inline">PDV</span>
          </Link>
          <button
            onClick={handleExportarMovimentos}
            className="btn-outline"
          >
            <Download size={20} className="inline mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Alertas Críticos */}
      {produtosCriticos.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="font-bold text-red-900 dark:text-red-100">ATENÇÃO: Estoque Zerado!</h3>
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
              {produtosCriticos.map(p => p.nome).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">Entradas Hoje</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{entradasHoje}</p>
            </div>
            <ArrowDown className="text-green-400 dark:text-green-500 flex-shrink-0" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">Saídas Hoje</p>
              <p className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">{saidasHoje}</p>
            </div>
            <ArrowUp className="text-red-400 dark:text-red-500 flex-shrink-0" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">Baixo Estoque</p>
              <p className="text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {produtosBaixoEstoque.length}
              </p>
            </div>
            <TrendingUp className="text-yellow-400 dark:text-yellow-500 flex-shrink-0" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm">Total Produtos</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{produtos.length}</p>
            </div>
            <ShoppingCart className="text-blue-400 dark:text-blue-500 flex-shrink-0" size={24} />
          </div>
        </div>
      </div>

      {/* Alertas de Produtos Baixo Estoque */}
      {produtosBaixoEstoque.length > 0 && produtosBaixoEstoque.length !== produtosCriticos.length && (
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">⚠️</div>
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 dark:text-yellow-100">Produtos com Baixo Estoque</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1 break-words">
                {produtosBaixoEstoque.map((p) => p.nome).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros e Lista de Movimentos */}
      <div className="card">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4">Histórico de Movimentos</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Buscar por produto ou motivo..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="input-field flex-1"
            />
            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              {(['todos', 'entrada', 'saida'] as const).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setTipoFiltro(tipo)}
                  className={`px-3 md:px-4 py-2 rounded font-medium transition whitespace-nowrap text-sm md:text-base ${
                    tipoFiltro === tipo
                      ? tipo === 'entrada'
                        ? 'bg-green-600 dark:bg-green-700 text-white'
                        : tipo === 'saida'
                        ? 'bg-red-600 dark:bg-red-700 text-white'
                        : 'bg-blue-600 dark:bg-blue-700 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {tipo === 'todos' ? 'Todos' : tipo === 'entrada' ? 'Entradas' : 'Saídas'}
                </button>
              ))}
            </div>
          </div>

          {movimentosFiltrados.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              Nenhum movimento encontrado
            </p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {movimentosFiltrados.map((movimento) => (
                <div
                  key={movimento.id}
                  className={`p-3 md:p-4 rounded-lg border-l-4 transition ${
                    movimento.tipo_movimento === 'entrada'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-700'
                  }`}
                >
                  <div className="flex items-start md:items-center justify-between gap-2 md:gap-4 flex-col md:flex-row">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      <div
                        className={`p-2 rounded-lg flex-shrink-0 ${
                          movimento.tipo_movimento === 'entrada'
                            ? 'bg-green-200 dark:bg-green-800'
                            : 'bg-red-200 dark:bg-red-800'
                        }`}
                      >
                        {movimento.tipo_movimento === 'entrada' ? (
                          <ArrowDown
                            className="text-green-700 dark:text-green-300"
                            size={18}
                          />
                        ) : (
                          <ArrowUp className="text-red-700 dark:text-red-300" size={18} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-50 truncate">
                          {movimento.produto?.nome}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {movimento.motivo || 'Sem motivo'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-lg ${
                        movimento.tipo_movimento === 'entrada'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {movimento.tipo_movimento === 'entrada'
                          ? '+' + movimento.quantidade
                          : '-' + movimento.quantidade}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatarData(movimento.criado_em)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
