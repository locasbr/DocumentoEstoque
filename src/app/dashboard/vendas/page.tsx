"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Loader2,
  Printer,
  QrCode,
  Receipt,
  RefreshCw,
  Search,
  ShoppingCart,
  User,
  Wallet,
  X,
} from "lucide-react";

import CupomImpressao from "@/components/cupom-impressao";
import { useNotification } from "@/contexts/NotificationContext";
import { useCupom } from "@/hooks/useCupom";
import { supabase } from "@/lib/supabase";
import { formatarData, formatarMoeda } from "@/lib/utils";

interface ClienteVenda {
  id: string;
  nome: string;
  telefone: string | null;
  endereco: string | null;
}

interface ItemVenda {
  id: string;
  venda_id: string;
  produto_id: string | null;
  nome_produto: string;
  sku: string | null;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

interface Venda {
  id: string;
  numero_venda: string;
  subtotal: number;
  desconto: number;
  total: number;
  forma_pagamento: string;
  valor_recebido: number | null;
  troco: number | null;
  cliente_id: string | null;
  criado_em: string;
  cliente?: ClienteVenda | null;
  itens?: ItemVenda[];
}

interface MetricasVendas {
  vendasHoje: number;
  quantidadeHoje: number;
  faturamentoGeral: number;
  quantidadeGeral: number;
}

const POR_PAGINA = 20;
const LOTE_METRICAS = 1000;

const ICON_PAGAMENTO: Record<string, LucideIcon> = {
  Dinheiro: Banknote,
  Pix: QrCode,
  "Cartão Débito": CreditCard,
  "Cartão Crédito": CreditCard,
  "Cartao Debito": CreditCard,
  "Cartao Credito": CreditCard,
};

function numero(valor: unknown): number {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function escaparFiltroPostgrest(valor: string): string {
  return valor.replace(/[,%()]/g, " ").trim();
}

export default function VendasPage() {
  const { addNotification } = useNotification();
  const { cupomAberto, dadosCupom, gerarCupom, fecharCupom } = useCupom();

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [metricas, setMetricas] = useState<MetricasVendas>({
    vendasHoje: 0,
    quantidadeHoje: 0,
    faturamentoGeral: 0,
    quantidadeGeral: 0,
  });
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [carregandoItens, setCarregandoItens] = useState<Set<string>>(
    new Set(),
  );
  const [errosItens, setErrosItens] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState<string | null>(null);
  const [filtroDigitado, setFiltroDigitado] = useState("");
  const [filtroAplicado, setFiltroAplicado] = useState("");

  const buscarMetricas = useCallback(async () => {
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);

    const { data: vendasHoje, error: erroHoje } = await supabase
      .from("vendas")
      .select("total")
      .gte("criado_em", inicioHoje.toISOString());

    if (erroHoje) throw erroHoje;

    let deslocamento = 0;
    let faturamentoGeral = 0;
    let quantidadeGeral = 0;

    while (true) {
      const { data, error: erroLote } = await supabase
        .from("vendas")
        .select("total")
        .order("criado_em", { ascending: false })
        .range(deslocamento, deslocamento + LOTE_METRICAS - 1);

      if (erroLote) throw erroLote;

      const lote = data ?? [];
      quantidadeGeral += lote.length;
      faturamentoGeral += lote.reduce(
        (total, venda) => total + numero(venda.total),
        0,
      );

      if (lote.length < LOTE_METRICAS) break;
      deslocamento += LOTE_METRICAS;
    }

    setMetricas({
      vendasHoje: (vendasHoje ?? []).reduce(
        (total, venda) => total + numero(venda.total),
        0,
      ),
      quantidadeHoje: vendasHoje?.length ?? 0,
      faturamentoGeral,
      quantidadeGeral,
    });
  }, []);

  const buscarPagina = useCallback(
    async (numeroPagina: number, reset = false) => {
      const inicio = numeroPagina * POR_PAGINA;
      const fimComRegistroExtra = inicio + POR_PAGINA;

      let consulta = supabase
        .from("vendas")
        .select(
          `
            id,
            numero_venda,
            subtotal,
            desconto,
            total,
            forma_pagamento,
            valor_recebido,
            troco,
            cliente_id,
            criado_em,
            cliente:cliente_id (
              id,
              nome,
              telefone,
              endereco
            )
          `,
        )
        .order("criado_em", { ascending: false })
        .range(inicio, fimComRegistroExtra);

      const termo = escaparFiltroPostgrest(filtroAplicado);
      if (termo) {
        consulta = consulta.or(
          `numero_venda.ilike.%${termo}%,forma_pagamento.ilike.%${termo}%`,
        );
      }

      const { data, error: erroConsulta } = await consulta;
      if (erroConsulta) throw erroConsulta;

      const recebidas = (data as unknown as Venda[] | null) ?? [];
      const possuiProximaPagina = recebidas.length > POR_PAGINA;
      const paginaAtual = recebidas.slice(0, POR_PAGINA);

      setVendas((atuais) => {
        if (reset) return paginaAtual;
        const existentes = new Set(atuais.map((venda) => venda.id));
        return [
          ...atuais,
          ...paginaAtual.filter((venda) => !existentes.has(venda.id)),
        ];
      });
      setTemMais(possuiProximaPagina);
      setPagina(numeroPagina);
    },
    [filtroAplicado],
  );

  const carregarInicial = useCallback(
    async (feedback = false) => {
      feedback ? setAtualizando(true) : setLoading(true);
      setErro(null);
      setExpandido(null);
      setErrosItens(new Set());

      try {
        await Promise.all([buscarPagina(0, true), buscarMetricas()]);
        if (feedback) {
          addNotification("Histórico atualizado.", "success", 1800);
        }
      } catch (error) {
        console.error("Erro ao carregar histórico de vendas:", error);
        setErro("Não foi possível carregar o histórico de vendas.");
      } finally {
        setLoading(false);
        setAtualizando(false);
      }
    },
    [addNotification, buscarMetricas, buscarPagina],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFiltroAplicado(filtroDigitado.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [filtroDigitado]);

  useEffect(() => {
    void carregarInicial();
  }, [carregarInicial]);

  const carregarItens = async (vendaId: string) => {
    setCarregandoItens((atuais) => new Set(atuais).add(vendaId));
    setErrosItens((atuais) => {
      const proximo = new Set(atuais);
      proximo.delete(vendaId);
      return proximo;
    });

    try {
      const { data, error: erroItens } = await supabase
        .from("itens_venda")
        .select(
          "id, venda_id, produto_id, nome_produto, sku, quantidade, preco_unitario, subtotal",
        )
        .eq("venda_id", vendaId)
        .order("nome_produto", { ascending: true });

      if (erroItens) throw erroItens;

      setVendas((atuais) =>
        atuais.map((venda) =>
          venda.id === vendaId
            ? { ...venda, itens: (data as ItemVenda[] | null) ?? [] }
            : venda,
        ),
      );
    } catch (error) {
      console.error("Erro ao carregar itens da venda:", error);
      setErrosItens((atuais) => new Set(atuais).add(vendaId));
    } finally {
      setCarregandoItens((atuais) => {
        const proximo = new Set(atuais);
        proximo.delete(vendaId);
        return proximo;
      });
    }
  };

  const toggleExpandir = async (vendaId: string) => {
    if (expandido === vendaId) {
      setExpandido(null);
      return;
    }

    setExpandido(vendaId);
    const venda = vendas.find((item) => item.id === vendaId);
    if (venda && venda.itens === undefined && !carregandoItens.has(vendaId)) {
      await carregarItens(vendaId);
    }
  };

  const carregarMais = async () => {
    if (carregandoMais || !temMais) return;
    setCarregandoMais(true);

    try {
      await buscarPagina(pagina + 1);
    } catch (error) {
      console.error("Erro ao carregar mais vendas:", error);
      addNotification("Não foi possível carregar mais vendas.", "error");
    } finally {
      setCarregandoMais(false);
    }
  };

  const reimprimirCupom = async (venda: Venda) => {
    let itens = venda.itens;

    if (itens === undefined) {
      try {
        const { data, error: erroItens } = await supabase
          .from("itens_venda")
          .select(
            "id, venda_id, produto_id, nome_produto, sku, quantidade, preco_unitario, subtotal",
          )
          .eq("venda_id", venda.id)
          .order("nome_produto", { ascending: true });

        if (erroItens) throw erroItens;
        itens = (data as ItemVenda[] | null) ?? [];
        setVendas((atuais) =>
          atuais.map((item) =>
            item.id === venda.id ? { ...item, itens } : item,
          ),
        );
      } catch (error) {
        console.error("Erro ao preparar cupom:", error);
        addNotification("Não foi possível carregar os itens do cupom.", "error");
        return;
      }
    }

    if (itens.length === 0) {
      addNotification("Esta venda não possui itens para reimpressão.", "warning");
      return;
    }

    await gerarCupom({
      itens: itens.map((item) => ({
        nome: item.nome_produto,
        sku: item.sku ?? undefined,
        quantidade: numero(item.quantidade),
        preco_unitario: numero(item.preco_unitario),
        subtotal: numero(item.subtotal),
      })),
      desconto: numero(venda.desconto),
      forma_pagamento: venda.forma_pagamento,
      valor_recebido: venda.valor_recebido ?? undefined,
      nome_cliente: venda.cliente?.nome,
      endereco_cliente: venda.cliente?.endereco ?? undefined,
      telefone_cliente: venda.cliente?.telefone ?? undefined,
    });
  };

  const ticketMedioGeral = useMemo(
    () =>
      metricas.quantidadeGeral > 0
        ? metricas.faturamentoGeral / metricas.quantidadeGeral
        : 0,
    [metricas],
  );

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center gap-2 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        Carregando histórico...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            REGISTRO COMERCIAL
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">
            Histórico de vendas
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Consulte valores, itens, clientes e pagamentos registrados pelo PDV.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void carregarInicial(true)}
            disabled={atualizando}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <RefreshCw
              className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`}
            />
            Atualizar
          </button>
          <Link
            href="/dashboard/pdv"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <ShoppingCart className="h-4 w-4" />
            Abrir PDV
          </Link>
        </div>
      </header>

      {erro && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p>{erro}</p>
            <button
              type="button"
              onClick={() => void carregarInicial()}
              className="mt-2 font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      <section
        aria-label="Indicadores das vendas"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <MetricCard
          label="Vendas hoje"
          valor={formatarMoeda(metricas.vendasHoje)}
          descricao={`${metricas.quantidadeHoje} venda(s) hoje`}
          icon={Wallet}
          cor="emerald"
        />
        <MetricCard
          label="Faturamento registrado"
          valor={formatarMoeda(metricas.faturamentoGeral)}
          descricao="Todas as vendas salvas"
          icon={Receipt}
          cor="blue"
        />
        <MetricCard
          label="Quantidade de vendas"
          valor={metricas.quantidadeGeral.toLocaleString("pt-BR")}
          descricao="Total no histórico"
          icon={ShoppingCart}
          cor="violet"
        />
        <MetricCard
          label="Ticket médio geral"
          valor={formatarMoeda(ticketMedioGeral)}
          descricao="Faturamento dividido pelas vendas"
          icon={CreditCard}
          cor="amber"
        />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar no banco por número da venda ou pagamento..."
            value={filtroDigitado}
            onChange={(event) => setFiltroDigitado(event.target.value)}
            className="input-field w-full pl-10 pr-10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          {filtroDigitado && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setFiltroDigitado("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {filtroAplicado && (
          <p className="mt-2 text-xs text-gray-500">
            Resultados do banco para “{filtroAplicado}”.
          </p>
        )}
      </section>

      {vendas.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900">
          <ShoppingCart className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-700" />
          <h2 className="font-bold text-gray-900 dark:text-white">
            {filtroAplicado
              ? "Nenhuma venda encontrada"
              : "Nenhuma venda registrada"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {filtroAplicado
              ? "Tente pesquisar por outro número ou pagamento."
              : "As próximas vendas realizadas no PDV aparecerão aqui."}
          </p>
          {!filtroAplicado && (
            <Link
              href="/dashboard/pdv"
              className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Ir para o PDV
            </Link>
          )}
        </div>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-gray-500">
            <span>{vendas.length} venda(s) exibida(s)</span>
            <span>20 por página</span>
          </div>

          {vendas.map((venda) => {
            const estaExpandido = expandido === venda.id;
            const estaCarregandoItens = carregandoItens.has(venda.id);
            const possuiErroItens = errosItens.has(venda.id);
            const IconePagamento =
              ICON_PAGAMENTO[venda.forma_pagamento] ?? CreditCard;

            return (
              <article
                key={venda.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => void toggleExpandir(venda.id)}
                    aria-expanded={estaExpandido}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                        <IconePagamento className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                          {venda.numero_venda}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {formatarData(venda.criado_em)} · {venda.forma_pagamento}
                        </p>
                        {venda.cliente && (
                          <p className="mt-0.5 truncate text-xs text-blue-600 dark:text-blue-400">
                            Cliente: {venda.cliente.nome}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatarMoeda(numero(venda.total))}
                      </span>
                      {estaExpandido ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void reimprimirCupom(venda)}
                    aria-label={`Reimprimir cupom da venda ${venda.numero_venda}`}
                    title="Reimprimir cupom"
                    className="border-l border-gray-200 px-4 text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-800 dark:hover:bg-blue-900/20"
                  >
                    <Printer className="h-5 w-5" />
                  </button>
                </div>

                {estaExpandido && (
                  <div className="space-y-4 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                    {venda.cliente ? (
                      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-900/20">
                        <User className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {venda.cliente.nome}
                          </p>
                          {venda.cliente.telefone && (
                            <p className="text-xs text-gray-500">
                              {venda.cliente.telefone}
                            </p>
                          )}
                          {venda.cliente.endereco && (
                            <p className="text-xs text-gray-500">
                              {venda.cliente.endereco}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Venda sem cliente vinculado.
                      </p>
                    )}

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Itens da venda
                        </h3>
                        <button
                          type="button"
                          onClick={() => void reimprimirCupom(venda)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Reimprimir cupom
                        </button>
                      </div>

                      {estaCarregandoItens ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando itens...
                        </div>
                      ) : possuiErroItens ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                          <p>Não foi possível carregar os itens.</p>
                          <button
                            type="button"
                            onClick={() => void carregarItens(venda.id)}
                            className="mt-1 font-semibold underline"
                          >
                            Tentar novamente
                          </button>
                        </div>
                      ) : venda.itens?.length ? (
                        <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white px-3 dark:divide-gray-800 dark:border-gray-700 dark:bg-gray-900">
                          {venda.itens.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between gap-3 py-3 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="break-words font-semibold text-gray-900 dark:text-white">
                                  {item.nome_produto}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.quantidade} × {formatarMoeda(numero(item.preco_unitario))}
                                  {item.sku ? ` · SKU ${item.sku}` : ""}
                                </p>
                              </div>
                              <span className="shrink-0 font-bold text-gray-900 dark:text-white">
                                {formatarMoeda(numero(item.subtotal))}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="py-4 text-center text-sm text-gray-500">
                          Nenhum item encontrado nesta venda.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 border-t border-gray-200 pt-3 text-sm dark:border-gray-700">
                      <LinhaTotal
                        label="Subtotal"
                        valor={formatarMoeda(numero(venda.subtotal))}
                      />
                      {numero(venda.desconto) > 0 && (
                        <LinhaTotal
                          label="Desconto"
                          valor={`-${formatarMoeda(numero(venda.desconto))}`}
                          classe="text-red-500"
                        />
                      )}
                      <LinhaTotal
                        label="Total"
                        valor={formatarMoeda(numero(venda.total))}
                        destaque
                      />
                      {venda.valor_recebido !== null && (
                        <LinhaTotal
                          label="Valor recebido"
                          valor={formatarMoeda(numero(venda.valor_recebido))}
                          classe="text-gray-500"
                        />
                      )}
                      {numero(venda.troco) > 0 && (
                        <LinhaTotal
                          label="Troco"
                          valor={formatarMoeda(numero(venda.troco))}
                          classe="text-gray-500"
                        />
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {temMais && (
            <button
              type="button"
              onClick={() => void carregarMais()}
              disabled={carregandoMais}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              {carregandoMais && <Loader2 className="h-4 w-4 animate-spin" />}
              {carregandoMais ? "Carregando..." : "Carregar mais vendas"}
            </button>
          )}
        </section>
      )}

      {cupomAberto && dadosCupom && (
        <CupomImpressao dados={dadosCupom} onFechar={fecharCupom} />
      )}
    </div>
  );
}

function MetricCard({
  label,
  valor,
  descricao,
  icon: Icon,
  cor,
}: {
  label: string;
  valor: string;
  descricao: string;
  icon: LucideIcon;
  cor: "emerald" | "blue" | "violet" | "amber";
}) {
  const estilos = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    violet:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  };

  return (
    <article className={`rounded-xl border p-4 ${estilos[cor]}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 break-words text-xl font-extrabold text-gray-900 dark:text-white">
        {valor}
      </p>
      <p className="mt-1 text-[11px] opacity-80">{descricao}</p>
    </article>
  );
}

function LinhaTotal({
  label,
  valor,
  destaque = false,
  classe = "",
}: {
  label: string;
  valor: string;
  destaque?: boolean;
  classe?: string;
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${
        destaque ? "text-base font-extrabold" : classe
      }`}
    >
      <span>{label}</span>
      <span>{valor}</span>
    </div>
  );
}
