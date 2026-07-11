import { useState, useEffect, useRef, useCallback } from 'react';
import { getElevenLabsTtsUrl } from '../utils/elevenLabsTtsService';
import { getTtsAudioUrl } from '../utils/iteraTtsService';
import { getGoogleTtsAudioUrl } from '../utils/googleTtsService';
import { getGroqTtsAudioUrl } from '../utils/groqTtsService';
import { getGoogleCloudTtsAudioUrl } from '../utils/googleCloudTtsService';

export function useTextToSpeech(initialLang = 'vi') {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [volume, setVolume] = useState(0);

  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const simIntervalRef = useRef(null);

  const stop = useCallback(() => {
    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    // Stop native speechSynthesis if speaking
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Stop simulated speech volume intervals
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    // Stop animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsPlaying(false);
    setIsThinking(false);
    setVolume(0);
  }, []);

  const speak = useCallback(async (text, lang = initialLang) => {
    // Stop any currently playing audio
    stop();

    try {
      setIsThinking(true);
      
      let audioUrl;
      let useFallback = false;

      // Build a prioritized list of TTS providers based on language
      const providers = [];

      if (lang === 'vi') {
        // Vietnamese: Google Cloud TTS (WaveNet) → Itera → Google Translate → ElevenLabs
        providers.push({ name: 'Google Cloud TTS', fn: () => getGoogleCloudTtsAudioUrl(text, lang) });
        providers.push({ name: 'Itera TTS', fn: () => getTtsAudioUrl(text, lang) });
        providers.push({ name: 'Google Translate TTS', fn: () => getGoogleTtsAudioUrl(text, lang) });
        providers.push({ name: 'ElevenLabs TTS', fn: () => getElevenLabsTtsUrl(text, lang) });
      } else {
        // English: Groq Orpheus → Google Cloud TTS → ElevenLabs → Itera → Google Translate
        providers.push({ name: 'Groq TTS', fn: () => getGroqTtsAudioUrl(text, lang) });
        providers.push({ name: 'Google Cloud TTS', fn: () => getGoogleCloudTtsAudioUrl(text, lang) });
        providers.push({ name: 'ElevenLabs TTS', fn: () => getElevenLabsTtsUrl(text, lang) });
        providers.push({ name: 'Itera TTS', fn: () => getTtsAudioUrl(text, lang) });
        providers.push({ name: 'Google Translate TTS', fn: () => getGoogleTtsAudioUrl(text, lang) });
      }

      // Try each provider in order until one succeeds
      for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];
        try {
          console.log(`[useTextToSpeech] Trying ${provider.name}...`);
          audioUrl = await provider.fn();
          console.log(`[useTextToSpeech] ✓ ${provider.name} audio loaded!`);
          break; // Success — stop trying
        } catch (err) {
          const nextProvider = providers[i + 1];
          if (nextProvider) {
            console.warn(`[useTextToSpeech] ${provider.name} failed. Trying ${nextProvider.name}...`, err.message);
          } else {
            console.warn(`[useTextToSpeech] ${provider.name} failed. All TTS APIs exhausted.`, err.message);
            useFallback = true;
          }
        }
      }

      if (useFallback) {
        setIsThinking(false);
        setIsPlaying(true);

        if (!window.speechSynthesis) {
          throw new Error('SpeechSynthesis not supported in this browser');
        }

        // Cancel any ongoing synthesis
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Match language code
        if (lang === 'vi') {
          utterance.lang = 'vi-VN';
        } else {
          utterance.lang = 'en-US';
        }

        // Find and prioritize premium/natural/online/Google voices in the browser list
        const voices = window.speechSynthesis.getVoices();
        const matchingVoices = voices.filter(v => v.lang.toLowerCase().replace('_', '-').startsWith(lang.toLowerCase()));
        
        // Sort matching voices to prioritize high-quality online / natural / Google voices
        matchingVoices.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          
          // Primary: "natural" or "online" or "google"
          const isAPremium = nameA.includes('natural') || nameA.includes('online') || nameA.includes('google');
          const isBPremium = nameB.includes('natural') || nameB.includes('online') || nameB.includes('google');
          
          if (isAPremium && !isBPremium) return -1;
          if (!isAPremium && isBPremium) return 1;
          
          // Secondary: Microsoft Online voices
          const isAMicrosoftOnline = nameA.includes('microsoft') && nameA.includes('online');
          const isBMicrosoftOnline = nameB.includes('microsoft') && nameB.includes('online');
          
          if (isAMicrosoftOnline && !isBMicrosoftOnline) return -1;
          if (!isAMicrosoftOnline && isBMicrosoftOnline) return 1;
          
          return 0;
        });

        if (matchingVoices.length > 0) {
          utterance.voice = matchingVoices[0];
          console.log('[useTextToSpeech] Fallback selected voice:', matchingVoices[0].name);
        }

        // Tuning speaking speed and pitch for more natural sound
        const voiceName = utterance.voice ? utterance.voice.name.toLowerCase() : '';
        if (voiceName.includes('natural') || voiceName.includes('online') || voiceName.includes('google')) {
          utterance.rate = 1.0; // Premium online voices sound best at standard speed
          utterance.pitch = 1.0;
        } else {
          // Offline/robotic voices sound slightly better if slowed down just a bit
          utterance.rate = 0.92;
          utterance.pitch = 1.02;
        }

        utterance.onend = () => {
          stop();
        };

        utterance.onerror = (e) => {
          console.error('[useTextToSpeech] SpeechSynthesis fallback error:', e);
          stop();
        };

        // Simulate volume level for 2D/3D mouth animation
        let hasStartedSpeaking = false;
        let ticksWithoutSpeaking = 0;
        
        simIntervalRef.current = setInterval(() => {
          if (window.speechSynthesis.speaking) {
            hasStartedSpeaking = true;
          } else {
            ticksWithoutSpeaking++;
          }

          // If it started and then stopped, clear it
          if (hasStartedSpeaking && !window.speechSynthesis.speaking) {
            clearInterval(simIntervalRef.current);
            setVolume(0);
            stop(); // Fix for Chrome bug where onend never fires
            return;
          }
          
          // If it never started after 3 seconds (25 ticks), it was probably blocked by the browser
          if (!hasStartedSpeaking && ticksWithoutSpeaking > 25) {
            console.warn('[useTextToSpeech] SpeechSynthesis blocked or hung. Auto-skipping...');
            clearInterval(simIntervalRef.current);
            setVolume(0);
            stop();
            return;
          }
          
          if (!window.speechSynthesis.speaking) return;

          // Simulate dynamic voice modulation
          const simulatedVol = Math.round(30 + Math.random() * 50);
          setVolume(simulatedVol);
        }, 120);

        window.speechSynthesis.speak(utterance);
        return;
      }

      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up AudioContext for volume analysis
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64; // Smaller fftSize for faster response
      analyserRef.current = analyser;

      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!audioRef.current || audio.paused || audio.ended) {
          setVolume(0);
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        
        // Sum frequencies to compute average amplitude
        let sum = 0;
        let activeFrequencies = 0;
        
        // We only care about human speech frequency range (lower to mid bins)
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
          if (dataArray[i] > 0) activeFrequencies++;
        }
        
        const avg = activeFrequencies > 0 ? sum / bufferLength : 0;
        
        // Normalize volume to 0 - 100 range
        const normalizedVolume = Math.min(100, Math.round((avg / 150) * 100));
        setVolume(normalizedVolume);

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      audio.onplay = () => {
        setIsPlaying(true);
        setIsThinking(false);
        // Resume context in case browser blocked autoplay
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        updateVolume();
      };

      audio.onended = () => {
        stop();
      };

      audio.onerror = (e) => {
        console.error('[useTextToSpeech] Audio element error:', e);
        stop();
      };

      // Play audio
      await audio.play();

    } catch (err) {
      console.error('[useTextToSpeech] Error playing TTS:', err);
      stop();
    }
  }, [initialLang, stop]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stop]);

  // Pre-load voices on mount to ensure SpeechSynthesis voices are populated
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const handleVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoices);
      };
    }
  }, []);

  return {
    speak,
    stop,
    isPlaying,
    isThinking,
    volume, // 0 - 100 representing speaking volume
  };
}
