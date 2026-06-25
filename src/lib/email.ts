const FROM_EMAIL = 'EstoqueSystem <onboarding@resend.dev>'

interface PlanoInfo {
  nome: string
  preco: number
}

const PLANOS: Record<string, PlanoInfo> = {
  iniciante: { nome: 'Iniciante', preco: 39.9 },
  profissional: { nome: 'Profissional', preco: 79.9 },
  negocio: { nome: 'Negócio', preco: 149.9 },
}

function getPlanoInfo(tipoPlano?: string): PlanoInfo {
  if (tipoPlano && tipoPlano in PLANOS) {
    return PLANOS[tipoPlano]
  }
  // Fallback genérico se não souber o plano
  return { nome: 'Profissional', preco: 79.9 }
}

async function getResend() {
  const { Resend } = await import('resend')
  return new Resend(process.env.RESEND_API_KEY)
}

// ════════════════════════════════════════════════════
// 📧 EMAIL DE BOAS-VINDAS
// ════════════════════════════════════════════════════
export async function enviarBoasVindas(email: string, nome: string) {
  try {
    const resend = await getResend()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '🎉 Bem-vindo ao EstoqueSystem! Seus 15 dias grátis começaram',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a;">📦 Bem-vindo ao EstoqueSystem!</h1>
          <p>Olá, <strong>${nome || 'parceiro(a)'}</strong>!</p>
          <p>Sua conta foi criada com sucesso. Você tem <strong>15 dias grátis</strong> com acesso completo a TODAS as funcionalidades — incluindo as features de Inteligência Artificial:</p>
          <ul>
            <li>✅ Controle de estoque completo</li>
            <li>✅ PDV com leitor de código de barras</li>
            <li>✅ Relatórios de vendas e lucro</li>
            <li>✅ Alertas de estoque baixo</li>
            <li>✅ Gestão de clientes e fiado</li>
            <li>✅ Importação de produtos via CSV</li>
            <li>✨ Análise mensal com IA</li>
            <li>✨ Cadastro automático de produtos com IA</li>
            <li>✨ Sugestão inteligente de preço com IA</li>
          </ul>
          <p>Depois dos 15 dias, escolha o plano ideal pro seu negócio:</p>
          <ul>
            <li><strong>Iniciante</strong> — R$ 39,90/mês (até 100 produtos)</li>
            <li><strong>Profissional</strong> — R$ 79,90/mês (mais popular)</li>
            <li><strong>Negócio</strong> — R$ 149,90/mês (com IA completa)</li>
          </ul>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Dúvidas? Fale comigo no WhatsApp.<br>
            — Lucas Machado, criador do EstoqueSystem
          </p>
        </div>
      `,
    })
    console.log(`✅ Email de boas-vindas enviado para ${email}`)
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error)
  }
}

// ════════════════════════════════════════════════════
// 📧 EMAIL DE LEMBRETE DE TRIAL EXPIRANDO
// ════════════════════════════════════════════════════
export async function enviarLembreteTrial(
  email: string,
  nome: string,
  diasRestantes: number
) {
  try {
    const resend = await getResend()
    const urgencia = diasRestantes <= 1 ? '🚨' : '⏰'
    const assunto =
      diasRestantes <= 1
        ? `${urgencia} Seu teste no EstoqueSystem expira AMANHÃ!`
        : `${urgencia} Seu teste no EstoqueSystem expira em ${diasRestantes} dias`

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: assunto,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ea580c;">${urgencia} Seu período de teste está acabando!</h1>
          <p>Olá, <strong>${nome || 'parceiro(a)'}</strong>!</p>
          <p>${
            diasRestantes <= 1
              ? 'Seu teste no EstoqueSystem expira <strong>amanhã</strong>!'
              : `Faltam apenas <strong>${diasRestantes} dias</strong> para seu teste expirar.`
          }</p>
          <p>Para continuar usando, escolha o plano ideal pro seu negócio:</p>
          <ul>
            <li><strong>Iniciante</strong> — R$ 39,90/mês (até 100 produtos, ideal pra começar)</li>
            <li><strong>Profissional</strong> — R$ 79,90/mês (mais popular, com IA de análise)</li>
            <li><strong>Negócio</strong> — R$ 149,90/mês (com IA completa pra cadastro e preço)</li>
          </ul>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Aceitamos PIX e cartão via Mercado Pago. O acesso é liberado na hora!<br>
            — Lucas Machado
          </p>
        </div>
      `,
    })
    console.log(`✅ Lembrete de trial enviado para ${email} (${diasRestantes}d)`)
  } catch (error) {
    console.error('Erro ao enviar lembrete:', error)
  }
}

