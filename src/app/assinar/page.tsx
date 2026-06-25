'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Loading from '@/components/loading'
import {
  CheckCircle,
  Sparkles,
  Crown,
  Zap,
  Shield,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react'
import Link from 'next/link'

interface Beneficio {
  texto: string
  bold?: boolean
  ia?: boolean
  soon?: boolean
}

interface Plano {
  id: 'iniciante' | 'profissional' | 'negocio'
  nome: string
  descricao: string
  preco: number
  icon: typeof Zap
  cor: string
  corBorda: string
  corIcon: string
  corBotao: string
  destaque?: boolean
  beneficios: Beneficio[]
}

const PLANOS: Plano[] = [
  {
    id: 'iniciante',
    nome: 'Iniciante',
    descricao: 'Pra quem tá começando',
    preco: 39.9,
    icon: Zap,
    cor: 'gray',
    corBorda: 'border-gray-300 dark:border-gray-700',
    corIcon: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    corBotao: 'bg-gray-700 hover:bg-gray-800',
    beneficios: [
      { texto: 'Até 100 produtos', bold: true },
      { texto: '1 usuário' },
      { texto: 'PDV completo' },
      { texto: 'Leitor de código de barras' },
      { texto: 'Alertas de estoque baixo' },
      { texto: 'Relatórios básicos' },
      { texto: 'Suporte por email' },
    ],
  },
  {
    id: 'profissional',
    nome: 'Profissional',
    descricao: 'Pro mercadinho que cresce',
    preco: 79.9,
    icon: Sparkles,
    cor: 'green',
    corBorda: 'border-green-500',
    corIcon: 'bg-gradient-to-br from-green-500 to-emerald-600 text-white',
    corBotao: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-xl hover:shadow-green-500/40',
    destaque: true,
    beneficios: [
      { texto: 'Produtos ilimitados', bold: true },
      { texto: 'Até 3 usuários' },
      { texto: 'Clientes + Fiado', bold: true },
      { texto: 'Controle de validade' },
      { texto: 'Relatórios avançados (lucro/margem)' },
      { texto: 'Importar via CSV', bold: true },
      { texto: 'Exportação CSV' },
      { texto: 'Cupom via WhatsApp' },
      { texto: 'Análise mensal com IA', bold: true, ia: true },
      { texto: 'Suporte prioritário WhatsApp', bold: true },
    ],
  },
  {
    id: 'negocio',
    nome: 'Negócio',
    descricao: 'Pro mercadinho consolidado',
    preco: 149.9,
    icon: Crown,
    cor: 'purple',
    corBorda: 'border-purple-500',
    corIcon: 'bg-gradient-to-br from-purple-500 to-pink-600 text-white',
    corBotao: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl hover:shadow-purple-500/40',
    beneficios: [
      { texto: 'Tudo do Profissional', bold: true },
      { texto: 'Até 10 usuários' },
      { texto: 'Histórico estendido (24 meses)' },
      { texto: 'IA pra cadastro automático', bold: true, ia: true },
      { texto: 'IA pra sugestão de preço', bold: true, ia: true },
      { texto: 'Catálogo público da loja', soon: true },
      { texto: 'Suporte VIP por WhatsApp', bold: true },
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
  const [tipoPlanoAtual, setTipoPlanoAtual] = useState<string | null>(null)
  const [planoSelecionado, setPlanoSelecionado] = useState<string>('profissional')
  const [tipoPagamento, setTipoPagamento] = useState<'pix' | 'assinatura'>('assinatura')

  const statusPagamento = searchParams.get('pagamento')
  const planoParam = searchParams.get('plano')

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
        .select('plano, tipo_plano')
        .eq('id', data.session.user.id)
        .single()

      if (perfil?.plano === 'ativo' && perfil?.tipo_plano === 'negocio') {
        router.push('/dashboard')
        return
      }

      // Pré-seleciona plano vindo da URL (?plano=profissional)
      if (planoParam && ['iniciante', 'profissional', 'negocio'].includes(planoParam)) {
        setPlanoSelecionado(planoParam)
      } else if (perfil?.tipo_plano) {
        // Ou sugere upgrade lógico
        setTipoPlanoAtual(perfil.tipo_plano)
        if (perfil.tipo_plano === 'iniciante') {
          setPlanoSelecionado('profissional')
        } else if (perfil.tipo_plano === 'profissional') {
          setPlanoSelecionado('negocio')
        }
      }

      if (perfil?.tipo_plano) {
        setTipoPlanoAtual(perfil.tipo_plano)
      }

      setLoading(false)
    }
    verificar()
  }, [router, planoParam])

  const handlePagar = async () => {
    setProcessando(planoSelecionado)
    try {
      const endpoint = tipoPagamento === 'pix' ? '/api/pagamento/criar' : '/api/pagamento/assinatura'

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

  const isUpgrade = tipoPlanoAtual === 'iniciante' || tipoPlanoAtual === 'profissional'
  const planoAtual = PLANOS.find((p) => p.id === planoSelecionado)
  const tituloHeader = isUpgrade ? 'Faça upgrade do seu plano' : 'Escolha seu plano'
  const subtituloHeader = isUpgrade
    ? `Você está no plano ${tipoPlanoAtual === 'iniciante' ? 'Iniciante' : 'Profissional'}. Desbloqueie mais recursos!`
    : 'Sem fidelidade. Cancele quando quiser.'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-8 md:py-12 px-4 relative overflow-hidden">
      {/* Decoração de fundo */}
      <div className="absolute top-20 -right-32 w-96 h-96 bg-green-300/10 dark:bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -left-32 w-96 h-96 bg-purple-300/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Banners de status */}
        {statusPagamento === 'falhou' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center text-red-700 dark:text-red-300 font-medium">
            ❌ Pagamento não concluído. Tente novamente.
          </div>
        )}
        {statusPagamento === 'pendente' && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-center text-yellow-700 dark:text-yellow-300 font-medium">
            ⏳ Pagamento pendente. Assim que confirmado, seu acesso será liberado.
          </div>
        )}

        {isUpgrade && (
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar pro dashboard
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 text-green-700 dark:text-green-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-green-500/20">
            {isUpgrade ? '🚀 Upgrade disponível' : '🔒 Período de teste encerrou'}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
            {tituloHeader}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {subtituloHeader}
          </p>
        </div>

        {/* Grid de planos */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {PLANOS.map((plano) => {
            const Icon = plano.icon
            const isSelected = planoSelecionado === plano.id
            const isCurrent = tipoPlanoAtual === plano.id

            return (
              <button
                key={plano.id}
                onClick={() => !isCurrent && setPlanoSelecionado(plano.id)}
                disabled={isCurrent}
                className={`group relative h-full text-left bg-white dark:bg-gray-900 rounded-3xl p-7 transition-all ${
                  isSelected
                    ? `border-2 ${plano.corBorda} shadow-2xl scale-105`
                    : `border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-1`
                } ${plano.destaque && !isSelected ? 'md:scale-[1.02]' : ''} ${
                  isCurrent ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl'
                }`}
              >
                {/* Glow do plano selecionado */}
                {isSelected && plano.id === 'profissional' && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl blur-lg opacity-30 -z-10" />
                )}
                {isSelected && plano.id === 'negocio' && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl blur-lg opacity-30 -z-10" />
                )}

                {/* Badges */}
                {plano.destaque && !isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full whitespace-nowrap shadow-lg">
                    ⭐ MAIS POPULAR
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full whitespace-nowrap shadow-lg">
                    SEU PLANO ATUAL
                  </div>
                )}
                {isSelected && !isCurrent && (
                  <div className="absolute top-4 right-4 w-7 h-7 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Ícone */}
                <div
                  className={`w-14 h-14 ${plano.corIcon} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-7 h-7" />
                </div>

                {/* Nome e descrição */}
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
                  {plano.nome}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {plano.descricao}
                </p>

                {/* Preço */}
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    R$
                  </span>
                  <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                    {Math.floor(plano.preco)}
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    ,{(plano.preco % 1).toFixed(2).slice(2)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                    /mês
                  </span>
                </div>

                {/* Benefícios */}
                <ul className="space-y-3 text-sm">
                  {plano.beneficios.map((b) => (
                    <li key={b.texto} className="flex items-start gap-2">
                      {b.ia ? (
                        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            plano.id === 'negocio' ? 'text-purple-600' : 'text-green-600'
                          }`}
                        />
                      )}
                      <span
                        className={`text-gray-700 dark:text-gray-300 ${
                          b.bold ? 'font-semibold' : ''
                        }`}
                      >
                        {b.texto}
                        {b.soon && (
                          <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-semibold">
                            em breve
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        {/* Bloco de pagamento */}
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 md:p-8 shadow-xl">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-5">
            Forma de pagamento
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setTipoPagamento('pix')}
              className={`p-5 rounded-2xl border-2 transition-all ${
                tipoPagamento === 'pix'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-3xl mb-2">💸</div>
              <div className="font-bold text-gray-900 dark:text-white">PIX</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pagamento mensal
              </div>
            </button>

            <button
              onClick={() => setTipoPagamento('assinatura')}
              className={`p-5 rounded-2xl border-2 transition-all ${
                tipoPagamento === 'assinatura'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-3xl mb-2">💳</div>
              <div className="font-bold text-gray-900 dark:text-white">Cartão</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Assinatura automática
              </div>
            </button>
          </div>

          {/* Botão de pagamento */}
          <button
            onClick={handlePagar}
            disabled={processando !== null || tipoPlanoAtual === planoSelecionado}
            className={`w-full ${
              planoAtual?.corBotao || 'bg-green-600 hover:bg-green-700'
            } disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:shadow-none text-white font-bold py-4 rounded-full text-base md:text-lg transition-all`}
          >
            {processando
              ? 'Processando...'
              : tipoPlanoAtual === planoSelecionado
              ? 'Este é seu plano atual'
              : `${isUpgrade ? 'Fazer upgrade pro' : 'Assinar'} ${planoAtual?.nome} • R$ ${planoAtual?.preco
                  .toFixed(2)
                  .replace('.', ',')}/mês`}
          </button>

          {/* Trust badges */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              Pagamento seguro Mercado Pago
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              Cancele quando quiser
            </span>
          </div>

          {/* CTA WhatsApp */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <Link
              href="https://wa.me/5522999467499?text=Tenho%20duvidas%20sobre%20os%20planos%20do%20EstoqueSystem"
              target="_blank"
              className="inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              Tenho dúvidas, falar com Lucas pelo WhatsApp
            </Link>
          </div>
        </div>

        {/* Garantia / FAQ rápido */}
        <div className="max-w-2xl mx-auto mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Ao assinar, você concorda com nossos{' '}
            <Link href="/termos" target="_blank" className="text-green-600 dark:text-green-400 hover:underline">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link
              href="/privacidade"
              target="_blank"
              className="text-green-600 dark:text-green-400 hover:underline"
            >
              Política de Privacidade
            </Link>
            .
            <br />
            Você pode cancelar a assinatura a qualquer momento sem multa ou fidelidade.
          </p>
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