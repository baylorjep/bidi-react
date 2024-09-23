import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation for passing data
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

// Load Stripe with your publishable key
const stripePromise = loadStripe('pk_test_51Pv13ZF25aBU3RMPPSX9m01yHzLVa1vufmqLkKeU9iFR5tzAARw4GXYldl5uJAAHwSISI72lUZ8RNbjEAdNBZcbc00f3S1ZvLX');

const EmbeddedCheckoutForm = () => {
  const location = useLocation(); // Access location state
  const { bid } = location.state || {}; // Destructure bid data from location state
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    // Only run if bid data is provided
    if (!bid) {
      console.error('No bid data provided for checkout.');
      return;
    }

     // Log the bid object to check what data it contains
    console.log('Bid data:', bid);

    // Fetch the client_secret from the backend
    const createCheckoutSession = async () => {
      try {
        const response = await fetch("https://bidi-express.vercel.app/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            connectedAccountId: bid.business_profiles.stripe_account_id, // Use the business's connected account ID
            amount: bid.bid_amount * 100, // Amount in cents
            applicationFeeAmount: Math.round(bid.bid_amount * 0.05), // Set a 5% fee
            serviceName: bid.business_profiles.business_name,
          }),
        });


        const data = await response.json();
        console.log("Backend response data:", data); // Log the response from the backend

        const { client_secret } = data;
        
        setClientSecret(client_secret);
        console.log("Client Secret:", client_secret); // Log the client_secret
      } catch (error) {
        console.error('Error creating checkout session:', error);
      }
    };

    createCheckoutSession();
  }, [bid]); // Re-run if bid changes

  return (
    
    <div>
      <br></br>
      {clientSecret ? (
        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      ) : (
        <h4>Loading payment form...</h4>
      )}
    </div>
  );
};

export default EmbeddedCheckoutForm;