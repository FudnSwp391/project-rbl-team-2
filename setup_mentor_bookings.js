const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://hitcsegxyxvxpyusfyge.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdGNzZWd4eXh2eHB5dXNmeWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjAyNjYsImV4cCI6MjA5NDUzNjI2Nn0.g5O82WNRewf_lE7tQuTCh-wqvdSE-efYj-xKfwLL9R4');

(async () => {
  const sql = `
  CREATE TABLE IF NOT EXISTS mentor_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID NOT NULL REFERENCES profiles(id),
    candidate_id UUID NOT NULL REFERENCES profiles(id),
    candidate_name TEXT,
    booking_date DATE,
    booking_time TEXT,
    topic TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ALTER TABLE mentor_bookings ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Allow users to read own bookings" ON mentor_bookings FOR SELECT TO authenticated USING (candidate_id = auth.uid() OR mentor_id = auth.uid());
  CREATE POLICY "Allow users to create bookings" ON mentor_bookings FOR INSERT TO authenticated WITH CHECK (candidate_id = auth.uid());
  CREATE POLICY "Allow mentors to update bookings" ON mentor_bookings FOR UPDATE TO authenticated USING (mentor_id = auth.uid());
  `;

  // Use REST API to create table, or instruct user
  console.log("Since we can't reliably run raw SQL via the default Anon Key, please run this in your Supabase SQL Editor:");
  console.log(sql);
})();
