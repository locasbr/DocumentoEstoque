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
import { SkeletonGrid } from '@/components/skeleton-loaders'
import { useNotification } from '@/contexts/NotificationContext'
import { supabase } from '@/lib/supabase'
import type { Produto } from '@/lib/types'
import { formatarMoeda } from '@/lib/utils'

import {
  AlertCircle,
  ArrowUpDown,
  Boxes,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Edit2,
  Eye,
  EyeOff,
  FileSpreadsheet,
  LayoutGrid,
  List,
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

const PALETA_KPI: Record<
  CorKPI,
  {
    iconBg: string
    iconColor: string
    border: string
  }
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

const ORDENACOES: Record<
  Ordenacao,
  (a: Produto, b: Produto) => number
> = {
  nome_asc: (a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', {
      sensitivity: 'base',
    }),

  nome_desc: (a, b) =>
    b.nome.localeCompare(a.nome, 'pt-BR', {
      sensitivity: 'base',
    }),

  preco_asc: (a, b) =>
    normalizarNumero(a.preco_venda) -
    normalizarNumero(b.preco_venda),

  preco_desc: (a, b) =>
    normalizarNumero(b.preco_venda) -
    normalizarNumero(a.preco_venda),

  estoque_asc: (a, b) =>
    normalizarNumero(a.quantidade_atual) -
    normalizarNumero(b.quantidade_atual),

  estoque_desc: (a, b) =>
    normalizarNumero(b.quantidade_atual) -
    normalizarNumero(a.quantidade_atual),

  recente: (a, b) =>
    obterTimestamp(b.criado_em) - obterTimestamp(a.criado_em),
}

function normalizarNumero(valor: unknown): number {
  const numero = Number(valor)

  if (!Number.isFinite(numero)) {
    return 0
  }

  return numero
}

