import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { Clock, Trophy, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';

function SkeletonRow() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', borderBottom:'1px solid var(--border-base)' }}>
      <div className="skeleton" style={{ width:52, height:52, borderRadius:'var(--r-lg)', flexShrink:0 }} />
      <div style={{ flex:1 }}>
        <div className="skeleton" style={{ height:14, width:'55%', marginBottom:8 }} />
        <div className="skeleton" style={{ height:12, width:'35%' }} />
      </div>
      <div className="skeleton" style={{ height:14, width:60 }} />
    </div>
  );
}

export default function HistoryPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    API.get(`/results/my?page=${page}&limit=10`)
      .then(({ data }) => {
        setResults(data.results || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Layout title="Attempt History" subtitle={`${total} total attempts`}>
      {loading ? (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {Array(6).fill(0).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ width:72, height:72, borderRadius:'var(--r-2xl)', background:'var(--accent-muted)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <Clock size={32} style={{ color:'var(--accent)' }} />
          </div>
          <h3 style={{ marginBottom:8 }}>No attempts yet</h3>
          <p style={{ marginBottom:20 }}>Take a mock test to see your history here</p>
          <Link to="/tests" className="btn btn-primary">Browse Tests</Link>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            {results.map((r, i) => {
              const pct = Math.round(r.percentage);
              const color = pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
              const bgColor = pct >= 70 ? 'var(--success-muted)' : pct >= 50 ? 'var(--warning-muted)' : 'var(--danger-muted)';
              return (
                <Link key={r._id} to={`/result/${r._id}`}
                  style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', textDecoration:'none', color:'inherit', borderBottom: i < results.length - 1 ? '1px solid var(--border-base)' : 'none', transition:'background var(--t-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width:52, height:52, borderRadius:'var(--r-lg)', background:bgColor, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1.5px solid ${color}30` }}>
                    <span style={{ fontWeight:800, color, fontSize:'1rem', lineHeight:1 }}>{pct}%</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:'0.9rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:5 }}>{r.test?.title || 'Test'}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', display:'flex', gap:12, flexWrap:'wrap' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:3 }}><CheckCircle2 size={11} />{r.correctAnswers}/{r.test?.totalQuestions || '?'} correct</span>
                      <span style={{ display:'flex', alignItems:'center', gap:3 }}><Clock size={11} />{Math.floor(r.timeTaken/60)}m {r.timeTaken%60}s</span>
                      <span>{new Date(r.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontWeight:800, fontSize:'1.05rem' }}>{r.score}<span style={{ color:'var(--text-muted)', fontWeight:400, fontSize:'0.82rem' }}>/{r.totalMarks}</span></div>
                    {r.rank && <div style={{ fontSize:'0.72rem', color:'var(--gold)', display:'flex', alignItems:'center', gap:3, justifyContent:'flex-end', marginTop:2 }}><Trophy size={10} />#{r.rank}</div>}
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink:0 }} />
                </Link>
              );
            })}
          </div>

          {total > 10 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:24 }}>
              <button className="btn btn-outline btn-sm" disabled={page===1} onClick={() => setPage(p => p-1)}>Previous</button>
              <span style={{ padding:'6px 16px', background:'var(--bg-elevated)', borderRadius:'var(--r-full)', fontSize:'0.85rem', border:'1px solid var(--border-base)' }}>
                Page {page} of {Math.ceil(total/10)}
              </span>
              <button className="btn btn-outline btn-sm" disabled={page*10>=total} onClick={() => setPage(p => p+1)}>Next</button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
