"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getProductImageUrl } from '@/lib/image-utils'
import { Produto } from '@/lib/types'
import Alert from '@/components/alerts'
import CupomImpressao from '@/components/cupom-impressao'
import BarcodeScanner from '@/components/barcode-scanner'
import { buscarProdutoPorBarcode } from '@/lib/barcode-api'
import { useCupom } from '@/hooks/useCupom'
import { useNotification } from '@/contexts/NotificationContext'
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  Camera,
  Usb,
} from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'

interface ItemCarrinho {
  produto_id: string
  quantidade: number
  preco_unitario: number
}

const FORMAS_PAGAMENTO = [
  { label: 'Dinheiro', icon: Banknote, value: 'Dinheiro' },
  { label: 'Pix', icon: QrCode, value: 'Pix' },
  { label: 'D\u00e9bito', icon: CreditCard, value: 'Cart\u00e3o D\u00e9bito' },
  { label: 'Cr\u00e9dito', icon: CreditCard, value: 'Cart\u00e3o Cr\u00e9dito' },
]

export default function PDVPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [filtro, setFiltro] = useState('')
  const [error, setError] = useState('')
  const [processando, setProcessando] = useState(false)

  // Pagamento
  const [modalPagamento, setModalPagamento] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro')
  const [valorRecebido, setValorRecebido] = useState('')
  const [desconto, setDesconto] = useState('')

  // Scanner e cadastro r\u00e1pido
  const [scannerAberto, setScannerAberto] = useState(false)
  const [modalCadastroRapido, setModalCadastroRapido] = useState(false)
  const [dadosProdutoAPI, setDadosProdutoAPI] = useState<any>(null)
  const [skuParaCadastro, setSkuParaCadastro] = useState('')

  // USB Scanner (leitor pistola)
  const [usbDetectado, setUsbDetectado] = useState(false)
  const usbBufferRef = useRef('')
  const usbTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { addNotification } = useNotification()
  const { cupomAberto, dadosCupom, gerarCupom, fecharCupom } = useCupom()

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  //  FETCH PRODUTOS
  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  useEffect(() => {
    fetchProdutos()
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

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  //  CARRINHO
  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  const adicionarAoCarrinho = useCallback(
    (produto: Produto) => {
      setCarrinho((prev) => {
        const itemExistente = prev.find((i) => i.produto_id === produto.id)
        if (itemExistente) {
          if (itemExistente.quantidade < produto.quantidade_atual) {
            addNotification(`\u27a1\ufe0f ${produto.nome}`, 'info', 800)
            return prev.map((i) =>
              i.produto_id === produto.id
                ? { ...i, quantidade: i.quantidade + 1 }
                : i
            )
          } else {
            addNotification(`\u274c Estoque insuficiente`, 'warning')
            return prev
          }
        } else {
          addNotification(`\u2705 ${produto.nome}`, 'success', 800)
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
    [addNotification]
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

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  //  C\u00d3DIGO DE BARRAS (c\u00e2mera + USB)
  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  const handleCodigoBarrasLido = useCallback(
    async (codigoBarras: string) => {
      // 1. Busca no banco local
      const produtoLocal = produtos.find((p) => p.sku === codigoBarras)
      if (produtoLocal) {
        adicionarAoCarrinho(produtoLocal)
        addNotification(
          `\u2705 ${produtoLocal.nome} adicionado`,
          'success',
          2000
        )
        return
      }

      // 2. N\u00e3o achou local: consulta APIs externas
      addNotification(`\ud83d\udd0d Buscando ${codigoBarras}...`, 'info', 2000)
      const resultadoAPI = await buscarProdutoPorBarcode(codigoBarras)

      if (resultadoAPI.encontrado) {
        setSkuParaCadastro(codigoBarras)
        setDadosProdutoAPI(resultadoAPI)
        setModalCadastroRapido(true)
      } else {
        addNotification(
          `\u274c Produto ${codigoBarras} n\u00e3o encontrado. Cadastre manualmente.`,
          'warning',
          5000
        )
      }
    },
    [produtos, adicionarAoCarrinho, addNotification]
  )

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  //  LEITOR USB DE C\u00d3DIGO DE BARRAS (pistola)
  //
  //  Leitores USB funcionam como teclado:
  //  - Digitam caracteres muito r\u00e1pido (<50ms entre teclas)
  //  - Pressionam Enter no final
  //
  //  Estrat\u00e9gia:
  //  - Acumula caracteres digitados em <100ms
  //  - Se Enter + buffer >= 8 chars \u2192 \u00e9 barcode
  //  - Ignora quando INPUT/TEXTAREA est\u00e1 focado
  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se algum input/textarea est\u00e1 focado (usu\u00e1rio digitando)
      const activeTag = document.activeElement?.tagName?.toUpperCase()
      if (
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        activeTag === 'SELECT'
      ) {
        return
      }

      // Ignora teclas modificadoras
      if (e.ctrlKey || e.metaKey || e.altKey) return

      // Enter com buffer suficiente = c\u00f3digo de barras!
      if (e.key === 'Enter') {
        const code = usbBufferRef.current.trim()
        if (code.length >= 8) {
          e.preventDefault()
          e.stopPropagation()

          // Feedback visual
          setUsbDetectado(true)
          setTimeout(() => setUsbDetectado(false), 2000)

          // Vibra\u00e7\u00e3o (se dispon\u00edvel)
          if (navigator.vibrate) navigator.vibrate(200)

          // Processa o c\u00f3digo
          handleCodigoBarrasLido(code)
        }
        usbBufferRef.current = ''
        return
      }

      // S\u00f3 aceita caracteres imprim\u00edveis de 1 char
      if (e.key.length !== 1) {
        usbBufferRef.current = ''
        return
      }

      // Acumula no buffer
      usbBufferRef.current += e.key

      // Limpa buffer se demorar (digita\u00e7\u00e3o humana \u00e9 lenta)
      if (usbTimeoutRef.current) clearTimeout(usbTimeoutRef.current)
      usbTimeoutRef.current = setTimeout(() => {
        usbBufferRef.current = ''
      }, 100) // Leitores USB digitam em <50ms entre teclas
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      if (usbTimeoutRef.current) clearTimeout(usbTimeoutRef.current)
    }
  }, [handleCodigoBarrasLido])

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  //  CADASTRO R\u00c1PIDO
  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  const salvarProdutoRapido = async () => {
    const nomeInput = document.getElementById(
      'cadastroNome'
    ) as HTMLInputElement
    const marcaInput = document.getElementById(
      'cadastroMarca'
    ) as HTMLInputElement
    const descricaoInput = document.getElementById(
      'cadastroDescricao'
    ) as HTMLTextAreaElement
    const categoriaInput = document.getElementById(
      'cadastroCategoria'
    ) as HTMLInputElement
    const precoInput = document.getElementById(
      'cadastroPreco'
    ) as HTMLInputElement
    const quantidadeInput = document.getElementById(
      'cadastroQuantidade'
    ) as HTMLInputElement
    const imagemInput = document.getElementById(
      'cadastroImagem'
    ) as HTMLInputElement

    const nome = nomeInput?.value.trim()
    const marca = marcaInput?.value.trim()
    const descricao = descricaoInput?.value.trim()
    const categoria = categoriaInput?.value.trim()
    const preco = parseFloat(precoInput?.value || '0')
    const quantidade = parseInt(quantidadeInput?.value || '0')
    const imagem = imagemInput?.value || dadosProdutoAPI?.imagem_url || ''

    if (!nome || isNaN(preco) || preco <= 0) {
      addNotification('Nome e pre\u00e7o s\u00e3o obrigat\u00f3rios', 'error')
      return
    }

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Usu\u00e1rio n\u00e3o autenticado')

      const { error: insertError } = await supabase.from('produtos').insert({
        sku: skuParaCadastro,
        nome,
        marca,
        descricao,
        categoria,
        preco_venda: preco,
        quantidade_atual: quantidade,
        imagem_url: imagem,
        ativo: true,
        usuario_id: userData.user.id,
        quantidade_minima: 10,
        preco_custo: 0,
      })

      if (insertError) throw insertError

      addNotification(
        `\u2705 Produto "${nome}" cadastrado com sucesso!`,
        'success'
      )
      setModalCadastroRapido(false)
      await fetchProdutos()

      const novoProduto = {
        id: 'temp',
        sku: skuParaCadastro,
        nome,
        preco_venda: preco,
        quantidade_atual: quantidade,
      } as Produto
      adicionarAoCarrinho(novoProduto)
    } catch (err: any) {
      addNotification(`Erro ao cadastrar: ${err.message}`, 'error')
    }
  }

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  //  C\u00c1LCULOS
  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
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

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  //  PAGAMENTO
  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  const abrirPagamento = () => {
    if (carrinho.length === 0) {
      addNotification('Carrinho vazio', 'warning')
      return
    }
    setValorRecebido(totalPagar.toFixed(2))
    setModalPagamento(true)
  }

  const processarVenda = async () => {
    setProcessando(true)
    setError('')

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setError('Usu\u00e1rio n\u00e3o autenticado')
        return
      }

      for (const item of carrinho) {
        const produto = produtos.find((p) => p.id === item.produto_id)
        if (!produto) continue

        const { error: movErr } = await supabase
          .from('movimentos_estoque')
          .insert([
            {
              produto_id: item.produto_id,
              tipo_movimento: 'saida',
              quantidade: item.quantidade,
              motivo: `PDV - ${formaPagamento} - ${formatarMoeda(
                item.quantidade * item.preco_unitario
              )}`,
              usuario_id: userData.user.id,
            },
          ])
        if (movErr) {
          setError(`Erro ao registrar ${produto.nome}`)
          return
        }

        const novaQtd = produto.quantidade_atual - item.quantidade
        await supabase
          .from('produtos')
          .update({ quantidade_atual: novaQtd })
          .eq('id', item.produto_id)

        if (novaQtd < produto.quantidade_minima) {
          await supabase.from('alertas').insert([
            {
              produto_id: item.produto_id,
              usuario_id: userData.user.id,
              tipo_alerta:
                novaQtd <= 0 ? 'estoque_critico' : 'estoque_baixo',
              visualizado: false,
            },
          ])
        }
      }

      await gerarCupom({
        itens: carrinho.map((item) => {
          const produto = produtos.find((p) => p.id === item.produto_id)!
          return {
            nome: produto.nome,
            sku: produto.sku,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.quantidade * item.preco_unitario,
          }
        }),
        desconto: descontoVal,
        forma_pagamento: formaPagamento,
        valor_recebido: parseFloat(valorRecebido) || undefined,
      })

      addNotification(
        `\ud83d\udcb0 Venda: ${formatarMoeda(totalPagar)}`,
        'success',
        4000
      )
      setCarrinho([])
      setDesconto('')
      setValorRecebido('')
      setModalPagamento(false)
      setTimeout(fetchProdutos, 800)
    } catch (err) {
      setError('Erro ao processar venda')
      console.error(err)
    } finally {
      setProcessando(false)
    }
  }

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  //  FILTRO
  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      p.sku.toLowerCase().includes(filtro.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(filtro.toLowerCase())
  )

  if (loading)
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        Carregando...
      </div>
    )

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  //  COMPONENTES INTERNOS
  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  const ProdutoCard = ({ produto }: { produto: Produto }) => {
    const item = carrinho.find((i) => i.produto_id === produto.id)
    return (
      <button
        onClick={() => adicionarAoCarrinho(produto)}
        className={`p-3 rounded-lg border-2 text-left transition transform hover:scale-105 active:scale-95 flex flex-col h-full ${
          item
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }`}
      >
        <div className="w-full h-20 mb-2 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image
            src={getProductImageUrl(produto.imagem_url)}
            alt={produto.nome}
            width={200}
            height={80}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
        <p className="font-semibold text-xs line-clamp-2 flex-1">
          {produto.nome}
        </p>
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm font-bold text-green-600 dark:text-green-400">
            {formatarMoeda(produto.preco_venda)}
          </p>
          {item && (
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {item.quantidade}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {produto.quantidade_atual} em estoque
        </p>
      </button>
    )
  }

  const ItemCarrinhoCard = ({ item }: { item: ItemCarrinho }) => {
    const produto = produtos.find((p) => p.id === item.produto_id)
    return (
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        <div className="flex justify-between items-start mb-2">
          <p className="font-medium text-sm flex-1 truncate pr-2">
            {produto?.nome}
          </p>
          <button
            onClick={() => removerDoCarrinho(item.produto_id)}
            className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded p-0.5"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                atualizarQuantidade(item.produto_id, item.quantidade - 1)
              }
              className="w-7 h-7 bg-white dark:bg-gray-700 rounded border dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <Minus size={12} />
            </button>
            <span className="w-8 text-center text-sm font-bold">
              {item.quantidade}
            </span>
            <button
              onClick={() =>
                atualizarQuantidade(item.produto_id, item.quantidade + 1)
              }
              className="w-7 h-7 bg-white dark:bg-gray-700 rounded border dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <Plus size={12} />
            </button>
          </div>
          <p className="font-bold text-sm">
            {formatarMoeda(item.quantidade * item.preco_unitario)}
          </p>
        </div>
      </div>
    )
  }

  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  //  RENDER
  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-40 md:pb-0">
      {/* \u2500\u2500 INDICADOR USB SCANNER \u2500\u2500 */}
      {usbDetectado && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-green-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold">
            <Usb size={16} />
            C\u00f3digo lido via leitor USB!
          </div>
        </div>
      )}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 DESKTOP \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      <div className="hidden md:grid lg:grid-cols-3 gap-6 p-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                PDV
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Ponto de Venda
                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                  \u2022 Leitor USB ativo
                </span>
              </p>
            </div>
            <button
              onClick={() => setScannerAberto(true)}
              className="btn-primary flex items-center gap-2 px-4"
            >
              <Camera size={18} /> <span>Ler c\u00f3digo</span>
            </button>
          </div>

          {error && <Alert message={error} type="error" />}

          <input
            type="text"
            placeholder="Buscar produto, SKU ou categoria..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full"
            autoFocus
          />

          <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
            {produtosFiltrados.map((p) => (
              <ProdutoCard key={p.id} produto={p} />
            ))}
          </div>
        </div>

        {/* \u2500\u2500 CARRINHO DESKTOP \u2500\u2500 */}
        <div className="card dark:bg-gray-900 dark:border-gray-800 flex flex-col h-fit sticky top-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b dark:border-gray-700">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <ShoppingCart size={20} />
              Carrinho
            </h2>
            {carrinho.length > 0 && (
              <span className="bg-blue-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {totalItens} un
              </span>
            )}
          </div>

          <div className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
            {carrinho.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                Carrinho vazio
              </p>
            ) : (
              carrinho.map((i) => (
                <ItemCarrinhoCard key={i.produto_id} item={i} />
              ))
            )}
          </div>

          {carrinho.length > 0 && (
            <>
              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">
                  Desconto (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={desconto}
                  onChange={(e) => setDesconto(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full text-sm"
                />
              </div>

              <div className="border-t dark:border-gray-700 pt-3 space-y-1 mb-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatarMoeda(subtotal)}</span>
                </div>
                {descontoVal > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Desconto</span>
                    <span>-{formatarMoeda(descontoVal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl text-green-600 dark:text-green-400 pt-1">
                  <span>Total</span>
                  <span>{formatarMoeda(totalPagar)}</span>
                </div>
              </div>

              <button
                onClick={abrirPagamento}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 mb-2"
              >
                <Check size={18} />
                Finalizar Venda
              </button>
              <button
                onClick={() => setCarrinho([])}
                className="btn-secondary w-full py-2 text-sm"
              >
                Limpar carrinho
              </button>
            </>
          )}
        </div>
      </div>

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 MOBILE \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      <div className="md:hidden space-y-3 p-3">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold dark:text-white">PDV</h1>
          <button
            onClick={() => setScannerAberto(true)}
            className="btn-primary px-3 py-2"
          >
            <Camera size={18} />
          </button>
        </div>

        {error && <Alert message={error} type="error" />}

        <input
          type="text"
          placeholder="Buscar..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full"
        />

        <div className="grid grid-cols-2 gap-2">
          {produtosFiltrados.map((p) => (
            <ProdutoCard key={p.id} produto={p} />
          ))}
        </div>
      </div>

      {/* \u2500\u2500 BARRA MOBILE INFERIOR \u2500\u2500 */}
      {carrinho.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-2xl p-4 z-40">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-gray-400">
                {carrinho.length} produto(s) \u00b7 {totalItens} un
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatarMoeda(totalPagar)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCarrinho([])}
                className="btn-secondary py-2.5 px-4 text-sm"
              >
                Limpar
              </button>
              <button
                onClick={abrirPagamento}
                className="btn-primary py-2.5 px-4 text-sm flex items-center gap-1"
              >
                <Check size={16} />
                Vender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 MODAL DE PAGAMENTO \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {modalPagamento && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold dark:text-white">
                Finalizar Venda
              </h2>
              <button
                onClick={() => setModalPagamento(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-5 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>{totalItens} item(ns)</span>
                <span>{formatarMoeda(subtotal)}</span>
              </div>
              {descontoVal > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Desconto</span>
                  <span>-{formatarMoeda(descontoVal)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl text-green-600 dark:text-green-400 border-t dark:border-gray-700 pt-2 mt-2">
                <span>Total</span>
                <span>{formatarMoeda(totalPagar)}</span>
              </div>
            </div>

            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Forma de pagamento
            </p>
            <div className="grid grid-cols-4 gap-2 mb-4">
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

            {formaPagamento === 'Dinheiro' && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Valor recebido (R$)
                </label>
                <input
                  type="number"
                  min={totalPagar}
                  step="0.01"
                  value={valorRecebido}
                  onChange={(e) => setValorRecebido(e.target.value)}
                  className="input-field dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 w-full text-lg font-bold"
                />
                {trocoVal > 0 && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex justify-between">
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
              className="btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center gap-2"
            >
              <Check size={20} />
              {processando
                ? 'Processando...'
                : `Confirmar \u2022 ${formatarMoeda(totalPagar)}`}
            </button>
          </div>
        </div>
      )}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 MODAL DE CADASTRO R\u00c1PIDO \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {modalCadastroRapido && dadosProdutoAPI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">
                Cadastrar novo produto
              </h2>
              <button
                onClick={() => setModalCadastroRapido(false)}
                className="text-gray-400"
              >
                <X size={22} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Produto encontrado na base externa. Confirme os dados e ajuste o
              necess\u00e1rio.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  SKU (c\u00f3digo)
                </label>
                <input
                  type="text"
                  value={skuParaCadastro}
                  disabled
                  className="input-field bg-gray-100 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome *
                </label>
                <input
                  id="cadastroNome"
                  defaultValue={dadosProdutoAPI.nome}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Marca</label>
                <input
                  id="cadastroMarca"
                  defaultValue={dadosProdutoAPI.marca}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Descri\u00e7\u00e3o
                </label>
                <textarea
                  id="cadastroDescricao"
                  defaultValue={dadosProdutoAPI.descricao}
                  rows={2}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Categoria
                </label>
                <input
                  id="cadastroCategoria"
                  defaultValue={dadosProdutoAPI.categoria}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Pre\u00e7o de venda *
                </label>
                <input
                  id="cadastroPreco"
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantidade inicial
                </label>
                <input
                  id="cadastroQuantidade"
                  type="number"
                  defaultValue="0"
                  className="input-field"
                />
              </div>
              {dadosProdutoAPI.imagem_url && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Imagem
                  </label>
                  <img
                    src={dadosProdutoAPI.imagem_url}
                    alt="pr\u00e9via"
                    className="w-24 h-24 object-cover rounded border"
                  />
                  <input
                    id="cadastroImagem"
                    type="hidden"
                    value={dadosProdutoAPI.imagem_url}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={salvarProdutoRapido}
                className="btn-primary flex-1"
              >
                Salvar e usar
              </button>
              <button
                onClick={() => setModalCadastroRapido(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 SCANNER \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {scannerAberto && (
        <BarcodeScanner
          onDetected={handleCodigoBarrasLido}
          onClose={() => setScannerAberto(false)}
        />
      )}

      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 CUPOM \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
      {cupomAberto && dadosCupom && (
        <CupomImpressao dados={dadosCupom} onFechar={fecharCupom} />
      )}
    </div>
  )
}
