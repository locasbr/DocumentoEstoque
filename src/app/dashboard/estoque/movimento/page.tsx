'use client'

import { Suspense, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Produto } from '@/lib/types'
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Search,
  Package,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  Loader2,
  Zap,
  TrendingDown,
  Boxes,
} from 'lucide-react'
import { useNotification } from '@/contexts/NotificationContext'

// 🆕 Motivos rápidos pré-definidos
const MOTIVOS_RAPIDOS = {
  entrada: [
    { label: '📦 Compra de fornecedor', valor: 'Compra de fornecedor' },
    { label: '🔄 Devolução de cliente', valor: 'Devolução de cliente' },
    { label: '🎁 Brinde/Doação', valor: 'Brinde recebido' },
    { label: '📋 Ajuste de inventário', valor: 'Ajuste de inventário' },
  ],
  saida: [
    { label: '💔 Produto vencido', valor: 'Produto vencido' },
    { label: '📦 Perda/Quebra', valor: 'Perda ou quebra' },
    { label: '🎁 Uso interno', valor: 'Uso interno' },
    { label: '📋 Ajuste de inventário', valor: 'Ajuste de inventário' },
  ],
}

function NovoMovimentoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addNotification } = useNotification()

  const [loading, setLoading] = useState(false)
  const [loadingProdutos, setLoadingProdutos] = useState(true)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [showModal, setShowModal] = useState(false)
  const [resultado, setResultado] = useState<{
    nome: string
    novaQtd: number
    tipo: 'entrada' | 'saida'
  } | null>(null)

  // Estados do form
  const [produtoBuscaQuery, setProdutoBuscaQuery] = useState('')
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('')
  const [mostrarLista, setMostrarLista] = useState(false)
  const [tipoMovimento, setTipoMovimento] = useState<'entrada' | 'saida'>('entrada')
  const [quantidade, setQuantidade] = useState(0)
  const [motivo, setMotivo] = useState('')

  const buscaInputRef = useRef<HTMLInputElement>(null)
  const quantidadeInputRef = useRef<HTMLInputElement>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  // ────────────────────────────────────────────────
  // 📡 FETCH PRODUTOS
  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const { data, error } = await supabase
          .from('produtos')
          .select('*')
          .eq('ativo', true)
          .order('nome')

        if (!error && data) {
          setProdutos(data)
        }
      } catch (err) {
        console.error('Error fetching produtos:', err)
        addNotification('Erro ao carregar produtos', 'error')
      } finally {
        setLoadingProdutos(false)
      }
    }

    fetchProdutos()
  }, [addNotification])

  // ────────────────────────────────────────────────
  // 🔗 LÊ PARAMS DA URL
  // ────────────────────────────────────────────────
  useEffect(() => {
    const tipo = searchParams.get('tipo')
    const produtoId = searchParams.get('produto')

    if (tipo === 'entrada' || tipo === 'saida') {
      setTipoMovimento(tipo)
    }

    if (produtoId && produtos.length > 0) {
      const produto = produtos.find((p) => p.id === produtoId)
      if (produto) {
        setProdutoSelecionadoId(produtoId)
        setProdutoBuscaQuery(produto.nome)
      }
    }
  }, [searchParams, produtos])

  // ────────────────────────────────────────────────
  // ⌨️ ATALHOS DE TECLADO
  // ────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        buscaInputRef.current?.focus()
        buscaInputRef.current?.select()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ────────────────────────────────────────────────
  // 🖱️ FECHA LISTA AO CLICAR FORA
  // ────────────────────────────────────────────────
  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (listaRef.current && !listaRef.current.contains(e.target as Node)) {
        setMostrarLista(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  // ────────────────────────────────────────────────
  // 🔍 FILTRO DE BUSCA
  // ────────────────────────────────────────────────
  const produtosFiltrados = useMemo(() => {
    if (!produtoBuscaQuery.trim()) return produtos.slice(0, 50)
    const termo = produtoBuscaQuery.toLowerCase()
    return produtos
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(termo) ||
          p.sku?.toLowerCase().includes(termo) ||
          p.categoria?.toLowerCase().includes(termo)
      )
      .slice(0, 50)
  }, [produtoBuscaQuery, produtos])

  const produtoSelecionado = useMemo(
    () => produtos.find((p) => p.id === produtoSelecionadoId),
    [produtos, produtoSelecionadoId]
  )

  // ────────────────────────────────────────────────
  // 🧮 CÁLCULOS
  // ────────────────────────────────────────────────
  const maxQuantidade = useMemo(() => {
    if (!produtoSelecionado) return Infinity
    return tipoMovimento === 'saida'
      ? produtoSelecionado.quantidade_atual
      : Infinity
  }, [produtoSelecionado, tipoMovimento])

  const novaQuantidade = useMemo(() => {
    if (!produtoSelecionado) return 0
    return tipoMovimento === 'entrada'
      ? produtoSelecionado.quantidade_atual + quantidade
      : produtoSelecionado.quantidade_atual - quantidade
  }, [produtoSelecionado, tipoMovimento, quantidade])

  const ficaraAbaixoDoMinimo = useMemo(() => {
    if (!produtoSelecionado || tipoMovimento !== 'saida') return false
    return novaQuantidade < produtoSelecionado.quantidade_minima
  }, [produtoSelecionado, tipoMovimento, novaQuantidade])

  const quantidadeParaRepor = useMemo(() => {
    if (!produtoSelecionado) return 0
    return Math.max(
      0,
      produtoSelecionado.quantidade_minima - produtoSelecionado.quantidade_atual
    )
  }, [produtoSelecionado])

  const valorMovimento = useMemo(() => {
    if (!produtoSelecionado || quantidade <= 0) return 0
    return tipoMovimento === 'entrada'
      ? quantidade * (produtoSelecionado.preco_custo || 0)
      : quantidade * (produtoSelecionado.preco_venda || 0)
  }, [produtoSelecionado, tipoMovimento, quantidade])

  const quantidadeInvalida =
    tipoMovimento === 'saida' &&
    produtoSelecionado &&
    quantidade > produtoSelecionado.quantidade_atual

  // ────────────────────────────────────────────────
  // 🎯 SELECIONAR PRODUTO
  // ────────────────────────────────────────────────
  const selecionarProduto = useCallback((produto: Produto) => {
    setProdutoSelecionadoId(produto.id)
    setProdutoBuscaQuery(produto.nome)
    setMostrarLista(false)
    setTimeout(() => quantidadeInputRef.current?.focus(), 100)
  }, [])

  const limparProduto = () => {
    setProdutoSelecionadoId('')
    setProdutoBuscaQuery('')
    setQuantidade(0)
    setTimeout(() => buscaInputRef.current?.focus(), 100)
  }

  // ────────────────────────────────────────────────
  // 💾 SUBMIT
  // ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!produtoSelecionadoId) {
      addNotification('Selecione um produto', 'warning', 3000)
      buscaInputRef.current?.focus()
      return
    }

    if (quantidade <= 0) {
      addNotification('Informe uma quantidade válida', 'warning', 3000)
      quantidadeInputRef.current?.focus()
      return
    }

    if (
      tipoMovimento === 'saida' &&
      produtoSelecionado &&
      quantidade > produtoSelecionado.quantidade_atual
    ) {
      addNotification(
        `Quantidade insuficiente. Disponível: ${produtoSelecionado.quantidade_atual}`,
        'error',
        4000
      )
      return
    }

    setLoading(true)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        addNotification('Usuário não autenticado', 'error')
        return
      }

      // 1. Registra o movimento
      const { error: movimentoError } = await supabase
        .from('movimentos_estoque')
        .insert([
          {
            produto_id: produtoSelecionadoId,
            tipo_movimento: tipoMovimento,
            quantidade,
            motivo,
            usuario_id: userData.user.id,
          },
        ])

      if (movimentoError) {
        addNotification(movimentoError.message, 'error')
        return
      }

      // 2. Atualiza estoque
      if (produtoSelecionado) {
        const { error: updateError } = await supabase
          .from('produtos')
          .update({ quantidade_atual: novaQuantidade })
          .eq('id', produtoSelecionadoId)

        if (updateError) {
          addNotification(
            'Movimento registrado, mas erro ao atualizar quantidade',
            'warning'
          )
          return
        }

        // 3. Cria alerta se necessário
        if (novaQuantidade < produtoSelecionado.quantidade_minima) {
          const tipoAlerta =
            novaQuantidade === 0 ? 'estoque_critico' : 'estoque_baixo'

          await supabase.from('alertas').insert([
            {
              produto_id: produtoSelecionadoId,
              usuario_id: userData.user.id,
              tipo_alerta: tipoAlerta,
              visualizado: false,
            },
          ])
        }

        // 4. Modal de sucesso
        setResultado({
          nome: produtoSelecionado.nome,
          novaQtd: novaQuantidade,
          tipo: tipoMovimento,
        })
        setShowModal(true)

        setTimeout(() => {
          router.push('/dashboard/estoque')
        }, 2500)
      }
    } catch (err) {
      console.error(err)
      addNotification('Erro ao registrar movimento', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ────────────────────────────────────────────────
  // 🎨 LOADING
  // ────────────────────────────────────────────────
  if (loadingProdutos) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────
  // 🎨 RENDER
  // ────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* ══════════ HEADER ══════════ */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/estoque"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition group"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:-translate-x-0.5 transition" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="hidden sm:flex w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Novo Movimento
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Registre entrada ou saída de estoque
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ══════════ TIPO DE MOVIMENTO (TABS GRANDES) ══════════ */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Tipo de movimento
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipoMovimento('entrada')}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                tipoMovimento === 'entrada'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md scale-[1.02]'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tipoMovimento === 'entrada'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
                >
                  <ArrowDown className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p
                    className={`font-bold text-sm ${
                      tipoMovimento === 'entrada'
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Entrada
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Adicionar ao estoque
                  </p>
                </div>
              </div>
              {tipoMovimento === 'entrada' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTipoMovimento('saida')}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                tipoMovimento === 'saida'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md scale-[1.02]'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tipoMovimento === 'saida'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
                >
                  <ArrowUp className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p
                    className={`font-bold text-sm ${
                      tipoMovimento === 'saida'
                        ? 'text-red-900 dark:text-red-100'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Saída
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Retirar do estoque
                  </p>
                </div>
              </div>
              {tipoMovimento === 'saida' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* ══════════ BUSCA DE PRODUTO ══════════ */}
        <div className="relative" ref={listaRef}>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-between">
            <span>Produto *</span>
            <span className="text-[10px] text-gray-400">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono">
                F2
              </kbd>{' '}
              pra buscar
            </span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={buscaInputRef}
              type="text"
              value={produtoBuscaQuery}
              onChange={(e) => {
                setProdutoBuscaQuery(e.target.value)
                setMostrarLista(true)
                if (!e.target.value) setProdutoSelecionadoId('')
              }}
              onFocus={() => setMostrarLista(true)}
              placeholder="Buscar por nome, SKU ou categoria..."
              className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {produtoBuscaQuery && (
              <button
                type="button"
                onClick={limparProduto}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Lista de produtos */}
          {mostrarLista && (
            <div className="absolute z-20 left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-72 overflow-y-auto animate-slideDown">
              {produtosFiltrados.length === 0 ? (
                <div className="p-6 text-center">
                  <Package className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhum produto encontrado
                  </p>
                  <Link
                    href="/dashboard/produtos/novo"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium mt-1 inline-block"
                  >
                    Cadastrar novo produto →
                  </Link>
                </div>
              ) : (
                <div className="py-1">
                  {produtosFiltrados.map((p) => {
                    const isCritico = p.quantidade_atual === 0
                    const isBaixo =
                      p.quantidade_atual > 0 &&
                      p.quantidade_atual < p.quantidade_minima
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selecionarProduto(p)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                              {p.nome}
                            </p>
                            {p.sku && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded font-mono">
                                {p.sku}
                              </span>
                            )}
                          </div>
                          {p.categoria && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {p.categoria}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p
                            className={`text-sm font-bold ${
                              isCritico
                                ? 'text-red-600 dark:text-red-400'
                                : isBaixo
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {p.quantidade_atual}
                          </p>
                          <p className="text-[10px] text-gray-400">em estoque</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Info do produto selecionado */}
          {produtoSelecionado && !mostrarLista && (
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs">
                  <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-600 dark:text-gray-400">Estoque atual:</span>
                  <span
                    className={`font-bold text-sm ${
                      produtoSelecionado.quantidade_atual <
                      produtoSelecionado.quantidade_minima
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {produtoSelecionado.quantidade_atual}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <TrendingDown className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Mínimo:</span>
                  <span className="font-bold text-sm text-gray-700 dark:text-gray-300">
                    {produtoSelecionado.quantidade_minima}
                  </span>
                </div>
                {produtoSelecionado.categoria && (
                  <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
                    {produtoSelecionado.categoria}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══════════ QUANTIDADE ══════════ */}
        {produtoSelecionado && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Quantidade *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantidade(Math.max(0, quantidade - 1))}
                disabled={quantidade <= 0}
                className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
              >
                <Minus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <input
                ref={quantidadeInputRef}
                type="number"
                value={quantidade || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0
                  setQuantidade(Math.max(0, Math.min(val, maxQuantidade)))
                }}
                min="0"
                max={maxQuantidade === Infinity ? undefined : maxQuantidade}
                placeholder="0"
                className={`flex-1 text-center text-2xl font-bold py-3 bg-white dark:bg-gray-900 border-2 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition ${
                  quantidadeInvalida
                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                    : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:border-transparent'
                }`}
              />
              <button
                type="button"
                onClick={() =>
                  setQuantidade(Math.min(maxQuantidade, quantidade + 1))
                }
                disabled={quantidade >= maxQuantidade}
                className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
              >
                <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* Sugestões rápidas */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[1, 5, 10, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setQuantidade(Math.min(maxQuantidade, quantidade + n))
                  }
                  disabled={quantidade + n > maxQuantidade}
                  className="px-3 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-full transition"
                >
                  +{n}
                </button>
              ))}
              {tipoMovimento === 'entrada' && quantidadeParaRepor > 0 && (
                <button
                  type="button"
                  onClick={() => setQuantidade(quantidadeParaRepor)}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 hover:shadow-md text-white rounded-full transition"
                >
                  <Zap className="w-3 h-3" />
                  Repor mínimo ({quantidadeParaRepor})
                </button>
              )}
              {tipoMovimento === 'saida' &&
                produtoSelecionado.quantidade_atual > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setQuantidade(produtoSelecionado.quantidade_atual)
                    }
                    className="px-3 py-1 text-xs font-bold bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-full transition"
                  >
                    Tudo ({produtoSelecionado.quantidade_atual})
                  </button>
                )}
            </div>

            {/* Avisos */}
            {quantidadeInvalida && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 dark:text-red-100">
                    Quantidade insuficiente
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                    Disponível: {produtoSelecionado.quantidade_atual} unidades
                  </p>
                </div>
              </div>
            )}

            {ficaraAbaixoDoMinimo && !quantidadeInvalida && quantidade > 0 && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Estoque ficará abaixo do mínimo
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Sobrará apenas {novaQuantidade} unidades (mínimo:{' '}
                    {produtoSelecionado.quantidade_minima})
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ PREVIEW DO MOVIMENTO ══════════ */}
        {produtoSelecionado && quantidade > 0 && !quantidadeInvalida && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Preview do movimento
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold">
                  Antes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {produtoSelecionado.quantidade_atual}
                </p>
              </div>
              <div className="flex-1 max-w-[100px]">
                <div
                  className={`h-1 rounded-full ${
                    tipoMovimento === 'entrada' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <p
                  className={`text-center text-xs font-bold mt-1 ${
                    tipoMovimento === 'entrada'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {tipoMovimento === 'entrada' ? '+' : '-'}
                  {quantidade}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold">
                  Depois
                </p>
                <p
                  className={`text-2xl font-bold ${
                    novaQuantidade < produtoSelecionado.quantidade_minima
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {novaQuantidade}
                </p>
              </div>
            </div>
            {valorMovimento > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Valor estimado:{' '}
                  <span className="font-bold text-gray-900 dark:text-white">
                    R${' '}
                    {valorMovimento.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* ══════════ MOTIVO ══════════ */}
        {produtoSelecionado && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Motivo <span className="text-gray-400 normal-case font-normal">(opcional)</span>
            </label>

            {/* Chips de motivos rápidos */}
            <div className="flex flex-wrap gap-2 mb-2">
              {MOTIVOS_RAPIDOS[tipoMovimento].map((m) => (
                <button
                  key={m.valor}
                  type="button"
                  onClick={() => setMotivo(m.valor)}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${
                    motivo === m.valor
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Adicione detalhes ou observações..."
              rows={2}
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            />
          </div>
        )}

        {/* ══════════ AÇÕES ══════════ */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Link
            href="/dashboard/estoque"
            className="flex-1 sm:flex-initial text-center py-3 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={
              loading ||
              !produtoSelecionadoId ||
              quantidade <= 0 ||
              !!quantidadeInvalida
            }
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 text-white font-bold rounded-xl transition shadow-lg ${
              tipoMovimento === 'entrada'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/30 shadow-green-500/20'
                : 'bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-red-500/30 shadow-red-500/20'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                {tipoMovimento === 'entrada' ? (
                  <ArrowDown className="w-5 h-5" />
                ) : (
                  <ArrowUp className="w-5 h-5" />
                )}
                Registrar {tipoMovimento === 'entrada' ? 'Entrada' : 'Saída'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* ══════════ MODAL DE SUCESSO ══════════ */}
      {showModal && resultado && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-slideUp">
            <div className="inline-flex w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 items-center justify-center mb-4 shadow-lg shadow-green-500/30">
              <CheckCircle2 className="w-9 h-9 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Movimento registrado! 🎉
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {resultado.tipo === 'entrada' ? 'Entrada' : 'Saída'} de{' '}
              <strong>{resultado.nome}</strong> com sucesso
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Novo estoque:{' '}
                <strong className="text-gray-900 dark:text-white">
                  {resultado.novaQtd} un
                </strong>
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Redirecionando para o estoque...
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}

export default function NovoMovimentoPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
        </div>
      }
    >
      <NovoMovimentoContent />
    </Suspense>
  )
}