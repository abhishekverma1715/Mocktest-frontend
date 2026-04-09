import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, Save, Lock, Eye, EyeOff,
  Shield, Calendar, CheckCircle2, AlertCircle
} from 'lucide-react';

function PasswordStrength({ password }) {
  const checks = [
    { label: '6+ characters', ok: password.length >= 6 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['', '#ff6584', '#f7971e', '#f6d365', '#43e97b'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= score ? colors[score] : 'var(--bg-elevated)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {checks.map(c => (
            <span key={c.label} style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 3, color: c.ok ? 'var(--success)' : 'var(--text-muted)' }}>
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: colors[score] }}>{labels[score]}</span>}
      </div>
    </div>
  );
}

export default function AdminProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', avatar: '' });
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', email: user.email || '', phone: user.phone || '', avatar: user.avatar || '' });
    }
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) { toast.error('Name is required'); return; }
    setSavingProfile(true);
    try {
      const { data } = await API.put('/admin/update-profile', profile);
      updateUser(data.admin);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passForm;
    if (!oldPassword || !newPassword || !confirmPassword) { toast.error('All fields required'); return; }
    if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setSavingPass(true);
    try {
      await API.put('/admin/change-password', passForm);
      toast.success('Password changed successfully!');
      setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally { setSavingPass(false); }
  };

  const tabs = [
    { key: 'profile', label: 'Profile Info', icon: User },
    { key: 'password', label: 'Change Password', icon: Lock },
  ];

  return (
    <AdminLayout title="Admin Profile" subtitle="Manage your account details and security">
      {/* Profile card header */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #f6d365, #fda085)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 900, color: '#1a1a2e', flexShrink: 0 }}>
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: 4 }}>{user?.name}</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <Mail size={14} />{user?.email}
            </span>
            <span className="badge" style={{ background: 'rgba(246,211,101,0.15)', color: '#f6d365', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={11} />Administrator
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} />
            Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-elevated)', padding: 5, borderRadius: 12, width: 'fit-content' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600, fontSize: '0.875rem', transition: 'var(--transition)', background: activeTab === key ? '#f6d365' : 'transparent', color: activeTab === key ? '#1a1a2e' : 'var(--text-secondary)' }}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} color="#f6d365" />Profile Information
            </h3>
            <form onSubmit={handleProfileSave}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="form-input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" required style={{ paddingLeft: 36 }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="form-input" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="admin@jantaexam.com" required style={{ paddingLeft: 36 }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="form-input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 xxxxx xxxxx" style={{ paddingLeft: 36 }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <input className="form-input" value="Administrator" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <button type="submit" className="btn btn-full" disabled={savingProfile}
                style={{ background: 'linear-gradient(135deg, #f6d365, #fda085)', color: '#1a1a2e', fontWeight: 700, border: 'none', cursor: savingProfile ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, fontFamily: 'var(--font)', fontSize: '0.95rem', opacity: savingProfile ? 0.7 : 1 }}>
                {savingProfile ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#1a1a2e' }} />Saving...</> : <><Save size={16} />Save Profile</>}
              </button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={18} color="#f6d365" />Change Password
            </h3>
            <p style={{ fontSize: '0.85rem', marginBottom: 20 }}>Use a strong password to protect your admin account.</p>

            <div style={{ background: 'rgba(108,99,255,0.07)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--accent)' }}>💡 Password tips:</strong> Use at least 6 characters with a mix of letters, numbers, and symbols.
            </div>

            <form onSubmit={handlePasswordChange}>
              {[
                { label: 'Current Password', key: 'oldPassword', show: showOld, toggle: () => setShowOld(v => !v) },
                { label: 'New Password', key: 'newPassword', show: showNew, toggle: () => setShowNew(v => !v) },
                { label: 'Confirm New Password', key: 'confirmPassword', show: showConfirm, toggle: () => setShowConfirm(v => !v) },
              ].map(({ label, key, show, toggle }) => (
                <div className="form-group" key={key}>
                  <label className="form-label">{label} *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" type={show ? 'text' : 'password'}
                      value={passForm[key]}
                      onChange={e => setPassForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder="••••••••" required style={{ paddingLeft: 36, paddingRight: 40 }} />
                    <button type="button" onClick={toggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {key === 'newPassword' && <PasswordStrength password={passForm.newPassword} />}
                  {key === 'confirmPassword' && passForm.confirmPassword && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: passForm.newPassword === passForm.confirmPassword ? 'var(--success)' : 'var(--danger)' }}>
                      {passForm.newPassword === passForm.confirmPassword ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                      {passForm.newPassword === passForm.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </div>
                  )}
                </div>
              ))}
              <button type="submit" className="btn btn-primary btn-full" disabled={savingPass} style={{ gap: 8, marginTop: 4 }}>
                {savingPass ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />Changing...</> : <><Lock size={16} />Change Password</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
