import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Lock,
  MessageCircle,
  Package,
  Receipt,
  Scale,
  ShieldCheck,
  User,
  Users,
  Wrench,
} from 'lucide-react'

const DATA_ATUALIZACAO = '3 de setembro de 2026'
const WHATSAPP = '5522999467499'
const LINK_SUPORTE = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  'Olá! Tenho uma dúvida sobre os Termos de Uso do EstoqueSystem.'
)}`

export default function TermosPage() {
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
              <FileCheck2 className="h-5 w-5" />
            </span>
            EstoqueSystem
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
        <section className="overflow-hidden rounded-3xl bg-gray-950 px-6 py-10 text-white shadow-xl sm:px-10 md:py-14">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-400">
              Regras de utilização
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              Termos de Uso
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">
              Estes Termos definem as regras para criar uma conta, utilizar os recursos,
              contratar planos e proteger os acessos e dados mantidos no EstoqueSystem.
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
                ['#aceite', '1. Aceite dos Termos'],
                ['#servico', '2. Sobre o serviço'],
                ['#conta', '3. Conta e acessos'],
                ['#teste', '4. Período de teste'],
                ['#planos', '5. Planos e pagamento'],
                ['#cancelamento', '6. Cancelamento'],
                ['#responsabilidades', '7. Responsabilidades'],
                ['#fiscal', '8. Comprovante não fiscal'],
                ['#ia', '9. Inteligência artificial'],
                ['#proibicoes', '10. Uso proibido'],
                ['#disponibilidade', '11. Disponibilidade'],
                ['#dados', '12. Dados e encerramento'],
                ['#alteracoes', '13. Alterações'],
                ['#contato', '14. Contato'],
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
            <TermsSection id="aceite" icon={CheckCircle2} title="1. Aceite dos Termos">
              <p>
                Ao criar uma conta, acessar ou utilizar o EstoqueSystem, o usuário declara que
                leu e aceitou estes Termos e a Política de Privacidade. Quem cria a conta em
                nome de um estabelecimento declara possuir autorização para utilizar os dados e
                contratar o serviço em nome do respectivo negócio.
              </p>
              <p>
                Caso não concorde com estes Termos, o usuário não deve criar uma conta nem
                continuar utilizando o serviço.
              </p>
            </TermsSection>

            <TermsSection id="servico" icon={Package} title="2. Sobre o EstoqueSystem">
              <p>
                O EstoqueSystem é uma aplicação web de apoio à gestão de pequenos negócios. A
                plataforma oferece recursos relacionados a produtos, estoque, movimentações,
                PDV, vendas, alertas, clientes, fiado, validade, relatórios, equipe e
                inteligência artificial, conforme o plano e a disponibilidade apresentada na
                conta.
              </p>
              <p>
                O serviço funciona pelo navegador e depende de conexão com a internet, aparelho
                compatível e navegador atualizado. Certos recursos podem depender de permissões
                do dispositivo, como acesso à câmera para leitura de código de barras.
              </p>
            </TermsSection>

            <TermsSection id="conta" icon={Users} title="3. Conta, proprietário e usuário adicional">
              <p>
                Cada estabelecimento pode possuir um proprietário e, no máximo, um usuário
                adicional. Cada pessoa deve usar suas próprias credenciais. O compartilhamento
                do acesso do proprietário não é recomendado e pode comprometer a segurança e a
                rastreabilidade das operações.
              </p>
              <p>O proprietário é responsável por:</p>
              <ul>
                <li>informar dados corretos durante o cadastro;</li>
                <li>proteger o e-mail, a senha e os dispositivos utilizados;</li>
                <li>cadastrar, desativar ou remover o vínculo do usuário adicional;</li>
                <li>revisar as permissões e ações realizadas dentro do estabelecimento;</li>
                <li>comunicar suspeitas de acesso indevido ao suporte.</li>
              </ul>
              <p>
                A desativação ou remoção de um usuário adicional pode preservar registros
                históricos necessários à integridade das vendas e movimentações realizadas.
              </p>
            </TermsSection>

            <TermsSection id="teste" icon={User} title="4. Período de teste">
              <p>
                O EstoqueSystem pode oferecer um período de teste de 15 dias sem exigência de
                cartão. Os recursos liberados durante a avaliação são aqueles indicados na
                interface ou na oferta apresentada no momento do cadastro.
              </p>
              <p>
                Ao término do período, o acesso pode ser limitado até a contratação de um plano.
                A concessão de novo período, extensão ou cortesia depende de autorização do
                EstoqueSystem e não constitui direito permanente do usuário.
              </p>
            </TermsSection>

            <TermsSection id="planos" icon={CircleDollarSign} title="5. Planos, preços e pagamento">
              <p>
                A oferta pública atual possui os planos Iniciante e Profissional. Preços,
                limites, recursos, formas de pagamento e condições vigentes são apresentados na
                landing page, na página de assinatura ou no fluxo de contratação. Essas
                informações comerciais integram estes Termos.
              </p>
              <p>
                O pagamento é processado pelo Mercado Pago conforme as opções disponíveis no
                momento da contratação. O EstoqueSystem não armazena os dados completos do
                cartão. A liberação ou renovação do acesso depende da confirmação recebida do
                provedor de pagamento.
              </p>
              <p>
                Uma alteração local de plano ou acesso realizada pelo suporte não significa,
                por si só, alteração de cobrança, assinatura, renovação, estorno ou
                cancelamento no Mercado Pago. Mudanças que envolvam valores seguirão as
                condições exibidas no fluxo correspondente.
              </p>
            </TermsSection>

            <TermsSection id="cancelamento" icon={Receipt} title="6. Cancelamento e encerramento do acesso">
              <p>
                Não há fidelidade contratual na oferta padrão. A solicitação de cancelamento
                pode ser feita pelos canais disponibilizados na conta ou pelo suporte. Os
                efeitos do cancelamento dependem do tipo de pagamento, da situação da assinatura
                e das condições apresentadas durante a contratação.
              </p>
              <p>
                Cancelar a assinatura e solicitar a exclusão da conta são operações diferentes.
                O cancelamento encerra cobranças futuras conforme confirmação do provedor. A
                exclusão envolve verificação da titularidade, eventual exportação, tratamento
                dos vínculos e análise das hipóteses de conservação aplicáveis.
              </p>
            </TermsSection>

            <TermsSection id="responsabilidades" icon={ShieldCheck} title="7. Responsabilidades do usuário">
              <p>O usuário é responsável por:</p>
              <ul>
                <li>conferir produtos, quantidades, custos, preços e estoque físico;</li>
                <li>garantir a veracidade e a atualização dos dados inseridos;</li>
                <li>utilizar o sistema de acordo com a legislação aplicável ao negócio;</li>
                <li>
                  possuir fundamento adequado para cadastrar e utilizar dados pessoais de
                  clientes e fornecer as informações exigidas pela legislação;
                </li>
                <li>armazenar com segurança arquivos exportados e comprovantes gerados;</li>
                <li>não inserir senhas, chaves ou dados desnecessários em campos livres ou de IA;</li>
                <li>manter cópias adicionais de informações críticas quando considerar necessário.</li>
              </ul>
              <p>
                Relatórios e indicadores dependem da qualidade e da atualização dos registros.
                O EstoqueSystem não substitui contagem física, inventário, orientação
                contábil, fiscal, jurídica ou financeira.
              </p>
            </TermsSection>

            <TermsSection id="fiscal" icon={Receipt} title="8. Comprovantes e obrigações fiscais">
              <p>
                O comprovante emitido pelo EstoqueSystem possui finalidade de conferência da
                venda e é um documento não fiscal. O comprovante não substitui nota fiscal,
                NFC-e, cupom fiscal ou qualquer documento tributário exigido pela legislação.
              </p>
              <p>
                O usuário é responsável por conhecer e cumprir as obrigações fiscais,
                tributárias e documentais aplicáveis ao próprio estabelecimento.
              </p>
            </TermsSection>

            <TermsSection id="ia" icon={Bot} title="9. Recursos de inteligência artificial">
              <p>
                O plano Profissional pode incluir recursos de IA para auxiliar em cadastro de
                produtos, sugestão de preço e interpretação das vendas, conforme a
                disponibilidade indicada na plataforma. O processamento pode utilizar serviços
                do Google Gemini.
              </p>
              <p>
                Conteúdos produzidos por IA são sugestões e podem conter erros, omissões ou
                informações inadequadas ao contexto do negócio. A decisão final sobre categoria,
                descrição, preço, margem, promoção e ação operacional pertence ao usuário.
              </p>
            </TermsSection>

            <TermsSection id="proibicoes" icon={Ban} title="10. Uso proibido">
              <p>É proibido utilizar o EstoqueSystem para:</p>
              <ul>
                <li>praticar atos ilícitos, fraudulentos ou que violem direitos de terceiros;</li>
                <li>acessar ou tentar acessar conta, dados ou recursos de outro usuário;</li>
                <li>compartilhar, comercializar ou ceder credenciais de forma indevida;</li>
                <li>contornar limites de plano, controles de acesso ou mecanismos de segurança;</li>
                <li>explorar vulnerabilidades ou realizar testes não autorizados;</li>
                <li>enviar código malicioso, automatizar requisições abusivas ou prejudicar a disponibilidade;</li>
                <li>cadastrar conteúdo ilegal, discriminatório ou sem relação com a gestão do negócio.</li>
              </ul>
              <p>
                O acesso pode ser bloqueado localmente em caso de risco, abuso, fraude,
                inadimplência confirmada, violação destes Termos ou necessidade de proteger a
                plataforma e outros usuários, respeitadas as condições aplicáveis.
              </p>
            </TermsSection>

            <TermsSection id="disponibilidade" icon={Wrench} title="11. Disponibilidade, manutenção e mudanças no serviço">
              <p>
                O EstoqueSystem busca manter o serviço disponível e corrigir falhas, mas não
                garante operação ininterrupta ou ausência total de erros. Manutenções,
                atualizações, incidentes de fornecedores, internet, dispositivos ou situações
                fora do controle do serviço podem causar indisponibilidade temporária.
              </p>
              <p>
                Recursos podem ser corrigidos, substituídos, reorganizados ou descontinuados
                para melhorar segurança, viabilidade e funcionamento. Quando uma mudança
                relevante afetar uma condição contratada, a comunicação será feita pelos canais
                disponíveis, quando cabível.
              </p>
            </TermsSection>

            <TermsSection id="dados" icon={Lock} title="12. Dados, exportação e solicitação de exclusão">
              <p>
                O tratamento de dados pessoais é descrito na Política de Privacidade. O
                proprietário pode utilizar a função de exportação disponível no Perfil para
                obter uma cópia dos principais registros do estabelecimento.
              </p>
              <p>
                A solicitação de exclusão é realizada pelo suporte para confirmar a identidade,
                verificar a situação da assinatura, orientar a exportação e tratar os acessos
                relacionados. Dados poderão ser excluídos, anonimizados ou conservados conforme
                necessidade técnica, obrigação legal e exercício de direitos.
              </p>
              <Link
                href="/privacidade"
                className="inline-flex items-center gap-2 font-bold text-emerald-600 hover:text-emerald-700"
              >
                Ler a Política de Privacidade
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </TermsSection>

            <TermsSection id="alteracoes" icon={Scale} title="13. Alterações de preços e destes Termos">
              <p>
                Preços e condições comerciais podem ser alterados. Eventuais mudanças que
                afetem cobranças futuras serão apresentadas ou comunicadas antes de sua
                aplicação, conforme a modalidade de pagamento e a legislação aplicável.
              </p>
              <p>
                Estes Termos também podem ser atualizados para refletir mudanças no produto,
                nos fornecedores, nos riscos ou nas regras aplicáveis. A versão publicada nesta
                página indicará a data de atualização.
              </p>
            </TermsSection>

            <TermsSection id="contato" icon={MessageCircle} title="14. Contato">
              <p>
                Dúvidas sobre estes Termos, assinatura ou funcionamento do serviço podem ser
                enviadas pelo WhatsApp. Não compartilhe senhas, tokens, chaves de API ou dados
                bancários pelo atendimento.
              </p>
              <a
                href={LINK_SUPORTE}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                Falar com o suporte
              </a>
              <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  Este documento busca apresentar as regras do serviço com transparência. A
                  legislação aplicável prevalece sobre qualquer disposição que não possa ser
                  validamente afastada por contrato.
                </p>
              </div>
            </TermsSection>
          </article>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 text-center text-sm text-gray-500 sm:px-6 md:flex-row md:items-center md:justify-between md:text-left">
          <span>© {new Date().getFullYear()} EstoqueSystem</span>
          <div className="flex justify-center gap-5">
            <Link href="/privacidade" className="hover:text-emerald-600">Privacidade</Link>
            <Link href="/" className="hover:text-emerald-600">Início</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function TermsSection({
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
