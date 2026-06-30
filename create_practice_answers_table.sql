-- ==============================================================================
-- SCRIPT TẠO BẢNG PRACTICE_ANSWERS CHO HỆ THỐNG LUYỆN TẬP CÂU HỎI
-- Copy toàn bộ nội dung file này dán vào SQL Editor của Supabase và chạy (Run)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.practice_answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    answer_text TEXT NOT NULL,
    status TEXT CHECK (status IN ('submitted', 'analyzing', 'completed', 'failed')) DEFAULT 'submitted',
    ai_feedback JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Bật tính năng Row Level Security (RLS) để bảo mật
ALTER TABLE public.practice_answers ENABLE ROW LEVEL SECURITY;

-- Tạo các chính sách bảo mật (Policies)
-- 1. Người dùng chỉ xem được các bài luyện tập của chính mình
CREATE POLICY "Users can view own practice answers" 
ON public.practice_answers 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Người dùng chỉ có thể thêm bài luyện tập cho chính mình
CREATE POLICY "Users can insert own practice answers" 
ON public.practice_answers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Người dùng chỉ có thể chỉnh sửa/cập nhật bài luyện tập của chính mình
CREATE POLICY "Users can update own practice answers" 
ON public.practice_answers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Người dùng chỉ có thể xóa bài luyện tập của chính mình
CREATE POLICY "Users can delete own practice answers" 
ON public.practice_answers 
FOR DELETE 
USING (auth.uid() = user_id);
