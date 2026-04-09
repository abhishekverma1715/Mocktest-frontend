import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save, RefreshCw, Tag } from 'lucide-react';

const ICONS = ['📚','🏛️','🚂','🏦','📜','⚔️','🗺️','📖','🎯','🔬','💻','🌐','🏅','📐','🧮','🖊️','🌍','⚽','🎓','🏥'];
const BLANK = { name:'', description:'', icon:'📚', color:'#6366f1', order:0 };

function CategoryCard({ cat, onEdit, onDelete, onReactivate }) {
  const isActive = cat.isActive !== false;
  return (
    <div className="card" style={{
      padding:18, borderTop:`3px solid ${cat.color||'#6366f1'}`,
      opacity: isActive ? 1 : 0.55,
      display:'flex', flexDirection:'column', gap:12,
      transition:'all var(--t-base)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ fontSize:'2rem', lineHeight:1 }}>{cat.icon||'📚'}</div>
        <div style={{ display:'flex', gap:3 }}>
          {isActive ? (
            <>
              <button onClick={() => onEdit(cat)} className="btn btn-ghost btn-icon-sm" title="Edit" style={{ borderRadius:'var(--r-sm)' }}>
                <Edit2 size={13} />
              </button>
              <button onClick={() => onDelete(cat._id)} className="btn btn-ghost btn-icon-sm" title="Deactivate" style={{ color:'var(--danger)', borderRadius:'var(--r-sm)' }}>
                <Trash2 size={13} />
              </button>
            </>
          ) : (
            <button onClick={() => onReactivate(cat._id)} className="btn btn-ghost btn-icon-sm" title="Reactivate" style={{ color:'var(--success)', borderRadius:'var(--r-sm)' }}>
              <RefreshCw size={13} />
            </button>
          )}
        </div>
      </div>

      <div style={{ flex:1 }}>
        <h4 style={{ marginBottom:4, fontSize:'0.95rem' }}>{cat.name}</h4>
        {cat.description && <p style={{ fontSize:'0.78rem', margin:0, lineHeight:1.55 }}>{cat.description}</p>}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:13, height:13, borderRadius:'50%', background:cat.color||'#6366f1', flexShrink:0 }} />
          <span style={{ fontSize:'0.68rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{cat.color}</span>
        </div>
        <span style={{ fontSize:'0.68rem', color:'var(--text-muted)', background:'var(--bg-elevated)', padding:'2px 8px', borderRadius:'var(--r-full)' }}>
          Order: {cat.order||0}
        </span>
      </div>

      {!isActive && (
        <div style={{ fontSize:'0.7rem', color:'var(--warning)', background:'var(--warning-muted)', padding:'4px 10px', borderRadius:'var(--r-sm)', textAlign:'center', border:'1px solid var(--warning-border)' }}>
          Deactivated
        </div>
      )}
    </div>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(BLANK);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

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
      const { data } = await API.get('/categories/all');
      setCategories(data.categories || []);
    } catch {
      try {
        const { data } = await API.get('/categories');
        setCategories(data.categories || []);
      } catch { toast.error('Failed to load categories'); }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm(BLANK); setError(''); setShowModal(true); };
  const openEdit = (cat) => {
    setEditing(cat._id);
    setForm({ name:cat.name, description:cat.description||'', icon:cat.icon||'📚', color:cat.color||'#6366f1', order:cat.order||0 });
    setError('');
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Category name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        const { data } = await API.put(`/categories/${editing}`, form);
        setCategories(prev => prev.map(c => c._id === editing ? data.category : c));
        toast.success('Category updated!');
      } else {
        const { data } = await API.post('/categories', form);
        setCategories(prev => [...prev, data.category]);
        toast.success('Category created!');
      }
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message || 'Save failed';
      setError(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this category?')) return;
    try {
      await API.delete(`/categories/${id}`);
      setCategories(prev => prev.map(c => c._id === id ? { ...c, isActive:false } : c));
      toast.success('Category deactivated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReactivate = async (id) => {
    try {
      const { data } = await API.put(`/categories/${id}`, { isActive:true });
      setCategories(prev => prev.map(c => c._id === id ? data.category : c));
      toast.success('Category reactivated');
    } catch { toast.error('Failed'); }
  };

  const active   = categories.filter(c => c.isActive !== false);
  const inactive = categories.filter(c => c.isActive === false);

  return (
    <>
      <AdminLayout
        title="Test Categories"
        subtitle={`${active.length} active categor${active.length===1?'y':'ies'}`}
        actions={
          <button onClick={openAdd} className="btn btn-primary btn-sm" style={{ gap:6 }}>
            <Plus size={14} /> Add Category
          </button>
        }>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" /></div>
        ) : (
          <>
            {active.length === 0 && (
              <div className="card" style={{ textAlign:'center', padding:'48px 20px', marginBottom:16 }}>
                <div style={{ width:64, height:64, borderRadius:'var(--r-2xl)', background:'var(--accent-muted)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <Tag size={28} style={{ color:'var(--accent)' }} />
                </div>
                <h3 style={{ marginBottom:8 }}>No categories yet</h3>
                <p style={{ marginBottom:18 }}>Add categories to organise your tests</p>
                <button onClick={openAdd} className="btn btn-primary btn-sm"><Plus size={14} /> Add First Category</button>
              </div>
            )}

            {active.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, marginBottom: inactive.length>0?28:0 }}>
                {active.map(cat => (
                  <CategoryCard key={cat._id} cat={cat} onEdit={openEdit} onDelete={handleDelete} onReactivate={handleReactivate} />
                ))}
              </div>
            )}

            {inactive.length > 0 && (
              <>
                <h4 style={{ marginBottom:12, color:'var(--text-muted)', fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                  Deactivated ({inactive.length})
                </h4>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
                  {inactive.map(cat => (
                    <CategoryCard key={cat._id} cat={cat} onEdit={openEdit} onDelete={handleDelete} onReactivate={handleReactivate} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </AdminLayout>

      {/* ── FIXED MODAL - OUTSIDE AdminLayout ─────────────────────────────────────────── */}
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
            maxWidth: '550px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--r-md)',
                  background: 'var(--accent-muted)',
                  border: '1px solid var(--accent-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Tag size={15} style={{ color: 'var(--accent)' }} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>
                  {editing ? 'Edit Category' : 'Add New Category'}
                </h3>
              </div>
              <button
                onClick={closeModal}
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
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '24px' }}>
              {/* Error */}
              {error && (
                <div style={{
                  padding: '12px 16px',
                  marginBottom: '20px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '0.85rem'
                }}>
                  <span>{error}</span>
                </div>
              )}

              {/* Name + Order */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Category Name *</label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Banking, SSC"
                    required
                    autoFocus
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0, width: 90 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Order</label>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Description</label>
                <input
                  className="form-input"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description (optional)"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                />
              </div>

              {/* Icon picker */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Icon (Emoji)</label>
                <div style={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  padding: '10px 12px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-base)',
                  marginBottom: 8
                }}>
                  {ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, icon }))}
                      style={{
                        fontSize: '1.25rem',
                        padding: '5px 7px',
                        borderRadius: '8px',
                        border: `2px solid ${form.icon === icon ? 'var(--accent)' : 'transparent'}`,
                        background: form.icon === icon ? 'var(--accent-muted)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all var(--t-fast)',
                        lineHeight: 1
                      }}>
                      {icon}
                    </button>
                  ))}
                </div>
                <input
                  className="form-input"
                  value={form.icon}
                  onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="Or type any emoji…"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                />
              </div>

              {/* Color */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Accent Color</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    style={{
                      width: 44,
                      height: 40,
                      border: '1.5px solid var(--border-base)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: 'none',
                      padding: 3,
                      flexShrink: 0
                    }}
                  />
                  <input
                    className="form-input"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    placeholder="#6366f1"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>
                {/* Preview */}
                <div style={{
                  marginTop: 10,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  borderLeft: `4px solid ${form.color}`,
                  background: `${form.color}12`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <span style={{ fontSize: '1.2rem' }}>{form.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: form.color }}>{form.name || 'Category Preview'}</div>
                    {form.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{form.description}</div>}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={closeModal}
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
                  style={{ gap: 6, minWidth: 120, padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {saving ? (
                    <><div className="spinner spinner-sm" style={{ borderWidth: 2, marginRight: 6 }} />Saving…</>
                  ) : (
                    <><Save size={14} />{editing ? 'Update' : 'Create'}</>
                  )}
                </button>
              </div>
            </form>
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