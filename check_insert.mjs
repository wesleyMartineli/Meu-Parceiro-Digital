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
  const { data, error } = await supabase.from('negocios_crm').insert({
    cliente_id: "9ce7e5e0-0963-4a54-bfa0-c1954295e0b5", // some valid client id
    vendedor_id: "0c14570e-b224-47ba-9e7f-a4fd362c0d7d", // some valid user
    titulo: "Test Insert",
    credito: 1000,
    modalidade: "Geral",
    etapa_funil: "simulacao_apresentada"
  }).select('*');
  
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Insert success:', data);
  }
}
main();
