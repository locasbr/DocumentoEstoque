'use client'

import { Suspense } from 'react'
import Onboarding from '@/components/onboarding'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Alerta, Produto, MovimentoEstoque } from '@/lib/types'
import {
  Package, BarChart3, AlertCircle, TrendingUp,
  AlertTriangle, Clock, ArrowDownLeft, ArrowUpRight,
  Calendar, ArrowRight, Users, ShoppingCart, Plus, DollarSign,
} from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'
interface PlanoInfo {
  plano: string
  diasRestantes: number | null
}

interface ProdutoVencendo {
  id: string
  nome: string
  data_validade: string
  quantidade_atual: number
}

interface ClienteDevedor {
  id: string
  nome: string
  telefone: string
  saldo: number
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const pagamentoSucesso = searchParams.get('pagamento') === 'sucesso'

  const [stats, setStats] = useState({
    totalProdutos: 0,
    totalMovimentos: 0,
    alertas: 0,
    valorEstoque: 0,
  })
  const [produtosCriticos, setProdutosCriticos] = useState<Produto[]>([])
  const [movimentosHoje, setMovimentosHoje] = useState<MovimentoEstoque[]>([])
  const [alertasRecentes, setAlertasRecentes] = useState<Alerta[]>([])
  const [produtosVencendo, setProdutosVencendo] = useState<ProdutoVencendo[]>([])
  const [topDevedores, setTopDevedores] = useState<ClienteDevedor[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarBannerPagamento, setMostrarBannerPagamento] = useState(pagamentoSucesso)
  const [planoInfo, setPlanoInfo] = useState<PlanoInfo | null>(null)
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session) {
          setUserId(sessionData.session.user.id)

          const { data: perfil } = await supabase
            .from('perfis')
            .select('plano, trial_fim, onboarding_completo')
            .eq('id', sessionData.session.user.id)
            .single()

          if (perfil) {
            let diasRestantes: number | null = null
            if (perfil.plano === 'trial' && perfil.trial_fim) {
              const fim = new Date(perfil.trial_fim)
              diasRestantes = Math.ceil(
                (fim.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              )
            }
            setPlanoInfo({ plano: perfil.plano, diasRestantes })

            if (!perfil.onboarding_completo) {
              setMostrarOnboarding(true)
            }
          }
        }

        // ── Produtos ──
        const { data: produtos } = await supabase.from('produtos').select('*')
        if (produtos) {
          const valorTotal = produtos.reduce(
            (sum: number, p: Produto) => sum + p.preco_venda * p.quantidade_atual, 0
          )
          const criticos = produtos
            .filter((p: Produto) => p.quantidade_atual < p.quantidade_minima)
            .sort((a: Produto, b: Produto) => a.quantidade_atual - b.quantidade_atual)
            .slice(0, 5)
          setStats((prev) => ({ ...prev, totalProdutos: produtos.length, valorEstoque: valorTotal }))
          setProdutosCriticos(criticos)
        }

                // ── Movimentos de hoje ──
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)

        const { data: movimentos, error: movError } = await supabase
          .from('movimentos_estoque')
          .select('*, produto:produto_id(*)')
          .gte('criado_em', hoje.toISOString())
          .order('criado_em', { ascending: false })
          .limit(100)

        if (movError) console.error('Erro movimentos:', movError)

        if (movimentos) {
          setStats((prev) => ({ ...prev, totalMovimentos: movimentos.length }))
          setMovimentosHoje(movimentos)
        }

        // ── Alertas ──
        const { data: alertas } = await supabase
          .from('alertas')
          .select('*, produto:produto_id(nome)')
          .eq('visualizado', false)
          .order('criado_em', { ascending: false })
          .limit(10)
        if (alertas) {
          setStats((prev) => ({ ...prev, alertas: alertas.length }))
          setAlertasRecentes(alertas)
        }

        // ── Produtos vencendo (próximos 7 dias) ──
        try {
          const agora = new Date()
          const em7dias = new Date()
          em7dias.setDate(agora.getDate() + 7)

          const { data: vencendo } = await supabase
            .from('produtos')
            .select('id, nome, data_validade, quantidade_atual')
            .not('data_validade', 'is', null)
            .lte('data_validade', em7dias.toISOString().split('T')[0])
            .gt('quantidade_atual', 0)
            .order('data_validade', { ascending: true })
            .limit(5)

          if (vencendo) setProdutosVencendo(vencendo)
        } catch {
          // Tabela pode não ter a coluna ainda — ignora silenciosamente
        }

        // ── Top devedores (fiado) ──
        try {
          const { data: clientesData } = await supabase
            .from('clientes')
            .select('id, nome, telefone')

          if (clientesData && clientesData.length > 0) {
            const clientesComSaldo = await Promise.all(
              clientesData.map(async (c: any) => {
                const { data: fiadoData } = await supabase
                  .from('fiado')
                  .select('tipo, valor')
                  .eq('cliente_id', c.id)
                const saldo = (fiadoData || []).reduce((acc: number, f: any) =>
                  f.tipo === 'debito' ? acc + Number(f.valor) : acc - Number(f.valor), 0)
                return { ...c, saldo }
              })
            )
            const devedores = clientesComSaldo
              .filter((c: any) => c.saldo > 0)
              .sort((a: any, b: any) => b.saldo - a.saldo)
              .slice(0, 5)
            setTopDevedores(devedores)
          }
        } catch {
          // Tabelas podem não existir ainda — ignora silenciosamente
        }

      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (mostrarBannerPagamento) {
      const timer = setTimeout(() => setMostrarBannerPagamento(false), 8000)
      return () => clearTimeout(timer)
    }
  }, [mostrarBannerPagamento])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // ── Saudação com base no horário ──
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-6 p-4 md:p-0">

      {/* ══════════ BANNER PAGAMENTO ══════════ */}
      {mostrarBannerPagamento && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center justify-between">
          <p className="text-green-700 dark:text-green-400 font-semibold">
            🎉 Pagamento confirmado! Seu plano foi ativado com sucesso.
          </p>
          <button
            onClick={() => setMostrarBannerPagamento(false)}
            className="text-green-500 hover:text-green-700 text-xl font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* ══════════ INFO DO PLANO ══════════ */}
      {planoInfo && (
        <div className={`rounded-xl p-4 flex items-center justify-between ${
          planoInfo.plano === 'ativo'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {planoInfo.plano === 'ativo' ? '✅' : '⏳'}
            </span>
            <div>
              <p className={`font-semibold text-sm ${
                planoInfo.plano === 'ativo'
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-blue-700 dark:text-blue-400'
              }`}>
                {planoInfo.plano === 'ativo'
                  ? 'Plano Profissional — Ativo'
                  : `Período de teste — ${planoInfo.diasRestantes} dias restantes`
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {planoInfo.plano === 'ativo'
                  ? 'Acesso completo a todas as funcionalidades'
                  : 'Aproveite para conhecer todas as funcionalidades'
                }
              </p>
            </div>
          </div>
          {planoInfo.plano === 'trial' && (
            <Link
              href="/assinar"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition hidden sm:block"
            >
              Assinar agora
            </Link>
          )}
        </div>
      )}

      {/* ══════════ ONBOARDING ══════════ */}
      {mostrarOnboarding && userId && (
        <Onboarding
          userId={userId}
          onComplete={() => setMostrarOnboarding(false)}
        />
      )}

      {/* ══════════ SAUDAÇÃO ══════════ */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50">
          {saudacao} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Aqui está o resumo do seu negócio hoje
        </p>
      </div>

      {/* ══════════ MÉTRICAS COM GRADIENTE ══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            icon: Package,
            label: 'Produtos',
            value: stats.totalProdutos,
            gradient: 'from-blue-500 to-blue-600',
            bgLight: 'bg-blue-50 dark:bg-blue-900/20',
          },
          {
            icon: BarChart3,
            label: 'Movimentos Hoje',
            value: stats.totalMovimentos,
            gradient: 'from-green-500 to-emerald-600',
            bgLight: 'bg-green-50 dark:bg-green-900/20',
          },
          {
            icon: AlertCircle,
            label: 'Alertas',
            value: stats.alertas,
            gradient: stats.alertas > 0 ? 'from-red-500 to-red-600' : 'from-gray-400 to-gray-500',
            bgLight: stats.alertas > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800',
          },
          {
            icon: TrendingUp,
            label: 'Valor em Estoque',
            value: formatarMoeda(stats.valorEstoque),
            gradient: 'from-purple-500 to-purple-600',
            bgLight: 'bg-purple-50 dark:bg-purple-900/20',
          },
        ].map(({ icon: Icon, label, value, gradient, bgLight }) => (
          <div
            key={label}
            className={`${bgLight} rounded-2xl p-4 md:p-5 animate-fade-in-up`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-50 mt-0.5 truncate">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ══════════ AÇÕES RÁPIDAS ══════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Novo Produto', href: '/dashboard/produtos/novo', icon: Plus, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Abrir PDV', href: '/dashboard/pdv', icon: ShoppingCart, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Novo Movimento', href: '/dashboard/estoque/movimento', icon: BarChart3, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Clientes', href: '/dashboard/clientes', icon: Users, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(({ label, href, icon: Icon, color, bg }) => (
          <Link
            key={label}
            href={href}
            className={`${bg} rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition hover:-translate-y-0.5 text-center border border-transparent`}
          >
            <Icon className={`w-6 h-6 ${color}`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          </Link>
        ))}
      </div>

      {/* ══════════ GRID PRINCIPAL ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Produtos vencendo ── */}
        {produtosVencendo.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/40">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-amber-500 flex-shrink-0" />
                <h2 className="font-bold text-gray-900 dark:text-gray-50">Produtos Vencendo</h2>
              </div>
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full font-medium">
                {produtosVencendo.length} produto(s)
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {produtosVencendo.map((p) => {
                const diasRestantes = Math.ceil(
                  (new Date(p.data_validade).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
                const vencido = diasRestantes < 0
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                        {p.nome}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {p.quantidade_atual} un. em estoque
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ml-3 flex-shrink-0 ${
                      vencido
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : diasRestantes <= 3
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {vencido
                        ? `Vencido há ${Math.abs(diasRestantes)}d`
                        : `${diasRestantes}d restantes`
                      }
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Top devedores (fiado) ── */}
        {topDevedores.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/40">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-red-500 flex-shrink-0" />
                <h2 className="font-bold text-gray-900 dark:text-gray-50">Clientes com Fiado</h2>
              </div>
              <Link
                href="/dashboard/clientes"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {topDevedores.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/clientes/${c.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        {c.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{c.nome}</p>
                      {c.telefone && (
                        <p className="text-xs text-gray-400 truncate">{c.telefone}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-red-600 dark:text-red-400 text-sm ml-3 flex-shrink-0">
                    {formatarMoeda(c.saldo)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Produtos críticos ── */}
        {produtosCriticos.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/40">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
              <h2 className="font-bold text-gray-900 dark:text-gray-50">Produtos Críticos</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {produtosCriticos.map((produto) => (
                <Link
                  key={produto.id}
                  href={`/dashboard/produtos/${produto.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <div className="min-w-0 flex-1 pl-3">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{produto.nome}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {produto.sku}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="font-bold text-red-600 dark:text-red-400">{produto.quantidade_atual}</p>
                    <p className="text-xs text-gray-400">Min: {produto.quantidade_minima}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Movimentos de hoje ── */}
        {movimentosHoje.length > 0 && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/40">
              <Clock size={18} className="text-blue-500 flex-shrink-0" />
              <h2 className="font-bold text-gray-900 dark:text-gray-50">Movimentos de Hoje</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
              {movimentosHoje.slice(0, 8).map((movimento) => (
                <div key={movimento.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-1.5 rounded-full flex-shrink-0 ${
                      movimento.tipo_movimento === 'entrada'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {movimento.tipo_movimento === 'entrada'
                        ? <ArrowDownLeft size={14} className="text-green-600 dark:text-green-400" />
                        : <ArrowUpRight size={14} className="text-red-600 dark:text-red-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{movimento.produto?.nome}</p>
                      <p className="text-xs text-gray-400 truncate">{movimento.motivo || '\u2014'}</p>
                    </div>
                  </div>
                  <p className={`font-bold text-sm ml-3 flex-shrink-0 ${
                    movimento.tipo_movimento === 'entrada'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {movimento.tipo_movimento === 'entrada' ? '+' : '-'}{movimento.quantidade}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════ ALERTAS PENDENTES ══════════ */}
      {alertasRecentes.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-900/40">
            <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0" />
            <h2 className="font-bold text-gray-900 dark:text-gray-50">Alertas Pendentes</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {alertasRecentes.slice(0, 5).map((alerta) => (
              <Link
                key={alerta.id}
                href="/dashboard/alertas"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 min-w-[8px] min-h-[8px] self-center ${
                  alerta.tipo_alerta === 'estoque_critico' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm text-gray-700 dark:text-gray-300 pl-2">
                  <span className="font-medium">
                    {alerta.tipo_alerta === 'estoque_baixo' ? 'Estoque Baixo' : 'Estoque Cr\u00edtico'}:
                  </span>{' '}
                  <span className="text-red-600 dark:text-red-400">{alerta.produto?.nome}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ EMPTY STATE ══════════ */}
      {produtosCriticos.length === 0 && movimentosHoje.length === 0 && alertasRecentes.length === 0 && produtosVencendo.length === 0 && topDevedores.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum dado ainda</p>
          <p className="text-sm mt-1">Adicione produtos para come\u00e7ar</p>
          <Link href="/dashboard/produtos/novo" className="inline-block mt-4 btn-primary text-sm px-4 py-2">
            + Adicionar produto
          </Link>
        </div>
      )}
    </div>
  )
}

// Wrapper com Suspense (exigido pelo Next.js pra useSearchParams)
export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
