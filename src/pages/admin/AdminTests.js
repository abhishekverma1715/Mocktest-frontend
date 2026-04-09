import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, Users, Clock, BookOpen,
  X, Save, CheckSquare, Square, Search, AlertCircle,
  ChevronDown, ChevronUp, ToggleLeft, ToggleRight
} from 'lucide-react';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Mixed'];

const BLANK = {
  title: '', description: '', category: '',
  duration: 60, totalMarks: 100, marksPerQuestion: 1,
  negativeMarking: false, negativeMarks: 0.25,
  difficulty: 'Mixed', isActive: true,
  isRandom: false, randomCount: 0,
  questions: [],
  instructions: [],
};

const CAT_COLORS = {
  SSC: '#6c63ff', Railway: '#43e97b', Banking: '#38f9d7',
  UPSC: '#f6d365', Defence: '#f7971e', 'State PSC': '#ff6584',
  Teaching: '#a78bfa', Other: '#9898b8',
};
const getCatColor = (cat) => CAT_COLORS[cat] || '#6c63ff';

export default function AdminTests() {
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
  const [qCatFilter, setQCatFilter] = useState('');
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

  const loadTests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/tests/admin/all?limit=100');
      setTests(data.tests || []);
    } catch (err) {
      toast.error('Failed to load tests: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await API.get('/categories');
      setCategories(data.categories || []);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    loadTests();
    loadCategories();
  }, [loadTests, loadCategories]);

  const loadQuestions = useCallback(async (cat = '', search = '') => {
    setQLoading(true);
    try {
      const params = new URLSearchParams({ limit: 300 });
      if (cat && cat !== 'All') params.append('category', cat);
      if (search) params.append('search', search);
      const { data } = await API.get(`/tests/builder/questions?${params}`);
      setAllQuestions(data.questions || []);
    } catch (err) {
      toast.error('Failed to load questions: ' + (err.response?.data?.message || err.message));
      setAllQuestions([]);
    } finally {
      setQLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showModal) {
      loadQuestions(qCatFilter, '');
    }
  }, [qCatFilter, showModal, loadQuestions]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...BLANK, category: categories[0]?.name || 'SSC' });
    setQCatFilter('');
    setQSearch('');
    setInstrInput('');
    setFormError('');
    setShowQPanel(true);
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditing(t._id);
    const qIds = (t.questions || []).map(q =>
      typeof q === 'object' && q !== null ? String(q._id || q) : String(q)
    );
    setForm({
      title: t.title || '',
      description: t.description || '',
      category: t.category || '',
      duration: t.duration || 60,
      totalMarks: t.totalMarks || 100,
      marksPerQuestion: t.marksPerQuestion || 1,
      negativeMarking: Boolean(t.negativeMarking),
      negativeMarks: t.negativeMarks || 0.25,
      difficulty: t.difficulty || 'Mixed',
      isActive: t.isActive !== undefined ? Boolean(t.isActive) : true,
      isRandom: Boolean(t.isRandom),
      randomCount: t.randomCount || 0,
      questions: qIds,
      instructions: Array.isArray(t.instructions) ? [...t.instructions] : [],
    });
    setQCatFilter(t.category || '');
    setQSearch('');
    setInstrInput('');
    setFormError('');
    setShowQPanel(true);
    setShowModal(true);
  };

  const toggleQuestion = (qId) => {
    const id = String(qId);
    setForm(f => {
      const already = f.questions.includes(id);
      return {
        ...f,
        questions: already
          ? f.questions.filter(x => x !== id)
          : [...f.questions, id],
      };
    });
  };

  const isSelected = (qId) => form.questions.includes(String(qId));

  const addInstruction = () => {
    if (!instrInput.trim()) return;
    setForm(f => ({ ...f, instructions: [...f.instructions, instrInput.trim()] }));
    setInstrInput('');
  };
  const removeInstruction = (i) => {
    setForm(f => ({ ...f, instructions: f.instructions.filter((_, j) => j !== i) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.title.trim()) { setFormError('Test title is required'); return; }
    if (!form.category.trim()) { setFormError('Category is required'); return; }
    if (!form.duration || Number(form.duration) < 1) { setFormError('Duration must be at least 1 minute'); return; }
    if (!form.totalMarks || Number(form.totalMarks) < 1) { setFormError('Total marks must be at least 1'); return; }
    if (!form.isRandom && form.questions.length === 0) { setFormError('Select at least one question, or enable Random Mode'); return; }
    if (form.isRandom && (!form.randomCount || Number(form.randomCount) < 1)) { setFormError('Set random question count'); return; }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description,
      category: form.category.trim(),
      duration: Number(form.duration),
      totalMarks: Number(form.totalMarks),
      marksPerQuestion: Number(form.marksPerQuestion),
      negativeMarking: Boolean(form.negativeMarking),
      negativeMarks: Number(form.negativeMarks),
      difficulty: form.difficulty,
      isActive: Boolean(form.isActive),
      isRandom: Boolean(form.isRandom),
      randomCount: Number(form.randomCount),
      questions: form.questions,
      instructions: form.instructions,
    };

    try {
      if (editing) {
        const { data } = await API.put(`/tests/${editing}`, payload);
        setTests(prev => prev.map(t => t._id === editing ? data.test : t));
        toast.success('✅ Test updated successfully!');
      } else {
        const { data } = await API.post('/tests', payload);
        setTests(prev => [data.test, ...prev]);
        toast.success('✅ Test created successfully!');
      }
      setShowModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Save failed. Please try again.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this test? Users will no longer see it.')) return;
    try {
      await API.delete(`/tests/${id}`);
      setTests(prev => prev.filter(t => t._id !== id));
      toast.success('Test deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const toggleActive = async (t) => {
    try {
      const { data } = await API.put(`/tests/${t._id}`, { isActive: !t.isActive });
      setTests(prev => prev.map(x => x._id === t._id ? data.test : x));
      toast.success(data.test.isActive ? 'Test activated' : 'Test hidden');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const filteredQ = allQuestions.filter(q => {
    const matchSearch = !qSearch ||
      q.text.toLowerCase().includes(qSearch.toLowerCase()) ||
      (q.subject || '').toLowerCase().includes(qSearch.toLowerCase());
    return matchSearch;
  });

  const activeTests = tests.filter(t => t.isActive);
  const hiddenTests = tests.filter(t => !t.isActive);

  return (
    <>
      <AdminLayout title="Test Management" subtitle={`${activeTests.length} active · ${hiddenTests.length} hidden`}>
        {/* Top bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-muted)' }}>
              Create and manage mock tests. Questions are loaded dynamically by category.
            </p>
          </div>
          <button onClick={openAdd} className="btn btn-primary" style={{ gap: 6, flexShrink: 0 }}>
            <Plus size={16} /> Create New Test
          </button>
        </div>

        {/* Test grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : tests.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 56 }}>
            <BookOpen size={44} style={{ color: 'var(--text-muted)', marginBottom: 14 }} />
            <h3 style={{ marginBottom: 6 }}>No tests yet</h3>
            <p style={{ marginBottom: 20 }}>Create your first mock test to get started</p>
            <button onClick={openAdd} className="btn btn-primary"><Plus size={16} /> Create First Test</button>
          </div>
        ) : (
          <>
            {activeTests.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14, marginBottom: 24 }}>
                {activeTests.map(t => <TestCard key={t._id} t={t} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleActive} />)}
              </div>
            )}
            {hiddenTests.length > 0 && (
              <>
                <h4 style={{ color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Hidden Tests ({hiddenTests.length})</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
                  {hiddenTests.map(t => <TestCard key={t._id} t={t} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleActive} />)}
                </div>
              </>
            )}
          </>
        )}
      </AdminLayout>

      {/* ── FIXED MODAL - OUTSIDE AdminLayout ─────────────────────────────────────────────── */}
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
            maxWidth: '950px',
            maxHeight: '90vh',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '20px',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            animation: 'modalFadeIn 0.3s ease'
          }}>
            {/* Header — sticky */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-base)',
              position: 'sticky',
              top: 0,
              background: 'var(--bg-card)',
              zIndex: 10,
              borderRadius: '20px 20px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--r-md)',
                  background: 'var(--accent-muted)',
                  border: '1px solid var(--accent-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Save size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{editing ? 'Edit Test' : 'Create New Test'}</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>Fill in the details below</p>
                </div>
              </div>
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
                disabled={saving}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ padding: '24px' }}>
              {/* Error banner */}
              {formError && (
                <div style={{
                  padding: '12px 16px',
                  marginBottom: '18px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSave} id="test-form">
                {/* Row 1: Title + Category */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Test Title *</label>
                    <input
                      className="form-input"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. SSC CGL Tier-1 Full Mock Test"
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Category *</label>
                    {categories.length > 0 ? (
                      <select
                        className="form-select"
                        value={form.category}
                        onChange={e => {
                          setForm(f => ({ ...f, category: e.target.value, questions: [] }));
                          setQCatFilter(e.target.value);
                        }}
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                      >
                        <option value="">Select category...</option>
                        {categories.map(c => <option key={c._id} value={c.name}>{c.icon} {c.name}</option>)}
                      </select>
                    ) : (
                      <input
                        className="form-input"
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        placeholder="e.g. SSC"
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                      />
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Description</label>
                  <textarea
                    className="form-textarea"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description visible to students..."
                    style={{ minHeight: 56, width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>

                {/* Row 2: Duration + Marks + Marks/Q + Difficulty */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 14 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Duration (min) *</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      max="300"
                      value={form.duration}
                      onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                      required
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
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Marks / Question</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={form.marksPerQuestion}
                      onChange={e => setForm(f => ({ ...f, marksPerQuestion: e.target.value }))}
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

                {/* Row 3: Checkboxes */}
                <div style={{
                  display: 'flex',
                  gap: 20,
                  marginBottom: 14,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={form.negativeMarking}
                      onChange={e => setForm(f => ({ ...f, negativeMarking: e.target.checked }))}
                      style={{ accentColor: 'var(--danger)', width: 15, height: 15 }}
                    />
                    Negative Marking
                  </label>
                  {form.negativeMarking && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Penalty:</span>
                      <input
                        className="form-input"
                        type="number"
                        step="0.25"
                        min="0.25"
                        max="4"
                        value={form.negativeMarks}
                        onChange={e => setForm(f => ({ ...f, negativeMarks: e.target.value }))}
                        style={{ width: 72, padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                      />
                    </div>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={form.isRandom}
                      onChange={e => setForm(f => ({ ...f, isRandom: e.target.checked }))}
                      style={{ accentColor: 'var(--info)', width: 15, height: 15 }}
                    />
                    Random Questions
                  </label>
                  {form.isRandom && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Pick:</span>
                      <input
                        className="form-input"
                        type="number"
                        min="1"
                        value={form.randomCount}
                        onChange={e => setForm(f => ({ ...f, randomCount: e.target.value }))}
                        style={{ width: 72, padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                      />
                    </div>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                      style={{ accentColor: 'var(--success)', width: 15, height: 15 }}
                    />
                    Active (visible to students)
                  </label>
                </div>

                {/* Instructions */}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Instructions</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                    <input
                      className="form-input"
                      value={instrInput}
                      onChange={e => setInstrInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInstruction(); } }}
                      placeholder="Type an instruction and press Enter or Add..."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addInstruction} style={{ flexShrink: 0, padding: '10px 16px', borderRadius: '10px' }}>Add</button>
                  </div>
                  {form.instructions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {form.instructions.map((inst, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 7, fontSize: '0.85rem', border: '1px solid var(--border-subtle)' }}>
                          <span style={{ flex: 1 }}>📌 {inst}</span>
                          <button type="button" onClick={() => removeInstruction(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 2 }}><X size={13} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Question Picker */}
                <div style={{ border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden', marginBottom: 18 }}>
                  {/* Picker header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 14px',
                      background: 'var(--bg-elevated)',
                      borderBottom: showQPanel ? '1px solid var(--border-subtle)' : 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => setShowQPanel(v => !v)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <BookOpen size={16} color="var(--accent)" />
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Select Questions</span>
                      <span style={{
                        background: form.questions.length > 0 ? 'var(--accent)' : 'var(--bg-elevated)',
                        color: form.questions.length > 0 ? 'white' : 'var(--text-muted)',
                        padding: '1px 10px',
                        borderRadius: 'var(--r-full)',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {form.questions.length} selected
                      </span>
                    </div>
                    {showQPanel ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>

                  {showQPanel && (
                    <div>
                      {/* Filters */}
                      <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input
                            className="form-input"
                            placeholder="Search questions..."
                            value={qSearch}
                            onChange={e => setQSearch(e.target.value)}
                            style={{ paddingLeft: 28, fontSize: '0.82rem', width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                          />
                        </div>
                        <select
                          className="form-select"
                          value={qCatFilter}
                          onChange={e => setQCatFilter(e.target.value)}
                          style={{ width: 'auto', minWidth: 130, fontSize: '0.82rem', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                        >
                          <option value="">All Categories</option>
                          {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                        </select>
                        {form.questions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, questions: [] }))}
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '0.78rem', color: 'var(--danger)', flexShrink: 0, padding: '8px 12px', borderRadius: '8px' }}
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {/* Question list */}
                      {qLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                          <div className="spinner" style={{ width: 24, height: 24 }} />
                        </div>
                      ) : (
                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                          {filteredQ.length === 0 ? (
                            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                              {allQuestions.length === 0
                                ? '💡 No questions found. Add questions in the Question Bank first.'
                                : '🔍 No questions match your search.'}
                            </div>
                          ) : filteredQ.map(q => {
                            const sel = isSelected(q._id);
                            return (
                              <div
                                key={q._id}
                                onClick={() => toggleQuestion(q._id)}
                                style={{
                                  display: 'flex',
                                  gap: 10,
                                  padding: '10px 14px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid var(--border-subtle)',
                                  background: sel ? 'rgba(108,99,255,0.08)' : 'transparent',
                                  transition: 'background 0.15s',
                                  alignItems: 'flex-start',
                                }}
                              >
                                {sel
                                  ? <CheckSquare size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                                  : <Square size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />}
                                <div style={{ flex: 1 }}>
                                  <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>{q.text}</p>
                                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                    {q.category && <span style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 4, background: `${getCatColor(q.category)}18`, color: getCatColor(q.category) }}>{q.category}</span>}
                                    {q.subject && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{q.subject}</span>}
                                    <span style={{ fontSize: '0.68rem', color: q.difficulty === 'Easy' ? 'var(--success)' : q.difficulty === 'Hard' ? 'var(--danger)' : 'var(--warning)' }}>{q.difficulty}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Summary bar */}
                <div style={{
                  display: 'flex',
                  gap: 16,
                  padding: '12px 14px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 10,
                  marginBottom: 18,
                  flexWrap: 'wrap',
                  fontSize: '0.85rem'
                }}>
                  <span>⏱ <strong>{form.duration}</strong> min</span>
                  <span>📋 <strong>{form.isRandom ? form.randomCount : form.questions.length}</strong> questions</span>
                  <span>🏆 <strong>{form.totalMarks}</strong> marks</span>
                  {form.negativeMarking && <span style={{ color: 'var(--danger)' }}>⚠ -{form.negativeMarks} neg</span>}
                  {form.isRandom && <span style={{ color: 'var(--info)' }}>🔀 Random mode</span>}
                  <span style={{ color: form.isActive ? 'var(--success)' : 'var(--text-muted)' }}>
                    {form.isActive ? '✅ Active' : '🔒 Hidden'}
                  </span>
                </div>

                {/* Footer buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                    disabled={saving}
                    style={{ padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ gap: 6, minWidth: 140, padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    {saving
                      ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 6 }} />Saving…</>
                      : <><Save size={15} />{editing ? 'Update Test' : 'Create Test'}</>}
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

// ── Test Card component ──────────────────────────────────────────────────────
function TestCard({ t, onEdit, onDelete, onToggle }) {
  return (
    <div className="card" style={{ padding: 18, opacity: t.isActive ? 1 : 0.7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: `${CAT_COLORS[t.category] || '#6c63ff'}18`, color: CAT_COLORS[t.category] || '#6c63ff', fontSize: '0.72rem' }}>
            {t.category}
          </span>
          <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 'var(--r-full)', background: t.isActive ? 'rgba(67,233,123,0.1)' : 'var(--bg-elevated)', color: t.isActive ? 'var(--success)' : 'var(--text-muted)' }}>
            {t.isActive ? '✓ Active' : '✗ Hidden'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={() => onToggle(t)} className="btn btn-ghost btn-icon btn-sm" title={t.isActive ? 'Hide test' : 'Activate test'}
            style={{ color: t.isActive ? 'var(--success)' : 'var(--text-muted)' }}>
            {t.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </button>
          <button onClick={() => onEdit(t)} className="btn btn-ghost btn-icon btn-sm" title="Edit"><Edit2 size={14} /></button>
          <button onClick={() => onDelete(t._id)} className="btn btn-ghost btn-icon btn-sm" title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
        </div>
      </div>

      <h4 style={{ marginBottom: 6, lineHeight: 1.4, fontSize: '0.9rem' }}>{t.title}</h4>
      {t.description && <p style={{ fontSize: '0.8rem', marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</p>}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <BookOpen size={12} />{t.totalQuestions} Qs
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Clock size={12} />{t.duration} min
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Users size={12} />{t.attempts} attempts
        </span>
      </div>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
          {t.totalMarks} marks
        </span>
        {t.negativeMarking && (
          <span style={{ fontSize: '0.7rem', color: 'var(--danger)', background: 'rgba(255,101,132,0.1)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
            -{t.negativeMarks} neg
          </span>
        )}
        {t.difficulty && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
            {t.difficulty}
          </span>
        )}
        {t.isRandom && (
          <span style={{ fontSize: '0.7rem', color: 'var(--info)', background: 'rgba(56,249,215,0.1)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
            🔀 Random
          </span>
        )}
        {t.createdBy && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
            by {t.createdBy.name}
          </span>
        )}
      </div>
    </div>
  );
}