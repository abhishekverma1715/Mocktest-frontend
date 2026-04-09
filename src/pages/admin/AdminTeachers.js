import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, ShieldOff, ShieldCheck, Plus, X, Save, GraduationCap, HelpCircle, Play, Mail, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

const BLANK = { name: '', email: '', password: '', phone: '' };

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);

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
      const params = new URLSearchParams({ limit: 50 });
      if (search) params.append('search', search);
      const { data } = await API.get(`/admin/teachers?${params}`);
      setTeachers(data.teachers || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load teachers'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Name, email and password are required'); return;
    }
    setSaving(true);
    try {
      const { data } = await API.post('/admin/teachers', form);
      setTeachers(prev => [data.teacher, ...prev]);
      setTotal(t => t + 1);
      toast.success('Teacher account created!');
      setShowModal(false);
      setForm(BLANK);
    } catch (err) { toast.error(err.response?.data?.message || 'Create failed'); }
    setSaving(false);
  };

  const toggleBlock = async (id, isBlocked) => {
    setToggling(`block-${id}`);
    try {
      const { data } = await API.put(`/admin/teachers/${id}/toggle-block`);
      setTeachers(prev => prev.map(t => t._id === id ? { ...t, isBlocked: data.teacher.isBlocked } : t));
      toast.success(data.message);
    } catch { toast.error('Action failed'); }
    setToggling(null);
  };

  const toggleActive = async (id, isActive) => {
    setToggling(`active-${id}`);
    try {
      const { data } = await API.put(`/admin/teachers/${id}/toggle-active`);
      setTeachers(prev => prev.map(t => t._id === id ? { ...t, isActive: data.teacher.isActive } : t));
      toast.success(data.message);
    } catch { toast.error('Action failed'); }
    setToggling(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this teacher account?')) return;
    try {
      await API.delete(`/admin/teachers/${id}`);
      setTeachers(prev => prev.filter(t => t._id !== id));
      setTotal(t => t - 1);
      toast.success('Teacher deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <>
      <AdminLayout title="Teacher Management" subtitle={`${total} teacher accounts`}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              placeholder="Search teachers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, width: '100%' }}
            />
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm" style={{ gap: 6, flexShrink: 0, padding: '8px 16px', borderRadius: '10px' }}>
            <Plus size={15} /> Add Teacher
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : teachers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <GraduationCap size={40} style={{ color: 'var(--text-muted)', marginBottom: 14 }} />
            <p style={{ marginBottom: 14 }}>No teachers yet</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm"><Plus size={14} /> Add First Teacher</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {teachers.map(teacher => (
              <div key={teacher._id} className="card" style={{ padding: 18, opacity: !teacher.isActive ? 0.7 : 1, borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a78bfa, #6c63ff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: 'white',
                    flexShrink: 0
                  }}>
                    {teacher.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teacher.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Mail size={11} />{teacher.email}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>{teacher.questionsAdded || 0}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}><HelpCircle size={10} />Questions</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#a78bfa' }}>{teacher.videosUploaded || 0}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}><Play size={10} />Videos</div>
                  </div>
                </div>

                {/* Status badges */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span className={`badge ${teacher.isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                    {teacher.isActive ? '✓ Active' : '✗ Deactivated'}
                  </span>
                  {teacher.isBlocked && <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>🚫 Blocked</span>}
                  {teacher.lastLogin && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Last: {new Date(teacher.lastLogin).toLocaleDateString()}</span>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => toggleActive(teacher._id, teacher.isActive)}
                    disabled={toggling === `active-${teacher._id}`}
                    className="btn btn-sm"
                    style={{
                      flex: 1,
                      gap: 5,
                      fontSize: '0.75rem',
                      background: teacher.isActive ? 'rgba(255,101,132,0.1)' : 'rgba(67,233,123,0.1)',
                      color: teacher.isActive ? 'var(--danger)' : 'var(--success)',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font)',
                      fontWeight: 600,
                      borderRadius: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px 10px'
                    }}
                  >
                    {toggling === `active-${teacher._id}` ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : teacher.isActive ? <><ToggleRight size={13} />Deactivate</> : <><ToggleLeft size={13} />Activate</>}
                  </button>
                  <button
                    onClick={() => toggleBlock(teacher._id, teacher.isBlocked)}
                    disabled={toggling === `block-${teacher._id}`}
                    className="btn btn-sm"
                    style={{
                      flex: 1,
                      gap: 5,
                      fontSize: '0.75rem',
                      background: teacher.isBlocked ? 'rgba(67,233,123,0.1)' : 'rgba(247,151,30,0.1)',
                      color: teacher.isBlocked ? 'var(--success)' : 'var(--warning)',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font)',
                      fontWeight: 600,
                      borderRadius: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px 10px'
                    }}
                  >
                    {toggling === `block-${teacher._id}` ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : teacher.isBlocked ? <><ShieldCheck size={13} />Unblock</> : <><ShieldOff size={13} />Block</>}
                  </button>
                  <button
                    onClick={() => handleDelete(teacher._id)}
                    className="btn btn-ghost btn-icon btn-sm"
                    style={{ color: 'var(--danger)', padding: '6px' }}
                    title="Delete teacher"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminLayout>

      {/* ── FIXED MODAL - OUTSIDE AdminLayout ── */}
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
            maxWidth: '500px',
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
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={20} color="#a78bfa" /> Create Teacher Account
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
              <form onSubmit={handleCreate}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Full Name *</label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Teacher's full name"
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Email Address *</label>
                  <input
                    className="form-input"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="teacher@example.com"
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Password *</label>
                  <input
                    className="form-input"
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Phone (Optional)</label>
                  <input
                    className="form-input"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 xxxxx xxxxx"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>

                <div style={{
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(167,139,250,0.2)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 24,
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}>
                  <strong style={{ color: '#a78bfa' }}>Note:</strong> Teacher will be able to add questions and upload videos. They cannot access payment, user management, or admin settings.
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
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
                    <Save size={14} /> {saving ? 'Creating...' : 'Create Teacher'}
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