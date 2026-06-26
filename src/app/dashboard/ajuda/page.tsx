// src/app/dashboard/ajuda/page.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  HelpCircle, Search, Book, MessageCircle, Keyboard,
  Package, ShoppingCart, BarChart3, AlertCircle, Users,
  ChevronDown, ChevronUp, ExternalLink, Phone,
  ThumbsUp, ThumbsDown, Copy, Check, X, Sparkles,
  Clock, Zap, CreditCard, Bot,
} from 'lucide-react'

const FAQ_ITEMS = [
  {
    categoria: 'Primeiros Passos',
    icon: Package,
    cor: 'blue',
    perguntas: [
      { p: 'Como cadastrar meu primeiro produto?', r: 'Vá em Produtos, clique em Novo Produto. Preencha nome, SKU (ou use a câmera para ler o código de barras), preço de venda e quantidade inicial. Clique em Salvar Produto e pronto! Você também pode importar vários produtos de uma vez via CSV (planos Profissional e Negócio).' },
      { p: 'Como funciona o período de teste?', r: 'Você tem 15 dias grátis com acesso completo a TODAS as funcionalidades de TODOS os planos, incluindo as features de IA. Não precisa de cartão de crédito.' },
      { p: 'Quais são os planos disponíveis?', r: 'Iniciante (R$ 39,90/mês) — até 100 produtos. Profissional (R$ 79,90/mês) — produtos ilimitados, clientes/fiado, IA de análise. Negócio (R$ 149,90/mês) — tudo do Profissional + IA pra cadastro automático e sugestão de preço.' },
      { p: 'Posso usar no celular?', r: 'Sim! O EstoqueSystem é 100% responsivo. PDV, leitor de código de barras e todas as funcionalidades funcionam no celular e tablet.' },
      { p: 'Preciso instalar alguma coisa?', r: 'Não! Funciona direto no navegador (Chrome, Safari, Firefox). Sem instalação. Acessa de qualquer dispositivo com internet.' },
    ],
  },
  {
    categoria: 'PDV e Vendas',
    icon: ShoppingCart,
    cor: 'green',
    perguntas: [
      { p: 'Como registrar uma venda?', r: 'Acesse o PDV, selecione os produtos clicando neles (ou escaneie o código de barras), escolha a forma de pagamento e clique em Finalizar Venda. O estoque é atualizado automaticamente.' },
      { p: 'Quais formas de pagamento são aceitas?', r: 'No PDV você registra vendas em: Dinheiro (com cálculo de troco), PIX, Cartão de Débito e Cartão de Crédito.' },
      { p: 'Como enviar o cupom pelo WhatsApp?', r: 'Após finalizar a venda, o cupom aparece automaticamente. Clique no botão WhatsApp para enviar ao cliente. Disponível nos planos Profissional e Negócio.' },
      { p: 'Posso usar leitor de código de barras USB?', r: 'Sim! Conecte qualquer leitor USB e o sistema reconhece automaticamente. Não precisa configurar. Funciona em paralelo com a câmera do celular.' },
    ],
  },
  {
    categoria: 'Estoque e Produtos',
    icon: BarChart3,
    cor: 'purple',
    perguntas: [
      { p: 'O que significam os alertas de estoque?', r: 'Estoque Baixo: quantidade abaixo do mínimo definido. Estoque Crítico: produto zerou. Configure a quantidade mínima em cada produto para receber alertas automáticos.' },
      { p: 'Como fazer entrada de mercadoria?', r: 'Vá em Estoque, clique em Novo Movimento. Selecione o produto, escolha Entrada, informe a quantidade recebida e um motivo. O estoque será atualizado e o alerta de estoque baixo removido.' },
      { p: 'Como funciona o controle de validade?', r: 'No cadastro do produto, preencha o campo Data de Validade. O sistema exibirá avisos na Dashboard quando produtos estiverem próximos de vencer (7 dias ou menos). Disponível nos planos Profissional e Negócio.' },
      { p: 'Como importar produtos via CSV?', r: 'Vá em Produtos > Importar CSV. Baixe o template, preencha no Excel ou Google Sheets e envie de volta. Importe até 500 produtos de uma vez. Disponível nos planos Profissional e Negócio.' },
    ],
  },
  {
    categoria: 'Clientes e Fiado',
    icon: Users,
    cor: 'orange',
    perguntas: [
      { p: 'Como cadastrar um cliente?', r: 'Vá em Clientes, clique em Novo Cliente. Preencha nome, telefone e outros dados opcionais. Disponível nos planos Profissional e Negócio.' },
      { p: 'Como controlar o fiado?', r: 'Na página do cliente, clique em Novo Débito para adicionar uma venda fiado, ou Registrar Pagamento quando o cliente pagar. O saldo é calculado automaticamente.' },
      { p: 'O cliente recebe lembrete?', r: 'Por enquanto não. Mas você pode mandar uma mensagem manual pelo WhatsApp direto da página do cliente, com o saldo devedor já preenchido.' },
    ],
  },
  {
    categoria: 'Planos e Pagamento',
    icon: CreditCard,
    cor: 'emerald',
    perguntas: [
      { p: 'Como faço o pagamento?', r: 'Via Mercado Pago. Aceitamos PIX (pagamento mensal) ou Cartão de Crédito (assinatura automática). Acesso liberado na hora após confirmação.' },
      { p: 'Posso cancelar quando quiser?', r: 'Sim! Sem fidelidade, sem multa. Cancela direto em Perfil > Cancelar Assinatura. O acesso continua até o final do mês já pago.' },
      { p: 'Posso trocar de plano sem perder dados?', r: 'Sim! Faça upgrade ou downgrade a qualquer momento. Seus produtos, clientes, vendas e configurações ficam intactos. Cobrança ajustada proporcionalmente.' },
      { p: 'Esqueci minha senha. O que faço?', r: 'Na tela de login, clique em "Esqueci a senha". Você receberá um link no email pra redefinir. Se não chegar em 5 minutos, verifique o spam ou chama o Lucas no WhatsApp.' },
    ],
  },
  {
    categoria: 'Inteligência Artificial',
    icon: Bot,
    cor: 'pink',
    perguntas: [
      { p: 'Como funciona o cadastro automático com IA?', r: 'No cadastro de produto, digite só o nome (ex: "coca lata 350") e clique em "Completar com IA". A IA preenche categoria, descrição, marca e sugere preço de venda. Disponível no plano Negócio.' },
      { p: 'Como a IA sugere preços?', r: 'A IA analisa preço de custo, categoria, marca e tipo de produto pra sugerir 3 opções: Conservador, Equilibrado e Agressivo. Cada uma com margem calculada. Disponível no plano Negócio.' },
      { p: 'O que é a análise mensal com IA?', r: 'Uma vez por mês, a IA analisa todas as suas vendas e gera um relatório em linguagem natural: o que vendeu mais, o que está parado, sugestões de promoção. Tipo um consultor amigo. Disponível nos planos Profissional e Negócio.' },
    ],
  },
  {
    categoria: 'Equipe e Segurança',
    icon: Users,
    cor: 'indigo',
    perguntas: [
      { p: 'Posso adicionar funcionários?', r: 'Sim! Vá em Equipe, informe o email do funcionário e o sistema gera uma senha temporária. Funcionários têm acesso apenas ao PDV e Estoque. Limites: 1 no Iniciante, 3 no Profissional, 10 no Negócio.' },
      { p: 'Dois usuários podem usar o PDV ao mesmo tempo?', r: 'Sim! O sistema suporta vendas simultâneas em dispositivos diferentes. Ideal pra lojas com 2+ caixas.' },
      { p: 'Meus dados ficam seguros?', r: 'Sim. Usamos Supabase com criptografia em trânsito (TLS/SSL) e em repouso. Senhas em hash seguro. Backups diários. Conformidade com LGPD.' },
    ],
  },
]

