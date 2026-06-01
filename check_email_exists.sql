-- ============================================================
-- HÀM KIỂM TRA EMAIL ĐÃ TỒN TẠI TRONG HỆ THỐNG CHƯA
-- Copy và chạy đoạn SQL này trong Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_email_exists(email_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypass RLS để kiểm tra bảng profiles
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE email = email_input
  );
END;
$$;
