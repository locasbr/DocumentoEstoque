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
        .select('*, produto:produto_id(*)')
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

  const handleMarcarTodosComoVistos = async () => {
    const naoVistos = alertas.filter((a) => !a.visualizado)
    if (naoVistos.length === 0) return
    if (!confirm(`Marcar ${naoVistos.length} alerta(s) como visualizado(s)?`)) return
    try {
      const ids = naoVistos.map((a) => a.id)
      const { error } = await supabase
        .from('alertas')
        .update({ visualizado: true })
        .in('id', ids)
      if (!error) {
        setMessage(`${naoVistos.length} alerta(s) marcado(s) como visualizado(s)`)
        fetchAlertas()
      }
    } catch (error) {
      console.error('Erro ao marcar alertas:', error)
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
        <div className="flex flex-wrap gap-2 md:gap-4 mb-6">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base font-medium h-10 flex items-center ${
              filtro === 'todos'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Todos ({alertas.length})
          </button>
          <button
            onClick={() => setFiltro('nao_visualizados')}
            className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base font-medium h-10 flex items-center ${
              filtro === 'nao_visualizados'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Não Visualizados ({alertas.filter((a) => !a.visualizado).length})
          </button>
          <button
            onClick={() => setFiltro('visualizados')}
            className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base font-medium h-10 flex items-center ${
              filtro === 'visualizados'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Visualizados ({alertas.filter((a) => a.visualizado).length})
          </button>

      {alertas.filter((a) => !a.visualizado).length > 0 && (
        <button
          onClick={handleMarcarTodosComoVistos}
          className="px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium h-10 flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800 transition-colors ml-auto"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Marcar todos como lidos
        </button>
      )}
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
                className={`p-4 border rounded-lg flex flex-col md:flex-row md:items-start md:justify-between gap-4 ${
                  alerta.visualizado ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}
              >
                <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                  <AlertCircle
                    className={`flex-shrink-0 mt-1 ${
                      alerta.tipo_alerta === 'estoque_critico'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}
                    size={24}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50 break-words">{alerta.produto?.nome}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {alerta.tipo_alerta === 'estoque_critico'
                        ? '🔴 Estoque crítico'
                        : '🟡 Estoque baixo'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Quantidade atual: <span className="font-bold text-red-600 dark:text-red-400">{alerta.produto?.quantidade_atual}</span> unidades
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Mínimo necessário: <span className="font-bold">{alerta.produto?.quantidade_minima}</span> unidades
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {formatarData(alerta.criado_em)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 self-end md:self-start">
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