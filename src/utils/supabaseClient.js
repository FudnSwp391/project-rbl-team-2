import { createClient } from '@supabase/supabase-js'

// Lưu ý: Các biến này cần được định nghĩa trong file .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Cảnh báo: Thiếu cấu hình Supabase. Vui lòng kiểm tra file .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
