import React, { useEffect, useState } from 'react';
import TeacherLayout from '../../components/teacher/TeacherLayout';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import { HelpCircle, Play, TrendingUp, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/questions?limit=5'),
      API.get('/videos/manage'),
    ]).then(([qRes, vRes]) => {
      setQuestions(qRes.data.questions || []);
      setVideos((vRes.data.videos || []).slice(0, 5));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Questions Added', value: user?.questionsAdded || 0, icon: HelpCircle, color: 'var(--accent)', path: '/teacher/questions' },
    { label: 'Videos Uploaded', value: user?.videosUploaded || 0, icon: Play, color: '#a78bfa', path: '/teacher/videos' },
  ];

  return (
    <TeacherLayout title={`Welcome, ${user?.name?.split(' ')[0]} 👋`} subtitle="Manage your questions and video content">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {stats.map(({ label, value, icon: Icon, color, path }) => (
          <div key={label} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', borderLeft: `3px solid ${color}` }} onClick={() => navigate(path)}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1, color }}>{value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Teacher permissions note */}
      <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: '1.3rem', flexShrink: 0 }}>📋</div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#a78bfa' }}>Your Permissions</div>
          <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>✅ Add / Edit / Delete your own questions</span>
            <span>✅ Upload and manage your own videos</span>
            <span>✅ Assign categories to content</span>
            <span>❌ User management (Admin only)</span>
            <span>❌ Payment settings (Admin only)</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Questions */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3>My Recent Questions</h3>
            <button onClick={() => navigate('/teacher/questions')} className="btn btn-primary btn-sm" style={{ gap: 5 }}>
              <Plus size={14} /> Add New
            </button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : questions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 32 }}>
              <HelpCircle size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ marginBottom: 14 }}>No questions yet</p>
              <button onClick={() => navigate('/teacher/questions')} className="btn btn-primary btn-sm">Add First Question</button>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {questions.map((q, i) => (
                <div key={q._id} style={{ padding: '12px 16px', borderBottom: i < questions.length - 1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem', flexShrink: 0, marginTop: 2 }}>{q.category}</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Videos */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3>My Recent Videos</h3>
            <button onClick={() => navigate('/teacher/videos')} className="btn btn-sm" style={{ gap: 5, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600, borderRadius: 8, display: 'inline-flex', alignItems: 'center', padding: '6px 12px' }}>
              <Plus size={14} /> Add New
            </button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : videos.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 32 }}>
              <Play size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ marginBottom: 14 }}>No videos yet</p>
              <button onClick={() => navigate('/teacher/videos')} className="btn btn-sm" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600, borderRadius: 8, padding: '7px 14px' }}>Upload First Video</button>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {videos.map((v, i) => (
                <div key={v._id} style={{ padding: '12px 16px', borderBottom: i < videos.length - 1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Play size={14} color="#a78bfa" />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</p>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 2 }}>
                      <span>{v.category}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={10} />{v.views}</span>
                      {v.isPremium && <span style={{ color: '#f6d365' }}>Premium</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
