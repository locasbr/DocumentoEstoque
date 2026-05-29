const FROM_EMAIL = 'EstoqueSystem <onboarding@resend.dev>'

async function getResend() {
  const { Resend } = await import('resend')
  return new Resend(process.env.RESEND_API_KEY)
}

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
          <p>Sua conta foi criada com sucesso. Você tem <strong>15 dias grátis</strong> para testar todas as funcionalidades:</p>
          <ul>
            <li>✅ Controle de estoque completo</li>
            <li>✅ PDV com leitor de código de barras</li>
            <li>✅ Relatórios de vendas e lucro</li>
            <li>✅ Alertas de estoque baixo</li>
            <li>✅ Gestão de equipe</li>
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

export async function enviarLembreteTrial(email: string, nome: string, diasRestantes: number) {
  try {
    const resend = await getResend()
    const urgencia = diasRestantes <= 1 ? '🚨' : '⏰'
    const assunto = diasRestantes <= 1
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
          <p>${diasRestantes <= 1
            ? 'Seu teste no EstoqueSystem expira <strong>amanhã</strong>!'
            : `Faltam apenas <strong>${diasRestantes} dias</strong> para seu teste expirar.`
          }</p>
          <p>Para continuar usando, assine agora por apenas <strong>R$ 79,90/mês</strong>.</p>
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

export async function enviarConfirmacaoPagamento(email: string, nome: string) {
  try {
    const resend = await getResend()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '✅ Pagamento confirmado — Bem-vindo ao EstoqueSystem Pro!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a;">✅ Pagamento confirmado!</h1>
          <p>Olá, <strong>${nome || 'parceiro(a)'}</strong>!</p>
          <p>Seu pagamento foi aprovado e seu <strong>Plano Profissional</strong> já está ativo.</p>
          <ul>
            <li>📦 Estoque ilimitado</li>
            <li>🛒 PDV completo</li>
            <li>📊 Relatórios avançados</li>
            <li>👥 Equipe ilimitada</li>
            <li>💬 Suporte prioritário</li>
          </ul>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Obrigado por confiar no EstoqueSystem!<br>
            — Lucas Machado
          </p>
        </div>
      `,
    })
    console.log(`✅ Confirmação de pagamento enviada para ${email}`)
  } catch (error) {
    console.error('Erro ao enviar confirmação:', error)
  }
}