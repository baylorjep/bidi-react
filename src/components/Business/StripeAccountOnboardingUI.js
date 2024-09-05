import React, { useEffect, useState } from 'react';
import { ConnectAccountOnboarding, ConnectComponentsProvider } from '@stripe/react-connect-js';
import Stripe from 'stripe';

const AccountOnboardingUI = () => {
  const [stripeConnectInstance, setStripeConnectInstance] = useState(null);
  const [accountId, setAccountId] = useState(null);

  // Function to create a Stripe Connect account
  const createStripeAccount = async () => {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      setAccountId(account.id);
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  useEffect(() => {
    // Load Stripe Connect JS library once the account ID is set
    const loadStripeConnect = async () => {
      if (!accountId) return;

      const stripeConnect = await window.StripeConnect.initialize({
        clientId: process.env.STRIPE_CLIENT_ID,
      });
      setStripeConnectInstance(stripeConnect);
    };

    if (accountId) {
      loadStripeConnect();
    }
  }, [accountId]);

  if (!accountId) {
    return <button onClick={createStripeAccount}>Start Onboarding</button>;
  }

  if (!stripeConnectInstance) {
    return <div>Loading onboarding...</div>;
  }

  return (
    <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
      <ConnectAccountOnboarding
        accountId={accountId}
        onExit={() => {
          console.log("The account has exited onboarding");
        }}
      />
    </ConnectComponentsProvider>
  );
};

export default AccountOnboardingUI;
