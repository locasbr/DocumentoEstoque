'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MovimentoEstoque, Produto } from '@/lib/types'
import { Plus, ArrowDown, ArrowUp, ShoppingCart, TrendingUp } from 'lucide-react'
import { formatarData } from '@/lib/utils'

export default function EstoquePage() {
  const [movimentos, setMovimentos] = useState<MovimentoEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'entrada' | 'saida'>('todos')
  const [produtos, setProdutos] = useState<Produto[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [movimentosRes, produtosRes] = await Promise.all([
        supabase
          .from('movimentos_estoque')
          .select('*, produtos(*)')
          .order('criado_em', { ascending: false }),
        supabase
          .from('produtos')
          .select('*'),
      ])

      if (!movimentosRes.error && movimentosRes.data) {
        setMovimentos(movimentosRes.data)
      }

      if (!produtosRes.error && produtosRes.data) {
        setProdutos(produtosRes.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
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

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estoque</h1>
          <p className="text-gray-600 mt-2">Gerenciar movimentação de produtos</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/estoque/movimento" className="btn-primary">
            <Plus size={20} className="inline mr-2" />
            Novo Movimento
          </Link>
          <Link href="/dashboard/pdv" className="btn-secondary">
            <ShoppingCart size={20} className="inline mr-2" />
            PDV
          </Link>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Entradas Hoje</p>
              <p className="text-3xl font-bold text-green-600">{entradasHoje}</p>
            </div>
            <ArrowDown className="text-green-400" size={32} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Saídas Hoje</p>
              <p className="text-3xl font-bold text-red-600">{saidasHoje}</p>
            </div>
            <ArrowUp className="text-red-400" size={32} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Produtos Baixo Estoque</p>
              <p className="text-3xl font-bold text-yellow-600">
                {produtosBaixoEstoque.length}
              </p>
            </div>
            <TrendingUp className="text-yellow-400" size={32} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Produtos</p>
              <p className="text-3xl font-bold text-blue-600">{produtos.length}</p>
            </div>
            <ShoppingCart className="text-blue-400" size={32} />
          </div>
        </div>
      </div>

      {/* Alertas de Produtos Baixo Estoque */}
      {produtosBaixoEstoque.length > 0 && (
        <div className="card bg-yellow-50 border-yellow-300">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-bold text-yellow-900">Produtos com Baixo Estoque</h3>
              <p className="text-sm text-yellow-800 mt-1">
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
            <h2 className="text-xl font-bold mb-4">Histórico de Movimentos</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Buscar por produto ou motivo..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="input-field flex-1"
            />
            <div className="flex gap-2">
              {(['todos', 'entrada', 'saida'] as const).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setTipoFiltro(tipo)}
                  className={`px-4 py-2 rounded font-medium transition ${
                    tipoFiltro === tipo
                      ? tipo === 'entrada'
                        ? 'bg-green-600 text-white'
                        : tipo === 'saida'
                        ? 'bg-red-600 text-white'
                        : 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tipo === 'todos' ? 'Todos' : tipo === 'entrada' ? 'Entradas' : 'Saídas'}
                </button>
              ))}
            </div>
          </div>

          {movimentosFiltrados.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Nenhum movimento encontrado
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {movimentosFiltrados.map((movimento) => (
                <div
                  key={movimento.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    movimento.tipo_movimento === 'entrada'
                      ? 'bg-green-50 border-green-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`p-2 rounded-lg ${
                          movimento.tipo_movimento === 'entrada'
                            ? 'bg-green-200'
                            : 'bg-red-200'
                        }`}
                      >
                        {movimento.tipo_movimento === 'entrada' ? (
                          <ArrowDown
                            className="text-green-700"
                            size={20}
                          />
                        ) : (
                          <ArrowUp className="text-red-700" size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">
                          {movimento.produto?.nome}
                        </p>
                        <p className="text-sm text-gray-600">
                          {movimento.motivo || 'Sem motivo especificado'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        movimento.tipo_movimento === 'entrada'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {movimento.tipo_movimento === 'entrada'
                          ? '+' + movimento.quantidade
                          : '-' + movimento.quantidade}
                      </p>
                      <p className="text-xs text-gray-500">
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
