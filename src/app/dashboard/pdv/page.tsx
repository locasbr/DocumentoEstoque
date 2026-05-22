'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getProductImageUrl } from '@/lib/image-utils'
import { Produto } from '@/lib/types'
import Alert from '@/components/alerts'
import { useNotification } from '@/contexts/NotificationContext'
import { X, Plus, Minus, ShoppingCart, Check } from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'

interface ItemCarrinho {
  produto_id: string
  quantidade: number
  preco_unitario: number
}

export default function PDVPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [filtro, setFiltro] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [processando, setProcessando] = useState(false)
  const { addNotification } = useNotification()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchProdutos()
  }, [])

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .gt('quantidade_atual', 0)
        .order('nome')

      if (!error && data) {
        setProdutos(data)
      }
    } catch (error) {
      console.error('Error fetching produtos:', error)
      setError('Erro ao carregar produtos')
      addNotification('Erro ao carregar produtos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const adicionarAoCarrinho = (produto: Produto) => {
    const itemExistente = carrinho.find((item) => item.produto_id === produto.id)

    if (itemExistente) {
      const quantidadeAtual = carrinho
        .filter((i) => i.produto_id === produto.id)
        .reduce((acc, i) => acc + i.quantidade, 0)

      if (quantidadeAtual < produto.quantidade_atual) {
        setCarrinho(
          carrinho.map((item) =>
            item.produto_id === produto.id
              ? { ...item, quantidade: item.quantidade + 1 }
              : item
          )
        )
        addNotification(`➕ ${produto.nome}`, 'info', 1000)
      } else {
        setError(`Quantidade indisponível para ${produto.nome}`)
        addNotification(`❌ Estoque insuficiente: ${produto.nome}`, 'warning')
      }
    } else {
      setCarrinho([
        ...carrinho,
        {
          produto_id: produto.id,
          quantidade: 1,
          preco_unitario: produto.preco_venda,
        },
      ])
      addNotification(`✅ ${produto.nome} adicionado`, 'success', 1500)
    }
  }

  const removerDoCarrinho = (produto_id: string) => {
    const produto = produtos.find((p) => p.id === produto_id)
    setCarrinho(carrinho.filter((item) => item.produto_id !== produto_id))
    if (produto) {
      addNotification(`➖ ${produto.nome} removido`, 'info', 1000)
    }
  }

  const atualizarQuantidade = (produto_id: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produto_id)
    } else {
      const produto = produtos.find((p) => p.id === produto_id)
      if (produto && novaQuantidade <= produto.quantidade_atual) {
        setCarrinho(
          carrinho.map((item) =>
            item.produto_id === produto_id
              ? { ...item, quantidade: novaQuantidade }
              : item
          )
        )
      }
    }
  }

  const calcularTotal = () => {
    return carrinho.reduce(
      (acc, item) => acc + item.quantidade * item.preco_unitario,
      0
    )
  }

  const processarVenda = async () => {
    if (carrinho.length === 0) {
      setError('Carrinho vazio')
      return
    }

    setProcessando(true)
    setError('')

    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setError('Usuário não autenticado')
        return
      }

      for (const item of carrinho) {
        const produto = produtos.find((p) => p.id === item.produto_id)
        if (!produto) continue

        const { error: movimentoError } = await supabase
          .from('movimentos_estoque')
          .insert([
            {
              produto_id: item.produto_id,
              tipo_movimento: 'saida',
              quantidade: item.quantidade,
              motivo: `Venda - PDV - ${formatarMoeda(item.quantidade * item.preco_unitario)}`,
              usuario_id: userData.user.id,
            },
          ])

        if (movimentoError) {
          setError(`Erro ao registrar venda de ${produto.nome}`)
          return
        }

        const novaQuantidade = produto.quantidade_atual - item.quantidade
        const { error: updateError } = await supabase
          .from('produtos')
          .update({ quantidade_atual: novaQuantidade })
          .eq('id', item.produto_id)

        if (updateError) {
          setError('Venda registrada, mas erro ao atualizar estoque')
          return
        }

        if (novaQuantidade < produto.quantidade_minima) {
          const tipoAlerta =
            novaQuantidade === 0 ? 'estoque_critico' : 'estoque_baixo'

          await supabase.from('alertas').insert([
            {
              produto_id: item.produto_id,
              tipo_alerta: tipoAlerta,
              visualizado: false,
            },
          ])
        }
      }

      const total = calcularTotal()
      setSuccess(`Venda finalizada! Total: ${formatarMoeda(total)}`)
      addNotification(`💰 Venda finalizada: ${formatarMoeda(total)}!`, 'success', 4000)
      setCarrinho([])

      setTimeout(() => {
        fetchProdutos()
      }, 1000)
    } catch (err) {
      setError('Erro ao processar venda')
      console.error(err)
    } finally {
      setProcessando(false)
    }
  }

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      p.sku.toLowerCase().includes(filtro.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(filtro.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Carregando...</div>
  }

  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0)
  const totalPagar = calcularTotal()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-80 md:pb-0">
      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-1 lg:grid-cols-3 gap-4 p-6 min-h-screen">
        {/* Seção de Produtos */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">PDV</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Ponto de Venda</p>
          </div>

          {error && <Alert message={error} type="error" />}

          <input
            type="text"
            placeholder="Buscar produto..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full h-12"
            autoFocus
          />

          <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto flex-1">
            {produtosFiltrados.map((produto) => {
              const itemNoCarrinho = carrinho.find((i) => i.produto_id === produto.id)
              return (
                <button
                  key={produto.id}
                  onClick={() => adicionarAoCarrinho(produto)}
                  className={`p-3 rounded-lg border-2 text-left transition transform hover:scale-105 flex flex-col h-full ${
                    itemNoCarrinho
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="w-full h-24 mb-2 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <Image
                      src={getProductImageUrl(produto.imagem_url)}
                      alt={produto.nome}
                      width={200}
                      height={96}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <p className="font-semibold text-sm truncate">{produto.nome}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{produto.sku}</p>
                  <div className="flex justify-between items-center mt-auto pt-2">
                    <p className="text-base font-bold text-green-600 dark:text-green-400">
                      {formatarMoeda(produto.preco_venda)}
                    </p>
                    {itemNoCarrinho && (
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {itemNoCarrinho.quantidade}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {produto.quantidade_atual} estoque
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Carrinho Desktop */}
        <div className="flex flex-col">
          <div className="card dark:bg-gray-900 dark:border-gray-800 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart size={24} />
                Carrinho
              </h2>
              {carrinho.length > 0 && (
                <span className="bg-red-500 text-white rounded-full px-3 py-1 text-sm font-bold">
                  {carrinho.length}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {carrinho.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">Carrinho vazio</p>
              ) : (
                carrinho.map((item) => {
                  const produto = produtos.find((p) => p.id === item.produto_id)
                  return (
                    <div key={item.produto_id} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{produto?.nome}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {formatarMoeda(item.preco_unitario)} cada
                          </p>
                        </div>
                        <button
                          onClick={() => removerDoCarrinho(item.produto_id)}
                          className="p-1 hover:bg-red-200 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => atualizarQuantidade(item.produto_id, item.quantidade - 1)}
                          className="p-1 bg-white dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => atualizarQuantidade(item.produto_id, parseInt(e.target.value) || 0)}
                          className="w-12 text-center border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 rounded py-1 text-xs"
                        />
                        <button
                          onClick={() => atualizarQuantidade(item.produto_id, item.quantidade + 1)}
                          className="p-1 bg-white dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <p className="text-right text-sm font-bold mt-1">
                        {formatarMoeda(item.quantidade * item.preco_unitario)}
                      </p>
                    </div>
                  )
                })
              )}
            </div>

            {carrinho.length > 0 && (
              <>
                <div className="border-t dark:border-gray-700 pt-3 space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span>Itens:</span>
                    <span className="font-bold">{totalItens}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold text-green-600 dark:text-green-400 pb-2 border-b dark:border-gray-700">
                    <span>Total:</span>
                    <span>{formatarMoeda(totalPagar)}</span>
                  </div>
                </div>

                <button
                  onClick={processarVenda}
                  disabled={processando}
                  className="btn-primary w-full py-3 mb-2 flex items-center justify-center gap-2 h-12"
                >
                  <Check size={20} />
                  {processando ? 'Processando...' : 'Finalizar Venda'}
                </button>

                <button
                  onClick={() => setCarrinho([])}
                  className="btn-secondary w-full py-2"
                  disabled={processando}
                >
                  Limpar
                </button>
              </>
            )}

            {success && (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 rounded text-sm">
                ✅ {success}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col space-y-3 p-3 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">PDV</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ponto de Venda</p>
        </div>

        {error && <Alert message={error} type="error" />}

        <input
          type="text"
          placeholder="Buscar..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full h-12 text-sm"
          autoFocus
        />

        <div className="grid grid-cols-2 gap-2 pb-4">
          {produtosFiltrados.map((produto) => {
            const itemNoCarrinho = carrinho.find((i) => i.produto_id === produto.id)
            return (
              <button
                key={produto.id}
                onClick={() => adicionarAoCarrinho(produto)}
                className={`p-2 rounded-lg border-2 text-left transition flex flex-col h-full active:scale-95 ${
                  itemNoCarrinho
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="w-full h-16 mb-1 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <Image
                    src={getProductImageUrl(produto.imagem_url)}
                    alt={produto.nome}
                    width={160}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <p className="font-semibold text-xs line-clamp-2">{produto.nome}</p>
                <p className="text-xs text-green-600 dark:text-green-400 font-bold mt-auto">
                  {formatarMoeda(produto.preco_venda)}
                </p>
                {itemNoCarrinho && (
                  <span className="text-xs bg-blue-500 text-white rounded px-1 mt-1">
                    +{itemNoCarrinho.quantidade}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile Carrinho Flutuante */}
      {carrinho.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-2xl p-4 z-50">
          <div className="space-y-3">
            {/* Resumo Rápido */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatarMoeda(totalPagar)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 dark:text-gray-400">{carrinho.length} item(ns)</p>
                <p className="text-lg font-bold">{totalItens} un</p>
              </div>
            </div>

            {/* Botões */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCarrinho([])}
                className="btn-secondary py-3 text-sm font-bold h-12"
              >
                Limpar
              </button>
              <button
                onClick={processarVenda}
                disabled={processando}
                className="btn-primary py-3 text-sm font-bold h-12 flex items-center justify-center gap-1"
              >
                <Check size={18} />
                {processando ? '...' : 'Vender'}
              </button>
            </div>

            {success && (
              <div className="p-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 rounded text-xs">
                ✅ {success}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
