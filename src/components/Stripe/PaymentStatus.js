import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../App.css';


const PaymentStatus = () => {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse URL parameters to get the payment intent ID
    const searchParams = new URLSearchParams(location.search);
    const paymentIntentId = searchParams.get('payment_intent'); // assuming Stripe returns this in the URL

    if (paymentIntentId) {
      // Fetch payment status from the backend
      fetch(`https://bidi-express.vercel.app/check-payment-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentIntentId }), // Send the paymentIntentId dynamically
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setPaymentStatus('success');
        } else {
          setPaymentStatus('failure');
        }
      })
      .catch(() => setPaymentStatus('error'));
    }
  }, [location]);

  useEffect(() => {
    // Redirect to the appropriate page after a few seconds
    if (paymentStatus === 'success' || paymentStatus === 'failure') {
      const timer = setTimeout(() => {
        navigate('/my-bids'); // Redirect after 5 seconds to 'my-bids'
      }, 5000); // 5-second delay

      return () => clearTimeout(timer); // Cleanup the timer on unmount
    }
  }, [paymentStatus, navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      {paymentStatus === 'success' && (
        <>
          <h1>Payment Successful!</h1>
          <p>Your payment was processed successfully. Redirecting to your dashboard...</p>
          <p>If you are not redirected, <a href="/my-bids">click here</a>.</p>
        </>
      )}
      {paymentStatus === 'failure' && (
        <>
          <h1>Payment Failed</h1>
          <p>Unfortunately, your payment could not be processed. Redirecting to your dashboard...</p>
          <p>If you are not redirected, <a href="/my-bids">click here</a>.</p>
        </>
      )}
      {paymentStatus === 'error' && (
        <>
          <h1>Error Checking Payment</h1>
          <p>There was an issue checking the status of your payment. Redirecting to your dashboard...</p>
          <p>If you are not redirected, <a href="/my-bids">click here</a>.</p>
        </>
      )}
      {!paymentStatus && <p>Checking payment status...</p>}
    </div>
  );
};

export default PaymentStatus;