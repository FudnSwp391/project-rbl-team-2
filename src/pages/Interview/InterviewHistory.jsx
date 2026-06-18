import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Filter, SortAsc, SortDesc,
  Clock, Target, BarChart3, TrendingUp, Award,
  Calendar, Eye, RotateCcw, Download, Play,
  ChevronDown, Sparkles, Layers, X
} from 'lucide-react';
import {
  MOCK_HISTORY, INDUSTRIES, getScoreColor, getScoreLabel,
  getDifficultyColor, formatDate, formatDuration
} from '../../constants/interviewConstants';
import '../../assets/styles/interview-theme.css';
import './InterviewHistory.css';

// ── Stat Widget ──
const StatWidget = ({ icon: Icon, label, value, sub, color }) => (
  <div className="stat-widget">
    <div className="stat-widget__icon" style={{ background: color ? `${color}15` : 'var(--iv-bg-elevated)', color: color || 'var(--iv-accent-blue)' }}>
      <Icon size={20} />
    </div>
    <div className="stat-widget__info">
      <span className="stat-widget__value">{value}</span>
      <span className="stat-widget__label">{label}</span>
      {sub && <span className="stat-widget__sub">{sub}</span>}
    </div>
  </div>
);

// ── Mini sparkline chart ──
const MiniTrend = ({ data }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 30;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="mini-trend">
      <polyline points={points} fill="none" stroke="var(--iv-accent-blue)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

export default function InterviewHistory() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, highest, lowest
  const [showFilters, setShowFilters] = useState(false);

  const history = MOCK_HISTORY;

  // ── Computed Stats ──
  const stats = useMemo(() => {
    const completed = history.filter(h => h.status === 'completed');
    const scores = completed.map(h => h.score);
    return {
      total: history.length,
      avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      bestScore: scores.length ? Math.max(...scores) : 0,
      trendData: scores.slice().reverse(),
    };
  }, [history]);

  // ── Filtered & Sorted ──
  const filteredHistory = useMemo(() => {
    let result = [...history];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(h => h.industry.toLowerCase().includes(q));
    }

    // Filter by industry
    if (filterIndustry !== 'all') {
      result = result.filter(h => h.industryId === filterIndustry);
    }

    // Filter by difficulty
    if (filterDifficulty !== 'all') {
      result = result.filter(h => h.difficulty === filterDifficulty);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'highest':
        result.sort((a, b) => b.score - a.score);
        break;
      case 'lowest':
        result.sort((a, b) => a.score - b.score);
        break;
    }

    return result;
  }, [history, searchQuery, filterIndustry, filterDifficulty, sortBy]);

  const activeFiltersCount = [filterIndustry !== 'all', filterDifficulty !== 'all'].filter(Boolean).length;

  const clearFilters = () => {
    setFilterIndustry('all');
    setFilterDifficulty('all');
    setSearchQuery('');
  };

  return (
    <div className="interview-theme">
      <div className="iv-grid-bg" />
      <div className="iv-orb iv-orb--blue" />
      <div className="iv-orb iv-orb--purple" />

      <div className="history-container">
        {/* ── Header ── */}
        <div className="history-header iv-animate-fade">
          <div className="history-header__left">
            <button className="iv-btn iv-btn--ghost" onClick={() => navigate('/')}>
              <ArrowLeft size={18} />
              Trang chủ
            </button>
          </div>
          <div className="history-header__right">
            <button className="iv-btn iv-btn--primary" onClick={() => navigate('/interview/setup')}>
              <Sparkles size={16} />
              Phỏng vấn mới
            </button>
          </div>
        </div>

        <div className="history-title iv-animate-fade iv-delay-1">
          <h1>Lịch sử phỏng vấn</h1>
          <p>Theo dõi tiến trình và cải thiện kỹ năng phỏng vấn của bạn</p>
        </div>

        {/* ── Stats Dashboard ── */}
        <div className="history-stats iv-animate-slide-up iv-delay-2">
          <StatWidget icon={Layers} label="Tổng phỏng vấn" value={stats.total} color="#3B82F6" />
          <StatWidget icon={Target} label="Điểm trung bình" value={`${stats.avgScore}%`} color="#8B5CF6" />
          <StatWidget icon={Award} label="Điểm cao nhất" value={`${stats.bestScore}%`} color="#22C55E" />
          <div className="stat-widget stat-widget--trend">
            <div className="stat-widget__icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4' }}>
              <TrendingUp size={20} />
            </div>
            <div className="stat-widget__info">
              <span className="stat-widget__label">Xu hướng</span>
              <MiniTrend data={stats.trendData} />
            </div>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="history-filters iv-animate-fade iv-delay-3">
          <div className="history-search">
            <Search size={16} className="history-search__icon" />
            <input
              type="text"
              className="iv-input history-search__input"
              placeholder="Tìm kiếm theo ngành nghề..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="history-filter-actions">
            <button
              className={`iv-btn iv-btn--secondary iv-btn--sm ${showFilters ? 'iv-btn--active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={14} />
              Bộ lọc
              {activeFiltersCount > 0 && <span className="filter-count">{activeFiltersCount}</span>}
            </button>

            <select
              className="history-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="highest">Điểm cao nhất</option>
              <option value="lowest">Điểm thấp nhất</option>
            </select>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="history-filter-panel iv-animate-fade">
            <div className="filter-group">
              <label className="filter-group__label">Ngành nghề</label>
              <select className="history-sort-select" value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}>
                <option value="all">Tất cả</option>
                {INDUSTRIES.map(ind => (
                  <option key={ind.id} value={ind.id}>{ind.nameVi}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-group__label">Độ khó</label>
              <select className="history-sort-select" value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
                <option value="all">Tất cả</option>
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
            </div>
            {activeFiltersCount > 0 && (
              <button className="iv-btn iv-btn--ghost iv-btn--sm" onClick={clearFilters}>
                <X size={14} />
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {/* ── Interview List ── */}
        <div className="history-list iv-animate-slide-up iv-delay-4">
          {filteredHistory.length === 0 ? (
            <div className="history-empty">
              <BarChart3 size={40} />
              <h3>Không tìm thấy kết quả</h3>
              <p>Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
            </div>
          ) : (
            filteredHistory.map((item, index) => (
              <div key={item.id} className={`history-card iv-animate-slide-up iv-delay-${Math.min(index + 1, 8)}`}>
                <div className="history-card__main">
                  <div className="history-card__score-ring">
                    <svg width="48" height="48" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="var(--iv-bg-elevated)" strokeWidth="3" />
                      <circle cx="24" cy="24" r="20" fill="none"
                        stroke={getScoreColor(item.score)} strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={`${(item.score / 100) * 125.6} 125.6`}
                        transform="rotate(-90 24 24)"
                      />
                    </svg>
                    <span className="history-card__score-num" style={{ color: getScoreColor(item.score) }}>
                      {item.score}
                    </span>
                  </div>

                  <div className="history-card__info">
                    <h3 className="history-card__industry">{item.industry}</h3>
                    <div className="history-card__meta">
                      <span className="history-card__date">
                        <Calendar size={12} />
                        {formatDate(item.date)}
                      </span>
                      <span className="history-card__duration">
                        <Clock size={12} />
                        {formatDuration(item.duration)}
                      </span>
                    </div>
                  </div>

                  <div className="history-card__badges">
                    <span className="iv-badge" style={{
                      background: `${getDifficultyColor(item.difficulty)}15`,
                      color: getDifficultyColor(item.difficulty)
                    }}>
                      {item.difficultyVi}
                    </span>
                    <span className={`iv-badge ${item.status === 'completed' ? 'iv-badge--success' : 'iv-badge--warning'}`}>
                      {item.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                    </span>
                  </div>
                </div>

                <div className="history-card__actions">
                  <button className="iv-btn iv-btn--ghost iv-btn--sm"
                    onClick={() => navigate(`/interview/result/${item.id}`)}>
                    <Eye size={14} />
                    Xem
                  </button>
                  <button className="iv-btn iv-btn--ghost iv-btn--sm"
                    onClick={() => navigate('/interview/setup')}>
                    <RotateCcw size={14} />
                    Thử lại
                  </button>
                  <button className="iv-btn iv-btn--ghost iv-btn--sm">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
