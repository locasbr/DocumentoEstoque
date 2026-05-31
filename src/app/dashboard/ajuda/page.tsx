'use client'

import { useState } from 'react'
import {
  HelpCircle, Search, Book, MessageCircle, Keyboard,
  Package, ShoppingCart, BarChart3, AlertCircle, Users,
  ChevronDown, ChevronUp, ExternalLink, CheckCircle, Phone
} from 'lucide-react'

const FAQ_ITEMS = [
  {
    categoria: 'Primeiros Passos',
    perguntas: [
      { p: 'Como cadastrar meu primeiro produto?', r: 'Va em Produtos, clique em Novo Produto. Preencha nome, SKU (ou use a camera para ler o codigo de barras), preco de venda e quantidade inicial. Clique em Salvar Produto e pronto!' },
      { p: 'Como funciona o periodo de teste?', r: 'Voce tem 15 dias gratis com acesso completo a todas as funcionalidades. Nao precisa de cartao de credito. Apos o periodo, basta assinar o plano de R$ 79,90/mes para continuar usando.' },
      { p: 'Posso usar no celular?', r: 'Sim! O EstoqueSystem e 100% responsivo. O PDV, leitor de codigo de barras e todas as funcionalidades funcionam perfeitamente no celular e tablet.' },
    ]
  },
  {
    categoria: 'PDV e Vendas',
    perguntas: [
      { p: 'Como registrar uma venda?', r: 'Acesse o PDV, selecione os produtos clicando neles (ou escaneie o codigo de barras), escolha a forma de pagamento e clique em Finalizar Venda. O estoque e atualizado automaticamente.' },
      { p: 'Quais formas de pagamento sao aceitas?', r: 'No PDV voce pode registrar vendas em: Dinheiro (com calculo de troco), PIX, Cartao de Debito e Cartao de Credito.' },
      { p: 'Como enviar o cupom pelo WhatsApp?', r: 'Apos finalizar a venda, o cupom aparece automaticamente. Clique no botao WhatsApp para enviar o comprovante diretamente ao cliente.' },
    ]
  },
  {
    categoria: 'Estoque e Produtos',
    perguntas: [
      { p: 'O que significam os alertas de estoque?', r: 'Estoque Baixo: a quantidade atual esta abaixo do minimo que voce definiu. Estoque Critico: o produto zerou. Configure a quantidade minima em cada produto para receber alertas automaticos.' },
      { p: 'Como fazer entrada de mercadoria?', r: 'Va em Estoque, clique em Novo Movimento. Selecione o produto, escolha Entrada, informe a quantidade recebida e um motivo. O estoque sera atualizado.' },
      { p: 'Como funciona o controle de validade?', r: 'No cadastro do produto, preencha o campo Data de Validade. O sistema exibira avisos na Dashboard quando produtos estiverem proximos de vencer (7 dias ou menos).' },
    ]
  },
  {
    categoria: 'Clientes e Fiado',
    perguntas: [
      { p: 'Como cadastrar um cliente?', r: 'Va em Clientes, clique em Novo Cliente. Preencha nome, telefone e outros dados opcionais. Depois voce pode registrar vendas fiado para esse cliente.' },
      { p: 'Como controlar o fiado?', r: 'Na pagina do cliente, clique em Novo Debito para adicionar uma venda fiado, ou Registrar Pagamento quando o cliente pagar. O saldo e calculado automaticamente.' },
    ]
  },
  {
    categoria: 'Equipe e Seguranca',
    perguntas: [
      { p: 'Posso adicionar funcionarios?', r: 'Sim! Va em Equipe, informe o email do funcionario e o sistema gera uma senha temporaria. Funcionarios tem acesso apenas ao PDV e Estoque, enquanto voce controla tudo.' },
      { p: 'Meus dados ficam seguros?', r: 'Sim. Usamos Supabase com criptografia em transito (TLS/SSL) e em repouso. Senhas sao armazenadas em hash seguro e jamais em texto puro. Seus dados pertencem a voce.' },
    ]
  },
]

