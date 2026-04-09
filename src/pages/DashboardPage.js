import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import {
  BookOpen, Clock, Trophy, Target, Zap, Award,
  ChevronRight, TrendingUp, CheckCircle2, Play, ArrowUpRight
} from 'lucide-react';

const CAT_COLORS = {
  SSC:'#6366f1', Railway:'#10b981', Banking:'#0ea5e9',
  UPSC:'#fbbf24', Defence:'#f59e0b', 'State PSC':'#f43f5e',
  Teaching:'#8b5cf6', Other:'#64748b',
};

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="card stat-card card-hover" style={{ '--accent-muted': `${color}15` }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ width:44, height:44, borderRadius:'var(--r-md)', background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={20} color={color} />
        </div>
        <TrendingUp size={13} color={color} style={{ opacity:0.45 }} />
      </div>
      <div style={{ fontSize:'1.7rem', fontWeight:900, lineHeight:1, marginBottom:4, letterSpacing:'-0.03em' }}>{value}</div>
      <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:500 }}>{label}</div>
      {sub && <div style={{ fontSize:'0.72rem', color, marginTop:4, fontWeight:600 }}>{sub}</div>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card" style={{ padding:16 }}>
      <div className="skeleton" style={{ height:14, width:'60%', marginBottom:10 }} />
      <div className="skeleton" style={{ height:11, width:'100%', marginBottom:6 }} />
      <div className="skeleton" style={{ height:11, width:'75%', marginBottom:14 }} />
      <div className="skeleton" style={{ height:30, width:80, borderRadius:'var(--r-full)' }} />
    </div>
  );
}

function TestItem({ test }) {
  const color = CAT_COLORS[test.category] || '#6366f1';
  return (
    <div className="card card-sm card-hover" style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 16px' }}>
      <div style={{ width:40, height:40, borderRadius:'var(--r-md)', background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <BookOpen size={17} color={color} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:'0.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>{test.title}</div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3 }}><BookOpen size={10} />{test.totalQuestions} Qs</span>
          <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3 }}><Clock size={10} />{test.duration} min</span>
          <span className="badge" style={{ background:`${color}15`, color, borderColor:`${color}30`, fontSize:'0.62rem' }}>{test.category}</span>
        </div>
      </div>
      <Link to={`/exam/${test._id}`} className="btn btn-primary btn-sm" style={{ flexShrink:0, gap:4 }}>
        Start <Play size={11} fill="currentColor" />
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests]     = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    Promise.all([
      API.get('/tests?limit=6'),
      API.get('/results/my?limit=5'),
    ]).then(([t, r]) => {
      setTests(t.data.tests || []);
      setResults(r.data.results || []);
    }).catch((err) => {
      console.error('Dashboard load error:', err);
      // Set empty arrays on error to prevent UI crashes
      setTests([]);
      setResults([]);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;

  const stats = [
    { label:'Tests Taken',     value: user?.totalAttempts || 0,               icon:BookOpen, color:'var(--accent)',   sub:'All time' },
    { label:'Average Score',   value:`${avgScore}%`,                          icon:Target,   color:'#10b981', sub: avgScore >= 60 ? '✓ Good' : 'Keep going' },
    { label:'Total Points',    value:(user?.totalScore || 0).toLocaleString(), icon:Trophy,   color:'#fbbf24', sub:'Points earned' },
    { label:'Tests Available', value: tests.length,                           icon:Zap,      color:'#0ea5e9', sub:'Start now' },
  ];

  const firstName = user?.name?.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Layout>
      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)', borderRadius:'var(--r-2xl)', padding:'24px 28px', marginBottom:24, border:'1px solid var(--border-base)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', right:-30, top:-30, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', fontWeight:500, marginBottom:4 }}>{greeting}, 👋</p>
          <h1 style={{ marginBottom:6 }}>{firstName}!</h1>
          <p style={{ fontSize:'0.9rem', margin:0 }}>Ready to crack your exam? Let's keep the momentum going.</p>
        </div>
        <button onClick={() => navigate('/tests')} className="btn btn-primary btn-lg" style={{ flexShrink:0 }}>
          Start a Test <ArrowUpRight size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-4 gap-4" style={{ marginBottom:28 }}>
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Main content — responsive: stacks on tablet/mobile */}
      <div style={{ display:'grid', gridTemplateColumns:'clamp(200px, 60%, 720px) 1fr', gap:20 }}>
        {/* Available Tests */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <h3>Available Tests</h3>
            <Link to="/tests" className="btn btn-sm btn-ghost" style={{ gap:4, fontSize:'0.8rem' }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {loading
              ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : tests.length === 0
                ? (
                  <div className="card" style={{ textAlign:'center', padding:'40px 20px' }}>
                    <BookOpen size={40} style={{ color:'var(--text-muted)', marginBottom:12 }} />
                    <p>No tests available yet</p>
                  </div>
                )
                : tests.map(t => <TestItem key={t._id} test={t} />)
            }
          </div>
        </div>

        {/* Recent Results */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <h3>Recent Results</h3>
            <Link to="/history" className="btn btn-sm btn-ghost" style={{ gap:4, fontSize:'0.8rem' }}>
              History <ChevronRight size={14} />
            </Link>
          </div>
          {loading
            ? Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : results.length === 0
              ? (
                <div className="card" style={{ textAlign:'center', padding:'40px 20px' }}>
                  <Award size={40} style={{ color:'var(--text-muted)', marginBottom:12 }} />
                  <p style={{ marginBottom:14, fontSize:'0.875rem' }}>No attempts yet</p>
                  <Link to="/tests" className="btn btn-primary btn-sm">Take First Test</Link>
                </div>
              )
              : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {results.map(r => {
                    const pct = Math.round(r.percentage);
                    const color = pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
                    const bgColor = pct >= 70 ? 'var(--success-muted)' : pct >= 50 ? 'var(--warning-muted)' : 'var(--danger-muted)';
                    return (
                      <Link key={r._id} to={`/result/${r._id}`} style={{ textDecoration:'none' }}>
                        <div className="card card-sm card-hover" style={{ padding:'12px 14px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            <div style={{ width:44, height:44, borderRadius:'var(--r-md)', background:bgColor, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1.5px solid ${color}30` }}>
                              <span style={{ fontWeight:900, fontSize:'0.88rem', color, lineHeight:1 }}>{pct}%</span>
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontWeight:600, fontSize:'0.82rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.test?.title}</div>
                              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:3, display:'flex', gap:8 }}>
                                <span style={{ display:'flex', alignItems:'center', gap:3 }}><CheckCircle2 size={10} />{r.correctAnswers} correct</span>
                                <span>{new Date(r.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                              </div>
                            </div>
                            <span style={{ fontWeight:800, fontSize:'0.9rem', color, flexShrink:0 }}>{r.score}/{r.totalMarks}</span>
                          </div>
                          <div className="progress-track" style={{ marginTop:8 }}>
                            <div className={`progress-fill ${pct>=70?'progress-fill-success':pct>=50?'progress-fill-warning':'progress-fill-danger'}`} style={{ width:`${pct}%` }} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )
          }
        </div>
      </div>

      {/* Responsive override for mobile/tablet */}
      <style>{`
        @media (max-width: 900px) {
          .dashboard-main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Layout>
  );
}
