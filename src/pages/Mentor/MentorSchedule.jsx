import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, XCircle, Video, MessageSquare } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';

const MentorSchedule = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (user?.id) fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('mentor_bookings')
        .select('*, candidate:candidate_id(*)')
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error.message);
        setErrorMsg('Lỗi khi tải lịch hẹn: ' + error.message + '. (Có thể bảng mentor_bookings chưa thiết lập khóa ngoại Foreign Key tới bảng profiles)');
        setBookings([]);
      } else {
        const mapped = (data || []).map(item => ({
          id: item.id,
          candidateName: item.candidate?.full_name || item.candidate_name || 'Ứng viên',
          candidateEmail: item.candidate?.email || '',
          candidatePhone: item.candidate?.phone || '',
          candidateCvUrl: item.candidate?.cv_url || null,
          date: item.booking_date || (item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : ''),
          time: item.booking_time || '--:--',
          topic: item.topic || 'Mentoring session',
          status: item.status || 'pending',
          candidate_id: item.candidate_id,
        }));
        setBookings(mapped);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setBookings([]);
    }
    setLoading(false);
  };

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const handleAccept = async (id) => {
    const { error } = await supabase
      .from('mentor_bookings')
      .update({ status: 'accepted' })
      .eq('id', id);

    if (error) {
      alert('Lỗi khi chấp nhận lịch hẹn: ' + error.message);
    } else {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'accepted' } : b));
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối lịch hẹn này?')) return;
    const { error } = await supabase
      .from('mentor_bookings')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      alert('Lỗi khi từ chối lịch hẹn: ' + error.message);
    } else {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected' } : b));
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return { bg: 'rgba(196, 149, 106, 0.1)', color: 'var(--color-accent)', label: 'Chờ xác nhận', icon: <Clock size={14} /> };
      case 'accepted':
        return { bg: 'rgba(107, 127, 92, 0.1)', color: 'var(--color-moss)', label: 'Đã chấp nhận', icon: <CheckCircle size={14} /> };
      case 'rejected':
        return { bg: 'rgba(192, 57, 43, 0.08)', color: '#c0392b', label: 'Đã từ chối', icon: <XCircle size={14} /> };
      case 'completed':
        return { bg: 'rgba(139, 115, 85, 0.1)', color: 'var(--color-earth)', label: 'Đã hoàn thành', icon: <CheckCircle size={14} /> };
      default:
        return { bg: 'var(--border-color)', color: 'var(--color-text-secondary)', label: status, icon: null };
    }
  };

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        {/* Back to Dashboard */}
        <Link to="/mentor" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem', textDecoration: 'none', marginBottom: '1.5rem', transition: 'color 0.3s', fontFamily: 'var(--font-sans)' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-charcoal)'} onMouseOut={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
          ← Quay lại Mentor Dashboard
        </Link>

        {/* Header */}
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <span className="label">Mentor Portal</span>
          <h1 style={{ marginTop: 'var(--spacing-sm)' }}>Quản lý Lịch hẹn</h1>
          <p style={{ marginTop: '0.5rem' }}>Xem và quản lý các yêu cầu đặt lịch mentoring 1-on-1 từ ứng viên.</p>
        </div>

        {/* Filter Tabs */}
        <div className="reveal is-visible" style={{
          display: 'flex', gap: '0.5rem', marginBottom: 'var(--spacing-lg)',
          flexWrap: 'wrap',
        }}>
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'pending', label: 'Chờ xác nhận' },
            { key: 'accepted', label: 'Đã chấp nhận' },
            { key: 'completed', label: 'Đã hoàn thành' },
            { key: 'rejected', label: 'Đã từ chối' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: '50px',
                border: filter === tab.key ? '1px solid var(--color-charcoal)' : '1px solid var(--border-color)',
                background: filter === tab.key ? 'var(--color-charcoal)' : 'rgba(255,255,255,0.6)',
                color: filter === tab.key ? 'var(--color-cream)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.3s var(--ease-out-expo)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            Đang tải lịch hẹn...
          </div>
        ) : (
          /* Bookings List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredBookings.map((booking, idx) => {
              const statusInfo = getStatusStyle(booking.status);
              return (
                <div
                  key={booking.id}
                  className={`glass-card reveal is-visible ${idx > 0 ? `reveal--delay-${Math.min(idx, 3)}` : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '50px', height: '50px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-accent), var(--color-earth))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '1.1rem',
                    flexShrink: 0,
                  }}>
                    {booking.candidateName.charAt(0)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.25rem 0', color: 'var(--color-charcoal)' }}>
                      {booking.candidateName}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={14} /> {booking.date}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} /> {booking.time}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MessageSquare size={14} /> {booking.topic}
                      </span>
                    </div>

                    {booking.status !== 'pending' && (
                      <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-charcoal)' }}>Thông tin Ứng viên:</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div><strong>Email:</strong> <a href={`mailto:${booking.candidateEmail}`} style={{ color: 'var(--color-primary)' }}>{booking.candidateEmail || 'N/A'}</a></div>
                          <div><strong>SĐT (Zalo):</strong> {booking.candidatePhone ? <a href={`https://zalo.me/${booking.candidatePhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>{booking.candidatePhone}</a> : 'N/A'}</div>
                          {booking.candidateCvUrl && (
                            <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem' }}>
                              <a href={booking.candidateCvUrl} target="_blank" rel="noopener noreferrer" className="btn btn--outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'inline-block' }}>
                                Xem CV Ứng viên
                              </a>
                              <Link to={`/mentor/reviews`} className="btn btn--outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'inline-block' }}>
                                Xem Video Phỏng vấn AI
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.4rem 0.85rem', borderRadius: '50px',
                    background: statusInfo.bg, color: statusInfo.color,
                    fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap',
                  }}>
                    {statusInfo.icon} {statusInfo.label}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAccept(booking.id)}
                          className="btn btn--primary"
                          style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '50px' }}
                        >
                          Chấp nhận
                        </button>
                        <button
                          onClick={() => handleReject(booking.id)}
                          className="btn btn--outline"
                          style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '50px' }}
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    {booking.status === 'accepted' && (
                      <Link
                        to={`/mentor/schedule/session/${booking.id}`}
                        className="btn btn--primary"
                        style={{
                          padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '50px',
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                        }}
                      >
                        <Video size={14} /> Tham gia phiên
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {errorMsg && (
              <div style={{ padding: '1rem', background: 'rgba(255,0,0,0.1)', color: 'red', borderRadius: '8px', marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            {!errorMsg && filteredBookings.length === 0 && (
              <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-secondary)' }}>
                <Calendar size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                  Không có lịch hẹn nào{filter !== 'all' ? ' trong mục này' : ''}.
                </p>
                <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
                  Lịch hẹn sẽ xuất hiện tại đây khi ứng viên đặt lịch mentoring 1-on-1 với bạn.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorSchedule;