const TUTORIAIS = [
  { icon: Package, titulo: 'Cadastrar Produto', desc: 'Adicione seus produtos com nome, preco, foto e codigo de barras.', link: '/dashboard/produtos/novo' },
  { icon: ShoppingCart, titulo: 'Usar o PDV', desc: 'Faca vendas, escaneie produtos e emita cupom pelo WhatsApp.', link: '/dashboard/pdv' },
  { icon: BarChart3, titulo: 'Ver Relatorios', desc: 'Acompanhe vendas, lucro e movimentacao com graficos.', link: '/dashboard/relatorios' },
  { icon: AlertCircle, titulo: 'Gerenciar Alertas', desc: 'Monitore produtos com estoque baixo ou critico.', link: '/dashboard/alertas' },
  { icon: Users, titulo: 'Convidar Equipe', desc: 'Adicione funcionarios com acesso limitado ao PDV.', link: '/dashboard/equipe' },
  { icon: HelpCircle, titulo: 'Cadastrar Cliente', desc: 'Registre clientes e controle vendas fiado.', link: '/dashboard/clientes' },
]

const ATALHOS = [
  { tecla: 'Ctrl + K', acao: 'Busca rapida de produtos' },
  { tecla: 'Esc', acao: 'Fechar modais e popups' },
]

export default function AjudaPage() {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState<string | null>(null)

  const toggleFaq = (key: string) => {
    setAberto(aberto === key ? null : key)
  }

  const faqFiltrado = FAQ_ITEMS.map(cat => ({
    ...cat,
    perguntas: cat.perguntas.filter(
      item =>
        item.p.toLowerCase().includes(busca.toLowerCase()) ||
        item.r.toLowerCase().includes(busca.toLowerCase())
    ),
  })).filter(cat => cat.perguntas.length > 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Sistema online — tudo funcionando normalmente
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Central de Ajuda
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
          Encontre respostas, aprenda a usar o sistema e fale com o suporte.
        </p>
      </div>

      {/* Busca */}
      <div className="max-w-2xl mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar nos artigos de ajuda..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="input-field pl-12 w-full text-lg py-4 rounded-2xl"
        />
      </div>

      {/* Cards de Acesso Rapido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a
          href="https://wa.me/5521999999999?text=Preciso de ajuda com o EstoqueSystem"
          target="_blank"
          rel="noopener noreferrer"
          className="card p-5 flex items-center gap-4 hover:border-green-400 dark:hover:border-green-500 transition group"
        >
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Suporte via WhatsApp</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Fale direto com o Lucas</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition" />
        </a>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Book className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">FAQ Completo</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{FAQ_ITEMS.reduce((acc, c) => acc + c.perguntas.length, 0)} perguntas respondidas</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Keyboard className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Atalhos do Teclado</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Agilize seu trabalho</p>
          </div>
        </div>
      </div>

      {/* Tutoriais */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tutoriais Rapidos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TUTORIAIS.map(({ icon: Icon, titulo, desc, link }) => (
            <a key={titulo} href={link} className="card p-5 hover:shadow-lg transition hover:-translate-y-0.5 group">
              <Icon className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-3" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{titulo}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Perguntas Frequentes</h3>
        {faqFiltrado.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {`Nenhum resultado encontrado para \u201c${busca}\u201d`}
          </div>
        ) : (
          <div className="space-y-6">
            {faqFiltrado.map((cat) => (
              <div key={cat.categoria}>
                <h4 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{cat.categoria}</h4>
                <div className="space-y-2">
                  {cat.perguntas.map(({ p, r }) => {
                    const key = `${cat.categoria}-${p}`
                    const isOpen = aberto === key
                    return (
                      <div key={key} className="card overflow-hidden">
                        <button
                          onClick={() => toggleFaq(key)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                        >
                          <span className="font-medium text-gray-900 dark:text-white pr-4">{p}</span>
                          {isOpen
                            ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                            : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                          }
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-3">{r}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Atalhos */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Atalhos do Teclado</h3>
        <div className="card p-5">
          <div className="space-y-3">
            {ATALHOS.map(({ tecla, acao }) => (
              <div key={tecla} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">{acao}</span>
                <kbd className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{tecla}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Suporte */}
      <div className="card p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <Phone className="w-10 h-10 text-green-600 dark:text-green-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nao encontrou o que procurava?</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Fale diretamente comigo pelo WhatsApp. Sem robo, sem fila.</p>
        <a
          href="https://wa.me/5521999999999?text=Preciso de ajuda com o EstoqueSystem"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition"
        >
          <MessageCircle className="w-5 h-5" />
          Falar no WhatsApp
        </a>
      </div>
    </div>
  )
}