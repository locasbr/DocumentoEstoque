"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  X,
} from "lucide-react";

import PageHeader from "@/components/page-header";
import { useNotification } from "@/contexts/NotificationContext";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/lib/types";

type TipoMovimento = "entrada" | "saida";

type MotivoEntrada =
  | "Compra de fornecedor"
  | "Devolução de cliente"
  | "Estoque inicial"
  | "Ajuste de inventário"
  | "Brinde ou doação"
  | "Outra entrada";

type MotivoSaida =
  | "Venda"
  | "Perda"
  | "Produto vencido"
  | "Avaria"
  | "Consumo interno"
  | "Devolução ao fornecedor"
  | "Ajuste de inventário"
  | "Outra saída";

type MotivoMovimento = MotivoEntrada | MotivoSaida;

interface ResultadoMovimento {
  nome: string;
  novaQuantidade: number;
  tipo: TipoMovimento;
  motivo: MotivoMovimento;
}

interface MovimentoInserido {
  id: string;
}

const MOTIVOS: Record<
  TipoMovimento,
  ReadonlyArray<{ label: string; valor: MotivoMovimento }>
> = {
  entrada: [
    { label: "Compra de fornecedor", valor: "Compra de fornecedor" },
    { label: "Devolução de cliente", valor: "Devolução de cliente" },
    { label: "Estoque inicial", valor: "Estoque inicial" },
    { label: "Ajuste de inventário", valor: "Ajuste de inventário" },
    { label: "Brinde ou doação", valor: "Brinde ou doação" },
    { label: "Outra entrada", valor: "Outra entrada" },
  ],
  saida: [
    { label: "Venda", valor: "Venda" },
    { label: "Perda", valor: "Perda" },
    { label: "Produto vencido", valor: "Produto vencido" },
    { label: "Avaria", valor: "Avaria" },
    { label: "Consumo interno", valor: "Consumo interno" },
    {
      label: "Devolução ao fornecedor",
      valor: "Devolução ao fornecedor",
    },
    { label: "Ajuste de inventário", valor: "Ajuste de inventário" },
    { label: "Outra saída", valor: "Outra saída" },
  ],
};

