"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Inbox,
  Package,
  PackageCheck,
  PackagePlus,
  PackageX,
  RefreshCw,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Onboarding from "@/components/onboarding";
import PageHeader from "@/components/page-header";
import { supabase } from "@/lib/supabase";
import type { MovimentoEstoque, Produto } from "@/lib/types";
import { formatarMoeda } from "@/lib/utils";

type CorKPI = "emerald" | "blue" | "amber" | "red";
type TomAcao = "red" | "amber" | "blue";

type MovimentoComProduto = Omit<MovimentoEstoque, "produto"> & {
  produto?: Produto | null;
};

interface PerfilOnboarding {
  onboarding_completo: boolean | null;
}

interface KPIProps {
  label: string;
  valor: string | number;
  icon: LucideIcon;
  cor: CorKPI;
  descricao: string;
}

interface AcaoPrioritaria {
  id: string;
  titulo: string;
  descricao: string;
  quantidade: number;
  href: string;
  icon: LucideIcon;
  tom: TomAcao;
}

interface MovimentoPorDia {
  chave: string;
  data: string;
  entradas: number;
  saidas: number;
}

const UM_DIA_EM_MS = 86_400_000;

const CORES_KPI: Record<
  CorKPI,
  { icon: string; detalhe: string; borda: string }
> = {
  emerald: {
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    detalhe: "text-emerald-600 dark:text-emerald-400",
    borda: "hover:border-emerald-300 dark:hover:border-emerald-800",
  },
  blue: {
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    detalhe: "text-blue-600 dark:text-blue-400",
    borda: "hover:border-blue-300 dark:hover:border-blue-800",
  },
  amber: {
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    detalhe: "text-amber-600 dark:text-amber-400",
    borda: "hover:border-amber-300 dark:hover:border-amber-800",
  },
  red: {
    icon: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    detalhe: "text-red-600 dark:text-red-400",
    borda: "hover:border-red-300 dark:hover:border-red-800",
  },
};

const CORES_ACAO: Record<
  TomAcao,
  { icon: string; contador: string; barra: string }
> = {
  red: {
    icon: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    contador: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    barra: "bg-red-500",
  },
  amber: {
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    contador:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    barra: "bg-amber-500",
  },
  blue: {
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    contador: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    barra: "bg-blue-500",
  },
};

function normalizarNumero(valor: unknown): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function calcularDiasAteValidade(dataValidade: string): number | null {
  if (!dataValidade) return null;

  const dataSemHorario = dataValidade.split("T")[0];
  const partes = dataSemHorario.split("-").map(Number);
  let validade: Date;

  if (partes.length === 3 && partes.every(Number.isFinite)) {
    const [ano, mes, dia] = partes;
    validade = new Date(ano, mes - 1, dia);
  } else {
    validade = new Date(dataValidade);
  }

  if (Number.isNaN(validade.getTime())) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  validade.setHours(0, 0, 0, 0);

  return Math.round((validade.getTime() - hoje.getTime()) / UM_DIA_EM_MS);
}

function formatarDataMovimento(data: string): string {
  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return "Data não informada";

  return valor.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function chaveLocal(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(data.getDate()).padStart(2, "0")}`;
}

function KPICard({ label, valor, icon: Icon, cor, descricao }: KPIProps) {
  const cores = CORES_KPI[cor];

  return (
    <article
      className={`group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 ${cores.borda}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${cores.icon}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
        <span className={`h-2 w-2 rounded-full ${cores.detalhe.replace("text-", "bg-").split(" ")[0]}`} />
      </div>
      <p className="mt-5 text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 break-words text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-3xl">
        {valor}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
        {descricao}
      </p>
    </article>
  );
}

function LoadingDashboard() {
  return (
    <div className="space-y-5 pb-8" role="status" aria-label="Carregando visão geral">
      <div className="h-24 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-3xl bg-gray-200 dark:bg-gray-800" />
      <span className="sr-only">Carregando visão geral</span>
    </div>
  );
}

