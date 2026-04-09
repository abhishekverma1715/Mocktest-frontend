import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { Search, Clock, BookOpen, Users, Play, Filter, ChevronRight } from 'lucide-react';

const CAT_COLORS = {
  SSC:'#6366f1', Railway:'#10b981', Banking:'#0ea5e9', UPSC:'#fbbf24',
  Defence:'#f59e0b', 'State PSC':'#f43f5e', Teaching:'#8b5cf6', Other:'#64748b'
};
const DIFF_COLORS = { Easy: 'var(--success)', Medium: 'var(--warning)', Hard: 'var(--danger)', Mixed: 'var(--info)' };

function TestCard({ test }) {
  const color = CAT_COLORS[test.category] || '#6366f1';
  const diffColor = DIFF_COLORS[test.difficulty] || 'var(--text-muted)';
  return (
    <div className="card card-hover animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: `${color}15`, color, borderColor: `${color}30` }}>{test.category}</span>
          <span className="badge badge-muted" style={{ color: diffColor }}>{test.difficulty}</span>
        </div>
        {test.negativeMarking && (
          <span className="badge badge-danger" style={{ fontSize: '0.62rem' }}>-{test.negativeMarks}</span>
        )}
      </div>

      <div>
        <h4 className="line-clamp-2" style={{ marginBottom: 6, lineHeight: 1.4 }}>{test.title}</h4>
        {test.description && <p className="line-clamp-2" style={{ fontSize: '0.82rem' }}>{test.description}</p>}
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <BookOpen size={13} />{test.totalQuestions} Questions
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <Clock size={13} />{test.duration} min
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <Users size={13} />{test.attempts || 0} attempts
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{test.totalMarks} marks</span>
        <Link to={`/exam/${test._id}`} className="btn btn-primary btn-sm" style={{ gap: 5 }}>
          Start <Play size={12} fill="currentColor" />
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card">
      <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 14, width: 70 }} />)}
      </div>
      <div className="skeleton" style={{ height: 34, width: 90, marginLeft: 'auto', borderRadius: 'var(--r-full)' }} />
    </div>
  );
}

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      if (category !== 'All') params.append('category', category);
      const [tRes, cRes] = await Promise.all([API.get(`/tests?${params}`), API.get('/categories')]);
      setTests(tRes.data.tests || []);
      setTotal(tRes.data.total || 0);
      setCategories(cRes.data.categories || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { setPage(1); }, [search, category]);
  useEffect(() => { load(); }, [page, search, category]);

  const allCats = [{ name: 'All' }, ...categories];

  return (
    <Layout
      title="Mock Tests"
      subtitle={`${total} tests available across all categories`}
      actions={<span className="badge badge-primary badge-lg">{total} Tests</span>}
    >
      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div className="input-icon-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} className="input-icon" />
          <input className="form-input" placeholder="Search tests..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          <select className="form-select" value={category} onChange={e => setCategory(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
            {allCats.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {allCats.map(c => (
          <button key={c.name} className={`chip ${category === c.name ? 'active' : ''}`} onClick={() => setCategory(c.name)}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-auto gap-4">
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="card text-center" style={{ padding: '56px 20px' }}>
          <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: 14 }} />
          <h3 style={{ marginBottom: 8 }}>No tests found</h3>
          <p>Try adjusting your search or select a different category</p>
        </div>
      ) : (
        <div className="grid grid-auto gap-4">
          {tests.map(t => <TestCard key={t._id} test={t} />)}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32 }}>
          <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ padding: '6px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-full)', fontSize: '0.85rem', border: '1px solid var(--border-base)' }}>
            Page {page} of {Math.ceil(total / 12)}
          </span>
          <button className="btn btn-outline btn-sm" disabled={page * 12 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </Layout>
  );
}
