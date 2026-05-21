'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { uploadProductImage, deleteProductImage } from '@/lib/image-utils'
import Alert from '@/components/alerts'
import ImageUploader from '@/components/image-uploader'
import { useNotification } from '@/contexts/NotificationContext'
import { ArrowLeft } from 'lucide-react'
import { Produto } from '@/lib/types'
import { useParams } from 'next/navigation'

export default function EditarProdutoPage() {
  const router = useRouter()
  const params = useParams()
  const { addNotification } = useNotification()
  const id = params?.id as string | undefined

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imagemUpload, setImagemUpload] = useState(false)
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

  const handleImageSelected = async (file: File) => {
    if (!formData || !id) {
      addNotification('Erro: ID do produto não encontrado', 'error')
      return
    }
    try {
      setImagemUpload(true)
      // Se existe imagem anterior, deletar ela
      if (formData.imagem_url) {
        await deleteProductImage(formData.imagem_url)
      }
      const result = await uploadProductImage(file, id)
      if (!result) {
        addNotification('Erro ao enviar imagem', 'error')
        return
      }
      setFormData((prev) =>
        prev
          ? {
              ...prev,
              imagem_url: result.path,
            }
          : null
      )
      addNotification('Imagem atualizada com sucesso!', 'success', 2000)
    } catch (err) {
      addNotification('Erro ao enviar imagem', 'error')
      console.error(err)
    } finally {
      setImagemUpload(false)
    }
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
        addNotification('Erro ao atualizar produto', 'error')
        return
      }

      setSuccess('Produto atualizado com sucesso!')
      addNotification('✅ Produto atualizado!', 'success', 3000)
      setTimeout(() => {
        router.push('/dashboard/produtos')
      }, 1500)
    } catch (err) {
      setError('Erro ao atualizar produto. Tente novamente.')
      addNotification('Erro ao atualizar produto', 'error')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Carregando...</div>
  }

  if (!formData) {
    return (
      <div>
        <Alert message={error || 'Produto não encontrado'} type="error" />
        <Link href="/dashboard/produtos" className="btn-outline mt-4 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-800">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/produtos" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Editar Produto</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{formData.nome}</p>
        </div>
      </div>

      {error && <Alert message={error} type="error" />}
      {success && <Alert message={success} type="success" />}

      <div className="card max-w-2xl dark:bg-gray-900 dark:border-gray-800">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção de Imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-3">
              Imagem do Produto
            </label>
            <ImageUploader onImageSelected={handleImageSelected} />
          </div>

          <hr className="dark:border-gray-700" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">
                Nome *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
                className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50"
                placeholder="Nome do produto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                required
                className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50"
                placeholder="Código SKU"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">
              Descrição
            </label>
            <textarea
              name="descricao"
              value={formData.descricao || ''}
              onChange={handleInputChange}
              className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50"
              rows={3}
              placeholder="Descrição do produto"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">
                Categoria
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleInputChange}
                className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50"
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
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">
                Quantidade Atual
              </label>
              <input
                type="number"
                name="quantidade_atual"
                value={formData.quantidade_atual}
                onChange={handleInputChange}
                min="0"
                className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">
                Quantidade Mínima
              </label>
              <input
                type="number"
                name="quantidade_minima"
                value={formData.quantidade_minima}
                onChange={handleInputChange}
                min="0"
                className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">
                Preço de Custo (R$)
              </label>
              <input
                type="number"
                name="preco_custo"
                value={formData.preco_custo}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">
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
              className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50"
              placeholder="0.00"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button type="submit" disabled={saving || imagemUpload} className="btn-primary">
              {saving ? 'Salvando...' : 'Atualizar Produto'}
            </button>
            <Link href="/dashboard/produtos" className="btn-outline dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-800">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
