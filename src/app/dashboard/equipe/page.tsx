// src/app/dashboard/equipe/page.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/contexts/NotificationContext'
import { useMembro } from '@/hooks/useMembro'
import { usePlano } from '@/hooks/usePlano'
import { formatarData } from '@/lib/utils'
import {
  Plus,
  Eye,
  EyeOff,
  Trash2,
  UserPlus,
  KeyRound,
  Loader2,
  Users,
  Crown,
  AlertTriangle,
  Sparkles,
  Zap,
} from 'lucide-react'

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
  const { tipoPlano, limites, isAdmin, loading: loadingPlano } = usePlano()
  const { addNotification } = useNotification()

  const [membros, setMembros] = useState<Membro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [resetandoSenhaId, setResetandoSenhaId] = useState<string | null>(null)

  const senhaBoxRef = useRef<HTMLDivElement>(null)

  const donoId = usuarioAtual?.dono_id || usuarioAtual?.user_id

  // ════════════════════════════════════════════════════
  // 🔢 CÁLCULOS DE USO DO PLANO
  // ════════════════════════════════════════════════════
  // Conta apenas membros ativos + pendentes (inativos não contam)
  const membrosContagem = membros.filter(
    (m) => m.status === 'ativo' || m.status === 'pendente'
  ).length
  
  // ✅ +1 pq o dono também conta no limite do plano
  const usuariosUsados = membrosContagem + 1
  const usuariosRestantes = Math.max(0, limites.usuarios - usuariosUsados)
  const limiteAtingido = !isAdmin && usuariosUsados >= limites.usuarios
  const percentualUso = isAdmin
    ? 0
    : Math.min(100, (usuariosUsados / limites.usuarios) * 100)
  const quasePerto = !isAdmin && usuariosRestantes === 1 && !limiteAtingido

  // Nome bonito do plano pra UI
  const nomesPlanos: Record<string, string> = {
    iniciante: 'Iniciante',
    profissional: 'Profissional',
    negocio: 'Negócio',
  }
  const nomePlano = nomesPlanos[tipoPlano] || 'Profissional'

  // ════════════════════════════════════════════════════
  // 📡 Buscar lista de membros
  // ════════════════════════════════════════════════════
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

  // ════════════════════════════════════════════════════
  // ✅ Validação de email com regex
  // ════════════════════════════════════════════════════
  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  // ════════════════════════════════════════════════════
  // 🆕 Convidar funcionário (com JWT no header)
  // ════════════════════════════════════════════════════
  const handleInviteNewMember = async (e: React.FormEvent) => {
    e.preventDefault()

    // 🔒 BLOQUEIO no frontend (defesa em camadas — backend tbm bloqueia)
    if (limiteAtingido) {
      addNotification(
        `Limite de ${limites.usuarios} usuário(s) atingido. Faça upgrade!`,
        'warning',
        5000
      )
      return
    }

    if (!newEmail.trim()) {
      addNotification('Email é obrigatório', 'warning')
      return
    }

    if (!validarEmail(newEmail)) {
      addNotification('Email inválido', 'warning')
      return
    }

    try {
      setIsInviting(true)

      // 🔒 SEGURANÇA: Pega o token JWT da sessão
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        addNotification('Sessão expirada. Faça login novamente.', 'error')
        return
      }

      // ✅ Envia o token no header Authorization
      const response = await fetch('/api/equipe/convidar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: newEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          addNotification('Sessão expirada. Faça login novamente.', 'error')
        } else if (response.status === 403) {
          // 🆕 Trata o erro de limite de plano com CTA pra upgrade
          if (data.motivo === 'limite_plano') {
            addNotification(
              `⚠️ ${data.error}`,
              'warning',
              6000
            )
          } else {
            addNotification(
              data.error || 'Sem permissão pra essa ação',
              'error'
            )
          }
        } else if (response.status === 409) {
          addNotification('Este funcionário já foi convidado', 'warning')
        } else {
          addNotification(data.error || 'Erro ao convidar', 'error')
        }
        return
      }

      // ✅ Sucesso!
      setGeneratedPassword(data.tempPassword)
      addNotification(
        '✅ Funcionário convidado! Copie a senha abaixo.',
        'success',
        8000
      )
      setNewEmail('')
      fetchMembros()

      // 🔒 Scroll suave pro box da senha
      setTimeout(() => {
        senhaBoxRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 100)
    } catch (error) {
      console.error('Erro ao convidar funcionário:', error)
      addNotification('Erro ao convidar funcionário', 'error')
    } finally {
      setIsInviting(false)
    }
  }

  // ════════════════════════════════════════════════════
  // 🔄 Alternar status (ativo/inativo)
  // ════════════════════════════════════════════════════
  const toggleStatus = async (memberId: string, currentStatus: string) => {
    try {
      const newStatus =
        currentStatus === 'ativo'
          ? 'inativo'
          : currentStatus === 'inativo'
          ? 'ativo'
          : 'ativo'

      // 🔒 Se está tentando ATIVAR e já tá no limite → bloqueia
      if (newStatus === 'ativo' && limiteAtingido) {
        addNotification(
          `Limite de ${limites.usuarios} usuário(s) ativos atingido. Desative outro ou faça upgrade.`,
          'warning',
          5000
        )
        return
      }

      const { error } = await supabase
        .from('membros')
        .update({ status: newStatus })
        .eq('id', memberId)

      if (error) throw error

      addNotification(
        `Funcionário ${newStatus === 'ativo' ? 'ativado' : 'desativado'}`,
        'success'
      )
      fetchMembros()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      addNotification('Erro ao atualizar funcionário', 'error')
    }
  }

  // ════════════════════════════════════════════════════
  // 🗑️ Remover funcionário
  // ════════════════════════════════════════════════════
  const deleteMember = async (memberId: string) => {
    if (!confirm('Tem certeza que deseja remover este funcionário?')) return

    try {
      const { error } = await supabase
        .from('membros')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      addNotification('Funcionário removido com sucesso', 'success')
      fetchMembros()
    } catch (error) {
      console.error('Erro ao remover funcionário:', error)
      addNotification('Erro ao remover funcionário', 'error')
    }
  }

  // ════════════════════════════════════════════════════
  // 🆕 RESETAR SENHA do funcionário
  // ════════════════════════════════════════════════════
  const resetarSenha = async (memberId: string, email: string) => {
    if (
      !confirm(
        `Gerar nova senha temporária pra ${email}? A senha antiga deixará de funcionar.`
      )
    )
      return

    try {
      setResetandoSenhaId(memberId)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        addNotification('Sessão expirada', 'error')
        return
      }

      const response = await fetch('/api/equipe/resetar-senha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ memberId }),
      })

      const data = await response.json()

      if (!response.ok) {
        addNotification(data.error || 'Erro ao resetar senha', 'error')
        return
      }

      setGeneratedPassword(data.tempPassword)
      addNotification(
        '🔑 Nova senha gerada! Copie e envie ao funcionário.',
        'success',
        8000
      )

      setTimeout(() => {
        senhaBoxRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 100)
    } catch (error) {
      console.error('Erro ao resetar senha:', error)
      addNotification('Erro ao resetar senha', 'error')
    } finally {
      setResetandoSenhaId(null)
    }
  }

  // ════════════════════════════════════════════════════
  // 🎨 Helpers de estilo
  // ════════════════════════════════════════════════════
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

  // ════════════════════════════════════════════════════
  // 🚫 BLOQUEIO: loading
  // ════════════════════════════════════════════════════
  if (loadingMembro || loadingPlano) {
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

  // ════════════════════════════════════════════════════
  // 🎨 RENDER
  // ════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gerenciar Equipe
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Convide funcionários e controle suas permissões
        </p>
      </div>

      {/* ══════════ 🆕 BANNER DE USO DO PLANO ══════════ */}
      {!isAdmin && (
        <div
          className={`card p-5 border-2 ${
            limiteAtingido
              ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
              : quasePerto
                ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800'
                : 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
          }`}
        >
          <div className="flex items-start gap-4 flex-wrap">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                limiteAtingido
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : quasePerto
                    ? 'bg-amber-100 dark:bg-amber-900/30'
                    : 'bg-blue-100 dark:bg-blue-900/30'
              }`}
            >
              <Users
                className={`w-6 h-6 ${
                  limiteAtingido
                    ? 'text-red-600 dark:text-red-400'
                    : quasePerto
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-blue-600 dark:text-blue-400'
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Plano {nomePlano} — {usuariosUsados} de {limites.usuarios} usuário(s)
                </h3>
                {limiteAtingido && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-red-600 text-white rounded-full">
                    LIMITE ATINGIDO
                  </span>
                )}
                {quasePerto && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-amber-500 text-white rounded-full">
                    ÚLTIMO SLOT
                  </span>
                )}
              </div>

              {/* Barra de progresso */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${
                    limiteAtingido
                      ? 'bg-red-500'
                      : quasePerto
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                  }`}
                  style={{ width: `${percentualUso}%` }}
                />
              </div>

              <p
                className={`text-sm ${
                  limiteAtingido
                    ? 'text-red-700 dark:text-red-300'
                    : quasePerto
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {limiteAtingido ? (
                  <>
                    ⚠️ Você atingiu o limite do plano {nomePlano}. Faça upgrade
                    pra adicionar mais funcionários.
                  </>
                ) : quasePerto ? (
                  <>
                    ⚡ Falta apenas 1 slot. Considere fazer upgrade pra crescer
                    sem se preocupar.
                  </>
                ) : (
                  <>
                    Você ainda pode adicionar{' '}
                    <strong>{usuariosRestantes} funcionário(s)</strong> nesse
                    plano.
                  </>
                )}
              </p>
            </div>

            {/* Botão de upgrade */}
            {(limiteAtingido || quasePerto) && tipoPlano !== 'negocio' && (
              <Link
                href="/assinar"
                className={`flex items-center gap-2 px-4 py-2.5 text-white font-bold rounded-xl whitespace-nowrap transition shadow-lg ${
                  tipoPlano === 'iniciante'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/30'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-purple-500/30'
                }`}
              >
                {tipoPlano === 'iniciante' ? (
                  <>
                    <Sparkles size={16} />
                    Upgrade Profissional
                  </>
                ) : (
                  <>
                    <Crown size={16} />
                    Upgrade Negócio
                  </>
                )}
              </Link>
            )}
          </div>

          {/* 🆕 Detalhes do que cada plano oferece (se atingiu limite) */}
          {limiteAtingido && tipoPlano !== 'negocio' && (
            <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
                💡 Veja o que muda no upgrade:
              </p>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {tipoPlano === 'iniciante' && (
                  <>
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Zap size={14} />
                      <span>Profissional: até <strong>3 usuários</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <Crown size={14} />
                      <span>Negócio: até <strong>10 usuários</strong></span>
                    </div>
                  </>
                )}
                {tipoPlano === 'profissional' && (
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Crown size={14} />
                    <span>
                      Negócio: até <strong>10 usuários</strong> + IA completa
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🛡️ Badge de Admin (se for admin) */}
      {isAdmin && (
        <div className="card p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              🛡️ Você é admin — sem limite de usuários
            </p>
          </div>
        </div>
      )}

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
              className="input-field flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isInviting || limiteAtingido}
            />
            <button
              type="submit"
              disabled={isInviting || limiteAtingido}
              className={`btn-primary flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
                limiteAtingido
                  ? '!bg-gray-400 hover:!bg-gray-400'
                  : ''
              }`}
              title={
                limiteAtingido
                  ? `Limite de ${limites.usuarios} usuário(s) atingido`
                  : ''
              }
            >
              {limiteAtingido ? (
                <>
                  <AlertTriangle size={18} />
                  Limite atingido
                </>
              ) : (
                <>
                  <Plus size={18} />
                  {isInviting ? 'Enviando...' : 'Convidar'}
                </>
              )}
            </button>
          </div>

          {/* 🆕 Aviso pequeno embaixo do form quando bloqueado */}
          {limiteAtingido && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertTriangle size={12} />
              Faça upgrade do plano pra adicionar mais funcionários.
            </p>
          )}

          {generatedPassword && (
            <div
              ref={senhaBoxRef}
              className="relative p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl shadow-lg animate-pulse-once"
            >
              {/* Header de atenção */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-xl">🔑</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-900 dark:text-amber-100 text-base">
                    Senha temporária gerada
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Copie agora — esta senha não será mostrada novamente!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGeneratedPassword('')}
                  className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 text-sm font-medium"
                  title="Já copiei, fechar"
                >
                  ✕
                </button>
              </div>

              {/* Input da senha + ações */}
              <div className="flex items-center gap-2 mb-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={generatedPassword}
                  readOnly
                  className="input-field flex-1 font-mono text-base font-bold tracking-wider bg-white dark:bg-gray-900 border-amber-300 dark:border-amber-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2.5 bg-white dark:bg-gray-900 hover:bg-amber-100 dark:hover:bg-amber-800 rounded transition border border-amber-200 dark:border-amber-700"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword)
                    addNotification('✅ Senha copiada!', 'success', 2000)
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/30 text-white font-bold rounded transition text-sm whitespace-nowrap"
                >
                  📋 Copiar
                </button>
              </div>

              {/* Avisos importantes */}
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                  <span>⚠️</span>
                  <span>
                    <strong>Compartilhe pelo WhatsApp ou pessoalmente</strong>{' '}
                    — nunca por email
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                  <span>🔒</span>
                  <span>
                    O funcionário deve{' '}
                    <strong>alterar essa senha no primeiro login</strong>
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                  <span>⏱️</span>
                  <span>
                    Esta senha <strong>não será exibida novamente</strong> —
                    copie agora
                  </span>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Members List */}
      <div className="card">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
          Funcionários ({membros.length})
        </h3>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
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
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Email
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Nível
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Data
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {membros.map((membro) => (
                    <tr
                      key={membro.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">
                        {membro.email}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {membro.nivel === 'dono' ? 'Dono' : 'Funcionário'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                            membro.status
                          )}`}
                        >
                          {getStatusLabel(membro.status)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">
                        {formatarData(membro.created_at)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {membro.nivel !== 'dono' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                resetarSenha(membro.id, membro.email)
                              }
                              disabled={resetandoSenhaId === membro.id}
                              className="px-3 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 disabled:opacity-50 transition flex items-center gap-1"
                              title="Resetar senha"
                            >
                              {resetandoSenhaId === membro.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <KeyRound className="w-3.5 h-3.5" />
                              )}
                              Senha
                            </button>
                            <button
                              onClick={() =>
                                toggleStatus(membro.id, membro.status)
                              }
                              disabled={
                                membro.status === 'inativo' && limiteAtingido
                              }
                              className={`px-3 py-1 rounded text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                membro.status === 'ativo'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 hover:bg-red-200'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 hover:bg-green-200'
                              }`}
                              title={
                                membro.status === 'inativo' && limiteAtingido
                                  ? 'Limite atingido — desative outro pra ativar este'
                                  : ''
                              }
                            >
                              {membro.status === 'ativo'
                                ? 'Desativar'
                                : 'Ativar'}
                            </button>
                            <button
                              onClick={() => deleteMember(membro.id)}
                              className="px-3 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                              title="Remover funcionário"
                            >
                              <Trash2 className="w-4 h-4" />
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
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                        {membro.email}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatarData(membro.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {membro.nivel === 'dono' ? 'Dono' : 'Funcionário'}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                        membro.status
                      )}`}
                    >
                      {getStatusLabel(membro.status)}
                    </span>
                  </div>

                  {membro.nivel !== 'dono' && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => resetarSenha(membro.id, membro.email)}
                        disabled={resetandoSenhaId === membro.id}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {resetandoSenhaId === membro.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <KeyRound className="w-3.5 h-3.5" />
                        )}
                        Resetar
                      </button>
                      <button
                        onClick={() => toggleStatus(membro.id, membro.status)}
                        disabled={
                          membro.status === 'inativo' && limiteAtingido
                        }
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
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
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}