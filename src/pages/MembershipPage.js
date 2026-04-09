import React, { useEffect, useState } from 'react';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Check, Zap, Crown, Star, CreditCard, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MembershipPage() {
  const { user, updateUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [myPayments, setMyPayments] = useState([]);

  useEffect(() => {
    Promise.all([API.get('/plans'), API.get('/payments/my')])
      .then(([plansRes, payRes]) => {
        setPlans(plansRes.data.plans || []);
        setMyPayments(payRes.data.payments || []);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const isPremiumActive = user?.membership?.status === 'premium' &&
    new Date(user?.membership?.endDate) > new Date();

  const handleSubscribe = async (plan) => {
    if (plan.price === 0) return toast('You are already on the free plan!');
    setPaying(plan._id);
    try {
      const { data } = await API.post('/payments/create-order', { planId: plan._id });

      // Demo mode (no Razorpay configured)
      if (data.demo) {
        const confirm = window.confirm(
          `DEMO MODE\n\nActivate "${plan.name}" for ₹${plan.price}?\n(No real payment — for testing only)`
        );
        if (confirm) {
          await API.post('/payments/demo-activate', { paymentId: data.payment._id });
          const me = await API.get('/auth/me');
          updateUser(me.data.user);
          toast.success(`🎉 "${plan.name}" activated! (Demo)`);
        }
        return;
      }

      // Real Razorpay flow
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'MockTest Pro',
        description: plan.name,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            await API.post('/payments/verify', {
              orderId: data.order.id,
              razorpayPaymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            const me = await API.get('/auth/me');
            updateUser(me.data.user);
            toast.success('🎉 Payment successful! Premium activated.');
          } catch { toast.error('Payment verification failed'); }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#6c63ff' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(null);
    }
  };

  const planIcons = { 'free': Zap, 'monthly-pro': Crown, 'yearly-pro': Star };
  const planColors = { 'free': '#9898b8', 'monthly-pro': '#6c63ff', 'yearly-pro': '#f6d365' };

  return (
    <Layout title="Membership Plans" subtitle="Unlock your full potential with premium access">
      {/* Current Status */}
      {isPremiumActive && (
        <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(56,249,215,0.1))', border: '1px solid var(--border-default)', borderRadius: 'var(--r-lg)', padding: '20px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Crown size={32} color="var(--gold)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              🎉 You are a Premium Member!
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={13} />
                Expires: {new Date(user?.membership?.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span>Plan: {user?.membership?.plan?.name || 'Premium'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>
          {plans.map(plan => {
            const Icon = planIcons[plan.slug] || Zap;
            const color = planColors[plan.slug] || '#6c63ff';
            const isCurrent = user?.membership?.plan?._id === plan._id && isPremiumActive;
            const isFree = plan.price === 0;

            return (
              <div key={plan._id} style={{
                background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 28,
                border: `2px solid ${plan.isPopular ? color : 'var(--border-base)'}`,
                position: 'relative', display: 'flex', flexDirection: 'column',
                boxShadow: plan.isPopular ? `0 8px 40px ${color}25` : 'none',
                transform: plan.isPopular ? 'scale(1.02)' : 'none',
                transition: 'var(--transition)',
              }}>
                {plan.isPopular && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: color, color: 'white', padding: '4px 16px', borderRadius: 'var(--r-full)', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    ⭐ MOST POPULAR
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={22} color={color} />
                  </div>
                  <div>
                    <h3 style={{ marginBottom: 2 }}>{plan.name}</h3>
                    <p style={{ fontSize: '0.8rem', margin: 0 }}>{plan.description}</p>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 900, color }}>
                      {plan.price === 0 ? 'FREE' : `₹${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        / {plan.durationDays} days
                      </span>
                    )}
                  </div>
                  {plan.price > 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      ≈ ₹{(plan.price / plan.durationDays).toFixed(1)}/day
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, marginBottom: 20 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                      <Check size={16} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={paying === plan._id || isCurrent}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 'var(--r-md)',
                    border: 'none', cursor: isCurrent ? 'default' : 'pointer',
                    fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.95rem',
                    background: isCurrent ? 'rgba(67,233,123,0.15)' : isFree ? 'var(--bg-elevated)' : color,
                    color: isCurrent ? 'var(--success)' : isFree ? 'var(--text-secondary)' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'var(--transition)',
                  }}>
                  {paying === plan._id ? (
                    <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />Processing...</>
                  ) : isCurrent ? (
                    <><Check size={16} />Current Plan</>
                  ) : isFree ? (
                    'Current (Free)'
                  ) : (
                    <><CreditCard size={16} />Subscribe Now</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment History */}
      {myPayments.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 16 }}>Payment History</h3>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {myPayments.map((p, i) => (
              <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < myPayments.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: p.status === 'success' ? 'rgba(67,233,123,0.15)' : 'rgba(255,101,132,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CreditCard size={18} color={p.status === 'success' ? 'var(--success)' : 'var(--danger)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{p.plan?.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(p.createdAt).toLocaleDateString('en-IN')} · {p.gateway}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>₹{p.amount}</div>
                  <span className={`badge ${p.status === 'success' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
