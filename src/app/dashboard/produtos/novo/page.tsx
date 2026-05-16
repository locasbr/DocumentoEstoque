'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Alert from '@/components/alerts'
import { ArrowLeft } from 'lucide-react'

export default function NovoProdutoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    sku: '',
    categoria: '',
    quantidade_atual: 0,
    quantidade_minima: 10,
    preco_custo: 0,
    preco_venda: 0,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('quantidade') || name.includes('preco') ? parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('Usuário não autenticado')
        return
      }

      const { error: insertError } = await supabase.from('produtos').insert([
        {
          ...formData,
          ativo: true,
          usuario_id: user.id,
        },
      ])

      if (insertError) {
        setError(insertError.message)
        return
      }

      setSuccess('Produto criado com sucesso!')
      setTimeout(() => {
        router.push('/dashboard/produtos')
      }, 1500)
    } catch (err) {
      setError('Erro ao criar produto. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/produtos" className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Produto</h1>
          <p className="text-gray-600 mt-2">Adicionar um novo produto ao estoque</p>
        </div>
      </div>

      {error && <Alert message={error} type="error" />}
      {success && <Alert message={success} type="success" />}

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Nome do produto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Código SKU"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleInputChange}
              className="input-field"
              rows={3}
              placeholder="Descrição do produto"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="">Selecionar categoria</option>
                <option value="Alimentos">Alimentos</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Higiene">Higiene</option>
                <option value="Eletrônicos">Eletrônicos</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade Inicial
              </label>
              <input
                type="number"
                name="quantidade_atual"
                value={formData.quantidade_atual}
                onChange={handleInputChange}
                min="0"
                className="input-field"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade Mínima
              </label>
              <input
                type="number"
                name="quantidade_minima"
                value={formData.quantidade_minima}
                onChange={handleInputChange}
                min="0"
                className="input-field"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço de Custo (R$)
              </label>
              <input
                type="number"
                name="preco_custo"
                value={formData.preco_custo}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="input-field"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço de Venda (R$) *
            </label>
            <input
              type="number"
              name="preco_venda"
              value={formData.preco_venda}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              className="input-field"
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </button>
            <Link href="/dashboard/produtos" className="btn-outline">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
