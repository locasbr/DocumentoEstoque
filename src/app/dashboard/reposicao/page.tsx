"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUpDown,
  Boxes,
  Crown,
  Download,
  PackageCheck,
  PackagePlus,
  RefreshCw,
  Search,
  ShoppingCart,
  Wallet,
  X,
} from "lucide-react";

import PageHeader from "@/components/page-header";
import { useNotification } from "@/contexts/NotificationContext";
import { usePlano } from "@/hooks/usePlano";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/lib/types";
import { formatarMoeda } from "@/lib/utils";

type PrioridadeFiltro = "todos" | "critico" | "baixo" | "sem_custo";
type Ordenacao = "urgencia" | "maior_reposicao" | "maior_custo" | "nome";
type CorKPI = "red" | "amber" | "emerald" | "blue" | "gray";

interface ItemReposicao {
  produto: Produto;
  estoqueAtual: number;
  estoqueMinimo: number;
  quantidadeSugerida: number;
  custoUnitario: number;
  custoEstimado: number;
  prioridade: "critico" | "baixo";
}

interface KPIProps {
  label: string;
  valor: string | number;
  descricao?: string;
  icon: LucideIcon;
  cor: CorKPI;
  destaque?: boolean;
}

const FILTROS: ReadonlyArray<{
  value: PrioridadeFiltro;
  label: string;
}> = [
  { value: "todos", label: "Todos" },
  { value: "critico", label: "Zerados" },
  { value: "baixo", label: "Abaixo do mínimo" },
  { value: "sem_custo", label: "Sem custo" },
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
  emerald: {
    fundo: "bg-emerald-100 dark:bg-emerald-900/30",
    texto: "text-emerald-600 dark:text-emerald-400",
    borda: "border-emerald-200 dark:border-emerald-800",
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

function transformarProdutoEmReposicao(
  produto: Produto,
): ItemReposicao | null {
  if (produto.ativo === false) return null;

  const estoqueAtual = Math.max(normalizarNumero(produto.quantidade_atual), 0);
  const estoqueMinimo = Math.max(
    normalizarNumero(produto.quantidade_minima),
    0,
  );

  if (estoqueMinimo <= 0 || estoqueAtual >= estoqueMinimo) {
    return null;
  }

  const quantidadeSugerida = Math.max(estoqueMinimo - estoqueAtual, 0);
  const custoUnitario = Math.max(normalizarNumero(produto.preco_custo), 0);

  return {
    produto,
    estoqueAtual,
    estoqueMinimo,
    quantidadeSugerida,
    custoUnitario,
    custoEstimado: quantidadeSugerida * custoUnitario,
    prioridade: estoqueAtual <= 0 ? "critico" : "baixo",
  };
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
        <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
          {descricao}
        </p>
      )}
    </article>
  );
}

