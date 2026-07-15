// ============================================
// INTERVIEW CONSTANTS — Mock Data & Configuration
// ============================================

import {
  Monitor, Server, Layers, Database, Cloud,
  Bug, BarChart3, Palette, Code, Globe,
  Cpu, Shield
} from 'lucide-react';

// ── Industry / Category List ──
export const INDUSTRIES = [
  {
    id: 'frontend',
    name: 'Frontend Development',
    nameVi: 'Lập trình Frontend',
    description: 'React, Vue, Angular, HTML/CSS, JavaScript',
    icon: 'Monitor',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  {
    id: 'backend',
    name: 'Backend Development',
    nameVi: 'Lập trình Backend',
    description: 'Node.js, Java, Python, APIs, Microservices',
    icon: 'Server',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
  {
    id: 'fullstack',
    name: 'Full Stack',
    nameVi: 'Full Stack',
    description: 'Frontend + Backend, DevOps, System Design',
    icon: 'Layers',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
  },
  {
    id: 'database',
    name: 'Database',
    nameVi: 'Cơ sở dữ liệu',
    description: 'SQL, NoSQL, PostgreSQL, MongoDB, Redis',
    icon: 'Database',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  {
    id: 'devops',
    name: 'DevOps',
    nameVi: 'DevOps',
    description: 'CI/CD, Docker, Kubernetes, AWS, Azure',
    icon: 'Cloud',
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.1)',
  },
  {
    id: 'testing',
    name: 'Software Testing',
    nameVi: 'Kiểm thử phần mềm',
    description: 'Unit Test, Integration, QA, Automation',
    icon: 'Bug',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    nameVi: 'Phân tích dữ liệu',
    description: 'Python, SQL, Tableau, Power BI, Statistics',
    icon: 'BarChart3',
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
  },
  {
    id: 'uiux',
    name: 'UI/UX Design',
    nameVi: 'Thiết kế UI/UX',
    description: 'Figma, User Research, Prototyping, Design System',
    icon: 'Palette',
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.1)',
  },
];

// ── Icon mapping (for dynamic rendering) ──
export const ICON_MAP = {
  Monitor, Server, Layers, Database, Cloud,
  Bug, BarChart3, Palette, Code, Globe, Cpu, Shield
};

// ── Difficulty Levels ──
export const DIFFICULTIES = [
  {
    id: 'easy',
    name: 'Dễ',
    nameEn: 'Easy',
    description: 'Câu hỏi cơ bản, phù hợp người mới',
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  {
    id: 'medium',
    name: 'Trung bình',
    nameEn: 'Medium',
    description: 'Câu hỏi nâng cao, cần kinh nghiệm',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  {
    id: 'hard',
    name: 'Khó',
    nameEn: 'Hard',
    description: 'Câu hỏi chuyên sâu, thách thức cao',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
];

// ── Question Types ──
export const QUESTION_TYPES = [
  {
    id: 'technical',
    name: 'Câu hỏi kỹ thuật',
    nameEn: 'Technical',
    description: 'Kiến thức chuyên môn, coding, system design',
    icon: 'Code',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  {
    id: 'behavioral',
    name: 'Câu hỏi hành vi',
    nameEn: 'Behavioral',
    description: 'Kỹ năng mềm, teamwork, leadership, xử lý tình huống',
    icon: 'Globe',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
  {
    id: 'mixed',
    name: 'Câu hỏi tổng hợp',
    nameEn: 'Mixed',
    description: 'Kết hợp kỹ thuật và hành vi, phỏng vấn toàn diện',
    icon: 'Cpu',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
  },
];

// ── Interview Language Options ──
export const LANGUAGES = [
  {
    id: 'vi',
    name: 'Tiếng Việt',
    nameEn: 'Vietnamese',
    flag: '🇻🇳',
    description: 'Câu hỏi và phản hồi bằng tiếng Việt',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
  {
    id: 'en',
    name: 'English',
    nameEn: 'English',
    flag: '🇺🇸',
    description: 'Questions & feedback in English',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
];

// ── Duration Options ──
export const DURATIONS = [
  { id: 10, label: '10 phút', estimatedQuestions: 5 },
  { id: 20, label: '20 phút', estimatedQuestions: 10 },
  { id: 30, label: '30 phút', estimatedQuestions: 15 },
];

// ── Mock Questions ──
export const MOCK_QUESTIONS = [
  {
    id: 1,
    content: 'Hãy giải thích sự khác biệt giữa React hooks useState và useReducer. Khi nào nên sử dụng useReducer thay vì useState?',
    type: 'technical',
    difficulty: 'medium',
  },
  {
    id: 2,
    content: 'Kể về một tình huống khi bạn phải giải quyết xung đột trong nhóm. Bạn đã xử lý như thế nào và kết quả ra sao?',
    type: 'behavioral',
    difficulty: 'medium',
  },
  {
    id: 3,
    content: 'Virtual DOM là gì? Giải thích cách React sử dụng Virtual DOM để tối ưu hiệu suất rendering.',
    type: 'technical',
    difficulty: 'easy',
  },
  {
    id: 4,
    content: 'Bạn sẽ thiết kế kiến trúc cho một ứng dụng e-commerce có 1 triệu người dùng đồng thời như thế nào?',
    type: 'technical',
    difficulty: 'hard',
  },
  {
    id: 5,
    content: 'Hãy mô tả quy trình làm việc của bạn khi nhận được một task mới. Bạn ưu tiên công việc như thế nào?',
    type: 'behavioral',
    difficulty: 'easy',
  },
  {
    id: 6,
    content: 'REST API và GraphQL khác nhau như thế nào? Ưu điểm và nhược điểm của mỗi cái?',
    type: 'technical',
    difficulty: 'medium',
  },
  {
    id: 7,
    content: 'Giải thích khái niệm closure trong JavaScript và cho ví dụ thực tế.',
    type: 'technical',
    difficulty: 'medium',
  },
  {
    id: 8,
    content: 'Bạn đã bao giờ phải đưa ra một quyết định khó khăn trong dự án chưa? Hãy kể chi tiết.',
    type: 'behavioral',
    difficulty: 'medium',
  },
  {
    id: 9,
    content: 'CSS Flexbox và CSS Grid khác nhau như thế nào? Khi nào dùng Flexbox, khi nào dùng Grid?',
    type: 'technical',
    difficulty: 'easy',
  },
  {
    id: 10,
    content: 'Bạn làm gì khi gặp một bug khó reproduce trong production? Mô tả quy trình debug của bạn.',
    type: 'technical',
    difficulty: 'hard',
  },
];

// ── Mock Interview Result ──
export const MOCK_RESULT = {
  id: 'mock-result-001',
  overallScore: 78,
  grade: 'B+',
  industry: 'Frontend Development',
  difficulty: 'Trung bình',
  questionType: 'Câu hỏi tổng hợp',
  duration: '20 phút',
  totalQuestions: 10,
  answeredQuestions: 10,
  completedAt: '2026-05-26T12:30:00Z',

  aiFeedback: 'Bạn thể hiện kiến thức kỹ thuật Frontend tốt, đặc biệt trong lĩnh vực React và CSS. Khả năng giải thích concepts rõ ràng và có ví dụ minh họa. Tuy nhiên, cần cải thiện kỹ năng trình bày — nên cấu trúc câu trả lời theo STAR method. Phần system design cần thêm chiều sâu khi thảo luận về scalability.',

  skills: {
    pronunciation: 72,
    vocabulary: 85,
    communication: 74,
    confidence: 80,
    technicalAccuracy: 82,
  },

  strengths: [
    'Kiến thức React hooks & lifecycle rất vững',
    'Giải thích concepts CSS layout rõ ràng với ví dụ',
    'Thái độ tự tin, giao tiếp tự nhiên',
    'Có kinh nghiệm thực tế với REST API',
  ],

  weaknesses: [
    'Câu trả lời đôi khi lan man, thiếu cấu trúc STAR',
    'Phần System Design chưa đủ chiều sâu',
    'Cần sử dụng thuật ngữ chuyên ngành chính xác hơn',
    'Thời gian trả lời một số câu hỏi quá dài',
  ],

  improvements: [
    { priority: 'high', text: 'Luyện tập cấu trúc câu trả lời theo phương pháp STAR' },
    { priority: 'high', text: 'Học thêm về System Design patterns (CAP theorem, load balancing)' },
    { priority: 'medium', text: 'Cải thiện phát âm thuật ngữ tiếng Anh chuyên ngành' },
    { priority: 'medium', text: 'Luyện tập kiểm soát thời gian trả lời (2-3 phút/câu)' },
    { priority: 'low', text: 'Tìm hiểu thêm về CI/CD pipeline và deployment strategies' },
  ],

  careerAdvice: 'Với nền tảng Frontend vững chắc hiện tại, bạn nên hướng đến vị trí Mid-level Frontend Developer. Đầu tư thêm vào TypeScript, Next.js và testing (Jest, Cypress) sẽ tăng giá trị cạnh tranh đáng kể. Mục tiêu 6 tháng: hoàn thiện 2-3 dự án open-source và đạt chứng chỉ AWS Cloud Practitioner.',

  questionReviews: [
    {
      id: 1,
      question: 'Hãy giải thích sự khác biệt giữa useState và useReducer.',
      userAnswer: 'useState dùng cho state đơn giản, useReducer cho state phức tạp với nhiều sub-values hoặc khi next state phụ thuộc vào previous state. useReducer giống Redux pattern...',
      aiEvaluation: 'Câu trả lời chính xác và có chiều sâu. Tốt khi so sánh với Redux. Có thể thêm ví dụ code cụ thể.',
      score: 85,
    },
    {
      id: 2,
      question: 'Kể về xung đột trong nhóm và cách giải quyết.',
      userAnswer: 'Tôi từng gặp xung đột khi 2 dev có ý kiến khác nhau về architecture. Tôi đã tổ chức cuộc họp để cả hai trình bày ưu nhược điểm...',
      aiEvaluation: 'Câu trả lời tốt nhưng thiếu phần Result cụ thể trong STAR method. Nên bổ sung kết quả đo lường được.',
      score: 72,
    },
    {
      id: 3,
      question: 'Virtual DOM là gì?',
      userAnswer: 'Virtual DOM là bản sao lightweight của DOM thật. React tạo Virtual DOM tree, so sánh (diffing) với tree cũ, rồi chỉ update phần thay đổi (reconciliation).',
      aiEvaluation: 'Xuất sắc! Giải thích rõ ràng, đúng concept. Có đề cập đến diffing và reconciliation.',
      score: 92,
    },
    {
      id: 4,
      question: 'Thiết kế kiến trúc e-commerce 1 triệu users?',
      userAnswer: 'Tôi sẽ dùng microservices, load balancer, CDN cho static assets, cache layer với Redis, database sharding...',
      aiEvaluation: 'Đề cập đúng các thành phần nhưng thiếu chi tiết. Cần giải thích rõ hơn về trade-offs và tại sao chọn từng giải pháp.',
      score: 65,
    },
    {
      id: 5,
      question: 'Quy trình làm việc khi nhận task mới?',
      userAnswer: 'Đầu tiên tôi đọc kỹ requirements, clarify với PM nếu chưa rõ, break down thành sub-tasks, estimate time, rồi bắt đầu code...',
      aiEvaluation: 'Câu trả lời có cấu trúc tốt, thể hiện mindset professional. Có thể thêm phần review và testing.',
      score: 80,
    },
  ],

  resources: [
    { title: 'System Design Interview Guide', type: 'Bài viết', url: '#' },
    { title: 'STAR Method cho phỏng vấn', type: 'Video', url: '#' },
    { title: 'React Advanced Patterns', type: 'Khóa học', url: '#' },
    { title: 'TypeScript Handbook', type: 'Documentation', url: '#' },
  ],
};

// ── Mock Interview History ──
export const MOCK_HISTORY = [
  {
    id: '1',
    date: '2026-05-26T12:30:00Z',
    industry: 'Frontend Development',
    industryId: 'frontend',
    difficulty: 'medium',
    difficultyVi: 'Trung bình',
    score: 78,
    duration: 20,
    status: 'completed',
    questionType: 'mixed',
  },
  {
    id: '2',
    date: '2026-05-25T10:15:00Z',
    industry: 'Backend Development',
    industryId: 'backend',
    difficulty: 'hard',
    difficultyVi: 'Khó',
    score: 65,
    duration: 30,
    status: 'completed',
    questionType: 'technical',
  },
  {
    id: '3',
    date: '2026-05-24T14:00:00Z',
    industry: 'Frontend Development',
    industryId: 'frontend',
    difficulty: 'easy',
    difficultyVi: 'Dễ',
    score: 92,
    duration: 10,
    status: 'completed',
    questionType: 'behavioral',
  },
  {
    id: '4',
    date: '2026-05-23T09:30:00Z',
    industry: 'Full Stack',
    industryId: 'fullstack',
    difficulty: 'medium',
    difficultyVi: 'Trung bình',
    score: 71,
    duration: 20,
    status: 'completed',
    questionType: 'mixed',
  },
  {
    id: '5',
    date: '2026-05-22T16:45:00Z',
    industry: 'Database',
    industryId: 'database',
    difficulty: 'easy',
    difficultyVi: 'Dễ',
    score: 88,
    duration: 10,
    status: 'completed',
    questionType: 'technical',
  },
  {
    id: '6',
    date: '2026-05-21T11:00:00Z',
    industry: 'DevOps',
    industryId: 'devops',
    difficulty: 'hard',
    difficultyVi: 'Khó',
    score: 55,
    duration: 30,
    status: 'completed',
    questionType: 'technical',
  },
  {
    id: '7',
    date: '2026-05-20T08:20:00Z',
    industry: 'Frontend Development',
    industryId: 'frontend',
    difficulty: 'medium',
    difficultyVi: 'Trung bình',
    score: 74,
    duration: 20,
    status: 'cancelled',
    questionType: 'mixed',
  },
  {
    id: '8',
    date: '2026-05-19T13:10:00Z',
    industry: 'UI/UX Design',
    industryId: 'uiux',
    difficulty: 'easy',
    difficultyVi: 'Dễ',
    score: 85,
    duration: 10,
    status: 'completed',
    questionType: 'behavioral',
  },
];

// ── Helper Functions ──
export const getScoreColor = (score) => {
  if (score >= 90) return '#22C55E';
  if (score >= 75) return '#3B82F6';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
};

export const getScoreGrade = (score) => {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'B-';
  if (score >= 70) return 'C+';
  if (score >= 65) return 'C';
  if (score >= 60) return 'C-';
  if (score >= 50) return 'D';
  return 'F';
};

export const getScoreLabel = (score) => {
  if (score >= 90) return 'Xuất sắc';
  if (score >= 75) return 'Tốt';
  if (score >= 60) return 'Khá';
  if (score >= 40) return 'Trung bình';
  return 'Cần cải thiện';
};

export const getDifficultyColor = (difficulty) => {
  const map = { easy: '#22C55E', medium: '#F59E0B', hard: '#EF4444' };
  return map[difficulty] || '#94A3B8';
};

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// ── Popular Tech Skills (For Autocomplete) ──
export const POPULAR_SKILLS = [
  'ReactJS', 'VueJS', 'Angular', 'NextJS', 'NuxtJS', 'Svelte',
  'HTML5', 'CSS3', 'TailwindCSS', 'Sass', 'Bootstrap',
  'JavaScript', 'TypeScript',
  'NodeJS', 'ExpressJS', 'NestJS', 'Python', 'Django', 'Flask',
  'Java', 'Spring Boot', 'C#', '.NET', 'PHP', 'Laravel',
  'Ruby on Rails', 'Go', 'Rust', 'C++',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQL Server',
  'Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'Azure',
  'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins', 'Terraform',
  'Figma', 'UI/UX Design', 'Photoshop',
  'Data Analysis', 'Machine Learning', 'TensorFlow', 'PyTorch'
];
