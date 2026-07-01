'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/contexts/NotificationContext'
import {
  User,
  Lock,
  Store,
  Mail,
  Save,
  Eye,
  EyeOff,
  LogOut,
  Download,
  Trash2,
  Shield,
  X,
  AlertTriangle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getPlanoInfo } from '@/lib/planos'

interface PlanoInfo {
  plano: string
  tipoPlano: string | null
  diasRestantes: number | null
}

export default function PerfilPage() {
  const router = useRouter()
  const { addNotification } = useNotification()

  const [userEmail, setUserEmail] = useState('')
  const [nomeNegocio, setNomeNegocio] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salvandoNegocio, setSalvandoNegocio] = useState(false)
  const [salvandoEmail, setSalvandoEmail] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [resetEnviado, setResetEnviado] = useState(false)
  const [planoInfo, setPlanoInfo] = useState<PlanoInfo | null>(null)

  // ══════════ 🔒 LGPD STATES ══════════
  const [exportandoLGPD, setExportandoLGPD] = useState(false)
  const [modalDeletar, setModalDeletar] = useState(false)
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('')
  const [textoConfirmacao, setTextoConfirmacao] = useState('')
  const [deletandoConta, setDeletandoConta] = useState(false)

  useEffect(() => {
    async function carregarPerfil() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        router.push('/login')
        return
      }

      setUserEmail(user.email || '')
      setNovoEmail(user.email || '')

      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome_negocio, plano, tipo_plano, trial_fim')
        .eq('id', user.id)
        .single()

      if (perfil) {
        setNomeNegocio(perfil.nome_negocio || '')

        let diasRestantes: number | null = null
        if (perfil.plano === 'trial' && perfil.trial_fim) {
          const fim = new Date(perfil.trial_fim)
          diasRestantes = Math.ceil(
            (fim.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
        }

        setPlanoInfo({
          plano: perfil.plano,
          tipoPlano: perfil.tipo_plano,
          diasRestantes,
        })
      }

      setLoading(false)
    }
    carregarPerfil()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function salvarNegocio() {
    if (!nomeNegocio.trim()) {
      addNotification('Digite um nome válido', 'warning')
      return
    }
    setSalvandoNegocio(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      addNotification('Sessão expirada. Faça login novamente.', 'error')
      setSalvandoNegocio(false)
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('perfis')
      .update({ nome_negocio: nomeNegocio })
      .eq('id', user.id)

    if (error) {
      addNotification('Erro ao salvar nome do negócio', 'error')
    } else {
      addNotification('✅ Nome do negócio atualizado!', 'success')
    }
    setSalvandoNegocio(false)
  }

  async function atualizarEmail() {
    if (!novoEmail || novoEmail === userEmail) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(novoEmail)) {
      addNotification('Email inválido', 'warning')
      return
    }

    setSalvandoEmail(true)
    const { error } = await supabase.auth.updateUser({ email: novoEmail })
    if (error) {
      addNotification('Erro ao atualizar e-mail: ' + error.message, 'error')
    } else {
      addNotification(
        '📧 Verifique seu novo e-mail para confirmar a alteração',
        'success',
        6000
      )
    }
    setSalvandoEmail(false)
  }

  async function atualizarSenha() {
    if (!novaSenha || novaSenha !== confirmarSenha) {
      addNotification('As senhas não coincidem', 'error')
      return
    }
    if (novaSenha.length < 6) {
      addNotification('Senha deve ter pelo menos 6 caracteres', 'error')
      return
    }
    setSalvandoSenha(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) {
      addNotification('Erro ao atualizar senha: ' + error.message, 'error')
    } else {
      addNotification('🔐 Senha atualizada com sucesso!', 'success')
      setNovaSenha('')
      setConfirmarSenha('')
    }
    setSalvandoSenha(false)
  }

  async function enviarResetSenha() {
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      addNotification('Erro ao enviar e-mail', 'error')
    } else {
      setResetEnviado(true)
      addNotification('📧 E-mail de recuperação enviado!', 'success')
      setTimeout(() => setResetEnviado(false), 30000)
    }
  }

  async function handleLogout() {
    if (!confirm('Tem certeza que deseja sair?')) return
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ══════════════════════════════════════════════════
  // 🔒 LGPD: EXPORTAR DADOS
  // ══════════════════════════════════════════════════
  async function exportarDadosLGPD() {
    setExportandoLGPD(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        addNotification('Sessão expirada. Faça login novamente.', 'error')
        return
      }

      const response = await fetch('/api/lgpd/exportar-dados', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        addNotification(data.error || 'Erro ao exportar dados', 'error')
        return
      }

      // Download do JSON
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `meus-dados-estoquesystem-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addNotification(
        '✅ Dados exportados! Verifique seus downloads.',
        'success',
        5000
      )
    } catch (error) {
      console.error('Erro ao exportar:', error)
      addNotification('Erro ao exportar dados', 'error')
    } finally {
      setExportandoLGPD(false)
    }
  }

  // ══════════════════════════════════════════════════
  // 🔒 LGPD: DELETAR CONTA
  // ══════════════════════════════════════════════════
  async function deletarContaLGPD() {
    if (textoConfirmacao !== 'DELETAR MINHA CONTA') {
      addNotification(
        'Digite exatamente "DELETAR MINHA CONTA" para confirmar',
        'warning'
      )
      return
    }

    if (!senhaConfirmacao) {
      addNotification('Digite sua senha para confirmar', 'warning')
      return
    }

    setDeletandoConta(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        addNotification('Sessão expirada', 'error')
        return
      }

      const response = await fetch('/api/lgpd/deletar-conta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          senha: senhaConfirmacao,
          confirmacao: textoConfirmacao,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        addNotification(data.error || 'Erro ao deletar conta', 'error')
        return
      }

      addNotification(
        data.message || 'Conta deletada com sucesso.',
        'success',
        3000
      )

      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Erro ao deletar conta:', error)
      addNotification('Erro ao deletar conta', 'error')
    } finally {
      setDeletandoConta(false)
    }
  }

  function fecharModalDeletar() {
    if (deletandoConta) return
    setModalDeletar(false)
    setSenhaConfirmacao('')
    setTextoConfirmacao('')
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50">
          Perfil
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Gerencie suas informações e segurança
        </p>
      </div>

      {/* Avatar / Info */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
          <User size={28} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 dark:text-gray-50 truncate">
            {nomeNegocio || 'Sem nome de negócio'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {userEmail}
          </p>
        </div>
      </div>

      {/* ══════════ MEU PLANO ══════════ */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          💳 Meu Plano
        </h3>

        {planoInfo ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {planoInfo.plano === 'ativo'
                    ? getPlanoInfo(planoInfo.tipoPlano).emoji
                    : '⏳'}
                </span>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-lg">
                    {planoInfo.plano === 'ativo'
                      ? `Plano ${getPlanoInfo(planoInfo.tipoPlano).nome}`
                      : 'Período de Teste'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {planoInfo.plano === 'ativo'
                      ? `${getPlanoInfo(planoInfo.tipoPlano).precoFormatado} — ${
                          getPlanoInfo(planoInfo.tipoPlano).descricao
                        }`
                      : planoInfo.diasRestantes !== null
                        ? `${planoInfo.diasRestantes} dias restantes`
                        : 'Trial ativo'}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  planoInfo.plano === 'ativo'
                    ? planoInfo.tipoPlano === 'negocio'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      : planoInfo.tipoPlano === 'iniciante'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                }`}
              >
                {planoInfo.plano === 'ativo' ? 'ATIVO' : 'TRIAL'}
              </span>
            </div>

            {planoInfo.plano === 'trial' && planoInfo.diasRestantes !== null && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, ((15 - planoInfo.diasRestantes) / 15) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                  {planoInfo.diasRestantes} de 15 dias restantes
                </p>
              </div>
            )}

            {planoInfo.plano === 'trial' && (
              <Link
                href="/assinar"
                className="block w-full text-center py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 text-white font-semibold rounded-xl transition"
              >
                Assinar agora — A partir de R$ 39,90/mês
              </Link>
            )}

            {planoInfo.plano === 'ativo' &&
              planoInfo.tipoPlano !== 'negocio' && (
                <Link
                  href="/assinar"
                  className={`block w-full text-center py-3 text-white font-semibold rounded-xl transition ${
                    planoInfo.tipoPlano === 'iniciante'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/30'
                  }`}
                >
                  ⬆️ Fazer upgrade pro{' '}
                  {planoInfo.tipoPlano === 'iniciante'
                    ? 'Profissional'
                    : 'Negócio'}
                </Link>
              )}

            {planoInfo.plano === 'ativo' &&
              planoInfo.tipoPlano === 'negocio' && (
                <div className="text-center py-3 px-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                  <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                    👑 Você está no plano máximo! Aproveite todos os recursos.
                  </p>
                </div>
              )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            Carregando informações do plano...
          </p>
        )}
      </div>

      {/* Nome do negócio */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Store size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-50">
            Nome do Negócio
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome exibido no sistema e nos cupons
            </label>
            <input
              type="text"
              value={nomeNegocio}
              onChange={(e) => setNomeNegocio(e.target.value)}
              className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full"
              placeholder="Ex: Mercadinho do Zé"
            />
          </div>
          <button
            onClick={salvarNegocio}
            disabled={salvandoNegocio}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={16} />
            {salvandoNegocio ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* E-mail */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Mail size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-50">
            E-mail
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Novo e-mail
            </label>
            <input
              type="email"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full"
            />
            <p className="text-xs text-gray-400 mt-1">
              Você receberá um e-mail de confirmação no novo endereço
            </p>
          </div>
          <button
            onClick={atualizarEmail}
            disabled={salvandoEmail || novoEmail === userEmail}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {salvandoEmail ? 'Atualizando...' : 'Atualizar e-mail'}
          </button>
        </div>
      </div>

      {/* Senha */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Lock size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-50">
            Alterar Senha
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nova senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full pr-10"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar nova senha
              </label>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className={`input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full ${
                  confirmarSenha && novaSenha !== confirmarSenha
                    ? 'border-red-400'
                    : ''
                }`}
                placeholder="Repita a nova senha"
              />
              {confirmarSenha && novaSenha !== confirmarSenha && (
                <p className="text-xs text-red-500 mt-1">
                  As senhas não coincidem
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={atualizarSenha}
              disabled={
                salvandoSenha || !novaSenha || novaSenha !== confirmarSenha
              }
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              {salvandoSenha ? 'Salvando...' : 'Salvar nova senha'}
            </button>
            <button
              onClick={enviarResetSenha}
              disabled={resetEnviado}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 text-sm"
            >
              <Mail size={16} />
              {resetEnviado
                ? 'E-mail enviado! Aguarde 30s...'
                : 'Enviar reset por e-mail'}
            </button>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Sair da conta em todos os dispositivos
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm font-medium"
        >
          <LogOut size={16} />
          Sair da conta
        </button>
      </div>

      {/* ══════════ 🔒 SEÇÃO LGPD ══════════ */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Seus Dados (LGPD)
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Conforme a Lei Geral de Proteção de Dados, você tem controle total
              sobre seus dados.
            </p>
          </div>
        </div>

        {/* Exportar */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3 mb-3">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Exportar meus dados
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Baixe um arquivo JSON com TODOS os seus dados: produtos, vendas,
                clientes, movimentações, etc.
              </p>
            </div>
          </div>
          <button
            onClick={exportarDadosLGPD}
            disabled={exportandoLGPD}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
          >
            <Download size={16} />
            {exportandoLGPD ? 'Exportando...' : 'Baixar meus dados'}
          </button>
        </div>

        {/* Deletar conta */}
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 dark:text-red-100 mb-1">
                Deletar minha conta permanentemente
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                <strong>Atenção:</strong> essa ação é{' '}
                <strong>irreversível</strong>. Todos os seus dados (produtos,
                vendas, clientes, funcionários) serão apagados permanentemente.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalDeletar(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
          >
            <Trash2 size={16} />
            Solicitar exclusão da conta
          </button>
        </div>

        {/* Info sobre LGPD */}
        <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-3">
          <p className="mb-1">
            🔒 <strong>Seus direitos garantidos:</strong>
          </p>
          <ul className="space-y-0.5 pl-4">
            <li>• Acessar e exportar seus dados a qualquer momento</li>
            <li>• Corrigir informações incorretas</li>
            <li>• Solicitar exclusão total dos dados</li>
            <li>• Revogar consentimento cancelando a conta</li>
          </ul>
          <p className="mt-2">
            Dúvidas?{' '}
            <a
              href="https://wa.me/5522999467499?text=Tenho%20d%C3%BAvidas%20sobre%20LGPD"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              fale conosco no WhatsApp
            </a>
          </p>
        </div>
      </div>

      {/* ══════════ 🗑️ MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ══════════ */}
      {modalDeletar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle
                    size={20}
                    className="text-red-600 dark:text-red-400"
                  />
                </div>
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                  Deletar conta?
                </h3>
              </div>
              <button
                onClick={fecharModalDeletar}
                disabled={deletandoConta}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                  ⚠️ Essa ação é IRREVERSÍVEL
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                  Todos esses dados serão <strong>apagados permanentemente</strong>:
                </p>
                <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 list-disc pl-4">
                  <li>Itens de venda vinculados às transações</li>
                  <li>Todos os produtos cadastrados</li>
                  <li>Histórico completo de vendas</li>
                  <li>Clientes e registros de fiado</li>
                  <li>Movimentações de estoque e alertas</li>
                  <li>Insights de IA salvos no sistema</li>
                  <li>Funcionários e permissões</li>
                  <li>Sua assinatura (se ativa)</li>
                  <li>Configurações e preferências</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Digite <strong>DELETAR MINHA CONTA</strong> para confirmar:
                </label>
                <input
                  type="text"
                  value={textoConfirmacao}
                  onChange={(e) => setTextoConfirmacao(e.target.value)}
                  disabled={deletandoConta}
                  className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full font-mono"
                  placeholder="DELETAR MINHA CONTA"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Digite sua senha atual:
                </label>
                <input
                  type="password"
                  value={senhaConfirmacao}
                  onChange={(e) => setSenhaConfirmacao(e.target.value)}
                  disabled={deletandoConta}
                  className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full"
                  placeholder="Sua senha"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  💡 <strong>Dica:</strong> antes de deletar, considere{' '}
                  <button
                    onClick={() => {
                      fecharModalDeletar()
                      exportarDadosLGPD()
                    }}
                    className="underline font-semibold hover:text-blue-600 dark:hover:text-blue-200"
                  >
                    exportar seus dados
                  </button>{' '}
                  primeiro. Você não conseguirá recuperar depois.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-5 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={fecharModalDeletar}
                disabled={deletandoConta}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={deletarContaLGPD}
                disabled={
                  deletandoConta ||
                  textoConfirmacao !== 'DELETAR MINHA CONTA' ||
                  !senhaConfirmacao
                }
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {deletandoConta ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deletando...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Deletar conta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}