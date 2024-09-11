import React, { useState, useEffect } from "react";
import { useStripeConnect } from "../../hooks/useStripeConnect";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { supabase } from "../../supabaseClient";

export default function Onboarding() {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const [error, setError] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState();
  const [email, setEmail] = useState(""); // Will be set from Supabase auth
  const stripeConnectInstance = useStripeConnect(connectedAccountId);

  // Fetch email when component loads
  useEffect(() => {
    const fetchEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser(); // Fetch authenticated user's data
      if (user) {
        setEmail(user.email); // Set email from Supabase auth
      }
    };
    fetchEmail();
  }, []);

  const createAccount = async () => {
    setAccountCreatePending(true);
    setError(false);
  
    try {
      const response = await fetch("https://bidi-express.vercel.app/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }), // Send the email dynamically
      });
  
      const json = await response.json();
      setAccountCreatePending(false);
  
      if (json.account) {
        setConnectedAccountId(json.account);
  
        // Fetch the user's ID directly from Supabase auth
        const { data: { user } } = await supabase.auth.getUser(); // Get the authenticated user's data
  
        if (user) {
          const userId = user.id;
  
          // Step 1: Store the connected account ID in business_profiles
          const { error: supabaseError } = await supabase
            .from('business_profiles')
            .update({ stripe_account_id: json.account }) // Update the connected account ID
            .eq('id', userId); // Match with the correct business profile using user ID from auth
  
          if (supabaseError) {
            console.error("Failed to store connected account ID to Account:", supabaseError);
            setError(true);
          }
        }
      } else if (json.error) {
        setError(true);
      }
    } catch (err) {
      console.error("Error during account creation:", err);
      setError(true);
      setAccountCreatePending(false);
    }
  };

  return (
    <div className="container">
      <div className="banner">
        <h2>BIDI</h2>
      </div>
      <div className="content">
        {!connectedAccountId && <h2>Get ready for take off</h2>}
        {connectedAccountId && !stripeConnectInstance && <h2>Add information to start accepting money</h2>}
        {!connectedAccountId && <p>Bidi is the world's best up and coming photography platform: Never pay for leads, only pay for your wins!</p>}
        
        {!accountCreatePending && !connectedAccountId && (
          <div>
            <button onClick={createAccount}>
              Set Up Payment Account with {email} {/* Display the email to the user */}
            </button>
          </div>
        )}
        
        {stripeConnectInstance && (
          <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
            <ConnectAccountOnboarding onExit={() => setOnboardingExited(true)} />
          </ConnectComponentsProvider>
        )}

        {error && <p className="error">Something went wrong!</p>}
        {(connectedAccountId || accountCreatePending || onboardingExited) && (
          <div className="dev-callout">
            {connectedAccountId && <p>Your connected account ID is: <code className="bold">{connectedAccountId}</code></p>}
            {accountCreatePending && <p>Creating a connected account...</p>}
            {onboardingExited && <p>The Account Onboarding component has exited</p>}
          </div>
        )}

        <div className="info-callout">
          <p>
            Bidi uses Stripe Connect onboarding. <a href="https://docs.stripe.com/connect/onboarding/quickstart?connect-onboarding-surface=embedded" target="_blank" rel="noopener noreferrer">View docs</a>
          </p>
        </div>
      </div>
    </div>
  );
}