function DashboardContent() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoComProduto[]>([]);
  const [totalMovimentacoes, setTotalMovimentacoes] = useState(0);
  const [totalAlertasPendentes, setTotalAlertasPendentes] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [onboardingCompleto, setOnboardingCompleto] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const fetchDashboardData = useCallback(async (mostrarLoading = false) => {
    if (mostrarLoading) setAtualizando(true);
    else setLoading(true);
    setErroCarregamento(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error("Usuário não autenticado");

      const inicioGrafico = new Date();
      inicioGrafico.setHours(0, 0, 0, 0);
      inicioGrafico.setDate(inicioGrafico.getDate() - 6);

      const [produtosRes, movimentosRes, movimentosCountRes, alertasCountRes, perfilRes] =
        await Promise.all([
          supabase.from("produtos").select("*").order("nome", { ascending: true }),
          supabase
            .from("movimentos_estoque")
            .select("*, produto:produto_id(*)")
            .gte("criado_em", inicioGrafico.toISOString())
            .order("criado_em", { ascending: false })
            .limit(200),
          supabase
            .from("movimentos_estoque")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("alertas")
            .select("*", { count: "exact", head: true })
            .eq("visualizado", false),
          supabase
            .from("perfis")
            .select("onboarding_completo")
            .eq("id", user.id)
            .maybeSingle(),
        ]);

      const erros = [
        produtosRes.error,
        movimentosRes.error,
        movimentosCountRes.error,
        alertasCountRes.error,
        perfilRes.error,
      ].filter(Boolean);

      if (erros.length > 0) {
        console.error("Falha ao carregar dados da visão geral:", erros);
        setErroCarregamento(
          "Não foi possível carregar todos os dados. Algumas informações podem estar incompletas.",
        );
      }

      setUserId(user.id);
      setProdutos((produtosRes.data as Produto[] | null) ?? []);
      setMovimentos((movimentosRes.data as MovimentoComProduto[] | null) ?? []);
      setTotalMovimentacoes(movimentosCountRes.count ?? 0);
      setTotalAlertasPendentes(alertasCountRes.count ?? 0);

      const perfil = perfilRes.data as PerfilOnboarding | null;
      setOnboardingCompleto(perfil?.onboarding_completo === true);
    } catch (error: unknown) {
      console.error("Erro inesperado ao carregar a visão geral:", error);
      setErroCarregamento("Ocorreu um erro inesperado ao carregar a visão geral.");
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const produtosAtivos = useMemo(
    () => produtos.filter((produto) => produto.ativo !== false),
    [produtos],
  );

  const produtosZerados = produtosAtivos.filter(
    (produto) => normalizarNumero(produto.quantidade_atual) <= 0,
  );

  const produtosAbaixoMinimo = produtosAtivos.filter((produto) => {
    const atual = Math.max(normalizarNumero(produto.quantidade_atual), 0);
    const minimo = Math.max(normalizarNumero(produto.quantidade_minima), 0);
    return atual > 0 && minimo > 0 && atual < minimo;
  });

  const produtosSemPrecoCusto = produtosAtivos.filter(
    (produto) => normalizarNumero(produto.preco_custo) <= 0,
  );

  const produtosVencidos = produtosAtivos.filter((produto) => {
    if (!produto.data_validade || normalizarNumero(produto.quantidade_atual) <= 0)
      return false;
    const dias = calcularDiasAteValidade(produto.data_validade);
    return dias !== null && dias < 0;
  });

  const proximosDaValidade = produtosAtivos.filter((produto) => {
    if (!produto.data_validade || normalizarNumero(produto.quantidade_atual) <= 0)
      return false;
    const dias = calcularDiasAteValidade(produto.data_validade);
    return dias !== null && dias >= 0 && dias <= 7;
  });

  const valorEstoqueCusto = produtosAtivos.reduce((total, produto) => {
    const custo = Math.max(normalizarNumero(produto.preco_custo), 0);
    const atual = Math.max(normalizarNumero(produto.quantidade_atual), 0);
    return total + custo * atual;
  }, 0);

  const totalReposicao = produtosZerados.length + produtosAbaixoMinimo.length;
  const totalRiscoValidade = produtosVencidos.length + proximosDaValidade.length;

  const prioridades = useMemo<AcaoPrioritaria[]>(
    () =>
      [
        {
          id: "reposicao",
          titulo: "Reposição necessária",
          descricao: `${produtosZerados.length} zerado(s) e ${produtosAbaixoMinimo.length} abaixo do mínimo`,
          quantidade: totalReposicao,
          href: "/dashboard/reposicao",
          icon: PackagePlus,
          tom: "red" as const,
        },
        {
          id: "validade",
          titulo: "Risco de validade",
          descricao: `${produtosVencidos.length} vencido(s) e ${proximosDaValidade.length} próximo(s)`,
          quantidade: totalRiscoValidade,
          href: "/dashboard/produtos",
          icon: Calendar,
          tom: "amber" as const,
        },
        {
          id: "alertas",
          titulo: "Alertas pendentes",
          descricao: "Alertas que ainda não foram visualizados",
          quantidade: totalAlertasPendentes,
          href: "/dashboard/alertas",
          icon: Inbox,
          tom: "red" as const,
        },
        {
          id: "sem-custo",
          titulo: "Produtos sem custo",
          descricao: "Não entram no valor calculado do estoque",
          quantidade: produtosSemPrecoCusto.length,
          href: "/dashboard/produtos",
          icon: Wallet,
          tom: "blue" as const,
        },
      ].filter((item) => item.quantidade > 0),
    [
      produtosAbaixoMinimo.length,
      produtosSemPrecoCusto.length,
      produtosVencidos.length,
      produtosZerados.length,
      proximosDaValidade.length,
      totalAlertasPendentes,
      totalReposicao,
      totalRiscoValidade,
    ],
  );

  const graficoMovimentacoes = useMemo<MovimentoPorDia[]>(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const mapa = new Map<string, MovimentoPorDia>();

    for (let indice = 6; indice >= 0; indice -= 1) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - indice);
      const chave = chaveLocal(data);
      mapa.set(chave, {
        chave,
        data: data.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
        }),
        entradas: 0,
        saidas: 0,
      });
    }

    movimentos.forEach((movimento) => {
      const data = new Date(movimento.criado_em);
      if (Number.isNaN(data.getTime())) return;
      const item = mapa.get(chaveLocal(data));
      if (!item) return;

      const quantidade = Math.max(normalizarNumero(movimento.quantidade), 0);
      if (movimento.tipo_movimento === "entrada") item.entradas += quantidade;
      if (movimento.tipo_movimento === "saida") item.saidas += quantidade;
    });

    return Array.from(mapa.values());
  }, [movimentos]);

  const movimentosRecentes = movimentos.slice(0, 5);
  const possuiProduto = produtosAtivos.length > 0;
  const possuiEstoqueMinimo = produtosAtivos.some(
    (produto) => normalizarNumero(produto.quantidade_minima) > 0,
  );
  const possuiMovimentacao = totalMovimentacoes > 0;

  if (loading) return <LoadingDashboard />;

  return (
    <div className="min-w-0 space-y-6 overflow-x-clip pb-8">
      <PageHeader
        eyebrow="VISÃO GERAL"
        title="Controle do estoque"
        description="Veja a situação atual e o que precisa da sua atenção primeiro."
        icon={Package}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => void fetchDashboardData(true)}
              disabled={atualizando}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
              Atualizar
            </button>
            <Link
              href="/dashboard/estoque/movimento?tipo=entrada"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <ArrowDownLeft className="h-4 w-4" /> Nova entrada
            </Link>
            <Link
              href="/dashboard/estoque/movimento?tipo=saida"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              <ArrowUpRight className="h-4 w-4" /> Nova saída
            </Link>
          </div>
        }
      />

      {userId && !onboardingCompleto && (
        <Onboarding
          userId={userId}
          possuiProduto={possuiProduto}
          possuiEstoqueMinimo={possuiEstoqueMinimo}
          possuiMovimentacao={possuiMovimentacao}
          onComplete={() => setOnboardingCompleto(true)}
          onRefresh={() => fetchDashboardData(true)}
        />
      )}

      {erroCarregamento && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{erroCarregamento}</p>
        </div>
      )}

      <section aria-labelledby="resumo-title">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              RESUMO DE HOJE
            </p>
            <h2 id="resumo-title" className="mt-1 text-lg font-extrabold text-gray-900 dark:text-white">
              Situação geral
            </h2>
          </div>
          <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">
            {totalMovimentacoes} movimentação(ões) registradas
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard
            label="Valor em estoque"
            valor={formatarMoeda(valorEstoqueCusto)}
            icon={Wallet}
            cor="emerald"
            descricao={`${produtosSemPrecoCusto.length} produto(s) sem custo informado`}
          />
          <KPICard
            label="Produtos ativos"
            valor={produtosAtivos.length}
            icon={produtosAtivos.length > 0 ? PackageCheck : Package}
            cor="blue"
            descricao="Itens ativos no catálogo"
          />
          <KPICard
            label="Reposição necessária"
            valor={totalReposicao}
            icon={totalReposicao > 0 ? PackageX : PackageCheck}
            cor={totalReposicao > 0 ? "red" : "emerald"}
            descricao={`${produtosZerados.length} zerado(s) · ${produtosAbaixoMinimo.length} abaixo do mínimo`}
          />
          <KPICard
            label="Risco de validade"
            valor={totalRiscoValidade}
            icon={Calendar}
            cor={
              produtosVencidos.length > 0
                ? "red"
                : proximosDaValidade.length > 0
                  ? "amber"
                  : "emerald"
            }
            descricao={`${produtosVencidos.length} vencido(s) · ${proximosDaValidade.length} próximo(s)`}
          />
        </div>
      </section>

      <Link
        href="/dashboard/raio-x"
        className="group relative block overflow-hidden rounded-3xl border border-violet-300 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 transition-all hover:-translate-y-0.5 hover:border-violet-500 hover:shadow-xl hover:shadow-violet-500/10 dark:border-violet-900 dark:from-violet-950/40 dark:via-gray-900 dark:to-fuchsia-950/20 md:p-8"
      >
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl transition-transform duration-500 group-hover:scale-125" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-violet-600 p-3 text-white shadow-lg shadow-violet-500/25">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                INTELIGÊNCIA DO ESTOQUE
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-gray-900 dark:text-white md:text-2xl">
                Veja onde agir primeiro
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                O Raio-X apresenta gráficos, prioridades e ações práticas com base nos dados registrados no seu estoque.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold text-violet-700 dark:text-violet-300">
                <span className="rounded-full bg-violet-100 px-2.5 py-1 dark:bg-violet-900/40">Gráficos</span>
                <span className="rounded-full bg-violet-100 px-2.5 py-1 dark:bg-violet-900/40">Prioridades</span>
                <span className="rounded-full bg-violet-100 px-2.5 py-1 dark:bg-violet-900/40">Ações recomendadas</span>
              </div>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition group-hover:bg-violet-700">
            Abrir Raio-X <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>

      <div className="grid min-w-0 gap-6 xl:grid-cols-5">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 xl:col-span-3">
          <header className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Ações prioritárias</h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Pendências que merecem atenção</p>
            </div>
            {prioridades.length > 0 && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {prioridades.length} tipo(s)
              </span>
            )}
          </header>

          {prioridades.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="mt-4 font-bold text-gray-900 dark:text-white">Tudo sob controle</h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                Nenhuma pendência importante foi identificada agora.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {prioridades.map((item) => {
                const Icon = item.icon;
                const cores = CORES_ACAO[item.tom];

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group relative flex items-center gap-3 px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >
                    <span className={`absolute bottom-3 left-0 top-3 w-1 rounded-r-full ${cores.barra}`} />
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cores.icon}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm text-gray-900 dark:text-white">{item.titulo}</strong>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cores.contador}`}>
                          {item.quantidade}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{item.descricao}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 xl:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Movimentação da semana</h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Entradas e saídas nos últimos 7 dias</p>
            </div>
            <Activity className="h-5 w-5 text-blue-500" />
          </div>

          <div className="mt-5 h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graficoMovimentacoes} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dashboardSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="data" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="entradas" name="Entradas" stroke="#10b981" strokeWidth={2} fill="url(#dashboardEntradas)" />
                <Area type="monotone" dataKey="saidas" name="Saídas" stroke="#f59e0b" strokeWidth={2} fill="url(#dashboardSaidas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <header className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Atividade recente</h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Os cinco registros mais recentes</p>
            </div>
          </div>
          <Link href="/dashboard/estoque" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">
            Ver todas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>

        {movimentosRecentes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Clock className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-700" />
            <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">Nenhuma movimentação registrada</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Entradas e saídas recentes aparecerão aqui.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {movimentosRecentes.map((movimento) => {
              const entrada = movimento.tipo_movimento === "entrada";

              return (
                <article key={movimento.id} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${entrada ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                    {entrada ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {movimento.produto?.nome ?? "Produto não encontrado"}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                      {movimento.motivo || (entrada ? "Entrada" : "Saída")} · {formatarDataMovimento(movimento.criado_em)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${entrada ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {entrada ? "+" : "-"}{normalizarNumero(movimento.quantidade)} un
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-400">{entrada ? "Entrada" : "Saída"}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<LoadingDashboard />}>
      <DashboardContent />
    </Suspense>
  );
}
