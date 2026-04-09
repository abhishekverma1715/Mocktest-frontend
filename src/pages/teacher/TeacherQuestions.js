import React, { useEffect, useState } from 'react';
import TeacherLayout from '../../components/teacher/TeacherLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, X, Save, ChevronDown, ChevronUp } from 'lucide-react';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const BLANK = { text: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A', explanation: '', category: '', subject: '', difficulty: 'Medium' };

export default function TeacherQuestions() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append('search', search);
      if (filterCat) params.append('category', filterCat);
      const [qRes, catRes] = await Promise.all([
        API.get(`/questions?${params}`),
        API.get('/categories'),
      ]);
      setQuestions(qRes.data.questions || []);
      setTotal(qRes.data.total || 0);
      setCategories(catRes.data.categories || []);
    } catch { toast.error('Failed to load questions'); }
    setLoading(false);
  };

  useEffect(() => { setPage(1); }, [search, filterCat]);
  useEffect(() => { load(); }, [page, search, filterCat]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...BLANK, category: categories[0]?.name || '' });
    setShowModal(true);
  };
  const openEdit = (q) => {
    setEditing(q._id);
    setForm({ text: q.text, options: { ...q.options }, correctAnswer: q.correctAnswer, explanation: q.explanation || '', category: q.category, subject: q.subject, difficulty: q.difficulty });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.text.trim() || !form.options.A || !form.options.B || !form.options.C || !form.options.D) {
      toast.error('Question text and all 4 options are required'); return;
    }
    if (!form.subject.trim()) { toast.error('Subject is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        const { data } = await API.put(`/questions/${editing}`, form);
        setQuestions(prev => prev.map(q => q._id === editing ? data.question : q));
        toast.success('Question updated!');
      } else {
        await API.post('/questions', form);
        toast.success('Question added!');
        load();
      }
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await API.delete(`/questions/${id}`);
      setQuestions(prev => prev.filter(q => q._id !== id));
      setTotal(t => t - 1);
      toast.success('Question deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const DIFF_COLORS = { Easy: 'var(--success)', Medium: 'var(--warning)', Hard: 'var(--danger)' };

  return (
    <>
      <TeacherLayout title="My Questions" subtitle={`${total} questions added by you`}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              placeholder="Search questions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, width: '100%' }}
            />
          </div>
          <select
            className="form-select"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            style={{ width: 'auto', minWidth: 140, padding: '8px 12px', borderRadius: '10px' }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
          <button onClick={openAdd} className="btn btn-primary btn-sm" style={{ gap: 6, flexShrink: 0, padding: '8px 16px', borderRadius: '10px' }}>
            <Plus size={15} /> Add Question
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : questions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48, borderRadius: '12px' }}>
            <p style={{ marginBottom: 16 }}>No questions found</p>
            <button onClick={openAdd} className="btn btn-primary"><Plus size={16} /> Add First Question</button>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px' }}>
            {questions.map((q, i) => {
              const isExp = expandedRows[q._id];
              return (
                <div key={q._id} style={{ borderBottom: i < questions.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 16px' }}>
                    <button
                      onClick={() => setExpandedRows(p => ({ ...p, [q._id]: !p[q._id] }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, flexShrink: 0, marginTop: 3 }}
                    >
                      {isExp ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', margin: '0 0 6px', lineHeight: 1.5 }}>{q.text}</p>
                      {isExp && (
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5, animation: 'fadeIn 0.2s ease' }}>
                          {['A', 'B', 'C', 'D'].map(opt => (
                            <div key={opt} style={{ display: 'flex', gap: 8, fontSize: '0.82rem', padding: '5px 10px', borderRadius: 6, background: opt === q.correctAnswer ? 'rgba(67,233,123,0.1)' : 'var(--bg-elevated)', border: `1px solid ${opt === q.correctAnswer ? 'var(--success)' : 'transparent'}` }}>
                              <span style={{ fontWeight: 700, color: opt === q.correctAnswer ? 'var(--success)' : 'var(--text-muted)' }}>{opt}.</span> {q.options?.[opt]}
                            </div>
                          ))}
                          {q.explanation && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '5px 10px', background: 'rgba(56,249,215,0.07)', borderRadius: 6 }}>💡 {q.explanation}</div>}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 7, marginTop: 6, flexWrap: 'wrap' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>{q.category}</span>
                        <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 'var(--r-full)', background: `${DIFF_COLORS[q.difficulty]}15`, color: DIFF_COLORS[q.difficulty] }}>{q.difficulty}</span>
                        {q.subject && <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>{q.subject}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => openEdit(q)} className="btn btn-ghost btn-icon btn-sm" style={{ padding: '4px' }}><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(q._id)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)', padding: '4px' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {total > 15 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 18 }}>
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span style={{ padding: '6px 12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Page {page} of {Math.ceil(total / 15)}</span>
            <button className="btn btn-secondary btn-sm" disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </TeacherLayout>

      {/* ── FIXED MODAL - OUTSIDE TeacherLayout ── */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '20px',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            animation: 'modalFadeIn 0.3s ease'
          }}>
            {/* Header - Sticky */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-base)',
              position: 'sticky',
              top: 0,
              background: 'var(--bg-card)',
              zIndex: 10,
              borderRadius: '20px 20px 0 0'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                {editing ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleSave}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Question Text *</label>
                  <textarea
                    className="form-textarea"
                    value={form.text}
                    onChange={e => setForm({ ...form, text: e.target.value })}
                    placeholder="Enter the question..."
                    required
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', resize: 'vertical', minHeight: '75px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div className="form-group" key={opt} style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Option {opt} *</label>
                      <input
                        className="form-input"
                        value={form.options[opt]}
                        onChange={e => setForm({ ...form, options: { ...form.options, [opt]: e.target.value } })}
                        placeholder={`Option ${opt}`}
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Correct Answer *</label>
                    <select
                      className="form-select"
                      value={form.correctAnswer}
                      onChange={e => setForm({ ...form, correctAnswer: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    >
                      {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Category *</label>
                    <select
                      className="form-select"
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    >
                      {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Difficulty *</label>
                    <select
                      className="form-select"
                      value={form.difficulty}
                      onChange={e => setForm({ ...form, difficulty: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    >
                      {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Subject *</label>
                    <input
                      className="form-input"
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Maths"
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Explanation (Optional)</label>
                  <textarea
                    className="form-textarea"
                    value={form.explanation}
                    onChange={e => setForm({ ...form, explanation: e.target.value })}
                    placeholder="Explain the correct answer..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', resize: 'vertical', minHeight: '60px' }}
                  />
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                    disabled={saving}
                    style={{ padding: '10px 24px', borderRadius: '10px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ gap: 8, padding: '10px 28px', borderRadius: '10px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <Save size={14} /> {saving ? 'Saving...' : editing ? 'Update' : 'Add Question'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}