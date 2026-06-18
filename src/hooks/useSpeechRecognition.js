import { useState, useEffect, useRef, useCallback } from 'react';
import { fixITVocabulary } from '../utils/speechUtils';


/**
 * Custom hook for real-time speech-to-text using the Web Speech API.
 * Optimized for Vietnamese and English with robust auto-restart,
 * confidence tracking, and high-accuracy settings.
 */
export function useSpeechRecognition(initialLanguage = 'vi-VN') {
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [confidence, setConfidence] = useState(0);
  
  // Dynamic language state
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);

  const recognitionRef = useRef(null);
  const shouldRestartRef = useRef(false);
  const restartTimerRef = useRef(null);
  const consecutiveErrorsRef = useRef(0);

  // Map language IDs to BCP-47 tags
  const langMap = {
    'vi': 'vi-VN',
    'en': 'en-US',
    'vi-VN': 'vi-VN',
    'en-US': 'en-US',
  };

  const langTag = langMap[currentLanguage] || 'vi-VN';

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[useSpeechRecognition] Web Speech API not supported in this browser');
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();

    // ── Key settings for accuracy ──
    recognition.continuous = true;       // Don't stop after one sentence
    recognition.interimResults = true;   // Show text as user speaks
    recognition.lang = langTag;          // Full BCP-47 locale
    recognition.maxAlternatives = 3;     // More candidates = better accuracy

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      let bestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        // Pick the alternative with highest confidence
        let bestAlternative = result[0];
        for (let j = 1; j < result.length; j++) {
          if (result[j].confidence > bestAlternative.confidence) {
            bestAlternative = result[j];
          }
        }

        if (bestAlternative.confidence > bestConfidence) {
          bestConfidence = bestAlternative.confidence;
        }

        // Apply IT dictionary post-processing
        const processedTranscript = fixITVocabulary(bestAlternative.transcript);

        if (result.isFinal) {
          finalText += processedTranscript + ' ';
        } else {
          interim += processedTranscript;
        }
      }

      if (finalText) {
        setFinalTranscript(prev => prev + finalText);
        consecutiveErrorsRef.current = 0; // Reset error counter on success
      }
      setTranscript(interim);
      if (bestConfidence > 0) {
        setConfidence(Math.round(bestConfidence * 100));
      }
    };

    recognition.onend = () => {
      setIsListening(false);

      // Auto-restart with debounce to prevent rapid-fire restarts
      if (shouldRestartRef.current && consecutiveErrorsRef.current < 5) {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

        // Small delay before restart to let the engine reset
        const delay = Math.min(300 + consecutiveErrorsRef.current * 200, 2000);
        restartTimerRef.current = setTimeout(() => {
          if (shouldRestartRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
              setIsListening(true);
              console.log('[SpeechRecognition] Auto-restarted successfully');
            } catch (e) {
              console.warn('[SpeechRecognition] Auto-restart failed:', e.message);
              consecutiveErrorsRef.current++;
            }
          }
        }, delay);
      }
    };

    recognition.onerror = (event) => {
      console.warn('[SpeechRecognition] Error:', event.error);

      switch (event.error) {
        case 'not-allowed':
          // User denied microphone permission
          setIsSupported(false);
          shouldRestartRef.current = false;
          break;
        case 'no-speech':
          // No speech detected — this is normal, let onend restart
          // Don't count as a real error
          break;
        case 'audio-capture':
          // Microphone not available
          consecutiveErrorsRef.current++;
          break;
        case 'network':
          // Network error (Speech API needs internet for cloud processing)
          consecutiveErrorsRef.current++;
          break;
        case 'aborted':
          // Recognition was aborted — normal during cleanup
          break;
        default:
          consecutiveErrorsRef.current++;
          break;
      }
    };

    // Chrome-specific: improve recognition by signaling speech context
    if (recognition.grammars !== undefined) {
      try {
        const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
        if (SpeechGrammarList) {
          const grammarList = new SpeechGrammarList();
          // JSGF grammar hint for technical IT interview context
          const grammar = '#JSGF V1.0; grammar interview; public <interview> = React | Node | Javascript | Backend | Frontend | Database | SQL | API | HTML | CSS | Java | Python | framework | component | architecture | performance | database | object oriented | design pattern ;';
          grammarList.addFromString(grammar, 1);
          recognition.grammars = grammarList;
        }
      } catch (e) {
        // Grammar list not supported — that's fine
      }
    }

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [langTag]);

  const start = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        shouldRestartRef.current = true;
        consecutiveErrorsRef.current = 0;
        recognitionRef.current.start();
        setIsListening(true);
        console.log(`[SpeechRecognition] Started with language: ${langTag}`);
      } catch (e) {
        console.warn('[SpeechRecognition] Start failed:', e.message);
        // May already be running — try stopping and restarting
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (e2) {
              console.warn('[SpeechRecognition] Restart failed:', e2.message);
            }
          }, 200);
        } catch (e2) {}
      }
    }
  }, [isListening, langTag]);

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    setConfidence(0);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('[SpeechRecognition] Stopped engine during reset to clear buffer');
      } catch (e) {
        console.warn('[SpeechRecognition] Stop during reset failed:', e.message);
      }
    }
  }, []);

  const switchLanguage = useCallback((newLang) => {
    setCurrentLanguage(newLang);
    // Restart recognition automatically with new language
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        // The language will update when the useEffect re-runs
      } catch (e) {}
    }
  }, [isListening]);

  // Full combined text (finalized + current interim)
  const fullTranscript = (finalTranscript + transcript).trim();

  return {
    transcript: fullTranscript,
    interimTranscript: transcript,
    finalTranscript,
    isListening,
    isSupported,
    confidence,
    currentLanguage,
    start,
    stop,
    reset,
    switchLanguage,
  };
}
