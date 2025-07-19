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
            successUrl: `${window.location.origin}/payment-success?amount=${paymentData.amount}&payment_type=${paymentData.payment_type}&business_name=${encodeURIComponent(paymentData.business_name)}&bid_id=${paymentData.bid_id}`,
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
        <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
          {/* Payment Summary on the left */}
          <div style={{ flex: '1', maxWidth: '400px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Payment Summary</h3>
            
            {paymentData?.lineItems && paymentData.lineItems.length > 0 ? (
              <div>
                {paymentData.lineItems.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#333' }}>{item.description}</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {item.quantity} × ${item.rate}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold' }}>${item.amount.toFixed(2)}</div>
                  </div>
                ))}
                
                {paymentData.taxRate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <div>
                      <div style={{ color: '#666' }}>Tax ({paymentData.taxRate}%)</div>
                    </div>
                    <div>${paymentData.tax.toFixed(2)}</div>
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #333', fontWeight: 'bold', fontSize: '18px' }}>
                  <div>Total</div>
                  <div>${paymentData.amount.toFixed(2)}</div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                  ${paymentData?.amount?.toFixed(2) || '0.00'}
                </div>
                <div>{paymentData?.description || 'Payment'}</div>
              </div>
            )}
            
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>From:</div>
              <div style={{ color: '#666' }}>{paymentData?.business_name || 'Business'}</div>
            </div>
          </div>
          
          {/* Stripe Checkout on the right */}
          <div style={{ flex: '2' }}>
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
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
