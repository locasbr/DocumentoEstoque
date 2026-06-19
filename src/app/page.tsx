"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Package, BarChart3, ShoppingCart, AlertCircle, Users, QrCode,
  CheckCircle, ArrowRight, XCircle, Smartphone, Menu, X, Calendar,
  MessageCircle, Crown, Sparkles, Zap,
} from 'lucide-react'

const E = {
  pkg: '\u{1F4E6}',
  memo: '\u{1F4DD}',
  rocket: '\u{1F680}',
  target: '\u{1F3AF}',
  speech: '\u{1F4AC}',
  wave: '\u{1F44B}',
  arrow: '\u25BE',
}

const FUNCIONALIDADES = [
  { icon: Package, titulo: 'Controle de Estoque Completo', desc: 'Cadastre produtos, defina estoques minimos e saiba exatamente o que tem e o que esta faltando.' },
  { icon: ShoppingCart, titulo: 'PDV no Celular', desc: 'Ponto de venda integrado com leitor de codigo de barras pela camera. Venda direto do bolso.' },
  { icon: BarChart3, titulo: 'Relatorios que Fazem Sentido', desc: 'Veja vendas, lucro, margem e movimentacao com graficos simples sem precisar ser contador.' },
  { icon: AlertCircle, titulo: 'Alertas Automaticos', desc: 'Receba avisos antes que o produto acabe. Nunca mais perca uma venda por falta de estoque.' },
  { icon: Users, titulo: 'Clientes e Fiado', desc: 'Controle quem deve, quanto deve e historico completo de pagamentos. Adeus caderninho!' },
  { icon: Calendar, titulo: 'Controle de Validade', desc: 'Receba alertas antes do produto vencer. Pare de perder dinheiro com mercadoria estragada.' },
]

const NAV_LINKS = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Planos', href: '#preco' },
  { label: 'FAQ', href: '#faq' },
]

const WA_NUM = '5522999467499'
const WA_MSG = encodeURIComponent('Ola! Gostaria de saber mais sobre o EstoqueSystem.')

