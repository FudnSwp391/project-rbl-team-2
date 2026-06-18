import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing webcam and microphone streams.
 * Uses getUserMedia to access real camera + mic.
 */
export function useMediaDevices() {
  const [stream, setStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [permissionError, setPermissionError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Request media access on mount
  useEffect(() => {
    let cancelled = false;

    async function initMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 400 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // Optimize for speech recognition clarity
            channelCount: 1,               // Mono is better for speech
            sampleRate: { ideal: 16000 },   // 16kHz is ideal for speech-to-text
            sampleSize: { ideal: 16 },      // 16-bit audio
            latency: { ideal: 0.01 },       // Low latency for real-time
          }
        });

        if (cancelled) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);
        setPermissionError(null);

        // Attach to video element if available
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('[useMediaDevices] Permission error:', err);
        if (!cancelled) {
          setPermissionError(
            err.name === 'NotAllowedError'
              ? 'Bạn chưa cấp quyền sử dụng Camera/Microphone. Vui lòng cấp quyền trong trình duyệt.'
              : err.name === 'NotFoundError'
              ? 'Không tìm thấy Camera hoặc Microphone trên thiết bị.'
              : `Lỗi truy cập thiết bị: ${err.message}`
          );
        }
      }
    }

    initMedia();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Bind stream to video element when both are ready
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicOn(prev => !prev);
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(prev => !prev);
    }
  }, []);

  // Cleanup all tracks
  const stopAll = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  return {
    stream,
    videoRef,
    isMicOn,
    isVideoOn,
    permissionError,
    toggleMic,
    toggleVideo,
    stopAll,
  };
}
