export const initialQuestions = [
  { id: 1, topic: 'Frontend', difficulty: 'Easy', question: 'What is the DOM?', type: 'Technical' },
  { id: 2, topic: 'Frontend', difficulty: 'Medium', question: 'Explain the Virtual DOM in React.', type: 'Technical' },
  { id: 3, topic: 'Frontend', difficulty: 'Hard', question: 'How does React Fiber work?', type: 'Technical' },
  { id: 4, topic: 'Backend', difficulty: 'Easy', question: 'What is a REST API?', type: 'Technical' },
  { id: 5, topic: 'Backend', difficulty: 'Medium', question: 'Explain the difference between SQL and NoSQL.', type: 'Technical' },
  { id: 6, topic: 'Backend', difficulty: 'Hard', question: 'How do you handle race conditions in a distributed system?', type: 'Technical' },
  { id: 7, topic: 'Behavioral', difficulty: 'Easy', question: 'Tell me about yourself.', type: 'Soft Skills' },
  { id: 8, topic: 'Behavioral', difficulty: 'Medium', question: 'Describe a time you had a conflict with a team member.', type: 'Soft Skills' },
  { id: 9, topic: 'System Design', difficulty: 'Hard', question: 'Design a URL shortener like bit.ly.', type: 'System Design' },
  { id: 10, topic: 'DevOps', difficulty: 'Medium', question: 'What is the purpose of Docker?', type: 'Technical' }
];

// Generate the rest to make ~100 questions
const topics = ['Frontend', 'Backend', 'DevOps', 'Mobile', 'QA', 'System Design', 'Behavioral'];
const difficulties = ['Easy', 'Medium', 'Hard'];
const types = ['Technical', 'Soft Skills', 'System Design'];

for (let i = 11; i <= 100; i++) {
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
  const type = types[Math.floor(Math.random() * types.length)];

  initialQuestions.push({
    id: i,
    topic,
    difficulty,
    question: `Sample ${topic} question for ${difficulty} level (${i}).`,
    type
  });
}

export const mockUsers = [
  { id: 1, name: 'Nguyễn Văn A', email: 'a.nguyen@example.com', role: 'Candidate', status: 'Active', plan: 'Free', streak: 3, score: 120 },
  { id: 2, name: 'Trần Thị B', email: 'b.tran@example.com', role: 'Candidate', status: 'Active', plan: 'Pro', streak: 12, score: 850 },
  { id: 3, name: 'Lê Văn C', email: 'c.le@example.com', role: 'Candidate', status: 'Inactive', plan: 'Free', streak: 0, score: 45 },
  { id: 4, name: 'Phạm Thị D', email: 'd.pham@example.com', role: 'Admin', status: 'Active', plan: 'Premium', streak: 45, score: 2100 },
  { id: 5, name: 'Hoàng Văn E', email: 'e.hoang@example.com', role: 'Candidate', status: 'Active', plan: 'Pro', streak: 5, score: 430 }
];

// Generate more mock users
for (let i = 6; i <= 35; i++) {
  mockUsers.push({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    role: 'Candidate',
    status: Math.random() > 0.2 ? 'Active' : 'Inactive',
    plan: Math.random() > 0.7 ? 'Pro' : 'Free',
    streak: Math.floor(Math.random() * 20),
    score: Math.floor(Math.random() * 1000)
  });
}

export const mockStats = {
  totalInterviews: 1245,
  avgScore: 78.5,
  activeUsers: 842,
  premiumSubscribers: 156,
  interviewsPastWeek: [12, 19, 15, 25, 22, 30, 28] // Mon to Sun
};

export const dailyChallenges = [
  { id: 1, title: 'Hoàn thành 1 bài phỏng vấn Frontend', points: 50, completed: false },
  { id: 2, title: 'Đạt điểm trên 80 trong phỏng vấn', points: 100, completed: true },
  { id: 3, title: 'Đăng nhập 3 ngày liên tiếp', points: 30, completed: false }
];

export const interviewHistory = [
  { id: 1, date: '2026-05-20', role: 'Frontend Developer', score: 85, duration: '45 mins', status: 'Completed' },
  { id: 2, date: '2026-05-18', role: 'React Developer', score: 92, duration: '30 mins', status: 'Completed' },
  { id: 3, date: '2026-05-15', role: 'Fullstack Developer', score: 78, duration: '60 mins', status: 'Completed' }
];
