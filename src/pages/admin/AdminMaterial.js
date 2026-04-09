import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { Upload, Trash2, Edit2, Search, Plus, X, Save, Download, FileText, File, Eye, EyeOff } from 'lucide-react';

const FILE_ICONS = {
  pdf: '📄', docx: '📝', doc: '📝', ppt: '📊', pptx: '📊',
  xls: '📈', xlsx: '📈', txt: '📃', zip: '🗜️', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
};
const getIcon = (type) => FILE_ICONS[type?.toLowerCase()] || '📁';
const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function AdminMaterial() {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState({ title: '', description: '', category: '', tags: '', fileUrl: '', fileName: '', fileType: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

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
      const [matRes, catRes] = await Promise.all([
        API.get(`/material/all?search=${search}&category=${filterCat}&limit=50`),
        API.get('/categories'),
      ]);
      setMaterials(matRes.data.materials || []);
      setTotal(matRes.data.total || 0);
      setCategories(catRes.data.categories || []);
    } catch (err) { toast.error('Failed to load materials'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, filterCat]);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', description: '', category: categories[0]?.name || '', tags: '', fileUrl: '', fileName: '', fileType: '' });
    setSelectedFile(null); setFormError(''); setUploadProgress(0); setShowModal(true);
  };
  const openEdit = (m) => {
    setEditing(m._id);
    setForm({ title: m.title, description: m.description || '', category: m.category, tags: (m.tags || []).join(', '), fileUrl: m.fileUrl || '', fileName: m.fileName || '', fileType: m.fileType || '' });
    setSelectedFile(null); setFormError(''); setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error('File size must be under 50MB'); return; }
    setSelectedFile(file);
    setForm(f => ({ ...f, fileName: file.name, fileType: file.name.split('.').pop().toLowerCase() }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (!form.category.trim()) { setFormError('Category is required'); return; }
    if (!editing && !selectedFile && !form.fileUrl.trim()) { setFormError('Please select a file or enter a file URL'); return; }

    setSaving(true);
    setUploading(true);
    try {
      if (editing) {
        await API.put(`/material/${editing}`, { title: form.title, description: form.description, category: form.category, tags: form.tags, isActive: true });
        toast.success('Material updated!');
      } else {
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('category', form.category);
        formData.append('tags', form.tags);
        if (selectedFile) {
          formData.append('file', selectedFile);
        } else {
          formData.append('fileUrl', form.fileUrl);
          formData.append('fileName', form.fileName);
          formData.append('fileType', form.fileType);
        }
        await API.post('/material/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
        });
        toast.success('Material uploaded successfully!');
      }
      setShowModal(false);
      load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Save failed';
      setFormError(msg); toast.error(msg);
    } finally { setSaving(false); setUploading(false); setUploadProgress(0); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material? This cannot be undone.')) return;
    try {
      await API.delete(`/material/${id}`);
      setMaterials(prev => prev.filter(m => m._id !== id));
      toast.success('Material deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const toggleActive = async (m) => {
    try {
      await API.put(`/material/${m._id}`, { isActive: !m.isActive });
      setMaterials(prev => prev.map(x => x._id === m._id ? { ...x, isActive: !x.isActive } : x));
      toast.success(m.isActive ? 'Material hidden' : 'Material published');
    } catch { toast.error('Failed'); }
  };

  return (
    <>
      <AdminLayout title="Study Materials" subtitle={`${total} materials uploaded`}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, width: '100%' }} />
          </div>
          <select className="form-select" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 'auto', minWidth: 140, padding: '8px 12px', borderRadius: '10px' }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
          <button onClick={openAdd} className="btn btn-primary btn-sm" style={{ gap: 6, flexShrink: 0, padding: '8px 16px', borderRadius: '10px' }}>
            <Upload size={15} /> Upload Material
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : materials.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 56 }}>
            <FileText size={44} style={{ color: 'var(--text-muted)', marginBottom: 14 }} />
            <h3 style={{ marginBottom: 8 }}>No materials yet</h3>
            <p style={{ marginBottom: 20 }}>Upload PDFs, PPTs, and study files for students</p>
            <button onClick={openAdd} className="btn btn-primary btn-sm"><Upload size={14} /> Upload First Material</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {materials.map(m => (
              <div key={m._id} className="card" style={{ padding: 18, opacity: m.isActive ? 1 : 0.65, borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: '2rem', flexShrink: 0 }}>{getIcon(m.fileType)}</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: 3, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</h4>
                    {m.description && <p style={{ fontSize: '0.78rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.description}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    <button onClick={() => toggleActive(m)} className="btn btn-ghost btn-icon btn-sm" title={m.isActive ? 'Hide' : 'Publish'} style={{ color: m.isActive ? 'var(--success)' : 'var(--text-muted)', padding: '4px' }}>
                      {m.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => openEdit(m)} className="btn btn-ghost btn-icon btn-sm" style={{ padding: '4px' }}><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(m._id)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)', padding: '4px' }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>{m.category}</span>
                  {m.fileType && <span className="badge badge-info" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>{m.fileType}</span>}
                  {m.fileSize > 0 && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{formatSize(m.fileSize)}</span>}
                  {!m.isActive && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Hidden</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Download size={11} />{m.downloadCount || 0} downloads</span>
                  <span>by {m.uploadedBy?.name || 'Admin'}</span>
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
            maxWidth: '600px',
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
                {editing ? 'Edit Material' : 'Upload Study Material'}
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
                  padding: '12px 16px',
                  marginBottom: '20px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span>⚠</span> {formError}
                </div>
              )}
              <form onSubmit={handleSave}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Title *</label>
                  <input
                    className="form-input"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. SSC CGL Reasoning Notes PDF"
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Description</label>
                  <textarea
                    className="form-textarea"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
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
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    >
                      <option value="">Select...</option>
                      {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Tags (comma separated)</label>
                    <input
                      className="form-input"
                      value={form.tags}
                      onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                      placeholder="notes, pdf, ssc"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                </div>

                {!editing && (
                  <>
                    {/* File upload area */}
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Upload File *</label>
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                        padding: '24px 16px',
                        border: '2px dashed var(--border-default)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: selectedFile ? 'rgba(108,99,255,0.05)' : 'var(--bg-elevated)',
                        transition: 'all var(--t-base)'
                      }}>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png,.gif"
                        />
                        {selectedFile ? (
                          <>
                            <div style={{ fontSize: '2.5rem' }}>{getIcon(selectedFile.name.split('.').pop())}</div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{selectedFile.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatSize(selectedFile.size)}</div>
                            </div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>Click to change file</span>
                          </>
                        ) : (
                          <>
                            <Upload size={32} color="var(--text-muted)" />
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Click to select file</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>PDF, DOCX, PPT, XLS, ZIP — max 50MB</div>
                            </div>
                          </>
                        )}
                      </label>
                    </div>

                    <div style={{ textAlign: 'center', margin: '8px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>— or paste a file URL —</div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <input
                        className="form-input"
                        value={form.fileUrl}
                        onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                        placeholder="https://cloudinary.com/... or Google Drive link"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                      />
                    </div>

                    {/* Upload progress */}
                    {uploading && uploadProgress > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 5 }}>
                          <span>Uploading...</span><span>{uploadProgress}%</span>
                        </div>
                        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--r-full)', height: 6, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-cyan))',
                            width: `${uploadProgress}%`,
                            transition: 'width 0.3s',
                            borderRadius: 'var(--r-full)'
                          }} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', marginTop: editing ? 0 : 8 }}>
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
                    {saving ? (
                      <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 6 }} />{editing ? 'Updating...' : 'Uploading...'}</>
                    ) : (
                      <><Save size={14} />{editing ? 'Update' : 'Upload'}</>
                    )}
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