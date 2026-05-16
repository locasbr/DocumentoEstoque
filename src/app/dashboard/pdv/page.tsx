'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Produto } from '@/lib/types'
import Alert from '@/components/alerts'
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
      } else {
        setError(`Quantidade indisponível para ${produto.nome}`)
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
    }
  }

  const removerDoCarrinho = (produto_id: string) => {
    setCarrinho(carrinho.filter((item) => item.produto_id !== produto_id))
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

      setSuccess(
        `Venda finalizada! Total: ${formatarMoeda(calcularTotal())}`
      )
      setCarrinho([])

      // Recarregar produtos
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
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 md:p-8 h-screen">
        {/* Seção de Produtos */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PDV - Ponto de Venda</h1>
            <p className="text-gray-600 mt-1">Registre vendas rapidamente</p>
          </div>

          {error && <Alert message={error} type="error" />}

          <div>
            <input
              type="text"
              placeholder="Buscar produto por nome, SKU ou categoria..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="input-field w-full"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto flex-1 pr-2">
            {produtosFiltrados.map((produto) => {
              const itemNoCarrinho = carrinho.find(
                (i) => i.produto_id === produto.id
              )
              return (
                <button
                  key={produto.id}
                  onClick={() => adicionarAoCarrinho(produto)}
                  className={`p-3 rounded-lg border-2 text-left transition transform hover:scale-105 ${
                    itemNoCarrinho
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-sm truncate">{produto.nome}</p>
                  <p className="text-xs text-gray-600">{produto.sku}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-lg font-bold text-green-600">
                      {formatarMoeda(produto.preco_venda)}
                    </p>
                    {itemNoCarrinho && (
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {itemNoCarrinho.quantidade}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {produto.quantidade_atual} em estoque
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Carrinho */}
        <div className="lg:col-span-1 flex flex-col space-y-4">
          <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
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

            {/* Itens do Carrinho */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {carrinho.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Carrinho vazio
                </p>
              ) : (
                carrinho.map((item) => {
                  const produto = produtos.find((p) => p.id === item.produto_id)
                  if (!produto) return null

                  return (
                    <div
                      key={item.produto_id}
                      className="p-3 bg-gray-100 rounded-lg space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{produto.nome}</p>
                          <p className="text-xs text-gray-600">
                            {formatarMoeda(item.preco_unitario)} cada
                          </p>
                        </div>
                        <button
                          onClick={() => removerDoCarrinho(item.produto_id)}
                          className="p-1 hover:bg-red-200 rounded text-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() =>
                            atualizarQuantidade(
                              item.produto_id,
                              item.quantidade - 1
                            )
                          }
                          className="p-1 bg-white rounded hover:bg-gray-200"
                        >
                          <Minus size={14} />
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
                          className="w-12 text-center border rounded py-1 text-sm"
                        />
                        <button
                          onClick={() =>
                            atualizarQuantidade(
                              item.produto_id,
                              item.quantidade + 1
                            )
                          }
                          className="p-1 bg-white rounded hover:bg-gray-200"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <p className="text-right text-sm font-bold">
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
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Itens:</span>
                    <span className="font-semibold">
                      {carrinho.reduce((acc, item) => acc + item.quantidade, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-2xl font-bold text-green-600 pb-4 border-b">
                    <span>Total:</span>
                    <span>{formatarMoeda(calcularTotal())}</span>
                  </div>
                </div>

                <button
                  onClick={processarVenda}
                  disabled={processando}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  {processando ? 'Processando...' : 'Finalizar Venda'}
                </button>

                <button
                  onClick={() => setCarrinho([])}
                  className="btn-secondary w-full"
                  disabled={processando}
                >
                  Limpar Carrinho
                </button>
              </>
            )}

            {success && (
              <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
                ✅ {success}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
