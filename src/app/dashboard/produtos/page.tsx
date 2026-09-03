'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowUpDown,
  Boxes,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Eye,
  EyeOff,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Loader2,
  Package,
  PackageCheck,
  PackageX,
  Plus,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  X,
} from 'lucide-react'

import PageHeader from '@/components/page-header'
import { SkeletonGrid } from '@/components/skeleton-loaders'
import { useNotification } from '@/contexts/NotificationContext'
import { supabase } from '@/lib/supabase'
import type { Produto } from '@/lib/types'
import { formatarMoeda } from '@/lib/utils'

const POR_PAGINA = 20

type FiltroStatus =
  | 'todos'
  | 'critico'
  | 'baixo'
  | 'normal'
  | 'sem_minimo'
  | 'inativo'

type Ordenacao =
  | 'nome_asc'
  | 'nome_desc'
  | 'preco_asc'
  | 'preco_desc'
  | 'estoque_asc'
  | 'estoque_desc'
  | 'recente'

type Visualizacao = 'tabela' | 'grid'
type CorKPI = 'blue' | 'red' | 'amber' | 'green' | 'emerald'
type ClassificacaoEstoque =
  | 'critico'
  | 'baixo'
  | 'normal'
  | 'sem_minimo'
  | 'inativo'

interface ModalConfirmacao {
  titulo: string
  descricao: string
  textoBotao: string
  cor: 'red' | 'green'
  onConfirmar: () => Promise<void> | void
}

interface KPIProps {
  label: string
  valor: string | number
  icon: LucideIcon
  cor: CorKPI
  destaque?: boolean
  descricao?: string
}

interface StatusEstoque {
  tipo: ClassificacaoEstoque
  label: string
  dot: string
  textColor: string
  badge: string
  progress: string
}

interface ResultadoStatusProduto {
  produto_id: string
  produto_nome: string
  ativo: boolean
  usuario_id: string
  alterado_por: string
}

interface ResultadoStatusLote {
  quantidade_atualizada: number
  ativo: boolean
  usuario_id: string
  alterado_por: string
}

interface ResultadoExclusaoProduto {
  produto_id: string
  produto_nome: string
  excluido: boolean
  usuario_id: string
  excluido_por: string
}

const PALETA_KPI: Record<
  CorKPI,
  { iconBg: string; iconColor: string; border: string }
