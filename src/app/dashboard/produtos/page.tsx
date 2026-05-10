'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Produto } from '@/lib/types'
import Alert from '@/components/alerts'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [success, setSuccess] = useState('')

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
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este produto?')) {
      try {
        const { error } = await supabase.from('produtos').delete().eq('id', id)

        if (!error) {
          setSuccess('Produto deletado com sucesso!')
          fetchProdutos()
        }
      } catch (error) {
        console.error('Error deleting produto:', error)
      }
    }
  }

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      p.sku.toLowerCase().includes(filtro.toLowerCase())
  )

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600 mt-2">Gerenciar catálogo de produtos</p>
        </div>
        <Link href="/dashboard/produtos/novo" className="btn-primary">
          <Plus size={20} className="inline mr-2" />
          Novo Produto
        </Link>
      </div>

      {success && <Alert message={success} type="success" />}

      <div className="card">
        <input
          type="text"
          placeholder="Buscar por nome ou SKU..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="input-field mb-6"
        />

        {produtosFiltrados.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            Nenhum produto encontrado
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((produto) => (
                  <tr key={produto.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">{produto.nome}</td>
                    <td className="px-6 py-4">{produto.sku}</td>
                    <td className="px-6 py-4">{produto.categoria}</td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      {formatarMoeda(produto.preco_venda)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/produtos/${produto.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Edit2 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(produto.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded"
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
        )}
      </div>
    </div>
  )
}
