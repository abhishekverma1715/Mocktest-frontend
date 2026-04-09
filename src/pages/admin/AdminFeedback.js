import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { Star, Eye, EyeOff } from 'lucide-react';

function Stars({ value }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={14} fill={value >= s ? '#f6d365' : 'none'} color={value >= s ? '#f6d365' : 'var(--text-muted)'} />
      ))}
    </div>
  );
}

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    setLoading(true);
    API.get(`/feedback/all?page=${page}&limit=20`).then(({ data }) => {
      setFeedbacks(data.feedbacks || []);
      setTotal(data.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page]);

  const togglePublish = async (id, current) => {
    setToggling(id);
    try {
      const { data } = await API.put(`/feedback/${id}/toggle`);
      setFeedbacks(prev => prev.map(f => f._id === id ? { ...f, isPublished: data.feedback.isPublished } : f));
      toast.success(current ? 'Review hidden' : 'Review published');
    } catch { toast.error('Failed'); }
    setToggling(null);
  };

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : '—';

  return (
    <AdminLayout title="User Feedback" subtitle={`${total} reviews · Avg rating: ${avgRating}⭐`}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : feedbacks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Star size={40} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <p>No feedback submitted yet</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {feedbacks.map((fb, i) => (
            <div key={fb._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', borderBottom: i < feedbacks.length - 1 ? '1px solid var(--border-subtle)' : 'none', opacity: fb.isPublished ? 1 : 0.6 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'white', flexShrink: 0 }}>
                {fb.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{fb.user?.name}</span>
                  <Stars value={fb.rating} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(fb.createdAt).toLocaleDateString('en-IN')}</span>
                  {!fb.isPublished && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Hidden</span>}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: 4 }}>{fb.test?.title}</div>
                {fb.review && <p style={{ fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>{fb.review}</p>}
              </div>
              <button onClick={() => togglePublish(fb._id, fb.isPublished)} disabled={toggling === fb._id} className="btn btn-ghost btn-icon btn-sm" title={fb.isPublished ? 'Hide review' : 'Publish review'} style={{ flexShrink: 0, color: fb.isPublished ? 'var(--success)' : 'var(--text-muted)' }}>
                {toggling === fb._id ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : fb.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          ))}
        </div>
      )}
      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ padding: '6px 14px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {page}</span>
          <button className="btn btn-secondary btn-sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </AdminLayout>
  );
}
