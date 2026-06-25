'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Produto } from '@/lib/types'
import Alert from '@/components/alerts'
import { useNotification } from '@/contexts/NotificationContext'
import { SkeletonGrid } from '@/components/skeleton-loaders'
import { Plus, Trash2, Edit2, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'

const POR_PAGINA = 20

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [success, setSuccess] = useState('')
  const [pagina, setPagina] = useState(0)
  const [totalProdutos, setTotalProdutos] = useState(0)
  const { addNotification } = useNotification()

  const fetchProdutos = useCallback(
    async (pag: number) => {
      setLoading(true)
      try {
        // Conta total (pra saber quantas páginas)
        const { count } = await supabase
          .from('produtos')
          .select('*', { count: 'exact', head: true })

        if (count !== null) setTotalProdutos(count)

        // Busca página atual
        let query = supabase
          .from('produtos')
          .select('*')
          .order('nome')
          .range(pag * POR_PAGINA, (pag + 1) * POR_PAGINA - 1)

        const { data, error } = await query

        if (!error && data) {
          setProdutos(data)
        }
      } catch (error) {
        console.error('Error fetching produtos:', error)
        addNotification('Erro ao carregar produtos', 'error')
      } finally {
        setLoading(false)
      }
    },
    [addNotification]
  )

  useEffect(() => {
    fetchProdutos(pagina)
  }, [fetchProdutos, pagina])

  const handleDelete = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja deletar "${nome}"?`)) {
      try {
        const { error } = await supabase.from('produtos').delete().eq('id', id)
        if (!error) {
          setSuccess('Produto deletado com sucesso!')
          addNotification(`✅ ${nome} removido!`, 'success', 2000)
          fetchProdutos(pagina)
        }
      } catch (error) {
        console.error('Error deleting produto:', error)
        addNotification('Erro ao deletar produto', 'error')
      }
    }
  }

  const totalPaginas = Math.ceil(totalProdutos / POR_PAGINA)

  // Filtro local (na página atual)
  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      p.sku.toLowerCase().includes(filtro.toLowerCase())
  )

  if (loading && pagina === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Produtos</h2>
            <p className="text-sm text-gray-500">Gerenciar catálogo</p>
          </div>
          <Link href="/dashboard/produtos/novo" className="btn-primary">
            <Plus size={18} className="inline mr-1" /> Novo Produto
          </Link>
        </div>
        <SkeletonGrid />
      </div>
    )
  }

  return (
    <div>
     {/* Header */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
  <div>
    <h2 className="text-2xl font-bold dark:text-white">Produtos</h2>
    <p className="text-sm text-gray-500">
      {totalProdutos} produto(s) cadastrado(s)
    </p>
  </div>

  {/* Botões de ação */}
  <div className="flex flex-col sm:flex-row gap-2">
    {/* 🆕 BOTÃO IMPORTAR CSV */}
    <Link
      href="/dashboard/produtos/importar"
      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 transition group"
    >
      <FileSpreadsheet size={18} className="group-hover:scale-110 transition-transform" />
      <span>Importar CSV</span>
      <span className="hidden sm:inline text-xs px-1.5 py-0.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold">
        NOVO
      </span>
    </Link>

    {/* Botão Novo Produto */}
    <Link
      href="/dashboard/produtos/novo"
      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 text-white font-semibold rounded-lg transition"
    >
      <Plus size={18} />
      Novo Produto
    </Link>
  </div>
</div>
      {success && <Alert message={success} type="success" />}

      <input
        type="text"
        placeholder="Buscar por nome ou SKU..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 mb-6 w-full"
      />

      {produtosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">Nenhum produto encontrado</p>
        </div>
      ) : (
        <>
          {/* Desktop: Tabela */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Imagem</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">SKU</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Categoria</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Quantidade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Preço</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((produto) => (
                  <tr key={produto.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded" />
                    </td>
                    <td className="py-3 px-4 font-medium dark:text-white">{produto.nome}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">{produto.sku}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">{produto.categoria}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${produto.quantidade_atual < produto.quantidade_minima ? 'badge-danger' : 'badge-success'}`}>
                        {produto.quantidade_atual}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">{formatarMoeda(produto.preco_venda)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/produtos/${produto.id}`} className="p-2 text-blue-600 hover:bg-blue-100 rounded" title="Editar">
                          <Edit2 size={16} />
                        </Link>
                        <button onClick={() => handleDelete(produto.id, produto.nome)} className="p-2 text-red-600 hover:bg-red-100 rounded" title="Deletar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {produtosFiltrados.map((produto) => (
              <div key={produto.id} className="card p-4 border dark:border-gray-700 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm dark:text-white truncate flex-1">{produto.nome}</h4>
                  <span className={`badge text-xs ml-2 ${produto.quantidade_atual < produto.quantidade_minima ? 'badge-danger' : 'badge-success'}`}>
                    {produto.quantidade_atual} un.
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">SKU: {produto.sku}</p>
                <p className="text-xs text-gray-500 mb-2">{produto.categoria}</p>
                <p className="font-bold text-green-600 dark:text-green-400 mb-3">{formatarMoeda(produto.preco_venda)}</p>
                <div className="flex gap-2">
                  <Link href={`/dashboard/produtos/${produto.id}`} className="flex-1 btn-primary text-xs text-center py-2">
                    <Edit2 size={14} className="inline mr-1" /> Editar
                  </Link>
                  <button onClick={() => handleDelete(produto.id, produto.nome)} className="flex-1 btn-danger text-xs py-2">
                    <Trash2 size={14} className="inline mr-1" /> Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t dark:border-gray-800">
              <p className="text-sm text-gray-500">
                Página {pagina + 1} de {totalPaginas} · {totalProdutos} produtos
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagina((p) => Math.max(0, p - 1))}
                  disabled={pagina === 0}
                  className="px-3 py-2 rounded-lg border dark:border-gray-700 text-sm font-medium disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-1"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                  disabled={pagina >= totalPaginas - 1}
                  className="px-3 py-2 rounded-lg border dark:border-gray-700 text-sm font-medium disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-1"
                >
                  Próxima <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}