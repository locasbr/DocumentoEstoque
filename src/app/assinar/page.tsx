'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Loading from '@/components/loading'
import PixQRCode from '@/components/pix-qrcode'

const WHATSAPP_NUMERO = '5522999467499'
const CHAVE_PIX = '3e837146-a5b1-4c55-bd93-71d97260e8d3'
const NOME_RECEBEDOR = 'EstoqueSystem - Lucas'
const CIDADE_RECEBEDOR = 'Saquarema'
const VALOR_MENSAL = 79.90

const BENEFICIOS = [
  'Controle ilimitado de produtos',
  'Dashboard com métricas em tempo real',
  'Alertas de estoque baixo e crítico',
  'Relatórios de entrada e saída',
  'PDV completo com leitor de código de barras',
  'Múltiplos funcionários por conta',
  'Cupom fiscal não-fiscal via WhatsApp',
  'Suporte prioritário via WhatsApp',
  'Atualizações e novos recursos inclusos',
]

export default function AssinarPage() {
  const router = useRouter()
  const [emailUsuario, setEmailUsuario] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verificar = async () => {
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.push('/login')
        return
      }

      setEmailUsuario(data.session.user.email ?? '')

      const { data: perfil } = await supabase
        .from('perfis')
        .select('plano, trial_fim')
        .eq('id', data.session.user.id)
        .single()

      if (perfil?.plano === 'ativo') {
        router.push('/dashboard')
        return
      }

      setLoading(false)
    }

    verificar()
  }, [router])

  const mensagemWhatsApp = encodeURIComponent(
    `Quero assinar o EstoqueSystem R$79,90/mês.\nMeu email: ${emailUsuario}`
  )
  const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMERO}?text=${mensagemWhatsApp}`

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 mb-2">
            <span className="text-4xl">🔒</span>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Seu período de teste encerrou
          </h1>
          <p className="text-gray-400 text-lg">
            Assine o{' '}
            <span className="text-white font-semibold">EstoqueSystem</span> e
            continue gerenciando seu estoque sem interrupções.
          </p>
        </div>

        {/* Card do Plano */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-8 space-y-6 backdrop-blur-sm">

          {/* Preço */}
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-400 uppercase tracking-wider font-medium">
              Plano Profissional
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-sm text-gray-400">R$</span>
              <span className="text-5xl font-extrabold text-white">79</span>
              <span className="text-2xl font-bold text-white">,90</span>
              <span className="text-gray-400 ml-1">/mês</span>
            </div>
          </div>

          <div className="border-t border-gray-700" />

          {/* Benefícios */}
          <ul className="space-y-3">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-gray-300">
                <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-gray-700" />

          {/* QR CODE PIX */}
          <PixQRCode
            chavePix={CHAVE_PIX}
            nomeRecebedor={NOME_RECEBEDOR}
            cidadeRecebedor={CIDADE_RECEBEDOR}
            valor={VALOR_MENSAL}
          />

          <div className="border-t border-gray-700" />

          {/* Botão WhatsApp */}
          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 fill-current"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Confirmar pagamento via WhatsApp
          </a>

          {/* Aviso */}
          <p className="text-center text-gray-500 text-sm">
            ⏳ Após o pagamento, seu acesso será liberado em até{' '}
            <span className="text-yellow-400 font-medium">1 hora</span>.
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs">
          Dúvidas? Fale conosco pelo mesmo WhatsApp acima.
        </p>
      </div>
    </div>
  )
}