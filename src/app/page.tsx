"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle2,
  FileText,
  LineChart,
  Menu,
  MessageCircle,
  Package,
  QrCode,
  Rocket,
  Shield,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Target,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Inteligência", href: "#inteligencia" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
];

const WHATSAPP = "5522999467499";
const MENSAGEM_WHATSAPP = encodeURIComponent(
  "Olá! Gostaria de saber mais sobre o EstoqueSystem.",
);

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function FadeInSection({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [demoAtiva, setDemoAtiva] = useState("dashboard");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white dark:bg-gray-950">
      <nav
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-gray-100 bg-white/90 py-3 shadow-sm backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/90"
            : "border-transparent bg-transparent py-5"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
          <a href="#" className="flex items-center gap-2 font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Package className="h-5 w-5" />
            </span>
            <span className={scrolled ? "text-gray-900 dark:text-white" : "text-white"}>
              EstoqueSystem
            </span>
          </a>

          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  scrolled
                    ? "text-gray-700 hover:text-emerald-600 dark:text-gray-300"
                    : "text-white/85 hover:text-white"
                }`}
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              className={
                scrolled
                  ? "text-sm font-medium text-gray-700 hover:text-emerald-600 dark:text-gray-300"
                  : "text-sm font-medium text-white/85 hover:text-white"
              }
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Testar grátis
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            className={`rounded-lg p-2 md:hidden ${
              scrolled ? "text-gray-900 dark:text-white" : "text-white"
            }`}
          >
            {menuAberto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuAberto && (
          <div className="border-t border-gray-100 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/95 md:hidden">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuAberto(false)}
                className="block rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {item.label}
              </a>
            ))}
            <Link href="/login" className="block rounded-lg px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
              Entrar
            </Link>
            <Link
              href="/signup"
              className="mt-2 block rounded-lg bg-emerald-600 px-4 py-3 text-center font-semibold text-white"
            >
              Testar grátis
            </Link>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden pb-24 pt-32 md:pb-32 md:pt-40">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950" />
        <div className="absolute -left-24 top-28 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-300">
            <Sparkles className="h-4 w-4" />
            Inteligência para entender seu estoque
          </div>

          <h1 className="text-4xl font-extrabold leading-tight text-white md:text-7xl">
            Controle seu estoque sem
            <span className="block bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              planilhas e complicação
            </span>
          </h1>

          <p className="mx-auto mb-10 mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
            Produtos, entradas, saídas, alertas, reposição, perdas e vendas em um
            sistema simples para pequenos negócios. A partir de{" "}
            <strong className="text-emerald-400">R$ 39,90 por mês</strong>.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-lg font-bold text-white transition hover:bg-emerald-700"
            >
              Testar grátis
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-gray-600 px-8 py-4 font-medium text-gray-200 transition hover:border-gray-400 hover:bg-white/5"
            >
              Já tenho conta
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" />15 dias grátis</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" />Sem cartão no teste</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" />Cancele quando quiser</span>
          </div>
        </div>
      </section>

      <section id="inteligencia" className="scroll-mt-20 bg-gray-50 py-20 dark:bg-gray-900 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <FadeInSection>
            <div className="text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                <Brain className="h-4 w-4" />
                RAIO-X INTELIGENTE
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl">
                Dados reais transformados em prioridades
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                O sistema calcula os indicadores do estoque e a inteligência explica
                o que merece atenção primeiro, em linguagem simples.
              </p>
            </div>
          </FadeInSection>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <FadeInSection delay={100}>
              <div className="h-full rounded-3xl border border-violet-200 bg-white p-7 shadow-xl dark:border-violet-900 dark:bg-gray-950 md:p-9">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white">
                  <LineChart className="h-7 w-7" />
                </div>
                <h3 className="mt-6 text-2xl font-extrabold text-gray-900 dark:text-white">
                  Diagnóstico do período
                </h3>
                <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-400">
                  Identifique reposições urgentes, produtos parados, risco de validade,
                  perdas e pontos que precisam de revisão.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  {[
                    "Prioridades baseadas nos dados da sua conta",
                    "Resumo objetivo do que mudou no período",
                    "Ações recomendadas sem alterar o estoque automaticamente",
                    "Disponível no plano Profissional",
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInSection>

            <FadeInSection delay={180}>
              <div className="h-full rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-7 text-white shadow-xl md:p-9">
                <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 border-b border-white/20 pb-4 font-bold">
                    <Sparkles className="h-5 w-5" />
                    Exemplo de diagnóstico
                  </div>
                  <div className="mt-5 space-y-4 text-sm leading-relaxed text-violet-50">
                    <p><strong>Reposição:</strong> três produtos estão abaixo do estoque mínimo.</p>
                    <p><strong>Validade:</strong> dois produtos precisam de atenção nos próximos dias.</p>
                    <p><strong>Capital parado:</strong> revise itens com saldo e pouca movimentação.</p>
                    <div className="rounded-xl bg-white/15 p-4">
                      <p className="font-bold">Prioridade sugerida</p>
                      <ol className="mt-2 list-inside list-decimal space-y-1">
                        <li>Repor os itens zerados.</li>
                        <li>Verificar produtos próximos da validade.</li>
                        <li>Revisar compras de itens com baixa saída.</li>
                      </ol>
                    </div>
                  </div>
                </div>
                <p className="mt-5 text-xs text-violet-100">
                  Exemplo ilustrativo. O diagnóstico real usa os dados da conta.
                </p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-gray-950 md:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <FadeInSection>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white md:text-4xl">
              Tudo na palma da sua mão
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600 dark:text-gray-400">
              Enxergue o que está faltando, o que precisa de atenção e onde agir.
            </p>
          </FadeInSection>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Smartphone, titulo: "Funciona no celular", desc: "Use no celular, tablet ou computador, sem instalar nada." },
              { icon: QrCode, titulo: "Código de barras", desc: "Agilize o cadastro e a venda usando câmera ou leitor compatível." },
              { icon: MessageCircle, titulo: "Suporte direto", desc: "Fale pelo WhatsApp quando precisar de orientação." },
            ].map(({ icon: Icon, titulo, desc }, index) => (
              <FadeInSection key={titulo} delay={index * 80}>
                <div className="h-full rounded-2xl border border-gray-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-white">{titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 dark:bg-gray-900 md:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <FadeInSection>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white md:text-4xl">Veja o sistema funcionando</h2>
            <p className="mt-3 text-center text-lg text-gray-500 dark:text-gray-400">Simples de usar, direto ao ponto.</p>
          </FadeInSection>
          <div className="mt-9 flex flex-wrap justify-center gap-2">
            {["dashboard", "pdv", "relatorios", "alertas"].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setDemoAtiva(id)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition ${
                  demoAtiva === id
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {id === "pdv" ? "Venda rápida" : id}
              </button>
            ))}
          </div>
          <FadeInSection delay={100}>
            <div className="mx-auto mt-9 max-w-4xl overflow-hidden rounded-2xl bg-gray-950 shadow-2xl">
              <video
                key={demoAtiva}
                src={`/videos/demo-${demoAtiva}.mp4`}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="block w-full"
                aria-label={`Demonstração: ${demoAtiva}`}
              >
                Seu navegador não suporta vídeo HTML5.
              </video>
            </div>
          </FadeInSection>
        </div>
      </section>

      <section id="funcionalidades" className="scroll-mt-20 bg-white py-20 dark:bg-gray-950 md:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <FadeInSection>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white md:text-4xl">O essencial para controlar seu estoque</h2>
          </FadeInSection>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Package, titulo: "Controle de estoque", desc: "Cadastre produtos, saldos e estoque mínimo." },
              { icon: ShoppingCart, titulo: "Venda rápida", desc: "Registre vendas e atualize o saldo dos produtos." },
              { icon: AlertCircle, titulo: "Alertas", desc: "Veja produtos zerados ou abaixo do mínimo." },
              { icon: BarChart3, titulo: "Relatórios", desc: "Acompanhe indicadores e movimentações do negócio." },
              { icon: Users, titulo: "Clientes e fiado", desc: "Controle débitos e pagamentos no Profissional." },
              { icon: Calendar, titulo: "Validade", desc: "Acompanhe vencimentos no plano Profissional." },
              { icon: FileText, titulo: "CSV", desc: "Importe e exporte dados no plano Profissional." },
              { icon: Shield, titulo: "Perdas e avarias", desc: "Registre perdas para manter o estoque coerente." },
              { icon: Brain, titulo: "Raio-X Inteligente", desc: "Receba uma leitura prática dos dados no Profissional." },
            ].map(({ icon: Icon, titulo, desc }, index) => (
              <FadeInSection key={titulo} delay={(index % 3) * 70}>
                <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="mt-4 font-bold text-gray-900 dark:text-white">{titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 dark:bg-gray-900 md:py-24">
        <div className="mx-auto max-w-4xl px-4">
          <FadeInSection>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white md:text-4xl">Comece em três passos</h2>
          </FadeInSection>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { numero: "1", titulo: "Crie sua conta", desc: "Faça seu cadastro e comece o período gratuito." },
              { numero: "2", titulo: "Cadastre produtos", desc: "Informe os dados básicos e o estoque mínimo." },
              { numero: "3", titulo: "Registre movimentos", desc: "Acompanhe entradas, saídas, alertas e reposição." },
            ].map((passo, index) => (
              <FadeInSection key={passo.numero} delay={index * 100}>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">{passo.numero}</div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{passo.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{passo.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-gray-950 md:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <FadeInSection>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white md:text-4xl">A diferença é clara</h2>
          </FadeInSection>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-7 dark:border-red-900 dark:bg-red-900/10">
              <h3 className="flex items-center gap-2 text-lg font-bold text-red-800 dark:text-red-300"><XCircle className="h-5 w-5" />Sem controle centralizado</h3>
              <ul className="mt-5 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                {["Informações espalhadas em caderno e planilha", "Reposição feita no susto", "Perdas não registradas", "Dificuldade para saber o saldo real"].map((item) => <li key={item} className="flex gap-2"><XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />{item}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 dark:border-emerald-900 dark:bg-emerald-900/10">
              <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-800 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5" />Com o EstoqueSystem</h3>
              <ul className="mt-5 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                {["Saldo e movimentações em um só lugar", "Alertas e reposição organizados", "Perdas registradas no histórico", "Indicadores para decidir com mais clareza"].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 dark:bg-gray-900 md:py-24">
        <div className="mx-auto max-w-4xl px-4">
          <FadeInSection>
            <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Quem está por trás</p>
            <h2 className="mt-3 text-center text-3xl font-extrabold text-gray-900 dark:text-white md:text-4xl">Prazer, Lucas Machado</h2>
          </FadeInSection>
          <FadeInSection delay={100}>
            <div className="mt-10 rounded-3xl border border-gray-200 bg-white p-7 shadow-lg dark:border-gray-800 dark:bg-gray-950 md:p-10">
              <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                O EstoqueSystem nasceu para tornar o controle de estoque mais simples para pequenos negócios que precisam de organização sem enfrentar sistemas complicados.
              </p>
              <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">
                A proposta é evoluir o produto com base no uso real dos clientes, mantendo uma experiência direta, acessível e útil no dia a dia.
              </p>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-900/10"><Target className="h-6 w-6 shrink-0 text-emerald-600" /><div><p className="font-bold text-gray-900 dark:text-white">Missão</p><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Simplificar a gestão de estoque para pequenos negócios.</p></div></div>
                <div className="flex gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-900/10"><MessageCircle className="h-6 w-6 shrink-0 text-violet-600" /><div><p className="font-bold text-gray-900 dark:text-white">Suporte próximo</p><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Atendimento direto pelo WhatsApp.</p></div></div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      <section id="planos" className="scroll-mt-20 bg-white py-20 dark:bg-gray-950 md:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <FadeInSection>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl">Dois planos, uma escolha simples</h2>
            <p className="mt-4 text-center text-lg text-gray-500 dark:text-gray-400">15 dias grátis, sem cartão no teste e sem fidelidade.</p>
          </FadeInSection>

          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            <PlanoCard
              nome="Iniciante"
              descricao="Para organizar um estoque pequeno."
              preco="39,90"
              icon={Zap}
              itens={["Até 100 produtos", "1 usuário", "Entradas e saídas", "Alertas e reposição", "Perdas e avarias", "Venda rápida", "Relatórios básicos"]}
              href="/signup?plano=iniciante"
            />
            <PlanoCard
              nome="Profissional"
              descricao="Para controlar mais e decidir melhor."
              preco="79,90"
              icon={Sparkles}
              destaque
              itens={["Produtos ilimitados", "Tudo do Iniciante", "Clientes e fiado", "Controle de validade", "Relatórios completos", "Importação e exportação CSV", "Cupom pelo WhatsApp", "Raio-X Inteligente", "Suporte prioritário"]}
              href="/signup?plano=profissional"
            />
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-5 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-emerald-600" />Pagamento pelo Mercado Pago</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Sem cartão no teste</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Cancele quando quiser</span>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 bg-gray-50 py-20 dark:bg-gray-900 md:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <FadeInSection><h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white md:text-4xl">Perguntas frequentes</h2></FadeInSection>
          <div className="mt-12 space-y-3">
            {[
              ["Preciso instalar alguma coisa?", "Não. O EstoqueSystem funciona pelo navegador no celular, tablet ou computador."],
              ["Como funciona o período de teste?", "Você pode testar o sistema por 15 dias sem cadastrar cartão."],
              ["Como funciona o Raio-X Inteligente?", "O recurso interpreta indicadores reais do estoque e apresenta prioridades em linguagem simples. Ele faz parte do plano Profissional."],
              ["Posso importar uma planilha?", "A importação por CSV está disponível no plano Profissional."],
              ["Posso mudar de plano depois?", "Sim. Algumas mudanças podem ser feitas diretamente; trocas que envolvem assinatura recorrente ou downgrade são orientadas pelo suporte para evitar cobrança duplicada."],
              ["Como faço o pagamento?", "O pagamento é processado pelo Mercado Pago. Há pagamento avulso e assinatura automática no cartão."],
              ["Posso adicionar funcionários?", "A área de equipe não faz parte da oferta pública atual. O foco desta versão é a operação principal do estoque."],
              ["Como funciona o fiado?", "Clientes e fiado estão disponíveis no plano Profissional."],
            ].map(([pergunta, resposta]) => (
              <details key={pergunta} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-semibold text-gray-900 dark:text-white">
                  {pergunta}<span className="ml-4 text-emerald-600 transition group-open:rotate-180">⌄</span>
                </summary>
                <p className="px-5 pb-5 leading-relaxed text-gray-600 dark:text-gray-400">{resposta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 py-24 md:py-28">
        <div className="relative mx-auto max-w-3xl px-4 text-center text-white">
          <Rocket className="mx-auto h-14 w-14" />
          <h2 className="mt-6 text-3xl font-extrabold md:text-5xl">Organize seu estoque com mais clareza</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-emerald-50">Comece com 15 dias grátis e escolha o plano ideal quando estiver pronto.</p>
          <Link href="/signup" className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 text-lg font-bold text-emerald-700 transition hover:-translate-y-1 hover:shadow-xl">Criar minha conta<ArrowRight className="h-5 w-5" /></Link>
        </div>
      </section>

      <footer className="bg-gray-950 py-12 text-gray-400">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="flex items-center justify-center gap-2"><Package className="h-6 w-6 text-emerald-500" /><span className="text-lg font-bold text-white">EstoqueSystem</span></div>
          <p className="mt-4 text-sm">© {new Date().getFullYear()} EstoqueSystem. Todos os direitos reservados.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm"><Link href="/login" className="hover:text-white">Entrar</Link><Link href="/signup" className="hover:text-white">Criar conta</Link><Link href="/termos" className="hover:text-white">Termos</Link><Link href="/privacidade" className="hover:text-white">Privacidade</Link></div>
        </div>
      </footer>

      <a href={`https://wa.me/${WHATSAPP}?text=${MENSAGEM_WHATSAPP}`} target="_blank" rel="noopener noreferrer" aria-label="Falar sobre o EstoqueSystem pelo WhatsApp" className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl transition hover:scale-110 hover:bg-emerald-700"><MessageCircle className="h-7 w-7" /></a>
    </div>
  );
}

