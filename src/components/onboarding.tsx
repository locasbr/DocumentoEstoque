"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  PackagePlus,
  RefreshCw,
  SlidersHorizontal,
  Warehouse,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

interface OnboardingProps {
  userId: string;
  possuiProduto: boolean;
  possuiEstoqueMinimo: boolean;
  possuiMovimentacao: boolean;
  onComplete: () => void;
  onRefresh?: () => void | Promise<void>;
}

interface Passo {
  id: "produto" | "minimo" | "movimentacao" | "reposicao";
  titulo: string;
  descricao: string;
  cta: string;
  href: string;
  icon: LucideIcon;
  concluido: boolean;
}

export default function Onboarding({
  userId,
  possuiProduto,
  possuiEstoqueMinimo,
  possuiMovimentacao,
  onComplete,
  onRefresh,
}: OnboardingProps) {
  const [finalizando, setFinalizando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const passos = useMemo<Passo[]>(
    () => [
      {
        id: "produto",
        titulo: "Cadastre seu primeiro produto",
        descricao:
          "Informe nome, SKU, quantidade atual, estoque mínimo e preços.",
        cta: "Cadastrar produto",
        href: "/dashboard/produtos/novo",
        icon: PackagePlus,
        concluido: possuiProduto,
      },
      {
        id: "minimo",
        titulo: "Defina o estoque mínimo",
        descricao:
          "O estoque mínimo permite que Alertas e Reposição mostrem onde agir.",
        cta: possuiProduto ? "Revisar produtos" : "Cadastrar produto",
        href: possuiProduto
          ? "/dashboard/produtos"
          : "/dashboard/produtos/novo",
        icon: SlidersHorizontal,
        concluido: possuiEstoqueMinimo,
      },
      {
        id: "movimentacao",
        titulo: "Registre a primeira movimentação",
        descricao:
          "Registre uma entrada ou saída para manter o saldo e o histórico atualizados.",
        cta: "Registrar movimentação",
        href: "/dashboard/estoque/movimento",
        icon: Warehouse,
        concluido: possuiMovimentacao,
      },
      {
        id: "reposicao",
        titulo: "Consulte as prioridades do estoque",
        descricao:
          "Veja os produtos zerados ou abaixo do mínimo na lista de Reposição.",
        cta: "Ver reposição",
        href: "/dashboard/reposicao",
        icon: ClipboardCheck,
        concluido:
          possuiProduto && possuiEstoqueMinimo && possuiMovimentacao,
      },
    ],
    [possuiEstoqueMinimo, possuiMovimentacao, possuiProduto],
  );

  const etapasConcluidas = passos.filter((passo) => passo.concluido).length;
  const progresso = Math.round((etapasConcluidas / passos.length) * 100);
  const jornadaPronta =
    possuiProduto && possuiEstoqueMinimo && possuiMovimentacao;

  const finalizar = async () => {
    if (finalizando) return;

    setFinalizando(true);
    setErro("");

    try {
      const { error } = await supabase
        .from("perfis")
        .update({ onboarding_completo: true })
        .eq("id", userId);

      if (error) {
        console.error("Erro ao concluir onboarding:", error);
        setErro("Não foi possível concluir os primeiros passos. Tente novamente.");
        return;
      }

      onComplete();
    } catch (error) {
      console.error("Erro inesperado ao concluir onboarding:", error);
      setErro("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setFinalizando(false);
    }
  };

  const atualizar = async () => {
    if (!onRefresh || atualizando) return;

    setAtualizando(true);
    setErro("");

    try {
      await onRefresh();
    } catch (error) {
      console.error("Erro ao atualizar onboarding:", error);
      setErro("Não foi possível atualizar o progresso.");
    } finally {
      setAtualizando(false);
    }
  };

  return (
    <section
      aria-labelledby="onboarding-title"
      className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-900/60 dark:bg-gray-900"
    >
      <header className="border-b border-gray-100 bg-emerald-50/70 p-5 dark:border-gray-800 dark:bg-emerald-900/10 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
                  PRIMEIROS PASSOS
                </p>
                <h2
                  id="onboarding-title"
                  className="mt-1 text-lg font-bold text-gray-900 dark:text-white"
                >
                  Prepare seu EstoqueSystem
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  Complete estas etapas para transformar os cadastros em alertas,
                  reposição e informações úteis para o estoque.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void finalizar()}
                disabled={finalizando}
                aria-label="Ocultar primeiros passos"
                title="Ocultar primeiros passos"
                className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                {finalizando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <X className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {etapasConcluidas} de {passos.length} etapas concluídas
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {progresso}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-[width] duration-300"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6">
        {erro && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{erro}</p>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {passos.map((passo, indice) => {
            const Icon = passo.icon;

            return (
              <article
                key={passo.id}
                className={`rounded-xl border p-4 ${
                  passo.concluido
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-900/10"
                    : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      passo.concluido
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {passo.concluido ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      Etapa {indice + 1}
                    </p>
                    <h3 className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                      {passo.titulo}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                      {passo.descricao}
                    </p>

                    {passo.concluido ? (
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Concluído com dados reais
                      </span>
                    ) : (
                      <Link
                        href={passo.href}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {passo.cta}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            O progresso é verificado pelos produtos e movimentações da sua conta.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            {onRefresh && (
              <button
                type="button"
                onClick={() => void atualizar()}
                disabled={atualizando || finalizando}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    atualizando ? "animate-spin" : ""
                  }`}
                />
                Atualizar progresso
              </button>
            )}

            <button
              type="button"
              onClick={() => void finalizar()}
              disabled={finalizando}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50 ${
                jornadaPronta
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {finalizando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {jornadaPronta ? "Concluir primeiros passos" : "Ocultar por agora"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
