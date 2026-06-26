'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Alert from '@/components/alerts'
import { Mail, Lock, User, Store, CheckCircle, Phone, MapPin } from 'lucide-react'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [nomeNegocio, setNomeNegocio] = useState('')
  // 🆕 CAMPOS NOVOS
  const [whatsapp, setWhatsapp] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('RJ')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 🆕 Formata WhatsApp automaticamente: (22) 99999-9999
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (valor.length > 11) valor = valor.slice(0, 11)

    if (valor.length > 10) {
      valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
    } else if (valor.length > 6) {
      valor = valor.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    } else if (valor.length > 2) {
      valor = valor.replace(/(\d{2})(\d{0,5})/, '($1) $2')
    } else if (valor.length > 0) {
      valor = valor.replace(/(\d{0,2})/, '($1')
    }

    setWhatsapp(valor)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validações
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    // 🆕 Validação WhatsApp
    const whatsappNumeros = whatsapp.replace(/\D/g, '')
    if (whatsappNumeros.length < 10 || whatsappNumeros.length > 11) {
      setError('WhatsApp inválido. Use o formato (XX) XXXXX-XXXX')
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo: nomeCompleto,
            nome_negocio: nomeNegocio,
            // 🆕 Passa via metadata também
            telefone: whatsappNumeros,
            cidade: cidade,
            estado: estado,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirmado`,
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Este email já está cadastrado. Tente fazer login.')
        } else {
          setError(signUpError.message)
        }
        return
      }

      if (data.user) {
        // 🆕 Atualiza o perfil com WhatsApp/cidade/estado
        // (caso o trigger automático não tenha pego)
        await supabase
          .from('perfis')
          .update({
            telefone: whatsappNumeros,
            cidade: cidade || null,
            estado: estado || null,
          })
          .eq('id', data.user.id)

        // Envia email de boas-vindas
        fetch('/api/email/boas-vindas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            nome: nomeCompleto,
          }),
        }).catch(console.error)

        // Rastreia conversão no Google Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          ;(window as any).gtag('event', 'sign_up', {
            method: 'email',
            value: 0,
            currency: 'BRL',
          })
        }

        // Se o email precisa ser confirmado
        if (data.user.identities?.length === 0 || !data.session) {
          setSuccess(
            '📧 Enviamos um email de confirmação! Verifique sua caixa de entrada.'
          )
          return
        }

        // Se não precisa confirmar (auto-confirm ligado)
        setSuccess('Conta criada com sucesso! Redirecionando...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      }
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.')
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
                Comece a organizar seu estoque agora mesmo
              </h1>
              <p className="text-green-100 text-lg leading-relaxed">
                Crie sua conta em segundos e tenha 15 dias grátis para testar
                tudo — sem compromisso.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: CheckCircle, texto: 'Cadastro rápido — sem burocracia' },
                { icon: CheckCircle, texto: '15 dias grátis com acesso completo' },
                { icon: CheckCircle, texto: 'Sem cartão de crédito' },
                { icon: CheckCircle, texto: 'Funciona no celular e no computador' },
                { icon: CheckCircle, texto: 'Suporte direto via WhatsApp' },
              ].map(({ icon: Icon, texto }) => (
                <div key={texto} className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-green-300 shrink-0" />
                  <p className="text-green-100">{texto}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
                <span className="text-green-200 text-sm font-medium">
                  Feito para pequenos comércios
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <p className="text-green-400 font-semibold text-sm mb-2">
                  💡 Por que o EstoqueSystem?
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Criado por um desenvolvedor que entende a realidade do pequeno
                  comerciante — simples, direto e sem complicação.
                </p>
              </div>
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
              Crie sua conta grátis 🚀
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              15 dias grátis — comece a usar em 2 minutos
            </p>
          </div>

          {error && <Alert message={error} type="error" />}
          {success && <Alert message={success} type="success" />}

          {/* Formulário */}
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Nome completo */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            {/* Nome do negócio */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome do negócio
              </label>
              <div className="relative">
                <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={nomeNegocio}
                  onChange={(e) => setNomeNegocio(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="Ex: Mercadinho do Zé"
                />
              </div>
            </div>

            {/* 🆕 WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>WhatsApp</span>
                <span className="text-xs text-gray-400 font-normal">
                  Pra suporte rápido 💬
                </span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={handleWhatsappChange}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="(22) 99999-9999"
                />
              </div>
            </div>

            {/* 🆕 Cidade + Estado */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cidade
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="Saquarema"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  UF
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition cursor-pointer"
                >
                  {[
                    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
                    'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
                    'RS','RO','RR','SC','SP','SE','TO',
                  ].map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email */}
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

            {/* Senha */}
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
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            {/* Confirmar senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-400'
                      : 'border-gray-200 dark:border-gray-800'
                  }`}
                  placeholder="Repita a senha"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  As senhas não coincidem
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar minha conta grátis'
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

          {/* Login */}
          <div className="text-center space-y-4">
            <Link
              href="/login"
              className="block w-full py-3.5 border-2 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition text-center"
            >
              Já tenho conta — Entrar
            </Link>

            <p className="text-xs text-gray-400 leading-relaxed">
              Ao criar sua conta, você concorda com nossos{' '}
              <Link href="/termos" className="text-green-600 hover:underline" target="_blank">
                Termos de Uso
              </Link>{' '}
              e{' '}
              <Link href="/privacidade" className="text-green-600 hover:underline" target="_blank">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}