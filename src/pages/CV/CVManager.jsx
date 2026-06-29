import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileText, CheckCircle, AlertCircle, X, Trash2,
  Eye, Search, Sparkles, Shield, Target, BookOpen, Wrench,
  ChevronRight, Zap, Award
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { analyzeCV, extractDocxHtml } from '../../utils/cvAnalysisService';
import IT_JOB_POSITIONS, { JOB_CATEGORIES } from '../../constants/itJobPositions';
import './CVManager.css';

// NOTE: Supabase upload is ready in cvStorageService.js
// Uncomment import below when Supabase is configured:
import { uploadCV, listUserCVs, deleteCV, saveCVMetadata, getUserCVRecords, updateCVAnalysis, deleteCVFromDB } from '../../utils/cvStorageService';
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
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const fileInputRef = useRef(null);

  // Load CV history from database on mount or when user changes
  useEffect(() => {
    const fetchCVHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: dbCVs, error } = await getUserCVRecords(user.id);
        if (error) {
          console.error('Error fetching CV history:', error.message);
          return;
        }

        if (dbCVs && dbCVs.length > 0) {
          const mappedFiles = dbCVs.map(cv => ({
            id: cv.id,
            name: cv.file_name,
            size: 0,
            uploadedAt: new Date(cv.created_at),
            score: cv.ai_score || null,
            analysis: cv.ai_analysis_result ? (typeof cv.ai_analysis_result === 'string' ? JSON.parse(cv.ai_analysis_result) : cv.ai_analysis_result) : null,
            url: cv.file_url,
          }));

          setFiles(mappedFiles);
          // Auto-select the first CV in history
          const firstCV = mappedFiles[0];
          setSelectedFile(firstCV);
          setAnalysisResult(firstCV.analysis);
          if (firstCV.url?.includes('.pdf')) {
            setPreviewUrl(firstCV.url);
          }
        }
      } catch (err) {
        console.error('Error loading history:', err);
      }
    };

    fetchCVHistory();
  }, []);

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
    setSelectedFile(null);
    setAnalysisResult(null);
    setSelectedPosition(null);
    setCategoryFilter('all');

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
      
      let dbRecord = null;
      if (uploadError) {
        console.warn('Supabase upload failed:', uploadError.message);
      } else {
        console.info('File uploaded to Supabase Storage:', uploadData.path);
        // Only save to DB if user is authenticated (RLS requires valid user_id)
        if (user?.id) {
          const { data, error } = await saveCVMetadata({ userId: user.id, fileName: uploadData.fileName, fileUrl: uploadData.url });
          if (error) {
            console.error('Failed to save CV metadata:', error.message);
          } else if (data && data.length > 0) {
            dbRecord = data[0];
          }
        }
      }

      const result = await analyzeCV(pendingFile, (progress, status) => {
        setAnalysisProgress(progress);
        setAnalysisStatus(status);
      }, selectedPosition);

      // Update the database record with the AI score and JSON analysis result
      if (user?.id && dbRecord?.id) {
        const { error: updateError } = await updateCVAnalysis(dbRecord.id, result, result.atsScore);
        if (updateError) {
          console.error('Failed to update CV analysis in DB:', updateError.message);
        } else {
          console.info('CV analysis successfully saved to database!');
        }
      }

      const newFile = {
        id: dbRecord?.id || Date.now().toString(),
        name: pendingFile.name,
        size: pendingFile.size,
        type: pendingFile.type,
        uploadedAt: new Date(),
        score: result.atsScore,
        analysis: result,
        localFile: pendingFile,
        url: uploadData?.url || null,
      };

      setFiles((prev) => [newFile, ...prev]);
      setSelectedFile(newFile);
      setAnalysisResult(result);

      // --- AUTOMATIC POSITION MATCHING ---
      if (!selectedPosition && result.suggestedPositionId) {
        const autoMatchedPos = IT_JOB_POSITIONS.find(p => p.id === result.suggestedPositionId);
        if (autoMatchedPos) {
          setSelectedPosition(autoMatchedPos);
          // Set the category filter to match the newly selected position
          setCategoryFilter(autoMatchedPos.category);
        }
      }

      setPendingFile(null);
    } catch (err) {
      console.error('Analysis error:', err);
      alert('Có lỗi xảy ra khi phân tích CV');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ---------- Re-analyze CV ---------- */
  const handleReanalyzeCV = async () => {
    if (!selectedFile) return;
    
    let fileToAnalyze = selectedFile.localFile;
    
    if (!fileToAnalyze && selectedFile.url) {
      setIsAnalyzing(true);
      setAnalysisStatus('Đang tải file từ server...');
      try {
        const response = await fetch(selectedFile.url);
        const blob = await response.blob();
        fileToAnalyze = new File([blob], selectedFile.name, { type: selectedFile.type });
      } catch (e) {
        console.error("Failed to fetch file for re-analysis", e);
        alert("Không thể tải file để phân tích lại.");
        setIsAnalyzing(false);
        return;
      }
    }

    if (!fileToAnalyze) {
      alert("Không tìm thấy dữ liệu file để phân tích.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisProgress(0);
    setAnalysisStatus('Bắt đầu phân tích lại...');

    try {
      const result = await analyzeCV(fileToAnalyze, (progress, status) => {
        setAnalysisProgress(progress);
        setAnalysisStatus(status);
      }, selectedPosition);

      if (selectedFile.id && selectedFile.id !== Date.now().toString()) {
         const { error: updateError } = await updateCVAnalysis(selectedFile.id, result, result.atsScore);
         if (updateError) {
           console.error('Failed to update CV analysis in DB:', updateError.message);
         }
      }

      const updatedFile = { ...selectedFile, analysis: result, score: result.atsScore };
      setSelectedFile(updatedFile);
      setAnalysisResult(result);
      
      setFiles(prev => prev.map(f => f.id === selectedFile.id ? updatedFile : f));

      if (!selectedPosition && result.suggestedPositionId) {
        const autoMatchedPos = IT_JOB_POSITIONS.find(p => p.id === result.suggestedPositionId);
        if (autoMatchedPos) {
          setSelectedPosition(autoMatchedPos);
          setCategoryFilter(autoMatchedPos.category);
        }
      }

    } catch (err) {
      console.error('Re-analysis error:', err);
      alert('Có lỗi xảy ra khi phân tích lại CV');
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
    setPendingFile(null);

    // Restore the position it was evaluated against
    if (file.analysis?.evaluatedPositionId) {
      const matchedPos = IT_JOB_POSITIONS.find(p => p.id === file.analysis?.evaluatedPositionId);
      if (matchedPos) {
        setSelectedPosition(matchedPos);
        setCategoryFilter(matchedPos.category);
      }
    } else {
      setSelectedPosition(null);
      setCategoryFilter('all');
    }

    if (file.localFile?.type === 'application/pdf') {
      setPreviewUrl(URL.createObjectURL(file.localFile));
    } else if (file.url?.includes('.pdf')) {
      setPreviewUrl(file.url);
    } else if (
      file.localFile?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.localFile?.name?.endsWith('.docx')
    ) {
      const html = await extractDocxHtml(file.localFile);
      if (html) setDocxHtml(html);
    }
  };

  const handleDeleteCV = async (e, fileId) => {
    e.stopPropagation();
    
    const fileToDelete = files.find(f => f.id === fileId);

    // Optimistic UI update
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
      setAnalysisResult(null);
      setPreviewUrl(null);
      setDocxHtml(null);
      setSelectedPosition(null);
      setCategoryFilter('all');
    }

    try {
      // 1. Delete from Supabase Storage
      if (fileToDelete && fileToDelete.url) {
        // Extract filePath from URL (e.g. "userId/timestamp_filename.pdf")
        const urlParts = fileToDelete.url.split('/cv-bucket/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          const { error: storageError } = await deleteCV(filePath);
          if (storageError) {
            console.error('Failed to delete file from Storage:', storageError.message);
          } else {
            console.info('File deleted from Storage successfully!');
          }
        }
      }

      // 2. Delete from Database
      const { error } = await deleteCVFromDB(fileId);
      if (error) {
        console.error('Failed to delete CV from database:', error.message);
        // If DB delete fails (e.g. RLS policy missing), we should probably revert the UI, 
        // but since we already deleted from Storage, it's a bit tricky. 
        // A missing DELETE policy is the main cause of silent failures here.
      } else {
        console.info('CV record deleted successfully from database!');
      }
    } catch (err) {
      console.error('Error deleting CV:', err);
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

          {/* Position Selector */}
          <div className="glass-card cv-position-selector">
            <div className="cv-position-selector__title">
              <Target size={18} />
              Chọn vị trí ứng tuyển mục tiêu
            </div>
            <p className="cv-position-selector__desc">
              Chọn vị trí IT để AI đánh giá mức độ phù hợp của CV với yêu cầu ngành
            </p>

            <div className="cv-position-selector__categories">
              {JOB_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`cv-position-selector__cat-btn ${categoryFilter === cat.id ? 'cv-position-selector__cat-btn--active' : ''}`}
                  onClick={() => setCategoryFilter(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <select
              className="cv-position-selector__select"
              value={selectedPosition?.id || ''}
              onChange={(e) => {
                const pos = IT_JOB_POSITIONS.find(p => p.id === e.target.value);
                setSelectedPosition(pos || null);
              }}
            >
              <option value="">-- Không chỉ định (phân tích tổng quát) --</option>
              {IT_JOB_POSITIONS
                .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
                .map(pos => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name} ({pos.rating})
                  </option>
                ))}
            </select>

            {selectedPosition && (
              <div className="cv-position-selector__info animate-fade">
                <div className="cv-position-selector__info-row">
                  <span className="cv-position-selector__info-label">📊 Rating:</span>
                  <span className="cv-position-selector__info-value">{selectedPosition.rating}</span>
                </div>
                <div className="cv-position-selector__info-row">
                  <span className="cv-position-selector__info-label">💰 Mức lương:</span>
                  <span className="cv-position-selector__info-value">{selectedPosition.demandSalary}</span>
                </div>
                <div className="cv-position-selector__info-row">
                  <span className="cv-position-selector__info-label">📝 Mô tả:</span>
                  <span className="cv-position-selector__info-value">{selectedPosition.description}</span>
                </div>
                <div className="cv-position-selector__skills">
                  <span className="cv-position-selector__info-label">🔑 Kỹ năng bắt buộc:</span>
                  <div className="cv-position-selector__skill-tags">
                    {selectedPosition.requiredSkills.map(s => (
                      <span key={s} className="cv-position-selector__skill-tag">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
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

              {/* 12-Section Detailed Report - JSON Structured */}
              <div className="glass-card" style={{ marginTop: 'var(--spacing-md)' }}>
                <div className="cv-analysis-card__title cv-analysis-card__title--purple" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <FileText size={20} /> Đánh giá chi tiết (Elite Technical Recruiter)
                </div>
                
                {analysisResult.executiveSummary && (
                  <div className="cv-report-section">
                    <h3>1. Executive Summary</h3>
                    <div className="cv-report-box">
                      <p><strong>Cấp độ đánh giá:</strong> <span className="tag-level">{analysisResult.executiveSummary.level}</span></p>
                      <p><strong>🔥 Điểm mạnh:</strong> {analysisResult.executiveSummary.strengths}</p>
                      <p><strong>⚠️ Điểm yếu:</strong> {analysisResult.executiveSummary.weaknesses}</p>
                    </div>
                  </div>
                )}

                {analysisResult.atsAnalysis && (
                  <div className="cv-report-section">
                    <h3>2. Phân tích độ tương thích ATS</h3>
                    <p>{analysisResult.atsAnalysis}</p>
                  </div>
                )}

                {analysisResult.layoutEvaluation && (
                  <div className="cv-report-section">
                    <h3>3. Đánh giá Bố cục & Thiết kế</h3>
                    <p>{analysisResult.layoutEvaluation}</p>
                  </div>
                )}

                {analysisResult.technicalSkills && (
                  <div className="cv-report-section">
                    <h3>4. Kỹ năng chuyên môn</h3>
                    <div className="cv-report-box">
                      <p><strong>[Trích xuất từ CV]:</strong> {(analysisResult.technicalSkills.extractedSkills || []).join(', ')}</p>
                      <p><strong>Nhận định thị trường:</strong> {analysisResult.technicalSkills.marketRelevance}</p>
                      {analysisResult.technicalSkills.urgentSkillsToLearn && analysisResult.technicalSkills.urgentSkillsToLearn.length > 0 && (
                        <p><strong>Cần học gấp:</strong> {(analysisResult.technicalSkills.urgentSkillsToLearn || []).join(', ')}</p>
                      )}
                    </div>
                  </div>
                )}

                {analysisResult.projectsEvaluation && (
                  <div className="cv-report-section">
                    <h3>5. Dự án Thực tế</h3>
                    {analysisResult.projectsEvaluation.length === 0 ? <p>Không tìm thấy dự án nào trong CV.</p> : analysisResult.projectsEvaluation.map((proj, idx) => (
                      <div key={idx} className="cv-report-box" style={{ marginBottom: '1rem' }}>
                        <p><strong>Dự án:</strong> {proj.name}</p>
                        <p><strong>Loại:</strong> {proj.type}</p>
                        <p><strong>Kiến trúc & Tech Stack:</strong> {proj.architectureAndStack}</p>
                        <p style={{ color: 'var(--color-danger)' }}><strong>Điểm yếu:</strong> {proj.critique}</p>
                      </div>
                    ))}
                  </div>
                )}

                {analysisResult.workExperience && (
                  <div className="cv-report-section">
                    <h3>6. Kinh nghiệm làm việc</h3>
                    <p>{analysisResult.workExperience.evaluation}</p>
                    {!analysisResult.workExperience.isNoExperience && analysisResult.workExperience.improvedBulletPoints && analysisResult.workExperience.improvedBulletPoints.length > 0 && (
                      <div className="cv-report-box">
                        <strong>Đề xuất viết lại chuẩn STAR:</strong>
                        <ul>
                          {analysisResult.workExperience.improvedBulletPoints.map((bp, i) => <li key={i}>{bp}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {analysisResult.achievementsAndStar && (
                  <div className="cv-report-section">
                    <h3>7. Đánh giá Thành tích (STAR)</h3>
                    <p>{analysisResult.achievementsAndStar.evaluation}</p>
                    <p><em>Gợi ý: {analysisResult.achievementsAndStar.suggestions}</em></p>
                  </div>
                )}

                {analysisResult.redFlags && analysisResult.redFlags.length > 0 && (
                  <div className="cv-report-section">
                    <h3 style={{ color: 'var(--color-danger)' }}>8. Cờ Đỏ (Red Flags)</h3>
                    <ul style={{ color: 'var(--color-danger)' }}>
                      {analysisResult.redFlags.map((flag, idx) => <li key={idx}>{flag}</li>)}
                    </ul>
                  </div>
                )}

                {analysisResult.hiringProbability && (
                  <div className="cv-report-section">
                    <h3>9. Khả năng được tuyển dụng</h3>
                    <div className="cv-report-box">
                      <p><strong>Tỷ lệ gọi phỏng vấn:</strong> {analysisResult.hiringProbability.overallPercentage}%</p>
                      <ul>
                        <li><strong>Startup:</strong> {analysisResult.hiringProbability.startup}</li>
                        <li><strong>Outsourcing:</strong> {analysisResult.hiringProbability.outsourcing}</li>
                        <li><strong>Product:</strong> {analysisResult.hiringProbability.productCompany}</li>
                        <li><strong>Enterprise/FAANG:</strong> {analysisResult.hiringProbability.enterprise}</li>
                      </ul>
                    </div>
                  </div>
                )}

                {analysisResult.improvementRoadmap && (
                  <div className="cv-report-section">
                    <h3>10. Lộ trình cải thiện</h3>
                    <div className="cv-roadmap">
                      <div className="roadmap-box high">
                        <strong>Ưu tiên cao (24h):</strong>
                        <ul>{(analysisResult.improvementRoadmap.highPriority || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
                      </div>
                      <div className="roadmap-box medium">
                        <strong>Ưu tiên trung bình (1 tuần):</strong>
                        <ul>{(analysisResult.improvementRoadmap.mediumPriority || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
                      </div>
                      <div className="roadmap-box low">
                        <strong>Dài hạn:</strong>
                        <ul>{(analysisResult.improvementRoadmap.lowPriority || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
                      </div>
                    </div>
                  </div>
                )}

                {analysisResult.missingSections && (
                  <div className="cv-report-section">
                    <h3>11. Các mục còn thiếu</h3>
                    <ul>
                      {analysisResult.missingSections.map((sec, i) => <li key={i}>{sec}</li>)}
                    </ul>
                  </div>
                )}

                {analysisResult.finalVerdict && (
                  <div className="cv-report-section">
                    <h3>12. Tổng kết</h3>
                    <p>{analysisResult.finalVerdict.summary}</p>
                    <div className="cv-report-box">
                      <strong>Hành động ngay:</strong>
                      <ol>
                        {(analysisResult.finalVerdict.immediateActions || []).map((act, i) => <li key={i}>{act}</li>)}
                      </ol>
                    </div>
                  </div>
                )}
              </div>

              {/* Job Match Score Card */}
              {analysisResult.jobMatchScore !== undefined && analysisResult.jobMatchScore !== null && (
                (() => {
                  const evaluatedPos = IT_JOB_POSITIONS.find(p => p.id === analysisResult.evaluatedPositionId);
                  const displayPosName = evaluatedPos ? evaluatedPos.name : analysisResult.suggestedPosition;
                  
                  // Check if the globally selected dropdown position matches the one evaluated
                  const isMismatch = selectedPosition && analysisResult.evaluatedPositionId && selectedPosition.id !== analysisResult.evaluatedPositionId;

                  if (isMismatch) {
                    return (
                      <div className="glass-card cv-job-match mismatch-warning animate-fade" style={{ marginTop: 'var(--spacing-md)', background: 'rgba(255, 165, 0, 0.05)', border: '1px solid rgba(255, 165, 0, 0.3)' }}>
                        <div className="cv-job-match__header" style={{ color: 'orange', marginBottom: '1rem' }}>
                          <AlertCircle size={20} />
                          <h3>Chưa phân tích cho vị trí: {selectedPosition.name}</h3>
                        </div>
                        <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                          Điểm số <strong>{analysisResult.jobMatchScore}/100</strong> bên dưới là của vị trí <strong>{displayPosName}</strong>. 
                          Bạn vừa đổi Dropdown sang một vị trí mới, vui lòng bấm phân tích lại để AI đánh giá với bộ tiêu chuẩn khắt khe của <strong>{selectedPosition.name}</strong>.
                        </p>
                        <button 
                          className="cv-btn cv-btn-primary" 
                          onClick={handleReanalyzeCV}
                          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                        >
                          <Target size={18} /> Phân tích lại CV cho vị trí này
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="glass-card cv-job-match animate-fade" style={{ marginTop: 'var(--spacing-md)' }}>
                      <div className="cv-job-match__header">
                        <Target size={20} color="var(--color-accent)" />
                        <h3>Đánh giá phù hợp: {displayPosName}</h3>
                      </div>
                      <div className="cv-job-match__score-row">
                        <ATSScoreRing score={analysisResult.jobMatchScore} label="Job Match" />
                        {evaluatedPos ? (
                          <div className="cv-job-match__market">
                            <div className="cv-job-match__market-item">
                              <span className="cv-job-match__market-label">📊 Rating ngành</span>
                              <span className="cv-job-match__market-value">{evaluatedPos.rating}</span>
                            </div>
                            <div className="cv-job-match__market-item">
                              <span className="cv-job-match__market-label">💰 Mức lương</span>
                              <span className="cv-job-match__market-value">{evaluatedPos.demandSalary}</span>
                            </div>
                            <div className="cv-job-match__market-item">
                              <span className="cv-job-match__market-label">🔥 Đặc điểm</span>
                              <span className="cv-job-match__market-value" style={{ fontSize: '0.8rem' }}>{evaluatedPos.characteristics}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="cv-job-match__market">
                             <div className="cv-job-match__market-item">
                              <span className="cv-job-match__market-label">🤖 AI ĐỀ XUẤT</span>
                              <span className="cv-job-match__market-value">Vị trí này được AI tự động phân tích và đề xuất dựa trên kỹ năng của bạn.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ===== ATS Score Ring Component ===== */
const ATSScoreRing = ({ score, label }) => {
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
        <div className="cv-ats__score-label">{label || 'ATS Score'}</div>
      </div>
    </div>
  );
};

export default CVManager;