function gerarCSV(itens: ItemReposicao[]) {
  const cabecalho = [
    "Produto",
    "SKU",
    "Marca",
    "Categoria",
    "Estoque atual",
    "Estoque mínimo",
    "Quantidade sugerida",
    "Prioridade",
    "Custo unitário atual",
    "Custo estimado",
  ];

  const escapar = (valor: string | number) =>
    `"${String(valor).replace(/"/g, '""')}"`;

  const linhas = itens.map((item) => [
    item.produto.nome,
    item.produto.sku || "",
    item.produto.marca || "",
    item.produto.categoria || "Sem categoria",
    item.estoqueAtual,
    item.estoqueMinimo,
    item.quantidadeSugerida,
    item.prioridade === "critico" ? "Estoque zerado" : "Abaixo do mínimo",
    item.custoUnitario.toFixed(2).replace(".", ","),
    item.custoEstimado.toFixed(2).replace(".", ","),
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
  link.download = `reposicao-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function SkeletonReposicao() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-8 w-full rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  );
}

export default function ReposicaoPage() {
  const { addNotification } = useNotification();
  const { temExportarCSV } = usePlano();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<PrioridadeFiltro>("todos");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("urgencia");

  const carregarProdutos = useCallback(
    async (mostrarFeedback = false) => {
      mostrarFeedback ? setAtualizando(true) : setLoading(true);
      setErro(null);

      try {
        const { data, error } = await supabase
          .from("produtos")
          .select("*")
          .eq("ativo", true)
          .order("nome", { ascending: true });

        if (error) {
          console.error("Erro ao carregar reposição:", error);
          setProdutos([]);
          setErro("Não foi possível carregar a lista de reposição.");
          return;
        }

        setProdutos((data as Produto[] | null) ?? []);

        if (mostrarFeedback) {
          addNotification("Lista de reposição atualizada.", "success", 1800);
        }
      } catch (error) {
        console.error("Erro inesperado ao carregar reposição:", error);
        setProdutos([]);
        setErro("Ocorreu um erro inesperado ao carregar a reposição.");
      } finally {
        setLoading(false);
        setAtualizando(false);
      }
    },
    [addNotification],
  );

  useEffect(() => {
    void carregarProdutos();
  }, [carregarProdutos]);

  const itensReposicao = useMemo(
    () =>
      produtos
        .map(transformarProdutoEmReposicao)
        .filter((item): item is ItemReposicao => item !== null),
    [produtos],
  );

  const itensFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca);

    return itensReposicao
      .filter((item) => {
        if (filtro === "critico" && item.prioridade !== "critico") {
          return false;
        }

        if (filtro === "baixo" && item.prioridade !== "baixo") {
          return false;
        }

        if (filtro === "sem_custo" && item.custoUnitario > 0) {
          return false;
        }

        if (!termo) return true;

        const conteudo = normalizarTexto(
          [
            item.produto.nome,
            item.produto.sku,
            item.produto.marca,
            item.produto.categoria,
          ]
            .filter(Boolean)
            .join(" "),
        );

        return conteudo.includes(termo);
      })
      .sort((a, b) => {
        if (ordenacao === "nome") {
          return a.produto.nome.localeCompare(b.produto.nome, "pt-BR");
        }

        if (ordenacao === "maior_reposicao") {
          return b.quantidadeSugerida - a.quantidadeSugerida;
        }

        if (ordenacao === "maior_custo") {
          return b.custoEstimado - a.custoEstimado;
        }

        if (a.prioridade !== b.prioridade) {
          return a.prioridade === "critico" ? -1 : 1;
        }

        const proporcaoA =
          a.estoqueMinimo > 0 ? a.estoqueAtual / a.estoqueMinimo : 1;
        const proporcaoB =
          b.estoqueMinimo > 0 ? b.estoqueAtual / b.estoqueMinimo : 1;

        if (proporcaoA !== proporcaoB) return proporcaoA - proporcaoB;
        return b.quantidadeSugerida - a.quantidadeSugerida;
      });
  }, [busca, filtro, itensReposicao, ordenacao]);

  const indicadores = useMemo(() => {
    const zerados = itensReposicao.filter(
      (item) => item.prioridade === "critico",
    ).length;
    const baixos = itensReposicao.filter(
      (item) => item.prioridade === "baixo",
    ).length;
    const unidades = itensReposicao.reduce(
      (total, item) => total + item.quantidadeSugerida,
      0,
    );
    const custoEstimado = itensReposicao.reduce(
      (total, item) => total + item.custoEstimado,
      0,
    );
    const semCusto = itensReposicao.filter(
      (item) => item.custoUnitario <= 0,
    ).length;

    return { zerados, baixos, unidades, custoEstimado, semCusto };
  }, [itensReposicao]);

  const handleExportar = () => {
    if (!temExportarCSV) {
      addNotification(
        "Exportação CSV disponível no plano Profissional.",
        "warning",
      );
      return;
    }

    if (itensFiltrados.length === 0) {
      addNotification(
        "Não existem itens de reposição para exportar.",
        "warning",
        2200,
      );
      return;
    }

    gerarCSV(itensFiltrados);
    addNotification("Lista de reposição exportada.", "success", 2000);
  };

  const temFiltrosAtivos =
    Boolean(busca.trim()) || filtro !== "todos" || ordenacao !== "urgencia";

  const limparFiltros = () => {
    setBusca("");
    setFiltro("todos");
    setOrdenacao("urgencia");
  };

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-6 overflow-x-clip pb-8">
      <PageHeader
        eyebrow="GESTÃO DE ESTOQUE"
        title="Reposição"
        description="Veja quais produtos estão abaixo do mínimo e quanto precisa ser reposto."
        icon={PackagePlus}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void carregarProdutos(true)}
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
            {temExportarCSV ? (
              <button
                type="button"
                onClick={handleExportar}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Download aria-hidden="true" className="h-4 w-4" />
                Exportar lista
              </button>
            ) : (
              <Link
                href="/assinar"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
              >
                <Crown aria-hidden="true" className="h-4 w-4" />
                Exportar
              </Link>
            )}
          </div>
        }
      />

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        <strong>Como a sugestão é calculada:</strong> estoque mínimo menos
        estoque atual. Esta primeira versão não prevê demanda e não cria pedido
        de compra automaticamente. Ela mostra a quantidade mínima necessária
        para normalizar cada produto.
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
              onClick={() => void carregarProdutos(true)}
              className="mt-2 text-xs font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      <section
        aria-label="Indicadores de reposição"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        <KPICard
          label="Produtos zerados"
          valor={indicadores.zerados}
          descricao="Prioridade crítica"
          icon={AlertCircle}
          cor={indicadores.zerados > 0 ? "red" : "emerald"}
          destaque={indicadores.zerados > 0}
        />
        <KPICard
          label="Abaixo do mínimo"
          valor={indicadores.baixos}
          descricao="Reposição recomendada"
          icon={AlertTriangle}
          cor={indicadores.baixos > 0 ? "amber" : "emerald"}
          destaque={indicadores.baixos > 0}
        />
        <KPICard
          label="Unidades sugeridas"
          valor={indicadores.unidades}
          descricao="Para atingir o estoque mínimo"
          icon={Boxes}
          cor="blue"
        />
        <KPICard
          label="Custo estimado"
          valor={formatarMoeda(indicadores.custoEstimado)}
          descricao={
            indicadores.semCusto > 0
              ? `${indicadores.semCusto} produto(s) não incluído(s)`
              : "Todos os produtos possuem custo"
          }
          icon={Wallet}
          cor={indicadores.semCusto > 0 ? "amber" : "emerald"}
          destaque={indicadores.semCusto > 0}
        />
        <KPICard
          label="Produtos sem custo"
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
              placeholder="Buscar por produto, SKU, marca ou categoria..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
            {FILTROS.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => setFiltro(item.value)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${
                  filtro === item.value
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[195px]">
            <ArrowUpDown
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <select
              value={ordenacao}
              onChange={(event) =>
                setOrdenacao(event.target.value as Ordenacao)
              }
              aria-label="Ordenar lista de reposição"
              className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-8 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="urgencia">Por urgência</option>
              <option value="maior_reposicao">Maior quantidade</option>
              <option value="maior_custo">Maior custo</option>
              <option value="nome">Nome do produto</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <span>{itensFiltrados.length} produto(s) encontrado(s)</span>
          {temFiltrosAtivos && (
            <button
              type="button"
              onClick={limparFiltros}
              className="ml-auto font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonReposicao key={index} />
          ))}
        </div>
      ) : itensFiltrados.length === 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white px-5 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <PackageCheck
              aria-hidden="true"
              className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <h2 className="font-bold text-gray-900 dark:text-white">
            {temFiltrosAtivos
              ? "Nenhum produto encontrado"
              : "Estoque dentro do mínimo"}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
            {temFiltrosAtivos
              ? "Tente limpar ou alterar os filtros utilizados."
              : "Não existem produtos ativos abaixo do estoque mínimo no momento."}
          </p>
          {temFiltrosAtivos && (
            <button
              type="button"
              onClick={limparFiltros}
              className="mt-5 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              Limpar filtros
            </button>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <header className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                Lista de reposição
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Priorize os produtos zerados e registre a entrada após o
                recebimento.
              </p>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {itensFiltrados.length} produto(s)
            </span>
          </header>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-5 py-3 text-left font-semibold">Produto</th>
                  <th className="px-5 py-3 text-left font-semibold">Situação</th>
                  <th className="px-5 py-3 text-right font-semibold">Atual</th>
                  <th className="px-5 py-3 text-right font-semibold">Mínimo</th>
                  <th className="px-5 py-3 text-right font-semibold">Repor</th>
                  <th className="px-5 py-3 text-right font-semibold">Custo estimado</th>
                  <th className="px-5 py-3 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {itensFiltrados.map((item) => (
                  <tr key={item.produto.id} className="text-sm">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.produto.nome}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {item.produto.sku || "Sem SKU"}
                        {item.produto.categoria
                          ? ` · ${item.produto.categoria}`
                          : ""}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                          item.prioridade === "critico"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}
                      >
                        {item.prioridade === "critico"
                          ? "Estoque zerado"
                          : "Abaixo do mínimo"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">
                      {item.estoqueAtual}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500 dark:text-gray-400">
                      {item.estoqueMinimo}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-blue-600 dark:text-blue-400">
                      {item.quantidadeSugerida}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">
                      {item.custoUnitario > 0
                        ? formatarMoeda(item.custoEstimado)
                        : "Sem custo"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/dashboard/estoque/movimento?tipo=entrada&produto=${item.produto.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
                        Registrar entrada
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800 md:hidden">
            {itensFiltrados.map((item) => (
              <article key={item.produto.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      item.prioridade === "critico"
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-amber-100 dark:bg-amber-900/30"
                    }`}
                  >
                    {item.prioridade === "critico" ? (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-sm font-bold text-gray-900 dark:text-white">
                        {item.produto.nome}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          item.prioridade === "critico"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}
                      >
                        {item.prioridade === "critico" ? "Zerado" : "Baixo"}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.produto.sku || "Sem SKU"}
                      {item.produto.categoria
                        ? ` · ${item.produto.categoria}`
                        : ""}
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800/60">
                      <div>
                        <p className="text-[10px] uppercase text-gray-400">
                          Atual
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {item.estoqueAtual}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-400">
                          Mínimo
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {item.estoqueMinimo}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-400">
                          Repor
                        </p>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {item.quantidadeSugerida}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase text-gray-400">
                          Custo estimado
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {item.custoUnitario > 0
                            ? formatarMoeda(item.custoEstimado)
                            : "Sem custo"}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/estoque/movimento?tipo=entrada&produto=${item.produto.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
                        Registrar entrada
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
        <div className="flex items-start gap-3">
          <ShoppingCart
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-gray-500"
          />
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Esta lista ainda não é um pedido de compra
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Use a sugestão para planejar a compra. Registre a entrada somente
              quando a mercadoria realmente chegar ao estabelecimento.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
