# 📘 Hướng dẫn Phát triển Dự án AI Mock Interview

Tài liệu này cung cấp hướng dẫn chi tiết về cấu trúc, công nghệ và cách triển khai dự án dành cho nhóm phát triển.

---

## 🛠 1. Công nghệ sử dụng (Tech Stack)

### Frontend
- **Framework**: React.js (Vite) - Chuẩn môn FER202.
- **Styling**: Vanilla CSS + Design System (Glassmorphism).
- **Icons**: [Lucide React](https://lucide.dev/).
- **Routing**: React Router DOM v6.

### Backend & Database (BaaS)
- **Supabase**: Thay thế hoàn toàn cho việc viết Backend truyền thống.
  - **PostgreSQL**: Lưu trữ dữ liệu người dùng, bài đăng, lịch sử phỏng vấn.
  - **Supabase Auth**: Quản lý đăng ký/đăng nhập (Email, Social).
  - **Supabase Storage**: Lưu trữ file CV (.pdf, .docx).
  - **Edge Functions**: Để gọi API AI (OpenAI/Gemini) bảo mật.

---

## ☁️ 2. Thiết lập Supabase (Dành cho Leader)

### Bước 1: Tạo Project
Truy cập [Supabase](https://supabase.com/), tạo project mới.

### Bước 2: Cấu trúc Bảng (Database Schema)
Chạy các lệnh SQL sau trong **SQL Editor** của Supabase để tạo bảng:

```sql
-- 1. Bảng Profiles (Thông tin người dùng)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text default 'candidate', -- candidate, recruiter, admin
  points int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Bảng CVs (Quản lý hồ sơ)
create table cvs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  file_url text,
  analysis_result jsonb, -- Lưu kết quả phân tích từ AI
  created_at timestamp with time zone default now()
);

-- 3. Bảng Interviews (Lịch sử phỏng vấn)
create table interviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  industry text,
  score int,
  feedback text,
  created_at timestamp with time zone default now()
);

-- 4. Bảng Jobs (Bài đăng tuyển dụng - Dành cho Nhà tuyển dụng)
create table jobs (
  id uuid default uuid_generate_v4() primary key,
  recruiter_id uuid references profiles(id),
  title text,
  description text,
  status text default 'pending', -- pending, approved
  created_at timestamp with time zone default now()
);
```

---

## 🚀 3. Cách Kết nối React với Supabase

### Cài đặt thư viện:
```bash
npm install @supabase/supabase-js
```

### Cấu hình Client (`src/utils/supabaseClient.js`):
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 📂 4. Quy trình Phát triển Nhóm


### Quy tắc làm việc:
1. **Branching**: Không bao giờ code trực tiếp trên `main`. Tạo nhánh `feature/ten-tinh-nang`.
2. **Design System**: Sử dụng các biến trong `src/assets/styles/design-system.css`.
   - Màu chính: `var(--primary)`
   - Hiệu ứng kính: `.glass-card`
3. **Pull Request**: Luôn yêu cầu 1 thành viên khác review code trước khi merge.

---

## 🤖 5. Tích hợp AI (Xử lý thông minh)

Vì đây là môn học Frontend, các bạn có thể xử lý AI theo 2 hướng:
1. **Frontend Call**: Gọi trực tiếp API OpenAI/Gemini (Dễ làm nhưng kém bảo mật).
2. **Supabase Edge Functions**: Viết một hàm trung gian trên Supabase để gọi AI, đảm bảo an toàn cho API Key.

---

## 📝 6. Hướng dẫn sử dụng Skeleton hiện có

1. **Khởi chạy**: `npm install` -> `npm run dev`.
2. **Landing Page**: Chỉnh sửa tại `src/pages/Landing/LandingPage.jsx`.
3. **Header**: Chỉnh sửa tại `src/components/layout/Header.jsx`.
4. **Trang CV**: Xem ví dụ cách xử lý logic AI giả lập tại `src/pages/CV/CVManager.jsx`.

Chúc Team hoàn thành dự án xuất sắc! 🎯
