'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Loader2,
  Phone,
} from 'lucide-react'

import { supabase } from '@/lib/supabase'

interface Props {
  onComplete: () => void
}

interface RespostaAPI {
  success?: boolean
  message?: string
  error?: string
}

function formatarWhatsapp(valorOriginal: string): string {
  let numeros = valorOriginal.replace(/\D/g, '').slice(0, 11)

  if (numeros.length <= 2) {
    return numeros ? `(${numeros}` : ''
  }

  if (numeros.length <= 6) {
    return numeros.replace(
      /(\d{2})(\d{0,4})/,
      '($1) $2'
    )
  }

  if (numeros.length <= 10) {
    return numeros.replace(
      /(\d{2})(\d{4})(\d{0,4})/,
      '($1) $2-$3'
    )
  }

  return numeros.replace(
    /(\d{2})(\d{5})(\d{0,4})/,
    '($1) $2-$3'
  )
}

export default function ModalCompletarPerfil({
  onComplete,
}: Props) {
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const handleWhatsappChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setWhatsapp(formatarWhatsapp(event.target.value))

    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (loading) {
      return
    }

    setError('')

    const numeros = whatsapp.replace(/\D/g, '')

    if (!/^\d{10,11}$/.test(numeros)) {
      setError(
        'Informe um WhatsApp válido com DDD.'
      )
      return
    }

    setLoading(true)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (
        sessionError ||
        !session?.access_token
      ) {
        setError(
          'Sua sessão expirou. Entre novamente para continuar.'
        )
        return
      }

      const response = await fetch(
        '/api/perfil/completar',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            whatsapp: numeros,
          }),
        }
      )

      let data: RespostaAPI

      try {
        data =
          (await response.json()) as RespostaAPI
      } catch {
        setError(
          'O servidor retornou uma resposta inválida.'
        )
        return
      }

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível salvar o WhatsApp.'
        )
        return
      }

      setSucesso(true)
    } catch (error: unknown) {
      console.error(
        'Erro ao completar perfil:',
        error
      )

      setError(
        'Não foi possível completar o cadastro. Verifique sua conexão e tente novamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        role="presentation"
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="perfil-sucesso-titulo"
          aria-describedby="perfil-sucesso-descricao"
          className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:p-8"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2
              aria-hidden="true"
              className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <h2
            id="perfil-sucesso-titulo"
            className="mt-5 text-xl font-bold text-gray-900 dark:text-white"
          >
            Cadastro concluído
          </h2>

          <p
            id="perfil-sucesso-descricao"
            className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400"
          >
            O WhatsApp foi cadastrado e sua conta
            está pronta para continuar.
          </p>

          <button
            type="button"
            onClick={onComplete}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Continuar para o dashboard
          </button>
        </section>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="completar-perfil-titulo"
        aria-describedby="completar-perfil-descricao"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        <header className="border-b border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Phone
                aria-hidden="true"
                className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
                ÚLTIMA ETAPA
              </p>

              <h2
                id="completar-perfil-titulo"
                className="mt-1 text-xl font-bold text-gray-900 dark:text-white"
              >
                Complete seu cadastro
              </h2>

              <p
                id="completar-perfil-descricao"
                className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400"
              >
                Informe um WhatsApp válido para
                identificação da conta e contato de
                suporte.
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400"
            />

            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                Um número por conta
              </p>

              <p className="mt-1 text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                Se o WhatsApp já pertencer a outra
                conta, será necessário entrar na conta
                correta ou informar outro número.
                Nenhuma conta será excluída
                automaticamente.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
            >
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0"
              />

              <p>{error}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="whatsapp"
                className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
              >
                WhatsApp com DDD
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="relative">
                <Phone
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={handleWhatsappChange}
                  required
                  autoFocus
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={15}
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    error
                      ? 'whatsapp-erro whatsapp-ajuda'
                      : 'whatsapp-ajuda'
                  }
                  placeholder="(22) 99999-9999"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3.5 pl-11 pr-4 text-base font-semibold text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <p
                id="whatsapp-ajuda"
                className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
              >
                Digite somente um número ao qual você
                tenha acesso.
              </p>

              {error && (
                <span
                  id="whatsapp-erro"
                  className="sr-only"
                >
                  {error}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2
                    aria-hidden="true"
                    className="h-5 w-5 animate-spin"
                  />
                  Salvando...
                </>
              ) : (
                'Salvar e continuar'
              )}
            </button>
          </form>

          <div className="flex items-start justify-center gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <Lock
              aria-hidden="true"
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
            />

            <p>
              O número será vinculado ao perfil desta
              conta.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}