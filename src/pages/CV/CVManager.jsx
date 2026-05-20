import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const CVManager = () => {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);

  const handleUpload = () => {
    setIsAnalyzing(true);
    // Giả lập AI phân tích trong 2 giây
    setTimeout(() => {
      setIsAnalyzing(false);
      setReport({
        score: 85,
        strengths: ['Kỹ năng React vững', 'Kinh nghiệm dự án thực tế', 'Tiếng Anh tốt'],
        weaknesses: ['Thiếu chứng chỉ Cloud', 'CV cần tối ưu từ khóa SEO'],
        advice: 'Nên bổ sung thêm các dự án về Backend để trở thành Fullstack.'
      });
    }, 2000);
  };

  return (
    <div className="container animate-fade" style={{ padding: 'var(--spacing-lg) 0' }}>
      <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-md)' }}>Phân tích CV bằng AI</h1>
      
      <div className="grid-auto">
        <div className="glass-card">
          <h3>Tải lên CV của bạn</h3>
          <div style={{
            border: '2px dashed var(--glass-border)',
            borderRadius: '12px',
            padding: 'var(--spacing-xl)',
            textAlign: 'center',
            marginTop: 'var(--spacing-sm)',
            cursor: 'pointer'
          }}>
            <Upload size={48} color="var(--text-secondary)" style={{ marginBottom: 'var(--spacing-sm)' }} />
            <p>Kéo thả file .pdf hoặc click để chọn</p>
          </div>
          <button 
            className="btn-primary" 
            style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
            onClick={handleUpload}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Đang phân tích...' : 'Bắt đầu Phân tích'}
          </button>
        </div>

        {report && (
          <div className="glass-card animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Kết quả đánh giá</h3>
              <span className="gradient-text" style={{ fontSize: '1.5rem' }}>{report.score}/100</span>
            </div>
            
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <h4 style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} /> Điểm mạnh
              </h4>
              <ul>
                {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <h4 style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} /> Điểm cần cải thiện
              </h4>
              <ul>
                {report.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>

            <div style={{ marginTop: 'var(--spacing-md)', background: 'rgba(255,255,255,0.05)', padding: 'var(--spacing-sm)', borderRadius: '8px' }}>
              <strong>Lời khuyên từ Mentor AI:</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{report.advice}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVManager;
