import React, { useState } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { Flag, X, Send } from 'lucide-react';

const REPORT_TYPES = [
  { value: 'wrong_answer', label: 'Wrong correct answer' },
  { value: 'unclear_question', label: 'Question is unclear' },
  { value: 'typo', label: 'Spelling / Typo error' },
  { value: 'wrong_explanation', label: 'Explanation is wrong' },
  { value: 'suggestion', label: 'Suggestion / Improvement' },
  { value: 'other', label: 'Other issue' },
];

export default function ReportModal({ question, testId, onClose }) {
  const [form, setForm] = useState({ type: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.type) { toast.error('Please select an issue type'); return; }
    if (!form.description.trim()) { toast.error('Please describe the issue'); return; }
    setSubmitting(true);
    try {
      await API.post('/reports', {
        questionId: question._id,
        testId,
        type: form.type,
        description: form.description,
      });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={onClose} />
      <div className="card" style={{ position: 'relative', width: '100%', maxWidth: 480, padding: 28, animation: 'fadeIn 0.2s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flag size={20} color="var(--danger)" /> Report Question
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(67,233,123,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Send size={24} color="var(--success)" />
            </div>
            <h4 style={{ marginBottom: 8 }}>Report Submitted!</h4>
            <p style={{ fontSize: '0.85rem', marginBottom: 20 }}>Thank you for helping us improve. Our team will review this.</p>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: '12px 14px', marginBottom: 20, fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Q: </strong>{question?.text}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Issue Type *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {REPORT_TYPES.map(type => (
                    <label key={type.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--r-md)', border: `1.5px solid ${form.type === type.value ? 'var(--danger)' : 'var(--border-base)'}`, cursor: 'pointer', background: form.type === type.value ? 'rgba(255,101,132,0.08)' : 'transparent', transition: 'var(--transition)' }}>
                      <input type="radio" name="type" value={type.value} checked={form.type === type.value} onChange={e => setForm({ ...form, type: e.target.value })} style={{ accentColor: 'var(--danger)' }} />
                      <span style={{ fontSize: '0.88rem' }}>{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue in detail..." required style={{ minHeight: 80 }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-danger" style={{ flex: 1, gap: 6 }} disabled={submitting}>
                  <Flag size={14} /> {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
