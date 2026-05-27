-- ==============================================================================
-- DỮ LIỆU BỔ SUNG: NGÂN HÀNG CÂU HỎI TỪ MANPOWER, CAREERLINK, LANGMASTER, KFC
-- Chuyên ngành hẹp: IT Helpdesk, DevOps, Database, Networking, Algorithms
-- ==============================================================================

DO $$
DECLARE
    ind_helpdesk UUID;
    ind_devops UUID;
    ind_database UUID;
    ind_networking UUID;
    ind_algorithms UUID;
    ind_behavioral UUID;
BEGIN
    -- 1. TẠO THÊM CÁC NGÀNH NGHỀ / LĨNH VỰC HẸP
    INSERT INTO industries (name, description) 
    VALUES ('IT Helpdesk / Support', 'Câu hỏi về phần cứng, xử lý sự cố mạng cơ bản, kỹ năng hỗ trợ người dùng.') 
    ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_helpdesk;
    
    IF ind_helpdesk IS NULL THEN
        SELECT id INTO ind_helpdesk FROM industries WHERE name = 'IT Helpdesk / Support';
    END IF;

    INSERT INTO industries (name, description) 
    VALUES ('DevOps & System Admin', 'Câu hỏi về CI/CD, Git, quản trị máy chủ, Linux, Docker.') 
    ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_devops;
    
    IF ind_devops IS NULL THEN
        SELECT id INTO ind_devops FROM industries WHERE name = 'DevOps & System Admin';
    END IF;

    INSERT INTO industries (name, description) 
    VALUES ('Database / Data Engineer', 'Câu hỏi về thiết kế DB, tối ưu truy vấn, Big Data, SQL vs NoSQL.') 
    ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_database;
    
    IF ind_database IS NULL THEN
        SELECT id INTO ind_database FROM industries WHERE name = 'Database / Data Engineer';
    END IF;

    INSERT INTO industries (name, description) 
    VALUES ('Networking', 'Câu hỏi về mô hình OSI, giao thức mạng, DNS, IP, Subnet.') 
    ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_networking;
    
    IF ind_networking IS NULL THEN
        SELECT id INTO ind_networking FROM industries WHERE name = 'Networking';
    END IF;

    INSERT INTO industries (name, description) 
    VALUES ('Software Engineering & Algorithms', 'Câu hỏi về OOP, cấu trúc dữ liệu, Big O Notation, Design Patterns.') 
    ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_algorithms;
    
    IF ind_algorithms IS NULL THEN
        SELECT id INTO ind_algorithms FROM industries WHERE name = 'Software Engineering & Algorithms';
    END IF;

    -- Lấy ID của General Behavioral nếu đã tồn tại
    SELECT id INTO ind_behavioral FROM industries WHERE name = 'General Behavioral';

    -- 2. THÊM CÂU HỎI VÀO CÁC CHUYÊN NGÀNH TƯƠNG ỨNG

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: IT HELPDESK / SUPPORT
    -- ==========================================
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_helpdesk, 'Blue Screen of Death (BSOD) là gì và quy trình xử lý của bạn như thế nào?', 'medium', 'technical'),
    (ind_helpdesk, 'Phân biệt định dạng ổ cứng FAT32 với NTFS. Khi nào nên dùng loại nào?', 'easy', 'technical'),
    (ind_helpdesk, 'Một người dùng gọi đến nói "Internet của tôi không hoạt động", bạn sẽ hỏi và kiểm tra những bước nào?', 'medium', 'behavioral'),
    (ind_helpdesk, 'Bạn sẽ xử lý thế nào nếu khách hàng gọi phàn nàn vì hệ thống quá chậm?', 'medium', 'behavioral'),
    (ind_helpdesk, 'Nếu máy tính không nhận chuột hoặc bàn phím, bạn sẽ kiểm tra những phần nào đầu tiên?', 'easy', 'technical'),
    (ind_helpdesk, 'So sánh sự khác biệt giữa RAM và ROM trong máy tính.', 'easy', 'technical'),
    (ind_helpdesk, 'Bạn hiểu gì về BIOS và UEFI? UEFI có ưu điểm gì so với BIOS?', 'medium', 'technical');

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: DEVOPS & SYSTEM ADMIN
    -- ==========================================
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_devops, 'Bạn đã từng sử dụng hệ thống CI/CD chưa? Hãy mô tả một pipeline triển khai tự động.', 'medium', 'technical'),
    (ind_devops, 'Trình bày quy trình làm việc theo mô hình Gitflow. Ưu điểm của mô hình này là gì?', 'medium', 'technical'),
    (ind_devops, 'Khi nào nên dùng git rebase thay vì git merge? Ưu và nhược điểm của từng lệnh?', 'hard', 'technical'),
    (ind_devops, 'Làm thế nào để revert một commit đã bị đẩy (push) nhầm lên remote repository?', 'medium', 'technical'),
    (ind_devops, 'Phân biệt git clone, git fork và git branch. Mỗi thao tác phù hợp với tình huống nào?', 'easy', 'technical'),
    (ind_devops, 'Mô hình Forking Workflow trong Git có ưu điểm gì?', 'medium', 'technical');

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: DATABASE / DATA ENGINEER
    -- ==========================================
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_database, 'Bạn có kinh nghiệm tối ưu hóa truy vấn cơ sở dữ liệu không? Hãy chia sẻ một tình huống cụ thể.', 'hard', 'technical'),
    (ind_database, 'Khi xử lý dữ liệu lớn (Big Data), bạn thường áp dụng kỹ thuật nào để giảm tải bộ nhớ hoặc tăng tốc độ xử lý?', 'hard', 'technical'),
    (ind_database, 'Giải thích nguyên lý ACID trong Database Transaction. Tại sao nó lại quan trọng?', 'medium', 'technical'),
    (ind_database, 'Phân biệt các loại JOIN trong SQL: INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL JOIN.', 'easy', 'technical'),
    (ind_database, 'So sánh sự khác nhau về cơ chế và tốc độ giữa lệnh DELETE, TRUNCATE và DROP.', 'medium', 'technical'),
    (ind_database, 'Khi nào thì nên sử dụng Index trong cơ sở dữ liệu? Những rủi ro khi lạm dụng Index là gì?', 'medium', 'technical'),
    (ind_database, 'Chuẩn hóa dữ liệu (Database Normalization) là gì? Có các dạng chuẩn hóa nào phổ biến?', 'hard', 'technical');

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: NETWORKING
    -- ==========================================
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_networking, 'Giải thích DNS (Domain Name System) là gì và quy trình phân giải tên miền hoạt động ra sao?', 'medium', 'technical'),
    (ind_networking, 'Địa chỉ IP và mạng con (subnet) là gì? Làm sao để xác định hai thiết bị có cùng subnet?', 'medium', 'technical'),
    (ind_networking, 'Trình bày sự khác biệt giữa giao thức TCP và UDP. Khi nào nên sử dụng UDP?', 'medium', 'technical'),
    (ind_networking, 'Làm thế nào để một doanh nghiệp có thể bảo mật thông tin nội bộ trên hệ thống mạng của họ?', 'hard', 'technical');

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: SOFTWARE ENGINEERING & ALGORITHMS
    -- ==========================================
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_algorithms, 'OOP là gì? Nêu 4 nguyên lý cơ bản của Lập trình hướng đối tượng và cho ví dụ.', 'easy', 'technical'),
    (ind_algorithms, 'So sánh sự khác biệt cơ bản giữa Mảng (Array) và Danh sách liên kết (Linked List).', 'medium', 'technical'),
    (ind_algorithms, 'Bạn hiểu gì về độ phức tạp thuật toán (Big O Notation)? Cho ví dụ về thuật toán có độ phức tạp O(n^2).', 'hard', 'technical'),
    (ind_algorithms, 'Khi nào nên sử dụng Đệ quy (Recursion) thay vì Vòng lặp (Loop)? Nêu ưu và nhược điểm của đệ quy.', 'medium', 'technical'),
    (ind_algorithms, 'Ngoại lệ (Exception) là gì? Phân biệt giữa Checked Exception và Unchecked Exception.', 'medium', 'technical'),
    (ind_algorithms, 'Bạn đã từng xử lý lỗi rò rỉ bộ nhớ (Memory Leak) chưa? Nguyên nhân phổ biến và cách khắc phục?', 'hard', 'technical'),
    (ind_algorithms, 'Thiết kế RESTful API: Phân biệt các method GET, POST, PUT, PATCH và DELETE.', 'easy', 'technical');

    -- ==========================================
    -- NGÂN HÀNG CÂU HỎI: BEHAVIORAL BỔ SUNG
    -- ==========================================
    IF ind_behavioral IS NOT NULL THEN
        INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
        (ind_behavioral, 'Khi khách hàng yêu cầu làm đi làm lại sản phẩm nhiều lần nhưng vẫn không đồng ý, bạn sẽ xử lý thế nào?', 'hard', 'behavioral'),
        (ind_behavioral, 'Nếu là một Team Leader, khi trong team xảy ra bất đồng quan điểm kỹ thuật, bạn sẽ phân xử ra sao?', 'hard', 'behavioral'),
        (ind_behavioral, 'Bạn được giao một task khẩn cấp trong khi đang có nhiều việc khác. Bạn ưu tiên và quản lý thời gian thế nào?', 'medium', 'behavioral'),
        (ind_behavioral, 'Bạn chọn release dự án đúng hạn nhưng còn vài bug nhỏ, hay delay dự án để sửa hoàn chỉnh? Tại sao?', 'hard', 'behavioral');
    END IF;

END $$;
