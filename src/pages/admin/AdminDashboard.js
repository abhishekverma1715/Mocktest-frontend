import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import { Users, BookOpen, HelpCircle, BarChart2, TrendingUp, Clock, GraduationCap, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#6366f1','#10b981','#0ea5e9','#fbbf24','#f59e0b','#f43f5e','#8b5cf6','#64748b'];

function StatCard({ label, value, icon: Icon, color, trend }) {
  return (
    <div className="card stat-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 'var(--r-md)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
        {trend && <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><TrendingUp size={12} />{trend}</span>}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', color }}>{value?.toLocaleString()}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CustomTooltip = ({ active, payload, label }) => active && payload?.length ? (
  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-base)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: '0.82rem' }}>
    <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
    <div style={{ color: 'var(--accent)' }}>{payload[0].value} attempts</div>
  </div>
) : null;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/stats').then(({ data }) => { setStats(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-4 gap-4" style={{ marginBottom: 24 }}>
        {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--r-xl)' }} />)}
      </div>
    </AdminLayout>
  );

  const statCards = [
    { label: 'Total Students', value: stats?.stats?.totalUsers || 0,     icon: Users,          color: 'var(--accent)',   trend: '+12%' },
    { label: 'Total Teachers', value: stats?.stats?.totalTeachers || 0,  icon: GraduationCap,  color: '#8b5cf6',          trend: '' },
    { label: 'Active Tests',   value: stats?.stats?.totalTests || 0,     icon: BookOpen,       color: '#10b981',          trend: '' },
    { label: 'Questions',      value: stats?.stats?.totalQuestions || 0, icon: HelpCircle,     color: '#0ea5e9',          trend: '' },
    { label: 'Total Attempts', value: stats?.stats?.totalAttempts || 0,  icon: BarChart2,      color: '#fbbf24',          trend: '+8%' },
  ];

  const chartData = (stats?.monthlyAttempts || []).map(m => ({
    month: MONTHS[m._id.month - 1],
    attempts: m.count,
  }));

  return (
    <AdminLayout title="Dashboard" subtitle="Platform overview and key metrics">
      {/* Stats */}
      <div className="grid grid-auto gap-4" style={{ marginBottom: 24 }}>
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts row */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '3fr 2fr', marginBottom: 24 }}>
        {/* Monthly chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3>Monthly Attempts</h3>
            <span className="badge badge-primary">Last 6 months</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-base)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)', fontFamily: 'var(--font)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="attempts" fill="var(--accent)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data yet</div>}
        </div>

        {/* Category pie */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Tests by Category</h3>
          {stats?.categoryStats?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={stats.categoryStats} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={65} innerRadius={30} paddingAngle={3}>
                    {stats.categoryStats.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-base)', borderRadius: 'var(--r-md)', fontSize: '0.82rem', fontFamily: 'var(--font)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {stats.categoryStats.map((c, i) => (
                  <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    {c._id} ({c.count})
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No tests yet</div>}
        </div>
      </div>

      {/* Recent tables */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Recent users */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={17} color="var(--accent)" />
            <h4>Recent Registrations</h4>
          </div>
          {(stats?.recentUsers || []).length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No users yet</div>
          ) : (stats?.recentUsers || []).map((u, i) => (
            <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < (stats.recentUsers.length - 1) ? '1px solid var(--border-base)' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', color: 'white', flexShrink: 0 }}>
                {u.name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(u.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>

        {/* Recent results */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={17} color="#fbbf24" />
            <h4>Recent Attempts</h4>
          </div>
          {(stats?.recentResults || []).length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No attempts yet</div>
          ) : (stats?.recentResults || []).map((r, i) => {
            const pct = Math.round(r.percentage || 0);
            const color = pct >= 60 ? 'var(--success)' : 'var(--danger)';
            return (
              <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < (stats.recentResults.length - 1) ? '1px solid var(--border-base)' : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: pct >= 60 ? 'var(--success-muted)' : 'var(--danger-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem', color, flexShrink: 0 }}>
                  {pct}%
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.user?.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.test?.title}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color, flexShrink: 0 }}>{r.score}/{r.totalMarks}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
