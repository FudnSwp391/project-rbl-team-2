# 👥 TÀI LIỆU PHÂN CÔNG NHIỆM VỤ NHÓM 5 NGƯỜI (ĐÃ CÓ SẴN SUPABASE)
## Dự Án: Hệ thống Phỏng vấn giả lập & Đánh giá năng lực tự động bằng AI (AI Mock Interview)

Vì cơ sở dữ liệu **Supabase** đã được thiết lập sẵn (bảng `profiles`, `cvs`, `interviews`, `jobs`, `blogs`, `challenges`, `subscriptions` đã tồn tại), đội ngũ sẽ tập trung hoàn toàn vào việc xây dựng giao diện **React (Vite)**, tích hợp logic và xử lý **API AI** thông qua **Supabase Edge Functions**.

Dưới đây là kế hoạch phân chia công việc chi tiết, tối ưu cho 5 thành viên để tối đa hóa hiệu suất và tránh giẫm chân lên code của nhau.

---

## 📋 SƠ ĐỒ PHÂN CHIA NHIỆM VỤ CHUNG
*   **Thành viên 1 (Leader)**: Backend Integrator & AI Engineer (Edge Functions, Gemini API, RLS & Git Coordinator).
*   **Thành viên 2**: Frontend Developer - AI Mock Interview Flow (Giao diện & Logic phỏng vấn giả lập).
*   **Thành viên 3**: Frontend Developer - CV Upload & AI Analysis Dashboard (Quản lý CV & Bảng phân tích AI).
*   **Thành viên 4**: Frontend Developer - Recruiter Portal & Jobs Board (Phân hệ Nhà tuyển dụng & Ứng tuyển).
*   **Thành viên 5**: Frontend Developer - Gamification, Blogs & Subscriptions (Thử thách ngày, Bài viết & Gói dịch vụ).

---

## 📑 CHI TIẾT NHIỆM VỤ TỪNG THÀNH VIÊN

### 👤 THÀNH VIÊN 1: TEAM LEADER / AI & INTEGRATION ENGINEER
*   **Trọng tâm**: Xử lý logic AI ở phía Server, viết Edge Functions kết nối Gemini API/OpenAI, bảo mật hệ thống, hỗ trợ kết nối API cho cả nhóm.
*   **Nhiệm vụ cụ thể**:
    1.  **Thiết lập Edge Functions kết nối AI**:
        *   Viết hàm nhận file/text CV, gọi API Gemini để phân tích điểm mạnh, điểm yếu và cấu trúc lại kết quả trả về dạng JSON để lưu vào cột `cvs.ai_analysis_result`.
        *   Viết hàm nhận file ghi âm/văn bản trả lời câu hỏi phỏng vấn, gọi API AI để chấm điểm, nhận xét và sinh câu hỏi tiếp theo (nếu dùng luồng động).
    2.  **Quản lý Storage & RLS**:
        *   Đảm bảo Bucket `cv-bucket` và `audio-bucket` hoạt động chính xác với phân quyền phù hợp.
        *   Kiểm tra chính sách **Row Level Security (RLS)** trên Supabase để chắc chắn Ứng viên chỉ xem được dữ liệu của họ, Nhà tuyển dụng chỉ xem được tin tuyển dụng của họ.
    3.  **Tích hợp & Điều phối**:
        *   Viết file cấu hình chung `src/utils/supabaseClient.js`.
        *   Hỗ trợ các thành viên kết nối các hàm `supabase.from().select()`, `insert()`, `update()`.
        *   Review và duyệt Pull Request (PR) của cả nhóm, giải quyết các xung đột Git (conflict).
    4.  **Tạo dữ liệu mẫu (Seed Data) & Cấu hình môi trường**:
        *   Tạo dữ liệu mẫu (SQL Seed) cho các bảng `industries` và `questions` (các ngành IT, Marketing, HR với tối thiểu 10 câu hỏi mẫu) để nhóm có sẵn dữ liệu test Frontend.
        *   Cấu hình tệp môi trường mẫu `.env.example` và hướng dẫn toàn bộ thành viên thiết lập các khóa kết nối đến Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