export default function LandingPage() {
  const [demoAtiva, setDemoAtiva] = useState('dashboard')
  const [scrolled, setScrolled] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-4'}`}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <span className="text-2xl">{E.pkg}</span>
            <span className={`font-bold text-lg ${scrolled ? 'text-gray-900 dark:text-white' : 'text-white'}`}>EstoqueSystem</span>
          </a>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ label, href }) => (
              <a key={href} href={href} className={`text-sm font-medium transition hover:opacity-80 ${scrolled ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white' : 'text-white/80 hover:text-white'}`}>{label}</a>
            ))}
            <Link href="/login" className={`text-sm font-medium transition ${scrolled ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900' : 'text-white/80 hover:text-white'}`}>Entrar</Link>
            <Link href="/signup" className={`text-sm font-semibold px-5 py-2 rounded-full transition ${scrolled ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white/20 backdrop-blur text-white hover:bg-white/30'}`}>Teste gratis</Link>
          </div>
          <button onClick={() => setMenuAberto(!menuAberto)} className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-gray-900 dark:text-white' : 'text-white'}`}>
            {menuAberto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {menuAberto && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-lg">
            <div className="flex flex-col p-4 gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <a key={href} href={href} onClick={() => setMenuAberto(false)} className="px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium">{label}</a>
              ))}
              <Link href="/login" onClick={() => setMenuAberto(false)} className="px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium">Entrar</Link>
              <Link href="/signup" onClick={() => setMenuAberto(false)} className="px-4 py-3 bg-green-600 text-white rounded-lg font-semibold text-center mt-2">Teste gratis</Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 bg-green-500/10 backdrop-blur-sm text-green-400 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-green-500/20">
            <CheckCircle className="w-4 h-4" />15 dias gratis sem cartao de credito
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            O sistema feito para <span className="text-green-400">mercadinhos brasileiros</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Controle estoque, vendas e fiado pelo <strong className="text-white">celular</strong>.
            Sem planilha, sem caderno, sem complicacao. A partir de <strong className="text-green-400">R$ 39,90/mes</strong>.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link href="/signup" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all hover:shadow-lg hover:shadow-green-600/30 flex items-center justify-center gap-2">
              Testar gratis agora <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto text-gray-300 hover:text-white font-medium px-8 py-4 rounded-full border border-gray-600 hover:border-gray-400 transition text-center">Ja tenho conta</Link>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <span>Sem cartao</span><span>|</span><span>Cancele quando quiser</span><span>|</span><span>Suporte via WhatsApp</span>
          </div>
        </div>
      </section>

      {/* PROPOSTA DE VALOR */}
      <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-4">Tudo na palma da sua mao</h3>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">Saiba exatamente o que esta vendendo, o que esta faltando e onde voce esta perdendo dinheiro tudo em tempo real.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Smartphone, titulo: 'Funciona no Celular', desc: '100% responsivo. Use no celular, tablet ou computador. Sem instalar nada.', cor: 'bg-blue-50 dark:bg-blue-900/20', iconCor: 'text-blue-600 dark:text-blue-400', bordaCor: 'border-blue-200 dark:border-blue-800' },
              { icon: QrCode, titulo: 'Leitor de Codigo de Barras', desc: 'Escaneie produtos pela camera do celular ou com leitor USB. Sem comprar equipamento extra.', cor: 'bg-green-50 dark:bg-green-900/20', iconCor: 'text-green-600 dark:text-green-400', bordaCor: 'border-green-200 dark:border-green-800' },
              { icon: MessageCircle, titulo: 'Suporte Direto Comigo', desc: 'Sem chatbot, sem fila. Falo direto com voce pelo WhatsApp quando precisar.', cor: 'bg-purple-50 dark:bg-purple-900/20', iconCor: 'text-purple-600 dark:text-purple-400', bordaCor: 'border-purple-200 dark:border-purple-800' },
            ].map(({ icon: Icon, titulo, desc, cor, iconCor, bordaCor }) => (
              <div key={titulo} className={`${cor} border ${bordaCor} rounded-2xl p-6 md:p-8 text-center transition hover:shadow-lg hover:-translate-y-1`}>
                <div className={`w-14 h-14 ${cor} rounded-xl flex items-center justify-center mx-auto mb-4`}><Icon className={`w-7 h-7 ${iconCor}`} /></div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{titulo}</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-2">Veja o sistema funcionando</h3>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-10">Simples de usar, poderoso de verdade.</p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[{ id: 'dashboard', label: 'Dashboard' }, { id: 'pdv', label: 'PDV' }, { id: 'relatorios', label: 'Relatorios' }, { id: 'alertas', label: 'Alertas' }].map(({ id, label }) => (
              <button key={id} onClick={() => setDemoAtiva(id)} className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${demoAtiva === id ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{label}</button>
            ))}
          </div>
          <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
            <div className="hidden sm:flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-yellow-500" /><div className="w-3 h-3 rounded-full bg-green-500" /></div>
              <div className="flex-1 text-center"><span className="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded">estoquesystem.com.br/dashboard</span></div>
            </div>
            <Image src={`/demo-${demoAtiva}.png`} alt={`Demo ${demoAtiva}`} width={1200} height={700} className="w-full" priority />
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-2">Tudo que voce precisa em um so lugar</h3>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12">Sem planilha, sem caderno, sem complicacao.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FUNCIONALIDADES.map(({ icon: Icon, titulo, desc }) => (
              <div key={titulo} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 hover:shadow-lg transition">
                <Icon className="w-8 h-8 text-green-600 dark:text-green-400 mb-4" />
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">{titulo}</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-12">Comece em 2 minutos</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { passo: '1', titulo: 'Crie sua conta', desc: 'Cadastro rapido com email e senha. Sem burocracia, sem cartao.', emoji: E.memo },
              { passo: '2', titulo: 'Cadastre produtos', desc: 'Adicione manualmente ou escaneie o codigo de barras com a camera.', emoji: E.pkg },
              { passo: '3', titulo: 'Comece a vender', desc: 'Use o PDV, acompanhe relatorios e nunca mais perca uma venda.', emoji: E.rocket },
            ].map(({ passo, titulo, desc, emoji }) => (
              <div key={passo} className="text-center">
                <div className="text-4xl mb-3">{emoji}</div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center justify-center font-bold mx-auto mb-3">{passo}</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">{titulo}</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ANTES vs DEPOIS */}
      <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-12">A diferenca e clara</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6">
              <h4 className="font-bold text-red-800 dark:text-red-400 mb-4 text-lg">Antes do EstoqueSystem</h4>
              {['Controle no caderno ou planilha', 'Produto vence e voce nem percebe', 'Nao sabe o lucro real do mes', 'Funcionario vende e voce nao ve', 'Estoque acaba e voce perde venda', 'Cliente fica devendo e voce esquece'].map((item) => (
                <div key={item} className="flex items-start gap-2 mb-3"><XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300 text-sm">{item}</span></div>
              ))}
            </div>
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl p-6">
              <h4 className="font-bold text-green-800 dark:text-green-400 mb-4 text-lg">Depois do EstoqueSystem</h4>
              {['Controle completo no celular', 'Alertas automaticos de vencimento', 'Relatorios de lucro em tempo real', 'Cada venda registrada automaticamente', 'Avisos antes do estoque acabar', 'Historico completo de fiado por cliente'].map((item) => (
                <div key={item} className="flex items-start gap-2 mb-3"><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300 text-sm">{item}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* QUEM CRIOU */}
      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-2">Quem esta por tras</p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-10">Prazer, Lucas Machado {E.wave}</h3>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-10">
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">Tenho 20 anos e sou desenvolvedor. Criei o EstoqueSystem porque vi de perto pequenos comerciantes <strong>perdendo dinheiro por falta de controle</strong> usando caderno, planilha ou simplesmente confiando na memoria.</p>
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">Entao resolvi construir algo <strong>simples, direto e que realmente funcionasse</strong> no dia a dia de quem esta atras do balcao.</p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">Cada tela, cada botao e cada funcionalidade foi pensada para quem nao tem tempo de aprender sistemas complicados. <strong>Se voce e essa pessoa, o EstoqueSystem foi feito pra voce.</strong></p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                <span className="text-2xl">{E.target}</span>
                <div><p className="font-bold text-gray-900 dark:text-white text-sm">Missao</p><p className="text-gray-600 dark:text-gray-400 text-sm">Tornar o controle de estoque acessivel pra todo pequeno comercio</p></div>
              </div>
              <div className="flex items-start gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                <span className="text-2xl">{E.speech}</span>
                <div><p className="font-bold text-gray-900 dark:text-white text-sm">Suporte direto</p><p className="text-gray-600 dark:text-gray-400 text-sm">Fale comigo pelo WhatsApp sem robo, sem fila</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 PLANOS */}
      <section id="preco" className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl md:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-2">Escolha o plano ideal</h3>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12">Sem fidelidade. Cancele quando quiser. 15 dias gratis.</p>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* INICIANTE */}
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Iniciante</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Pra quem ta comecando</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">R$ 39</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">,90</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">/mes</span>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">Ate <strong>100 produtos</strong></span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">1 usuario</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">PDV completo</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">Leitor de codigo de barras</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">Alertas de estoque baixo</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">Relatorios basicos</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">Suporte por email</span></li>
              </ul>
              <Link href="/signup?plano=iniciante" className="block w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-3 rounded-full text-center transition">
                Comecar 15 dias gratis
              </Link>
            </div>

            {/* PROFISSIONAL */}
            <div className="bg-white dark:bg-gray-800 border-2 border-green-500 ring-4 ring-green-500/20 rounded-2xl p-6 relative md:scale-105 shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-600 text-white text-sm font-bold rounded-full whitespace-nowrap">
                MAIS POPULAR
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Profissional</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Pro mercadinho que cresce</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">R$ 79</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">,90</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">/mes</span>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300"><strong>Produtos ilimitados</strong></span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">Ate <strong>3 usuarios</strong></span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300 font-semibold">Clientes + Fiado</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300 font-semibold">Controle de validade</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">Relatorios avancados (lucro/margem)</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">Exportacao CSV</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">Cupom via WhatsApp</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300"><strong>Suporte prioritario WhatsApp</strong></span></li>
              </ul>
              <Link href="/signup?plano=profissional" className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-full text-center transition shadow-lg hover:shadow-green-600/30">
                Comecar 15 dias gratis
              </Link>
            </div>

            {/* NEGOCIO */}
            <div className="bg-white dark:bg-gray-800 border-2 border-purple-500 rounded-2xl p-6 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                <Crown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Negocio</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Pra mercadinho com filiais</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">R$ 149</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">,90</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">/mes</span>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300"><strong>Tudo do Profissional</strong></span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">Ate <strong>10 usuarios</strong></span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">Ate <strong>2 filiais</strong></span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300 font-semibold">Backup automatico diario</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">Historico estendido (24 meses)</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300 font-semibold">Onboarding 1-a-1</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300"><strong>Suporte VIP 24/7</strong></span></li>
              </ul>
              <Link href="/signup?plano=negocio" className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-full text-center transition shadow-lg">
                Comecar 15 dias gratis
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            Pagamento 100% seguro via Mercado Pago | Sem cartao no teste | Cancele quando quiser
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-20 bg-white dark:bg-gray-950 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-10">Perguntas frequentes</h3>
          <div className="space-y-4">
            {[
              { p: 'Preciso instalar alguma coisa?', r: 'Nao! O EstoqueSystem funciona direto no navegador, no celular ou computador. E so acessar e usar.' },
              { p: 'Funciona no celular?', r: 'Sim! O sistema e 100% responsivo. O PDV e o leitor de codigo de barras funcionam perfeitamente pelo celular.' },
              { p: 'Como funciona o periodo de teste?', r: 'Voce tem 15 dias gratis com acesso completo a TODOS os recursos do plano escolhido. Sem cartao de credito.' },
              { p: 'Posso mudar de plano depois?', r: 'Sim! Voce pode fazer upgrade ou downgrade a qualquer momento. A cobranca e ajustada proporcionalmente.' },
              { p: 'Como faco o pagamento?', r: 'Pelo Mercado Pago. Aceitamos PIX e cartao de credito. Acesso liberado automaticamente apos confirmacao.' },
              { p: 'Posso adicionar funcionarios?', r: 'Sim! Funcionarios tem acesso apenas ao PDV e estoque. Voce controla tudo. Limite varia por plano (1, 3 ou 10 usuarios).' },
              { p: 'E o controle de fiado?', r: 'Disponivel nos planos Profissional e Negocio. Cadastra cliente, registra debito, acompanha pagamentos. Adeus caderninho!' },
              { p: 'Meus dados ficam seguros?', r: 'Sim! Criptografia em transito (SSL) e em repouso. Seus dados sao so seus.' },
            ].map(({ p, r }) => (
              <details key={p} className="group bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition list-none">
                  {p}<span className="text-gray-400 ml-4 group-open:rotate-180 transition-transform">{E.arrow}</span>
                </summary>
                <p className="px-5 pb-5 text-gray-600 dark:text-gray-400 leading-relaxed">{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-green-600 to-emerald-700">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h3 className="text-2xl md:text-4xl font-extrabold text-white mb-4">Quanto dinheiro voce ja perdeu por falta de controle?</h3>
          <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">Comece agora a partir de R$ 39,90/mes. 15 dias gratis, sem cartao.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-green-700 font-bold text-lg px-10 py-4 rounded-full hover:shadow-xl transition hover:-translate-y-0.5">
            Quero organizar meu estoque <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xl">{E.pkg}</span>
            <span className="font-bold text-white">EstoqueSystem</span>
          </div>
          <p className="text-sm mb-4">{`(c) ${new Date().getFullYear()} EstoqueSystem. Todos os direitos reservados.`}</p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/login" className="hover:text-white transition">Entrar</Link>
            <Link href="/signup" className="hover:text-white transition">Criar conta</Link>
            <Link href="/termos" className="hover:text-white transition">Termos</Link>
            <Link href="/privacidade" className="hover:text-white transition">Privacidade</Link>
          </div>
        </div>
      </footer>

      {/* WHATSAPP */}
      <a
        href={`https://wa.me/${WA_NUM}?text=${WA_MSG}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 animate-pulse"
        aria-label="WhatsApp"
        style={{ animationDuration: '2s' }}
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  )
}