import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { AvatarModel } from './AvatarModel';
import { Volume2, Mic, Brain } from 'lucide-react';

// Class-based ErrorBoundary to catch WebGL / Canvas rendering / GLTF loading errors
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[CanvasErrorBoundary] Caught an error rendering 3D Canvas:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function AvatarPanel({ isPlaying = false, volume = 0, isThinking = false }) {
  // Determine current active status
  let statusText = 'ĐANG LẮNG NGHE';
  let statusColor = '#f59e0b'; // Amber for listening
  let StatusIcon = Mic;
  let statusBg = 'rgba(245, 158, 11, 0.15)';
  let statusBorder = 'rgba(245, 158, 11, 0.3)';

  if (isThinking) {
    statusText = 'ĐANG SUY NGHĨ...';
    statusColor = '#818cf8'; // Indigo for thinking
    StatusIcon = Brain;
    statusBg = 'rgba(129, 140, 248, 0.15)';
    statusBorder = 'rgba(129, 140, 248, 0.3)';
  } else if (isPlaying) {
    statusText = 'ĐANG NÓI';
    statusColor = '#3b82f6'; // Blue for speaking
    StatusIcon = Volume2;
    statusBg = 'rgba(59, 130, 246, 0.15)';
    statusBorder = 'rgba(59, 130, 246, 0.3)';
  }

  // Calculate dynamic mouth opening height for 2D fallback
  const mouthScaleY = isPlaying ? 0.3 + (volume / 100) * 1.2 : 0;
  const mouthOpacity = isPlaying ? 1 : 0;

  // Premium 2D fallback (rendered if 3D model fails or is not present yet)
  const fallbackUI = (
    <div className="room-avatar-container" style={containerStyle}>
      {/* Status Indicator Tag */}
      <div style={getStatusBadgeStyle(statusBg, statusBorder, statusColor)}>
        <StatusIcon size={12} className={isPlaying || isThinking ? 'iv-animate-pulse' : ''} />
        <span>{statusText}</span>
      </div>

      {/* Floating Breathing Wrapper for Avatar */}
      <div style={{ width: '100%', height: '100%', position: 'relative', animation: 'avatarFloat 4s ease-in-out infinite' }}>
        <img src="/ai_avatar.png" alt="AI Interviewer" style={avatarImageStyle} />
        
        {/* Dynamic Mouth Overlay */}
        <div style={{
          position: 'absolute',
          top: '38.5%',
          left: '50.1%',
          transform: 'translate(-50%, -50%)',
          width: '24px',
          height: '14px',
          zIndex: 2,
          pointerEvents: 'none',
          opacity: mouthOpacity,
          transition: 'opacity 0.1s ease',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <svg width="20" height="12" viewBox="0 0 20 12" style={{
            transform: `scaleY(${mouthScaleY})`,
            transformOrigin: 'center',
            transition: 'transform 0.05s ease'
          }}>
            <path d="M 0,2 Q 10,12 20,2 Q 10,0 0,2 Z" fill="#2d0a0a" />
            <path d="M 4,7 Q 10,12 16,7 Q 10,6 4,7 Z" fill="#ff7f7f" />
            <path d="M 2,3 Q 10,6 18,3" stroke="#ffffff" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      </div>

      <div style={bottomLabelStyle}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', letterSpacing: '0.02em' }}>
          AI Interviewer (2D Mode)
        </span>
      </div>
    </div>
  );

  return (
    <div className="room-avatar-container" style={containerStyle}>
      <CanvasErrorBoundary fallback={fallbackUI}>
        {/* 1. Status Indicator Tag */}
        <div style={getStatusBadgeStyle(statusBg, statusBorder, statusColor)}>
          <StatusIcon size={12} className={isPlaying || isThinking ? 'iv-animate-pulse' : ''} />
          <span>{statusText}</span>
        </div>

        {/* 3D WebGL Canvas */}
        <Canvas
          camera={{ position: [0, 0.22, 1.05], fov: 38 }}
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          style={{ background: 'radial-gradient(circle, #252836 0%, #171821 100%)', borderRadius: '16px' }}
        >
          <ambientLight intensity={1.8} />
          <directionalLight
            position={[2, 3, 2.5]}
            intensity={2.8}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.0001}
          />
          <directionalLight position={[-2, 2, -2]} intensity={2.0} color="#6366f1" />
          <directionalLight position={[-2, 1, 1]} intensity={1.5} />
          <pointLight position={[0, 0.2, 0.8]} intensity={1.2} distance={2} />
          
          <Suspense fallback={null}>
            <AvatarModel isPlaying={isPlaying} volume={volume} />
          </Suspense>
        </Canvas>

        {/* Bottom Label overlayed on 3D Canvas */}
        <div style={bottomLabelStyle}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', letterSpacing: '0.02em' }}>
            AI Interviewer
          </span>
        </div>
      </CanvasErrorBoundary>

      <style>{`
        @keyframes avatarFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

const getStatusBadgeStyle = (statusBg, statusBorder, statusColor) => ({
  position: 'absolute',
  top: '16px',
  left: '16px',
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '20px',
  background: statusBg,
  border: `1px solid ${statusBorder}`,
  backdropFilter: 'blur(8px)',
  color: statusColor,
  fontSize: '11px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  transition: 'all 0.3s ease'
});

const containerStyle = {
  width: '100%',
  height: '100%',
  position: 'relative',
  background: 'radial-gradient(circle, #252836 0%, #171821 100%)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const avatarImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const bottomLabelStyle = {
  position: 'absolute',
  bottom: '16px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(23, 24, 33, 0.75)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '6px 18px',
  borderRadius: '20px',
  zIndex: 10,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
};
