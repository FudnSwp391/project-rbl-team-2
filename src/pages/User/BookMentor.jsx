import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../utils/AuthContext';
import { Calendar, Clock, MessageSquare, AlertCircle, CheckCircle2, User, ArrowLeft, Send, Sparkles } from 'lucide-react';
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';
import '../Auth/Auth.css';

const BookMentor = () => {
  const { id } = useParams(); // mentor_id
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Quota enforcement
  const [quotaStatus, setQuotaStatus] = useState({ allowed: false, used: 0, limit: 0, loading: true });

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    topic: ''
  });
  const [bookedTimes, setBookedTimes] = useState([]);

  const currentPlan = profile?.plan || 'Free';

  const getLocalDateString = () => {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  };

  const getAvailableTimeSlots = () => {
    const allSlots = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '19:00 - 20:00', '20:00 - 21:00'];
    if (!formData.date) return allSlots;

    if (formData.date === getLocalDateString()) {
      const currentHour = new Date().getHours();
      return allSlots.filter(slot => {
        const startHour = parseInt(slot.split(':')[0], 10);
        return startHour > currentHour;
      });
    }
    return allSlots;
  };

  useEffect(() => {
    if (user && id) {
      fetchMentorAndQuota();
    }
  }, [user, id]);

  useEffect(() => {
    if (formData.date && mentor) {
      fetchBookedTimes(formData.date);
    }
  }, [formData.date, mentor]);

  const fetchBookedTimes = async (selectedDate) => {
    const realMentorId = mentor.mentor_id || mentor.id;
    const { data } = await supabase
      .from('mentor_bookings')
      .select('booking_time')
      .eq('mentor_id', realMentorId)
      .eq('booking_date', selectedDate)
      .neq('status', 'rejected');

    if (data) {
      setBookedTimes(data.map(b => b.booking_time));
    }
  };

  const fetchMentorAndQuota = async () => {
    setLoading(true);
    try {
      const { data: mentorData } = await supabase
        .from('mentors')
        .select('*')
        .eq('status', 'approved')
        .or(`id.eq.${id},mentor_id.eq.${id}`)
        .single();

      if (mentorData) {
        setMentor(mentorData);
      }

      let limit = profile?.planLimits?.max_mentor_bookings || 0;

      if (limit === 0) {
        setQuotaStatus({ allowed: false, used: 0, limit: 0, loading: false });
        setLoading(false);
        return;
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count } = await supabase
        .from('mentor_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('candidate_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const used = count || 0;
      setQuotaStatus({
        allowed: used < limit,
        used,
        limit,
        loading: false
      });

    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quotaStatus.allowed) return;

    setSubmitting(true);
    try {
      const realMentorId = mentor.mentor_id || mentor.id;

      const { error } = await supabase
        .from('mentor_bookings')
        .insert([{
          mentor_id: realMentorId,
          candidate_id: user.id,
          candidate_name: profile?.full_name || user.user_metadata?.full_name || 'Ứng viên',
          booking_date: formData.date,
          booking_time: formData.time,
          topic: formData.topic,
          status: 'pending'
        }]);

      if (error) throw error;

      try {
        await emailjs.send(
          'service_gez0q8c',
          'template_5pfbfv9',
          {
            to_email: mentor.email,
            to_name: mentor.full_name,
            from_name: profile?.full_name || user.email,
            candidate_email: user.email,
            candidate_phone: profile?.phone || 'Chưa cập nhật',
            candidate_cv: profile?.cv_url || 'Chưa cập nhật',
            booking_date: formData.date,
            booking_time: formData.time,
            topic: formData.topic,
          },
          're2APjqzHgowc4gPV'
        );
      } catch (emailError) {
        console.error("Lỗi khi gửi email:", emailError);
        const errorDetail = emailError.text || emailError.message || JSON.stringify(emailError);
        toast.error(`Lịch đã được đặt nhưng có lỗi khi gửi email thông báo tự động. Chi tiết: ${errorDetail}`);
      }

      await supabase.from('notifications').insert([{
        user_id: realMentorId,
        title: 'Có lịch hẹn mới!',
        content: `Ứng viên ${profile?.full_name || user.email} vừa đặt lịch hẹn với bạn vào ${formData.time} ngày ${formData.date}.`,
        type: 'info',
        action_link: '/mentor/schedule'
      }]);

      await supabase.from('notifications').insert([{
        user_id: user.id,
        title: 'Đặt lịch thành công',
        content: `Bạn đã đặt lịch hẹn thành công với Mentor ${mentor.full_name} vào ${formData.time} ngày ${formData.date}.`,
        type: 'success',
        action_link: '/my-bookings'
      }]);

      toast.success('Đặt lịch thành công! Đã gửi thông báo đến Mentor.');
      navigate('/my-bookings');

    } catch (err) {
      console.error('Lỗi khi đặt lịch:', err);
      toast.error('Đã xảy ra lỗi khi đặt lịch: ' + (err.message || 'Vui lòng kiểm tra lại SQL schema'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page-wrapper animate-fade" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="profile-loading-box">
          <Sparkles className="spinning-icon" size={32} />
          <p>Đang tải thông tin Mentor...</p>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="profile-page-wrapper animate-fade">
        <div className="profile-main-container" style={{ textAlign: 'center', paddingTop: '2rem' }}>
          <div className="profile-empty-box">
            <User size={48} className="empty-icon" />
            <h4>Không tìm thấy thông tin Mentor</h4>
            <p>Mentor bạn chọn có thể không tồn tại hoặc đã bị hủy kích hoạt.</p>
            <Link to="/mentors" className="btn-profile-action" style={{ marginTop: '1rem', textDecoration: 'none', display: 'inline-flex' }}>
              <ArrowLeft size={16} /> Quay lại danh sách Mentor
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mentorInitial = (mentor.full_name || 'M').charAt(0).toUpperCase();

  return (
    <div className="profile-page-wrapper animate-fade">
      <div className="profile-main-container" style={{ maxWidth: '840px' }}>

        <Link to="/mentors" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          <ArrowLeft size={18} /> Quay lại danh sách Mentor
        </Link>

        {/* Mentor Profile Summary Hero Card */}
        <div className="profile-hero-card">
          <div className="profile-hero-content">
            {mentor.avatar_url ? (
              <img src={mentor.avatar_url} alt={mentor.full_name} style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
            ) : (
              <div className="profile-avatar-circle">
                {mentorInitial}
              </div>
            )}
            <div className="profile-hero-text">
              <div className="profile-name-row">
                <h2>Đặt lịch 1-on-1 với {mentor.full_name}</h2>
                <span className="profile-role-badge">Mentor Chuyên Nghiệp</span>
              </div>
              <p className="profile-email">
                <Sparkles size={14} color="#f97316" />
                <span style={{ color: '#0f172a', fontWeight: 600 }}>Chuyên môn:</span> {mentor.expertise}
              </p>
            </div>
          </div>
        </div>

        <div className="profile-section-card">
          {/* Quota Notice Banner */}
          {!quotaStatus.loading && (
            <div style={{
              padding: '1.25rem', 
              borderRadius: '14px', 
              marginBottom: '1.5rem', 
              display: 'flex', 
              gap: '1rem', 
              alignItems: 'flex-start',
              background: currentPlan === 'Free' ? '#fef2f2' : (quotaStatus.allowed ? '#f0fdf4' : '#fffbebe6'),
              border: `1px solid ${currentPlan === 'Free' ? '#fca5a5' : (quotaStatus.allowed ? '#86efac' : '#fcd34d')}`
            }}>
              {currentPlan === 'Free' ? (
                <AlertCircle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : quotaStatus.allowed ? (
                <CheckCircle2 size={22} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <AlertCircle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}

              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontWeight: 700, fontSize: '0.98rem' }}>
                  {currentPlan === 'Free' ? 'Yêu cầu nâng cấp gói tài khoản' : `Gói dịch vụ hiện tại: ${currentPlan}`}
                </h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                  {currentPlan === 'Free'
                    ? 'Tính năng đặt lịch hẹn 1-on-1 chuyên sâu với Mentor chỉ dành cho thành viên có lượt đặt trong gói dịch vụ Premium.'
                    : `Bạn đã sử dụng ${quotaStatus.used}/${quotaStatus.limit} lượt đặt lịch trong chu kỳ tháng này.`
                  }
                </p>

                {currentPlan === 'Free' && (
                  <Link to="/pricing" className="btn-profile-action" style={{ marginTop: '0.85rem', textDecoration: 'none', display: 'inline-flex' }}>
                    <Sparkles size={16} /> Nâng cấp gói ngay
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Booking Form */}
          {currentPlan !== 'Free' && quotaStatus.allowed && (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="profile-form-row">
                <div className="auth-form-group">
                  <label htmlFor="bookingDate">Ngày muốn hẹn *</label>
                  <div className="input-with-icon-wrapper">
                    <div className="input-icon-left">
                      <Calendar size={18} />
                    </div>
                    <div className="input-divider"></div>
                    <input
                      type="date"
                      id="bookingDate"
                      className="auth-input-no-border"
                      required
                      min={getLocalDateString()}
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value, time: '' })}
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label htmlFor="bookingTime">Giờ muốn hẹn *</label>
                  <div className="input-with-icon-wrapper">
                    <div className="input-icon-left">
                      <Clock size={18} />
                    </div>
                    <div className="input-divider"></div>
                    <select
                      id="bookingTime"
                      className="auth-input-no-border"
                      required
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      style={{ appearance: 'auto', background: 'transparent' }}
                      disabled={!formData.date}
                    >
                      <option value="">Chọn khung giờ có sẵn...</option>
                      {getAvailableTimeSlots().map(timeSlot => (
                        <option
                          key={timeSlot}
                          value={timeSlot}
                          disabled={bookedTimes.includes(timeSlot)}
                        >
                          {timeSlot} {bookedTimes.includes(timeSlot) ? '(Đã kín lịch)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="auth-form-group">
                <label htmlFor="topic">Chủ đề & Nội dung cần Mentor cố vấn *</label>
                <textarea
                  id="topic"
                  className="auth-input-no-border"
                  placeholder="Ví dụ: Nhờ anh/chị review giúp em CV ứng tuyển vị trí Backend Developer và tư vấn lộ trình học Node.js..."
                  style={{ 
                    minHeight: '130px', 
                    resize: 'vertical', 
                    lineHeight: '1.6', 
                    padding: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    width: '100%',
                    fontFamily: 'inherit'
                  }}
                  required
                  value={formData.topic}
                  onChange={e => setFormData({ ...formData, topic: e.target.value })}
                />
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.4rem', margin: 0 }}>
                  Mentor sẽ nhận được thông báo kèm CV và chủ đề của bạn để chuẩn bị buổi trao đổi hiệu quả nhất.
                </p>
              </div>

              <button
                type="submit"
                className="btn-profile-save"
                disabled={submitting}
              >
                <Send size={18} />
                {submitting ? 'Đang gửi yêu cầu...' : 'Xác nhận đặt lịch ngay'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default BookMentor;
