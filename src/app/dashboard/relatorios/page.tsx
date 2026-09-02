"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Crown,
  Download,
  PackageX,
  RefreshCw,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import PageHeader from "@/components/page-header";
import UpgradeBlock from "@/components/upgrade-block";
import { useNotification } from "@/contexts/NotificationContext";
import { usePlano } from "@/hooks/usePlano";
import { exportMovimentosDiariosCSV, exportVendasCSV } from "@/lib/export-utils";
import { supabase } from "@/lib/supabase";
import type { MovimentoEstoque, Produto } from "@/lib/types";
import { formatarMoeda } from "@/lib/utils";

type Periodo = "1d" | "7d" | "30d" | "90d";
type CorKPI = "blue" | "emerald" | "amber" | "red" | "gray";

type MovimentoRelatorio = MovimentoEstoque & { produto?: Produto | null };

interface RelatorioProduto {
  produto_id: string;
  produto_nome: string;
  categoria: string;
  quantidade_vendida: number;
  valor_estimado: number;
  custo_estimado: number;
  resultado_estimado: number;
  tem_custo: boolean;
}

interface MovimentoDiario {
  chave: string;
  data: string;
  entradas: number;
  saidas: number;
  vendas: number;
  perdas: number;
}

interface KPIProps {
  label: string;
  valor: string | number;
  icon: LucideIcon;
  cor: CorKPI;
  descricao?: string;
  destaque?: boolean;
}

const PERIODOS: ReadonlyArray<{ label: string; value: Periodo; dias: number }> = [
  { label: "Hoje", value: "1d", dias: 1 },
  { label: "7 dias", value: "7d", dias: 7 },
  { label: "30 dias", value: "30d", dias: 30 },
  { label: "90 dias", value: "90d", dias: 90 },
];

const PALETA: Record<CorKPI, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
  amber: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
  red: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
  gray: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-300", border: "border-gray-300 dark:border-gray-700" },
};

