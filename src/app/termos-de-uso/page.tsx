import React from 'react';
import Logo from '@/components/Logo';
import Link from 'next/link';

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-[#e9ebe4] flex flex-col items-center py-10 px-4 sm:px-6">
      <div className="max-w-4xl w-full bg-[#e9ebe4] rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
        <div className="flex justify-center mb-10">
          <Link href="/">
            <Logo size="xl" variant="dark" />
          </Link>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">Termos de Uso</h1>
        <p className="text-sm text-[#00441F] font-semibold mb-8 text-center">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed text-justify">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Natureza da Plataforma</h2>
            <p>
              Esta plataforma é uma ferramenta de software independente destinada exclusivamente ao apoio comercial e à simulação estimativa de planos de consórcio. Ela <strong>não</strong> opera como uma administradora de consórcio, não realiza a comercialização direta de cotas, não gerencia grupos de consórcio e não realiza ou garante contemplações de qualquer espécie.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Ausência de Representação e Responsabilidade por Dados</h2>
            <p>
              A plataforma <strong>não</strong> representa oficialmente nenhuma administradora de consórcio. As administradoras eventualmente mencionadas no sistema são utilizadas estritamente como referências informadas e cadastradas pelos próprios usuários do sistema. As simulações geradas baseiam-se nos parâmetros comerciais e taxas inseridas manualmente ou por integrações não-oficiais configuradas pelo usuário. O sistema isenta-se de qualquer responsabilidade sobre a precisão dessas informações.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Natureza Estimativa das Simulações</h2>
            <p>
              Em conformidade com a <strong>Lei nº 11.795/2008 (Lei dos Consórcios)</strong> e com as normas e resoluções vigentes do <strong>Banco Central do Brasil</strong>, esclarecemos que os valores, taxas de administração, fundos de reserva, prazos, cálculos de lance, parcelas e demais condições financeiras apresentadas pelo sistema são <strong>estritamente estimativas</strong>.
            </p>
            <p className="mt-2">
              Nenhuma simulação configura proposta vinculativa ou contrato de adesão. Todos os dados devem ser obrigatoriamente validados pelo cliente e pelo representante comercial junto à administradora responsável, de acordo com as condições oficiais vigentes, regras específicas do grupo e do contrato de adesão da administradora escolhida no momento da contratação.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Proteção do Consumidor e Vedação à Promessa de Contemplação</h2>
            <p>
              Em alinhamento ao <strong>Código de Defesa do Consumidor (Lei nº 8.078/1990)</strong>, repudiamos qualquer prática de publicidade enganosa. A ferramenta não gera, não endossa e veda terminantemente a emissão de qualquer documento que sugira, prometa ou garanta contemplação com data certa ou por valor fixo estipulado à margem das regras de sorteio e lance normatizadas. O uso da ferramenta para prometer falsas contemplações acarretará no banimento do usuário da plataforma, cabendo a este a responsabilização civil e penal por seus atos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Propriedade Intelectual</h2>
            <p>
              Conforme a <strong>Lei de Propriedade Industrial (Lei nº 9.279/1996)</strong>, informamos que quaisquer marcas, logotipos, símbolos e nomes empresariais de administradoras que porventura sejam exibidos nas interfaces e PDFs gerados pela plataforma pertencem única e exclusivamente aos seus respectivos titulares.
            </p>
            <p className="mt-2">
              A responsabilidade pelo uso, exibição e autorização de uso de marcas e logotipos ao cadastrar uma administradora no sistema recai integralmente sobre o usuário da ferramenta, que declara ter legitimidade ou autorização comercial para atuar como representante ou corretor parceiro destas instituições.
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

