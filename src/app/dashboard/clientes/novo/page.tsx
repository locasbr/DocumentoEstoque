'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from 'lucide-react'

import Alert from '@/components/alerts'
import UpgradeBlock from '@/components/upgrade-block'
import { useNotification } from '@/contexts/NotificationContext'
import { usePlano } from '@/hooks/usePlano'
import { supabase } from '@/lib/supabase'

interface FormCliente {
  nome: string
  telefone: string
  cpf: string
  email: string
  endereco: string
  notas: string
}

interface ClienteCriado {
  id: string
  usuario_id: string
  nome: string
  telefone: string
  cpf: string
  email: string
  endereco: string
  notas: string
  criado_em: string
  cadastrado_por: string
}

const FORM_INICIAL: FormCliente = {
  nome: '',
  telefone: '',
  cpf: '',
  email: '',
  endereco: '',
  notas: '',
}

function somenteNumeros(valor: string): string {
  return valor.replace(/\D/g, '')
}

function mascararTelefone(valor: string): string {
  const numeros = somenteNumeros(valor).slice(0, 11)

  if (numeros.length <= 2) return numeros
  if (numeros.length <= 6) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`
  }
  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
}

function mascararCPF(valor: string): string {
  const numeros = somenteNumeros(valor).slice(0, 11)

  if (numeros.length <= 3) return numeros
  if (numeros.length <= 6) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3)}`
  }
  if (numeros.length <= 9) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`
  }

  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`
}

