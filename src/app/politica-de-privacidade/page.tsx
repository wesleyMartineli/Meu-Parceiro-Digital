import React from 'react';
import Logo from '@/components/Logo';
import Link from 'next/link';

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#e9ebe4] flex flex-col items-center py-10 px-4 sm:px-6">
      <div className="max-w-4xl w-full bg-[#e9ebe4] rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
        <div className="flex justify-center mb-10">
          <Link href="/">
            <Logo size="xl" variant="dark" />
          </Link>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">Política de Privacidade e Proteção de Dados</h1>
        <p className="text-sm text-[#00441F] font-semibold mb-8 text-center">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed text-justify">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Compromisso com a Privacidade</h2>
            <p>
              A presente Política de Privacidade e Proteção de Dados demonstra nosso compromisso com a conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>. O nosso sistema atua na modalidade de operador de software, processando informações geradas pelos usuários controladores (empresas, representantes, corretoras de consórcio) e seus clientes finais (titulares dos dados).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Base Legal para o Tratamento</h2>
            <p>
              Os dados processados na ferramenta (como nome, CPF, telefone e e-mail de clientes finais/leads) são obtidos estritamente sob o consentimento do titular ou para procedimentos preliminares inerentes a um contrato (como a simulação e envio de propostas comerciais de consórcio), sendo a responsabilidade da coleta desse consentimento do usuário contratante do nosso sistema.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Finalidade da Coleta</h2>
            <p>
              O armazenamento de informações na plataforma tem os seguintes propósitos restritos:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Permitir a criação e gravação de simulações e propostas comerciais;</li>
              <li>Gerenciamento da esteira comercial (CRM), organização de tarefas e histórico de interações;</li>
              <li>Envio de propostas geradas para o WhatsApp e/ou e-mail do titular, quando solicitado;</li>
              <li>Controle de acesso dos próprios usuários e colaboradores da empresa licenciada.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Direitos do Titular dos Dados</h2>
            <p>
              Em total conformidade com a LGPD, o titular dos dados possui a qualquer momento o direito de requerer do usuário da plataforma (a corretora/empresa controladora que o cadastrou):
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Acesso aos dados arquivados;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Eliminação completa dos dados de simulações, leads e histórico do CRM (anonimização ou exclusão);</li>
              <li>Revogação do consentimento concedido anteriormente para contato comercial.</li>
            </ul>
            <p className="mt-2 text-sm bg-blue-50 text-blue-800 p-3 rounded-lg">
              A plataforma dispõe tecnicamente das funções de edição e exclusão definitivas para que os usuários possam cumprir ativamente com as solicitações dos titulares de dados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Segurança e Compartilhamento</h2>
            <p>
              Os dados estão armazenados em provedores de nuvem de alto padrão de segurança e criptografia. Não realizamos a comercialização de bases de dados de leads, nem o compartilhamento dessas informações com terceiros que não os servidores provedores de infraestrutura estritamente necessários para o funcionamento contínuo do software. O controle de acesso aos dados é restrito unicamente ao workspace (espaço da empresa) em que foram cadastrados.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex justify-center">
          <Link href="/login" className="text-[#00CF7B] font-semibold hover:underline">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}

