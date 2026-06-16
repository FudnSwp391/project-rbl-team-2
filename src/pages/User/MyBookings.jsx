import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../utils/AuthContext';
import { Calendar, Clock, MessageSquare, CheckCircle, XCircle, User, Phone, Link as LinkIcon, Mail } from 'lucide-react';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mentor_bookings')
        .select(`
          *,
          mentor:mentor_id (*)
        `)
        .eq('candidate_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
      } else if (data && data.length > 0) {
        // Fetch extra info from mentors table
        const mentorIds = data.map(b => b.mentor_id);
        const { data: mentorsData } = await supabase
          .from('mentors')
          .select('mentor_id, phone, email, linkedin_url, avatar_url, expertise')
          .in('mentor_id', mentorIds);

        const enhancedBookings = data.map(booking => {
          const mentorInfo = mentorsData?.find(m => m.mentor_id === booking.mentor_id) || {};
          return {
            ...booking,
            mentor_contact: mentorInfo // Store extra info here
          };
        });
        
        setBookings(enhancedBookings);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span style={{ padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} /> Chờ xác nhận</span>;
      case 'accepted':
        return <span style={{ padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600, background: 'rgba(50,200,100,0.1)', color: '#32c864', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle size={14} /> Đã chấp nhận</span>;
      case 'rejected':
        return <span style={{ padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600, background: 'rgba(200,50,50,0.1)', color: '#c83232', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><XCircle size={14} /> Đã từ chối</span>;
      case 'completed':
        return <span style={{ padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600, background: 'rgba(107,127,92,0.1)', color: 'var(--color-moss)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle size={14} /> Đã hoàn thành</span>;
      default:
        return <span style={{ padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600, background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>{status}</span>;
    }
  };

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh', paddingTop: '120px' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <span className="label">Lịch sử Mentoring</span>
          <h1 style={{ marginTop: '0.5rem' }}>Các buổi hẹn của tôi</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Theo dõi trạng thái các yêu cầu đặt lịch mentoring 1-on-1 của bạn.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>Đang tải danh sách...</div>
        ) : bookings.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Calendar size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-charcoal)' }}>Bạn chưa có buổi hẹn nào</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>Hãy chọn một Mentor phù hợp và đặt lịch ngay nhé.</p>
            <Link to="/mentors" className="btn btn--primary">Tìm Mentor ngay</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {bookings.map((booking) => (
              <div key={booking.id} className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                
                {/* Trạng thái ở góc trên */}
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                  {getStatusBadge(booking.status)}
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  
                  {/* Avatar Mentor */}
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--color-surface-alt)', overflow: 'hidden', flexShrink: 0 }}>
                    {booking.mentor_contact?.avatar_url || booking.mentor?.avatar_url ? (
                      <img src={booking.mentor_contact?.avatar_url || booking.mentor?.avatar_url} alt="Mentor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}><User size={24} /></div>
                    )}
                  </div>

                  {/* Thông tin buổi hẹn */}
                  <div style={{ flex: 1, paddingRight: '120px' /* Chừa chỗ cho badge status */ }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--color-charcoal)' }}>
                      Mentor: {booking.mentor?.full_name || 'Không xác định'}
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={14} /> {new Date(booking.booking_date).toLocaleDateString('vi-VN')}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} /> {booking.booking_time}</span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--color-earth)', marginBottom: '1rem' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Chủ đề thảo luận:</strong>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-charcoal)' }}>{booking.topic}</p>
                    </div>

                    {/* Thông tin liên hệ (Chỉ hiện khi Accepted) */}
                    {booking.status === 'accepted' && (
                      <div style={{ background: 'rgba(50,200,100,0.05)', border: '1px solid rgba(50,200,100,0.2)', padding: '1rem', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '0.9rem', color: '#32c864', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CheckCircle size={14} /> Mentor đã chấp nhận. Vui lòng liên hệ qua:
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Phone size={14} color="var(--color-text-secondary)" /> 
                            <a href={`https://zalo.me/${booking.mentor_contact?.phone?.replace(/[^0-9]/g, '') || ''}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text)', textDecoration: 'none', fontWeight: 500 }}>
                              Zalo: {booking.mentor_contact?.phone || 'Chưa cập nhật'}
                            </a>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={14} color="var(--color-text-secondary)" /> 
                            <a href={`mailto:${booking.mentor_contact?.email || booking.mentor?.email}`} style={{ color: 'var(--color-text)', textDecoration: 'none' }}>{booking.mentor_contact?.email || booking.mentor?.email}</a>
                          </div>
                          {booking.mentor_contact?.linkedin_url && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <LinkIcon size={14} color="var(--color-text-secondary)" /> 
                              <a href={booking.mentor_contact.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0a66c2', textDecoration: 'none', fontWeight: 500 }}>
                                Hồ sơ LinkedIn
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default MyBookings;