function normalizarNumero(valor: unknown): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function NovoMovimentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addNotification } = useNotification();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [erroProdutos, setErroProdutos] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoMovimento | null>(null);

  const [produtoBusca, setProdutoBusca] = useState("");
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [tipoMovimento, setTipoMovimento] =
    useState<TipoMovimento>("entrada");
  const [quantidade, setQuantidade] = useState(0);
  const [motivo, setMotivo] = useState<MotivoMovimento | "">("");
  const [observacao, setObservacao] = useState("");

  const buscaInputRef = useRef<HTMLInputElement>(null);
  const quantidadeInputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  const carregarProdutos = useCallback(async () => {
    setLoadingProdutos(true);
    setErroProdutos(null);

    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) {
        console.error("Erro ao carregar produtos:", error);
        setErroProdutos("Não foi possível carregar os produtos.");
        setProdutos([]);
        return;
      }

      setProdutos((data as Produto[] | null) ?? []);
    } catch (error) {
      console.error("Erro inesperado ao carregar produtos:", error);
      setErroProdutos("Ocorreu um erro inesperado ao carregar os produtos.");
      setProdutos([]);
    } finally {
      setLoadingProdutos(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  useEffect(() => {
    const tipo = searchParams.get("tipo");
    const produtoId = searchParams.get("produto");

    if (tipo === "entrada" || tipo === "saida") {
      setTipoMovimento(tipo);
      setMotivo("");
    }

    if (produtoId && produtos.length > 0) {
      const produto = produtos.find((item) => item.id === produtoId);
      if (produto) {
        setProdutoSelecionadoId(produto.id);
        setProdutoBusca(produto.nome);
      }
    }
  }, [searchParams, produtos]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        event.preventDefault();
        buscaInputRef.current?.focus();
        buscaInputRef.current?.select();
      }

      if (event.key === "Escape") {
        setMostrarLista(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (
        listaRef.current &&
        !listaRef.current.contains(event.target as Node)
      ) {
        setMostrarLista(false);
      }
    };

    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const produtosFiltrados = useMemo(() => {
    const termo = normalizarTexto(produtoBusca);

    if (!termo) {
      return produtos.slice(0, 50);
    }

    return produtos
      .filter((produto) => {
        const conteudo = normalizarTexto(
          [produto.nome, produto.sku, produto.categoria, produto.marca]
            .filter(Boolean)
            .join(" "),
        );
        return conteudo.includes(termo);
      })
      .slice(0, 50);
  }, [produtoBusca, produtos]);

  const produtoSelecionado = useMemo(
    () => produtos.find((produto) => produto.id === produtoSelecionadoId),
    [produtoSelecionadoId, produtos],
  );

  const estoqueAtual = Math.max(
    normalizarNumero(produtoSelecionado?.quantidade_atual),
    0,
  );
  const estoqueMinimo = Math.max(
    normalizarNumero(produtoSelecionado?.quantidade_minima),
    0,
  );

  const maxQuantidade =
    tipoMovimento === "saida" ? estoqueAtual : Number.POSITIVE_INFINITY;

  const novaQuantidade = produtoSelecionado
    ? tipoMovimento === "entrada"
      ? estoqueAtual + quantidade
      : estoqueAtual - quantidade
    : 0;

  const quantidadeInvalida =
    tipoMovimento === "saida" && quantidade > estoqueAtual;

  const ficaraAbaixoDoMinimo =
    Boolean(produtoSelecionado) &&
    tipoMovimento === "saida" &&
    quantidade > 0 &&
    !quantidadeInvalida &&
    estoqueMinimo > 0 &&
    novaQuantidade < estoqueMinimo;

  const quantidadeParaRepor = Math.max(estoqueMinimo - estoqueAtual, 0);

  const selecionarProduto = useCallback((produto: Produto) => {
    setProdutoSelecionadoId(produto.id);
    setProdutoBusca(produto.nome);
    setMostrarLista(false);
    setQuantidade(0);
    window.setTimeout(() => quantidadeInputRef.current?.focus(), 100);
  }, []);

  const limparProduto = () => {
    setProdutoSelecionadoId("");
    setProdutoBusca("");
    setQuantidade(0);
    setMostrarLista(false);
    window.setTimeout(() => buscaInputRef.current?.focus(), 100);
  };

  const alterarTipo = (tipo: TipoMovimento) => {
    setTipoMovimento(tipo);
    setQuantidade(0);
    setMotivo("");
    setObservacao("");
  };

  const criarOuAtualizarAlerta = async (
    produtoId: string,
    usuarioId: string,
    quantidadeFinal: number,
  ) => {
    if (!produtoSelecionado || estoqueMinimo <= 0) {
      return;
    }

    if (quantidadeFinal >= estoqueMinimo) {
      const { error } = await supabase
        .from("alertas")
        .update({ visualizado: true })
        .eq("produto_id", produtoId)
        .eq("visualizado", false);

      if (error) {
        console.warn("Não foi possível encerrar alertas pendentes:", error);
      }
      return;
    }

    const tipoAlerta =
      quantidadeFinal <= 0 ? "estoque_critico" : "estoque_baixo";

    const { data: alertaExistente, error: buscaAlertaError } = await supabase
      .from("alertas")
      .select("id")
      .eq("produto_id", produtoId)
      .eq("visualizado", false)
      .limit(1)
      .maybeSingle();

    if (buscaAlertaError) {
      console.warn("Não foi possível consultar alertas pendentes:", buscaAlertaError);
      return;
    }

    if (alertaExistente?.id) {
      const { error } = await supabase
        .from("alertas")
        .update({ tipo_alerta: tipoAlerta })
        .eq("id", alertaExistente.id);

      if (error) {
        console.warn("Não foi possível atualizar o alerta:", error);
      }
      return;
    }

    const { error } = await supabase.from("alertas").insert({
      produto_id: produtoId,
      usuario_id: usuarioId,
      tipo_alerta: tipoAlerta,
      visualizado: false,
    });

    if (error) {
      console.warn("Não foi possível criar o alerta:", error);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!produtoSelecionado) {
      addNotification("Selecione um produto.", "warning", 3000);
      buscaInputRef.current?.focus();
      return;
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      addNotification("Informe uma quantidade inteira maior que zero.", "warning", 3000);
      quantidadeInputRef.current?.focus();
      return;
    }

    if (!motivo) {
      addNotification("Selecione o motivo da movimentação.", "warning", 3000);
      return;
    }

    if (quantidadeInvalida) {
      addNotification(
        `Quantidade insuficiente. Disponível: ${estoqueAtual}.`,
        "error",
        4000,
      );
      return;
    }

    setSalvando(true);

    let movimentoCriadoId: string | null = null;

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        addNotification("Usuário não autenticado.", "error");
        return;
      }

      const motivoCompleto = observacao.trim()
        ? `${motivo} | ${observacao.trim()}`
        : motivo;

      const { data: movimentoCriado, error: movimentoError } = await supabase
        .from("movimentos_estoque")
        .insert({
          produto_id: produtoSelecionado.id,
          tipo_movimento: tipoMovimento,
          quantidade,
          motivo: motivoCompleto,
          usuario_id: userData.user.id,
        })
        .select("id")
        .single();

      if (movimentoError) {
        console.error("Erro ao registrar movimento:", movimentoError);
        addNotification("Não foi possível registrar a movimentação.", "error");
        return;
      }

      movimentoCriadoId = (movimentoCriado as MovimentoInserido).id;

      const { data: produtoAtualizado, error: updateError } = await supabase
        .from("produtos")
        .update({ quantidade_atual: novaQuantidade })
        .eq("id", produtoSelecionado.id)
        .eq("quantidade_atual", estoqueAtual)
        .select("id, quantidade_atual")
        .maybeSingle();

      if (updateError || !produtoAtualizado) {
        console.error(
          "Falha ao atualizar quantidade; tentando reverter movimento:",
          updateError,
        );

        const { error: rollbackError } = await supabase
          .from("movimentos_estoque")
          .delete()
          .eq("id", movimentoCriadoId);

        if (rollbackError) {
          console.error("Falha ao reverter movimento:", rollbackError);
          addNotification(
            "Falha crítica: a movimentação foi criada, mas o estoque não foi atualizado. Procure o suporte.",
            "error",
            7000,
          );
        } else {
          addNotification(
            "O estoque foi alterado por outra operação. Atualize a página e tente novamente.",
            "warning",
            6000,
          );
        }
        return;
      }

      await criarOuAtualizarAlerta(
        produtoSelecionado.id,
        userData.user.id,
        novaQuantidade,
      );

      setProdutos((itens) =>
        itens.map((item) =>
          item.id === produtoSelecionado.id
            ? { ...item, quantidade_atual: novaQuantidade }
            : item,
        ),
      );

      setResultado({
        nome: produtoSelecionado.nome,
        novaQuantidade,
        tipo: tipoMovimento,
        motivo,
      });

      addNotification("Movimentação registrada com sucesso.", "success", 2500);
    } catch (error) {
      console.error("Erro inesperado ao registrar movimentação:", error);
      addNotification("Erro inesperado ao registrar a movimentação.", "error");
    } finally {
      setSalvando(false);
    }
  };

  const registrarOutro = () => {
    setResultado(null);
    setQuantidade(0);
    setMotivo("");
    setObservacao("");
    window.setTimeout(() => quantidadeInputRef.current?.focus(), 100);
  };

  if (loadingProdutos) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 pb-12">
        <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-[520px] animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <PageHeader
        eyebrow="GESTÃO DE ESTOQUE"
        title="Nova movimentação"
        description="Registre uma entrada ou saída e mantenha o saldo do produto atualizado."
        icon={Package}
        actions={
          <Link
            href="/dashboard/estoque"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Voltar
          </Link>
        }
      />

      {erroProdutos && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5" />
          <div className="flex-1">
            <p>{erroProdutos}</p>
            <button
              type="button"
              onClick={carregarProdutos}
              className="mt-2 text-xs font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <fieldset>
            <legend className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Tipo de movimentação
            </legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={tipoMovimento === "entrada"}
                onClick={() => alterarTipo("entrada")}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  tipoMovimento === "entrada"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      tipoMovimento === "entrada"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    <ArrowDownLeft aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      Entrada
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Adicionar unidades ao estoque
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                aria-pressed={tipoMovimento === "saida"}
                onClick={() => alterarTipo("saida")}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  tipoMovimento === "saida"
                    ? "border-gray-500 bg-gray-50 dark:bg-gray-800/60"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      tipoMovimento === "saida"
                        ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    <ArrowUpRight aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      Saída
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Retirar unidades do estoque
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </fieldset>
        </section>

        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div ref={listaRef} className="relative">
            <label
              htmlFor="produto-busca"
              className="mb-2 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              <span>Produto *</span>
              <span className="font-normal normal-case text-gray-400">F2 para buscar</span>
            </label>

            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
              <input
                id="produto-busca"
                ref={buscaInputRef}
                type="search"
                autoComplete="off"
                value={produtoBusca}
                onChange={(event) => {
                  setProdutoBusca(event.target.value);
                  setMostrarLista(true);
                  if (!event.target.value) {
                    setProdutoSelecionadoId("");
                    setQuantidade(0);
                  }
                }}
                onFocus={() => setMostrarLista(true)}
                placeholder="Buscar por nome, SKU, marca ou categoria..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {produtoBusca && (
                <button
                  type="button"
                  aria-label="Limpar produto selecionado"
                  onClick={limparProduto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>

            {mostrarLista && (
              <div className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                {produtosFiltrados.length === 0 ? (
                  <div className="p-6 text-center">
                    <Package
                      aria-hidden="true"
                      className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-700"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Nenhum produto encontrado
                    </p>
                    <Link
                      href="/dashboard/produtos/novo"
                      className="mt-2 inline-block text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Cadastrar produto
                    </Link>
                  </div>
                ) : (
                  produtosFiltrados.map((produto) => {
                    const atual = Math.max(
                      normalizarNumero(produto.quantidade_atual),
                      0,
                    );
                    const minimo = Math.max(
                      normalizarNumero(produto.quantidade_minima),
                      0,
                    );
                    const zerado = atual <= 0;
                    const baixo = atual > 0 && minimo > 0 && atual < minimo;

                    return (
                      <button
                        key={produto.id}
                        type="button"
                        onClick={() => selecionarProduto(produto)}
                        className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                      >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                          <Package
                            aria-hidden="true"
                            className="h-4 w-4 text-gray-500 dark:text-gray-400"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {produto.nome}
                          </p>
                          <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                            {produto.sku || "Sem SKU"}
                            {produto.categoria ? ` · ${produto.categoria}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-bold ${
                              zerado
                                ? "text-red-600 dark:text-red-400"
                                : baixo
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {atual}
                          </p>
                          <p className="text-[10px] text-gray-400">em estoque</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {produtoSelecionado && !mostrarLista && (
              <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/15 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400">
                    Estoque atual
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">
                    {estoqueAtual}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400">
                    Estoque mínimo
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">
                    {estoqueMinimo}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400">
                    Categoria
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {produtoSelecionado.categoria || "Sem categoria"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {produtoSelecionado && (
            <>
              <div>
                <label
                  htmlFor="quantidade"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Quantidade *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Diminuir quantidade"
                    onClick={() => setQuantidade((valor) => Math.max(0, valor - 1))}
                    disabled={quantidade <= 0 || salvando}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 disabled:opacity-40 dark:bg-gray-800"
                  >
                    <Minus aria-hidden="true" className="h-5 w-5" />
                  </button>
                  <input
                    id="quantidade"
                    ref={quantidadeInputRef}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    max={
                      tipoMovimento === "saida" ? estoqueAtual : undefined
                    }
                    value={quantidade || ""}
                    onChange={(event) => {
                      const valor = Number.parseInt(event.target.value, 10);
                      setQuantidade(Number.isFinite(valor) ? Math.max(0, valor) : 0);
                    }}
                    className={`min-w-0 flex-1 rounded-xl border-2 bg-white py-3 text-center text-2xl font-bold text-gray-900 outline-none focus:ring-2 dark:bg-gray-900 dark:text-white ${
                      quantidadeInvalida
                        ? "border-red-400 focus:ring-red-500 dark:border-red-700"
                        : "border-gray-200 focus:ring-emerald-500 dark:border-gray-700"
                    }`}
                  />
                  <button
                    type="button"
                    aria-label="Aumentar quantidade"
                    onClick={() =>
                      setQuantidade((valor) =>
                        Math.min(maxQuantidade, valor + 1),
                      )
                    }
                    disabled={quantidade >= maxQuantidade || salvando}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 disabled:opacity-40 dark:bg-gray-800"
                  >
                    <Plus aria-hidden="true" className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 5, 10, 50].map((incremento) => (
                    <button
                      key={incremento}
                      type="button"
                      onClick={() =>
                        setQuantidade((valor) =>
                          Math.min(maxQuantidade, valor + incremento),
                        )
                      }
                      disabled={quantidade + incremento > maxQuantidade || salvando}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 disabled:opacity-40 dark:bg-gray-800 dark:text-gray-300"
                    >
                      +{incremento}
                    </button>
                  ))}
                  {tipoMovimento === "entrada" && quantidadeParaRepor > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantidade(quantidadeParaRepor)}
                      disabled={salvando}
                      className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      Repor mínimo ({quantidadeParaRepor})
                    </button>
                  )}
                  {tipoMovimento === "saida" && estoqueAtual > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantidade(estoqueAtual)}
                      disabled={salvando}
                      className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                    >
                      Todo o estoque ({estoqueAtual})
                    </button>
                  )}
                </div>
              </div>

              {quantidadeInvalida && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4" />
                  <p>
                    Quantidade insuficiente. Existem {estoqueAtual} unidades
                    disponíveis.
                  </p>
                </div>
              )}

              {ficaraAbaixoDoMinimo && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4" />
                  <p>
                    O estoque ficará com {novaQuantidade} unidades, abaixo do
                    mínimo de {estoqueMinimo}.
                  </p>
                </div>
              )}

              <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Motivo *
                </legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {MOTIVOS[tipoMovimento].map((opcao) => (
                    <button
                      key={opcao.valor}
                      type="button"
                      aria-pressed={motivo === opcao.valor}
                      onClick={() => setMotivo(opcao.valor)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                        motivo === opcao.valor
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="observacao"
                  className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Observação{" "}
                  <span className="font-normal normal-case text-gray-400">
                    (opcional)
                  </span>
                </label>
                <textarea
                  id="observacao"
                  value={observacao}
                  maxLength={300}
                  onChange={(event) => setObservacao(event.target.value)}
                  placeholder="Adicione detalhes sobre esta movimentação..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <p className="mt-1 text-right text-[10px] text-gray-400">
                  {observacao.length}/300
                </p>
              </div>

              {quantidade > 0 && !quantidadeInvalida && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Resultado da movimentação
                  </p>
                  <div className="flex items-center justify-center gap-5">
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-gray-400">Antes</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {estoqueAtual}
                      </p>
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-sm font-bold ${
                          tipoMovimento === "entrada"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {tipoMovimento === "entrada" ? "+" : "-"}
                        {quantidade}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-gray-400">Depois</p>
                      <p
                        className={`text-2xl font-bold ${
                          estoqueMinimo > 0 && novaQuantidade < estoqueMinimo
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {novaQuantidade}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link
            href="/dashboard/estoque"
            className="rounded-xl bg-gray-100 px-6 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={
              salvando ||
              !produtoSelecionado ||
              quantidade <= 0 ||
              quantidadeInvalida ||
              !motivo
            }
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              tipoMovimento === "entrada"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            }`}
          >
            {salvando ? (
              <>
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                {tipoMovimento === "entrada" ? (
                  <ArrowDownLeft aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <ArrowUpRight aria-hidden="true" className="h-5 w-5" />
                )}
                Registrar {tipoMovimento === "entrada" ? "entrada" : "saída"}
              </>
            )}
          </button>
        </div>
      </form>

      {resultado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="movimento-sucesso-titulo"
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2
                aria-hidden="true"
                className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <h2
              id="movimento-sucesso-titulo"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Movimentação registrada
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {resultado.tipo === "entrada" ? "Entrada" : "Saída"} de{" "}
              <strong>{resultado.nome}</strong> registrada como{" "}
              <strong>{resultado.motivo}</strong>.
            </p>
            <div className="mt-4 rounded-xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Novo saldo
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {resultado.novaQuantidade} un
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={registrarOutro}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Registrar outro
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/estoque")}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Ver movimentações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingMovimento() {
  return (
    <div className="mx-auto flex max-w-3xl items-center justify-center py-20">
      <Loader2
        aria-hidden="true"
        className="h-8 w-8 animate-spin text-emerald-600"
      />
      <span className="sr-only">Carregando formulário</span>
    </div>
  );
}

export default function NovoMovimentoPage() {
  return (
    <Suspense fallback={<LoadingMovimento />}>
      <NovoMovimentoContent />
    </Suspense>
  );
}
