'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Produto } from '@/lib/types'
import { Search, Plus, ArrowDown, ArrowUp, Edit2, X } from 'lucide-react'

export default function SearchCommand() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  // Carrega produtos ao abrir
  useEffect(() => {
    if (isOpen && produtos.length === 0) {
      const fetchProdutos = async () => {
        setLoading(true)
        try {
          const { data } = await supabase
            .from('produtos')
            .select('*')
            .order('nome')
          if (data) setProdutos(data)
        } finally {
          setLoading(false)
        }
      }
      fetchProdutos()
    }
  }, [isOpen, produtos.length])

  // Atalho Ctrl+K para abrir
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setSearch('')
        setSelectedIndex(0)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const filtrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const handleNavigate = useCallback(
    (action: string, produtoId?: string) => {
      setIsOpen(false)
      if (action === 'entrada') {
        router.push(`/dashboard/estoque/movimento?tipo=entrada&produto=${produtoId}`)
      } else if (action === 'saida') {
        router.push(`/dashboard/estoque/movimento?tipo=saida&produto=${produtoId}`)
      } else if (action === 'novo-produto') {
        router.push('/dashboard/produtos/novo')
      } else if (action === 'editar' && produtoId) {
        router.push(`/dashboard/produtos/${produtoId}`)
      }
    },
    [router]
  )

  const handleKeyDownCommand = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(filtrados.length + 1, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filtrados.length + 1) % Math.max(filtrados.length + 1, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex < filtrados.length) {
        const produto = filtrados[selectedIndex]
        handleNavigate('entrada', produto.id)
      } else if (selectedIndex === filtrados.length) {
        handleNavigate('novo-produto')
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder="Buscar produto, SKU, ou comando..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={handleKeyDownCommand}
              className="flex-1 bg-transparent outline-none text-lg"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : filtrados.length === 0 && search ? (
            <div className="p-8 text-center text-gray-500">Nenhum produto encontrado</div>
          ) : filtrados.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm">
              Digite para buscar produtos, ou use os comandos abaixo:
            </div>
          ) : (
            <div>
              {filtrados.map((produto, idx) => (
                <div
                  key={produto.id}
                  className={`px-4 py-3 border-t border-gray-100 cursor-pointer transition ${
                    selectedIndex === idx ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleNavigate('entrada', produto.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{produto.nome}</p>
                      <p className="text-sm text-gray-600">SKU: {produto.sku}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-lg font-bold ${
                          produto.quantidade_atual < produto.quantidade_minima
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {produto.quantidade_atual}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNavigate('entrada', produto.id)
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      <ArrowDown size={14} /> Entrada
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNavigate('saida', produto.id)
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      <ArrowUp size={14} /> Saída
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNavigate('editar', produto.id)
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Novo Produto Option */}
          <div
            className={`px-4 py-3 border-t border-gray-100 cursor-pointer transition ${
              selectedIndex === filtrados.length ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleNavigate('novo-produto')}
          >
            <div className="flex items-center gap-3">
              <Plus size={20} className="text-blue-600" />
              <div>
                <p className="font-medium text-blue-600">Criar novo produto</p>
                <p className="text-sm text-gray-600">Adicionar um novo item ao catálogo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-600">
          <div className="flex justify-between">
            <div>
              <span className="inline-block bg-gray-200 px-2 py-1 rounded mr-2">↑↓</span> Navegar
              <span className="inline-block bg-gray-200 px-2 py-1 rounded ml-2 mr-2">⏎</span> Abrir
              <span className="inline-block bg-gray-200 px-2 py-1 rounded ml-2">Esc</span> Fechar
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
