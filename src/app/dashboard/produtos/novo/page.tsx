'use client'

import { buscarProdutoPorBarcode, ProdutoBarcode } from '@/lib/barcode-api'
import BarcodeProductModal from '@/components/barcode-product-modal'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { uploadProductImage } from '@/lib/image-utils'
import Alert from '@/components/alerts'
import ImageUploader from '@/components/image-uploader'
import BarcodeScanner from '@/components/barcode-scanner'
import { useNotification } from '@/contexts/NotificationContext'
import { ArrowLeft, Camera, Calendar, AlertTriangle } from 'lucide-react'

export default function NovoProdutoPage() {
  const router = useRouter()
  const { addNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [imagemUpload, setImagemUpload] = useState(false)
  const [scannerAberto, setScannerAberto] = useState(false)
  const [barcodeModalAberto, setBarcodeModalAberto] = useState(false)
  const [barcodeDetectado, setBarcodeDetectado] = useState('')
  const [produtoBarcode, setProdutoBarcode] = useState<ProdutoBarcode | null>(null)
  const [buscandoBarcode, setBuscandoBarcode] = useState(false)

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    sku: '',
    categoria: '',
    quantidade_atual: 0,
    quantidade_minima: 10,
    preco_custo: 0,
    preco_venda: 0,
    data_validade: '',
    imagem_url: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('quantidade') || name.includes('preco') ? parseFloat(value) || 0 : value,
    }))
  }

  const handleCodigoBarrasLido = async (codigoBarras: string) => {
    setScannerAberto(false)
    setBarcodeDetectado(codigoBarras)
    setBarcodeModalAberto(true)
    setBuscandoBarcode(true)
    setProdutoBarcode(null)

    // Preenche SKU imediatamente
    setFormData((prev) => ({ ...prev, sku: codigoBarras }))

    // Busca informações na API
    const resultado = await buscarProdutoPorBarcode(codigoBarras)
    setProdutoBarcode(resultado)
    setBuscandoBarcode(false)
  }

  const handleConfirmarBarcode = (produto: ProdutoBarcode) => {
    setFormData((prev) => ({
      ...prev,
      nome: produto.nome || prev.nome,
      descricao: produto.descricao || prev.descricao,
      categoria: produto.categoria || prev.categoria,
    }))
    setBarcodeModalAberto(false)
    addNotification('\u2705 Formulário preenchido automaticamente!', 'success', 2000)
  }

  const handleImageSelected = async (file: File) => {
    try {
      setImagemUpload(true)
      const tempId = `temp-${Date.now()}`
      const result = await uploadProductImage(file, tempId)
      if (!result) {
        addNotification('Erro ao enviar imagem', 'error')
        return
      }
      setFormData((prev) => ({
        ...prev,
        imagem_url: result.path,
      }))
      addNotification('Imagem enviada com sucesso!', 'success', 2000)
    } catch (err) {
      addNotification('Erro ao enviar imagem', 'error')
      console.error(err)
    } finally {
      setImagemUpload(false)
    }
  }

  // Calcula info de validade para avisos visuais
  const getValidadeInfo = () => {
    if (!formData.data_validade) return null
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
    setError('')
    setLoading(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('Usuário não autenticado')
        addNotification('Erro: usuário não autenticado', 'error')
        return
      }

      // Prepara dados — converte data_validade vazia em null
      const dadosParaSalvar = {
        ...formData,
        data_validade: formData.data_validade || null,
        ativo: true,
        usuario_id: user.id,
      }

      const { error: insertError } = await supabase
        .from('produtos')
        .insert([dadosParaSalvar])
        .select()

      if (insertError) {
        setError(insertError.message)
        addNotification('Erro ao criar produto', 'error')
        return
      }

      setSuccess('Produto criado com sucesso!')
      addNotification('\u2705 Produto adicionado ao estoque!', 'success', 3000)
      setTimeout(() => {
        router.push('/dashboard/produtos')
      }, 1500)
    } catch (err) {
      setError('Erro ao criar produto. Tente novamente.')
      addNotification('Erro ao criar produto', 'error')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/produtos" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Novo Produto</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Adicionar um novo produto ao estoque</p>
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
              value={formData.descricao}
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
                Quantidade Inicial
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

          {/* ══════════ DATA DE VALIDADE (NOVO) ══════════ */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              Data de Validade
            </label>
            <input
              type="date"
              name="data_validade"
              value={formData.data_validade}
              onChange={handleInputChange}
              className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              Deixe em branco se o produto não tem validade
            </p>

            {/* Aviso visual de validade */}
            {validadeInfo && validadeInfo.vencido && (
              <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                  Atenção: esta data já está vencida (há {Math.abs(validadeInfo.diasRestantes)} dias)
                </p>
              </div>
            )}

            {validadeInfo && !validadeInfo.vencido && validadeInfo.diasRestantes <= 7 && (
              <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                  Aviso: este produto vence em {validadeInfo.diasRestantes} dia(s)
                </p>
              </div>
            )}

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
            <button type="submit" disabled={loading || imagemUpload} className="btn-primary">
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </button>
            <Link href="/dashboard/produtos" className="btn-outline dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-800">
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      {/* Scanner de código de barras */}
      {scannerAberto && (
        <BarcodeScanner
          onDetected={handleCodigoBarrasLido}
          onClose={() => setScannerAberto(false)}
        />
      )}

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
    </div>
  )
}
