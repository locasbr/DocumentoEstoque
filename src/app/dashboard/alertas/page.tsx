"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Check,
  CheckCircle2,
  Loader2,
  Package,
  PackageCheck,
  Search,
  Trash2,
  X,
} from "lucide-react";

import PageHeader from "@/components/page-header";
import { useNotification } from "@/contexts/NotificationContext";
import { supabase } from "@/lib/supabase";
import type { Alerta } from "@/lib/types";
import { formatarData } from "@/lib/utils";

type Filtro = "todos" | "nao_visualizados" | "visualizados";
type Ordenacao = "recente" | "antigo" | "urgencia";
type CorKPI = "blue" | "red" | "amber" | "green";

interface ModalState {
  titulo: string;
  descricao: string;
  textoBotao: string;
  cor: "red" | "green";
  onConfirmar: () => Promise<void>;
}

interface KPIProps {
  label: string;
  value: number;
  icon: LucideIcon;
  cor: CorKPI;
  destaque?: boolean;
}

const PALETA: Record<CorKPI, { bg: string; text: string; border: string }> = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  green: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
};

function KPICard({ label, value, icon: Icon, cor, destaque = false }: KPIProps) {
  const palette = PALETA[cor];

  return (
    <article
      className={`rounded-xl border bg-white p-4 dark:bg-gray-900 ${
        destaque ? palette.border : "border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${palette.bg}`}>
        <Icon aria-hidden="true" className={`h-4 w-4 ${palette.text}`} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </article>
  );
}

function SkeletonAlerta() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  );
}

