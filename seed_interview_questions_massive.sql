-- ==============================================================================
-- DỮ LIỆU BỔ SUNG: NGÂN HÀNG CÂU HỎI QUY MÔ LỚN (PHẦN 1)
-- Phân loại: BA, PM, UI/UX, Mobile, QA, DevOps, Data, Security, AI, SysAdmin
-- ==============================================================================

DO $$
DECLARE
    ind_ba UUID;
    ind_pm UUID;
    ind_uiux UUID;
    ind_mobile UUID;
    ind_qa UUID;
    ind_devops UUID;
    ind_data UUID;
    ind_security UUID;
    ind_sysadmin UUID;
    ind_ai UUID;
    ind_behavioral UUID;
BEGIN
    -- 1. TẠO THÊM CÁC NGÀNH NGHỀ / LĨNH VỰC HẸP
    INSERT INTO industries (name, description) VALUES ('Business Analyst (BA)', 'Phân tích nghiệp vụ, làm việc với khách hàng, viết tài liệu BRD, SRS, BPMN.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_ba;
    IF ind_ba IS NULL THEN SELECT id INTO ind_ba FROM industries WHERE name = 'Business Analyst (BA)'; END IF;

    INSERT INTO industries (name, description) VALUES ('Project Manager / Scrum Master', 'Quản lý dự án, Scrum, Agile, quản lý rủi ro, phân bổ nguồn lực.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_pm;
    IF ind_pm IS NULL THEN SELECT id INTO ind_pm FROM industries WHERE name = 'Project Manager / Scrum Master'; END IF;

    INSERT INTO industries (name, description) VALUES ('UI/UX Designer', 'Thiết kế trải nghiệm người dùng, Figma, Wireframe, Prototype, User Research.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_uiux;
    IF ind_uiux IS NULL THEN SELECT id INTO ind_uiux FROM industries WHERE name = 'UI/UX Designer'; END IF;

    INSERT INTO industries (name, description) VALUES ('Mobile Developer', 'Phát triển ứng dụng di động iOS/Android, React Native, Flutter, Swift, Kotlin.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_mobile;
    IF ind_mobile IS NULL THEN SELECT id INTO ind_mobile FROM industries WHERE name = 'Mobile Developer'; END IF;

    INSERT INTO industries (name, description) VALUES ('QA / Tester', 'Kiểm thử phần mềm, Automation Test, Manual Test, viết Test Case, Selenium, Appium.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_qa;
    IF ind_qa IS NULL THEN SELECT id INTO ind_qa FROM industries WHERE name = 'QA / Tester'; END IF;

    INSERT INTO industries (name, description) VALUES ('DevOps & Cloud Engineer', 'AWS, Azure, GCP, Docker, Kubernetes, CI/CD, Terraform.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_devops;
    IF ind_devops IS NULL THEN SELECT id INTO ind_devops FROM industries WHERE name = 'DevOps & Cloud Engineer'; END IF;

    INSERT INTO industries (name, description) VALUES ('Data Scientist / Data Engineer', 'ETL, Python, R, Hadoop, Spark, Data Warehouse, Machine Learning basic.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_data;
    IF ind_data IS NULL THEN SELECT id INTO ind_data FROM industries WHERE name = 'Data Scientist / Data Engineer'; END IF;

    INSERT INTO industries (name, description) VALUES ('Cyber Security', 'Bảo mật thông tin, Pen Test, CEH, mã độc, Network Security, mã hóa.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_security;
    IF ind_security IS NULL THEN SELECT id INTO ind_security FROM industries WHERE name = 'Cyber Security'; END IF;

    INSERT INTO industries (name, description) VALUES ('System Administrator', 'Quản trị hệ thống Linux/Windows, bash script, web server (Nginx/Apache), monitor.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_sysadmin;
    IF ind_sysadmin IS NULL THEN SELECT id INTO ind_sysadmin FROM industries WHERE name = 'System Administrator'; END IF;

    INSERT INTO industries (name, description) VALUES ('AI / Machine Learning Engineer', 'Deep Learning, NLP, Computer Vision, TensorFlow, PyTorch, LLM.') ON CONFLICT (name) DO NOTHING RETURNING id INTO ind_ai;
    IF ind_ai IS NULL THEN SELECT id INTO ind_ai FROM industries WHERE name = 'AI / Machine Learning Engineer'; END IF;

    SELECT id INTO ind_behavioral FROM industries WHERE name = 'General Behavioral';

    -- 2. INSERT CÂU HỎI (HƠN 150 CÂU)

    -- === BUSINESS ANALYST (BA) ===
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_ba, 'BRD, FRS và SRS khác nhau như thế nào? Khi nào thì cần viết từng loại?', 'medium', 'technical'),
    (ind_ba, 'Bạn làm thế nào để xử lý khi khách hàng đưa ra yêu cầu (requirement) mâu thuẫn nhau?', 'hard', 'behavioral'),
    (ind_ba, 'UML là gì? Các loại sơ đồ UML (Use Case, Activity, Sequence) thường dùng trong trường hợp nào?', 'medium', 'technical'),
    (ind_ba, 'Làm thế nào để bạn đảm bảo Developer hiểu đúng 100% requirement mà bạn đã viết?', 'medium', 'behavioral'),
    (ind_ba, 'Nếu khách hàng liên tục thay đổi requirement trong giai đoạn Development (Scope Creep), bạn sẽ xử lý sao?', 'hard', 'behavioral'),
    (ind_ba, 'Phân biệt Functional Requirement và Non-Functional Requirement. Cho ví dụ.', 'easy', 'technical'),
    (ind_ba, 'INVEST trong Agile/Scrum là gì? Tại sao User Story cần thỏa mãn tiêu chí INVEST?', 'medium', 'technical'),
    (ind_ba, 'Bạn thường dùng kỹ thuật nào để khơi gợi yêu cầu (Elicitation Techniques) từ khách hàng?', 'medium', 'technical'),
    (ind_ba, 'Khi hệ thống đã lên Production nhưng khách hàng báo lỗi mà lỗi đó do requirement viết thiếu, bạn sẽ làm gì?', 'hard', 'behavioral'),
    (ind_ba, 'BPMN là gì? Tại sao BA cần biết vẽ BPMN?', 'easy', 'technical'),
    (ind_ba, 'Mockup, Wireframe và Prototype khác nhau ra sao?', 'easy', 'technical'),
    (ind_ba, 'Bạn đánh giá độ ưu tiên của các Requirement/User Story dựa trên tiêu chí nào?', 'medium', 'technical'),
    (ind_ba, 'Sự khác nhau giữa Agile BA và Traditional BA (Waterfall) là gì?', 'medium', 'technical'),
    (ind_ba, 'Làm thế nào để thuyết phục khách hàng loại bỏ một tính năng không cần thiết nhưng họ lại rất khăng khăng muốn có?', 'hard', 'behavioral'),
    (ind_ba, 'Giải thích khái niệm MVP (Minimum Viable Product).', 'easy', 'technical');

    -- === PROJECT MANAGER (PM) / SCRUM MASTER ===
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_pm, 'Sự khác biệt chính giữa mô hình Agile và Waterfall là gì? Khi nào nên chọn mô hình nào?', 'medium', 'technical'),
    (ind_pm, 'Burndown chart là gì? Nếu Burndown chart đi ngang (không đi xuống) thì team đang gặp vấn đề gì?', 'medium', 'technical'),
    (ind_pm, 'Nếu team không hoàn thành Sprint Goal trong nhiều Sprint liên tiếp, với vai trò Scrum Master bạn sẽ làm gì?', 'hard', 'behavioral'),
    (ind_pm, 'Làm thế nào để xử lý một thành viên trong team thường xuyên trễ deadline hoặc làm ảnh hưởng tinh thần team?', 'hard', 'behavioral'),
    (ind_pm, 'Phân biệt vai trò của Product Owner và Scrum Master.', 'easy', 'technical'),
    (ind_pm, 'Quy trình quản lý rủi ro (Risk Management) trong dự án phần mềm gồm những bước nào?', 'medium', 'technical'),
    (ind_pm, 'Bạn làm thế nào để ước lượng thời gian và nguồn lực cho một dự án mới hoàn toàn (Estimation)?', 'hard', 'technical'),
    (ind_pm, 'Story Point là gì? Sự khác biệt giữa Story Point và Man-hours?', 'medium', 'technical'),
    (ind_pm, 'Làm sao để giải quyết mâu thuẫn giữa Developer và QA/Tester trong dự án?', 'medium', 'behavioral'),
    (ind_pm, 'Daily Scrum (Stand-up) nên diễn ra trong bao lâu? Mục đích chính của nó là gì?', 'easy', 'technical'),
    (ind_pm, 'Làm thế nào để bạn báo cáo tin xấu (dự án trễ tiến độ) cho Ban Giám Đốc hoặc Khách hàng?', 'hard', 'behavioral'),
    (ind_pm, 'Sự khác biệt giữa Kanban và Scrum là gì?', 'medium', 'technical'),
    (ind_pm, 'Bạn sử dụng chỉ số nào để đo lường hiệu suất của một team phần mềm?', 'medium', 'technical'),
    (ind_pm, 'Bạn làm gì khi Khách hàng bypass bạn và giao task trực tiếp cho Developer?', 'hard', 'behavioral'),
    (ind_pm, 'Definition of Done (DoD) là gì? Ai là người định nghĩa nó?', 'easy', 'technical');

    -- === UI/UX DESIGNER ===
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_uiux, 'Sự khác biệt giữa UI (User Interface) và UX (User Experience) là gì?', 'easy', 'technical'),
    (ind_uiux, 'Thiết kế lấy người dùng làm trung tâm (User-Centered Design) gồm những bước nào?', 'medium', 'technical'),
    (ind_uiux, 'Heuristic Evaluation là gì? Kể tên một vài nguyên tắc Heuristic của Jakob Nielsen.', 'hard', 'technical'),
    (ind_uiux, 'Bạn làm thế nào để thuyết phục Developer code theo đúng thiết kế của bạn khi họ bảo "cái này code khó lắm"?', 'medium', 'behavioral'),
    (ind_uiux, 'A/B Testing là gì và bạn đã từng áp dụng nó để đưa ra quyết định thiết kế chưa?', 'medium', 'technical'),
    (ind_uiux, 'Màu sắc (Color Theory) và Typography ảnh hưởng thế nào đến trải nghiệm người dùng?', 'medium', 'technical'),
    (ind_uiux, 'Làm thế nào để bạn đo lường sự thành công của một bản thiết kế UX?', 'hard', 'technical'),
    (ind_uiux, 'Design System là gì? Lợi ích của việc xây dựng Design System cho một công ty?', 'medium', 'technical'),
    (ind_uiux, 'Giải thích quy trình thực hiện User Research (Nghiên cứu người dùng).', 'hard', 'technical'),
    (ind_uiux, 'Mobile-first design là gì? Tại sao xu hướng hiện nay lại ưa chuộng Mobile-first?', 'easy', 'technical');

    -- === MOBILE DEVELOPER ===
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_mobile, 'Phân biệt Native App, Hybrid App và Cross-Platform App.', 'easy', 'technical'),
    (ind_mobile, 'Vòng đời (Lifecycle) của một Activity/Fragment (Android) hoặc ViewController (iOS) là gì?', 'medium', 'technical'),
    (ind_mobile, 'Memory Leak trong lập trình Mobile là gì? Làm thế nào để phát hiện và tránh?', 'hard', 'technical'),
    (ind_mobile, 'Bạn quản lý State trong React Native / Flutter như thế nào (Redux, Provider, BLoC...)?', 'medium', 'technical'),
    (ind_mobile, 'Làm thế nào để tối ưu hóa hiệu năng (Performance) cho một ứng dụng Mobile hiển thị danh sách hàng ngàn item?', 'hard', 'technical'),
    (ind_mobile, 'Coroutines (Kotlin) hoặc Grand Central Dispatch (iOS) được sử dụng để làm gì?', 'medium', 'technical'),
    (ind_mobile, 'Làm sao để ứng dụng Mobile vẫn hoạt động tốt khi không có kết nối mạng (Offline mode)?', 'medium', 'technical'),
    (ind_mobile, 'App Signing (Keystore/Certificate) là gì? Quy trình đẩy App lên Store diễn ra như thế nào?', 'medium', 'technical'),
    (ind_mobile, 'Phân biệt Push Notification và Local Notification.', 'easy', 'technical'),
    (ind_mobile, 'Giải thích kiến trúc MVVM trong lập trình Mobile. Sự khác biệt so với MVC?', 'hard', 'technical'),
    (ind_mobile, 'Bạn làm thế nào để xử lý vấn đề tương thích trên nhiều kích thước màn hình thiết bị khác nhau?', 'medium', 'technical'),
    (ind_mobile, 'Làm sao để bảo mật dữ liệu nhạy cảm (Token, Password) lưu trữ trên thiết bị Mobile?', 'hard', 'technical'),
    (ind_mobile, 'Bạn đã bao giờ tích hợp SDK của bên thứ 3 (ví dụ Payment Gateway) chưa? Khó khăn thường gặp là gì?', 'medium', 'technical'),
    (ind_mobile, 'Hot Reload và Live Reload khác nhau như thế nào trong Flutter/React Native?', 'easy', 'technical'),
    (ind_mobile, 'Bạn debug lỗi Crash ứng dụng trên thiết bị của user trên Production như thế nào?', 'hard', 'behavioral');

    -- === QA / TESTER ===
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_qa, 'Black Box Testing và White Box Testing khác nhau ở điểm nào?', 'easy', 'technical'),
    (ind_qa, 'Smoke Testing và Sanity Testing khác nhau ra sao?', 'medium', 'technical'),
    (ind_qa, 'Một Bug Report tốt cần phải có những thông tin gì?', 'easy', 'technical'),
    (ind_qa, 'Nếu Developer từ chối fix bug bạn báo cáo vì cho rằng "đó là tính năng (feature)", bạn sẽ làm gì?', 'hard', 'behavioral'),
    (ind_qa, 'Regression Testing là gì? Khi nào cần thực hiện?', 'medium', 'technical'),
    (ind_qa, 'Bạn thiết kế Test Case như thế nào để đảm bảo bao phủ (Coverage) tốt nhất?', 'medium', 'technical'),
    (ind_qa, 'Equivalence Partitioning (Phân vùng tương đương) và Boundary Value Analysis (Phân tích giá trị biên) là gì?', 'medium', 'technical'),
    (ind_qa, 'Khi nào nên áp dụng Automation Test thay vì Manual Test?', 'medium', 'technical'),
    (ind_qa, 'Page Object Model (POM) trong Automation Test (Selenium) là gì?', 'hard', 'technical'),
    (ind_qa, 'Bạn làm thế nào để kiểm thử một ứng dụng Web trên nhiều trình duyệt khác nhau (Cross-browser testing)?', 'medium', 'technical'),
    (ind_qa, 'Performance Testing (Load Test, Stress Test) là gì? Công cụ nào thường được sử dụng?', 'hard', 'technical'),
    (ind_qa, 'Nếu dự án ngày mai release nhưng hôm nay bạn phát hiện ra một Bug Critical, bạn sẽ làm gì?', 'hard', 'behavioral'),
    (ind_qa, 'Test Plan khác với Test Strategy như thế nào?', 'medium', 'technical'),
    (ind_qa, 'Làm thế nào để kiểm thử API? Các HTTP status code phổ biến cần kiểm tra là gì?', 'medium', 'technical'),
    (ind_qa, 'Exploratory Testing (Kiểm thử khám phá) là gì?', 'easy', 'technical');

    -- === DEVOPS & CLOUD ENGINEER ===
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_devops, 'CI/CD là gì? Kể tên các công cụ bạn thường dùng để xây dựng CI/CD pipeline.', 'easy', 'technical'),
    (ind_devops, 'Docker khác với Virtual Machine (VM) như thế nào?', 'medium', 'technical'),
    (ind_devops, 'Kiến trúc Microservices là gì? Ưu và nhược điểm so với Monolithic?', 'hard', 'technical'),
    (ind_devops, 'Kubernetes (K8s) là gì? Các thành phần cơ bản của một Kubernetes Cluster?', 'hard', 'technical'),
    (ind_devops, 'Infrastructure as Code (IaC) là gì? Bạn đã từng dùng Terraform hay Ansible chưa?', 'medium', 'technical'),
    (ind_devops, 'Blue/Green Deployment và Canary Deployment khác nhau ra sao?', 'hard', 'technical'),
    (ind_devops, 'Làm sao để giám sát (Monitoring) và thu thập Log tập trung cho một hệ thống lớn?', 'medium', 'technical'),
    (ind_devops, 'Nếu CPU của Database Server đột ngột tăng lên 100%, các bước troubleshooting của bạn là gì?', 'hard', 'technical'),
    (ind_devops, 'Load Balancer hoạt động ở tầng nào trong mô hình OSI? Phân biệt Layer 4 và Layer 7 Load Balancing.', 'hard', 'technical'),
    (ind_devops, 'VPC (Virtual Private Cloud) là gì? Subnet Public và Subnet Private khác nhau thế nào?', 'medium', 'technical'),
    (ind_devops, 'Làm thế nào để bảo mật một Docker Container?', 'hard', 'technical'),
    (ind_devops, 'GitOps là gì?', 'medium', 'technical'),
    (ind_devops, 'Bạn quản lý Secrets (Password, API Keys) trong hệ thống như thế nào?', 'medium', 'technical'),
    (ind_devops, 'Giải thích khái niệm Serverless. Ưu và nhược điểm?', 'easy', 'technical'),
    (ind_devops, 'SRE (Site Reliability Engineering) khác DevOps như thế nào?', 'hard', 'technical');

    -- === DATA SCIENTIST / DATA ENGINEER ===
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_data, 'Quy trình ETL (Extract, Transform, Load) là gì?', 'easy', 'technical'),
    (ind_data, 'Data Warehouse, Data Lake và Data Mart khác nhau như thế nào?', 'medium', 'technical'),
    (ind_data, 'Giải thích hiện tượng Overfitting trong Machine Learning và cách khắc phục.', 'hard', 'technical'),
    (ind_data, 'Sự khác biệt giữa Supervised Learning (Học có giám sát) và Unsupervised Learning (Học không giám sát)?', 'easy', 'technical'),
    (ind_data, 'Apache Spark khác với Hadoop MapReduce như thế nào?', 'medium', 'technical'),
    (ind_data, 'Các chỉ số đánh giá model: Accuracy, Precision, Recall, F1-Score là gì?', 'hard', 'technical'),
    (ind_data, 'Làm thế nào để xử lý dữ liệu bị thiếu (Missing Values) trong dataset?', 'medium', 'technical'),
    (ind_data, 'Phân tích chuỗi thời gian (Time Series Analysis) là gì?', 'medium', 'technical'),
    (ind_data, 'Sự khác biệt giữa Batch Processing và Stream Processing?', 'medium', 'technical'),
    (ind_data, 'Nếu Model của bạn hoạt động rất tốt trên tập Test nhưng lại dự đoán rất tệ trên dữ liệu thực tế (Production), nguyên nhân do đâu?', 'hard', 'technical'),
    (ind_data, 'Gradient Descent là gì? Phân biệt Stochastic Gradient Descent và Batch Gradient Descent.', 'hard', 'technical'),
    (ind_data, 'Làm thế nào để tối ưu hóa truy vấn SQL khi làm việc với hàng tỷ records?', 'hard', 'technical'),
    (ind_data, 'Data Pipeline là gì? Các công cụ Orchestration (như Airflow) có vai trò gì?', 'medium', 'technical'),
    (ind_data, 'Làm thế nào để mã hóa các biến phân loại (Categorical variables)?', 'easy', 'technical'),
    (ind_data, 'P-value là gì trong kiểm định giả thuyết thống kê?', 'medium', 'technical');

    -- === CYBER SECURITY ===
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_security, 'Phân biệt Symmetric Encryption (Mã hóa đối xứng) và Asymmetric Encryption (Mã hóa bất đối xứng).', 'medium', 'technical'),
    (ind_security, 'SQL Injection là gì? Làm thế nào để phòng chống hiệu quả?', 'easy', 'technical'),
    (ind_security, 'XSS (Cross-Site Scripting) và CSRF (Cross-Site Request Forgery) khác nhau như thế nào?', 'hard', 'technical'),
    (ind_security, 'Mô hình CIA Triad (Confidentiality, Integrity, Availability) trong bảo mật là gì?', 'easy', 'technical'),
    (ind_security, 'Phishing là gì? Làm sao để giáo dục nhân viên trong công ty tránh bị Phishing?', 'medium', 'behavioral'),
    (ind_security, 'Bạn sẽ làm gì trong 24 giờ đầu tiên nếu phát hiện hệ thống của công ty bị Ransomware tấn công?', 'hard', 'behavioral'),
    (ind_security, 'VPN hoạt động như thế nào?', 'medium', 'technical'),
    (ind_security, 'Phân biệt IDS (Intrusion Detection System) và IPS (Intrusion Prevention System).', 'medium', 'technical'),
    (ind_security, 'Botnet và DDoS là gì? Các phương pháp giảm thiểu tấn công DDoS?', 'hard', 'technical'),
    (ind_security, 'Zero-day vulnerability (Lỗ hổng zero-day) là gì?', 'easy', 'technical'),
    (ind_security, 'OAuth2 và JWT hoạt động như thế nào trong xác thực người dùng?', 'hard', 'technical'),
    (ind_security, 'Penetration Testing (Pen Test) gồm những giai đoạn nào?', 'medium', 'technical'),
    (ind_security, 'Làm thế nào để bảo mật một API Public?', 'medium', 'technical'),
    (ind_security, 'Hashing khác với Encryption như thế nào? (Ví dụ: MD5/SHA256 vs AES)', 'easy', 'technical'),
    (ind_security, 'Social Engineering là gì? Tại sao nó lại là mắt xích yếu nhất trong bảo mật?', 'medium', 'technical');

    -- === SYSTEM ADMINISTRATOR ===
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_sysadmin, 'Phân biệt quá trình Boot của hệ điều hành Linux và Windows.', 'medium', 'technical'),
    (ind_sysadmin, 'Lệnh `chmod` và `chown` trong Linux dùng để làm gì? Ý nghĩa của quyền `755` và `644`?', 'easy', 'technical'),
    (ind_sysadmin, 'Làm thế nào để tìm tất cả các file có dung lượng lớn hơn 1GB trong Linux?', 'medium', 'technical'),
    (ind_sysadmin, 'Làm sao để biết port nào đang bị chiếm dụng trên server?', 'easy', 'technical'),
    (ind_sysadmin, 'Swap space là gì? Khi nào hệ thống sẽ sử dụng Swap?', 'medium', 'technical'),
    (ind_sysadmin, 'Lệnh `top` và `htop` hiển thị thông tin gì? Làm sao để kill một process bị treo?', 'easy', 'technical'),
    (ind_sysadmin, 'Sự khác nhau giữa Hard Link và Soft Link (Symlink) trong Linux?', 'hard', 'technical'),
    (ind_sysadmin, 'Bạn sẽ làm gì nếu Server báo lỗi "No space left on device" nhưng khi dùng `df -h` vẫn thấy còn trống?', 'hard', 'technical'),
    (ind_sysadmin, 'RAID là gì? Sự khác biệt giữa RAID 0, RAID 1 và RAID 5?', 'medium', 'technical'),
    (ind_sysadmin, 'Cách backup và restore cấu hình của một Linux server một cách tự động?', 'medium', 'technical');

    -- === AI / MACHINE LEARNING ENGINEER ===
    INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
    (ind_ai, 'Mạng nơ-ron tích chập (CNN - Convolutional Neural Network) thường được dùng cho bài toán gì?', 'easy', 'technical'),
    (ind_ai, 'Mạng nơ-ron hồi quy (RNN) có nhược điểm gì? LSTM và GRU giải quyết nhược điểm đó ra sao?', 'hard', 'technical'),
    (ind_ai, 'Transformer Architecture hoạt động như thế nào? Cơ chế Self-Attention là gì?', 'hard', 'technical'),
    (ind_ai, 'LLM (Large Language Models) là gì? RAG (Retrieval-Augmented Generation) hoạt động như thế nào?', 'medium', 'technical'),
    (ind_ai, 'Transfer Learning là gì? Tại sao nó lại quan trọng trong Computer Vision và NLP?', 'medium', 'technical'),
    (ind_ai, 'Phân biệt Word2Vec, GloVe và BERT trong xử lý ngôn ngữ tự nhiên.', 'hard', 'technical'),
    (ind_ai, 'Làm thế nào để Deploy một mô hình Machine Learning lên Production để phục vụ hàng ngàn request/s?', 'hard', 'technical'),
    (ind_ai, 'Vanishing Gradient (Tiêu biến đạo hàm) là gì? Giải pháp khắc phục?', 'hard', 'technical'),
    (ind_ai, 'Sự khác nhau giữa Generative AI (AI tạo sinh) và Discriminative AI?', 'medium', 'technical'),
    (ind_ai, 'Data Augmentation là gì? Cho ví dụ trong bài toán xử lý ảnh.', 'easy', 'technical');

    -- === BEHAVIORAL BỔ SUNG ===
    IF ind_behavioral IS NOT NULL THEN
        INSERT INTO questions (industry_id, content, difficulty, question_type) VALUES 
        (ind_behavioral, 'Kể về một lần bạn phát hiện ra quy trình làm việc của công ty không hiệu quả và cách bạn đề xuất thay đổi.', 'hard', 'behavioral'),
        (ind_behavioral, 'Làm thế nào để bạn giữ động lực khi phải làm một dự án bảo trì mã nguồn cũ (Legacy Code) rất tồi tàn?', 'medium', 'behavioral'),
        (ind_behavioral, 'Nếu bạn được giao một công nghệ hoàn toàn mới mà bạn chưa từng biết, bạn sẽ lên kế hoạch học tập như thế nào?', 'medium', 'behavioral'),
        (ind_behavioral, 'Kể về một tình huống bạn phải đưa ra quyết định kỹ thuật quan trọng nhưng sếp của bạn lại không đồng ý.', 'hard', 'behavioral'),
        (ind_behavioral, 'Môi trường làm việc lý tưởng đối với bạn là như thế nào?', 'easy', 'behavioral');
    END IF;

END $$;
