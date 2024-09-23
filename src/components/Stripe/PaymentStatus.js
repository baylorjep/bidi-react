import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; // assuming you're using React Router
import '../../App.css';

const PaymentStatus = () => {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const location = useLocation(); // for getting query params
  
  useEffect(() => {
    // Parse URL parameters to get the payment intent ID
    const searchParams = new URLSearchParams(location.search);
    const paymentIntentId = searchParams.get('payment_intent'); // assuming Stripe returns this in the URL

    if (paymentIntentId) {
      // Here you would make the API call to your backend to check the payment status
      fetch(`https://bidi-express.vercel.app/check-payment-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentIntentId }), // Send the paymentIntentId dynamically
      })
      .then(response => response.json())
      .then(data => {
        // Assuming your backend sends back { success: true } or { success: false }
        if (data.success) {
          setPaymentStatus('success');
        } else {
          setPaymentStatus('failure');
        }
      })
      .catch(() => setPaymentStatus('error'));
    }
  }, [location]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      {paymentStatus === 'success' && <h1>Payment Successful!</h1>}
      {paymentStatus === 'failure' && <h1>Payment Failed</h1>}
      {paymentStatus === 'error' && <h1>There was an error processing your payment</h1>}
      {!paymentStatus && <p>Checking payment status...</p>}
    </div>
  );
};

export default PaymentStatus;