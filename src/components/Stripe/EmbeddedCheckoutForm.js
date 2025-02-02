import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation for passing data
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

// Load Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const EmbeddedCheckoutForm = () => {
  const location = useLocation(); // Access location state
  const { paymentData } = location.state || {}; // Changed from bid to paymentData
  const [clientSecret, setClientSecret] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null); // State to store error messages

  useEffect(() => {
    // Only run if paymentData is provided
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

    // Log the paymentData object to check what data it contains
    console.log('Payment data:', paymentData);

    // Fetch the client_secret from the backend
    const createCheckoutSession = async () => {
      try {
        const response = await fetch("https://bidi-express.vercel.app/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            connectedAccountId: paymentData.stripe_account_id,
            amount: Math.round(paymentData.amount * 100), // Convert to cents and ensure it's a whole number
            applicationFeeAmount: Math.round(paymentData.amount * 5), // 5% fee
            serviceName: paymentData.business_name,
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
        
        if (data.error) {
          throw new Error(data.error.message || 'Failed to create checkout session');
        }

        setClientSecret(data.client_secret);
      } catch (error) {
        setErrorMessage('Error creating checkout session: ' + error.message);
        console.error('Error creating checkout session:', error);
      }
    };

    createCheckoutSession();
  }, [paymentData]); // Re-run if paymentData changes

  return (
    <div>
      <br></br>
      {errorMessage ? (
        <div style={{ fontWeight: 'bold', display:'flex',justifyContent:'center',alignItems:'center',height:'50vh' }}>
          {errorMessage}
        </div>
      ) : clientSecret ? (
        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      ) : (
        <div className='center'style={{ fontWeight: 'bold', display:'flex',justifyContent:'center',alignItems:'center',height:'50vh' }}>Loading payment form...</div>
      )}
    </div>
  );
};

export default EmbeddedCheckoutForm;