> = {
  blue: {
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  red: {
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  amber: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  green: {
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  emerald: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
}

function normalizarNumero(valor: unknown): number {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

function obterTimestamp(data: string | null | undefined): number {
  if (!data) return 0
  const timestamp = new Date(data).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
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
  return 'Erro inesperado ao realizar a operação.'
}

function classificarEstoque(produto: Produto): StatusEstoque {
  const atual = Math.max(normalizarNumero(produto.quantidade_atual), 0)
  const minimo = Math.max(normalizarNumero(produto.quantidade_minima), 0)

  if (produto.ativo === false) {
    return {
      tipo: 'inativo',
      label: 'Inativo',
      dot: 'bg-gray-400',
      textColor: 'text-gray-600 dark:text-gray-400',
      badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      progress: 'bg-gray-400',
    }
  }

  if (atual <= 0) {
    return {
      tipo: 'critico',
      label: 'Zerado',
      dot: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400',
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      progress: 'bg-red-500',
    }
  }

  if (minimo <= 0) {
    return {
      tipo: 'sem_minimo',
      label: 'Sem mínimo',
      dot: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      progress: 'bg-blue-500',
    }
  }

  if (atual < minimo) {
    return {
      tipo: 'baixo',
      label: 'Baixo',
      dot: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      progress: 'bg-amber-500',
    }
  }

  return {
    tipo: 'normal',
    label: 'Normal',
    dot: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    progress: 'bg-emerald-500',
  }
}

function calcularMargem(produto: Produto): number | null {
  const custo = normalizarNumero(produto.preco_custo)
  const venda = normalizarNumero(produto.preco_venda)
  if (custo <= 0 || venda <= 0) return null
  return ((venda - custo) / venda) * 100
}

function calcularPorcentagemEstoque(produto: Produto): number {
  const atual = Math.max(normalizarNumero(produto.quantidade_atual), 0)
  const minimo = Math.max(normalizarNumero(produto.quantidade_minima), 0)
  if (atual <= 0) return 0
  if (minimo <= 0) return 100
  return Math.min(100, (atual / (minimo * 2)) * 100)
}

const ORDENACOES: Record<Ordenacao, (a: Produto, b: Produto) => number> = {
  nome_asc: (a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }),
  nome_desc: (a, b) =>
    b.nome.localeCompare(a.nome, 'pt-BR', { sensitivity: 'base' }),
  preco_asc: (a, b) =>
    normalizarNumero(a.preco_venda) - normalizarNumero(b.preco_venda),
  preco_desc: (a, b) =>
    normalizarNumero(b.preco_venda) - normalizarNumero(a.preco_venda),
  estoque_asc: (a, b) =>
    normalizarNumero(a.quantidade_atual) - normalizarNumero(b.quantidade_atual),
  estoque_desc: (a, b) =>
    normalizarNumero(b.quantidade_atual) - normalizarNumero(a.quantidade_atual),
  recente: (a, b) => obterTimestamp(b.criado_em) - obterTimestamp(a.criado_em),
}

export default function ProdutosPage() {
  const { addNotification } = useNotification()

  const [todosOsProdutos, setTodosOsProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')
  const [pagina, setPagina] = useState(0)
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null)
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('nome_asc')
  const [visualizacao, setVisualizacao] = useState<Visualizacao>('tabela')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalConfirmacao | null>(null)
  const [processando, setProcessando] = useState(false)
  const [processandoIds, setProcessandoIds] = useState<Set<string>>(new Set())

  const fetchProdutos = useCallback(
    async (feedback = false) => {
      feedback ? setAtualizando(true) : setLoading(true)
      setErroCarregamento(null)

      try {
        const { data, error } = await supabase.rpc(
          'listar_produtos_gerenciamento'
        )
        if (error) throw error
        setTodosOsProdutos((data as Produto[] | null) ?? [])
        if (feedback) {
          addNotification('Produtos atualizados.', 'success', 1800)
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
        setErroCarregamento(
          'Não foi possível carregar os produtos da conta. Tente novamente.'
        )
      } finally {
        setLoading(false)
        setAtualizando(false)
      }
    },
    [addNotification]
  )

  useEffect(() => {
    void fetchProdutos()
  }, [fetchProdutos])

  useEffect(() => {
    setPagina(0)
    setSelecionados(new Set())
  }, [filtro, filtroCategoria, filtroStatus, ordenacao])

  const produtosAtivos = useMemo(
    () => todosOsProdutos.filter((produto) => produto.ativo !== false),
    [todosOsProdutos]
  )

  const estatisticas = useMemo(() => {
    const zerados = produtosAtivos.filter(
      (produto) => normalizarNumero(produto.quantidade_atual) <= 0
    ).length
    const abaixoMinimo = produtosAtivos.filter((produto) => {
      const atual = Math.max(normalizarNumero(produto.quantidade_atual), 0)
      const minimo = Math.max(normalizarNumero(produto.quantidade_minima), 0)
      return atual > 0 && minimo > 0 && atual < minimo
    }).length
    const semMinimo = produtosAtivos.filter(
      (produto) => normalizarNumero(produto.quantidade_minima) <= 0
    ).length
    const normais = produtosAtivos.filter(
      (produto) => classificarEstoque(produto).tipo === 'normal'
    ).length
    const inativos = todosOsProdutos.filter(
      (produto) => produto.ativo === false
    ).length
    const semCusto = produtosAtivos.filter(
      (produto) => normalizarNumero(produto.preco_custo) <= 0
    ).length
    const valorEstoqueCusto = produtosAtivos.reduce((total, produto) => {
      const quantidade = Math.max(normalizarNumero(produto.quantidade_atual), 0)
      const custo = Math.max(normalizarNumero(produto.preco_custo), 0)
      return total + quantidade * custo
    }, 0)

    return {
      ativos: produtosAtivos.length,
      zerados,
      abaixoMinimo,
      normais,
      semMinimo,
      inativos,
      semCusto,
      valorEstoqueCusto,
    }
  }, [produtosAtivos, todosOsProdutos])

  const categorias = useMemo(() => {
    const unicas = new Set<string>()
    todosOsProdutos.forEach((produto) => {
      const categoria = produto.categoria?.trim()
      if (categoria) unicas.add(categoria)
    })
    return Array.from(unicas).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    )
  }, [todosOsProdutos])

  const produtosFiltrados = useMemo(() => {
    const termo = normalizarTexto(filtro)
    return [...todosOsProdutos]
      .filter((produto) => {
        if (!termo) return true
        return normalizarTexto(
          [produto.nome, produto.sku, produto.categoria, produto.marca]
            .filter(Boolean)
            .join(' ')
        ).includes(termo)
      })
      .filter(
        (produto) => !filtroCategoria || produto.categoria === filtroCategoria
      )
      .filter(
        (produto) =>
          filtroStatus === 'todos' ||
          classificarEstoque(produto).tipo === filtroStatus
      )
      .sort(ORDENACOES[ordenacao])
  }, [todosOsProdutos, filtro, filtroCategoria, filtroStatus, ordenacao])

  const totalProdutosFiltrados = produtosFiltrados.length
  const totalPaginas = Math.max(
    1,
    Math.ceil(totalProdutosFiltrados / POR_PAGINA)
  )
  const produtosDaPagina = useMemo(() => {
    const inicio = pagina * POR_PAGINA
    return produtosFiltrados.slice(inicio, inicio + POR_PAGINA)
  }, [pagina, produtosFiltrados])

  useEffect(() => {
    if (pagina > totalPaginas - 1) {
      setPagina(Math.max(totalPaginas - 1, 0))
    }
  }, [pagina, totalPaginas])

  const todosDaPaginaSelecionados =
    produtosDaPagina.length > 0 &&
    produtosDaPagina.every((produto) => selecionados.has(produto.id))

  const temFiltrosAtivos =
    Boolean(filtro.trim()) ||
    filtroStatus !== 'todos' ||
    Boolean(filtroCategoria)

  const limparFiltros = () => {
    setFiltro('')
    setFiltroStatus('todos')
    setFiltroCategoria(null)
    setOrdenacao('nome_asc')
  }

  const toggleSelecao = (id: string) => {
    setSelecionados((atuais) => {
      const novos = new Set(atuais)
      novos.has(id) ? novos.delete(id) : novos.add(id)
      return novos
    })
  }

  const toggleSelecionarPagina = () => {
    setSelecionados((atuais) => {
      const novos = new Set(atuais)
      produtosDaPagina.forEach((produto) => {
        if (todosDaPaginaSelecionados) novos.delete(produto.id)
        else novos.add(produto.id)
      })
      return novos
    })
  }

  const toggleAtivo = async (produto: Produto) => {
    if (processandoIds.has(produto.id)) return
    const novoEstado = produto.ativo === false
    setProcessandoIds((atuais) => new Set(atuais).add(produto.id))

    try {
      const { data, error } = await supabase.rpc('alterar_status_produto', {
        p_produto_id: produto.id,
        p_ativo: novoEstado,
      })
      if (error) throw error

      const resultado = data as ResultadoStatusProduto | null
      if (!resultado || resultado.produto_id !== produto.id) {
        throw new Error('O servidor retornou uma resposta inválida.')
      }

      setTodosOsProdutos((atuais) =>
        atuais.map((item) =>
          item.id === produto.id ? { ...item, ativo: resultado.ativo } : item
        )
      )
      setSelecionados((atuais) => {
        const novos = new Set(atuais)
        novos.delete(produto.id)
        return novos
      })
      addNotification(
        `${resultado.produto_nome} foi ${
          resultado.ativo ? 'ativado' : 'desativado'
        }.`,
        'success',
        2500
      )
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      addNotification(obterMensagemErro(error), 'error', 4500)
    } finally {
      setProcessandoIds((atuais) => {
        const novos = new Set(atuais)
        novos.delete(produto.id)
        return novos
      })
    }
  }

  const handleDelete = (produto: Produto) => {
    setModal({
      titulo: 'Excluir produto sem histórico?',
      descricao: `O banco só excluirá "${produto.nome}" se não houver vendas, movimentos de estoque ou alertas associados. Caso exista histórico, desative o produto.`,
      textoBotao: 'Tentar excluir',
      cor: 'red',
      onConfirmar: async () => {
        if (processando) return
        setProcessando(true)
        try {
          const { data, error } = await supabase.rpc(
            'excluir_produto_sem_historico',
            { p_produto_id: produto.id }
          )
          if (error) throw error

          const resultado = data as ResultadoExclusaoProduto | null
          if (!resultado?.excluido) {
            throw new Error('O servidor não confirmou a exclusão.')
          }

          setTodosOsProdutos((atuais) =>
            atuais.filter((item) => item.id !== produto.id)
          )
          setSelecionados((atuais) => {
            const novos = new Set(atuais)
            novos.delete(produto.id)
            return novos
          })
          setModal(null)
          addNotification(
            `${resultado.produto_nome} foi excluído.`,
            'success',
            2500
          )
        } catch (error) {
          console.error('Erro ao excluir produto:', error)
          addNotification(obterMensagemErro(error), 'error', 6000)
          setModal(null)
          await fetchProdutos()
        } finally {
          setProcessando(false)
        }
      },
    })
  }

  const handleDesativarSelecionados = () => {
    const ids = Array.from(selecionados)
    if (ids.length === 0) return

    setModal({
      titulo: `Desativar ${ids.length} produto(s)?`,
      descricao:
        'Os produtos selecionados deixarão de aparecer no PDV, mas vendas, movimentos, alertas e demais históricos serão preservados.',
      textoBotao: 'Desativar selecionados',
      cor: 'green',
      onConfirmar: async () => {
        if (processando) return
        setProcessando(true)
        try {
          const { data, error } = await supabase.rpc(
            'alterar_status_produtos_em_lote',
            { p_produto_ids: ids, p_ativo: false }
          )
          if (error) throw error

          const resultado = data as ResultadoStatusLote | null
          if (!resultado) throw new Error('Resposta inválida do servidor.')

          const idsSet = new Set(ids)
          setTodosOsProdutos((atuais) =>
            atuais.map((produto) =>
              idsSet.has(produto.id) ? { ...produto, ativo: false } : produto
            )
          )
          setSelecionados(new Set())
          setModal(null)
          addNotification(
            `${normalizarNumero(
              resultado.quantidade_atualizada
            )} produto(s) desativado(s).`,
            'success',
            3000
          )
        } catch (error) {
          console.error('Erro ao desativar produtos:', error)
          addNotification(obterMensagemErro(error), 'error', 5000)
        } finally {
          setProcessando(false)
        }
      },
    })
  }

  const filtrosStatus: Array<{
    id: FiltroStatus
    label: string
    count: number
  }> = [
    { id: 'todos', label: 'Todos', count: todosOsProdutos.length },
    { id: 'critico', label: 'Zerados', count: estatisticas.zerados },
    { id: 'baixo', label: 'Baixo', count: estatisticas.abaixoMinimo },
    { id: 'normal', label: 'Normal', count: estatisticas.normais },
    { id: 'sem_minimo', label: 'Sem mínimo', count: estatisticas.semMinimo },
    { id: 'inativo', label: 'Inativos', count: estatisticas.inativos },
  ]

  return (
    <div className="min-w-0 space-y-6 overflow-x-clip pb-8">
      <PageHeader
        eyebrow="GESTÃO DE ESTOQUE"
        title="Produtos"
        description="Organize o catálogo e acompanhe quantidades, custos e disponibilidade."
        icon={Package}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => void fetchProdutos(true)}
              disabled={atualizando}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <Loader2
                className={`h-4 w-4 ${atualizando ? 'animate-spin' : 'hidden'}`}
              />
              Atualizar
            </button>
            <Link
              href="/dashboard/produtos/importar"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <FileSpreadsheet className="h-4 w-4" /> Importar CSV
            </Link>
            <Link
              href="/dashboard/produtos/novo"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" /> Novo produto
            </Link>
          </div>
        }
      />

      {erroCarregamento && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p>{erroCarregamento}</p>
            <button
              type="button"
              onClick={() => void fetchProdutos()}
              className="mt-2 text-xs font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {!erroCarregamento && (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KPICard
              label="Produtos ativos"
              valor={estatisticas.ativos}
              icon={Boxes}
              cor="blue"
              descricao={`${estatisticas.inativos} inativo(s)`}
            />
            <KPICard
              label="Valor do estoque a custo"
              valor={formatarMoeda(estatisticas.valorEstoqueCusto)}
              icon={CircleDollarSign}
              cor="emerald"
              descricao="Capital registrado pelo preço de custo"
            />
            <KPICard
              label="Produtos zerados"
              valor={estatisticas.zerados}
              icon={estatisticas.zerados > 0 ? PackageX : PackageCheck}
              cor={estatisticas.zerados > 0 ? 'red' : 'green'}
              destaque={estatisticas.zerados > 0}
            />
            <KPICard
              label="Abaixo do mínimo"
              valor={estatisticas.abaixoMinimo}
              icon={TrendingDown}
              cor={estatisticas.abaixoMinimo > 0 ? 'amber' : 'green'}
              destaque={estatisticas.abaixoMinimo > 0}
            />
          </section>

          {estatisticas.semCusto > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              O valor do estoque considera apenas produtos com preço de custo.
              <strong> {estatisticas.semCusto} produto(s)</strong> ainda não
              possuem custo cadastrado.
            </div>
          )}

          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-3 xl:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Buscar por nome, SKU, marca ou categoria..."
                  value={filtro}
                  onChange={(event) => setFiltro(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                {filtro && (
                  <button
                    type="button"
                    onClick={() => setFiltro('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="relative min-w-0 sm:min-w-[190px]">
                <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={ordenacao}
                  onChange={(event) =>
                    setOrdenacao(event.target.value as Ordenacao)
                  }
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-8 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  <option value="nome_asc">Nome, A a Z</option>
                  <option value="nome_desc">Nome, Z a A</option>
                  <option value="preco_asc">Menor preço de venda</option>
                  <option value="preco_desc">Maior preço de venda</option>
                  <option value="estoque_asc">Menor estoque</option>
                  <option value="estoque_desc">Maior estoque</option>
                  <option value="recente">Mais recentes</option>
                </select>
              </div>

              <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                <button
                  type="button"
                  onClick={() => setVisualizacao('tabela')}
                  className={`flex flex-1 justify-center rounded-md p-2 sm:flex-none ${
                    visualizacao === 'tabela'
                      ? 'bg-white shadow-sm dark:bg-gray-900'
                      : 'text-gray-500'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setVisualizacao('grid')}
                  className={`flex flex-1 justify-center rounded-md p-2 sm:flex-none ${
                    visualizacao === 'grid'
                      ? 'bg-white shadow-sm dark:bg-gray-900'
                      : 'text-gray-500'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              {filtrosStatus.map(({ id, label, count }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setFiltroStatus(id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    filtroStatus === id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {label}
                  <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px]">
                    {count}
                  </span>
                </button>
              ))}
              {temFiltrosAtivos && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-500"
                >
                  <X className="h-3.5 w-3.5" /> Limpar filtros
                </button>
              )}
            </div>

            {categorias.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setFiltroCategoria(null)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    !filtroCategoria
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                  }`}
                >
                  Todas as categorias
                </button>
                {categorias.map((categoria) => (
                  <button
                    type="button"
                    key={categoria}
                    onClick={() =>
                      setFiltroCategoria((atual) =>
                        atual === categoria ? null : categoria
                      )
                    }
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      filtroCategoria === categoria
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                    }`}
                  >
                    <Tag className="h-3 w-3" /> {categoria}
                  </button>
                ))}
              </div>
            )}
          </section>

          {selecionados.size > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                <CheckCircle2 className="h-5 w-5" /> {selecionados.size}{' '}
                produto(s) selecionado(s)
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDesativarSelecionados}
                  disabled={processando}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <Eye className="h-3.5 w-3.5" /> Desativar selecionados
                </button>
                <button
                  type="button"
                  onClick={() => setSelecionados(new Set())}
                  disabled={processando}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600"
                >
                  Cancelar seleção
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <SkeletonGrid />
          ) : produtosDaPagina.length === 0 ? (
            <EstadoVazio
              temFiltros={temFiltrosAtivos}
              limparFiltros={limparFiltros}
            />
          ) : visualizacao === 'tabela' ? (
            <ListaProdutos
              produtos={produtosDaPagina}
              selecionados={selecionados}
              todosSelecionados={todosDaPaginaSelecionados}
              processandoIds={processandoIds}
              toggleSelecao={toggleSelecao}
              toggleSelecionarPagina={toggleSelecionarPagina}
              toggleAtivo={toggleAtivo}
              handleDelete={handleDelete}
            />
          ) : (
            <GradeProdutos
              produtos={produtosDaPagina}
              selecionados={selecionados}
              processandoIds={processandoIds}
              toggleSelecao={toggleSelecao}
              toggleAtivo={toggleAtivo}
              handleDelete={handleDelete}
            />
          )}

          {totalProdutosFiltrados > 0 && (
            <footer className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Mostrando <strong>{pagina * POR_PAGINA + 1}</strong> até{' '}
                <strong>
                  {Math.min(
                    (pagina + 1) * POR_PAGINA,
                    totalProdutosFiltrados
                  )}
                </strong>{' '}
                de <strong>{totalProdutosFiltrados}</strong> produto(s)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPagina((atual) => Math.max(0, atual - 1))}
                  disabled={pagina === 0}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-30 sm:flex-none dark:border-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                <span className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold dark:bg-gray-800">
                  {pagina + 1} de {totalPaginas}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPagina((atual) => Math.min(totalPaginas - 1, atual + 1))
                  }
                  disabled={pagina >= totalPaginas - 1}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-30 sm:flex-none dark:border-gray-700"
                >
                  Próxima <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </footer>
          )}
        </>
      )}

      <ModalConfirmacaoComp
        modal={modal}
        processando={processando}
        onFechar={() => {
          if (!processando) setModal(null)
        }}
      />
    </div>
  )
}

