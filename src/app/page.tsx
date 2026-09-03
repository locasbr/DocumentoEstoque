'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Lightbulb,
  Menu,
  MessageCircle,
  Package,
  PackageCheck,
  QrCode,
  RefreshCw,
  Rocket,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  User,
  Users,
  Warehouse,
  X,
  Zap,
} from 'lucide-react'

const WHATSAPP = '5522999467499'
const LINK_WHATSAPP = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  'Olá! Gostaria de conhecer melhor o EstoqueSystem.'
)}`

const NAV_LINKS = [
  { label: 'Produto', href: '#produto' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Inteligência', href: '#inteligencia' },
  { label: 'Planos', href: '#planos' },
  { label: 'Dúvidas', href: '#duvidas' },
]



const DEMOS = [
  { id: 'dashboard', label: 'Visão geral', imagem: '/videos/demo-dashboard.png' },
  { id: 'pdv', label: 'PDV', imagem: '/videos/demo-pdv.png' },
  { id: 'relatorios', label: 'Relatórios', imagem: '/videos/demo-relatorios.png' },
  { id: 'raio-x', label: 'Raio-X', imagem: '/videos/demo-raio-x.png' },
] as const

type DemoId = (typeof DEMOS)[number]['id']

const FAQS = [
  {
    pergunta: 'Preciso instalar algum programa?',
    resposta:
      'Não. O EstoqueSystem funciona pelo navegador no celular, tablet ou computador e requer conexão com a internet.',
  },
  {
    pergunta: 'Como funciona o período de teste?',
    resposta:
      'Você pode testar o sistema por 15 dias sem cadastrar cartão. Ao final, escolha um dos planos disponíveis para continuar usando a conta.',
  },
  {
    pergunta: 'O comprovante da venda é fiscal?',
    resposta:
      'Não. O documento gerado pelo EstoqueSystem é um comprovante não fiscal e não substitui nota fiscal, NFC-e ou outro documento tributário exigido para o estabelecimento.',
  },
  {
    pergunta: 'Quantas pessoas podem acessar a conta?',
    resposta:
      'Cada estabelecimento pode ter um proprietário e, no máximo, um usuário adicional, cada um com o próprio acesso.',
  },
  {
    pergunta: 'Como a inteligência artificial ajuda?',
    resposta:
      'No plano Profissional, a IA auxilia no cadastro de produtos, na sugestão de preço e na interpretação mensal das vendas. As sugestões servem como apoio e devem ser conferidas pelo usuário.',
  },
  {
    pergunta: 'Posso trocar de plano depois?',
    resposta:
      'Sim. A página de assinatura apresenta as opções vigentes. Mudanças que envolvam cobrança ou assinatura são confirmadas pelo fluxo de pagamento ou pelo suporte.',
  },
  {
    pergunta: 'Como funciona o pagamento?',
    resposta:
      'A contratação é processada pelo Mercado Pago conforme as opções exibidas na página de assinatura. A liberação ocorre após a confirmação do pagamento pelo provedor.',
  },
]

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const elemento = ref.current
    if (!elemento) return

    const reduzirMovimento = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (reduzirMovimento) {
      setVisivel(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(elemento)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visivel }
}

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const { ref, visivel } = useInView()

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 motion-reduce:transform-none motion-reduce:transition-none ${
        visivel ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export default function LandingPage() {
  const [menuAberto, setMenuAberto] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [faqAberta, setFaqAberta] = useState<number | null>(0)
  const [demoAtiva, setDemoAtiva] = useState<DemoId>('dashboard')

  const demoSelecionada =
    DEMOS.find((demo) => demo.id === demoAtiva) ?? DEMOS[0]

  useEffect(() => {
    const atualizar = () => setScrolled(window.scrollY > 24)
    atualizar()
    window.addEventListener('scroll', atualizar, { passive: true })
    return () => window.removeEventListener('scroll', atualizar)
  }, [])

  useEffect(() => {
    if (!menuAberto) return
    const fechar = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuAberto(false)
    }
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [menuAberto])

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-950 dark:bg-gray-950 dark:text-white">
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          scrolled || menuAberto
            ? 'border-gray-200/80 bg-white/90 py-3 shadow-sm backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/90'
            : 'border-transparent bg-transparent py-5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#inicio" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <Package className="h-5 w-5" />
            </span>
            <span
              className={`font-black tracking-tight ${
                scrolled || menuAberto
                  ? 'text-gray-950 dark:text-white'
                  : 'text-white'
              }`}
            >
              EstoqueSystem
            </span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-sm font-semibold transition hover:text-emerald-500 ${
                  scrolled
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-white/75'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className={`px-3 py-2 text-sm font-bold transition hover:text-emerald-500 ${
                scrolled ? 'text-gray-700 dark:text-gray-300' : 'text-white/80'
              }`}
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600"
            >
              Começar grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuAberto((atual) => !atual)}
            aria-expanded={menuAberto}
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            className={`rounded-lg p-2 lg:hidden ${
              scrolled || menuAberto
                ? 'text-gray-900 dark:text-white'
                : 'text-white'
            }`}
          >
            {menuAberto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuAberto && (
          <div className="border-t border-gray-200 bg-white px-4 py-4 shadow-xl dark:border-gray-800 dark:bg-gray-950 lg:hidden">
            <nav className="mx-auto max-w-7xl">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuAberto(false)}
                  className="block rounded-xl px-4 py-3 font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                <Link
                  href="/login"
                  className="rounded-xl border border-gray-200 px-4 py-3 text-center font-bold dark:border-gray-800"
                >
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-emerald-500 px-4 py-3 text-center font-bold text-white"
                >
                  Testar grátis
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section
          id="inicio"
          className="relative overflow-hidden bg-gray-950 pb-24 pt-32 text-white md:pb-32 md:pt-40"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_85%_70%,rgba(20,184,166,0.14),transparent_35%)]" />
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:48px_48px]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
                <Store className="h-4 w-4" />
                Controle simples para pequenos negócios
              </div>

              <h1 className="mt-7 text-4xl font-black leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                Saiba o que tem,
                <span className="block bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  o que falta e onde agir.
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 lg:mx-0">
                Controle estoque, vendas, clientes e fiado em um sistema direto,
                feito para quem quer sair do caderno e da planilha sem entrar em
                um ERP complicado.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-7 py-4 font-black text-white shadow-xl shadow-emerald-500/20 transition hover:-translate-y-1 hover:bg-emerald-600"
                >
                  Começar teste grátis
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#demonstracao"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-4 font-bold text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  Ver o sistema
                  <ChevronDown className="h-5 w-5" />
                </a>
              </div>

              <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-gray-400 lg:justify-start">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  15 dias grátis
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Sem cartão no teste
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  A partir de R$ 39,90/mês
                </span>
              </div>
            </div>

            <ProductPreview />
          </div>
        </section>

        <section className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-200 px-4 dark:divide-gray-800 sm:px-6 md:grid-cols-4 lg:px-8">
            <TrustItem icon={Smartphone} text="Celular e computador" />
            <TrustItem icon={QrCode} text="Código de barras" />
            <TrustItem icon={MessageCircle} text="Suporte direto" />
            <TrustItem icon={ShieldCheck} text="Pagamento pelo Mercado Pago" />
          </div>
        </section>

        <section id="produto" className="scroll-mt-24 bg-white py-20 dark:bg-gray-950 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow="Menos improviso"
                title="Problemas pequenos viram prejuízo quando passam despercebidos."
                description="O EstoqueSystem organiza o básico que precisa funcionar todos os dias, sem esconder a operação atrás de telas complicadas."
              />
            </Reveal>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              <ProblemCard
                icon={AlertTriangle}
                problema="Produto acaba na hora da venda"
                solucao="Defina o estoque mínimo e enxergue os itens que precisam de reposição."
                cor="amber"
              />
              <ProblemCard
                icon={RefreshCw}
                problema="O saldo deixa de representar a realidade"
                solucao="Registre entradas, saídas e perdas para manter o histórico organizado."
                cor="blue"
              />
              <ProblemCard
                icon={User}
                problema="O fiado fica perdido em anotações"
                solucao="Centralize débitos e pagamentos no cadastro do cliente."
                cor="violet"
              />
            </div>
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-24 bg-gray-50 py-20 dark:bg-gray-900 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                centered
                eyebrow="Tudo conectado"
                title="Uma venda movimenta a operação inteira."
                description="Você registra uma vez. O sistema atualiza o estoque e mostra o que merece atenção em seguida."
              />
            </Reveal>

            <div className="relative mt-14 grid gap-4 md:grid-cols-4">
              <div className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-gradient-to-r from-emerald-300 via-emerald-500 to-amber-400 md:block" />
              <FlowStep number="01" icon={ShoppingCart} title="Venda registrada" text="O pedido é confirmado no PDV." />
              <FlowStep number="02" icon={PackageCheck} title="Estoque atualizado" text="Os produtos vendidos têm o saldo reduzido." />
              <FlowStep number="03" icon={BellRing} title="Alerta identificado" text="Itens abaixo do mínimo ganham destaque." />
              <FlowStep number="04" icon={Warehouse} title="Reposição organizada" text="Você sabe o que verificar primeiro." />
            </div>
          </div>
        </section>

        <section className="bg-white py-20 dark:bg-gray-950 md:py-28">
          <div className="mx-auto max-w-7xl space-y-24 px-4 sm:px-6 lg:px-8">
            <ProductArea
              eyebrow="Estoque"
              title="Saldo, movimentações e reposição no mesmo fluxo."
              description="Cadastre preços e quantidades, acompanhe entradas e saídas, registre perdas e identifique produtos abaixo do estoque mínimo."
              benefits={[
                'Cadastro por SKU ou código de barras',
                'Estoque mínimo e alertas',
                'Histórico de movimentações',
                'Perdas e avarias registradas',
              ]}
              visual={<StockVisual />}
            />

            <ProductArea
              reversed
              eyebrow="PDV e vendas"
              title="Venda rápida sem deixar o estoque para depois."
              description="Adicione produtos, selecione a forma de pagamento e finalize a venda. O comprovante gerado é não fiscal e serve para conferência da operação."
              benefits={[
                'Busca e leitura de código de barras',
                'Dinheiro, PIX e cartões',
                'Atualização automática do saldo',
                'Histórico de vendas',
              ]}
              visual={<SalesVisual />}
            />

            <ProductArea
              eyebrow="Clientes e fiado"
              title="Chega de procurar dívida em caderno e conversa antiga."
              description="Mantenha os clientes organizados e registre débitos e pagamentos sem perder o histórico da conta."
              benefits={[
                'Cadastro de clientes',
                'Débitos e pagamentos',
                'Saldo devedor atualizado',
                'Histórico preservado',
              ]}
              visual={<CustomerVisual />}
            />
          </div>
        </section>

        <section id="inteligencia" className="scroll-mt-24 overflow-hidden bg-gray-950 py-20 text-white md:py-28">
          <div className="absolute opacity-20" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <Reveal>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-violet-300">
                  <Brain className="h-4 w-4" />
                  Inteligência no plano Profissional
                </div>
                <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  O sistema calcula.
                  <span className="block bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                    A inteligência explica. Você decide.
                  </span>
                </h2>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-300">
                  Recursos de IA transformam informações da conta em apoio prático,
                  sem alterar seu estoque ou seus preços automaticamente.
                </p>

                <div className="mt-8 space-y-4">
                  <AiFeature icon={Package} title="Cadastro assistido" text="Sugestões de categoria e descrição para acelerar o cadastro do produto." />
                  <AiFeature icon={CircleDollarSign} title="Sugestão de preço" text="Apoio para analisar custo e margem antes de definir o preço de venda." />
                  <AiFeature icon={TrendingUp} title="Leitura mensal das vendas" text="Resumo em linguagem natural para identificar resultados e prioridades." />
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <IntelligencePreview />
            </Reveal>
          </div>
        </section>

        <section id="demonstracao" className="scroll-mt-24 bg-gray-50 py-20 dark:bg-gray-900 md:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                centered
                eyebrow="Produto real"
                title="Veja como é usar o EstoqueSystem."
                description="Escolha uma área para conhecer a interface atual do sistema."
              />
            </Reveal>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {DEMOS.map((demo) => (
                <button
                  type="button"
                  key={demo.id}
                  onClick={() => setDemoAtiva(demo.id)}
                  aria-pressed={demoAtiva === demo.id}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                    demoAtiva === demo.id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300'
                  }`}
                >
                  {demo.label}
                </button>
              ))}
            </div>

            <Reveal delay={80}>
              <div className="mx-auto mt-8 overflow-hidden rounded-3xl border border-gray-800 bg-gray-950 shadow-2xl">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 rounded-md bg-white/5 px-3 py-1 text-[10px] font-medium text-gray-500">
                    EstoqueSystem · {demoSelecionada.label}
                  </span>
                </div>
                <div className="relative flex min-h-[220px] w-full items-center justify-center bg-gray-950 sm:min-h-[360px]">
                  <img
                    key={demoSelecionada.id}
                    src={demoSelecionada.imagem}
                    alt={`Tela real do EstoqueSystem: ${demoSelecionada.label}`}
                    className="block h-auto max-h-[720px] w-full object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="bg-white py-20 dark:bg-gray-950 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                centered
                eyebrow="Comece sem complicação"
                title="Da conta criada ao primeiro controle em três passos."
              />
            </Reveal>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <StartStep number="1" icon={User} title="Crie sua conta" text="Comece o período de teste sem cadastrar cartão." />
              <StartStep number="2" icon={Package} title="Cadastre seus produtos" text="Informe os dados básicos, o saldo e o estoque mínimo." />
              <StartStep number="3" icon={Rocket} title="Use na rotina" text="Registre vendas e movimentos para acompanhar a operação real." />
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20 dark:bg-gray-900 md:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:px-8">
            <Reveal>
              <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-xl shadow-emerald-500/20 lg:mx-0">
                <span className="text-5xl font-black">LM</span>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
                  Criado e acompanhado de perto
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 dark:text-white md:text-4xl">
                  Um sistema que evolui com o uso real dos clientes.
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                  O EstoqueSystem foi criado por Lucas Machado para ajudar pequenos
                  negócios a organizar estoque e vendas sem depender de sistemas
                  difíceis. O produto continua evoluindo com base nas necessidades
                  encontradas na rotina de quem usa.
                </p>
                <a
                  href={LINK_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex items-center gap-2 font-black text-emerald-600 hover:text-emerald-700"
                >
                  <MessageCircle className="h-5 w-5" />
                  Falar diretamente pelo WhatsApp
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="planos" className="scroll-mt-24 bg-white py-20 dark:bg-gray-950 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                centered
                eyebrow="Planos"
                title="Comece simples e avance quando precisar."
                description="Todos os planos mantêm a mesma proposta: controle direto, sem transformar sua rotina em um projeto de implantação."
              />
            </Reveal>

            <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
              <PlanCard
                name="Iniciante"
                price="39,90"
                description="Para começar a organizar produtos, estoque e vendas."
                icon={Zap}
                items={[
                  'Até 100 produtos',
                  'Controle de estoque',
                  'PDV e histórico de vendas',
                  'Alertas e reposição',
                  'Perdas e avarias',
                  '1 proprietário + 1 usuário adicional',
                ]}
                href="/signup?plano=iniciante"
              />
              <PlanCard
                recommended
                name="Profissional"
                price="79,90"
                description="Para quem precisa controlar mais e analisar melhor."
                icon={Sparkles}
                items={[
                  'Tudo do Iniciante',
                  'Limite ampliado de produtos',
                  'Clientes e fiado',
                  'Controle de validade',
                  'Importação e exportação CSV',
                  'Recursos de inteligência artificial',
                  '1 proprietário + 1 usuário adicional',
                ]}
                href="/signup?plano=profissional"
              />
            </div>

            <div className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                15 dias grátis
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Sem cartão no teste
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Sem fidelidade
              </span>
            </div>
          </div>
        </section>

        <section id="duvidas" className="scroll-mt-24 bg-gray-50 py-20 dark:bg-gray-900 md:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <Reveal>
              <SectionHeading
                centered
                eyebrow="Dúvidas frequentes"
                title="O que você precisa saber antes de começar."
              />
            </Reveal>

            <div className="mt-10 space-y-3">
              {FAQS.map((faq, index) => {
                const aberta = faqAberta === index
                return (
                  <article
                    key={faq.pergunta}
                    className={`overflow-hidden rounded-2xl border bg-white transition dark:bg-gray-950 ${
                      aberta
                        ? 'border-emerald-300 shadow-md dark:border-emerald-800'
                        : 'border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setFaqAberta(aberta ? null : index)}
                      aria-expanded={aberta}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left font-bold"
                    >
                      <span>{faq.pergunta}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-emerald-600 transition ${
                          aberta ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {aberta && (
                      <p className="border-t border-gray-100 px-5 py-5 leading-relaxed text-gray-600 dark:border-gray-800 dark:text-gray-400">
                        {faq.resposta}
                      </p>
                    )}
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 py-24 text-white md:py-28">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />
          <div className="relative mx-auto max-w-3xl px-4 text-center">
            <Rocket className="mx-auto h-12 w-12" />
            <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              Seu estoque pode começar a fazer sentido hoje.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-emerald-50">
              Teste o EstoqueSystem por 15 dias e veja se o fluxo combina com a
              rotina do seu negócio.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-black text-emerald-700 transition hover:-translate-y-1 hover:shadow-xl"
              >
                Criar minha conta
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href={LINK_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-8 py-4 font-bold text-white hover:bg-white/10"
              >
                Tirar uma dúvida
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-950 py-12 text-gray-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-7 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <div>
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <Package className="h-5 w-5" />
              </span>
              <span className="font-black text-white">EstoqueSystem</span>
            </div>
            <p className="mt-3 text-sm">
              Controle direto para pequenos negócios.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
            <Link href="/login" className="hover:text-white">Entrar</Link>
            <Link href="/signup" className="hover:text-white">Criar conta</Link>
            <Link href="/termos" className="hover:text-white">Termos</Link>
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
          </div>
          <p className="text-xs">
            © {new Date().getFullYear()} EstoqueSystem
          </p>
        </div>
      </footer>

      <a
        href={LINK_WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar sobre o EstoqueSystem pelo WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl transition hover:scale-110 hover:bg-emerald-700"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  )
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-3xl lg:mx-0">
      <div className="absolute -inset-8 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative rotate-[0.7deg] overflow-hidden rounded-3xl border border-white/10 bg-gray-900 shadow-2xl shadow-black/40 transition duration-500 hover:rotate-0 hover:scale-[1.01]">
        <div className="flex items-center gap-2 border-b border-white/10 bg-gray-950 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <div className="mx-auto rounded-md bg-white/5 px-10 py-1 text-[9px] text-gray-500">
            app.estoquesystem.com.br/dashboard
          </div>
        </div>

        <div className="grid min-h-[420px] grid-cols-[68px_1fr] sm:grid-cols-[150px_1fr]">
          <div className="border-r border-white/10 bg-gray-950 p-3">
            <div className="mb-6 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500">
                <Package className="h-4 w-4" />
              </span>
              <span className="hidden text-xs font-black sm:block">EstoqueSystem</span>
            </div>
            <div className="space-y-2">
              {[
                [BarChart3, 'Dashboard', true],
                [Package, 'Produtos', false],
                [ShoppingCart, 'PDV', false],
                [Users, 'Clientes', false],
                [BellRing, 'Alertas', false],
              ].map(([Icon, label, active]) => {
                const IconComponent = Icon as LucideIcon
                return (
                  <div
                    key={String(label)}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] ${
                      active
                        ? 'bg-emerald-500/15 font-bold text-emerald-300'
                        : 'text-gray-500'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:block">{String(label)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-gray-900 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500">VISÃO GERAL</p>
                <h3 className="mt-1 text-base font-black">Bom dia, Mercado Central</h3>
              </div>
              <span className="rounded-lg bg-emerald-500 px-3 py-2 text-[9px] font-black">
                Nova venda
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <PreviewMetric label="Produtos" value="248" icon={Package} color="blue" />
              <PreviewMetric label="Estoque baixo" value="7" icon={AlertTriangle} color="amber" />
              <PreviewMetric label="Vendas hoje" value="18" icon={ShoppingCart} color="green" />
              <PreviewMetric label="Total hoje" value="R$ 1.284" icon={TrendingUp} color="violet" />
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-xl border border-white/10 bg-gray-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold">Vendas da semana</p>
                    <p className="mt-1 text-[9px] text-gray-500">Visão demonstrativa</p>
                  </div>
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-6 flex h-28 items-end gap-2">
                  {[35, 58, 42, 75, 62, 90, 68].map((height, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-300"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[8px] text-gray-600">{['S','T','Q','Q','S','S','D'][index]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-amber-300" />
                  <p className="text-xs font-bold">Atenção agora</p>
                </div>
                <div className="mt-4 space-y-3">
                  <PreviewAlert name="Arroz 5 kg" value="0 un" critical />
                  <PreviewAlert name="Café 500 g" value="2 un" />
                  <PreviewAlert name="Óleo 900 ml" value="4 un" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-7 left-2 rounded-2xl border border-emerald-300/20 bg-gray-950/95 p-4 shadow-2xl backdrop-blur sm:-left-7">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-black">Venda finalizada</p>
            <p className="mt-0.5 text-[10px] text-gray-500">Estoque atualizado automaticamente</p>
          </div>
        </div>
      </div>

      <div className="absolute -right-2 top-16 hidden rounded-2xl border border-violet-300/20 bg-gray-950/95 p-4 shadow-2xl backdrop-blur sm:block lg:-right-7">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
            <Brain className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-black">Análise pronta</p>
            <p className="mt-0.5 text-[10px] text-gray-500">3 prioridades identificadas</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TrustItem({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex min-h-24 items-center justify-center gap-2 px-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 sm:text-sm">
      <Icon className="h-5 w-5 shrink-0 text-emerald-600" />
      <span>{text}</span>
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string
  title: string
  description?: string
  centered?: boolean
}) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 dark:text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  )
}

function ProblemCard({
  icon: Icon,
  problema,
  solucao,
  cor,
}: {
  icon: LucideIcon
  problema: string
  solucao: string
  cor: 'amber' | 'blue' | 'violet'
}) {
  const colors = {
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  }

  return (
    <Reveal>
      <article className="h-full rounded-3xl border border-gray-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors[cor]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-xl font-black">{problema}</h3>
        <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-400">
          {solucao}
        </p>
      </article>
    </Reveal>
  )
}

function FlowStep({ number, icon: Icon, title, text }: { number: string; icon: LucideIcon; title: string; text: string }) {
  return (
    <Reveal>
      <div className="relative text-center">
        <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-gray-50 bg-white text-emerald-600 shadow-lg dark:border-gray-900 dark:bg-gray-950">
          <Icon className="h-7 w-7" />
        </div>
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">{number}</p>
        <h3 className="mt-2 font-black">{title}</h3>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-500">{text}</p>
      </div>
    </Reveal>
  )
}

function ProductArea({
  eyebrow,
  title,
  description,
  benefits,
  visual,
  reversed = false,
}: {
  eyebrow: string
  title: string
  description: string
  benefits: string[]
  visual: ReactNode
  reversed?: boolean
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal className={reversed ? 'lg:order-2' : ''}>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-600 dark:text-gray-400">{description}</p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
      <Reveal delay={80} className={reversed ? 'lg:order-1' : ''}>{visual}</Reveal>
    </div>
  )
}

function StockVisual() {
  return (
    <MockWindow title="Produtos e estoque">
      <div className="grid grid-cols-3 gap-2">
        <TinyMetric label="Produtos" value="248" />
        <TinyMetric label="Baixo" value="7" amber />
        <TinyMetric label="Zerados" value="2" red />
      </div>
      <div className="mt-4 space-y-2">
        <MockProduct name="Arroz tipo 1 · 5 kg" sku="7891001" stock="24" status="Normal" />
        <MockProduct name="Café tradicional · 500 g" sku="7892323" stock="2" status="Baixo" warning />
        <MockProduct name="Óleo de soja · 900 ml" sku="7894411" stock="0" status="Zerado" critical />
      </div>
    </MockWindow>
  )
}

function SalesVisual() {
  return (
    <MockWindow title="Frente de caixa">
      <div className="grid gap-3 sm:grid-cols-[1fr_0.7fr]">
        <div className="space-y-2">
          {['Arroz 5 kg', 'Feijão 1 kg', 'Óleo 900 ml'].map((item, index) => (
            <div key={item} className="flex items-center justify-between rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
              <div><p className="text-xs font-bold">{item}</p><p className="text-[9px] text-gray-400">{index + 1} unidade</p></div>
              <p className="text-xs font-black">R$ {[29.9, 8.49, 7.99][index].toFixed(2).replace('.', ',')}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-gray-950 p-4 text-white">
          <p className="text-[9px] uppercase text-gray-500">Total da venda</p>
          <p className="mt-2 text-2xl font-black">R$ 46,38</p>
          <div className="mt-5 rounded-lg bg-emerald-500 py-2.5 text-center text-xs font-black">Finalizar venda</div>
        </div>
      </div>
    </MockWindow>
  )
}

function CustomerVisual() {
  return (
    <MockWindow title="Clientes e fiado">
      <div className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white">
        <p className="text-[9px] uppercase text-violet-200">Saldo em aberto</p>
        <p className="mt-1 text-2xl font-black">R$ 284,50</p>
        <p className="mt-1 text-[10px] text-violet-200">3 clientes com saldo devedor</p>
      </div>
      <div className="mt-3 space-y-2">
        {[
          ['Maria Silva', 'R$ 120,00'],
          ['Carlos Souza', 'R$ 94,50'],
          ['Joana Pereira', 'R$ 70,00'],
        ].map(([name, value]) => (
          <div key={name} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-3 dark:border-gray-700">
            <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-[10px] font-black text-violet-700">{name.charAt(0)}</span><p className="text-xs font-bold">{name}</p></div>
            <p className="text-xs font-black text-red-600">{value}</p>
          </div>
        ))}
      </div>
    </MockWindow>
  )
}

function IntelligencePreview() {
  return (
    <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/5 p-4 shadow-2xl sm:p-6">
      <div className="rounded-2xl border border-white/10 bg-gray-900 p-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-300" /><p className="font-black">Análise mensal</p></div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[9px] font-bold text-emerald-300">CONCLUÍDA</span>
        </div>
        <div className="mt-5 space-y-4">
          <Insight icon={AlertTriangle} title="Reposição prioritária" text="3 produtos estão abaixo do estoque mínimo e merecem conferência." color="amber" />
          <Insight icon={TrendingUp} title="Destaque de vendas" text="A categoria Bebidas concentrou o maior valor vendido no período." color="green" />
          <Insight icon={Lightbulb} title="Próxima ação" text="Revise os itens com estoque alto e baixa movimentação antes da próxima compra." color="violet" />
        </div>
      </div>
      <p className="mt-4 text-center text-[10px] text-gray-500">Exemplo ilustrativo preparado para apresentação.</p>
    </div>
  )
}

function AiFeature({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"><Icon className="h-5 w-5" /></span><div><p className="font-black">{title}</p><p className="mt-1 text-sm leading-relaxed text-gray-400">{text}</p></div></div>
}

function Insight({ icon: Icon, title, text, color }: { icon: LucideIcon; title: string; text: string; color: 'amber' | 'green' | 'violet' }) {
  const colors = { amber: 'bg-amber-400/15 text-amber-300', green: 'bg-emerald-400/15 text-emerald-300', violet: 'bg-violet-400/15 text-violet-300' }
  return <div className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors[color]}`}><Icon className="h-4 w-4" /></span><div><p className="text-sm font-black">{title}</p><p className="mt-1 text-xs leading-relaxed text-gray-400">{text}</p></div></div>
}

function StartStep({ number, icon: Icon, title, text }: { number: string; icon: LucideIcon; title: string; text: string }) {
  return <Reveal><article className="relative h-full rounded-3xl border border-gray-200 bg-white p-7 dark:border-gray-800 dark:bg-gray-900"><span className="absolute right-5 top-4 text-5xl font-black text-gray-100 dark:text-gray-800">{number}</span><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"><Icon className="h-5 w-5" /></div><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-400">{text}</p></article></Reveal>
}

function PlanCard({ name, price, description, icon: Icon, items, href, recommended = false }: { name: string; price: string; description: string; icon: LucideIcon; items: string[]; href: string; recommended?: boolean }) {
  return (
    <Reveal>
      <article className={`relative flex h-full flex-col rounded-3xl border-2 bg-white p-7 dark:bg-gray-900 ${recommended ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' : 'border-gray-200 dark:border-gray-800'}`}>
        {recommended && <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-black text-white">RECOMENDADO</span>}
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${recommended ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}><Icon className="h-6 w-6" /></div>
        <h3 className="mt-5 text-2xl font-black">{name}</h3>
        <p className="mt-2 min-h-12 text-sm leading-relaxed text-gray-500">{description}</p>
        <div className="my-6 flex items-end gap-1"><span className="mb-1 font-bold text-gray-500">R$</span><span className="text-5xl font-black tracking-tight">{price}</span><span className="mb-1 text-sm text-gray-500">/mês</span></div>
        <ul className="flex-1 space-y-3">{items.map((item) => <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul>
        <Link href={href} className={`mt-8 block rounded-full py-3.5 text-center font-black transition ${recommended ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-950 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'}`}>Testar este plano</Link>
      </article>
    </Reveal>
  )
}

function MockWindow({ title, children }: { title: string; children: ReactNode }) {
  return <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"><div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><p className="ml-3 text-[10px] font-bold text-gray-400">{title}</p></div><div className="p-5 sm:p-6">{children}</div></div>
}

function TinyMetric({ label, value, amber = false, red = false }: { label: string; value: string; amber?: boolean; red?: boolean }) {
  const color = red ? 'text-red-600' : amber ? 'text-amber-600' : 'text-emerald-600'
  return <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800"><p className="text-[9px] text-gray-400">{label}</p><p className={`mt-1 text-lg font-black ${color}`}>{value}</p></div>
}

function MockProduct({ name, sku, stock, status, warning = false, critical = false }: { name: string; sku: string; stock: string; status: string; warning?: boolean; critical?: boolean }) {
  const badge = critical ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : warning ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  return <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800"><div className="min-w-0"><p className="truncate text-xs font-black">{name}</p><p className="mt-0.5 text-[9px] text-gray-400">SKU {sku}</p></div><p className="text-xs font-black">{stock} un</p><span className={`rounded-full px-2 py-1 text-[9px] font-black ${badge}`}>{status}</span></div>
}

function PreviewMetric({ label, value, icon: Icon, color }: { label: string; value: string; icon: LucideIcon; color: 'blue' | 'amber' | 'green' | 'violet' }) {
  const colors = { blue: 'bg-blue-500/10 text-blue-300', amber: 'bg-amber-500/10 text-amber-300', green: 'bg-emerald-500/10 text-emerald-300', violet: 'bg-violet-500/10 text-violet-300' }
  return <div className="rounded-xl border border-white/10 bg-gray-950/60 p-3"><span className={`flex h-7 w-7 items-center justify-center rounded-lg ${colors[color]}`}><Icon className="h-3.5 w-3.5" /></span><p className="mt-3 text-[8px] uppercase text-gray-600">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>
}

function PreviewAlert({ name, value, critical = false }: { name: string; value: string; critical?: boolean }) {
  return <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-[10px] font-bold">{name}</p><p className="text-[8px] text-gray-600">Reposição necessária</p></div><span className={`shrink-0 text-[10px] font-black ${critical ? 'text-red-400' : 'text-amber-300'}`}>{value}</span></div>
}
