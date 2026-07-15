import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Loader2, FileUp, X, Upload, Check, ChevronDown
} from 'lucide-react';
import {
  DIFFICULTIES, QUESTION_TYPES, DURATIONS, LANGUAGES, POPULAR_SKILLS
} from '../../constants/interviewConstants';
import { extractTextFromFile } from '../../utils/cvAnalysisService';
import '../../assets/styles/interview-theme.css';
import './InterviewSetup.css';
import heroImageSvg from '../../assets/images/Hero-image.svg';

const EXPERIENCE_LEVELS = [
  { id: 'fresher', label: 'Fresher' },
  { id: 'junior', label: 'Junior' },
  { id: 'middle', label: 'Middle' },
  { id: 'senior', label: 'Senior' },
  { id: 'lead', label: 'Lead' }
];

const SECTIONS = [
  { id: 'section-basic', label: 'Thông tin cơ bản' },
  { id: 'section-skills', label: 'Kỹ năng chuyên môn' },
  { id: 'section-config', label: 'Cấu hình phỏng vấn' },
  { id: 'section-details', label: 'Chi tiết & Ghi chú' }
];

const CustomSelect = ({ options, value, onChange, placeholder = "Chọn một mục" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`custom-select-container ${isOpen ? 'custom-select-container--open' : ''}`} ref={containerRef}>
      <div 
        className="custom-select-trigger" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={16} className="custom-select-icon" />
      </div>
      {isOpen && (
        <div className="custom-select-dropdown">
          {options.map((opt) => (
            <div 
              key={opt.value}
              className={`custom-select-option ${value === opt.value ? 'custom-select-option--selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
              {value === opt.value && <Check size={14} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function InterviewSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const observerRef = useRef(null);
  
  // State
  const [cvFile, setCvFile] = useState(location.state?.cvFile || null);
  const [position, setPosition] = useState(cvFile ? 'Lập trình viên' : '');
  const [experience, setExperience] = useState('junior');
  
  // Tags (Skills)
  const [skills, setSkills] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const tagContainerRef = useRef(null);
  
  // Config
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [selectedQuestionType, setSelectedQuestionType] = useState('technical');
  const [selectedLanguage, setSelectedLanguage] = useState('vi');
  const [selectedDuration, setSelectedDuration] = useState(20);
  
  // Textareas
  const [jobDescription, setJobDescription] = useState('');
  const [aiNotes, setAiNotes] = useState('');

  // UI state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  const canStart = position.trim().length > 0;

  // Scrollspy logic
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the most visible section (or the one intersecting positively)
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 } // Triggers when section is near top of viewport
    );

    SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observerRef.current.observe(el);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Click outside for suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tagContainerRef.current && !tagContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -120; // Offset for sticky header
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setCurrentTag(value);
    
    if (value.trim().length > 0) {
      const filtered = POPULAR_SKILLS.filter(
        skill => 
          skill.toLowerCase().includes(value.toLowerCase()) && 
          !skills.includes(skill)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleAddTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && currentTag.trim()) {
      e.preventDefault();
      const newTag = currentTag.trim().replace(/,$/, '');
      if (!skills.includes(newTag)) {
        setSkills([...skills, newTag]);
      }
      setCurrentTag('');
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (skill) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
    setCurrentTag('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    setSkills(skills.filter(tag => tag !== tagToRemove));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCvFile(file);
      setExtractionError('');
    }
  };

  const handleStart = async () => {
    if (!canStart) return;

    const baseConfig = {
      industry: { id: 'custom', nameVi: position, name: position, color: 'var(--iv-accent-blue)' },
      difficulty: DIFFICULTIES.find(d => d.id === selectedDifficulty) || DIFFICULTIES[1],
      questionType: QUESTION_TYPES.find(q => q.id === selectedQuestionType) || QUESTION_TYPES[0],
      duration: DURATIONS.find(d => d.id === selectedDuration) || DURATIONS[1],
      language: LANGUAGES.find(l => l.id === selectedLanguage) || LANGUAGES[0],
      experienceLevel: experience,
      skills: skills,
      jobDescription: jobDescription.trim(),
      aiNotes: aiNotes.trim()
    };

    if (cvFile) {
      setIsExtracting(true);
      setExtractionError('');
      try {
        const extraction = await extractTextFromFile(cvFile);
        navigate('/interview/room', { 
          state: { 
            ...baseConfig, 
            cvText: extraction.text,
            cvFileName: cvFile.name,
            mode: 'cv-based'
          } 
        });
      } catch (err) {
        console.error('Error extracting CV text:', err);
        setExtractionError('Không thể trích xuất nội dung CV. Hãy kiểm tra lại file.');
        setIsExtracting(false);
      }
    } else {
      navigate('/interview/room', { state: { ...baseConfig, mode: 'quick' } });
    }
  };

  return (
    <div className="interview-theme">
      <div className="iv-grid-bg" />
      <div className="iv-orb iv-orb--blue" />
      <div className="iv-orb iv-orb--purple" />
      <img src={heroImageSvg} alt="" className="iv-bg-illustration" />

      <div className="setup-container" style={{ maxWidth: '1200px' }}>
        
        <div className="setup-header iv-animate-fade">
          <div className="setup-header__content">
            <h1 className="setup-title">Thiết lập phỏng vấn</h1>
            <p className="setup-desc">Điền thông tin chi tiết để AI tạo bộ câu hỏi cá nhân hóa tốt nhất.</p>
          </div>
        </div>

        {/* Error message */}
        {extractionError && (
          <div className="setup-error-bar iv-animate-fade">
            <span>{extractionError}</span>
          </div>
        )}

        <div className="setup-main-card iv-animate-slide-up iv-delay-1">
          
          {/* Sidebar Nav */}
          <aside className="setup-sidebar">
            <div className="setup-nav-list">
              {SECTIONS.map((sec, index) => {
                const isActive = activeSection === sec.id;
                const activeIndex = SECTIONS.findIndex(s => s.id === activeSection);
                const isCompleted = index < activeIndex;
                
                return (
                  <div 
                    key={sec.id} 
                    className={`setup-nav-item ${isActive ? 'setup-nav-item--active' : ''} ${isCompleted ? 'setup-nav-item--completed' : ''}`}
                    onClick={() => scrollToSection(sec.id)}
                  >
                    <div className="setup-nav-track">
                      <div className="setup-nav-circle">
                        <Check />
                      </div>
                      {index < SECTIONS.length - 1 && <div className="setup-nav-line" />}
                    </div>
                    <div className="setup-nav-label">{sec.label}</div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Form Content */}
          <div className="setup-form-container">
            
            {/* 1. Thông tin cơ bản */}
            <section id="section-basic" className="form-section">
              <h2 className="form-section__title">1. Thông tin cơ bản</h2>
              
              <div className="form-group">
                <label className="form-label">Vị trí ứng tuyển <span>*</span></label>
                <input
                  type="text"
                  className="iv-input"
                  placeholder="Vd: Lập trình viên ReactJS, Data Analyst..."
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cấp độ kinh nghiệm</label>
                <div className="pill-group">
                  {EXPERIENCE_LEVELS.map(level => (
                    <button
                      key={level.id}
                      className={`pill-btn ${experience === level.id ? 'pill-btn--active' : ''}`}
                      onClick={() => setExperience(level.id)}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 2. Kỹ năng chuyên môn */}
            <section id="section-skills" className="form-section">
              <h2 className="form-section__title">2. Kỹ năng chuyên môn</h2>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Công nghệ / Kỹ năng</label>
                <span className="form-hint" style={{ marginBottom: '0.5rem' }}>Liệt kê các kỹ năng chính để AI tập trung câu hỏi. Nhấn Enter để thêm.</span>
                <div className="tag-input-container" ref={tagContainerRef}>
                  {skills.map(tag => (
                    <span key={tag} className="tag-item">
                      {tag}
                      <button type="button" className="tag-remove" onClick={() => removeTag(tag)}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="tag-input"
                    placeholder={skills.length === 0 ? "Nhập tên công nghệ và nhấn Enter..." : ""}
                    value={currentTag}
                    onChange={handleTagInputChange}
                    onKeyDown={handleAddTag}
                    onFocus={() => {
                      if (currentTag.trim().length > 0 && filteredSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                  />
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {filteredSuggestions.map((suggestion, index) => (
                        <div 
                          key={index} 
                          className="suggestion-item"
                          onClick={() => selectSuggestion(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 3. Cấu hình phỏng vấn */}
            <section id="section-config" className="form-section">
              <h2 className="form-section__title">3. Cấu hình phỏng vấn</h2>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Thời lượng</label>
                  <CustomSelect 
                    value={selectedDuration} 
                    onChange={setSelectedDuration}
                    options={DURATIONS.map(d => ({ value: d.id, label: `${d.label} (~${d.estimatedQuestions} câu)` }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mức độ khó</label>
                  <CustomSelect 
                    value={selectedDifficulty} 
                    onChange={setSelectedDifficulty}
                    options={DIFFICULTIES.map(d => ({ value: d.id, label: d.name }))}
                  />
                </div>
              </div>
            </section>

            {/* 4. Chi tiết & Ghi chú */}
            <section id="section-details" className="form-section">
              <h2 className="form-section__title">4. Chi tiết & Ghi chú</h2>
              
              <div className="form-group">
                <label className="form-label">Job Description (Khuyến khích)</label>
                <span className="form-hint" style={{ marginBottom: '0.5rem' }}>Dán JD tại đây hoặc tải lên file PDF để câu hỏi sát với yêu cầu thực tế nhất.</span>
                <textarea
                  className="iv-textarea"
                  placeholder="Dán nội dung mô tả công việc (JD) vào đây..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              {/* Upload PDF */}
              <div className="form-group">
                <div className="form-hint" style={{ textAlign: 'center', marginBottom: '0.5rem', fontWeight: 600 }}>HOẶC TẢI LÊN CV/JD (PDF)</div>
                {cvFile ? (
                  <div className="active-cv-bar" style={{ marginBottom: 0 }}>
                    <div className="active-cv-bar__content">
                      <FileUp size={16} className="active-cv-bar__icon" />
                      <span>Đã tải lên: <strong>{cvFile.name}</strong></span>
                    </div>
                    <button className="active-cv-bar__btn" onClick={() => setCvFile(null)}>Xóa file</button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    className="iv-btn" 
                    style={{ 
                      width: '100%', 
                      justifyContent: 'center', 
                      border: '1px dashed #f97316',
                      color: '#f97316',
                      background: 'rgba(249, 115, 22, 0.05)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(249, 115, 22, 0.05)';
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} />
                    Tải lên file PDF hoặc Word
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Ghi chú cho AI */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ghi chú cho AI</label>
                <input
                  type="text"
                  className="iv-input"
                  placeholder="Vd: Không hỏi về cấu trúc dữ liệu, tập trung vào design pattern..."
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                />
              </div>
            </section>
            
            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className={`iv-btn iv-btn--primary iv-btn--lg setup-start-btn ${!canStart ? 'iv-btn--disabled' : ''}`}
                onClick={handleStart}
                disabled={!canStart}
                style={{ minWidth: '240px' }}
              >
                <Sparkles size={18} />
                Bắt đầu phỏng vấn
                <ArrowRight size={18} />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Premium CV AI Scan Overlay */}
      {isExtracting && (
        <div className="extraction-overlay">
          <div className="extraction-card iv-glass iv-animate-scale">
            <div className="extraction-card__icon-wrapper">
              <Loader2 className="extraction-card__spinner iv-spin" size={44} />
            </div>
            <div className="extraction-card__scanner" />
            <h3 className="extraction-card__title">AI Đang Phân Tích Thông Tin</h3>
            <p className="extraction-card__desc">
              Hệ thống đang trích xuất dữ liệu và chuẩn bị phòng phỏng vấn cá nhân hóa cho bạn...
            </p>
            <div className="extraction-card__progress-line">
              <div className="extraction-card__progress-fill" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
