import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

// Load Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const EmbeddedCheckoutForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { paymentData } = location.state || {};
  const [clientSecret, setClientSecret] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!paymentData) {
      setErrorMessage('No payment data provided for checkout.');
      console.error('No payment data provided for checkout.');
      return;
    }

    if (!paymentData.stripe_account_id) {
      setErrorMessage('This business is not yet set up to receive payments. Please contact them directly.');
      console.error('Missing Stripe account ID');
      return;
    }

    console.log('Payment data:', paymentData);
    const createCheckoutSession = async () => {
      try {
        const response = await fetch("https://bidi-express.vercel.app/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            connectedAccountId: paymentData.stripe_account_id,
            amount: Math.round(paymentData.amount * 100),
            applicationFeeAmount: Math.round(paymentData.amount * 5),
            serviceName: paymentData.business_name,
            successUrl: `${window.location.origin}/payment-success`,
            cancelUrl: `${window.location.origin}/bids`,
          }),
        });
    
        if (!response.ok) {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error && errorData.error.includes('capabilities')) {
              throw new Error('This business has not completed their payment setup. Please contact them directly.');
            }
            throw new Error(errorData.error || 'Failed to create checkout session');
          } catch (e) {
            throw new Error(e.message || errorText);
          }
        }
    
        const data = await response.json();
        console.log('Checkout session response:', data);
        
        if (data.error) {
          throw new Error(data.error.message || 'Failed to create checkout session');
        }

        if (!data.client_secret) {
          throw new Error('No client secret received from server');
        }

        setClientSecret(data.client_secret);
      } catch (error) {
        setErrorMessage('Error creating checkout session: ' + error.message);
        console.error('Error creating checkout session:', error);
      }
    };

    createCheckoutSession();
  }, [paymentData, navigate]);

  return (
    <div>
      <br></br>
      {errorMessage ? (
        <div style={{ fontWeight: 'bold', display:'flex',justifyContent:'center',alignItems:'center',height:'50vh' }}>
          {errorMessage}
        </div>
      ) : clientSecret ? (
        <div style={{ padding: '20px' }}>
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      ) : (
        <div className='center' style={{ fontWeight: 'bold', display:'flex',justifyContent:'center',alignItems:'center',height:'50vh' }}>
          Loading payment form...
        </div>
      )}
    </div>
  );
};

export default EmbeddedCheckoutForm;
