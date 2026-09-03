import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PLANOS = {
  iniciante: {
    nome: "EstoqueSystem - Plano Iniciante",
    preco: 39.9,
  },
  profissional: {
    nome: "EstoqueSystem - Plano Profissional",
    preco: 79.9,
  },
} as const;

type PlanoDisponivel = keyof typeof PLANOS;

interface RespostaMercadoPago {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  status?: string;
  message?: string;
  error?: string;
  cause?: Array<{
    code?: string | number;
    description?: string;
  }>;
}

function isPlanoDisponivel(valor: unknown): valor is PlanoDisponivel {
  return valor === "iniciante" || valor === "profissional";
}

function responderErro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status });
}

function normalizarSiteUrl(valor: string | undefined): string {
  const siteUrl = valor?.trim() || "https://estoquesystem.com.br";
  return siteUrl.replace(/\/+$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const siteUrl = normalizarSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

    if (!supabaseUrl || !publishableKey || !serviceRoleKey || !accessToken) {
      console.error("Configuração ausente na criação de assinatura", {
        temSupabaseUrl: Boolean(supabaseUrl),
        temPublishableKey: Boolean(publishableKey),
        temServiceRoleKey: Boolean(serviceRoleKey),
        temMercadoPagoToken: Boolean(accessToken),
      });

      return responderErro("Configuração do servidor incompleta", 500);
    }

    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return responderErro("Não autenticado", 401);
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return responderErro("Não autenticado", 401);
    }

    const supabaseAuth = createClient(supabaseUrl, publishableKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user?.email) {
      console.error("Sessão inválida ao criar assinatura:", authError);
      return responderErro("Sessão inválida ou expirada", 401);
    }

    let body: { tipoPlano?: unknown };

    try {
      body = (await req.json()) as { tipoPlano?: unknown };
    } catch {
      return responderErro("Corpo da requisição inválido", 400);
    }

    if (!isPlanoDisponivel(body.tipoPlano)) {
      return responderErro(
        "Plano indisponível para novas assinaturas",
        400,
      );
    }

    const tipoPlano = body.tipoPlano;
    const plano = PLANOS[tipoPlano];

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from("perfis")
      .select(
        "plano, tipo_plano, tipo_pagamento, subscription_id, plano_fim",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (perfilError) {
      console.error("Erro ao consultar perfil:", perfilError);
      return responderErro(
        "Não foi possível verificar o plano atual",
        500,
      );
    }

    if (!perfil) {
      return responderErro("Perfil não encontrado", 404);
    }

    if (perfil.tipo_plano === "negocio") {
      return responderErro(
        "O plano Negócio legado deve ser gerenciado pelo suporte",
        409,
      );
    }

    const possuiAssinaturaRecorrente =
      typeof perfil.subscription_id === "string" &&
      perfil.subscription_id.trim().length > 0;

    if (possuiAssinaturaRecorrente) {
      return responderErro(
        "Já existe uma assinatura recorrente vinculada a esta conta. Solicite suporte para evitar cobrança duplicada.",
        409,
      );
    }

    if (
      perfil.plano === "ativo" &&
      perfil.tipo_plano === "profissional" &&
      tipoPlano === "iniciante"
    ) {
      return responderErro(
        "O downgrade de Profissional para Iniciante deve ser solicitado ao suporte.",
        409,
      );
    }

    if (perfil.plano === "ativo") {
      return responderErro(
        "Esta conta já possui um período ativo. Para iniciar uma assinatura recorrente sem perder o período pago, solicite atendimento ao suporte.",
        409,
      );
    }

    const payload = {
      reason: plano.nome,
      external_reference: `${user.id}|${tipoPlano}`,
      payer_email: user.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: plano.preco,
        currency_id: "BRL",
      },
      back_url: `${siteUrl}/dashboard?pagamento=sucesso`,
      status: "pending",
    };

    const mpResponse = await fetch(
      "https://api.mercadopago.com/preapproval",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );

    let data: RespostaMercadoPago;

    try {
      data = (await mpResponse.json()) as RespostaMercadoPago;
    } catch (parseError: unknown) {
      console.error(
        "Resposta inválida do Mercado Pago ao criar assinatura:",
        parseError,
      );

      return responderErro(
        "O Mercado Pago retornou uma resposta inválida",
        502,
      );
    }

    if (!mpResponse.ok || !data.init_point || !data.id) {
      console.error("Erro Mercado Pago ao criar assinatura:", {
        statusHttp: mpResponse.status,
        resposta: data,
      });

      const detalhe =
        data.cause?.find((item) => item.description)?.description ||
        data.message ||
        data.error;

      return responderErro(
        detalhe
          ? `Não foi possível criar a assinatura: ${detalhe}`
          : "Não foi possível criar a assinatura",
        502,
      );
    }

    console.info("Assinatura pendente criada no Mercado Pago", {
      preapprovalId: data.id,
      userId: user.id,
      tipoPlano,
      status: data.status ?? "pending",
    });

    return NextResponse.json({
      init_point: data.init_point,
      subscription_id: data.id,
      plano: tipoPlano,
      valor: plano.preco,
    });
  } catch (error: unknown) {
    console.error("Erro inesperado ao criar assinatura:", error);
    return responderErro("Erro interno ao criar assinatura", 500);
  }
}
