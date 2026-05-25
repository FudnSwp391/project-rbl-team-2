import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Edit2, Trash2, Plus, X } from 'lucide-react';

const QuestionBankView = () => {
  const [questions, setQuestions] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQ, setCurrentQ] = useState(null);

  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(questions.length / itemsPerPage) || 1;

  const paginatedQuestions = questions.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => {
    fetchQuestions();
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    const { data } = await supabase.from('industries').select('*');
    if (data) setIndustries(data);
  };

  const fetchQuestions = async () => {
    setLoading(true);
    // Sử dụng bảng 'questions' và join bảng 'industries' để lấy tên ngành
    const { data, error } = await supabase
      .from('questions')
      .select('*, industries(name)');
      
    if (error) {
      alert('Lỗi khi tải câu hỏi: ' + error.message);
      console.error('Error fetching questions:', error);
    } else {
      // Sắp xếp tạm ở client vì bảng questions không có created_at
      const sortedData = (data || []).sort((a, b) => (a.id > b.id ? -1 : 1));
      setQuestions(sortedData);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) {
        alert('Lỗi khi xóa: ' + error.message);
      } else {
        setQuestions(questions.filter(q => q.id !== id));
        if (paginatedQuestions.length === 1 && page > 1) {
          setPage(page - 1);
        }
      }
    }
  };

  const handleEdit = (q) => {
    setCurrentQ({
      ...q
    });
    setIsEditing(true);
  };

  const handleAdd = () => {
    setCurrentQ({ 
      industry_id: industries.length > 0 ? industries[0].id : '', 
      difficulty: 'medium', 
      content: '', 
      question_type: 'technical' 
    });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!currentQ.industry_id) {
      alert('Vui lòng chọn Ngành nghề!');
      return;
    }

    const payload = {
      content: currentQ.content,
      industry_id: currentQ.industry_id,
      difficulty: currentQ.difficulty,
      question_type: currentQ.question_type
    };

    if (currentQ.id) {
      // Update
      const { error } = await supabase.from('questions').update(payload).eq('id', currentQ.id);
      if (error) return alert('Lỗi cập nhật: ' + error.message);
    } else {
      // Insert
      const { error } = await supabase.from('questions').insert([payload]);
      if (error) return alert('Lỗi thêm mới: ' + error.message);
    }
    
    setIsEditing(false);
    setCurrentQ(null);
    fetchQuestions(); // Tải lại danh sách
  };

  return (
    <div className="animate-fade" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h2>Ngân hàng Câu hỏi ({questions.length})</h2>
        <button 
          className="btn-primary" 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
            color: '#000000',
            fontWeight: '600',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            border: 'none', 
            boxShadow: '0 4px 15px rgba(255, 255, 255, 0.15)',
            transition: 'all 0.3s ease'
          }} 
          onClick={handleAdd}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={18} /> Thêm mới
        </button>
      </div>

      <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem', fontWeight: '500', width: '50px' }}>ID</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Câu hỏi</th>
              <th style={{ padding: '1rem', fontWeight: '500', width: '140px' }}>Ngành nghề</th>
              <th style={{ padding: '1rem', fontWeight: '500', width: '100px' }}>Độ khó</th>
              <th style={{ padding: '1rem', fontWeight: '500', width: '120px' }}>Loại câu hỏi</th>
              <th style={{ padding: '1rem', fontWeight: '500', width: '100px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedQuestions.map(q => (
              <tr key={q.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{q.id.toString().substring(0, 8)}...</td>
                <td style={{ padding: '1rem' }}>{q.content}</td>
                <td style={{ padding: '1rem' }}>{q.industries?.name || 'N/A'}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    color: q.difficulty === 'hard' ? '#ff4d4d' : (q.difficulty === 'medium' ? '#ff9632' : '#32c864'),
                    fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'capitalize'
                  }}>
                    {q.difficulty}
                  </span>
                </td>
                <td style={{ padding: '1rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                  {q.question_type}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(q)} style={iconBtnStyle} title="Sửa"><Edit2 size={18} color="hsl(var(--primary-hsl))" /></button>
                  <button onClick={() => handleDelete(q.id)} style={iconBtnStyle} title="Xóa"><Trash2 size={18} color="#ff4d4d" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: 'var(--spacing-md)' }}>
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          style={{ ...pageBtnStyle, opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
        >
          &larr; Prev
        </button>
        <span style={{ padding: '0.5rem 1rem', background: 'var(--glass-bg)', borderRadius: '8px' }}>
          {page} / {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          style={{ ...pageBtnStyle, opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
        >
          Next &rarr;
        </button>
      </div>

      {isEditing && (
        <div style={modalOverlayStyle}>
          <div className="animate-fade glass-card" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{currentQ.id ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h2>
              <button onClick={() => setIsEditing(false)} style={closeBtnStyle}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Ngành nghề</label>
                <select
                  required
                  value={currentQ.industry_id}
                  onChange={e => setCurrentQ({ ...currentQ, industry_id: e.target.value })}
                  style={inputStyle}
                >
                  <option value="" disabled>-- Chọn ngành nghề --</option>
                  {industries.map(ind => (
                    <option key={ind.id} value={ind.id}>{ind.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Độ khó</label>
                <select
                  value={currentQ.difficulty}
                  onChange={e => setCurrentQ({ ...currentQ, difficulty: e.target.value })}
                  style={inputStyle}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Loại câu hỏi</label>
                <select
                  value={currentQ.question_type}
                  onChange={e => setCurrentQ({ ...currentQ, question_type: e.target.value })}
                  style={inputStyle}
                >
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nội dung câu hỏi</label>
                <textarea
                  required
                  rows={4}
                  value={currentQ.content}
                  onChange={e => setCurrentQ({ ...currentQ, content: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Lưu</button>
                <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)',
  color: '#000000',
  outline: 'none'
};

const iconBtnStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '0.25rem',
  margin: '0 0.25rem'
};

const pageBtnStyle = {
  padding: '0.5rem 1rem',
  background: 'var(--primary)',
  color: 'white',
  border: 'none',
  borderRadius: '8px'
};

const closeBtnStyle = { background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' };
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalContentStyle = { width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' };

export default QuestionBankView;
