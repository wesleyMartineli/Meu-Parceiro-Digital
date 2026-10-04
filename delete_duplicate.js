const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
env.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDuplicates() {
  console.log('Fetching leads...');
  
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, nome, created_at')
    .ilike('nome', '%Teste 123%')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching leads:', error);
    return;
  }
  
  console.log(`Found ${leads.length} leads matching the query.`);
  
  if (leads.length > 1) {
    // Keep the last one (oldest) and delete the most recent duplicate
    const duplicate = leads[0];
    
    console.log(`Deleting duplicate lead ID: ${duplicate.id}`);
    
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .eq('id', duplicate.id);
      
    if (deleteError) {
      console.error('Failed to delete:', deleteError);
    } else {
      console.log('Successfully deleted the duplicate!');
    }
  } else {
    console.log('No duplicates found.');
  }
}

cleanDuplicates();
