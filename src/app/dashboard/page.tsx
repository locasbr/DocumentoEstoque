// src/app/dashboard/page.tsx
'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Alerta, Produto, MovimentoEstoque } from '@/lib/types'
import { formatarMoeda } from '@/lib/utils'
import { getPlanoInfo } from '@/lib/planos'
import Onboarding from '@/components/onboarding'
import {
  Package,
  AlertTriangle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ArrowRight,
  ShoppingCart,
  Plus,
  DollarSign,
  Wallet,
  Sparkles,
  Receipt,
  Activity,
  TrendingUp,
  TrendingDown,
  Trophy,
  Crown,
  Medal,
  Zap,
  Target,
} from 'lucide-react'


// ════════════════════════════════════════════════════
// 📋 TIPOS
// ════════════════════════════════════════════════════

interface PlanoInfo {
  plano: string
  tipoPlano: string | null
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

interface TopProduto {
  id: string
  nome: string
  categoria: string | null
  quantidade: number
  receita: number
}

type Periodo = '1d' | '7d' | '30d'

// ════════════════════════════════════════════════════
// 🎨 HELPER: Calcula variação % entre 2 valores
// ════════════════════════════════════════════════════
function calcularVariacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual > 0 ? 100 : null
  return ((atual - anterior) / anterior) * 100
}

// ════════════════════════════════════════════════════
// 🎨 COMPONENTE: KPI Card profissional
// ════════════════════════════════════════════════════
interface KPICardProps {
  label: string
  valor: string | number
  variacao: number | null
  icon: typeof Package
  cor: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'emerald'
  destaque?: boolean
}