function cpfValido(cpfInformado: string): boolean {
  const cpf = somenteNumeros(cpfInformado)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  const calcularDigito = (quantidade: number): number => {
    let soma = 0
    for (let indice = 0; indice < quantidade; indice += 1) {
      soma += Number(cpf[indice]) * (quantidade + 1 - indice)
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  return (
    calcularDigito(9) === Number(cpf[9]) &&
    calcularDigito(10) === Number(cpf[10])
  )
}

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function obterMensagemErro(erro: unknown): string {
  if (
    typeof erro === 'object' &&
    erro !== null &&
    'message' in erro &&
    typeof erro.message === 'string'
  ) {
    return erro.message
  }

  return 'Erro inesperado ao cadastrar o cliente.'
}

export default function NovoClientePage() {
  const router = useRouter()
  const { addNotification } = useNotification()
  const { isIniciante, loading: loadingPlano } = usePlano()

  const [formData, setFormData] = useState<FormCliente>(FORM_INICIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target

    let proximoValor = value
    if (name === 'telefone') proximoValor = mascararTelefone(value)
    if (name === 'cpf') proximoValor = mascararCPF(value)

    setFormData((atual) => ({
      ...atual,
      [name]: proximoValor,
    }))

    if (error) setError('')
  }

  const validarFormulario = (): string | null => {
    const nome = formData.nome.trim().replace(/\s+/g, ' ')
    const telefone = somenteNumeros(formData.telefone)
    const cpf = somenteNumeros(formData.cpf)
    const email = formData.email.trim().toLowerCase()

    if (!nome) return 'Nome é obrigatório.'
    if (nome.length < 2) return 'O nome deve ter pelo menos 2 caracteres.'
    if (nome.length > 120) return 'O nome deve ter no máximo 120 caracteres.'

    if (telefone && (telefone.length < 10 || telefone.length > 13)) {
      return 'Informe um telefone válido com DDD.'
    }

    if (cpf && !cpfValido(cpf)) {
      return 'Informe um CPF válido.'
    }

    if (email && !emailValido(email)) {
      return 'Informe um e-mail válido.'
    }

    if (email.length > 160) {
      return 'O e-mail deve ter no máximo 160 caracteres.'
    }

    if (formData.endereco.trim().length > 250) {
      return 'O endereço deve ter no máximo 250 caracteres.'
    }

    if (formData.notas.trim().length > 500) {
      return 'As observações devem ter no máximo 500 caracteres.'
    }

    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return

    setError('')
    const erroValidacao = validarFormulario()
    if (erroValidacao) {
      setError(erroValidacao)
      return
    }

    setLoading(true)

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'registrar_cliente',
        {
          p_nome: formData.nome.trim(),
          p_telefone: formData.telefone.trim() || null,
          p_cpf: formData.cpf.trim() || null,
          p_email: formData.email.trim() || null,
          p_endereco: formData.endereco.trim() || null,
          p_notas: formData.notas.trim() || null,
        }
      )

      if (rpcError) throw rpcError

      const clienteCriado = data as ClienteCriado | null
      if (!clienteCriado?.id) {
        throw new Error('O servidor retornou uma resposta inválida.')
      }

      addNotification(
        `Cliente "${clienteCriado.nome}" cadastrado com sucesso.`,
        'success',
        3000
      )

      router.push(`/dashboard/clientes/${clienteCriado.id}`)
      router.refresh()
    } catch (erro: unknown) {
      console.error('Erro ao cadastrar cliente:', erro)
      setError(obterMensagemErro(erro))
    } finally {
      setLoading(false)
    }
  }

  if (loadingPlano) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-gray-500">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        <span className="text-sm">Verificando plano...</span>
      </div>
    )
  }

  if (isIniciante) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <UpgradeBlock
          titulo="Cadastrar Clientes"
          descricao="Cadastre clientes, controle quem deve e tenha histórico completo de pagamentos. Disponível no plano Profissional."
          planoNecessario="profissional"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard/clientes"
          aria-label="Voltar para clientes"
          className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Novo cliente
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cadastre um cliente para vincular vendas e controlar o fiado.
          </p>
        </div>
      </header>

      {error && (
        <Alert
          key={error}
          message={error}
          type="error"
          onClose={() => setError('')}
        />
      )}

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        <Campo label="Nome *" contador={`${formData.nome.length}/120`}>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              maxLength={120}
              autoComplete="name"
              className="input-field w-full pl-10"
              placeholder="Nome completo do cliente"
              required
              autoFocus
            />
          </div>
        </Campo>

        <Campo label="Telefone" ajuda="Informe o DDD e o número.">
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              name="telefone"
              type="tel"
              inputMode="tel"
              value={formData.telefone}
              onChange={handleChange}
              maxLength={15}
              autoComplete="tel"
              className="input-field w-full pl-10"
              placeholder="(22) 99999-9999"
            />
          </div>
        </Campo>

        <Campo
          label="CPF (opcional)"
          ajuda="O CPF será validado e não poderá ser repetido nesta conta."
        >
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              name="cpf"
              type="text"
              inputMode="numeric"
              value={formData.cpf}
              onChange={handleChange}
              maxLength={14}
              autoComplete="off"
              className="input-field w-full pl-10"
              placeholder="000.000.000-00"
            />
          </div>
        </Campo>

        <Campo label="E-mail (opcional)" contador={`${formData.email.length}/160`}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              maxLength={160}
              autoComplete="email"
              className="input-field w-full pl-10"
              placeholder="email@exemplo.com"
            />
          </div>
        </Campo>

        <Campo
          label="Endereço (opcional)"
          contador={`${formData.endereco.length}/250`}
        >
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              maxLength={250}
              rows={2}
              autoComplete="street-address"
              className="input-field w-full resize-none pl-10"
              placeholder="Rua, número, bairro e complemento"
            />
          </div>
        </Campo>

        <Campo
          label="Observações (opcional)"
          contador={`${formData.notas.length}/500`}
        >
          <div className="relative">
            <FileText className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              maxLength={500}
              rows={4}
              className="input-field w-full resize-none pl-10"
              placeholder="Informações úteis sobre o cliente..."
            />
          </div>
        </Campo>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          Telefone, CPF e e-mail são dados pessoais. Cadastre apenas as
          informações necessárias para atendimento, vendas ou controle de fiado.
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
          <Link
            href="/dashboard/clientes"
            aria-disabled={loading}
            className={`btn-secondary flex items-center justify-center px-6 py-3 ${
              loading ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex flex-1 items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Salvar cliente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function Campo({
  label,
  ajuda,
  contador,
  children,
}: {
  label: string
  ajuda?: string
  contador?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <label className="block text-sm font-medium">{label}</label>
        {contador && (
          <span className="text-[11px] text-gray-400">{contador}</span>
        )}
      </div>
      {children}
      {ajuda && <p className="mt-1 text-xs text-gray-400">{ajuda}</p>}
    </div>
  )
}
