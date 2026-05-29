import Link from 'next/link'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-green-600 hover:underline text-sm">
            ← Voltar ao início
          </Link>
          <h1 className="text-3xl font-bold mt-4">Termos de Uso</h1>
          <p className="text-gray-500 mt-2">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Sobre o EstoqueSystem</h2>
            <p>
              O EstoqueSystem é um sistema de gestão de estoque e ponto de venda (PDV)
              desenvolvido por Lucas Machado, destinado a pequenos comércios, mercados e
              mercearias. O acesso ao sistema é feito via navegador web, sem necessidade
              de instalação.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Período de Teste</h2>
            <p>
              Ao criar uma conta, o usuário recebe 15 (quinze) dias de acesso gratuito
              a todas as funcionalidades do sistema. Após esse período, é necessário
              realizar a assinatura do plano para continuar utilizando o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. Assinatura e Pagamento</h2>
            <p>
              O plano do EstoqueSystem custa R$ 79,90 (setenta e nove reais e noventa
              centavos) por mês. O pagamento é processado de forma segura pelo Mercado
              Pago, que aceita PIX e cartão de crédito/débito. O acesso é liberado
              automaticamente após a confirmação do pagamento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Responsabilidades do Usuário</h2>
            <p>O usuário é responsável por:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Manter a segurança de suas credenciais de acesso (email e senha);</li>
              <li>Garantir a veracidade dos dados cadastrados no sistema;</li>
              <li>Utilizar o sistema de acordo com a legislação vigente;</li>
              <li>Realizar backups dos dados quando necessário.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Disponibilidade</h2>
            <p>
              O EstoqueSystem se compromete a manter o sistema disponível, mas não
              garante disponibilidade ininterrupta. Manutenções programadas ou
              imprevistos técnicos podem causar indisponibilidade temporária.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Cancelamento</h2>
            <p>
              O usuário pode cancelar sua assinatura a qualquer momento entrando em
              contato via WhatsApp. Após o cancelamento, o acesso permanece ativo até
              o final do período pago.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Alterações</h2>
            <p>
              Estes termos podem ser atualizados a qualquer momento. Alterações
              significativas serão comunicadas aos usuários por email ou dentro do
              próprio sistema.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Contato</h2>
            <p>
              Para dúvidas, sugestões ou solicitações, entre em contato pelo WhatsApp
              ou pelo email disponível na plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}