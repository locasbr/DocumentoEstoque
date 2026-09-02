import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { chamarIAJson } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Periodo = 7 | 30 | 90;
type Acao = "consultar" | "gerar";

type DiagnosticoIA = {
  resumo: string;
  prioridades: string[];
  pontosAtencao: string[];
  acoes: string[];
};

type ProdutoBanco = {
  id: string;
  nome: string;
  categoria: string | null;
  quantidade_atual: number | string | null;
  quantidade_minima: number | string | null;
  preco_custo: number | string | null;
  preco_venda: number | string | null;
  ativo: boolean | null;
};

type MovimentoBanco = {
  id: string;
  produto_id: string;
  tipo_movimento: string;
  quantidade: number | string | null;
  motivo: string | null;
  criado_em: string;
  produto: Pick<
    ProdutoBanco,
    "id" | "nome" | "categoria" | "preco_custo" | "preco_venda"
  > | null;
};

type CacheBanco = {
  id: string;
  dono_id: string;
  periodo: Periodo;
  assinatura_dados: string;
  resumo: string | null;
  prioridades: unknown;
  pontos_atencao: unknown;
  acoes: unknown;
  status: "gerando" | "concluido" | "falhou";
  gerado_em: string | null;
  atualizado_em: string;
};

const INTERVALO_GERACAO_MS = 24 * 60 * 60 * 1000;
const TRAVA_GERACAO_MS = 5 * 60 * 1000;
const LIMITE_MENSAL = 31;

