import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import '../../assets/styles/interview-theme.css';
import heroImageSvg from '../../assets/images/Hero-image.svg';

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
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [positionSearch, setPositionSearch] = useState('');
  const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false);
  const fileInputRef = useRef(null);
  const folderToggleRef = useRef(null);
  const positionSearchRef = useRef(null);
  const positionSearchContainerRef = useRef(null);

  // Handle clicking outside the position search dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (positionSearchContainerRef.current && !positionSearchContainerRef.current.contains(event.target)) {
        setIsPositionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
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
    setSelectedPositions([]);
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
      }, selectedPositions);

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
      if (selectedPositions.length === 0 && result.suggestedPositionId) {
        const autoMatchedPos = IT_JOB_POSITIONS.find(p => p.id === result.suggestedPositionId);
        if (autoMatchedPos) {
          setSelectedPositions([autoMatchedPos]);
          setPositionSearch('');
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
      }, selectedPositions);

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

      if (selectedPositions.length === 0 && result.suggestedPositionId) {
        const autoMatchedPos = IT_JOB_POSITIONS.find(p => p.id === result.suggestedPositionId);
        if (autoMatchedPos) {
          setSelectedPositions([autoMatchedPos]);
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
        setSelectedPositions([matchedPos]);
        setCategoryFilter(matchedPos.category);
      }
    } else {
      setSelectedPositions([]);
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
      setSelectedPositions([]);
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
    <div className="cv-manager interview-theme">
      <div className="iv-grid-bg" />
      <div className="iv-orb iv-orb--blue" />
      <div className="iv-orb iv-orb--purple" />
      <img src={heroImageSvg} alt="" className="iv-bg-illustration" />
      <div className="container">
        <motion.div 
          className="cv-manager__header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="cv-manager__title">Phân tích CV bằng AI</h1>
          <p className="cv-manager__subtitle">
            Tải lên CV và nhận đánh giá chi tiết từ trí tuệ nhân tạo
          </p>
        </motion.div>

        <div className="cv-manager__grid">
          {/* ===== LEFT SIDEBAR ===== */}
        <div className="cv-sidebar">
          {/* Drop Zone */}
          <div className="glass-card">
            <motion.div
              className={`cv-dropzone ${isDragOver ? 'cv-dropzone--active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Aceternity-style grid background */}
              <div className="cv-dropzone__grid-bg">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="cv-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(196,149,106,0.08)" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cv-grid)" />
                </svg>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                id="cv-file-input"
              />
              <motion.div 
                className="cv-dropzone__icon"
                animate={isDragOver ? { scale: 1.15, y: -8 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                <Upload size={28} color="var(--primary)" />
              </motion.div>
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
            </motion.div>

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

            {/* === SPARKLE BUTTON (Uiverse fat-bat-0) === */}
            <div className="cv-sparkle-wrapper" style={{ marginTop: 'var(--spacing-md)' }}>
              <button
                className="cv-sparkle-btn"
                onClick={handleUploadAndAnalyze}
                disabled={!pendingFile || isAnalyzing}
                id="cv-upload-btn"
              >
                <span className="cv-spark"></span>
                <span className="cv-backdrop"></span>
                <svg className="cv-sparkle-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z" fill="black" stroke="black" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z" fill="black" stroke="black" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z" fill="black" stroke="black" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span className="cv-sparkle-text">
                  {isAnalyzing ? 'Đang phân tích...' : 'Tải lên & Phân tích CV'}
                </span>
              </button>
              {/* Particle effects */}
              <span aria-hidden="true" className="cv-particle-pen">
                {[...Array(10)].map((_, i) => (
                  <svg key={i} className="cv-particle" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
                    style={{
                      '--x': `${10 + Math.random() * 80}`,
                      '--y': `${10 + Math.random() * 80}`,
                      '--duration': `${1 + Math.random() * 2}`,
                      '--delay': `${Math.random() * 3}`,
                      '--alpha': `${0.4 + Math.random() * 0.6}`,
                      '--origin-x': `${Math.random() > 0.5 ? -500 : 500}%`,
                      '--origin-y': `${Math.random() > 0.5 ? -500 : 500}%`,
                      '--size': `${0.2 + Math.random() * 0.4}`,
                    }}
                  >
                    <path d="M6.937 3.846L7.75 1L8.563 3.846C8.77313 4.58114 9.1671 5.25062 9.70774 5.79126C10.2484 6.3319 10.9179 6.72587 11.653 6.936L14.5 7.75L11.654 8.563C10.9189 8.77313 10.2494 9.1671 9.70874 9.70774C9.1681 10.2484 8.77413 10.9179 8.564 11.653L7.75 14.5L6.937 11.654C6.72687 10.9189 6.3329 10.2494 5.79226 9.70874C5.25162 9.1681 4.58214 8.77413 3.847 8.564L1 7.75L3.846 6.937C4.58114 6.72687 5.25062 6.3329 5.79126 5.79226C6.3319 5.25162 6.72587 4.58214 6.936 3.847L6.937 3.846Z" fill="black" stroke="black" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                ))}
              </span>
            </div>
          </div>

          {/* === POSITION SELECTOR WITH SEARCH (Uiverse-inspired) === */}
          <div className="glass-card cv-position-selector" style={{ position: 'relative', zIndex: 50 }}>
            <div className="cv-position-selector__title">
              <Target size={18} />
              Chọn vị trí ứng tuyển mục tiêu
            </div>
            <p className="cv-position-selector__desc">
              Chọn vị trí IT để AI đánh giá mức độ phù hợp của CV với yêu cầu ngành
            </p>

            {/* Search bar with folder icon */}
            <div className="cv-position-search" style={{ position: 'relative' }} ref={positionSearchContainerRef}>
              <div className="cv-position-search__bar">
                <div className="cv-position-search__icon-wrap">
                  {/* Mini folder icon */}
                  <svg width="20" height="18" viewBox="0 0 24 20" fill="none">
                    <path d="M 0 4 Q 0 0 4 0 L 8 0 Q 10 0 11 2 L 12 4 Q 13 6 15 6 L 20 6 Q 24 6 24 10 L 24 16 Q 24 20 20 20 L 4 20 Q 0 20 0 16 Z" fill="var(--color-accent, #c4956a)" />
                  </svg>
                </div>
                <Search size={14} style={{ color: selectedPositions.length > 0 ? 'var(--color-accent, #c4956a)' : 'var(--color-text-muted)', flexShrink: 0 }} />
                
                {/* Selected Tags */}
                {selectedPositions.map(pos => (
                  <div key={pos.id} className="cv-position-search__tag" style={{ display: 'flex', alignItems: 'center', background: 'var(--color-cream-dark, #F2ECE4)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', gap: '6px', border: '1px solid var(--color-border)', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {pos.name}
                    <X size={12} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedPositions(prev => prev.filter(p => p.id !== pos.id));
                    }} />
                  </div>
                ))}

                <input
                  ref={positionSearchRef}
                  type="text"
                  className="cv-position-search__input"
                  placeholder={selectedPositions.length > 0 ? "Thêm vị trí..." : "Tìm kiếm vị trí (VD: Frontend, Data...)"}
                  value={positionSearch}
                  onChange={e => setPositionSearch(e.target.value)}
                  onFocus={() => setIsPositionDropdownOpen(true)}
                />
                {selectedPositions.length > 0 && (
                  <button
                    className="cv-position-search__clear"
                    onClick={() => { setSelectedPositions([]); setPositionSearch(''); }}
                    title="Xóa lựa chọn"
                  >
                    <X size={14} />
                  </button>
                )}
                {/* Counter badge */}
                <div className="cv-position-search__badge">
                  <span>{IT_JOB_POSITIONS.filter(p => categoryFilter === 'all' || p.category === categoryFilter).length}</span>
                </div>
              </div>

              {/* Dropdown list */}
              {isPositionDropdownOpen && (
                <div className="cv-position-search__dropdown">
                  {/* Category tabs inside dropdown */}
                  <div className="cv-position-search__cats">
                    {JOB_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        className={`cv-position-search__cat ${categoryFilter === cat.id ? 'cv-position-search__cat--active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setCategoryFilter(cat.id); }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Scrollable position list */}
                  <div className="cv-position-search__list">
                    {IT_JOB_POSITIONS
                      .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
                      .filter(p => !positionSearch || p.name.toLowerCase().includes(positionSearch.toLowerCase()))
                      .map(pos => {
                        const isSelected = selectedPositions.some(p => p.id === pos.id);
                        return (
                        <div
                          key={pos.id}
                          className={`cv-position-search__item ${isSelected ? 'cv-position-search__item--active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            if (isSelected) {
                              setSelectedPositions(prev => prev.filter(p => p.id !== pos.id));
                            } else {
                              setSelectedPositions(prev => [...prev, pos]);
                            }
                            setPositionSearch('');
                            // Focus lại input để user có thể tiếp tục gõ tìm kiếm nếu muốn
                            if (positionSearchRef.current) {
                              positionSearchRef.current.focus();
                            }
                          }}
                        >
                          <div className="cv-position-search__item-name">{pos.name}</div>
                          <div className="cv-position-search__item-meta">
                            <span className="cv-position-search__item-rating">{pos.rating}</span>
                            <span className="cv-position-search__item-salary">{pos.demandSalary}</span>
                          </div>
                        </div>
                      )})}
                    {IT_JOB_POSITIONS
                      .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
                      .filter(p => !positionSearch || p.name.toLowerCase().includes(positionSearch.toLowerCase())).length === 0 && (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        Không tìm thấy vị trí phù hợp
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected position details */}
            {selectedPositions.length > 0 && (
              <div className="cv-position-selector__info-container animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {selectedPositions.map(selectedPosition => (
                  <div key={selectedPosition.id} className="cv-position-selector__info" style={{ marginTop: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(196, 149, 106, 0.15)', paddingBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-charcoal)', fontSize: '0.9rem' }}>
                        {selectedPosition.name}
                      </span>
                      <span className="cv-position-search__item-rating" style={{ fontSize: '0.72rem', padding: '2px 8px', flexShrink: 0 }}>
                        {selectedPosition.rating}
                      </span>
                    </div>
                    <div className="cv-position-selector__info-row">
                      <span className="cv-position-selector__info-label">Mức lương:</span>
                      <span className="cv-position-selector__info-value">{selectedPosition.demandSalary}</span>
                    </div>
                    <div className="cv-position-selector__info-row">
                      <span className="cv-position-selector__info-label">Mô tả:</span>
                      <span className="cv-position-selector__info-value">{selectedPosition.description}</span>
                    </div>
                    <div className="cv-position-selector__skills" style={{ marginTop: '8px' }}>
                      <span className="cv-position-selector__info-label">Kỹ năng bắt buộc:</span>
                      <div className="cv-position-selector__skill-tags" style={{ marginTop: '6px' }}>
                        {selectedPosition.requiredSkills.map(s => (
                          <span key={s} className="cv-position-selector__skill-tag">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* === WALLET CV LIST (Uiverse rude-bat-50) === */}
          <div className="glass-card">
            <div className="cv-list__title">
              <FileText size={18} />
              CV đã tải lên
              {files.length > 0 && <span className="cv-list__count">{files.length}</span>}
            </div>

            {files.length === 0 ? (
              <div className="cv-wallet cv-wallet--empty">
                <div className="cv-wallet__back"></div>
                <div className="cv-wallet__pocket">
                  <svg className="pocket-svg" viewBox="0 0 280 160" fill="none" preserveAspectRatio="none">
                    <path
                      d="M 0 20 C 0 10, 5 10, 10 10 C 20 10, 25 25, 40 25 L 240 25 C 255 25, 260 10, 270 10 C 275 10, 280 10, 280 20 L 280 120 C 280 155, 260 160, 240 160 L 40 160 C 20 160, 0 155, 0 120 Z"
                      fill="#1e341e"
                    ></path>
                    <path
                      d="M 8 22 C 8 16, 12 16, 15 16 C 23 16, 27 29, 40 29 L 240 29 C 253 29, 257 16, 265 16 C 268 16, 272 16, 272 22 L 272 120 C 272 150, 255 152, 240 152 L 40 152 C 25 152, 8 152, 8 120 Z"
                      stroke="#3d5635"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                      vectorEffect="non-scaling-stroke"
                    ></path>
                  </svg>
                </div>
              </div>
            ) : (
              <div className="cv-wallet">
                <div className="cv-wallet__back"></div>

                {/* Render up to 3 CV cards */}
                {files.slice(0, 3).map((file, idx) => {
                  const colorVariants = ['--1', '--2', '--3'];
                  return (
                    <div
                      key={file.id}
                      className={`cv-wallet__card cv-wallet__card${colorVariants[idx] || '--3'} ${selectedFile?.id === file.id ? 'cv-list-item--active' : ''}`}
                      onClick={() => handleSelectCV(file)}
                      style={{ animationDelay: `${0.1 * (idx + 1)}s` }}
                    >
                      <div className="cv-wallet__card-top">
                        <span className="cv-wallet__card-ext-badge">{file.name.split('.').pop()?.toUpperCase()}</span>
                        <FileText size={18} className="cv-wallet__card-icon" />
                      </div>
                      <div className="cv-wallet__card-bottom">
                        <div className="cv-wallet__card-info">
                          <span className="cv-wallet__card-label">Tên tệp</span>
                          <span className="cv-wallet__card-value" title={file.name}>{file.name}</span>
                        </div>
                        <div className="cv-wallet__card-actions">
                          {file.score && (
                            <div className="cv-wallet__card-score-badge">
                              <span className="cv-wallet__card-score-num">{file.score}</span>
                              <span className="cv-wallet__card-score-lbl">điểm</span>
                            </div>
                          )}
                          <button
                            onClick={(e) => handleDeleteCV(e, file.id)}
                            title="Xóa CV"
                            className="cv-wallet__card-delete-btn"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="cv-wallet__pocket">
                  <svg className="pocket-svg" viewBox="0 0 280 160" fill="none" preserveAspectRatio="none">
                    <path
                      d="M 0 20 C 0 10, 5 10, 10 10 C 20 10, 25 25, 40 25 L 240 25 C 255 25, 260 10, 270 10 C 275 10, 280 10, 280 20 L 280 120 C 280 155, 260 160, 240 160 L 40 160 C 20 160, 0 155, 0 120 Z"
                      fill="#1e341e"
                    ></path>
                    <path
                      d="M 8 22 C 8 16, 12 16, 15 16 C 23 16, 27 29, 40 29 L 240 29 C 253 29, 257 16, 265 16 C 268 16, 272 16, 272 22 L 272 120 C 272 150, 255 152, 240 152 L 40 152 C 25 152, 8 152, 8 120 Z"
                      stroke="#3d5635"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                      vectorEffect="non-scaling-stroke"
                    ></path>
                  </svg>
                  <div className="pocket-content">
                    <div className="balance-real" style={{ 
                      color: '#ffffff', 
                      fontSize: '1.6rem', 
                      fontFamily: 'var(--font-display, sans-serif)', 
                      fontWeight: '800', 
                      letterSpacing: '1px',
                      textShadow: '0 2px 8px rgba(0,0,0,0.25)',
                      marginBottom: '2px'
                    }}>
                      {files.length.toString().padStart(2, '0')} CVs
                    </div>
                    <div style={{ 
                      color: '#a3c29b', 
                      fontSize: '0.75rem', 
                      fontFamily: 'var(--font-sans, sans-serif)',
                      fontWeight: '600', 
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>
                      Tổng Số Đã Tải Lên
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT MAIN AREA ===== */}
        <div className="cv-main">
          {/* PDF Preview */}
          {/* PDF Preview */}
          {previewUrl && (
            <div className="glass-card animate-fade" style={{ padding: '16px', position: 'relative' }}>
              <iframe
                className="cv-preview-iframe"
                src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=0`}
                title="PDF Preview"
                style={{ 
                  opacity: isAnalyzing ? 0.7 : 1, 
                  width: '100%', 
                  maxWidth: '100%', 
                  height: '800px', 
                  borderRadius: '12px',
                  display: 'block'
                }}
              />

              {isAnalyzing && (
                <motion.div 
                  className="cv-laser-scan__beam"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{ zIndex: 10, pointerEvents: 'none', height: '4px', opacity: 0.8, position: 'absolute', left: 0, right: 0 }}
                />
              )}
            </div>
          )}

          {/* DOCX Preview */}
          {!previewUrl && docxHtml && (
            <div className="glass-card cv-preview animate-fade" style={{ position: 'relative', overflow: 'hidden' }}>
              <div className="cv-preview__docx-header" style={{ opacity: isAnalyzing ? 0.7 : 1 }}>
                <FileText size={16} color="var(--color-earth)" />
                <span>Xem trước DOCX</span>
              </div>
              <div
                className="cv-preview__docx-content"
                dangerouslySetInnerHTML={{ __html: docxHtml }}
                style={{ opacity: isAnalyzing ? 0.7 : 1, transition: 'opacity 0.3s' }}
              />
              {isAnalyzing && (
                <motion.div 
                  className="cv-laser-scan__beam"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{ zIndex: 10, pointerEvents: 'none', height: '4px', opacity: 0.8 }}
                />
              )}
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
            <motion.div 
              className="glass-card cv-analysis-loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Laser Scan Document Visual - Only show if no actual document preview is present */}
              {(!previewUrl && !docxHtml) && (
                <div className="cv-laser-scan">
                  <div className="cv-laser-scan__doc">
                    <FileText size={48} color="var(--color-text-secondary)" style={{ opacity: 0.3 }} />
                    <motion.div 
                      className="cv-laser-scan__beam"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </div>
              )}

              <div className="cv-analysis-loading__title">
                <div className="cv-analysis-loading__spinner" />
                Đang phân tích CV của bạn...
              </div>
              <div className="cv-analysis-loading__bar-wrapper">
                <motion.div 
                  className="cv-analysis-loading__bar" 
                  initial={{ width: 0 }}
                  animate={{ width: `${analysisProgress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
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
                    <motion.div 
                      key={i} 
                      className={`cv-analysis-step ${cls}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                    >
                      {cls === 'cv-analysis-step--done'
                        ? <CheckCircle size={16} style={{ flexShrink: 0 }} />
                        : cls === 'cv-analysis-step--active'
                          ? <div className="cv-analysis-step__loader" />
                          : <ChevronRight size={16} style={{ opacity: 0.4, flexShrink: 0 }} />}
                      {step.label}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ===== ANALYSIS DASHBOARD ===== */}
          {analysisResult && !isAnalyzing && (
            <motion.div 
              className="cv-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* ATS Score */}
              <motion.div 
                className="glass-card cv-ats"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, type: 'spring', stiffness: 100 }}
              >
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
                          <motion.div 
                            className="cv-section-score__bar-fill" 
                            style={{ background: getScoreColor(val) }}
                            initial={{ width: 0 }}
                            animate={{ width: `${val}%` }}
                            transition={{ duration: 1.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* 12-Section Detailed Report - JSON Structured */}
              <motion.div 
                className="glass-card" 
                style={{ marginTop: 'var(--spacing-md)' }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, type: 'spring', stiffness: 100 }}
              >
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
              </motion.div>

              {/* Job Match Score Card */}
              {analysisResult.jobMatchScore !== undefined && analysisResult.jobMatchScore !== null && (
                (() => {
                  const evaluatedPos = IT_JOB_POSITIONS.find(p => p.id === analysisResult.evaluatedPositionId);
                  const displayPosName = evaluatedPos ? evaluatedPos.name : analysisResult.suggestedPosition;
                  
                  // Check if the globally selected dropdown position matches the one evaluated
                  const isMismatch = selectedPositions.length > 0 && analysisResult.evaluatedPositionId && !selectedPositions.some(p => p.id === analysisResult.evaluatedPositionId);

                  if (isMismatch) {
                    const requestedNames = selectedPositions.map(p => p.name).join(', ');
                    return (
                      <div className="glass-card cv-job-match mismatch-warning animate-fade" style={{ marginTop: 'var(--spacing-md)', background: 'rgba(255, 165, 0, 0.05)', border: '1px solid rgba(255, 165, 0, 0.3)' }}>
                        <div className="cv-job-match__header" style={{ color: 'orange', marginBottom: '1rem' }}>
                          <AlertCircle size={20} />
                          <h3>Chưa phân tích cho vị trí: {requestedNames}</h3>
                        </div>
                        <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                          Điểm số <strong>{analysisResult.jobMatchScore}/100</strong> bên dưới là của vị trí <strong>{displayPosName}</strong>. 
                          Bạn vừa đổi Dropdown sang một vị trí mới, vui lòng bấm phân tích lại để AI đánh giá với bộ tiêu chuẩn khắt khe của <strong>{requestedNames}</strong>.
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
                              <span className="cv-job-match__market-label">AI ĐỀ XUẤT</span>
                              <span className="cv-job-match__market-value">Vị trí này được AI tự động phân tích và đề xuất dựa trên kỹ năng của bạn.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </motion.div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

/* ===== ATS Score Ring Component ===== */
const ATSScoreRing = ({ score, label }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 65;
  // Arc spans 270 degrees.
  const arcLength = 2 * Math.PI * radius * (270 / 360); 
  const circumference = 2 * Math.PI * radius; 
  const offset = arcLength - (animatedScore / 100) * arcLength;
  
  const scoreClass = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
  const color = score >= 80 ? '#3d7a3d' : score >= 60 ? '#b07d50' : '#c0392b';

  // Generate ticks for background
  const ticks = [];
  const numTicks = 45;
  for (let i = 0; i <= numTicks; i++) {
    const angleDeg = (i * 270) / numTicks;
    const angleRad = (angleDeg * Math.PI) / 180;
    const r1 = radius - 7;
    const r2 = radius + 7;
    ticks.push({
      x1: 80 + r1 * Math.cos(angleRad),
      y1: 80 + r1 * Math.sin(angleRad),
      x2: 80 + r2 * Math.cos(angleRad),
      y2: 80 + r2 * Math.sin(angleRad),
    });
  }

  const capRotation = (animatedScore / 100) * 270;

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

        {/* Background ticks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="var(--color-cream-dark)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}

        {/* Filled Arc */}
        <circle
          className={`cv-ats__ring-fill cv-ats__ring-fill--${scoreClass}`}
          cx="80" cy="80" r={radius}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
        />

        {/* Cap Line (Needle) */}
        <g style={{
          transform: `rotate(${capRotation}deg)`,
          transformOrigin: '80px 80px',
          transition: 'transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <line 
            x1="135" y1="80" x2="155" y2="80" 
            stroke={color} 
            strokeWidth="3.5" 
            strokeLinecap="round" 
          />
        </g>
      </svg>
      <div className="cv-ats__score-text">
        <div className="cv-ats__score-value" style={{ color }}>{score}</div>
        <div className="cv-ats__score-label">{label || 'ATS Score'}</div>
      </div>
    </div>
  );
};

export default CVManager;
