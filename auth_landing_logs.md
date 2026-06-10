# Nhật Ký Thực Hiện - Nhánh `feature/frontend-auth-landing` (Vai trò: QA/Tester)
**Thành viên:** Nguyễn Quốc Tuấn

Dưới đây là các bảng nhật ký được tổng hợp chi tiết theo góc nhìn của một chuyên gia Kiểm thử phần mềm (Tester), tập trung vào việc viết Test Case, Test Scenario, phân tích lỗi và kiểm thử các tính năng Auth, Landing Page, cùng các chức năng được phát triển bổ sung.

---

### 📋 BẢNG 1: Nhật ký sử dụng AI (AI_AUDIT_LOG)

| Ngày | TV | Công cụ AI | Mục đích sử dụng | File ảnh hưởng | Mức hỗ trợ | Đã chỉnh sửa gì? | Kiểm chứng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 20/05/2026 | C - Nguyễn Quốc Tuấn | Gemini | Sinh dữ liệu kiểm thử (Test Data) và Test Cases cho UI Landing Page | `src/pages/Landing/LandingPage.jsx`, `LandingPage.css` | High | Lọc bỏ các test case UI dư thừa, điều chỉnh lại Expected Result cho phần chuyển đổi Dark Mode và Scroll Animation. | Thực thi test thủ công trên Chrome/Edge/Safari, giao diện không bị vỡ layout. |
| 21/05/2026 | C - Nguyễn Quốc Tuấn | Gemini | Phân tích Requirement để viết kịch bản kiểm thử luồng Đăng nhập/Đăng ký | `src/pages/Auth/Login.jsx`, `Register.jsx` | High | Bổ sung thêm các Negative Test Cases (mật khẩu yếu, email sai định dạng, email đã tồn tại). | Toàn bộ các test case ngoại lệ đều fail hoặc pass đúng như logic mong đợi của Supabase. |
| 26/05/2026 | C - Nguyễn Quốc Tuấn | Gemini | Thiết kế kịch bản kiểm thử tích hợp (Integration Test) cho GitHub OAuth | `src/utils/AuthContext.jsx`, `Login.jsx` | Medium | Chỉnh sửa lại luồng kiểm thử điều hướng (redirect) sau khi user từ chối cấp quyền trên GitHub. | Thực thi test flow OAuth, hệ thống bắt được lỗi và hiển thị toast khi user cancel. |
| 27/05/2026 | C - Nguyễn Quốc Tuấn | Gemini | Viết kịch bản Security Testing (Kiểm thử bảo mật RLS) cho hàm xóa CV qua RPC | `src/utils/cvStorageService.js`, `supabase_schema.sql` | High | Chuẩn hóa các bước test phân quyền: user A không được phép gọi RPC xóa CV của user B (tấn công IDOR). | Test trên Postman và UI. Hàm RPC ném ra lỗi 403 Forbidden nếu sai quyền, đúng như thiết kế. |
| 01/06/2026 | C - Nguyễn Quốc Tuấn | Gemini | Thiết kế kịch bản kiểm thử (Test Cases) cho chức năng kiểm tra trùng email và thanh đo độ mạnh mật khẩu | `src/pages/Auth/Register.jsx`, `check_email_exists.sql` | High | Bổ sung test cases về độ dài ký tự tối thiểu (8 ký tự) và các tổ hợp ký tự đặc biệt/chữ hoa chữ thường cho Password Strength. | Thực thi kiểm thử biểu mẫu đăng ký. Thanh đo hiển thị chính xác các cấp độ và báo lỗi trùng email trước khi nhấn Đăng ký. |
| 02/06/2026 | C - Nguyễn Quốc Tuấn | Gemini | Khắc phục lỗi Firewall chặn DELETE request khi xóa CV và kiểm thử tích hợp | `src/pages/Auth/Profile.jsx`, `src/utils/supabaseClient.js` | High | Tạo kịch bản kiểm thử tích hợp để kiểm chứng việc xóa bản ghi CV qua RPC `drop_cv_record` (sử dụng POST method để bypass antivirus false alarm). | Kiểm tra mạng (Network tab) và database. Bản ghi CV được xóa thành công mà không bị tường lửa cục bộ chặn. |
| 10/06/2026 | C - Nguyễn Quốc Tuấn | Gemini | Thiết kế test cases phân quyền (Route Guard) cho hồ sơ cá nhân của Mentor | `src/pages/Mentor/MentorProfile.jsx`, `src/MentorRoute.jsx` | High | Chuẩn hóa luồng điều hướng: Ứng viên không được truy cập `/mentor/profile`, Mentor được điều hướng tự động từ Header. | Kiểm thử phân quyền role-based. Tài khoản Candidate bị chặn và điều hướng về trang chủ khi cố tình truy cập. |
| 10/06/2026 | C - Nguyễn Quốc Tuấn | Gemini | Thiết kế kịch bản test tích hợp cho form cập nhật hồ sơ tuyển dụng và phân quyền nhà tuyển dụng | `src/pages/Recruiter/CompanyProfile.jsx`, `Header.jsx` | High | Bổ sung kiểm thử tự động lưu thông tin doanh nghiệp, xác thực mã số thuế, và tích hợp các sự kiện thay đổi logo và giấy phép đính kèm. | Kiểm thử tích hợp. Thông tin được đồng bộ và cập nhật chính xác lên database Supabase `companies`. |

