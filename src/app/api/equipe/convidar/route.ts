import { randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const LIMITES_USUARIOS: Record<string, number> = {
  iniciante: 2 ,
  profissional: 2,
  negocio: 2,
}

const NOMES_PLANOS: Record<string, string> = {
  iniciante: 'Iniciante',
  profissional: 'Profissional',
  negocio: 'Negócio',
}

interface CorpoConvite {
  email?: unknown
}

function respostaErro(error: string, status: number, extras?: object) {
  return NextResponse.json(
    {
      error,
      ...(extras ?? {}),
    },
    { status }
  )
}

function normalizarEmail(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim().toLowerCase() : ''
}

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function gerarSenhaSegura(tamanho = 16): string {
  const maiusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const minusculas = 'abcdefghijkmnopqrstuvwxyz'
  const numeros = '23456789'
  const especiais = '!@#$%'
  const todos = `${maiusculas}${minusculas}${numeros}${especiais}`

  const escolher = (caracteres: string): string => {
    const limite = 256 - (256 % caracteres.length)
    let byte = randomBytes(1)[0]

    while (byte >= limite) {
      byte = randomBytes(1)[0]
    }

    return caracteres[byte % caracteres.length]
  }

  const caracteres = [
    escolher(maiusculas),
    escolher(minusculas),
    escolher(numeros),
    escolher(especiais),
  ]

  while (caracteres.length < Math.max(tamanho, 12)) {
    caracteres.push(escolher(todos))
  }

  for (let indice = caracteres.length - 1; indice > 0; indice -= 1) {
    const byte = randomBytes(1)[0]
    const destino = byte % (indice + 1)
    ;[caracteres[indice], caracteres[destino]] = [
      caracteres[destino],
      caracteres[indice],
    ]
  }

  return caracteres.join('')
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    console.error('Variáveis obrigatórias do Supabase não configuradas.')
    return respostaErro('Configuração interna indisponível.', 500)
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return respostaErro('Não autenticado.', 401)
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    return respostaErro('Token de acesso não informado.', 401)
  }

  let corpo: CorpoConvite

  try {
    corpo = (await req.json()) as CorpoConvite
  } catch {
    return respostaErro('Corpo da requisição inválido.', 400)
  }

  const email = normalizarEmail(corpo.email)

  if (!email) {
    return respostaErro('E-mail é obrigatório.', 400)
  }

  if (email.length > 160 || !emailValido(email)) {
    return respostaErro('E-mail inválido.', 400)
  }

  const supabaseAuth = createClient(supabaseUrl, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser(token)

  if (authError || !user) {
    return respostaErro('Token inválido ou expirado.', 401)
  }

  const donoId = user.id
  const emailDono = user.email?.trim().toLowerCase()

  if (emailDono && email === emailDono) {
    return respostaErro('Use um e-mail diferente do proprietário.', 409)
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  try {
    const {
      data: vinculosSolicitante,
      error: vinculoSolicitanteError,
    } = await supabaseAdmin
      .from('membros')
      .select('id, nivel, dono_id, status')
      .eq('user_id', donoId)

    if (vinculoSolicitanteError) {
      throw vinculoSolicitanteError
    }

    const solicitanteEhFuncionario = (vinculosSolicitante ?? []).some(
      (vinculo) =>
        vinculo.nivel === 'funcionario' && vinculo.status !== 'inativo'
    )

    if (solicitanteEhFuncionario) {
      return respostaErro('Apenas proprietários podem convidar usuários.', 403)
    }

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfis')
      .select('id, tipo_plano, plano, is_admin')
      .eq('id', donoId)
      .maybeSingle()

    if (perfilError) {
      throw perfilError
    }

    if (!perfil) {
      return respostaErro('Perfil do proprietário não encontrado.', 404)
    }

    const tipoPlano = String(
      perfil.tipo_plano || perfil.plano || 'iniciante'
    ).toLowerCase()
    const limiteTotal = LIMITES_USUARIOS[tipoPlano] ?? 1
    const limiteAdicionais = Math.max(limiteTotal - 1, 0)

    const {
      count: totalFuncionarios,
      error: contagemError,
    } = await supabaseAdmin
      .from('membros')
      .select('id', { count: 'exact', head: true })
      .eq('dono_id', donoId)
      .eq('nivel', 'funcionario')
      .in('status', ['ativo', 'pendente'])

    if (contagemError) {
      throw contagemError
    }

    const totalAdicionaisAtual = totalFuncionarios ?? 0

    if (!perfil.is_admin && totalAdicionaisAtual >= limiteAdicionais) {
      const nomePlano = NOMES_PLANOS[tipoPlano] ?? tipoPlano
      const mensagem =
        limiteAdicionais === 0
          ? `O plano ${nomePlano} permite somente o acesso do proprietário.`
          : `O plano ${nomePlano} permite no máximo 1 usuário adicional.`

      return respostaErro(mensagem, 403, {
        motivo: 'limite_plano',
        limite_total: limiteTotal,
        limite_adicionais: limiteAdicionais,
        adicionais_atuais: totalAdicionaisAtual,
        tipo_plano: tipoPlano,
        upgrade: tipoPlano === 'iniciante',
      })
    }

    const { data: vinculoEmail, error: vinculoEmailError } =
      await supabaseAdmin
        .from('membros')
        .select('id, dono_id, user_id, status')
        .ilike('email', email)
        .maybeSingle()

    if (vinculoEmailError) {
      throw vinculoEmailError
    }

    if (vinculoEmail) {
      if (vinculoEmail.dono_id === donoId) {
        return respostaErro('Este usuário já foi convidado.', 409)
      }

      return respostaErro(
        'Este e-mail já está vinculado a outro estabelecimento.',
        409
      )
    }

    const tempPassword = gerarSenhaSegura(16)
    let usuarioCriadoId: string | null = null

    const { data: authData, error: authCreateError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          deve_alterar_senha: true,
          criado_por_convite_equipe: true,
        },
      })

    if (authCreateError) {
      const mensagem = authCreateError.message.toLowerCase()

      if (
        mensagem.includes('already') ||
        mensagem.includes('registered') ||
        mensagem.includes('exists')
      ) {
        return respostaErro(
          'Este e-mail já possui uma conta. Use outro e-mail para o usuário adicional.',
          409
        )
      }

      throw authCreateError
    }

    usuarioCriadoId = authData.user?.id ?? null

    if (!usuarioCriadoId) {
      throw new Error('A criação do usuário não retornou um identificador.')
    }

    const { error: insertError } = await supabaseAdmin
      .from('membros')
      .insert({
        dono_id: donoId,
        user_id: usuarioCriadoId,
        email,
        nivel: 'funcionario',
        status: 'pendente',
      })

    if (insertError) {
      const { error: cleanupError } =
        await supabaseAdmin.auth.admin.deleteUser(usuarioCriadoId)

      if (cleanupError) {
        console.error(
          'Falha ao remover usuário órfão após erro no vínculo:',
          cleanupError
        )
      }

      if (insertError.code === '23505') {
        return respostaErro('Este usuário já foi convidado.', 409)
      }

      throw insertError
    }

    return NextResponse.json(
      {
        success: true,
        email,
        tempPassword,
        message: `Usuário adicional ${email} criado com sucesso.`,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Erro ao convidar usuário adicional:', error)
    return respostaErro('Não foi possível criar o usuário adicional.', 500)
  }
}
