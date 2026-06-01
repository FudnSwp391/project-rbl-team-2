import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Video, VideoOff, Mic, MicOff, Monitor, Phone, MessageSquare, Clock, User } from 'lucide-react';

const MentorSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sessionTime, setSessionTime] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [notes, setNotes] = useState('');

  // Mock session data
  const session = {
    candidateName: 'Lê Minh Đức',
    topic: 'System Design Interview Tips',
    date: '31/05/2026',
    time: '15:00 - 16:00',
  };

  // Timer
  useEffect(() => {
    let interval;
    if (isSessionActive) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndSession = () => {
    if (window.confirm('Bạn có chắc chắn muốn kết thúc phiên mentoring?')) {
      setIsSessionActive(false);
      setTimeout(() => navigate('/mentor/schedule'), 1500);
    }
  };

  return (
    <div style={{ background: 'var(--color-charcoal)', minHeight: '100vh', color: 'var(--color-cream)' }}>
      {/* Top Bar */}
      <div style={{
        padding: '0.75rem 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <button
          onClick={() => navigate('/mentor/schedule')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-sand)', fontSize: '0.85rem',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isSessionActive && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.35rem 0.8rem', borderRadius: '50px',
              background: 'rgba(107, 127, 92, 0.3)',
              fontSize: '0.8rem', color: 'var(--color-moss-light)',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6B7F5C', animation: 'pulse 2s infinite' }} />
              Đang phát trực tiếp · {formatTime(sessionTime)}
            </div>
          )}
          <span style={{ fontSize: '0.85rem', color: 'var(--color-sand)' }}>
            <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
            {session.time}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', minHeight: 'calc(100vh - 130px)' }}>
        {/* Video Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Main Video */}
          <div style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(44, 40, 36, 0.8), rgba(92, 74, 50, 0.4))',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '1rem',
            minHeight: '400px',
            border: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
          }}>
            {!isSessionActive ? (
              <>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-accent), var(--color-earth))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontWeight: 700, color: 'white',
                }}>
                  {session.candidateName.charAt(0)}
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-cream)', fontSize: '1.5rem' }}>
                  {session.candidateName}
                </h2>
                <p style={{ color: 'var(--color-sand)', fontSize: '0.9rem' }}>{session.topic}</p>
                <button
                  onClick={() => setIsSessionActive(true)}
                  className="btn btn--primary btn--pill"
                  style={{
                    marginTop: '1rem',
                    background: 'var(--color-moss)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.8rem 2rem',
                  }}
                >
                  <Video size={18} /> Bắt đầu phiên Mentoring
                </button>
              </>
            ) : (
              <>
                <Video size={64} color="rgba(255,255,255,0.15)" />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                  Camera đang hoạt động...
                </p>
                {/* Self-view pip */}
                <div style={{
                  position: 'absolute', bottom: '1rem', right: '1rem',
                  width: '160px', height: '100px',
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: '10px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={24} color="rgba(255,255,255,0.3)" />
                </div>
              </>
            )}
          </div>

          {/* Controls */}
          {isSessionActive && (
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '1rem',
              padding: '0.75rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '50px',
              width: 'fit-content',
              margin: '0 auto',
            }}>
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                style={{
                  ...controlBtnStyle,
                  background: isMicOn ? 'rgba(255,255,255,0.1)' : 'rgba(192, 57, 43, 0.6)',
                }}
                title={isMicOn ? 'Tắt micro' : 'Bật micro'}
              >
                {isMicOn ? <Mic size={20} color="white" /> : <MicOff size={20} color="white" />}
              </button>
              <button
                onClick={() => setIsCameraOn(!isCameraOn)}
                style={{
                  ...controlBtnStyle,
                  background: isCameraOn ? 'rgba(255,255,255,0.1)' : 'rgba(192, 57, 43, 0.6)',
                }}
                title={isCameraOn ? 'Tắt camera' : 'Bật camera'}
              >
                {isCameraOn ? <Video size={20} color="white" /> : <VideoOff size={20} color="white" />}
              </button>
              <button
                onClick={() => {}}
                style={controlBtnStyle}
                title="Chia sẻ màn hình"
              >
                <Monitor size={20} color="white" />
              </button>
              <button
                onClick={handleEndSession}
                style={{
                  ...controlBtnStyle,
                  background: '#c0392b',
                  width: '56px',
                }}
                title="Kết thúc phiên"
              >
                <Phone size={20} color="white" style={{ transform: 'rotate(135deg)' }} />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          {/* Session Info */}
          <div style={{
            padding: '1.25rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', fontFamily: 'var(--font-sans)', color: 'var(--color-sand)', fontWeight: 600 }}>
              Thông tin phiên
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-stone)' }}>Ứng viên</span>
                <span style={{ color: 'var(--color-cream)', fontWeight: 500 }}>{session.candidateName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-stone)' }}>Chủ đề</span>
                <span style={{ color: 'var(--color-cream)', fontWeight: 500 }}>{session.topic}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-stone)' }}>Ngày</span>
                <span style={{ color: 'var(--color-cream)', fontWeight: 500 }}>{session.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-stone)' }}>Thời gian</span>
                <span style={{ color: 'var(--color-cream)', fontWeight: 500 }}>{session.time}</span>
              </div>
            </div>
          </div>

          {/* Session Notes */}
          <div style={{
            flex: 1,
            padding: '1.25rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', flexDirection: 'column',
          }}>
            <h3 style={{
              fontSize: '0.9rem', marginBottom: '0.75rem',
              fontFamily: 'var(--font-sans)', color: 'var(--color-sand)', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              <MessageSquare size={14} /> Ghi chú phiên
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú trong suốt phiên mentoring..."
              style={{
                flex: 1,
                width: '100%',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: 'var(--color-cream)',
                lineHeight: '1.6',
                resize: 'none',
                outline: 'none',
                minHeight: '200px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 320px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

const controlBtnStyle = {
  width: '48px', height: '48px',
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.1)',
  transition: 'all 0.3s',
};

export default MentorSession;
