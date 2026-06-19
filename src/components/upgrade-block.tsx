'use client'

import Link from 'next/link'
import { Crown, Sparkles, ArrowRight, X, Lock } from 'lucide-react'

interface Props {
  titulo: string
  descricao: string
  planoNecessario: 'profissional' | 'negocio'
  onClose?: () => void
  modal?: boolean
}

export default function UpgradeBlock({
  titulo,
  descricao,
  planoNecessario,
  onClose,
  modal = false,
}: Props) {
  const isProfissional = planoNecessario === 'profissional'
  const Icon = isProfissional ? Sparkles : Crown
  const preco = isProfissional ? '79,90' : '149,90'
  const nomePlano = isProfissional ? 'Profissional' : 'Negocio'

  const corBg = isProfissional 
    ? 'from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 border-green-200 dark:border-green-800'
    : 'from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/30 border-purple-200 dark:border-purple-800'
  
  const corIcon = isProfissional ? 'bg-green-600' : 'bg-purple-600'
  const corTexto = isProfissional ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'
  const corBotao = isProfissional 
    ? 'bg-green-600 hover:bg-green-700 hover:shadow-green-600/30'
    : 'bg-purple-600 hover:bg-purple-700 hover:shadow-purple-600/30'

  const conteudo = (
    <div className={`bg-gradient-to-br ${corBg} border rounded-2xl p-6 md:p-10 text-center`}>
      <div className={`w-16 h-16 ${corIcon} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
        <Icon className="w-8 h-8 text-white" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400 mb-4">
        <Lock className="w-3 h-3" />
        Funcionalidade bloqueada
      </div>

      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {titulo}
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
        {descricao}
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 inline-block shadow-sm">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Disponivel no plano
        </p>
        <p className={`text-xl md:text-2xl font-extrabold ${corTexto}`}>
          {nomePlano} - R$ {preco}/mes
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/assinar"
          className={`inline-flex items-center justify-center gap-2 ${corBotao} text-white font-bold py-3 px-8 rounded-full transition shadow-lg`}
        >
          Fazer upgrade agora
          <ArrowRight className="w-5 h-5" />
        </Link>

        <Link
          href="https://wa.me/5522999467499?text=Quero%20fazer%20upgrade%20do%20EstoqueSystem"
          target="_blank"
          className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-full transition border border-gray-200 dark:border-gray-700"
        >
          Falar com Lucas
        </Link>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
        Voce so paga a diferenca pelos dias restantes do mes
      </p>
    </div>
  )

  if (modal) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition z-10"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          {conteudo}
        </div>
      </div>
    )
  }

  return conteudo
}