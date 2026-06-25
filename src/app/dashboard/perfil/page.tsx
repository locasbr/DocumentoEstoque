'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/contexts/NotificationContext'
import { User, Lock, Store, Mail, Save, Eye, EyeOff, LogOut } from 'lucide-react'
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

  useEffect(() => {
    async function carregarPerfil() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      setUserEmail(user.email || '')
      setNovoEmail(user.email || '')

      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome_negocio, plano, tipo_plano, trial_fim')
        .eq('id', user.id)
        .single()

      if (perfil) {
        setNomeNegocio(perfil.nome_negocio)

        // Info do plano
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
  }, [])

  // Salvar nome do negócio
  async function salvarNegocio() {
    if (!nomeNegocio.trim()) return
    setSalvandoNegocio(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('perfis')
      .update({ nome_negocio: nomeNegocio })
      .eq('id', user!.id)
    if (error) addNotification('Erro ao salvar nome do negócio', 'error')
    else addNotification('Nome do negócio atualizado!', 'success')
    setSalvandoNegocio(false)
  }

  // Atualizar e-mail
  async function atualizarEmail() {
    if (!novoEmail || novoEmail === userEmail) return
    setSalvandoEmail(true)
    const { error } = await supabase.auth.updateUser({ email: novoEmail })
    if (error) addNotification('Erro ao atualizar e-mail: ' + error.message, 'error')
    else
      addNotification(
        'Verifique seu novo e-mail para confirmar a alteração',
        'success'
      )
    setSalvandoEmail(false)
  }

  // Atualizar senha
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
    if (error) addNotification('Erro ao atualizar senha: ' + error.message, 'error')
    else {
      addNotification('Senha atualizada com sucesso!', 'success')
      setNovaSenha('')
      setConfirmarSenha('')
    }
    setSalvandoSenha(false)
  }

  // Enviar reset por e-mail
  async function enviarResetSenha() {
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) addNotification('Erro ao enviar e-mail', 'error')
    else {
      setResetEnviado(true)
      addNotification('E-mail de recuperação enviado!', 'success')
    }
  }

  // Logout
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
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
            {nomeNegocio}
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
            {/* Status do plano */}
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

            {/* Barra de progresso do trial */}
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

            {/* Botão de ação - Trial */}
              {planoInfo.plano === 'trial' && (
                <Link
                  href="/assinar"
                  className="block w-full text-center py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 text-white font-semibold rounded-xl transition"
                >
                  Assinar agora — A partir de R$ 39,90/mês
                </Link>
              )}
  
            {/* Botão upgrade pra quem tá ativo mas não é Negócio */}
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

            {/* Mensagem pra quem já tá no Negócio */}
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
          <p className="text-gray-500 text-sm">Carregando informações do plano...</p>
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
          <h2 className="font-semibold text-gray-900 dark:text-gray-50">E-mail</h2>
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
                <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
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
              {resetEnviado ? 'E-mail enviado!' : 'Enviar reset por e-mail'}
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
    </div>
  )
}