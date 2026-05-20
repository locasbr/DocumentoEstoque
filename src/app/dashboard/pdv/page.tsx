'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getProductImageUrl } from '@/lib/image-utils'
import { Produto } from '@/lib/types'
import Alert from '@/components/alerts'
import { useNotification } from '@/contexts/NotificationContext'
import { X, Plus, Minus, ShoppingCart, Check, AlertTriangle } from 'lucide-react'
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
      // Verificar se pode aumentar quantidade
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
      addNotification(`✅ ${produto.nome} adicionado ao carrinho`, 'success', 1500)
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
        addNotification('Erro: usuário não autenticado', 'error')
        return
      }

      // Processar cada item do carrinho
      for (const item of carrinho) {
        const produto = produtos.find((p) => p.id === item.produto_id)
        if (!produto) continue

        // Registrar movimento de saída
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
          addNotification(`Erro ao registrar venda de ${produto.nome}`, 'error')
          return
        }

        // Atualizar quantidade do produto
        const novaQuantidade = produto.quantidade_atual - item.quantidade
        const { error: updateError } = await supabase
          .from('produtos')
          .update({ quantidade_atual: novaQuantidade })
          .eq('id', item.produto_id)

        if (updateError) {
          setError('Venda registrada, mas erro ao atualizar estoque')
          addNotification('Venda registrada, mas erro ao atualizar estoque', 'warning')
          return
        }

        // Criar alerta se necessário
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
      setSuccess(
        `Venda finalizada! Total: ${formatarMoeda(total)}`
      )
      addNotification(`💰 Venda finalizada: ${formatarMoeda(total)}!`, 'success', 4000)
      setCarrinho([])

      // Recarregar produtos
      setTimeout(() => {
        fetchProdutos()
      }, 1000)
    } catch (err) {
      setError('Erro ao processar venda')
      addNotification('Erro ao processar venda', 'error')
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 p-3 md:p-6 min-h-screen">
        {/* Seção de Produtos */}
        <div className="lg:col-span-2 flex flex-col space-y-3 md:space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50">PDV - Ponto de Venda</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Registre vendas rapidamente</p>
          </div>

          {error && <Alert message={error} type="error" />}

          <div>
            <input
              type="text"
              placeholder="Buscar produto por nome, SKU ou categoria..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full text-sm"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 overflow-y-auto flex-1 pr-1">
            {produtosFiltrados.map((produto) => {
              const itemNoCarrinho = carrinho.find(
                (i) => i.produto_id === produto.id
              )
              return (
                <button
                  key={produto.id}
                  onClick={() => adicionarAoCarrinho(produto)}
                  className={`p-2 md:p-3 rounded-lg border-2 text-left transition transform hover:scale-105 flex flex-col ${
                    itemNoCarrinho
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-600'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {/* Imagem */}
                  <div className="w-full h-20 md:h-24 mb-2 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={getProductImageUrl(produto.imagem_url)}
                      alt={produto.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <p className="font-semibold text-xs md:text-sm truncate text-gray-900 dark:text-gray-50">{produto.nome}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{produto.sku}</p>
                  <div className="flex justify-between items-center mt-auto pt-2">
                    <p className="text-sm md:text-base font-bold text-green-600 dark:text-green-400">
                      {formatarMoeda(produto.preco_venda)}
                    </p>
                    {itemNoCarrinho && (
                      <span className="bg-blue-500 dark:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {itemNoCarrinho.quantidade}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {produto.quantidade_atual} em estoque
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Carrinho */}
        <div className="lg:col-span-1 flex flex-col space-y-3">
          <div className="card dark:bg-gray-900 dark:border-gray-800 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-3 border-b dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-50">
                <ShoppingCart size={20} />
                Carrinho
              </h2>
              {carrinho.length > 0 && (
                <span className="bg-red-500 dark:bg-red-600 text-white rounded-full px-2 md:px-3 py-1 text-xs md:text-sm font-bold">
                  {carrinho.length}
                </span>
              )}
            </div>

            {/* Itens do Carrinho */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
              {carrinho.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">
                  Carrinho vazio
                </p>
              ) : (
                carrinho.map((item) => {
                  const produto = produtos.find((p) => p.id === item.produto_id)
                  if (!produto) return null

                  return (
                    <div
                      key={item.produto_id}
                      className="p-2 md:p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs md:text-sm text-gray-900 dark:text-gray-50 truncate">{produto.nome}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {formatarMoeda(item.preco_unitario)} cada
                          </p>
                        </div>
                        <button
                          onClick={() => removerDoCarrinho(item.produto_id)}
                          className="p-1 hover:bg-red-200 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={() =>
                            atualizarQuantidade(
                              item.produto_id,
                              item.quantidade - 1
                            )
                          }
                          className="p-1 bg-white dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-50"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          value={item.quantidade}
                          onChange={(e) =>
                            atualizarQuantidade(
                              item.produto_id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-10 text-center border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 rounded py-1 text-xs"
                        />
                        <button
                          onClick={() =>
                            atualizarQuantidade(
                              item.produto_id,
                              item.quantidade + 1
                            )
                          }
                          className="p-1 bg-white dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-50"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <p className="text-right text-xs md:text-sm font-bold text-gray-900 dark:text-gray-50">
                        {formatarMoeda(
                          item.quantidade * item.preco_unitario
                        )}
                      </p>
                    </div>
                  )
                })
              )}
            </div>

            {/* Resumo e Total */}
            {carrinho.length > 0 && (
              <>
                <div className="border-t dark:border-gray-700 pt-3 space-y-2">
                  <div className="flex justify-between items-center text-xs md:text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Itens:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-50">
                      {carrinho.reduce((acc, item) => acc + item.quantidade, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-lg md:text-2xl font-bold text-green-600 dark:text-green-400 pb-2 border-b dark:border-gray-700">
                    <span>Total:</span>
                    <span>{formatarMoeda(calcularTotal())}</span>
                  </div>
                </div>

                <button
                  onClick={processarVenda}
                  disabled={processando}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <Check size={18} />
                  {processando ? 'Processando...' : 'Finalizar Venda'}
                </button>

                <button
                  onClick={() => setCarrinho([])}
                  className="btn-secondary w-full text-sm md:text-base"
                  disabled={processando}
                >
                  Limpar Carrinho
                </button>
              </>
            )}

            {success && (
              <div className="p-2 md:p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg text-xs md:text-sm">
                ✅ {success}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
