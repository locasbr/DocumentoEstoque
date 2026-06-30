'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Circle,
  Download,
  Printer,
  ArrowLeft,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

const CHECKLIST = [
  {
    categoria: '📄 Documentos e Burocracia',
    cor: 'blue',
    itens: [
      'Definir tipo de empresa (MEI ou ME)',
      'Abrir CNPJ no Portal do Empreendedor',
      'Solicitar Alvará de Funcionamento na prefeitura',
      'Conseguir licença da Vigilância Sanitária',
      'Conseguir vistoria do Corpo de Bombeiros',
      'Abrir conta bancária PJ',
      'Contratar contador (se for ME)',
    ],
  },
  {
    categoria: '📍 Ponto Comercial',
    cor: 'purple',
    itens: [
      'Pesquisar 5+ pontos diferentes',
      'Verificar movimento de pedestres (50+/hora)',
      'Mapear concorrência num raio de 1km',
      'Negociar aluguel (máx 10-15% do faturamento esperado)',
      'Verificar acessibilidade e estacionamento',
      'Assinar contrato de aluguel com caução',
      'Fazer reforma básica (pintura, iluminação)',
    ],
  },
  {
    categoria: '🛠️ Equipamentos Essenciais',
    cor: 'green',
    itens: [
      'Geladeira comercial (1-2 unidades)',
      'Freezer horizontal',
      'Balança digital (homologada INMETRO)',
      'Leitor de código de barras USB',
      'Computador ou tablet pro PDV',
      'Impressora de cupom (opcional)',
      'Prateleiras e gôndolas',
      'Cestas e carrinhos',
      'Câmeras de segurança (recomendado)',
    ],
  },
  {
    categoria: '📦 Estoque Inicial (50 produtos)',
    cor: 'orange',
    itens: [
      'Alimentos básicos: 15 itens (arroz, feijão, açúcar...)',
      'Bebidas: 10 itens (refri, água, suco...)',
      'Limpeza: 10 itens (detergente, sabão...)',
      'Higiene: 10 itens (papel higiênico, sabonete...)',
      'Bônus: 5 itens (cigarro, pilha, bala...)',
      'Negociar com 3-5 fornecedores diferentes',
      'Comprar pouca quantidade de cada (testa o giro)',
    ],
  },
  {
    categoria: '💻 Sistema e Tecnologia',
    cor: 'cyan',
    itens: [
      'Contratar sistema de gestão (EstoqueSystem 15 dias grátis)',
      'Cadastrar todos os 50 produtos no sistema',
      'Configurar preços e margens de lucro',
      'Treinar uso do PDV',
      'Criar WhatsApp Business',
      'Criar Instagram do mercadinho',
      'Configurar maquininha de cartão (PIX/débito/crédito)',
    ],
  },
  {
    categoria: '💰 Capital de Giro',
    cor: 'emerald',
    itens: [
      'Reservar 3 meses de aluguel',
      'Reservar 3 meses de contas (luz, água, internet)',
      'Reservar capital pra repor estoque',
      'NUNCA usar capital de giro pra contas pessoais',
      'Abrir poupança separada pra emergência',
    ],
  },
  {
    categoria: '📣 Marketing Inicial',
    cor: 'pink',
    itens: [
      'Criar logo simples (Canva grátis)',
      'Mandar fazer fachada com placa profissional',
      'Imprimir 500-1000 panfletos',
      'Distribuir panfletos no bairro (1 semana antes de abrir)',
      'Postar diariamente no Instagram (15 dias antes)',
      'Promoção de inauguração (10-20% off na 1ª semana)',
      'Cadastrar no Google Meu Negócio (GRÁTIS!)',
    ],
  },
  {
    categoria: '👥 Equipe e Operação',
    cor: 'amber',
    itens: [
      'Trabalhar SOZINHO no 1º mês (entende o movimento)',
      'Definir horário de funcionamento (testar abertura)',
      'Criar rotina de abertura e fechamento',
      'Estabelecer regras claras de fiado',
      'Criar lista de fornecedores de confiança',
      'Definir dia/horário de receber mercadoria',
    ],
  },
]

export default function ChecklistPage() {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggleItem = (item: string) => {
    const newChecked = new Set(checked)
    if (newChecked.has(item)) {
      newChecked.delete(item)
    } else {
      newChecked.add(item)
    }
    setChecked(newChecked)
  }

  const totalItens = CHECKLIST.reduce((acc, cat) => acc + cat.itens.length, 0)
  const totalChecked = checked.size
  const porcentagem = Math.round((totalChecked / totalItens) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-green-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Voltar ao Blog</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition print:hidden"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold mb-4">
            📋 CHECKLIST INTERATIVO
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Checklist Completo:{' '}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              Abrir Mercadinho do Zero
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {totalItens} itens organizados em 8 categorias. Marque conforme
            for fazendo e acompanhe seu progresso em tempo real!
          </p>
        </div>

        {/* Barra de Progresso */}
        <div className="mb-10 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg print:hidden">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-900 dark:text-white">
              Seu progresso
            </p>
            <p className="font-bold text-2xl text-green-600 dark:text-green-400">
              {porcentagem}%
            </p>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
              style={{ width: `${porcentagem}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {totalChecked} de {totalItens} itens concluídos
          </p>
        </div>

        {/* Categorias */}
        <div className="space-y-8">
          {CHECKLIST.map((categoria) => {
            const itensChecked = categoria.itens.filter((item) =>
              checked.has(item)
            ).length
            const completo = itensChecked === categoria.itens.length

            return (
              <div
                key={categoria.categoria}
                className={`bg-white dark:bg-gray-900 border-2 rounded-2xl p-6 transition-all ${
                  completo
                    ? 'border-green-500 shadow-lg shadow-green-500/10'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    {categoria.categoria}
                  </h2>
                  <span
                    className={`text-sm font-bold px-3 py-1 rounded-full ${
                      completo
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {itensChecked}/{categoria.itens.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {categoria.itens.map((item) => {
                    const isChecked = checked.has(item)
                    return (
                      <button
                        key={item}
                        onClick={() => toggleItem(item)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                          isChecked
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-blue-400'
                        }`}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`text-sm md:text-base ${
                            isChecked
                              ? 'text-gray-500 dark:text-gray-500 line-through'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {item}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA Final */}
        <div className="mt-12 p-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl text-white text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl md:text-3xl font-extrabold mb-3">
            Já tá no item de Sistema?
          </h3>
          <p className="text-green-50 mb-6 max-w-md mx-auto">
            Comece com o EstoqueSystem grátis por 15 dias. Sem cartão, sem
            compromisso. Ideal pra quem tá começando!
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-3 rounded-full hover:shadow-2xl transition"
          >
            Começar teste grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Compartilhamento */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl text-center print:hidden">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Conhece alguém que tá pensando em abrir mercadinho? Compartilha esse
            checklist! 💚
          </p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              'Olha esse checklist pra abrir mercadinho — é grátis e muito completo! https://estoquesystem.com.br/checklist-abrir-mercadinho'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline"
          >
            📱 Compartilhar no WhatsApp
          </a>
        </div>
      </main>
    </div>
  )
}