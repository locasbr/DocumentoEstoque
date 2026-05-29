'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Loading from '@/components/loading'
import { CreditCard, QrCode, Shield, CheckCircle } from 'lucide-react'

const BENEFICIOS = [
  'Controle ilimitado de produtos',
  'Dashboard com métricas em tempo real',
  'Alertas de estoque baixo e crítico',
  'Relatórios de entrada e saída',
  'PDV completo com leitor de código de barras',
  'Múltiplos funcionários por conta',
  'Cupom fiscal não-fiscal via WhatsApp',
  'Suporte prioritário via WhatsApp',
  'Atualizações e novos recursos inclusos',
]

export default function AssinarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')

  // Verifica parâmetros de retorno do Mercado Pago
  const statusPagamento = searchParams.get('pagamento')

  useEffect(() => {
    const verificar = async () => {
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.push('/login')
        return
      }

      setUserId(data.session.user.id)
      setUserEmail(data.session.user.email ?? '')

      // Se o plano já está ativo, manda pro dashboard
      const { data: perfil } = await supabase
        .from('perfis')
        .select('plano')
        .eq('id', data.session.user.id)
        .single()

      if (perfil?.plano === 'ativo') {
        router.push('/dashboard')
        return
      }

      setLoading(false)
    }

    verificar()
  }, [router])

  const handlePagar = async () => {
    setProcessando(true)

    try {
      const response = await fetch('/api/pagamento/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail }),
      })

      const data = await response.json()

      if (data.init_point) {
        // Redireciona pro checkout do Mercado Pago
        window.location.href = data.init_point
      } else {
        alert('Erro ao criar pagamento. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao processar. Tente novamente.')
    } finally {
      setProcessando(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8">

        {/* Alerta de status do pagamento */}
        {statusPagamento === 'falhou' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <p className="text-red-400 font-medium">
              ❌ O pagamento não foi concluído. Tente novamente.
            </p>
          </div>
        )}
        {statusPagamento === 'pendente' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
            <p className="text-yellow-400 font-medium">
              ⏳ Pagamento pendente. Assim que for confirmado, seu acesso será liberado automaticamente.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 mb-2">
            <span className="text-4xl">🔒</span>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Seu período de teste encerrou
          </h1>
          <p className="text-gray-400 text-lg">
            Assine o{' '}
            <span className="text-white font-semibold">EstoqueSystem</span> e
            continue gerenciando seu estoque sem interrupções.
          </p>
        </div>

        {/* Card do Plano */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-8 space-y-6 backdrop-blur-sm">

          {/* Preço */}
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-400 uppercase tracking-wider font-medium">
              Plano Profissional
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-sm text-gray-400">R$</span>
              <span className="text-5xl font-extrabold text-white">79</span>
              <span className="text-2xl font-bold text-white">,90</span>
              <span className="text-gray-400 ml-1">/mês</span>
            </div>
          </div>

          <div className="border-t border-gray-700" />

          {/* Benefícios */}
          <ul className="space-y-3">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-gray-700" />

          {/* Métodos aceitos */}
          <div className="flex items-center justify-center gap-6 text-gray-400">
            <div className="flex items-center gap-2 text-sm">
              <QrCode className="w-5 h-5" />
              <span>PIX</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-5 h-5" />
              <span>Cartão</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-5 h-5" />
              <span>Seguro</span>
            </div>
          </div>

          {/* Botão de pagamento */}
          <button
            onClick={handlePagar}
            disabled={processando}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors"
          >
            {processando ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Redirecionando...
              </>
            ) : (
              <>
                <CreditCard className="w-6 h-6" />
                Pagar com Mercado Pago
              </>
            )}
          </button>

          {/* Segurança */}
          <div className="text-center space-y-2">
            <p className="text-gray-500 text-sm">
              🔒 Pagamento 100% seguro via Mercado Pago
            </p>
            <p className="text-gray-600 text-xs">
              Aceitamos PIX e cartão de crédito/débito à vista.
              Seu acesso é liberado automaticamente após a confirmação.
            </p>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs">
          Dúvidas? Fale conosco via WhatsApp.
        </p>
      </div>
    </div>
  )
}