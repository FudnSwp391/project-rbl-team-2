-- ==============================================================================
-- SCRIPT CHUYỂN DỮ LIỆU TỪ bankquestions → questions
-- Chạy TỪNG PHẦN trên Supabase SQL Editor
-- ==============================================================================

-- ============================================================
-- PHẦN A: Thêm cột mới vào bảng questions
-- ============================================================
ALTER TABLE questions ADD COLUMN IF NOT EXISTS options JSONB;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_answer TEXT;

-- ============================================================
-- PHẦN B: Tạo industries từ category (tiếng Việt)
-- Nếu category chưa có trong bảng industries thì tự tạo
-- ============================================================
INSERT INTO industries (name)
SELECT DISTINCT category
FROM bankquestions
WHERE category IS NOT NULL
  AND category NOT IN (SELECT name FROM industries)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- PHẦN C: Chuyển dữ liệu bankquestions → questions
-- Map difficulty: Dễ → easy, Trung bình → medium, Khó → hard
-- ============================================================
INSERT INTO questions (content, industry_id, difficulty, question_type, options, correct_answer)
SELECT 
    bq.question_text,
    i.id,
    CASE 
        WHEN bq.difficulty = 'Dễ'         THEN 'easy'
        WHEN bq.difficulty = 'Trung bình'  THEN 'medium'
        WHEN bq.difficulty = 'Khó'         THEN 'hard'
        WHEN LOWER(bq.difficulty) = 'easy'   THEN 'easy'
        WHEN LOWER(bq.difficulty) = 'medium' THEN 'medium'
        WHEN LOWER(bq.difficulty) = 'hard'   THEN 'hard'
        ELSE 'medium'
    END,
    'technical',
    bq.options,
    bq.correct_answer
FROM bankquestions bq
LEFT JOIN industries i ON i.name = bq.category;

-- ============================================================
-- PHẦN D: Kiểm tra kết quả
-- ============================================================
SELECT 
    q.content, 
    i.name AS industry, 
    q.difficulty, 
    q.options, 
    q.correct_answer
FROM questions q
LEFT JOIN industries i ON q.industry_id = i.id
ORDER BY i.name, q.difficulty;

-- ============================================================
-- PHẦN E: Xoá bảng bankquestions (CHỈ CHẠY KHI ĐÃ KIỂM TRA XONG)
-- ============================================================
-- DROP TABLE IF EXISTS bankquestions;