// ════════════════════════════════════════════════════
// 📧 EMAIL DE CONFIRMAÇÃO DE PAGAMENTO
// ════════════════════════════════════════════════════
export async function enviarConfirmacaoPagamento(
  email: string,
  nome: string,
  tipoPlano?: string
) {
  try {
    const resend = await getResend()
    const plano = getPlanoInfo(tipoPlano)

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `✅ Pagamento confirmado — Plano ${plano.nome} ativo!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a;">✅ Pagamento confirmado!</h1>
          <p>Olá, <strong>${nome || 'parceiro(a)'}</strong>!</p>
          <p>Seu pagamento foi aprovado e seu <strong>Plano ${plano.nome}</strong> (R$ ${plano.preco
        .toFixed(2)
        .replace('.', ',')}/mês) já está ativo.</p>
          ${gerarBeneficiosHtml(tipoPlano)}
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Obrigado por confiar no EstoqueSystem!<br>
            — Lucas Machado
          </p>
        </div>
      `,
    })
    console.log(`✅ Confirmação de pagamento (${plano.nome}) enviada para ${email}`)
  } catch (error) {
    console.error('Erro ao enviar confirmação:', error)
  }
}

// ════════════════════════════════════════════════════
// 🎁 HELPER: Lista benefícios por plano
// ════════════════════════════════════════════════════
function gerarBeneficiosHtml(tipoPlano?: string): string {
  if (tipoPlano === 'iniciante') {
    return `
      <p>Você agora tem acesso a:</p>
      <ul>
        <li>📦 Até 100 produtos</li>
        <li>🛒 PDV completo</li>
        <li>📷 Leitor de código de barras</li>
        <li>🔔 Alertas de estoque baixo</li>
        <li>📊 Relatórios básicos</li>
        <li>📧 Suporte por email</li>
      </ul>
    `
  }

  if (tipoPlano === 'negocio') {
    return `
      <p>Você agora tem acesso a TUDO do EstoqueSystem:</p>
      <ul>
        <li>📦 Produtos ilimitados</li>
        <li>👥 Até 10 usuários</li>
        <li>🛒 PDV completo + Clientes + Fiado</li>
        <li>📊 Relatórios avançados (lucro/margem)</li>
        <li>📥 Importação CSV</li>
        <li>📅 Histórico estendido (24 meses)</li>
        <li>✨ IA pra análise mensal de vendas</li>
        <li>✨ IA pra cadastro automático de produtos</li>
        <li>✨ IA pra sugestão inteligente de preço</li>
        <li>💬 Suporte VIP por WhatsApp</li>
      </ul>
    `
  }

  // Default: profissional
  return `
    <p>Você agora tem acesso a:</p>
    <ul>
      <li>📦 Produtos ilimitados</li>
      <li>👥 Até 3 usuários</li>
      <li>🛒 PDV completo + Clientes + Fiado</li>
      <li>📅 Controle de validade</li>
      <li>📊 Relatórios avançados (lucro/margem)</li>
      <li>📥 Importação CSV</li>
      <li>💬 Cupom via WhatsApp</li>
      <li>✨ IA pra análise mensal de vendas</li>
      <li>📞 Suporte prioritário via WhatsApp</li>
    </ul>
  `
}