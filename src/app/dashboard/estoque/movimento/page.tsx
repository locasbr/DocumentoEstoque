'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Alert from '@/components/alerts'
import { Produto } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

export default function NovoMovimentoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingProdutos, setLoadingProdutos] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [produtos, setProdutos] = useState<Produto[]>([])

  const [formData, setFormData] = useState({
    produto_id: '',
    tipo_movimento: 'entrada' as 'entrada' | 'saida',
    quantidade: 0,
    motivo: '',
  })

  useEffect(() => {
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
        setLoadingProdutos(false)
      }
    }

    fetchProdutos()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantidade' ? parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.produto_id || formData.quantidade === 0) {
      setError('Selecione um produto e informe a quantidade')
      setLoading(false)
      return
    }

    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setError('Usuário não autenticado')
        return
      }

      // Registrar movimento
      const { error: movimentoError } = await supabase
        .from('movimentos_estoque')
        .insert([
          {
            produto_id: formData.produto_id,
            tipo_movimento: formData.tipo_movimento,
            quantidade: formData.quantidade,
            motivo: formData.motivo,
            usuario_id: userData.user.id,
          },
        ])

      if (movimentoError) {
        setError(movimentoError.message)
        return
      }

      // Atualizar quantidade do produto
      const produto = produtos.find((p) => p.id === formData.produto_id)
      if (produto) {
        const novaQuantidade =
          formData.tipo_movimento === 'entrada'
            ? produto.quantidade_atual + formData.quantidade
            : produto.quantidade_atual - formData.quantidade

        const { error: updateError } = await supabase
          .from('produtos')
          .update({ quantidade_atual: novaQuantidade })
          .eq('id', formData.produto_id)

        if (updateError) {
          setError('Movimento registrado, mas erro ao atualizar quantidade')
          return
        }

        // Verificar se precisa criar alerta
        if (novaQuantidade < produto.quantidade_minima) {
          const tipoAlerta = novaQuantidade === 0 ? 'estoque_critico' : 'estoque_baixo'
          
          await supabase.from('alertas').insert([
            {
              produto_id: formData.produto_id,
              tipo_alerta: tipoAlerta,
              visualizado: false,
            },
          ])
        }
      }

      setSuccess('Movimento registrado com sucesso!')
      setTimeout(() => {
        router.push('/dashboard/estoque')
      }, 1500)
    } catch (err) {
      setError('Erro ao registrar movimento. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loadingProdutos) {
    return <div>Carregando produtos...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/estoque" className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Movimento</h1>
          <p className="text-gray-600 mt-2">Registrar entrada ou saída de produto</p>
        </div>
      </div>

      {error && <Alert message={error} type="error" />}
      {success && <Alert message={success} type="success" />}

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produto *
            </label>
            <select
              name="produto_id"
              value={formData.produto_id}
              onChange={handleInputChange}
              required
              className="input-field"
            >
              <option value="">Selecionar produto</option>
              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome} (Estoque: {produto.quantidade_atual})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimento *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipo_movimento"
                  value="entrada"
                  checked={formData.tipo_movimento === 'entrada'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-green-600 font-medium">Entrada</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipo_movimento"
                  value="saida"
                  checked={formData.tipo_movimento === 'saida'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-red-600 font-medium">Saída</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade *
            </label>
            <input
              type="number"
              name="quantidade"
              value={formData.quantidade}
              onChange={handleInputChange}
              required
              min="1"
              className="input-field"
              placeholder="Quantidade"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo
            </label>
            <textarea
              name="motivo"
              value={formData.motivo}
              onChange={handleInputChange}
              className="input-field"
              rows={3}
              placeholder="Motivo do movimento (compra, venda, devolução, etc)"
            />
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Registrando...' : 'Registrar Movimento'}
            </button>
            <Link href="/dashboard/estoque" className="btn-outline">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
