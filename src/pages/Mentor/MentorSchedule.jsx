import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, XCircle, Video, User, MessageSquare } from 'lucide-react';

const MentorSchedule = () => {
  const [filter, setFilter] = useState('all');
  const [bookings, setBookings] = useState(mockBookings);

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const handleAccept = (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'accepted' } : b));
  };

  const handleReject = (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối lịch hẹn này?')) return;
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected' } : b));
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

        {/* Bookings List */}
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
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

          {filteredBookings.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
              <Calendar size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Không có lịch hẹn nào{filter !== 'all' ? ' trong mục này' : ''}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const mockBookings = [
  { id: 1, candidateName: 'Nguyễn Văn Quang', date: '01/06/2026', time: '14:00 - 15:00', topic: 'Chuẩn bị phỏng vấn Backend', status: 'pending' },
  { id: 2, candidateName: 'Trần Thị Hồng', date: '02/06/2026', time: '09:00 - 10:00', topic: 'Review CV & Portfolio', status: 'pending' },
  { id: 3, candidateName: 'Lê Minh Đức', date: '31/05/2026', time: '15:00 - 16:00', topic: 'System Design Interview Tips', status: 'accepted' },
  { id: 4, candidateName: 'Phạm Ngọc Anh', date: '30/05/2026', time: '10:00 - 11:00', topic: 'Behavioral Interview Prep', status: 'completed' },
  { id: 5, candidateName: 'Hoàng Đức Thắng', date: '29/05/2026', time: '16:00 - 17:00', topic: 'Career Path Discussion', status: 'rejected' },
];

export default MentorSchedule;
