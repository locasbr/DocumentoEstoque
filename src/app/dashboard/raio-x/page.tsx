"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  Brain,
  CheckCircle2,
  CircleDollarSign,
  PackageSearch,
  RefreshCw,
  Sparkles,
  TrendingDown,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import PageHeader from "@/components/page-header";
import { supabase } from "@/lib/supabase";
import { formatarMoeda } from "@/lib/utils";

type Periodo = 7 | 30 | 90;
type CorKPI = "emerald" | "amber" | "red" | "blue";

interface RespostaRaioX {
  periodo: Periodo;
  atualizadoEm: string;
  temDados: boolean;
  metricas: {
    valorEstoque: number;
    abaixoMinimo: number;
    semMovimentacao: number;
    valorPerdas: number;
    receitaEstimada: number;
    lucroEstimado: number;
    margemEstimada: number;
    totalProdutos: number;
    totalMovimentos: number;
  };
  graficos: {
    movimentacoes: Array<{
      chave: string;
      data: string;
      entradas: number;
      saidas: number;
    }>;
    topProdutos: Array<{
      nome: string;
      quantidade: number;
      receitaEstimada: number;
    }>;
    categorias: Array<{ nome: string; valor: number }>;
  };
  diagnostico: null | {
    resumo: string;
    prioridades: string[];
    pontosAtencao: string[];
    acoes: string[];
  };
  cache: {
    existe: boolean;
    geradoEm: string | null;
    desatualizado: boolean;
    podeGerar: boolean;
    proximaGeracaoEm: string | null;
    limiteMensalAtingido: boolean;
  };
  mensagem: string | null;
}

const PERIODOS: Periodo[] = [7, 30, 90];
const CORES = [
  "#7c3aed",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
  "#8b5cf6",
  "#64748b",
];

