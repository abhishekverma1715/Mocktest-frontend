import React, { useEffect, useState } from 'react';
import TeacherLayout from '../../components/teacher/TeacherLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save, Play, Eye } from 'lucide-react';

const QUALITIES = ['360p', '480p', '720p', '1080p'];
const BLANK = { title: '', description: '', category: '', subject: '', videoUrl: '', thumbnailUrl: '', duration: 0, isPremium: false, isActive: true, order: 0, tags: '', qualities: [] };

export default function TeacherVideos() {
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
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
    Promise.all([API.get('/videos/manage'), API.get('/categories')]).then(([vRes, cRes]) => {
      setVideos(vRes.data.videos || []);
      setCategories(cRes.data.categories || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const openAdd = () => { setEditing(null); setForm({ ...BLANK, category: categories[0]?.name || '' }); setShowModal(true); };
  const openEdit = (v) => { setEditing(v._id); setForm({ ...v, tags: (v.tags || []).join(', '), qualities: v.qualities || [] }); setShowModal(true); };

  const addQuality = () => {
    if (!qualityForm.url.trim()) return;
    const idx = form.qualities.findIndex(q => q.label === qualityForm.label);
    if (idx > -1) { const u = [...form.qualities]; u[idx] = qualityForm; setForm(f => ({ ...f, qualities: u })); }
    else setForm(f => ({ ...f, qualities: [...f.qualities, { ...qualityForm }] }));
    setQualityForm({ label: '720p', url: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.videoUrl.trim()) { toast.error('Title and video URL required'); return; }
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
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const formatDur = (s) => { if (!s) return ''; const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };

  return (
    <>
      <TeacherLayout title="My Videos" subtitle={`${videos.length} videos uploaded`}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
          <button onClick={openAdd} className="btn btn-sm" style={{
            gap: 6,
            background: 'rgba(167,139,250,0.15)',
            color: '#a78bfa',
            border: '1px solid rgba(167,139,250,0.3)',
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            fontWeight: 600,
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 16px'
          }}>
            <Plus size={15} /> Add Video
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : videos.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48, borderRadius: '12px' }}>
            <Play size={40} style={{ color: 'var(--text-muted)', marginBottom: 14 }} />
            <p style={{ marginBottom: 14 }}>No videos uploaded yet</p>
            <button onClick={openAdd} className="btn btn-sm" style={{
              background: 'rgba(167,139,250,0.15)',
              color: '#a78bfa',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              fontWeight: 600,
              borderRadius: 8,
              padding: '8px 16px'
            }}>Upload First Video</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {videos.map(v => (
              <div key={v._id} className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px' }}>
                <div style={{ position: 'relative', paddingBottom: '45%', background: 'var(--bg-elevated)' }}>
                  {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt={v.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                    : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={30} color="var(--text-muted)" /></div>}
                  <div style={{ position: 'absolute', top: 7, right: 7, display: 'flex', gap: 4 }}>
                    {v.isPremium && <span style={{ background: '#f6d365', color: '#1a1a2e', padding: '2px 6px', borderRadius: 4, fontSize: '0.62rem', fontWeight: 700 }}>PREMIUM</span>}
                    {!v.isActive && <span style={{ background: 'var(--danger)', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: '0.62rem', fontWeight: 700 }}>HIDDEN</span>}
                  </div>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
                    <h4 style={{ fontSize: '0.875rem', lineHeight: 1.4, flex: 1 }}>{v.title}</h4>
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      <button onClick={() => openEdit(v)} className="btn btn-ghost btn-icon btn-sm" style={{ padding: '4px' }}><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(v._id)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)', padding: '4px' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{v.category}</span>
                    {v.subject && <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{v.subject}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={11} />{v.views}</span>
                    {v.duration > 0 && <span>{formatDur(v.duration)}</span>}
                  </div>
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
                {editing ? 'Edit Video' : 'Upload New Video'}
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
                    rows={3}
                    placeholder="Brief description of the video..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', resize: 'vertical', minHeight: '60px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Category *</label>
                    <select
                      className="form-select"
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
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
                    Video URL * <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.72rem' }}>(YouTube embed, MP4, Cloudinary)</span>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
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
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Tags (comma separated)</label>
                    <input
                      className="form-input"
                      value={form.tags}
                      onChange={e => setForm({ ...form, tags: e.target.value })}
                      placeholder="ssc, reasoning"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
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
                      placeholder="URL for this quality..."
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
                        <div key={q.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 6, fontSize: '0.8rem' }}>
                          <span style={{ background: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 600 }}>{q.label}</span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{q.url}</span>
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, qualities: f.qualities.filter(x => x.label !== q.label) }))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={form.isPremium}
                      onChange={e => setForm({ ...form, isPremium: e.target.checked })}
                      style={{ accentColor: '#f6d365', width: 16, height: 16 }}
                    />
                    Premium Only
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm({ ...form, isActive: e.target.checked })}
                      style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                    />
                    Active (visible to students)
                  </label>
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
                    disabled={saving}
                    style={{
                      background: 'rgba(167,139,250,0.9)',
                      color: 'white',
                      border: 'none',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.7 : 1,
                      gap: 8,
                      fontFamily: 'var(--font)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      padding: '10px 28px',
                      borderRadius: 10,
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                  >
                    <Save size={14} /> {saving ? 'Saving...' : editing ? 'Update Video' : 'Upload Video'}
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