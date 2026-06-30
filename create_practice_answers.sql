-- ==========================================
-- CREATE TABLE: practice_answers
-- Lưu trữ lịch sử câu trả lời luyện tập của ứng viên
-- ==========================================

CREATE TABLE IF NOT EXISTS public.practice_answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'reviewed'
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS (Row Level Security) Policies
ALTER TABLE public.practice_answers ENABLE ROW LEVEL SECURITY;

-- Người dùng có thể xem bài của chính mình
CREATE POLICY "Users can view their own practice answers" 
    ON public.practice_answers FOR SELECT 
    USING (auth.uid() = user_id);

-- Người dùng có thể thêm bài làm của chính mình
CREATE POLICY "Users can insert their own practice answers" 
    ON public.practice_answers FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Người dùng có thể cập nhật bài làm của chính mình
CREATE POLICY "Users can update their own practice answers" 
    ON public.practice_answers FOR UPDATE 
    USING (auth.uid() = user_id);
    
-- Cho phép Mentor đọc bài của học viên (Giả sử Mentor có quyền đọc tất cả bài, hoặc sau này sẽ filter qua code)
CREATE POLICY "Mentors can read all practice answers" 
    ON public.practice_answers FOR SELECT 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mentor'));

-- Cho phép Mentor cập nhật feedback vào bài
CREATE POLICY "Mentors can update practice answers feedback" 
    ON public.practice_answers FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mentor'));

-- Cho phép Admin full quyền
CREATE POLICY "Admins have full access to practice answers" 
    ON public.practice_answers FOR ALL 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