*   **Nhánh Git**: `feature/leader-ai-edge-functions`


---

### 👤 THÀNH VIÊN 2: FRONTEND DEVELOPER - AI MOCK INTERVIEW FLOW
*   **Trọng tâm**: Phát triển toàn bộ luồng phỏng vấn giả lập tương tác thời gian thực với AI từ giao diện đến logic.
*   **Nhiệm vụ cụ thể**:
    1.  **Trang chọn Ngành & Cấu hình Phỏng vấn**:
        *   Thiết kế màn hình hiển thị các ngành nghề (lấy từ bảng `industries`).
        *   Cho phép người dùng chọn độ khó (Dễ, Trung bình, Khó) và loại câu hỏi.
    2.  **Màn hình phòng phỏng vấn thử (Mock Interview Room)**:
        *   Giao diện Glassmorphism trực quan: Giả lập webcam, hiển thị câu hỏi của AI (lấy từ bảng `questions`).
        *   Tích hợp **Web Audio API** để ghi âm giọng nói trực tiếp từ microphone của người dùng.
        *   Xử lý gửi file âm thanh hoặc văn bản trả lời của ứng viên lên Supabase Edge Function để phân tích.
    3.  **Màn hình kết quả (Interview Feedback Dashboard)**:
        *   Hiển thị điểm tổng quan (`interviews.overall_score`), nhận xét chung (`overall_feedback`).
        *   Hiển thị điểm chi tiết và đánh giá ngữ điệu/ngữ pháp của từng câu hỏi (`interview_answers.ai_evaluation`).
*   **Nhánh Git**: `feature/frontend-mock-interview`

---

### 👤 THÀNH VIÊN 3: FRONTEND DEVELOPER - CV UPLOAD & AI ANALYSIS DASHBOARD
*   **Trọng tâm**: Quản lý hồ sơ CV, tích hợp upload file và xây dựng trang hiển thị phân tích CV bằng AI.
*   **Nhiệm vụ cụ thể**:
    1.  **Màn hình quản lý hồ sơ (CV Manager)**:
        *   Thiết kế khu vực kéo-thả (Drag-and-Drop) để tải lên file CV dạng PDF/Word.
        *   Tích hợp API tải file lên Supabase Storage `cv-bucket`, lưu thông tin URL vào bảng `cvs`.
        *   Thực hiện các thao tác CRUD (Xem danh sách CV đã upload, Xóa CV, đặt CV mặc định `is_default`).
    2.  **Bảng phân tích CV bằng AI (AI CV Analysis Dashboard)**:
        *   Khi người dùng click "Phân tích bằng AI" -> Gọi API xử lý và hiển thị trạng thái Loading đẹp mắt.
        *   Hiển thị điểm đánh giá CV (`cvs.ai_score`) bằng biểu đồ vòng tròn hoặc thanh tiến trình.
        *   Hiển thị kết quả phân tích có cấu trúc từ `cvs.ai_analysis_result` gồm: Điểm mạnh, Điểm yếu cần khắc phục, Từ khóa đề xuất cần thêm vào CV để vượt qua bộ lọc ATS.
*   **Nhánh Git**: `feature/frontend-cv-analysis`

---

### 👤 THÀNH VIÊN 4: FRONTEND DEVELOPER - RECRUITER PORTAL & JOBS BOARD
*   **Trọng tâm**: Toàn bộ luồng đăng tin tuyển dụng dành cho Nhà tuyển dụng và tính năng tìm việc, nộp đơn của Ứng viên.
*   **Nhiệm vụ cụ thể**:
    1.  **Phân hệ Nhà tuyển dụng (Recruiter)**:
        *   Thiết kế Dashboard hiển thị danh sách các tin tuyển dụng đã đăng (tương tác với bảng `jobs`).
        *   Xây dựng Form đăng tin/chỉnh sửa tin tuyển dụng ( CRUD tin đăng: Tiêu đề, Mô tả, Lương, Yêu cầu).
        *   Trang quản lý danh sách ứng viên ứng tuyển (`job_applications`): Cho phép Recruiter xem thông tin ứng viên, xem CV gốc và xem cả **kết quả AI đánh giá CV** của ứng viên đó để dễ dàng sàng lọc.
        *   Chức năng cập nhật trạng thái hồ sơ ứng viên (Duyệt/Hẹn phỏng vấn/Từ chối) và gửi ghi chú.
    2.  **Phân hệ Ứng viên (Candidate Job Search)**:
        *   Trang tìm kiếm việc làm, lọc theo ngành nghề, mức lương.
        *   Nút "Ứng tuyển ngay": Cho phép ứng viên chọn nhanh CV đã upload trong hệ thống để nộp đơn.
