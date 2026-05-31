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
  XCircle,
  Smartphone,
} from 'lucide-react'

const FUNCIONALIDADES = [
  {
    icon: Package,
    titulo: 'Controle de Estoque Completo',
    desc: 'Cadastre produtos, defina estoques mínimos e saiba exatamente o que tem e o que está faltando.',
  },
  {
    icon: ShoppingCart,
    titulo: 'PDV no Celular',
    desc: 'Ponto de venda integrado com leitor de código de barras pela câmera. Venda direto do bolso.',
  },
  {
    icon: BarChart3,
    titulo: 'Relatórios que Fazem Sentido',
    desc: 'Veja vendas, lucro, margem e movimentação com gráficos simples — sem precisar ser contador.',
  },
  {
    icon: AlertCircle,
    titulo: 'Alertas Automáticos',
    desc: 'Receba avisos antes que o produto acabe. Nunca mais perca uma venda por falta de estoque.',
  },
  {
    icon: Users,
    titulo: 'Equipe & Funcionários',
    desc: 'Adicione funcionários com acesso limitado ao PDV. Você controla tudo, eles só vendem.',
  },
  {
    icon: QrCode,
    titulo: 'Leitor de Código de Barras',
    desc: 'Escaneie produtos pela câmera do celular. Sem precisar comprar equipamento extra.',
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

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* ══════════ NAVBAR ══════════ */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="text-xl font-bold">📦 EstoqueSystem</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">
              Entrar
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              Teste grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-block mb-6 px-4 py-1.5 bg-green-900/30 border border-green-800 rounded-full text-green-400 text-sm font-medium">
          15 dias grátis — sem cartão de crédito
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
          Você está{' '}
          <span className="text-red-400">perdendo dinheiro</span> no seu estoque
          <br className="hidden sm:block" />
          {' '}e nem sabe
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Controle tudo pelo celular.{' '}
          <span className="text-white font-medium">Sem planilha, sem caderno, sem erro.</span>{' '}
          Sistema completo de estoque, PDV e relatórios feito para pequenos mercados, mercearias e comércios.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/signup"
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition transform hover:scale-105 flex items-center justify-center gap-2"
          >
            Testar grátis agora <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-4 rounded-xl font-medium transition text-center"
          >
            Já tenho conta
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          ✅ Sem cartão · ✅ Cancele quando quiser · ✅ Suporte via WhatsApp
        </p>
      </section>

      {/* ══════════ PROPOSTA DE VALOR (substitui números fake) ══════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 sm:p-12 text-center">
          <Smartphone className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Tudo na palma da sua mão
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Saiba exatamente o que está vendendo, o que está faltando e onde você está perdendo dinheiro —{' '}
            <span className="text-white font-medium">tudo em tempo real, direto no celular.</span>
          </p>
        </div>
      </section>

      {/* ══════════ FUNCIONALIDADES ══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Tudo que você precisa em um só lugar
        </h2>
        <p className="text-gray-400 text-center mb-14 text-lg">
          Sem planilha, sem caderno, sem complicação.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FUNCIONALIDADES.map(({ icon: Icon, titulo, desc }) => (
            <div
              key={titulo}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-green-800 transition group"
            >
              <div className="w-12 h-12 bg-green-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-900/50 transition">
                <Icon className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">{titulo}</h3>
              <p className="text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ COMO FUNCIONA ══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14">
          Comece em 2 minutos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { passo: '1', titulo: 'Crie sua conta', desc: 'Cadastro rápido com email e senha. Sem burocracia, sem cartão.', emoji: '📝' },
            { passo: '2', titulo: 'Cadastre produtos', desc: 'Adicione seus produtos manualmente ou escaneie o código de barras com a câmera.', emoji: '📦' },
            { passo: '3', titulo: 'Comece a vender', desc: 'Use o PDV, acompanhe relatórios e nunca mais perca uma venda por falta de estoque.', emoji: '🚀' },
          ].map(({ passo, titulo, desc, emoji }) => (
            <div key={passo} className="text-center">
              <div className="text-4xl mb-4">{emoji}</div>
              <div className="inline-flex w-8 h-8 bg-green-600 text-white rounded-full text-sm font-bold items-center justify-center mx-auto mb-3">
                {passo}
              </div>
              <h3 className="text-xl font-bold mb-2">{titulo}</h3>
              <p className="text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ ANTES vs DEPOIS ══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14">
          A diferença é clara
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ANTES */}
          <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
              <XCircle className="w-6 h-6" /> Antes do EstoqueSystem
            </h3>
            <ul className="space-y-4">
              {[
                'Controle no caderno ou planilha',
                'Produto vence e você nem percebe',
                'Não sabe o lucro real do mês',
                'Funcionário vende e você não vê',
                'Estoque acaba e você perde venda',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-300">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* DEPOIS */}
          <div className="bg-green-950/30 border border-green-900/50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6" /> Depois do EstoqueSystem
            </h3>
            <ul className="space-y-4">
              {[
                'Controle completo no celular',
                'Alertas automáticos de vencimento',
                'Relatórios de lucro e margem em tempo real',
                'Cada venda registrada automaticamente',
                'Avisos antes do estoque acabar',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══════════ POR QUE FUNCIONA (prova sem mentir) ══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Por que o EstoqueSystem funciona?
        </h2>
        <p className="text-gray-400 text-center mb-12 text-lg">
          Não é mágica — é simplicidade com propósito.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            'Criado por quem entende de pequenos comércios',
            'Feito pra funcionar direto no celular',
            'Pensado para quem não gosta de sistemas complicados',
            'Tudo em um só lugar: estoque, vendas e relatórios',
            'Suporte humano direto pelo WhatsApp',
            'Atualizações constantes sem custo extra',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ QUEM CRIOU ══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 sm:p-12">
          <p className="text-green-400 text-sm font-semibold uppercase tracking-wider mb-2">
            Quem está por trás
          </p>
          <h2 className="text-3xl font-bold mb-6">Prazer, Lucas Machado 👋</h2>

          <div className="space-y-4 text-gray-400 leading-relaxed text-lg">
            <p>
              Tenho 20 anos e sou desenvolvedor. Criei o EstoqueSystem porque vi de perto pequenos comerciantes{' '}
              <span className="text-white font-medium">perdendo dinheiro por falta de controle</span> — usando caderno, planilha ou simplesmente confiando na memória.
            </p>
            <p>
              Então resolvi construir algo{' '}
              <span className="text-white font-medium">simples, direto e que realmente funcionasse no dia a dia</span> de quem está atrás do balcão.
            </p>
            <p>
              Cada tela, cada botão e cada funcionalidade foi pensada para quem não tem tempo de aprender sistemas complicados.{' '}
              <span className="text-white font-medium">Se você é essa pessoa, o EstoqueSystem foi feito pra você.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">🎯</p>
              <p className="text-sm font-semibold text-white">Missão</p>
              <p className="text-sm text-gray-400">Tornar o controle de estoque acessível pra todo pequeno comércio</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">💬</p>
              <p className="text-sm font-semibold text-white">Suporte direto</p>
              <p className="text-sm text-gray-400">Fale comigo pelo WhatsApp — sem robô, sem fila</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ PREÇO ══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simples e acessível</h2>
        <p className="text-gray-400 text-lg mb-10">
          Um plano só, com tudo incluso. Sem surpresas.
        </p>

        <div className="bg-gray-900 border-2 border-green-800 rounded-2xl p-8 sm:p-10">
          <p className="text-green-400 font-semibold text-sm uppercase tracking-wider mb-2">
            Plano Profissional
          </p>

          <div className="flex items-baseline justify-center gap-1 mb-1">
            <span className="text-5xl font-extrabold">R$ 79</span>
            <span className="text-2xl font-bold text-gray-400">,90</span>
            <span className="text-gray-500">/mês</span>
          </div>

          <p className="text-green-400 font-medium mb-2">
            Menos de R$ 3 por dia para controlar todo seu negócio
          </p>

          <p className="text-sm text-gray-500 mb-8">
            15 dias grátis para testar — sem compromisso
          </p>

          <ul className="text-left space-y-3 mb-8 max-w-sm mx-auto">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="block w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg transition transform hover:scale-105"
          >
            Começar teste grátis
          </Link>

          <p className="text-sm text-gray-500 mt-4">
            💳 Cartão • 📱 PIX • 🔒 Mercado Pago
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Sem cartão de crédito no teste · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
          Perguntas frequentes
        </h2>

        <div className="space-y-4">
          {[
            { p: 'Preciso instalar alguma coisa?', r: 'Não! O EstoqueSystem funciona direto no navegador, no celular ou computador. É só acessar e usar.' },
            { p: 'Funciona no celular?', r: 'Sim! O sistema é 100% responsivo. O PDV e o leitor de código de barras funcionam perfeitamente pelo celular.' },
            { p: 'Como funciona o período de teste?', r: 'Você tem 15 dias grátis com acesso completo a todas as funcionalidades. Sem precisar colocar cartão de crédito.' },
            { p: 'Como faço o pagamento?', r: 'O pagamento é feito de forma segura pelo Mercado Pago. Aceitamos PIX e cartão de crédito/débito à vista. Seu acesso é liberado automaticamente após a confirmação.' },
            { p: 'Posso adicionar funcionários?', r: 'Sim! Você pode convidar funcionários que terão acesso apenas ao PDV, enquanto você controla tudo pelo dashboard.' },
            { p: 'Meus dados ficam seguros?', r: 'Sim! Usamos criptografia e servidores seguros. Seus dados são só seus.' },
          ].map(({ p, r }) => (
            <details key={p} className="bg-gray-900 border border-gray-800 rounded-xl group">
              <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold hover:text-green-400 transition">
                {p}
              </summary>
              <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                {r}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Quanto dinheiro você já perdeu por falta de controle?
        </h2>
        <p className="text-gray-400 text-lg mb-8">
          Comece agora e veja a diferença em poucos dias. É grátis por 15 dias, sem compromisso.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition transform hover:scale-105"
        >
          Quero organizar meu estoque <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">📦 EstoqueSystem</p>
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} EstoqueSystem. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/login" className="hover:text-white transition">Entrar</Link>
            <Link href="/signup" className="hover:text-white transition">Criar conta</Link>
            <Link href="/termos" className="hover:text-white transition">Termos</Link>
            <Link href="/privacidade" className="hover:text-white transition">Privacidade</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}