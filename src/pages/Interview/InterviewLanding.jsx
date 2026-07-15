import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Upload, FileText, Zap, ArrowRight,
  X, CheckCircle, AlertCircle, FileUp, Briefcase,
  ChevronLeft, Clock, Target, Brain, Shield,
  TrendingUp, Star, Users
} from 'lucide-react';
import '../../assets/styles/interview-theme.css';
import './InterviewLanding.css';
import heroImageSvg from '../../assets/images/Hero-image.svg';

const ACCEPTED_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};
const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function InterviewLanding() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [cvFile, setCvFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return 'Chỉ chấp nhận file PDF, DOC hoặc DOCX';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File quá lớn. Kích thước tối đa là 10MB';
    }
    return null;
  };

  const handleFile = useCallback((file) => {
    setUploadError('');
    setUploadSuccess(false);
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }
    setCvFile(file);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 2000);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const removeFile = () => {
    setCvFile(null);
    setUploadError('');
    setUploadSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📄';
    return '📝';
  };

  const handleStartWithCV = () => {
    if (!cvFile) return;
    // Navigate to setup with CV file info
    navigate('/interview/setup', { state: { cvFile: cvFile, mode: 'cv-based' } });
  };

  return (
    <div className="interview-theme">
      <div className="iv-orb iv-orb--blue" />
      <div className="iv-orb iv-orb--purple" />
      <img src={heroImageSvg} alt="" className="iv-bg-illustration" />

      <div className="landing-container">


        {/* Hero Section */}
        <div className="landing-hero iv-animate-fade iv-delay-1">

          <h1 className="landing-hero__title">
            Sẵn sàng cho buổi phỏng vấn tiếp theo?
          </h1>
        </div>

        {/* Mode Selection Cards */}
        <div className="landing-modes">
          {/* Mode 1: Quick Setup */}
          <div className="mode-card mode-card--quick iv-animate-slide-up iv-delay-2">
            <div className="mode-card__glow mode-card__glow--blue" />
            <div className="mode-card__header">
              <div className="mode-card__icon mode-card__icon--blue">
                <Zap size={28} />
              </div>

            </div>
            <h2 className="mode-card__title">Phỏng vấn nhanh</h2>
            <p className="mode-card__desc">
              Chọn ngành nghề, độ khó và loại câu hỏi. Bắt đầu phỏng vấn ngay trong vài bước đơn giản.
            </p>
            <ul className="mode-card__features">
              <li><Target size={14} /> <span>Chọn ngành IT cụ thể</span></li>
              <li><Clock size={14} /> <span>Tùy chỉnh thời lượng</span></li>
              <li><TrendingUp size={14} /> <span>3 mức độ khó</span></li>
            </ul>
            <button
              className="iv-btn iv-btn--primary mode-card__btn"
              onClick={() => navigate('/interview/setup')}
            >
              Bắt đầu nhanh
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Mode 2: CV Upload */}
          <div className="mode-card mode-card--cv iv-animate-slide-up iv-delay-3">
            <div className="mode-card__glow mode-card__glow--purple" />
            <div className="mode-card__header">
              <div className="mode-card__icon mode-card__icon--purple">
                <FileText size={28} />
              </div>

            </div>
            <h2 className="mode-card__title">Phỏng vấn theo CV</h2>
            <p className="mode-card__desc">
              Tải CV của bạn lên, AI sẽ phân tích và tạo câu hỏi phỏng vấn dựa trên kinh nghiệm thực tế của bạn.
            </p>
            <ul className="mode-card__features">
              <li><Brain size={14} /> <span>AI phân tích CV thông minh</span></li>
              <li><Shield size={14} /> <span>Câu hỏi cá nhân hóa</span></li>
              <li><Users size={14} /> <span>Mô phỏng thực tế</span></li>
            </ul>

            {/* Upload Area */}
            <div
              className={`cv-upload-zone ${isDragging ? 'cv-upload-zone--dragging' : ''} ${cvFile ? 'cv-upload-zone--has-file' : ''} ${uploadError ? 'cv-upload-zone--error' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !cvFile && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="cv-file-input"
              />

              {!cvFile ? (
                <div className="cv-upload-zone__empty">
                  <div className={`cv-upload-zone__icon-wrapper ${isDragging ? 'cv-upload-zone__icon-wrapper--active' : ''}`}>
                    <Upload size={28} className="cv-upload-zone__icon" />
                  </div>
                  <div className="cv-upload-zone__text">
                    <p className="cv-upload-zone__main">
                      {isDragging ? 'Thả file vào đây...' : 'Kéo thả CV vào đây'}
                    </p>
                    <p className="cv-upload-zone__sub">
                      hoặc <span className="cv-upload-zone__link">chọn file từ máy</span>
                    </p>
                  </div>
                  <div className="cv-upload-zone__formats">
                    <span className="cv-format-tag">PDF</span>
                    <span className="cv-format-tag">DOC</span>
                    <span className="cv-format-tag">DOCX</span>
                    <span className="cv-format-tag cv-format-tag--size">Tối đa 10MB</span>
                  </div>
                </div>
              ) : (
                <div className="cv-upload-zone__file">
                  <div className="cv-file-info">
                    <div className="cv-file-info__icon">{getFileIcon(cvFile.name)}</div>
                    <div className="cv-file-info__details">
                      <p className="cv-file-info__name">{cvFile.name}</p>
                      <p className="cv-file-info__size">{formatFileSize(cvFile.size)}</p>
                    </div>
                    <div className="cv-file-info__status">
                      <CheckCircle size={18} className="cv-file-info__check" />
                    </div>
                  </div>
                  <button
                    className="cv-file-remove"
                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    title="Xóa file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Upload Status Messages */}
            {uploadError && (
              <div className="cv-upload-msg cv-upload-msg--error iv-animate-fade">
                <AlertCircle size={14} />
                <span>{uploadError}</span>
              </div>
            )}
            {uploadSuccess && (
              <div className="cv-upload-msg cv-upload-msg--success iv-animate-fade">
                <CheckCircle size={14} />
                <span>Tải file thành công!</span>
              </div>
            )}

            <button
              className={`iv-btn iv-btn--primary mode-card__btn mode-card__btn--cv ${!cvFile ? 'iv-btn--disabled' : ''}`}
              onClick={handleStartWithCV}
              disabled={!cvFile}
            >
              <FileUp size={18} />
              Phỏng vấn với CV
              <ArrowRight size={18} />
            </button>
          </div>
        </div>


      </div>
    </div>
  );
}
