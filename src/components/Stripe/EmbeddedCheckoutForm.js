import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

// Load Stripe with your publishable key
const stripePromise = loadStripe('pk_test_51Pv13ZF25aBU3RMPPSX9m01yHzLVa1vufmqLkKeU9iFR5tzAARw4GXYldl5uJAAHwSISI72lUZ8RNbjEAdNBZcbc00f3S1ZvLX');

const EmbeddedCheckoutForm = () => {
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    // Fetch the client_secret from the backend
    const createCheckoutSession = async () => {
      const response = await fetch("https://bidi-express.vercel.app/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectedAccountId: 'acct_1AbCDefGHIjKLmnO', // Example connected account ID
          amount: 5000, // Amount in cents
          applicationFeeAmount: 500, // Application fee in cents
        }),
      });

      const { client_secret } = await response.json();
      setClientSecret(client_secret);
    };

    createCheckoutSession();
  }, []);

  return (
    <div>
      {clientSecret && (
        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      )}
    </div>
  );
};

export default EmbeddedCheckoutForm;