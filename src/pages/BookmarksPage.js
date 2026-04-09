import React, { useEffect, useState } from 'react';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { Bookmark, BookmarkX, ChevronDown, ChevronUp } from 'lucide-react';

const DIFF_COLORS = { Easy: 'var(--success)', Medium: 'var(--warning)', Hard: 'var(--danger)' };

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    API.get('/users/bookmarks').then(({ data }) => {
      setBookmarks(data.bookmarks || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const removeBookmark = async (qId) => {
    try {
      await API.post(`/users/bookmark/${qId}`);
      setBookmarks(prev => prev.filter(b => b._id !== qId));
      toast.success('Bookmark removed');
    } catch { toast.error('Failed'); }
  };

  return (
    <Layout title="Bookmarks" subtitle={`${bookmarks.length} saved questions`}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : bookmarks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <Bookmark size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No bookmarks yet</h3>
          <p>Save questions during test review to study them later</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {bookmarks.map((q, i) => {
            const isExp = expanded[i];
            return (
              <div key={q._id} style={{ borderBottom: i < bookmarks.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <button onClick={() => setExpanded(p => ({ ...p, [i]: !p[i] }))}
                    style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)', fontFamily: 'var(--font)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className="badge badge-primary">{q.category}</span>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--r-full)', background: `${DIFF_COLORS[q.difficulty]}15`, color: DIFF_COLORS[q.difficulty] }}>{q.difficulty}</span>
                        {q.subject && <span className="badge badge-info">{q.subject}</span>}
                      </div>
                      <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>{q.text}</p>
                    </div>
                    {isExp ? <ChevronUp size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} /> : <ChevronDown size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />}
                  </button>
                  <button onClick={() => removeBookmark(q._id)} className="btn btn-ghost btn-icon btn-sm" title="Remove bookmark" style={{ color: 'var(--danger)', flexShrink: 0 }}>
                    <BookmarkX size={16} />
                  </button>
                </div>
                {isExp && (
                  <div style={{ padding: '0 20px 16px 20px', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 'var(--r-md)', background: opt === q.correctAnswer ? 'rgba(67,233,123,0.1)' : 'var(--bg-elevated)', border: `1.5px solid ${opt === q.correctAnswer ? 'var(--success)' : 'transparent'}`, fontSize: '0.88rem' }}>
                          <span style={{ fontWeight: 700, color: opt === q.correctAnswer ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }}>{opt}.</span>
                          <span>{q.options?.[opt]}</span>
                          {opt === q.correctAnswer && <span style={{ marginLeft: 'auto', color: 'var(--success)', fontSize: '0.78rem', fontWeight: 600 }}>✓ Correct</span>}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div style={{ background: 'rgba(56,249,215,0.08)', border: '1px solid rgba(56,249,215,0.2)', borderRadius: 'var(--r-md)', padding: '12px 14px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--info)' }}>💡 </strong>{q.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
