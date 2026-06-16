import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../utils/AuthContext';
import { Calendar, Clock, MessageSquare, AlertCircle, CheckCircle2, User } from 'lucide-react';
import emailjs from '@emailjs/browser';

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
      // 1. Fetch Mentor Details
      const { data: mentorData } = await supabase
        .from('mentors')
        .select('*')
        .eq('status', 'approved')
        // Lấy bằng id (PK) hoặc mentor_id (auth ID) tùy cấu trúc bảng
        .or(`id.eq.${id},mentor_id.eq.${id}`)
        .single();

      if (mentorData) {
        setMentor(mentorData);
      }

      // 2. Check Quota limit
      let limit = 0;
      if (currentPlan === 'Pro') limit = 1;
      else if (currentPlan === 'Premium') limit = 5;

      if (limit === 0) {
        setQuotaStatus({ allowed: false, used: 0, limit: 0, loading: false });
        setLoading(false);
        return;
      }

      // Fetch user's bookings within current billing cycle (simplified: last 30 days)
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
      const realMentorId = mentor.mentor_id || mentor.id; // Tùy cột nào là UUID thật của mentor

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

      // --- GỬI EMAIL THÔNG BÁO CHO MENTOR BẰNG EMAILJS ---
      // LƯU Ý: Bạn cần thay thế các thông số bên dưới bằng cấu hình từ tài khoản EmailJS của bạn!
      try {
        await emailjs.send(
          'service_gez0q8c',   // Thay bằng Service ID của bạn (VD: service_xyz)
          'template_5pfbfv9',  // Thay bằng Template ID của bạn (VD: template_abc)
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
          're2APjqzHgowc4gPV'    // Thay bằng Public Key của bạn
        );
        console.log("Đã gửi email thành công!");
      } catch (emailError) {
        console.error("Lỗi khi gửi email:", emailError);
        const errorDetail = emailError.text || emailError.message || JSON.stringify(emailError);
        alert(`Lịch đã được đặt nhưng có lỗi khi gửi email thông báo tự động. Chi tiết lỗi EmailJS: ${errorDetail}\n\nBạn vui lòng kiểm tra lại Template ID và Service ID.`);
      }

      alert('Đặt lịch thành công! Đã gửi thông báo đến Mentor.');
      navigate('/my-bookings');

    } catch (err) {
      console.error('Lỗi khi đặt lịch:', err);
      alert('Đã xảy ra lỗi khi đặt lịch: ' + (err.message || 'Vui lòng kiểm tra lại SQL schema (cần có bảng mentor_bookings)'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ paddingTop: '150px', textAlign: 'center' }}>Đang tải thông tin...</div>;
  }

  if (!mentor) {
    return (
      <div className="container" style={{ paddingTop: '150px', textAlign: 'center' }}>
        <h2>Không tìm thấy Mentor</h2>
        <Link to="/mentors" className="btn btn--primary" style={{ marginTop: '1rem' }}>Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="section animate-fade" style={{ background: 'var(--color-cream)', minHeight: '100vh', paddingTop: '120px' }}>
      <div className="container" style={{ maxWidth: '800px' }}>

        <Link to="/mentors" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', textDecoration: 'none', marginBottom: '2rem' }}>
          ← Quay lại danh sách Mentor
        </Link>

        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>

          {/* Mentor Summary Header */}
          <div style={{ padding: '2rem', background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'white', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
              {mentor.avatar_url ? (
                <img src={mentor.avatar_url} alt={mentor.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                  <User size={32} />
                </div>
              )}
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: 'var(--color-charcoal)' }}>Đặt lịch với {mentor.full_name}</h1>
              <p style={{ color: 'var(--color-moss)', fontWeight: 500, margin: 0 }}>{mentor.expertise}</p>
            </div>
          </div>

          <div style={{ padding: '2rem' }}>

            {/* Quota Notice */}
            {!quotaStatus.loading && (
              <div style={{
                padding: '1.25rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start',
                background: currentPlan === 'Free' ? 'rgba(255,0,0,0.05)' : (quotaStatus.allowed ? 'rgba(50,200,100,0.05)' : 'rgba(255,150,0,0.05)'),
                border: `1px solid ${currentPlan === 'Free' ? 'rgba(255,0,0,0.1)' : (quotaStatus.allowed ? 'rgba(50,200,100,0.2)' : 'rgba(255,150,0,0.2)')}`
              }}>
                {currentPlan === 'Free' ? (
                  <AlertCircle size={24} color="#cc0000" style={{ flexShrink: 0 }} />
                ) : quotaStatus.allowed ? (
                  <CheckCircle2 size={24} color="#32c864" style={{ flexShrink: 0 }} />
                ) : (
                  <AlertCircle size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
                )}

                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-charcoal)' }}>
                    {currentPlan === 'Free' ? 'Bạn cần nâng cấp gói' : `Gói hiện tại: ${currentPlan}`}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    {currentPlan === 'Free'
                      ? 'Tính năng đặt lịch hẹn 1-on-1 với Mentor chỉ dành cho thành viên Pro (1 lượt/kỳ) và Premium (5 lượt/kỳ).'
                      : `Bạn đã sử dụng ${quotaStatus.used}/${quotaStatus.limit} lượt đặt lịch trong chu kỳ này.`
                    }
                  </p>

                  {currentPlan === 'Free' && (
                    <Link to="/pricing" className="btn btn--primary" style={{ marginTop: '1rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                      Xem các gói dịch vụ
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Booking Form */}
            {currentPlan !== 'Free' && quotaStatus.allowed && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>

                  <div className="auth-form-group" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> Ngày muốn hẹn *</label>
                    <input
                      type="date"
                      className="auth-input"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  <div className="auth-form-group" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> Giờ muốn hẹn *</label>
                    <select
                      className="auth-input"
                      required
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      style={{ appearance: 'auto' }}
                    >
                      <option value="">Chọn khung giờ</option>
                      {['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '19:00 - 20:00', '20:00 - 21:00'].map(timeSlot => (
                        <option
                          key={timeSlot}
                          value={timeSlot}
                          disabled={bookedTimes.includes(timeSlot)}
                        >
                          {timeSlot} {bookedTimes.includes(timeSlot) ? '(Đã có người đặt)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="auth-form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={16} /> Chủ đề muốn trao đổi *</label>
                  <textarea
                    className="auth-input"
                    placeholder="VD: Nhờ anh review giúp CV ứng tuyển vị trí Backend Developer và tư vấn lộ trình học Node.js..."
                    style={{ minHeight: '120px', resize: 'vertical' }}
                    required
                    value={formData.topic}
                    onChange={e => setFormData({ ...formData, topic: e.target.value })}
                  />
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    Mentor sẽ nhận được email chứa thông tin liên hệ và link CV của bạn. Hãy ghi rõ mong muốn để Mentor chuẩn bị tốt nhất.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn--primary btn--pill"
                  style={{ padding: '1rem', fontSize: '1rem', marginTop: '1rem' }}
                  disabled={submitting}
                >
                  {submitting ? 'Đang gửi yêu cầu...' : 'Xác Nhận Đặt Lịch'}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default BookMentor;
