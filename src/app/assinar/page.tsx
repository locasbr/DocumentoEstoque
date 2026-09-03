"use client";

export const dynamic = "force-dynamic";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  CreditCard,
  Loader2,
  MessageCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import Loading from "@/components/loading";
import { supabase } from "@/lib/supabase";

type PlanoDisponivel = "iniciante" | "profissional";
type TipoPlanoInterno = PlanoDisponivel | "negocio";
type TipoPagamento = "avulso" | "assinatura";

interface Beneficio {
  texto: string;
  destaque?: boolean;
  ia?: boolean;
}

interface Plano {
  id: PlanoDisponivel;
  nome: string;
  descricao: string;
  preco: number;
  icon: LucideIcon;
  destaque?: boolean;
  beneficios: Beneficio[];
}

interface RespostaPagamento {
  init_point?: string;
  subscription_id?: string;
  error?: string;
}

const WHATSAPP_SUPORTE = "5522999467499";

const PLANOS: Plano[] = [
  {
    id: "iniciante",
    nome: "Iniciante",
    descricao: "Para organizar um estoque pequeno com clareza.",
    preco: 39.9,
    icon: Zap,
    beneficios: [
      { texto: "Até 100 produtos", destaque: true },
      { texto: "1 usuário" },
      { texto: "Cadastro de produtos" },
      { texto: "Entradas e saídas" },
      { texto: "Alertas de estoque baixo e zerado" },
      { texto: "Lista de reposição" },
      { texto: "Controle de perdas e avarias" },
      { texto: "Venda rápida" },
      { texto: "Relatórios básicos" },
      { texto: "Suporte por e-mail" },
    ],
  },
  {
    id: "profissional",
    nome: "Profissional",
    descricao: "Para controlar o estoque e tomar decisões com mais informação.",
    preco: 79.9,
    icon: Sparkles,
    destaque: true,
    beneficios: [
      { texto: "Limite ampliado de produtos", destaque: true },
      { texto: "Tudo do plano Iniciante" },
      { texto: "Clientes e fiado", destaque: true },
      { texto: "Controle de validade" },
      { texto: "Relatórios completos" },
      { texto: "Importação e exportação CSV" },
      { texto: "Cupom pelo WhatsApp" },
      { texto: "Raio-X Inteligente do estoque", destaque: true, ia: true },
      { texto: "Suporte prioritário" },
    ],
  },
];

function isPlanoDisponivel(valor: string | null): valor is PlanoDisponivel {
  return valor === "iniciante" || valor === "profissional";
}

function isTipoPlanoInterno(valor: unknown): valor is TipoPlanoInterno {
  return valor === "iniciante" || valor === "profissional" || valor === "negocio";
}

