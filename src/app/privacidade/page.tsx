import Link from 'next/link'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-green-600 hover:underline text-sm">
            ← Voltar ao início
          </Link>
          <h1 className="text-3xl font-bold mt-4">Política de Privacidade</h1>
          <p className="text-gray-500 mt-2">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Dados Coletados</h2>
            <p>O EstoqueSystem coleta apenas os dados necessários para o funcionamento do serviço:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome, email e senha (criptografada);</li>
              <li><strong>Dados do negócio:</strong> nome do estabelecimento, produtos e movimentações de estoque;</li>
              <li><strong>Dados de pagamento:</strong> processados exclusivamente pelo Mercado Pago — não armazenamos dados de cartão.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Como Usamos os Dados</h2>
            <p>Seus dados são utilizados exclusivamente para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Prover e manter o funcionamento do sistema;</li>
              <li>Processar pagamentos da assinatura;</li>
              <li>Enviar comunicações importantes sobre o serviço;</li>
              <li>Melhorar a experiência do usuário.</li>
            </ul>
            <p>
              <strong>Não vendemos, compartilhamos ou alugamos seus dados para terceiros.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. Armazenamento e Segurança</h2>
            <p>
              Os dados são armazenados em servidores seguros da Supabase, com
              criptografia em trânsito (TLS/SSL) e em repouso. Senhas são
              armazenadas usando hash seguro e nunca em texto puro.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Seus Direitos</h2>
            <p>Conforme a LGPD (Lei Geral de Proteção de Dados), você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Acessar seus dados pessoais;</li>
              <li>Corrigir dados incompletos ou desatualizados;</li>
              <li>Solicitar a exclusão dos seus dados;</li>
              <li>Revogar o consentimento a qualquer momento.</li>
            </ul>
            <p>
              Para exercer qualquer um desses direitos, entre em contato pelo WhatsApp.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Cookies</h2>
            <p>
              Utilizamos apenas cookies essenciais para manter sua sessão ativa
              e suas preferências (como tema claro/escuro). Não utilizamos
              cookies de rastreamento ou publicidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Alterações</h2>
            <p>
              Esta política pode ser atualizada periodicamente. Alterações
              relevantes serão comunicadas aos usuários.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Contato</h2>
            <p>
              Responsável: Lucas Machado<br />
              Contato: via WhatsApp disponível na plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}