*   **Nhánh Git**: `feature/frontend-recruiter-jobs`

---

### 👤 THÀNH VIÊN 5: FRONTEND DEVELOPER - GAMIFICATION, BLOGS & SUBSCRIPTIONS
*   **Trọng tâm**: Xây dựng các tính năng nâng cao trải nghiệm người dùng, giữ chân người dùng (Retention) và gói dịch vụ.
*   **Nhiệm vụ cụ thể**:
    1.  **Thử thách hàng ngày (Daily Challenges - Gamification)**:
        *   Hiển thị thử thách mỗi ngày (lấy từ bảng `challenges`).
        *   Theo dõi chuỗi ngày đăng nhập liên tiếp (Streak) và điểm số tích lũy (`points`) trong bảng `profiles`.
        *   Hiển thị bảng xếp hạng thành tích (Leaderboard) giữa các ứng viên để tạo tính cạnh tranh.
    2.  **Trang Blog & Tips chia sẻ kinh nghiệm**:
        *   Giao diện đọc bài viết chia sẻ kinh nghiệm, xu hướng thị trường lao động (tương tác bảng `blogs`).
        *   Giao diện viết bài/đăng tải bài viết dành riêng cho Mentor hoặc Admin.
    3.  **Trang gói dịch vụ & Nâng cấp tài khoản (Subscriptions)**:
        *   Thiết kế bảng giá dịch vụ (Pricing Table) đẹp mắt cho các gói Basic, Pro, Premium.
        *   Tạo luồng thanh toán giả lập (Mock Checkout), nâng cấp trạng thái người dùng trong bảng `user_subscriptions` sau khi thanh toán thành công.
*   **Nhánh Git**: `feature/frontend-gamification-blogs`

---

