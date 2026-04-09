import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, X, Save, ChevronDown, ChevronUp } from 'lucide-react';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const BLANK_Q = { text: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A', explanation: '', category: '', subject: '', difficulty: 'Medium' };

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_Q);
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
      if (filterDiff) params.append('difficulty', filterDiff);
      const [qRes, catRes] = await Promise.all([
        API.get(`/questions?${params}`),
        API.get('/categories/all')
      ]);
      setQuestions(qRes.data.questions || []);
      setTotal(qRes.data.total || 0);
      setCategories(catRes.data.categories || []);
    } catch (err) { 
      toast.error('Failed to load questions'); 
      try {
        const { data } = await API.get('/categories');
        setCategories(data.categories || []);
      } catch {}
    }
    setLoading(false);
  };

  useEffect(() => { setPage(1); }, [search, filterCat, filterDiff]);
  useEffect(() => { load(); }, [page, search, filterCat, filterDiff]);

  const openAdd = () => { setEditing(null); setForm(BLANK_Q); setShowModal(true); };
  const openEdit = (q) => { setEditing(q._id); setForm({ text: q.text, options: { ...q.options }, correctAnswer: q.correctAnswer, explanation: q.explanation || '', category: q.category, subject: q.subject, difficulty: q.difficulty }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.text.trim()) { toast.error('Question text required'); return; }
    if (!form.options.A || !form.options.B || !form.options.C || !form.options.D) { toast.error('All 4 options required'); return; }
    if (!form.subject.trim()) { toast.error('Subject required'); return; }
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
    } catch { toast.error('Delete failed'); }
  };

  const DIFF_COLORS = { Easy: 'var(--success)', Medium: 'var(--warning)', Hard: 'var(--danger)' };

  return (
    <>
      <AdminLayout title="Question Bank" subtitle={`${total} questions in database`}>
        <style>{`
          /* Responsive Styles */
          @media (max-width: 768px) {
            .toolbar-responsive {
              flex-direction: column !important;
            }
            .toolbar-responsive > div,
            .toolbar-responsive > select,
            .toolbar-responsive > button {
              width: 100% !important;
            }
            .question-row-responsive {
              flex-direction: column !important;
            }
            .action-buttons-responsive {
              align-self: flex-end !important;
              margin-top: 8px !important;
            }
          }
          
          @media (max-width: 480px) {
            .question-row-responsive {
              padding: 12px !important;
            }
          }
        `}</style>

        {/* Toolbar */}
        <div className="toolbar-responsive" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 35, width: '100%' }} />
          </div>
          <select className="form-select" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
          <select className="form-select" value={filterDiff} onChange={e => setFilterDiff(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={openAdd} className="btn btn-primary" style={{ gap: 6, flexShrink: 0 }}>
            <Plus size={16} /> Add Question
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : questions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ marginBottom: 16 }}>No questions found</p>
            <button onClick={openAdd} className="btn btn-primary"><Plus size={16} /> Add First Question</button>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {questions.map((q, i) => {
              const isExp = expandedRows[q._id];
              return (
                <div key={q._id} style={{ borderBottom: i < questions.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div className="question-row-responsive" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px' }}>
                    <button onClick={() => setExpandedRows(p => ({ ...p, [q._id]: !p[q._id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, flexShrink: 0, marginTop: 2 }}>
                      {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 6, margin: 0, wordBreak: 'break-word' }}>{q.text}</p>
                      {isExp && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {['A', 'B', 'C', 'D'].map(opt => (
                            <div key={opt} style={{ display: 'flex', gap: 8, fontSize: '0.85rem', padding: '6px 10px', borderRadius: 6, background: opt === q.correctAnswer ? 'rgba(67,233,123,0.1)' : 'var(--bg-elevated)', border: `1px solid ${opt === q.correctAnswer ? 'var(--success)' : 'transparent'}`, wordBreak: 'break-word' }}>
                              <span style={{ fontWeight: 700, color: opt === q.correctAnswer ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }}>{opt}.</span> {q.options?.[opt]}
                            </div>
                          ))}
                          {q.explanation && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '6px 10px', background: 'rgba(56,249,215,0.07)', borderRadius: 6, wordBreak: 'break-word' }}>💡 {q.explanation}</div>}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <span className="badge badge-primary">{q.category}</span>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--r-full)', background: `${DIFF_COLORS[q.difficulty]}15`, color: DIFF_COLORS[q.difficulty] }}>{q.difficulty}</span>
                        {q.subject && <span className="badge badge-info">{q.subject}</span>}
                      </div>
                    </div>
                    <div className="action-buttons-responsive" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openEdit(q)} className="btn btn-ghost btn-icon btn-sm" title="Edit"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(q._id)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span style={{ padding: '6px 14px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {page} of {Math.ceil(total / 15)}</span>
            <button className="btn btn-secondary btn-sm" disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </AdminLayout>

      {/* MODAL - OUTSIDE AdminLayout so it's not affected by any parent CSS */}
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
        }}>
          <div style={{
            position: 'relative',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '20px',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            animation: 'modalFadeIn 0.3s ease',
          }}>
            <div style={{ padding: '32px' }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
                  {editing ? 'Edit Question' : 'Add New Question'}
                </h2>
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
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave}>
                {/* Question Text */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.85rem' }}>
                    QUESTION TEXT *
                  </label>
                  <textarea
                    value={form.text}
                    onChange={e => setForm({ ...form, text: e.target.value })}
                    placeholder="Enter the full question..."
                    required
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: '0.95rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-input)',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Options */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div key={opt}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.85rem' }}>
                        OPTION {opt} *
                      </label>
                      <input
                        type="text"
                        value={form.options[opt]}
                        onChange={e => setForm({ ...form, options: { ...form.options, [opt]: e.target.value } })}
                        placeholder={`Enter option ${opt}`}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          fontSize: '0.95rem',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-input)'
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.85rem' }}>
                      CORRECT ANSWER *
                    </label>
                    <select
                      value={form.correctAnswer}
                      onChange={e => setForm({ ...form, correctAnswer: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '0.95rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input)'
                      }}
                    >
                      {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.85rem' }}>
                      CATEGORY *
                    </label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '0.95rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input)'
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.85rem' }}>
                      DIFFICULTY *
                    </label>
                    <select
                      value={form.difficulty}
                      onChange={e => setForm({ ...form, difficulty: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '0.95rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input)'
                      }}
                    >
                      {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.85rem' }}>
                      SUBJECT *
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Mathematics"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '0.95rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input)'
                      }}
                    />
                  </div>
                </div>

                {/* Explanation */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.85rem' }}>
                    EXPLANATION (Optional)
                  </label>
                  <textarea
                    value={form.explanation}
                    onChange={e => setForm({ ...form, explanation: e.target.value })}
                    placeholder="Explain why this answer is correct..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: '0.95rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-input)',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                    disabled={saving}
                    style={{ padding: '10px 24px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ padding: '10px 28px', display: 'flex', gap: '8px', alignItems: 'center' }}
                  >
                    <Save size={18} />
                    {saving ? 'Saving...' : editing ? 'Update Question' : 'Add Question'}
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