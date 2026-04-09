import React, { useState } from 'react';
import Layout from '../components/common/Layout';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await API.put('/users/profile', form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirm) { toast.error('Passwords do not match'); return; }
    setChangingPass(true);
    try {
      await API.put('/users/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed!');
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <Layout title="Profile" subtitle="Manage your account settings">
      {/* Using grid-2 class from your CSS - will stack on mobile automatically */}
      <div className="grid grid-2 gap-6">
        {/* Profile Info Card */}
        <div className="card">
          <div className="flex items-center gap-4 mb-6 pb-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ marginBottom: 4 }}>{user?.name}</h3>
              <span className="badge badge-primary">{user?.role === 'admin' ? '🛡 Admin' : '👤 User'}</span>
            </div>
          </div>

          {/* Stats row - using grid-2 from your CSS */}
          <div className="grid grid-2 gap-3 mb-5">
            {[
              { label: 'Tests Taken', value: user?.totalAttempts || 0 },
              { label: 'Total Points', value: user?.totalScore || 0 },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-icon-wrapper">
                <User size={15} className="input-icon" />
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-icon-wrapper">
                <Mail size={15} className="input-icon" />
                <input className="form-input" value={user?.email} disabled style={{ opacity: 0.6 }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone (Optional)</label>
              <div className="input-icon-wrapper">
                <Phone size={15} className="input-icon" />
                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 xxxxx xxxxx" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={saving} style={{ gap: 8 }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <h3 style={{ marginBottom: 6 }}>Change Password</h3>
          <p style={{ marginBottom: 24, fontSize: '0.85rem' }}>Use a strong password to protect your account</p>
          <form onSubmit={handlePassword}>
            {[
              { label: 'Current Password', key: 'currentPassword', placeholder: 'Current password' },
              { label: 'New Password', key: 'newPassword', placeholder: 'Min 6 characters' },
              { label: 'Confirm New Password', key: 'confirm', placeholder: 'Repeat new password' },
            ].map(({ label, key, placeholder }) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}</label>
                <div className="input-icon-wrapper">
                  <Lock size={15} className="input-icon" />
                  <input className="form-input" type="password" value={passForm[key]} onChange={e => setPassForm({ ...passForm, [key]: e.target.value })} placeholder={placeholder} required />
                </div>
              </div>
            ))}
            <button type="submit" className="btn btn-secondary btn-full" disabled={changingPass} style={{ gap: 8 }}>
              <Lock size={16} /> {changingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div style={{ marginTop: 28, padding: 16, background: 'rgba(108,99,255,0.08)', borderRadius: 'var(--r-md)', fontSize: '0.82rem' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Account Info</div>
            <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>Member since: {new Date(user?.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
              {user?.lastLogin && <span>Last login: {new Date(user.lastLogin).toLocaleString('en-IN')}</span>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}