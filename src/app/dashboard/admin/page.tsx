'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/contexts/NotificationContext'
import { useMembro } from '@/hooks/useMembro'
import { formatarData } from '@/lib/utils'
import {
  Users,
  Crown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Shield,
} from 'lucide-react'

interface Perfil {
  id: string
  nome_negocio: string | null
  plano: 'trial' | 'ativo' | 'expirado'
  trial_fim: string | null
  created_at: string | null
  // Dados do auth (via join ou separado)
  email?: string
}

type FiltroPlano = 'todos' | 'trial' | 'ativo' | 'expirado'

// ╔══════════════════════════════════════════════════╗
// ║  COLOQUE AQUI O SEU EMAIL DE ADMIN              ║
// ╚══════════════════════════════════════════════════╝
const ADMIN_EMAILS = [
  'locasbr@gmail.com', // ← troque pelo seu email
]

export default function AdminPage() {
  const { isLoading: loadingMembro } = useMembro()
  const { addNotification } = useNotification()

  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [filtroPlano, setFiltroPlano] = useState<FiltroPlano>('todos')
  const [isAdmin, setIsAdmin] = useState(false)
  const [atualizando, setAtualizando] = useState<string | null>(null)

  // Verifica se é admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        const email = data.session.user.email ?? ''
        setIsAdmin(ADMIN_EMAILS.includes(email))
      }
    }
    checkAdmin()
  }, [])

  // Busca todos os perfis
  const fetchPerfis = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Busca emails do auth (admin precisa de service_role ou uma view)
      // Alternativa: armazenar email na tabela perfis
      // Por enquanto usa os dados disponíveis
      setPerfis(data ?? [])
    } catch (error) {
      console.error('Erro ao buscar perfis:', error)
      addNotification('Erro ao carregar usuários', 'error')
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    if (!loadingMembro && isAdmin) {
      fetchPerfis()
    }
  }, [loadingMembro, isAdmin, fetchPerfis])

  // Altera plano do usuário
  const alterarPlano = async (userId: string, novoPlano: 'trial' | 'ativo' | 'expirado') => {
    setAtualizando(userId)
    try {
      const updateData: Record<string, unknown> = { plano: novoPlano }

      // Se ativando, limpa trial_fim (não precisa mais)
      if (novoPlano === 'ativo') {
        updateData.trial_fim = null
      }

      // Se voltando pra trial, dá mais 15 dias
      if (novoPlano === 'trial') {
        const novaData = new Date()
        novaData.setDate(novaData.getDate() + 15)
        updateData.trial_fim = novaData.toISOString()
      }

      const { error } = await supabase
        .from('perfis')
        .update(updateData)
        .eq('id', userId)

      if (error) throw error

      addNotification(
        `Plano alterado para "${novoPlano}" com sucesso!`,
        'success'
      )
      fetchPerfis()
    } catch (error) {
      console.error('Erro ao alterar plano:', error)
      addNotification('Erro ao alterar plano', 'error')
    } finally {
      setAtualizando(null)
    }
  }

  // Estender trial
  const estenderTrial = async (userId: string, dias: number) => {
    setAtualizando(userId)
    try {
      const perfil = perfis.find((p) => p.id === userId)
      const baseDate = perfil?.trial_fim
        ? new Date(perfil.trial_fim)
        : new Date()

      // Se já expirou, conta a partir de agora
      const inicio = baseDate < new Date() ? new Date() : baseDate
      inicio.setDate(inicio.getDate() + dias)

      const { error } = await supabase
        .from('perfis')
        .update({
          plano: 'trial',
          trial_fim: inicio.toISOString(),
        })
        .eq('id', userId)

      if (error) throw error

      addNotification(`Trial estendido em +${dias} dias!`, 'success')
      fetchPerfis()
    } catch (error) {
      console.error('Erro ao estender trial:', error)
      addNotification('Erro ao estender trial', 'error')
    } finally {
      setAtualizando(null)
    }
  }

  // Cálculos de métricas
  const totalUsuarios = perfis.length
  const totalAtivos = perfis.filter((p) => p.plano === 'ativo').length
  const totalTrial = perfis.filter((p) => p.plano === 'trial').length
  const totalExpirados = perfis.filter((p) => p.plano === 'expirado').length

  const trialsExpirando = perfis.filter((p) => {
    if (p.plano !== 'trial' || !p.trial_fim) return false
    const fim = new Date(p.trial_fim)
    const agora = new Date()
    const diffDias = Math.ceil(
      (fim.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
    )
    return diffDias >= 0 && diffDias <= 3
  }).length

  // Filtragem
  const perfisFiltrados = perfis
    .filter((p) => {
      if (filtroPlano !== 'todos' && p.plano !== filtroPlano) return false
      if (filtro) {
        const busca = filtro.toLowerCase()
        return (
          p.nome_negocio?.toLowerCase().includes(busca) ||
          p.id.toLowerCase().includes(busca) ||
          p.email?.toLowerCase().includes(busca)
        )
      }
      return true
    })

  // Helper: dias restantes do trial
  const diasRestantes = (trialFim: string | null): number | null => {
    if (!trialFim) return null
    const fim = new Date(trialFim)
    const agora = new Date()
    return Math.ceil((fim.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Helper: badge do plano
  const planoBadge = (plano: string, trialFim: string | null) => {
    const dias = diasRestantes(trialFim)
    const trialExpirado = plano === 'trial' && dias !== null && dias < 0

    if (plano === 'ativo') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          <CheckCircle className="w-3 h-3" /> Ativo
        </span>
      )
    }
    if (plano === 'expirado' || trialExpirado) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
          <XCircle className="w-3 h-3" /> Expirado
        </span>
      )
    }
    if (plano === 'trial') {
      const corUrgencia =
        dias !== null && dias <= 3
          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${corUrgencia}`}
        >
          <Clock className="w-3 h-3" /> Trial{' '}
          {dias !== null && `(${dias}d)`}
        </span>
      )
    }
    return <span className="text-xs text-gray-500">{plano}</span>
  }

  // Bloqueio: não é admin
  if (!loadingMembro && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="w-16 h-16 text-red-400" />
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Acesso restrito
        </p>
        <p className="text-gray-500">
          Apenas administradores podem acessar esta página.
        </p>
      </div>
    )
  }

  if (loading || loadingMembro) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Painel Admin
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie assinantes e trials do EstoqueSystem
          </p>
        </div>
        <button
          onClick={fetchPerfis}
          className="btn-secondary flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Usuários',
            value: totalUsuarios,
            icon: Users,
            color: 'bg-blue-50 dark:bg-blue-900/20',
            textColor: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Ativos (pagantes)',
            value: totalAtivos,
            icon: CheckCircle,
            color: 'bg-green-50 dark:bg-green-900/20',
            textColor: 'text-green-600 dark:text-green-400',
          },
          {
            label: 'Em Trial',
            value: totalTrial,
            icon: Clock,
            color: 'bg-yellow-50 dark:bg-yellow-900/20',
            textColor: 'text-yellow-600 dark:text-yellow-400',
          },
          {
            label: 'Expirados',
            value: totalExpirados,
            icon: XCircle,
            color: 'bg-red-50 dark:bg-red-900/20',
            textColor: 'text-red-600 dark:text-red-400',
          },
        ].map(({ label, value, icon: Icon, color, textColor }) => (
          <div
            key={label}
            className={`${color} rounded-xl p-4 flex flex-col gap-2`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${textColor}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {label}
              </span>
            </div>
            <span className={`text-3xl font-bold ${textColor}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Alerta: trials expirando */}
      {trialsExpirando > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">
            ⚠️ {trialsExpirando} usuário(s) com trial expirando nos próximos 3
            dias!
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou ID..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(
            [
              { label: 'Todos', value: 'todos' },
              { label: 'Ativos', value: 'ativo' },
              { label: 'Trial', value: 'trial' },
              { label: 'Expirados', value: 'expirado' },
            ] as const
          ).map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFiltroPlano(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtroPlano === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Usuários */}
      {perfisFiltrados.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Nenhum usuário encontrado
        </div>
      ) : (
        <div className="space-y-3">
          {perfisFiltrados.map((perfil) => {
            const dias = diasRestantes(perfil.trial_fim)
            const isProcessando = atualizando === perfil.id

            return (
              <div
                key={perfil.id}
                className={`bg-white dark:bg-gray-800 border rounded-xl p-4 sm:p-5 transition ${
                  isProcessando
                    ? 'opacity-50 pointer-events-none'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {perfil.nome_negocio || 'Sem nome'}
                      </h3>
                      {planoBadge(perfil.plano, perfil.trial_fim)}
                    </div>
                    <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="truncate font-mono text-xs">
                        ID: {perfil.id.substring(0, 8)}...
                      </span>
                      {perfil.email && <span>{perfil.email}</span>}
                      {perfil.created_at && (
                        <span>Cadastro: {formatarData(perfil.created_at)}</span>
                      )}
                      {perfil.trial_fim && (
                        <span>
                          Trial até:{' '}
                          {new Date(perfil.trial_fim).toLocaleDateString(
                            'pt-BR'
                          )}
                          {dias !== null && dias >= 0 && (
                            <span className="ml-1 text-yellow-600">
                              ({dias}d restantes)
                            </span>
                          )}
                          {dias !== null && dias < 0 && (
                            <span className="ml-1 text-red-500">
                              (expirado há {Math.abs(dias)}d)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {perfil.plano !== 'ativo' && (
                      <button
                        onClick={() => alterarPlano(perfil.id, 'ativo')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800 transition"
                      >
                        ✅ Ativar
                      </button>
                    )}
                    {perfil.plano === 'ativo' && (
                      <button
                        onClick={() => alterarPlano(perfil.id, 'expirado')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition"
                      >
                        ❌ Suspender
                      </button>
                    )}
                    {perfil.plano !== 'ativo' && (
                      <>
                        <button
                          onClick={() => estenderTrial(perfil.id, 7)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                        >
                          +7 dias
                        </button>
                        <button
                          onClick={() => estenderTrial(perfil.id, 15)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                        >
                          +15 dias
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Receita estimada */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
        <p className="text-sm text-green-700 dark:text-green-400 font-medium">
          💰 Receita mensal estimada
        </p>
        <p className="text-3xl font-bold text-green-800 dark:text-green-300 mt-1">
          R$ {(totalAtivos * 79.9).toFixed(2).replace('.', ',')}
        </p>
        <p className="text-xs text-green-600 dark:text-green-500 mt-1">
          {totalAtivos} assinante(s) × R$ 79,90/mês
        </p>
      </div>
    </div>
  )
}