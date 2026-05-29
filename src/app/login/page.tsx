'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Alert from '@/components/alerts'
import { Mail, Lock, Package, BarChart3, ShoppingCart, Zap } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          setError('Email ou senha incorretos.')
        } else {
          setError(signInError.message)
        }
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

  return (
    <div className="min-h-screen flex">

      {/* ══════════ LADO ESQUERDO — Branding ══════════ */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">📦</span>
            <span className="text-2xl font-bold text-white">EstoqueSystem</span>
          </Link>

          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-white leading-tight">
                Gerencie seu estoque de forma simples e inteligente
              </h1>
              <p className="text-green-100 text-lg leading-relaxed">
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
                <div key={titulo} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-green-200" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{titulo}</p>
                    <p className="text-green-200 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-green-300 text-sm">
            © {new Date().getFullYear()} EstoqueSystem · Por Lucas Machado
          </p>
        </div>
      </div>

      {/* ══════════ LADO DIREITO — Formulário ══════════ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md space-y-8">

          {/* Logo mobile */}
          <div className="lg:hidden text-center space-y-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-3xl">📦</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                EstoqueSystem
              </span>
            </Link>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Bem-vindo de volta 👋
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Entre na sua conta para acessar o dashboard
            </p>
          </div>

          {error && <Alert message={error} type="error" />}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              className="w-full py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-gray-950 px-4 text-gray-400">
                ou
              </span>
            </div>
          </div>

          {/* Criar conta */}
          <div className="text-center space-y-4">
            <Link
              href="/signup"
              className="block w-full py-3.5 border-2 border-green-600 text-green-600 dark:text-green-400 font-semibold rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition text-center"
            >
              Criar conta grátis
            </Link>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Zap className="w-4 h-4 text-green-500" />
              <span>15 dias grátis — sem cartão de crédito</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}