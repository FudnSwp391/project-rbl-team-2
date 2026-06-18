import { useState, useEffect, useRef } from 'react';

/**
 * Thuật toán Tự tương quan (Autocorrelation) dùng để ước tính cao độ (pitch)
 * của giọng nói con người (từ dữ liệu miền thời gian).
 */
function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  let sum = 0;
  for (let i = 0; i < SIZE; i++) {
    sum += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sum / SIZE);
  if (rms < 0.008) {
    return -1; // Tín hiệu quá nhỏ để xác định cao độ
  }

  // Cắt bớt phần rìa tín hiệu nhiễu nhỏ ở đầu và cuối
  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = SIZE - 1; i >= SIZE / 2; i--) {
    if (Math.abs(buffer[i]) < thres) {
      r2 = i;
      break;
    }
  }

  const buf = buffer.subarray(r1, r2);
  const len = buf.length;

  const correlations = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - i; j++) {
      correlations[i] += buf[j] * buf[j + i];
    }
  }

  // Tìm đỉnh đầu tiên sau khi đồ thị đi xuống (dip)
  let d = 0;
  while (d < len - 1 && correlations[d] > correlations[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < len; i++) {
    if (correlations[i] > maxval) {
      maxval = correlations[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;
  if (maxpos > 0 && maxpos < len - 1) {
    const x1 = correlations[maxpos - 1];
    const x2 = correlations[maxpos];
    const x3 = correlations[maxpos + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = maxpos - b / (2 * a);
  }

  const frequency = sampleRate / T0;
  // Giọng nói con người thường nằm trong khoảng tần số 75Hz - 400Hz
  if (frequency > 75 && frequency < 400) {
    return frequency;
  }
  return -1;
}

/**
 * Custom hook sử dụng Web Audio API để phân tích âm lượng và cao độ
 * từ MediaStream (Microphone) của ứng viên trong thời gian thực.
 */
export function useAudioAnalyser(stream, barCount = 7) {
  const [bars, setBars] = useState(() => new Array(barCount).fill(0));
  const [volume, setVolume] = useState(0);
  const [pitch, setPitch] = useState(-1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const sourceRef = useRef(null);

  // Ngưỡng phát hiện tiếng nói (calibrated cho hầu hết micro)
  const SPEAKING_THRESHOLD = 15;

  useEffect(() => {
    if (!stream) return;

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = audioCtx;

    const analyser = audioCtx.createAnalyser();
    // fftSize=2048 để có đủ mẫu tần số phân tích cao độ bằng tự tương quan
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.6;
    analyserRef.current = analyser;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    const timeData = new Float32Array(analyser.fftSize);
    const freqData = new Uint8Array(analyser.frequencyBinCount);

    function tick() {
      if (!analyserRef.current) return;
      
      // 1. Phân tích âm lượng (Volume) từ tần số và miền thời gian
      analyserRef.current.getByteFrequencyData(freqData);
      analyserRef.current.getFloatTimeDomainData(timeData);

      // Phân tích bars: lấy mẫu dải tần số thấp/trung (người nói) quy đổi ra barCount cột
      // Phân phối khoảng 84 bins đầu tiên (0 - 1800Hz) thành barCount bars
      const activeBins = 84;
      const step = Math.floor(activeBins / barCount);
      const newBars = [];
      let freqSum = 0;

      for (let i = 0; i < barCount; i++) {
        let barSum = 0;
        for (let j = 0; j < step; j++) {
          barSum += freqData[i * step + j] || 0;
        }
        const val = barSum / step;
        newBars.push(val);
        freqSum += val;
      }

      const avgVolume = freqSum / barCount;
      const roundedVolume = Math.round(avgVolume);
      setBars(newBars);
      setVolume(roundedVolume);

      const speaking = roundedVolume > SPEAKING_THRESHOLD;
      setIsSpeaking(speaking);

      // 2. Phân tích cao độ (Pitch) nếu ứng viên đang nói
      if (speaking) {
        const detectedPitch = autoCorrelate(timeData, audioCtx.sampleRate);
        setPitch(Math.round(detectedPitch));
      } else {
        setPitch(-1);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        rafRef.current = requestAnimationFrame(tick);
      });
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch (e) {}
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stream, barCount]);

  return { bars, volume, pitch, isSpeaking };
}