export default function RaioXPage() {
  const [periodo, setPeriodo] = useState<Periodo>(30);
  const [dados, setDados] = useState<RespostaRaioX | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [bloqueado, setBloqueado] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(
    async (acao: "consultar" | "gerar" = "consultar") => {
      if (acao === "gerar") setGerando(true);
      else setLoading(true);

      setErro("");
      setMensagem("");
      setBloqueado(false);

      try {
        const { data: sessao, error: sessaoError } =
          await supabase.auth.getSession();

        if (sessaoError || !sessao.session?.access_token) {
          setErro("Sua sessão expirou. Entre novamente.");
          return;
        }

        const resposta = await fetch("/api/ia/raio-x", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessao.session.access_token}`,
          },
          body: JSON.stringify({ periodo, acao }),
        });

        const corpo = (await resposta.json()) as RespostaRaioX & {
          error?: string;
          message?: string;
        };

        if (
          resposta.status === 403 &&
          corpo.error === "plano_insuficiente"
        ) {
          setBloqueado(true);
          return;
        }

        if (!resposta.ok) {
          setErro(
            corpo.message || corpo.error || "Não foi possível gerar o Raio-X.",
          );
          return;
        }

        setDados(corpo);
        if (corpo.mensagem) setMensagem(corpo.mensagem);
      } catch (error: unknown) {
        console.error("Erro ao carregar Raio-X:", error);
        setErro("Não foi possível carregar o diagnóstico.");
      } finally {
        setLoading(false);
        setGerando(false);
      }
    },
    [periodo],
  );

  useEffect(() => {
    void carregar("consultar");
  }, [carregar]);

  if (bloqueado) {
    return (
      <div className="mx-auto max-w-4xl pb-10">
        <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-8 text-center dark:border-violet-900 dark:from-violet-950/40 dark:to-gray-950 md:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 text-white">
            <Brain className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Raio-X Inteligente
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-gray-400">
            Transforme os dados do estoque em prioridades, alertas e ações
            práticas. Este recurso está disponível no plano Profissional.
          </p>
          <Link
            href="/assinar?plano=profissional"
            className="mt-7 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-bold text-white hover:bg-violet-700"
          >
            Conhecer o Profissional
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-6 overflow-x-clip pb-10">
      <PageHeader
        eyebrow="INTELIGÊNCIA DO ESTOQUE"
        title="Raio-X Inteligente"
        description="Indicadores calculados pelo sistema e explicados em linguagem simples."
        icon={Brain}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
              {PERIODOS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPeriodo(item)}
                  className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                    periodo === item
                      ? "bg-white text-violet-700 shadow-sm dark:bg-gray-900 dark:text-violet-300"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {item} dias
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void carregar("consultar")}
              disabled={loading || gerando}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Atualizar dados
            </button>

            <button
              type="button"
              onClick={() => void carregar("gerar")}
              disabled={
                loading || gerando || dados?.cache.podeGerar === false
              }
              title={
                dados?.cache.podeGerar === false
                  ? "Uma nova análise pode ser gerada a cada 24 horas por conta"
                  : "Gerar uma nova análise com IA"
              }
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-950 disabled:text-violet-400"
            >
              <Sparkles
                className={`h-4 w-4 ${gerando ? "animate-pulse" : ""}`}
              />
              {gerando
                ? "Gerando..."
                : dados?.cache.podeGerar === false
                  ? "Disponível em 24h"
                  : dados?.cache.existe
                    ? "Gerar novo diagnóstico"
                    : "Gerar diagnóstico"}
            </button>
          </div>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-violet-500/40 bg-violet-950/50 px-4 py-4 dark:border-violet-700/60 dark:bg-violet-950/40">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
          <Sparkles aria-hidden="true" className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">Como funciona o diagnóstico</p>
          <p className="mt-1 text-xs leading-relaxed text-violet-100">
            Você pode consultar os gráficos e o diagnóstico salvo quantas vezes
            quiser. Uma nova análise com IA pode ser gerada uma vez a cada 24
            horas por conta.
          </p>
          {dados?.cache.geradoEm && (
            <p className="mt-2 text-[11px] font-semibold text-violet-300">
              Último diagnóstico: {" "}
              {new Date(dados.cache.geradoEm).toLocaleString("pt-BR")}
            </p>
          )}
          {dados?.cache.proximaGeracaoEm && (
            <p className="mt-1 text-[11px] font-semibold text-amber-300">
              Próxima geração disponível em: {" "}
              {new Date(dados.cache.proximaGeracaoEm).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      </div>

      {mensagem && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-2xl border border-emerald-500/60 bg-emerald-950 px-4 py-4 text-emerald-50 shadow-lg shadow-emerald-950/20 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-white">
              Diagnóstico gerado com sucesso
            </p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-emerald-100">
              {mensagem}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMensagem("")}
            aria-label="Fechar mensagem"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-emerald-100 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}

      {dados?.cache.desatualizado && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
          Há dados novos desde o último diagnóstico. Os gráficos já estão
          atualizados; gere um novo diagnóstico quando o botão estiver
          disponível.
        </div>
      )}

      {erro && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p>{erro}</p>
            <button
              type="button"
              onClick={() => void carregar("consultar")}
              className="mt-2 font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton />
      ) : dados && !dados.temDados ? (
        <EstadoVazio />
      ) : (
        dados && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KPI
                titulo="Valor do estoque a custo"
                valor={formatarMoeda(dados.metricas.valorEstoque)}
                descricao={`${dados.metricas.totalProdutos} produto(s) ativo(s)`}
                icon={CircleDollarSign}
                cor="emerald"
              />
              <KPI
                titulo="Abaixo do mínimo"
                valor={dados.metricas.abaixoMinimo}
                descricao="Inclui produtos zerados"
                icon={TrendingDown}
                cor={dados.metricas.abaixoMinimo > 0 ? "amber" : "emerald"}
              />
              <KPI
                titulo={`Sem movimentação em ${periodo} dias`}
                valor={dados.metricas.semMovimentacao}
                descricao="Produtos sem entrada ou saída"
                icon={PackageSearch}
                cor="blue"
              />
              <KPI
                titulo="Perdas no período"
                valor={formatarMoeda(dados.metricas.valorPerdas)}
                descricao="Estimativa pelo custo atual"
                icon={AlertTriangle}
                cor={dados.metricas.valorPerdas > 0 ? "red" : "emerald"}
              />
            </section>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              Receita, lucro e perdas são estimativas baseadas nos preços atuais
              dos produtos. O Raio-X não altera nenhum dado automaticamente.
            </div>

            <section className="grid gap-4 xl:grid-cols-3">
              <GraficoCard
                titulo="Entradas e saídas"
                descricao={`Movimentações dos últimos ${periodo} dias`}
                className="xl:col-span-2"
              >
                <ResponsiveContainer width="100%" height={310}>
                  <AreaChart data={dados.graficos.movimentacoes}>
                    <defs>
                      <linearGradient
                        id="entrada"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="saida"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#7c3aed"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#7c3aed"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="data" fontSize={11} />
                    <YAxis allowDecimals={false} fontSize={11} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="entradas"
                      name="Entradas"
                      stroke="#10b981"
                      fill="url(#entrada)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="saidas"
                      name="Saídas"
                      stroke="#7c3aed"
                      fill="url(#saida)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </GraficoCard>

              <GraficoCard
                titulo="Estoque por categoria"
                descricao="Valor a custo atual"
              >
                {dados.graficos.categorias.length ? (
                  <ResponsiveContainer width="100%" height={310}>
                    <PieChart>
                      <Pie
                        data={dados.graficos.categorias}
                        dataKey="valor"
                        nameKey="nome"
                        innerRadius={62}
                        outerRadius={100}
                        paddingAngle={3}
                      >
                        {dados.graficos.categorias.map((item, index) => (
                          <Cell
                            key={item.nome}
                            fill={CORES[index % CORES.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(valor) => formatarMoeda(Number(valor))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <SemGrafico />
                )}
              </GraficoCard>
            </section>

            <section className="grid gap-4 xl:grid-cols-3">
              <GraficoCard
                titulo="Produtos com maior saída"
                descricao="Quantidade movimentada no período"
                className="xl:col-span-2"
              >
                {dados.graficos.topProdutos.length ? (
                  <ResponsiveContainer width="100%" height={330}>
                    <BarChart
                      data={dados.graficos.topProdutos}
                      layout="vertical"
                      margin={{ left: 15, right: 15 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="nome"
                        width={125}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="quantidade"
                        name="Unidades"
                        fill="#7c3aed"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <SemGrafico />
                )}
              </GraficoCard>

              <article className="rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-6 text-white shadow-xl">
                <p className="text-xs font-bold uppercase tracking-wider text-violet-100">
                  Estimativas do período
                </p>
                <div className="mt-5 space-y-5">
                  <Estimativa
                    label="Receita estimada"
                    valor={formatarMoeda(dados.metricas.receitaEstimada)}
                  />
                  <Estimativa
                    label="Lucro estimado"
                    valor={formatarMoeda(dados.metricas.lucroEstimado)}
                  />
                  <Estimativa
                    label="Margem estimada"
                    valor={`${dados.metricas.margemEstimada.toFixed(1)}%`}
                  />
                </div>
                <p className="mt-6 text-xs leading-relaxed text-violet-100">
                  Cálculos feitos com os preços atuais cadastrados, não com o
                  preço histórico da movimentação.
                </p>
              </article>
            </section>

            <Diagnostico
              dados={dados}
              loading={loading}
              gerando={gerando}
              onGerar={() => void carregar("gerar")}
            />

            {dados.cache.geradoEm && (
              <p className="text-right text-xs text-gray-500 dark:text-gray-400">
                Diagnóstico salvo em{" "}
                {new Date(dados.cache.geradoEm).toLocaleString("pt-BR")}. Abrir
                esta página não gera nova cobrança.
              </p>
            )}

            <p className="text-right text-xs text-gray-500 dark:text-gray-400">
              Atualizado em{" "}
              {new Date(dados.atualizadoEm).toLocaleString("pt-BR")}
            </p>
          </>
        )
      )}
    </div>
  );
}

function KPI({
  titulo,
  valor,
  descricao,
  icon: Icon,
  cor,
}: {
  titulo: string;
  valor: string | number;
  descricao: string;
  icon: typeof Brain;
  cor: CorKPI;
}) {
  const cores: Record<CorKPI, string> = {
    emerald:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    amber:
      "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${cores[cor]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{titulo}</p>
      <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">
        {valor}
      </p>
      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
        {descricao}
      </p>
    </article>
  );
}

function GraficoCard({
  titulo,
  descricao,
  children,
  className = "",
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`min-w-0 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <h2 className="font-bold text-gray-900 dark:text-white">{titulo}</h2>
      <p className="mb-5 text-xs text-gray-500 dark:text-gray-400">
        {descricao}
      </p>
      {children}
    </article>
  );
}

function SemGrafico() {
  return (
    <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">
      Sem dados suficientes
    </div>
  );
}

function Estimativa({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-sm text-violet-100">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{valor}</p>
    </div>
  );
}

function Diagnostico({
  dados,
  loading,
  gerando,
  onGerar,
}: {
  dados: RespostaRaioX;
  loading: boolean;
  gerando: boolean;
  onGerar: () => void;
}) {
  if (!dados.diagnostico) {
    return (
      <section
        aria-labelledby="diagnostico-vazio-title"
        className="overflow-hidden rounded-2xl border border-violet-500/40 bg-gray-900 shadow-lg dark:border-violet-700/70 dark:bg-gray-900"
      >
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-900/30">
            <Sparkles aria-hidden="true" className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-400">
              Diagnóstico inteligente
            </p>
            <h2
              id="diagnostico-vazio-title"
              className="mt-1 text-base font-extrabold text-white"
            >
              Indicadores e gráficos atualizados
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-300">
              Ainda não existe um diagnóstico salvo para este período. Os
              números e gráficos já estão disponíveis sem consumir IA.
            </p>
          </div>
          <button
            type="button"
            onClick={onGerar}
            disabled={loading || gerando || dados.cache.podeGerar === false}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500"
          >
            <Sparkles
              aria-hidden="true"
              className={`h-4 w-4 ${gerando ? "animate-pulse" : ""}`}
            />
            {gerando
              ? "Gerando..."
              : dados.cache.podeGerar === false
                ? "Disponível em 24h"
                : dados.cache.existe
                  ? "Gerar novo diagnóstico"
                  : "Gerar diagnóstico"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 dark:border-violet-900 dark:from-violet-950/30 dark:to-gray-900 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Diagnóstico inteligente
          </p>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
            O que merece sua atenção
          </h2>
        </div>
      </div>

      <p className="mt-5 leading-relaxed text-gray-700 dark:text-gray-300">
        {dados.diagnostico.resumo}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Lista
          titulo="Prioridades"
          itens={dados.diagnostico.prioridades}
          cor="red"
        />
        <Lista
          titulo="Pontos de atenção"
          itens={dados.diagnostico.pontosAtencao}
          cor="amber"
        />
        <Lista
          titulo="Ações recomendadas"
          itens={dados.diagnostico.acoes}
          cor="emerald"
        />
      </div>
    </section>
  );
}

function Lista({
  titulo,
  itens,
  cor,
}: {
  titulo: string;
  itens: string[];
  cor: "red" | "amber" | "emerald";
}) {
  const cores = {
    red: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-900/10 dark:text-red-300",
    amber:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-900/10 dark:text-amber-300",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-900/10 dark:text-emerald-300",
  };

  return (
    <div className={`rounded-2xl border p-5 ${cores[cor]}`}>
      <h3 className="font-bold">{titulo}</h3>
      {itens.length ? (
        <ul className="mt-3 space-y-2 text-sm">
          {itens.map((item, index) => (
            <li key={`${titulo}-${index}`} className="flex gap-2">
              <span className="font-bold">{index + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm">Nenhum item relevante neste período.</p>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-96 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}

function EstadoVazio() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
      <PackageSearch className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-700" />
      <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
        Ainda não há dados suficientes
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 dark:text-gray-400">
        Cadastre produtos e registre entradas, saídas, vendas ou perdas para
        gerar o primeiro Raio-X.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/dashboard/produtos/novo"
          className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Cadastrar produto
        </Link>
        <Link
          href="/dashboard/estoque/movimento"
          className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200"
        >
          Registrar movimentação
        </Link>
      </div>
    </div>
  );
}
