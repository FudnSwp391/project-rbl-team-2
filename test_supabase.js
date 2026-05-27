import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hitcsegxyxvxpyusfyge.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdGNzZWd4eXh2eHB5dXNmeWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjAyNjYsImV4cCI6MjA5NDUzNjI2Nn0.g5O82WNRewf_lE7tQuTCh-wqvdSE-efYj-xKfwLL9R4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing industries table...');
  const { data: industries, error: iError } = await supabase
      .from('industries')
      .select('*');
  console.log('Industries:', industries?.length || 0, 'Error:', iError);
}

test();
