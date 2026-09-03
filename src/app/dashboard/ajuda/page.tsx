'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Bot,
  ChevronDown,
  CreditCard,
  ExternalLink,
  HelpCircle,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  User,
  Users,
  X,
} from 'lucide-react'

type CorCategoria =
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'emerald'
  | 'pink'
  | 'indigo'

interface PerguntaFAQ {
  pergunta: string
  resposta: string
}

interface CategoriaFAQ {
  categoria: string
  icon: LucideIcon
  cor: CorCategoria
  perguntas: PerguntaFAQ[]
}

interface Tutorial {
  icon: LucideIcon
  titulo: string
  descricao: string
  link: string
  acao: string
}

const FAQ_ITEMS: CategoriaFAQ[] = [
  {
    categoria: 'Primeiros passos',
    icon: Package,
    cor: 'blue',
    perguntas: [
      {
        pergunta: 'Como cadastrar meu primeiro produto?',
        resposta:
          'Acesse Produtos e selecione Novo produto. Informe o nome, o SKU ou código de barras, o preço de venda e a quantidade inicial. Ao salvar, o produto será incluído no estoque.',
      },
      {
        pergunta: 'Posso usar o EstoqueSystem no celular?',
        resposta:
          'Sim. O sistema possui interface adaptada para celular, tablet e computador. Alguns recursos, como leitura pela câmera, também dependem das permissões e da compatibilidade do navegador e do dispositivo.',
      },
      {
        pergunta: 'Preciso instalar algum programa?',
        resposta:
          'Não. O EstoqueSystem funciona pelo navegador e exige conexão com a internet. Para uma melhor experiência, mantenha o navegador atualizado.',
      },
      {
        pergunta: 'Quais planos estão disponíveis?',
        resposta:
          'O EstoqueSystem possui os planos Iniciante, Profissional e Negócio. Os planos se diferenciam pelos limites e recursos disponíveis. Consulte a página de assinatura para ver as condições vigentes antes de contratar ou trocar de plano.',
      },
    ],
  },
  {
    categoria: 'PDV e vendas',
    icon: ShoppingCart,
    cor: 'green',
    perguntas: [
      {
        pergunta: 'Como registrar uma venda?',
        resposta:
          'Acesse o PDV, adicione os produtos ao carrinho, confira as quantidades, selecione a forma de pagamento e finalize a venda. Após a confirmação, o estoque dos itens vendidos é atualizado.',
      },
      {
        pergunta: 'Quais formas de pagamento posso registrar?',
        resposta:
          'O PDV permite registrar as formas de pagamento apresentadas na tela de finalização, como dinheiro, PIX e cartões. O EstoqueSystem registra a forma informada, mas não processa o pagamento da venda do cliente.',
      },
      {
        pergunta: 'O comprovante da venda é fiscal?',
        resposta:
          'Não. O documento gerado pelo EstoqueSystem é um comprovante não fiscal para conferência da venda. Ele não substitui nota fiscal, NFC-e, cupom fiscal ou outro documento tributário exigido pela legislação aplicável ao estabelecimento.',
      },
      {
        pergunta: 'Posso usar um leitor de código de barras USB?',
        resposta:
          'Leitores USB que funcionam como teclado podem ser utilizados para inserir códigos no campo de busca do PDV. O funcionamento pode variar conforme o leitor, o dispositivo e a configuração do navegador.',
      },
    ],
  },
  {
    categoria: 'Estoque e produtos',
    icon: BarChart3,
    cor: 'purple',
    perguntas: [
      {
        pergunta: 'O que significam os alertas de estoque?',
        resposta:
          'Os alertas ajudam a identificar produtos zerados ou abaixo da quantidade mínima cadastrada. Para obter recomendações úteis, mantenha o estoque mínimo de cada produto atualizado.',
      },
      {
        pergunta: 'Como registrar entrada ou saída de mercadoria?',
        resposta:
          'Use a área de movimentações ou estoque disponível no menu. Selecione o produto, o tipo de movimento e a quantidade. Confira os dados antes de confirmar, pois a movimentação altera o saldo do produto.',
      },
      {
        pergunta: 'Como funciona o controle de validade?',
        resposta:
          'Quando o recurso estiver disponível no seu plano, informe a data de validade no cadastro do produto. A data será usada pelo sistema para destacar itens próximos do vencimento ou já vencidos.',
      },
      {
        pergunta: 'Posso importar produtos por CSV?',
        resposta:
          'Se a importação estiver liberada para sua conta, acesse Produtos e depois Importar CSV. Use o modelo apresentado na própria página, revise os dados e confirme a importação. Os limites do cadastro continuam seguindo as regras do seu plano.',
      },
      {
        pergunta: 'Por que um produto com histórico não pode ser excluído?',
        resposta:
          'Produtos ligados a vendas, movimentações ou alertas precisam preservar o histórico do estabelecimento. Nesses casos, desative o produto em vez de excluí-lo.',
      },
    ],
  },
  {
    categoria: 'Clientes e fiado',
    icon: Users,
    cor: 'orange',
    perguntas: [
      {
        pergunta: 'Como cadastrar um cliente?',
        resposta:
          'Acesse Clientes e selecione Novo cliente. O nome é obrigatório. Telefone, CPF, e-mail, endereço e observações devem ser informados apenas quando forem necessários para o atendimento ou para o controle de fiado.',
      },
      {
        pergunta: 'Como registrar um débito de fiado?',
        resposta:
          'Abra os detalhes do cliente e registre um novo débito. Informe o valor e a descrição da movimentação. O saldo devedor será atualizado após a confirmação.',
      },
      {
        pergunta: 'Como registrar um pagamento do cliente?',
        resposta:
          'Nos detalhes do cliente, escolha Registrar pagamento e informe o valor recebido. O pagamento não pode ser maior que o saldo devedor atual.',
      },
      {
        pergunta: 'Por que um cliente com histórico não pode ser excluído?',
        resposta:
          'Clientes associados a vendas ou movimentações de fiado precisam permanecer no sistema para preservar o histórico. A exclusão fica disponível somente quando não existem registros vinculados.',
      },
    ],
  },
  {
    categoria: 'Planos e assinatura',
    icon: CreditCard,
    cor: 'emerald',
    perguntas: [
      {
        pergunta: 'Como funciona o pagamento da assinatura?',
        resposta:
          'A cobrança da assinatura é realizada pelo Mercado Pago conforme as opções exibidas na página de contratação. O acesso ao plano é atualizado após a confirmação do pagamento pelo provedor.',
      },
      {
        pergunta: 'Posso trocar de plano sem apagar meus dados?',
        resposta:
          'A troca de plano não tem a finalidade de apagar seus registros. Entretanto, ao mudar para um plano com menos recursos ou limites menores, algumas funcionalidades podem ficar indisponíveis até que a conta volte a atender às condições do plano.',
      },
      {
        pergunta: 'Como consulto os preços e recursos de cada plano?',
        resposta:
          'Acesse a página de assinatura dentro do sistema. Ela deve ser usada como referência para consultar preços, limites e recursos vigentes.',
      },
      {
        pergunta: 'Esqueci minha senha. O que faço?',
        resposta:
          'Na tela de login, use a opção de recuperação de senha. Siga as instruções enviadas ao e-mail da conta e verifique também a caixa de spam.',
      },
    ],
  },
  {
    categoria: 'Inteligência artificial',
    icon: Bot,
    cor: 'pink',
    perguntas: [
      {
        pergunta: 'Em quais planos a IA está incluída?',
        resposta:
          'Os recursos de inteligência artificial são destinados aos planos Profissional e Negócio. A disponibilidade de cada função deve ser verificada na interface e na página de assinatura.',
      },
      {
        pergunta: 'O que a IA pode ajudar a fazer?',
        resposta:
          'A proposta dos recursos de IA é auxiliar no cadastro de produtos, na sugestão de preço com base nos dados informados e na leitura mensal das vendas em linguagem natural. A decisão final e a conferência dos dados continuam sendo responsabilidade do usuário.',
      },
      {
        pergunta: 'A sugestão de preço da IA é obrigatória?',
        resposta:
          'Não. Uma sugestão automática serve apenas como apoio. Antes de aplicar um preço, confira custo, margem desejada, despesas, impostos e condições comerciais do estabelecimento.',
      },
    ],
  },
  {
    categoria: 'Equipe e segurança',
    icon: ShieldCheck,
    cor: 'indigo',
    perguntas: [
      {
        pergunta: 'Quantos acessos o estabelecimento pode ter?',
        resposta:
          'O estabelecimento pode ter um proprietário e, no máximo, um usuário adicional. Cada pessoa deve utilizar o próprio acesso.',
      },
      {
        pergunta: 'Como cadastrar o usuário adicional?',
        resposta:
          'O proprietário pode acessar Equipe, informar um e-mail diferente do próprio e criar o segundo acesso. Uma senha temporária será exibida para entrega ao usuário adicional.',
      },
      {
        pergunta: 'O que faço quando o usuário adicional não deve mais acessar?',
        resposta:
          'O proprietário pode desativar o acesso na página Equipe. A desativação preserva os registros operacionais já realizados dentro do estabelecimento.',
      },
      {
        pergunta: 'Como proteger minha conta?',
        resposta:
          'Use senhas fortes e diferentes, não compartilhe o acesso do proprietário, confira o endereço do sistema antes de entrar e encerre a sessão em dispositivos compartilhados. Em caso de suspeita de acesso indevido, altere a senha imediatamente.',
      },
    ],
  },
]

