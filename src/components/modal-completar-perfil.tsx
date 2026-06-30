// src/components/modal-completar-perfil.tsx
'use client'

import { useState } from 'react'
import { Phone, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  onComplete: () => void
}

export default function ModalCompletarPerfil({ onComplete }: Props) {
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sucesso, setSucesso] = useState<{
    fantasmasDeletados: number
  } | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const numeros = whatsapp.replace(/\D/g, '')
    if (numeros.length < 10 || numeros.length > 11) {
      setError('WhatsApp inválido. Use o formato (XX) XXXXX-XXXX')
      return
    }

    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Sessão expirada. Faça login novamente.')
        return
      }

      const response = await fetch('/api/perfil/completar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ whatsapp: numeros }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao salvar')
        return
      }

      // 🎉 Sucesso!
      setSucesso({ fantasmasDeletados: data.fantasmas_deletados || 0 })

      // Espera 3 segundos pra mostrar sucesso e depois libera o dashboard
      setTimeout(() => {
        onComplete()
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao processar')
    } finally {
      setLoading(false)
    }
  }

  // ════════════════════════════════════════════════════
  // 🎉 TELA DE SUCESSO
  // ════════════════════════════════════════════════════
  if (sucesso) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="inline-flex w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 items-center justify-center mb-4 shadow-lg shadow-green-500/30">
            <CheckCircle className="w-9 h-9 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Pronto! 🎉
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            WhatsApp cadastrado com sucesso!
          </p>

          {sucesso.fantasmasDeletados > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4 text-left">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                ℹ️ Detectamos {sucesso.fantasmasDeletados} cadastro(s)
                duplicado(s) e removemos pra organizar sua conta.
              </p>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Redirecionando pro dashboard...
          </p>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════
  // 📝 FORMULÁRIO
  // ════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold">Complete seu cadastro</h3>
          </div>
          <p className="text-green-100 text-sm">
            Pra continuar, precisamos do seu WhatsApp pra suporte
          </p>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-5">
          {/* Aviso importante */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                ⚠️ Importante
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                Cada pessoa pode ter <strong>apenas 1 conta</strong> no
                EstoqueSystem. Se você tiver cadastros duplicados, eles serão
                removidos automaticamente.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seu WhatsApp <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={handleWhatsappChange}
                  required
                  autoFocus
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-lg font-semibold"
                  placeholder="(22) 99999-9999"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Esse número será usado pra suporte e notificações importantes.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Validando...
                </>
              ) : (
                'Confirmar e continuar'
              )}
            </button>
          </form>

          <p className="text-xs text-center text-gray-400">
            🔒 Seus dados estão seguros (LGPD)
          </p>
        </div>
      </div>
    </div>
  )
}