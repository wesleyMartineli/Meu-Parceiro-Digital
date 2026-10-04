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
  const { data: users, error: errU } = await supabase.from('users').select('*').limit(5);
  console.log('Users:', users);
  
  const { data: negs, error: errN } = await supabase.from('negocios_crm').select('*');
  console.log('Negocios:', negs.length);
  if (negs.length > 0) {
     console.log('Sample Negocio:', negs[0]);
  }
}
main();
