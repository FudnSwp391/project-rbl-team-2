-- Chạy file này trên SQL Editor của Supabase để tạo bảng lưu trữ giao dịch

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    order_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Kích hoạt Realtime cho bảng orders để Frontend có thể lắng nghe sự thay đổi tự động
alter publication supabase_realtime add table public.orders;

-- Cấu hình Row Level Security (RLS) cho bảng orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: User chỉ được xem đơn hàng của chính mình
CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admin có thể xem tất cả đơn hàng
CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'Admin')
  )
);

-- Policy: User có thể tạo đơn hàng cho chính mình
CREATE POLICY "Users can insert their own orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ghi chú: Việc UPDATE từ 'pending' sang 'paid' sẽ được thực hiện bởi Supabase Edge Functions (dùng Service Role Key nên bỏ qua RLS).
