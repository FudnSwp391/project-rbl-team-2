# Nhật Ký Thay Đổi File - Nhánh `feature/frontend-auth-landing`
**Thành viên thực hiện:** Nguyễn Quốc Tuấn

Tài liệu này ghi nhận chi tiết danh sách các tệp tin (files) được Thêm mới (Added), Chỉnh sửa (Modified) hoặc Xóa bỏ (Deleted) trong phạm vi nhánh phát triển `feature/frontend-auth-landing`.

---

### 1. 🆕 DANH SÁCH FILE THÊM MỚI (ADDED)

| Đường dẫn File | Mô tả chi tiết chức năng |
| :--- | :--- |
| `src/pages/Auth/ResetPassword.jsx` | Trang đặt lại mật khẩu mới, chứa form nhập mật khẩu mới và xác nhận mật khẩu cho người dùng khi click vào link khôi phục từ email. |
| `check_email_exists.sql` | Script SQL khởi tạo hàm RPC `check_email_exists` trên Supabase, giúp kiểm tra email đã tồn tại trong bảng `profiles` hay chưa trước khi thực hiện đăng ký tài khoản mới. |
| `seed_interview_questions_crawled.sql` | Dữ liệu seed SQL chứa các câu hỏi phỏng vấn đã được thu thập cho ngân hàng câu hỏi. |
| `seed_interview_questions_crawled_v2.sql` | Phiên bản nâng cấp v2 của dữ liệu seed câu hỏi phỏng vấn phục vụ cho tính năng luyện tập phỏng vấn. |
| `seed_interview_questions_massive.sql` | Bộ dữ liệu seed câu hỏi phỏng vấn số lượng lớn cho ngân hàng câu hỏi tổng hợp. |
| `auth_landing_logs.md` | Tài liệu ghi nhận nhật ký thay đổi và các tập tin bị ảnh hưởng của nhánh `feature/frontend-auth-landing`. |

---

### 2. ✏️ DANH SÁCH FILE CHỈNH SỬA (MODIFIED)

| Đường dẫn File | Nội dung chỉnh sửa chi tiết |
| :--- | :--- |
| `src/pages/Auth/Login.jsx` | Sửa lại hiển thị và căn lề cho icon GitHub OAuth trong form đăng nhập, cải thiện trải nghiệm đăng nhập bằng tài khoản MXH. |
| `src/pages/Auth/Register.jsx` | Tích hợp thanh đo độ mạnh mật khẩu trực quan trên giao diện đăng ký (yếu/trung bình/mạnh), bắt buộc mật khẩu phải tối thiểu 8 ký tự, đồng thời tích hợp gọi hàm RPC check email trùng lặp trước khi gửi đăng ký lên Supabase. |
| `src/pages/Auth/Profile.jsx` | Sửa lỗi xóa CV bị trình quét virus/tường lửa cục bộ chặn nhầm (báo lỗi Failed to Fetch) bằng cách chuyển từ HTTP DELETE truyền thống sang gọi RPC `drop_cv_record` qua phương thức POST, bổ sung GET check trạng thái để xác thực. |
| `src/routes/AppRoutes.jsx` | Đăng ký route mới `/reset-password` trỏ đến component `ResetPassword` và đồng bộ phân quyền bảo vệ tuyến đường truy cập. |
| `supabase_schema.sql` | Cập nhật cấu trúc bảng, bổ sung và tối ưu hóa các hàm cơ sở dữ liệu trên Supabase phục vụ cho tính năng xác thực và lưu trữ CV. |

---

### 3. 🗑️ DANH SÁCH FILE XÓA BỎ (DELETED)

*Không có tệp tin nào bị xóa bỏ trong nhánh này.*
