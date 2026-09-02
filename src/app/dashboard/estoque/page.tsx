'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

import PageHeader from '@/components/page-header'
import { SkeletonTable } from '@/components/skeleton-loaders'
import { useNotification } from '@/contexts/NotificationContext'
import { usePlano } from '@/hooks/usePlano'
import { exportMovimentosDiariosCSV } from '@/lib/export-utils'
import { supabase } from '@/lib/supabase'
import type { MovimentoEstoque, Produto } from '@/lib/types'

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Calendar,
  Crown,
  Download,
  Eye,
  Filter,
  Package,
  PackageCheck,
  PackageX,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'

type TipoFiltro = 'todos' | 'entrada' | 'saida'
type PeriodoFiltro = 'hoje' | '7d' | '30d' | 'todos'
type CorKPI = 'green' | 'red' | 'amber' | 'blue' | 'emerald'

type MovimentoComProduto = Omit<
  MovimentoEstoque,
  'produto'
> & {
  produto?: Produto | null
}

interface KPIProps {
  label: string
  valor: string | number
  sublabel?: string
  icon: LucideIcon
  cor: CorKPI
  destaque?: boolean
}

interface MovimentoPorDia {
  data: string
  entradas: number
  saidas: number
}

const PALETA_KPI: Record<
  CorKPI,
  {
    bg: string
    text: string
    border: string
  }
> = {
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
}

