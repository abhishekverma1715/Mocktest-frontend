import React, { useEffect, useState } from 'react';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { Search, Download, FileText, ExternalLink, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const FILE_ICONS = {
  pdf: '📄', docx: '📝', doc: '📝', ppt: '📊', pptx: '📊',
  xls: '📈', xlsx: '📈', txt: '📃', zip: '🗜️', png: '🖼️', jpg: '🖼️', jpeg: '🖼️',
};
const getIcon = (type) => FILE_ICONS[type?.toLowerCase()] || '📁';
const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function StudyMaterialPage() {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [total, setTotal] = useState(0);
  const [downloading, setDownloading] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [matRes, catRes] = await Promise.all([
        API.get(`/material?search=${search}&category=${filterCat}&limit=30`),
        API.get('/categories'),
      ]);
      setMaterials(matRes.data.materials || []);
      setTotal(matRes.data.total || 0);
      setCategories(catRes.data.categories || []);
    } catch { toast.error('Failed to load materials'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, filterCat]);

  const handleDownload = async (material) => {
    setDownloading(material._id);
    try {
      await API.post(`/material/${material._id}/download`);
      // Open the file
      const url = material.downloadUrl || material.fileUrl;
      window.open(url, '_blank', 'noopener,noreferrer');
      setMaterials(prev => prev.map(m => m._id === material._id ? { ...m, downloadCount: (m.downloadCount || 0) + 1 } : m));
      toast.success('Download started!');
    } catch {
      toast.error('Download failed');
    } finally { setDownloading(null); }
  };

  return (
    <Layout title="📚 Study Materials" subtitle={`${total} resources available for download`}>
      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
        </div>
        <select className="form-select" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilterCat('')} style={{ padding: '5px 14px', borderRadius: 'var(--r-full)', border: '1.5px solid', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 500, fontSize: '0.82rem', flexShrink: 0, background: !filterCat ? 'var(--accent)' : 'transparent', color: !filterCat ? 'white' : 'var(--text-secondary)', borderColor: !filterCat ? 'var(--accent)' : 'var(--border-base)' }}>
          All
        </button>
        {categories.map(c => (
          <button key={c._id} onClick={() => setFilterCat(c.name)} style={{ padding: '5px 14px', borderRadius: 'var(--r-full)', border: '1.5px solid', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 500, fontSize: '0.82rem', flexShrink: 0, background: filterCat === c.name ? 'var(--accent)' : 'transparent', color: filterCat === c.name ? 'white' : 'var(--text-secondary)', borderColor: filterCat === c.name ? 'var(--accent)' : 'var(--border-base)' }}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : materials.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 56 }}>
          <FileText size={44} style={{ color: 'var(--text-muted)', marginBottom: 14 }} />
          <h3 style={{ marginBottom: 8 }}>No materials found</h3>
          <p>Try adjusting your search or category filter</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {materials.map(m => (
            <div key={m._id} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                  {getIcon(m.fileType)}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h4 style={{ fontSize: '0.9rem', lineHeight: 1.4, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{m.title}</h4>
                  {m.description && <p style={{ fontSize: '0.78rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.description}</p>}
                </div>
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>{m.category}</span>
                {m.fileType && <span className="badge badge-info" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>{m.fileType}</span>}
                {m.fileSize > 0 && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: 4 }}>{formatSize(m.fileSize)}</span>}
                {(m.tags || []).slice(0, 2).map(tag => (
                  <span key={tag} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>#{tag}</span>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Download size={11} />{m.downloadCount || 0} downloads
                </span>
                <button onClick={() => handleDownload(m)} disabled={downloading === m._id}
                  className="btn btn-primary btn-sm" style={{ gap: 5 }}>
                  {downloading === m._id ? (
                    <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />Opening...</>
                  ) : (
                    <><Download size={13} />Download</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
