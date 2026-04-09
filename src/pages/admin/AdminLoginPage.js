import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password, 'admin');
      if (user.role !== 'admin') { toast.error('Not an admin account'); return; }
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid admin credentials');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '15%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,211,101,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg, #f6d365, #fda085)', marginBottom: 14, boxShadow: '0 8px 30px rgba(246,211,101,0.3)' }}>
            <Shield size={28} color="white" fill="white" />
          </div>
          <h1 style={{ marginBottom: 4 }}>Janta Exam</h1>
          <p>Admin Portal — Restricted Access</p>
        </div>
        <div className="card" style={{ padding: 28, border: '1px solid rgba(246,211,101,0.15)' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" type="email" placeholder="admin@jantaexam.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={{ paddingLeft: 36 }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={{ paddingLeft: 36, paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-full btn-lg" disabled={loading} style={{ background: 'linear-gradient(135deg, #f6d365, #fda085)', color: '#1a1a2e', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, fontSize: '0.95rem', padding: '13px 28px', fontFamily: 'var(--font)' }}>
              {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#1a1a2e' }} />Signing in...</> : <><Shield size={17} />Sign In as Admin</>}
            </button>
          </form>
          <div className="divider" />
          <div style={{ textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>← Back to Student Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