const TUTORIAIS: Tutorial[] = [
  {
    icon: Package,
    titulo: 'Cadastrar produto',
    descricao: 'Abra o formulário para incluir um item no catálogo e no estoque.',
    link: '/dashboard/produtos/novo',
    acao: 'Abrir cadastro',
  },
  {
    icon: ShoppingCart,
    titulo: 'Registrar venda',
    descricao: 'Acesse o PDV para adicionar produtos e finalizar uma venda.',
    link: '/dashboard/pdv',
    acao: 'Abrir PDV',
  },
  {
    icon: User,
    titulo: 'Cadastrar cliente',
    descricao: 'Inclua um cliente para vincular vendas e controlar o fiado.',
    link: '/dashboard/clientes/novo',
    acao: 'Novo cliente',
  },
  {
    icon: BarChart3,
    titulo: 'Consultar relatórios',
    descricao: 'Acompanhe os indicadores disponíveis para sua conta.',
    link: '/dashboard/relatorios',
    acao: 'Abrir relatórios',
  },
  {
    icon: AlertCircle,
    titulo: 'Ver alertas',
    descricao: 'Confira produtos zerados, com estoque baixo ou próximos da validade.',
    link: '/dashboard/alertas',
    acao: 'Abrir alertas',
  },
  {
    icon: Users,
    titulo: 'Gerenciar equipe',
    descricao: 'Cadastre ou desative o único usuário adicional da conta.',
    link: '/dashboard/equipe',
    acao: 'Abrir equipe',
  },
]