function numero(valor: unknown): number {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function motivoBase(motivo?: string | null): string {
  return motivo?.split("|")[0]?.trim().toLocaleLowerCase("pt-BR") ?? "";
}

function movimentoEhVenda(movimento: MovimentoRelatorio): boolean {
  if (movimento.tipo_movimento !== "saida") return false;
  const motivo = movimento.motivo?.trim() ?? "";
  return motivo.startsWith("PDV-") || motivo.startsWith("PDV -") || motivoBase(motivo) === "venda";
}

function movimentoEhPerda(movimento: MovimentoRelatorio): boolean {
  if (movimento.tipo_movimento !== "saida") return false;
  const motivo = motivoBase(movimento.motivo);
  return motivo === "perda" || motivo === "produto vencido" || motivo === "avaria";
}

function inicioDoPeriodo(periodo: Periodo): Date {
  const configuracao = PERIODOS.find((item) => item.value === periodo) ?? PERIODOS[1];
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  data.setDate(data.getDate() - (configuracao.dias - 1));
  return data;
}

function KPICard({ label, valor, icon: Icon, cor, descricao, destaque = false }: KPIProps) {
  const paleta = PALETA[cor];
  return (
    <article className={`rounded-xl border bg-white p-4 dark:bg-gray-900 ${destaque ? paleta.border : "border-gray-200 dark:border-gray-800"}`}>
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${paleta.bg}`}>
        <Icon aria-hidden="true" className={`h-4 w-4 ${paleta.text}`} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 break-words text-xl font-bold text-gray-900 dark:text-white md:text-2xl">{valor}</p>
      {descricao && <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{descricao}</p>}
    </article>
  );
}

export default function RelatoriosPage() {
  const { addNotification } = useNotification();
  const { temRelatoriosAvancados, temExportarCSV, loading: loadingPlano } = usePlano();

  const [periodo, setPeriodo] = useState<Periodo>("7d");
  const [movimentos, setMovimentos] = useState<MovimentoRelatorio[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (feedback = false) => {
    feedback ? setAtualizando(true) : setLoading(true);
    setErro(null);
    const inicio = inicioDoPeriodo(periodo);

    try {
      const [movimentosRes, produtosRes] = await Promise.all([
        supabase
          .from("movimentos_estoque")
          .select("*, produto:produto_id(*)")
          .gte("criado_em", inicio.toISOString())
          .order("criado_em", { ascending: false })
          .limit(5000),
        supabase.from("produtos").select("*").order("nome", { ascending: true }),
      ]);

      if (movimentosRes.error || produtosRes.error) {
        console.error("Erro nos relatórios:", movimentosRes.error, produtosRes.error);
        setErro("Não foi possível carregar todos os dados do relatório.");
      }

      setMovimentos((movimentosRes.data as unknown as MovimentoRelatorio[] | null) ?? []);
      setProdutos((produtosRes.data as Produto[] | null) ?? []);

      if (feedback && !movimentosRes.error && !produtosRes.error) {
        addNotification("Relatórios atualizados.", "success", 1800);
      }
    } catch (error) {
      console.error("Erro inesperado nos relatórios:", error);
      setErro("Ocorreu um erro inesperado ao carregar os relatórios.");
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  }, [addNotification, periodo]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const vendas = useMemo(() => movimentos.filter(movimentoEhVenda), [movimentos]);
  const perdas = useMemo(() => movimentos.filter(movimentoEhPerda), [movimentos]);
  const entradas = useMemo(() => movimentos.filter((item) => item.tipo_movimento === "entrada"), [movimentos]);
  const saidasNaoClassificadas = useMemo(
    () => movimentos.filter((item) => item.tipo_movimento === "saida" && !movimentoEhVenda(item) && !movimentoEhPerda(item)),
    [movimentos],
  );

  const produtosAtivos = useMemo(() => produtos.filter((produto) => produto.ativo !== false), [produtos]);

  const relatorioProdutos = useMemo(() => {
    const mapa = new Map<string, RelatorioProduto>();

    vendas.forEach((movimento) => {
      const produto = movimento.produto ?? produtos.find((item) => item.id === movimento.produto_id);
      const preco = Math.max(numero(produto?.preco_venda), 0);
      const custo = Math.max(numero(produto?.preco_custo), 0);
      const quantidade = Math.max(numero(movimento.quantidade), 0);
      const atual = mapa.get(movimento.produto_id) ?? {
        produto_id: movimento.produto_id,
        produto_nome: produto?.nome ?? "Produto removido",
        categoria: produto?.categoria || "Sem categoria",
        quantidade_vendida: 0,
        valor_estimado: 0,
        custo_estimado: 0,
        resultado_estimado: 0,
        tem_custo: custo > 0,
      };

      atual.quantidade_vendida += quantidade;
      atual.valor_estimado += quantidade * preco;
      atual.custo_estimado += quantidade * custo;
      atual.resultado_estimado += quantidade * (preco - custo);
      atual.tem_custo = atual.tem_custo && custo > 0;
      mapa.set(movimento.produto_id, atual);
    });

    return Array.from(mapa.values()).sort((a, b) => b.valor_estimado - a.valor_estimado);
  }, [produtos, vendas]);

  const movimentosPorDia = useMemo(() => {
    const mapa = new Map<string, MovimentoDiario>();

    movimentos.forEach((movimento) => {
      const data = new Date(movimento.criado_em);
      if (Number.isNaN(data.getTime())) return;
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
      const atual = mapa.get(chave) ?? {
        chave,
        data: data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        entradas: 0,
        saidas: 0,
        vendas: 0,
        perdas: 0,
      };
      const quantidade = Math.max(numero(movimento.quantidade), 0);
      if (movimento.tipo_movimento === "entrada") atual.entradas += quantidade;
      else atual.saidas += quantidade;
      if (movimentoEhVenda(movimento)) atual.vendas += quantidade;
      if (movimentoEhPerda(movimento)) atual.perdas += quantidade;
      mapa.set(chave, atual);
    });

    return Array.from(mapa.values()).sort((a, b) => a.chave.localeCompare(b.chave));
  }, [movimentos]);

  const indicadores = useMemo(() => {
    const valorEstoque = produtosAtivos.reduce(
      (total, produto) => total + Math.max(numero(produto.quantidade_atual), 0) * Math.max(numero(produto.preco_custo), 0),
      0,
    );
    const itensVendidos = vendas.reduce((total, movimento) => total + Math.max(numero(movimento.quantidade), 0), 0);
    const itensRecebidos = entradas.reduce((total, movimento) => total + Math.max(numero(movimento.quantidade), 0), 0);
    const itensPerdidos = perdas.reduce((total, movimento) => total + Math.max(numero(movimento.quantidade), 0), 0);
    const valorPerdas = perdas.reduce((total, movimento) => {
      const produto = movimento.produto ?? produtos.find((item) => item.id === movimento.produto_id);
      return total + Math.max(numero(movimento.quantidade), 0) * Math.max(numero(produto?.preco_custo), 0);
    }, 0);
    const produtosZerados = produtosAtivos.filter((produto) => numero(produto.quantidade_atual) <= 0).length;
    const abaixoMinimo = produtosAtivos.filter((produto) => {
      const atual = numero(produto.quantidade_atual);
      const minimo = numero(produto.quantidade_minima);
      return atual > 0 && minimo > 0 && atual < minimo;
    }).length;
    return { valorEstoque, itensVendidos, itensRecebidos, itensPerdidos, valorPerdas, produtosZerados, abaixoMinimo };
  }, [entradas, perdas, produtos, produtosAtivos, vendas]);

  const produtosSemCusto = useMemo(
    () => produtosAtivos.filter((produto) => numero(produto.preco_custo) <= 0).length,
    [produtosAtivos],
  );

  const exportarVendas = () => {
    if (!temExportarCSV) {
      addNotification("Exportação disponível no plano Profissional.", "warning");
      return;
    }
    exportVendasCSV(
      relatorioProdutos.map((item) => ({
        produto_id: item.produto_id,
        produto_nome: item.produto_nome,
        categoria: item.categoria,
        quantidade_vendida: item.quantidade_vendida,
        valor_total: item.valor_estimado,
        custo_total: item.custo_estimado,
        lucro: item.resultado_estimado,
        tem_custo: item.tem_custo,
      })),
      "vendas",
      periodo,
    );
    addNotification("Relatório de vendas exportado.", "success", 2000);
  };

  const exportarMovimentos = () => {
    if (!temExportarCSV) {
      addNotification("Exportação disponível no plano Profissional.", "warning");
      return;
    }
    exportMovimentosDiariosCSV(movimentosPorDia, periodo);
    addNotification("Movimentações exportadas.", "success", 2000);
  };

  if (loading || loadingPlano) {
    return <div className="flex min-h-[400px] items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-emerald-600" /><span className="sr-only">Carregando relatórios</span></div>;
  }

  if (!temRelatoriosAvancados) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 pb-8">
        <PageHeader eyebrow="ANÁLISE DO ESTOQUE" title="Relatórios" description="Acompanhe entradas e saídas do período." icon={BarChart3} />
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((item) => (
            <button key={item.value} type="button" onClick={() => setPeriodo(item.value)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${periodo === item.value ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>{item.label}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <KPICard label="Itens recebidos" valor={indicadores.itensRecebidos} icon={ArrowDownLeft} cor="emerald" />
          <KPICard label="Itens retirados" valor={movimentos.filter((m) => m.tipo_movimento === "saida").reduce((t, m) => t + numero(m.quantidade), 0)} icon={ArrowUpRight} cor="gray" />
        </div>
        <UpgradeBlock titulo="Desbloqueie os relatórios completos" descricao="Veja vendas identificadas, perdas, valor do estoque, produtos prioritários, gráficos e exportação CSV." planoNecessario="profissional" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-6 overflow-x-clip pb-8">
      <PageHeader
        eyebrow="ANÁLISE DO ESTOQUE"
        title="Relatórios"
        description="Entenda as movimentações, vendas identificadas, perdas e prioridades do estoque."
        icon={BarChart3}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void carregar(true)} disabled={atualizando} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} /> Atualizar
            </button>
            {temExportarCSV ? (
              <button type="button" onClick={exportarMovimentos} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><Download className="h-4 w-4" /> Exportar</button>
            ) : (
              <Link href="/assinar" className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"><Crown className="h-4 w-4" /> Exportar</Link>
            )}
          </div>
        }
      />

      <div className="flex overflow-x-auto rounded-lg bg-gray-100 p-1 dark:bg-gray-800 sm:w-fit">
        {PERIODOS.map((item) => (
          <button key={item.value} type="button" onClick={() => setPeriodo(item.value)} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${periodo === item.value ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>{item.label}</button>
        ))}
      </div>

      {erro && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"><AlertCircle className="mt-0.5 h-5 w-5" />{erro}</div>}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        <strong>Leitura responsável:</strong> vendas são apenas saídas identificadas como “Venda” ou geradas pelo PDV. Valores de venda, custo e perda são estimativas calculadas com os preços atuais dos produtos, pois as movimentações antigas não guardam o preço histórico.
      </div>

      {produtosSemCusto > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"><AlertTriangle className="mr-2 inline h-4 w-4" /><strong>{produtosSemCusto} produto(s)</strong> não possuem preço de custo. O valor do estoque e das perdas pode ficar incompleto.</div>}

      <section aria-label="Indicadores do relatório" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard label="Valor do estoque a custo" valor={formatarMoeda(indicadores.valorEstoque)} icon={Wallet} cor="emerald" descricao="Saldo atual dos produtos ativos" />
        <KPICard label="Itens recebidos" valor={indicadores.itensRecebidos} icon={ArrowDownLeft} cor="emerald" />
        <KPICard label="Itens vendidos" valor={indicadores.itensVendidos} icon={ShoppingCart} cor="blue" descricao="Somente vendas identificadas" />
        <KPICard label="Itens perdidos" valor={indicadores.itensPerdidos} icon={PackageX} cor={indicadores.itensPerdidos > 0 ? "red" : "gray"} destaque={indicadores.itensPerdidos > 0} descricao={formatarMoeda(indicadores.valorPerdas)} />
        <KPICard label="Produtos zerados" valor={indicadores.produtosZerados} icon={PackageX} cor={indicadores.produtosZerados > 0 ? "red" : "emerald"} destaque={indicadores.produtosZerados > 0} />
        <KPICard label="Abaixo do mínimo" valor={indicadores.abaixoMinimo} icon={AlertTriangle} cor={indicadores.abaixoMinimo > 0 ? "amber" : "emerald"} destaque={indicadores.abaixoMinimo > 0} />
      </section>

      {saidasNaoClassificadas.length > 0 && <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300"><strong>{saidasNaoClassificadas.length} saída(s) não classificada(s)</strong> não foram consideradas vendas nem perdas. Isso evita apresentar números enganosos.</div>}

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="mb-5">
          <h2 className="font-bold text-gray-900 dark:text-white">Movimentações por dia</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Entradas, saídas, vendas identificadas e perdas registradas.</p>
        </div>
        {movimentosPorDia.length === 0 ? <p className="py-12 text-center text-sm text-gray-500">Sem movimentações no período.</p> : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={movimentosPorDia}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
              <XAxis dataKey="data" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="vendas" name="Vendas" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="perdas" name="Perdas" fill="#ef4444" radius={[4,4,0,0]} />
              <Bar dataKey="saidas" name="Todas as saídas" fill="#9ca3af" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-bold text-gray-900 dark:text-white">Produtos vendidos pelo PDV ou classificados como venda</h2><p className="text-xs text-gray-500 dark:text-gray-400">Valores estimados com os preços atuais.</p></div>
          <button type="button" onClick={exportarVendas} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"><Download className="h-4 w-4" /> Exportar vendas</button>
        </div>
        {relatorioProdutos.length === 0 ? <p className="py-12 text-center text-sm text-gray-500">Nenhuma venda identificada no período.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead><tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800"><th className="px-3 py-3 text-left">Produto</th><th className="px-3 py-3 text-left">Categoria</th><th className="px-3 py-3 text-right">Quantidade</th><th className="px-3 py-3 text-right">Venda estimada</th><th className="px-3 py-3 text-right">Custo estimado</th><th className="px-3 py-3 text-right">Resultado estimado</th></tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {relatorioProdutos.map((item) => <tr key={item.produto_id} className="text-sm"><td className="px-3 py-3 font-semibold text-gray-900 dark:text-white">{item.produto_nome}</td><td className="px-3 py-3 text-gray-500 dark:text-gray-400">{item.categoria}</td><td className="px-3 py-3 text-right">{item.quantidade_vendida}</td><td className="px-3 py-3 text-right">{formatarMoeda(item.valor_estimado)}</td><td className="px-3 py-3 text-right">{item.tem_custo ? formatarMoeda(item.custo_estimado) : "Incompleto"}</td><td className="px-3 py-3 text-right font-semibold text-gray-900 dark:text-white">{item.tem_custo ? formatarMoeda(item.resultado_estimado) : "Incompleto"}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-800 dark:bg-violet-900/10">
        <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"><BarChart3 className="h-5 w-5" /></div><div><h2 className="font-bold text-gray-900 dark:text-white">Raio-X Inteligente</h2><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Em breve, estes indicadores serão transformados em prioridades e ações recomendadas para o estoque.</p></div></div>
      </section>
    </div>
  );
}