const TUTORIAIS = [
  { icon: Package, titulo: 'Cadastrar Produto', desc: 'Adicione seus produtos com nome, preço, foto e código de barras.', link: '/dashboard/produtos/novo', tempo: '2 min', novo: false },
  { icon: ShoppingCart, titulo: 'Usar o PDV', desc: 'Faça vendas, escaneie produtos e emita cupom pelo WhatsApp.', link: '/dashboard/pdv', tempo: '3 min', novo: false },
  { icon: BarChart3, titulo: 'Ver Relatórios', desc: 'Acompanhe vendas, lucro e movimentação com gráficos.', link: '/dashboard/relatorios', tempo: '2 min', novo: false },
  { icon: AlertCircle, titulo: 'Gerenciar Alertas', desc: 'Monitore produtos com estoque baixo ou crítico.', link: '/dashboard/alertas', tempo: '1 min', novo: false },
  { icon: Users, titulo: 'Convidar Equipe', desc: 'Adicione funcionários com acesso limitado ao PDV.', link: '/dashboard/equipe', tempo: '2 min', novo: true },
  { icon: Bot, titulo: 'Cadastro com IA', desc: 'Cadastre produtos automaticamente usando inteligência artificial.', link: '/dashboard/produtos/novo', tempo: '1 min', novo: true },
]

