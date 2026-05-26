'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getProductImageUrl } from '@/lib/image-utils'
import { Produto } from '@/lib/types'
import Alert from '@/components/alerts'
import CupomImpressao from '@/components/cupom-impressao'
import BarcodeScanner from '@/components/barcode-scanner'
import { useCupom } from '@/hooks/useCupom'
import { useNotification } from '@/contexts/NotificationContext'
import { X, Plus, Minus, ShoppingCart, Check, CreditCard, Banknote, QrCode, Camera } from 'lucide-react'
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
  const [scannerAberto, setScannerAberto] = useState(false)

  // Pagamento
  const [modalPagamento, setModalPagamento] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro')
  const [valorRecebido, setValorRecebido] = useState('')
  const [desconto, setDesconto] = useState('')

  const { addNotification } = useNotification()
  const { cupomAberto, dadosCupom, gerarCupom, fecharCupom } = useCupom()

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

  const handleCodigoBarrasLido = (codigoBarras: string) => {
    const produtoEncontrado = produtos.find((p) => p.sku.toLowerCase() === codigoBarras.toLowerCase())
    
    if (produtoEncontrado) {
      adicionarAoCarrinho(produtoEncontrado)
      addNotification(`✅ ${produtoEncontrado.nome} adicionado via código de barras`, 'success', 2000)
    } else {
      addNotification('❌ Produto não cadastrado', 'warning', 3000)
    }
  }

  const adicionarAoCarrinho = (produto: Produto) => {
    const itemExistente = carrinho.find((i) => i.produto_id === produto.id)
    if (itemExistente) {
      const qtdAtual = carrinho.find((i) => i.produto_id === produto.id)?.quantidade || 0
      if (qtdAtual < produto.quantidade_atual) {
        setCarrinho(carrinho.map((i) =>
          i.produto_id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        ))
        addNotification(`➕ ${produto.nome}`, 'info', 800)
      } else {
        addNotification(`❌ Estoque insuficiente`, 'warning')
      }
    } else {
      setCarrinho([...carrinho, { produto_id: produto.id, quantidade: 1, preco_unitario: produto.preco_venda }])
      addNotification(`✅ ${produto.nome}`, 'success', 800)
    }
  }

  const removerDoCarrinho = (produto_id: string) => {
    setCarrinho(carrinho.filter((i) => i.produto_id !== produto_id))
  }

  const atualizarQuantidade = (produto_id: string, nova: number) => {
    if (nova <= 0) { removerDoCarrinho(produto_id); return }
    const produto = produtos.find((p) => p.id === produto_id)
    if (produto && nova <= produto.quantidade_atual) {
      setCarrinho(carrinho.map((i) => i.produto_id === produto_id ? { ...i, quantidade: nova } : i))
    }
  }

  const totalItens = carrinho.reduce((acc, i) => acc + i.quantidade, 0)
  const subtotal   = carrinho.reduce((acc, i) => acc + i.quantidade * i.preco_unitario, 0)
  const descontoVal = parseFloat(desconto) || 0
  const totalPagar  = Math.max(0, subtotal - descontoVal)
  const trocoVal    = formaPagamento === 'Dinheiro' && parseFloat(valorRecebido) > totalPagar
    ? parseFloat(valorRecebido) - totalPagar : 0

  const abrirPagamento = () => {
    if (carrinho.length === 0) { addNotification('Carrinho vazio', 'warning'); return }
    setValorRecebido(totalPagar.toFixed(2))
    setModalPagamento(true)
  }

  const processarVenda = async () => {
    setProcessando(true)
    setError('')

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { setError('Usuário não autenticado'); return }

      // Registra movimentos e atualiza estoque
      for (const item of carrinho) {
        const produto = produtos.find((p) => p.id === item.produto_id)
        if (!produto) continue

        const { error: movErr } = await supabase.from('movimentos_estoque').insert([{
          produto_id: item.produto_id,
          tipo_movimento: 'saida',
          quantidade: item.quantidade,
          motivo: `PDV - ${formaPagamento} - ${formatarMoeda(item.quantidade * item.preco_unitario)}`,
          usuario_id: userData.user.id,
        }])
        if (movErr) { setError(`Erro ao registrar ${produto.nome}`); return }

        const novaQtd = produto.quantidade_atual - item.quantidade
        await supabase.from('produtos').update({ quantidade_atual: novaQtd }).eq('id', item.produto_id)

        // Alerta automático de estoque baixo
        if (novaQtd < produto.quantidade_minima) {
          await supabase.from('alertas').insert([{
            produto_id: item.produto_id,
            usuario_id: userData.user.id,
            tipo_alerta: novaQtd <= 0 ? 'estoque_critico' : 'estoque_baixo',
            visualizado: false,
          }])
        }
      }

      // Gera o cupom
      await gerarCupom({
        itens: carrinho.map((item) => {
          const produto = produtos.find((p) => p.id === item.produto_id)!
          return {
            nome: produto.nome,
            sku: produto.sku,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.quantidade * item.preco_unitario,
          }
        }),
        desconto: descontoVal,
        forma_pagamento: formaPagamento,
        valor_recebido: parseFloat(valorRecebido) || undefined,
      })

      addNotification(`💰 Venda: ${formatarMoeda(totalPagar)}`, 'success', 4000)
      setCarrinho([])
      setDesconto('')
      setValorRecebido('')
      setModalPagamento(false)
      setTimeout(fetchProdutos, 800)
    } catch (err) {
      setError('Erro ao processar venda')
      console.error(err)
    } finally {
      setProcessando(false)
    }
  }

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    p.sku.toLowerCase().includes(filtro.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(filtro.toLowerCase())
  )

  if (loading) return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Carregando...</div>

  // ─── CARD DE PRODUTO ───────────────────────────────────────────────────────
  const ProdutoCard = ({ produto }: { produto: Produto }) => {
    const item = carrinho.find((i) => i.produto_id === produto.id)
    return (
      <button
        onClick={() => adicionarAoCarrinho(produto)}
        className={`p-3 rounded-lg border-2 text-left transition transform hover:scale-105 active:scale-95 flex flex-col h-full ${
          item ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }`}
      >
        <div className="w-full h-20 mb-2 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image src={getProductImageUrl(produto.imagem_url)} alt={produto.nome}
            width={200} height={80} className="w-full h-full object-cover" unoptimized />
        </div>
        <p className="font-semibold text-xs line-clamp-2 flex-1">{produto.nome}</p>
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatarMoeda(produto.preco_venda)}</p>
          {item && <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{item.quantidade}</span>}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{produto.quantidade_atual} em estoque</p>
      </button>
    )
  }

  // ─── ITEM DO CARRINHO ──────────────────────────────────────────────────────
  const ItemCarrinhoCard = ({ item }: { item: ItemCarrinho }) => {
    const produto = produtos.find((p) => p.id === item.produto_id)
    return (
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        <div className="flex justify-between items-start mb-2">
          <p className="font-medium text-sm flex-1 truncate pr-2">{produto?.nome}</p>
          <button onClick={() => removerDoCarrinho(item.produto_id)}
            className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded p-0.5">
            <X size={15} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={() => atualizarQuantidade(item.produto_id, item.quantidade - 1)}
              className="w-7 h-7 bg-white dark:bg-gray-700 rounded border dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600">
              <Minus size={12} />
            </button>
            <span className="w-8 text-center text-sm font-bold">{item.quantidade}</span>
            <button onClick={() => atualizarQuantidade(item.produto_id, item.quantidade + 1)}
              className="w-7 h-7 bg-white dark:bg-gray-700 rounded border dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600">
              <Plus size={12} />
            </button>
          </div>
          <p className="font-bold text-sm">{formatarMoeda(item.quantidade * item.preco_unitario)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-40 md:pb-0">

      {/* ── DESKTOP ── */}
      <div className="hidden md:grid lg:grid-cols-3 gap-6 p-6">

        {/* Produtos */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">PDV</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Ponto de Venda</p>
          </div>
          {error && <Alert message={error} type="error" />}
          <div className="flex gap-2">
            <input type="text" placeholder="Buscar produto, SKU ou categoria..."
              value={filtro} onChange={(e) => setFiltro(e.target.value)}
              className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full" autoFocus />
            <button
              onClick={() => setScannerAberto(true)}
              className="btn-primary px-4 flex items-center gap-2 whitespace-nowrap"
              title="Ler código de barras"
            >
              <Camera size={18} />
              <span className="hidden sm:inline">Câmera</span>
            </button>
          </div>
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
            {produtosFiltrados.map((p) => <ProdutoCard key={p.id} produto={p} />)}
          </div>
        </div>

        {/* Carrinho Desktop */}
        <div className="card dark:bg-gray-900 dark:border-gray-800 flex flex-col h-fit sticky top-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b dark:border-gray-700">
            <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20} />Carrinho</h2>
            {carrinho.length > 0 && (
              <span className="bg-blue-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{totalItens} un</span>
            )}
          </div>

          <div className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
            {carrinho.length === 0
              ? <p className="text-gray-400 text-sm text-center py-8">Carrinho vazio</p>
              : carrinho.map((i) => <ItemCarrinhoCard key={i.produto_id} item={i} />)}
          </div>

          {carrinho.length > 0 && (
            <>
              {/* Desconto */}
              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">Desconto (R$)</label>
                <input type="number" min="0" step="0.01" placeholder="0,00"
                  value={desconto} onChange={(e) => setDesconto(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full text-sm" />
              </div>

              {/* Totais */}
              <div className="border-t dark:border-gray-700 pt-3 space-y-1 mb-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span><span>{formatarMoeda(subtotal)}</span>
                </div>
                {descontoVal > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Desconto</span><span>-{formatarMoeda(descontoVal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl text-green-600 dark:text-green-400 pt-1">
                  <span>Total</span><span>{formatarMoeda(totalPagar)}</span>
                </div>
              </div>

              <button onClick={abrirPagamento}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 mb-2">
                <Check size={18} />Finalizar Venda
              </button>
              <button onClick={() => setCarrinho([])} className="btn-secondary w-full py-2 text-sm">
                Limpar carrinho
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="md:hidden space-y-3 p-3">
        <h1 className="text-2xl font-bold dark:text-white">PDV</h1>
        {error && <Alert message={error} type="error" />}
        <div className="flex gap-2">
          <input type="text" placeholder="Buscar..." value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full" />
          <button
            onClick={() => setScannerAberto(true)}
            className="btn-primary px-3 flex items-center gap-1"
            title="Ler código de barras"
          >
            <Camera size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {produtosFiltrados.map((p) => <ProdutoCard key={p.id} produto={p} />)}
        </div>
      </div>

      {/* ── MOBILE CARRINHO FLUTUANTE ── */}
      {carrinho.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-2xl p-4 z-40">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-gray-400">{carrinho.length} produto(s) · {totalItens} un</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatarMoeda(totalPagar)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCarrinho([])} className="btn-secondary py-2.5 px-4 text-sm">Limpar</button>
              <button onClick={abrirPagamento} className="btn-primary py-2.5 px-4 text-sm flex items-center gap-1">
                <Check size={16} />Vender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE PAGAMENTO ── */}
      {modalPagamento && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold dark:text-white">Finalizar Venda</h2>
              <button onClick={() => setModalPagamento(false)} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>

            {/* Resumo */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-5 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>{totalItens} item(ns)</span><span>{formatarMoeda(subtotal)}</span>
              </div>
              {descontoVal > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Desconto</span><span>-{formatarMoeda(descontoVal)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl text-green-600 dark:text-green-400 border-t dark:border-gray-700 pt-2 mt-2">
                <span>Total</span><span>{formatarMoeda(totalPagar)}</span>
              </div>
            </div>

            {/* Forma de pagamento */}
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Forma de pagamento</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {FORMAS_PAGAMENTO.map(({ label, icon: Icon, value }) => (
                <button key={value} onClick={() => setFormaPagamento(value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-medium transition ${
                    formaPagamento === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}>
                  <Icon size={20} />
                  {label}
                </button>
              ))}
            </div>

            {/* Valor recebido (só para dinheiro) */}
            {formaPagamento === 'Dinheiro' && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Valor recebido (R$)
                </label>
                <input type="number" min={totalPagar} step="0.01"
                  value={valorRecebido} onChange={(e) => setValorRecebido(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full text-lg font-bold"
                  placeholder={totalPagar.toFixed(2)} />
                {trocoVal > 0 && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex justify-between">
                    <span className="text-green-700 dark:text-green-400 font-medium">Troco</span>
                    <span className="text-green-700 dark:text-green-400 font-bold text-lg">{formatarMoeda(trocoVal)}</span>
                  </div>
                )}
              </div>
            )}

            <button onClick={processarVenda} disabled={processando}
              className="btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center gap-2">
              <Check size={20} />
              {processando ? 'Processando...' : `Confirmar • ${formatarMoeda(totalPagar)}`}
            </button>
          </div>
        </div>
      )}

      {/* ── CUPOM ── */}
      {cupomAberto && dadosCupom && (
        <CupomImpressao dados={dadosCupom} onFechar={fecharCupom} />
      )}

      {/* ── SCANNER DE CÓDIGO DE BARRAS ── */}
      {scannerAberto && (
        <BarcodeScanner
          onBarcodeDetected={handleCodigoBarrasLido}
          onClose={() => setScannerAberto(false)}
        />
      )}
    </div>
  )
}
