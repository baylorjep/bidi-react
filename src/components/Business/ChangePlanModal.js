import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

const plans = [
  {
    key: 'free',
    name: 'Basic',
    description: 'Get started with Bidi and only pay when you win jobs.',
    features: [
      'Unlimited bids',
      'Access to all local wedding requests',
      'Basic vendor profile',
      'Secure payment processing',
      'Basic analytics dashboard',
      '10% commission on won jobs'
    ],
    price: '10% commission'
  },
  {
    key: 'pro',
    name: 'Pro',
    description: 'Be among the first to test our AI-powered bidding tools.',
    features: [
      'Early access to AI bid optimization',
      'Help shape the future of automated bidding',
      'Market rate insights for your area',
      'Priority placement in search results',
      'Premium analytics and reporting',
      'VIP support during beta',
      'Lock in 20% commission rate'
    ],
    price: '20% commission',
    tag: 'Beta'
  }
];

const ChangePlanModal = ({ isOpen, onClose, currentPlan, onPlanChange }) => {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelect = async (planKey) => {
    setSaving(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      const { error } = await supabase
        .from('business_profiles')
        .update({ membership_tier: planKey })
        .eq('id', user.id);
      if (error) throw error;
      setSelectedPlan(planKey);
      setSuccess(true);
      onPlanChange && onPlanChange(planKey);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to change plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30, 20, 60, 0.18)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 18, maxWidth: 720, width: '95%', padding: 36, boxShadow: '0 8px 32px rgba(80,60,120,0.13)', position: 'relative', fontFamily: 'Outfit, Inter, sans-serif' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#888', fontWeight: 700, lineHeight: 1 }}>&times;</button>
        <h2 style={{ marginBottom: 18, fontWeight: 700, fontSize: '1.7rem', letterSpacing: '-0.5px', textAlign: 'center' }}>Choose Your Perfect Plan</h2>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
          {plans.map(plan => (
            <div key={plan.key} style={{
              flex: 1,
              minWidth: 260,
              maxWidth: 340,
              border: selectedPlan === plan.key ? '2.5px solid #9633eb' : '1.5px solid #ececf0',
              borderRadius: 14,
              background: selectedPlan === plan.key ? '#f8f3ff' : '#faf9fd',
              boxShadow: selectedPlan === plan.key ? '0 2px 12px rgba(150,51,235,0.10)' : '0 1px 4px rgba(80,60,120,0.04)',
              padding: '28px 24px 24px 24px',
              transition: 'border 0.2s, background 0.2s',
              position: 'relative',
              marginBottom: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: '1.18rem', letterSpacing: '-0.5px' }}>{plan.name}</div>
                {plan.tag && (
                  <span style={{ background: '#9633eb', color: '#fff', fontWeight: 600, fontSize: '0.92rem', borderRadius: 7, padding: '2px 10px', marginLeft: 2, letterSpacing: '0.5px' }}>{plan.tag}</span>
                )}
              </div>
              <div style={{ color: '#6b6b7a', fontSize: '1.01rem', marginBottom: 12 }}>{plan.description}</div>
              <ul style={{ paddingLeft: 18, marginBottom: 14, marginTop: 0 }}>
                {plan.features.map((f, i) => <li key={i} style={{ fontSize: '1.01rem', marginBottom: 3, lineHeight: 1.5 }}>{f}</li>)}
              </ul>
              <div style={{ fontWeight: 600, fontSize: '1.13rem', marginBottom: 14, marginTop: 2 }}>{plan.price}</div>
              {selectedPlan === plan.key ? (
                <button className="btn-primary-business-settings" style={{ minWidth: 120, marginTop: 6 }} disabled>
                  Current Plan
                </button>
              ) : (
                <button className="btn-primary-business-settings" style={{ minWidth: 120, marginTop: 6 }} onClick={() => handleSelect(plan.key)} disabled={saving}>
                  {saving ? 'Saving...' : 'Choose Plan'}
                </button>
              )}
              {success && selectedPlan === plan.key && (
                <div style={{ color: '#10b981', fontWeight: 500, marginTop: 10, fontSize: '1.01rem' }}>Plan updated!</div>
              )}
            </div>
          ))}
        </div>
        {error && <div style={{ color: '#d32f2f', marginTop: 18, textAlign: 'center', fontWeight: 500 }}>{error}</div>}
      </div>
    </div>
  );
};

export default ChangePlanModal; 