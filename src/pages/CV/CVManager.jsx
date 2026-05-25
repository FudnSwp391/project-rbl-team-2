import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, FileText, CheckCircle, AlertCircle, X, Trash2,
  Eye, Search, Sparkles, Shield, Target, BookOpen, Wrench,
  ChevronRight, Zap, Award
} from 'lucide-react';
import { analyzeCV, extractDocxHtml } from '../../utils/cvAnalysisService';
import './CVManager.css';

// NOTE: Supabase upload is ready in cvStorageService.js
// Uncomment import below when Supabase is configured:
import { uploadCV, listUserCVs, deleteCV, saveCVMetadata } from '../../utils/cvStorageService';
import { supabase } from '../../utils/supabaseClient';
const CVManager = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [docxHtml, setDocxHtml] = useState(null);
  const fileInputRef = useRef(null);

  /* ---------- Drag & Drop handlers ---------- */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, []);

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
    e.target.value = '';
  };

  const handleFileSelect = async (file) => {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      alert('Chỉ chấp nhận file PDF hoặc DOCX');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File không được vượt quá 10MB');
      return;
    }
    setPendingFile(file);
    setPreviewUrl(null);
    setDocxHtml(null);

    // Create preview based on file type
    if (file.type === 'application/pdf') {
      setPreviewUrl(URL.createObjectURL(file));
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      // Generate DOCX preview using mammoth
      const html = await extractDocxHtml(file);
      if (html) setDocxHtml(html);
    }
  };

  /* ---------- Upload & Analyze ---------- */
  const handleUploadAndAnalyze = async () => {
    if (!pendingFile) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisProgress(0);
    setAnalysisStatus('Bắt đầu...');

    try {
      // ---- Supabase Storage upload ----
      const { data: { user } } = await supabase.auth.getUser();
      const folderId = user?.id || 'guest';
      const { data: uploadData, error: uploadError } = await uploadCV(pendingFile, folderId);
      if (uploadError) {
        console.warn('Supabase upload failed:', uploadError.message);
      } else {
        console.info('File uploaded to Supabase Storage:', uploadData.path);
        // Only save to DB if user is authenticated (RLS requires valid user_id)
        if (user?.id) {
          await saveCVMetadata({ userId: user.id, fileName: uploadData.fileName, fileUrl: uploadData.url });
        }
      }

      const result = await analyzeCV(pendingFile, (progress, status) => {
        setAnalysisProgress(progress);
        setAnalysisStatus(status);
      });

      const newFile = {
        id: Date.now().toString(),
        name: pendingFile.name,
        size: pendingFile.size,
        type: pendingFile.type,
        uploadedAt: new Date(),
        score: result.atsScore,
        analysis: result,
        localFile: pendingFile,
      };

      setFiles((prev) => [newFile, ...prev]);
      setSelectedFile(newFile);
      setAnalysisResult(result);
      setPendingFile(null);
    } catch (err) {
      console.error('Analysis error:', err);
      alert('Có lỗi xảy ra khi phân tích CV');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ---------- File list actions ---------- */
  const handleSelectCV = async (file) => {
    setSelectedFile(file);
    setAnalysisResult(file.analysis);
    setPreviewUrl(null);
    setDocxHtml(null);

    if (file.localFile?.type === 'application/pdf') {
      setPreviewUrl(URL.createObjectURL(file.localFile));
    } else if (
      file.localFile?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.localFile?.name?.endsWith('.docx')
    ) {
      const html = await extractDocxHtml(file.localFile);
      if (html) setDocxHtml(html);
    }
  };

  const handleDeleteCV = (e, fileId) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
      setAnalysisResult(null);
      setPreviewUrl(null);
      setDocxHtml(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#3d7a3d';
    if (score >= 60) return '#b07d50';
    return '#c0392b';
  };

  /* ---------- Analysis Loading Steps ---------- */
  const analysisSteps = [
    { label: 'Đọc file CV', threshold: 10 },
    { label: 'Trích xuất nội dung', threshold: 25 },
    { label: 'Phân tích bằng AI', threshold: 45 },
    { label: 'Tạo báo cáo đánh giá', threshold: 85 },
    { label: 'Hoàn tất', threshold: 100 },
  ];

  /* ---------- Render ---------- */
  return (
    <div className="cv-manager container animate-fade">
      <div className="cv-manager__header">
        <h1 className="cv-manager__title gradient-text">Phân tích CV bằng AI</h1>
        <p className="cv-manager__subtitle">
          Tải lên CV và nhận đánh giá chi tiết từ trí tuệ nhân tạo
        </p>
      </div>

      <div className="cv-manager__grid">
        {/* ===== LEFT SIDEBAR ===== */}
        <div className="cv-sidebar">
          {/* Drop Zone */}
          <div className="glass-card">
            <div
              className={`cv-dropzone ${isDragOver ? 'cv-dropzone--active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                id="cv-file-input"
              />
              <div className="cv-dropzone__icon">
                <Upload size={28} color="var(--primary)" />
              </div>
              <p className="cv-dropzone__title">
                {isDragOver ? 'Thả file vào đây!' : 'Kéo thả file CV vào đây'}
              </p>
              <p className="cv-dropzone__hint">hoặc click để chọn file</p>
              <div className="cv-dropzone__formats">
                <span className="cv-dropzone__badge">PDF</span>
                <span className="cv-dropzone__badge">DOC</span>
                <span className="cv-dropzone__badge">DOCX</span>
                <span className="cv-dropzone__badge">≤ 10MB</span>
              </div>
            </div>

            {/* Selected file preview */}
            {pendingFile && (
              <div className="cv-file-preview animate-fade">
                <div className="cv-file-preview__icon">
                  <FileText size={18} color="#fff" />
                </div>
                <div className="cv-file-preview__info">
                  <div className="cv-file-preview__name">{pendingFile.name}</div>
                  <div className="cv-file-preview__size">{formatFileSize(pendingFile.size)}</div>
                </div>
                <button
                  className="cv-file-preview__remove"
                  onClick={(e) => { e.stopPropagation(); setPendingFile(null); setPreviewUrl(null); }}
                  title="Xóa file"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <button
              className="btn-primary cv-upload-btn"
              onClick={handleUploadAndAnalyze}
              disabled={!pendingFile || isAnalyzing}
              id="cv-upload-btn"
            >
              {isAnalyzing ? (
                <><div className="cv-analysis-loading__spinner" /> Đang phân tích...</>
              ) : (
                <><Sparkles size={18} /> Tải lên & Phân tích CV</>
              )}
            </button>
          </div>

          {/* CV List */}
          <div className="glass-card">
            <div className="cv-list__title">
              <FileText size={18} />
              CV đã tải lên
              {files.length > 0 && <span className="cv-list__count">{files.length}</span>}
            </div>

            {files.length === 0 ? (
              <div className="cv-list__empty">
                <BookOpen size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>Chưa có CV nào được tải lên</p>
              </div>
            ) : (
              <div className="cv-list__items">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`cv-list-item ${selectedFile?.id === file.id ? 'cv-list-item--active' : ''}`}
                    onClick={() => handleSelectCV(file)}
                  >
                    <div className="cv-list-item__icon">
                      <FileText size={16} color="#f87171" />
                    </div>
                    <div className="cv-list-item__info">
                      <div className="cv-list-item__name">{file.name}</div>
                      <div className="cv-list-item__meta">
                        {formatFileSize(file.size)} • {file.uploadedAt.toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    {file.score && (
                      <span className={`cv-list-item__score cv-list-item__score--${getScoreClass(file.score)}`}>
                        {file.score}
                      </span>
                    )}
                    <div className="cv-list-item__actions">
                      <button
                        className="cv-list-item__action-btn cv-list-item__action-btn--delete"
                        onClick={(e) => handleDeleteCV(e, file.id)}
                        title="Xóa CV"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT MAIN AREA ===== */}
        <div className="cv-main">
          {/* PDF Preview */}
          {previewUrl && (
            <div className="glass-card cv-preview animate-fade">
              <iframe
                className="cv-preview__iframe"
                src={previewUrl}
                title="PDF Preview"
              />
            </div>
          )}

          {/* DOCX Preview */}
          {!previewUrl && docxHtml && (
            <div className="glass-card cv-preview animate-fade">
              <div className="cv-preview__docx-header">
                <FileText size={16} color="var(--color-earth)" />
                <span>Xem trước DOCX</span>
              </div>
              <div
                className="cv-preview__docx-content"
                dangerouslySetInnerHTML={{ __html: docxHtml }}
              />
            </div>
          )}

          {/* No preview placeholder */}
          {!previewUrl && !docxHtml && !isAnalyzing && !analysisResult && (
            <div className="glass-card">
              <div className="cv-preview__placeholder">
                <div className="cv-preview__placeholder-icon">
                  <Eye size={32} color="var(--text-secondary)" />
                </div>
                <p>Tải lên CV để xem trước và phân tích</p>
              </div>
            </div>
          )}

          {/* Analysis Loading State */}
          {isAnalyzing && (
            <div className="glass-card cv-analysis-loading animate-fade">
              <div className="cv-analysis-loading__title">
                <div className="cv-analysis-loading__spinner" />
                Đang phân tích CV của bạn...
              </div>
              <div className="cv-analysis-loading__bar-wrapper">
                <div className="cv-analysis-loading__bar" style={{ width: `${analysisProgress}%` }} />
              </div>
              <div className="cv-analysis-loading__status">
                <span>{analysisStatus}</span>
                <span>{analysisProgress}%</span>
              </div>
              <div className="cv-analysis-loading__steps">
                {analysisSteps.map((step, i) => {
                  let cls = 'cv-analysis-step--pending';
                  if (analysisProgress >= step.threshold) cls = 'cv-analysis-step--done';
                  else if (i === 0 || analysisProgress >= analysisSteps[i - 1].threshold) cls = 'cv-analysis-step--active';
                  return (
                    <div key={i} className={`cv-analysis-step ${cls}`}>
                      {cls === 'cv-analysis-step--done'
                        ? <CheckCircle size={16} />
                        : cls === 'cv-analysis-step--active'
                          ? <div className="cv-analysis-loading__spinner" style={{ width: 16, height: 16 }} />
                          : <ChevronRight size={16} />}
                      {step.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== ANALYSIS DASHBOARD ===== */}
          {analysisResult && !isAnalyzing && (
            <div className="cv-dashboard">
              {/* ATS Score */}
              <div className="glass-card cv-ats">
                <ATSScoreRing score={analysisResult.atsScore} />
                <p className="cv-ats__summary">{analysisResult.summary}</p>

                {/* Section Scores */}
                {analysisResult.sectionScores && (
                  <div className="cv-section-scores">
                    {Object.entries(analysisResult.sectionScores).map(([key, val]) => (
                      <div key={key} className="cv-section-score">
                        <div className="cv-section-score__label">
                          {({ jdRelevance: 'Phù hợp JD', experience: 'Kinh nghiệm & Dự án', skills: 'Kỹ năng & Chứng chỉ', achievements: 'Thành tích (STAR)', presentation: 'Trình bày' })[key] || key}
                        </div>
                        <div className="cv-section-score__value" style={{ color: getScoreColor(val) }}>{val}</div>
                        <div className="cv-section-score__bar">
                          <div className="cv-section-score__bar-fill" style={{ width: `${val}%`, background: getScoreColor(val) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Strengths & Weaknesses */}
              <div className="cv-analysis-grid" style={{ marginTop: 'var(--spacing-md)' }}>
                <div className="glass-card">
                  <div className="cv-analysis-card__title cv-analysis-card__title--green">
                    <CheckCircle size={18} /> Điểm mạnh
                  </div>
                  <ul className="cv-analysis-list cv-analysis-list--green">
                    {analysisResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="glass-card">
                  <div className="cv-analysis-card__title cv-analysis-card__title--red">
                    <AlertCircle size={18} /> Điểm yếu
                  </div>
                  <ul className="cv-analysis-list cv-analysis-list--red">
                    {analysisResult.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>

              {/* Keywords */}
              {analysisResult.keywords && (
                <div className="glass-card" style={{ marginTop: 'var(--spacing-md)' }}>
                  <div className="cv-analysis-card__title cv-analysis-card__title--blue">
                    <Search size={18} /> Từ khóa ATS
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                      <span style={{ color: '#4ade80' }}>●</span> Tìm thấy trong CV
                    </p>
                    <div className="cv-keywords">
                      {analysisResult.keywords.found.map((kw, i) => (
                        <span key={i} className="cv-keyword cv-keyword--found">{kw}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                      <span style={{ color: '#f87171' }}>●</span> Nên bổ sung
                    </p>
                    <div className="cv-keywords">
                      {analysisResult.keywords.missing.map((kw, i) => (
                        <span key={i} className="cv-keyword cv-keyword--missing">{kw}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysisResult.suggestions && (
                <div className="glass-card" style={{ marginTop: 'var(--spacing-md)' }}>
                  <div className="cv-analysis-card__title cv-analysis-card__title--purple">
                    <Wrench size={18} /> Gợi ý cải thiện
                  </div>
                  <div className="cv-suggestions">
                    {analysisResult.suggestions.map((s, i) => (
                      <div key={i} className="cv-suggestion">
                        <div className="cv-suggestion__header">
                          <span className="cv-suggestion__category">{s.category}</span>
                        </div>
                        <div className="cv-suggestion__issue">{s.issue}</div>
                        <div className="cv-suggestion__fix">{s.fix}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ===== ATS Score Ring Component ===== */
const ATSScoreRing = ({ score }) => {
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const scoreClass = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
  const color = score >= 80 ? '#3d7a3d' : score >= 60 ? '#b07d50' : '#c0392b';

  return (
    <div className="cv-ats__ring">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="gradient-high" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6B7F5C" />
            <stop offset="100%" stopColor="#8FA87E" />
          </linearGradient>
          <linearGradient id="gradient-medium" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4956A" />
            <stop offset="100%" stopColor="#D4A574" />
          </linearGradient>
          <linearGradient id="gradient-low" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c0392b" />
            <stop offset="100%" stopColor="#d35400" />
          </linearGradient>
        </defs>
        <circle className="cv-ats__ring-bg" cx="80" cy="80" r={radius} />
        <circle
          className={`cv-ats__ring-fill cv-ats__ring-fill--${scoreClass}`}
          cx="80" cy="80" r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="cv-ats__score-text">
        <div className="cv-ats__score-value" style={{ color }}>{score}</div>
        <div className="cv-ats__score-label">ATS Score</div>
      </div>
    </div>
  );
};

export default CVManager;
