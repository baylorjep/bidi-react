import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation for passing data
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

// Load Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const EmbeddedCheckoutForm = () => {
  const location = useLocation(); // Access location state
  const { bid, amountToPay } = location.state || {}; // Destructure bid data and amountToPay from location state
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    // Only run if bid data is provided
    if (!bid) {
      console.error('No bid data provided for checkout.');
      return;
    }

    // Determine the amount to pay (fall back to full bid amount if no amountToPay is passed)
    const amount = amountToPay || bid.bid_amount; // Use amountToPay if available, otherwise default to bid_amount

    // Log the bid object and amountToPay to check what data it contains
    console.log('Bid data:', bid);
    console.log('Amount to pay:', amount);

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
            amount: amount * 100, // Amount in cents (use amountToPay or full bid_amount)
            applicationFeeAmount: Math.round(amount * 0.05), // Set a 5% fee based on the amount
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
  }, [bid, amountToPay]); // Re-run if bid or amountToPay changes

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
