'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

import { useMembro } from '@/hooks/useMembro'
import { usePlano } from '@/hooks/usePlano'
import { useNotification } from '@/contexts/NotificationContext'
import { supabase } from '@/lib/supabase'
import { formatarData } from '@/lib/utils'

interface Membro {
  id: string
  dono_id: string
  user_id: string
  email: string
  nivel: 'dono' | 'funcionario'
  status: 'pendente' | 'ativo' | 'inativo'
  created_at: string
}

interface RespostaConvite {
  success?: boolean
  email?: string
  tempPassword?: string
  message?: string
  error?: string
  motivo?: string
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}

function mensagemErro(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }
  return 'Ocorreu um erro inesperado.'
}

async function lerResposta(response: Response): Promise<RespostaConvite> {
  try {
    return (await response.json()) as RespostaConvite
  } catch {
    return {}
  }
}

export default function EquipePage() {
  const { membro: usuarioAtual, isDono, isLoading: loadingMembro } = useMembro()
  const { isAdmin, loading: loadingPlano } = usePlano()
  const { addNotification } = useNotification()

  const [membros, setMembros] = useState<Membro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [erroListagem, setErroListagem] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [processandoId, setProcessandoId] = useState<string | null>(null)

  const senhaBoxRef = useRef<HTMLDivElement>(null)
  const donoId = usuarioAtual?.dono_id || usuarioAtual?.user_id

  const funcionarios = membros.filter(
    (membro) => membro.nivel === 'funcionario'
  )
  const usuarioAdicionalOcupandoVaga = funcionarios.some(
    (membro) => membro.status === 'ativo' || membro.status === 'pendente'
  )

  const usuariosUsados = 1 + (usuarioAdicionalOcupandoVaga ? 1 : 0)
  const limiteTotal = 2
  const limiteAtingido = !isAdmin && usuarioAdicionalOcupandoVaga
  const percentualUso = isAdmin ? 50 : (usuariosUsados / limiteTotal) * 100

  const fetchMembros = useCallback(
    async (feedback = false) => {
      if (!donoId) {
        setErroListagem('Não foi possível identificar o proprietário da conta.')
        setIsLoading(false)
        return
      }

      feedback ? setAtualizando(true) : setIsLoading(true)
      setErroListagem(null)

      try {
        const { data, error } = await supabase
          .from('membros')
          .select('id, dono_id, user_id, email, nivel, status, created_at')
          .eq('dono_id', donoId)
          .eq('nivel', 'funcionario')
          .order('created_at', { ascending: false })

        if (error) throw error
        setMembros((data as Membro[] | null) ?? [])

        if (feedback) {
          addNotification('Equipe atualizada.', 'success', 1800)
        }
      } catch (error) {
        console.error('Erro ao buscar equipe:', error)
        setErroListagem('Não foi possível carregar o usuário adicional.')
      } finally {
        setIsLoading(false)
        setAtualizando(false)
      }
    },
    [addNotification, donoId]
  )

  useEffect(() => {
    if (loadingMembro || loadingPlano) return
    if (!isDono) {
      setIsLoading(false)
      return
    }
    void fetchMembros()
  }, [fetchMembros, isDono, loadingMembro, loadingPlano])

  const handleInviteNewMember = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    if (isInviting) return

    if (limiteAtingido) {
      addNotification(
        'Já existe um usuário adicional ativo ou pendente.',
        'warning',
        4000
      )
      return
    }

    const email = normalizarEmail(newEmail)
    if (!email || !validarEmail(email)) {
      addNotification('Informe um e-mail válido.', 'warning')
      return
    }

    setIsInviting(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        addNotification('Sessão expirada. Entre novamente.', 'error')
        return
      }

      const response = await fetch('/api/equipe/convidar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email }),
      })

      const data = await lerResposta(response)

      if (!response.ok) {
        addNotification(
          data.error || 'Não foi possível criar o usuário adicional.',
          response.status === 409 || data.motivo === 'limite_plano'
            ? 'warning'
            : 'error',
          5000
        )
        return
      }

      if (!data.tempPassword) {
        throw new Error('A API não retornou a senha temporária.')
      }

      setGeneratedPassword(data.tempPassword)
      setShowPassword(false)
      setNewEmail('')
      addNotification('Usuário adicional criado com sucesso.', 'success', 4000)
      await fetchMembros()

      window.setTimeout(() => {
        senhaBoxRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 100)
    } catch (error) {
      console.error('Erro ao convidar usuário adicional:', error)
      addNotification(mensagemErro(error), 'error', 5000)
    } finally {
      setIsInviting(false)
    }
  }

  const copiarSenha = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword)
      addNotification('Senha copiada.', 'success', 1800)
    } catch {
      addNotification('Não foi possível copiar a senha.', 'error')
    }
  }

  const toggleStatus = async (membro: Membro) => {
    if (processandoId) return

    const novoStatus = membro.status === 'ativo' ? 'inativo' : 'ativo'

    if (
      novoStatus === 'ativo' &&
      membro.status === 'inativo' &&
      !isAdmin &&
      funcionarios.some(
        (item) =>
          item.id !== membro.id &&
          (item.status === 'ativo' || item.status === 'pendente')
      )
    ) {
      addNotification('A vaga de usuário adicional já está ocupada.', 'warning')
      return
    }

    setProcessandoId(membro.id)

    try {
      const { error } = await supabase
        .from('membros')
        .update({ status: novoStatus })
        .eq('id', membro.id)
        .eq('dono_id', donoId)
        .eq('nivel', 'funcionario')

      if (error) throw error

      setMembros((atuais) =>
        atuais.map((item) =>
          item.id === membro.id ? { ...item, status: novoStatus } : item
        )
      )

      addNotification(
        `Usuário ${novoStatus === 'ativo' ? 'ativado' : 'desativado'}.`,
        'success',
        2200
      )
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      addNotification('Não foi possível alterar o status.', 'error')
      await fetchMembros()
    } finally {
      setProcessandoId(null)
    }
  }

  const deleteMember = async (membro: Membro) => {
    if (processandoId) return

    if (
      !window.confirm(
        `Remover o vínculo de ${membro.email} com este estabelecimento?`
      )
    ) {
      return
    }

    setProcessandoId(membro.id)

    try {
      const { error } = await supabase
        .from('membros')
        .delete()
        .eq('id', membro.id)
        .eq('dono_id', donoId)
        .eq('nivel', 'funcionario')

      if (error) throw error

      setMembros((atuais) => atuais.filter((item) => item.id !== membro.id))
      addNotification('Usuário removido da equipe.', 'success', 2200)
    } catch (error) {
      console.error('Erro ao remover usuário:', error)
      addNotification('Não foi possível remover o usuário.', 'error')
      await fetchMembros()
    } finally {
      setProcessandoId(null)
    }
  }

  if (loadingMembro || loadingPlano) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!isDono) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <Lock className="mx-auto mb-3 h-10 w-10 text-gray-400" />
        <h1 className="font-bold text-gray-900 dark:text-white">
          Acesso restrito
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Apenas o proprietário pode gerenciar o usuário adicional.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Acesso ao estabelecimento
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
            Equipe
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sua conta permite 1 proprietário e 1 usuário adicional.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchMembros(true)}
          disabled={atualizando}
          className="btn-secondary inline-flex items-center justify-center gap-2 self-start disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${atualizando ? 'animate-spin' : ''}`}
          />
          Atualizar
        </button>
      </header>

      <section className="card overflow-hidden p-0">
        <div className="grid md:grid-cols-[1fr_auto]">
          <div className="p-5 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">
                  {usuariosUsados} de {limiteTotal} acessos utilizados
                </h2>
                <p className="text-xs text-gray-500">
                  O proprietário já ocupa o primeiro acesso.
                </p>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full rounded-full ${
                  limiteAtingido ? 'bg-emerald-600' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(percentualUso, 100)}%` }}
              />
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm">
              {limiteAtingido ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-gray-600 dark:text-gray-300">
                    O usuário adicional já está cadastrado.
                  </span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Você ainda pode cadastrar 1 usuário adicional.
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center border-t bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50 md:border-l md:border-t-0">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Limite fixo
              </p>
              <p className="mt-1 text-2xl font-bold">2</p>
              <p className="text-xs text-gray-500">acessos</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-5 md:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">
              Usuário adicional
            </h2>
            <p className="text-xs text-gray-500">
              O acesso é individual. Não use o e-mail do proprietário.
            </p>
          </div>
        </div>

        <form onSubmit={handleInviteNewMember} className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              maxLength={160}
              autoComplete="email"
              placeholder="email@exemplo.com"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              disabled={isInviting || limiteAtingido}
              className="input-field min-w-0 flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isInviting || limiteAtingido}
              className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isInviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isInviting
                ? 'Criando acesso...'
                : limiteAtingido
                  ? 'Vaga ocupada'
                  : 'Criar usuário'}
            </button>
          </div>

          {limiteAtingido && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <AlertTriangle className="h-3.5 w-3.5" /> Para cadastrar outro
              usuário, remova ou desative o vínculo atual primeiro.
            </p>
          )}
        </form>

        {generatedPassword && (
          <div
            ref={senhaBoxRef}
            className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-100">
                  Senha temporária
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Copie agora. Esta senha não ficará disponível depois que o
                  painel for fechado.
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar senha temporária"
                onClick={() => {
                  setGeneratedPassword('')
                  setShowPassword(false)
                }}
                className="text-amber-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type={showPassword ? 'text' : 'password'}
                value={generatedPassword}
                readOnly
                className="input-field min-w-0 flex-1 font-mono font-bold tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword((atual) => !atual)}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
              <button
                type="button"
                onClick={() => void copiarSenha()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
              >
                <Copy className="h-4 w-4" /> Copiar
              </button>
            </div>

            <p className="mt-3 text-xs text-amber-800 dark:text-amber-200">
              Compartilhe a credencial por um canal privado e oriente o usuário
              a alterar a senha após entrar.
            </p>
          </div>
        )}
      </section>

      <section className="card p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">
              Acesso adicional
            </h2>
            <p className="text-xs text-gray-500">
              No máximo um usuário pode ficar ativo ou pendente.
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold dark:bg-gray-800">
            {funcionarios.length}
          </span>
        </div>

        {erroListagem ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p>{erroListagem}</p>
                <button
                  type="button"
                  onClick={() => void fetchMembros()}
                  className="mt-2 font-semibold underline"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando...
          </div>
        ) : funcionarios.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-700">
            <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">
              Nenhum usuário adicional
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Use o formulário acima para criar o segundo acesso.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {funcionarios.map((membro) => {
              const processando = processandoId === membro.id
              return (
                <article
                  key={membro.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {membro.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">
                        {membro.email}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Cadastrado em {formatarData(membro.created_at)}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={membro.status} />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleStatus(membro)}
                      disabled={Boolean(processandoId)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 sm:flex-none ${
                        membro.status === 'ativo'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}
                    >
                      {processando ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : membro.status === 'ativo' ? (
                        'Desativar'
                      ) : (
                        'Ativar'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteMember(membro)}
                      disabled={Boolean(processandoId)}
                      title="Remover vínculo"
                      className="rounded-lg bg-red-100 p-2 text-red-700 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <p className="text-center text-xs text-gray-400">
        O usuário adicional utiliza acesso próprio e opera dentro do mesmo
        estabelecimento.
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: Membro['status'] }) {
  const estilos = {
    ativo:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    pendente:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    inativo:
      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  }

  const labels = {
    ativo: 'Ativo',
    pendente: 'Pendente',
    inativo: 'Inativo',
  }

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold ${estilos[status]}`}
    >
      {labels[status]}
    </span>
  )
}
