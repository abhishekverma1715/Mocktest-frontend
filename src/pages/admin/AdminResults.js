import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import { Clock, Trophy, CheckCircle2, BarChart2 } from 'lucide-react';

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    API.get(`/admin/results?page=${page}&limit=20`).then(({ data }) => {
      setResults(data.results || []);
      setTotal(data.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page]);

  const formatTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <AdminLayout title="All Results" subtitle={`${total} total test submissions`}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : results.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          <BarChart2 size={40} style={{ marginBottom: 12 }} />
          <p>No test submissions yet</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Test</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Correct</th>
                <th>Time Taken</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => {
                const pct = Math.round(r.percentage);
                const pctColor = pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
                return (
                  <tr key={r._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem', color: 'white', flexShrink: 0 }}>
                          {r.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{r.user?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <span style={{ fontSize: '0.85rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.test?.title || 'N/A'}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.test?.category}</span>
                    </td>
                    <td><span style={{ fontWeight: 700 }}>{r.score}/{r.totalMarks}</span></td>
                    <td><span style={{ fontWeight: 700, color: pctColor }}>{pct}%</span></td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontWeight: 600, fontSize: '0.88rem' }}>
                        <CheckCircle2 size={13} />{r.correctAnswers}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <Clock size={13} />{formatTime(r.timeTaken)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.status === 'auto-submitted' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.72rem' }}>
                        {r.status === 'auto-submitted' ? '⏱ Auto' : '✓ Done'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ padding: '6px 14px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {page} of {Math.ceil(total / 20)}</span>
          <button className="btn btn-secondary btn-sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </AdminLayout>
  );
}
