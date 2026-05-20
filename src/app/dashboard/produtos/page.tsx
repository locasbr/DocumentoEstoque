'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getProductImageUrl } from '@/lib/image-utils'
import { Produto } from '@/lib/types'
import Alert from '@/components/alerts'
import { useNotification } from '@/contexts/NotificationContext'
import { SkeletonGrid } from '@/components/skeleton-loaders'
import { Plus, Trash2, Edit2, Image as ImageIcon } from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [success, setSuccess] = useState('')
  const { addNotification } = useNotification()

  useEffect(() => {
    fetchProdutos()
  }, [])

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome')

      if (!error && data) {
        setProdutos(data)
      }
    } catch (error) {
      console.error('Error fetching produtos:', error)
      addNotification('Erro ao carregar produtos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja deletar "${nome}"?`)) {
      try {
        const { error } = await supabase.from('produtos').delete().eq('id', id)

        if (!error) {
          setSuccess('Produto deletado com sucesso!')
          addNotification(`✅ ${nome} removido do estoque!`, 'success', 2000)
          fetchProdutos()
        }
      } catch (error) {
        console.error('Error deleting produto:', error)
        addNotification('Erro ao deletar produto', 'error')
      }
    }
  }

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      p.sku.toLowerCase().includes(filtro.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Produtos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Gerenciar catálogo de produtos</p>
          </div>
          <Link href="/dashboard/produtos/novo" className="btn-primary">
            <Plus size={20} className="inline mr-2" />
            <span className="hidden sm:inline">Novo Produto</span>
          </Link>
        </div>
        <SkeletonGrid />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Produtos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gerenciar catálogo de produtos</p>
        </div>
        <Link href="/dashboard/produtos/novo" className="btn-primary">
          <Plus size={20} className="inline mr-2" />
          <span className="hidden sm:inline">Novo Produto</span>
        </Link>
      </div>

      {success && <Alert message={success} type="success" />}

      <div className="card dark:bg-gray-900 dark:border-gray-800">
        <input
          type="text"
          placeholder="Buscar por nome ou SKU..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 mb-6"
        />

        {produtosFiltrados.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            Nenhum produto encontrado
          </p>
        ) : (
          <>
            {/* Vista Desktop - Tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-50">Imagem</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-50">Nome</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-50">SKU</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-50">Categoria</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-50">Quantidade</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-50">Preço</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-gray-50">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map((produto) => (
                    <tr key={produto.id} className="border-t dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-4">
                        <img
                          src={getProductImageUrl(produto.imagem_url)}
                          alt={produto.nome}
                          className="w-10 h-10 rounded object-cover"
                        />
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-900 dark:text-gray-50">{produto.nome}</td>
                      <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{produto.sku}</td>
                      <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{produto.categoria}</td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={
                            produto.quantidade_atual < produto.quantidade_minima
                              ? 'badge-danger'
                              : 'badge-success'
                          }
                        >
                          {produto.quantidade_atual}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900 dark:text-gray-50">
                        {formatarMoeda(produto.preco_venda)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 justify-center">
                          <Link
                            href={`/dashboard/produtos/${produto.id}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(produto.id, produto.nome)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                            title="Deletar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista Mobile - Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {produtosFiltrados.map((produto) => (
                <div
                  key={produto.id}
                  className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg transition"
                >
                  <div className="flex gap-4">
                    {/* Imagem */}
                    <div className="flex-shrink-0">
                      <img
                        src={getProductImageUrl(produto.imagem_url)}
                        alt={produto.nome}
                        className="w-16 h-16 rounded object-cover"
                      />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-50 truncate">
                        {produto.nome}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">SKU: {produto.sku}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{produto.categoria}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              produto.quantidade_atual < produto.quantidade_minima
                                ? 'badge-danger text-xs'
                                : 'badge-success text-xs'
                            }
                          >
                            {produto.quantidade_atual} unid.
                          </span>
                        </div>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {formatarMoeda(produto.preco_venda)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/dashboard/produtos/${produto.id}`}
                      className="flex-1 btn-secondary text-xs flex items-center justify-center gap-2"
                    >
                      <Edit2 size={16} />
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(produto.id, produto.nome)}
                      className="flex-1 btn-danger text-xs flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
