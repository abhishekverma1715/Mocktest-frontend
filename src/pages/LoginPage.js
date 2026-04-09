import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, Eye, EyeOff, Users, GraduationCap, Shield, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { key:'user',    label:'Student', icon:Users,         color:'var(--accent)',  bg:'var(--accent-muted)' },
  { key:'teacher', label:'Teacher', icon:GraduationCap, color:'#8b5cf6',        bg:'rgba(139,92,246,0.10)' },
  { key:'admin',   label:'Admin',   icon:Shield,        color:'#fbbf24',        bg:'rgba(251,191,36,0.10)' },
];

const DEMO = {
  user:    { email:'user@jantaexam.com',    password:'user123' },
  teacher: { email:'teacher@jantaexam.com', password:'teacher123' },
  admin:   { email:'admin@jantaexam.com',   password:'admin123' },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [role, setRole]         = useState('user');
  const [form, setForm]         = useState({ email:'', password:'' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form.email, form.password, role);
      if (user.role === 'admin')   navigate('/admin');
      else if (user.role === 'teacher') navigate('/teacher');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const fillDemo = () => { setForm(DEMO[role]); setErrors({}); };
  const activeRole = ROLES.find(r => r.key === role);

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--bg-base)', overflow:'hidden' }}>
      {/* Left branding panel — desktop only */}
      <div className="hide-mobile" style={{ flex:1, background:'linear-gradient(135deg,#0f1829 0%,#080e1a 100%)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 56px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-80, right:-80, width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(56,189,248,0.12) 0%,transparent 70%)' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,var(--accent),#38bdf8)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 20px rgba(99,102,241,0.45)' }}>
              <Zap size={22} color="white" fill="white" />
            </div>
            <span style={{ fontWeight:800, fontSize:'1.2rem', color:'white', letterSpacing:'-0.03em' }}>Janta Exam</span>
          </div>
          <h1 style={{ fontSize:'2.4rem', fontWeight:900, color:'white', lineHeight:1.1, marginBottom:20, letterSpacing:'-0.04em' }}>
            Your gateway to<br /><span className="gradient-text">exam success</span>
          </h1>
          <p style={{ color:'#8fa3c0', fontSize:'0.975rem', lineHeight:1.75, maxWidth:360, marginBottom:48 }}>
            Practice with thousands of questions, track your progress, and ace competitive exams with confidence.
          </p>
          {[
            { icon:'🎯', text:'10,000+ practice questions' },
            { icon:'⏱️', text:'Real exam environment with timers' },
            { icon:'📊', text:'Detailed performance analytics' },
            { icon:'🎥', text:'Expert video lectures' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <span style={{ fontSize:'1.1rem' }}>{icon}</span>
              <span style={{ color:'#cbd5e1', fontSize:'0.9rem' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ width:'100%', maxWidth:460, display:'flex', flexDirection:'column', justifyContent:'center', padding:'40px 32px', overflowY:'auto' }}>
        {/* Mobile brand */}
        <div className="show-mobile" style={{ alignItems:'center', gap:10, marginBottom:36 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,var(--accent),#38bdf8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={18} color="white" fill="white" />
          </div>
          <span style={{ fontWeight:800, fontSize:'1.1rem', letterSpacing:'-0.02em' }}>Janta Exam</span>
        </div>

        <div style={{ marginBottom:28 }}>
          <h2 style={{ fontWeight:800, marginBottom:6 }}>Welcome back</h2>
          <p style={{ fontSize:'0.9rem' }}>Sign in to continue your exam prep journey</p>
        </div>

        {/* Role selector */}
        <div style={{ display:'flex', gap:6, marginBottom:24, background:'var(--bg-elevated)', padding:5, borderRadius:'var(--r-lg)', border:'1px solid var(--border-base)' }}>
          {ROLES.map(({ key, label, icon:Icon, color, bg }) => (
            <button key={key} type="button" onClick={() => setRole(key)}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'9px 6px', borderRadius:'var(--r-md)', background: role===key ? bg : 'transparent', border: role===key ? `1.5px solid ${color}40` : '1.5px solid transparent', cursor:'pointer', transition:'all var(--t-base)', fontFamily:'var(--font)' }}>
              <Icon size={17} color={role===key ? color : 'var(--text-muted)'} />
              <span style={{ fontSize:'0.72rem', fontWeight:700, color: role===key ? color : 'var(--text-muted)', letterSpacing:'0.02em' }}>{label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-icon-wrapper">
              <Mail size={15} className="input-icon" />
              <input type="email" className={`form-input ${errors.email?'has-error':''}`} placeholder="you@example.com" value={form.email} onChange={e => { setForm(f => ({ ...f, email:e.target.value })); setErrors(er => ({ ...er, email:'' })); }} autoComplete="email" />
            </div>
            {errors.email && <span className="form-error-msg">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={15} className="input-icon" />
              <input type={showPass?'text':'password'} className={`form-input ${errors.password?'has-error':''}`} placeholder="Enter password" value={form.password} onChange={e => { setForm(f => ({ ...f, password:e.target.value })); setErrors(er => ({ ...er, password:'' })); }} autoComplete="current-password" />
              <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)} aria-label={showPass?'Hide password':'Show password'}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <span className="form-error-msg">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop:4 }}>
            {loading ? <><span className="spinner spinner-sm" />Signing in...</> : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </form>

        <div className="divider-text" style={{ margin:'20px 0' }}><span>or</span></div>

        <button type="button" onClick={fillDemo} className="btn btn-outline btn-full" style={{ gap:7 }}>
          <span style={{ fontSize:'0.9rem' }}>🎯</span>
          Use Demo {ROLES.find(r => r.key === role)?.label} Account
        </button>

        {role === 'user' && (
          <p style={{ textAlign:'center', marginTop:20, fontSize:'0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight:700 }}>Create one</Link>
          </p>
        )}
      </div>
    </div>
  );
}
