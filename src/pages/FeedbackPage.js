import React, { useEffect, useState } from 'react';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { Star, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

function StarRating({ value, onChange, readOnly = false, size = 24 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button"
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          style={{ background: 'none', border: 'none', cursor: readOnly ? 'default' : 'pointer', padding: 2, transition: 'transform 0.1s', transform: !readOnly && hover >= star ? 'scale(1.2)' : 'scale(1)' }}>
          <Star size={size} fill={(hover || value) >= star ? '#f6d365' : 'none'} color={(hover || value) >= star ? '#f6d365' : 'var(--text-muted)'} />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ testId: '', resultId: '', rating: 0, review: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([
      API.get('/feedback/my'),
      API.get('/results/my?limit=20'),
    ]).then(([fbRes, resRes]) => {
      setMyFeedbacks(fbRes.data.feedbacks || []);
      setResults(resRes.data.results || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Tests already reviewed
  const reviewedTestIds = myFeedbacks.map(f => f.test?._id);
  const pendingResults = results.filter(r => r.test && !reviewedTestIds.includes(r.test._id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.testId) { toast.error('Please select a test'); return; }
    if (form.rating === 0) { toast.error('Please give a star rating'); return; }
    setSubmitting(true);
    try {
      await API.post('/feedback', form);
      toast.success('Thank you for your feedback!');
      setSubmitted(true);
      setForm({ testId: '', resultId: '', rating: 0, review: '' });
      const [fbRes] = await Promise.all([API.get('/feedback/my')]);
      setMyFeedbacks(fbRes.data.feedbacks || []);
      setSubmitted(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

  return (
    <Layout title="Feedback & Reviews" subtitle="Share your experience to help us improve">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Submit Feedback */}
        <div className="card">
          <h3 style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={20} color="var(--accent)" /> Write a Review
          </h3>
          <p style={{ marginBottom: 20, fontSize: '0.85rem' }}>Rate and review the tests you've completed</p>

          {pendingResults.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <CheckCircle2 size={40} style={{ color: 'var(--success)', marginBottom: 12 }} />
              <h4>All caught up!</h4>
              <p style={{ fontSize: '0.85rem' }}>You've reviewed all your completed tests</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Test *</label>
                <select className="form-select" value={form.testId}
                  onChange={e => {
                    const r = results.find(r => r.test?._id === e.target.value);
                    setForm({ ...form, testId: e.target.value, resultId: r?._id || '' });
                  }} required>
                  <option value="">Choose a completed test...</option>
                  {pendingResults.map(r => (
                    <option key={r._id} value={r.test?._id}>
                      {r.test?.title} — {Math.round(r.percentage)}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Your Rating *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <StarRating value={form.rating} onChange={r => setForm({ ...form, rating: r })} size={28} />
                  {form.rating > 0 && (
                    <span style={{ fontSize: '0.9rem', color: 'var(--gold)', fontWeight: 600 }}>
                      {ratingLabels[form.rating]}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Your Review (Optional)</label>
                <textarea className="form-textarea" value={form.review}
                  onChange={e => setForm({ ...form, review: e.target.value })}
                  placeholder="Share your thoughts about this test — quality, difficulty, explanations..."
                  maxLength={1000} style={{ minHeight: 100 }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>
                  {form.review.length}/1000
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={submitting || form.rating === 0} style={{ gap: 8 }}>
                <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>

        {/* My Reviews */}
        <div>
          <h3 style={{ marginBottom: 16 }}>My Reviews ({myFeedbacks.length})</h3>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : myFeedbacks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <Star size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p>No reviews submitted yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myFeedbacks.map(fb => (
                <div key={fb._id} className="card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1, marginRight: 12 }}>
                      {fb.test?.title}
                    </div>
                    <StarRating value={fb.rating} readOnly size={16} />
                  </div>
                  {fb.review && (
                    <p style={{ fontSize: '0.85rem', margin: '8px 0 0', lineHeight: 1.6 }}>{fb.review}</p>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    {new Date(fb.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export { StarRating };
