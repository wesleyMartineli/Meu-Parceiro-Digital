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
  const { data, error } = await supabase.from('negocios_crm').select('*').limit(1);
  if (error) {
    console.error('Error fetching data:', error);
  } else {
    console.log('Data:', JSON.stringify(data, null, 2));
    if (data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    }
  }
  
  // Also list proposals to see if they have negocio_id
  const { data: propostas, error: propErr } = await supabase.from('propostas').select('*').limit(1);
  if (propErr) {
    console.error('Error fetching propostas:', propErr);
  } else {
    console.log('Propostas data:', JSON.stringify(propostas, null, 2));
  }
}
main();
