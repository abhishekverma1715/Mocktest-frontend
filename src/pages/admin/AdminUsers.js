import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, ShieldOff, ShieldCheck, Mail, Calendar, BarChart2 } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [toggling, setToggling] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.append('search', search);
      const { data } = await API.get(`/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load users'); }
    setLoading(false);
  };

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { load(); }, [page, search]);

  const toggleBlock = async (userId, isBlocked) => {
    setToggling(userId);
    try {
      const { data } = await API.put(`/admin/users/${userId}/toggle-block`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBlocked: data.user.isBlocked } : u));
      toast.success(data.message);
    } catch { toast.error('Action failed'); }
    setToggling(null);
  };

  return (
    <AdminLayout title="User Management" subtitle={`${total} registered users`}>
      {/* Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 35 }} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No users found</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Tests Taken</th>
                <th>Total Score</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: user.isBlocked ? 'rgba(255,101,132,0.2)' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: user.isBlocked ? 'var(--danger)' : 'white', flexShrink: 0 }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{user.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      <Mail size={13} />{user.email}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                      <BarChart2 size={13} color="var(--accent)" />{user.totalAttempts || 0}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{user.totalScore || 0}</span>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Calendar size={13} />{new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.isBlocked ? 'badge-danger' : 'badge-success'}`}>
                      {user.isBlocked ? '🚫 Blocked' : '✓ Active'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleBlock(user._id, user.isBlocked)}
                      disabled={toggling === user._id}
                      className="btn btn-sm"
                      style={{ gap: 5, background: user.isBlocked ? 'rgba(67,233,123,0.1)' : 'rgba(255,101,132,0.1)', color: user.isBlocked ? 'var(--success)' : 'var(--danger)', border: 'none', cursor: toggling === user._id ? 'not-allowed' : 'pointer' }}>
                      {toggling === user._id ? (
                        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                      ) : user.isBlocked ? (
                        <><ShieldCheck size={14} />Unblock</>
                      ) : (
                        <><ShieldOff size={14} />Block</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
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