const ATALHOS = [
  { tecla: 'F1', acao: 'Mostrar ajuda do PDV', contexto: 'PDV' },
  { tecla: 'F2', acao: 'Buscar produto', contexto: 'PDV' },
  { tecla: 'F4', acao: 'Aplicar desconto', contexto: 'PDV' },
  { tecla: 'F8', acao: 'Finalizar venda', contexto: 'PDV' },
  { tecla: 'F10', acao: 'Remover último item', contexto: 'PDV' },
  { tecla: 'Esc', acao: 'Limpar carrinho / Fechar modais', contexto: 'PDV' },
  { tecla: 'Ctrl + K', acao: 'Busca rápida de produtos', contexto: 'Global' },
  { tecla: 'Enter', acao: 'Confirmar leitor USB', contexto: 'PDV' },
]

const BUSCAS_RECENTES_KEY = 'ajuda_buscas_recentes'
const FEEDBACK_KEY = 'ajuda_feedback'
const SUGESTOES_BUSCA = ['pagamento', 'IA', 'estoque', 'PDV', 'fiado', 'plano']

export default function AjudaPage() {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState<string | null>(null)
  const [categoriasRecolhidas, setCategoriasRecolhidas] = useState<Set<string>>(new Set())
  const [perguntaCopiada, setPerguntaCopiada] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, 'sim' | 'nao'>>({})
  const [buscasRecentes, setBuscasRecentes] = useState<string[]>([])

  useEffect(() => {
    try {
      const buscas = localStorage.getItem(BUSCAS_RECENTES_KEY)
      if (buscas) setBuscasRecentes(JSON.parse(buscas))
      const fb = localStorage.getItem(FEEDBACK_KEY)
      if (fb) setFeedback(JSON.parse(fb))
    } catch {}
  }, [])

  const salvarBuscaRecente = useCallback((termo: string) => {
    if (!termo.trim() || termo.length < 3) return
    setBuscasRecentes((prev) => {
      const novas = [termo, ...prev.filter((t) => t !== termo)].slice(0, 5)
      try { localStorage.setItem(BUSCAS_RECENTES_KEY, JSON.stringify(novas)) } catch {}
      return novas
    })
  }, [])

  useEffect(() => {
    if (busca.length >= 3) {
      const timer = setTimeout(() => salvarBuscaRecente(busca), 1500)
      return () => clearTimeout(timer)
    }
  }, [busca, salvarBuscaRecente])

  const darFeedback = (pergunta: string, tipo: 'sim' | 'nao') => {
    setFeedback((prev) => {
      const novo = { ...prev, [pergunta]: tipo }
      try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(novo)) } catch {}
      return novo
    })
  }

  const copiarPergunta = async (pergunta: string) => {
    const texto = `Olá! Tenho uma dúvida sobre: "${pergunta}"`
    try {
      await navigator.clipboard.writeText(texto)
      setPerguntaCopiada(pergunta)
      setTimeout(() => setPerguntaCopiada(null), 2000)
    } catch {}
  }

  const destacarTermo = (texto: string, termo: string) => {
    if (!termo.trim()) return texto
    const regex = new RegExp(`(${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return texto.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-500/40 text-gray-900 dark:text-yellow-100 px-0.5 rounded font-semibold">$1</mark>')
  }

  const faqFiltrado = useMemo(() => {
    return FAQ_ITEMS.map((cat) => ({
      ...cat,
      perguntas: cat.perguntas.filter((item) =>
        item.p.toLowerCase().includes(busca.toLowerCase()) ||
        item.r.toLowerCase().includes(busca.toLowerCase())
      ),
    })).filter((cat) => cat.perguntas.length > 0)
  }, [busca])

  const tutoriaisFiltrados = useMemo(() => {
    if (!busca.trim()) return TUTORIAIS
    return TUTORIAIS.filter((t) =>
      t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      t.desc.toLowerCase().includes(busca.toLowerCase())
    )
  }, [busca])

  const atalhosFiltrados = useMemo(() => {
    if (!busca.trim()) return ATALHOS
    return ATALHOS.filter((a) =>
      a.tecla.toLowerCase().includes(busca.toLowerCase()) ||
      a.acao.toLowerCase().includes(busca.toLowerCase())
    )
  }, [busca])

  const totalResultados =
    faqFiltrado.reduce((acc, c) => acc + c.perguntas.length, 0) +
    tutoriaisFiltrados.length +
    atalhosFiltrados.length

  const totalPerguntas = FAQ_ITEMS.reduce((acc, c) => acc + c.perguntas.length, 0)

  const toggleCategoria = (cat: string) => {
    setCategoriasRecolhidas((prev) => {
      const novo = new Set(prev)
      if (novo.has(cat)) novo.delete(cat)
      else novo.add(cat)
      return novo
    })
  }

  const recolherTodas = () => setCategoriasRecolhidas(new Set(FAQ_ITEMS.map((c) => c.categoria)))
  const expandirTodas = () => setCategoriasRecolhidas(new Set())
  const todasRecolhidas = categoriasRecolhidas.size === FAQ_ITEMS.length

  const linkWhatsApp = useMemo(() => {
    const msg = busca
      ? `Olá! Procurei por "${busca}" na ajuda mas não encontrei. Pode me ajudar?`
      : 'Preciso de ajuda com o EstoqueSystem'
    return `https://wa.me/5522999467499?text=${encodeURIComponent(msg)}`
  }, [busca])

  const getCorCategoria = (cor: string) => {
    const cores: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
      green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
      purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
      orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
      emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
      pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
      indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
    }
    return cores[cor] || cores.blue
  }
  return (
    <div className="space-y-8 pb-12">
      {/* HEADER */}
      <div className="text-center space-y-4 animate-fadeInDown">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Sistema online
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">v1.0 BETA</span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <HelpCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-left">Central de Ajuda</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-left">Encontre respostas, aprenda e fale com o suporte</p>
          </div>
        </div>
      </div>

      {/* BUSCA */}
      <div className="max-w-2xl mx-auto space-y-3 animate-fadeIn">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5 transition" />
          <input
            type="text"
            placeholder="Buscar em FAQ, tutoriais e atalhos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input-field pl-12 pr-12 w-full text-lg py-4 rounded-2xl focus:ring-2 focus:ring-blue-500 transition"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {busca && (
          <div className="text-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {totalResultados > 0 ? (
                <><span className="font-bold text-gray-900 dark:text-white">{totalResultados}</span> resultado(s) encontrado(s)</>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Nenhum resultado pra &quot;{busca}&quot;</span>
              )}
            </span>
          </div>
        )}

        {!busca && buscasRecentes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              <Clock className="inline w-3 h-3 mr-1" />Recentes:
            </span>
            {buscasRecentes.map((b, i) => (
              <button key={i} onClick={() => setBusca(b)} className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full transition">
                {b}
              </button>
            ))}
            <button
              onClick={() => {
                setBuscasRecentes([])
                try { localStorage.removeItem(BUSCAS_RECENTES_KEY) } catch {}
              }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
            >
              limpar
            </button>
          </div>
        )}
      </div>

      {/* CARDS ACESSO RÁPIDO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer" className="card p-5 flex items-center gap-4 hover:border-green-400 dark:hover:border-green-500 hover:-translate-y-0.5 hover:shadow-lg transition group animate-fadeIn" style={{ animationDelay: '50ms' }}>
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-green-500/30">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Suporte via WhatsApp
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-bold">
                <Zap className="w-2.5 h-2.5" />RÁPIDO
              </span>
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Fale direto com o Lucas</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
        </a>

        <div className="card p-5 flex items-center gap-4 animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Book className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">FAQ Completo</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{totalPerguntas} perguntas respondidas</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 animate-fadeIn" style={{ animationDelay: '150ms' }}>
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Keyboard className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Atalhos do Teclado</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{ATALHOS.length} atalhos disponíveis</p>
          </div>
        </div>
      </div>

      {/* TUTORIAIS */}
      {tutoriaisFiltrados.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />Tutoriais Rápidos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutoriaisFiltrados.map(({ icon: Icon, titulo, desc, link, tempo, novo }, idx) => (
              <a key={titulo} href={link} className="card p-5 hover:shadow-lg transition hover:-translate-y-0.5 group relative animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
                {novo && (
                  <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-full">NOVO</span>
                )}
                <Icon className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-3" />
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition" dangerouslySetInnerHTML={{ __html: destacarTermo(titulo, busca) }} />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2" dangerouslySetInnerHTML={{ __html: destacarTermo(desc, busca) }} />
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />{tempo} de leitura
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Book className="w-5 h-5 text-purple-500" />Perguntas Frequentes
          </h3>
          {faqFiltrado.length > 0 && (
            <button onClick={todasRecolhidas ? expandirTodas : recolherTodas} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              {todasRecolhidas ? '📂 Expandir todas' : '📁 Recolher todas'}
            </button>
          )}
        </div>

        {faqFiltrado.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Nenhum resultado encontrado pra &quot;{busca}&quot;</p>
              <p className="text-sm text-gray-400 mt-1">Tente buscar por:</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGESTOES_BUSCA.map((s) => (
                <button key={s} onClick={() => setBusca(s)} className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-full font-semibold transition">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {faqFiltrado.map((cat, catIdx) => {
              const cores = getCorCategoria(cat.cor)
              const Icon = cat.icon
              const isRecolhida = categoriasRecolhidas.has(cat.categoria)

              return (
                <div key={cat.categoria} className="animate-fadeIn" style={{ animationDelay: `${catIdx * 80}ms` }}>
                  <button onClick={() => toggleCategoria(cat.categoria)} className="w-full flex items-center justify-between mb-3 group">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${cores.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${cores.text}`} />
                      </div>
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider group-hover:text-gray-900 dark:group-hover:text-white transition">
                        {cat.categoria}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 ${cores.bg} ${cores.text} rounded-full font-bold`}>
                        {cat.perguntas.length}
                      </span>
                    </div>
                    {isRecolhida ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                  </button>

                  {!isRecolhida && (
                    <div className="space-y-2">
                      {cat.perguntas.map(({ p, r }) => {
                        const key = `${cat.categoria}-${p}`
                        const isOpen = aberto === key
                        const fb = feedback[p]

                        return (
                          <div key={key} className={`card overflow-hidden transition ${isOpen ? `${cores.border} border-2` : ''}`}>
                            <button onClick={() => setAberto(isOpen ? null : key)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                              <span className="font-medium text-gray-900 dark:text-white pr-4 text-sm md:text-base" dangerouslySetInnerHTML={{ __html: destacarTermo(p, busca) }} />
                              {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                            </button>

                            {isOpen && (
                              <div className="border-t border-gray-100 dark:border-gray-700 animate-fadeIn">
                                <div className="px-4 pt-3 pb-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: destacarTermo(r, busca) }} />

                                <div className="px-4 pb-4 flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Foi útil?</span>
                                    <button onClick={() => darFeedback(p, 'sim')} className={`p-1.5 rounded-lg transition ${fb === 'sim' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'}`} title="Sim, foi útil">
                                      <ThumbsUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => darFeedback(p, 'nao')} className={`p-1.5 rounded-lg transition ${fb === 'nao' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'}`} title="Não ajudou">
                                      <ThumbsDown className="w-3.5 h-3.5" />
                                    </button>
                                    {fb && (
                                      <span className="text-[10px] text-gray-500 italic">
                                        {fb === 'sim' ? 'Obrigado! 🙏' : 'Vamos melhorar 💪'}
                                      </span>
                                    )}
                                  </div>

                                  <button onClick={() => copiarPergunta(p)} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md font-semibold transition">
                                    {perguntaCopiada === p ? (
                                      <><Check className="w-3 h-3 text-green-500" />Copiado!</>
                                    ) : (
                                      <><Copy className="w-3 h-3" />Copiar pro suporte</>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ATALHOS */}
      {atalhosFiltrados.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-amber-500" />Atalhos do Teclado
          </h3>
          <div className="card p-5">
            <div className="space-y-2">
              {atalhosFiltrados.map(({ tecla, acao, contexto }) => (
                <div key={tecla} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: destacarTermo(acao, busca) }} />
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded font-semibold">
                      {contexto}
                    </span>
                  </div>
                  <kbd className="px-2.5 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono font-bold text-gray-700 dark:text-gray-300 shadow-sm">
                    {tecla}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA WHATSAPP */}
      <div className="card p-8 text-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border-2 border-green-200 dark:border-green-800 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-200 dark:bg-green-700/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-200 dark:bg-emerald-700/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 items-center justify-center shadow-lg shadow-green-500/30 mb-4">
            <Phone className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {busca ? 'Não achou o que procurava?' : 'Precisa de ajuda personalizada?'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-5 max-w-md mx-auto">
            Fale diretamente comigo pelo WhatsApp. Sem robô, sem fila de atendimento. Resposta rápida de verdade.
          </p>
          <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-xl hover:shadow-green-500/40 text-white font-semibold rounded-xl transition hover:scale-105">
            <MessageCircle className="w-5 h-5" />Falar com o Lucas
          </a>
        </div>
      </div>

      {/* Rodapé */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500">
        Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
        .animate-fadeInDown { animation: fadeInDown 0.5s ease-out forwards; }
      `}</style>
    </div>
  )
}