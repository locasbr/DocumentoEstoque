'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Alert from '@/components/alerts'
import { Produto } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

function NovoMovimentoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  // ══════════ LÊ PARAMS DA URL (vindo do SearchCommand) ══════════
  useEffect(() => {
    const tipo = searchParams.get('tipo')
    const produtoId = searchParams.get('produto')

    if (tipo === 'entrada' || tipo === 'saida') {
      setFormData((prev) => ({ ...prev, tipo_movimento: tipo }))
    }

    if (produtoId) {
      setFormData((prev) => ({ ...prev, produto_id: produtoId }))
    }
  }, [searchParams])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantidade' ? parseInt(value) || 0 : value,
    }))
  }

  const produtoSelecionado = produtos.find((p) => p.id === formData.produto_id)

  const maxQuantidade = produtoSelecionado
    ? formData.tipo_movimento === 'saida'
      ? produtoSelecionado.quantidade_atual
      : Infinity
    : Infinity

  const ficaraAbaixoDoMinimo =
    produtoSelecionado &&
    formData.tipo_movimento === 'saida' &&
    produtoSelecionado.quantidade_atual - formData.quantidade <
      produtoSelecionado.quantidade_minima

  const quantidadeParaRepor = produtoSelecionado
    ? produtoSelecionado.quantidade_minima - produtoSelecionado.quantidade_atual
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.produto_id || formData.quantidade === 0) {
      setError('Selecione um produto e informe a quantidade')
      setLoading(false)
      return
    }

    if (
      formData.tipo_movimento === 'saida' &&
      produtoSelecionado &&
      formData.quantidade > produtoSelecionado.quantidade_atual
    ) {
      setError(
        `Quantidade insuficiente. Disponível: ${produtoSelecionado.quantidade_atual}`
      )
      setLoading(false)
      return
    }

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setError('Usuário não autenticado')
        return
      }

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

        if (novaQuantidade < produto.quantidade_minima) {
          const tipoAlerta =
            novaQuantidade === 0 ? 'estoque_critico' : 'estoque_baixo'
          await supabase.from('alertas').insert([
            {
              produto_id: formData.produto_id,
              usuario_id: userData.user.id,
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
    return <div className="p-8 text-center">Carregando produtos...</div>
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/estoque" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Novo Movimento</h2>
          <p className="text-sm text-gray-500">
            Registrar entrada ou saída de produto
          </p>
        </div>
      </div>

      {error && <Alert message={error} type="error" />}
      {success && <Alert message={success} type="success" />}

      <form onSubmit={handleSubmit} className="card p-6 space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium mb-1">Produto *</label>
          <select
            name="produto_id"
            value={formData.produto_id}
            onChange={handleInputChange}
            className="input-field w-full"
          >
            <option value="">Selecionar produto</option>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.nome} (Estoque: {produto.quantidade_atual})
              </option>
            ))}
          </select>

          {produtoSelecionado && (
            <div className="flex gap-4 mt-2 text-sm">
              <div>
                <span className="text-gray-500">Estoque Atual</span>
                <p
                  className={`font-bold ${
                    produtoSelecionado.quantidade_atual <
                    produtoSelecionado.quantidade_minima
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {produtoSelecionado.quantidade_atual}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Mínimo</span>
                <p className="font-bold">{produtoSelecionado.quantidade_minima}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Tipo de Movimento *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipo_movimento"
                value="entrada"
                checked={formData.tipo_movimento === 'entrada'}
                onChange={handleInputChange}
              />
              Entrada
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipo_movimento"
                value="saida"
                checked={formData.tipo_movimento === 'saida'}
                onChange={handleInputChange}
              />
              Saída
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantidade *</label>
          <input
            type="number"
            name="quantidade"
            value={formData.quantidade || ''}
            onChange={handleInputChange}
            min="1"
            max={maxQuantidade}
            className="input-field w-full"
          />

          {formData.quantidade > 0 && produtoSelecionado && (
            <div className="mt-2 space-y-2">
              {formData.tipo_movimento === 'saida' &&
                formData.quantidade > produtoSelecionado.quantidade_atual && (
                  <div className="text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    ❌ Quantidade insuficiente! Disponível:{' '}
                    {produtoSelecionado.quantidade_atual}
                  </div>
                )}

              {ficaraAbaixoDoMinimo && (
                <div className="text-amber-600 text-sm bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                  ⚠️ Atenção: após este movimento, o estoque ficará abaixo do
                  mínimo!
                  <br />
                  Sobrará:{' '}
                  {produtoSelecionado.quantidade_atual - formData.quantidade} (mín:{' '}
                  {produtoSelecionado.quantidade_minima})
                </div>
              )}

              {formData.tipo_movimento === 'entrada' &&
                quantidadeParaRepor > 0 && (
                  <div className="flex items-center justify-between text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    <span>💡 Sugestão: repor {quantidadeParaRepor} unidades</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, quantidade: quantidadeParaRepor })
                      }
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
                    >
                      Usar
                    </button>
                  </div>
                )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Motivo</label>
          <textarea
            name="motivo"
            value={formData.motivo}
            onChange={handleInputChange}
            className="input-field w-full"
            rows={3}
          />
        </div>

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-2"
          >
            {loading ? 'Registrando...' : 'Registrar Movimento'}
          </button>
          <Link href="/dashboard/estoque" className="btn-secondary px-6 py-2">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}

// Wrapper com Suspense (exigido pelo Next.js pra useSearchParams)
export default function NovoMovimentoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <NovoMovimentoContent />
    </Suspense>
  )
}