'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react'

import Alert from '@/components/alerts'
import { validarEmail } from '@/lib/email-validation'
import { supabase } from '@/lib/supabase'

const VERSAO_TERMOS = '2026-09-03'
const VERSAO_PRIVACIDADE = '2026-09-03'

const ESTADOS_BRASILEIROS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const SENHAS_COMUNS = [
  '123456',
  '1234567',
  '12345678',
  '123456789',
  '1234567890',
  'senha123',
  'senha1234',
  'senha12345',
  'qwerty',
  'qwerty123',
  'abc123',
  'abc1234',
  'password',
  'password123',
  'admin123',
  'admin1234',
  '111111',
  '222222',
  '000000',
]

function esperar(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export default function Signup() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [nomeNegocio, setNomeNegocio] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('RJ')
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleWhatsappChange(event: ChangeEvent<HTMLInputElement>) {
    let valor = event.target.value.replace(/\D/g, '')
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

  async function handleSignup(event: FormEvent) {
    event.preventDefault()
    if (loading) return

    setError('')
    setSuccess('')

    if (!aceitouTermos) {
      setError('Você precisa aceitar os Termos de Uso e a Política de Privacidade.')
      return
    }

    const nomeLimpo = nomeCompleto.trim().replace(/\s+/g, ' ')
    if (nomeLimpo.length < 3 || !nomeLimpo.includes(' ')) {
      setError('Digite seu nome e sobrenome, como João Silva.')
      return
    }

    const negocioLimpo = nomeNegocio.trim().replace(/\s+/g, ' ')
    if (negocioLimpo.length < 2) {
      setError('Digite um nome válido para o negócio.')
      return
    }

    const whatsappNumeros = whatsapp.replace(/\D/g, '')
    if (whatsappNumeros.length < 10 || whatsappNumeros.length > 11) {
      setError('WhatsApp inválido. Use o formato (XX) XXXXX-XXXX.')
      return
    }
    if (/^(\d)\1+$/.test(whatsappNumeros)) {
      setError('Digite um WhatsApp válido.')
      return
    }

    const ddd = Number.parseInt(whatsappNumeros.slice(0, 2), 10)
    if (ddd < 11 || ddd > 99) {
      setError('Informe um DDD brasileiro válido.')
      return
    }

    const cidadeLimpa = cidade.trim().replace(/\s+/g, ' ')
    if (cidadeLimpa.length < 2) {
      setError('Digite a cidade do negócio.')
      return
    }

    if (!ESTADOS_BRASILEIROS.includes(estado)) {
      setError('Selecione um estado válido.')
      return
    }

    const emailNormalizado = email.trim().toLowerCase()
    const validacaoEmail = validarEmail(emailNormalizado)
    if (!validacaoEmail.valido) {
      let mensagem = validacaoEmail.erro || 'E-mail inválido.'
      if (validacaoEmail.sugestao) {
        mensagem += ` Você quis dizer ${validacaoEmail.sugestao}?`
      }
      setError(mensagem)
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (SENHAS_COMUNS.includes(password.toLowerCase())) {
      setError('Essa senha é muito comum. Use uma senha mais segura.')
      return
    }

    setLoading(true)

    try {
      const { data: perfisExistentes, error: telefoneError } = await supabase
        .from('perfis')
        .select('id')
        .eq('telefone', whatsappNumeros)
        .limit(1)

      if (telefoneError) {
        console.error('Erro ao verificar WhatsApp:', telefoneError)
        setError('Não foi possível validar o WhatsApp. Tente novamente.')
        return
      }

      if (perfisExistentes && perfisExistentes.length > 0) {
        setError(
          'Este WhatsApp já possui uma conta. Faça login ou recupere a senha.'
        )
        return
      }

      const prefixoEmail = emailNormalizado.split('@')[0]
      if (prefixoEmail.length >= 4) {
        const { data: emailsSimilares, error: similaresError } = await supabase
          .from('perfis_completos')
          .select('email')
          .ilike('email', `${prefixoEmail}@%`)
          .limit(5)

        if (similaresError) {
          console.error('Erro ao verificar e-mails semelhantes:', similaresError)
          setError('Não foi possível validar o e-mail. Tente novamente.')
          return
        }

        if (emailsSimilares && emailsSimilares.length > 0) {
          const emailExistente = emailsSimilares[0].email
          setError(
            `Já existe uma conta com o e-mail “${emailExistente}”. Se for sua conta, faça login. Caso contrário, utilize outro endereço.`
          )
          return
        }
      }

      const aceiteRegistradoEm = new Date().toISOString()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailNormalizado,
        password,
        options: {
          data: {
            nome_completo: nomeLimpo,
            nome_negocio: negocioLimpo,
            telefone: whatsappNumeros,
            cidade: cidadeLimpa,
            estado,
            termos_aceitos: true,
            termos_versao: VERSAO_TERMOS,
            privacidade_versao: VERSAO_PRIVACIDADE,
            aceite_registrado_em: aceiteRegistradoEm,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirmado`,
        },
      })

      if (signUpError) {
        const mensagem = signUpError.message.toLowerCase()
        if (mensagem.includes('already registered')) {
          setError('Este e-mail já está cadastrado. Tente fazer login.')
        } else if (mensagem.includes('whatsapp já está cadastrado')) {
          setError('Este WhatsApp já possui uma conta. Faça login ou recupere a senha.')
        } else {
          console.error('Erro ao criar conta:', signUpError)
          setError('Não foi possível criar a conta. Confira os dados e tente novamente.')
        }
        return
      }

      if (!data.user) {
        setError('Não foi possível concluir a criação da conta.')
        return
      }

      let perfilSalvo = false
      for (let tentativa = 1; tentativa <= 3 && !perfilSalvo; tentativa += 1) {
        const { error: upsertError } = await supabase.from('perfis').upsert(
          {
            id: data.user.id,
            telefone: whatsappNumeros,
            cidade: cidadeLimpa,
            estado,
            nome_negocio: negocioLimpo,
          },
          { onConflict: 'id' }
        )

        if (!upsertError) {
          perfilSalvo = true
        } else {
          console.error(`Tentativa ${tentativa} de salvar perfil:`, upsertError)
          if (tentativa < 3) await esperar(500)
        }
      }

      if (!perfilSalvo) {
        console.error('O perfil não foi complementado após três tentativas.')
      }

      void fetch('/api/email/boas-vindas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailNormalizado,
          nome: nomeLimpo,
        }),
      }).catch((emailError) =>
        console.error('Erro ao solicitar e-mail de boas-vindas:', emailError)
      )

      if (data.user.identities?.length === 0 || !data.session) {
        setSuccess(
          'Enviamos um e-mail de confirmação. Verifique a caixa de entrada e a pasta de spam.'
        )
        return
      }

      setSuccess('Conta criada com sucesso. Redirecionando...')
      window.setTimeout(() => router.push('/dashboard'), 1500)
    } catch (signupError) {
      console.error('Erro inesperado no cadastro:', signupError)
      setError('Erro ao criar a conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 lg:flex lg:w-1/2">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white">
              <Package className="h-6 w-6" />
            </span>
            <span className="text-2xl font-bold text-white">EstoqueSystem</span>
          </Link>

          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight text-white">
                Comece a organizar seu estoque agora mesmo
              </h1>
              <p className="text-lg leading-relaxed text-green-100">
                Crie sua conta e teste o fluxo do EstoqueSystem por 15 dias, sem
                cadastrar cartão.
              </p>
            </div>

            <div className="space-y-4">
              {[
                'Cadastro direto, sem implantação complicada',
                '15 dias para conhecer o sistema',
                'Sem cartão durante o teste',
                'Funciona no celular e no computador',
                'Suporte direto pelo WhatsApp',
              ].map((texto) => (
                <div key={texto} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-green-300" />
                  <p className="text-green-100">{texto}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-green-300" />
                <div>
                  <p className="font-semibold text-white">Seus dados, suas escolhas</p>
                  <p className="mt-2 text-sm leading-relaxed text-green-100">
                    Antes do cadastro, você pode consultar os Termos de Uso e a
                    Política de Privacidade em outra aba.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-green-200">
            © {new Date().getFullYear()} EstoqueSystem · Lucas Machado
          </p>
        </div>
      </aside>

      <main className="flex w-full items-center justify-center bg-white p-6 dark:bg-gray-950 sm:p-10 lg:w-1/2">
        <div className="w-full max-w-md space-y-8 py-6">
          <div className="space-y-2 text-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white">
                <Package className="h-5 w-5" />
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                EstoqueSystem
              </span>
            </Link>
          </div>

          <header className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Crie sua conta grátis
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Preencha os dados para iniciar o período de teste.
            </p>
          </header>

          {error && <Alert message={error} type="error" />}
          {success && <Alert message={success} type="success" />}

          <form onSubmit={handleSignup} className="space-y-5">
            <CampoTexto
              label="Nome completo"
              icon={User}
              type="text"
              value={nomeCompleto}
              onChange={setNomeCompleto}
              placeholder="Ex.: João Silva"
              autoComplete="name"
              minLength={3}
              maxLength={120}
            />

            <CampoTexto
              label="Nome do negócio"
              icon={Store}
              type="text"
              value={nomeNegocio}
              onChange={setNomeNegocio}
              placeholder="Ex.: Mercado Central"
              autoComplete="organization"
              minLength={2}
              maxLength={120}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="whatsapp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  WhatsApp
                </label>
                <span className="text-xs text-gray-400">Usado também para suporte</span>
              </div>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={handleWhatsappChange}
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="(22) 99999-9999"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label htmlFor="cidade" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cidade
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="cidade"
                    type="text"
                    value={cidade}
                    onChange={(event) => setCidade(event.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="address-level2"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    placeholder="Sua cidade"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="estado" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  UF
                </label>
                <select
                  id="estado"
                  value={estado}
                  onChange={(event) => setEstado(event.target.value)}
                  required
                  autoComplete="address-level1"
                  className="w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-green-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  {ESTADOS_BRASILEIROS.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            <CampoTexto
              label="E-mail"
              icon={Mail}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="seu@email.com"
              autoComplete="email"
              maxLength={160}
            />

            <CampoTexto
              label="Senha"
              icon={Lock}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
            />

            <div className="space-y-1.5">
              <CampoTexto
                label="Confirmar senha"
                icon={Lock}
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Repita a senha"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                invalid={Boolean(confirmPassword && password !== confirmPassword)}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">As senhas não coincidem.</p>
              )}
            </div>

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                aceitouTermos
                  ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900'
              }`}
            >
              <input
                type="checkbox"
                checked={aceitouTermos}
                onChange={(event) => setAceitouTermos(event.target.checked)}
                disabled={loading}
                className="mt-0.5 h-4 w-4 shrink-0 accent-green-600"
              />
              <span className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                Li e aceito os{' '}
                <Link
                  href="/termos"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="font-semibold text-green-600 hover:underline"
                >
                  Termos de Uso
                </Link>{' '}
                e a{' '}
                <Link
                  href="/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="font-semibold text-green-600 hover:underline"
                >
                  Política de Privacidade
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !aceitouTermos}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Criando conta...
                </>
              ) : (
                'Criar minha conta grátis'
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-gray-400 dark:bg-gray-950">ou</span>
            </div>
          </div>

          <Link
            href="/login"
            className="block w-full rounded-xl border-2 border-gray-200 py-3.5 text-center font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
          >
            Já tenho conta, entrar
          </Link>
        </div>
      </main>
    </div>
  )
}

function CampoTexto({
  label,
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  maxLength,
  invalid = false,
}: {
  label: string
  icon: typeof User
  type: 'text' | 'email' | 'password'
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete: string
  minLength?: number
  maxLength?: number
  invalid?: boolean
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          minLength={minLength}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className={`w-full rounded-xl border bg-gray-50 py-3 pl-11 pr-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-500 dark:bg-gray-900 dark:text-white ${
            invalid
              ? 'border-red-400 dark:border-red-500'
              : 'border-gray-200 dark:border-gray-800'
          }`}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
