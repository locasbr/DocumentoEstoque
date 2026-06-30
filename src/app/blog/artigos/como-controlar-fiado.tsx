import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  Download,
} from 'lucide-react'

export default function ArtigoControlarFiado() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded">
            💰 Controle Financeiro
          </span>
          <span className="text-xs text-gray-500">8 min de leitura</span>
          <span className="text-xs text-gray-500">29 de junho, 2026</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
          Como controlar fiado no mercadinho sem caderno (guia 2026)
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          Se você ainda usa caderno pra anotar quem deve no seu mercadinho,
          esse artigo vai mudar sua vida financeira. Vou te mostrar o método
          definitivo, sem complicação, e ainda te dou uma planilha grátis pra
          começar hoje.
        </p>
      </header>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Você abre o caderno de fiado pra cobrar o seu Zé e... cadê a página?
          Ah, achei — mas a letra tá borrada, e você não lembra se aquele
          débito de R$ 47 é dele ou da dona Maria.
        </p>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Aí o cliente chega, jura que já pagou metade, e você fica naquela
          dúvida. Discute? Cobra? Esquece? Em todo cenário, você sai{' '}
          <strong>perdendo dinheiro</strong>.
        </p>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Se você se identificou, esse artigo é pra você. Vou te mostrar:
        </p>

        <ul className="space-y-2 my-6 list-none p-0">
          {[
            'Por que o caderno tá te fazendo perder até 30% das vendas a prazo',
            'O método correto pra controlar fiado em 2026 (com tecnologia)',
            'Como cobrar cliente devedor sem brigar nem perder o cliente',
            'Uma planilha grátis pra você baixar e começar hoje',
            'Como automatizar tudo isso pelo celular em menos de 5 minutos',
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
            >
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="my-10 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="text-4xl">📊</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Baixe a planilha grátis de Controle de Fiado
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                Modelo pronto pra você organizar quem deve, quanto deve, e
                quando vence. Funciona no Excel e Google Sheets.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm"
              >
                <Download className="w-4 h-4" />
                Baixar planilha grátis
              </Link>
            </div>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
          O caderno de fiado tá te fazendo perder dinheiro
        </h2>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Eu visitei mais de 30 mercadinhos aqui em Saquarema e na região, e
          conversei direto com os donos. O padrão é sempre o mesmo:{' '}
          <strong>
            quem usa caderno perde entre 15% e 30% do dinheiro emprestado no
            fiado
          </strong>
          .
        </p>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Por quê? Por 5 motivos que você provavelmente já viu acontecer:
        </p>

        <div className="space-y-3 my-6">
          {[
            {
              titulo: 'Letra ilegível',
              texto:
                'No corre do dia, você anota rápido e depois nem você consegue ler.',
            },
            {
              titulo: 'Página perdida',
              texto:
                'Caderno cai, molha, rasga. E lá se foi R$ 200 do mês.',
            },
            {
              titulo: 'Cliente esquecido',
              texto:
                'Algum cliente some por 6 meses, você nem lembra que ele devia.',
            },
            {
              titulo: 'Confusão de valores',
              texto:
                'Você esqueceu de dar baixa quando ele pagou R$ 30. Aí cobra de novo. Cliente fica chateado.',
            },
            {
              titulo: 'Sem visão do total',
              texto:
                'Quanto tem em fiado HOJE? Você não sabe. Não tem como planejar fluxo de caixa.',
            },
          ].map((item) => (
            <div
              key={item.titulo}
              className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {item.titulo}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.texto}
                </p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
          O método CERTO pra controlar fiado em 2026
        </h2>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          O método correto envolve 4 passos simples. Você não precisa ser
          contador nem entender de tecnologia avançada. Olha só:
        </p>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">
          Passo 1: Cadastra cada cliente uma vez
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Em vez de procurar a página da Dona Maria no caderno toda vez, você
          cadastra ela <strong>uma vez só</strong>: nome, WhatsApp, e endereço
          (opcional). Pronto. Da próxima vez é só clicar no nome dela.
        </p>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">
          Passo 2: Registra o débito na hora
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Cliente comprou R$ 47,80 e vai pagar depois? Você seleciona o nome
          dele, coloca o valor, e registra. Em 5 segundos.{' '}
          <strong>Sem caderno, sem confusão</strong>.
        </p>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">
          Passo 3: Recebe pagamento e dá baixa automática
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Quando o cliente pagar (parcial ou total), você só registra o
          pagamento. O saldo dele atualiza sozinho. Você sempre sabe quanto ele
          ainda deve.
        </p>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">
          Passo 4: Cobra com elegância pelo WhatsApp
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Cliente sumiu? Você manda uma mensagem educada no WhatsApp dele,
          lembrando do valor pendente. Sem brigar, sem constranger. Só
          profissionalismo.
        </p>

        <div className="my-8 p-5 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-xl">
          <p className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
            💬 Modelo de mensagem profissional:
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
            &quot;Oi, Dona Maria! Tudo bem? Aqui é do Mercadinho. Tô passando
            só pra lembrar que tem um saldinho de R$ 47,80 aberto aqui. Quando
            puder dar uma passada pra acertar, agradeço! 💚&quot;
          </p>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
          Como o EstoqueSystem resolve tudo isso
        </h2>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          O <strong>EstoqueSystem</strong> é um sistema feito especificamente
          pra mercadinhos brasileiros, com o módulo de fiado pensado pra quem
          tá cansado do caderno. Olha o que você consegue fazer:
        </p>

        <div className="my-6 space-y-3">
          {[
            'Cadastrar cliente com WhatsApp e endereço',
            'Registrar débito em 5 segundos no celular',
            'Ver saldo devedor de cada cliente em tempo real',
            'Receber pagamentos parciais',
            'Mandar lembrete pelo WhatsApp com 1 clique',
            'Ver TOTAL de fiado pendente do mercadinho',
            'Histórico completo de cada cliente',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">{item}</span>
            </div>
          ))}
        </div>

        <div className="my-10 p-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl text-white text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-extrabold mb-3">
            Quer testar de graça por 15 dias?
          </h3>
          <p className="text-green-50 mb-6 max-w-md mx-auto">
            Sem cartão de crédito. Sem pegadinha. Você só paga se gostar.
            Planos a partir de R$ 39,90/mês.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-3 rounded-full hover:shadow-2xl transition"
          >
            Começar teste grátis agora
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
          Perguntas frequentes
        </h2>

        <div className="space-y-3 my-6">
          {[
            {
              p: 'Posso usar no celular?',
              r: 'Sim! O EstoqueSystem funciona 100% no celular, tablet e computador. Você só precisa de internet.',
            },
            {
              p: 'E se eu não souber mexer com tecnologia?',
              r: 'O sistema foi feito pra ser SIMPLES. Quem usa caderno consegue usar em 10 minutos. Tem tutoriais e suporte direto via WhatsApp.',
            },
            {
              p: 'Quanto custa?',
              r: 'Você testa 15 dias grátis. Depois, planos a partir de R$ 39,90/mês. Cancela quando quiser, sem multa.',
            },
            {
              p: 'Meus dados ficam seguros?',
              r: 'Sim. Usamos criptografia profissional e backup automático. Seus dados são SÓ seus.',
            },
            {
              p: 'Posso importar meus clientes do caderno?',
              r: 'Sim! Você pode cadastrar manualmente ou importar via planilha CSV (no plano Profissional ou Negócio).',
            },
          ].map((faq) => (
            <details
              key={faq.p}
              className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              <summary className="cursor-pointer p-4 font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl">
                {faq.p}
              </summary>
              <p className="px-4 pb-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                {faq.r}
              </p>
            </details>
          ))}
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
          Conclusão
        </h2>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Controlar fiado com caderno em 2026 é como andar de carroça quando
          existe carro. Funciona? Funciona. Mas você tá perdendo tempo,
          dinheiro e paciência.
        </p>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Migrar pra um sistema digital leva <strong>15 minutos</strong> e
          paga o investimento já no primeiro mês — só com o dinheiro que você
          deixa de perder em fiado esquecido.
        </p>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Se quiser testar como funciona,{' '}
          <Link
            href="/signup"
            className="text-green-600 dark:text-green-400 font-semibold underline"
          >
            comece o teste grátis de 15 dias aqui
          </Link>
          . Sem cartão, sem compromisso.
        </p>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-6">
          Um abraço e bora vender mais! 💚
          <br />
          <strong>Lucas Machado</strong>
          <br />
          <span className="text-sm text-gray-500">
            Criador do EstoqueSystem · Saquarema, RJ
          </span>
        </p>
      </div>

      <div className="mt-16 p-8 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Gostou desse artigo?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Compartilha com outro dono de mercadinho que precisa parar de usar
          caderno!
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-6 py-3 rounded-full hover:shadow-lg hover:shadow-green-500/30 transition"
        >
          Testar EstoqueSystem grátis →
        </Link>
      </div>
    </article>
  )
}