"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  CalendarDays,
  Download,
  FileWarning,
  Package,
  PackageX,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import PageHeader from "@/components/page-header";
import { useNotification } from "@/contexts/NotificationContext";
import { supabase } from "@/lib/supabase";
import type { MovimentoEstoque, Produto } from "@/lib/types";
import { formatarMoeda } from "@/lib/utils";

type Periodo = "1d" | "7d" | "30d" | "90d";
type TipoPerda = "todas" | "perda" | "vencimento" | "avaria";
type CategoriaPerda = Exclude<TipoPerda, "todas">;
type CorKPI = "red" | "amber" | "blue" | "gray";

type MovimentoComProduto = MovimentoEstoque & {
  produto?: Produto | null;
};

interface PerdaClassificada {
  movimento: MovimentoComProduto;
  categoria: CategoriaPerda;
  categoriaLabel: string;
  observacao: string | null;
  quantidade: number;
  custoUnitario: number;
  valorEstimado: number;
}

interface PerdaPorDia {
  chave: string;
  data: string;
  quantidade: number;
  valor: number;
}

interface ProdutoComPerda {
  produtoId: string;
  nome: string;
  categoria: string;
  quantidade: number;
  valorEstimado: number;
  ocorrencias: number;
}

interface KPIProps {
  label: string;
  valor: string | number;
  descricao?: string;
  icon: LucideIcon;
  cor: CorKPI;
  destaque?: boolean;
}

const PERIODOS: ReadonlyArray<{
  label: string;
  value: Periodo;
  dias: number;
}> = [
  { label: "Hoje", value: "1d", dias: 1 },
  { label: "7 dias", value: "7d", dias: 7 },
  { label: "30 dias", value: "30d", dias: 30 },
  { label: "90 dias", value: "90d", dias: 90 },
];

const FILTROS_TIPO: ReadonlyArray<{
  label: string;
  value: TipoPerda;
}> = [
  { label: "Todas", value: "todas" },
  { label: "Perdas", value: "perda" },
  { label: "Vencimentos", value: "vencimento" },
  { label: "Avarias", value: "avaria" },
];

const PALETA: Record<
  CorKPI,
  { fundo: string; texto: string; borda: string }
> = {
  red: {
    fundo: "bg-red-100 dark:bg-red-900/30",
    texto: "text-red-600 dark:text-red-400",
    borda: "border-red-200 dark:border-red-800",
  },
  amber: {
    fundo: "bg-amber-100 dark:bg-amber-900/30",
    texto: "text-amber-600 dark:text-amber-400",
    borda: "border-amber-200 dark:border-amber-800",
  },
  blue: {
    fundo: "bg-blue-100 dark:bg-blue-900/30",
    texto: "text-blue-600 dark:text-blue-400",
    borda: "border-blue-200 dark:border-blue-800",
  },
  gray: {
    fundo: "bg-gray-100 dark:bg-gray-800",
    texto: "text-gray-600 dark:text-gray-300",
    borda: "border-gray-300 dark:border-gray-700",
  },
};

function normalizarNumero(valor: unknown): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function obterPartesMotivo(motivo?: string | null): {
  categoria: string;
  observacao: string | null;
} {
  if (!motivo?.trim()) {
    return { categoria: "", observacao: null };
  }

  const partes = motivo.split("|");
  const categoria = partes[0]?.trim() ?? "";
  const observacao = partes.slice(1).join("|").trim();

  return {
    categoria,
    observacao: observacao || null,
  };
}

function classificarPerda(
  movimento: MovimentoComProduto,
): PerdaClassificada | null {
  if (movimento.tipo_movimento !== "saida") {
    return null;
  }

  const { categoria: motivoOriginal, observacao } = obterPartesMotivo(
    movimento.motivo,
  );
  const motivo = normalizarTexto(motivoOriginal);

  let categoria: CategoriaPerda;
  let categoriaLabel: string;

  if (motivo === "perda" || motivo === "perda ou quebra") {
    categoria = "perda";
    categoriaLabel = "Perda";
  } else if (motivo === "produto vencido") {
    categoria = "vencimento";
    categoriaLabel = "Produto vencido";
  } else if (motivo === "avaria") {
    categoria = "avaria";
    categoriaLabel = "Avaria";
  } else {
    return null;
  }

  const quantidade = Math.max(normalizarNumero(movimento.quantidade), 0);
  const custoUnitario = Math.max(
    normalizarNumero(movimento.produto?.preco_custo),
    0,
  );

  return {
    movimento,
    categoria,
    categoriaLabel,
    observacao,
    quantidade,
    custoUnitario,
    valorEstimado: quantidade * custoUnitario,
  };
}

