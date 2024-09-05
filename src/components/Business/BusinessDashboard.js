import React, { useState } from 'react';

function BusinessDashboard() {
  const [loading, setLoading] = useState(false);

  const handleStripeOnboarding = async () => {
    setLoading(true);
    try {
      // First, create a Stripe account
      const createAccountRes = await fetch('/api/createAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const { accountId } = await createAccountRes.json();

      // Then, generate the onboarding link
      const createLinkRes = await fetch('/api/createAccountLink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      const { url } = await createLinkRes.json();

      // Redirect to the onboarding URL
      window.location.href = url;
    } catch (error) {
      console.error('Error with Stripe onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Business Dashboard</h1>
      <button className='btn btn-secondary' onClick={handleStripeOnboarding} disabled={loading}>
        {loading ? 'Loading...' : 'Set up Stripe Account'}
      </button>
    </div>
  );
}

export default BusinessDashboard;
