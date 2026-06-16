'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/contexts/NotificationContext'
import { useMembro } from '@/hooks/useMembro'
import { formatarData } from '@/lib/utils'
import { Plus, Eye, EyeOff, Trash2, UserPlus } from 'lucide-react'

interface Membro {
  id: string
  dono_id: string
  user_id: string
  email: string
  nivel: 'dono' | 'funcionario'
  status: 'pendente' | 'ativo' | 'inativo'
  created_at: string
}

export default function EquipePage() {
  const { membro: usuarioAtual, isDono, isLoading: loadingMembro } = useMembro()
  const { addNotification } = useNotification()

  const [membros, setMembros] = useState<Membro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')

  const donoId = usuarioAtual?.dono_id || usuarioAtual?.user_id

  // Buscar lista de membros
  const fetchMembros = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('membros')
        .select('*')
        .eq('dono_id', donoId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembros(data || [])
    } catch (error) {
      console.error('Erro ao buscar membros:', error)
      addNotification('Erro ao carregar membros', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [addNotification, donoId])

  useEffect(() => {
    if (loadingMembro) return

    if (!isDono) {
      addNotification('Apenas donos podem acessar esta página', 'error')
      return
    }

    fetchMembros()
  }, [isDono, loadingMembro, donoId, addNotification, fetchMembros])

  

 const handleInviteNewMember = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!newEmail.trim()) {
    addNotification('Email é obrigatório', 'warning')
    return
  }

  if (!newEmail.includes('@')) {
    addNotification('Email inválido', 'warning')
    return
  }

  try {
    setIsInviting(true)

    // Chama a API Route (servidor) — NÃO afeta a sessão do dono
    const response = await fetch('/api/equipe/convidar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newEmail,
        donoId: donoId,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 409) {
        addNotification('Este funcionário já foi convidado', 'warning')
      } else {
        addNotification(data.error || 'Erro ao convidar', 'error')
      }
      return
    }

    // Sucesso!
    setGeneratedPassword(data.tempPassword)
    addNotification(
      `Funcionário convidado com sucesso! Senha: ${data.tempPassword}`,
      'success'
    )
    setNewEmail('')
    fetchMembros()
  } catch (error) {
    console.error('Erro ao convidar funcionário:', error)
    addNotification('Erro ao convidar funcionário', 'error')
  } finally {
    setIsInviting(false)
  }
}

  const toggleStatus = async (memberId: string, currentStatus: string) => {
    try {
      const newStatus =
        currentStatus === 'ativo' ? 'inativo' : currentStatus === 'inativo' ? 'ativo' : 'ativo'

      const { error } = await supabase
        .from('membros')
        .update({ status: newStatus })
        .eq('id', memberId)

      if (error) throw error

      addNotification(`Funcionário ${newStatus === 'ativo' ? 'ativado' : 'desativado'}`, 'success')
      fetchMembros()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      addNotification('Erro ao atualizar funcionário', 'error')
    }
  }

  const deleteMember = async (memberId: string) => {
    if (!confirm('Tem certeza que deseja remover este funcionário?')) return

    try {
      const { error } = await supabase.from('membros').delete().eq('id', memberId)

      if (error) throw error

      addNotification('Funcionário removido com sucesso', 'success')
      fetchMembros()
    } catch (error) {
      console.error('Erro ao remover funcionário:', error)
      addNotification('Erro ao remover funcionário', 'error')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      ativo: 'badge-success',
      inativo: 'badge-danger',
      pendente: 'badge-warning',
    }
    return badges[status as keyof typeof badges] || 'badge-info'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      ativo: 'Ativo',
      inativo: 'Inativo',
      pendente: 'Pendente',
    }
    return labels[status as keyof typeof labels] || status
  }

  if (loadingMembro) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!isDono) {
    return (
      <div className="card text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Gerenciar Equipe</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Convide funcionários e controle suas permissões
        </p>
      </div>

      {/* Invite Form */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <UserPlus size={20} /> Convidar Novo Funcionário
        </h2>

        <form onSubmit={handleInviteNewMember} className="space-y-4">
          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              type="email"
              placeholder="Email do funcionário"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="input-field flex-1"
              disabled={isInviting}
            />
            <button
              type="submit"
              disabled={isInviting}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={18} /> {isInviting ? 'Enviando...' : 'Convidar'}
            </button>
          </div>

          {generatedPassword && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Senha temporária gerada:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={generatedPassword}
                  readOnly
                  className="input-field flex-1 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword)
                    addNotification('Senha copiada!', 'success')
                  }}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                >
                  Copiar
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                ⚠️ Compartilhe esta senha com segurança. O funcionário deve alterá-la no primeiro login.
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Members List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Funcionários ({membros.length})
        </h2>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : membros.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Nenhum funcionário convidado ainda
          </div>
        ) : (
          <div className="overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4">
  Funcionários ({membros.length})
</h3>

{isLoading ? (
  <div className="text-center py-8">Carregando...</div>
) : membros.length === 0 ? (
  <div className="text-center py-8 text-gray-500">
    Nenhum funcionário convidado ainda
  </div>
) : (
  <>
    {/* ══════════ DESKTOP: Tabela ══════════ */}
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nível</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Data</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
          </tr>
        </thead>
        <tbody>
          {membros.map((membro) => (
            <tr key={membro.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="py-3 px-4">
                <span className="font-medium">{membro.email}</span>
              </td>
              <td className="py-3 px-4">
                <span className={`badge ${membro.nivel === 'dono' ? 'badge-info' : 'badge-warning'}`}>
                  {membro.nivel === 'dono' ? 'Dono' : 'Funcionário'}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`badge ${getStatusBadge(membro.status)}`}>
                  {getStatusLabel(membro.status)}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">
                {formatarData(membro.created_at)}
              </td>
              <td className="py-3 px-4 text-right">
                {membro.nivel !== 'dono' && (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => toggleStatus(membro.id, membro.status)}
                      className={`px-3 py-1 rounded text-xs font-medium transition ${
                        membro.status === 'ativo'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 hover:bg-red-200'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 hover:bg-green-200'
                      }`}
                    >
                      {membro.status === 'ativo' ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => deleteMember(membro.id)}
                      className="px-3 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                      title="Remover funcionário"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* ══════════ MOBILE: Cards ══════════ */}
    <div className="md:hidden space-y-3">
      {membros.map((membro) => (
        <div
          key={membro.id}
          className="card p-4 border dark:border-gray-700 rounded-xl"
        >
          {/* Header: email + badges */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{membro.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatarData(membro.created_at)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 ml-2">
              <span className={`badge text-xs ${membro.nivel === 'dono' ? 'badge-info' : 'badge-warning'}`}>
                {membro.nivel === 'dono' ? 'Dono' : 'Funcionário'}
              </span>
              <span className={`badge text-xs ${getStatusBadge(membro.status)}`}>
                {getStatusLabel(membro.status)}
              </span>
            </div>
          </div>

          {/* Ações */}
          {membro.nivel !== 'dono' && (
            <div className="flex items-center gap-2 pt-2 border-t dark:border-gray-700">
              <button
                onClick={() => toggleStatus(membro.id, membro.status)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                  membro.status === 'ativo'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                }`}
              >
                {membro.status === 'ativo' ? '⏸ Desativar' : '▶ Ativar'}
              </button>
              <button
                onClick={() => deleteMember(membro.id)}
                className="py-2 px-4 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  </>
)}
          </div>
        )}
      </div>
    </div>
  )
}
