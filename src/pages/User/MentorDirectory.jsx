import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../utils/AuthContext';
import { Search, User, Briefcase, Award, Clock, Star, Phone, Link as LinkIcon, Mail, Calendar } from 'lucide-react';

const MentorDirectory = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Lấy plan từ local state, nếu null thì gán mặc định là Free
  const currentPlan = profile?.plan || 'Free';
  const isPremiumOrPro = currentPlan === 'Pro' || currentPlan === 'Premium';

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    setLoading(true);
    // Lấy danh sách Mentor đã được duyệt
    const { data, error } = await supabase
      .from('mentors')
      .select('*')
      .eq('status', 'approved');

    if (!error && data) {
      setMentors(data);
    } else {
      console.error('Error fetching mentors:', error);
    }
    setLoading(false);
  };

  const filteredMentors = mentors.filter(mentor => 
    mentor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.expertise?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh', paddingTop: '120px' }}>
      <div className="container">
        
        {/* Header */}
        <div className="reveal is-visible" style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <span className="label" style={{ marginBottom: '1rem' }}>Mentoring 1-on-1</span>
          <h1 style={{ marginBottom: '1rem', fontSize: '3rem' }}>Đội ngũ Mentor Chuyên gia</h1>
          <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', color: 'var(--color-text-secondary)' }}>
            Kết nối với các chuyên gia hàng đầu để nhận lời khuyên định hướng nghề nghiệp, giải đáp thắc mắc và mock interview thực tế.
          </p>
        </div>

        {/* Search Bar */}
        <div className="reveal is-visible" style={{ maxWidth: '600px', margin: '0 auto var(--spacing-xl) auto', position: 'relative' }}>
          <Search size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Tìm kiếm Mentor theo tên hoặc lĩnh vực..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '50px',
              border: '1px solid var(--border-color)', background: 'white',
              fontSize: '1rem', outline: 'none', boxShadow: 'var(--shadow-sm)'
            }}
          />
        </div>

        {/* Mentors Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
            Đang tải danh sách Mentor...
          </div>
        ) : filteredMentors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
            <User size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>Không tìm thấy Mentor nào phù hợp.</p>
          </div>
        ) : (
          <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {filteredMentors.map((mentor, index) => (
              <div 
                key={mentor.id || index} 
                className={`glass-card reveal is-visible reveal--delay-${(index % 4) + 1}`}
                style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}
              >
                {/* Mentor Header (Avatar & Name) */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden',
                    background: 'var(--color-surface-alt)', flexShrink: 0,
                    border: '3px solid white', boxShadow: 'var(--shadow-sm)'
                  }}>
                    {mentor.avatar_url ? (
                      <img src={mentor.avatar_url} alt={mentor.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                        <User size={32} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--color-charcoal)' }}>{mentor.full_name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-moss)', fontSize: '0.85rem', fontWeight: 500 }}>
                      <Briefcase size={14} /> {mentor.expertise}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div style={{ marginBottom: '1.5rem', flex: 1 }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    "{mentor.bio ? (mentor.bio.length > 150 ? mentor.bio.substring(0, 150) + '...' : mentor.bio) : 'Mentor chuyên nghiệp'}"
                  </p>
                </div>

                {/* Contact Info (Gated) */}
                <div style={{ 
                  background: isPremiumOrPro ? 'var(--color-surface-alt)' : 'rgba(0,0,0,0.02)',
                  borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem',
                  position: 'relative', overflow: 'hidden'
                }}>
                  {!isPremiumOrPro && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      zIndex: 10, padding: '1rem', textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '0.5rem' }}>
                        Khóa đối với thành viên Free
                      </p>
                      <Link to="/pricing" className="btn btn--outline" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                        Nâng cấp để xem liên hệ
                      </Link>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: isPremiumOrPro ? 1 : 0.3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      <Phone size={14} /> 
                      {mentor.phone ? (
                        <a href={`https://zalo.me/${mentor.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
                          Zalo: {mentor.phone}
                        </a>
                      ) : 'Chưa cập nhật'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      <Mail size={14} /> 
                      <a href={`mailto:${mentor.email}`} style={{ color: 'var(--color-text)', textDecoration: 'none' }}>{mentor.email}</a>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      <LinkIcon size={14} /> 
                      {mentor.linkedin_url ? (
                        <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0a66c2', textDecoration: 'none', fontWeight: 500 }}>
                          Hồ sơ LinkedIn
                        </a>
                      ) : 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>

                {/* Booking Button */}
                <button 
                  onClick={() => {
                    if (!isPremiumOrPro) {
                      if (window.confirm('Tính năng này chỉ dành cho gói Pro hoặc Premium. Bạn có muốn nâng cấp ngay?')) {
                        navigate('/pricing');
                      }
                    } else {
                      navigate(`/mentors/book/${mentor.id || mentor.mentor_id}`);
                    }
                  }}
                  className={`btn ${isPremiumOrPro ? 'btn--primary' : 'btn--outline'}`}
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Calendar size={18} />
                  Đặt Lịch Mentoring
                </button>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default MentorDirectory;
