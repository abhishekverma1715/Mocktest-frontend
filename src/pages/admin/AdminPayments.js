import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { CreditCard, Crown, TrendingUp, Users, Plus, Edit2, Trash2, X, Save, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('payments');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ name: '', slug: '', description: '', price: 0, durationDays: 30, features: '', isActive: true, isPopular: false, order: 0 });
  const [savingPlan, setSavingPlan] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showPlanModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPlanModal]);

  useEffect(() => {
    Promise.all([
      API.get(`/payments/all?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}`),
      API.get('/plans/all'),
      API.get('/payments/stats'),
    ]).then(([pRes, planRes, statsRes]) => {
      setPayments(pRes.data.payments || []);
      setTotal(pRes.data.total || 0);
      setPlans(planRes.data.plans || []);
      setStats(statsRes.data.stats);
      setLoading(false);
    }).catch((err) => {
      console.error('AdminPayments load error:', err);
      toast.error('Failed to load payment data');
      setLoading(false);
    });
  }, [page, statusFilter]);

  const reloadPayments = async () => {
    const { data } = await API.get(`/payments/all?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}`);
    setPayments(data.payments || []);
    setTotal(data.total || 0);
  };

  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({ name: '', slug: '', description: '', price: 0, durationDays: 30, features: '', isActive: true, isPopular: false, order: 0 });
    setShowPlanModal(true);
  };
  const openEditPlan = (plan) => {
    setEditingPlan(plan._id);
    setPlanForm({ ...plan, features: (plan.features || []).join('\n') });
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setSavingPlan(true);
    const payload = { ...planForm, features: planForm.features ? planForm.features.split('\n').map(f => f.trim()).filter(Boolean) : [], slug: planForm.slug || planForm.name.toLowerCase().replace(/\s+/g, '-') };
    try {
      if (editingPlan) {
        const { data } = await API.put(`/plans/${editingPlan}`, payload);
        setPlans(prev => prev.map(p => p._id === editingPlan ? data.plan : p));
        toast.success('Plan updated!');
      } else {
        const { data } = await API.post('/plans', payload);
        setPlans(prev => [...prev, data.plan]);
        toast.success('Plan created!');
      }
      setShowPlanModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    setSavingPlan(false);
  };

  const togglePlan = async (id, current) => {
    try {
      await API.put(`/plans/${id}`, { isActive: !current });
      setPlans(prev => prev.map(p => p._id === id ? { ...p, isActive: !current } : p));
      toast.success(current ? 'Plan disabled' : 'Plan enabled');
    } catch { toast.error('Failed'); }
  };

  const statCards = [
    { label: 'Total Revenue', value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`, icon: TrendingUp, color: 'var(--success)' },
    { label: 'Transactions', value: stats?.totalPayments || 0, icon: CreditCard, color: 'var(--accent)' },
    { label: 'Successful', value: stats?.successPayments || 0, icon: CreditCard, color: 'var(--info)' },
    { label: 'Premium Users', value: stats?.premiumUsers || 0, icon: Crown, color: '#f6d365' },
  ];

  return (
    <>
      <AdminLayout title="Payments & Membership" subtitle="Manage subscriptions and transactions">
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, borderLeft: `3px solid ${color}` }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1, color }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: 4, width: 'fit-content', flexWrap: 'wrap' }}>
          {[['payments', 'Transactions'], ['plans', 'Subscription Plans']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                fontWeight: 600,
                fontSize: '0.88rem',
                transition: 'var(--transition)',
                background: tab === val ? 'var(--accent)' : 'transparent',
                color: tab === val ? 'white' : 'var(--text-secondary)'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : tab === 'payments' ? (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[['', 'All'], ['success', 'Success'], ['pending', 'Pending'], ['failed', 'Failed']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 'var(--r-full)',
                    border: '1.5px solid',
                    cursor: 'pointer',
                    fontFamily: 'var(--font)',
                    fontWeight: 500,
                    fontSize: '0.82rem',
                    background: statusFilter === val ? 'var(--accent)' : 'transparent',
                    color: statusFilter === val ? 'white' : 'var(--text-secondary)',
                    borderColor: statusFilter === val ? 'var(--accent)' : 'var(--border-base)'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>User</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Plan</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Gateway</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Membership Until</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id}>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{p.user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.user?.email}</div>
                      </td>
                      <td style={{ padding: '10px 8px', fontWeight: 500 }}>{p.plan?.name}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--success)' }}>₹{p.amount}</td>
                      <td style={{ padding: '10px 8px' }}><span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{p.gateway}</span></td>
                      <td style={{ padding: '10px 8px' }}>
                        <span className={`badge ${p.status === 'success' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>{p.status}</span>
                      </td>
                      <td style={{ padding: '10px 8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{p.membershipEnd ? new Date(p.membershipEnd).toLocaleDateString('en-IN') : '-'}</td>
                      <td style={{ padding: '10px 8px', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > 20 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <span style={{ padding: '6px 14px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {page}</span>
                <button className="btn btn-secondary btn-sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={openAddPlan} className="btn btn-primary" style={{ gap: 6 }}><Plus size={16} /> New Plan</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {plans.map(plan => (
                <div key={plan._id} className="card" style={{ padding: 20, opacity: plan.isActive ? 1 : 0.6, borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ marginBottom: 4 }}>{plan.name} {plan.isPopular && <span style={{ fontSize: '0.65rem', background: '#f6d365', color: '#1a1a2e', padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>POPULAR</span>}</h4>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent)' }}>{plan.price === 0 ? 'FREE' : `₹${plan.price}`}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{plan.durationDays} days</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEditPlan(plan)} className="btn btn-ghost btn-icon btn-sm" style={{ padding: '4px' }}><Edit2 size={14} /></button>
                      <button onClick={() => togglePlan(plan._id, plan.isActive)} className="btn btn-ghost btn-icon btn-sm" style={{ color: plan.isActive ? 'var(--success)' : 'var(--text-muted)', padding: '4px' }}>
                        {plan.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(plan.features || []).slice(0, 3).map((f, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: 6 }}>
                        <span style={{ color: 'var(--success)' }}>✓</span>{f}
                      </div>
                    ))}
                    {plan.features?.length > 3 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{plan.features.length - 3} more features</div>}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <span className={`badge ${plan.isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>{plan.isActive ? 'Active' : 'Disabled'}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </AdminLayout>

      {/* ── FIXED PLAN MODAL - OUTSIDE AdminLayout ── */}
      {showPlanModal && (
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
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </h3>
              <button
                onClick={() => setShowPlanModal(false)}
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
              <form onSubmit={handleSavePlan}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Plan Name *</label>
                    <input
                      className="form-input"
                      value={planForm.name}
                      onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="e.g. Monthly Pro"
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Slug</label>
                    <input
                      className="form-input"
                      value={planForm.slug}
                      onChange={e => setPlanForm({ ...planForm, slug: e.target.value })}
                      placeholder="monthly-pro (auto)"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Description</label>
                  <input
                    className="form-input"
                    value={planForm.description}
                    onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                    placeholder="Brief description"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Price (₹) *</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      value={planForm.price}
                      onChange={e => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Duration (days) *</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      value={planForm.durationDays}
                      onChange={e => setPlanForm({ ...planForm, durationDays: parseInt(e.target.value) || 30 })}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Display Order</label>
                    <input
                      className="form-input"
                      type="number"
                      value={planForm.order}
                      onChange={e => setPlanForm({ ...planForm, order: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem' }}>Features (one per line)</label>
                  <textarea
                    className="form-textarea"
                    value={planForm.features}
                    onChange={e => setPlanForm({ ...planForm, features: e.target.value })}
                    placeholder="Unlimited mock tests&#10;Video lectures&#10;Detailed analytics"
                    rows={4}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={planForm.isActive}
                      onChange={e => setPlanForm({ ...planForm, isActive: e.target.checked })}
                      style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                    />
                    Active
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={planForm.isPopular}
                      onChange={e => setPlanForm({ ...planForm, isPopular: e.target.checked })}
                      style={{ accentColor: '#f6d365', width: 16, height: 16 }}
                    />
                    Mark as Popular
                  </label>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => setShowPlanModal(false)}
                    className="btn btn-secondary"
                    disabled={savingPlan}
                    style={{ padding: '10px 24px', borderRadius: '10px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingPlan}
                    style={{ gap: 8, padding: '10px 28px', borderRadius: '10px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <Save size={15} /> {savingPlan ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
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