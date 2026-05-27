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
    let parsedOptions = ['', '', '', ''];
    try {
      if (q.options) {
        if (typeof q.options === 'string' && q.options.startsWith('[')) {
          parsedOptions = JSON.parse(q.options);
        } else {
          parsedOptions = [q.options];
        }
      }
    } catch (e) {}

    while (parsedOptions.length < 4) {
      parsedOptions.push('');
    }

    setCurrentQ({
      ...q,
      optionsList: parsedOptions,
      correct_answer: q.correct_answer || 'A'
    });
    setIsEditing(true);
  };

  const handleAdd = () => {
    setCurrentQ({ 
      industry_id: industries.length > 0 ? industries[0].id : '', 
      difficulty: 'medium', 
      content: '', 
      question_type: 'technical',
      optionsList: ['', '', '', ''],
      correct_answer: 'A'
    });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!currentQ.industry_id) {
      alert('Vui lòng chọn Ngành nghề!');
      return;
    }

    // Clean up empty options before saving
    const cleanedOptions = (currentQ.optionsList || []).filter(opt => opt.trim() !== '');

    const payload = {
      content: currentQ.content,
      industry_id: currentQ.industry_id,
      difficulty: currentQ.difficulty,
      question_type: currentQ.question_type,
      options: cleanedOptions.length > 0 ? JSON.stringify(cleanedOptions) : null,
      correct_answer: currentQ.correct_answer || 'A'
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

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

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
              <th style={{ padding: '1rem', fontWeight: '500', width: '120px' }}>Loại</th>
              <th style={{ padding: '1rem', fontWeight: '500', width: '250px' }}>Đáp án</th>
              <th style={{ padding: '1rem', fontWeight: '500', width: '100px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedQuestions.map(q => {
              let displayOptions = q.options;
              try {
                if (q.options && typeof q.options === 'string' && q.options.startsWith('[')) {
                  const arr = JSON.parse(q.options);
                  displayOptions = arr.map((opt, i) => `${letters[i]}. ${opt}`).join(' | ');
                }
              } catch(e) {}

              return (
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
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayOptions ? displayOptions : <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Chưa có đáp án</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600', marginTop: '0.25rem' }}>
                    {q.correct_answer ? `Đúng: ${q.correct_answer}` : ''}
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(q)} style={{...iconBtnStyle, background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5'}} title="Sửa câu hỏi"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(q.id)} style={{...iconBtnStyle, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}} title="Xóa câu hỏi"><Trash2 size={16} /></button>
                </td>
              </tr>
              );
            })}
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
        <span style={{ padding: '0.5rem 1rem', background: '#f1f5f9', borderRadius: '8px', fontWeight: '600', color: '#334155' }}>
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
          <div className="animate-fade" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#1e293b' }}>{currentQ.id ? 'Chỉnh sửa Câu hỏi' : 'Thêm Câu hỏi mới'}</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{currentQ.id ? 'Cập nhật nội dung và thuộc tính câu hỏi.' : 'Điền thông tin bên dưới để thêm câu hỏi vào ngân hàng.'}</p>
              </div>
              <button onClick={() => setIsEditing(false)} style={closeBtnStyle}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Ngành nghề <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    required
                    value={currentQ.industry_id || ''}
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
                  <label style={labelStyle}>Độ khó</label>
                  <select
                    value={currentQ.difficulty || 'medium'}
                    onChange={e => setCurrentQ({ ...currentQ, difficulty: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="easy">Dễ (Easy)</option>
                    <option value="medium">Trung bình (Medium)</option>
                    <option value="hard">Khó (Hard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Loại câu hỏi</label>
                <select
                  value={currentQ.question_type || 'technical'}
                  onChange={e => setCurrentQ({ ...currentQ, question_type: e.target.value })}
                  style={inputStyle}
                >
                  <option value="technical">Technical (Kiến thức chuyên môn)</option>
                  <option value="behavioral">Behavioral (Câu hỏi tình huống/Hành vi)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Nội dung câu hỏi <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea
                  required
                  rows={3}
                  value={currentQ.content || ''}
                  onChange={e => setCurrentQ({ ...currentQ, content: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi tại đây..."
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Các đáp án lựa chọn</label>
                  {currentQ.optionsList?.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', width: '20px', color: '#475569' }}>{letters[idx]}.</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...currentQ.optionsList];
                          newOpts[idx] = e.target.value;
                          setCurrentQ({ ...currentQ, optionsList: newOpts });
                        }}
                        style={{ ...inputStyle, padding: '0.55rem 0.85rem' }}
                        placeholder={`Nhập đáp án ${letters[idx]}`}
                      />
                    </div>
                  ))}
                  {currentQ.optionsList?.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setCurrentQ({ ...currentQ, optionsList: [...currentQ.optionsList, ''] })}
                      style={{ background: 'transparent', border: '1px dashed #cbd5e1', padding: '0.5rem', width: '100%', borderRadius: '8px', color: '#64748b', cursor: 'pointer', marginTop: '0.25rem', transition: 'all 0.2s' }}
                      onMouseOver={e => e.target.style.borderColor = '#94a3b8'}
                      onMouseOut={e => e.target.style.borderColor = '#cbd5e1'}
                    >
                      + Thêm đáp án {letters[currentQ.optionsList.length]}
                    </button>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Đáp án đúng <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    required
                    value={currentQ.correct_answer || 'A'}
                    onChange={e => setCurrentQ({ ...currentQ, correct_answer: e.target.value })}
                    style={inputStyle}
                  >
                    {currentQ.optionsList?.map((opt, idx) => (
                      <option key={idx} value={letters[idx]}>Đáp án {letters[idx]}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '0.85rem', background: '#f1f5f9', border: 'none', color: '#475569', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#e2e8f0'} onMouseOut={e => e.target.style.background = '#f1f5f9'}>Hủy bỏ</button>
                <button type="submit" style={{ flex: 1, padding: '0.85rem', background: '#4f46e5', border: 'none', color: '#ffffff', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>{currentQ.id ? 'Lưu thay đổi' : 'Thêm câu hỏi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '0.4rem', color: '#475569', fontSize: '0.85rem', fontWeight: '600' };

const inputStyle = {
  width: '100%',
  padding: '0.85rem 1rem',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#334155',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s'
};

const iconBtnStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '0.5rem',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s'
};

const pageBtnStyle = {
  padding: '0.5rem 1rem',
  background: 'var(--primary)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  transition: 'transform 0.2s'
};

const closeBtnStyle = { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', transition: 'color 0.2s' };
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  padding: '1rem'
};
const modalContentStyle = { 
  width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', 
  padding: '2.5rem', background: '#ffffff', borderRadius: '24px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
};

export default QuestionBankView;
