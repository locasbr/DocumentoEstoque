'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/contexts/NotificationContext'
import { formatarMoeda } from '@/lib/utils'
import {
  Users, Plus, Search, Phone, DollarSign,
  AlertTriangle, Trash2, Eye
} from 'lucide-react'

interface Cliente {
  id: string
  nome: string
  telefone: string
  cpf: string
  email: string
  endereco: string
  notas: string
  criado_em: string
  saldo_fiado?: number
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const { addNotification } = useNotification()

  const fetchClientes = useCallback(async () => {
  try {
    // 1 query: todos os clientes
    const { data: clientesData, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome')

    if (error) throw error

    // 1 query: TODOS os fiados de uma vez (em vez de N queries)
    const { data: todosOsFiados } = await supabase
      .from('fiado')
      .select('cliente_id, tipo, valor')

    // Agrupa saldos no JavaScript (instantâneo)
    const saldoPorCliente: Record<string, number> = {}
    ;(todosOsFiados || []).forEach((f: any) => {
      const id = f.cliente_id
      if (!saldoPorCliente[id]) saldoPorCliente[id] = 0
      saldoPorCliente[id] += f.tipo === 'debito' ? Number(f.valor) : -Number(f.valor)
    })

    // Combina clientes + saldos
    const clientesComSaldo = (clientesData || []).map((cliente: Cliente) => ({
      ...cliente,
      saldo_fiado: saldoPorCliente[cliente.id] || 0,
    }))

    setClientes(clientesComSaldo)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    addNotification('Erro ao carregar clientes', 'error')
  } finally {
    setLoading(false)
  }
}, [addNotification]) 

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  const handleDeletar = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja remover "${nome}"? Os registros de fiado também serão removidos.`)) return
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) throw error
      addNotification(`Cliente "${nome}" removido`, 'success')
      fetchClientes()
    } catch (error) {
      addNotification('Erro ao remover cliente', 'error')
    }
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    c.telefone.includes(filtro) ||
    c.cpf.includes(filtro)
  )

  const totalFiado = clientes.reduce((acc, c) => acc + Math.max(0, c.saldo_fiado || 0), 0)
  const clientesComDebito = clientes.filter(c => (c.saldo_fiado || 0) > 0).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h2>
          <p className="text-gray-500 dark:text-gray-400">Gerencie seus clientes e controle o fiado</p>
        </div>
        <Link
          href="/dashboard/clientes/novo"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total de Clientes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{clientes.length}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Fiado Pendente</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatarMoeda(totalFiado)}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Clientes com Débito</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{clientesComDebito}</p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou CPF..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="input-field pl-10 w-full"
        />
      </div>

      {/* Lista de Clientes */}
      {clientesFiltrados.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            {filtro ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </h3>
          <p className="text-gray-400 dark:text-gray-500 mb-4">
            {filtro ? 'Tente buscar com outros termos' : 'Cadastre seu primeiro cliente para controlar o fiado'}
          </p>
          {!filtro && (
            <Link href="/dashboard/clientes/novo" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Cadastrar primeiro cliente
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientesFiltrados.map((cliente) => (
            <div key={cliente.id} className="card p-5 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{cliente.nome}</h4>
                    {cliente.telefone && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {cliente.telefone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Saldo Fiado */}
              <div className={`p-3 rounded-xl mb-4 ${
                (cliente.saldo_fiado || 0) > 0
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              }`}>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Saldo Fiado</p>
                <p className={`text-lg font-bold ${
                  (cliente.saldo_fiado || 0) > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {(cliente.saldo_fiado || 0) > 0
                    ? `${formatarMoeda(cliente.saldo_fiado || 0)} devendo`
                    : 'Em dia ✓'
                  }
                </p>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/clientes/${cliente.id}`}
                  className="flex-1 btn-primary text-xs flex items-center justify-center gap-1 py-2"
                >
                  <Eye className="w-3.5 h-3.5" /> Ver detalhes
                </Link>
                <button
                  onClick={() => handleDeletar(cliente.id, cliente.nome)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