function obterInicioPeriodo(periodo: Periodo): Date {
  const configuracao =
    PERIODOS.find((item) => item.value === periodo) ?? PERIODOS[1];
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - (configuracao.dias - 1));
  return inicio;
}

function formatarDataHora(dataString: string): string {
  const data = new Date(dataString);

  if (Number.isNaN(data.getTime())) {
    return "Data não informada";
  }

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function KPICard({
  label,
  valor,
  descricao,
  icon: Icon,
  cor,
  destaque = false,
}: KPIProps) {
  const paleta = PALETA[cor];

  return (
    <article
      className={`rounded-xl border bg-white p-4 dark:bg-gray-900 ${
        destaque
          ? paleta.borda
          : "border-gray-200 dark:border-gray-800"
      }`}
    >
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${paleta.fundo}`}
      >
        <Icon
          aria-hidden="true"
          className={`h-4 w-4 ${paleta.texto}`}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 break-words text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
        {valor}
      </p>
      {descricao && (
        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
          {descricao}
        </p>
      )}
    </article>
  );
}

function gerarCSV(perdas: PerdaClassificada[], periodo: Periodo) {
  const cabecalho = [
    "Data",
    "Produto",
    "SKU",
    "Categoria do produto",
    "Tipo da perda",
    "Quantidade",
    "Custo unitário atual",
    "Valor estimado",
    "Observação",
  ];

  const escapar = (valor: string | number) =>
    `"${String(valor).replace(/"/g, '""')}"`;

  const linhas = perdas.map((perda) => [
    formatarDataHora(perda.movimento.criado_em),
    perda.movimento.produto?.nome ?? "Produto removido",
    perda.movimento.produto?.sku ?? "",
    perda.movimento.produto?.categoria ?? "Sem categoria",
    perda.categoriaLabel,
    perda.quantidade,
    perda.custoUnitario.toFixed(2).replace(".", ","),
    perda.valorEstimado.toFixed(2).replace(".", ","),
    perda.observacao ?? "",
  ]);

  const conteudo = [cabecalho, ...linhas]
    .map((linha) => linha.map(escapar).join(";"))
    .join("\n");

  const blob = new Blob(["\uFEFF", conteudo], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `perdas-${periodo}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function PerdasPage() {
  const { addNotification } = useNotification();

  const [movimentos, setMovimentos] = useState<MovimentoComProduto[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [tipo, setTipo] = useState<TipoPerda>("todas");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarPerdas = useCallback(
    async (mostrarFeedback = false) => {
      mostrarFeedback ? setAtualizando(true) : setLoading(true);
      setErro(null);

      try {
        const inicio = obterInicioPeriodo(periodo);
        const { data, error } = await supabase
          .from("movimentos_estoque")
          .select("*, produto:produto_id(*)")
          .eq("tipo_movimento", "saida")
          .gte("criado_em", inicio.toISOString())
          .order("criado_em", { ascending: false })
          .limit(5000);

        if (error) {
          console.error("Erro ao carregar perdas:", error);
          setMovimentos([]);
          setErro("Não foi possível carregar os registros de perdas.");
          return;
        }

        setMovimentos(
          (data as unknown as MovimentoComProduto[] | null) ?? [],
        );

        if (mostrarFeedback) {
          addNotification("Controle de perdas atualizado.", "success", 1800);
        }
      } catch (error) {
        console.error("Erro inesperado ao carregar perdas:", error);
        setMovimentos([]);
        setErro("Ocorreu um erro inesperado ao carregar as perdas.");
      } finally {
        setLoading(false);
        setAtualizando(false);
      }
    },
    [addNotification, periodo],
  );

  useEffect(() => {
    void carregarPerdas();
  }, [carregarPerdas]);

  const perdas = useMemo(
    () =>
      movimentos
        .map(classificarPerda)
        .filter((perda): perda is PerdaClassificada => perda !== null),
    [movimentos],
  );

  const perdasFiltradas = useMemo(() => {
    const termo = normalizarTexto(busca);

    return perdas.filter((perda) => {
      if (tipo !== "todas" && perda.categoria !== tipo) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const conteudo = normalizarTexto(
        [
          perda.movimento.produto?.nome,
          perda.movimento.produto?.sku,
          perda.movimento.produto?.categoria,
          perda.categoriaLabel,
          perda.observacao,
        ]
          .filter(Boolean)
          .join(" "),
      );

      return conteudo.includes(termo);
    });
  }, [busca, perdas, tipo]);

  const indicadores = useMemo(() => {
    const unidades = perdas.reduce(
      (total, perda) => total + perda.quantidade,
      0,
    );
    const valor = perdas.reduce(
      (total, perda) => total + perda.valorEstimado,
      0,
    );
    const produtosAfetados = new Set(
      perdas.map((perda) => perda.movimento.produto_id),
    ).size;
    const vencimentos = perdas
      .filter((perda) => perda.categoria === "vencimento")
      .reduce((total, perda) => total + perda.quantidade, 0);
    const semCusto = perdas.filter((perda) => perda.custoUnitario <= 0).length;

    return {
      unidades,
      valor,
      produtosAfetados,
      vencimentos,
      ocorrencias: perdas.length,
      semCusto,
    };
  }, [perdas]);

  const perdasPorDia = useMemo(() => {
    const mapa = new Map<string, PerdaPorDia>();

    perdasFiltradas.forEach((perda) => {
      const data = new Date(perda.movimento.criado_em);
      if (Number.isNaN(data.getTime())) return;

      const chave = `${data.getFullYear()}-${String(
        data.getMonth() + 1,
      ).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
      const atual = mapa.get(chave) ?? {
        chave,
        data: data.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        quantidade: 0,
        valor: 0,
      };

      atual.quantidade += perda.quantidade;
      atual.valor += perda.valorEstimado;
      mapa.set(chave, atual);
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.chave.localeCompare(b.chave),
    );
  }, [perdasFiltradas]);

  const rankingProdutos = useMemo(() => {
    const mapa = new Map<string, ProdutoComPerda>();

    perdasFiltradas.forEach((perda) => {
      const produtoId = perda.movimento.produto_id;
      const atual = mapa.get(produtoId) ?? {
        produtoId,
        nome: perda.movimento.produto?.nome ?? "Produto removido",
        categoria:
          perda.movimento.produto?.categoria ?? "Sem categoria",
        quantidade: 0,
        valorEstimado: 0,
        ocorrencias: 0,
      };

      atual.quantidade += perda.quantidade;
      atual.valorEstimado += perda.valorEstimado;
      atual.ocorrencias += 1;
      mapa.set(produtoId, atual);
    });

    return Array.from(mapa.values())
      .sort((a, b) => b.valorEstimado - a.valorEstimado)
      .slice(0, 8);
  }, [perdasFiltradas]);

  const handleExportar = () => {
    if (perdasFiltradas.length === 0) {
      addNotification("Não existem perdas para exportar.", "warning", 2200);
      return;
    }

    gerarCSV(perdasFiltradas, periodo);
    addNotification("Relatório de perdas exportado.", "success", 2000);
  };

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-6 overflow-x-clip pb-8">
      <PageHeader
        eyebrow="CONTROLE DO ESTOQUE"
        title="Perdas"
        description="Acompanhe perdas, produtos vencidos e avarias registradas nas movimentações."
        icon={PackageX}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void carregarPerdas(true)}
              disabled={atualizando}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <RefreshCw
                aria-hidden="true"
                className={`h-4 w-4 ${
                  atualizando ? "animate-spin" : ""
                }`}
              />
              Atualizar
            </button>
            <Link
              href="/dashboard/estoque/movimento?tipo=saida"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Registrar perda
            </Link>
          </div>
        }
      />

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        <strong>Como este relatório funciona:</strong> são consideradas perdas
        apenas as saídas registradas como Perda, Produto vencido ou Avaria. O
        valor financeiro é uma estimativa baseada no preço de custo atual do
        produto, pois o histórico ainda não armazena o custo da data da
        ocorrência.
      </div>

      {erro && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0"
          />
          <div className="flex-1">
            <p>{erro}</p>
            <button
              type="button"
              onClick={() => void carregarPerdas(true)}
              className="mt-2 text-xs font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      <section
        aria-label="Indicadores das perdas"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        <KPICard
          label="Valor estimado perdido"
          valor={formatarMoeda(indicadores.valor)}
          descricao="Calculado pelo custo atual"
          icon={FileWarning}
          cor={indicadores.valor > 0 ? "red" : "gray"}
          destaque={indicadores.valor > 0}
        />
        <KPICard
          label="Unidades perdidas"
          valor={indicadores.unidades}
          descricao={`${indicadores.ocorrencias} ocorrência(s)`}
          icon={PackageX}
          cor={indicadores.unidades > 0 ? "red" : "gray"}
          destaque={indicadores.unidades > 0}
        />
        <KPICard
          label="Produtos afetados"
          valor={indicadores.produtosAfetados}
          icon={Package}
          cor="blue"
        />
        <KPICard
          label="Unidades vencidas"
          valor={indicadores.vencimentos}
          icon={CalendarDays}
          cor={indicadores.vencimentos > 0 ? "amber" : "gray"}
          destaque={indicadores.vencimentos > 0}
        />
        <KPICard
          label="Registros sem custo"
          valor={indicadores.semCusto}
          descricao="Estimativa financeira incompleta"
          icon={AlertTriangle}
          cor={indicadores.semCusto > 0 ? "amber" : "gray"}
          destaque={indicadores.semCusto > 0}
        />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por produto, SKU, categoria ou observação..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {busca && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex overflow-x-auto rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {PERIODOS.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => setPeriodo(item.value)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${
                  periodo === item.value
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex overflow-x-auto rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {FILTROS_TIPO.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => setTipo(item.value)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${
                  tipo === item.value
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportar}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {perdasFiltradas.length} registro(s) encontrado(s)
        </p>
      </section>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
        </div>
      ) : perdasFiltradas.length === 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white px-5 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <PackageX
              aria-hidden="true"
              className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <h2 className="font-bold text-gray-900 dark:text-white">
            Nenhuma perda encontrada
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Não existem perdas, vencimentos ou avarias nos filtros escolhidos.
          </p>
          <Link
            href="/dashboard/estoque/movimento?tipo=saida"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Registrar uma ocorrência
          </Link>
        </section>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:p-6">
              <div className="mb-5">
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Perdas ao longo do período
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Quantidade de unidades registradas por dia
                </p>
              </div>
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={perdasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                  <XAxis dataKey="data" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Bar
                    dataKey="quantidade"
                    name="Unidades perdidas"
                    fill="#ef4444"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:p-6">
              <div className="mb-4">
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Produtos com maior perda
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ordenados pelo valor estimado ao custo atual
                </p>
              </div>

              <div className="space-y-3">
                {rankingProdutos.map((produto, index) => (
                  <div
                    key={produto.produtoId}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {produto.nome}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {produto.quantidade} un · {produto.ocorrencias} ocorrência(s)
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-red-600 dark:text-red-400">
                      {formatarMoeda(produto.valorEstimado)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <header className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Histórico de perdas
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Detalhes das ocorrências registradas
                </p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {perdasFiltradas.length} registro(s)
              </span>
            </header>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <th className="px-5 py-3 text-left font-semibold">Data</th>
                    <th className="px-5 py-3 text-left font-semibold">Produto</th>
                    <th className="px-5 py-3 text-left font-semibold">Motivo</th>
                    <th className="px-5 py-3 text-left font-semibold">Observação</th>
                    <th className="px-5 py-3 text-right font-semibold">Qtd.</th>
                    <th className="px-5 py-3 text-right font-semibold">Valor estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {perdasFiltradas.map((perda) => (
                    <tr key={perda.movimento.id} className="text-sm">
                      <td className="whitespace-nowrap px-5 py-3 text-gray-500 dark:text-gray-400">
                        {formatarDataHora(perda.movimento.criado_em)}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {perda.movimento.produto?.nome ?? "Produto removido"}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {perda.movimento.produto?.sku || "Sem SKU"}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            perda.categoria === "vencimento"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          }`}
                        >
                          {perda.categoriaLabel}
                        </span>
                      </td>
                      <td className="max-w-[260px] px-5 py-3 text-gray-500 dark:text-gray-400">
                        <span className="line-clamp-2">
                          {perda.observacao || "Sem observação"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        {perda.quantidade}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-red-600 dark:text-red-400">
                        {perda.custoUnitario > 0
                          ? formatarMoeda(perda.valorEstimado)
                          : "Sem custo"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800 md:hidden">
              {perdasFiltradas.map((perda) => (
                <article key={perda.movimento.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        perda.categoria === "vencimento"
                          ? "bg-amber-100 dark:bg-amber-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      <PackageX
                        aria-hidden="true"
                        className={`h-4 w-4 ${
                          perda.categoria === "vencimento"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-sm font-bold text-gray-900 dark:text-white">
                          {perda.movimento.produto?.nome ?? "Produto removido"}
                        </h3>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {perda.categoriaLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatarDataHora(perda.movimento.criado_em)}
                      </p>
                      {perda.observacao && (
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                          {perda.observacao}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {perda.quantidade} unidade(s)
                        </span>
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          {perda.custoUnitario > 0
                            ? formatarMoeda(perda.valorEstimado)
                            : "Sem custo"}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
        <div className="flex items-start gap-3">
          <ArrowDown
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-gray-500"
          />
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Registre a causa corretamente
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Ao registrar uma saída, escolha Perda, Produto vencido ou Avaria.
              Saídas com outros motivos não entram neste relatório.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
