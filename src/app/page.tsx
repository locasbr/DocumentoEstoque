"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Package, BarChart3, ShoppingCart, AlertCircle, Users, QrCode,
  CheckCircle, ArrowRight, XCircle, Smartphone, Menu, X,
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
  { icon: Package, titulo: 'Controle de Estoque Completo', desc: 'Cadastre produtos, defina estoques m\u00EDnimos e saiba exatamente o que tem e o que est\u00E1 faltando.' },
  { icon: ShoppingCart, titulo: 'PDV no Celular', desc: 'Ponto de venda integrado com leitor de c\u00F3digo de barras pela c\u00E2mera. Venda direto do bolso.' },
  { icon: BarChart3, titulo: 'Relat\u00F3rios que Fazem Sentido', desc: 'Veja vendas, lucro, margem e movimenta\u00E7\u00E3o com gr\u00E1ficos simples \u2014 sem precisar ser contador.' },
  { icon: AlertCircle, titulo: 'Alertas Autom\u00E1ticos', desc: 'Receba avisos antes que o produto acabe. Nunca mais perca uma venda por falta de estoque.' },
  { icon: Users, titulo: 'Equipe & Funcion\u00E1rios', desc: 'Adicione funcion\u00E1rios com acesso limitado ao PDV. Voc\u00EA controla tudo, eles s\u00F3 vendem.' },
  { icon: QrCode, titulo: 'Leitor de C\u00F3digo de Barras', desc: 'Escaneie produtos pela c\u00E2mera do celular. Sem precisar comprar equipamento extra.' },
]

const BENEFICIOS = [
  'Controle ilimitado de produtos',
  'Dashboard com m\u00E9tricas em tempo real',
  'Alertas de estoque baixo e cr\u00EDtico',
  'Relat\u00F3rios de entrada e sa\u00EDda',
  'PDV completo com c\u00F3digo de barras',
  'M\u00FAltiplos funcion\u00E1rios por conta',
  'Cupom via WhatsApp',
  'Suporte priorit\u00E1rio',
  'Atualiza\u00E7\u00F5es inclusas',
]

const NAV_LINKS = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Pre\u00E7o', href: '#preco' },
  { label: 'FAQ', href: '#faq' },
]

