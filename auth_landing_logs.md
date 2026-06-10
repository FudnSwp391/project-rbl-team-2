# Nhật Ký Thay Đổi Dự Án (PROJECT CHANGELOG) - Từ Lúc Khởi Đầu Đến Hiện Tại
**Thành viên thực hiện:** Nguyễn Quốc Tuấn & Team

Dưới đây là nhật ký thay đổi dự án (Project Changelog) chi tiết từ khi khởi tạo dự án cho tới nay, ghi nhận toàn bộ quá trình phát triển các tệp tin (files) theo các giai đoạn tính năng.

---

### 1. 🆕 DANH SÁCH FILE THÊM MỚI (ADDED)

| Giai đoạn tính năng | Đường dẫn File | Mô tả chi tiết tính năng |
| :--- | :--- | :--- |
| **Khởi tạo & Landing Page** | `src/pages/Landing/LandingPage.jsx`<br>`src/pages/Landing/LandingPage.css` | Thiết kế giao diện Landing Page với hiệu ứng scroll animation và hero section. |
| | `src/components/layout/Header.jsx`<br>`src/components/layout/Footer.jsx` | Xây dựng Header động (hỗ trợ responsive menu) và Footer. |
| **Xác thực & Bảo mật (Auth)** | `src/pages/Auth/Login.jsx`<br>`src/pages/Auth/Register.jsx`<br>`src/pages/Auth/ForgotPassword.jsx` | Các trang đăng nhập, đăng ký và lấy lại mật khẩu liên kết với Supabase. |
| | `src/pages/Auth/ResetPassword.jsx` | Trang đặt lại mật khẩu mới khi khôi phục tài khoản qua email. |
| | `src/utils/AuthContext.jsx` | Context quản lý trạng thái đăng nhập, phiên người dùng (session) và hàm đăng nhập/đăng ký/đăng xuất/đổi mật khẩu. |
| | `ProtectedRoute.jsx`<br>`AdminRoute.jsx`<br>`MentorRoute.jsx` | Các Route Guard bảo vệ tuyến đường truy cập tùy theo vai trò người dùng (Ứng viên, Mentor, Nhà tuyển dụng, Admin). |
| | `check_email_exists.sql` | Hàm SQL kiểm tra trùng lặp email trước khi gửi yêu cầu đăng ký lên Supabase. |
| **Phân tích CV (CV Analysis)** | `src/pages/CV/CVManager.jsx`<br>`src/pages/CV/CVManager.css` | Giao diện quản lý CV, tải lên CV cá nhân. |
| | `src/utils/cvStorageService.js` | Tương tác với Supabase Storage bucket (`cv-files`) để upload và xóa tệp tin CV. |
| **Phân hệ Nhà tuyển dụng (Recruiter)**| `src/pages/Recruiter/RecruiterDashboard.jsx` | Bảng điều khiển dành cho nhà tuyển dụng để quản lý hồ sơ công ty, tin tuyển dụng, và bài viết. |
| | `src/pages/Recruiter/CompanyProfile.jsx` | Trang hồ sơ doanh nghiệp cho phép cập nhật thông tin, thay đổi logo và tải lên tài liệu đăng ký giấy phép kinh doanh. |
| | `src/pages/Recruiter/JobManagement.jsx`<br>`src/pages/Recruiter/PostJob.jsx` | Xem danh sách tin tuyển dụng, tạo mới hoặc chỉnh sửa tin tuyển dụng của công ty. |
| | `src/pages/Recruiter/BlogManagement.jsx`<br>`src/pages/Recruiter/PostBlog.jsx` | Viết bài viết và chia sẻ kinh nghiệm trên trang tin tức. |
| | `src/pages/Recruiter/RecruiterRegistration.jsx` | Biểu mẫu đăng ký tài khoản Nhà tuyển dụng và tải tài liệu xác minh gửi Admin duyệt. |
| **Phân hệ Mentor** | `src/pages/Mentor/MentorDashboard.jsx` | Dashboard quản lý lịch hẹn phỏng vấn thử, bài viết chia sẻ và nhận xét. |
| | `src/pages/Mentor/MentorProfile.jsx` | Hồ sơ chuyên môn của Mentor (Major, số năm kinh nghiệm, chứng chỉ đính kèm, đổi mật khẩu). |
| | `src/pages/Mentor/MentorRegistration.jsx` | Đăng ký tài khoản Mentor cùng chuyên môn và tài liệu xác minh gửi Admin. |
| | `src/pages/Mentor/MentorSchedule.jsx`<br>`src/pages/Mentor/MentorSession.jsx` | Hệ thống quản lý lịch trống và phòng phỏng vấn thử trực tuyến. |
| **Phân hệ Admin (Admin Panel)** | `src/pages/Admin/AdminPanel.jsx` | Bảng điều khiển quản trị viên với các tab xem thống kê và quản lý người dùng. |
| | `src/pages/Admin/UsersView.jsx` | Phê duyệt/Chặn/Đổi vai trò tài khoản người dùng thông thường và Mentor. |
| | `src/pages/Admin/EmployersView.jsx` | Phê duyệt/Từ chối hồ sơ đăng ký doanh nghiệp của nhà tuyển dụng dựa trên giấy phép đính kèm. |
| **Học tập & Game hóa (Challenges)**| `src/pages/Dashboard/Dashboard.jsx` | Trang tổng quan tiến độ học tập của ứng viên, hiển thị lịch sử phỏng vấn. |
| | `src/pages/Dashboard/DailyQuestions.jsx` | Giao diện câu hỏi ôn luyện hàng ngày tích hợp bộ đếm giờ và giải thích đáp án. |
| | `src/pages/Dashboard/QuestionBank.jsx` | Ngân hàng câu hỏi phân chia theo chủ đề và ngôn ngữ lập trình. |
| | `src/pages/Dashboard/QuestionBankModes/...`| Các chế độ ôn luyện: Flashcards, LearnMode, TestMode, MatchingMode kèm CSS tương ứng. |
| | `src/pages/Subscriptions/PricingPage.jsx` | Trang hiển thị các gói dịch vụ nâng cấp tài khoản (Free, Pro, Premium). |

