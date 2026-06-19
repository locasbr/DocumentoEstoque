'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Loading from '@/components/loading'
import { CheckCircle, Sparkles, Crown, Zap } from 'lucide-react'
import Link from 'next/link'

const PLANOS = [
  {
    id: 'iniciante',
    nome: 'Iniciante',
    descricao: 'Pra quem ta comecando',
    preco: 39.90,
    icon: Zap,
    cor: 'border-gray-300 dark:border-gray-700',
    corIcon: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    beneficios: [
      'Ate 100 produtos',
      '1 usuario',
      'PDV completo',
      'Leitor de codigo de barras',
      'Alertas de estoque baixo',
      'Relatorios basicos',
      'Suporte por email',
    ],
  },
  {
    id: 'profissional',
    nome: 'Profissional',
    descricao: 'Pro mercadinho que cresce',
    preco: 79.90,
    icon: Sparkles,
    cor: 'border-green-500 ring-4 ring-green-500/20',
    corIcon: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    destaque: true,
    beneficios: [
      'Produtos ilimitados',
      'Ate 3 usuarios',
      'Clientes + Fiado',
      'Controle de validade',
      'Relatorios avancados (lucro/margem)',
      'Exportacao CSV',
      'Cupom via WhatsApp',
      'Suporte prioritario WhatsApp',
    ],
  },
  {
    id: 'negocio',
    nome: 'Negocio',
    descricao: 'Pra mercadinho com filiais',
    preco: 149.90,
    icon: Crown,
    cor: 'border-purple-500',
    corIcon: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    beneficios: [
      'Tudo do Profissional',
      'Ate 10 usuarios',
      'Ate 2 filiais',
      'Backup automatico diario',
      'Historico estendido (24 meses)',
      'Onboarding 1-a-1 com Lucas',
      'Suporte VIP 24/7',
    ],
  },
]

function AssinarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState<string | null>(null)
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [planoSelecionado, setPlanoSelecionado] = useState<string>('profissional')
  const [tipoPagamento, setTipoPagamento] = useState<'pix' | 'assinatura'>('assinatura')

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
    setProcessando(planoSelecionado)
    try {
      const endpoint = tipoPagamento === 'pix'
        ? '/api/pagamento/criar'
        : '/api/pagamento/assinatura'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail,
          tipoPlano: planoSelecionado,
        }),
      })
      const data = await response.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        alert('Erro ao criar pagamento. Tente novamente.')
      }
    } catch {
      alert('Erro ao processar pagamento.')
    } finally {
      setProcessando(null)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {statusPagamento === 'falhou' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center text-red-700 dark:text-red-300">
            Pagamento nao concluido. Tente novamente.
          </div>
        )}
        {statusPagamento === 'pendente' && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-center text-yellow-700 dark:text-yellow-300">
            Pagamento pendente. Assim que confirmado, seu acesso sera liberado.
          </div>
        )}

        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Seu periodo de teste encerrou
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Escolha o plano ideal e continue gerenciando seu estoque sem interrupcoes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
          {PLANOS.map((plano) => {
            const Icon = plano.icon
            const isSelected = planoSelecionado === plano.id
            return (
              <button
                key={plano.id}
                onClick={() => setPlanoSelecionado(plano.id)}
                className={`text-left relative bg-white dark:bg-gray-900 border-2 ${isSelected ? plano.cor : 'border-gray-200 dark:border-gray-700'} rounded-2xl p-6 transition-all hover:shadow-lg ${plano.destaque && !isSelected ? 'md:scale-105' : ''} ${isSelected ? 'shadow-xl scale-105' : ''}`}
              >
                {plano.destaque && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-600 text-white text-sm font-bold rounded-full whitespace-nowrap">
                    MAIS POPULAR
                  </div>
                )}

                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}

                <div className={`w-12 h-12 ${plano.corIcon} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {plano.nome}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {plano.descricao}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    R$ {Math.floor(plano.preco)}
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    ,{(plano.preco % 1).toFixed(2).slice(2)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">/mes</span>
                </div>

                <ul className="space-y-2 text-sm">
                  {plano.beneficios.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{b}</span>
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 md:p-8">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Forma de pagamento</h3>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setTipoPagamento('pix')}
              className={`p-4 rounded-xl border-2 transition ${tipoPagamento === 'pix' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
            >
              <div className="text-2xl mb-1">💸</div>
              <div className="font-bold text-gray-900 dark:text-white">PIX</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Pagamento unico mensal</div>
            </button>

            <button
              onClick={() => setTipoPagamento('assinatura')}
              className={`p-4 rounded-xl border-2 transition ${tipoPagamento === 'assinatura' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
            >
              <div className="text-2xl mb-1">💳</div>
              <div className="font-bold text-gray-900 dark:text-white">Cartao</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Assinatura automatica</div>
            </button>
          </div>

          <button
            onClick={handlePagar}
            disabled={processando !== null}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-full text-lg transition shadow-lg hover:shadow-green-600/30"
          >
            {processando
              ? 'Processando...'
              : `Assinar ${PLANOS.find(p => p.id === planoSelecionado)?.nome} (R$ ${PLANOS.find(p => p.id === planoSelecionado)?.preco.toFixed(2).replace('.', ',')}/mes)`
            }
          </button>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
            Pagamento 100% seguro via Mercado Pago | Cancele quando quiser
          </p>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <Link
              href="https://wa.me/5522999467499?text=Tenho%20duvidas%20sobre%20os%20planos%20do%20EstoqueSystem"
              target="_blank"
              className="text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              Tenho duvidas, falar com Lucas pelo WhatsApp
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AssinarPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AssinarContent />
    </Suspense>
  )
}