const WA_NUM = '5522999467499'
const WA_MSG = encodeURIComponent('Ol\u00E1! Gostaria de saber mais sobre o EstoqueSystem.')

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
      {/* ========== NAVBAR ========== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-4'
        }`}
      >
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
            <Link href="/signup" className={`text-sm font-semibold px-5 py-2 rounded-full transition ${scrolled ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white/20 backdrop-blur text-white hover:bg-white/30'}`}>{'Teste gr\u00E1tis'}</Link>
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
              <Link href="/signup" onClick={() => setMenuAberto(false)} className="px-4 py-3 bg-green-600 text-white rounded-lg font-semibold text-center mt-2">{'Teste gr\u00E1tis'}</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ========== HERO ========== */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 bg-green-500/10 backdrop-blur-sm text-green-400 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-green-500/20">
            <CheckCircle className="w-4 h-4" />{'15 dias gr\u00E1tis \u2014 sem cart\u00E3o de cr\u00E9dito'}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            {'Voc\u00EA est\u00E1 '}<span className="text-red-400 line-through decoration-red-500/50">perdendo dinheiro</span>{' no seu estoque'}<br /><span className="text-green-400">e nem sabe</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            {'Controle tudo pelo celular. '}<strong className="text-white">Sem planilha, sem caderno, sem erro.</strong>{' Sistema completo de estoque, PDV e relat\u00F3rios feito para pequenos mercados, mercearias e com\u00E9rcios.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link href="/signup" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all hover:shadow-lg hover:shadow-green-600/30 flex items-center justify-center gap-2">
              {'Testar gr\u00E1tis agora'} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto text-gray-300 hover:text-white font-medium px-8 py-4 rounded-full border border-gray-600 hover:border-gray-400 transition text-center">{'J\u00E1 tenho conta'}</Link>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <span>{'\u2705 Sem cart\u00E3o'}</span><span>{'\u00B7'}</span><span>{'\u2705 Cancele quando quiser'}</span><span>{'\u00B7'}</span><span>{'\u2705 Suporte via WhatsApp'}</span>
          </div>
        </div>
      </section>

      {/* ========== PROPOSTA DE VALOR ========== */}
      <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-4">{'Tudo na palma da sua m\u00E3o'}</h3>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">{'Saiba exatamente o que est\u00E1 vendendo, o que est\u00E1 faltando e onde voc\u00EA est\u00E1 perdendo dinheiro \u2014 tudo em tempo real.'}</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Smartphone, titulo: 'Funciona no Celular', desc: '100% responsivo. Use no celular, tablet ou computador. Sem instalar nada \u2014 acesse pelo navegador.', cor: 'bg-blue-50 dark:bg-blue-900/20', iconCor: 'text-blue-600 dark:text-blue-400', bordaCor: 'border-blue-200 dark:border-blue-800' },
              { icon: QrCode, titulo: 'Leitor de C\u00F3digo de Barras', desc: 'Escaneie produtos pela c\u00E2mera do celular ou com leitor USB. Sem comprar equipamento extra.', cor: 'bg-green-50 dark:bg-green-900/20', iconCor: 'text-green-600 dark:text-green-400', bordaCor: 'border-green-200 dark:border-green-800' },
              { icon: BarChart3, titulo: 'Controle em Tempo Real', desc: 'Dashboard com m\u00E9tricas ao vivo. Saiba exatamente o que est\u00E1 vendendo e o que est\u00E1 faltando.', cor: 'bg-purple-50 dark:bg-purple-900/20', iconCor: 'text-purple-600 dark:text-purple-400', bordaCor: 'border-purple-200 dark:border-purple-800' },
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

      {/* ========== DEMO ========== */}
      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-2">Veja o sistema funcionando</h3>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-10">Simples de usar, poderoso de verdade.</p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[{ id: 'dashboard', label: 'Dashboard' }, { id: 'pdv', label: 'PDV' }, { id: 'relatorios', label: 'Relat\u00F3rios' }, { id: 'alertas', label: 'Alertas' }].map(({ id, label }) => (
              <button key={id} onClick={() => setDemoAtiva(id)} className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${demoAtiva === id ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{label}</button>
            ))}
          </div>
          <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
            <div className="hidden sm:flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-yellow-500" /><div className="w-3 h-3 rounded-full bg-green-500" /></div>
              <div className="flex-1 text-center"><span className="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded">estoquesystem.com/dashboard</span></div>
            </div>
            <Image src={`/demo-${demoAtiva}.png`} alt={`Demo ${demoAtiva}`} width={1200} height={700} className="w-full" priority />
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            {demoAtiva === 'dashboard' && 'Veja todas as m\u00E9tricas do seu neg\u00F3cio em um s\u00F3 lugar'}
            {demoAtiva === 'pdv' && 'Venda direto pelo celular com c\u00F3digo de barras'}
            {demoAtiva === 'relatorios' && 'Saiba seu lucro real, margem e produtos mais vendidos'}
            {demoAtiva === 'alertas' && 'Receba avisos autom\u00E1ticos antes do estoque acabar'}
          </p>
        </div>
      </section>

      {/* ========== FUNCIONALIDADES ========== */}
      <section id="funcionalidades" className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-2">{'Tudo que voc\u00EA precisa em um s\u00F3 lugar'}</h3>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12">{'Sem planilha, sem caderno, sem complica\u00E7\u00E3o.'}</p>
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

      {/* ========== COMO FUNCIONA ========== */}
      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-12">Comece em 2 minutos</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { passo: '1', titulo: 'Crie sua conta', desc: 'Cadastro r\u00E1pido com email e senha. Sem burocracia, sem cart\u00E3o.', emoji: E.memo },
              { passo: '2', titulo: 'Cadastre produtos', desc: 'Adicione seus produtos manualmente ou escaneie o c\u00F3digo de barras com a c\u00E2mera.', emoji: E.pkg },
              { passo: '3', titulo: 'Comece a vender', desc: 'Use o PDV, acompanhe relat\u00F3rios e nunca mais perca uma venda por falta de estoque.', emoji: E.rocket },
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

      {/* ========== ANTES vs DEPOIS ========== */}
      <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-12">{'A diferen\u00E7a \u00E9 clara'}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6">
              <h4 className="font-bold text-red-800 dark:text-red-400 mb-4 text-lg">Antes do EstoqueSystem</h4>
              {['Controle no caderno ou planilha', 'Produto vence e voc\u00EA nem percebe', 'N\u00E3o sabe o lucro real do m\u00EAs', 'Funcion\u00E1rio vende e voc\u00EA n\u00E3o v\u00EA', 'Estoque acaba e voc\u00EA perde venda'].map((item) => (
                <div key={item} className="flex items-start gap-2 mb-3"><XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300 text-sm">{item}</span></div>
              ))}
            </div>
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl p-6">
              <h4 className="font-bold text-green-800 dark:text-green-400 mb-4 text-lg">Depois do EstoqueSystem</h4>
              {['Controle completo no celular', 'Alertas autom\u00E1ticos de vencimento', 'Relat\u00F3rios de lucro e margem em tempo real', 'Cada venda registrada automaticamente', 'Avisos antes do estoque acabar'].map((item) => (
                <div key={item} className="flex items-start gap-2 mb-3"><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300 text-sm">{item}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== QUEM CRIOU ========== */}
      <section className="py-16 md:py-20 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-2">{'Quem est\u00E1 por tr\u00E1s'}</p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-10">{'Prazer, Lucas Machado '}{E.wave}</h3>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-10">
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">{'Tenho 20 anos e sou desenvolvedor. Criei o EstoqueSystem porque vi de perto pequenos comerciantes '}<strong>perdendo dinheiro por falta de controle</strong>{' \u2014 usando caderno, planilha ou simplesmente confiando na mem\u00F3ria.'}</p>
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">{'Ent\u00E3o resolvi construir algo '}<strong>simples, direto e que realmente funcionasse</strong>{' no dia a dia de quem est\u00E1 atr\u00E1s do balc\u00E3o.'}</p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">{'Cada tela, cada bot\u00E3o e cada funcionalidade foi pensada para quem n\u00E3o tem tempo de aprender sistemas complicados. '}<strong>{'Se voc\u00EA \u00E9 essa pessoa, o EstoqueSystem foi feito pra voc\u00EA.'}</strong></p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                <span className="text-2xl">{E.target}</span>
                <div><p className="font-bold text-gray-900 dark:text-white text-sm">{'Miss\u00E3o'}</p><p className="text-gray-600 dark:text-gray-400 text-sm">{'Tornar o controle de estoque acess\u00EDvel pra todo pequeno com\u00E9rcio'}</p></div>
              </div>
              <div className="flex items-start gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                <span className="text-2xl">{E.speech}</span>
                <div><p className="font-bold text-gray-900 dark:text-white text-sm">Suporte direto</p><p className="text-gray-600 dark:text-gray-400 text-sm">{'Fale comigo pelo WhatsApp \u2014 sem rob\u00F4, sem fila'}</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PRECO ========== */}
      <section id="preco" className="py-16 md:py-20 bg-gray-50 dark:bg-gray-900 scroll-mt-20">
        <div className="max-w-xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-2">{'Simples e acess\u00EDvel'}</h3>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-10">{'Um plano s\u00F3, com tudo incluso. Sem surpresas.'}</p>
          <div className="bg-white dark:bg-gray-800 border-2 border-green-500 rounded-3xl p-8 md:p-10 shadow-xl">
            <div className="text-center mb-6"><span className="text-sm font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">Plano Profissional</span></div>
            <div className="text-center mb-2"><span className="text-5xl font-extrabold text-gray-900 dark:text-white">R$ 79</span><span className="text-2xl font-bold text-gray-900 dark:text-white">,90</span><span className="text-gray-500 dark:text-gray-400 ml-1">{'/m\u00EAs'}</span></div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-2">{'Menos de R$ 3 por dia para controlar todo seu neg\u00F3cio'}</p>
            <p className="text-center text-sm text-green-600 dark:text-green-400 font-medium mb-6">{'15 dias gr\u00E1tis para testar \u2014 sem compromisso'}</p>
            <div className="space-y-3 mb-8">
              {BENEFICIOS.map((b) => (
                <div key={b} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300 text-sm">{b}</span></div>
              ))}
            </div>
            <Link href="/signup" className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 rounded-full text-center transition hover:shadow-lg hover:shadow-green-600/30">{'Come\u00E7ar teste gr\u00E1tis'}</Link>
            <p className="text-center text-xs text-gray-400 mt-4">{'Sem cart\u00E3o de cr\u00E9dito no teste \u00B7 Cancele quando quiser'}</p>
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section id="faq" className="py-16 md:py-20 bg-white dark:bg-gray-950 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-10">Perguntas frequentes</h3>
          <div className="space-y-4">
            {[
              { p: 'Preciso instalar alguma coisa?', r: 'N\u00E3o! O EstoqueSystem funciona direto no navegador, no celular ou computador. \u00C9 s\u00F3 acessar e usar.' },
              { p: 'Funciona no celular?', r: 'Sim! O sistema \u00E9 100% responsivo. O PDV e o leitor de c\u00F3digo de barras funcionam perfeitamente pelo celular.' },
              { p: 'Como funciona o per\u00EDodo de teste?', r: 'Voc\u00EA tem 15 dias gr\u00E1tis com acesso completo. Sem cart\u00E3o de cr\u00E9dito.' },
              { p: 'Como fa\u00E7o o pagamento?', r: 'Pelo Mercado Pago. Aceitamos PIX e cart\u00E3o. Acesso liberado automaticamente.' },
              { p: 'Posso adicionar funcion\u00E1rios?', r: 'Sim! Funcion\u00E1rios t\u00EAm acesso apenas ao PDV. Voc\u00EA controla tudo.' },
              { p: 'Meus dados ficam seguros?', r: 'Sim! Criptografia e servidores seguros. Seus dados s\u00E3o s\u00F3 seus.' },
            ].map(({ p, r }) => (
              <details key={p} className="group bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition list-none">{p}<span className="text-gray-400 ml-4 group-open:rotate-180 transition-transform">{E.arrow}</span></summary>
                <p className="px-5 pb-5 text-gray-600 dark:text-gray-400 leading-relaxed">{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA FINAL ========== */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-green-600 to-emerald-700">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h3 className="text-2xl md:text-4xl font-extrabold text-white mb-4">{'Quanto dinheiro voc\u00EA j\u00E1 perdeu por falta de controle?'}</h3>
          <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">{'Come\u00E7e agora e veja a diferen\u00E7a em poucos dias. \u00C9 gr\u00E1tis por 15 dias, sem compromisso.'}</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-green-700 font-bold text-lg px-10 py-4 rounded-full hover:shadow-xl transition hover:-translate-y-0.5">Quero organizar meu estoque <ArrowRight className="w-5 h-5" /></Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4"><span className="text-xl">{E.pkg}</span><span className="font-bold text-white">EstoqueSystem</span></div>
          <p className="text-sm mb-4">{'\u00A9 '}{new Date().getFullYear()}{' EstoqueSystem. Todos os direitos reservados.'}</p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/login" className="hover:text-white transition">Entrar</Link>
            <Link href="/signup" className="hover:text-white transition">Criar conta</Link>
            <Link href="/termos" className="hover:text-white transition">Termos</Link>
            <Link href="/privacidade" className="hover:text-white transition">Privacidade</Link>
          </div>
        </div>
      </footer>

      {/* ========== WHATSAPP ========== */}
      <a
        href={`https://wa.me/${WA_NUM}?text=${WA_MSG}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 animate-pulse"
        aria-label="WhatsApp"
        style={{ animationDuration: '2s' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  )
}