// src/app/dashboard/pdv/page.tsx
'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Produto } from '@/lib/types'
import Alert from '@/components/alerts'
import CupomImpressao from '@/components/cupom-impressao'
import BarcodeScanner from '@/components/barcode-scanner'
import BotaoIA from '@/components/botao-ia'
import { buscarProdutoPorBarcode } from '@/lib/barcode-api'
import { useCupom } from '@/hooks/useCupom'
import { useIAProduto } from '@/hooks/useIAProduto'
import { useNotification } from '@/contexts/NotificationContext'
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Banknote,
  QrCode,
  Camera,
  Usb,
  Keyboard,
  TrendingUp,
  Receipt,
  Loader2,
  Percent,
  RotateCcw,
  Volume2,
  VolumeX,
  Tag,
  CheckCircle2,
  ArrowRight,
  Maximize2,
  Minimize2,
  Star,
} from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'

interface ItemCarrinho {
  produto_id: string
  quantidade: number
  preco_unitario: number
}

interface VendaRecente {
  numero_venda: string
  total: number
  forma_pagamento: string
  itens: any[]
  hora: string
}

interface StatsDia {
  totalVendas: number
  faturamento: number
  ticketMedio: number
}

const FORMAS_PAGAMENTO = [
  { label: 'Dinheiro', icon: Banknote, value: 'Dinheiro' },
  { label: 'Pix', icon: QrCode, value: 'Pix' },
  { label: 'Débito', icon: CreditCard, value: 'Cartão Débito' },
  { label: 'Crédito', icon: CreditCard, value: 'Cartão Crédito' },
]

const SOM_BIPE_KEY = 'pdv_som_ativo'

