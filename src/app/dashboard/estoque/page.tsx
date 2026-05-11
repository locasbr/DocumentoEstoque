'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MovimentoEstoque } from '@/lib/types'
import { Plus, ArrowDown, ArrowUp } from 'lucide-react'
import { formatarData } from '@/lib/utils'

export default function EstoquePage() {
  const [movimentos, setMovimentos] = useState<MovimentoEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    fetchMovimentos()
  }, [])

  const fetchMovimentos = async () => {
    try {
      const { data, error } = await supabase
        .from('movimentos_estoque')
        .select('*, produto(*)')
        .order('criado_em', { ascending: false })

      if (!error && data) {
        setMovimentos(data)
      }
    } catch (error) {
      console.error('Error fetching movimentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const movimentosFiltrados = movimentos.filter(
    (m) =>
      m.produto?.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      m.motivo?.toLowerCase().includes(filtro.toLowerCase())
  )

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estoque</h1>
          <p className="text-gray-600 mt-2">Controlar entrada e saída de produtos</p>
        </div>
        <Link href="/dashboard/estoque/movimento" className="btn-primary">
          <Plus size={20} className="inline mr-2" />
          Novo Movimento
        </Link>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="Buscar movimentos..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="input-field mb-6"
        />

        {movimentosFiltrados.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            Nenhum movimento encontrado
          </p>
        ) : (
          <div className="space-y-4">
            {movimentosFiltrados.map((movimento) => (
              <div
                key={movimento.id}
                className="p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        movimento.tipo_movimento === 'entrada'
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}
                    >
                      {movimento.tipo_movimento === 'entrada' ? (
                        <ArrowDown className="text-green-600" size={24} />
                      ) : (
                        <ArrowUp className="text-red-600" size={24} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{movimento.produto?.nome}</p>
                      <p className="text-sm text-gray-600">
                        {movimento.motivo || 'Sem motivo'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {movimento.tipo_movimento === 'entrada'
                        ? '+' + movimento.quantidade
                        : '-' + movimento.quantidade}
                    </p>
                    <p className="text-sm text-gray-600">
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
  )
}
