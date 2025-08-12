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

    // If no Stripe account ID is provided, we'll use Bidi's account as fallback
    const stripeAccountId = paymentData.stripe_account_id || 'acct_1RqCsQJwWKKQQDV2'; // Bidi's Stripe account ID

    console.log('Payment data:', paymentData);
    const createCheckoutSession = async () => {
      try {
        // Create detailed description with line items and strip HTML tags
        let detailedDescription = paymentData.business_name;
        if (paymentData.lineItems && paymentData.lineItems.length > 0) {
          detailedDescription += '\n';
          paymentData.lineItems.forEach((item, index) => {
            // Strip HTML tags from description
            const sanitizedDescription = item.description.replace(/<[^>]*>/g, '');
            detailedDescription += `• ${sanitizedDescription} (${item.quantity}×$${item.rate})\n`;
          });
          if (paymentData.taxRate > 0) {
            detailedDescription += `• Tax (${paymentData.taxRate}%)`;
          }
        }

        // Determine if we're using Bidi's account (no application fee) or business account (with application fee)
        const isUsingBidiAccount = stripeAccountId === 'acct_1RqCsQJwWKKQQDV2';
        const applicationFeeAmount = isUsingBidiAccount ? 0 : Math.round(paymentData.amount * 10);
        const serviceName = isUsingBidiAccount ? `${detailedDescription} (Processed by Bidi)` : detailedDescription;

        // Create checkout session
        let response = await fetch("https://bidi-express.vercel.app/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            connectedAccountId: stripeAccountId,
            amount: Math.round(paymentData.amount * 100),
            applicationFeeAmount: applicationFeeAmount,
            serviceName: serviceName,
            successUrl: `${window.location.origin}/payment-success?amount=${paymentData.amount}&payment_type=${paymentData.payment_type}&business_name=${encodeURIComponent(paymentData.business_name)}&bid_id=${paymentData.bid_id}`,
            cancelUrl: `${window.location.origin}/bids`,
          }),
        });

        // Handle any errors from the checkout session creation
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: errorText };
          }
          throw new Error(errorData.error || 'Failed to create checkout session');
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
        <div style={{ padding: '20px', backgroundColor: 'white' }}>
          <div style={{ fontWeight: 'bold', display:'flex',justifyContent:'center',alignItems:'center', fontSize: '20px', fontFamily:'Outfit', marginBottom:'20px' }}>Checkout</div>
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
