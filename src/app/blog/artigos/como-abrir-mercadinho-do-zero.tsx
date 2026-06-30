import Link from 'next/link'
import {
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Download,
  Rocket,
} from 'lucide-react'

export default function ArtigoAbrirMercadinhoDoZero() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded">
            🚀 Abrindo um Mercadinho
          </span>
          <span className="text-xs text-gray-500">15 min de leitura</span>
          <span className="text-xs text-gray-500">29 de junho, 2026</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
          Como abrir um mercadinho do ZERO em 2026 (guia completo passo a passo)
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          Se você tá pensando em abrir um mercadinho mas não sabe por onde
          começar, esse guia é pra você. Vou te mostrar TUDO que precisa fazer
          — do investimento inicial aos primeiros 90 dias — pra você não
          quebrar no 1º ano.
        </p>
      </header>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Você passa pelo mercadinho do bairro, olha o movimento e pensa:
          &quot;será que eu conseguia abrir um?&quot; Eu te entendo. Visitei
          mais de 30 mercadinhos em Saquarema nos últimos meses, e ouvi a
          mesma história: &quot;se eu soubesse o que sei hoje quando abri,
          teria feito tudo diferente&quot;.
        </p>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Então escrevi esse guia COMPLETO pra você abrir o seu mercadinho
          com o pé direito desde o começo. Sem mistério, sem enrolação.
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
          📋 O que você vai aprender
        </h2>

        <ul className="space-y-2 my-6 list-none p-0">
          {[
            'Quanto custa abrir um mercadinho de verdade em 2026',
            'Documentos e licenças que você precisa',
            'Como escolher o ponto certo',
            'Os 50 produtos OBRIGATÓRIOS pra começar',
            'Sistema vs caderno: por que escolher sistema desde o dia 1',
            'Os 5 erros que fazem 60% dos mercadinhos quebrarem',
            'Plano de marketing pros primeiros 90 dias',
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
            <div className="text-4xl">📋</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Baixe o Checklist Grátis: 30 itens pra abrir seu mercadinho
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                Lista completa com TUDO que você precisa: documentos,
                equipamentos, produtos, capital e marketing.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm"
              >
                <Download className="w-4 h-4" />
                Baixar checklist grátis
              </Link>
            </div>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
          💰 Quanto custa abrir um mercadinho em 2026?
        </h2>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Vou ser direto: <strong>depende do tamanho</strong>. Baseado nos
          mercadinhos que visitei aqui na região, uma estimativa real:
        </p>

        <div className="my-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="text-left p-3 font-bold">Tamanho</th>
                <th className="text-left p-3 font-bold">Investimento</th>
                <th className="text-left p-3 font-bold">Faturamento</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-3 font-semibold">🏪 Pequeno (40m²)</td>
                <td className="p-3">R$ 25k - R$ 45k</td>
                <td className="p-3 text-green-600">R$ 15k - R$ 30k/mês</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-3 font-semibold">🏬 Médio (80m²)</td>
                <td className="p-3">R$ 50k - R$ 100k</td>
                <td className="p-3 text-green-600">R$ 40k - R$ 80k/mês</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">🏢 Grande (150m²+)</td>
                <td className="p-3">R$ 120k - R$ 250k</td>
                <td className="p-3 text-green-600">R$ 100k+/mês</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Vou detalhar o cenário <strong>mais comum</strong> (pequeno, 40m²):
        </p>

        <div className="my-6 space-y-3">
          {[
            { item: 'Aluguel + caução (3 meses)', valor: 'R$ 4.500 - R$ 7.500' },
            { item: 'Reforma e instalação', valor: 'R$ 3.000 - R$ 8.000' },
            { item: 'Equipamentos', valor: 'R$ 8.000 - R$ 15.000' },
            { item: 'Estoque inicial', valor: 'R$ 6.000 - R$ 12.000' },
            { item: 'Sistema de gestão (1º ano)', valor: 'R$ 480 - R$ 960' },
            { item: 'Marketing inicial', valor: 'R$ 500 - R$ 1.500' },
            { item: 'Capital de giro (3 meses)', valor: 'R$ 3.000 - R$ 5.000' },
          ].map((item) => (
            <div
              key={item.item}
              className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
            >
              <span className="text-gray-700 dark:text-gray-300 text-sm">
                {item.item}
              </span>
              <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">
                {item.valor}
              </span>
            </div>
          ))}
        </div>

        <div className="my-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 rounded-r-xl">
          <p className="font-bold text-green-900 dark:text-green-300 mb-1">
            💡 TOTAL REALISTA: R$ 25.000 a R$ 45.000
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Pra mercadinho de 40m² em bairro. Em região nobre pode dobrar.
          </p>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
          📄 Documentos necessários
        </h2>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Não abra na informalidade. Os documentos custam pouco e te salvam
          de multas ENORMES:
        </p>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">
          1. CNPJ
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          MEI se faturar até R$ 81k/ano (~R$ 75/mês de DAS). Acima disso,
          vira ME (R$ 300-800 pra abrir + ~R$ 200/mês de contador).
        </p>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">
          2. Alvará de Funcionamento
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Da prefeitura. Custo: R$ 100 a R$ 500.
        </p>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">
          3. Vigilância Sanitária
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          OBRIGATÓRIO pra comércio de alimentos. Custo: R$ 80 a R$ 300.
        </p>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-3">
          4. Bombeiros
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Custo: R$ 200 a R$ 600 + extintores.
        </p>

        <div className="my-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Dica de ouro:</strong> Procure o Sebrae da sua cidade.
              Eles ajudam DE GRAÇA com toda essa parte burocrática.
            </p>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
          📍 Como escolher o ponto perfeito
        </h2>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          O ponto é <strong>50% do sucesso</strong>. Avalie 5 critérios:
        </p>

        <div className="my-6 space-y-3">
          {[
            {
              icon: '🚶',
              titulo: 'Movimento de pedestres',
              texto: 'Mínimo: 50 pessoas/hora passando na frente.',
            },
            {
              icon: '🏘️',
              titulo: 'Densidade residencial',
              texto: 'Quantas casas num raio de 500m? Quanto mais, melhor.',
            },
            {
              icon: '⚔️',
              titulo: 'Concorrência',
              texto: '1-2 concorrentes num raio de 1km é saudável.',
            },
            {
              icon: '🚗',
              titulo: 'Acessibilidade',
              texto: 'Tem onde estacionar? É fácil chegar a pé?',
            },
            {
              icon: '💰',
              titulo: 'Aluguel x faturamento',
              texto: 'Aluguel: máx 10-15% do faturamento esperado.',
            },
          ].map((item) => (
            <div
              key={item.titulo}
              className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              <div className="text-2xl">{item.icon}</div>
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
          📦 Os 50 produtos OBRIGATÓRIOS
        </h2>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Foca nos produtos de alta saída:
        </p>

        <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="font-bold text-blue-900 dark:text-blue-300 mb-2">
              🥖 Alimentos básicos (15)
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Arroz, feijão, açúcar, sal, óleo, café, leite, pão, ovos,
              macarrão, farinha, biscoito, achocolatado, queijo, presunto
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <p className="font-bold text-green-900 dark:text-green-300 mb-2">
              🥤 Bebidas (10)
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Refrigerantes, suco em pó, água mineral, cerveja, energético,
              suco de caixinha
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <p className="font-bold text-purple-900 dark:text-purple-300 mb-2">
              🧼 Limpeza (10)
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Detergente, sabão em pó, sabão em barra, amaciante, água
              sanitária, desinfetante, esponja, pano
            </p>
          </div>
          <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
            <p className="font-bold text-pink-900 dark:text-pink-300 mb-2">
              🪥 Higiene (10)
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Papel higiênico, sabonete, shampoo, creme dental, escova,
              desodorante, absorvente, fralda
            </p>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl col-span-1 md:col-span-2">
            <p className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">
              🍫 Bônus (5)
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Cigarro, pilha, isqueiro, bala/chiclete, salgadinho
            </p>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
          💻 Sistema vs caderno: por que SISTEMA desde o dia 1
        </h2>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Esse é o conselho mais importante:{' '}
          <strong>NÃO comece com caderno</strong>. Aqui o porquê:
        </p>

        <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="font-bold text-red-900 dark:text-red-300 mb-3">
              ❌ Caderno
            </p>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Perde 15-30% das vendas a fiado</li>
              <li>• Não sabe quais produtos vendem mais</li>
              <li>• Estoque acaba sem perceber</li>
              <li>• Produtos vencem nas prateleiras</li>
              <li>• Sem visão de lucro real</li>
            </ul>
          </div>
          <div className="p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <p className="font-bold text-green-900 dark:text-green-300 mb-3">
              ✅ Sistema
            </p>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Controle TOTAL de fiado</li>
              <li>• Relatório de produto mais vendido</li>
              <li>• Alertas de estoque baixo</li>
              <li>• Alerta de produto vencendo</li>
              <li>• Lucro real em tempo real</li>
            </ul>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Sistema bom custa <strong>R$ 39,90/mês</strong> (menos que 2
          cervejas). O caderno te custa <strong>centenas em perdas</strong>.
        </p>

        <div className="my-10 p-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl text-white text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-extrabold mb-3">
            EstoqueSystem: Feito pra mercadinho iniciante
          </h3>
          <p className="text-green-50 mb-6 max-w-md mx-auto">
            Sistema brasileiro, simples de usar, 15 dias grátis. Sem cartão.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-3 rounded-full hover:shadow-2xl transition"
          >
            Começar teste grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
          ⚠️ Os 5 erros que quebram mercadinhos
        </h2>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          <strong>60% dos mercadinhos fecham no primeiro ano</strong>.
          Evite esses erros:
        </p>

        <div className="my-6 space-y-3">
          {[
            {
              num: '1',
              titulo: 'Misturar dinheiro pessoal com do mercadinho',
              texto:
                'NUNCA tira do caixa pra contas pessoais. Separa conta bancária desde o dia 1.',
            },
            {
              num: '2',
              titulo: 'Vender muito fiado sem controle',
              texto:
                'Fiado é necessário, mas tem que ser CONTROLADO. Sem sistema, você perde muito.',
            },
            {
              num: '3',
              titulo: 'Comprar muito sem girar',
              texto:
                'Não enche o estoque achando que vai vender. Comece com pouco e aumenta.',
            },
            {
              num: '4',
              titulo: 'Não saber precificar',
              texto:
                'Aprende a calcular margem ANTES de abrir. Mínimo 30% em alimentos, 40% em limpeza.',
            },
            {
              num: '5',
              titulo: 'Não cuidar de marketing',
              texto:
                'Mercadinho novo precisa divulgação. Os 90 primeiros dias são CRÍTICOS.',
            },
          ].map((item) => (
            <div
              key={item.num}
              className="flex items-start gap-4 p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <div className="w-10 h-10 bg-red-500 text-white font-bold rounded-full flex items-center justify-center flex-shrink-0">
                {item.num}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white mb-1">
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
          🚀 Plano dos primeiros 90 dias
        </h2>

        <div className="my-6 space-y-4">
          <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-xl">
            <p className="font-bold text-blue-900 dark:text-blue-300 mb-2">
              📅 Mês 1: Foco em divulgação
            </p>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>✓ Inauguração com promoção (10-20% off na 1ª semana)</li>
              <li>✓ Distribui 500 panfletos no bairro</li>
              <li>✓ Cria Instagram e WhatsApp Business</li>
              <li>✓ Posta TODOS os dias no Instagram</li>
              <li>✓ Cadastra TODOS os clientes no sistema</li>
            </ul>
          </div>

          <div className="p-5 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 rounded-r-xl">
            <p className="font-bold text-purple-900 dark:text-purple-300 mb-2">
              📅 Mês 2: Foco em fidelização
            </p>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>✓ Analisa relatórios — quais produtos vendem mais?</li>
              <li>✓ Aumenta estoque dos campeões</li>
              <li>✓ Remove produtos parados</li>
              <li>✓ Pede indicação pros clientes fiéis</li>
              <li>✓ Promoção do dia (1 produto/dia em desconto)</li>
            </ul>
          </div>

          <div className="p-5 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-xl">
            <p className="font-bold text-green-900 dark:text-green-300 mb-2">
              📅 Mês 3: Foco em otimização
            </p>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>✓ Negocia melhor com fornecedores (tem volume agora)</li>
              <li>✓ Avalia se contrata 1º funcionário</li>
              <li>✓ Implementa controle de fiado se necessário</li>
              <li>✓ Faz primeira análise de lucro real</li>
              <li>✓ Planeja expansão</li>
            </ul>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-12 mb-4">
          Perguntas frequentes
        </h2>

        <div className="space-y-3 my-6">
          {[
            {
              p: 'Preciso de funcionário desde o começo?',
              r: 'Não. No 1º mês, fica SOZINHO pra entender o movimento.',
            },
            {
              p: 'Vale a pena abrir em região de praia?',
              r: 'Sim, mas com cuidado: alta temporada vende muito, baixa cai 70%.',
            },
            {
              p: 'Quanto tempo demora pra ter lucro?',
              r: 'Mercadinho bem montado dá lucro a partir do 3º-6º mês.',
            },
            {
              p: 'Posso abrir sem experiência?',
              r: 'Pode, mas vai aprender na dor. Recomendo trabalhar 1-2 meses num mercadinho antes.',
            },
            {
              p: 'Como o EstoqueSystem ajuda desde o começo?',
              r: 'Cadastra produtos, vende no PDV pelo celular, controla fiado, alertas de estoque.',
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
          🎯 Conclusão
        </h2>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Abrir mercadinho é uma decisão linda — independência, patrimônio,
          fazer parte do bairro. Mas é muito trabalho. Esse guia te deu o
          mapa, agora é executar.
        </p>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Minha recomendação?{' '}
          <strong>Não pula a etapa do sistema</strong>. Já que vai fazer
          tudo certo desde o começo, faz isso também.
        </p>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Se quiser testar o EstoqueSystem,{' '}
          <Link
            href="/signup"
            className="text-green-600 dark:text-green-400 font-semibold underline"
          >
            comece o teste grátis de 15 dias
          </Link>
          . Sem cartão, sem compromisso.
        </p>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-6">
          Sucesso na jornada! 💚
          <br />
          <strong>Lucas Machado</strong>
          <br />
          <span className="text-sm text-gray-500">
            Criador do EstoqueSystem · Saquarema, RJ
          </span>
        </p>
      </div>

      <div className="mt-16 p-8 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-center">
        <Rocket className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Pronto pra abrir seu mercadinho com o pé direito?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Comece com o EstoqueSystem grátis por 15 dias.
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