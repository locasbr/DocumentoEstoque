'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Save,
  Shield,
  Store,
  User,
} from 'lucide-react'

import { useNotification } from '@/contexts/NotificationContext'
import { useMembro } from '@/hooks/useMembro'
import { getPlanoInfo } from '@/lib/planos'
import { supabase } from '@/lib/supabase'

interface PlanoInfo {
  plano: string
  tipoPlano: string | null
  diasRestantes: number | null
}

interface ErroApi {
  error?: string
}

const WHATSAPP_SUPORTE = '5522999467499'

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function lerErroApi(response: Response): Promise<string | null> {
  try {
    const data = (await response.json()) as ErroApi
    return data.error || null
  } catch {
    return null
  }
}

function obterMensagemErro(error: unknown): string {
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

export default function PerfilPage() {
  const router = useRouter()
  const { addNotification } = useNotification()
  const { isDono, isLoading: loadingMembro } = useMembro()

  const [userEmail, setUserEmail] = useState('')
  const [nomeNegocio, setNomeNegocio] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenhas, setMostrarSenhas] = useState(false)
  const [loading, setLoading] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const [salvandoNegocio, setSalvandoNegocio] = useState(false)
  const [salvandoEmail, setSalvandoEmail] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [enviandoReset, setEnviandoReset] = useState(false)
  const [resetEnviado, setResetEnviado] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [planoInfo, setPlanoInfo] = useState<PlanoInfo | null>(null)

  useEffect(() => {
    let ativo = true

    async function carregarPerfil() {
      setLoading(true)
      setErroCarregamento(null)

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          router.replace('/login')
          return
        }

        if (!ativo) return

        const email = user.email || ''
        setUserEmail(email)
        setNovoEmail(email)

        if (!isDono) return

        const { data: perfil, error: perfilError } = await supabase
          .from('perfis')
          .select('nome_negocio, plano, tipo_plano, trial_fim')
          .eq('id', user.id)
          .maybeSingle()

        if (perfilError) throw perfilError
        if (!perfil) throw new Error('Perfil do proprietário não encontrado.')
        if (!ativo) return

        setNomeNegocio(perfil.nome_negocio || '')

        let diasRestantes: number | null = null
        if (perfil.plano === 'trial' && perfil.trial_fim) {
          const fim = new Date(perfil.trial_fim)
          if (!Number.isNaN(fim.getTime())) {
            diasRestantes = Math.ceil(
              (fim.getTime() - Date.now()) / 86_400_000
            )
          }
        }

        setPlanoInfo({
          plano: perfil.plano || 'inativo',
          tipoPlano: perfil.tipo_plano,
          diasRestantes,
        })
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
        if (ativo) {
          setErroCarregamento('Não foi possível carregar os dados do perfil.')
        }
      } finally {
        if (ativo) setLoading(false)
      }
    }

    if (!loadingMembro) void carregarPerfil()

    return () => {
      ativo = false
    }
  }, [isDono, loadingMembro, router])

  const planoAtual = useMemo(() => {
    if (!planoInfo?.tipoPlano) return null
    return getPlanoInfo(planoInfo.tipoPlano)
  }, [planoInfo])

  const statusPlano = useMemo(() => {
    if (!planoInfo) return null

    if (planoInfo.plano === 'ativo') {
      return {
        titulo: planoAtual ? `Plano ${planoAtual.nome}` : 'Plano ativo',
        descricao: planoAtual
          ? `${planoAtual.precoFormatado} · ${planoAtual.descricao}`
          : 'Assinatura ativa',
        badge: 'ATIVO',
        estilo:
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      }
    }

    if (planoInfo.plano === 'trial') {
      const dias = planoInfo.diasRestantes
      const descricao =
        dias === null
          ? 'Período de avaliação'
          : dias > 1
            ? `${dias} dias restantes`
            : dias === 1
              ? '1 dia restante'
              : dias === 0
                ? 'Termina hoje'
                : 'Período encerrado'

      return {
        titulo: 'Período de avaliação',
        descricao,
        badge: dias !== null && dias < 0 ? 'ENCERRADO' : 'AVALIAÇÃO',
        estilo:
          dias !== null && dias < 0
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      }
    }

    const nomes: Record<string, string> = {
      cancelado: 'Assinatura cancelada',
      pendente: 'Pagamento pendente',
      inativo: 'Plano inativo',
      expirado: 'Plano expirado',
      inadimplente: 'Pagamento não confirmado',
    }

    return {
      titulo: nomes[planoInfo.plano] || 'Situação da assinatura',
      descricao: 'Consulte a página de assinatura para mais detalhes.',
      badge: planoInfo.plano.toUpperCase(),
      estilo:
        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    }
  }, [planoAtual, planoInfo])

  const linkSolicitarExclusao = useMemo(() => {
    const mensagem =
      'Olá! Sou o proprietário da conta do EstoqueSystem e quero solicitar a exclusão da minha conta e dos dados associados. Quero receber as orientações e confirmar a situação da assinatura antes da exclusão.'
    return `https://wa.me/${WHATSAPP_SUPORTE}?text=${encodeURIComponent(mensagem)}`
  }, [])

  async function salvarNegocio() {
    if (!isDono || salvandoNegocio) return

    const nomeNormalizado = nomeNegocio.trim().replace(/\s+/g, ' ')
    if (nomeNormalizado.length < 2) {
      addNotification('Informe um nome válido para o negócio.', 'warning')
      return
    }

    setSalvandoNegocio(true)

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('perfis')
        .update({ nome_negocio: nomeNormalizado })
        .eq('id', user.id)
        .select('nome_negocio')
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('O perfil não foi atualizado.')

      setNomeNegocio(data.nome_negocio || nomeNormalizado)
      addNotification('Nome do negócio atualizado.', 'success', 2200)
    } catch (error) {
      console.error('Erro ao atualizar negócio:', error)
      addNotification('Não foi possível atualizar o nome do negócio.', 'error')
    } finally {
      setSalvandoNegocio(false)
    }
  }

  async function atualizarEmail() {
    if (salvandoEmail) return

    const email = normalizarEmail(novoEmail)
    if (!email || !emailValido(email)) {
      addNotification('Informe um e-mail válido.', 'warning')
      return
    }

    if (email === normalizarEmail(userEmail)) return

    setSalvandoEmail(true)

    try {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error

      setNovoEmail(email)
      addNotification(
        'Verifique as mensagens de confirmação enviadas pelo provedor de autenticação.',
        'success',
        6000
      )
    } catch (error) {
      console.error('Erro ao atualizar e-mail:', error)
      addNotification('Não foi possível solicitar a alteração do e-mail.', 'error')
    } finally {
      setSalvandoEmail(false)
    }
  }

  async function atualizarSenha() {
    if (salvandoSenha) return

    if (novaSenha.length < 8) {
      addNotification('Use uma senha com pelo menos 8 caracteres.', 'warning')
      return
    }

    if (novaSenha !== confirmarSenha) {
      addNotification('As senhas não coincidem.', 'warning')
      return
    }

    setSalvandoSenha(true)

    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw error

      setNovaSenha('')
      setConfirmarSenha('')
      setMostrarSenhas(false)
      addNotification('Senha atualizada com sucesso.', 'success', 2500)
    } catch (error) {
      console.error('Erro ao atualizar senha:', error)
      addNotification('Não foi possível atualizar a senha.', 'error')
    } finally {
      setSalvandoSenha(false)
    }
  }

  async function enviarResetSenha() {
    if (enviandoReset || resetEnviado || !userEmail) return

    setEnviandoReset(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error

      setResetEnviado(true)
      addNotification('E-mail de recuperação solicitado.', 'success', 3000)
      window.setTimeout(() => setResetEnviado(false), 30_000)
    } catch (error) {
      console.error('Erro ao enviar recuperação:', error)
      addNotification('Não foi possível enviar o e-mail de recuperação.', 'error')
    } finally {
      setEnviandoReset(false)
    }
  }

  async function exportarDados() {
    if (!isDono || exportando) return

    setExportando(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        addNotification('Sessão expirada. Entre novamente.', 'error')
        return
      }

      const response = await fetch('/api/lgpd/exportar-dados', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const erro = await lerErroApi(response)
        throw new Error(erro || 'Não foi possível gerar a exportação.')
      }

      const tipo = response.headers.get('content-type') || ''
      if (!tipo.includes('application/json')) {
        throw new Error('A exportação retornou um formato inesperado.')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dados-estoquesystem-${new Date()
        .toISOString()
        .slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      addNotification('Cópia dos dados gerada.', 'success', 3000)
    } catch (error) {
      console.error('Erro ao exportar dados:', error)
      addNotification(obterMensagemErro(error), 'error', 5000)
    } finally {
      setExportando(false)
    }
  }

  async function handleLogout() {
    if (saindo) return
    if (!window.confirm('Deseja sair desta conta neste dispositivo?')) return

    setSaindo(true)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.replace('/login')
      router.refresh()
    } catch (error) {
      console.error('Erro ao sair:', error)
      addNotification('Não foi possível encerrar a sessão.', 'error')
    } finally {
      setSaindo(false)
    }
  }

  if (loading || loadingMembro) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (erroCarregamento) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">{erroCarregamento}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 text-sm font-semibold underline"
            >
              Recarregar página
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
          Conta e segurança
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
          Perfil
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gerencie seu acesso e as informações disponíveis para sua função.
        </p>
      </header>

      <section className="card flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <User className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold text-gray-900 dark:text-white">
            {isDono ? nomeNegocio || 'Estabelecimento sem nome' : 'Usuário adicional'}
          </p>
          <p className="truncate text-sm text-gray-500">{userEmail}</p>
          <span className="mt-2 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {isDono ? 'Proprietário' : 'Usuário adicional'}
          </span>
        </div>
      </section>

      {isDono && statusPlano && (
        <section className="card p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Assinatura
              </p>
              <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                {statusPlano.titulo}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {statusPlano.descricao}
              </p>
            </div>
            <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${statusPlano.estilo}`}>
              {statusPlano.badge}
            </span>
          </div>

          <Link
            href="/assinar"
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            Ver planos e assinatura
          </Link>
        </section>
      )}

      {isDono && (
        <CardSecao icon={Store} titulo="Nome do negócio">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Nome exibido no sistema e nos comprovantes não fiscais
          </label>
          <input
            type="text"
            maxLength={120}
            value={nomeNegocio}
            onChange={(event) => setNomeNegocio(event.target.value)}
            className="input-field mt-2 w-full"
            placeholder="Ex.: Mercado Central"
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">{nomeNegocio.length}/120</span>
            <button
              type="button"
              onClick={() => void salvarNegocio()}
              disabled={salvandoNegocio}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {salvandoNegocio ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar nome
            </button>
          </div>
        </CardSecao>
      )}

      <CardSecao icon={Mail} titulo="E-mail de acesso">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Novo e-mail
        </label>
        <input
          type="email"
          maxLength={160}
          value={novoEmail}
          onChange={(event) => setNovoEmail(event.target.value)}
          className="input-field mt-2 w-full"
          autoComplete="email"
        />
        <p className="mt-2 text-xs text-gray-500">
          A alteração depende das confirmações exigidas pelo provedor de autenticação.
        </p>
        <button
          type="button"
          onClick={() => void atualizarEmail()}
          disabled={
            salvandoEmail ||
            normalizarEmail(novoEmail) === normalizarEmail(userEmail)
          }
          className="btn-primary mt-4 inline-flex items-center gap-2 disabled:opacity-50"
        >
          {salvandoEmail ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Solicitar alteração
        </button>
      </CardSecao>

      <CardSecao icon={Lock} titulo="Senha">
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Nova senha
            </label>
            <div className="relative mt-2">
              <input
                type={mostrarSenhas ? 'text' : 'password'}
                value={novaSenha}
                onChange={(event) => setNovaSenha(event.target.value)}
                className="input-field w-full pr-11"
                placeholder="Pelo menos 8 caracteres"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setMostrarSenhas((atual) => !atual)}
                aria-label={mostrarSenhas ? 'Ocultar senhas' : 'Mostrar senhas'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {mostrarSenhas ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Confirmar nova senha
            </label>
            <input
              type={mostrarSenhas ? 'text' : 'password'}
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
              className={`input-field mt-2 w-full ${
                confirmarSenha && novaSenha !== confirmarSenha
                  ? 'border-red-400'
                  : ''
              }`}
              autoComplete="new-password"
            />
            {confirmarSenha && novaSenha !== confirmarSenha && (
              <p className="mt-1 text-xs text-red-500">As senhas não coincidem.</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void atualizarSenha()}
            disabled={
              salvandoSenha ||
              novaSenha.length < 8 ||
              novaSenha !== confirmarSenha
            }
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {salvandoSenha ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar nova senha
          </button>
          <button
            type="button"
            onClick={() => void enviarResetSenha()}
            disabled={enviandoReset || resetEnviado}
            className="btn-secondary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {enviandoReset ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : resetEnviado ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {resetEnviado ? 'E-mail solicitado' : 'Recuperar por e-mail'}
          </button>
        </div>
      </CardSecao>

      {isDono && (
        <CardSecao icon={Shield} titulo="Privacidade e dados da conta">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start gap-3">
              <Download className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Cópia dos dados do estabelecimento
                </p>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  O arquivo pode conter informações pessoais de clientes e dados comerciais. Armazene-o em local seguro.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void exportarDados()}
              disabled={exportando}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {exportando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Baixar cópia dos dados
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  Solicitar exclusão da conta
                </p>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                  A solicitação passa por confirmação do proprietário e verificação da assinatura antes da remoção dos dados e acessos.
                </p>
              </div>
            </div>
            <a
              href={linkSolicitarExclusao}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700"
            >
              <MessageCircle className="h-4 w-4" /> Solicitar pelo suporte
            </a>
          </div>
        </CardSecao>
      )}

      <section className="card p-5">
        <p className="text-sm text-gray-500">Encerre a sessão neste dispositivo.</p>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={saindo}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          {saindo ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Sair da conta
        </button>
      </section>
    </div>
  )
}

function CardSecao({
  icon: Icon,
  titulo,
  children,
}: {
  icon: typeof User
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section className="card overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <Icon className="h-5 w-5 text-gray-500" />
        <h2 className="font-bold text-gray-900 dark:text-white">{titulo}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}