function ListaProdutos({
  produtos,
  selecionados,
  todosSelecionados,
  processandoIds,
  toggleSelecao,
  toggleSelecionarPagina,
  toggleAtivo,
  handleDelete,
}: {
  produtos: Produto[]
  selecionados: Set<string>
  todosSelecionados: boolean
  processandoIds: Set<string>
  toggleSelecao: (id: string) => void
  toggleSelecionarPagina: () => void
  toggleAtivo: (produto: Produto) => Promise<void>
  handleDelete: (produto: Produto) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[920px]">
          <thead className="bg-gray-50 dark:bg-gray-800/40">
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="w-12 px-4 py-3">
                <BotaoSelecao
                  selecionado={todosSelecionados}
                  onClick={toggleSelecionarPagina}
                  label="Selecionar produtos da página"
                />
              </th>
              {['Produto', 'Categoria', 'Estoque', 'Custo', 'Venda', 'Status', 'Ações'].map(
                (titulo) => (
                  <th
                    key={titulo}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500 ${
                      ['Custo', 'Venda', 'Ações'].includes(titulo)
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    {titulo}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {produtos.map((produto) => {
              const status = classificarEstoque(produto)
              const selecionado = selecionados.has(produto.id)
              const processando = processandoIds.has(produto.id)
              const margem = calcularMargem(produto)
              const porcentagem = calcularPorcentagemEstoque(produto)

              return (
                <tr
                  key={produto.id}
                  className={`${
                    selecionado ? 'bg-blue-50/70 dark:bg-blue-900/10' : ''
                  } ${produto.ativo === false ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-3">
                    <BotaoSelecao
                      selecionado={selecionado}
                      onClick={() => toggleSelecao(produto.id)}
                      label={`Selecionar ${produto.nome}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-[260px] truncate text-sm font-semibold">
                      {produto.nome}
                    </p>
                    <p className="max-w-[260px] truncate text-[11px] text-gray-500">
                      SKU: {produto.sku || 'Não informado'}
                      {produto.marca ? ` · ${produto.marca}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {produto.categoria || 'Sem categoria'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="min-w-[130px]">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className={status.textColor}>
                          <strong>{normalizarNumero(produto.quantidade_atual)}</strong>{' '}
                          un
                        </span>
                        <span className="text-gray-400">
                          Mín. {normalizarNumero(produto.quantidade_minima)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className={`h-full ${status.progress}`}
                          style={{ width: `${porcentagem}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {normalizarNumero(produto.preco_custo) > 0
                      ? formatarMoeda(normalizarNumero(produto.preco_custo))
                      : 'Não informado'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-semibold">
                      {formatarMoeda(normalizarNumero(produto.preco_venda))}
                    </p>
                    {margem !== null && (
                      <p className="text-[10px] text-gray-500">
                        Margem bruta {margem.toFixed(1)}%
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-4 py-3">
                    <AcoesProduto
                      produto={produto}
                      processando={processando}
                      toggleAtivo={toggleAtivo}
                      handleDelete={handleDelete}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800 lg:hidden">
        {produtos.map((produto) => {
          const status = classificarEstoque(produto)
          const selecionado = selecionados.has(produto.id)
          const processando = processandoIds.has(produto.id)
          return (
            <article
              key={produto.id}
              className={`p-4 ${
                selecionado ? 'bg-blue-50/70 dark:bg-blue-900/10' : ''
              } ${produto.ativo === false ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                <BotaoSelecao
                  selecionado={selecionado}
                  onClick={() => toggleSelecao(produto.id)}
                  label={`Selecionar ${produto.nome}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words text-sm font-bold">
                        {produto.nome}
                      </h2>
                      <p className="text-[11px] text-gray-500">
                        {produto.sku || 'Sem SKU'}
                        {produto.categoria ? ` · ${produto.categoria}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 text-xs dark:bg-gray-800/50">
                    <Resumo label="Estoque" valor={`${normalizarNumero(produto.quantidade_atual)} un`} />
                    <Resumo
                      label="Custo"
                      valor={
                        normalizarNumero(produto.preco_custo) > 0
                          ? formatarMoeda(normalizarNumero(produto.preco_custo))
                          : 'Não informado'
                      }
                    />
                    <Resumo
                      label="Venda"
                      valor={formatarMoeda(normalizarNumero(produto.preco_venda))}
                    />
                  </div>
                  <div className="mt-3">
                    <AcoesProduto
                      produto={produto}
                      processando={processando}
                      toggleAtivo={toggleAtivo}
                      handleDelete={handleDelete}
                      mobile
                    />
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function GradeProdutos({
  produtos,
  selecionados,
  processandoIds,
  toggleSelecao,
  toggleAtivo,
  handleDelete,
}: {
  produtos: Produto[]
  selecionados: Set<string>
  processandoIds: Set<string>
  toggleSelecao: (id: string) => void
  toggleAtivo: (produto: Produto) => Promise<void>
  handleDelete: (produto: Produto) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {produtos.map((produto) => {
        const status = classificarEstoque(produto)
        const selecionado = selecionados.has(produto.id)
        const processando = processandoIds.has(produto.id)
        const margem = calcularMargem(produto)
        return (
          <article
            key={produto.id}
            className={`rounded-xl border bg-white p-4 dark:bg-gray-900 ${
              selecionado
                ? 'border-blue-400 bg-blue-50/50 dark:border-blue-700'
                : 'border-gray-200 dark:border-gray-800'
            } ${produto.ativo === false ? 'opacity-60' : ''}`}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <Package className="h-5 w-5 text-gray-500" />
              </div>
              <BotaoSelecao
                selecionado={selecionado}
                onClick={() => toggleSelecao(produto.id)}
                label={`Selecionar ${produto.nome}`}
              />
            </div>
            <h2 className="truncate text-sm font-bold">{produto.nome}</h2>
            <p className="truncate text-[11px] text-gray-500">
              {produto.sku || 'Sem SKU'}
              {produto.categoria ? ` · ${produto.categoria}` : ''}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <StatusBadge status={status} />
              <span className={`text-sm font-bold ${status.textColor}`}>
                {normalizarNumero(produto.quantidade_atual)} un
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 text-xs dark:bg-gray-800/50">
              <Resumo
                label="Custo"
                valor={
                  normalizarNumero(produto.preco_custo) > 0
                    ? formatarMoeda(normalizarNumero(produto.preco_custo))
                    : 'Não informado'
                }
              />
              <div>
                <Resumo
                  label="Venda"
                  valor={formatarMoeda(normalizarNumero(produto.preco_venda))}
                />
                {margem !== null && (
                  <p className="mt-1 text-[10px] text-gray-400">
                    Margem bruta {margem.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
              <AcoesProduto
                produto={produto}
                processando={processando}
                toggleAtivo={toggleAtivo}
                handleDelete={handleDelete}
                mobile
              />
            </div>
          </article>
        )
      })}
    </div>
  )
}

function AcoesProduto({
  produto,
  processando,
  toggleAtivo,
  handleDelete,
  mobile = false,
}: {
  produto: Produto
  processando: boolean
  toggleAtivo: (produto: Produto) => Promise<void>
  handleDelete: (produto: Produto) => void
  mobile?: boolean
}) {
  return (
    <div className={`flex items-center gap-2 ${mobile ? '' : 'justify-end'}`}>
      <button
        type="button"
        onClick={() => void toggleAtivo(produto)}
        disabled={processando}
        className={`inline-flex items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 ${
          mobile ? 'flex-1' : ''
        }`}
      >
        {processando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : produto.ativo === false ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
        {mobile && (produto.ativo === false ? 'Ativar' : 'Desativar')}
      </button>
      <button
        type="button"
        onClick={() => handleDelete(produto)}
        disabled={processando}
        className="inline-flex items-center justify-center rounded-lg bg-red-100 px-3 py-2 text-red-700 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400"
        title="Excluir somente se não houver histórico"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

function EstadoVazio({
  temFiltros,
  limparFiltros,
}: {
  temFiltros: boolean
  limparFiltros: () => void
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
      <Package className="mx-auto mb-4 h-14 w-14 text-gray-300" />
      <h2 className="font-bold">
        {temFiltros ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
        {temFiltros
          ? 'Tente limpar ou alterar os filtros utilizados.'
          : 'Cadastre o primeiro produto para começar a organizar o estoque.'}
      </p>
      {temFiltros ? (
        <button
          type="button"
          onClick={limparFiltros}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-gray-100 dark:text-gray-900"
        >
          Limpar filtros
        </button>
      ) : (
        <Link
          href="/dashboard/produtos/novo"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Cadastrar produto
        </Link>
      )}
    </div>
  )
}

function KPICard({
  label,
  valor,
  icon: Icon,
  cor,
  destaque = false,
  descricao,
}: KPIProps) {
  const palette = PALETA_KPI[cor]
  return (
    <article
      className={`rounded-xl border bg-white p-4 dark:bg-gray-900 ${
        destaque ? palette.border : 'border-gray-200 dark:border-gray-800'
      }`}
    >
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${palette.iconBg}`}
      >
        <Icon className={`h-4 w-4 ${palette.iconColor}`} />
      </div>
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="break-words text-xl font-bold md:text-2xl">{valor}</p>
      {descricao && <p className="mt-1 text-[11px] text-gray-500">{descricao}</p>}
    </article>
  )
}

function BotaoSelecao({
  selecionado,
  onClick,
  label,
}: {
  selecionado: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selecionado}
      onClick={onClick}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
        selecionado
          ? 'border-emerald-600 bg-emerald-600'
          : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900'
      }`}
    >
      {selecionado && <Check className="h-3.5 w-3.5 text-white" />}
    </button>
  )
}

function StatusBadge({ status }: { status: StatusEstoque }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${status.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
      {status.label}
    </span>
  )
}

function Resumo({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-gray-400">{label}</p>
      <p className="mt-0.5 break-words font-semibold">{valor}</p>
    </div>
  )
}

function ModalConfirmacaoComp({
  modal,
  onFechar,
  processando,
}: {
  modal: ModalConfirmacao | null
  onFechar: () => void
  processando: boolean
}) {
  useEffect(() => {
    if (!modal) return
    const fechar = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !processando) onFechar()
    }
    document.addEventListener('keydown', fechar)
    return () => document.removeEventListener('keydown', fechar)
  }, [modal, onFechar, processando])

  if (!modal) return null
  const perigo = modal.cor === 'red'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !processando) onFechar()
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              perigo
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
            }`}
          >
            {perigo ? (
              <Trash2 className="h-6 w-6" />
            ) : (
              <CheckCircle2 className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">{modal.titulo}</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {modal.descricao}
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            disabled={processando}
            className="text-gray-400 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onFechar}
            disabled={processando}
            className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold disabled:opacity-50 dark:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void modal.onConfirmar()}
            disabled={processando}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
              perigo ? 'bg-red-600' : 'bg-emerald-600'
            }`}
          >
            {processando && <Loader2 className="h-4 w-4 animate-spin" />}
            {processando ? 'Processando...' : modal.textoBotao}
          </button>
        </div>
      </div>
    </div>
  )
}
  