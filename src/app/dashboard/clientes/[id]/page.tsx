'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MapPin,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  User,
  X,
  Phone,
} from 'lucide-react'

import UpgradeBlock from '@/components/upgrade-block'
import { useNotification } from '@/contexts/NotificationContext'
import { usePlano } from '@/hooks/usePlano'
import { supabase } from '@/lib/supabase'
import { formatarData, formatarMoeda } from '@/lib/utils'

interface Cliente {
  id: string
  nome: string
  telefone: string | null
  cpf: string | null
  email: string | null
  endereco: string | null
  notas: string | null
  criado_em: string
}

interface Fiado {
  id: string
  cliente_id: string
  usuario_id: string
  tipo: 'debito' | 'pagamento'
  valor: number
  descricao: string | null
  criado_em: string
}

interface ResultadoMovimentacaoFiado {
  lancamento_id: string
  cliente_id: string
  cliente_nome: string
  tipo: 'debito' | 'pagamento'
  valor: number
  descricao: string
  saldo_anterior: number
  saldo_atual: number
  usuario_id: string
  realizado_por: string
}

function numero(valor: unknown): number {
  const convertido = Number(valor)
  return Number.isFinite(convertido) ? convertido : 0
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

  return 'Erro inesperado ao realizar a operação.'
}

function mascararCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '')
  if (numeros.length !== 11) return 'CPF cadastrado'
  return `***.***.***-${numeros.slice(-2)}`
}

