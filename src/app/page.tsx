"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Package, BarChart3, ShoppingCart, AlertCircle, Users, QrCode,
  CheckCircle, ArrowRight, XCircle, Smartphone, Menu, X, Calendar,
  MessageCircle, Crown, Sparkles, Zap, Brain, Wand2, TrendingUp,
  LineChart, FileText, Bot, Shield, Rocket, Target,
} from 'lucide-react'

const NAV_LINKS = [
  { label: 'IA', href: '#ia' },
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Planos', href: '#preco' },
  { label: 'FAQ', href: '#faq' },
]

const WA_NUM = '5522999467499'
const WA_MSG = encodeURIComponent('Ola! Gostaria de saber mais sobre o EstoqueSystem.')

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

function FadeInSection({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export default function LandingPage() {
  const [demoAtiva, setDemoAtiva] = useState('dashboard')
  const [scrolled, setScrolled] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [iaTabAtiva, setIaTabAtiva] = useState<'analise' | 'cadastro' | 'preco'>('analise')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">
      {/* NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-lg shadow-black/5 py-3 border-b border-gray-100 dark:border-gray-800'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 group">
            <span className="text-2xl inline-block transition-transform group-hover:rotate-12 group-hover:scale-110">📦</span>
            <span className={`font-bold text-lg ${scrolled ? 'text-gray-900 dark:text-white' : 'text-white'}`}>
              EstoqueSystem
            </span>
          </a>

          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className={`text-sm font-medium transition-all hover:scale-105 ${
                  scrolled ? 'text-gray-700 dark:text-gray-300 hover:text-green-600' : 'text-white/90 hover:text-white'
                }`}
              >
                {label}
              </a>
            ))}
            <Link
              href="/login"
              className={`text-sm font-medium transition ${
                scrolled ? 'text-gray-700 dark:text-gray-300 hover:text-green-600' : 'text-white/90 hover:text-white'
              }`}
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:scale-105 ${
                scrolled
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/40'
                  : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border border-white/20'
              }`}
            >
              Teste grátis
            </Link>
          </div>

          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-gray-900 dark:text-white' : 'text-white'}`}
          >
            {menuAberto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuAberto && (
          <div className="md:hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t dark:border-gray-800 shadow-lg animate-slideDown">
            <div className="flex flex-col p-4 gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuAberto(false)}
                  className="px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium"
                >
                  {label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setMenuAberto(false)}
                className="px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium"
              >
                Entrar
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuAberto(false)}
                className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold text-center mt-2"
              >
                Teste grátis
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/2 -right-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl animate-blob animation-delay-4000" />

          <div className="absolute inset-0 opacity-[0.07]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          <div className="absolute top-1/4 left-1/4 animate-float">
            <Sparkles className="w-6 h-6 text-green-400/40" />
          </div>
          <div className="absolute top-1/3 right-1/4 animate-float animation-delay-2000">
            <Sparkles className="w-4 h-4 text-emerald-300/40" />
          </div>
          <div className="absolute bottom-1/4 left-1/3 animate-float animation-delay-4000">
            <Sparkles className="w-5 h-5 text-teal-400/40" />
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md text-green-300 text-sm font-semibold px-5 py-2.5 rounded-full mb-8 border border-green-500/30 animate-fadeInDown">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            NOVO: Agora com Inteligência Artificial
            <Sparkles className="w-4 h-4" />
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold text-white mb-6 leading-tight animate-fadeInUp">
            O sistema feito para{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent animate-gradient">
                mercadinhos
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-full" />
            </span>
            <br className="hidden md:block" /> brasileiros
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed animate-fadeInUp animation-delay-200">
            Controle estoque, vendas e fiado pelo <strong className="text-white">celular</strong>. Sem planilha, sem caderno, sem complicação. A partir de{' '}
            <strong className="text-green-400">R$ 39,90/mês</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fadeInUp animation-delay-400">
            <Link
              href="/signup"
              className="group w-full sm:w-auto relative bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg px-8 py-4 rounded-full transition-all hover:scale-105 hover:shadow-2xl hover:shadow-green-500/40 flex items-center justify-center gap-2 overflow-hidden"
            >
              <span className="relative">Testar grátis agora</span>
              <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto text-gray-300 hover:text-white font-medium px-8 py-4 rounded-full border border-gray-700 hover:border-gray-500 transition-all hover:bg-white/5 backdrop-blur text-center"
            >
              Já tenho conta
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400 animate-fadeInUp animation-delay-600">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-400" /> Sem cartão
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-400" /> Cancele quando quiser
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-400" /> Suporte WhatsApp
            </span>
          </div>
        </div>
      </section>

      {/* SEÇÃO IA */}
      <section id="ia" className="relative py-20 md:py-28 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 overflow-hidden scroll-mt-20">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-32 w-96 h-96 bg-green-300/20 dark:bg-green-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4">
          <FadeInSection>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 text-sm font-bold px-4 py-2 rounded-full mb-4 border border-purple-200 dark:border-purple-800">
                <Brain className="w-4 h-4" />
                INTELIGÊNCIA ARTIFICIAL
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
                Sua IA pessoal de{' '}
                <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                  vendas e estoque
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Não é firula. É IA de verdade analisando suas vendas, sugerindo preços e cadastrando produtos por você.
              </p>
            </div>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {[
                { id: 'analise' as const, label: 'Análise de Vendas', icon: LineChart },
                { id: 'cadastro' as const, label: 'Cadastro Automático', icon: Wand2 },
                { id: 'preco' as const, label: 'Sugestão de Preço', icon: TrendingUp },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setIaTabAtiva(id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all ${
                    iaTabAtiva === id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-3xl blur-2xl opacity-30 animate-pulse" />

              <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-purple-100 dark:border-purple-900/50 overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-8 md:p-10">
                    {iaTabAtiva === 'analise' && (
                      <div className="animate-fadeIn">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-5 shadow-lg shadow-purple-500/30">
                          <LineChart className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                          Análise mensal automática
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                          A IA analisa seus últimos 30 dias de vendas e gera um relatório em <strong>linguagem natural</strong> — como se fosse um consultor amigo te explicando o que vendeu bem, o que tá fraco e o que fazer essa semana.
                        </p>
                        <ul className="space-y-3">
                          {[
                            'Identifica os produtos campeões de venda',
                            'Aponta margens baixas que estão te prejudicando',
                            'Sugere 3 ações práticas pra esta semana',
                            'Tudo em português claro, sem termo técnico',
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {iaTabAtiva === 'cadastro' && (
                      <div className="animate-fadeIn">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 mb-5 shadow-lg shadow-pink-500/30">
                          <Wand2 className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                          Cadastro de produto em 1 clique
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                          Você digita só o nome do produto (ex: <em>&quot;coca lata 350&quot;</em>) e a IA preenche <strong>categoria, descrição, marca</strong> e sugere o preço de venda automaticamente.
                        </p>
                        <ul className="space-y-3">
                          {[
                            'Reconhece milhares de produtos do varejo brasileiro',
                            'Cadastro 10x mais rápido que manual',
                            'Padroniza descrições e categorias',
                            'Funciona com escaneamento de código de barras',
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <CheckCircle className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {iaTabAtiva === 'preco' && (
                      <div className="animate-fadeIn">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-500 mb-5 shadow-lg shadow-orange-500/30">
                          <TrendingUp className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                          Sugestão de preço inteligente
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                          Informe o preço de custo e a IA sugere <strong>3 opções de preço de venda</strong>: conservador, equilibrado e agressivo — com a margem de lucro de cada um calculada.
                        </p>
                        <ul className="space-y-3">
                          {[
                            'Calcula margem ideal para o seu mercado',
                            '3 opções estratégicas pra você escolher',
                            'Considera categoria e tipo de produto',
                            'Para de chutar preço no escuro',
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/50 dark:via-pink-950/50 dark:to-orange-950/50 p-8 md:p-10 border-l border-purple-100 dark:border-purple-900/50">
                    {iaTabAtiva === 'analise' && (
                      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-xl animate-fadeIn">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b dark:border-gray-800">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white text-sm">Análise IA · Últimos 30 dias</span>
                        </div>
                        <div className="space-y-3 text-sm">
                          <p className="text-gray-700 dark:text-gray-300">
                            📊 <strong>Resumo do mês:</strong> Faturamento de R$ 14.230 com margem média de 32%.
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            🚀 <strong>Destaque:</strong> Coca 2L liderou com 184 unidades vendidas.
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            ⚠️ <strong>Atenção:</strong> Categoria Limpeza teve margem de só 12%. Reveja os preços.
                          </p>
                          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
                            <p className="font-bold text-purple-900 dark:text-purple-200 mb-2 text-xs">💡 SUGESTÕES DESTA SEMANA:</p>
                            <ul className="space-y-1 text-purple-800 dark:text-purple-300 text-xs">
                              <li>1. Aumentar preço de Limpeza em 8%</li>
                              <li>2. Comprar mais Coca 2L (esgota em 4 dias)</li>
                              <li>3. Promoção em Iogurte (parado há 2 semanas)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {iaTabAtiva === 'cadastro' && (
                      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-xl animate-fadeIn">
                        <div className="mb-4">
                          <label className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Você digita</label>
                          <div className="mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white font-mono">
                            coca lata 350
                          </div>
                        </div>
                        <div className="flex items-center justify-center my-3">
                          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-semibold">
                            <Bot className="w-4 h-4 animate-pulse" />
                            IA preenchendo...
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Nome:</span>
                            <p className="font-semibold text-gray-900 dark:text-white">Coca-Cola Lata 350ml</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Categoria:</span>
                            <p className="font-semibold text-gray-900 dark:text-white">Bebidas</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Marca:</span>
                            <p className="font-semibold text-gray-900 dark:text-white">Coca-Cola</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Preço sugerido:</span>
                            <p className="font-semibold text-green-600 dark:text-green-400">R$ 4,50 - R$ 5,50</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {iaTabAtiva === 'preco' && (
                      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-xl animate-fadeIn">
                        <div className="mb-3 pb-3 border-b dark:border-gray-800">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Custo:</span>
                          <p className="font-bold text-gray-900 dark:text-white">R$ 3,00</p>
                        </div>
                        <div className="space-y-2">
                          {[
                            { label: 'Conservador', preco: 'R$ 4,20', margem: '29%', destaque: false },
                            { label: 'Equilibrado', preco: 'R$ 5,00', margem: '40%', destaque: true },
                            { label: 'Agressivo', preco: 'R$ 5,90', margem: '49%', destaque: false },
                          ].map(({ label, preco, margem, destaque }) => (
                            <div
                              key={label}
                              className={`p-3 rounded-xl border-2 ${
                                destaque
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-md'
                                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{label}</p>
                                  <p className="font-bold text-gray-900 dark:text-white">{preco}</p>
                                </div>
                                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Margem {margem}</span>
                              </div>
                              {destaque && <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-semibold">★ RECOMENDADO</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={300}>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
              Disponível nos planos <strong className="text-purple-600 dark:text-purple-400">Profissional</strong> e{' '}
              <strong className="text-purple-600 dark:text-purple-400">Negócio</strong>
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* PROPOSTA DE VALOR */}
      <section className="py-20 md:py-24 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4">
          <FadeInSection>
            <h3 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-4">
              Tudo na palma da sua mão
            </h3>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-14 max-w-2xl mx-auto text-lg">
              Saiba o que está vendendo, o que está faltando e onde está perdendo dinheiro — tudo em tempo real.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Smartphone, titulo: 'Funciona no Celular', desc: '100% responsivo. Use no celular, tablet ou computador. Sem instalar nada.' },
              { icon: QrCode, titulo: 'Leitor de Código de Barras', desc: 'Escaneie produtos pela câmera do celular ou com leitor USB.' },
              { icon: MessageCircle, titulo: 'Suporte Direto Comigo', desc: 'Sem chatbot, sem fila. Falo direto com você pelo WhatsApp.' },
            ].map(({ icon: Icon, titulo, desc }, idx) => (
              <FadeInSection key={titulo} delay={idx * 100}>
                <div className="group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-7 transition-all hover:shadow-2xl hover:-translate-y-2 hover:border-green-200 dark:hover:border-green-800">
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{titulo}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="py-20 md:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4">
          <FadeInSection>
            <h3 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-3">
              Veja o sistema funcionando
            </h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-10 text-lg">Simples de usar, poderoso de verdade.</p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'pdv', label: 'PDV' },
                { id: 'relatorios', label: 'Relatórios' },
                { id: 'alertas', label: 'Alertas' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setDemoAtiva(id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    demoAtiva === id
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-3xl blur-2xl" />
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
                <div className="hidden sm:flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded">estoquesystem.com.br/dashboard</span>
                  </div>
                </div>
                
                  <video
                    key={demoAtiva}
                    src={`/videos/demo-${demoAtiva}.mp4`}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full block"
                    aria-label={`Demo ${demoAtiva}`}
                  >
                    Seu navegador não suporta vídeo HTML5.
                  </video>

              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-20 md:py-24 bg-white dark:bg-gray-950 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4">
          <FadeInSection>
            <h3 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-3">
              Tudo que você precisa em um lugar
            </h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-14 text-lg">Sem planilha, sem caderno, sem complicação.</p>
          </FadeInSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Package, titulo: 'Controle de Estoque', desc: 'Cadastre produtos, defina estoque mínimo e saiba exatamente o que tem.' },
              { icon: ShoppingCart, titulo: 'PDV no Celular', desc: 'Ponto de venda com leitor de código de barras. Venda direto do bolso.' },
              { icon: BarChart3, titulo: 'Relatórios Claros', desc: 'Vendas, lucro, margem em gráficos simples. Sem precisar ser contador.' },
              { icon: AlertCircle, titulo: 'Alertas Automáticos', desc: 'Receba avisos antes do produto acabar. Nunca mais perca uma venda.' },
              { icon: Users, titulo: 'Clientes e Fiado', desc: 'Controle quem deve, quanto deve e histórico completo. Adeus caderninho!' },
              { icon: Calendar, titulo: 'Controle de Validade', desc: 'Alertas antes do produto vencer. Pare de perder dinheiro com vencidos.' },
              { icon: FileText, titulo: 'Importar via CSV', desc: 'Importa centenas de produtos de uma planilha de uma vez só.' },
              { icon: Sparkles, titulo: 'Análise com IA', desc: 'A IA analisa suas vendas mensais e sugere ações práticas pra crescer.' },
              { icon: Wand2, titulo: 'Cadastro Inteligente', desc: 'Digite o nome e a IA preenche categoria, descrição e sugere preço.' },
            ].map(({ icon: Icon, titulo, desc }, idx) => (
              <FadeInSection key={titulo} delay={(idx % 3) * 100}>
                <div className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 hover:shadow-xl hover:border-green-200 dark:hover:border-green-800 transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">{titulo}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-20 md:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <FadeInSection>
            <h3 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-14">
              Comece em <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">2 minutos</span>
            </h3>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { passo: '1', titulo: 'Crie sua conta', desc: 'Cadastro rápido em 30 segundos. Sem burocracia, sem cartão.', emoji: '📝' },
              { passo: '2', titulo: 'Cadastre produtos', desc: 'Manualmente, via CSV ou escaneando o código de barras.', emoji: '📦' },
              { passo: '3', titulo: 'Comece a vender', desc: 'Use o PDV, acompanhe relatórios e deixe a IA te ajudar.', emoji: '🚀' },
            ].map(({ passo, titulo, desc, emoji }, idx) => (
              <FadeInSection key={passo} delay={idx * 150}>
                <div className="text-center group">
                  <div className="text-5xl mb-3 group-hover:scale-125 transition-transform inline-block">{emoji}</div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4 shadow-lg shadow-green-500/30">
                    {passo}
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">{titulo}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ANTES vs DEPOIS */}
      <section className="py-20 md:py-24 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4">
          <FadeInSection>
            <h3 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-14">
              A diferença é clara
            </h3>
          </FadeInSection>

          <div className="grid md:grid-cols-2 gap-6">
            <FadeInSection>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h4 className="font-bold text-red-800 dark:text-red-400 text-lg">Sem o EstoqueSystem</h4>
                </div>
                {[
                  'Controle no caderno ou planilha',
                  'Produto vence e você nem percebe',
                  'Não sabe o lucro real do mês',
                  'Funcionário vende e você não vê',
                  'Estoque acaba e você perde venda',
                  'Cliente fica devendo e você esquece',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 mb-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </FadeInSection>

            <FadeInSection delay={150}>
              <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl p-7">
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  ✨ COM IA
                </div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-bold text-green-800 dark:text-green-400 text-lg">Com o EstoqueSystem</h4>
                </div>
                {[
                  'Controle completo no celular',
                  'Alertas automáticos de vencimento',
                  'Relatórios de lucro em tempo real',
                  'Cada venda registrada automaticamente',
                  'IA sugere o que comprar e quando',
                  'Histórico completo de fiado por cliente',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* QUEM CRIOU */}
      <section className="py-20 md:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <FadeInSection>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-2 font-semibold tracking-wider uppercase">Quem está por trás</p>
            <h3 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-10">
              Prazer, Lucas Machado 👋
            </h3>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-7 md:p-12 shadow-xl">
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">
                Tenho 20 anos e sou desenvolvedor. Criei o EstoqueSystem porque vi de perto pequenos comerciantes{' '}
                <strong className="text-green-600 dark:text-green-400">perdendo dinheiro por falta de controle</strong> usando caderno, planilha ou simplesmente confiando na memória.
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">
                Então resolvi construir algo <strong>simples, direto e que realmente funcionasse</strong> no dia a dia de quem está atrás do balcão.
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                Cada tela, cada botão e cada funcionalidade foi pensada para quem não tem tempo de aprender sistemas complicados.{' '}
                <strong>Se você é essa pessoa, o EstoqueSystem foi feito pra você.</strong>
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">Missão</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Tornar o controle de estoque acessível pra todo pequeno comércio</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                  <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">Suporte direto</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Fale comigo pelo WhatsApp — sem robô, sem fila</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* PLANOS */}
      <section id="preco" className="py-20 md:py-24 bg-white dark:bg-gray-950 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <FadeInSection>
            <h3 className="text-3xl md:text-5xl font-extrabold text-center text-gray-900 dark:text-white mb-3">
              Escolha seu plano
            </h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-14 text-lg">
              Sem fidelidade. Cancele quando quiser. <strong className="text-green-600 dark:text-green-400">15 dias grátis</strong>.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* INICIANTE */}
            <FadeInSection delay={0}>
              <div className="group h-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-3xl p-7 transition-all hover:shadow-2xl hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-2">
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-gray-700 dark:text-gray-300" />
                </div>
                <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Iniciante</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Pra quem tá começando</p>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">R$</span>
                  <span className="text-5xl font-extrabold text-gray-900 dark:text-white">39</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">,90</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/mês</span>
                </div>
                <ul className="space-y-3 mb-7 text-sm">
                  {[
                    { texto: 'Até 100 produtos', bold: true },
                    { texto: '1 usuário', bold: false },
                    { texto: 'PDV completo', bold: false },
                    { texto: 'Leitor de código de barras', bold: false },
                    { texto: 'Alertas de estoque baixo', bold: false },
                    { texto: 'Relatórios básicos', bold: false },
                    { texto: 'Suporte por WhatsApp', bold: false },
                  ].map(({ texto, bold }) => (
                    <li key={texto} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className={`text-gray-700 dark:text-gray-300 ${bold ? 'font-semibold' : ''}`}>{texto}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup?plano=iniciante"
                  className="block w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold py-3.5 rounded-full text-center transition"
                >
                  Começar 15 dias grátis
                </Link>
              </div>
            </FadeInSection>

            {/* PROFISSIONAL */}
            <FadeInSection delay={100}>
              <div className="group relative h-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition" />
                <div className="relative h-full bg-white dark:bg-gray-900 border-2 border-green-500 rounded-3xl p-7 shadow-2xl md:scale-105 transition-all hover:-translate-y-2">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full whitespace-nowrap shadow-lg">
                    ⭐ MAIS POPULAR
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Profissional</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Pro mercadinho que cresce</p>
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">R$</span>
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">79</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">,90</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-7 text-sm">
                    {[
                      { texto: 'Produtos ilimitados', bold: true, ia: false },
                      { texto: 'Até 3 usuários', bold: false, ia: false },
                      { texto: 'Clientes + Fiado', bold: true, ia: false },
                      { texto: 'Controle de validade', bold: false, ia: false },
                      { texto: 'Relatórios avançados', bold: false, ia: false },
                      { texto: 'Importar via CSV', bold: true, ia: false },
                      { texto: 'Exportação CSV', bold: false, ia: false },
                      { texto: 'Cupom via WhatsApp', bold: false, ia: false },
                      { texto: 'Análise mensal com IA', bold: true, ia: true },
                      { texto: 'Suporte prioritário WhatsApp', bold: true, ia: false },
                    ].map(({ texto, bold, ia }) => (
                      <li key={texto} className="flex items-start gap-2">
                        {ia ? (
                          <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-gray-700 dark:text-gray-300 ${bold ? 'font-semibold' : ''}`}>{texto}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup?plano=profissional"
                    className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-xl hover:shadow-green-500/40 text-white font-bold py-3.5 rounded-full text-center transition"
                  >
                    Começar 15 dias grátis
                  </Link>
                </div>
              </div>
            </FadeInSection>

            {/* NEGÓCIO */}
            <FadeInSection delay={200}>
              <div className="group relative h-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition" />
                <div className="relative h-full bg-white dark:bg-gray-900 border-2 border-purple-500 rounded-3xl p-7 shadow-xl transition-all hover:-translate-y-2">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Negócio</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Pro mercadinho consolidado</p>
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">R$</span>
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">149</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">,90</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-7 text-sm">
                    {[
                      { texto: 'Tudo do Profissional', bold: true, ia: false, soon: false },
                      { texto: 'Até 10 usuários', bold: false, ia: false, soon: false },
                      { texto: 'IA pra cadastro automático', bold: true, ia: true, soon: false },
                      { texto: 'IA pra sugestão de preço', bold: true, ia: true, soon: false },
                      { texto: 'IA pra análise mensal (incluída)', bold: false, ia: true, soon: false },
                      { texto: 'Atendimento direto com o desenvolvedor', bold: true, ia: false, soon: false },
                      { texto: 'Resposta em até 1h (horário comercial)', bold: false, ia: false, soon: false },
                      { texto: 'Sugestões de features priorizadas', bold: false, ia: false, soon: false },
                      { texto: 'Catálogo público da loja', bold: false, ia: false, soon: true },
                      { texto: 'Suporte VIP por WhatsApp', bold: true, ia: false, soon: false },
                    ].map(({ texto, bold, ia, soon }) => (
                      <li key={texto} className="flex items-start gap-2">
                        {ia ? (
                          <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-gray-700 dark:text-gray-300 ${bold ? 'font-semibold' : ''}`}>
                          {texto}
                          {soon && (
                            <span className="ml-1 text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                              em breve
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup?plano=negocio"
                    className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl hover:shadow-purple-500/40 text-white font-bold py-3.5 rounded-full text-center transition"
                  >
                    Começar 15 dias grátis
                  </Link>
                </div>
              </div>
            </FadeInSection>
          </div>

          <FadeInSection delay={300}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-green-500" /> Pagamento seguro Mercado Pago
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" /> Sem cartão no teste
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" /> Cancele quando quiser
              </span>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-24 bg-gray-50 dark:bg-gray-900 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4">
          <FadeInSection>
            <h3 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-14">
              Perguntas frequentes
            </h3>
          </FadeInSection>

          <div className="space-y-3">
            {[
              { p: 'Preciso instalar alguma coisa?', r: 'Não! O EstoqueSystem funciona direto no navegador, no celular ou computador. É só acessar e usar.' },
              { p: 'Funciona no celular?', r: 'Sim! O sistema é 100% responsivo. O PDV e o leitor de código de barras funcionam perfeitamente pelo celular.' },
              { p: 'Como funciona o período de teste?', r: 'Você tem 15 dias grátis com acesso completo a TODOS os recursos do plano escolhido. Sem cartão de crédito.' },
              { p: 'Como funciona a Análise com IA?', r: 'A IA analisa suas vendas dos últimos 30 dias e gera um relatório em linguagem natural com sugestões práticas. Tipo um consultor amigo. Disponível no Profissional e Negócio.' },
              { p: 'Posso importar meus produtos de uma planilha?', r: 'Sim! No plano Profissional você importa centenas de produtos de uma vez via arquivo CSV.' },
              { p: 'Posso mudar de plano depois?', r: 'Sim! Upgrade ou downgrade a qualquer momento. A cobrança é ajustada proporcionalmente.' },
              { p: 'Como faço o pagamento?', r: 'Pelo Mercado Pago. Aceitamos PIX e cartão de crédito. Acesso liberado automaticamente após confirmação.' },
              { p: 'Posso adicionar funcionários?', r: 'Sim! Funcionários têm acesso apenas ao PDV e estoque. Limite: 1 no Iniciante, 3 no Profissional, 10 no Negócio.' },
              { p: 'E o controle de fiado?', r: 'Disponível nos planos Profissional e Negócio. Cadastra cliente, registra débito, acompanha pagamentos.' },
              { p: 'Meus dados ficam seguros?', r: 'Sim! Criptografia em trânsito (SSL) e em repouso. Seus dados são só seus. Você pode exportar ou excluir a qualquer momento (LGPD).' },
            ].map(({ p, r }, idx) => (
              <FadeInSection key={p} delay={idx * 30}>
                <details className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition list-none">
                    <span>{p}</span>
                    <span className="text-green-600 dark:text-green-400 ml-4 group-open:rotate-180 transition-transform">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-gray-600 dark:text-gray-400 leading-relaxed">{r}</p>
                </details>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700">
          <div className="absolute top-0 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-0 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center px-4">
          <FadeInSection>
            <Rocket className="w-16 h-16 text-white mx-auto mb-6 animate-bounce-slow" />
            <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Quanto dinheiro você já perdeu por falta de controle?
            </h3>
            <p className="text-green-50 text-lg md:text-xl mb-10 max-w-xl mx-auto">
              Comece agora a partir de <strong>R$ 39,90/mês</strong>. 15 dias grátis, sem cartão.
            </p>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 bg-white text-green-700 font-bold text-lg px-10 py-4 rounded-full hover:shadow-2xl transition-all hover:-translate-y-1 hover:scale-105"
            >
              Quero organizar meu estoque
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </FadeInSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">📦</span>
            <span className="font-bold text-white text-lg">EstoqueSystem</span>
          </div>
          <p className="text-sm mb-6">{`© ${new Date().getFullYear()} EstoqueSystem. Todos os direitos reservados.`}</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
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
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="WhatsApp"
      >
        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30" />
        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:shadow-green-500/50 transition-all hover:scale-110">
          <MessageCircle className="w-7 h-7" />
        </div>
      </a>
    </div>
  )
}