'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Camera,
  DollarSign,
  Loader2,
  Lock,
  PackagePlus,
  QrCode,
  Save,
  Tag,
  Warehouse,
  X,
  Zap,
} from 'lucide-react'

import Alert from '@/components/alerts'
import BarcodeProductModal from '@/components/barcode-product-modal'
import BarcodeScanner from '@/components/barcode-scanner'
import PageHeader from '@/components/page-header'
import UpgradeBlock from '@/components/upgrade-block'
import { useNotification } from '@/contexts/NotificationContext'
import { usePlano } from '@/hooks/usePlano'
import {
  buscarProdutoPorBarcode,
  type ProdutoBarcode,
} from '@/lib/barcode-api'
import { supabase } from '@/lib/supabase'
import { formatarMoeda } from '@/lib/utils'

interface FormProduto {
  nome: string
  descricao: string
  marca: string
  sku: string
  categoria: string
  quantidade_atual: number
  quantidade_minima: number
  preco_custo: number
  preco_venda: number
  data_validade: string
}

interface ProdutoCriado {
  id: string
  nome: string
  sku: string
  quantidade_atual: number
  quantidade_minima: number
  preco_custo: number
  preco_venda: number
  data_validade: string | null
  ativo: boolean
  usuario_id: string
  cadastrado_por: string
  movimento_inicial_id: string | null
  criado_em: string
}

const CATEGORIAS = [
  'Alimentos',
  'Bebidas',
  'Limpeza',
  'Higiene',
  'Eletrônicos',
  'Utilidades',
  'Outros',
] as const

const FORM_INICIAL: FormProduto = {
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
}

const PRODUTO_BARCODE_VAZIO: ProdutoBarcode = {
  nome: '',
  marca: '',
  descricao: '',
  categoria: '',
  encontrado: false,
  fonte: '',
}

function numeroSeguro(valor: string): number {
  const numero = Number(valor)
  return Number.isFinite(numero) ? Math.max(numero, 0) : 0
}

function dataLocal(dataISO: string): Date | null {
  if (!dataISO) return null
  const data = new Date(`${dataISO}T00:00:00`)
  return Number.isNaN(data.getTime()) ? null : data
}

function obterMensagemErro(erro: unknown): string {
  if (
    typeof erro === 'object' &&
    erro !== null &&
    'message' in erro &&
    typeof erro.message === 'string'
  ) {
    return erro.message
  }

  return 'Ocorreu um erro inesperado ao cadastrar o produto.'
}

