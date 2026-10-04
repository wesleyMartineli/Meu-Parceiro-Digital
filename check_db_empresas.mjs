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
  const { data: emps, error: errE } = await supabase.from('empresas').select('*');
  console.log('Empresas:', emps);
  
  const { data: profiles, error: errP } = await supabase.from('profiles').select('*').limit(5);
  console.log('Profiles:', profiles);
}
main();
