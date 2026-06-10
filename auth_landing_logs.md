# Nhật Ký Thay Đổi Dự Án (CHANGELOG) - Nhánh `feature/frontend-auth-landing`
**Thành viên:** Nguyễn Quốc Tuấn

Dưới đây là nhật ký thay đổi dự án (Changelog) chi tiết cho nhánh `feature/frontend-auth-landing`, ghi nhận các tính năng thêm mới (Added), cải tiến (Changed) và sửa lỗi (Fixed).

---

### 📝 NHẬT KÝ THAY ĐỔI DỰ ÁN (CHANGELOG)

**Added — Thêm mới**
| Ngày | TV | Mô tả thay đổi | File liên quan | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| 20/05/2026 | C - Nguyễn Quốc Tuấn | Viết 15 UI/UX Test Cases cho Landing Page (bao gồm test Responsive, Dark Mode, Animations). | `src/pages/Landing/LandingPage.jsx` | Test giao diện chính |
| 21/05/2026 | C - Nguyễn Quốc Tuấn | Viết 20 Test Cases (Positive/Negative) cho module Authentication (Login, Register, Validation). | `src/pages/Auth/Login.jsx`, `Register.jsx` | Kiểm thử Supabase Auth |
| 26/05/2026 | C - Nguyễn Quốc Tuấn | Bổ sung 8 Integration Test Cases luồng Đăng nhập bằng bên thứ ba (GitHub OAuth). | `src/utils/AuthContext.jsx` | Kiểm thử tích hợp |
| 01/06/2026 | C - Nguyễn Quốc Tuấn | Thêm trang Đặt lại mật khẩu (`ResetPassword.jsx`), route `/reset-password` và RPC check trùng email. | `src/pages/Auth/ResetPassword.jsx`, `check_email_exists.sql` | Cải tiến bảo mật và UX |
| 10/06/2026 | C - Nguyễn Quốc Tuấn | Thêm trang Hồ sơ Mentor (`MentorProfile.jsx`) để quản lý chuyên môn, số năm kinh nghiệm, chứng chỉ/CV và đổi mật khẩu. | `src/pages/Mentor/MentorProfile.jsx` | Tách biệt hồ sơ Mentor |
| 10/06/2026 | C - Nguyễn Quốc Tuấn | Tái cấu trúc và hoàn thiện trang Hồ sơ Doanh nghiệp (`CompanyProfile.jsx`) hỗ trợ chỉnh sửa thông tin, đổi logo, upload giấy phép kinh doanh, và quản lý bảo mật. | `src/pages/Recruiter/CompanyProfile.jsx` | Tách biệt hồ sơ Nhà tuyển dụng |

**Changed — Cải tiến / Cập nhật**
| Ngày | TV | Mô tả thay đổi | File liên quan | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| 21/05/2026 | C - Nguyễn Quốc Tuấn | Cập nhật bộ Test Data, áp dụng kỹ thuật Phân hoạch tương đương (Equivalence Partitioning) cho trường Password. | `src/pages/Auth/Register.jsx` | Nâng cao độ phủ test |
| 01/06/2026 | C - Nguyễn Quốc Tuấn | Tích hợp thanh đo độ mạnh mật khẩu và bắt buộc mật khẩu tối thiểu 8 ký tự khi đăng ký. | `src/pages/Auth/Register.jsx` | Tăng cường độ an toàn |
| 02/06/2026 | C - Nguyễn Quốc Tuấn | Chuyển đổi cơ chế xóa CV từ API DELETE mặc định sang gọi RPC `drop_cv_record` để tránh bị Antivirus chặn nhầm. | `src/pages/Auth/Profile.jsx` | Sửa lỗi tương thích mạng |
| 10/06/2026 | C - Nguyễn Quốc Tuấn | Cập nhật Header và MentorDashboard để tự động định tuyến Mentor đến trang `/mentor/profile` thay vì `/profile` của ứng viên. | `src/components/layout/Header.jsx` | Đồng bộ UX |
| 10/06/2026 | C - Nguyễn Quốc Tuấn | Cập nhật Header để tự động điều hướng Nhà tuyển dụng đến `/recruiter/company` thay vì `/profile` và bổ sung nút điều hướng Recruiter Portal. | `src/components/layout/Header.jsx` | Tối ưu hóa điều hướng Recruiter |

**Fixed — Sửa lỗi (Cập nhật Test Case)**
| Ngày | TV | Mô tả thay đổi | File liên quan | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| 27/05/2026 | C - Nguyễn Quốc Tuấn | Sửa/Bổ sung kịch bản kiểm thử bảo mật RLS để cover lỗi Xóa CV bị Firewall chặn (Bypass qua RPC). | `src/utils/cvStorageService.js` | Bổ sung test bảo mật |
| 02/06/2026 | C - Nguyễn Quốc Tuấn | Khắc phục hoàn toàn lỗi xoá CV bị báo lỗi mạng ảo `Failed to Fetch` bằng cách thêm kiểm tra GET kiểm chứng trạng thái bản ghi. | `src/pages/Auth/Profile.jsx` | Fix lỗi trải nghiệm người dùng |
