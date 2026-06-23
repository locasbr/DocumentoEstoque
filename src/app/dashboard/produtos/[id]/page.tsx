'use client'

import BotaoIA from '@/components/botao-ia'
import SugestaoPrecoIA from '@/components/sugestao-preco-ia'
import { useIAPreco, type SugestaoPreco } from '@/hooks/useIAPreco'
import { buscarProdutoPorBarcode, ProdutoBarcode } from '@/lib/barcode-api'
import BarcodeProductModal from '@/components/barcode-product-modal'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { uploadProductImage, deleteProductImage } from '@/lib/image-utils'
import Alert from '@/components/alerts'
import ImageUploader from '@/components/image-uploader'
import BarcodeScanner from '@/components/barcode-scanner'
import { useNotification } from '@/contexts/NotificationContext'
import { ArrowLeft, Camera, Calendar, AlertTriangle } from 'lucide-react'
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
  const [scannerAberto, setScannerAberto] = useState(false)

  const [formData, setFormData] = useState<Produto | null>(null)
  const [barcodeModalAberto, setBarcodeModalAberto] = useState(false)
  const [barcodeDetectado, setBarcodeDetectado] = useState('')
  const [produtoBarcode, setProdutoBarcode] = useState<ProdutoBarcode | null>(null)
  const [buscandoBarcode, setBuscandoBarcode] = useState(false)

  // ✨ IA de preço
const { sugerirPreco, carregando: carregandoIAPreco } = useIAPreco()
const [sugestaoPreco, setSugestaoPreco] = useState<SugestaoPreco | null>(null)

const handleSugerirPreco = async () => {
  if (!formData) return
  const sugestao = await sugerirPreco({
    nome: formData.nome,
    categoria: formData.categoria,
    descricao: formData.descricao,
    precoCusto: formData.preco_custo,
  })
  if (sugestao) {
    setSugestaoPreco(sugestao)
  }
}

const handleSelecionarPreco = (preco: number) => {
  setFormData((prev) =>
    prev ? { ...prev, preco_venda: preco } : null
  )
  setSugestaoPreco(null)
}

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

  const handleConfirmarBarcode = (produto: ProdutoBarcode) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            nome: produto.nome || prev.nome,
            descricao: produto.descricao || prev.descricao,
            categoria: produto.categoria || prev.categoria,
          }
        : null
    )
    setBarcodeModalAberto(false)
    addNotification('\u2705 Formulário preenchido automaticamente!', 'success', 2000)
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

  const handleCodigoBarrasLido = async (codigoBarras: string) => {
    setScannerAberto(false)
    setBarcodeDetectado(codigoBarras)
    setBarcodeModalAberto(true)
    setBuscandoBarcode(true)
    setProdutoBarcode(null)

    // Preenche SKU imediatamente
    setFormData((prev) => (prev ? { ...prev, sku: codigoBarras } : null))

    // Busca informações na API
    const resultado = await buscarProdutoPorBarcode(codigoBarras)
    setProdutoBarcode(resultado)
    setBuscandoBarcode(false)
  }

  // ── Calcula info de validade para avisos visuais ──
  const getValidadeInfo = () => {
    if (!formData?.data_validade) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const validade = new Date(formData.data_validade + 'T00:00:00')
    const diffMs = validade.getTime() - hoje.getTime()
    const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return { diasRestantes, vencido: diasRestantes < 0 }
  }

  const validadeInfo = getValidadeInfo()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setError('')
    setSaving(true)

    try {
      // Prepara dados — converte data_validade vazia em null
      const dadosParaSalvar = {
        ...formData,
        data_validade: formData.data_validade || null,
      }

      const { error: updateError } = await supabase
        .from('produtos')
        .update(dadosParaSalvar)
        .eq('id', id)

      if (updateError) {
        setError(updateError.message)
        addNotification('Erro ao atualizar produto', 'error')
        return
      }

      setSuccess('Produto atualizado com sucesso!')
      addNotification('\u2705 Produto atualizado!', 'success', 3000)
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
        <Link
          href="/dashboard/produtos"
          className="btn-outline mt-4 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-800"
        >
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
              <div className="flex gap-2">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  required
                  className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 flex-1"
                  placeholder="Código SKU"
                />
                <button
                  type="button"
                  onClick={() => setScannerAberto(true)}
                  className="btn-primary px-3 flex items-center gap-2 whitespace-nowrap"
                  title="Ler código de barras"
                >
                  <Camera size={18} />
                  <span className="hidden sm:inline">Câmera</span>
                </button>
              </div>
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
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
    Preço de Venda (R$) *
  </label>
  <input
    type="number"
    name="preco_venda"
    value={formData.preco_venda}
    onChange={handleInputChange}
    step="0.01"
    min="0"
    required
    className="input-field w-full mt-1"
  />

  {/* ✨ BOTÃO IA — Sugestão de preço */}
  <div className="mt-2">
    <BotaoIA
      onClick={handleSugerirPreco}
      carregando={carregandoIAPreco}
      label="✨ Sugerir preço com IA"
      className="w-full justify-center text-sm"
    />
    {(!formData.nome?.trim() || formData.preco_custo <= 0) && (
      <p className="text-xs text-amber-700 dark:text-amber-400 text-center mt-1">
        ⚠️ Preencha o nome e o preço de custo primeiro
      </p>
    )}
  </div>

  {/* ✨ Painel de sugestões */}
  {sugestaoPreco && (
    <SugestaoPrecoIA
      sugestao={sugestaoPreco}
      onSelecionar={handleSelecionarPreco}
      onFechar={() => setSugestaoPreco(null)}
    />
  )}
</div>

          {/* ══════════ DATA DE VALIDADE ══════════ */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              Data de Validade
            </label>
            <input
              type="date"
              name="data_validade"
              value={formData.data_validade || ''}
              onChange={handleInputChange}
              className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              Deixe em branco se o produto não tem validade
            </p>

            {/* Aviso: produto já vencido */}
            {validadeInfo && validadeInfo.vencido && (
              <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                  Atenção: este produto está vencido (há {Math.abs(validadeInfo.diasRestantes)} dias)
                </p>
              </div>
            )}

            {/* Aviso: vence em até 7 dias */}
            {validadeInfo && !validadeInfo.vencido && validadeInfo.diasRestantes <= 7 && (
              <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                  Aviso: este produto vence em {validadeInfo.diasRestantes} dia(s)
                </p>
              </div>
            )}

            {/* Info: vence em 8-30 dias */}
            {validadeInfo && !validadeInfo.vencido && validadeInfo.diasRestantes > 7 && validadeInfo.diasRestantes <= 30 && (
              <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <Calendar size={16} className="text-yellow-500 flex-shrink-0" />
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Validade: {validadeInfo.diasRestantes} dias restantes
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button type="submit" disabled={saving || imagemUpload} className="btn-primary">
              {saving ? 'Salvando...' : 'Atualizar Produto'}
            </button>
            <Link
              href="/dashboard/produtos"
              className="btn-outline dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      {/* Modal barcode produto */}
      {barcodeModalAberto && produtoBarcode !== null && (
        <BarcodeProductModal
          codigo={barcodeDetectado}
          produto={produtoBarcode}
          loading={buscandoBarcode}
          onConfirmar={handleConfirmarBarcode}
          onCancelar={() => setBarcodeModalAberto(false)}
        />
      )}

      {/* Scanner de código de barras */}
      {scannerAberto && (
        <BarcodeScanner
          onDetected={handleCodigoBarrasLido}
          onClose={() => setScannerAberto(false)}
        />
      )}
    </div>
  )
}
