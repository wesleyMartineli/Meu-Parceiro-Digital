import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envStr = fs.readFileSync('.env.local', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of envStr.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
}

supabaseUrl = supabaseUrl.replace(/["']/g, "");
supabaseKey = supabaseKey.replace(/["']/g, "");
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: leads } = await supabase.from('leads').select('*').limit(2);
  console.log('Leads fields:', Object.keys(leads[0] || {}));
  console.log('Sample lead:', leads[0]);

  const { data: pvUsers } = await supabase.from('usuarios').select('*').in('role', ['ponto_venda', 'vendedor']);
  console.log('PV/Vendedor users:', pvUsers);

  const { data: allLeads } = await supabase.from('leads').select('id, nome, vendedor_id');
  console.log('All Leads list:', allLeads);
}
main();


