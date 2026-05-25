'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/contexts/NotificationContext'
import { useMembro } from '@/hooks/useMembro'
import { formatarData } from '@/lib/utils'
import { Mail, Plus, Eye, EyeOff, Trash2, UserPlus } from 'lucide-react'

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

  const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

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

      // Verifica se o email já existe
      const { data: existingMember } = await supabase
        .from('membros')
        .select('id')
        .eq('email', newEmail)
        .eq('dono_id', donoId)
        .single()

      if (existingMember) {
        addNotification('Este funcionário já foi convidado', 'warning')
        return
      }

      // Gera senha temporária
      const tempPassword = generatePassword()
      setGeneratedPassword(tempPassword)

      // Cria nova conta de usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmail,
        password: tempPassword,
      })

      if (authError) {
        // Se o email já está registrado, continua mesmo assim
        if (authError.message.includes('User already registered')) {
          console.log('Email já registrado, prosseguindo com registro de membro')
        } else {
          throw authError
        }
      }

      const userId = authData?.user?.id || null

      // Registra membro na tabela
      const { error: insertError } = await supabase.from('membros').insert({
        dono_id: donoId,
        user_id: userId,
        email: newEmail,
        nivel: 'funcionario',
        status: 'pendente',
      })

      if (insertError) throw insertError

      addNotification(`Funcionário convidado com sucesso! Senha: ${tempPassword}`, 'success')
      setNewEmail('')
      setGeneratedPassword(tempPassword)

      // Recarrega a lista
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Nível
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Data
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {membros.map((membro) => (
                  <tr
                    key={membro.id}
                    className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{membro.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium text-gray-700 dark:text-gray-300">
                        {membro.nivel === 'dono' ? 'Dono' : 'Funcionário'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`${getStatusBadge(membro.status)}`}>
                        {getStatusLabel(membro.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs">
                      {formatarData(membro.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {membro.nivel !== 'dono' && (
                          <>
                            <button
                              onClick={() => toggleStatus(membro.id, membro.status)}
                              className={`px-3 py-1 rounded text-xs font-medium transition ${
                                membro.status === 'ativo'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/50'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/50'
                              }`}
                            >
                              {membro.status === 'ativo' ? 'Desativar' : 'Ativar'}
                            </button>
                            <button
                              onClick={() => deleteMember(membro.id)}
                              className="px-3 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                              title="Remover funcionário"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