function normalizarNumero(valor: unknown): number {
  const numero = Number(valor)

  return Number.isFinite(numero) ? numero : 0
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function obterInicioPeriodo(periodo: PeriodoFiltro): Date | null {
  if (periodo === 'todos') {
    return null
  }

  const inicio = new Date()
  inicio.setHours(0, 0, 0, 0)

  if (periodo === '7d') {
    inicio.setDate(inicio.getDate() - 6)
  }

  if (periodo === '30d') {
    inicio.setDate(inicio.getDate() - 29)
  }

  return inicio
}

function formatarHora(data: string): string {
  const valor = new Date(data)

  if (Number.isNaN(valor.getTime())) {
    return 'Horário não informado'
  }

  return valor.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function criarChaveData(dataString: string): string {
  const data = new Date(dataString)

  if (Number.isNaN(data.getTime())) {
    return 'Data não informada'
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const ontem = new Date(hoje)
  ontem.setDate(ontem.getDate() - 1)

  const dataNormalizada = new Date(data)
  dataNormalizada.setHours(0, 0, 0, 0)

  if (dataNormalizada.getTime() === hoje.getTime()) {
    return 'Hoje'
  }

  if (dataNormalizada.getTime() === ontem.getTime()) {
    return 'Ontem'
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year:
      data.getFullYear() !== hoje.getFullYear()
        ? 'numeric'
        : undefined,
  })
}

function KPICard({
  label,
  valor,
  sublabel,
  icon: Icon,
  cor,
  destaque = false,
}: KPIProps) {
  const palette = PALETA_KPI[cor]

  return (
    <article
      className={`min-w-0 rounded-xl border bg-white p-4 dark:bg-gray-900 ${
        destaque
          ? palette.border
          : 'border-gray-200 dark:border-gray-800'
      }`}
    >
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${palette.bg}`}
      >
        <Icon
          aria-hidden="true"
          className={`h-4 w-4 ${palette.text}`}
        />
      </div>

      <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="break-words text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
        {valor}
      </p>

      {sublabel && (
        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
          {sublabel}
        </p>
      )}
    </article>
  )
}

export default function EstoquePage() {
  const { addNotification } = useNotification()
  const { temExportarCSV } = usePlano()

  const [movimentos, setMovimentos] = useState<
    MovimentoComProduto[]
  >([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [totalMovimentacoes, setTotalMovimentacoes] = useState(0)

  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [erroCarregamento, setErroCarregamento] = useState<
    string | null
  >(null)

  const [filtro, setFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] =
    useState<TipoFiltro>('todos')
  const [periodoFiltro, setPeriodoFiltro] =
    useState<PeriodoFiltro>('todos')
  const [criticosVisivel, setCriticosVisivel] = useState(true)

  const fetchData = useCallback(
    async (mostrarFeedback = false) => {
      if (mostrarFeedback) {
        setAtualizando(true)
      } else {
        setLoading(true)
      }

      setErroCarregamento(null)

      try {
        const [
          movimentosRes,
          movimentosCountRes,
          produtosRes,
        ] = await Promise.all([
          supabase
            .from('movimentos_estoque')
            .select('*, produto:produto_id(*)')
            .order('criado_em', { ascending: false })
            .limit(500),

          supabase
            .from('movimentos_estoque')
            .select('*', {
              count: 'exact',
              head: true,
            }),

          supabase
            .from('produtos')
            .select('*')
            .order('nome', { ascending: true }),
        ])

        const erros = [
          movimentosRes.error,
          movimentosCountRes.error,
          produtosRes.error,
        ].filter(Boolean)

        if (erros.length > 0) {
          console.error(
            'Erro ao carregar movimentações:',
            erros
          )

          setErroCarregamento(
            'Não foi possível carregar todos os dados das movimentações.'
          )
        }

        setMovimentos(
          (movimentosRes.data as unknown as
            | MovimentoComProduto[]
            | null) ?? []
        )

        setProdutos(
          (produtosRes.data as Produto[] | null) ?? []
        )

        setTotalMovimentacoes(
          movimentosCountRes.count ?? 0
        )

        if (mostrarFeedback && erros.length === 0) {
          addNotification(
            'Dados atualizados com sucesso.',
            'success',
            2000
          )
        }
      } catch (error) {
        console.error(
          'Erro inesperado ao carregar movimentações:',
          error
        )

        setErroCarregamento(
          'Ocorreu um erro inesperado ao carregar as movimentações.'
        )

        if (mostrarFeedback) {
          addNotification(
            'Não foi possível atualizar os dados.',
            'error'
          )
        }
      } finally {
        setLoading(false)
        setAtualizando(false)
      }
    },
    [addNotification]
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const produtosAtivos = useMemo(
    () =>
      produtos.filter(
        (produto) => produto.ativo !== false
      ),
    [produtos]
  )

  const stats = useMemo(() => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const movimentosHoje = movimentos.filter(
      (movimento) => {
        const data = new Date(movimento.criado_em)

        return (
          !Number.isNaN(data.getTime()) && data >= hoje
        )
      }
    )

    const entradasHoje = movimentosHoje
      .filter(
        (movimento) =>
          movimento.tipo_movimento === 'entrada'
      )
      .reduce(
        (total, movimento) =>
          total +
          Math.max(
            normalizarNumero(movimento.quantidade),
            0
          ),
        0
      )

    const saidasHoje = movimentosHoje
      .filter(
        (movimento) =>
          movimento.tipo_movimento === 'saida'
      )
      .reduce(
        (total, movimento) =>
          total +
          Math.max(
            normalizarNumero(movimento.quantidade),
            0
          ),
        0
      )

    const produtosBaixoEstoque =
      produtosAtivos.filter((produto) => {
        const atual = Math.max(
          normalizarNumero(produto.quantidade_atual),
          0
        )

        const minimo = Math.max(
          normalizarNumero(produto.quantidade_minima),
          0
        )

        return (
          atual > 0 &&
          minimo > 0 &&
          atual < minimo
        )
      })

    const produtosCriticos = produtosAtivos.filter(
      (produto) =>
        normalizarNumero(produto.quantidade_atual) <= 0
    )

    const produtosSemCusto = produtosAtivos.filter(
      (produto) =>
        normalizarNumero(produto.preco_custo) <= 0
    ).length

    const valorEstoqueCusto = produtosAtivos.reduce(
      (total, produto) => {
        const quantidade = Math.max(
          normalizarNumero(produto.quantidade_atual),
          0
        )

        const custo = Math.max(
          normalizarNumero(produto.preco_custo),
          0
        )

        return total + quantidade * custo
      },
      0
    )

    return {
      entradasHoje,
      saidasHoje,
      produtosBaixoEstoque,
      produtosCriticos,
      produtosSemCusto,
      valorEstoqueCusto,
      totalProdutosAtivos: produtosAtivos.length,
    }
  }, [movimentos, produtosAtivos])

  const movimentosFiltrados = useMemo(() => {
    const inicioPeriodo =
      obterInicioPeriodo(periodoFiltro)
    const termoBusca = normalizarTexto(filtro)

    return movimentos.filter((movimento) => {
      if (inicioPeriodo) {
        const dataMovimento = new Date(
          movimento.criado_em
        )

        if (
          Number.isNaN(dataMovimento.getTime()) ||
          dataMovimento < inicioPeriodo
        ) {
          return false
        }
      }

      if (
        tipoFiltro !== 'todos' &&
        movimento.tipo_movimento !== tipoFiltro
      ) {
        return false
      }

      if (termoBusca) {
        const conteudo = normalizarTexto(
          [
            movimento.produto?.nome,
            movimento.produto?.sku,
            movimento.motivo,
          ]
            .filter(Boolean)
            .join(' ')
        )

        if (!conteudo.includes(termoBusca)) {
          return false
        }
      }

      return true
    })
  }, [
    movimentos,
    filtro,
    tipoFiltro,
    periodoFiltro,
  ])

  const movimentosAgrupados = useMemo(() => {
    return movimentosFiltrados.reduce<
      Record<string, MovimentoComProduto[]>
    >((grupos, movimento) => {
      const chave = criarChaveData(
        movimento.criado_em
      )

      if (!grupos[chave]) {
        grupos[chave] = []
      }

      grupos[chave].push(movimento)

      return grupos
    }, {})
  }, [movimentosFiltrados])

  const movimentosPorDia = useMemo(() => {
    const agrupados = movimentosFiltrados.reduce<
      Record<string, MovimentoPorDia>
    >((resultado, movimento) => {
      const data = new Date(movimento.criado_em)

      if (Number.isNaN(data.getTime())) {
        return resultado
      }

      const chave = data.toLocaleDateString('pt-BR')

      if (!resultado[chave]) {
        resultado[chave] = {
          data: chave,
          entradas: 0,
          saidas: 0,
        }
      }

      const quantidade = Math.max(
        normalizarNumero(movimento.quantidade),
        0
      )

      if (movimento.tipo_movimento === 'entrada') {
        resultado[chave].entradas += quantidade
      } else {
        resultado[chave].saidas += quantidade
      }

      return resultado
    }, {})

    return Object.values(agrupados)
  }, [movimentosFiltrados])

  const limparFiltros = () => {
    setFiltro('')
    setTipoFiltro('todos')
    setPeriodoFiltro('todos')
  }

  const temFiltrosAtivos =
    Boolean(filtro.trim()) ||
    tipoFiltro !== 'todos' ||
    periodoFiltro !== 'todos'

  const handleExportarMovimentos = () => {
    if (!temExportarCSV) {
      addNotification(
        'Exportação CSV disponível no plano Profissional.',
        'warning'
      )
      return
    }

    if (movimentosPorDia.length === 0) {
      addNotification(
        'Não existem movimentações para exportar.',
        'warning'
      )
      return
    }

    const nomePeriodo =
      periodoFiltro === 'todos'
        ? 'todos'
        : periodoFiltro

    exportMovimentosDiariosCSV(
      movimentosPorDia,
      nomePeriodo
    )

    addNotification(
      'Movimentações exportadas com sucesso.',
      'success',
      3000
    )
  }

  if (loading) {
    return <SkeletonTable />
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-clip pb-8">
      <PageHeader
        eyebrow="GESTÃO DE ESTOQUE"
        title="Movimentações"
        description="Acompanhe entradas, saídas, ajustes e o histórico do estoque."
        icon={Activity}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <button
              type="button"
              aria-label="Atualizar movimentações"
              onClick={() => fetchData(true)}
              disabled={atualizando}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <RefreshCw
                aria-hidden="true"
                className={`h-4 w-4 ${
                  atualizando ? 'animate-spin' : ''
                }`}
              />
              <span className="sm:hidden">
                Atualizar
              </span>
            </button>

            {temExportarCSV ? (
              <button
                type="button"
                onClick={handleExportarMovimentos}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <Download
                  aria-hidden="true"
                  className="h-4 w-4"
                />
                Exportar
              </button>
            ) : (
              <Link
                href="/assinar"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
              >
                <Crown
                  aria-hidden="true"
                  className="h-4 w-4"
                />
                Exportar
              </Link>
            )}

            <Link
              href="/dashboard/estoque/movimento?tipo=entrada"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <ArrowDownLeft
                aria-hidden="true"
                className="h-4 w-4"
              />
              Nova entrada
            </Link>

            <Link
              href="/dashboard/estoque/movimento?tipo=saida"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              <ArrowUpRight
                aria-hidden="true"
                className="h-4 w-4"
              />
              Nova saída
            </Link>
          </div>
        }
      />

      {erroCarregamento && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 flex-shrink-0"
          />

          <div className="min-w-0 flex-1">
            <p>{erroCarregamento}</p>

            <button
              type="button"
              onClick={() => fetchData(true)}
              className="mt-2 text-xs font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {stats.produtosCriticos.length > 0 &&
        criticosVisivel && (
          <section className="relative rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/15">
            <div className="flex items-start gap-3 pr-8">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
                <PackageX
                  aria-hidden="true"
                  className="h-5 w-5 text-red-600 dark:text-red-400"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-red-900 dark:text-red-100">
                    Produtos zerados
                  </h2>

                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    {stats.produtosCriticos.length}
                  </span>
                </div>

                <p className="mt-1 break-words text-sm text-red-700 dark:text-red-300">
                  {stats.produtosCriticos
                    .slice(0, 5)
                    .map((produto) => produto.nome)
                    .join(', ')}

                  {stats.produtosCriticos.length > 5 &&
                    ` e mais ${
                      stats.produtosCriticos.length - 5
                    }`}
                </p>

                <Link
                  href="/dashboard/produtos"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline dark:text-red-300"
                >
                  Ver produtos
                  <ArrowRight
                    aria-hidden="true"
                    className="h-3 w-3"
                  />
                </Link>
              </div>
            </div>

            <button
              type="button"
              aria-label="Ocultar aviso de produtos zerados"
              onClick={() => setCriticosVisivel(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-red-400 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </section>
        )}

      <section aria-label="Indicadores das movimentações">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KPICard
            label="Entradas hoje"
            valor={stats.entradasHoje}
            sublabel="unidades registradas"
            icon={ArrowDownLeft}
            cor="green"
          />

          <KPICard
            label="Saídas hoje"
            valor={stats.saidasHoje}
            sublabel="unidades registradas"
            icon={ArrowUpRight}
            cor="red"
          />

          <KPICard
            label="Valor do estoque a custo"
            valor={formatarMoeda(
              stats.valorEstoqueCusto
            )}
            sublabel="capital registrado"
            icon={Package}
            cor="emerald"
          />

          <KPICard
            label="Abaixo do mínimo"
            valor={stats.produtosBaixoEstoque.length}
            icon={AlertTriangle}
            cor={
              stats.produtosBaixoEstoque.length > 0
                ? 'amber'
                : 'green'
            }
            destaque={
              stats.produtosBaixoEstoque.length > 0
            }
          />

          <KPICard
            label="Produtos zerados"
            valor={stats.produtosCriticos.length}
            icon={
              stats.produtosCriticos.length > 0
                ? PackageX
                : PackageCheck
            }
            cor={
              stats.produtosCriticos.length > 0
                ? 'red'
                : 'green'
            }
            destaque={
              stats.produtosCriticos.length > 0
            }
          />

          <KPICard
            label="Total de movimentações"
            valor={totalMovimentacoes}
            icon={Activity}
            cor="blue"
          />
        </div>
      </section>

      {stats.produtosSemCusto > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          O valor do estoque considera somente produtos com preço de
          custo cadastrado.{' '}
          <strong>
            {stats.produtosSemCusto} produto(s)
          </strong>{' '}
          ainda não possuem custo informado.
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              placeholder="Buscar por produto, SKU ou motivo..."
              value={filtro}
              onChange={(event) =>
                setFiltro(event.target.value)
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            {filtro && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setFiltro('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex overflow-x-auto rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {[
              { id: 'hoje' as const, label: 'Hoje' },
              { id: '7d' as const, label: '7 dias' },
              { id: '30d' as const, label: '30 dias' },
              { id: 'todos' as const, label: 'Todos' },
            ].map(({ id, label }) => (
              <button
                type="button"
                key={id}
                onClick={() => setPeriodoFiltro(id)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  periodoFiltro === id
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex overflow-x-auto rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {[
              {
                id: 'todos' as const,
                label: 'Todos',
                icon: null,
              },
              {
                id: 'entrada' as const,
                label: 'Entradas',
                icon: ArrowDownLeft,
              },
              {
                id: 'saida' as const,
                label: 'Saídas',
                icon: ArrowUpRight,
              },
            ].map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setTipoFiltro(id)}
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tipoFiltro === id
                    ? id === 'entrada'
                      ? 'bg-emerald-600 text-white'
                      : id === 'saida'
                        ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                        : 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {Icon && (
                  <Icon
                    aria-hidden="true"
                    className="h-3 w-3"
                  />
                )}
                {label}
              </button>
            ))}
          </div>
        </div>

        {temFiltrosAtivos && (
          <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
            <Filter
              aria-hidden="true"
              className="h-3.5 w-3.5 text-gray-400"
            />

            <span className="text-xs text-gray-500 dark:text-gray-400">
              {movimentosFiltrados.length} resultado(s)
            </span>

            <button
              type="button"
              onClick={limparFiltros}
              className="ml-auto text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="flex min-w-0 items-center gap-2">
            <Calendar
              aria-hidden="true"
              className="h-4 w-4 flex-shrink-0 text-gray-400"
            />

            <h2 className="truncate text-sm font-bold text-gray-900 dark:text-white">
              Histórico de movimentações
            </h2>

            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {movimentosFiltrados.length}
            </span>
          </div>
        </header>

        {movimentosFiltrados.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              <Boxes
                aria-hidden="true"
                className="h-7 w-7 text-gray-400"
              />
            </div>

            <h3 className="font-bold text-gray-900 dark:text-white">
              {temFiltrosAtivos
                ? 'Nenhuma movimentação encontrada'
                : 'Nenhuma movimentação registrada'}
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
              {temFiltrosAtivos
                ? 'Tente limpar ou alterar os filtros utilizados.'
                : 'Registre uma entrada, saída ou ajuste para começar.'}
            </p>

            {temFiltrosAtivos ? (
              <button
                type="button"
                onClick={limparFiltros}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
              >
                <X aria-hidden="true" className="h-4 w-4" />
                Limpar filtros
              </button>
            ) : (
              <Link
                href="/dashboard/estoque/movimento"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Registrar movimentação
              </Link>
            )}
          </div>
        ) : (
          <div className="max-h-[700px] overflow-y-auto">
            {Object.entries(movimentosAgrupados).map(
              ([data, movimentosDoDia]) => (
                <div key={data}>
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/95 px-5 py-2 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-800/95">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {data}
                    </h3>

                    <span className="text-xs text-gray-400">
                      {movimentosDoDia.length}{' '}
                      {movimentosDoDia.length === 1
                        ? 'movimentação'
                        : 'movimentações'}
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {movimentosDoDia.map((movimento) => {
                      const isEntrada =
                        movimento.tipo_movimento ===
                        'entrada'

                      return (
                        <article
                          key={movimento.id}
                          className="group px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 sm:px-5"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div
                              className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                                isEntrada
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                  : 'bg-gray-100 dark:bg-gray-800'
                              }`}
                            >
                              {isEntrada ? (
                                <ArrowDownLeft
                                  aria-hidden="true"
                                  className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                                />
                              ) : (
                                <ArrowUpRight
                                  aria-hidden="true"
                                  className="h-4 w-4 text-gray-600 dark:text-gray-300"
                                />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <p className="min-w-0 break-words text-sm font-semibold text-gray-900 dark:text-white">
                                  {movimento.produto?.nome ??
                                    'Produto removido'}
                                </p>

                                {movimento.produto?.sku && (
                                  <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                    {movimento.produto.sku}
                                  </span>
                                )}

                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    isEntrada
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                  }`}
                                >
                                  {isEntrada
                                    ? 'Entrada'
                                    : 'Saída'}
                                </span>
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                <span>
                                  {movimento.motivo ||
                                    'Sem motivo informado'}
                                </span>

                                <span aria-hidden="true">•</span>

                                <time
                                  dateTime={
                                    movimento.criado_em
                                  }
                                >
                                  {formatarHora(
                                    movimento.criado_em
                                  )}
                                </time>
                              </div>
                            </div>

                            <div className="flex flex-shrink-0 items-center gap-2">
                              <p
                                className={`text-base font-bold ${
                                  isEntrada
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-gray-700 dark:text-gray-200'
                                }`}
                              >
                                {isEntrada ? '+' : '-'}
                                {normalizarNumero(
                                  movimento.quantidade
                                )}
                              </p>

                              {movimento.produto?.id && (
                                <Link
                                  href={`/dashboard/produtos/${movimento.produto.id}`}
                                  aria-label={`Ver produto ${movimento.produto.nome ?? ''}`}
                                  title="Ver produto"
                                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                                >
                                  <Eye
                                    aria-hidden="true"
                                    className="h-3.5 w-3.5"
                                  />
                                </Link>
                              )}
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  )
}