function KPICard({ label, valor, variacao, icon: Icon, cor, destaque }: KPICardProps) {
  const cores = {
    blue: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      border: 'border-gray-200 dark:border-gray-700',
    },
    green: {
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      border: 'border-gray-200 dark:border-gray-700',
    },
    emerald: {
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-gray-200 dark:border-gray-700',
    },
    purple: {
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      border: 'border-gray-200 dark:border-gray-700',
    },
    orange: {
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      border: 'border-gray-200 dark:border-gray-700',
    },
    red: {
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
    },
  }
  const c = cores[cor]

  return (
    <div
      className={`bg-white dark:bg-gray-900 border ${
        destaque ? c.border : 'border-gray-200 dark:border-gray-800'
      } rounded-xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center`}
        >
          <Icon className={`w-4 h-4 ${c.iconColor}`} />
        </div>
        {variacao !== null && variacao !== 0 && (
          <div
            className={`flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
              variacao > 0
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {variacao > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(variacao).toFixed(0)}%
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 truncate">
        {label}
      </p>
      <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
        {valor}
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════
// 🎨 COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════
function DashboardContent() {
  const searchParams = useSearchParams()
  const pagamentoSucesso = searchParams.get('pagamento') === 'sucesso'

  const [periodo, setPeriodo] = useState<Periodo>('1d')
  const [stats, setStats] = useState({
    totalProdutos: 0,
    totalMovimentos: 0,
    alertas: 0,
    valorEstoque: 0,
  })

  const [kpis, setKpis] = useState({
    faturamento: 0,
    faturamentoAnterior: 0,
    lucro: 0,
    lucroAnterior: 0,
    ticketMedio: 0,
    ticketMedioAnterior: 0,
    itensVendidos: 0,
    itensVendidosAnterior: 0,
    produtosCriticos: 0,
  })

  const [nomeNegocio, setNomeNegocio] = useState('')
  const [produtosCriticos, setProdutosCriticos] = useState<Produto[]>([])
  const [movimentosHoje, setMovimentosHoje] = useState<MovimentoEstoque[]>([])
  const [alertasRecentes, setAlertasRecentes] = useState<Alerta[]>([])
  const [produtosVencendo, setProdutosVencendo] = useState<ProdutoVencendo[]>([])
  const [topDevedores, setTopDevedores] = useState<ClienteDevedor[]>([])
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarBannerPagamento, setMostrarBannerPagamento] =
    useState(pagamentoSucesso)
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
            .select('plano, tipo_plano, trial_fim, onboarding_completo, nome_negocio')
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
            setPlanoInfo({
              plano: perfil.plano,
              tipoPlano: perfil.tipo_plano,
              diasRestantes,
            })
            setNomeNegocio(perfil.nome_negocio || '')

            if (!perfil.onboarding_completo) {
              setMostrarOnboarding(true)
            }
          }
        }

        // ════════════════════════════════════════════════════
        // 📊 PRODUTOS (pra valor em estoque + críticos)
        // ════════════════════════════════════════════════════
        const { data: produtos } = await supabase.from('produtos').select('*')
        let valorTotal = 0
        let produtosCriticosCount = 0

        if (produtos) {
          valorTotal = produtos.reduce(
            (sum: number, p: Produto) => sum + p.preco_venda * p.quantidade_atual,
            0
          )
          produtosCriticosCount = produtos.filter(
            (p: Produto) => p.quantidade_atual < p.quantidade_minima
          ).length

          const criticos = produtos
            .filter((p: Produto) => p.quantidade_atual < p.quantidade_minima)
            .sort(
              (a: Produto, b: Produto) => a.quantidade_atual - b.quantidade_atual
            )
            .slice(0, 5)

          setStats((prev) => ({
            ...prev,
            totalProdutos: produtos.length,
            valorEstoque: valorTotal,
          }))
          setProdutosCriticos(criticos)
        }

        // ════════════════════════════════════════════════════
        // 💰 KPIs FINANCEIROS — período atual + anterior
        // ════════════════════════════════════════════════════
        const agora = new Date()
        let dataInicio = new Date()
        let dataInicioAnterior = new Date()
        let dataFimAnterior = new Date()

        if (periodo === '1d') {
          dataInicio.setHours(0, 0, 0, 0)
          dataInicioAnterior = new Date(dataInicio)
          dataInicioAnterior.setDate(dataInicioAnterior.getDate() - 1)
          dataFimAnterior = new Date(dataInicio)
        } else if (periodo === '7d') {
          dataInicio.setDate(agora.getDate() - 7)
          dataInicioAnterior = new Date(dataInicio)
          dataInicioAnterior.setDate(dataInicioAnterior.getDate() - 7)
          dataFimAnterior = new Date(dataInicio)
        } else if (periodo === '30d') {
          dataInicio.setDate(agora.getDate() - 30)
          dataInicioAnterior = new Date(dataInicio)
          dataInicioAnterior.setDate(dataInicioAnterior.getDate() - 30)
          dataFimAnterior = new Date(dataInicio)
        }

        // Vendas período atual (com nome e categoria pro Top Produtos)
        const { data: vendasAtuais } = await supabase
          .from('movimentos_estoque')
          .select('*, produto:produto_id(nome, categoria, preco_venda, preco_custo)')
          .eq('tipo_movimento', 'saida')
          .gte('criado_em', dataInicio.toISOString())

        // Vendas período anterior (pra calcular variação)
        const { data: vendasAnteriores } = await supabase
          .from('movimentos_estoque')
          .select('*, produto:produto_id(preco_venda, preco_custo)')
          .eq('tipo_movimento', 'saida')
          .gte('criado_em', dataInicioAnterior.toISOString())
          .lt('criado_em', dataFimAnterior.toISOString())

        const calcularKPIs = (vendas: any[]) => {
          let faturamento = 0
          let lucro = 0
          let itens = 0

          vendas?.forEach((v: any) => {
            const precoVenda = v.produto?.preco_venda || 0
            const precoCusto = v.produto?.preco_custo || 0
            const qtd = v.quantidade || 0
            faturamento += qtd * precoVenda
            lucro += qtd * (precoVenda - precoCusto)
            itens += qtd
          })

          const numVendas = vendas?.length || 0
          const ticketMedio = numVendas > 0 ? faturamento / numVendas : 0

          return { faturamento, lucro, ticketMedio, itensVendidos: itens }
        }

        const kpisAtuais = calcularKPIs(vendasAtuais || [])
        const kpisAnteriores = calcularKPIs(vendasAnteriores || [])

        setKpis({
          faturamento: kpisAtuais.faturamento,
          faturamentoAnterior: kpisAnteriores.faturamento,
          lucro: kpisAtuais.lucro,
          lucroAnterior: kpisAnteriores.lucro,
          ticketMedio: kpisAtuais.ticketMedio,
          ticketMedioAnterior: kpisAnteriores.ticketMedio,
          itensVendidos: kpisAtuais.itensVendidos,
          itensVendidosAnterior: kpisAnteriores.itensVendidos,
          produtosCriticos: produtosCriticosCount,
        })

        // ════════════════════════════════════════════════════
        // 🏆 TOP 5 PRODUTOS no período
        // ════════════════════════════════════════════════════
        const agruparProdutos: Record<string, TopProduto> = {}

        vendasAtuais?.forEach((v: any) => {
          const produto = v.produto
          if (!produto) return
          const id = v.produto_id
          if (!agruparProdutos[id]) {
            agruparProdutos[id] = {
              id,
              nome: produto.nome || 'Produto sem nome',
              categoria: produto.categoria || null,
              quantidade: 0,
              receita: 0,
            }
          }
          agruparProdutos[id].quantidade += v.quantidade || 0
          agruparProdutos[id].receita +=
            (v.quantidade || 0) * (produto.preco_venda || 0)
        })

        const topProdutosArray = Object.values(agruparProdutos)
          .sort((a, b) => b.receita - a.receita)
          .slice(0, 5)

        setTopProdutos(topProdutosArray)

        // ════════════════════════════════════════════════════
        // 📅 MOVIMENTOS DE HOJE (pra seção de baixo)
        // ════════════════════════════════════════════════════
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const { data: movimentos } = await supabase
          .from('movimentos_estoque')
          .select('*, produto:produto_id(*)')
          .gte('criado_em', hoje.toISOString())
          .order('criado_em', { ascending: false })
          .limit(100)

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
          const agoraVenc = new Date()
          const em7dias = new Date()
          em7dias.setDate(agoraVenc.getDate() + 7)
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
          // Coluna pode não existir ainda
        }

        // ── Top devedores (fiado) ──
        try {
          const [clientesRes, fiadoRes] = await Promise.all([
            supabase.from('clientes').select('id, nome, telefone'),
            supabase.from('fiado').select('cliente_id, tipo, valor'),
          ])
          const clientesData = clientesRes.data || []
          const todosOsFiados = fiadoRes.data || []

          const saldoPorCliente: Record<string, number> = {}
          todosOsFiados.forEach((f: any) => {
            const id = f.cliente_id
            if (!saldoPorCliente[id]) saldoPorCliente[id] = 0
            saldoPorCliente[id] +=
              f.tipo === 'debito' ? Number(f.valor) : -Number(f.valor)
          })

          const devedores = clientesData
            .map((c: any) => ({ ...c, saldo: saldoPorCliente[c.id] || 0 }))
            .filter((c: any) => c.saldo > 0)
            .sort((a: any, b: any) => b.saldo - a.saldo)
            .slice(0, 5)
          setTopDevedores(devedores)
        } catch {
          // Tabelas podem não existir ainda
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo])

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
  const saudacao =
    hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-6">
      {/* ══════════ BANNER PAGAMENTO ══════════ */}
      {mostrarBannerPagamento && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center justify-between">
          <p className="text-green-700 dark:text-green-400 font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Pagamento confirmado! Seu plano foi ativado com sucesso.
          </p>
          <button
            onClick={() => setMostrarBannerPagamento(false)}
            className="text-green-500 hover:text-green-700 text-xl font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* ══════════ HEADER PROFISSIONAL ══════════ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 items-center justify-center shadow-lg shadow-green-500/30 flex-shrink-0">
            <span className="text-2xl">📦</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {saudacao}
              </h1>
              {planoInfo && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    planoInfo.plano === 'ativo'
                      ? planoInfo.tipoPlano === 'negocio'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : planoInfo.tipoPlano === 'iniciante'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  }`}
                >
                  {planoInfo.plano === 'ativo'
                    ? getPlanoInfo(planoInfo.tipoPlano).nome
                    : `Trial · ${planoInfo.diasRestantes}d`}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {nomeNegocio || 'Bem-vindo de volta'} ·{' '}
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
        </div>

        {/* Ações rápidas em ícones */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/pdv"
            className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 text-white font-semibold rounded-lg transition text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Abrir PDV</span>
          </Link>
          <Link
            href="/dashboard/produtos/novo"
            className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition text-sm"
            title="Novo produto"
          >
            <Plus className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard/estoque/movimento"
            className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition text-sm"
            title="Novo movimento"
          >
            <Activity className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ══════════ FILTRO DE PERÍODO + AVISO TRIAL ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          {[
            { id: '1d' as const, label: 'Hoje' },
            { id: '7d' as const, label: '7 dias' },
            { id: '30d' as const, label: '30 dias' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPeriodo(id)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
                periodo === id
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Aviso de trial expirando */}
        {planoInfo?.plano === 'trial' &&
          planoInfo.diasRestantes !== null &&
          planoInfo.diasRestantes <= 5 && (
            <Link
              href="/assinar"
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1.5"
            >
              ⏰ Trial expira em {planoInfo.diasRestantes} dia(s) · Assinar agora →
            </Link>
          )}
      </div>

      {/* ══════════ ONBOARDING ══════════ */}
      {mostrarOnboarding && userId && (
        <Onboarding
          userId={userId}
          onComplete={() => setMostrarOnboarding(false)}
        />
      )}

      {/* ══════════ KPIs PROFISSIONAIS ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          label="Faturamento"
          valor={formatarMoeda(kpis.faturamento)}
          variacao={calcularVariacao(kpis.faturamento, kpis.faturamentoAnterior)}
          icon={DollarSign}
          cor="green"
        />
        <KPICard
          label="Lucro estimado"
          valor={formatarMoeda(kpis.lucro)}
          variacao={calcularVariacao(kpis.lucro, kpis.lucroAnterior)}
          icon={Wallet}
          cor="emerald"
        />
        <KPICard
          label="Ticket médio"
          valor={formatarMoeda(kpis.ticketMedio)}
          variacao={calcularVariacao(kpis.ticketMedio, kpis.ticketMedioAnterior)}
          icon={Receipt}
          cor="blue"
        />
        <KPICard
          label="Itens vendidos"
          valor={kpis.itensVendidos}
          variacao={calcularVariacao(
            kpis.itensVendidos,
            kpis.itensVendidosAnterior
          )}
          icon={ShoppingCart}
          cor="purple"
        />
        <KPICard
          label="Produtos"
          valor={stats.totalProdutos}
          variacao={null}
          icon={Package}
          cor="blue"
        />
        <KPICard
          label="Estoque crítico"
          valor={kpis.produtosCriticos}
          variacao={null}
          icon={AlertTriangle}
          cor={kpis.produtosCriticos > 0 ? 'red' : 'green'}
          destaque={kpis.produtosCriticos > 0}
        />
      </div>

      {/* ══════════ LAYOUT PRINCIPAL EM 2 COLUNAS ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ════════════ COLUNA ESQUERDA (2/3) ════════════ */}
        <div className="lg:col-span-2 space-y-6">
          {/* 🏆 TOP PRODUTOS */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-gray-50">
                    Top Produtos
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Mais vendidos no período selecionado
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/relatorios"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                Ver relatório <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {topProdutos.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Nenhuma venda no período
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Quando registrar vendas no PDV, elas aparecerão aqui
                </p>
                <Link
                  href="/dashboard/pdv"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:shadow-md transition"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Abrir PDV
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {topProdutos.map((produto, idx) => {
                  const maxReceita = topProdutos[0]?.receita || 1
                  const porcentagem = (produto.receita / maxReceita) * 100

                  const medalha =
                    idx === 0 ? (
                      <Crown className="w-5 h-5 text-yellow-500" />
                    ) : idx === 1 ? (
                      <Medal className="w-5 h-5 text-gray-400" />
                    ) : idx === 2 ? (
                      <Medal className="w-5 h-5 text-orange-400" />
                    ) : (
                      <span className="text-sm font-bold text-gray-400 dark:text-gray-600 w-5 text-center">
                        {idx + 1}
                      </span>
                    )

                  return (
                    <div
                      key={produto.id}
                      className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-shrink-0 w-6 flex justify-center">
                          {medalha}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {produto.nome}
                          </p>
                          {produto.categoria && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {produto.categoria}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-sm text-gray-900 dark:text-white">
                            {formatarMoeda(produto.receita)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {produto.quantidade} un
                          </p>
                        </div>
                      </div>
                      <div className="ml-9 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                          style={{ width: `${porcentagem}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 📊 PRODUTOS CRÍTICOS + MOVIMENTOS HOJE — Lado a lado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Produtos críticos */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="font-bold text-sm text-gray-900 dark:text-gray-50">
                  Estoque Crítico
                </h2>
                {produtosCriticos.length > 0 && (
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                    {produtosCriticos.length}
                  </span>
                )}
              </div>
              {produtosCriticos.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                    <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Todos os produtos OK!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
                  {produtosCriticos.map((produto) => (
                    <Link
                      key={produto.id}
                      href="/dashboard/produtos"
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {produto.nome}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          Min: {produto.quantidade_minima}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400 ml-3 flex-shrink-0">
                        {produto.quantidade_atual}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Atividade recente */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="font-bold text-sm text-gray-900 dark:text-gray-50">
                  Atividade de Hoje
                </h2>
                {movimentosHoje.length > 0 && (
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                    {movimentosHoje.length}
                  </span>
                )}
              </div>
              {movimentosHoje.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Clock className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Nenhum movimento ainda
                  </p>
                  <Link
                    href="/dashboard/estoque/movimento"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium mt-2 inline-block"
                  >
                    Registrar movimento →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
                  {movimentosHoje.slice(0, 6).map((movimento) => (
                    <div
                      key={movimento.id}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            movimento.tipo_movimento === 'entrada'
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}
                        >
                          {movimento.tipo_movimento === 'entrada' ? (
                            <ArrowDownLeft
                              size={12}
                              className="text-green-600 dark:text-green-400"
                            />
                          ) : (
                            <ArrowUpRight
                              size={12}
                              className="text-red-600 dark:text-red-400"
                            />
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                          {movimento.produto?.nome}
                        </p>
                      </div>
                      <p
                        className={`text-xs font-bold ml-2 flex-shrink-0 ${
                          movimento.tipo_movimento === 'entrada'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {movimento.tipo_movimento === 'entrada' ? '+' : '-'}
                        {movimento.quantidade}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════════════ COLUNA DIREITA (1/3) ════════════ */}
        <div className="space-y-6">
          {/* ⏰ PRODUTOS VENCENDO */}
          {produtosVencendo.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900/40 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-100 dark:border-amber-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h2 className="font-bold text-sm text-gray-900 dark:text-gray-50">
                    Vencendo em breve
                  </h2>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                  {produtosVencendo.length}
                </span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {produtosVencendo.map((p) => {
                  const diasRestantes = Math.ceil(
                    (new Date(p.data_validade).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                  const vencido = diasRestantes < 0
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {p.nome}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {p.quantidade_atual} un
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ml-2 flex-shrink-0 whitespace-nowrap ${
                          vencido
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : diasRestantes <= 3
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }`}
                      >
                        {vencido
                          ? `Vencido ${Math.abs(diasRestantes)}d`
                          : `${diasRestantes}d`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 💰 CLIENTES COM FIADO */}
          {topDevedores.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <DollarSign className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="font-bold text-sm text-gray-900 dark:text-gray-50">
                    Clientes com Fiado
                  </h2>
                </div>
                <Link
                  href="/dashboard/clientes"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Ver todos
                </Link>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {topDevedores.map((c) => (
                  <Link
                    key={c.id}
                    href="/dashboard/clientes"
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-xs font-bold text-white">
                          {c.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {c.nome}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-red-600 dark:text-red-400 ml-2 flex-shrink-0">
                      {formatarMoeda(c.saldo)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ⚡ DICA RÁPIDA (se trial) */}
          {planoInfo?.plano === 'trial' && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900 dark:text-white">
                    💡 Dica do dia
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                    Use o cadastro automático com IA pra economizar tempo.
                    Disponível no plano Negócio.
                  </p>
                  <Link
                    href="/assinar"
                    className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Ver planos <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ EMPTY STATE ══════════ */}
      {produtosCriticos.length === 0 &&
        movimentosHoje.length === 0 &&
        alertasRecentes.length === 0 &&
        produtosVencendo.length === 0 &&
        topDevedores.length === 0 &&
        topProdutos.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum dado ainda</p>
            <p className="text-sm mt-1">Adicione produtos para começar</p>
            <Link
              href="/dashboard/produtos/novo"
              className="inline-block mt-4 btn-primary text-sm px-4 py-2"
            >
              + Adicionar produto
            </Link>
          </div>
        )}
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}