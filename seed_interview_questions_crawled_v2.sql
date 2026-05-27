-- ==============================================================================
-- DỮ LIỆU BỔ SUNG: NGÂN HÀNG CÂU HỎI TỪ JOBOKO VÀ TOPDEV
-- Chuyên ngành hẹp bổ sung: IT Support, IT Bank, Hardware, IT Comtor, Java, Frontend, Database, v.v.
-- ==============================================================================

DO $$
DECLARE
    ind_support UUID;
    ind_bank UUID;
    ind_hardware UUID;
    ind_comtor UUID;
    ind_java UUID;
    ind_git UUID;
    ind_framework UUID;
    ind_database UUID;
    ind_frontend UUID;
    ind_behavioral UUID;
BEGIN
    -- 1. TẠO THÊM CÁC NGÀNH NGHỀ / LĨNH VỰC HẸP NẾU CHƯA CÓ
    INSERT INTO industries (name, description) VALUES ('IT Support', 'Câu hỏi về hỗ trợ mạng nội bộ, quản trị hệ thống, xử lý sự cố người dùng.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_support;
    IF ind_support IS NULL THEN SELECT id INTO ind_support FROM industries WHERE name = 'IT Support'; END IF;

    INSERT INTO industries (name, description) VALUES ('IT Bank (Ngân hàng)', 'Câu hỏi về Core Banking, bảo mật thông tin, an toàn dữ liệu tài chính.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_bank;
    IF ind_bank IS NULL THEN SELECT id INTO ind_bank FROM industries WHERE name = 'IT Bank (Ngân hàng)'; END IF;

    INSERT INTO industries (name, description) VALUES ('IT Hardware (Phần cứng)', 'Kiến thức về RAM, ROM, CPU, ổ cứng, lắp ráp và bảo trì máy tính.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_hardware;
    IF ind_hardware IS NULL THEN SELECT id INTO ind_hardware FROM industries WHERE name = 'IT Hardware (Phần cứng)'; END IF;

    INSERT INTO industries (name, description) VALUES ('IT Comtor', 'Câu hỏi kỹ năng giao tiếp, biên phiên dịch IT, cầu nối giữa Dev và khách hàng.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_comtor;
    IF ind_comtor IS NULL THEN SELECT id INTO ind_comtor FROM industries WHERE name = 'IT Comtor'; END IF;

    INSERT INTO industries (name, description) VALUES ('Java Developer', 'Kiến thức Java Core, OOP, Collection Framework, Exception Handling.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_java;
    IF ind_java IS NULL THEN SELECT id INTO ind_java FROM industries WHERE name = 'Java Developer'; END IF;
    
    INSERT INTO industries (name, description) VALUES ('Git & Version Control', 'Câu hỏi về quy trình làm việc trên Git, lệnh thao tác cơ bản và nâng cao.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_git;
    IF ind_git IS NULL THEN SELECT id INTO ind_git FROM industries WHERE name = 'Git & Version Control'; END IF;

    INSERT INTO industries (name, description) VALUES ('Backend Frameworks', 'Câu hỏi về MVC, Dependency Injection, Maven, JPA, Spring, bảo mật.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_framework;
    IF ind_framework IS NULL THEN SELECT id INTO ind_framework FROM industries WHERE name = 'Backend Frameworks'; END IF;

    -- Tái sử dụng Database / Data Engineer và Frontend nếu có, hoặc tạo mới
    INSERT INTO industries (name, description) VALUES ('Database / Data Engineer', 'Câu hỏi về thiết kế DB, tối ưu truy vấn, Big Data, SQL vs NoSQL.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_database;
    IF ind_database IS NULL THEN SELECT id INTO ind_database FROM industries WHERE name = 'Database / Data Engineer'; END IF;

    INSERT INTO industries (name, description) VALUES ('Front-end Developer', 'Câu hỏi phỏng vấn vị trí Front-end Developer (HTML, CSS, JS, React, v.v.).') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_frontend;
    IF ind_frontend IS NULL THEN SELECT id INTO ind_frontend FROM industries WHERE name = 'Front-end Developer'; END IF;

    SELECT id INTO ind_behavioral FROM industries WHERE name = 'General Behavioral';

    -- 2. THÊM CÂU HỎI VÀO CÁC CHUYÊN NGÀNH TƯƠNG ỨNG

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: IT SUPPORT / HELPDESK
    -- ==========================================
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_support, 'Bạn phân biệt IT Helpdesk và IT Support như thế nào?', 'easy', 'behavioral'),
    (ind_support, 'Bạn sẽ làm gì khi server nội bộ bị lỗi?', 'medium', 'technical'),
    (ind_support, 'Cách kiểm tra mạng LAN khi bị mất kết nối?', 'easy', 'technical'),
    (ind_support, 'Bạn từng sử dụng công cụ remote nào chưa?', 'easy', 'technical'),
    (ind_support, 'Làm sao để đảm bảo hệ thống luôn hoạt động ổn định?', 'medium', 'behavioral'),
    (ind_support, 'Khi user không đăng nhập được Windows, bạn kiểm tra gì trước?', 'easy', 'technical'),
    (ind_support, 'Bạn hiểu gì về Active Directory?', 'medium', 'technical'),
    (ind_support, 'Nếu nhiều user cùng báo lỗi một lúc, bạn ưu tiên xử lý ra sao?', 'medium', 'behavioral');

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: IT BANK (NGÂN HÀNG)
    -- ==========================================
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_bank, 'Bạn hiểu gì về hệ thống Core Banking?', 'hard', 'technical'),
    (ind_bank, 'Làm thế nào để đảm bảo an toàn dữ liệu người dùng trong ngân hàng?', 'hard', 'technical'),
    (ind_bank, 'Bạn xử lý thế nào khi hệ thống giao dịch bị chậm?', 'hard', 'technical'),
    (ind_bank, 'Bạn biết gì về các tiêu chuẩn bảo mật (ISO, PCI DSS)?', 'medium', 'technical'),
    (ind_bank, 'Vì sao bạn muốn làm IT trong lĩnh vực ngân hàng?', 'easy', 'behavioral');

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: IT HARDWARE (PHẦN CỨNG)
    -- ==========================================
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_hardware, 'Cách kiểm tra lỗi ổ cứng (Bad sector)?', 'medium', 'technical'),
    (ind_hardware, 'Khi máy tính không lên nguồn, bạn kiểm tra những linh kiện nào đầu tiên?', 'easy', 'technical'),
    (ind_hardware, 'Nhiệt độ CPU ảnh hưởng thế nào đến hiệu suất hệ thống?', 'medium', 'technical');

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: IT COMTOR
    -- ==========================================
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_comtor, 'Bạn có thể giải thích requirement kỹ thuật bằng tiếng Anh/Hàn/Nhật không?', 'medium', 'behavioral'),
    (ind_comtor, 'Bạn xử lý thế nào khi Dev và khách hàng hiểu sai yêu cầu của nhau?', 'hard', 'behavioral'),
    (ind_comtor, 'Bạn có kinh nghiệm dịch tài liệu IT (specifications) chưa?', 'easy', 'behavioral'),
    (ind_comtor, 'Bạn hiểu gì về quy trình phát triển phần mềm (Agile/Scrum/Waterfall)?', 'medium', 'technical');

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: JAVA DEVELOPER
    -- ==========================================
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_java, 'Thế nào là lập trình đối tượng? Cho biết các tính chất đặc thù của lập trình hướng đối tượng (OOP)?', 'easy', 'technical'),
    (ind_java, 'Sự khác nhau giữa vòng lặp While và do-While?', 'easy', 'technical'),
    (ind_java, 'Cách tổ chức hoạt động của các Collection Framework như List, Map, Set, Queue, Stack?', 'medium', 'technical'),
    (ind_java, 'Phân biệt ArrayList, LinkedList và Vector trong Java?', 'medium', 'technical'),
    (ind_java, 'Sự khác nhau giữa Set và List? Khác biệt giữa Override và Overload?', 'medium', 'technical'),
    (ind_java, 'Khái niệm về Generic trong Java? Cho ví dụ và lý do sử dụng?', 'hard', 'technical'),
    (ind_java, 'Sự khác nhau giữa Abstract class và Interface?', 'medium', 'technical'),
    (ind_java, 'Khái niệm tham trị (pass-by-value) và tham chiếu (pass-by-reference) trong Java?', 'medium', 'technical');

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: GIT & VERSION CONTROL
    -- ==========================================
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_git, 'Sự khác nhau giữa git fork, git branch và git clone?', 'medium', 'technical'),
    (ind_git, 'Sự khác nhau giữa Pull Request và Branch là gì?', 'easy', 'technical'),
    (ind_git, 'Sự khác nhau giữa HEAD, working tree và index trong Git?', 'hard', 'technical'),
    (ind_git, 'Khi nào nên sử dụng lệnh git stash?', 'medium', 'technical'),
    (ind_git, 'Làm thế nào để loại bỏ một tập tin từ Git mà không cần xóa nó khỏi File System cục bộ?', 'medium', 'technical');

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: BACKEND FRAMEWORKS
    -- ==========================================
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_framework, 'Mô hình MVC là gì? Mô tả luồng đi của một ứng dụng MVC từ Request đến Response.', 'medium', 'technical'),
    (ind_framework, 'Các khái niệm về Dependency Injection, JPA, ORM mapping, Webservice là gì?', 'hard', 'technical'),
    (ind_framework, 'Giải thích các annotation trong Spring: @Controller, @Service, @Repository, @Autowired?', 'hard', 'technical'),
    (ind_framework, 'Chức năng hoạt động của Maven là gì?', 'medium', 'technical'),
    (ind_framework, 'Sự khác nhau cơ bản của Session và Cookie trong quản lý phiên làm việc?', 'medium', 'technical'),
    (ind_framework, 'Làm thế nào để bảo mật một ứng dụng web (chống SQL Injection, XSS, CSRF...)?', 'hard', 'technical');

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: DATABASE / DATA ENGINEER
    -- ==========================================
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_database, 'Khái niệm Database? Các quan hệ trong database? Các loại Join trong SQL?', 'easy', 'technical'),
    (ind_database, 'Các khái niệm về Composite key, Transaction, và ràng buộc Unique?', 'medium', 'technical'),
    (ind_database, 'Giải thích các Rule chuẩn hóa dữ liệu (Database Normalization)?', 'hard', 'technical'),
    (ind_database, 'Sự khác biệt giữa HAVING và WHERE trong truy vấn SQL?', 'medium', 'technical');

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: FRONT-END DEVELOPER
    -- ==========================================
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_frontend, 'Phân biệt các thuộc tính Position trong CSS: Absolute, Relative, Fixed, Static, Sticky?', 'medium', 'technical'),
    (ind_frontend, 'Khai báo <!DOCTYPE html> trong HTML có tác dụng gì?', 'easy', 'technical'),
    (ind_frontend, 'Phân biệt Class và ID như thế nào trong CSS?', 'easy', 'technical'),
    (ind_frontend, 'Phân biệt toán tử “==” và “===” trong Javascript?', 'easy', 'technical'),
    (ind_frontend, 'Từ khóa “this” trong Javascript dùng để làm gì và nó hoạt động như thế nào?', 'hard', 'technical');

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: GENERAL BEHAVIORAL
    -- ==========================================
    IF ind_behavioral IS NOT NULL THEN
        INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
        (ind_behavioral, 'Bạn đã từng làm dự án nào nổi bật? Bạn làm vai trò gì và vượt qua khó khăn như thế nào?', 'medium', 'behavioral'),
        (ind_behavioral, 'Trong quá trình làm việc, bạn đã từng thất bại bao giờ chưa và bạn rút ra bài học gì?', 'hard', 'behavioral'),
        (ind_behavioral, 'Bạn sẽ xử lý ra sao nếu Code của bạn bị từ chối (Reject) trong quá trình Code Review?', 'medium', 'behavioral'),
        (ind_behavioral, 'Nếu không biết câu trả lời cho một vấn đề kỹ thuật, bạn sẽ xử lý thế nào?', 'medium', 'behavioral'),
        (ind_behavioral, 'Bạn giao tiếp và giải thích vấn đề kỹ thuật với người Non-tech (không chuyên IT) như thế nào?', 'hard', 'behavioral');
    END IF;

END $$;
