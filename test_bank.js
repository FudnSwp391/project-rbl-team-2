import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hitcsegxyxvxpyusfyge.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdGNzZWd4eXh2eHB5dXNmeWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjAyNjYsImV4cCI6MjA5NDUzNjI2Nn0.g5O82WNRewf_lE7tQuTCh-wqvdSE-efYj-xKfwLL9R4');
async function test() {
  const { data, error } = await supabase.from('bankquestions').insert([{ question_text: 'Test', category: 'Frontend', difficulty: 'Easy', options: ['A','B'], correct_answer: 'A' }]).select();
  console.log('insert result:', { data, error });
}
test();