function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function AssinarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [tipoPlanoAtual, setTipoPlanoAtual] = useState<TipoPlanoInterno | null>(null);
  const [planoAtivo, setPlanoAtivo] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoDisponivel>("profissional");
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamento>("avulso");
  const [planoIndisponivelNaUrl, setPlanoIndisponivelNaUrl] = useState(false);

  const statusPagamento = searchParams.get("pagamento");
  const planoParam = searchParams.get("plano");
  const querRenovar = searchParams.get("renovar") === "1";

  useEffect(() => {
    let ativo = true;

    async function verificar() {
      setLoading(true);
      setErro("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const { data: perfil, error: perfilError } = await supabase
          .from("perfis")
          .select("plano, tipo_plano, subscription_id")
          .eq("id", user.id)
          .maybeSingle();

        if (!ativo) return;

        if (perfilError) {
          console.error("Erro ao consultar plano:", perfilError);
          setErro("Não foi possível confirmar seu plano atual.");
        }

        const planoAtual = isTipoPlanoInterno(perfil?.tipo_plano)
          ? perfil.tipo_plano
          : null;

        setTipoPlanoAtual(planoAtual);
        setPlanoAtivo(perfil?.plano === "ativo");
        setSubscriptionId(
          typeof perfil?.subscription_id === "string" && perfil.subscription_id.trim()
            ? perfil.subscription_id
            : null,
        );
        setPlanoIndisponivelNaUrl(planoParam === "negocio");

        if (isPlanoDisponivel(planoParam)) {
          setPlanoSelecionado(planoParam);
        } else if (planoAtual === "iniciante") {
          setPlanoSelecionado("profissional");
        } else if (planoAtual === "profissional") {
          setPlanoSelecionado("profissional");
        }

        if (perfil?.plano === "ativo" && planoAtual === "negocio" && !querRenovar) {
          router.replace("/dashboard");
        }
      } catch (error: unknown) {
        console.error("Erro ao carregar planos:", error);
        if (ativo) setErro("Ocorreu um erro ao carregar os planos.");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    void verificar();
    return () => {
      ativo = false;
    };
  }, [planoParam, querRenovar, router]);

  const planoExibido = useMemo(
    () => PLANOS.find((plano) => plano.id === planoSelecionado) ?? PLANOS[1],
    [planoSelecionado],
  );

  const contaNegocioLegada = tipoPlanoAtual === "negocio";
  const planoSelecionadoEhAtual = tipoPlanoAtual === planoSelecionado;
  const estaTrocandoPlano =
    tipoPlanoAtual !== null && tipoPlanoAtual !== planoSelecionado;
  const assinaturaRecorrenteAtiva = planoAtivo && Boolean(subscriptionId);
  const assinaturaAtualSelecionada =
    assinaturaRecorrenteAtiva && planoSelecionadoEhAtual;
  const downgradeProfissionalParaIniciante =
    planoAtivo &&
    tipoPlanoAtual === "profissional" &&
    planoSelecionado === "iniciante";
  const trocaComAssinaturaAtiva =
    assinaturaRecorrenteAtiva && estaTrocandoPlano;
  const periodoAvulsoAtivo = planoAtivo && !subscriptionId;

  const assinaturaPrecisaSuporte =
    tipoPagamento === "assinatura" &&
    (contaNegocioLegada ||
      downgradeProfissionalParaIniciante ||
      trocaComAssinaturaAtiva ||
      periodoAvulsoAtivo);

  const avulsoPrecisaSuporte =
    tipoPagamento === "avulso" &&
    (contaNegocioLegada ||
      downgradeProfissionalParaIniciante ||
      assinaturaRecorrenteAtiva);

  const suporteRequerido = assinaturaPrecisaSuporte || avulsoPrecisaSuporte;

  const mensagemSuporte = contaNegocioLegada
    ? "Olá, quero gerenciar meu plano Negócio legado no EstoqueSystem."
    : downgradeProfissionalParaIniciante
      ? "Olá, quero mudar do plano Profissional para o Iniciante ao final do período atual."
      : assinaturaRecorrenteAtiva
        ? "Olá, já tenho uma assinatura recorrente e quero alterar meu plano sem gerar cobrança duplicada."
        : "Olá, tenho um período avulso ativo e quero migrar para assinatura automática sem perder os dias já pagos.";

  const linkSuporte = `https://wa.me/${WHATSAPP_SUPORTE}?text=${encodeURIComponent(
    mensagemSuporte,
  )}`;

  const handlePagar = useCallback(async () => {
    if (processando) return;

    if (suporteRequerido) {
      setErro("Esta alteração precisa ser solicitada pelo WhatsApp.");
      return;
    }

    if (tipoPagamento === "assinatura" && assinaturaAtualSelecionada) {
      setErro("Este plano já possui assinatura mensal automática.");
      return;
    }

    if (
      tipoPagamento === "avulso" &&
      planoSelecionadoEhAtual &&
      planoAtivo &&
      !querRenovar
    ) {
      setErro("Seu plano ainda está ativo. Use a opção de renovação quando quiser adicionar mais 30 dias.");
      return;
    }

    setProcessando(true);
    setErro("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setErro("Sua sessão expirou. Entre novamente para continuar.");
        return;
      }

      const endpoint =
        tipoPagamento === "assinatura"
          ? "/api/pagamento/assinatura"
          : "/api/pagamento/criar";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tipoPlano: planoSelecionado }),
      });

      let data: RespostaPagamento;
      try {
        data = (await response.json()) as RespostaPagamento;
      } catch {
        setErro("O servidor retornou uma resposta inválida.");
        return;
      }

      if (!response.ok || !data.init_point) {
        setErro(
          data.error ||
            (tipoPagamento === "assinatura"
              ? "Não foi possível criar a assinatura."
              : "Não foi possível criar o pagamento."),
        );
        return;
      }

      window.location.assign(data.init_point);
    } catch (error: unknown) {
      console.error("Erro ao processar pagamento:", error);
      setErro("Não foi possível processar o pagamento. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }, [
    assinaturaAtualSelecionada,
    planoAtivo,
    planoSelecionado,
    planoSelecionadoEhAtual,
    processando,
    querRenovar,
    suporteRequerido,
    tipoPagamento,
  ]);

  if (loading) return <Loading />;

  const textoBotao = processando
    ? tipoPagamento === "assinatura"
      ? "Criando assinatura..."
      : "Criando pagamento..."
    : tipoPagamento === "assinatura"
      ? `Assinar ${planoExibido.nome} por R$ ${formatarPreco(planoExibido.preco)}/mês`
      : querRenovar && planoSelecionadoEhAtual
        ? `Renovar ${planoExibido.nome} por R$ ${formatarPreco(planoExibido.preco)}`
        : `Pagar R$ ${formatarPreco(planoExibido.preco)} por 30 dias`;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-950 md:py-12">
      <div className="mx-auto max-w-5xl">
        {statusPagamento === "falhou" && (
          <Aviso tipo="erro">
            O pagamento não foi concluído. Revise os dados e tente novamente.
          </Aviso>
        )}
        {statusPagamento === "pendente" && (
          <Aviso tipo="aviso">
            O pagamento está pendente. O acesso será atualizado após a confirmação.
          </Aviso>
        )}
        {statusPagamento === "sucesso" && (
          <Aviso tipo="sucesso">
            Pagamento recebido. O acesso será confirmado pelo Mercado Pago.
          </Aviso>
        )}
        {(erro || planoIndisponivelNaUrl) && (
          <Aviso tipo="info">
            {erro ||
              "O plano Negócio não está disponível para novas compras. Escolha Iniciante ou Profissional."}
          </Aviso>
        )}

        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o dashboard
          </Link>
        </div>

        <header className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
            PLANOS DO ESTOQUESYSTEM
          </p>
          <h1 className="mt-3 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl">
            Escolha o nível de controle ideal
          </h1>
          <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400 md:text-lg">
            Escolha entre pagar por 30 dias ou ativar a renovação mensal automática.
          </p>
        </header>

        <section aria-label="Planos disponíveis" className="grid gap-6 md:grid-cols-2">
          {PLANOS.map((plano) => {
            const Icon = plano.icon;
            const selecionado = planoSelecionado === plano.id;
            const atual = tipoPlanoAtual === plano.id && planoAtivo;

            return (
              <button
                key={plano.id}
                type="button"
                onClick={() => {
                  if (!contaNegocioLegada) {
                    setPlanoSelecionado(plano.id);
                    setErro("");
                    setPlanoIndisponivelNaUrl(false);
                  }
                }}
                disabled={contaNegocioLegada}
                aria-pressed={selecionado}
                className={`relative h-full rounded-2xl border-2 bg-white p-6 text-left transition dark:bg-gray-900 md:p-7 ${
                  selecionado
                    ? plano.id === "profissional"
                      ? "border-emerald-500 shadow-xl shadow-emerald-500/10"
                      : "border-gray-700 shadow-lg dark:border-gray-300"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:hover:border-gray-700"
                } ${
                  contaNegocioLegada
                    ? "cursor-not-allowed opacity-70"
                    : "cursor-pointer"
                }`}
              >
                {plano.destaque && !atual && (
                  <span className="absolute right-5 top-5 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Recomendado
                  </span>
                )}
                {atual && (
                  <span className="absolute right-5 top-5 rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Plano atual
                  </span>
                )}

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    plano.id === "profissional"
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <h2 className="mt-5 text-2xl font-extrabold text-gray-900 dark:text-white">
                  {plano.nome}
                </h2>
                <p className="mt-1 min-h-10 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {plano.descricao}
                </p>

                <div className="my-6 flex items-end gap-1">
                  <span className="mb-1 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    R$
                  </span>
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    {formatarPreco(plano.preco)}
                  </span>
                  <span className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                    /mês
                  </span>
                </div>

                <ul className="space-y-3">
                  {plano.beneficios.map((beneficio) => (
                    <li key={beneficio.texto} className="flex items-start gap-2.5">
                      {beneficio.ia ? (
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                      ) : (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span
                        className={`text-sm text-gray-700 dark:text-gray-300 ${
                          beneficio.destaque ? "font-semibold" : ""
                        }`}
                      >
                        {beneficio.texto}
                      </span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </section>

        <section className="mx-auto mt-8 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:p-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Forma de pagamento
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Escolha como prefere manter o acesso ao EstoqueSystem.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <OpcaoPagamento
              selecionado={tipoPagamento === "avulso"}
              onClick={() => {
                setTipoPagamento("avulso");
                setErro("");
              }}
              icon={QrCode}
              titulo="Pagamento avulso"
              descricao="Pague por 30 dias. Cartão, Pix, boleto e outros meios no Mercado Pago."
              destaque="Sem renovação automática"
              cor="emerald"
            />

            <OpcaoPagamento
              selecionado={tipoPagamento === "assinatura"}
              onClick={() => {
                setTipoPagamento("assinatura");
                setErro("");
              }}
              icon={CreditCard}
              titulo="Assinatura mensal"
              descricao="Cobrança recorrente mensal pelo Mercado Pago."
              destaque="Renovação automática"
              cor="violet"
            />
          </div>

          <div
            className={`mt-5 rounded-2xl border p-5 ${
              tipoPagamento === "assinatura"
                ? "border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-900/15"
                : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/15"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
                  tipoPagamento === "assinatura" ? "bg-violet-600" : "bg-emerald-600"
                }`}
              >
                {tipoPagamento === "assinatura" ? (
                  <RefreshCw className="h-5 w-5" />
                ) : (
                  <CalendarCheck2 className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {tipoPagamento === "assinatura"
                    ? "Assinatura com renovação automática"
                    : "Pagamento único por 30 dias"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {tipoPagamento === "assinatura"
                    ? "Após a confirmação, novas cobranças serão feitas mensalmente até o cancelamento."
                    : "Após a aprovação, o plano fica ativo por 30 dias e não será renovado automaticamente."}
                </p>
              </div>
            </div>
          </div>

          {suporteRequerido ? (
            <div className="mt-6 space-y-3">
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                {tipoPagamento === "assinatura" && periodoAvulsoAtivo
                  ? "Esta conta já possui um período avulso ativo. A migração para assinatura precisa ser ajustada para não perder os dias pagos."
                  : "Esta alteração precisa de atendimento para evitar perda de período ou cobrança duplicada."}
              </div>
              <Link
                href={linkSuporte}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 text-base font-bold text-white hover:bg-emerald-700"
              >
                <MessageCircle className="h-5 w-5" />
                Solicitar alteração pelo WhatsApp
              </Link>
            </div>
          ) : assinaturaAtualSelecionada && tipoPagamento === "assinatura" ? (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-100 px-5 py-4 text-center text-base font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
              <RefreshCw className="h-5 w-5" />
              Sua assinatura já é renovada automaticamente
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handlePagar()}
              disabled={processando}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 text-base font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-500"
            >
              {processando && <Loader2 className="h-5 w-5 animate-spin" />}
              {textoBotao}
            </button>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Pagamento processado pelo Mercado Pago
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {tipoPagamento === "assinatura"
                ? "Renovação automática mensal"
                : "30 dias após a aprovação"}
            </span>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5 text-center dark:border-gray-800">
            <Link
              href={`https://wa.me/${WHATSAPP_SUPORTE}?text=${encodeURIComponent(
                "Tenho dúvidas sobre os pagamentos do EstoqueSystem.",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              <MessageCircle className="h-4 w-4" />
              Tirar dúvidas pelo WhatsApp
            </Link>
          </div>
        </section>

        <footer className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          Ao continuar, você concorda com os{" "}
          <Link href="/termos" target="_blank" className="text-emerald-600 hover:underline dark:text-emerald-400">
            Termos de Uso
          </Link>{" "}
          e com a{" "}
          <Link href="/privacidade" target="_blank" className="text-emerald-600 hover:underline dark:text-emerald-400">
            Política de Privacidade
          </Link>
          .
        </footer>
      </div>
    </main>
  );
}

function OpcaoPagamento({
  selecionado,
  onClick,
  icon: Icon,
  titulo,
  descricao,
  destaque,
  cor,
}: {
  selecionado: boolean;
  onClick: () => void;
  icon: LucideIcon;
  titulo: string;
  descricao: string;
  destaque: string;
  cor: "emerald" | "violet";
}) {
  const selecionadoStyle =
    cor === "violet"
      ? "border-violet-500 bg-violet-50 shadow-md dark:bg-violet-900/20"
      : "border-emerald-500 bg-emerald-50 shadow-md dark:bg-emerald-900/20";
  const iconStyle =
    cor === "violet"
      ? "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300"
      : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selecionado}
      className={`relative rounded-2xl border-2 p-4 text-left transition ${
        selecionado
          ? selecionadoStyle
          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
      }`}
    >
      {selecionado && (
        <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-emerald-600" />
      )}
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconStyle}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 font-bold text-gray-900 dark:text-white">{titulo}</p>
      <p className="mt-1 min-h-14 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {descricao}
      </p>
      <span className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-300">
        {destaque}
      </span>
    </button>
  );
}

function Aviso({
  tipo,
  children,
}: {
  tipo: "erro" | "aviso" | "info" | "sucesso";
  children: ReactNode;
}) {
  const estilo =
    tipo === "erro"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
      : tipo === "aviso"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
        : tipo === "sucesso"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
          : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300";

  return (
    <div
      role={tipo === "aviso" || tipo === "sucesso" ? "status" : "alert"}
      className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${estilo}`}
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

export default function AssinarPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AssinarContent />
    </Suspense>
  );
}
