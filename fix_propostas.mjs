import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envStr = fs.readFileSync('.env.local', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of envStr.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
}

if (!supabaseKey) {
  for (const line of envStr.split('\n')) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  }
}

supabaseUrl = supabaseUrl.replace(/["']/g, "");
supabaseKey = supabaseKey.replace(/["']/g, "");

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Buscando propostas sem negocio_id...');
  const { data: propostas, error } = await supabase
    .from('propostas')
    .select('*, leads(nome, origem, temperatura), simulacoes(credito_total, modalidade, administradora_id, produto, administradoras(nome))')
    .is('negocio_id', null);

  if (error) {
    console.error('Erro ao buscar propostas:', error);
    return;
  }

  console.log(`Encontradas ${propostas.length} propostas sem negocio_id.`);

  for (const prop of propostas) {
    if (!prop.leads || !prop.simulacoes) {
      console.log(`Pulando proposta ${prop.id} - sem lead ou simulação`);
      continue;
    }
    
    let adminNome = '';
    if (prop.simulacoes.administradoras && typeof prop.simulacoes.administradoras === 'object' && 'nome' in prop.simulacoes.administradoras) {
      adminNome = prop.simulacoes.administradoras.nome;
    }

    const titulo = `${prop.leads.nome} - ${prop.simulacoes.produto} - R$ ${prop.simulacoes.credito_total.toLocaleString('pt-BR')}`;
    
    const negocioPayload = {
      empresa_id: prop.empresa_id || '43605699-aaf9-4caf-872a-2526e728ddd6',
      cliente_id: prop.lead_id,
      proposta_id: prop.id,
      vendedor_id: prop.vendedor_id,
      titulo: titulo,
      credito: prop.simulacoes.credito_total,
      modalidade: prop.simulacoes.modalidade,
      administradora: adminNome,
      etapa_funil: 'simulacao_apresentada',
      temperatura: prop.leads.temperatura,
      origem: prop.leads.origem,
    };

    const { data: newNegocio, error: negocioError } = await supabase
      .from('negocios_crm')
      .insert(negocioPayload)
      .select('id')
      .single();

    if (negocioError) {
      console.error(`Erro ao criar negocio_crm para proposta ${prop.id}:`, negocioError);
    } else if (newNegocio) {
      await supabase
        .from('propostas')
        .update({ negocio_id: newNegocio.id })
        .eq('id', prop.id);
      console.log(`Corrigida proposta ${prop.id} -> negócio ${newNegocio.id}`);
    }
  }
}

main();
