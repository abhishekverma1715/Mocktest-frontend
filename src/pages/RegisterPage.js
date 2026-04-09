import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { BookOpen, User, Mail, Lock, Eye, EyeOff, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = { DETAILS: 'details', OTP: 'otp', DONE: 'done' };

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.DETAILS);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  const handleSendOtp = async () => {
    if (!form.phone || form.phone.trim().length < 10) { toast.error('Enter a valid 10-digit phone number'); return; }
    setOtpLoading(true);
    try {
      const { data } = await API.post('/auth/send-otp', { phone: form.phone });
      setOtpSent(true);
      if (data.demo_otp) { setDemoOtp(data.demo_otp); toast.success(`Demo OTP: ${data.demo_otp} (shown in dev mode)`); }
      else toast.success('OTP sent to your phone!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send OTP'); }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { toast.error('Enter the OTP'); return; }
    setOtpLoading(true);
    try {
      await API.post('/auth/verify-otp', { phone: form.phone, otp });
      setPhoneVerified(true);
      toast.success('Phone verified successfully!');
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP'); }
    setOtpLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = () => {
    // For demo: simulate Google login with a prompt
    const googleId = 'google_demo_' + Date.now();
    const name = prompt('Google Login Demo — Enter your name:') || 'Google User';
    const email = prompt('Enter your Gmail:') || '';
    if (!email) return;
    API.post('/auth/google-login', { googleId, name, email, avatar: '' })
      .then(({ data }) => {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      })
      .catch(err => toast.error(err.response?.data?.message || 'Google login failed'));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '10%', right: '5%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,101,132,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, animation: 'fadeIn 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))', marginBottom: 12, boxShadow: '0 8px 30px rgba(255,101,132,0.3)' }}>
            <BookOpen size={26} color="white" />
          </div>
          <h1 style={{ marginBottom: 4 }}>Join Janta Exam</h1>
          <p>Create your free student account</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" type="text" placeholder="Your full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={{ paddingLeft: 35 }} />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required style={{ paddingLeft: 35 }} />
              </div>
            </div>

            {/* Phone with OTP */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Phone Number (Optional)
                {phoneVerified && <span style={{ color: 'var(--success)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle2 size={12} />Verified</span>}
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="form-input" type="tel" placeholder="+91 xxxxx xxxxx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} disabled={phoneVerified} style={{ paddingLeft: 35 }} />
                </div>
                {!phoneVerified && (
                  <button type="button" onClick={handleSendOtp} disabled={otpLoading || !form.phone}
                    className="btn btn-secondary btn-sm" style={{ flexShrink: 0, fontSize: '0.78rem' }}>
                    {otpLoading ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : otpSent ? 'Resend' : 'Send OTP'}
                  </button>
                )}
              </div>

              {/* OTP input */}
              {otpSent && !phoneVerified && (
                <div style={{ marginTop: 8 }}>
                  {demoOtp && (
                    <div style={{ background: 'rgba(67,233,123,0.1)', border: '1px solid rgba(67,233,123,0.3)', borderRadius: 7, padding: '6px 10px', marginBottom: 8, fontSize: '0.78rem', color: 'var(--success)' }}>
                      🧪 Dev OTP: <strong>{demoOtp}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} style={{ letterSpacing: '0.2em', fontFamily: 'var(--font-mono)', flex: 1 }} />
                    <button type="button" onClick={handleVerifyOtp} disabled={otpLoading || !otp}
                      className="btn btn-success btn-sm" style={{ flexShrink: 0 }}>
                      {otpLoading ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : 'Verify'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required style={{ paddingLeft: 35, paddingRight: 38 }} />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" type="password" placeholder="Repeat password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required style={{ paddingLeft: 35 }} />
              </div>
              {form.confirm && (
                <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: form.password === form.confirm ? 'var(--success)' : 'var(--danger)' }}>
                  {form.password === form.confirm ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {form.password === form.confirm ? 'Passwords match' : 'Passwords do not match'}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginBottom: 12 }}>
              {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />Creating...</> : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 12px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-base)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-base)' }} />
          </div>

          {/* Google Login */}
          <button type="button" onClick={handleGoogleLogin}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px', borderRadius: 10, border: '1.5px solid var(--border-default)', background: 'var(--bg-elevated)', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', transition: 'var(--transition)', marginBottom: 16 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-base)'}>
            <span style={{ fontSize: '1.1rem' }}>🔍</span>
            Continue with Google
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
