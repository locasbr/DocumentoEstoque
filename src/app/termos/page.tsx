import Link from 'next/link'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-green-600 hover:underline text-sm">
            ← Voltar ao início
          </Link>
          <h1 className="text-3xl font-bold mt-4 text-gray-900 dark:text-white">
            Termos de Uso
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              1. Sobre o EstoqueSystem
            </h2>
            <p>
              O EstoqueSystem é um sistema de gestão de estoque e ponto de venda (PDV)
              desenvolvido por Lucas Machado, destinado a pequenos comércios, mercados e
              mercearias. O acesso ao sistema é feito via navegador web, sem necessidade
              de instalação.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              2. Período de Teste
            </h2>
            <p>
              Ao criar uma conta, o usuário recebe 15 (quinze) dias de acesso gratuito
              a todas as funcionalidades do sistema. Após esse período, é necessário
              realizar a assinatura de um plano para continuar utilizando o serviço.
              Não é necessário cartão de crédito durante o período de teste.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              3. Planos e Pagamento
            </h2>
            <p>
              O EstoqueSystem oferece três planos de assinatura mensal:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Plano Iniciante:</strong> R$ 39,90/mês — até 100 produtos,
                1 usuário, PDV, leitor de código de barras, alertas e relatórios básicos.
              </li>
              <li>
                <strong>Plano Profissional:</strong> R$ 79,90/mês — produtos
                ilimitados, até 3 usuários, clientes e fiado, controle de validade,
                relatórios avançados, importação CSV, análise mensal com IA e suporte
                prioritário via WhatsApp.
              </li>
              <li>
                <strong>Plano Negócio:</strong> R$ 149,90/mês — tudo do Profissional,
                até 10 usuários, histórico estendido (24 meses), IA para cadastro
                automático de produtos, IA para sugestão de preço e suporte VIP via
                WhatsApp.
              </li>
            </ul>
            <p>
              O pagamento é processado de forma segura pelo Mercado Pago, que aceita
              PIX e cartão de crédito/débito. O acesso é liberado automaticamente após
              a confirmação do pagamento. O usuário pode mudar de plano a qualquer
              momento, com a cobrança sendo ajustada proporcionalmente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              4. Responsabilidades do Usuário
            </h2>
            <p>O usuário é responsável por:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Manter a segurança de suas credenciais de acesso (email e senha);</li>
              <li>Garantir a veracidade dos dados cadastrados no sistema;</li>
              <li>Utilizar o sistema de acordo com a legislação vigente;</li>
              <li>
                Garantir consentimento dos titulares dos dados de clientes cadastrados
                (conforme LGPD);
              </li>
              <li>Realizar backups dos dados quando julgar necessário.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              5. Funcionalidades de Inteligência Artificial
            </h2>
            <p>
              As funcionalidades de IA (análise de vendas, cadastro automático de
              produtos e sugestão de preço) utilizam serviços de terceiros (Google
              Gemini). Os dados enviados para análise são processados conforme a
              política do provedor da IA. As sugestões geradas pela IA são meramente
              orientativas e a decisão final sobre preços, categorias e descrições é
              de responsabilidade do usuário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              6. Disponibilidade
            </h2>
            <p>
              O EstoqueSystem se compromete a manter o sistema disponível, mas não
              garante disponibilidade ininterrupta. Manutenções programadas ou
              imprevistos técnicos podem causar indisponibilidade temporária.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              7. Cancelamento
            </h2>
            <p>
              O usuário pode cancelar sua assinatura a qualquer momento entrando em
              contato via WhatsApp ou pelo próprio sistema. Não há fidelidade nem
              multa por cancelamento. Após o cancelamento, o acesso permanece ativo
              até o final do período pago.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              8. Alterações de Preço
            </h2>
            <p>
              Os preços dos planos podem ser reajustados periodicamente. Reajustes
              serão comunicados aos usuários com no mínimo 30 (trinta) dias de
              antecedência por email ou dentro do próprio sistema. Usuários ativos no
              momento do reajuste podem optar por cancelar a assinatura sem ônus caso
              não concordem com o novo valor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              9. Alterações nos Termos
            </h2>
            <p>
              Estes termos podem ser atualizados a qualquer momento. Alterações
              significativas serão comunicadas aos usuários por email ou dentro do
              próprio sistema.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              10. Contato
            </h2>
            <p>
              Para dúvidas, sugestões ou solicitações, entre em contato pelo
              WhatsApp ou pelo email disponível na plataforma.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Responsável: Lucas Machado · Saquarema, RJ
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}