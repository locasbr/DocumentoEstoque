'use client'

import Link from 'next/link'
import {
  Package,
  BarChart3,
  ShoppingCart,
  AlertCircle,
  Users,
  QrCode,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
} from 'lucide-react'

const FUNCIONALIDADES = [
  {
    icon: Package,
    titulo: 'Controle de Estoque',
    desc: 'Cadastre produtos, defina mínimos e acompanhe tudo em tempo real.',
  },
  {
    icon: ShoppingCart,
    titulo: 'PDV Completo',
    desc: 'Ponto de venda integrado com leitor de código de barras pela câmera.',
  },
  {
    icon: BarChart3,
    titulo: 'Relatórios Inteligentes',
    desc: 'Veja vendas, lucro, margem e movimentação diária com gráficos.',
  },
  {
    icon: AlertCircle,
    titulo: 'Alertas Automáticos',
    desc: 'Receba avisos quando o estoque estiver baixo ou zerado.',
  },
  {
    icon: Users,
    titulo: 'Equipe & Funcionários',
    desc: 'Adicione funcionários com acesso limitado ao PDV.',
  },
  {
    icon: QrCode,
    titulo: 'Leitor de Código de Barras',
    desc: 'Escaneie produtos pela câmera do celular. Sem equipamento extra.',
  },
]

const BENEFICIOS = [
  'Controle ilimitado de produtos',
  'Dashboard com métricas em tempo real',
  'Alertas de estoque baixo e crítico',
  'Relatórios de entrada e saída',
  'PDV completo com código de barras',
  'Múltiplos funcionários por conta',
  'Cupom via WhatsApp',
  'Suporte prioritário',
  'Atualizações inclusas',
]

