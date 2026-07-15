import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../utils/AuthContext';
import { Calendar, Clock, MessageSquare, CheckCircle, XCircle, User, Phone, Link as LinkIcon, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh', paddingTop: '120px' }}>
      <motion.div 
        className="container" 
        style={{ maxWidth: '900px' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        <motion.div variants={itemVariants} style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <span style={{ 
            display: 'inline-block', 
            padding: '0.5rem 1.25rem', 
            background: 'rgba(234, 88, 12, 0.1)', 
            color: '#EA580C', 
            borderRadius: '50px', 
            fontSize: '0.85rem', 
            fontWeight: 700, 
            letterSpacing: '1px', 
            textTransform: 'uppercase', 
            marginBottom: '1rem' 
          }}>
            Lịch sử Mentoring
          </span>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            color: 'var(--color-charcoal)', 
            letterSpacing: '-1px', 
            margin: '0 0 1rem 0',
            lineHeight: 1.2
          }}>
            Các buổi hẹn của tôi
          </h1>
          <p style={{ 
            color: 'var(--color-text-secondary)', 
            fontSize: '1.1rem', 
            maxWidth: '600px', 
            margin: '0 auto' 
          }}>
            Theo dõi và quản lý các yêu cầu đặt lịch mentoring 1-on-1 của bạn.
          </p>
        </motion.div>

        {loading ? (
          <motion.div variants={itemVariants} style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>Đang tải danh sách...</motion.div>
        ) : bookings.length === 0 ? (
          <motion.div variants={itemVariants} className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Calendar size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-charcoal)' }}>Bạn chưa có buổi hẹn nào</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>Hãy chọn một Mentor phù hợp và đặt lịch ngay nhé.</p>
            <Link to="/mentors" className="btn btn--primary">Tìm Mentor ngay</Link>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {bookings.map((booking) => (
              <motion.div variants={itemVariants} key={booking.id} className="glass-card" style={{ padding: '1.5rem 2rem', position: 'relative', overflow: 'hidden', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', borderRadius: '16px' }}>
                
                {/* Trạng thái ở góc trên */}
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                  {getStatusBadge(booking.status)}
                </div>

                {/* Avatar Mentor */}
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {booking.mentor_contact?.avatar_url || booking.mentor?.avatar_url ? (
                    <img src={booking.mentor_contact?.avatar_url || booking.mentor?.avatar_url} alt="Mentor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={30} color="#EA580C" />
                  )}
                </div>

                {/* Thông tin buổi hẹn */}
                <div style={{ flex: 1, paddingRight: '120px' /* Chừa chỗ cho badge status */ }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-charcoal)', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '1.1rem', textTransform: 'none', letterSpacing: '0' }}>Mentor: </span>
                    {booking.mentor?.full_name || 'Không xác định'}
                  </h3>
                  <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginBottom: '1.25rem', flexWrap: 'wrap', fontWeight: 500 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} color="#EA580C" /> {new Date(booking.booking_date).toLocaleDateString('vi-VN')}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} color="#EA580C" /> {booking.booking_time}</span>
                  </div>

                  <div style={{ background: 'rgba(234, 88, 12, 0.03)', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #EA580C', marginBottom: booking.status === 'accepted' ? '1.5rem' : '0' }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-charcoal)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <MessageSquare size={16} color="#EA580C" /> Chủ đề thảo luận
                    </strong>
                    <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1.6 }}>{booking.topic}</p>
                  </div>

                  {/* Thông tin liên hệ (Chỉ hiện khi Accepted) */}
                  {booking.status === 'accepted' && (
                    <div style={{ background: 'rgba(50,200,100,0.05)', border: '1px solid rgba(50,200,100,0.2)', padding: '1.25rem', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '0.95rem', color: '#166534', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                        <CheckCircle size={18} color="#32c864" /> Mentor đã chấp nhận. Vui lòng liên hệ qua:
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ background: 'rgba(50,200,100,0.1)', padding: '6px', borderRadius: '50%' }}><Phone size={16} color="#166534" /></div>
                          <a href={`https://zalo.me/${booking.mentor_contact?.phone?.replace(/[^0-9]/g, '') || ''}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text)', textDecoration: 'none', fontWeight: 500 }}>
                            Zalo: {booking.mentor_contact?.phone || 'Chưa cập nhật'}
                          </a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ background: 'rgba(50,200,100,0.1)', padding: '6px', borderRadius: '50%' }}><Mail size={16} color="#166534" /></div>
                          <a href={`mailto:${booking.mentor_contact?.email || booking.mentor?.email}`} style={{ color: 'var(--color-text)', textDecoration: 'none', fontWeight: 500 }}>{booking.mentor_contact?.email || booking.mentor?.email}</a>
                        </div>
                        {booking.mentor_contact?.linkedin_url && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(50,200,100,0.1)', padding: '6px', borderRadius: '50%' }}><LinkIcon size={16} color="#166534" /></div>
                            <a href={booking.mentor_contact.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0a66c2', textDecoration: 'none', fontWeight: 600 }}>
                              Hồ sơ LinkedIn
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default MyBookings;