### 🧑‍🏫 VAI TRÒ MENTOR (ACTOR B): FRONTEND DEVELOPER - MENTOR PORTAL & REVIEW SYSTEM
*   **Trọng tâm**: Xây dựng toàn bộ phân hệ Mentor bao gồm Dashboard quản lý, hệ thống đánh giá video phỏng vấn, quản lý lịch hẹn mentoring 1-on-1 và quản lý blog chia sẻ kiến thức.
*   **Mô tả chi tiết**: `MentorRoute`, `MentorDashboard`, `MentorBlogManagement`, `MentorPostBlog`, `MentorReviews`, `MentorReviewDetail`, `MentorSchedule`, `MentorSession` - Xây dựng hệ thống phân quyền role-based cho Mentor, tạo giao diện Dashboard hiển thị thống kê (số yêu cầu đánh giá chờ, buổi hẹn sắp tới, blog đã xuất bản). Phát triển module Đánh giá Phỏng vấn cho phép Mentor xem video phỏng vấn của ứng viên, chấm điểm kỹ năng kỹ thuật/giao tiếp/tư duy và gửi nhận xét chi tiết. Xây dựng module Quản lý Lịch hẹn cho phép Mentor xem/chấp nhận/từ chối yêu cầu booking, tham gia phiên mentoring trực tuyến 1-on-1 với video call, ghi chú phiên. Tích hợp module Blog Management cho phép Mentor tạo, chỉnh sửa, xuất bản bài viết chia sẻ kinh nghiệm phỏng vấn cho ứng viên.
*   **Nhiệm vụ cụ thể**:
    1.  **Mentor Dashboard** (`MentorDashboard.jsx`):
        *   Thiết kế trang tổng quan với 3 thẻ thống kê (Yêu cầu đánh giá chờ, Buổi hẹn sắp tới, Blog đã xuất bản).
        *   4 thẻ tính năng chính điều hướng đến: Quản lý Blog, Đánh giá Phỏng vấn, Quản lý Lịch hẹn, Cài đặt Hồ sơ.
    2.  **Hệ thống Đánh giá Phỏng vấn** (`MentorReviews.jsx`, `MentorReviewDetail.jsx`):
        *   Danh sách yêu cầu đánh giá với bộ lọc trạng thái (Chờ đánh giá / Đã đánh giá).
        *   Trang chi tiết: Trình phát video phỏng vấn, danh sách câu hỏi đã hỏi, biểu mẫu phản hồi có thanh trượt điểm (Kỹ thuật, Giao tiếp, Tư duy giải quyết vấn đề) và các trường nhận xét văn bản (Điểm mạnh, Điểm cần cải thiện, Nhận xét tổng quan).
    3.  **Quản lý Lịch hẹn Mentoring** (`MentorSchedule.jsx`, `MentorSession.jsx`):
        *   Danh sách yêu cầu đặt lịch với bộ lọc (Chờ xác nhận / Đã chấp nhận / Đã hoàn thành / Đã từ chối).
        *   Hành động Chấp nhận / Từ chối booking trực tiếp trên danh sách.
        *   Phòng phiên Mentoring trực tuyến 1-on-1 với giao diện video call (camera, micro, chia sẻ màn hình), bảng thông tin phiên, khu vực ghi chú, đồng hồ đếm thời gian.
    4.  **Quản lý Blog Mentor** (`MentorBlogManagement.jsx`, `MentorPostBlog.jsx`):
        *   Danh sách blog của Mentor với trạng thái (Bản nháp / Đã xuất bản), hành động Chỉnh sửa / Xuất bản / Xóa.
        *   Biểu mẫu tạo/chỉnh sửa bài viết: Tiêu đề, Loại nội dung (Bài viết/Video), Danh mục, Nội dung, URL Video.
    5.  **Phân quyền & Route Guard** (`MentorRoute.jsx`):
        *   Route Guard kiểm tra `profile.role === 'mentor'` từ bảng `profiles` trên Supabase.
        *   Hiển thị badge "MENTOR" (màu moss green `#6B7F5C`) bên cạnh tên người dùng trên Header.
        *   Link "Mentor Portal" xuất hiện trên thanh điều hướng khi đăng nhập bằng tài khoản Mentor.
*   **Các file liên quan**: `src/MentorRoute.jsx`, `src/pages/Mentor/MentorDashboard.jsx`, `MentorBlogManagement.jsx`, `MentorPostBlog.jsx`, `MentorReviews.jsx`, `MentorReviewDetail.jsx`, `MentorSchedule.jsx`, `MentorSession.jsx`, `src/routes/AppRoutes.jsx`, `src/components/layout/Header.jsx`
*   **Nhánh Git**: `develop`

---

## ⚙️ 2. QUY TRÌNH HỢP NHẤT MÃ NGUỒN TRÊN GIT (COLLABORATION FLOW)

Vì cả 5 người làm việc đồng thời trên các phần khác nhau của cùng một dự án React, hãy tuân thủ quy trình sau để **tránh xung đột code (conflict)**:

1.  **Giao tiếp trước khi thay đổi file dùng chung**: Mọi thay đổi ở các file dùng chung như `App.jsx`, `index.css`, `design-system.css`, hoặc thư mục `routes/AppRoutes.jsx` phải được thông báo trước cho nhóm.
2.  **Quy trình lấy code mới nhất**: Trước khi bắt đầu viết code mới mỗi ngày, phải kéo code từ nhánh chung về nhánh của mình:
    ```bash
    git checkout develop
    git pull origin develop
    git checkout <nhánh-của-bạn>
    git merge develop
    ```
3.  **Tạo Pull Request (PR) rõ ràng**: Khi hoàn thành một tính năng, push nhánh lên GitHub và tạo PR từ `<nhánh-của-bạn>` vào `develop`. Gửi link PR vào nhóm chat để Leader hoặc 1 thành viên khác review trước khi Merge.
