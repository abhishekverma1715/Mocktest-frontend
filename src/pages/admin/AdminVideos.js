import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Eye, Lock, X, Save, Play } from 'lucide-react';

const CATEGORIES = ['SSC', 'Railway', 'Banking', 'UPSC', 'Defence', 'State PSC', 'Teaching', 'Other'];
const QUALITIES = ['360p', '480p', '720p', '1080p'];
const BLANK = { title: '', description: '', category: 'SSC', subject: '', videoUrl: '', thumbnailUrl: '', duration: 0, isPremium: false, isActive: true, order: 0, tags: '', qualities: [] };

export default function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [qualityForm, setQualityForm] = useState({ label: '720p', url: '' });

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
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/videos?limit=50');
      setVideos(data.videos || []);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  const openAdd = () => { setEditing(null); setForm(BLANK); setShowModal(true); };
  const openEdit = (v) => {
    setEditing(v._id);
    setForm({ ...v, tags: (v.tags || []).join(', '), qualities: v.qualities || [] });
    setShowModal(true);
  };

  const addQuality = () => {
    if (!qualityForm.url.trim()) return;
    const existing = form.qualities.findIndex(q => q.label === qualityForm.label);
    if (existing > -1) {
      const updated = [...form.qualities];
      updated[existing] = qualityForm;
      setForm(f => ({ ...f, qualities: updated }));
    } else {
      setForm(f => ({ ...f, qualities: [...f.qualities, { ...qualityForm }] }));
    }
    setQualityForm({ label: '720p', url: '' });
  };

  const removeQuality = (label) => {
    setForm(f => ({ ...f, qualities: f.qualities.filter(q => q.label !== label) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.videoUrl.trim()) { toast.error('Title and Video URL required'); return; }
    setSaving(true);
    const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
    try {
      if (editing) {
        const { data } = await API.put(`/videos/${editing}`, payload);
        setVideos(prev => prev.map(v => v._id === editing ? data.video : v));
        toast.success('Video updated!');
      } else {
        const { data } = await API.post('/videos', payload);
        setVideos(prev => [data.video, ...prev]);
        toast.success('Video added!');
      }
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this video?')) return;
    try {
      await API.delete(`/videos/${id}`);
      setVideos(prev => prev.filter(v => v._id !== id));
      toast.success('Video deleted');
    } catch { toast.error('Delete failed'); }
  };

  const formatDur = (s) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };

  return (
    <>
      <AdminLayout title="Video Management" subtitle={`${videos.length} videos in library`}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button onClick={openAdd} className="btn btn-primary" style={{ gap: 6 }}><Plus size={16} /> Add Video</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {videos.map(v => (
              <div key={v._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ position: 'relative', paddingBottom: '40%', background: 'var(--bg-elevated)' }}>
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt={v.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={32} color="var(--text-muted)" />
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                    {v.isPremium && <span style={{ background: '#f6d365', color: '#1a1a2e', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700 }}>PREMIUM</span>}
                    {!v.isActive && <span style={{ background: 'var(--danger)', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700 }}>HIDDEN</span>}
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <h4 style={{ fontSize: '0.9rem', lineHeight: 1.4, flex: 1 }}>{v.title}</h4>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => openEdit(v)} className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(v._id)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{v.category}</span>
                    {v.subject && <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{v.subject}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} />{v.views}</span>
                    {v.duration > 0 && <span>{formatDur(v.duration)}</span>}
                    {v.qualities?.length > 0 && <span>{v.qualities.map(q => q.label).join(', ')}</span>}
                  </div>
                </div>
              </div>
            ))}
            {videos.length === 0 && (
              <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48 }}>
                <p style={{ marginBottom: 16 }}>No videos yet</p>
                <button onClick={openAdd} className="btn btn-primary"><Plus size={16} /> Add First Video</button>
              </div>
            )}
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
            maxWidth: '750px',
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
                {editing ? 'Edit Video' : 'Add New Video'}
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
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Video Title *</label>
                  <input
                    className="form-input"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. SSC Reasoning Full Course"
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Description</label>
                  <textarea
                    className="form-textarea"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Category *</label>
                    <select
                      className="form-select"
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Subject</label>
                    <input
                      className="form-input"
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Reasoning"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>
                    Video URL * <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.78rem' }}>(YouTube embed, direct MP4, or Cloudinary URL)</span>
                  </label>
                  <input
                    className="form-input"
                    value={form.videoUrl}
                    onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Thumbnail URL</label>
                  <input
                    className="form-input"
                    value={form.thumbnailUrl}
                    onChange={e => setForm({ ...form, thumbnailUrl: e.target.value })}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Duration (seconds)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={form.duration}
                      onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                      placeholder="e.g. 3600"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Display Order</label>
                    <input
                      className="form-input"
                      type="number"
                      value={form.order}
                      onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Tags (comma separated)</label>
                    <input
                      className="form-input"
                      value={form.tags}
                      onChange={e => setForm({ ...form, tags: e.target.value })}
                      placeholder="ssc, reasoning, tricks"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={form.isPremium}
                      onChange={e => setForm({ ...form, isPremium: e.target.checked })}
                      style={{ accentColor: '#f6d365', width: 16, height: 16 }}
                    />
                    Premium Only
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm({ ...form, isActive: e.target.checked })}
                      style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                    />
                    Active (visible to users)
                  </label>
                </div>

                {/* Quality URLs */}
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: '0.85rem' }}>Quality Options (Optional)</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <select
                      className="form-select"
                      value={qualityForm.label}
                      onChange={e => setQualityForm({ ...qualityForm, label: e.target.value })}
                      style={{ width: 'auto', minWidth: 80, padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    >
                      {QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                    <input
                      className="form-input"
                      value={qualityForm.url}
                      onChange={e => setQualityForm({ ...qualityForm, url: e.target.value })}
                      placeholder="Video URL for this quality..."
                      style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={addQuality}
                      style={{ padding: '10px 16px', borderRadius: '10px', cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                  {form.qualities.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {form.qualities.map(q => (
                        <div key={q.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 6, fontSize: '0.82rem' }}>
                          <span style={{ background: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 }}>{q.label}</span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{q.url}</span>
                          <button
                            type="button"
                            onClick={() => removeQuality(q.label)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                    <Save size={16} /> {saving ? 'Saving...' : editing ? 'Update Video' : 'Add Video'}
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