---

### 📝 BẢNG 2: Nhật ký thay đổi dự án (CHANGELOG)

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

---

### 💡 BẢNG 3: Nhật ký Prompt AI (PROMPTS)

| Prompt # | Nội dung |
| :--- | :--- |
| **Prompt #1** | **TV:** C - Nguyễn Quốc Tuấn<br>**Công cụ AI:** Gemini<br>**Prompt đã dùng:** "Đảm nhiệm vai trò một QA Engineer cấp cao. Hãy phân tích yêu cầu thiết kế và sinh ra 15 test case chi tiết cho màn hình Landing Page của dự án. Trọng tâm kiểm thử bao gồm: tính năng chuyển đổi Dark Mode, các hiệu ứng Scroll Animations, và UI Responsive. Viết dưới dạng bảng gồm: ID, Mô tả, Các bước thực hiện, Dữ liệu đầu vào, Kết quả mong đợi." |
| | **Kết quả AI trả về:** Cung cấp bảng test case chuẩn xác, phủ đủ các thiết bị (Mobile/Tablet/PC) và mô tả rõ các expected behaviors của animation khi scroll. |
| | **Nhóm chỉnh sửa:** Điều chỉnh lại một số độ phân giải màn hình trong phần "Dữ liệu đầu vào" để khớp với breakpoint CSS của team. |
| | **Kiểm chứng:** Thực thi 15/15 test case. Phát hiện 1 bug UI trên màn hình iPad và đã báo cáo dev sửa. |
| **Prompt #2** | **TV:** C - Nguyễn Quốc Tuấn<br>**Công cụ AI:** Gemini<br>**Prompt đã dùng:** "Đảm nhiệm vai trò chuyên gia kiểm thử phần mềm. Hãy viết kịch bản kiểm thử (Test Scenario) chi tiết cho chức năng Authentication (Đăng nhập/Đăng ký) tích hợp Supabase. Yêu cầu chia rõ 2 nhóm: Positive Test Cases (Luồng chuẩn) và Negative Test Cases (Ngoại lệ như mật khẩu yếu, sai email, email đã tồn tại). Viết dưới dạng bảng chuẩn Tester." |
| | **Kết quả AI trả về:** Đưa ra các ca kiểm thử rất kỹ, bao gồm cả kỹ thuật phân tích giá trị biên (Boundary Value) cho độ dài mật khẩu và định dạng email. |
| | **Nhóm chỉnh sửa:** Lược bỏ các test case yêu cầu xác thực số điện thoại (do dự án chỉ dùng Email), cập nhật lại thông báo lỗi (Error message) cho khớp với thiết kế UI. |
| | **Kiểm chứng:** Test bao phủ được các trường hợp dev code thiếu validation form, giúp dev chặn bug sớm. |
| **Prompt #3** | **TV:** C - Nguyễn Quốc Tuấn<br>**Công cụ AI:** Gemini<br>**Prompt đã dùng:** "QA Automation Tester. Hãy viết các bước kiểm thử tích hợp (Integration Test) cho luồng đăng nhập bằng bên thứ ba (GitHub OAuth). Cần bao quát các trường hợp: 1) Cấp quyền thành công, 2) User từ chối cấp quyền trên trang GitHub, 3) Kiểm tra session token trả về. Cấu trúc output dưới dạng bảng gồm ID, Test Steps, Expected Result." |
| | **Kết quả AI trả về:** AI chỉ ra được edge case quan trọng: xử lý callback URL khi user hủy (cancel) thao tác ủy quyền trên OAuth screen. |
| | **Nhóm chỉnh sửa:** Bổ sung thêm test step kiểm tra redirect về trang `/dashboard` thay vì trang chủ mặc định. |
| | **Kiểm chứng:** Flow test tích hợp chặt chẽ, phát hiện lỗi redirect sai URL và đã fix. |
| **Prompt #4** | **TV:** C - Nguyễn Quốc Tuấn<br>**Công cụ AI:** Gemini<br>**Prompt đã dùng:** "Đảm nhiệm vai trò Security Tester. Dev vừa chuyển luồng Xóa CV từ HTTP DELETE sang dùng hàm RPC `drop_cv_record` trên Supabase để tránh bị Firewall chặn. Hãy sinh ra 5 test case tập trung vào Kiểm thử bảo mật phân quyền (Row Level Security - RLS) để đảm bảo không xảy ra lỗ hổng IDOR (User A xóa trộm CV của User B). Trình bày dạng bảng kiểm thử." |
| | **Kết quả AI trả về:** Xây dựng các kịch bản tận dụng Postman gọi API với các token khác nhau (token hợp lệ, token hết hạn, token của user khác, không có token) để kiểm thử bảo mật. |
| | **Nhóm chỉnh sửa:** Thêm kịch bản test việc trả về HTTP Status Code (403 Forbidden thay vì 500) khi vi phạm RLS. |
| | **Kiểm chứng:** Test thành công, xác nhận API RPC đã được phân quyền chặt chẽ trên Supabase. |
| **Prompt #5** | **TV:** C - Nguyễn Quốc Tuấn<br>**Công cụ AI:** Gemini<br>**Prompt đã dùng:** "Hãy viết test case và mô phỏng lỗi cho chức năng thanh đo độ mạnh mật khẩu và kiểm tra trùng lặp email. Làm sao để kiểm nghiệm tính năng bắt lỗi trùng email trước khi gửi request đăng ký tài khoản mới lên Supabase Auth?" |
| | **Kết quả AI trả về:** Kịch bản kiểm thử chi tiết bao gồm việc tạo database function RPC để truy vấn bảng profiles tìm email trước khi gọi Supabase signUp. |
| | **Nhóm chỉnh sửa:** Thêm kiểm tra validation mật khẩu trực tiếp trên UI để cập nhật trạng thái yếu/trung bình/mạnh mà không cần gọi API. |
| | **Kiểm chứng:** Biểu mẫu đăng ký được cải thiện rõ rệt về hiệu năng và bảo mật, tránh các cuộc tấn công spam tài khoản. |
| **Prompt #6** | **TV:** C - Nguyễn Quốc Tuấn<br>**Công cụ AI:** Gemini<br>**Prompt đã dùng:** "Tôi đang viết một trang profile riêng biệt dành cho Mentor (`MentorProfile.jsx`). Làm sao để phân tích cột `expertise` chứa chuỗi dạng 'Frontend Development (3 năm kinh nghiệm)' thành 2 trường riêng biệt trên React state (Chuyên môn và Số năm kinh nghiệm) để người dùng chọn lại trên dropdown? Đồng thời sinh ra test cases cho kiểm thử phân quyền Route Guard của trang này." |
| | **Kết quả AI trả về:** Cung cấp hàm regex tách chuỗi thông minh và đưa ra các test scenarios kiểm thử bảo mật Route Guard sử dụng `MentorRoute`. |
| | **Nhóm chỉnh sửa:** Chỉnh sửa biểu thức Regex để xử lý tốt các trường hợp chuỗi không đúng định dạng chuẩn. |
| | **Kiểm chứng:** Chức năng hoạt động chính xác. Mentor có thể cập nhật thông tin và chứng chỉ mượt mà; user thường cố truy cập bị chặn hoàn toàn. |
| **Prompt #7** | **TV:** C - Nguyễn Quốc Tuấn<br>**Công cụ AI:** Gemini<br>**Prompt đã dùng:** "Hãy xây dựng một trang hồ sơ công ty hoàn chỉnh (`CompanyProfile.jsx`) liên kết trực tiếp với Supabase table `companies` sử dụng khóa ngoại `recruiter_id`. Hãy phân chia giao diện thành 3 tab rõ rệt gồm: 1) Thông tin chung (Tên, mã số thuế, email, website, địa chỉ, mô tả, nút đổi logo tải trực tiếp lên bucket), 2) Giấy phép & hồ sơ (tải tài liệu chứng minh, hiển thị trạng thái phê duyệt), và 3) Đổi mật khẩu tài khoản." |
| | **Kết quả AI trả về:** Cung cấp mã nguồn tối ưu cho luồng xử lý và upload ảnh logo/tài liệu lên Supabase Storage, đồng thời thiết kế layout Sidebar chia tab chuyên nghiệp. |
| | **Nhóm chỉnh sửa:** Thêm kiểm tra trạng thái phê duyệt (approved/pending/rejected) để quyết định hiển thị nút xem trang công ty công khai. |
| | **Kiểm chứng:** Trang cập nhật thông tin thành công, hoạt động mượt mà và đồng bộ dữ liệu chuẩn xác lên DB. |
