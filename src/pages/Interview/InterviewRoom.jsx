import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mic, MicOff, Video, VideoOff, Clock, ChevronRight, X,
  Wifi, WifiOff, User, Bot, Sparkles, AlertTriangle,
  Circle, SkipForward, PhoneOff, Volume2, MessageSquare, Loader2,
  AlertCircle
} from 'lucide-react';
import { generateInterviewQuestions } from '../../utils/interviewAiService';
import { transcribeAudio } from '../../utils/whisperAiService';
import { fixITVocabulary, isWhisperHallucination } from '../../utils/speechUtils';
import { useMediaDevices } from '../../hooks/useMediaDevices';
import { useAudioAnalyser } from '../../hooks/useAudioAnalyser';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useVideoAnalyser } from '../../hooks/useVideoAnalyser';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { AvatarPanel } from '../../components/interview/AvatarPanel';
import '../../assets/styles/interview-theme.css';
import './InterviewRoom.css';

// ── Từ ngập ngừng (Filler Words) theo ngôn ngữ ──
const FILLER_WORDS_VI = ["ừm", "à", "ờ", "kiểu như", "thì", "là"];
const FILLER_WORDS_EN = ["uh", "um", "like", "you know", "actually"];

function countFillerWords(text, langId = 'vi') {
  if (!text) return { total: 0, details: {} };
  const lowerText = text.toLowerCase();
  const fillers = langId === 'en' ? FILLER_WORDS_EN : FILLER_WORDS_VI;
  
  let total = 0;
  const details = {};
  
  fillers.forEach(word => {
    const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?<=^|\\s)${escapedWord}(?=\\s|$|[,.?!])`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      const count = matches.length;
      total += count;
      details[word] = count;
    }
  });
  
  return { total, details };
}

// ── Tính toán độ ổn định cao độ (Pitch Stability) ──
function calculatePitchStability(pitchHistory) {
  if (pitchHistory.length < 5) return 88; // Điểm tự nhiên cơ bản khi thiếu mẫu
  
  const n = pitchHistory.length;
  const mean = pitchHistory.reduce((s, v) => s + v, 0) / n;
  const variance = pitchHistory.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  // Độ lệch chuẩn cao độ lý tưởng cho giọng nói tự nhiên dao động quanh 18Hz.
  // Chúng ta tính khoảng cách lệch khỏi điểm tối ưu 18Hz và trừ điểm.
  const distance = Math.abs(stdDev - 18);
  let score = 94 - Math.round(distance * 1.5);
  
  // Khống chế điểm pitch stability trong khoảng tự nhiên (55% - 94%)
  return Math.max(55, Math.min(94, score));
}

// ── Tính toán điểm số âm lượng (Volume Score) ──
function calculateVolumeScore(volumeHistory, hasTranscript = false) {
  if (volumeHistory.length === 0) {
    return hasTranscript ? 70 : 100;
  }
  
  // Lọc bỏ các khung im lặng (volume < 5) để chỉ tính âm lượng khi đang thực sự nói
  const speakingVolumes = volumeHistory.filter(v => v > 5);
  const activeVolList = speakingVolumes.length > 0 ? speakingVolumes : volumeHistory;
  
  const avgVolume = activeVolList.reduce((s, v) => s + v, 0) / activeVolList.length;
  
  // Ánh xạ mức RMS trung bình (thường từ 0-100) sang điểm phần trăm
  let score = Math.round(Math.min(100, (avgVolume / 45) * 100));
  
  // Nếu có transcript (tức là có nói), đảm bảo điểm âm lượng tối thiểu đạt 60%
  if (hasTranscript) {
    score = Math.max(60, score);
  }
  
  return score;
}


// ── Real-time Audio Waveform Component ──
const AudioWaveform = ({ bars, isMicOn }) => (
  <div className={`waveform ${isMicOn ? 'waveform--active' : ''}`}>
    {bars.map((val, i) => {
      // Scale 0-255 → 4-24px height
      const height = isMicOn ? Math.max(4, (val / 255) * 24) : 4;
      return (
        <div
          key={i}
          className="waveform__bar"
          style={{ height: `${height}px`, transition: 'height 0.08s ease' }}
        />
      );
    })}
  </div>
);

// ── AI Status Orb ──
const AIOrb = ({ status }) => (
  <div className={`ai-orb ai-orb--${status}`}>
    <div className="ai-orb__ring ai-orb__ring--outer" />
    <div className="ai-orb__ring ai-orb__ring--inner" />
    <div className="ai-orb__core">
      <Bot size={28} />
    </div>
  </div>
);

// ── Connection Quality ──
const ConnectionIndicator = ({ quality }) => {
  const colors = { good: 'var(--iv-success)', fair: 'var(--iv-warning)', poor: 'var(--iv-danger)' };
  const labels = { good: 'Tốt', fair: 'Trung bình', poor: 'Yếu' };
  return (
    <div className="connection-indicator" style={{ color: colors[quality] }}>
      <Wifi size={14} />
      <span>{labels[quality]}</span>
    </div>
  );
};

export default function InterviewRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state || {};

  // ── Core State ──
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState((config.duration?.id || 20) * 60);
  const [isRecording, setIsRecording] = useState(true);
  const [aiStatus, setAiStatus] = useState('listening'); // listening, thinking, speaking
  const [showEndModal, setShowEndModal] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [questionTransition, setQuestionTransition] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // ── Answers storage: { [questionIndex]: string } ──
  const [answers, setAnswers] = useState({});

  // ── Multi-modal metrics accumulation refs & state ──
  const [allQuestionMetrics, setAllQuestionMetrics] = useState({});
  const questionStartTimeRef = useRef(Date.now());
  const currentQuestionVolumeHistory = useRef([]);
  const currentQuestionPitchHistory = useRef([]);
  const currentQuestionSilenceTicks = useRef(0);
  const silenceAccumulatorRef = useRef(0);

  // ── Video Analyser (FaceMesh) ──
  const {
    isLibraryLoaded: isVideoLibraryLoaded,
    currentMetrics: videoMetrics,
    startAnalysis: startVideoAnalysis,
    stopAnalysis: stopVideoAnalysis,
    getSessionSummary: getVideoSessionSummary,
    resetSession: resetVideoSession
  } = useVideoAnalyser();

  // ── Prevent double API call from React StrictMode ──
  const hasFetchedRef = useRef(false);

  // ── Media Recorder Refs & Callbacks for Hybrid Speech Recognition ──
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ── Media Hooks ──
  const {
    stream,
    videoRef,
    isMicOn,
    isVideoOn,
    permissionError,
    toggleMic,
    toggleVideo,
    stopAll: stopMedia,
  } = useMediaDevices();

  const startRecording = useCallback(() => {
    if (!stream) {
      console.warn('[InterviewRoom] No media stream available to record');
      return;
    }
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.warn('[InterviewRoom] No audio tracks found in stream');
      return;
    }

    // Reset chunks
    audioChunksRef.current = [];

    try {
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/ogg';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/wav';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';

      // Create an audio-only stream so MediaRecorder doesn't try to record video tracks as audio/webm
      const audioStream = new MediaStream(audioTracks);
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(audioStream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(500);
      console.log(`[InterviewRoom] Started MediaRecorder with MIME type: ${mimeType || 'default'}`);
    } catch (err) {
      console.error('[InterviewRoom] Failed to start MediaRecorder:', err);
    }
  }, [stream]);

  const stopRecordingAndGetBlob = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        console.log('[InterviewRoom] MediaRecorder stopped. Blob size:', audioBlob.size);
        resolve(audioBlob);
      };

      try {
        recorder.stop();
      } catch (err) {
        console.error('[InterviewRoom] Error stopping MediaRecorder:', err);
        resolve(null);
      }
    });
  }, []);

  // Audio analyser for real waveform bars
  const { bars, volume, pitch, isSpeaking } = useAudioAnalyser(stream, 7);

  // Lưu trữ các giá trị âm thanh mới nhất qua refs để tránh reload interval liên tục
  const latestVolumeRef = useRef(volume);
  const latestPitchRef = useRef(pitch);
  const latestIsSpeakingRef = useRef(isSpeaking);

  useEffect(() => {
    latestVolumeRef.current = volume;
    latestPitchRef.current = pitch;
    latestIsSpeakingRef.current = isSpeaking;
  }, [volume, pitch, isSpeaking]);

  // ── Sync stream & libraries to video analysis loop ──
  useEffect(() => {
    if (stream && videoRef.current && isVideoLibraryLoaded && isVideoOn) {
      startVideoAnalysis(videoRef.current);
    } else {
      stopVideoAnalysis();
    }
    return () => stopVideoAnalysis();
  }, [stream, isVideoLibraryLoaded, isVideoOn, startVideoAnalysis, stopVideoAnalysis, isLoading]);

  // ── Reset session metrics on question load ──
  useEffect(() => {
    if (questions.length > 0) {
      questionStartTimeRef.current = Date.now();
      resetVideoSession();
    }
  }, [questions, resetVideoSession]);

  // ── Track audio stats (volume, pitch, silence) every 200ms ──
  useEffect(() => {
    if (!isRecording || !stream || !isMicOn) return;

    const interval = setInterval(() => {
      const currentVol = latestVolumeRef.current;
      const currentPitch = latestPitchRef.current;
      const currentIsSpeaking = latestIsSpeakingRef.current;

      currentQuestionVolumeHistory.current.push(currentVol);

      if (currentPitch > 0 && currentIsSpeaking) {
        currentQuestionPitchHistory.current.push(currentPitch);
      }

      if (currentVol < 15) {
        currentQuestionSilenceTicks.current += 0.2;
        if (currentQuestionSilenceTicks.current >= 2.0) {
          silenceAccumulatorRef.current += 0.2;
        }
      } else {
        currentQuestionSilenceTicks.current = 0;
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isRecording, stream, isMicOn]);


  // Speech recognition for live transcription
  const langId = config.language?.id || 'vi';
  const {
    transcript,
    interimTranscript,
    finalTranscript,
    isListening,
    isSupported: isSpeechSupported,
    confidence: speechConfidence,
    currentLanguage: speechLang,
    start: startSpeech,
    stop: stopSpeech,
    reset: resetSpeech,
    switchLanguage,
  } = useSpeechRecognition(langId);

  // ── Sync stream to video element (may be mounted after loading) ──
  useEffect(() => {
    if (stream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isLoading, questions]);

  // ── Start speech recognition when questions are loaded ──
  const speechStartedRef = useRef(false);
  useEffect(() => {
    if (questions.length > 0 && isSpeechSupported && !speechStartedRef.current) {
      speechStartedRef.current = true;
      // Small delay to let browser settle
      const timer = setTimeout(() => {
        startSpeech();
        startRecording();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [questions, isSpeechSupported, startSpeech, startRecording]);

  // ── AI status reactive to user speaking ──
  const silenceTimerRef = useRef(null);
  useEffect(() => {
    if (isSpeaking && isMicOn) {
      // User is speaking → AI is listening
      setAiStatus('listening');
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else if (isMicOn) {
      // User stopped speaking → AI starts "thinking" after 2s silence
      if (!silenceTimerRef.current && aiStatus === 'listening') {
        silenceTimerRef.current = setTimeout(() => {
          setAiStatus('thinking');
          // Then "speaking" (evaluating) after 3s more
          silenceTimerRef.current = setTimeout(() => {
            setAiStatus('speaking');
            silenceTimerRef.current = null;
          }, 3000);
        }, 2000);
      }
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [isSpeaking, isMicOn]);

  // Keep track of currentQuestionIndex using a ref to avoid race conditions when transitioning
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // ── Save transcript as answer for current question ──
  useEffect(() => {
    if (transcript) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestionIndexRef.current]: transcript,
      }));
    }
  }, [transcript]);

  // ── TTS for AI Interviewer speaking ──
  const { speak: speakTts, stop: stopTts, isPlaying: isTtsPlaying, isThinking: isTtsThinking, volume: ttsVolume } = useTextToSpeech(langId);

  useEffect(() => {
    if (questions.length > 0 && !isLoading && !error) {
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion && currentQuestion.content) {
        speakTts(currentQuestion.content);
      }
    }
    return () => stopTts();
  }, [questions, currentQuestionIndex, isLoading, error, speakTts, stopTts]);

  // ── Function to load questions ──
  const loadQuestions = useCallback(async () => {
    if (hasFetchedRef.current) {
      console.log('[InterviewRoom] Skipping duplicate loadQuestions call (StrictMode guard)');
      return;
    }
    hasFetchedRef.current = true;

    try {
      setIsLoading(true);
      setError(null);
      const generated = await generateInterviewQuestions({
        industry: config.industry,
        difficulty: config.difficulty,
        questionType: config.questionType,
        count: config.duration?.estimatedQuestions || 5,
        cvText: config.cvText,
        language: config.language
      });
      setQuestions(generated);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError(err.message || 'Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại kết nối mạng hoặc cấu hình API Key của bạn.');
      hasFetchedRef.current = false; // Allow retry on error
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // Fetch dynamic AI questions on mount
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const totalQuestions = questions.length;

  // ── Timer ──
  useEffect(() => {
    if (isLoading || error) return;
    if (timeRemaining <= 0) {
      handleEndInterview();
      return;
    }
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, isLoading, error]);

  // ── Format time ──
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimeLow = timeRemaining < 120;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  // Helper to compile metrics for the current question
  const compileCurrentQuestionMetrics = useCallback((finalAnswer) => {
    const durationSeconds = Math.max(1, (Date.now() - questionStartTimeRef.current) / 1000);
    const finalCleanAnswer = finalAnswer || '';
    const wordCount = finalCleanAnswer.trim().split(/\s+/).filter(Boolean).length;
    const wpm = Math.round((wordCount / durationSeconds) * 60);
    const fillerStats = countFillerWords(finalCleanAnswer, langId);
    const videoSummary = getVideoSessionSummary();
    const hasTranscript = finalCleanAnswer.trim().length > 0;
    const volumeScore = calculateVolumeScore(currentQuestionVolumeHistory.current, hasTranscript);
    const pitchStabilityScore = calculatePitchStability(currentQuestionPitchHistory.current);
    
    const confidenceScore = Math.round(
      0.4 * videoSummary.eyeContactPercent +
      0.2 * videoSummary.headPosePercent +
      0.2 * volumeScore +
      0.2 * pitchStabilityScore
    );
    
    return {
      duration: Math.round(durationSeconds),
      wpm,
      hesitations: Object.keys(fillerStats.details).filter(k => fillerStats.details[k] > 0),
      hesitationCount: fillerStats.total,
      silenceDuration: Math.round(silenceAccumulatorRef.current),
      eyeContactPercent: videoSummary.eyeContactPercent,
      headPosePercent: videoSummary.headPosePercent,
      volumeLevel: volumeScore,
      pitchStability: pitchStabilityScore,
      calculatedConfidence: confidenceScore
    };
  }, [langId, getVideoSessionSummary]);

  // ── Handlers ──
  const handleEndInterview = async () => {
    stopTts();
    setIsTranscribing(true);
    // Stop recording and get final blob
    const audioBlob = await stopRecordingAndGetBlob();
    let finalAnswer = transcript;

    if (audioBlob && audioBlob.size > 2000) {
      try {
        console.log('[InterviewRoom] Transcribing final answer with Whisper...');
        const whisperTranscript = await transcribeAudio(audioBlob, langId);
        if (whisperTranscript && whisperTranscript.trim().length > 0 && !isWhisperHallucination(whisperTranscript)) {
          finalAnswer = fixITVocabulary(whisperTranscript);
          console.log('[InterviewRoom] Whisper final answer success (fixed):', finalAnswer);
        } else if (isWhisperHallucination(whisperTranscript)) {
          console.log('[InterviewRoom] Whisper final answer detected as prompt hallucination, clearing answer');
          if (!transcript || transcript.trim().length === 0) {
            finalAnswer = '';
          }
        }
      } catch (err) {
        console.warn('[InterviewRoom] Whisper final transcription failed, using fallback:', err);
      }
    }

    const finalAnswers = { ...answers };
    finalAnswers[currentQuestionIndex] = finalAnswer;

    const finalMetrics = { ...allQuestionMetrics };
    finalMetrics[currentQuestionIndex] = compileCurrentQuestionMetrics(finalAnswer);

    // Stop all media
    stopSpeech();
    stopMedia();
    setIsTranscribing(false);

    // Build question-answer pairs for scoring
    const questionAnswerPairs = questions.map((q, idx) => ({
      question: q.content,
      answer: finalAnswers[idx] || '',
      type: q.type,
      difficulty: q.difficulty,
      metrics: finalMetrics[idx] || {
        duration: 0,
        wpm: 0,
        hesitations: [],
        hesitationCount: 0,
        silenceDuration: 0,
        eyeContactPercent: 100,
        headPosePercent: 100,
        volumeLevel: 0,
        pitchStability: 100,
        calculatedConfidence: 100
      }
    }));

    navigate('/interview/result/mock-result-001', {
      state: {
        config,
        totalQuestions,
        answeredQuestions: currentQuestionIndex + 1,
        questionAnswerPairs,
      }
    });
  };

  const handleNextQuestion = async () => {
    stopTts();
    if (currentQuestionIndex < totalQuestions - 1) {
      setIsTranscribing(true);
      const audioBlob = await stopRecordingAndGetBlob();
      
      let finalAnswer = transcript;
      if (audioBlob && audioBlob.size > 2000) {
        try {
          console.log('[InterviewRoom] Transcribing answer with Whisper...');
          const whisperTranscript = await transcribeAudio(audioBlob, langId);
          if (whisperTranscript && whisperTranscript.trim().length > 0 && !isWhisperHallucination(whisperTranscript)) {
            finalAnswer = fixITVocabulary(whisperTranscript);
            console.log('[InterviewRoom] Whisper transcription success (fixed):', finalAnswer);
          } else if (isWhisperHallucination(whisperTranscript)) {
            console.log('[InterviewRoom] Whisper transcription detected as prompt hallucination, clearing answer');
            if (!transcript || transcript.trim().length === 0) {
              finalAnswer = '';
            }
          }
        } catch (err) {
          console.warn('[InterviewRoom] Whisper transcription failed, using fallback:', err);
        }
      }
      
      setAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: finalAnswer,
      }));

      // Compile and store metrics for this question
      const questionMetrics = compileCurrentQuestionMetrics(finalAnswer);
      setAllQuestionMetrics(prev => ({
        ...prev,
        [currentQuestionIndex]: questionMetrics
      }));
      
      setIsTranscribing(false);

      setQuestionTransition(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestionTransition(false);
        setAiStatus('listening');
        // Reset transcript for new question
        resetSpeech();
        
        // Reset statistics for the next question
        questionStartTimeRef.current = Date.now();
        currentQuestionVolumeHistory.current = [];
        currentQuestionPitchHistory.current = [];
        currentQuestionSilenceTicks.current = 0;
        silenceAccumulatorRef.current = 0;
        resetVideoSession();

        // Start recording for next question
        startRecording();
      }, 300);
    } else {
      await handleEndInterview();
    }
  };


  const aiStatusLabels = {
    listening: 'Đang lắng nghe...',
    thinking: 'Đang phân tích...',
    speaking: 'Đang đánh giá...',
  };

  // ── Loading Screen ──
  if (isLoading) {
    return (
      <div className="interview-theme room-theme room-loading-screen">
        <div className="iv-grid-bg" />
        <div className="room-loading-content iv-glass iv-animate-scale">
          <Loader2 className="room-loading-spinner iv-spin" size={48} />
          <h3 className="room-loading-title">Khởi tạo phòng phỏng vấn AI</h3>
          <p className="room-loading-desc">
            AI đang phân tích yêu cầu{config.mode === 'cv-based' ? ' và CV của bạn' : ''} để thiết lập bộ câu hỏi phỏng vấn thông minh...
          </p>
        </div>
      </div>
    );
  }

  // ── Error Screen ──
  if (error) {
    return (
      <div className="interview-theme room-theme room-error-screen">
        <div className="iv-grid-bg" />
        <div className="room-error-content iv-glass iv-animate-scale">
          <div className="room-error-icon-wrapper">
            <AlertTriangle className="room-error-icon" size={44} />
          </div>
          <h3 className="room-error-title">Lỗi kết nối máy chủ AI</h3>
          <p className="room-error-desc">{error}</p>
          <div className="room-error-actions">
            <button className="iv-btn iv-btn--primary" onClick={loadQuestions}>
              Thử lại
            </button>
            <button className="iv-btn iv-btn--ghost" onClick={() => navigate('/interview/setup', { state: config })}>
              Quay lại thiết lập
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-theme room-theme">
      <div className="iv-grid-bg" />

      {/* ── Permission Warning Banner ── */}
      {permissionError && (
        <div className="room-permission-banner">
          <AlertCircle size={16} />
          <span>{permissionError}</span>
        </div>
      )}

      {/* ── Speech Not Supported Banner ── */}
      {!isSpeechSupported && (
        <div className="room-permission-banner room-permission-banner--info">
          <AlertCircle size={16} />
          <span>Trình duyệt không hỗ trợ phiên âm giọng nói. Vui lòng sử dụng Google Chrome để có trải nghiệm tốt nhất.</span>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="room-topbar">
        <div className="room-topbar__left">
          <div className={`room-recording ${isRecording ? 'room-recording--active' : ''}`}>
            <Circle size={8} fill="currentColor" />
            <span>REC</span>
          </div>
          <ConnectionIndicator quality={connectionQuality} />
        </div>

        <div className="room-topbar__center">
          <div className={`room-timer ${isTimeLow ? 'room-timer--low' : ''}`}>
            <Clock size={16} />
            <span>{formatTime(timeRemaining)}</span>
          </div>
          <div className="room-progress-text">
            Câu {currentQuestionIndex + 1}/{totalQuestions}
          </div>
        </div>

        <div className="room-topbar__right">
          {/* Candidate Mini Card */}
          <div className="room-candidate-card">
            <div className="room-candidate-card__avatar">
              <User size={14} />
            </div>
            <span className="room-candidate-card__name">Ứng viên</span>
            {config.industry && (
              <span className="iv-badge iv-badge--info">{config.industry.nameVi}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="room-progress-bar">
        <div className="room-progress-bar__fill" style={{ width: `${progress}%` }} />
      </div>

      {/* ── Main Content ── */}
      <div className="room-main">
        {/* Left: AI Panel */}
        <div className="room-panel room-panel--ai">
          <div className="room-ai-section">
            <div className="room-preview-box">
              <AvatarPanel 
                isPlaying={isTtsPlaying} 
                volume={ttsVolume} 
                isThinking={isTtsThinking} 
              />
            </div>
            
            <div className="room-ai-label">
              <Bot size={16} />
              <span>AI Interviewer</span>
            </div>
            <p className="room-ai-status">
              {isTtsThinking ? 'AI đang chuẩn bị phát âm...' : isTtsPlaying ? 'AI đang nói...' : aiStatusLabels[aiStatus]}
            </p>

            {/* ChatGPT Voice Speech Bubble — always mounted, visibility toggled to prevent layout jitter */}
            <div
              className={`room-ai-bubble ${aiStatus === 'speaking' ? 'room-ai-bubble--speaking' : ''}`}
              style={{
                visibility: aiStatus === 'speaking' && questions[currentQuestionIndex]?.content ? 'visible' : 'hidden',
                height: aiStatus === 'speaking' && questions[currentQuestionIndex]?.content ? 'auto' : '0',
                padding: aiStatus === 'speaking' && questions[currentQuestionIndex]?.content ? undefined : '0',
                margin: aiStatus === 'speaking' && questions[currentQuestionIndex]?.content ? undefined : '0',
                overflow: 'hidden',
              }}
            >
              {questions[currentQuestionIndex]?.content || ''}
            </div>

            {/* Speaking indicator — always mounted, opacity toggled */}
            <div
              className="room-speaking-indicator"
              style={{
                opacity: isSpeaking && isMicOn ? 1 : 0,
                pointerEvents: isSpeaking && isMicOn ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
              }}
            >
              <Volume2 size={14} />
              <span>Đang phát hiện giọng nói...</span>
            </div>
          </div>
        </div>

        {/* Right: Candidate Video */}
        <div className="room-panel room-panel--video">
          <div className="room-candidate-section">
            <div className="room-preview-box">
              {/* Video element always stays mounted to preserve srcObject */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`room-video-element ${!isVideoOn ? 'room-video-element--hidden' : ''}`}
              />

              {/* Real-time Face Feedback Overlay */}
              {isVideoOn && stream && isVideoLibraryLoaded && (
                <div className="room-face-feedback">
                  <span className={`face-badge ${videoMetrics.eyeContact ? 'face-badge--good' : 'face-badge--warn'}`}>
                    👁️ {videoMetrics.eyeContact ? 'Giao tiếp mắt tốt' : 'Hãy nhìn camera'}
                  </span>
                  {videoMetrics.pitch > 28 && (
                    <span className="face-badge face-badge--warn">
                      ⚠️ Tránh cúi đầu quá thấp
                    </span>
                  )}
                  {videoMetrics.pitch < -28 && (
                    <span className="face-badge face-badge--warn">
                      ⚠️ Tránh ngước đầu quá cao
                    </span>
                  )}
                  {videoMetrics.isSmiling && (
                    <span className="face-badge face-badge--smile">
                      😊 Nụ cười thân thiện
                    </span>
                  )}
                </div>
              )}

              {/* Fallback if no stream yet */}
              {!stream && isVideoOn && (
                <div className="room-video-placeholder">
                  <User size={48} />
                  <span>Đang kết nối camera...</span>
                </div>
              )}
              {/* Camera off overlay */}
              {!isVideoOn && (
                <div className="room-video-off">
                  <VideoOff size={32} />
                  <span>Camera đã tắt</span>
                </div>
              )}

              {/* Recording border glow */}
              {isRecording && <div className="room-video-glow" />}
            </div>

            {/* Real Audio Waveform */}
            <div className="room-waveform-container">
              <Volume2 size={14} className="room-waveform-icon" />
              <AudioWaveform bars={bars} isMicOn={isMicOn} />
              {isMicOn && (
                <span className="room-volume-level">{volume}%</span>
              )}
            </div>

            {/* Media Controls */}
            <div className="room-media-controls">
              <button
                className={`room-media-btn ${!isMicOn ? 'room-media-btn--off' : ''}`}
                onClick={toggleMic}
                title={isMicOn ? 'Tắt micro' : 'Bật micro'}
              >
                {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <button
                className={`room-media-btn ${!isVideoOn ? 'room-media-btn--off' : ''}`}
                onClick={toggleVideo}
                title={isVideoOn ? 'Tắt camera' : 'Bật camera'}
              >
                {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Question Display ── */}
      <div className="room-question-area">
        <div className="room-question-label">
          <MessageSquare size={16} />
          <span>Câu hỏi {currentQuestionIndex + 1}</span>
          {config.difficulty && (
            <span className={`iv-badge iv-badge--${config.difficulty.id === 'easy' ? 'success' : config.difficulty.id === 'medium' ? 'warning' : 'danger'}`}>
              {config.difficulty.name}
            </span>
          )}
        </div>
        <div className={`room-question-text ${questionTransition ? 'room-question-text--exit' : ''}`}>
          {questions[currentQuestionIndex]?.content || 'Đang tải câu hỏi...'}
        </div>
      </div>

      {/* ── Live Transcription Box ── */}
      <div className="room-transcription">
        <div className="room-transcription__header">
          <Sparkles size={14} />
          <span>Phiên âm trực tiếp</span>
          <span className="room-transcription__tip">
            (Chỉ để xem trước — Hệ thống sẽ dùng AI Whisper để chuẩn hóa chính xác khi chuyển câu)
          </span>
          {isListening && (
            <span className="room-transcription__live-badge">LIVE</span>
          )}
          {!isSpeechSupported && (
            <span className="room-transcription__unsupported">Không khả dụng</span>
          )}
          <button 
            className="room-transcription__lang-badge"
            onClick={() => switchLanguage(speechLang === 'en' ? 'vi' : 'en')}
            title="Nhấn để đổi ngôn ngữ nhận diện"
          >
            {speechLang === 'en' ? '🇺🇸 English' : '🇻🇳 Tiếng Việt'}
          </button>
          {speechConfidence > 0 && transcript && (
            <span className={`room-transcription__confidence ${speechConfidence > 85 ? 'high' : speechConfidence > 60 ? 'medium' : 'low'}`}>
              Độ chính xác: {speechConfidence}%
            </span>
          )}
        </div>
        <div className="room-transcription__text">
          {transcript ? (
            <>
              <span className="room-transcription__final">{finalTranscript}</span>
              <span className="room-transcription__interim">{interimTranscript}</span>
            </>
          ) : (
            <span className="room-transcription__placeholder">
              {isSpeechSupported
                ? 'Hãy nói câu trả lời của bạn, nội dung sẽ được phiên âm tại đây...'
                : 'Phiên âm không khả dụng — trình duyệt không hỗ trợ Web Speech API.'
              }
            </span>
          )}
          {isListening && <span className="room-transcription__cursor" />}
        </div>
      </div>

      {/* ── Bottom Actions ── */}
      <div className="room-bottom-actions">
        <button
          className="iv-btn iv-btn--danger"
          onClick={() => setShowEndModal(true)}
        >
          <PhoneOff size={16} />
          Kết thúc
        </button>
        <button
          className="iv-btn iv-btn--primary"
          onClick={handleNextQuestion}
        >
          {currentQuestionIndex < totalQuestions - 1 ? (
            <>
              Câu tiếp theo
              <SkipForward size={16} />
            </>
          ) : (
            <>
              Hoàn thành
              <Sparkles size={16} />
            </>
          )}
        </button>
      </div>

      {/* ── End Confirmation Modal ── */}
      {showEndModal && (
        <div className="room-modal-overlay" onClick={() => setShowEndModal(false)}>
          <div className="room-modal" onClick={e => e.stopPropagation()}>
            <div className="room-modal__icon room-modal__icon--warning">
              <AlertTriangle size={28} />
            </div>
            <h3 className="room-modal__title">Kết thúc phỏng vấn?</h3>
            <p className="room-modal__desc">
              Bạn đã trả lời {currentQuestionIndex + 1}/{totalQuestions} câu hỏi.
              Kết quả sẽ được tính dựa trên các câu đã trả lời.
            </p>
            <div className="room-modal__actions">
              <button className="iv-btn iv-btn--ghost" onClick={() => setShowEndModal(false)}>
                Tiếp tục phỏng vấn
              </button>
              <button className="iv-btn iv-btn--danger" onClick={handleEndInterview}>
                Kết thúc ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transcribing Overlay ── */}
      {isTranscribing && (
        <div className="room-transcribing-overlay">
          <div className="room-transcribing-content iv-glass iv-animate-scale">
            <Loader2 className="room-transcribing-spinner iv-spin" size={40} />
            <h4 className="room-transcribing-title">Đang tối ưu hóa câu trả lời</h4>
            <p className="room-transcribing-desc">Groq Whisper Large V3 đang chuẩn hóa bản dịch...</p>
          </div>
        </div>
      )}
    </div>
  );
}
