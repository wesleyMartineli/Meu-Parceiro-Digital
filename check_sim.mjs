import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envStr = fs.readFileSync('.env.local', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of envStr.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('simulacoes')
    .select('*')
    .eq('id', '926e4cb5-3956-4c94-94ea-4293e80b86c4')
    .single();

  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data.output_json, null, 2).substring(0, 3000));
  }
}

check();