function numero(valor: unknown): number {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function periodoValido(valor: unknown): Periodo {
  return valor === 7 || valor === 90 ? valor : 30;
}

function acaoValida(valor: unknown): Acao {
  return valor === "gerar" ? "gerar" : "consultar";
}

function inicioDoPeriodo(dias: Periodo): Date {
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  data.setDate(data.getDate() - (dias - 1));
  return data;
}

function inicioDoMes(): Date {
  const data = new Date();
  return new Date(data.getFullYear(), data.getMonth(), 1, 0, 0, 0, 0);
}

function chaveData(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(data.getDate()).padStart(2, "0")}`;
}

function motivoBase(motivo: string | null): string {
  return (motivo ?? "")
    .split("|")[0]
    ?.trim()
    .toLocaleLowerCase("pt-BR") ?? "";
}

function motivoEhPerda(motivo: string | null): boolean {
  const motivoNormalizado = motivoBase(motivo);
  return ["perda", "perda ou quebra", "produto vencido", "avaria"].includes(
    motivoNormalizado,
  );
}

function listaStrings(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((item): item is string => typeof item === "string");
}

function diagnosticoDoCache(cache: CacheBanco | null): DiagnosticoIA | null {
  if (!cache || cache.status !== "concluido" || !cache.resumo) return null;

  return {
    resumo: cache.resumo,
    prioridades: listaStrings(cache.prioridades),
    pontosAtencao: listaStrings(cache.pontos_atencao),
    acoes: listaStrings(cache.acoes),
  };
}

function segundosRestantes(dataIso: string | null, intervaloMs: number): number {
  if (!dataIso) return 0;
  const data = new Date(dataIso).getTime();
  if (Number.isNaN(data)) return 0;
  return Math.max(0, Math.ceil((data + intervaloMs - Date.now()) / 1000));
}

function validarDiagnostico(valor: unknown): DiagnosticoIA {
  if (!valor || typeof valor !== "object") {
    throw new Error("Resposta da IA inválida");
  }

  const objeto = valor as Record<string, unknown>;
  if (typeof objeto.resumo !== "string" || !objeto.resumo.trim()) {
    throw new Error("Resumo da IA inválido");
  }

  return {
    resumo: objeto.resumo.trim(),
    prioridades: listaStrings(objeto.prioridades).slice(0, 4),
    pontosAtencao: listaStrings(objeto.pontosAtencao).slice(0, 4),
    acoes: listaStrings(objeto.acoes).slice(0, 4),
  };
}

function respostaErro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
      console.error("Configuração ausente na API do Raio-X");
      return respostaErro("Configuração do servidor incompleta", 500);
    }

    const authorization = req.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return respostaErro("Não autenticado", 401);
    }

    const token = authorization.slice(7).trim();
    const supabaseAuth = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } =
      await supabaseAuth.auth.getUser(token);

    if (authError || !authData.user) {
      return respostaErro("Sessão inválida ou expirada", 401);
    }

    let body: { periodo?: unknown; acao?: unknown } = {};
    try {
      body = (await req.json()) as { periodo?: unknown; acao?: unknown };
    } catch {
      body = {};
    }

    const periodo = periodoValido(body.periodo);
    const acao = acaoValida(body.acao);
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: membro, error: membroError } = await supabase
      .from("membros")
      .select("dono_id, nivel, status")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (membroError) {
      console.error("Erro ao verificar membro no Raio-X:", membroError);
      return respostaErro("Não foi possível verificar a conta", 500);
    }

    if (membro?.nivel === "funcionario" && membro.status !== "ativo") {
      return respostaErro("Acesso do funcionário está inativo", 403);
    }

    const donoId =
      membro?.nivel === "funcionario" &&
      typeof membro.dono_id === "string" &&
      membro.dono_id.trim()
        ? membro.dono_id
        : authData.user.id;

    const { data: perfil, error: perfilError } = await supabase
      .from("perfis")
      .select("plano, tipo_plano, plano_fim, trial_fim, is_admin")
      .eq("id", donoId)
      .maybeSingle();

    if (perfilError || !perfil) {
      console.error("Erro ao buscar perfil no Raio-X:", perfilError);
      return respostaErro("Perfil não encontrado", 404);
    }

    const agora = new Date();
    const trialFim = perfil.trial_fim ? new Date(perfil.trial_fim) : null;
    const planoFim = perfil.plano_fim ? new Date(perfil.plano_fim) : null;
    const trialValido =
      perfil.plano === "trial" &&
      trialFim &&
      !Number.isNaN(trialFim.getTime()) &&
      trialFim > agora;
    const planoPagoValido =
      perfil.plano === "ativo" &&
      planoFim &&
      !Number.isNaN(planoFim.getTime()) &&
      planoFim > agora;
    const planoTemIa =
      perfil.tipo_plano === "profissional" || perfil.tipo_plano === "negocio";
    const podeUsar =
      perfil.is_admin === true || trialValido || (planoPagoValido && planoTemIa);

    if (!podeUsar) {
      return NextResponse.json(
        {
          error: "plano_insuficiente",
          message: "O Raio-X Inteligente está disponível no plano Profissional.",
        },
        { status: 403 },
      );
    }

    const inicio = inicioDoPeriodo(periodo);
    const [produtosRes, movimentosRes, cacheRes] = await Promise.all([
      supabase
        .from("produtos")
        .select(
          "id, nome, categoria, quantidade_atual, quantidade_minima, preco_custo, preco_venda, ativo",
        )
        .eq("usuario_id", donoId),
      supabase
        .from("movimentos_estoque")
        .select(
          "id, produto_id, tipo_movimento, quantidade, motivo, criado_em, produto:produto_id(id, nome, categoria, preco_custo, preco_venda)",
        )
        .eq("usuario_id", donoId)
        .gte("criado_em", inicio.toISOString())
        .order("criado_em", { ascending: true })
        .limit(10000),
      supabase
        .from("raio_x_diagnosticos")
        .select("*")
        .eq("dono_id", donoId)
        .eq("periodo", periodo)
        .maybeSingle(),
    ]);

    if (produtosRes.error) {
      console.error("Erro ao buscar produtos do Raio-X:", produtosRes.error);
      return respostaErro("Não foi possível carregar os produtos", 500);
    }
    if (movimentosRes.error) {
      console.error("Erro ao buscar movimentos do Raio-X:", movimentosRes.error);
      return respostaErro("Não foi possível carregar as movimentações", 500);
    }
    if (cacheRes.error) {
      console.error("Erro ao buscar cache do Raio-X:", cacheRes.error);
      return respostaErro("Não foi possível consultar o diagnóstico salvo", 500);
    }

    const produtos = ((produtosRes.data ?? []) as ProdutoBanco[]).filter(
      (produto) => produto.ativo !== false,
    );
    const movimentos =
      (movimentosRes.data ?? []) as unknown as MovimentoBanco[];
    let cache = (cacheRes.data as CacheBanco | null) ?? null;

    const valorEstoque = produtos.reduce(
      (total, produto) =>
        total +
        Math.max(numero(produto.quantidade_atual), 0) *
          Math.max(numero(produto.preco_custo), 0),
      0,
    );

    const abaixoMinimo = produtos.filter((produto) => {
      const atual = Math.max(numero(produto.quantidade_atual), 0);
      const minimo = Math.max(numero(produto.quantidade_minima), 0);
      return minimo > 0 && atual < minimo;
    });

    const idsMovimentados = new Set(
      movimentos.map((movimento) => movimento.produto_id),
    );
    const semMovimentacao = produtos.filter(
      (produto) => !idsMovimentados.has(produto.id),
    );

    const perdas = movimentos.filter(
      (movimento) =>
        movimento.tipo_movimento === "saida" && motivoEhPerda(movimento.motivo),
    );
    const valorPerdas = perdas.reduce(
      (total, movimento) =>
        total +
        Math.max(numero(movimento.quantidade), 0) *
          Math.max(numero(movimento.produto?.preco_custo), 0),
      0,
    );

    const serieMapa = new Map<
      string,
      { chave: string; data: string; entradas: number; saidas: number }
    >();

    for (let indice = 0; indice < periodo; indice += 1) {
      const data = new Date(inicio);
      data.setDate(inicio.getDate() + indice);
      const chave = chaveData(data);
      serieMapa.set(chave, {
        chave,
        data: data.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        entradas: 0,
        saidas: 0,
      });
    }

    const ranking = new Map<
      string,
      { nome: string; quantidade: number; receitaEstimada: number }
    >();
    let receitaEstimada = 0;
    let lucroEstimado = 0;

    for (const movimento of movimentos) {
      const data = new Date(movimento.criado_em);
      const quantidade = Math.max(numero(movimento.quantidade), 0);

      if (!Number.isNaN(data.getTime())) {
        const itemSerie = serieMapa.get(chaveData(data));
        if (itemSerie) {
          if (movimento.tipo_movimento === "entrada") {
            itemSerie.entradas += quantidade;
          }
          if (movimento.tipo_movimento === "saida") {
            itemSerie.saidas += quantidade;
          }
        }
      }

      if (
        movimento.tipo_movimento !== "saida" ||
        motivoEhPerda(movimento.motivo) ||
        !movimento.produto
      ) {
        continue;
      }

      const venda = Math.max(numero(movimento.produto.preco_venda), 0);
      const custo = Math.max(numero(movimento.produto.preco_custo), 0);
      const receita = quantidade * venda;
      receitaEstimada += receita;
      lucroEstimado += quantidade * (venda - custo);

      const atual = ranking.get(movimento.produto_id) ?? {
        nome: movimento.produto.nome,
        quantidade: 0,
        receitaEstimada: 0,
      };
      atual.quantidade += quantidade;
      atual.receitaEstimada += receita;
      ranking.set(movimento.produto_id, atual);
    }

    const categoriasMapa = new Map<string, number>();
    for (const produto of produtos) {
      const categoria = produto.categoria?.trim() || "Sem categoria";
      const valor =
        Math.max(numero(produto.quantidade_atual), 0) *
        Math.max(numero(produto.preco_custo), 0);
      categoriasMapa.set(categoria, (categoriasMapa.get(categoria) ?? 0) + valor);
    }

    const topProdutos = Array.from(ranking.values())
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 8);
    const categorias = Array.from(categoriasMapa.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .filter((item) => item.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
    const margemEstimada =
      receitaEstimada > 0 ? (lucroEstimado / receitaEstimada) * 100 : 0;
    const ultimoMovimento = movimentos.at(-1)?.criado_em ?? null;

    const dadosAssinatura = {
      periodo,
      totalProdutos: produtos.length,
      totalMovimentos: movimentos.length,
      ultimoMovimento,
      valorEstoque: Number(valorEstoque.toFixed(2)),
      abaixoMinimo: abaixoMinimo.length,
      semMovimentacao: semMovimentacao.length,
      valorPerdas: Number(valorPerdas.toFixed(2)),
      receitaEstimada: Number(receitaEstimada.toFixed(2)),
      lucroEstimado: Number(lucroEstimado.toFixed(2)),
    };
    const assinaturaDados = createHash("sha256")
      .update(JSON.stringify(dadosAssinatura))
      .digest("hex");

    const montarResposta = (
      mensagem: string | null,
      limiteSegundos: number,
      limiteMensalAtingido = false,
    ) => {
      const diagnostico = diagnosticoDoCache(cache);
      return NextResponse.json({
        periodo,
        atualizadoEm: new Date().toISOString(),
        temDados: produtos.length > 0 || movimentos.length > 0,
        metricas: {
          valorEstoque,
          abaixoMinimo: abaixoMinimo.length,
          semMovimentacao: semMovimentacao.length,
          valorPerdas,
          receitaEstimada,
          lucroEstimado,
          margemEstimada,
          totalProdutos: produtos.length,
          totalMovimentos: movimentos.length,
        },
        graficos: {
          movimentacoes: Array.from(serieMapa.values()),
          topProdutos,
          categorias,
        },
        diagnostico,
        cache: {
          existe: diagnostico !== null,
          geradoEm: cache?.gerado_em ?? null,
          desatualizado:
            diagnostico !== null && cache?.assinatura_dados !== assinaturaDados,
          podeGerar: limiteSegundos === 0 && !limiteMensalAtingido,
          proximaGeracaoEm:
            limiteSegundos > 0
              ? new Date(Date.now() + limiteSegundos * 1000).toISOString()
              : null,
          limiteMensalAtingido,
        },
        mensagem,
      });
    };

    if (acao === "consultar") {
      const { data: ultimoUso, error: ultimoUsoError } = await supabase
        .from("raio_x_uso")
        .select("criado_em")
        .eq("dono_id", donoId)
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ultimoUsoError) {
        console.error("Erro ao consultar uso do Raio-X:", ultimoUsoError);
      }

      return montarResposta(
        null,
        segundosRestantes(ultimoUso?.criado_em ?? null, INTERVALO_GERACAO_MS),
      );
    }

    const diagnosticoExistente = diagnosticoDoCache(cache);
    if (
      diagnosticoExistente &&
      cache?.assinatura_dados === assinaturaDados
    ) {
      return montarResposta(
        "Os dados não mudaram desde o último diagnóstico. A análise salva foi reutilizada sem custo de IA.",
        0,
      );
    }

    const [{ data: ultimoUso, error: ultimoUsoError }, usoMesRes] =
      await Promise.all([
        supabase
          .from("raio_x_uso")
          .select("criado_em")
          .eq("dono_id", donoId)
          .order("criado_em", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("raio_x_uso")
          .select("id", { count: "exact", head: true })
          .eq("dono_id", donoId)
          .gte("criado_em", inicioDoMes().toISOString()),
      ]);

    if (ultimoUsoError || usoMesRes.error) {
      console.error("Erro ao verificar limites do Raio-X:", {
        ultimoUsoError,
        usoMesError: usoMesRes.error,
      });
      return respostaErro("Não foi possível validar o limite da IA", 500);
    }

    const limiteSegundos = segundosRestantes(
      ultimoUso?.criado_em ?? null,
      INTERVALO_GERACAO_MS,
    );
    const limiteMensalAtingido = (usoMesRes.count ?? 0) >= LIMITE_MENSAL;

    if (limiteSegundos > 0 || limiteMensalAtingido) {
      return montarResposta(
        limiteMensalAtingido
          ? "O limite mensal de diagnósticos desta conta foi atingido. Os gráficos continuam atualizados."
          : "Um novo diagnóstico poderá ser gerado após o intervalo de 24 horas. Os gráficos continuam atualizados.",
        limiteSegundos,
        limiteMensalAtingido,
      );
    }

    const gerandoRecente =
      cache?.status === "gerando" &&
      segundosRestantes(cache.atualizado_em, TRAVA_GERACAO_MS) > 0;

    if (gerandoRecente) {
      return NextResponse.json(
        {
          error: "geracao_em_andamento",
          message: "Já existe um diagnóstico sendo gerado para este período.",
        },
        { status: 409 },
      );
    }

    const agoraIso = new Date().toISOString();
    let bloqueioAdquirido = false;

    if (!cache) {
      const { data: inserido, error: inserirError } = await supabase
        .from("raio_x_diagnosticos")
        .insert({
          dono_id: donoId,
          periodo,
          assinatura_dados: assinaturaDados,
          status: "gerando",
          atualizado_em: agoraIso,
        })
        .select("*")
        .maybeSingle();

      if (!inserirError && inserido) {
        cache = inserido as CacheBanco;
        bloqueioAdquirido = true;
      }
    } else {
      const { data: atualizado, error: atualizarError } = await supabase
        .from("raio_x_diagnosticos")
        .update({
          assinatura_dados: assinaturaDados,
          status: "gerando",
          atualizado_em: agoraIso,
        })
        .eq("id", cache.id)
        .eq("atualizado_em", cache.atualizado_em)
        .select("*")
        .maybeSingle();

      if (!atualizarError && atualizado) {
        cache = atualizado as CacheBanco;
        bloqueioAdquirido = true;
      }
    }

    if (!bloqueioAdquirido || !cache) {
      return NextResponse.json(
        {
          error: "geracao_em_andamento",
          message: "Outra solicitação já iniciou a geração do diagnóstico.",
        },
        { status: 409 },
      );
    }

    const dadosParaIa = {
      periodo,
      valorEstoque,
      abaixoMinimo: abaixoMinimo.length,
      semMovimentacao: semMovimentacao.length,
      valorPerdas,
      receitaEstimada,
      lucroEstimado,
      margemEstimada,
      topProdutos: topProdutos.slice(0, 5),
      produtosCriticos: abaixoMinimo.slice(0, 8).map((produto) => ({
        nome: produto.nome,
        atual: numero(produto.quantidade_atual),
        minimo: numero(produto.quantidade_minima),
      })),
    };

    try {
      const respostaIa = await chamarIAJson<unknown>(`Você analisa dados de estoque de um pequeno negócio. Responda SOMENTE JSON válido no formato {"resumo":"string","prioridades":["string"],"pontosAtencao":["string"],"acoes":["string"]}. Use português brasileiro e tom direto. O resumo deve ter no máximo 3 frases. Cada lista deve ter no máximo 4 itens curtos e acionáveis. Não invente números, datas, tendências ou causas. Se não houver evidência suficiente, diga isso. Considere receita, lucro e perdas como estimativas baseadas nos preços atuais. Dados calculados pelo sistema: ${JSON.stringify(
        dadosParaIa,
      )}`);
      const diagnostico = validarDiagnostico(respostaIa);
      const geradoEm = new Date().toISOString();

      const { data: salvo, error: salvarError } = await supabase
        .from("raio_x_diagnosticos")
        .update({
          assinatura_dados: assinaturaDados,
          resumo: diagnostico.resumo,
          prioridades: diagnostico.prioridades,
          pontos_atencao: diagnostico.pontosAtencao,
          acoes: diagnostico.acoes,
          status: "concluido",
          gerado_em: geradoEm,
          atualizado_em: geradoEm,
        })
        .eq("id", cache.id)
        .select("*")
        .single();

      if (salvarError) throw salvarError;
      cache = salvo as CacheBanco;

      const { error: usoError } = await supabase.from("raio_x_uso").insert({
        dono_id: donoId,
        periodo,
        criado_em: geradoEm,
      });

      if (usoError) {
        console.error("Diagnóstico salvo, mas uso não foi registrado:", usoError);
      }

      return montarResposta(
        "Novo diagnóstico gerado e salvo. Você pode abri-lo quantas vezes quiser sem nova chamada à IA.",
        Math.ceil(INTERVALO_GERACAO_MS / 1000),
      );
    } catch (error: unknown) {
      console.error("Erro ao gerar diagnóstico do Raio-X:", error);
      await supabase
        .from("raio_x_diagnosticos")
        .update({ status: "falhou", atualizado_em: new Date().toISOString() })
        .eq("id", cache.id);

      return NextResponse.json(
        {
          error: "falha_ia",
          message:
            "Os números e gráficos foram atualizados, mas a IA não conseguiu gerar o texto.",
        },
        { status: 502 },
      );
    }
  } catch (error: unknown) {
    console.error("Erro inesperado no Raio-X:", error);
    return respostaErro("Erro interno ao gerar o Raio-X", 500);
  }
}