---

### 2. ✏️ DANH SÁCH FILE CHỈNH SỬA (MODIFIED)

| Đường dẫn File | Nội dung cải tiến / chỉnh sửa chính |
| :--- | :--- |
| `src/routes/AppRoutes.jsx` | Cập nhật định tuyến qua từng giai đoạn: thêm các tuyến đường bảo vệ cho Admin, Recruiter, Mentor và ứng viên. |
| `src/components/layout/Header.jsx` | Tích hợp điều hướng linh hoạt dựa trên vai trò tài khoản (Candidate -> `/profile`, Mentor -> `/mentor/profile`, Recruiter -> `/recruiter/company`). |
| `src/pages/Auth/Profile.jsx` | Chuyển luồng xóa CV sang gọi RPC `drop_cv_record` thay cho HTTP DELETE để vượt qua tường lửa/chương trình quét virus cục bộ. |
| `src/pages/Auth/Register.jsx` | Bổ sung thanh hiển thị sức mạnh mật khẩu, chặn mật khẩu ngắn dưới 8 ký tự, và check email trùng trước khi submit. |
| `supabase_schema.sql` | Bổ sung cấu trúc dữ liệu qua các đợt phát hành: thêm bảng `companies`, bảng `mentors`, bảng `jobs`, cập nhật trigger tự động cập nhật thời gian sửa đổi. |
| `src/utils/supabaseClient.js` | Tích hợp Supabase Client SDK, bổ sung các cấu hình hỗ trợ kết nối thực tế và các bucket lưu trữ. |

---

### 3. 🗑️ DANH SÁCH FILE XÓA BỎ (DELETED)

*Không có file cốt lõi nào bị xóa bỏ vĩnh viễn trong quá trình phát triển (các file cấu hình cũ của GitHub Classroom được cập nhật tương thích).*
