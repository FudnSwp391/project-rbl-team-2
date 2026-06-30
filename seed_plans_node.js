import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hitcsegxyxvxpyusfyge.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdGNzZWd4eXh2eHB5dXNmeWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjAyNjYsImV4cCI6MjA5NDUzNjI2Nn0.g5O82WNRewf_lE7tQuTCh-wqvdSE-efYj-xKfwLL9R4');
async function test() {
  const { data, error } = await supabase.from('subscription_plans').insert([{name: 'Free', price: 0, duration_days: 30, features: ['1 lu?t luy?n t?p v?i AI', '5 lu?t luy?n t?p question'], max_mentor_bookings: 0, max_ai_interviews: 1, max_questions: 5}, {name: 'Pro', price: 5000, duration_days: 14, features: ['5 lu?t luy?n t?p v?i AI', '10 lu?t luy?n t?p question', 'Ð?t l?ch mentor 1 l?n'], max_mentor_bookings: 1, max_ai_interviews: 5, max_questions: 10}, {name: 'Premium', price: 10000, duration_days: 30, features: ['30 lu?t luy?n t?p v?i AI', 'Không gi?i h?n luy?n t?p question', 'Ð?t l?ch mentor 5 l?n'], max_mentor_bookings: 5, max_ai_interviews: 30, max_questions: 999}]).select();
  console.log('insert result:', { data, error });
}
test();
