import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Monitor, Server, Layers, Database, Cloud,
  Bug, BarChart3, Palette, Code, Globe, Cpu,
  ChevronRight, ChevronLeft, Clock, Zap,
  Target, Sparkles, ArrowRight, Check, HelpCircle,
  Loader2, FileUp
} from 'lucide-react';
import {
  INDUSTRIES, DIFFICULTIES, QUESTION_TYPES, DURATIONS, LANGUAGES, ICON_MAP
} from '../../constants/interviewConstants';
import { extractTextFromFile } from '../../utils/cvAnalysisService';
import '../../assets/styles/interview-theme.css';
import './InterviewSetup.css';

const STEPS = [
  { id: 1, label: 'Chọn Ngành', icon: Target },
  { id: 2, label: 'Cấu hình', icon: Zap },
  { id: 3, label: 'Xác nhận', icon: Sparkles },
];

const IndustryIcon = ({ iconName, size = 28 }) => {
  const icons = { Monitor, Server, Layers, Database, Cloud, Bug, BarChart3, Palette, Code, Globe, Cpu };
  const Icon = icons[iconName];
  return Icon ? <Icon size={size} /> : <HelpCircle size={size} />;
};

export default function InterviewSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [cvFile, setCvFile] = useState(location.state?.cvFile || null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [selectedQuestionType, setSelectedQuestionType] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('vi');
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');

  // Auto-detect or select industry if it's Frontend/Backend/etc in CV name
  useEffect(() => {
    if (cvFile) {
      const name = cvFile.name.toLowerCase();
      if (name.includes('frontend') || name.includes('fe') || name.includes('react')) {
        setSelectedIndustry('frontend');
      } else if (name.includes('backend') || name.includes('be') || name.includes('java') || name.includes('node')) {
        setSelectedIndustry('backend');
      } else if (name.includes('tester') || name.includes('qa') || name.includes('testing')) {
        setSelectedIndustry('testing');
      } else if (name.includes('devops') || name.includes('aws') || name.includes('cloud')) {
        setSelectedIndustry('devops');
      } else {
        setSelectedIndustry('fullstack'); // Default sensible fallback
      }
    }
  }, [cvFile]);

  const canNext = () => {
    if (currentStep === 1) return selectedIndustry !== null;
    if (currentStep === 2) return selectedDifficulty !== null && selectedQuestionType !== null;
    if (currentStep === 3) return selectedDuration !== null;
    return false;
  };

  const handleNext = () => {
    if (!canNext()) return;
    if (currentStep < 3) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleStart = async () => {
    if (!canNext()) return;

    const baseConfig = {
      industry: INDUSTRIES.find(i => i.id === selectedIndustry),
      difficulty: DIFFICULTIES.find(d => d.id === selectedDifficulty),
      questionType: QUESTION_TYPES.find(q => q.id === selectedQuestionType),
      duration: DURATIONS.find(d => d.id === selectedDuration),
      language: LANGUAGES.find(l => l.id === selectedLanguage),
    };

    if (cvFile) {
      setIsExtracting(true);
      setExtractionError('');
      try {
        // Extract text from the uploaded CV file
        const extraction = await extractTextFromFile(cvFile);
        
        // Navigate with config and CV text
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
        setExtractionError('Không thể trích xuất nội dung CV. Hãy thử lại hoặc bắt đầu không dùng CV.');
        setIsExtracting(false);
      }
    } else {
      navigate('/interview/room', { state: { ...baseConfig, mode: 'quick' } });
    }
  };

  const selectedIndustryData = INDUSTRIES.find(i => i.id === selectedIndustry);
  const selectedDifficultyData = DIFFICULTIES.find(d => d.id === selectedDifficulty);
  const selectedTypeData = QUESTION_TYPES.find(q => q.id === selectedQuestionType);
  const selectedLanguageData = LANGUAGES.find(l => l.id === selectedLanguage);
  const selectedDurationData = DURATIONS.find(d => d.id === selectedDuration);

  return (
    <div className="interview-theme">
      <div className="iv-grid-bg" />
      <div className="iv-orb iv-orb--blue" />
      <div className="iv-orb iv-orb--purple" />

      <div className="setup-container">
        {/* Header */}
        <div className="setup-header iv-animate-fade">
          <button className="iv-btn iv-btn--ghost" onClick={() => navigate('/interview')}>
            <ChevronLeft size={18} />
            Quay lại
          </button>
          <div className="setup-header__title">
            <Sparkles size={20} style={{ color: 'var(--iv-accent-blue)' }} />
            <span>Phỏng Vấn Giả Lập AI</span>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="setup-stepper iv-animate-fade iv-delay-1">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <React.Fragment key={step.id}>
                <div className={`stepper-item ${isActive ? 'stepper-item--active' : ''} ${isCompleted ? 'stepper-item--completed' : ''}`}>
                  <div className="stepper-item__circle">
                    {isCompleted ? <Check size={16} /> : <StepIcon size={16} />}
                  </div>
                  <span className="stepper-item__label">{step.label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`stepper-line ${isCompleted ? 'stepper-line--active' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Active CV Bar */}
        {cvFile && (
          <div className="active-cv-bar iv-animate-fade">
            <div className="active-cv-bar__content">
              <FileUp size={16} className="active-cv-bar__icon" />
              <span>Chế độ phỏng vấn cá nhân hóa theo CV: <strong>{cvFile.name}</strong></span>
            </div>
            <button className="active-cv-bar__btn" onClick={() => setCvFile(null)}>
              Hủy dùng CV
            </button>
          </div>
        )}

        {/* Error message */}
        {extractionError && (
          <div className="setup-error-bar iv-animate-fade">
            <span>{extractionError}</span>
          </div>
        )}

        {/* Step Content */}
        <div className={`setup-content ${isTransitioning ? 'setup-content--exit' : 'setup-content--enter'}`}>

          {/* ── Step 1: Select Industry ── */}
          {currentStep === 1 && (
            <div className="step-panel">
              <div className="step-panel__header">
                <h2 className="step-panel__title">Chọn ngành nghề</h2>
                <p className="step-panel__desc">Chọn lĩnh vực IT bạn muốn phỏng vấn giả lập</p>
              </div>
              <div className="industry-grid">
                {INDUSTRIES.map((industry, i) => (
                  <button
                    key={industry.id}
                    className={`industry-card iv-animate-slide-up iv-delay-${i + 1} ${selectedIndustry === industry.id ? 'industry-card--selected' : ''}`}
                    onClick={() => setSelectedIndustry(industry.id)}
                  >
                    <div className="industry-card__glow" style={{ background: industry.color }} />
                    <div className="industry-card__icon" style={{ background: industry.bgColor, color: industry.color }}>
                      <IndustryIcon iconName={industry.icon} size={24} />
                    </div>
                    <div className="industry-card__info">
                      <h3 className="industry-card__name">{industry.nameVi}</h3>
                      <p className="industry-card__desc">{industry.description}</p>
                    </div>
                    {selectedIndustry === industry.id && (
                      <div className="industry-card__check">
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Difficulty + Question Type ── */}
          {currentStep === 2 && (
            <div className="step-panel">
              {/* Difficulty */}
              <div className="step-panel__section">
                <div className="step-panel__header">
                  <h2 className="step-panel__title">Chọn độ khó</h2>
                  <p className="step-panel__desc">Chọn mức độ phù hợp với kinh nghiệm của bạn</p>
                </div>
                <div className="difficulty-grid">
                  {DIFFICULTIES.map((diff, i) => (
                    <button
                      key={diff.id}
                      className={`difficulty-card iv-animate-slide-up iv-delay-${i + 1} ${selectedDifficulty === diff.id ? 'difficulty-card--selected' : ''}`}
                      onClick={() => setSelectedDifficulty(diff.id)}
                      style={{
                        '--diff-color': diff.color,
                        '--diff-bg': diff.bgColor,
                        '--diff-border': diff.borderColor,
                      }}
                    >
                      <div className="difficulty-card__dot" />
                      <h3 className="difficulty-card__name">{diff.name}</h3>
                      <p className="difficulty-card__desc">{diff.description}</p>
                      {selectedDifficulty === diff.id && (
                        <div className="difficulty-card__check"><Check size={14} /></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Type */}
              <div className="step-panel__section">
                <div className="step-panel__header">
                  <h2 className="step-panel__title">Loại câu hỏi</h2>
                  <p className="step-panel__desc">Chọn dạng câu hỏi phỏng vấn</p>
                </div>
                <div className="qtype-grid">
                  {QUESTION_TYPES.map((qt, i) => {
                    const QtIcon = ICON_MAP[qt.icon] || HelpCircle;
                    return (
                      <button
                        key={qt.id}
                        className={`qtype-card iv-animate-slide-up iv-delay-${i + 4} ${selectedQuestionType === qt.id ? 'qtype-card--selected' : ''}`}
                        onClick={() => setSelectedQuestionType(qt.id)}
                      >
                        <div className="qtype-card__icon" style={{ background: qt.bgColor, color: qt.color }}>
                          <QtIcon size={22} />
                        </div>
                        <h3 className="qtype-card__name">{qt.name}</h3>
                        <p className="qtype-card__desc">{qt.description}</p>
                        {selectedQuestionType === qt.id && (
                          <div className="qtype-card__check"><Check size={14} /></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selection */}
              <div className="step-panel__section">
                <div className="step-panel__header">
                  <h2 className="step-panel__title">Ngôn ngữ phỏng vấn</h2>
                  <p className="step-panel__desc">Chọn ngôn ngữ cho câu hỏi và phản hồi AI</p>
                </div>
                <div className="language-grid">
                  {LANGUAGES.map((lang, i) => (
                    <button
                      key={lang.id}
                      className={`language-card iv-animate-slide-up iv-delay-${i + 7} ${selectedLanguage === lang.id ? 'language-card--selected' : ''}`}
                      onClick={() => setSelectedLanguage(lang.id)}
                      style={{
                        '--lang-color': lang.color,
                        '--lang-bg': lang.bgColor,
                      }}
                    >
                      <span className="language-card__flag">{lang.flag}</span>
                      <div className="language-card__info">
                        <h3 className="language-card__name">{lang.name}</h3>
                        <p className="language-card__desc">{lang.description}</p>
                      </div>
                      {selectedLanguage === lang.id && (
                        <div className="language-card__check"><Check size={14} /></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Duration + Summary ── */}
          {currentStep === 3 && (
            <div className="step-panel">
              <div className="step-panel__section">
                <div className="step-panel__header">
                  <h2 className="step-panel__title">Thời lượng phỏng vấn</h2>
                  <p className="step-panel__desc">Chọn thời gian phù hợp cho buổi phỏng vấn</p>
                </div>
                <div className="duration-grid">
                  {DURATIONS.map((dur, i) => (
                    <button
                      key={dur.id}
                      className={`duration-card iv-animate-slide-up iv-delay-${i + 1} ${selectedDuration === dur.id ? 'duration-card--selected' : ''}`}
                      onClick={() => setSelectedDuration(dur.id)}
                    >
                      <Clock size={24} className="duration-card__icon" />
                      <h3 className="duration-card__time">{dur.label}</h3>
                      <p className="duration-card__questions">~{dur.estimatedQuestions} câu hỏi</p>
                      {selectedDuration === dur.id && (
                        <div className="duration-card__check"><Check size={14} /></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              {selectedDuration && (
                <div className="summary-card iv-animate-fade">
                  <h3 className="summary-card__title">
                    <Sparkles size={18} />
                    Tổng quan buổi phỏng vấn
                  </h3>
                  <div className="summary-card__grid">
                    <div className="summary-item">
                      <span className="summary-item__label">Ngành nghề</span>
                      <span className="summary-item__value" style={{ color: selectedIndustryData?.color }}>
                        {selectedIndustryData?.nameVi}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-item__label">Độ khó</span>
                      <span className="summary-item__value" style={{ color: selectedDifficultyData?.color }}>
                        {selectedDifficultyData?.name}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-item__label">Loại câu hỏi</span>
                      <span className="summary-item__value">{selectedTypeData?.name}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-item__label">Ngôn ngữ</span>
                      <span className="summary-item__value">
                        {selectedLanguageData?.flag} {selectedLanguageData?.name}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-item__label">Thời lượng</span>
                      <span className="summary-item__value">{selectedDurationData?.label}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-item__label">Số câu ước tính</span>
                      <span className="summary-item__value summary-item__value--accent">
                        ~{selectedDurationData?.estimatedQuestions} câu hỏi
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="setup-nav iv-animate-fade">
          <div className="setup-nav__left">
            {currentStep > 1 && (
              <button className="iv-btn iv-btn--ghost" onClick={handleBack}>
                <ChevronLeft size={18} />
                Quay lại
              </button>
            )}
          </div>
          <div className="setup-nav__right">
            {currentStep < 3 ? (
              <button
                className={`iv-btn iv-btn--primary ${!canNext() ? 'iv-btn--disabled' : ''}`}
                onClick={handleNext}
                disabled={!canNext()}
              >
                Tiếp theo
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                className={`iv-btn iv-btn--primary iv-btn--lg setup-start-btn ${!canNext() ? 'iv-btn--disabled' : ''}`}
                onClick={handleStart}
                disabled={!canNext()}
              >
                <Sparkles size={18} />
                Bắt đầu phỏng vấn
                <ArrowRight size={18} />
              </button>
            )}
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
            <h3 className="extraction-card__title">AI Đang Phân Tích CV</h3>
            <p className="extraction-card__desc">
              Hệ thống đang trích xuất dữ liệu từ CV và chuẩn bị phòng phỏng vấn cá nhân hóa cho bạn...
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
