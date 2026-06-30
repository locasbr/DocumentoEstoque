// src/lib/email-validation.ts

// ════════════════════════════════════════════════════
// 🚫 DOMÍNIOS INVÁLIDOS (NÃO EXISTEM)
// ════════════════════════════════════════════════════
const DOMINIOS_INEXISTENTES = [
  'gmail.com.br',
  'hotmail.com.br',
  'outlook.com.br',
  'icloud.com.br',
  'live.com.br',
]

// ════════════════════════════════════════════════════
// ⌨️ TYPOS COMUNS (correção sugerida)
// ════════════════════════════════════════════════════
const TYPOS_COMUNS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
}

// ════════════════════════════════════════════════════
// 🗑️ EMAILS DESCARTÁVEIS / TEMPORÁRIOS
// ════════════════════════════════════════════════════
const DOMINIOS_DESCARTAVEIS = [
  'tempmail.com',
  'tempmail.org',
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  'temp-mail.org',
  'fakeinbox.com',
  'trashmail.com',
  'yopmail.com',
  'getnada.com',
  'maildrop.cc',
  'sharklasers.com',
  'dispostable.com',
]

// ════════════════════════════════════════════════════
// ✅ RESULTADO DA VALIDAÇÃO
// ════════════════════════════════════════════════════
export interface ResultadoValidacao {
  valido: boolean
  erro?: string
  sugestao?: string
}

// ════════════════════════════════════════════════════
// 🛡️ VALIDAÇÃO PRINCIPAL
// ════════════════════════════════════════════════════
export function validarEmail(email: string): ResultadoValidacao {
  if (!email || email.trim().length === 0) {
    return { valido: false, erro: 'Digite seu email' }
  }

  const emailLimpo = email.trim().toLowerCase()

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!regex.test(emailLimpo)) {
    return { valido: false, erro: 'Formato de email inválido' }
  }

  const partes = emailLimpo.split('@')
  if (partes.length !== 2) {
    return { valido: false, erro: 'Email inválido' }
  }

  const usuario = partes[0]
  const dominio = partes[1]

  if (usuario.length < 1) {
    return { valido: false, erro: 'Email inválido' }
  }
  if (usuario.length > 64) {
    return { valido: false, erro: 'Email muito longo' }
  }

  if (!dominio.includes('.')) {
    return { valido: false, erro: 'Domínio do email inválido' }
  }

  // 🚫 Bloqueia domínios INEXISTENTES (gmail.com.br, etc.)
  if (DOMINIOS_INEXISTENTES.includes(dominio)) {
    const dominioCorreto = dominio.replace('.com.br', '.com')
    return {
      valido: false,
      erro: `O domínio "@${dominio}" não existe.`,
      sugestao: `${usuario}@${dominioCorreto}`,
    }
  }

  // ⌨️ Detecta typos comuns
  if (TYPOS_COMUNS[dominio]) {
    return {
      valido: false,
      erro: `Parece que você digitou "@${dominio}" por engano.`,
      sugestao: `${usuario}@${TYPOS_COMUNS[dominio]}`,
    }
  }

  // 🗑️ Bloqueia emails descartáveis
  if (DOMINIOS_DESCARTAVEIS.includes(dominio)) {
    return {
      valido: false,
      erro: 'Não aceitamos emails temporários. Use um email pessoal real.',
    }
  }

  return { valido: true }
}

// ════════════════════════════════════════════════════
// 🔧 NORMALIZA EMAIL (lowercase + trim)
// ════════════════════════════════════════════════════
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}