export default function NovoProdutoPage() {
  const router = useRouter()
  const { addNotification } = useNotification()
  const {
    isIniciante,
    loading: loadingPlano,
    podeAdicionarProduto,
    totalProdutos,
    limites,
    temValidade,
  } = usePlano()

  const [formData, setFormData] = useState<FormProduto>(FORM_INICIAL)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [scannerAberto, setScannerAberto] = useState(false)
  const [barcodeModalAberto, setBarcodeModalAberto] = useState(false)
  const [barcodeDetectado, setBarcodeDetectado] = useState('')
  const [produtoBarcode, setProdutoBarcode] =
    useState<ProdutoBarcode | null>(null)
  const [buscandoBarcode, setBuscandoBarcode] = useState(false)
  const [mostrarLimiteAtingido, setMostrarLimiteAtingido] = useState(false)

  const limiteProdutos = Math.max(Number(limites.produtos) || 0, 0)
  const restantes = isIniciante
    ? Math.max(limiteProdutos - totalProdutos, 0)
    : 0
  const porcentagemUso =
    isIniciante && limiteProdutos > 0
      ? Math.min(Math.round((totalProdutos / limiteProdutos) * 100), 100)
      : 0
  const pertoDoLimite = isIniciante && restantes > 0 && restantes <= 20

  const margem = useMemo(() => {
    if (formData.preco_venda <= 0) return null
    const valor =
      ((formData.preco_venda - formData.preco_custo) /
        formData.preco_venda) *
      100
    return Number.isFinite(valor) ? valor : null
  }, [formData.preco_custo, formData.preco_venda])

  const lucroUnitario = formData.preco_venda - formData.preco_custo

  const validadeInfo = useMemo(() => {
    const validade = dataLocal(formData.data_validade)
    if (!validade) return null

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const diasRestantes = Math.ceil(
      (validade.getTime() - hoje.getTime()) / 86_400_000
    )

    return { diasRestantes, vencido: diasRestantes < 0 }
  }, [formData.data_validade])

  const handleInputChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target
    const numerico = [
      'quantidade_atual',
      'quantidade_minima',
      'preco_custo',
      'preco_venda',
    ].includes(name)

    setFormData((atual) => ({
      ...atual,
      [name]: numerico ? numeroSeguro(value) : value,
    }))

    if (erro) setErro('')
  }

  const handleCodigoBarrasLido = async (codigo: string) => {
    const codigoLimpo = codigo.trim()
    if (!codigoLimpo) return

    setScannerAberto(false)
    setBarcodeDetectado(codigoLimpo)
    setBarcodeModalAberto(true)
    setBuscandoBarcode(true)
    setProdutoBarcode(null)
    setFormData((atual) => ({ ...atual, sku: codigoLimpo }))

    try {
      setProdutoBarcode(await buscarProdutoPorBarcode(codigoLimpo))
    } catch (error) {
      console.error('Erro ao consultar código de barras:', error)
      addNotification(
        'Não foi possível consultar o código. Preencha os dados manualmente.',
        'warning',
        4000
      )
      setBarcodeModalAberto(false)
    } finally {
      setBuscandoBarcode(false)
    }
  }

  const handleConfirmarBarcode = (produto: ProdutoBarcode) => {
    setFormData((atual) => ({
      ...atual,
      nome: produto.nome || atual.nome,
      descricao: produto.descricao || atual.descricao,
      categoria: produto.categoria || atual.categoria,
      marca: produto.marca || atual.marca,
    }))
    setBarcodeModalAberto(false)
    addNotification('Dados do produto preenchidos.', 'success', 2000)
  }

  const validarFormulario = (): string | null => {
    if (!formData.nome.trim()) return 'Informe o nome do produto.'
    if (formData.nome.trim().length < 2)
      return 'O nome deve ter pelo menos 2 caracteres.'
    if (!formData.sku.trim()) return 'Informe o SKU ou código de barras.'
    if (formData.quantidade_atual < 0)
      return 'A quantidade inicial não pode ser negativa.'
    if (!Number.isInteger(formData.quantidade_atual))
      return 'A quantidade inicial deve ser um número inteiro.'
    if (formData.quantidade_minima < 0)
      return 'O estoque mínimo não pode ser negativo.'
    if (!Number.isInteger(formData.quantidade_minima))
      return 'O estoque mínimo deve ser um número inteiro.'
    if (formData.preco_custo < 0)
      return 'O preço de custo não pode ser negativo.'
    if (formData.preco_venda <= 0)
      return 'Informe um preço de venda maior que zero.'
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (salvando) return

    setErro('')

    if (!podeAdicionarProduto) {
      setMostrarLimiteAtingido(true)
      return
    }

    const validacao = validarFormulario()
    if (validacao) {
      setErro(validacao)
      addNotification(validacao, 'warning', 3000)
      return
    }

    setSalvando(true)

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'registrar_produto',
        {
          p_nome: formData.nome.trim(),
          p_descricao: formData.descricao.trim() || null,
          p_marca: formData.marca.trim() || null,
          p_sku: formData.sku.trim(),
          p_categoria: formData.categoria || null,
          p_quantidade_inicial: Math.trunc(formData.quantidade_atual),
          p_quantidade_minima: Math.trunc(formData.quantidade_minima),
          p_preco_custo: Number(formData.preco_custo.toFixed(2)),
          p_preco_venda: Number(formData.preco_venda.toFixed(2)),
          p_data_validade:
            temValidade && formData.data_validade
              ? formData.data_validade
              : null,
        }
      )

      if (rpcError) throw rpcError

      const produtoCriado = data as ProdutoCriado | null
      if (!produtoCriado?.id) {
        throw new Error('O servidor retornou uma resposta inválida.')
      }

      addNotification(
        `Produto "${produtoCriado.nome}" adicionado ao estoque.`,
        'success',
        3000
      )

      router.push('/dashboard/produtos')
      router.refresh()
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      const mensagem = obterMensagemErro(error)
      setErro(mensagem)

      if (mensagem.toLocaleLowerCase('pt-BR').includes('limite')) {
        setMostrarLimiteAtingido(true)
      } else {
        addNotification(mensagem, 'error', 5000)
      }
    } finally {
      setSalvando(false)
    }
  }

  if (loadingPlano) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="sr-only">Verificando o plano</span>
      </div>
    )
  }

  if (!podeAdicionarProduto) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-10">
        <Link
          href="/dashboard/produtos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para produtos
        </Link>
        <UpgradeBlock
          titulo={`Limite de ${limiteProdutos} produtos atingido`}
          descricao={`Você já cadastrou ${totalProdutos} produtos. Faça upgrade para continuar cadastrando novos itens.`}
          planoNecessario="profissional"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <PageHeader
        eyebrow="CADASTRO DE ESTOQUE"
        title="Novo produto"
        description="Cadastre as informações essenciais para controlar saldo, reposição e validade."
        icon={PackagePlus}
        actions={
          <Link
            href="/dashboard/produtos"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        }
      />

      {isIniciante && (
        <section
          className={`rounded-xl border p-4 ${
            pertoDoLimite
              ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
              : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Lock
                  className={`h-4 w-4 ${
                    pertoDoLimite ? 'text-amber-600' : 'text-blue-600'
                  }`}
                />
                <p className="text-sm font-bold">
                  {totalProdutos} de {limiteProdutos} produtos cadastrados
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80 dark:bg-gray-800">
                <div
                  className={`h-full rounded-full ${
                    pertoDoLimite ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${porcentagemUso}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                {restantes} cadastro(s) disponível(is) neste plano.
              </p>
            </div>
            <Link
              href="/assinar"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-gray-100 dark:text-gray-900"
            >
              <Zap className="h-4 w-4" /> Ver planos
            </Link>
          </div>
        </section>
      )}

      {erro && <Alert message={erro} type="error" />}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Secao
          icon={Tag}
          titulo="Identificação"
          descricao="Informações usadas para localizar o produto rapidamente."
          cor="blue"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Campo label="Nome do produto *" contador={`${formData.nome.length}/255`}>
              <input
                name="nome"
                maxLength={255}
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Ex.: Arroz tipo 1, 5 kg"
                required
                autoFocus
                className="input-field w-full"
              />
            </Campo>

            <Campo label="SKU ou código de barras *">
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <QrCode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    name="sku"
                    maxLength={100}
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="Digite ou leia o código"
                    required
                    className="input-field w-full pl-10"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setScannerAberto(true)}
                  className="btn-secondary inline-flex items-center gap-2 px-4"
                >
                  <Camera className="h-4 w-4" />
                  <span className="hidden sm:inline">Ler</span>
                </button>
              </div>
            </Campo>

            <Campo label="Marca" contador={`${formData.marca.length}/120`}>
              <input
                name="marca"
                maxLength={120}
                value={formData.marca}
                onChange={handleInputChange}
                placeholder="Ex.: Nestlé"
                className="input-field w-full"
              />
            </Campo>

            <Campo label="Categoria">
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleInputChange}
                className="input-field w-full"
              >
                <option value="">Sem categoria</option>
                {CATEGORIAS.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <div className="mt-4">
            <Campo
              label="Descrição"
              contador={`${formData.descricao.length}/500`}
            >
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                maxLength={500}
                rows={3}
                className="input-field w-full resize-none"
                placeholder="Informações adicionais para identificar o produto"
              />
            </Campo>
          </div>
        </Secao>

        <Secao
          icon={Warehouse}
          titulo="Controle de estoque"
          descricao="O estoque mínimo alimenta Alertas e Reposição."
          cor="emerald"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Campo label="Quantidade inicial" ajuda="Informe o saldo físico disponível agora.">
              <input
                name="quantidade_atual"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={formData.quantidade_atual}
                onChange={handleInputChange}
                className="input-field w-full"
              />
            </Campo>
            <Campo label="Estoque mínimo" ajuda="Abaixo dessa quantidade, o sistema recomenda reposição.">
              <input
                name="quantidade_minima"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={formData.quantidade_minima}
                onChange={handleInputChange}
                className="input-field w-full"
              />
            </Campo>
          </div>

          {formData.quantidade_minima > 0 &&
            formData.quantidade_atual < formData.quantidade_minima && (
              <Aviso cor="amber" icon={AlertTriangle}>
                Este produto será cadastrado abaixo do mínimo. A reposição
                sugerirá{' '}
                {formData.quantidade_minima - formData.quantidade_atual}{' '}
                unidade(s).
              </Aviso>
            )}
        </Secao>

        <Secao
          icon={DollarSign}
          titulo="Preços"
          descricao="O custo ajuda a calcular valor em estoque, reposição e perdas."
          cor="blue"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Campo label="Preço de custo">
              <input
                name="preco_custo"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={formData.preco_custo}
                onChange={handleInputChange}
                className="input-field w-full"
              />
            </Campo>
            <Campo label="Preço de venda *">
              <input
                name="preco_venda"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={formData.preco_venda}
                onChange={handleInputChange}
                required
                className="input-field w-full"
              />
            </Campo>
          </div>

          <div className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60 sm:grid-cols-3">
            <Resumo label="Custo" valor={formatarMoeda(formData.preco_custo)} />
            <Resumo
              label="Resultado unitário"
              valor={formatarMoeda(lucroUnitario)}
              negativo={lucroUnitario < 0}
            />
            <Resumo
              label="Margem estimada"
              valor={margem === null ? 'Não calculada' : `${margem.toFixed(1)}%`}
              negativo={margem !== null && margem < 0}
            />
          </div>

          {formData.preco_venda > 0 &&
            formData.preco_custo > formData.preco_venda && (
              <Aviso cor="red" icon={AlertCircle}>
                O preço de venda está menor que o preço de custo.
              </Aviso>
            )}
        </Secao>

        <Secao
          icon={CalendarDays}
          titulo="Validade"
          descricao="Use apenas para produtos que possuem data de vencimento."
          cor="amber"
        >
          {temValidade ? (
            <>
              <Campo label="Data de validade">
                <input
                  name="data_validade"
                  type="date"
                  value={formData.data_validade}
                  onChange={handleInputChange}
                  className="input-field w-full sm:max-w-xs"
                />
              </Campo>

              {validadeInfo && (
                <Aviso
                  cor={
                    validadeInfo.vencido
                      ? 'red'
                      : validadeInfo.diasRestantes <= 7
                        ? 'amber'
                        : 'blue'
                  }
                  icon={validadeInfo.vencido ? AlertTriangle : CalendarDays}
                >
                  {validadeInfo.vencido
                    ? `A data informada venceu há ${Math.abs(
                        validadeInfo.diasRestantes
                      )} dia(s).`
                    : `Faltam ${validadeInfo.diasRestantes} dia(s) para a validade.`}
                </Aviso>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                  <Lock className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">Controle de validade</p>
                  <p className="text-xs text-gray-500">
                    Disponível em um plano com controle de vencimentos.
                  </p>
                </div>
              </div>
              <Link
                href="/assinar"
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                Ver planos
              </Link>
            </div>
          )}
        </Secao>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard/produtos"
            className={`btn-secondary inline-flex items-center justify-center px-6 py-3 ${
              salvando ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={salvando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {salvando ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" /> Salvar produto
              </>
            )}
          </button>
        </div>
      </form>

      {scannerAberto && (
        <BarcodeScanner
          onDetected={handleCodigoBarrasLido}
          onClose={() => setScannerAberto(false)}
        />
      )}

      {barcodeModalAberto && (
        <BarcodeProductModal
          codigo={barcodeDetectado}
          produto={produtoBarcode ?? PRODUTO_BARCODE_VAZIO}
          loading={buscandoBarcode}
          onConfirmar={handleConfirmarBarcode}
          onCancelar={() => {
            if (!buscandoBarcode) setBarcodeModalAberto(false)
          }}
        />
      )}

      {mostrarLimiteAtingido && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMostrarLimiteAtingido(false)
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setMostrarLimiteAtingido(false)}
                className="text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <UpgradeBlock
              titulo={`Limite de ${limiteProdutos} produtos atingido`}
              descricao={`Você já cadastrou ${totalProdutos} produtos. Faça upgrade para continuar cadastrando.`}
              planoNecessario="profissional"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Secao({
  icon: Icon,
  titulo,
  descricao,
  cor,
  children,
}: {
  icon: typeof Tag
  titulo: string
  descricao: string
  cor: 'blue' | 'emerald' | 'amber'
  children: React.ReactNode
}) {
  const estilos = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    emerald:
      'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber:
      'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${estilos[cor]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-bold">{titulo}</h2>
          <p className="text-xs text-gray-500">{descricao}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function Campo({
  label,
  ajuda,
  contador,
  children,
}: {
  label: string
  ajuda?: string
  contador?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-2">
        <label className="block text-sm font-semibold">{label}</label>
        {contador && <span className="text-[10px] text-gray-400">{contador}</span>}
      </div>
      {children}
      {ajuda && <p className="mt-1 text-xs text-gray-500">{ajuda}</p>}
    </div>
  )
}

function Resumo({
  label,
  valor,
  negativo = false,
}: {
  label: string
  valor: string
  negativo?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p
        className={`mt-1 text-sm font-bold ${
          negativo ? 'text-red-600' : 'text-gray-900 dark:text-white'
        }`}
      >
        {valor}
      </p>
    </div>
  )
}

function Aviso({
  cor,
  icon: Icon,
  children,
}: {
  cor: 'red' | 'amber' | 'blue'
  icon: typeof AlertCircle
  children: React.ReactNode
}) {
  const estilos = {
    red: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
    amber:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
    blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  }

  return (
    <div className={`mt-4 flex items-start gap-3 rounded-xl border p-3 text-sm ${estilos[cor]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{children}</p>
    </div>
  )
}
