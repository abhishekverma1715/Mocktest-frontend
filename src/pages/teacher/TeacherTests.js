import React, { useEffect, useState, useCallback } from 'react';
import TeacherLayout from '../../components/teacher/TeacherLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, BookOpen, Clock, X, Save, CheckSquare, Square, Search, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Mixed'];
const BLANK = { title: '', description: '', category: '', duration: 60, totalMarks: 100, marksPerQuestion: 1, negativeMarking: false, negativeMarks: 0.25, difficulty: 'Mixed', isActive: true, isRandom: false, randomCount: 0, questions: [], instructions: [] };

export default function TeacherTests() {
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [allQuestions, setAllQuestions] = useState([]);
  const [qLoading, setQLoading] = useState(false);
  const [qSearch, setQSearch] = useState('');
  const [showQPanel, setShowQPanel] = useState(true);
  const [instrInput, setInstrInput] = useState('');

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

  useEffect(() => {
    Promise.all([API.get('/tests/admin/all'), API.get('/categories')]).then(([tRes, cRes]) => {
      setTests(tRes.data.tests || []);
      setCategories(cRes.data.categories || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadQuestions = useCallback(async (cat = '') => {
    setQLoading(true);
    try {
      const params = new URLSearchParams({ limit: 300 });
      if (cat && cat !== 'All') params.append('category', cat);
      const { data } = await API.get(`/tests/builder/questions?${params}`);
      setAllQuestions(data.questions || []);
    } catch { setAllQuestions([]); }
    setQLoading(false);
  }, []);

  const openAdd = () => {
    setEditing(null); setForm({ ...BLANK, category: categories[0]?.name || '' }); setFormError('');
    setQSearch(''); setShowQPanel(true); setInstrInput(''); setShowModal(true);
    loadQuestions('');
  };
  const openEdit = (t) => {
    setEditing(t._id);
    const qIds = (t.questions || []).map(q => typeof q === 'object' ? String(q._id || q) : String(q));
    setForm({ ...t, questions: qIds, instructions: Array.isArray(t.instructions) ? [...t.instructions] : [] });
    setFormError(''); setQSearch(''); setShowQPanel(true); setInstrInput(''); setShowModal(true);
    loadQuestions(t.category || '');
  };

  const toggleQ = (qId) => {
    const id = String(qId);
    setForm(f => ({ ...f, questions: f.questions.includes(id) ? f.questions.filter(x => x !== id) : [...f.questions, id] }));
  };
  const isSelected = (qId) => form.questions.includes(String(qId));

  const handleSave = async (e) => {
    e.preventDefault(); setFormError('');
    if (!form.title.trim()) { setFormError('Test title required'); return; }
    if (!form.category.trim()) { setFormError('Category required'); return; }
    if (!form.duration || form.duration < 1) { setFormError('Duration must be at least 1 minute'); return; }
    if (!form.isRandom && form.questions.length === 0) { setFormError('Select at least one question'); return; }
    setSaving(true);
    const payload = { ...form, duration: Number(form.duration), totalMarks: Number(form.totalMarks), marksPerQuestion: Number(form.marksPerQuestion), negativeMarks: Number(form.negativeMarks), randomCount: Number(form.randomCount) };
    try {
      if (editing) {
        const { data } = await API.put(`/tests/${editing}`, payload);
        setTests(prev => prev.map(t => t._id === editing ? data.test : t));
        toast.success('Test updated!');
      } else {
        const { data } = await API.post('/tests', payload);
        setTests(prev => [data.test, ...prev]);
        toast.success('Test created!');
      }
      setShowModal(false);
    } catch (err) { const msg = err.response?.data?.message || 'Save failed'; setFormError(msg); toast.error(msg); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this test?')) return;
    try { await API.delete(`/tests/${id}`); setTests(prev => prev.filter(t => t._id !== id)); toast.success('Deleted'); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const filteredQ = allQuestions.filter(q => !qSearch || q.text.toLowerCase().includes(qSearch.toLowerCase()) || (q.subject || '').toLowerCase().includes(qSearch.toLowerCase()));

  return (
    <>
      <TeacherLayout title="My Tests" subtitle={`${tests.length} tests`}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
          <button onClick={openAdd} className="btn btn-primary btn-sm" style={{ gap: 6, padding: '8px 16px', borderRadius: '10px' }}>
            <Plus size={15} /> Create Test
          </button>
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
          : tests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48, borderRadius: '12px' }}>
              <p style={{ marginBottom: 14 }}>No tests yet</p>
              <button onClick={openAdd} className="btn btn-primary btn-sm"><Plus size={14} /> Create First Test</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {tests.map(t => (
                <div key={t._id} className="card" style={{ padding: 16, borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>{t.category}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEdit(t)} className="btn btn-ghost btn-icon btn-sm" style={{ padding: '4px' }}><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(t._id)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)', padding: '4px' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <h4 style={{ fontSize: '0.875rem', marginBottom: 6, lineHeight: 1.4 }}>{t.title}</h4>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><BookOpen size={11} />{t.totalQuestions} Qs</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />{t.duration} min</span>
                  </div>
                </div>
              ))}
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
            maxWidth: '800px',
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
                {editing ? 'Edit Test' : 'Create New Test'}
              </h3>
              <button
                onClick={() => !saving && setShowModal(false)}
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
              {formError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255,101,132,0.1)',
                  border: '1px solid rgba(255,101,132,0.25)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 20,
                  fontSize: '0.85rem',
                  color: 'var(--danger)'
                }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}
              <form onSubmit={handleSave}>
                {/* Title and Category */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Test Title *</label>
                    <input
                      className="form-input"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      required
                      placeholder="Test title..."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Category *</label>
                    <select
                      className="form-select"
                      value={form.category}
                      onChange={e => { setForm(f => ({ ...f, category: e.target.value, questions: [] })); loadQuestions(e.target.value); }}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    >
                      <option value="">Select...</option>
                      {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Duration, Total Marks, Difficulty */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Duration (min) *</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      value={form.duration}
                      onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Total Marks *</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      value={form.totalMarks}
                      onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Difficulty</label>
                    <select
                      className="form-select"
                      value={form.difficulty}
                      onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    >
                      {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Checkboxes */}
                <div style={{
                  display: 'flex',
                  gap: 20,
                  marginBottom: 20,
                  flexWrap: 'wrap',
                  padding: '12px 16px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={form.negativeMarking}
                      onChange={e => setForm(f => ({ ...f, negativeMarking: e.target.checked }))}
                      style={{ accentColor: 'var(--danger)', width: 15, height: 15 }}
                    />
                    Negative Marking
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                      style={{ accentColor: 'var(--success)', width: 15, height: 15 }}
                    />
                    Active (visible to students)
                  </label>
                </div>

                {/* Questions picker */}
                <div style={{ border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'var(--bg-elevated)',
                      cursor: 'pointer',
                      borderBottom: showQPanel ? '1px solid var(--border-subtle)' : 'none'
                    }}
                    onClick={() => setShowQPanel(v => !v)}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BookOpen size={15} color="var(--accent)" />
                      Select Questions
                      <span style={{
                        background: form.questions.length > 0 ? 'var(--accent)' : 'var(--bg-hover)',
                        color: form.questions.length > 0 ? 'white' : 'var(--text-muted)',
                        padding: '1px 10px',
                        borderRadius: 'var(--r-full)',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        {form.questions.length} selected
                      </span>
                    </span>
                    {showQPanel ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
                  </div>
                  {showQPanel && (
                    <>
                      <div style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ position: 'relative' }}>
                          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input
                            className="form-input"
                            value={qSearch}
                            onChange={e => setQSearch(e.target.value)}
                            placeholder="Search questions..."
                            style={{ paddingLeft: 32, fontSize: '0.82rem', width: '100%' }}
                          />
                        </div>
                      </div>
                      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                        {qLoading ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><div className="spinner" style={{ width: 24, height: 24 }} /></div>
                        ) : filteredQ.length === 0 ? (
                          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {allQuestions.length === 0 ? '📚 No questions found for this category' : '🔍 No matching questions'}
                          </div>
                        ) : filteredQ.map(q => {
                          const sel = isSelected(q._id);
                          return (
                            <div
                              key={q._id}
                              onClick={() => toggleQ(q._id)}
                              style={{
                                display: 'flex',
                                gap: 10,
                                padding: '10px 14px',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border-subtle)',
                                background: sel ? 'rgba(108,99,255,0.08)' : 'transparent',
                                alignItems: 'flex-start',
                                transition: 'background 0.15s'
                              }}
                            >
                              {sel
                                ? <CheckSquare size={15} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                                : <Square size={15} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />}
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.83rem', margin: 0, color: 'var(--text-primary)', lineHeight: 1.4 }}>{q.text}</p>
                                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                  {q.subject && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{q.subject}</span>}
                                  <span style={{ fontSize: '0.68rem', color: q.difficulty === 'Easy' ? 'var(--success)' : q.difficulty === 'Hard' ? 'var(--danger)' : 'var(--warning)' }}>{q.difficulty}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Summary bar */}
                <div style={{
                  display: 'flex',
                  gap: 16,
                  padding: '10px 14px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 10,
                  marginBottom: 20,
                  flexWrap: 'wrap',
                  fontSize: '0.82rem'
                }}>
                  <span>⏱ <strong>{form.duration}</strong> min</span>
                  <span>📋 <strong>{form.questions.length}</strong> questions selected</span>
                  <span>🏆 <strong>{form.totalMarks}</strong> marks</span>
                  {form.negativeMarking && <span style={{ color: 'var(--danger)' }}>⚠ -{form.negativeMarks} neg</span>}
                  <span style={{ color: form.isActive ? 'var(--success)' : 'var(--text-muted)' }}>
                    {form.isActive ? '✅ Active' : '🔒 Hidden'}
                  </span>
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
                    <Save size={14} /> {saving ? 'Saving...' : editing ? 'Update Test' : 'Create Test'}
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