function ModalConfirmacao({
  modal,
  processando,
  onFechar,
}: {
  modal: ModalState | null;
  processando: boolean;
  onFechar: () => void;
}) {
  useEffect(() => {
    if (!modal) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !processando) onFechar();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [modal, processando, onFechar]);

  if (!modal) return null;

  const perigo = modal.cor === "red";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !processando) onFechar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-alerta-titulo"
        aria-describedby="modal-alerta-descricao"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              perigo
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            }`}
          >
            {perigo ? <Trash2 className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="modal-alerta-titulo" className="text-lg font-bold text-gray-900 dark:text-white">
              {modal.titulo}
            </h2>
            <p id="modal-alerta-descricao" className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {modal.descricao}
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            disabled={processando}
            onClick={onFechar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            disabled={processando}
            onClick={onFechar}
            className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={processando}
            onClick={() => void modal.onConfirmar()}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
              perigo ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {processando && <Loader2 className="h-4 w-4 animate-spin" />}
            {processando ? "Processando..." : modal.textoBotao}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AlertasPage() {
  const { addNotification } = useNotification();

  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("nao_visualizados");
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("urgencia");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<ModalState | null>(null);
  const [processando, setProcessando] = useState(false);
  const [realtimeAtivo, setRealtimeAtivo] = useState(false);

  const fetchAlertas = useCallback(async () => {
    setErroCarregamento(null);

    try {
      const { data, error } = await supabase
        .from("alertas")
        .select("*, produto:produto_id(*)")
        .order("criado_em", { ascending: false });

      if (error) {
        console.error("Erro ao carregar alertas:", error);
        setErroCarregamento("Não foi possível carregar os alertas.");
        return;
      }

      setAlertas((data as Alerta[] | null) ?? []);
    } catch (error) {
      console.error("Erro inesperado ao carregar alertas:", error);
      setErroCarregamento("Ocorreu um erro inesperado ao carregar os alertas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAlertas();

    const canal = supabase
      .channel("alertas-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alertas" },
        () => void fetchAlertas(),
      )
      .subscribe((status) => setRealtimeAtivo(status === "SUBSCRIBED"));

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [fetchAlertas]);

  useEffect(() => {
    setSelecionados(new Set());
  }, [filtro, busca, ordenacao]);

  const stats = useMemo(() => {
    const pendentes = alertas.filter((alerta) => !alerta.visualizado);

    return {
      total: alertas.length,
      pendentes: pendentes.length,
      criticos: pendentes.filter((alerta) => alerta.tipo_alerta === "estoque_critico").length,
      baixos: pendentes.filter((alerta) => alerta.tipo_alerta === "estoque_baixo").length,
    };
  }, [alertas]);

  const alertasFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return alertas
      .filter((alerta) => {
        if (filtro === "nao_visualizados" && alerta.visualizado) return false;
        if (filtro === "visualizados" && !alerta.visualizado) return false;
        if (termo && !alerta.produto?.nome?.toLocaleLowerCase("pt-BR").includes(termo)) return false;
        return true;
      })
      .sort((a, b) => {
        const dataA = new Date(a.criado_em).getTime() || 0;
        const dataB = new Date(b.criado_em).getTime() || 0;

        if (ordenacao === "antigo") return dataA - dataB;
        if (ordenacao === "urgencia" && a.tipo_alerta !== b.tipo_alerta) {
          return a.tipo_alerta === "estoque_critico" ? -1 : 1;
        }
        return dataB - dataA;
      });
  }, [alertas, busca, filtro, ordenacao]);

  const todosSelecionados =
    alertasFiltrados.length > 0 &&
    alertasFiltrados.every((alerta) => selecionados.has(alerta.id));

  const atualizarLocalmente = (ids: string[], visualizado: boolean) => {
    const conjunto = new Set(ids);
    setAlertas((atuais) =>
      atuais.map((alerta) =>
        conjunto.has(alerta.id) ? { ...alerta, visualizado } : alerta,
      ),
    );
  };

  const marcarComoVistos = async (ids: string[]) => {
    if (ids.length === 0) return;

    setProcessando(true);
    try {
      const { error } = await supabase
        .from("alertas")
        .update({ visualizado: true })
        .in("id", ids);

      if (error) {
        console.error("Erro ao marcar alertas:", error);
        addNotification("Não foi possível marcar os alertas.", "error");
        return;
      }

      atualizarLocalmente(ids, true);
      setSelecionados(new Set());
      setModal(null);
      addNotification("Alertas marcados como visualizados.", "success", 2200);
    } finally {
      setProcessando(false);
    }
  };

  const excluirAlertas = async (ids: string[]) => {
    if (ids.length === 0) return;

    setProcessando(true);
    try {
      const { error } = await supabase.from("alertas").delete().in("id", ids);

      if (error) {
        console.error("Erro ao excluir alertas:", error);
        addNotification("Não foi possível excluir os alertas.", "error");
        return;
      }

      const conjunto = new Set(ids);
      setAlertas((atuais) => atuais.filter((alerta) => !conjunto.has(alerta.id)));
      setSelecionados(new Set());
      setModal(null);
      addNotification("Alertas removidos.", "success", 2200);
    } finally {
      setProcessando(false);
    }
  };

  const toggleSelecao = (id: string) => {
    setSelecionados((atuais) => {
      const proximo = new Set(atuais);
      proximo.has(id) ? proximo.delete(id) : proximo.add(id);
      return proximo;
    });
  };

  const toggleSelecionarTodos = () => {
    setSelecionados((atuais) => {
      const proximo = new Set(atuais);
      if (todosSelecionados) {
        alertasFiltrados.forEach((alerta) => proximo.delete(alerta.id));
      } else {
        alertasFiltrados.forEach((alerta) => proximo.add(alerta.id));
      }
      return proximo;
    });
  };

  const abrirConfirmacaoMarcarTodos = () => {
    const ids = alertas.filter((alerta) => !alerta.visualizado).map((alerta) => alerta.id);
    if (ids.length === 0) {
      addNotification("Não existem alertas pendentes.", "info", 1800);
      return;
    }

    setModal({
      titulo: `Marcar ${ids.length} alerta(s) como visualizados?`,
      descricao: "Os alertas continuarão no histórico, mas deixarão de aparecer como pendentes.",
      textoBotao: "Marcar todos",
      cor: "green",
      onConfirmar: () => marcarComoVistos(ids),
    });
  };

  return (
    <div className="min-w-0 space-y-6 overflow-x-clip pb-8">
      <PageHeader
        eyebrow="ATENÇÃO DO ESTOQUE"
        title="Alertas"
        description="Veja os produtos que estão zerados ou abaixo do estoque mínimo e tome uma ação."
        icon={Bell}
        actions={
          stats.pendentes > 0 ? (
            <button
              type="button"
              onClick={abrirConfirmacaoMarcarTodos}
              disabled={processando}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Marcar todos como vistos
            </button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className={`h-2 w-2 rounded-full ${realtimeAtivo ? "bg-emerald-500" : "bg-gray-400"}`} />
        {realtimeAtivo ? "Atualização automática ativa" : "Conectando atualização automática"}
      </div>

      {erroCarregamento && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p>{erroCarregamento}</p>
            <button type="button" onClick={() => void fetchAlertas()} className="mt-2 text-xs font-semibold underline">
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      <section aria-label="Indicadores dos alertas" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Alertas pendentes" value={stats.pendentes} icon={Bell} cor={stats.pendentes > 0 ? "amber" : "green"} destaque={stats.pendentes > 0} />
        <KPICard label="Produtos zerados" value={stats.criticos} icon={AlertCircle} cor={stats.criticos > 0 ? "red" : "green"} destaque={stats.criticos > 0} />
        <KPICard label="Abaixo do mínimo" value={stats.baixos} icon={AlertTriangle} cor={stats.baixos > 0 ? "amber" : "green"} destaque={stats.baixos > 0} />
        <KPICard label="Total no histórico" value={stats.total} icon={Package} cor="blue" />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome do produto..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {busca && (
              <button type="button" aria-label="Limpar busca" onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex overflow-x-auto rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            {[
              { id: "nao_visualizados" as const, label: "Pendentes", count: stats.pendentes },
              { id: "todos" as const, label: "Todos", count: stats.total },
              { id: "visualizados" as const, label: "Vistos", count: stats.total - stats.pendentes },
            ].map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setFiltro(item.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${
                  filtro === item.id
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {item.label}
                <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] dark:bg-gray-700">{item.count}</span>
              </button>
            ))}
          </div>

          <div className="relative sm:min-w-[175px]">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={ordenacao}
              onChange={(event) => setOrdenacao(event.target.value as Ordenacao)}
              aria-label="Ordenar alertas"
              className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-8 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="urgencia">Por urgência</option>
              <option value="recente">Mais recentes</option>
              <option value="antigo">Mais antigos</option>
            </select>
          </div>
        </div>
      </section>

      {selecionados.size > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">{selecionados.size} selecionado(s)</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setModal({
                  titulo: "Marcar selecionados como visualizados?",
                  descricao: "Os alertas selecionados continuarão no histórico.",
                  textoBotao: "Marcar",
                  cor: "green",
                  onConfirmar: () => marcarComoVistos(Array.from(selecionados)),
                })
              }
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Marcar como vistos
            </button>
            <button
              type="button"
              onClick={() =>
                setModal({
                  titulo: "Excluir alertas selecionados?",
                  descricao: "Esta ação remove os alertas do histórico e não pode ser desfeita.",
                  textoBotao: "Excluir",
                  cor: "red",
                  onConfirmar: () => excluirAlertas(Array.from(selecionados)),
                })
              }
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
            >
              Excluir
            </button>
            <button type="button" onClick={() => setSelecionados(new Set())} className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-900/30">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <SkeletonAlerta key={index} />)}</div>
      ) : alertasFiltrados.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <PackageCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="font-bold text-gray-900 dark:text-white">
            {busca ? "Nenhum alerta encontrado" : filtro === "nao_visualizados" ? "Nenhuma pendência no momento" : "Nenhum alerta no histórico"}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {busca ? "Tente buscar por outro produto." : "Os alertas de estoque baixo ou zerado aparecerão aqui."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <button type="button" onClick={toggleSelecionarTodos} className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <span className={`flex h-5 w-5 items-center justify-center rounded border-2 ${todosSelecionados ? "border-blue-600 bg-blue-600" : "border-gray-300 dark:border-gray-600"}`}>
                {todosSelecionados && <Check className="h-3.5 w-3.5 text-white" />}
              </span>
              {todosSelecionados ? "Desmarcar todos" : "Selecionar todos"}
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">{alertasFiltrados.length} resultado(s)</span>
          </div>

          {alertasFiltrados.map((alerta) => {
            const critico = alerta.tipo_alerta === "estoque_critico";
            const selecionado = selecionados.has(alerta.id);
            const atual = alerta.produto?.quantidade_atual;
            const minimo = alerta.produto?.quantidade_minima;

            return (
              <article
                key={alerta.id}
                className={`rounded-xl border bg-white p-4 dark:bg-gray-900 ${
                  selecionado
                    ? "border-blue-400 ring-2 ring-blue-500/20 dark:border-blue-700"
                    : alerta.visualizado
                      ? "border-gray-200 opacity-70 dark:border-gray-800"
                      : critico
                        ? "border-red-200 dark:border-red-900/60"
                        : "border-amber-200 dark:border-amber-900/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button type="button" aria-label={`Selecionar alerta de ${alerta.produto?.nome ?? "produto"}`} aria-pressed={selecionado} onClick={() => toggleSelecao(alerta.id)} className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${selecionado ? "border-blue-600 bg-blue-600" : "border-gray-300 dark:border-gray-600"}`}>
                    {selecionado && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>

                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${critico ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                    {critico ? <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" /> : <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words text-sm font-bold text-gray-900 dark:text-white">{alerta.produto?.nome ?? "Produto removido"}</h2>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${critico ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                        {critico ? "Estoque zerado" : "Abaixo do mínimo"}
                      </span>
                      {alerta.visualizado && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">Visualizado</span>}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Atual: <strong className={critico ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}>{atual ?? "?"}</strong></span>
                      <span className="text-gray-500 dark:text-gray-400">Mínimo: <strong className="text-gray-800 dark:text-gray-200">{minimo ?? "?"}</strong></span>
                      <span className="text-gray-400">{formatarData(alerta.criado_em)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    {alerta.produto?.id && (
                      <Link
                        href={`/dashboard/estoque/movimento?tipo=entrada&produto=${alerta.produto.id}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <Package className="h-3.5 w-3.5" />
                        Repor
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                    {!alerta.visualizado && (
                      <button type="button" aria-label="Marcar como visualizado" disabled={processando} onClick={() => void marcarComoVistos([alerta.id])} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30">
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Excluir alerta"
                      disabled={processando}
                      onClick={() =>
                        setModal({
                          titulo: "Excluir alerta?",
                          descricao: `O alerta de “${alerta.produto?.nome ?? "produto"}” será removido do histórico.`,
                          textoBotao: "Excluir",
                          cor: "red",
                          onConfirmar: () => excluirAlertas([alerta.id]),
                        })
                      }
                      className="rounded-lg p-2 text-red-600 hover:bg-red-100 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {processando && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-2xl dark:bg-white dark:text-gray-900">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processando...
        </div>
      )}

      <ModalConfirmacao
        modal={modal}
        processando={processando}
        onFechar={() => {
          if (!processando) setModal(null);
        }}
      />
    </div>
  );
}