export default function ClienteDetalhePage() {
  const params = useParams()
  const parametroId = params?.id
  const id = Array.isArray(parametroId) ? parametroId[0] : parametroId

  const { isIniciante, loading: loadingPlano } = usePlano()
  const { addNotification } = useNotification()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [fiados, setFiados] = useState<Fiado[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [cpfVisivel, setCpfVisivel] = useState(false)

  const [modalAberto, setModalAberto] = useState(false)
  const [modalTipo, setModalTipo] = useState<'debito' | 'pagamento'>('debito')
  const [modalValor, setModalValor] = useState('')
  const [modalDesc, setModalDesc] = useState('')
  const [salvando, setSalvando] = useState(false)

  const saldo = useMemo(
    () =>
      fiados.reduce(
        (total, lancamento) =>
          lancamento.tipo === 'debito'
            ? total + numero(lancamento.valor)
            : total - numero(lancamento.valor),
        0
      ),
    [fiados]
  )

  const totalDebitos = useMemo(
    () =>
      fiados
        .filter((lancamento) => lancamento.tipo === 'debito')
        .reduce((total, lancamento) => total + numero(lancamento.valor), 0),
    [fiados]
  )

  const totalPagamentos = useMemo(
    () =>
      fiados
        .filter((lancamento) => lancamento.tipo === 'pagamento')
        .reduce((total, lancamento) => total + numero(lancamento.valor), 0),
    [fiados]
  )

  const valorModal = Number.parseFloat(modalValor)
  const valorModalValido = Number.isFinite(valorModal) && valorModal > 0
  const pagamentoAcimaDoSaldo =
    modalTipo === 'pagamento' && valorModalValido && valorModal > saldo
  const podeConfirmar =
    !salvando &&
    valorModalValido &&
    !pagamentoAcimaDoSaldo &&
    (modalTipo === 'debito' || saldo > 0)

  const fetchData = useCallback(
    async (feedback = false) => {
      if (!id) {
        setErro('Identificador do cliente inválido.')
        setLoading(false)
        return
      }

      feedback ? setAtualizando(true) : setLoading(true)
      setErro(null)

      try {
        const [clienteRes, fiadoRes] = await Promise.all([
          supabase
            .from('clientes')
            .select(
              'id, nome, telefone, cpf, email, endereco, notas, criado_em'
            )
            .eq('id', id)
            .single(),
          supabase
            .from('fiado')
            .select(
              'id, cliente_id, usuario_id, tipo, valor, descricao, criado_em'
            )
            .eq('cliente_id', id)
            .order('criado_em', { ascending: false }),
        ])

        if (clienteRes.error) throw clienteRes.error
        if (fiadoRes.error) throw fiadoRes.error

        setCliente(clienteRes.data as Cliente)
        setFiados((fiadoRes.data as Fiado[] | null) ?? [])

        if (feedback) {
          addNotification('Dados do cliente atualizados.', 'success', 1800)
        }
      } catch (error) {
        console.error('Erro ao carregar cliente e fiado:', error)
        setErro(
          'Não foi possível carregar os dados financeiros deste cliente. Nenhum saldo foi presumido.'
        )
      } finally {
        setLoading(false)
        setAtualizando(false)
      }
    },
    [addNotification, id]
  )

  useEffect(() => {
    if (loadingPlano) return

    if (isIniciante) {
      setLoading(false)
      return
    }

    void fetchData()
  }, [fetchData, isIniciante, loadingPlano])

  const abrirModal = (tipo: 'debito' | 'pagamento') => {
    if (tipo === 'pagamento' && saldo <= 0) {
      addNotification('O cliente não possui saldo devedor.', 'warning', 3000)
      return
    }

    setModalTipo(tipo)
    setModalValor('')
    setModalDesc('')
    setModalAberto(true)
  }

  const fecharModal = () => {
    if (salvando) return
    setModalAberto(false)
    setModalValor('')
    setModalDesc('')
  }

  const handleSalvarFiado = async () => {
    if (salvando || !id) return

    if (!valorModalValido) {
      addNotification('Informe um valor maior que zero.', 'warning')
      return
    }

    if (modalTipo === 'pagamento' && saldo <= 0) {
      addNotification('O cliente não possui saldo devedor.', 'warning')
      return
    }

    if (pagamentoAcimaDoSaldo) {
      addNotification(
        `O pagamento não pode ultrapassar ${formatarMoeda(saldo)}.`,
        'warning',
        3500
      )
      return
    }

    setSalvando(true)

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'registrar_movimentacao_fiado',
        {
          p_cliente_id: id,
          p_tipo: modalTipo,
          p_valor: valorModal,
          p_descricao: modalDesc.trim() || null,
        }
      )

      if (rpcError) throw rpcError

      const resultado = data as ResultadoMovimentacaoFiado | null
      if (!resultado?.lancamento_id) {
        throw new Error('O servidor retornou uma resposta inválida.')
      }

      addNotification(
        modalTipo === 'debito'
          ? `Débito de ${formatarMoeda(numero(resultado.valor))} registrado.`
          : `Pagamento de ${formatarMoeda(numero(resultado.valor))} registrado.`,
        'success',
        3000
      )

      fecharModal()
      await fetchData()
    } catch (error) {
      console.error('Erro ao registrar movimentação de fiado:', error)
      addNotification(obterMensagemErro(error), 'error', 4500)
    } finally {
      setSalvando(false)
    }
  }

  if (loadingPlano) {
    return <Carregando texto="Verificando plano..." />
  }

  if (isIniciante) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <UpgradeBlock
          titulo="Detalhes do Cliente"
          descricao="Veja histórico completo de fiado, pagamentos e movimentações. Disponível no plano Profissional."
          planoNecessario="profissional"
        />
      </div>
    )
  }

  if (loading) {
    return <Carregando texto="Carregando cliente..." />
  }

  if (erro) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Não foi possível abrir o cliente
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{erro}</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link
            href="/dashboard/clientes"
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <button
            type="button"
            onClick={() => void fetchData()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">Cliente não encontrado.</p>
        <Link
          href="/dashboard/clientes"
          className="mt-2 inline-block text-blue-600"
        >
          ← Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard/clientes"
          aria-label="Voltar para clientes"
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white">
            {cliente.nome}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cliente desde {formatarData(cliente.criado_em)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchData(true)}
          disabled={atualizando}
          className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${atualizando ? 'animate-spin' : ''}`}
          />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="card space-y-3 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Informações
          </h2>

          {cliente.telefone && (
            <p className="flex items-center gap-2 break-all text-sm text-gray-600 dark:text-gray-300">
              <Phone className="h-4 w-4 shrink-0 text-gray-400" />
              {cliente.telefone}
            </p>
          )}
          {cliente.email && (
            <p className="flex items-center gap-2 break-all text-sm text-gray-600 dark:text-gray-300">
              <Mail className="h-4 w-4 shrink-0 text-gray-400" />
              {cliente.email}
            </p>
          )}
          {cliente.endereco && (
            <p className="flex items-start gap-2 break-words text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              {cliente.endereco}
            </p>
          )}
          {cliente.cpf && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <User className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="min-w-0 flex-1 truncate">
                CPF: {cpfVisivel ? cliente.cpf : mascararCPF(cliente.cpf)}
              </span>
              <button
                type="button"
                onClick={() => setCpfVisivel((atual) => !atual)}
                aria-label={cpfVisivel ? 'Ocultar CPF' : 'Exibir CPF'}
                title={cpfVisivel ? 'Ocultar CPF' : 'Exibir CPF'}
                className="rounded p-1 text-gray-400 hover:text-blue-600"
              >
                {cpfVisivel ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          )}

          {!cliente.telefone &&
            !cliente.email &&
            !cliente.endereco &&
            !cliente.cpf && (
              <p className="text-sm text-gray-400">
                Nenhuma informação adicional cadastrada.
              </p>
            )}

          {cliente.notas && (
            <p className="mt-2 break-words border-t border-gray-100 pt-3 text-sm italic text-gray-500 dark:border-gray-800 dark:text-gray-400">
              “{cliente.notas}”
            </p>
          )}
        </article>

        <article
          className={`card flex flex-col items-center justify-center p-5 text-center ${
            saldo > 0
              ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
              : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
          }`}
        >
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            Saldo devedor
          </p>
          <p
            className={`text-3xl font-bold ${
              saldo > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {formatarMoeda(Math.max(0, saldo))}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {saldo > 0 ? 'Cliente deve para você' : 'Sem débitos ✓'}
          </p>
        </article>

        <article className="card space-y-3 p-5">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-red-500" />
            <span className="text-gray-600 dark:text-gray-300">
              Total débitos:
            </span>
            <span className="ml-auto font-bold text-red-600">
              {formatarMoeda(totalDebitos)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingDown className="h-4 w-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-300">
              Total pagamentos:
            </span>
            <span className="ml-auto font-bold text-green-600">
              {formatarMoeda(totalPagamentos)}
            </span>
          </div>
          <div className="flex items-center gap-2 border-t pt-2 text-sm dark:border-gray-700">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">
              Movimentações:
            </span>
            <span className="ml-auto font-bold">{fiados.length}</span>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => abrirModal('debito')}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700"
        >
          <Plus className="h-5 w-5" /> Novo débito (fiado)
        </button>
        <button
          type="button"
          onClick={() => abrirModal('pagamento')}
          disabled={saldo <= 0}
          title={saldo <= 0 ? 'O cliente não possui saldo devedor' : undefined}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <DollarSign className="h-5 w-5" /> Registrar pagamento
        </button>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          Histórico de fiado
        </h2>

        {fiados.length === 0 ? (
          <div className="card py-12 text-center text-gray-400">
            Nenhuma movimentação registrada.
          </div>
        ) : (
          <div className="space-y-3">
            {fiados.map((lancamento) => {
              const ehDebito = lancamento.tipo === 'debito'

              return (
                <article
                  key={lancamento.id}
                  className="card flex items-center gap-4 p-4"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      ehDebito
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-green-100 dark:bg-green-900/30'
                    }`}
                  >
                    {ehDebito ? (
                      <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <Banknote className="h-5 w-5 text-green-600 dark:text-green-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ehDebito ? 'Débito (fiado)' : 'Pagamento recebido'}
                    </p>
                    <p className="break-words text-sm text-gray-500 dark:text-gray-400">
                      {lancamento.descricao?.trim() || 'Sem descrição'} ·{' '}
                      {formatarData(lancamento.criado_em)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 text-lg font-bold ${
                      ehDebito
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {ehDebito ? '+' : '-'}
                    {formatarMoeda(numero(lancamento.valor))}
                  </span>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fecharModal()
          }}
        >
          <div className="card w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {modalTipo === 'debito'
                    ? 'Novo débito'
                    : 'Registrar pagamento'}
                </h2>
                {modalTipo === 'pagamento' && (
                  <p className="text-xs text-gray-500">
                    Saldo devedor: {formatarMoeda(saldo)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando}
                aria-label="Fechar"
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Valor (R$) *
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                max={modalTipo === 'pagamento' ? saldo : undefined}
                value={modalValor}
                onChange={(event) => setModalValor(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && podeConfirmar) {
                    event.preventDefault()
                    void handleSalvarFiado()
                  }
                }}
                className={`input-field w-full py-4 text-center text-2xl font-bold ${
                  pagamentoAcimaDoSaldo ? 'border-red-500' : ''
                }`}
                placeholder="0,00"
                autoFocus
              />
              {pagamentoAcimaDoSaldo && (
                <p className="mt-1 text-xs text-red-600">
                  O pagamento não pode ultrapassar {formatarMoeda(saldo)}.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Descrição (opcional)
              </label>
              <input
                type="text"
                maxLength={200}
                value={modalDesc}
                onChange={(event) => setModalDesc(event.target.value)}
                className="input-field w-full"
                placeholder={
                  modalTipo === 'debito'
                    ? 'Ex.: Compras do dia'
                    : 'Ex.: Pagou em dinheiro'
                }
              />
              <p className="mt-1 text-right text-[11px] text-gray-400">
                {modalDesc.length}/200
              </p>
            </div>

            {modalTipo === 'pagamento' && saldo > 0 && (
              <button
                type="button"
                onClick={() => setModalValor(saldo.toFixed(2))}
                className="w-full text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Pagar tudo ({formatarMoeda(saldo)})
              </button>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void handleSalvarFiado()}
                disabled={!podeConfirmar}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  modalTipo === 'debito'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
                {salvando ? 'Salvando...' : 'Confirmar'}
              </button>
              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando}
                className="btn-secondary px-6 py-3 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Carregando({ texto }: { texto: string }) {
  return (
    <div className="flex h-64 items-center justify-center gap-2 text-gray-500">
      <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      <span className="text-sm">{texto}</span>
    </div>
  )
}
