"use client";

import { useEffect } from "react";
import type { ProdutoBarcode } from "@/lib/barcode-api";
import {
  CheckCircle2,
  Loader2,
  Package,
  Search,
  X,
} from "lucide-react";

interface Props {
  codigo: string;
  produto: ProdutoBarcode;
  loading: boolean;
  onConfirmar: (produto: ProdutoBarcode) => void;
  onCancelar: () => void;
}

export default function BarcodeProductModal({
  codigo,
  produto,
  loading,
  onConfirmar,
  onCancelar,
}: Props) {
  useEffect(() => {
    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onCancelar();
      }
    };

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [loading, onCancelar]);

  const confirmarProduto = () => {
    if (loading || !produto.encontrado) {
      return;
    }

    onConfirmar(produto);
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onCancelar();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="barcode-modal-title"
        aria-describedby="barcode-modal-description"
        className="w-full max-w-md overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 md:rounded-3xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
              LEITURA DE CÓDIGO
            </p>

            <h2
              id="barcode-modal-title"
              className="mt-0.5 text-lg font-extrabold text-gray-900 dark:text-white"
            >
              Código detectado
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancelar}
            disabled={loading}
            aria-label="Fechar consulta do código de barras"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <div className="p-5">
          <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
              Código lido
            </p>

            <p className="mt-1 break-all font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
              {codigo}
            </p>
          </div>

          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center px-4 py-8 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                <Loader2
                  aria-hidden="true"
                  className="h-7 w-7 animate-spin text-blue-600 dark:text-blue-400"
                />
              </div>

              <h3 className="mt-4 font-bold text-gray-900 dark:text-white">
                Buscando informações
              </h3>

              <p className="mt-1 max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Consultando as bases públicas de produtos.
              </p>

              <span className="sr-only">
                Buscando informações do produto
              </span>
            </div>
          ) : produto.encontrado ? (
            <div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800 dark:bg-emerald-900/10">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-gray-800 dark:text-emerald-400">
                    <Package
                      aria-hidden="true"
                      className="h-7 w-7"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                      />

                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Produto encontrado
                      </span>
                    </div>

                    <h3 className="break-words text-base font-extrabold text-gray-900 dark:text-white">
                      {produto.nome}
                    </h3>

                    {produto.marca && (
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        Marca:{" "}
                        <strong>{produto.marca}</strong>
                      </p>
                    )}

                    {produto.descricao && (
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                        {produto.descricao}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {produto.categoria && (
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {produto.categoria}
                        </span>
                      )}

                      {produto.fonte && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          Fonte: {produto.fonte}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                id="barcode-modal-description"
                className="mt-5 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Preencher o formulário?
                </p>

                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  Nome, marca, descrição e categoria serão preenchidos
                  automaticamente. Quantidade, preços e validade continuarão
                  sob seu controle.
                </p>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onCancelar}
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Preencher manualmente
                </button>

                <button
                  type="button"
                  onClick={confirmarProduto}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                  Usar informações
                </button>
              </div>

              <p className="mt-4 text-center text-[10px] leading-relaxed text-gray-400">
                Revise as informações antes de salvar. Os dados são obtidos de
                bases públicas e podem estar incompletos.
              </p>
            </div>
          ) : (
            <div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center dark:border-amber-800 dark:bg-amber-900/15">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40">
                  <Search
                    aria-hidden="true"
                    className="h-7 w-7 text-amber-600 dark:text-amber-400"
                  />
                </div>

                <h3 className="mt-4 font-extrabold text-gray-900 dark:text-white">
                  Produto não encontrado
                </h3>

                <p
                  id="barcode-modal-description"
                  className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300"
                >
                  Esse código não foi localizado nas bases públicas
                  consultadas.
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/15">
                <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
                  O código não será perdido
                </p>

                <p className="mt-1 text-xs leading-relaxed text-blue-700 dark:text-blue-400">
                  O campo SKU já foi preenchido com o código lido. Complete o
                  nome, a categoria, o estoque e os preços manualmente.
                </p>
              </div>

              <button
                type="button"
                onClick={onCancelar}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
              >
                Continuar cadastro manual
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}