export default function PDVPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [filtro, setFiltro] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [processando, setProcessando] = useState(false)

  const [statsDia, setStatsDia] = useState<StatsDia>({
    totalVendas: 0,
    faturamento: 0,
    ticketMedio: 0,
  })

  const [vendasRecentes, setVendasRecentes] = useState<VendaRecente[]>([])

  // 🆕 Top vendidos do dia
  const [topVendidos, setTopVendidos] = useState<Produto[]>([])

  const [mostrarAtalhos, setMostrarAtalhos] = useState(false)
  const [somAtivo, setSomAtivo] = useState(true)

  // 🆕 Fullscreen
  const [fullscreen, setFullscreen] = useState(false)

  // 🆕 Animação +1 ao adicionar
  const [animacaoAdd, setAnimacaoAdd] = useState<{ id: string; key: number } | null>(null)

  // 🆕 Tela de sucesso GIGANTE pós-venda
  const [telaSucesso, setTelaSucesso] = useState<{
    total: number
    recebido: number
    troco: number
    formaPagamento: string
  } | null>(null)

  // Pagamento
  const [modalPagamento, setModalPagamento] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro')
  const [valorRecebido, setValorRecebido] = useState('')
  const [desconto, setDesconto] = useState('')

  // Scanner e cadastro rápido
  const [scannerAberto, setScannerAberto] = useState(false)
  const [modalCadastroRapido, setModalCadastroRapido] = useState(false)
  const [dadosProdutoAPI, setDadosProdutoAPI] = useState<any>(null)
  const [skuParaCadastro, setSkuParaCadastro] = useState('')

  const [usbDetectado, setUsbDetectado] = useState(false)

  const [cadastroNome, setCadastroNome] = useState('')
  const [cadastroMarca, setCadastroMarca] = useState('')
  const [cadastroDescricao, setCadastroDescricao] = useState('')
  const [cadastroCategoria, setCadastroCategoria] = useState('')
  const [cadastroPreco, setCadastroPreco] = useState('')
  const [cadastroQuantidade, setCadastroQuantidade] = useState('1')
  const [salvandoProdutoRapido, setSalvandoProdutoRapido] = useState(false)

  const [precoSugeridoIA, setPrecoSugeridoIA] = useState<{
    min: number
    max: number
  } | null>(null)

  const usbBufferRef = useRef('')
  const usbTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const buscaInputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const { addNotification } = useNotification()
  const { cupomAberto, dadosCupom, gerarCupom, fecharCupom } = useCupom()
  const { completarComIA, carregando: carregandoIA } = useIAProduto()

  // ══════════════════════════════════════════════════
  // 🔊 SOM DE BIPE
  // ══════════════════════════════════════════════════

  useEffect(() => {
    const salvo = localStorage.getItem(SOM_BIPE_KEY)
    if (salvo !== null) setSomAtivo(salvo === 'true')
  }, [])

  const tocarBipe = useCallback(() => {
    if (!somAtivo) return
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.frequency.value = 1200
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.1)
    } catch {
      // Falha silenciosa
    }
  }, [somAtivo])

  const toggleSom = () => {
    const novo = !somAtivo
    setSomAtivo(novo)
    localStorage.setItem(SOM_BIPE_KEY, novo.toString())
    addNotification(
      novo ? '🔊 Som ativado' : '🔇 Som desativado',
      'info',
      1500
    )
  }

  // ══════════════════════════════════════════════════
  // 🆕 FULLSCREEN
  // ══════════════════════════════════════════════════

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // ══════════════════════════════════════════════════
  // FETCH PRODUTOS + STATS + TOP VENDIDOS
  // ══════════════════════════════════════════════════

  useEffect(() => {
    fetchProdutos()
    fetchStatsDia()
    fetchTopVendidos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .gt('quantidade_atual', 0)
        .order('nome')

      if (!error && data) setProdutos(data)
    } catch {
      setError('Erro ao carregar produtos')
      addNotification('Erro ao carregar produtos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatsDia = async () => {
    try {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      const { data: vendasHoje } = await supabase
        .from('movimentos_estoque')
        .select('quantidade, motivo, produto:produto_id(preco_venda)')
        .eq('tipo_movimento', 'saida')
        .gte('criado_em', hoje.toISOString())

      if (vendasHoje) {
        const motivosVendas = new Set<string>()
        let faturamento = 0

        vendasHoje.forEach((v: any) => {
          const precoVenda = v.produto?.preco_venda || 0
          faturamento += v.quantidade * precoVenda

          if (v.motivo?.startsWith('PDV')) {
            motivosVendas.add(v.motivo)
          }
        })

        const totalVendas = motivosVendas.size
        const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0

        setStatsDia({ totalVendas, faturamento, ticketMedio })
      }
    } catch (err) {
      console.error('Erro ao buscar stats do dia:', err)
    }
  }

  // 🆕 Top 6 produtos mais vendidos hoje
  const fetchTopVendidos = async () => {
    try {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      const { data } = await supabase
        .from('movimentos_estoque')
        .select('produto_id, quantidade, produto:produto_id(*)')
        .eq('tipo_movimento', 'saida')
        .gte('criado_em', hoje.toISOString())

      if (data) {
        const contagem: Record<string, { produto: Produto; qtd: number }> = {}
        data.forEach((m: any) => {
          if (!m.produto) return
          if (!contagem[m.produto_id]) {
            contagem[m.produto_id] = { produto: m.produto, qtd: 0 }
          }
          contagem[m.produto_id].qtd += m.quantidade
        })

        const top = Object.values(contagem)
          .sort((a, b) => b.qtd - a.qtd)
          .slice(0, 6)
          .map((c) => c.produto)
          .filter((p) => p.quantidade_atual > 0)

        setTopVendidos(top)
      }
    } catch (err) {
      console.error('Erro top vendidos:', err)
    }
  }

  // ══════════════════════════════════════════════════
  // CARRINHO
  // ══════════════════════════════════════════════════

  const adicionarAoCarrinho = useCallback(
    (produto: Produto) => {
      tocarBipe()
      // 🆕 Trigger animação +1
      setAnimacaoAdd({ id: produto.id, key: Date.now() })

      setCarrinho((prev) => {
        const itemExistente = prev.find((i) => i.produto_id === produto.id)
        if (itemExistente) {
          if (itemExistente.quantidade < produto.quantidade_atual) {
            addNotification(`➡️ ${produto.nome}`, 'info', 800)
            return prev.map((i) =>
              i.produto_id === produto.id
                ? { ...i, quantidade: i.quantidade + 1 }
                : i
            )
          } else {
            addNotification(`❌ Estoque insuficiente`, 'warning')
            return prev
          }
        } else {
          addNotification(`✅ ${produto.nome}`, 'success', 800)
          return [
            ...prev,
            {
              produto_id: produto.id,
              quantidade: 1,
              preco_unitario: produto.preco_venda,
            },
          ]
        }
      })
    },
    [addNotification, tocarBipe]
  )

  const removerDoCarrinho = (produto_id: string) => {
    setCarrinho(carrinho.filter((i) => i.produto_id !== produto_id))
  }

  const atualizarQuantidade = (produto_id: string, nova: number) => {
    if (nova <= 0) {
      removerDoCarrinho(produto_id)
      return
    }
    const produto = produtos.find((p) => p.id === produto_id)
    if (produto && nova <= produto.quantidade_atual) {
      setCarrinho(
        carrinho.map((i) =>
          i.produto_id === produto_id ? { ...i, quantidade: nova } : i
        )
      )
    }
  }

  // ══════════════════════════════════════════════════
  // CÓDIGO DE BARRAS
  // ══════════════════════════════════════════════════

  const handleCodigoBarrasLido = useCallback(
    async (codigoBarras: string) => {
      const produtoLocal = produtos.find((p) => p.sku === codigoBarras)
      if (produtoLocal) {
        adicionarAoCarrinho(produtoLocal)
        addNotification(`✅ ${produtoLocal.nome} adicionado`, 'success', 2000)
        return
      }

      addNotification(`🔍 Buscando ${codigoBarras}...`, 'info', 2000)
      const resultadoAPI = await buscarProdutoPorBarcode(codigoBarras)

      if (resultadoAPI.encontrado) {
        setSkuParaCadastro(codigoBarras)
        setDadosProdutoAPI(resultadoAPI)
        setModalCadastroRapido(true)
      } else {
        setSkuParaCadastro(codigoBarras)
        setDadosProdutoAPI({
          encontrado: false,
          nome: '',
          marca: '',
          descricao: '',
          categoria: '',
          imagem_url: '',
        })
        setModalCadastroRapido(true)
        addNotification(
          `Produto não encontrado. Use a IA ou preencha manualmente.`,
          'info',
          4000
        )
      }
    },
    [produtos, adicionarAoCarrinho, addNotification]
  )

  // ══════════════════════════════════════════════════
  // LEITOR USB
  // ══════════════════════════════════════════════════

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toUpperCase()
      if (
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        activeTag === 'SELECT'
      ) {
        return
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key === 'Enter') {
        const code = usbBufferRef.current.trim()
        if (code.length >= 8) {
          e.preventDefault()
          e.stopPropagation()
          setUsbDetectado(true)
          setTimeout(() => setUsbDetectado(false), 2000)
          if (navigator.vibrate) navigator.vibrate(200)
          handleCodigoBarrasLido(code)
        }
        usbBufferRef.current = ''
        return
      }

      if (e.key.length !== 1) {
        usbBufferRef.current = ''
        return
      }

      usbBufferRef.current += e.key

      if (usbTimeoutRef.current) clearTimeout(usbTimeoutRef.current)
      usbTimeoutRef.current = setTimeout(() => {
        usbBufferRef.current = ''
      }, 100)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      if (usbTimeoutRef.current) clearTimeout(usbTimeoutRef.current)
    }
  }, [handleCodigoBarrasLido])

  // ══════════════════════════════════════════════════
  // ATALHOS
  // ══════════════════════════════════════════════════

  const abrirPagamento = useCallback(() => {
    if (carrinho.length === 0) {
      addNotification('Carrinho vazio', 'warning')
      return
    }
    const subtotal = carrinho.reduce(
      (acc, i) => acc + i.quantidade * i.preco_unitario,
      0
    )
    const descontoVal = parseFloat(desconto) || 0
    const total = Math.max(0, subtotal - descontoVal)
    setValorRecebido(total.toFixed(2))
    setModalPagamento(true)
  }, [carrinho, desconto, addNotification])

  useEffect(() => {
    const handleHotkeys = (e: KeyboardEvent) => {
      const modaisAbertos =
        modalPagamento ||
        modalCadastroRapido ||
        scannerAberto ||
        cupomAberto ||
        !!telaSucesso

      if (e.key === 'Escape') {
        if (mostrarAtalhos) {
          setMostrarAtalhos(false)
          return
        }
        if (telaSucesso) {
          setTelaSucesso(null)
          return
        }
        if (modaisAbertos) return
        if (carrinho.length > 0) {
          e.preventDefault()
          if (confirm('Limpar carrinho?')) {
            setCarrinho([])
            addNotification('🗑️ Carrinho limpo', 'info', 1500)
          }
        }
        return
      }

      if (modaisAbertos || mostrarAtalhos) return

      if (e.key === 'F1') {
        e.preventDefault()
        setMostrarAtalhos(true)
        return
      }

      if (e.key === 'F2') {
        e.preventDefault()
        buscaInputRef.current?.focus()
        buscaInputRef.current?.select()
        return
      }

      if (e.key === 'F4') {
        e.preventDefault()
        if (carrinho.length === 0) {
          addNotification('Carrinho vazio', 'warning')
          return
        }
        const descontoInput = document.getElementById(
          'desconto-input'
        ) as HTMLInputElement
        descontoInput?.focus()
        descontoInput?.select()
        return
      }

      if (e.key === 'F8') {
        e.preventDefault()
        abrirPagamento()
        return
      }

      if (e.key === 'F10') {
        e.preventDefault()
        if (carrinho.length > 0) {
          const ultimoItem = carrinho[carrinho.length - 1]
          const produto = produtos.find((p) => p.id === ultimoItem.produto_id)
          removerDoCarrinho(ultimoItem.produto_id)
          addNotification(
            `❌ Removido: ${produto?.nome || 'item'}`,
            'info',
            2000
          )
        }
      }
    }

    window.addEventListener('keydown', handleHotkeys)
    return () => window.removeEventListener('keydown', handleHotkeys)
  }, [
    carrinho,
    modalPagamento,
    modalCadastroRapido,
    scannerAberto,
    cupomAberto,
    mostrarAtalhos,
    addNotification,
    produtos,
    abrirPagamento,
    telaSucesso,
  ])

  // 🆕 Auto-fecha tela de sucesso em 8 segundos
  useEffect(() => {
    if (telaSucesso) {
      const timer = setTimeout(() => setTelaSucesso(null), 8000)
      return () => clearTimeout(timer)
    }
  }, [telaSucesso])

  // ══════════════════════════════════════════════════
  // CADASTRO RÁPIDO
  // ══════════════════════════════════════════════════

  useEffect(() => {
    if (dadosProdutoAPI) {
      setCadastroNome(dadosProdutoAPI.nome || '')
      setCadastroMarca(dadosProdutoAPI.marca || '')
      setCadastroDescricao(dadosProdutoAPI.descricao || '')
      setCadastroCategoria(dadosProdutoAPI.categoria || '')
    }
  }, [dadosProdutoAPI])

  useEffect(() => {
    if (!modalCadastroRapido) {
      setPrecoSugeridoIA(null)
    }
  }, [modalCadastroRapido])

  const handleCompletarComIA = async () => {
    const dados = await completarComIA({
      sku: skuParaCadastro,
      nomeOriginal: cadastroNome || dadosProdutoAPI?.nome,
      marca: cadastroMarca || dadosProdutoAPI?.marca,
      descricaoOriginal: cadastroDescricao || dadosProdutoAPI?.descricao,
    })

    if (dados) {
      setCadastroNome(dados.nome)
      setCadastroMarca(dados.marca || cadastroMarca)
      setCadastroDescricao(dados.descricao)
      setCadastroCategoria(dados.categoria)

      if (dados.preco_sugerido_min && dados.preco_sugerido_max) {
        setPrecoSugeridoIA({
          min: dados.preco_sugerido_min,
          max: dados.preco_sugerido_max,
        })

        if (!cadastroPreco) {
          const precoMedio =
            (dados.preco_sugerido_min + dados.preco_sugerido_max) / 2
          setCadastroPreco(precoMedio.toFixed(2))
        }
      }
    }
  }

  const salvarProdutoRapido = async () => {
    if (salvandoProdutoRapido) return

    if (
      !cadastroNome.trim() ||
      !cadastroPreco ||
      parseFloat(cadastroPreco) <= 0
    ) {
      addNotification('Nome e preço são obrigatórios', 'error')
      return
    }

    setSalvandoProdutoRapido(true)
    const preco = parseFloat(cadastroPreco)
    const quantidade = parseInt(cadastroQuantidade) || 0

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Usuário não autenticado')

      const { data: novoProduto, error: insertError } = await supabase
        .from('produtos')
        .insert({
          sku: skuParaCadastro,
          nome: cadastroNome,
          marca: cadastroMarca,
          descricao: cadastroDescricao,
          categoria: cadastroCategoria,
          preco_venda: preco,
          quantidade_atual: quantidade,
          imagem_url: dadosProdutoAPI?.imagem_url || '',
          ativo: true,
          usuario_id: userData.user.id,
          quantidade_minima: 10,
          preco_custo: 0,
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.message?.includes('Limite de 100 produtos')) {
          addNotification(
            '⚠️ Limite do plano Iniciante atingido. Faça upgrade!',
            'error',
            6000
          )
          return
        }
        throw insertError
      }

      addNotification(`✅ "${cadastroNome}" cadastrado!`, 'success')
      setModalCadastroRapido(false)
      await fetchProdutos()

      if (novoProduto) {
        adicionarAoCarrinho(novoProduto as Produto)
      }
    } catch (err: any) {
      addNotification(`Erro ao cadastrar: ${err.message}`, 'error')
    } finally {
      setSalvandoProdutoRapido(false)
    }
  }

  // ══════════════════════════════════════════════════
  // CÁLCULOS
  // ══════════════════════════════════════════════════

  const totalItens = carrinho.reduce((acc, i) => acc + i.quantidade, 0)
  const subtotal = carrinho.reduce(
    (acc, i) => acc + i.quantidade * i.preco_unitario,
    0
  )
  const descontoVal = parseFloat(desconto) || 0
  const totalPagar = Math.max(0, subtotal - descontoVal)
  const trocoVal =
    formaPagamento === 'Dinheiro' && parseFloat(valorRecebido) > totalPagar
      ? parseFloat(valorRecebido) - totalPagar
      : 0

  const categorias = useMemo(() => {
    const set = new Set<string>()
    produtos.forEach((p) => {
      if (p.categoria) set.add(p.categoria)
    })
    return Array.from(set).sort()
  }, [produtos])

  // ══════════════════════════════════════════════════
  // VENDA
  // ══════════════════════════════════════════════════

  const processarVenda = async () => {
    setProcessando(true)
    setError('')

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setError('Usuário não autenticado')
        return
      }

      const itensParaVenda = carrinho.map((item) => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
      }))

      const { data: resultado, error: rpcError } = await supabase.rpc(
        'processar_venda',
        {
          p_usuario_id: userData.user.id,
          p_itens: itensParaVenda,
          p_forma_pagamento: formaPagamento,
          p_desconto: descontoVal,
        }
      )

      if (rpcError) {
        console.error('Erro na venda:', rpcError)
        if (rpcError.message.includes('Estoque insuficiente')) {
          setError(rpcError.message)
        } else if (rpcError.message.includes('não encontrado')) {
          setError(
            'Produto não encontrado. Atualize a página e tente novamente.'
          )
        } else {
          setError(
            'Erro ao processar venda. Nenhum item foi alterado. Tente novamente.'
          )
        }
        return
      }

      await gerarCupom({
        itens: resultado.itens,
        desconto: resultado.desconto,
        forma_pagamento: resultado.forma_pagamento,
        valor_recebido: parseFloat(valorRecebido) || undefined,
      })

      const novaVenda: VendaRecente = {
        numero_venda: resultado.numero_venda,
        total: resultado.total,
        forma_pagamento: resultado.forma_pagamento,
        itens: resultado.itens,
        hora: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
      setVendasRecentes((prev) => [novaVenda, ...prev].slice(0, 3))

      addNotification(
        `💰 Venda ${resultado.numero_venda}: ${formatarMoeda(resultado.total)}`,
        'success',
        4000
      )

      // 🆕 Tela de sucesso GIGANTE com troco
      const recebido = parseFloat(valorRecebido) || resultado.total
      const troco =
        formaPagamento === 'Dinheiro'
          ? Math.max(0, recebido - resultado.total)
          : 0
      setTelaSucesso({
        total: resultado.total,
        recebido,
        troco,
        formaPagamento: resultado.forma_pagamento,
      })

      setCarrinho([])
      setDesconto('')
      setValorRecebido('')
      setModalPagamento(false)
      setTimeout(() => {
        fetchProdutos()
        fetchStatsDia()
        fetchTopVendidos()
      }, 800)
    } catch (err) {
      setError('Erro inesperado ao processar venda. Nenhum item foi alterado.')
      console.error(err)
    } finally {
      setProcessando(false)
    }
  }

  const reimprimirCupom = async (venda: VendaRecente) => {
    await gerarCupom({
      itens: venda.itens,
      desconto: 0,
      forma_pagamento: venda.forma_pagamento,
    })
  }

  const produtosFiltrados = produtos.filter((p) => {
    const matchFiltro =
      p.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      p.sku.toLowerCase().includes(filtro.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(filtro.toLowerCase())
    const matchCategoria = !categoriaFiltro || p.categoria === categoriaFiltro
    return matchFiltro && matchCategoria
  })

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        Carregando PDV...
      </div>
    )

  return (
    <div className={`p-4 md:p-6 ${carrinho.length > 0 ? 'pb-60 md:pb-6' : ''}`}>
      {usbDetectado && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Usb size={18} /> Código lido via leitor USB!
        </div>
      )}

      {/* HEADER */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              PDV
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1">
                <Usb size={12} /> USB ativo
              </span>
              <span>·</span>
              <button
                onClick={() => setMostrarAtalhos(true)}
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Keyboard size={12} /> Atalhos (F1)
              </button>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* 🆕 Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg transition"
              title={fullscreen ? 'Sair tela cheia' : 'Tela cheia'}
            >
              {fullscreen ? (
                <Minimize2 size={16} className="text-gray-700 dark:text-gray-300" />
              ) : (
                <Maximize2 size={16} className="text-gray-700 dark:text-gray-300" />
              )}
            </button>

            <button
              onClick={toggleSom}
              className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg transition"
              title={somAtivo ? 'Desativar som' : 'Ativar som'}
            >
              {somAtivo ? (
                <Volume2 size={16} className="text-gray-700 dark:text-gray-300" />
              ) : (
                <VolumeX size={16} className="text-gray-400" />
              )}
            </button>

            <button
              onClick={() => setScannerAberto(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 text-white font-semibold rounded-lg transition text-sm"
            >
              <Camera size={16} />
              <span className="hidden sm:inline">Câmera</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] text-green-700 dark:text-green-400 font-semibold uppercase">
              <TrendingUp size={10} />
              Vendas hoje
            </div>
            <p className="text-sm md:text-lg font-bold text-gray-900 dark:text-white truncate">
              {formatarMoeda(statsDia.faturamento)}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] text-blue-700 dark:text-blue-400 font-semibold uppercase">
              <Receipt size={10} />
              Nº vendas
            </div>
            <p className="text-sm md:text-lg font-bold text-gray-900 dark:text-white">
              {statsDia.totalVendas}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] text-purple-700 dark:text-purple-400 font-semibold uppercase">
              <Percent size={10} />
              Ticket médio
            </div>
            <p className="text-sm md:text-lg font-bold text-gray-900 dark:text-white truncate">
              {formatarMoeda(statsDia.ticketMedio)}
            </p>
          </div>
        </div>

        {vendasRecentes.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase whitespace-nowrap">
              Últimas:
            </span>
            {vendasRecentes.map((v) => (
              <button
                key={v.numero_venda}
                onClick={() => reimprimirCupom(v)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-md text-xs whitespace-nowrap transition"
                title="Reimprimir cupom"
              >
                <Receipt size={10} className="text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatarMoeda(v.total)}
                </span>
                <span className="text-gray-400">· {v.hora}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <Alert message={error} type="error" />}

      {/* 🆕 TOP VENDIDOS DO DIA */}
      {topVendidos.length > 0 && !filtro && !categoriaFiltro && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Mais vendidos hoje
            </h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {topVendidos.map((p) => (
              <button
                key={p.id}
                onClick={() => adicionarAoCarrinho(p)}
                className="relative p-2 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:scale-105 active:scale-95 transition text-left"
              >
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {p.nome}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 font-bold">
                  {formatarMoeda(p.preco_venda)}
                </p>
                {animacaoAdd?.id === p.id && (
                  <span
                    key={animacaoAdd.key}
                    className="absolute -top-1 right-2 text-green-500 font-extrabold text-2xl pointer-events-none animate-floatUp"
                  >
                    +1
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BUSCA */}
      <div className="mb-4 space-y-3">
        <input
          ref={buscaInputRef}
          type="text"
          placeholder="Buscar produto por nome, SKU ou categoria... (F2)"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full"
          autoFocus
        />

        {categorias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoriaFiltro(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                !categoriaFiltro
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setCategoriaFiltro(categoriaFiltro === cat ? null : cat)
                }
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  categoriaFiltro === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Tag size={10} />
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* GRID PRODUTOS + CARRINHO */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <div className="flex-1">
          {produtosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum produto encontrado</p>
              <p className="text-sm mt-1">
                Tente ajustar os filtros ou ler um código de barras
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              {produtosFiltrados.map((produto) => {
                const item = carrinho.find((i) => i.produto_id === produto.id)
                return (
                  <button
                    key={produto.id}
                    onClick={() => adicionarAoCarrinho(produto)}
                    className={`relative p-3 rounded-lg border-2 text-left transition transform hover:scale-105 active:scale-95 flex flex-col h-full ${
                      item
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate dark:text-white">
                          {produto.nome}
                        </p>
                        <p className="text-green-600 dark:text-green-400 font-bold text-base mt-1">
                          {formatarMoeda(produto.preco_venda)}
                        </p>
                      </div>
                      {item && (
                        <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ml-2 flex-shrink-0">
                          {item.quantidade}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-auto pt-1">
                      {produto.quantidade_atual} em estoque
                    </p>

                    {/* 🆕 Animação +1 */}
                    {animacaoAdd?.id === produto.id && (
                      <span
                        key={animacaoAdd.key}
                        className="absolute -top-1 right-2 text-green-500 font-extrabold text-2xl pointer-events-none animate-floatUp"
                      >
                        +1
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* CARRINHO DESKTOP */}
        <div className="hidden md:block w-72 lg:w-80 flex-shrink-0">
          <div className="sticky top-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg dark:text-white">Carrinho</h3>
              {carrinho.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-bold">
                  {totalItens} un
                </span>
              )}
            </div>

            {carrinho.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Carrinho vazio</p>
                <p className="text-xs mt-2 text-gray-500">
                  Escaneie ou clique nos produtos
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto -mx-4 px-4">
                {carrinho.map((item) => {
                  const produto = produtos.find(
                    (p) => p.id === item.produto_id
                  )
                  return (
                    <div
                      key={item.produto_id}
                      className="flex items-center justify-between py-2 border-b dark:border-gray-700"
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-sm font-medium truncate dark:text-white">
                          {produto?.nome}
                        </p>
                        <button
                          onClick={() => removerDoCarrinho(item.produto_id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Remover
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            atualizarQuantidade(
                              item.produto_id,
                              item.quantidade - 1
                            )
                          }
                          className="w-7 h-7 bg-white dark:bg-gray-700 rounded border dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-bold text-sm">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() =>
                            atualizarQuantidade(
                              item.produto_id,
                              item.quantidade + 1
                            )
                          }
                          className="w-7 h-7 bg-white dark:bg-gray-700 rounded border dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="w-20 text-right font-semibold text-sm dark:text-white">
                        {formatarMoeda(item.quantidade * item.preco_unitario)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            {carrinho.length > 0 && (
              <>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      Desconto (F4)
                    </span>
                    <input
                      id="desconto-input"
                      type="number"
                      value={desconto}
                      onChange={(e) => setDesconto(e.target.value)}
                      placeholder="0.00"
                      className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full text-sm"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatarMoeda(subtotal)}</span>
                  </div>
                  {descontoVal > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Desconto</span>
                      <span>-{formatarMoeda(descontoVal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2 dark:border-gray-700">
                    <span>Total</span>
                    <span>{formatarMoeda(totalPagar)}</span>
                  </div>
                </div>
                <button
                  onClick={abrirPagamento}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                >
                  Finalizar Venda
                  <kbd className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded font-mono">
                    F8
                  </kbd>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Limpar carrinho?')) setCarrinho([])
                  }}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={14} />
                  Limpar carrinho
                  <kbd className="text-[9px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-mono">
                    Esc
                  </kbd>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CARRINHO MOBILE */}
      {carrinho.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-2xl z-40">
          <div className="max-h-40 overflow-y-auto px-3 pt-3 space-y-2">
            {carrinho.map((item) => {
              const produto = produtos.find((p) => p.id === item.produto_id)
              return (
                <div
                  key={item.produto_id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium truncate flex-1 mr-2">
                    {produto?.nome}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        atualizarQuantidade(
                          item.produto_id,
                          item.quantidade - 1
                        )
                      }
                      className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center font-bold text-xs">
                      {item.quantidade}
                    </span>
                    <button
                      onClick={() =>
                        atualizarQuantidade(
                          item.produto_id,
                          item.quantidade + 1
                        )
                      }
                      className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="font-semibold ml-2 w-20 text-right">
                    {formatarMoeda(item.quantidade * item.preco_unitario)}
                  </span>
                  <button
                    onClick={() => removerDoCarrinho(item.produto_id)}
                    className="text-red-400 ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="px-3 py-3 border-t dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">
                {carrinho.length} produto(s) · {totalItens} un
              </span>
              <span className="font-bold text-lg">
                {formatarMoeda(totalPagar)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirm('Limpar carrinho?')) setCarrinho([])
                }}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-sm"
              >
                Limpar
              </button>
              <button
                onClick={abrirPagamento}
                className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg"
              >
                Vender · {formatarMoeda(totalPagar)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ATALHOS */}
      {mostrarAtalhos && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setMostrarAtalhos(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold dark:text-white">
                  Atalhos do PDV
                </h3>
              </div>
              <button
                onClick={() => setMostrarAtalhos(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { tecla: 'F1', acao: 'Mostrar esta ajuda' },
                { tecla: 'F2', acao: 'Buscar produto' },
                { tecla: 'F4', acao: 'Aplicar desconto' },
                { tecla: 'F8', acao: 'Finalizar venda' },
                { tecla: 'F10', acao: 'Remover último item' },
                { tecla: 'Esc', acao: 'Fechar modal / Limpar carrinho' },
                { tecla: 'Enter', acao: 'Confirmar leitor USB' },
              ].map(({ tecla, acao }) => (
                <div
                  key={tecla}
                  className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {acao}
                  </span>
                  <kbd className="px-2.5 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono font-bold text-gray-700 dark:text-gray-300 shadow-sm">
                    {tecla}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="mt-5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 <strong>Dica:</strong> Conecte um leitor USB de código de barras
                e ele funciona automaticamente. Só apontar e bipar!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAGAMENTO */}
      {modalPagamento && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold dark:text-white">
                Finalizar Venda
              </h3>
              <button
                onClick={() => setModalPagamento(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex justify-between text-sm">
              <span>{totalItens} item(ns)</span>
              <span>{formatarMoeda(subtotal)}</span>
            </div>
            {descontoVal > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Desconto</span>
                <span>-{formatarMoeda(descontoVal)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl border-t dark:border-gray-700 pt-2">
              <span>Total</span>
              <span>{formatarMoeda(totalPagar)}</span>
            </div>

            <div>
              <p className="text-sm font-medium mb-2 dark:text-gray-300">
                Forma de pagamento
              </p>
              <div className="grid grid-cols-4 gap-2">
                {FORMAS_PAGAMENTO.map(({ label, icon: Icon, value }) => (
                  <button
                    key={value}
                    onClick={() => setFormaPagamento(value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-medium transition ${
                      formaPagamento === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {formaPagamento === 'Dinheiro' && (
              <div className="space-y-3">
                <label className="text-sm font-medium dark:text-gray-300">
                  Valor recebido (R$)
                </label>
                <input
                  type="number"
                  value={valorRecebido}
                  onChange={(e) => setValorRecebido(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full text-lg font-bold"
                />

                {/* 🆕 BOTÕES DE CÉDULAS RÁPIDAS */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2">
                    Cliente pagou com
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setValorRecebido(totalPagar.toFixed(2))}
                      className="py-3 bg-gradient-to-br from-green-500 to-emerald-600 hover:shadow-md text-white text-sm font-bold rounded-xl transition"
                    >
                      Valor exato
                    </button>
                    {(() => {
  const sugestoes = new Set<number>()
  ;[5, 10, 20, 50, 100, 200].forEach((cedula) => {
    const arredondado = Math.ceil(totalPagar / cedula) * cedula
    const sugestao = cedula >= totalPagar ? cedula : arredondado
    if (sugestao > totalPagar) sugestoes.add(sugestao)
  })
  return Array.from(sugestoes)
    .sort((a, b) => a - b)
    .slice(0, 6)
    .map((sugestao) => {
      const isAtivo = parseFloat(valorRecebido) === sugestao
      return (
        <button
          key={sugestao}
          type="button"
          onClick={() => setValorRecebido(sugestao.toFixed(2))}
          className={`py-3 text-sm font-bold rounded-xl border-2 transition ${
            isAtivo
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 text-gray-700 dark:text-gray-300'
          }`}
        >
          R$ {sugestao.toFixed(0)}
        </button>
      )
    })
})()}
                  </div>
                </div>

                {trocoVal > 0 && (
                  <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                    <span className="text-green-700 dark:text-green-400 font-medium">
                      Troco
                    </span>
                    <span className="text-green-700 dark:text-green-400 font-bold text-lg">
                      {formatarMoeda(trocoVal)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={processarVenda}
              disabled={processando}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-lg transition"
            >
              {processando ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </span>
              ) : (
                `Confirmar · ${formatarMoeda(totalPagar)}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO RÁPIDO */}
      {modalCadastroRapido && dadosProdutoAPI && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold dark:text-white">
                Cadastrar novo produto
              </h4>
              <button
                onClick={() => setModalCadastroRapido(false)}
                className="text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-lg">💡</span>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>Como usar:</strong> Digite o <strong>nome do produto</strong> no campo abaixo
                  (ex: &quot;coca lata 350&quot;) e clique no botão. A IA completa categoria, descrição
                  e sugere preço.
                </p>
              </div>
              <BotaoIA
                onClick={handleCompletarComIA}
                carregando={carregandoIA}
                label="✨ Completar com IA"
                className="w-full justify-center"
              />
              {!cadastroNome.trim() && (
                <p className="text-xs text-amber-700 dark:text-amber-400 text-center mt-2 font-medium">
                  ⚠️ Digite o nome do produto primeiro
                </p>
              )}
            </div>

            {dadosProdutoAPI.encontrado === true && (
              <p className="text-sm text-green-600 dark:text-green-400 mb-4 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                ✅ Produto encontrado na base externa. Confirme os dados e ajuste o necessário.
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  SKU (código)
                </label>
                <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                  {skuParaCadastro}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">Nome *</label>
                <input
                  value={cadastroNome}
                  onChange={(e) => setCadastroNome(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">Marca</label>
                <input
                  value={cadastroMarca}
                  onChange={(e) => setCadastroMarca(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">
                  Descrição
                </label>
                <textarea
                  value={cadastroDescricao}
                  onChange={(e) => setCadastroDescricao(e.target.value)}
                  className="input-field w-full"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">
                  Categoria
                </label>
                <input
                  value={cadastroCategoria}
                  onChange={(e) => setCadastroCategoria(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">
                  Preço de venda *
                </label>
                <input
                  type="number"
                  value={cadastroPreco}
                  onChange={(e) => setCadastroPreco(e.target.value)}
                  className="input-field w-full"
                  placeholder="0.00"
                />
                {precoSugeridoIA && (
                  <div className="mt-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      💡 IA sugere: {formatarMoeda(precoSugeridoIA.min)} a{' '}
                      {formatarMoeda(precoSugeridoIA.max)}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">
                  Quantidade inicial
                </label>
                <input
                  type="number"
                  value={cadastroQuantidade}
                  onChange={(e) => setCadastroQuantidade(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              {dadosProdutoAPI.imagem_url && (
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Imagem
                  </label>
                  <Image
                    src={dadosProdutoAPI.imagem_url}
                    alt=""
                    width={96}
                    height={96}
                    className="w-24 h-24 object-contain rounded"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={salvarProdutoRapido}
                disabled={salvandoProdutoRapido}
                className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition"
              >
                {salvandoProdutoRapido ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  'Salvar e usar'
                )}
              </button>
              <button
                onClick={() => setModalCadastroRapido(false)}
                disabled={salvandoProdutoRapido}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 TELA DE SUCESSO GIGANTE PÓS-VENDA */}
      {telaSucesso && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center p-4 animate-fadeIn">
          <div className="text-center text-white max-w-2xl w-full">
            <div className="inline-flex w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm items-center justify-center mb-6 animate-bounce">
              <CheckCircle2 className="w-14 h-14" />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Venda realizada! 🎉
            </h2>
            <p className="text-green-100 mb-8">{telaSucesso.formaPagamento}</p>

            {/* Total cobrado */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-4">
              <p className="text-sm text-green-100 uppercase font-bold tracking-wider mb-1">
                Total cobrado
              </p>
              <p className="text-5xl md:text-6xl font-extrabold">
                {formatarMoeda(telaSucesso.total)}
              </p>
            </div>

            {/* TROCO GIGANTE (só se for dinheiro) */}
            {telaSucesso.troco > 0 && (
              <div className="bg-white text-green-600 rounded-3xl p-8 mb-6 shadow-2xl">
                <p className="text-sm text-green-500 uppercase font-bold tracking-wider mb-2">
                  💰 Devolver de troco
                </p>
                <p className="text-7xl md:text-8xl font-extrabold leading-none">
                  {formatarMoeda(telaSucesso.troco)}
                </p>
                <p className="text-sm text-gray-500 mt-3">
                  Cliente pagou {formatarMoeda(telaSucesso.recebido)}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => setTelaSucesso(null)}
                className="px-8 py-3 bg-white text-green-700 font-bold rounded-full hover:shadow-xl transition flex items-center gap-2"
              >
                Próxima venda
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-green-100 mt-6">
              Tela fecha em 8 segundos (ou aperte Esc)
            </p>
          </div>
        </div>
      )}

      {/* SCANNER */}
      {scannerAberto && (
        <BarcodeScanner
          onDetected={handleCodigoBarrasLido}
          onClose={() => setScannerAberto(false)}
        />
      )}

      {/* CUPOM */}
      {cupomAberto && dadosCupom && (
        <CupomImpressao dados={dadosCupom} onFechar={fecharCupom} />
      )}

      {/* 🆕 ANIMAÇÕES CSS */}
      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(0);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-30px);
          }
        }
        .animate-floatUp {
          animation: floatUp 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
