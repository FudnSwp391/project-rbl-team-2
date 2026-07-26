import React, { useRef, useEffect } from 'react';
const interviewerVideo = "https://hitcsegxyxvxpyusfyge.supabase.co/storage/v1/object/public/videos/M_t_ng__i_ph_ng_v_n_n___chuy_n.mp4";

export function AvatarPanel({ isPlaying = false, volume = 0, isThinking = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        // Phát lại clip từ giây số 1
        videoRef.current.currentTime = 1;
        videoRef.current.play().catch(e => console.log('Video play error:', e));
      } else {
        // Tạm dừng và quay về giây số 1 (trạng thái nghỉ) thay vì nhảy đến cuối clip
        // Điều này giúp trình duyệt không phải load lại frame cuối, xử lý ngay lập tức (không bị chậm)
        videoRef.current.currentTime = 1;
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div className="room-avatar-container" style={containerStyle}>
      {/* Video representing the AI Interviewer */}
      <video 
        ref={videoRef}
        src={interviewerVideo}
        autoPlay
        loop
        muted
        playsInline
        style={avatarImageStyle}
      />
    </div>
  );
}

const containerStyle = {
  width: '100%',
  height: '100%',
  position: 'relative',
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden'
};

const avatarImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};
