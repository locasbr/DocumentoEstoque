'use client'

import BotaoIA from '@/components/botao-ia'
import SugestaoPrecoIA from '@/components/sugestao-preco-ia'
import { useIAPreco, type SugestaoPreco } from '@/hooks/useIAPreco'
import { useIAProduto } from '@/hooks/useIAProduto'
import { buscarProdutoPorBarcode, ProdutoBarcode } from '@/lib/barcode-api'
import BarcodeProductModal from '@/components/barcode-product-modal'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Alert from '@/components/alerts'
import BarcodeScanner from '@/components/barcode-scanner'
import { useNotification } from '@/contexts/NotificationContext'
import { ArrowLeft, Camera, Calendar, AlertTriangle, Lock, Zap } from 'lucide-react'
import { usePlano } from '@/hooks/usePlano'
import UpgradeBlock from '@/components/upgrade-block'

export default function NovoProdutoPage() {
  // 🔒 BLOQUEIO POR PLANO
  const {
    isIniciante,
    loading: loadingPlano,
    podeAdicionarProduto,
    totalProdutos,
    limites,
    temValidade,
  } = usePlano()

  const router = useRouter()
  const { addNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scannerAberto, setScannerAberto] = useState(false)
  const [barcodeModalAberto, setBarcodeModalAberto] = useState(false)
  const [barcodeDetectado, setBarcodeDetectado] = useState('')
  const [produtoBarcode, setProdutoBarcode] = useState<ProdutoBarcode | null>(null)
  const [buscandoBarcode, setBuscandoBarcode] = useState(false)

  // 🔒 Modal de limite atingido
  const [mostrarLimiteAtingido, setMostrarLimiteAtingido] = useState(false)

  // ✨ IA de preço
  const { sugerirPreco, carregando: carregandoIAPreco } = useIAPreco()
  const [sugestaoPreco, setSugestaoPreco] = useState<SugestaoPreco | null>(null)

  // ✨ IA de dados do produto (marca, descrição, categoria)
  const { completarComIA, carregando: carregandoIAProduto } = useIAProduto()

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    marca: '',
    sku: '',
    categoria: '',
    quantidade_atual: 0,
    quantidade_minima: 10,
    preco_custo: 0,
    preco_venda: 0,
    data_validade: '',
  })

  const handleSugerirPreco = async () => {
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
    setFormData((prev) => ({
      ...prev,
      preco_venda: preco,
    }))
    setSugestaoPreco(null)
  }

  // ✨ Completar dados com IA (marca, descrição, categoria)
  const handleCompletarComIA = async () => {
    if (!formData.nome.trim()) {
      addNotification('Digite o nome do produto primeiro', 'warning', 2000)
      return
    }

    const sugestao = await completarComIA({
      nomeOriginal: formData.nome,
      sku: formData.sku,
      marca: formData.marca,
      descricaoOriginal: formData.descricao,
    })

    if (sugestao) {
      setFormData((prev) => ({
        ...prev,
        marca: sugestao.marca || prev.marca,
        descricao: sugestao.descricao || prev.descricao,
        categoria: sugestao.categoria || prev.categoria,
      }))
    }
  }

  // 🔒 LOADING DO PLANO
  if (loadingPlano) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  // 🔒 BLOQUEIO DE LIMITE — se já atingiu 100 produtos
  if (!podeAdicionarProduto) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <UpgradeBlock
          titulo={`Limite de ${limites.produtos} produtos atingido`}
          descricao={`Você já cadastrou ${totalProdutos} produtos no plano Iniciante. Faça upgrade para o Profissional e cadastre produtos ilimitados!`}
          planoNecessario="profissional"
        />
      </div>
    )
  }

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

    setFormData((prev) => ({ ...prev, sku: codigoBarras }))

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
    addNotification('✅ Formulário preenchido automaticamente!', 'success', 2000)
  }

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

    // 🔒 DUPLA VERIFICAÇÃO de limite no submit (segurança extra)
    if (!podeAdicionarProduto) {
      setMostrarLimiteAtingido(true)
      return
    }

    setLoading(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('Usuário não autenticado')
        addNotification('Erro: usuário não autenticado', 'error')
        return
      }

      // 🔒 Remove data_validade se Iniciante (não tem essa feature)
      const dadosParaSalvar = {
        ...formData,
        data_validade: temValidade ? (formData.data_validade || null) : null,
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
      addNotification('✅ Produto adicionado ao estoque!', 'success', 3000)
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

  // 🟡 Calcula porcentagem de uso (pra banner)
  const porcentagemUso = isIniciante ? Math.round((totalProdutos / limites.produtos) * 100) : 0
  const restantes = isIniciante ? limites.produtos - totalProdutos : 0
  const quasePerto = isIniciante && restantes <= 20 && restantes > 0

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

      {/* 🔒 BANNER DE USO (apenas Iniciante) */}
      {isIniciante && (
        <div className={`card p-4 border-2 ${
          quasePerto
            ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800'
            : 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={16} className={quasePerto ? 'text-amber-600' : 'text-blue-600'} />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Plano Iniciante — {totalProdutos}/{limites.produtos} produtos
                </h4>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    quasePerto ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${porcentagemUso}%` }}
                />
              </div>
              <p className={`text-sm ${
                quasePerto ? 'text-amber-700 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {quasePerto
                  ? `⚠️ Você tem apenas ${restantes} produtos restantes!`
                  : `Você ainda pode cadastrar ${restantes} produtos`}
              </p>
            </div>
            <Link
              href="/assinar"
              className="btn-primary bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 whitespace-nowrap"
            >
              <Zap size={16} />
              Upgrade
            </Link>
          </div>
        </div>
      )}

      {error && <Alert message={error} type="error" />}
      {success && <Alert message={success} type="success" />}

      <div className="card max-w-2xl dark:bg-gray-900 dark:border-gray-800">
        <form onSubmit={handleSubmit} className="space-y-6">

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

          {/* ✨ BOTÃO IA — Completar dados automaticamente */}
          <div>
            <BotaoIA
              onClick={handleCompletarComIA}
              carregando={carregandoIAProduto}
              label="✨ Completar com IA (marca, descrição, categoria)"
              feature="cadastro"
              className="w-full justify-center text-sm"
            />
            {!formData.nome.trim() && (
              <p className="text-xs text-amber-700 dark:text-amber-400 text-center mt-1">
                ⚠️ Digite o nome do produto primeiro
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">
              Marca
            </label>
            <input
              type="text"
              name="marca"
              value={formData.marca}
              onChange={handleInputChange}
              className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50"
              placeholder="Ex: Coca-Cola, Nestlé, Sadia..."
            />
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
                feature="preco"
                className="w-full justify-center text-sm"
              />
              {(!formData.nome.trim() || formData.preco_custo <= 0) && (
                <p className="text-xs text-amber-700 dark:text-amber-400 text-center mt-1">
                  ⚠️ Preencha o nome e o preço de custo primeiro
                </p>
              )}
            </div>

            {/* ✨ Painel de sugestões */}
            {sugestaoPreco && (
              <SugestaoPrecoIA
                sugestao={sugestaoPreco!}
                onSelecionar={handleSelecionarPreco}
                onFechar={() => setSugestaoPreco(null)}
              />
            )}
          </div>

          {/* ══════════ DATA DE VALIDADE — só mostra se temValidade ══════════ */}
          {temValidade ? (
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

              {validadeInfo?.vencido && (
                <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                    Atenção: esta data já está vencida (há {Math.abs(validadeInfo?.diasRestantes ?? 0)} dias)
                  </p>
                </div>
              )}

              {!validadeInfo?.vencido && (validadeInfo?.diasRestantes ?? 0) <= 7 && (
                <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                    Aviso: este produto vence em {validadeInfo?.diasRestantes ?? 0} dia(s)
                  </p>
                </div>
              )}

              {!validadeInfo?.vencido && (validadeInfo?.diasRestantes ?? 0) > 7 && (validadeInfo?.diasRestantes ?? 0) <= 30 && (
                <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <Calendar size={16} className="text-yellow-500 flex-shrink-0" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Validade: {validadeInfo?.diasRestantes ?? 0} dias restantes
                  </p>
                </div>
              )}
            </div>
          ) : (
            // 🔒 BLOQUEIO DE VALIDADE (Iniciante)
            <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      Data de Validade
                      <span className="text-[10px] font-bold bg-yellow-500 text-white px-1.5 py-0.5 rounded">PRO</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Controle vencimentos e evite prejuízos
                    </p>
                  </div>
                </div>
                <Link
                  href="/assinar"
                  className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline whitespace-nowrap"
                >
                  Fazer upgrade →
                </Link>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button type="submit" disabled={loading} className="btn-primary">
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
          produto={produtoBarcode!}
          loading={buscandoBarcode}
          onConfirmar={handleConfirmarBarcode}
          onCancelar={() => setBarcodeModalAberto(false)}
        />
      )}

      {/* 🔒 Modal de limite atingido (segurança extra) */}
      {mostrarLimiteAtingido && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-md w-full">
            <UpgradeBlock
              titulo={`Limite de ${limites.produtos} produtos atingido`}
              descricao={`Você já cadastrou ${totalProdutos} produtos. Faça upgrade para o Profissional e tenha produtos ilimitados!`}
              planoNecessario="profissional"
            />
            <button
              onClick={() => setMostrarLimiteAtingido(false)}
              className="mt-4 w-full btn-outline"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}