'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Alert from '@/components/alerts'
import { ArrowLeft } from 'lucide-react'
import { Produto } from '@/lib/types'
import { useParams } from 'next/navigation'

export default function EditarProdutoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string | undefined

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState<Produto | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('ID do produto não encontrado')
      return
    }

    const fetchProduto = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('produtos')
          .select('*')
          .eq('id', id)
          .single()

        if (!fetchError && data) {
          setFormData(data)
          setError('')
        } else {
          setError('Produto não encontrado')
        }
      } catch (err) {
        setError('Erro ao carregar produto')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProduto()
  }, [id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!formData) return

    const { name, value } = e.target
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]: name.includes('quantidade') || name.includes('preco') ? parseFloat(value) || 0 : value,
          }
        : null
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setError('')
    setSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('produtos')
        .update(formData)
        .eq('id', id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess('Produto atualizado com sucesso!')
      setTimeout(() => {
        router.push('/dashboard/produtos')
      }, 1500)
    } catch (err) {
      setError('Erro ao atualizar produto. Tente novamente.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!formData) {
    return (
      <div>
        <Alert message={error || 'Produto não encontrado'} type="error" />
        <Link href="/dashboard/produtos" className="btn-outline mt-4">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/produtos" className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Produto</h1>
          <p className="text-gray-600 mt-2">{formData.nome}</p>
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
              value={formData.descricao || ''}
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
                Quantidade Atual
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
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : 'Atualizar Produto'}
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