function PlanoCard({ nome, descricao, preco, icon: Icon, itens, href, destaque = false }: { nome: string; descricao: string; preco: string; icon: typeof Zap; itens: string[]; href: string; destaque?: boolean }) {
  return (
    <FadeInSection>
      <article className={`relative h-full rounded-3xl border-2 bg-white p-7 dark:bg-gray-900 ${destaque ? "border-emerald-500 shadow-xl" : "border-gray-200 dark:border-gray-800"}`}>
        {destaque && <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white">MAIS ESCOLHIDO</span>}
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${destaque ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}><Icon className="h-7 w-7" /></div>
        <h3 className="mt-5 text-2xl font-extrabold text-gray-900 dark:text-white">{nome}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{descricao}</p>
        <div className="my-6 flex items-end gap-1"><span className="mb-1 font-semibold text-gray-600 dark:text-gray-400">R$</span><span className="text-5xl font-extrabold text-gray-900 dark:text-white">{preco}</span><span className="mb-1 text-sm text-gray-500">/mês</span></div>
        <ul className="mb-7 space-y-3 text-sm text-gray-700 dark:text-gray-300">{itens.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${item === "Raio-X Inteligente" ? "text-violet-600" : "text-emerald-600"}`} />{item}</li>)}</ul>
        <Link href={href} className={`block rounded-full py-3.5 text-center font-bold transition ${destaque ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"}`}>Começar 15 dias grátis</Link>
      </article>
    </FadeInSection>
  );
}
