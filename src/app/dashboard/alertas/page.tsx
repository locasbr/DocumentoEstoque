'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Alerta } from '@/lib/types'
import { AlertCircle, Trash2, CheckCircle } from 'lucide-react'
import { formatarData } from '@/lib/utils'
import Alert from '@/components/alerts'

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'nao_visualizados' | 'visualizados'>('nao_visualizados')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchAlertas()
    // Subscribe to changes
    const subscription = supabase
      .channel('alertas')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alertas',
        },
        () => {
          fetchAlertas()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchAlertas = async () => {
    try {
      const { data, error } = await supabase
        .from('alertas')
        .select('*, produtos(*)')
        .order('criado_em', { ascending: false })

      if (!error && data) {
        setAlertas(data)
      }
    } catch (error) {
      console.error('Error fetching alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarComoVisto = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alertas')
        .update({ visualizado: true })
        .eq('id', id)

      if (!error) {
        setMessage('Alerta marcado como visualizado')
        fetchAlertas()
      }
    } catch (error) {
      console.error('Error updating alerta:', error)
    }
  }

  const handleDeletar = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este alerta?')) {
      try {
        const { error } = await supabase.from('alertas').delete().eq('id', id)

        if (!error) {
          setMessage('Alerta deletado com sucesso')
          fetchAlertas()
        }
      } catch (error) {
        console.error('Error deleting alerta:', error)
      }
    }
  }

  const alertasFiltrados = alertas.filter((a) => {
    if (filtro === 'nao_visualizados') return !a.visualizado
    if (filtro === 'visualizados') return a.visualizado
    return true
  })

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Alertas de Estoque</h1>
        <p className="text-gray-600 mt-2">Monitore produtos com estoque baixo ou crítico</p>
      </div>

      {message && <Alert message={message} type="success" />}

      <div className="card">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filtro === 'todos'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({alertas.length})
          </button>
          <button
            onClick={() => setFiltro('nao_visualizados')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filtro === 'nao_visualizados'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Não Visualizados ({alertas.filter((a) => !a.visualizado).length})
          </button>
          <button
            onClick={() => setFiltro('visualizados')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filtro === 'visualizados'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Visualizados ({alertas.filter((a) => a.visualizado).length})
          </button>
        </div>

        {alertasFiltrados.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            Nenhum alerta encontrado
          </p>
        ) : (
          <div className="space-y-4">
            {alertasFiltrados.map((alerta) => (
              <div
                key={alerta.id}
                className={`p-4 border rounded-lg flex items-start justify-between ${
                  alerta.visualizado ? 'bg-gray-50' : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <AlertCircle
                    className={
                      alerta.tipo_alerta === 'estoque_critico'
                        ? 'text-red-600'
                        : 'text-warning'
                    }
                    size={24}
                  />
                  <div>
                    <h3 className="font-semibold">{alerta.produto?.nome}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {alerta.tipo_alerta === 'estoque_critico'
                        ? '🔴 Estoque crítico'
                        : '🟡 Estoque baixo'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Quantidade atual: {alerta.produto?.quantidade_atual} unidades
                    </p>
                    <p className="text-xs text-gray-500">
                      Mínimo necessário: {alerta.produto?.quantidade_minima} unidades
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatarData(alerta.criado_em)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!alerta.visualizado && (
                    <button
                      onClick={() => handleMarcarComoVisto(alerta.id)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded"
                      title="Marcar como visualizado"
                    >
                      <CheckCircle size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletar(alerta.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                    title="Deletar alerta"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
