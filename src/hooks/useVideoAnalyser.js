import { useState, useEffect, useRef, useCallback } from 'react';

// Link CDN của MediaPipe FaceMesh
const FACEMESH_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';

function loadCDNStyleAndScript() {
  return new Promise((resolve, reject) => {
    // Nếu đã tải sẵn rồi
    if (window.FaceMesh) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = FACEMESH_CDN;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (window.FaceMesh) {
        resolve();
      } else {
        reject(new Error('MediaPipe FaceMesh script loaded but global object not found.'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load FaceMesh from CDN'));
    document.head.appendChild(script);
  });
}

// Hàm tính khoảng cách 3D giữa 2 điểm landmark
function getDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z || 0;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function useVideoAnalyser() {
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  
  // Trạng thái tức thời
  const [currentMetrics, setCurrentMetrics] = useState({
    eyeContact: true,
    yaw: 0,
    pitch: 0,
    roll: 0,
    isSmiling: false,
    isBlinking: false
  });

  const faceMeshRef = useRef(null);
  const activeStreamVideoRef = useRef(null);
  const animationFrameRef = useRef(null);
  const processingTimerRef = useRef(null);
  
  // Biến lưu trữ lịch sử để tính tổng hợp
  const sessionStatsRef = useRef({
    totalFrames: 0,
    eyeContactFrames: 0,
    straightHeadFrames: 0, // Đầu thẳng (yaw và pitch ở mức bình thường)
    smileFrames: 0,
    blinkCount: 0,
    isEyeClosedLastFrame: false
  });

  // Tải thư viện FaceMesh khi hook khởi tạo
  useEffect(() => {
    loadCDNStyleAndScript()
      .then(() => {
        setIsLibraryLoaded(true);
        console.log('[useVideoAnalyser] MediaPipe FaceMesh loaded successfully from CDN');
      })
      .catch((err) => {
        setLoadingError(err.message);
        console.error('[useVideoAnalyser] Error loading MediaPipe:', err);
      });

    return () => {
      stopAnalysis();
    };
  }, []);

  // Thiết lập FaceMesh
  const initFaceMesh = useCallback(() => {
    if (!window.FaceMesh) return null;
    
    try {
      const faceMesh = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

      faceMesh.setOptions({
        maxNumFaces: 4,
        refineLandmarks: true, // Cực kỳ quan trọng để có iris (con ngươi)
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults((results) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          // Tìm khuôn mặt to nhất (gần camera nhất) để tránh bị nhiễu bởi người đứng sau
          let largestFaceLandmarks = results.multiFaceLandmarks[0];
          let maxFaceWidth = 0;

          for (const landmarks of results.multiFaceLandmarks) {
            const leftCheek = landmarks[234];
            const rightCheek = landmarks[454];
            if (leftCheek && rightCheek) {
              const width = Math.sqrt(
                Math.pow(leftCheek.x - rightCheek.x, 2) +
                Math.pow(leftCheek.y - rightCheek.y, 2)
              );
              if (width > maxFaceWidth) {
                maxFaceWidth = width;
                largestFaceLandmarks = landmarks;
              }
            }
          }

          analyzeLandmarks(largestFaceLandmarks);
        } else {
          // Không phát hiện thấy mặt
          setCurrentMetrics(prev => ({
            ...prev,
            eyeContact: false
          }));
        }
      });

      faceMeshRef.current = faceMesh;
      return faceMesh;
    } catch (e) {
      console.error('[useVideoAnalyser] Failed to initialize FaceMesh:', e);
      return null;
    }
  }, []);

  // Hàm xử lý toán học các landmark
  const analyzeLandmarks = (landmarks) => {
    // ── 1. Tính toán tư thế đầu (Yaw, Pitch, Roll) ──
    const noseTip = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const forehead = landmarks[10];
    const chin = landmarks[152];
    const leftEyeCorner = landmarks[33];
    const rightEyeCorner = landmarks[263];

    // Yaw (quay đầu sang trái/phải): Đo độ bất đối xứng của mũi với hai bên má
    const dxLeft = Math.abs(noseTip.x - leftCheek.x);
    const dxRight = Math.abs(rightCheek.x - noseTip.x);
    const totalWidth = dxLeft + dxRight;
    const yaw = totalWidth > 0 ? ((dxLeft / totalWidth) - 0.5) * 160 : 0; // độ lệch x 160

    // Pitch (cúi/ngước đầu): Tỷ lệ khoảng cách từ mũi lên trán so với khoảng cách tổng
    const dyUpper = Math.abs(noseTip.y - forehead.y);
    const dyLower = Math.abs(chin.y - noseTip.y);
    const totalHeight = dyUpper + dyLower;
    // Điểm hiệu chỉnh (calibration offset): bình thường mũi nằm thấp hơn trung tâm một chút (~0.42)
    const pitch = totalHeight > 0 ? ((dyUpper / totalHeight) - 0.42) * 160 : 0;

    // Roll (nghiêng đầu): Độ dốc của trục nối hai khóe mắt ngoài
    const dyRoll = rightEyeCorner.y - leftEyeCorner.y;
    const dxRoll = rightEyeCorner.x - leftEyeCorner.x;
    const roll = Math.atan2(dyRoll, dxRoll) * (180 / Math.PI);

    // ── 2. Tính toán giao tiếp mắt (Eye Contact) ──
    // Các mốc mắt trái: Khóe mắt trong 133, ngoài 33. Con ngươi tâm: 468
    const irisLeft = landmarks[468];
    const lOffset = irisLeft.x - (leftEyeCorner.x + landmarks[133].x) / 2;
    const lWidth = getDistance(leftEyeCorner, landmarks[133]);
    const lRatio = lWidth > 0 ? lOffset / lWidth : 0;

    // Các mốc mắt phải: Khóe mắt trong 362, ngoài 263. Con ngươi tâm: 473
    const irisRight = landmarks[473];
    const rOffset = irisRight.x - (landmarks[362].x + rightEyeCorner.x) / 2;
    const rWidth = getDistance(landmarks[362], rightEyeCorner);
    const rRatio = rWidth > 0 ? rOffset / rWidth : 0;

    const avgGazeRatio = (lRatio + rRatio) / 2;

    // Phán đoán giao tiếp mắt: Người dùng nhìn camera khi đầu thẳng và mắt hướng thẳng
    // Ngưỡng yaw/pitch để xem là đầu có hướng về phía camera hay không: ±28 độ
    const isHeadStraight = Math.abs(yaw) < 28 && Math.abs(pitch) < 28;
    // Độ lệch con ngươi nằm trong ngưỡng cho phép (khoảng ±0.22)
    const isGazeStraight = Math.abs(avgGazeRatio) < 0.22;
    const eyeContact = isHeadStraight && isGazeStraight;

    // ── 3. Đo chớp mắt (Blink Rate) bằng EAR (Eye Aspect Ratio) ──
    // EAR = (khoảng cách đứng) / (khoảng cách ngang)
    const earLeft = getDistance(landmarks[159], landmarks[145]) / getDistance(leftEyeCorner, landmarks[133]);
    const earRight = getDistance(landmarks[386], landmarks[374]) / getDistance(landmarks[362], rightEyeCorner);
    const avgEAR = (earLeft + earRight) / 2;
    
    // Mắt nhắm khi EAR tụt xuống dưới 0.16
    const isEyeClosedNow = avgEAR < 0.16;
    let isBlinking = false;

    // Phát hiện sườn lên (chớp mắt xong mở mắt ra)
    if (sessionStatsRef.current.isEyeClosedLastFrame && !isEyeClosedNow) {
      sessionStatsRef.current.blinkCount += 1;
      isBlinking = true;
    }
    sessionStatsRef.current.isEyeClosedLastFrame = isEyeClosedNow;

    // ── 4. Đo nụ cười (Smile Detection) ──
    // Đo chiều ngang của môi (landmark 61 và 291) chia cho khoảng cách má (234 và 454)
    const mouthWidth = getDistance(landmarks[61], landmarks[291]);
    const faceWidth = getDistance(leftCheek, rightCheek);
    const smileRatio = faceWidth > 0 ? mouthWidth / faceWidth : 0;
    // Khẩu hình cười thường có tỷ lệ rộng môi/má > 0.31
    const isSmiling = smileRatio > 0.31;

    // ── 5. Cập nhật trạng thái tức thời và lũy kế ──
    setCurrentMetrics({
      eyeContact,
      yaw: Math.round(yaw),
      pitch: Math.round(pitch),
      roll: Math.round(roll),
      isSmiling,
      isBlinking: isEyeClosedNow
    });

    // Cộng dồn chỉ số phiên
    const stats = sessionStatsRef.current;
    stats.totalFrames += 1;
    if (eyeContact) stats.eyeContactFrames += 1;
    if (isHeadStraight) stats.straightHeadFrames += 1;
    if (isSmiling) stats.smileFrames += 1;
  };

  // Vòng lặp xử lý camera (giới hạn 5 FPS để tiết kiệm CPU)
  const processFrame = useCallback(async () => {
    const video = activeStreamVideoRef.current;
    if (!video) return; // Đã dừng phân tích hoàn toàn

    if (video.paused || video.ended || !faceMeshRef.current) {
      // Nếu video chưa sẵn sàng hoặc thư viện chưa load xong, thử lại sau 200ms
      processingTimerRef.current = setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }, 200);
      return;
    }

    try {
      // Gửi ảnh sang MediaPipe để nhận kết quả
      await faceMeshRef.current.send({ image: video });
    } catch (e) {
      console.warn('[useVideoAnalyser] Error processing video frame:', e.message);
    }

    // Đợi 200ms trước khi xử lý frame tiếp theo (~5 FPS)
    processingTimerRef.current = setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }, 200);
  }, []);

  // Bắt đầu quá trình phân tích
  const startAnalysis = useCallback((videoElement) => {
    if (!isLibraryLoaded) {
      console.warn('[useVideoAnalyser] MediaPipe library not loaded yet');
      return;
    }

    // Dừng tiến trình cũ nếu có
    stopAnalysis();

    activeStreamVideoRef.current = videoElement;
    
    if (!faceMeshRef.current) {
      const initSuccess = initFaceMesh();
      if (!initSuccess) return;
    }

    console.log('[useVideoAnalyser] Starting analysis at 5 FPS');
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isLibraryLoaded, initFaceMesh, processFrame]);

  // Dừng quá trình phân tích
  const stopAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    activeStreamVideoRef.current = null;
  }, []);

  // Trích xuất báo cáo phiên phỏng vấn
  const getSessionSummary = useCallback(() => {
    const stats = sessionStatsRef.current;
    if (stats.totalFrames === 0) {
      return {
        eyeContactPercent: 100,
        headPosePercent: 100,
        smilePercent: 0,
        blinkCount: 0
      };
    }

    return {
      eyeContactPercent: Math.round((stats.eyeContactFrames / stats.totalFrames) * 100),
      headPosePercent: Math.round((stats.straightHeadFrames / stats.totalFrames) * 100),
      smilePercent: Math.round((stats.smileFrames / stats.totalFrames) * 100),
      blinkCount: stats.blinkCount
    };
  }, []);

  // Reset thống kê để dùng cho câu hỏi mới
  const resetSession = useCallback(() => {
    sessionStatsRef.current = {
      totalFrames: 0,
      eyeContactFrames: 0,
      straightHeadFrames: 0,
      smileFrames: 0,
      blinkCount: 0,
      isEyeClosedLastFrame: false
    };
    setCurrentMetrics({
      eyeContact: true,
      yaw: 0,
      pitch: 0,
      roll: 0,
      isSmiling: false,
      isBlinking: false
    });
  }, []);

  return {
    isLibraryLoaded,
    loadingError,
    currentMetrics,
    startAnalysis,
    stopAnalysis,
    getSessionSummary,
    resetSession
  };
}