function obterTimestamp(data: string | null | undefined): number {
  if (!data) {
    return 0
  }

  const timestamp = new Date(data).getTime()

  return Number.isNaN(timestamp) ? 0 : timestamp
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function classificarEstoque(produto: Produto): StatusEstoque {
  const atual = Math.max(
    normalizarNumero(produto.quantidade_atual),
    0
  )

  const minimo = Math.max(
    normalizarNumero(produto.quantidade_minima),
    0
  )

  if (produto.ativo === false) {
    return {
      tipo: 'inativo',
      label: 'Inativo',
      dot: 'bg-gray-400',
      textColor: 'text-gray-600 dark:text-gray-400',
      badge:
        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      progress: 'bg-gray-400',
    }
  }

  if (atual <= 0) {
    return {
      tipo: 'critico',
      label: 'Zerado',
      dot: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400',
      badge:
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      progress: 'bg-red-500',
    }
  }

  if (minimo <= 0) {
    return {
      tipo: 'sem_minimo',
      label: 'Sem mínimo',
      dot: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      badge:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      progress: 'bg-blue-500',
    }
  }

  if (atual < minimo) {
    return {
      tipo: 'baixo',
      label: 'Baixo',
      dot: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      badge:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      progress: 'bg-amber-500',
    }
  }

  return {
    tipo: 'normal',
    label: 'Normal',
    dot: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    progress: 'bg-emerald-500',
  }
}

function calcularMargem(produto: Produto): number | null {
  const custo = normalizarNumero(produto.preco_custo)
  const venda = normalizarNumero(produto.preco_venda)

  if (custo <= 0 || venda <= 0) {
    return null
  }

  return ((venda - custo) / venda) * 100
}

function calcularPorcentagemEstoque(produto: Produto): number {
  const atual = Math.max(
    normalizarNumero(produto.quantidade_atual),
    0
  )

  const minimo = Math.max(
    normalizarNumero(produto.quantidade_minima),
    0
  )

  if (atual <= 0) {
    return 0
  }

  if (minimo <= 0) {
    return 100
  }

  return Math.min(100, (atual / (minimo * 2)) * 100)
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
      className={`min-w-0 rounded-xl border bg-white p-4 dark:bg-gray-900 ${
        destaque
          ? palette.border
          : 'border-gray-200 dark:border-gray-800'
      }`}
    >
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${palette.iconBg}`}
      >
        <Icon
          aria-hidden="true"
          className={`h-4 w-4 ${palette.iconColor}`}
        />
      </div>

      <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="break-words text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
        {valor}
      </p>

      {descricao && (
        <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
          {descricao}
        </p>
      )}
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
      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
        selecionado
          ? 'border-emerald-600 bg-emerald-600'
          : 'border-gray-300 bg-white hover:border-emerald-400 dark:border-gray-600 dark:bg-gray-900'
      }`}
    >
      {selecionado && (
        <Check aria-hidden="true" className="h-3.5 w-3.5 text-white" />
      )}
    </button>
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
    if (!modal) {
      return
    }

    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !processando) {
        onFechar()
      }
    }

    document.addEventListener('keydown', fecharComEscape)

    return () => {
      document.removeEventListener('keydown', fecharComEscape)
    }
  }, [modal, onFechar, processando])

  if (!modal) {
    return null
  }

  const isPerigo = modal.cor === 'red'

  const corBotao = isPerigo
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'

  const corIcone = isPerigo
    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'

  const confirmar = async () => {
    await modal.onConfirmar()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !processando) {
          onFechar()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-confirmacao-titulo"
        aria-describedby="modal-confirmacao-descricao"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="mb-5 flex items-start gap-4">
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${corIcone}`}
          >
            {isPerigo ? (
              <Trash2 aria-hidden="true" className="h-6 w-6" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="modal-confirmacao-titulo"
              className="text-lg font-bold text-gray-900 dark:text-white"
            >
              {modal.titulo}
            </h2>

            <p
              id="modal-confirmacao-descricao"
              className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400"
            >
              {modal.descricao}
            </p>
          </div>

          <button
            type="button"
            aria-label="Fechar confirmação"
            onClick={onFechar}
            disabled={processando}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onFechar}
            disabled={processando}
            className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={confirmar}
            disabled={processando}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-900 ${corBotao}`}
          >
            {processando && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}

            {processando ? 'Processando...' : modal.textoBotao}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProdutosPage() {
  const { addNotification } = useNotification()

  const [todosOsProdutos, setTodosOsProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(
    null
  )

  const [filtro, setFiltro] = useState('')
  const [pagina, setPagina] = useState(0)
  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatus>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(
    null
  )
  const [ordenacao, setOrdenacao] =
    useState<Ordenacao>('nome_asc')
  const [visualizacao, setVisualizacao] =
    useState<Visualizacao>('tabela')

  const [selecionados, setSelecionados] = useState<Set<string>>(
    new Set()
  )
  const [modal, setModal] = useState<ModalConfirmacao | null>(null)
  const [processando, setProcessando] = useState(false)

  const fetchProdutos = useCallback(async () => {
    setLoading(true)
    setErroCarregamento(null)

    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao consultar produtos:', error)
        setErroCarregamento(
          'Não foi possível carregar os produtos. Tente novamente.'
        )
        return
      }

      setTodosOsProdutos((data as Produto[] | null) ?? [])
    } catch (error) {
      console.error('Erro inesperado ao carregar produtos:', error)

      setErroCarregamento(
        'Ocorreu um erro inesperado ao carregar os produtos.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProdutos()
  }, [fetchProdutos])

  useEffect(() => {
    setPagina(0)
    setSelecionados(new Set())
  }, [filtro, filtroCategoria, filtroStatus, ordenacao])

  const produtosAtivos = useMemo(
    () =>
      todosOsProdutos.filter((produto) => produto.ativo !== false),
    [todosOsProdutos]
  )

  const estatisticas = useMemo(() => {
    const zerados = produtosAtivos.filter(
      (produto) =>
        normalizarNumero(produto.quantidade_atual) <= 0
    ).length

    const abaixoMinimo = produtosAtivos.filter((produto) => {
      const atual = Math.max(
        normalizarNumero(produto.quantidade_atual),
        0
      )

      const minimo = Math.max(
        normalizarNumero(produto.quantidade_minima),
        0
      )

      return atual > 0 && minimo > 0 && atual < minimo
    }).length

    const semMinimo = produtosAtivos.filter(
      (produto) =>
        normalizarNumero(produto.quantidade_minima) <= 0
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
    const categoriasUnicas = new Set<string>()

    todosOsProdutos.forEach((produto) => {
      const categoria = produto.categoria?.trim()

      if (categoria) {
        categoriasUnicas.add(categoria)
      }
    })

    return Array.from(categoriasUnicas).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', {
        sensitivity: 'base',
      })
    )
  }, [todosOsProdutos])

  const produtosFiltrados = useMemo(() => {
    const termo = normalizarTexto(filtro)

    return todosOsProdutos
      .filter((produto) => {
        if (!termo) {
          return true
        }

        const conteudoBusca = normalizarTexto(
          [
            produto.nome,
            produto.sku,
            produto.categoria,
            produto.marca,
          ]
            .filter(Boolean)
            .join(' ')
        )

        return conteudoBusca.includes(termo)
      })
      .filter((produto) => {
        if (!filtroCategoria) {
          return true
        }

        return produto.categoria === filtroCategoria
      })
      .filter((produto) => {
        if (filtroStatus === 'todos') {
          return true
        }

        return classificarEstoque(produto).tipo === filtroStatus
      })
      .sort(ORDENACOES[ordenacao])
  }, [
    todosOsProdutos,
    filtro,
    filtroCategoria,
    filtroStatus,
    ordenacao,
  ])

  const totalProdutosFiltrados = produtosFiltrados.length

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalProdutosFiltrados / POR_PAGINA)
  )

  const produtosDaPagina = useMemo(() => {
    const inicio = pagina * POR_PAGINA
    const fim = inicio + POR_PAGINA

    return produtosFiltrados.slice(inicio, fim)
  }, [pagina, produtosFiltrados])

  useEffect(() => {
    if (pagina > totalPaginas - 1) {
      setPagina(Math.max(totalPaginas - 1, 0))
    }
  }, [pagina, totalPaginas])

  const todosDaPaginaSelecionados =
    produtosDaPagina.length > 0 &&
    produtosDaPagina.every((produto) =>
      selecionados.has(produto.id)
    )

  const limparFiltros = () => {
    setFiltro('')
    setFiltroStatus('todos')
    setFiltroCategoria(null)
    setOrdenacao('nome_asc')
  }

  const temFiltrosAtivos =
    Boolean(filtro.trim()) ||
    filtroStatus !== 'todos' ||
    Boolean(filtroCategoria)

  const toggleSelecao = (id: string) => {
    setSelecionados((selecionadosAtuais) => {
      const novaSelecao = new Set(selecionadosAtuais)

      if (novaSelecao.has(id)) {
        novaSelecao.delete(id)
      } else {
        novaSelecao.add(id)
      }

      return novaSelecao
    })
  }

  const toggleSelecionarPagina = () => {
    setSelecionados((selecionadosAtuais) => {
      const novaSelecao = new Set(selecionadosAtuais)

      if (todosDaPaginaSelecionados) {
        produtosDaPagina.forEach((produto) => {
          novaSelecao.delete(produto.id)
        })
      } else {
        produtosDaPagina.forEach((produto) => {
          novaSelecao.add(produto.id)
        })
      }

      return novaSelecao
    })
  }

  const toggleAtivo = async (produto: Produto) => {
    const novoEstado = produto.ativo === false

    try {
      const { error } = await supabase
        .from('produtos')
        .update({ ativo: novoEstado })
        .eq('id', produto.id)

      if (error) {
        console.error('Erro ao atualizar produto:', error)
        addNotification('Não foi possível atualizar o produto', 'error')
        return
      }

      setTodosOsProdutos((produtosAtuais) =>
        produtosAtuais.map((item) =>
          item.id === produto.id
            ? {
                ...item,
                ativo: novoEstado,
              }
            : item
        )
      )

      setSelecionados((selecionadosAtuais) => {
        const novaSelecao = new Set(selecionadosAtuais)
        novaSelecao.delete(produto.id)
        return novaSelecao
      })

      addNotification(
        `${produto.nome} foi ${
          novoEstado ? 'ativado' : 'desativado'
        }.`,
        'success',
        2500
      )
    } catch (error) {
      console.error('Erro inesperado ao atualizar produto:', error)
      addNotification('Erro ao atualizar produto', 'error')
    }
  }

  const handleDelete = (produto: Produto) => {
    setModal({
      titulo: 'Excluir produto?',
      descricao: `"${produto.nome}" será removido permanentemente. Esta ação não pode ser desfeita.`,
      textoBotao: 'Excluir produto',
      cor: 'red',
      onConfirmar: async () => {
        setProcessando(true)

        try {
          const { error } = await supabase
            .from('produtos')
            .delete()
            .eq('id', produto.id)

          if (error) {
            console.error('Erro ao excluir produto:', error)
            addNotification(
              'Não foi possível excluir o produto. Verifique se existem registros relacionados.',
              'error',
              5000
            )
            return
          }

          setTodosOsProdutos((produtosAtuais) =>
            produtosAtuais.filter(
              (item) => item.id !== produto.id
            )
          )

          setSelecionados((selecionadosAtuais) => {
            const novaSelecao = new Set(selecionadosAtuais)
            novaSelecao.delete(produto.id)
            return novaSelecao
          })

          setModal(null)

          addNotification(
            `${produto.nome} foi excluído.`,
            'success',
            2500
          )
        } catch (error) {
          console.error('Erro inesperado ao excluir produto:', error)
          addNotification('Erro ao excluir produto', 'error')
        } finally {
          setProcessando(false)
        }
      },
    })
  }

  const handleDeletarSelecionados = () => {
    const idsSelecionados = Array.from(selecionados)

    if (idsSelecionados.length === 0) {
      return
    }

    setModal({
      titulo: `Excluir ${idsSelecionados.length} produto(s)?`,
      descricao:
        'Os produtos selecionados serão removidos permanentemente. Esta ação não pode ser desfeita.',
      textoBotao: 'Excluir selecionados',
      cor: 'red',
      onConfirmar: async () => {
        setProcessando(true)

        try {
          const { error } = await supabase
            .from('produtos')
            .delete()
            .in('id', idsSelecionados)

          if (error) {
            console.error(
              'Erro ao excluir produtos selecionados:',
              error
            )

            addNotification(
              'Não foi possível excluir os produtos selecionados.',
              'error'
            )
            return
          }

          setTodosOsProdutos((produtosAtuais) =>
            produtosAtuais.filter(
              (produto) => !selecionados.has(produto.id)
            )
          )

          setSelecionados(new Set())
          setModal(null)

          addNotification(
            `${idsSelecionados.length} produto(s) excluído(s).`,
            'success',
            2500
          )
        } catch (error) {
          console.error(
            'Erro inesperado na exclusão múltipla:',
            error
          )

          addNotification(
            'Erro ao excluir os produtos selecionados',
            'error'
          )
        } finally {
          setProcessando(false)
        }
      },
    })
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-clip pb-8">
      <PageHeader
        eyebrow="GESTÃO DE ESTOQUE"
        title="Produtos"
        description="Organize o catálogo e acompanhe quantidades, custos e disponibilidade."
        icon={Package}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link
              href="/dashboard/produtos/importar"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <FileSpreadsheet
                aria-hidden="true"
                className="h-4 w-4"
              />
              Importar CSV
            </Link>

            <Link
              href="/dashboard/produtos/novo"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Novo produto
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
              onClick={fetchProdutos}
              className="mt-2 text-xs font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      <section aria-label="Indicadores dos produtos">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard
            label="Produtos ativos"
            valor={estatisticas.ativos}
            icon={Boxes}
            cor="blue"
            descricao={`${estatisticas.inativos} inativo(s)`}
          />

          <KPICard
            label="Valor do estoque a custo"
            valor={formatarMoeda(
              estatisticas.valorEstoqueCusto
            )}
            icon={CircleDollarSign}
            cor="emerald"
            descricao="Capital registrado pelo preço de custo"
          />

          <KPICard
            label="Produtos zerados"
            valor={estatisticas.zerados}
            icon={
              estatisticas.zerados > 0
                ? PackageX
                : PackageCheck
            }
            cor={estatisticas.zerados > 0 ? 'red' : 'green'}
            destaque={estatisticas.zerados > 0}
          />

          <KPICard
            label="Abaixo do mínimo"
            valor={estatisticas.abaixoMinimo}
            icon={TrendingDown}
            cor={
              estatisticas.abaixoMinimo > 0
                ? 'amber'
                : 'green'
            }
            destaque={estatisticas.abaixoMinimo > 0}
          />
        </div>
      </section>

      {estatisticas.semCusto > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          O valor do estoque considera apenas produtos com preço de
          custo informado.{' '}
          <strong>{estatisticas.semCusto} produto(s)</strong> ainda
          não possuem custo cadastrado.
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
              placeholder="Buscar por nome, SKU, marca ou categoria..."
              value={filtro}
              onChange={(event) => setFiltro(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            {filtro && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setFiltro('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative min-w-0 sm:min-w-[190px]">
            <ArrowUpDown
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            />

            <select
              aria-label="Ordenar produtos"
              value={ordenacao}
              onChange={(event) =>
                setOrdenacao(event.target.value as Ordenacao)
              }
              className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-8 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
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

          <div className="flex flex-shrink-0 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <button
              type="button"
              aria-label="Visualização em tabela"
              aria-pressed={visualizacao === 'tabela'}
              onClick={() => setVisualizacao('tabela')}
              className={`flex flex-1 items-center justify-center rounded-md p-2 transition-colors sm:flex-none ${
                visualizacao === 'tabela'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <List aria-hidden="true" className="h-4 w-4" />
            </button>

            <button
              type="button"
              aria-label="Visualização em grade"
              aria-pressed={visualizacao === 'grid'}
              onClick={() => setVisualizacao('grid')}
              className={`flex flex-1 items-center justify-center rounded-md p-2 transition-colors sm:flex-none ${
                visualizacao === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid
                aria-hidden="true"
                className="h-4 w-4"
              />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          {[
            {
              id: 'todos' as const,
              label: 'Todos',
              count: todosOsProdutos.length,
            },
            {
              id: 'critico' as const,
              label: 'Zerados',
              count: estatisticas.zerados,
            },
            {
              id: 'baixo' as const,
              label: 'Baixo',
              count: estatisticas.abaixoMinimo,
            },
            {
              id: 'normal' as const,
              label: 'Normal',
              count: estatisticas.normais,
            },
            {
              id: 'sem_minimo' as const,
              label: 'Sem mínimo',
              count: estatisticas.semMinimo,
            },
            {
              id: 'inativo' as const,
              label: 'Inativos',
              count: estatisticas.inativos,
            },
          ].map(({ id, label, count }) => (
            <button
              type="button"
              key={id}
              onClick={() => setFiltroStatus(id)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtroStatus === id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {label}

              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filtroStatus === id
                    ? 'bg-white/20'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                {count}
              </span>
            </button>
          ))}

          {temFiltrosAtivos && (
            <button
              type="button"
              onClick={limparFiltros}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
              Limpar filtros
            </button>
          )}
        </div>

        {categorias.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setFiltroCategoria(null)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                !filtroCategoria
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              Todas as categorias
            </button>

            {categorias.map((categoria) => (
              <button
                type="button"
                key={categoria}
                onClick={() =>
                  setFiltroCategoria((categoriaAtual) =>
                    categoriaAtual === categoria ? null : categoria
                  )
                }
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  filtroCategoria === categoria
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <Tag aria-hidden="true" className="h-3 w-3" />
                {categoria}
              </button>
            ))}
          </div>
        )}
      </section>

      {selecionados.size > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2
              aria-hidden="true"
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
            />

            <span className="font-semibold text-blue-900 dark:text-blue-100">
              {selecionados.size} produto(s) selecionado(s)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDeletarSelecionados}
              disabled={processando}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2
                aria-hidden="true"
                className="h-3.5 w-3.5"
              />
              Excluir
            </button>

            <button
              type="button"
              onClick={() => setSelecionados(new Set())}
              disabled={processando}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-white/60 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-900/30"
            >
              Cancelar seleção
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : produtosDaPagina.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
          <Package
            aria-hidden="true"
            className="mx-auto mb-4 h-14 w-14 text-gray-300 dark:text-gray-700"
          />

          <h2 className="font-bold text-gray-900 dark:text-white">
            {temFiltrosAtivos
              ? 'Nenhum produto encontrado'
              : 'Nenhum produto cadastrado'}
          </h2>

          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {temFiltrosAtivos
              ? 'Tente limpar ou alterar os filtros utilizados.'
              : 'Cadastre o primeiro produto para começar a organizar o estoque.'}
          </p>

          {temFiltrosAtivos ? (
            <button
              type="button"
              onClick={limparFiltros}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              Limpar filtros
            </button>
          ) : (
            <Link
              href="/dashboard/produtos/novo"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Cadastrar produto
            </Link>
          )}
        </div>
      ) : visualizacao === 'tabela' ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                  <th className="w-12 px-4 py-3">
                    <BotaoSelecao
                      selecionado={todosDaPaginaSelecionados}
                      onClick={toggleSelecionarPagina}
                      label={
                        todosDaPaginaSelecionados
                          ? 'Desmarcar produtos da página'
                          : 'Selecionar produtos da página'
                      }
                    />
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    Produto
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    Categoria
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    Estoque
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                    Custo
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                    Venda
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {produtosDaPagina.map((produto) => {
                  const status = classificarEstoque(produto)
                  const selecionado = selecionados.has(produto.id)
                  const porcentagem =
                    calcularPorcentagemEstoque(produto)
                  const margem = calcularMargem(produto)

                  return (
                    <tr
                      key={produto.id}
                      className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${
                        selecionado
                          ? 'bg-blue-50/70 dark:bg-blue-900/10'
                          : ''
                      } ${
                        produto.ativo === false ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <BotaoSelecao
                          selecionado={selecionado}
                          onClick={() => toggleSelecao(produto.id)}
                          label={
                            selecionado
                              ? `Desmarcar ${produto.nome}`
                              : `Selecionar ${produto.nome}`
                          }
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                            <Package
                              aria-hidden="true"
                              className="h-5 w-5 text-gray-500 dark:text-gray-400"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[260px] truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {produto.nome}
                            </p>

                            <p className="mt-0.5 max-w-[260px] truncate text-[11px] text-gray-500 dark:text-gray-400">
                              SKU: {produto.sku || 'Não informado'}
                              {produto.marca
                                ? ` · ${produto.marca}`
                                : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {produto.categoria ? (
                          <span className="inline-flex max-w-[150px] truncate rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            {produto.categoria}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Sem categoria
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="min-w-[130px]">
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                            <span className={status.textColor}>
                              <strong>
                                {normalizarNumero(
                                  produto.quantidade_atual
                                )}
                              </strong>{' '}
                              un
                            </span>

                            <span className="text-gray-400">
                              Mín.{' '}
                              {normalizarNumero(
                                produto.quantidade_minima
                              )}
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className={`h-full rounded-full ${status.progress}`}
                              style={{
                                width: `${porcentagem}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        {normalizarNumero(produto.preco_custo) >
                        0 ? (
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {formatarMoeda(
                              normalizarNumero(
                                produto.preco_custo
                              )
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            Não informado
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatarMoeda(
                            normalizarNumero(
                              produto.preco_venda
                            )
                          )}
                        </p>

                        {margem !== null && (
                          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                            Margem {margem.toFixed(1)}%
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${status.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                          />
                          {status.label}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggleAtivo(produto)}
                            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                            aria-label={
                              produto.ativo === false
                                ? `Ativar ${produto.nome}`
                                : `Desativar ${produto.nome}`
                            }
                            title={
                              produto.ativo === false
                                ? 'Ativar'
                                : 'Desativar'
                            }
                          >
                            {produto.ativo === false ? (
                              <EyeOff
                                aria-hidden="true"
                                className="h-4 w-4"
                              />
                            ) : (
                              <Eye
                                aria-hidden="true"
                                className="h-4 w-4"
                              />
                            )}
                          </button>

                          <Link
                            href="/dashboard/produtos/novo"
                            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                            aria-label={`Editar ${produto.nome}`}
                            title="Editar"
                          >
                            <Edit2
                              aria-hidden="true"
                              className="h-4 w-4"
                            />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(produto)}
                            className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                            aria-label={`Excluir ${produto.nome}`}
                            title="Excluir"
                          >
                            <Trash2
                              aria-hidden="true"
                              className="h-4 w-4"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800 lg:hidden">
            {produtosDaPagina.map((produto) => {
              const status = classificarEstoque(produto)
              const selecionado = selecionados.has(produto.id)

              return (
                <article
                  key={produto.id}
                  className={`p-4 ${
                    selecionado
                      ? 'bg-blue-50/70 dark:bg-blue-900/10'
                      : ''
                  } ${
                    produto.ativo === false ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <BotaoSelecao
                      selecionado={selecionado}
                      onClick={() => toggleSelecao(produto.id)}
                      label={
                        selecionado
                          ? `Desmarcar ${produto.nome}`
                          : `Selecionar ${produto.nome}`
                      }
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="break-words text-sm font-bold text-gray-900 dark:text-white">
                            {produto.nome}
                          </h2>

                          <p className="mt-0.5 break-words text-[11px] text-gray-500 dark:text-gray-400">
                            {produto.sku || 'Sem SKU'}
                            {produto.categoria
                              ? ` · ${produto.categoria}`
                              : ''}
                          </p>
                        </div>

                        <span
                          className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${status.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                          />
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                        <div>
                          <p className="text-[10px] uppercase text-gray-400">
                            Estoque
                          </p>

                          <p
                            className={`mt-0.5 text-sm font-bold ${status.textColor}`}
                          >
                            {normalizarNumero(
                              produto.quantidade_atual
                            )}{' '}
                            un
                          </p>

                          <p className="text-[10px] text-gray-400">
                            Mín.{' '}
                            {normalizarNumero(
                              produto.quantidade_minima
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase text-gray-400">
                            Custo
                          </p>

                          <p className="mt-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {normalizarNumero(
                              produto.preco_custo
                            ) > 0
                              ? formatarMoeda(
                                  normalizarNumero(
                                    produto.preco_custo
                                  )
                                )
                              : 'Não informado'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase text-gray-400">
                            Venda
                          </p>

                          <p className="mt-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {formatarMoeda(
                              normalizarNumero(
                                produto.preco_venda
                              )
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAtivo(produto)}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {produto.ativo === false ? (
                            <>
                              <EyeOff
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                              />
                              Ativar
                            </>
                          ) : (
                            <>
                              <Eye
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                              />
                              Desativar
                            </>
                          )}
                        </button>

                        <Link
                          href="/dashboard/produtos/novo"
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          <Edit2
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                          />
                          Editar
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(produto)}
                          aria-label={`Excluir ${produto.nome}`}
                          className="inline-flex items-center justify-center rounded-lg bg-red-100 px-3 py-2 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        >
                          <Trash2
                            aria-hidden="true"
                            className="h-4 w-4"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {produtosDaPagina.map((produto) => {
            const status = classificarEstoque(produto)
            const selecionado = selecionados.has(produto.id)
            const margem = calcularMargem(produto)

            return (
              <article
                key={produto.id}
                className={`min-w-0 rounded-xl border bg-white p-4 dark:bg-gray-900 ${
                  selecionado
                    ? 'border-blue-400 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/10'
                    : 'border-gray-200 dark:border-gray-800'
                } ${
                  produto.ativo === false ? 'opacity-60' : ''
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Package
                      aria-hidden="true"
                      className="h-5 w-5 text-gray-500 dark:text-gray-400"
                    />
                  </div>

                  <BotaoSelecao
                    selecionado={selecionado}
                    onClick={() => toggleSelecao(produto.id)}
                    label={
                      selecionado
                        ? `Desmarcar ${produto.nome}`
                        : `Selecionar ${produto.nome}`
                    }
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-gray-900 dark:text-white">
                    {produto.nome}
                  </h2>

                  <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {produto.sku || 'Sem SKU'}
                    {produto.categoria
                      ? ` · ${produto.categoria}`
                      : ''}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${status.badge}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                    />
                    {status.label}
                  </span>

                  <span className={`text-sm font-bold ${status.textColor}`}>
                    {normalizarNumero(produto.quantidade_atual)} un
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                  <div>
                    <p className="text-[10px] uppercase text-gray-400">
                      Custo
                    </p>

                    <p className="mt-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {normalizarNumero(produto.preco_custo) > 0
                        ? formatarMoeda(
                            normalizarNumero(
                              produto.preco_custo
                            )
                          )
                        : 'Não informado'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase text-gray-400">
                      Venda
                    </p>

                    <p className="mt-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {formatarMoeda(
                        normalizarNumero(produto.preco_venda)
                      )}
                    </p>

                    {margem !== null && (
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        Margem {margem.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => toggleAtivo(produto)}
                    aria-label={
                      produto.ativo === false
                        ? `Ativar ${produto.nome}`
                        : `Desativar ${produto.nome}`
                    }
                    className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 py-2 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {produto.ativo === false ? (
                      <EyeOff
                        aria-hidden="true"
                        className="h-4 w-4"
                      />
                    ) : (
                      <Eye
                        aria-hidden="true"
                        className="h-4 w-4"
                      />
                    )}
                  </button>

                  <Link
                    href="/dashboard/produtos/novo"
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <Edit2
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                    />
                    Editar
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(produto)}
                    aria-label={`Excluir ${produto.nome}`}
                    className="inline-flex items-center justify-center rounded-lg bg-red-100 px-3 py-2 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  >
                    <Trash2
                      aria-hidden="true"
                      className="h-4 w-4"
                    />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {totalProdutosFiltrados > 0 && (
        <footer className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando{' '}
            <strong className="text-gray-900 dark:text-white">
              {pagina * POR_PAGINA + 1}
            </strong>{' '}
            até{' '}
            <strong className="text-gray-900 dark:text-white">
              {Math.min(
                (pagina + 1) * POR_PAGINA,
                totalProdutosFiltrados
              )}
            </strong>{' '}
            de{' '}
            <strong className="text-gray-900 dark:text-white">
              {totalProdutosFiltrados}
            </strong>{' '}
            produto(s)
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setPagina((paginaAtual) =>
                  Math.max(0, paginaAtual - 1)
                )
              }
              disabled={pagina === 0}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:flex-none"
            >
              <ChevronLeft
                aria-hidden="true"
                className="h-4 w-4"
              />
              Anterior
            </button>

            <span className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {pagina + 1} de {totalPaginas}
            </span>

            <button
              type="button"
              onClick={() =>
                setPagina((paginaAtual) =>
                  Math.min(totalPaginas - 1, paginaAtual + 1)
                )
              }
              disabled={pagina >= totalPaginas - 1}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:flex-none"
            >
              Próxima
              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4"
              />
            </button>
          </div>
        </footer>
      )}

      <ModalConfirmacaoComp
        modal={modal}
        processando={processando}
        onFechar={() => {
          if (!processando) {
            setModal(null)
          }
        }}
      />
    </div>
  )
}