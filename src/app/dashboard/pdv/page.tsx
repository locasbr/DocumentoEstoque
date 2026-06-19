// src/app/dashboard/pdv/page.tsx
"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Produto } from '@/lib/types'
import Alert from '@/components/alerts'
import CupomImpressao from '@/components/cupom-impressao'
import BarcodeScanner from '@/components/barcode-scanner'
import { buscarProdutoPorBarcode } from '@/lib/barcode-api'
import { useCupom } from '@/hooks/useCupom'
import { useNotification } from '@/contexts/NotificationContext'
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Banknote,
  QrCode,
  Camera,
  Usb,
} from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'

interface ItemCarrinho {
  produto_id: string
  quantidade: number
  preco_unitario: number
}

const FORMAS_PAGAMENTO = [
  { label: 'Dinheiro', icon: Banknote, value: 'Dinheiro' },
  { label: 'Pix', icon: QrCode, value: 'Pix' },
  { label: 'Débito', icon: CreditCard, value: 'Cartão Débito' },
  { label: 'Crédito', icon: CreditCard, value: 'Cartão Crédito' },
]

export default function PDVPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [filtro, setFiltro] = useState('')
  const [error, setError] = useState('')
  const [processando, setProcessando] = useState(false)

  // Pagamento
  const [modalPagamento, setModalPagamento] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro')
  const [valorRecebido, setValorRecebido] = useState('')
  const [desconto, setDesconto] = useState('')

  // Scanner e cadastro rápido
  const [scannerAberto, setScannerAberto] = useState(false)
  const [modalCadastroRapido, setModalCadastroRapido] = useState(false)
  const [dadosProdutoAPI, setDadosProdutoAPI] = useState<any>(null)
  const [skuParaCadastro, setSkuParaCadastro] = useState('')

  // USB Scanner
  const [usbDetectado, setUsbDetectado] = useState(false)

  // Estado do cadastro rápido
  const [cadastroNome, setCadastroNome] = useState('')
  const [cadastroMarca, setCadastroMarca] = useState('')
  const [cadastroDescricao, setCadastroDescricao] = useState('')
  const [cadastroCategoria, setCadastroCategoria] = useState('')
  const [cadastroPreco, setCadastroPreco] = useState('')
  const [cadastroQuantidade, setCadastroQuantidade] = useState('1')

  const usbBufferRef = useRef('')
  const usbTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { addNotification } = useNotification()
  const { cupomAberto, dadosCupom, gerarCupom, fecharCupom } = useCupom()

  // ══════════════════════════════════════════════════
  // FETCH PRODUTOS
  // ══════════════════════════════════════════════════

 useEffect(() => {
  fetchProdutos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .gt('quantidade_atual', 0)
        .order('nome')

      if (!error && data) setProdutos(data)
    } catch {
      setError('Erro ao carregar produtos')
      addNotification('Erro ao carregar produtos', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ══════════════════════════════════════════════════
  // CARRINHO
  // ══════════════════════════════════════════════════

  const adicionarAoCarrinho = useCallback(
    (produto: Produto) => {
      setCarrinho((prev) => {
        const itemExistente = prev.find((i) => i.produto_id === produto.id)
        if (itemExistente) {
          if (itemExistente.quantidade < produto.quantidade_atual) {
            addNotification(`➡️ ${produto.nome}`, 'info', 800)
            return prev.map((i) =>
              i.produto_id === produto.id
                ? { ...i, quantidade: i.quantidade + 1 }
                : i
            )
          } else {
            addNotification(`❌ Estoque insuficiente`, 'warning')
            return prev
          }
        } else {
          addNotification(`✅ ${produto.nome}`, 'success', 800)
          return [
            ...prev,
            {
              produto_id: produto.id,
              quantidade: 1,
              preco_unitario: produto.preco_venda,
            },
          ]
        }
      })
    },
    [addNotification]
  )

  const removerDoCarrinho = (produto_id: string) => {
    setCarrinho(carrinho.filter((i) => i.produto_id !== produto_id))
  }

  const atualizarQuantidade = (produto_id: string, nova: number) => {
    if (nova <= 0) {
      removerDoCarrinho(produto_id)
      return
    }
    const produto = produtos.find((p) => p.id === produto_id)
    if (produto && nova <= produto.quantidade_atual) {
      setCarrinho(
        carrinho.map((i) =>
          i.produto_id === produto_id ? { ...i, quantidade: nova } : i
        )
      )
    }
  }

  // ══════════════════════════════════════════════════
  // CÓDIGO DE BARRAS (câmera + USB)
  // ══════════════════════════════════════════════════

  const handleCodigoBarrasLido = useCallback(
    async (codigoBarras: string) => {
      const produtoLocal = produtos.find((p) => p.sku === codigoBarras)
      if (produtoLocal) {
        adicionarAoCarrinho(produtoLocal)
        addNotification(`✅ ${produtoLocal.nome} adicionado`, 'success', 2000)
        return
      }

      addNotification(`🔍 Buscando ${codigoBarras}...`, 'info', 2000)
      const resultadoAPI = await buscarProdutoPorBarcode(codigoBarras)

      if (resultadoAPI.encontrado) {
        setSkuParaCadastro(codigoBarras)
        setDadosProdutoAPI(resultadoAPI)
        setModalCadastroRapido(true)
      } else {
        addNotification(
          `Produto ${codigoBarras} não encontrado na base. Cadastre manualmente.`,
          'warning',
          6000
        )
      }
    },
    [produtos, adicionarAoCarrinho, addNotification]
  )

  // ══════════════════════════════════════════════════
  // LEITOR USB (pistola)
  // ══════════════════════════════════════════════════

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toUpperCase()
      if (
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        activeTag === 'SELECT'
      ) {
        return
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key === 'Enter') {
        const code = usbBufferRef.current.trim()
        if (code.length >= 8) {
          e.preventDefault()
          e.stopPropagation()
          setUsbDetectado(true)
          setTimeout(() => setUsbDetectado(false), 2000)
          if (navigator.vibrate) navigator.vibrate(200)
          handleCodigoBarrasLido(code)
        }
        usbBufferRef.current = ''
        return
      }

      if (e.key.length !== 1) {
        usbBufferRef.current = ''
        return
      }

      usbBufferRef.current += e.key

      if (usbTimeoutRef.current) clearTimeout(usbTimeoutRef.current)
      usbTimeoutRef.current = setTimeout(() => {
        usbBufferRef.current = ''
      }, 100)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      if (usbTimeoutRef.current) clearTimeout(usbTimeoutRef.current)
    }
  }, [handleCodigoBarrasLido])

  // ══════════════════════════════════════════════════
  // CADASTRO RÁPIDO — preenche campos com dados da API
  // ══════════════════════════════════════════════════

  useEffect(() => {
    if (dadosProdutoAPI) {
      setCadastroNome(dadosProdutoAPI.nome || '')
      setCadastroMarca(dadosProdutoAPI.marca || '')
      setCadastroDescricao(dadosProdutoAPI.descricao || '')
      setCadastroCategoria(dadosProdutoAPI.categoria || '')
    }
  }, [dadosProdutoAPI])

  // ══════════════════════════════════════════════════
  // SALVAR PRODUTO RÁPIDO (FIX: usa ID real do banco)
  // ══════════════════════════════════════════════════

  const salvarProdutoRapido = async () => {
    if (
      !cadastroNome.trim() ||
      !cadastroPreco ||
      parseFloat(cadastroPreco) <= 0
    ) {
      addNotification('Nome e preço são obrigatórios', 'error')
      return
    }

    const preco = parseFloat(cadastroPreco)
    const quantidade = parseInt(cadastroQuantidade) || 0

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Usuário não autenticado')

      const { data: novoProduto, error: insertError } = await supabase
        .from('produtos')
        .insert({
          sku: skuParaCadastro,
          nome: cadastroNome,
          marca: cadastroMarca,
          descricao: cadastroDescricao,
          categoria: cadastroCategoria,
          preco_venda: preco,
          quantidade_atual: quantidade,
          imagem_url: dadosProdutoAPI?.imagem_url || '',
          ativo: true,
          usuario_id: userData.user.id,
          quantidade_minima: 10,
          preco_custo: 0,
        })
        .select()
        .single()

      if (insertError) throw insertError

      addNotification(
        `✅ Produto "${cadastroNome}" cadastrado com sucesso!`,
        'success'
      )
      setModalCadastroRapido(false)

      await fetchProdutos()

      if (novoProduto) {
        adicionarAoCarrinho(novoProduto as Produto)
      }
    } catch (err: any) {
      addNotification(`Erro ao cadastrar: ${err.message}`, 'error')
    }
  }

  // ══════════════════════════════════════════════════
  // CÁLCULOS
  // ══════════════════════════════════════════════════

  const totalItens = carrinho.reduce((acc, i) => acc + i.quantidade, 0)
  const subtotal = carrinho.reduce(
    (acc, i) => acc + i.quantidade * i.preco_unitario,
    0
  )
  const descontoVal = parseFloat(desconto) || 0
  const totalPagar = Math.max(0, subtotal - descontoVal)
  const trocoVal =
    formaPagamento === 'Dinheiro' && parseFloat(valorRecebido) > totalPagar
      ? parseFloat(valorRecebido) - totalPagar
      : 0

  // ══════════════════════════════════════════════════
  // PAGAMENTO (FIX: transacional via RPC)
  // ══════════════════════════════════════════════════

  const abrirPagamento = () => {
    if (carrinho.length === 0) {
      addNotification('Carrinho vazio', 'warning')
      return
    }
    setValorRecebido(totalPagar.toFixed(2))
    setModalPagamento(true)
  }

  const processarVenda = async () => {
    setProcessando(true)
    setError('')

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setError('Usuário não autenticado')
        return
      }

      const itensParaVenda = carrinho.map((item) => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
      }))

      const { data: resultado, error: rpcError } = await supabase.rpc(
        'processar_venda',
        {
          p_usuario_id: userData.user.id,
          p_itens: itensParaVenda,
          p_forma_pagamento: formaPagamento,
          p_desconto: descontoVal,
        }
      )

      if (rpcError) {
        console.error('Erro na venda:', rpcError)
        if (rpcError.message.includes('Estoque insuficiente')) {
          setError(rpcError.message)
        } else if (rpcError.message.includes('não encontrado')) {
          setError(
            'Produto não encontrado. Atualize a página e tente novamente.'
          )
        } else {
          setError(
            'Erro ao processar venda. Nenhum item foi alterado. Tente novamente.'
          )
        }
        return
      }

      await gerarCupom({
        itens: resultado.itens,
        desconto: resultado.desconto,
        forma_pagamento: resultado.forma_pagamento,
        valor_recebido: parseFloat(valorRecebido) || undefined,
      })

      addNotification(
        `💰 Venda ${resultado.numero_venda}: ${formatarMoeda(resultado.total)}`,
        'success',
        4000
      )

      setCarrinho([])
      setDesconto('')
      setValorRecebido('')
      setModalPagamento(false)
      setTimeout(fetchProdutos, 800)
    } catch (err) {
      setError('Erro inesperado ao processar venda. Nenhum item foi alterado.')
      console.error(err)
    } finally {
      setProcessando(false)
    }
  }

  // ══════════════════════════════════════════════════
  // FILTRO
  // ══════════════════════════════════════════════════

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      p.sku.toLowerCase().includes(filtro.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(filtro.toLowerCase())
  )

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Carregando...
      </div>
    )

  // ══════════════════════════════════════════════════
  // COMPONENTES INTERNOS
  // ══════════════════════════════════════════════════

  const ProdutoCard = ({ produto }: { produto: Produto }) => {
    const item = carrinho.find((i) => i.produto_id === produto.id)
    return (
      <button
        onClick={() => adicionarAoCarrinho(produto)}
        className={`p-3 rounded-lg border-2 text-left transition transform hover:scale-105 active:scale-95 flex flex-col h-full ${
          item
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }`}
      >
        <div className="flex items-start justify-between w-full">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate dark:text-white">
              {produto.nome}
            </p>
            <p className="text-green-600 dark:text-green-400 font-bold text-base mt-1">
              {formatarMoeda(produto.preco_venda)}
            </p>
          </div>
          {item && (
            <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ml-2 flex-shrink-0">
              {item.quantidade}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-auto pt-1">
          {produto.quantidade_atual} em estoque
        </p>
      </button>
    )
  }

  const ItemCarrinhoCard = ({ item }: { item: ItemCarrinho }) => {
    const produto = produtos.find((p) => p.id === item.produto_id)
    return (
      <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate dark:text-white">
            {produto?.nome}
          </p>
          <button
            onClick={() => removerDoCarrinho(item.produto_id)}
            className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded p-0.5"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              atualizarQuantidade(item.produto_id, item.quantidade - 1)
            }
            className="w-7 h-7 bg-white dark:bg-gray-700 rounded border dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-bold text-sm">
            {item.quantidade}
          </span>
          <button
            onClick={() =>
              atualizarQuantidade(item.produto_id, item.quantidade + 1)
            }
            className="w-7 h-7 bg-white dark:bg-gray-700 rounded border dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <Plus size={14} />
          </button>
        </div>
        <p className="w-20 text-right font-semibold text-sm dark:text-white">
          {formatarMoeda(item.quantidade * item.preco_unitario)}
        </p>
      </div>
    )
  }

  // ══════════════════════════════════════════════════
  // RENDER (DOM UNIFICADO — sem duplicação)
  // ══════════════════════════════════════════════════

  return (
    <div
      className={`p-4 md:p-6 ${carrinho.length > 0 ? 'pb-60 md:pb-6' : ''}`}
    >
      {/* ── INDICADOR USB ── */}
      {usbDetectado && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Usb size={18} /> Código lido via leitor USB!
        </div>
      )}

      {/* ══════════ HEADER RESPONSIVO ══════════ */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            PDV
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ponto de Venda &bull; Leitor USB ativo
          </p>
        </div>
        {/* Desktop: botão com texto */}
        <button
          onClick={() => setScannerAberto(true)}
          className="hidden sm:flex btn-primary items-center gap-2 px-4"
        >
          <Camera size={18} /> Ler código
        </button>
        {/* Mobile: botão só ícone */}
        <button
          onClick={() => setScannerAberto(true)}
          className="sm:hidden btn-primary px-3 py-2"
        >
          <Camera size={18} />
        </button>
      </div>

      {error && <Alert message={error} type="error" />}

      {/* ══════════ BUSCA (única) ══════════ */}
      <input
        type="text"
        placeholder="Buscar produto por nome, SKU ou categoria..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full mb-4"
        autoFocus
      />

      {/* ══════════ LAYOUT PRINCIPAL ══════════ */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* ── GRID DE PRODUTOS (único) ── */}
        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {produtosFiltrados.map((p) => (
              <ProdutoCard key={p.id} produto={p} />
            ))}
          </div>
        </div>

        {/* ── CARRINHO DESKTOP (sidebar, só md+) ── */}
        <div className="hidden md:block w-72 lg:w-80 flex-shrink-0">
          <div className="sticky top-20 card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg dark:text-white">Carrinho</h3>
              {carrinho.length > 0 && (
                <span className="badge-info text-xs">{totalItens} un</span>
              )}
            </div>

            {carrinho.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ShoppingCart
                  size={32}
                  className="mx-auto mb-2 opacity-50"
                />
                <p className="text-sm">Carrinho vazio</p>
              </div>
            ) : (
              carrinho.map((i) => (
                <ItemCarrinhoCard key={i.produto_id} item={i} />
              ))
            )}

            {carrinho.length > 0 && (
              <>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Desconto (R$)
                    </span>
                    <input
                      type="number"
                      value={desconto}
                      onChange={(e) => setDesconto(e.target.value)}
                      className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full text-sm"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatarMoeda(subtotal)}</span>
                  </div>
                  {descontoVal > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Desconto</span>
                      <span>-{formatarMoeda(descontoVal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2 dark:border-gray-700">
                    <span>Total</span>
                    <span>{formatarMoeda(totalPagar)}</span>
                  </div>
                </div>
                <button
                  onClick={abrirPagamento}
                  className="btn-primary w-full py-3 font-bold"
                >
                  Finalizar Venda
                </button>
                <button
                  onClick={() => setCarrinho([])}
                  className="btn-secondary w-full py-2 text-sm"
                >
                  Limpar carrinho
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ CARRINHO MOBILE (bottom bar) ══════════ */}
      {carrinho.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-2xl z-40">
          {/* Lista de itens (scrollável) */}
          <div className="max-h-40 overflow-y-auto px-3 pt-3 space-y-2">
            {carrinho.map((item) => {
              const produto = produtos.find((p) => p.id === item.produto_id)
              return (
                <div
                  key={item.produto_id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium truncate flex-1 mr-2">
                    {produto?.nome}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        atualizarQuantidade(
                          item.produto_id,
                          item.quantidade - 1
                        )
                      }
                      className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center font-bold text-xs">
                      {item.quantidade}
                    </span>
                    <button
                      onClick={() =>
                        atualizarQuantidade(
                          item.produto_id,
                          item.quantidade + 1
                        )
                      }
                      className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="font-semibold ml-2 w-20 text-right">
                    {formatarMoeda(item.quantidade * item.preco_unitario)}
                  </span>
                  <button
                    onClick={() => removerDoCarrinho(item.produto_id)}
                    className="text-red-400 ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Total + ações */}
          <div className="px-3 py-3 border-t dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">
                {carrinho.length} produto(s) · {totalItens} un
              </span>
              <span className="font-bold text-lg">
                {formatarMoeda(totalPagar)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCarrinho([])}
                className="btn-secondary py-2.5 px-4 text-sm"
              >
                Limpar
              </button>
              <button
                onClick={abrirPagamento}
                className="btn-primary flex-1 py-2.5 font-bold"
              >
                Vender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL DE PAGAMENTO ══════════ */}
      {modalPagamento && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold dark:text-white">
                Finalizar Venda
              </h3>
              <button
                onClick={() => setModalPagamento(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex justify-between text-sm">
              <span>{totalItens} item(ns)</span>
              <span>{formatarMoeda(subtotal)}</span>
            </div>
            {descontoVal > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Desconto</span>
                <span>-{formatarMoeda(descontoVal)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl border-t dark:border-gray-700 pt-2">
              <span>Total</span>
              <span>{formatarMoeda(totalPagar)}</span>
            </div>

            <div>
              <p className="text-sm font-medium mb-2 dark:text-gray-300">
                Forma de pagamento
              </p>
              <div className="grid grid-cols-4 gap-2">
                {FORMAS_PAGAMENTO.map(({ label, icon: Icon, value }) => (
                  <button
                    key={value}
                    onClick={() => setFormaPagamento(value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-medium transition ${
                      formaPagamento === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {formaPagamento === 'Dinheiro' && (
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-gray-300">
                  Valor recebido (R$)
                </label>
                <input
                  type="number"
                  value={valorRecebido}
                  onChange={(e) => setValorRecebido(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full text-lg font-bold"
                />
                {trocoVal > 0 && (
                  <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                    <span className="text-green-700 dark:text-green-400 font-medium">
                      Troco
                    </span>
                    <span className="text-green-700 dark:text-green-400 font-bold text-lg">
                      {formatarMoeda(trocoVal)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={processarVenda}
              disabled={processando}
              className="btn-primary w-full py-4 font-bold text-lg disabled:opacity-50"
            >
              {processando
                ? 'Processando...'
                : `Confirmar • ${formatarMoeda(totalPagar)}`}
            </button>
          </div>
        </div>
      )}

      {/* ══════════ MODAL DE CADASTRO RÁPIDO ══════════ */}
      {modalCadastroRapido && dadosProdutoAPI && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold dark:text-white">
                Cadastrar novo produto
              </h4>
              <button
                onClick={() => setModalCadastroRapido(false)}
                className="text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Produto encontrado na base externa. Confirme os dados e ajuste o
              necessário.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  SKU (código)
                </label>
                <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                  {skuParaCadastro}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Nome *
                </label>
                <input
                  value={cadastroNome}
                  onChange={(e) => setCadastroNome(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Marca
                </label>
                <input
                  value={cadastroMarca}
                  onChange={(e) => setCadastroMarca(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Descrição
                </label>
                <textarea
                  value={cadastroDescricao}
                  onChange={(e) => setCadastroDescricao(e.target.value)}
                  className="input-field w-full"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Categoria
                </label>
                <input
                  value={cadastroCategoria}
                  onChange={(e) => setCadastroCategoria(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Preço de venda *
                </label>
                <input
                  type="number"
                  value={cadastroPreco}
                  onChange={(e) => setCadastroPreco(e.target.value)}
                  className="input-field w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Quantidade inicial
                </label>
                <input
                  type="number"
                  value={cadastroQuantidade}
                  onChange={(e) => setCadastroQuantidade(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              {dadosProdutoAPI.imagem_url && (
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Imagem
                  </label>
                  <Image
                    src={dadosProdutoAPI.imagem_url}
                    alt=""
                    width={96}
                    height={96}
                    className="w-24 h-24 object-contain rounded"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={salvarProdutoRapido}
                className="btn-primary flex-1"
              >
                Salvar e usar
              </button>
              <button
                onClick={() => setModalCadastroRapido(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ SCANNER ══════════ */}
      {scannerAberto && (
        <BarcodeScanner
          onDetected={handleCodigoBarrasLido}
          onClose={() => setScannerAberto(false)}
        />
      )}

      {/* ══════════ CUPOM ══════════ */}
      {cupomAberto && dadosCupom && (
        <CupomImpressao dados={dadosCupom} onFechar={fecharCupom} />
      )}
    </div>
  )
}