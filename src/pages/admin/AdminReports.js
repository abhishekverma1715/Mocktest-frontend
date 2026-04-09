import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { Flag, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

const STATUS_COLORS = { pending: 'badge-warning', reviewed: 'badge-info', resolved: 'badge-success', rejected: 'badge-danger' };
const TYPE_LABELS = { wrong_answer: 'Wrong Answer', unclear_question: 'Unclear Question', typo: 'Typo', wrong_explanation: 'Wrong Explanation', suggestion: 'Suggestion', other: 'Other' };

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState({});
  const [resolving, setResolving] = useState(null);
  const [resolveForm, setResolveForm] = useState({ status: 'resolved', adminNote: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filter) params.append('status', filter);
      const { data } = await API.get(`/reports/all?${params}`);
      setReports(data.reports || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load reports'); }
    setLoading(false);
  };

  useEffect(() => { setPage(1); }, [filter]);
  useEffect(() => { load(); }, [page, filter]);

  const handleResolve = async (id) => {
    try {
      const { data } = await API.put(`/reports/${id}/resolve`, resolveForm);
      setReports(prev => prev.map(r => r._id === id ? data.report : r));
      setResolving(null);
      toast.success('Report updated!');
    } catch { toast.error('Failed to update'); }
  };

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <AdminLayout title="Question Reports" subtitle={`${total} total reports · ${pendingCount} pending`}>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['', 'All'], ['pending', 'Pending'], ['reviewed', 'Reviewed'], ['resolved', 'Resolved'], ['rejected', 'Rejected']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ padding: '6px 16px', borderRadius: 'var(--r-full)', border: '1.5px solid', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 500, fontSize: '0.85rem', transition: 'var(--transition)', background: filter === val ? 'var(--accent)' : 'transparent', color: filter === val ? 'white' : 'var(--text-secondary)', borderColor: filter === val ? 'var(--accent)' : 'var(--border-base)' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : reports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Flag size={40} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <p>No reports found</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {reports.map((report, i) => {
            const isExp = expanded[report._id];
            const isResolving = resolving === report._id;
            return (
              <div key={report._id} style={{ borderBottom: i < reports.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: report.status === 'pending' ? 'rgba(247,151,30,0.15)' : report.status === 'resolved' ? 'rgba(67,233,123,0.15)' : 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Flag size={16} color={report.status === 'pending' ? 'var(--warning)' : report.status === 'resolved' ? 'var(--success)' : 'var(--accent)'} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`badge ${STATUS_COLORS[report.status]}`} style={{ fontSize: '0.7rem' }}>{report.status}</span>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{TYPE_LABELS[report.type] || report.type}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by {report.user?.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: '0 0 4px', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Issue: </strong>{report.description}
                    </p>
                    {report.question && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        <strong>Q: </strong>{report.question.text}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {report.status === 'pending' && (
                      <button onClick={() => { setResolving(report._id); setResolveForm({ status: 'resolved', adminNote: '' }); }} className="btn btn-ghost btn-icon btn-sm" title="Resolve">
                        <Edit2 size={14} />
                      </button>
                    )}
                    <button onClick={() => setExpanded(p => ({ ...p, [report._id]: !p[report._id] }))} className="btn btn-ghost btn-icon btn-sm">
                      {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExp && (
                  <div style={{ padding: '0 20px 16px 72px', animation: 'fadeIn 0.2s ease' }}>
                    {report.question && (
                      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: '12px 14px', marginBottom: 12 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>Reported Question:</div>
                        <p style={{ fontSize: '0.85rem', margin: '0 0 8px' }}>{report.question.text}</p>
                        {report.question.options && ['A','B','C','D'].map(opt => (
                          <div key={opt} style={{ fontSize: '0.8rem', padding: '4px 0', color: opt === report.question.correctAnswer ? 'var(--success)' : 'var(--text-secondary)' }}>
                            {opt}. {report.question.options[opt]} {opt === report.question.correctAnswer ? '✓' : ''}
                          </div>
                        ))}
                      </div>
                    )}
                    {report.adminNote && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '8px 12px', background: 'rgba(108,99,255,0.08)', borderRadius: 6 }}>
                        <strong>Admin Note:</strong> {report.adminNote}
                      </div>
                    )}
                  </div>
                )}

                {/* Resolve form */}
                {isResolving && (
                  <div style={{ padding: '12px 20px 16px 72px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <select className="form-select" value={resolveForm.status} onChange={e => setResolveForm({ ...resolveForm, status: e.target.value })} style={{ width: 'auto' }}>
                        <option value="reviewed">Mark as Reviewed</option>
                        <option value="resolved">Mark as Resolved</option>
                        <option value="rejected">Reject Report</option>
                      </select>
                      <input className="form-input" style={{ flex: 1, minWidth: 200 }} value={resolveForm.adminNote} onChange={e => setResolveForm({ ...resolveForm, adminNote: e.target.value })} placeholder="Admin note (optional)..." />
                      <button onClick={() => handleResolve(report._id)} className="btn btn-primary btn-sm" style={{ gap: 6 }}><CheckCircle2 size={14} />Update</button>
                      <button onClick={() => setResolving(null)} className="btn btn-secondary btn-sm"><XCircle size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {total > 15 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ padding: '6px 14px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {page}</span>
          <button className="btn btn-secondary btn-sm" disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </AdminLayout>
  );
}
