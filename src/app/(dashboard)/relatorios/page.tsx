import { redirect } from 'next/navigation';
import { getCurrentUser, getActiveCompany } from '@/lib/supabase/helpers';
import { createClient } from '@/lib/supabase/server';
import RelatoriosDashboard from '@/modules/relatorios/components/RelatoriosDashboard';

export default async function RelatoriosPage() {
  const user = await getCurrentUser();

  if (!user || user.role === 'gerente_negocio') {
    // Redireciona o gerente para o dashboard principal caso tente acessar diretamente pela URL
    redirect('/dashboard');
  }

  const company = await getActiveCompany();

  if (!company) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl max-w-6xl mx-auto mt-8">
        <h3 className="font-bold text-lg">Erro de Inquilino</h3>
        <p className="text-sm mt-1 font-light">Não foi possível identificar a estrutura corporativa.</p>
      </div>
    );
  }

  const supabase = await createClient();

  // 1. Buscar Hierarquia de Usuários (Gerentes, Regionais, Superintendentes)
  const { data: usuariosData } = await supabase
    .from('usuarios')
    .select('id, nome, role, supervisor_id')
    .in('role', ['gerente_negocio', 'regional', 'superintendente'])
    .eq('ativo', true);

  // 2. Buscar Negócios
  const { data: negociosData } = await supabase
    .from('negocios_crm')
    .select('id, vendedor_id, etapa_funil, credito, titulo, created_at, updated_at');

  // 3. Buscar Leads
  const { data: leadsData } = await supabase
    .from('leads')
    .select('id, vendedor_id, origem, created_at');

  // 4. Buscar Tarefas (Followups)
  const { data: tarefasData } = await supabase
    .from('followups')
    .select('id, vendedor_id, created_at');

  return (
    <div className="max-w-7xl mx-auto w-full">
      <RelatoriosDashboard 
        nomeEmpresa={company.nome_empresa}
        usuarios={usuariosData || []}
        negocios={negociosData || []}
        leads={leadsData || []}
        tarefas={tarefasData || []}
        currentUserRole={user.role}
        currentUserId={user.id}
      />
    </div>
  );
}