const DEPOIMENTOS = [
  {
    nome: 'Carlos M.',
    negocio: 'Mercadinho do Carlos',
    texto: 'Antes eu controlava tudo no caderno. Agora sei exatamente o que tenho e o que preciso comprar.',
    estrelas: 5,
  },
  {
    nome: 'Ana Paula',
    negocio: 'Mini Box AP',
    texto: 'O PDV com leitor de código de barras pelo celular mudou minha vida. Super prático!',
    estrelas: 5,
  },
  {
    nome: 'Roberto S.',
    negocio: 'Armazém do Beto',
    texto: 'Meus funcionários usam o PDV e eu acompanho tudo pelo dashboard. Recomendo demais.',
    estrelas: 5,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ══════════ NAVBAR ══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <span className="text-xl font-bold text-gray-900">
              EstoqueSystem
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
            >
              Teste grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium">
            <Zap className="w-4 h-4" />
            15 dias grátis — sem cartão de crédito
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
            Controle seu estoque{' '}
            <span className="text-green-600">sem complicação</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Sistema completo de estoque, PDV e relatórios feito para{' '}
            <strong>pequenos mercados, mercearias e comércios</strong>. Funciona
            no celular e no computador.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-2xl hover:bg-green-700 transition shadow-lg shadow-green-600/20"
            >
              Começar grátis agora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-gray-700 text-lg font-medium rounded-2xl hover:bg-gray-200 transition"
            >
              Já tenho conta
            </Link>
          </div>

          <p className="text-sm text-gray-400 pt-2">
            ✅ Sem cartão &nbsp;·&nbsp; ✅ Cancele quando quiser &nbsp;·&nbsp; ✅
            Suporte via WhatsApp
          </p>
        </div>
      </section>

      {/* ══════════ DEMO VISUAL ══════════ */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-4 sm:p-8 shadow-2xl">
            <div className="bg-gray-950 rounded-2xl p-6 sm:p-10 text-center">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { label: 'Produtos', valor: '247', cor: 'text-blue-400' },
                  { label: 'Vendas Hoje', valor: '38', cor: 'text-green-400' },
                  { label: 'Alertas', valor: '5', cor: 'text-yellow-400' },
                  {
                    label: 'Estoque',
                    valor: 'R$ 12.450',
                    cor: 'text-purple-400',
                  },
                ].map(({ label, valor, cor }) => (
                  <div key={label} className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      {label}
                    </p>
                    <p className={`text-2xl sm:text-3xl font-bold ${cor}`}>
                      {valor}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FUNCIONALIDADES ══════════ */}
      <section className="py-20 px-4 bg-gray-50" id="funcionalidades">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-gray-600 mt-3 text-lg">
              Sem planilha, sem caderno, sem complicação.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FUNCIONALIDADES.map(({ icon: Icon, titulo, desc }) => (
              <div
                key={titulo}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4 group-hover:bg-green-100 transition">
                  <Icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{titulo}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ COMO FUNCIONA ══════════ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Comece em 2 minutos
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                passo: '1',
                titulo: 'Crie sua conta',
                desc: 'Cadastro rápido com email e senha. Sem burocracia.',
                emoji: '📝',
              },
              {
                passo: '2',
                titulo: 'Cadastre produtos',
                desc: 'Adicione seus produtos manualmente ou com a câmera do celular.',
                emoji: '📦',
              },
              {
                passo: '3',
                titulo: 'Comece a vender',
                desc: 'Use o PDV, acompanhe relatórios e nunca mais perca uma venda.',
                emoji: '🚀',
              },
            ].map(({ passo, titulo, desc, emoji }) => (
              <div key={passo} className="text-center space-y-3">
                <span className="text-4xl">{emoji}</span>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold">
                  {passo}
                </div>
                <h3 className="text-lg font-semibold">{titulo}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ DEPOIMENTOS ══════════ */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Quem usa, recomenda
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {DEPOIMENTOS.map(({ nome, negocio, texto, estrelas }) => (
              <div
                key={nome}
                className="bg-white rounded-2xl p-6 border border-gray-100"
              >
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: estrelas }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  &ldquo;{texto}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-sm">{nome}</p>
                  <p className="text-gray-500 text-xs">{negocio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PREÇO ══════════ */}
      <section className="py-20 px-4" id="preco">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Simples e acessível
            </h2>
            <p className="text-gray-600 mt-3">
              Um plano só, com tudo incluso. Sem surpresas.
            </p>
          </div>

          <div className="bg-white border-2 border-green-500 rounded-3xl p-8 shadow-xl shadow-green-600/10">
            <div className="text-center space-y-1 mb-6">
              <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">
                Plano Profissional
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-sm text-gray-400">R$</span>
                <span className="text-5xl font-extrabold">79</span>
                <span className="text-2xl font-bold">,90</span>
                <span className="text-gray-400 ml-1">/mês</span>
              </div>
              <p className="text-green-600 font-medium text-sm">
                15 dias grátis para testar
              </p>
            </div>

            <div className="border-t border-gray-100 my-6" />

            <ul className="space-y-3 mb-8">
              {BENEFICIOS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="block w-full text-center px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-2xl hover:bg-green-700 transition"
            >
              Começar teste grátis
            </Link>

            <p className="text-center text-xs text-gray-400 mt-3">
              Sem cartão de crédito · Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Perguntas frequentes
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                p: 'Preciso instalar alguma coisa?',
                r: 'Não! O EstoqueSystem funciona direto no navegador, no celular ou computador. É só acessar e usar.',
              },
              {
                p: 'Funciona no celular?',
                r: 'Sim! O sistema é 100% responsivo. O PDV e o leitor de código de barras funcionam perfeitamente pelo celular.',
              },
              {
                p: 'Como funciona o período de teste?',
                r: 'Você tem 15 dias grátis com acesso completo a todas as funcionalidades. Sem precisar colocar cartão de crédito.',
              },
              {
                p: 'Como faço o pagamento?',
                r: 'O pagamento é feito via PIX. Após o pagamento, seu acesso é liberado em até 1 hora.',
              },
              {
                p: 'Posso adicionar funcionários?',
                r: 'Sim! Você pode convidar funcionários que terão acesso apenas ao PDV, enquanto você controla tudo pelo dashboard.',
              },
              {
                p: 'Meus dados ficam seguros?',
                r: 'Sim! Usamos criptografia e servidores seguros. Seus dados são só seus.',
              },
            ].map(({ p, r }) => (
              <details
                key={p}
                className="bg-white rounded-xl border border-gray-100 group"
              >
                <summary className="px-6 py-4 cursor-pointer font-medium text-gray-900 flex items-center justify-between hover:bg-gray-50 rounded-xl transition">
                  {p}
                  <ChevronIcon />
                </summary>
                <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">
                  {r}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Chega de perder dinheiro com estoque descontrolado
          </h2>
          <p className="text-gray-600 text-lg">
            Comece agora, é grátis por 15 dias. Sem compromisso.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-10 py-4 bg-green-600 text-white text-lg font-semibold rounded-2xl hover:bg-green-700 transition shadow-lg shadow-green-600/20"
          >
            Criar minha conta grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>📦</span>
            <span className="font-semibold text-gray-700">EstoqueSystem</span>
          </div>
          <p>© {new Date().getFullYear()} EstoqueSystem. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-gray-700 transition">
              Entrar
            </Link>
            <Link href="/signup" className="hover:text-gray-700 transition">
              Criar conta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Ícone do accordion do FAQ
function ChevronIcon() {
  return (
    <svg
      className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}