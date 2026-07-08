'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Alert from '@/components/alerts'
import {
  Mail,
  Lock,
  Package,
  BarChart3,
  ShoppingCart,
  ArrowLeft,
} from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sucesso, setSucesso] = useState('') // 🆕 estado separado pra mensagens de sucesso

  // Reset password
  const [modoReset, setModoReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSucesso, setResetSucesso] = useState(false)
  const [resetError, setResetError] = useState('')

  const traduzirErroSupabase = (mensagem: string): string => {
    const msg = mensagem.toLowerCase().trim()

    if (msg.includes('invalid login credentials')) {
      return 'Email ou senha incorretos.'
    }
    if (msg.includes('email not confirmed')) {
      return 'Email ainda não confirmado. Verifique sua caixa de entrada (e o spam) pra confirmar a conta.'
    }
    if (msg.includes('email link is invalid') || msg.includes('token has expired')) {
      return 'Link inválido ou expirado. Solicite um novo.'
    }
    if (msg.includes('user not found')) {
      return 'Usuário não encontrado.'
    }
    if (msg.includes('user already registered')) {
      return 'Este email já está cadastrado. Faça login.'
    }
    if (msg.includes('already registered')) {
      return 'Este email já está cadastrado.'
    }
    if (msg.includes('password should be at least')) {
      return 'A senha precisa ter pelo menos 6 caracteres.'
    }
    if (msg.includes('weak password') || msg.includes('password is too weak')) {
      return 'Senha muito fraca. Use letras, números e ao menos 6 caracteres.'
    }
    if (msg.includes('new password should be different')) {
      return 'A nova senha precisa ser diferente da atual.'
    }
    if (msg.includes('email rate limit exceeded')) {
      return 'Muitas tentativas de envio de email. Aguarde alguns minutos e tente de novo.'
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Muitas tentativas. Aguarde um pouco e tente novamente.'
    }
    if (msg.includes('signups not allowed') || msg.includes('signup disabled')) {
      return 'Cadastros estão temporariamente desabilitados.'
    }
    if (msg.includes('unable to validate email address') || msg.includes('invalid email')) {
      return 'Email inválido. Verifique o formato.'
    }
    if (msg.includes('oauth') || msg.includes('provider')) {
      return 'Erro ao autenticar com o provedor externo. Tente de novo.'
    }
    if (msg.includes('jwt expired') || msg.includes('session expired') || msg.includes('invalid jwt')) {
      return 'Sua sessão expirou. Faça login novamente.'
    }
    if (msg.includes('missing') && msg.includes('token')) {
      return 'Sessão inválida. Faça login novamente.'
    }
    if (msg.includes('network') || msg.includes('failed to fetch')) {
      return 'Erro de conexão. Verifique sua internet e tente de novo.'
    }

    return mensagem
  }

  const erroEmailNaoConfirmado =
    error.toLowerCase().includes('email ainda não confirmado') ||
    error.toLowerCase().includes('email not confirmed')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSucesso('')
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(traduzirErroSupabase(signInError.message))
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReenviarConfirmacao = async () => {
    setLoading(true)
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (resendError) {
        setError(traduzirErroSupabase(resendError.message))
        return
      }

      // 🆕 Limpa o erro e mostra a mensagem de sucesso
      setError('')
      setSucesso('Email de confirmação reenviado! Verifique sua caixa de entrada.')
    } catch {
      setError('Erro ao reenviar email. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError('')
    setResetLoading(true)

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetError('Digite um email válido')
      setResetLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setResetError(traduzirErroSupabase(error.message))
      } else {
        setResetSucesso(true)
      }
    } catch {
      setResetError('Erro ao enviar email. Tente novamente.')
    } finally {
      setResetLoading(false)
    }
  }

  // ══════════ TELA DE RESET ══════════
  if (modoReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
            <button
              onClick={() => {
                setModoReset(false)
                setResetSucesso(false)
                setResetError('')
              }}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 text-sm"
            >
              <ArrowLeft size={16} /> Voltar ao login
            </button>

            {resetSucesso ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={32} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Email enviado! 📧
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  Enviamos um link de recuperação para:
                </p>
                <p className="font-semibold text-gray-900 dark:text-white mb-6">
                  {resetEmail}
                </p>
                <p className="text-sm text-gray-400">
                  Não recebeu? Verifique a pasta de spam ou{' '}
                  <button
                    onClick={() => setResetSucesso(false)}
                    className="text-blue-600 hover:underline"
                  >
                    tente novamente
                  </button>
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={32} className="text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Esqueceu sua senha?
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                    Digite seu email e enviaremos um link para redefinir sua
                    senha.
                  </p>
                </div>

                {resetError && <Alert message={resetError} type="error" />}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email da sua conta
                    </label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                        placeholder="seu@email.com"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
                  >
                    {resetLoading ? 'Enviando...' : 'Enviar link de recuperação'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ══════════ TELA DE LOGIN ══════════
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Lado esquerdo — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-12 text-white">
        <div>
          <h1 className="text-3xl font-bold mb-2">📦 EstoqueSystem</h1>
          <h2 className="text-2xl font-bold mt-8 leading-tight">
            Gerencie seu estoque de forma simples e inteligente
          </h2>
          <p className="text-green-100 mt-4 text-lg">
            Tudo que seu comércio precisa em um só lugar — do controle de
            estoque ao ponto de venda.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              icon: Package,
              titulo: 'Controle total',
              desc: 'Cadastre produtos e acompanhe quantidades em tempo real',
            },
            {
              icon: ShoppingCart,
              titulo: 'PDV integrado',
              desc: 'Venda direto pelo celular com leitor de código de barras',
            },
            {
              icon: BarChart3,
              titulo: 'Relatórios claros',
              desc: 'Veja vendas, lucro e movimentação em gráficos simples',
            },
          ].map(({ icon: Icon, titulo, desc }) => (
            <div key={titulo} className="flex items-start gap-3">
              <div className="p-2 bg-white/10 rounded-lg flex-shrink-0">
                <Icon size={20} />
              </div>
              <div>
                <p className="font-semibold">{titulo}</p>
                <p className="text-green-100 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-green-200 text-sm">
          © {new Date().getFullYear()} EstoqueSystem · Por Lucas Machado
        </p>
      </div>

      {/* Lado direito — Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-4xl">📦</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
              EstoqueSystem
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bem-vindo de volta 👋
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Entre na sua conta para acessar o dashboard
            </p>
          </div>

          {error && <Alert message={error} type="error" />}

          {/* 🆕 Alert verde de sucesso pro reenvio */}
          {sucesso && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm">
              ✅ {sucesso}
            </div>
          )}

          {/* Botão de reenvio (só aparece se o erro for de email não confirmado E ainda não reenviou) */}
          {erroEmailNaoConfirmado && !sucesso && (
            <button
              type="button"
              onClick={handleReenviarConfirmacao}
              disabled={loading}
              className="mb-4 text-sm font-semibold text-green-600 hover:text-green-700 dark:text-green-400 hover:underline disabled:opacity-50"
            >
              📩 Reenviar email de confirmação
            </button>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setModoReset(true)
                    setResetEmail(email)
                  }}
                  className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="Sua senha"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            <span className="text-sm text-gray-400">ou</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          </div>

          <Link
            href="/signup"
            className="block w-full py-3 border-2 border-green-600 text-green-600 dark:text-green-400 dark:border-green-400 font-semibold rounded-xl text-center hover:bg-green-50 dark:hover:bg-green-900/20 transition"
          >
            Criar conta grátis
          </Link>
          <p className="text-center text-xs text-gray-400 mt-3">
            15 dias grátis — sem cartão de crédito
          </p>
        </div>
      </div>
    </div>
  )
}