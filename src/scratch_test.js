import { supabase } from './utils/supabaseClient.js';

async function test() {
  const { data, error } = await supabase.from('interviews').select('*').limit(1);
  console.log(data, error);
  process.exit(0);
}
test();
