import Link from 'next/link'
import {
  ArrowLeft,
  Bot,
  Cookie,
  Database,
  ExternalLink,
  FileDown,
  Lock,
  MessageCircle,
  Scale,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'

const DATA_ATUALIZACAO = '3 de setembro de 2026'
const WHATSAPP = '5522999467499'
const LINK_PRIVACIDADE = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  'Olá! Tenho uma dúvida ou solicitação relacionada à privacidade e aos meus dados no EstoqueSystem.'
)}`

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-200">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-emerald-600 dark:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>

          <Link href="/" className="flex items-center gap-2 font-black text-gray-950 dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            EstoqueSystem
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
        <section className="overflow-hidden rounded-3xl bg-gray-950 px-6 py-10 text-white shadow-xl sm:px-10 md:py-14">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-400">
              Privacidade e proteção de dados
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              Política de Privacidade
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">
              Este documento explica, de forma objetiva, quais dados podem ser tratados pelo
              EstoqueSystem, por que o tratamento acontece, com quem os dados podem ser
              compartilhados e como enviar uma solicitação relacionada à privacidade.
            </p>
            <p className="mt-6 text-sm text-gray-400">
              Última atualização: {DATA_ATUALIZACAO}
            </p>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:sticky lg:top-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">
              Neste documento
            </p>
            <nav className="mt-4 space-y-1 text-sm">
              {[
                ['#sobre', '1. Sobre esta política'],
                ['#dados', '2. Dados tratados'],
                ['#finalidades', '3. Finalidades'],
                ['#clientes', '4. Dados de clientes'],
                ['#fornecedores', '5. Fornecedores'],
                ['#ia', '6. Inteligência artificial'],
                ['#cookies', '7. Cookies'],
                ['#retencao', '8. Retenção e exclusão'],
                ['#seguranca', '9. Segurança'],
                ['#direitos', '10. Direitos'],
                ['#contato', '11. Contato'],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="block rounded-lg px-3 py-2 text-gray-600 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-300 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300"
                >
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="space-y-6">
            <PolicySection id="sobre" icon={ShieldCheck} title="1. Sobre esta Política">
              <p>
                Esta Política se aplica ao site, à área autenticada e aos recursos oferecidos
                pelo EstoqueSystem. O responsável pelo serviço é Lucas Machado, que pode ser
                contatado pelo canal indicado ao final deste documento.
              </p>
              <p>
                O tratamento de dados pode ocorrer para executar o serviço contratado,
                proteger a conta e o sistema, cumprir obrigações legais ou regulatórias,
                exercer direitos e atender interesses legítimos compatíveis com a operação.
                Quando a legislação exigir consentimento, a finalidade correspondente será
                apresentada ao titular.
              </p>
            </PolicySection>

            <PolicySection id="dados" icon={Database} title="2. Quais dados podem ser tratados">
              <p>Conforme os recursos utilizados, o EstoqueSystem pode tratar:</p>
              <ul>
                <li>
                  <strong>Dados da conta:</strong> identificador, nome ou nome do negócio,
                  e-mail, telefone, cidade, estado, perfil de acesso, datas de criação e de
                  autenticação.
                </li>
                <li>
                  <strong>Dados de autenticação:</strong> informações necessárias para login,
                  recuperação de senha e proteção da sessão. A autenticação é processada pelo
                  provedor utilizado pelo EstoqueSystem. Senhas não são exibidas nem guardadas
                  em texto legível no banco operacional da aplicação.
                </li>
                <li>
                  <strong>Dados do estabelecimento:</strong> produtos, categorias, preços,
                  quantidades, estoque mínimo, validade, movimentações, perdas, alertas,
                  vendas, itens vendidos, formas de pagamento registradas e relatórios.
                </li>
                <li>
                  <strong>Dados de clientes cadastrados pelo usuário:</strong> nome, telefone,
                  e-mail, CPF, endereço, observações, histórico de compras, débitos e
                  pagamentos de fiado, quando esses dados forem inseridos na plataforma.
                </li>
                <li>
                  <strong>Dados da equipe:</strong> e-mail, vínculo com o estabelecimento,
                  nível de acesso, status e histórico necessário para manter a integridade da
                  operação.
                </li>
                <li>
                  <strong>Dados de assinatura:</strong> plano, situação do acesso,
                  identificadores de pagamento ou assinatura e eventos necessários para
                  confirmar a contratação. O EstoqueSystem não armazena os dados completos do
                  cartão utilizado no pagamento.
                </li>
                <li>
                  <strong>Dados técnicos:</strong> registros de segurança, falhas, data e hora
                  de operações e informações técnicas necessárias para proteger, diagnosticar
                  e manter o serviço.
                </li>
              </ul>
            </PolicySection>

            <PolicySection id="finalidades" icon={User} title="3. Como os dados são utilizados">
              <p>Os dados podem ser utilizados para:</p>
              <ul>
                <li>criar, autenticar e proteger contas;</li>
                <li>disponibilizar estoque, PDV, clientes, fiado, alertas e relatórios;</li>
                <li>vincular o proprietário e o usuário adicional ao estabelecimento correto;</li>
                <li>processar e confirmar plano, pagamento e assinatura;</li>
                <li>prestar suporte e responder a solicitações;</li>
                <li>enviar comunicações relevantes sobre conta, segurança e serviço;</li>
                <li>prevenir abuso, fraude, acesso indevido e comprometimento da plataforma;</li>
                <li>diagnosticar erros e melhorar estabilidade, usabilidade e recursos;</li>
                <li>cumprir obrigações legais e exercer direitos em processos ou disputas.</li>
              </ul>
              <p>
                O EstoqueSystem não comercializa nem aluga dados pessoais. O tratamento por
                terceiros ocorre quando necessário para prestar, proteger ou manter o serviço,
                conforme descrito nesta Política.
              </p>
            </PolicySection>

            <PolicySection id="clientes" icon={Users} title="4. Dados inseridos sobre clientes do estabelecimento">
              <p>
                Ao cadastrar dados de clientes, vendas e fiado, o usuário do EstoqueSystem
                decide quais informações serão registradas e para quais finalidades serão
                utilizadas. Nesse contexto, o estabelecimento é responsável por possuir uma
                justificativa adequada para o tratamento, informar os titulares quando
                aplicável e evitar a coleta de informações desnecessárias.
              </p>
              <p>
                O EstoqueSystem processa esses dados para disponibilizar as funções contratadas
                e deve ser utilizado de acordo com as instruções do estabelecimento e com a
                legislação aplicável. O usuário não deve inserir dados discriminatórios,
                excessivos ou sem relação com a gestão do negócio.
              </p>
            </PolicySection>

            <PolicySection id="fornecedores" icon={ExternalLink} title="5. Fornecedores e compartilhamento necessário">
              <p>Para operar o serviço, dados podem ser tratados pelos seguintes fornecedores:</p>
              <ul>
                <li>
                  <strong>Supabase:</strong> autenticação, banco de dados e recursos técnicos
                  associados à plataforma.
                </li>
                <li>
                  <strong>Vercel:</strong> hospedagem e entrega da aplicação web, quando
                  utilizada na infraestrutura do EstoqueSystem.
                </li>
                <li>
                  <strong>Mercado Pago:</strong> processamento e confirmação de pagamentos e
                  assinaturas.
                </li>
                <li>
                  <strong>Google Gemini:</strong> processamento das solicitações relacionadas
                  aos recursos de inteligência artificial.
                </li>
              </ul>
              <p>
                Cada fornecedor trata os dados segundo seus próprios termos, políticas,
                medidas de segurança e locais de processamento. Dependendo da infraestrutura
                utilizada pelo fornecedor, o tratamento pode envolver servidores localizados
                fora do Brasil.
              </p>
            </PolicySection>

            <PolicySection id="ia" icon={Bot} title="6. Recursos de inteligência artificial">
              <p>
                Os recursos de IA podem receber informações necessárias para auxiliar no
                cadastro de produtos, sugerir preços com base nos dados informados e produzir
                análises em linguagem natural. O EstoqueSystem procura limitar o envio ao que
                for necessário para a função solicitada.
              </p>
              <p>
                O usuário não deve inserir em campos destinados à IA senhas, chaves de API,
                dados bancários, documentos desnecessários ou informações confidenciais de
                terceiros. Respostas automáticas podem conter erros. O usuário deve conferir
                categorias, descrições, margens, preços e análises antes de utilizá-los na
                operação.
              </p>
            </PolicySection>

            <PolicySection id="cookies" icon={Cookie} title="7. Cookies, armazenamento local e tecnologias semelhantes">
              <p>
                O site e o sistema podem utilizar mecanismos essenciais para autenticação,
                proteção da sessão, preferências de interface e funcionamento da aplicação.
                Esses mecanismos não devem ser bloqueados quando forem indispensáveis ao
                serviço solicitado pelo usuário.
              </p>
              <p>
                Na data desta Política, o EstoqueSystem não declara o uso de cookies
                publicitários ou de rastreamento comportamental na landing page. Se ferramentas
                não essenciais de análise, publicidade ou monitoramento forem adicionadas,
                esta Política e os controles de preferência serão atualizados conforme
                necessário.
              </p>
            </PolicySection>

            <PolicySection id="retencao" icon={FileDown} title="8. Retenção, exportação e exclusão">
              <p>
                Os dados são mantidos enquanto forem necessários para prestar o serviço,
                preservar a integridade dos registros, cumprir obrigações, proteger direitos e
                atender finalidades legítimas descritas nesta Política.
              </p>
              <p>
                O proprietário pode solicitar uma cópia dos principais dados do
                estabelecimento pela área de Perfil. Esse arquivo pode conter dados pessoais de
                clientes e informações comerciais e deve ser armazenado em local seguro.
              </p>
              <p>
                A exclusão da conta é solicitada pelo suporte para permitir confirmação da
                identidade, verificação da assinatura, orientação sobre exportação e análise de
                vínculos existentes. A exclusão, anonimização ou conservação observará as
                condições legais e técnicas aplicáveis. Alguns registros podem ser mantidos
                quando necessários para cumprimento de obrigação ou exercício de direitos.
              </p>
            </PolicySection>

            <PolicySection id="seguranca" icon={Lock} title="9. Segurança e responsabilidade do usuário">
              <p>
                O EstoqueSystem adota controles técnicos e organizacionais compatíveis com a
                operação, incluindo autenticação, controle de acesso e uso de conexão segura.
                Nenhum serviço conectado à internet pode prometer ausência total de riscos.
              </p>
              <p>
                O usuário deve usar uma senha forte e exclusiva, manter o e-mail de recuperação
                protegido, não compartilhar o acesso do proprietário e encerrar a sessão em
                dispositivos compartilhados. Suspeitas de acesso indevido devem ser comunicadas
                imediatamente ao suporte.
              </p>
            </PolicySection>

            <PolicySection id="direitos" icon={Scale} title="10. Direitos dos titulares">
              <p>
                Conforme aplicável ao tratamento e observadas as condições legais, o titular
                pode solicitar:
              </p>
              <ul>
                <li>confirmação da existência de tratamento e acesso aos dados;</li>
                <li>correção de dados incompletos, inexatos ou desatualizados;</li>
                <li>informações sobre finalidades e compartilhamentos;</li>
                <li>anonimização, bloqueio ou eliminação nas hipóteses cabíveis;</li>
                <li>portabilidade, quando aplicável e conforme regulamentação;</li>
                <li>revogação do consentimento, quando essa for a base utilizada;</li>
                <li>oposição ao tratamento nas hipóteses previstas em lei;</li>
                <li>revisão de decisões tomadas unicamente por tratamento automatizado,
                  quando aplicável.</li>
              </ul>
              <p>
                Para proteger o titular, uma solicitação pode exigir confirmação de identidade
                e informações suficientes para localizar os dados. Quando a solicitação se
                referir a dados cadastrados por um estabelecimento sobre seus próprios clientes,
                o pedido poderá precisar ser direcionado inicialmente ao estabelecimento que
                decidiu realizar o cadastro.
              </p>
            </PolicySection>

            <PolicySection id="contato" icon={MessageCircle} title="11. Contato e alterações desta Política">
              <p>
                Dúvidas e solicitações relacionadas à privacidade podem ser enviadas pelo
                WhatsApp. Não envie senhas, tokens, chaves de API ou dados bancários na
                mensagem.
              </p>
              <a
                href={LINK_PRIVACIDADE}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                Falar sobre privacidade
              </a>
              <p>
                Esta Política pode ser atualizada para refletir mudanças no serviço, nos
                fornecedores ou nas regras aplicáveis. Alterações relevantes poderão ser
                comunicadas pela plataforma ou pelos canais de contato disponíveis.
              </p>
            </PolicySection>
          </article>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 text-center text-sm text-gray-500 sm:px-6 md:flex-row md:items-center md:justify-between md:text-left">
          <span>© {new Date().getFullYear()} EstoqueSystem</span>
          <div className="flex justify-center gap-5">
            <Link href="/termos" className="hover:text-emerald-600">Termos de Uso</Link>
            <Link href="/" className="hover:text-emerald-600">Início</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function PolicySection({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string
  icon: typeof ShieldCheck
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-7"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="pt-1 text-xl font-black text-gray-950 dark:text-white">{title}</h2>
      </div>
      <div className="mt-5 space-y-4 leading-7 text-gray-600 dark:text-gray-300 [&_li]:pl-1 [&_strong]:font-bold [&_strong]:text-gray-900 dark:[&_strong]:text-white [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        {children}
      </div>
    </section>
  )
}