const SUGESTOES_BUSCA = [
  'produto',
  'venda',
  'fiado',
  'assinatura',
  'equipe',
  'IA',
]

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

function TextoDestacado({ texto, termo }: { texto: string; termo: string }) {
  const busca = termo.trim()
  if (!busca) return <>{texto}</>

  const inicio = normalizarTexto(texto).indexOf(normalizarTexto(busca))
  if (inicio < 0) return <>{texto}</>

  return (
    <>
      {texto.slice(0, inicio)}
      <mark className="rounded bg-yellow-200 px-0.5 text-gray-900 dark:bg-yellow-500/40 dark:text-yellow-100">
        {texto.slice(inicio, inicio + busca.length)}
      </mark>
      {texto.slice(inicio + busca.length)}
    </>
  )
}

export default function AjudaPage() {
  const [busca, setBusca] = useState('')
  const [perguntaAberta, setPerguntaAberta] = useState<string | null>(null)
  const [categoriasFechadas, setCategoriasFechadas] = useState<Set<string>>(
    new Set()
  )

  const termo = normalizarTexto(busca)

  const faqFiltrado = useMemo(
    () =>
      FAQ_ITEMS.map((categoria) => ({
        ...categoria,
        perguntas: categoria.perguntas.filter((item) =>
          normalizarTexto(`${item.pergunta} ${item.resposta}`).includes(termo)
        ),
      })).filter((categoria) => categoria.perguntas.length > 0),
    [termo]
  )

  const tutoriaisFiltrados = useMemo(() => {
    if (!termo) return TUTORIAIS
    return TUTORIAIS.filter((tutorial) =>
      normalizarTexto(`${tutorial.titulo} ${tutorial.descricao}`).includes(termo)
    )
  }, [termo])

  const totalPerguntas = FAQ_ITEMS.reduce(
    (total, categoria) => total + categoria.perguntas.length,
    0
  )
  const totalFaqFiltrada = faqFiltrado.reduce(
    (total, categoria) => total + categoria.perguntas.length,
    0
  )
  const totalResultados = totalFaqFiltrada + tutoriaisFiltrados.length

  const linkWhatsApp = useMemo(() => {
    const mensagem = busca.trim()
      ? `Olá! Procurei por "${busca.trim()}" na Central de Ajuda do EstoqueSystem e ainda tenho uma dúvida.`
      : 'Olá! Preciso de ajuda com o EstoqueSystem.'

    return `https://wa.me/5522999467499?text=${encodeURIComponent(mensagem)}`
  }, [busca])

  const toggleCategoria = (categoria: string) => {
    setCategoriasFechadas((atuais) => {
      const novas = new Set(atuais)
      if (novas.has(categoria)) novas.delete(categoria)
      else novas.add(categoria)
      return novas
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <header className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 px-5 py-8 dark:border-blue-900 dark:from-blue-950/40 dark:to-indigo-950/30 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <HelpCircle className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            Central de Ajuda
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 md:text-base">
            Encontre orientações sobre produtos, vendas, clientes, assinatura e
            acesso ao sistema.
          </p>

          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Digite sua dúvida..."
              aria-label="Buscar na Central de Ajuda"
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-11 text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                aria-label="Limpar busca"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {busca && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {totalResultados > 0
                ? `${totalResultados} resultado(s) encontrado(s)`
                : `Nenhum resultado para “${busca}”`}
            </p>
          )}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard
          icon={BookOpen}
          titulo="Perguntas respondidas"
          descricao={`${totalPerguntas} orientações organizadas por assunto.`}
          cor="blue"
        />
        <InfoCard
          icon={ShieldCheck}
          titulo="Conteúdo direto"
          descricao="Respostas curtas, sem promessas além do que o sistema oferece."
          cor="purple"
        />
        <a
          href={linkWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="card group flex items-center gap-4 p-5 transition hover:border-emerald-400 hover:shadow-md"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-gray-900 dark:text-white">
              Suporte pelo WhatsApp
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Envie sua dúvida com uma mensagem pronta.
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-gray-400 transition group-hover:text-emerald-600" />
        </a>
      </section>

      {tutoriaisFiltrados.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Acessos rápidos
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tutoriaisFiltrados.map((tutorial) => {
              const Icon = tutorial.icon
              return (
                <Link
                  key={tutorial.titulo}
                  href={tutorial.link}
                  className="card group flex min-w-0 flex-col p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-bold text-gray-900 group-hover:text-blue-600 dark:text-white">
                    <TextoDestacado texto={tutorial.titulo} termo={busca} />
                  </h3>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    <TextoDestacado texto={tutorial.descricao} termo={busca} />
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                    {tutorial.acao}
                    <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Perguntas frequentes
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Selecione uma pergunta para abrir a resposta.
            </p>
          </div>

          {faqFiltrado.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (categoriasFechadas.size === faqFiltrado.length) {
                  setCategoriasFechadas(new Set())
                } else {
                  setCategoriasFechadas(
                    new Set(faqFiltrado.map((item) => item.categoria))
                  )
                }
              }}
              className="text-left text-xs font-semibold text-blue-600 hover:underline sm:text-right"
            >
              {categoriasFechadas.size === faqFiltrado.length
                ? 'Expandir categorias'
                : 'Recolher categorias'}
            </button>
          )}
        </div>

        {faqFiltrado.length === 0 ? (
          <div className="card py-12 text-center">
            <Search className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-3 font-bold text-gray-800 dark:text-gray-200">
              Nenhuma pergunta frequente encontrada
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente uma destas sugestões:
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGESTOES_BUSCA.map((sugestao) => (
                <button
                  type="button"
                  key={sugestao}
                  onClick={() => setBusca(sugestao)}
                  className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {sugestao}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {faqFiltrado.map((categoria) => {
              const Icon = categoria.icon
              const fechada = categoriasFechadas.has(categoria.categoria)
              const cores = CORES[categoria.cor]

              return (
                <article key={categoria.categoria}>
                  <button
                    type="button"
                    onClick={() => toggleCategoria(categoria.categoria)}
                    aria-expanded={!fechada}
                    className="mb-2 flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cores.bg} ${cores.text}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="truncate text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                        {categoria.categoria}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cores.bg} ${cores.text}`}
                      >
                        {categoria.perguntas.length}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-gray-400 transition ${
                        fechada ? '' : 'rotate-180'
                      }`}
                    />
                  </button>

                  {!fechada && (
                    <div className="space-y-2">
                      {categoria.perguntas.map((item) => {
                        const chave = `${categoria.categoria}:${item.pergunta}`
                        const aberta = perguntaAberta === chave

                        return (
                          <div
                            key={chave}
                            className={`card overflow-hidden transition ${
                              aberta ? cores.border : ''
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setPerguntaAberta(aberta ? null : chave)
                              }
                              aria-expanded={aberta}
                              className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40"
                            >
                              <span className="font-semibold text-gray-900 dark:text-white">
                                <TextoDestacado
                                  texto={item.pergunta}
                                  termo={busca}
                                />
                              </span>
                              <ChevronDown
                                className={`h-5 w-5 shrink-0 text-gray-400 transition ${
                                  aberta ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            {aberta && (
                              <div className="border-t border-gray-100 px-4 py-4 text-sm leading-6 text-gray-600 dark:border-gray-800 dark:text-gray-300">
                                <TextoDestacado
                                  texto={item.resposta}
                                  termo={busca}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Ainda precisa de ajuda?
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                Envie a dúvida pelo WhatsApp. Não compartilhe senhas, tokens,
                chaves de API ou dados bancários na mensagem.
              </p>
            </div>
          </div>
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" /> Falar com o suporte
          </a>
        </div>
      </section>

      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-center text-xs text-gray-400 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <span>Central de Ajuda do EstoqueSystem</span>
        <span>Consulte a página de assinatura para condições vigentes.</span>
      </footer>
    </div>
  )
}

const CORES: Record<
  CorCategoria,
  { bg: string; text: string; border: string }
> = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-800',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-800',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-300 dark:border-pink-800',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-800',
  },
}

function InfoCard({
  icon: Icon,
  titulo,
  descricao,
  cor,
}: {
  icon: LucideIcon
  titulo: string
  descricao: string
  cor: 'blue' | 'purple'
}) {
  const estilos = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
    purple:
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
  }

  return (
    <article className="card flex items-center gap-4 p-5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${estilos[cor]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-bold text-gray-900 dark:text-white">{titulo}</h2>
        <p className="mt-1 text-sm text-gray-500">{descricao}</p>
      </div>
    </article>
  )
}
