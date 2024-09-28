import React, { useState, useEffect } from "react";
import { useStripeConnect } from "../../hooks/useStripeConnect";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "../../App.css"; // Assuming you have general styles in this file

export default function Onboarding() {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const [error, setError] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState();
  const [email, setEmail] = useState(""); // Will be set from Supabase auth
  const stripeConnectInstance = useStripeConnect(connectedAccountId);
  const navigate = useNavigate(); // Initialize navigate
  
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
        const { data: { user } } = await supabase.auth.getUser();
  
        if (user) {
          const userId = user.id;
  
          // Step 1: Store the connected account ID in business_profiles
          const { error: supabaseError } = await supabase
            .from('business_profiles')
            .update({ stripe_account_id: json.account })
            .eq('id', userId);
  
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
    <div className="container px-5 d-flex align-items-center justify-content-center">
      <div className="col-lg-6">
        <div className="mb-5 text-center">
            <br></br>
          <h1 className="OnboardingPageHeader">Stripe Onboarding</h1>
          {!connectedAccountId && (
            <p>Bidi is the world's best up-and-coming photography platform: Never pay for leads, only pay for your wins!</p>
          )}
          {connectedAccountId && !stripeConnectInstance && (
            <h2>Add your information to start accepting payments</h2>
          )}
          {error && <p className="text-danger">Something went wrong!</p>}
        </div>
        
        {!accountCreatePending && !connectedAccountId && (
          <div className="d-grid">
            <button 
              className="btn btn-secondary btn-lg w-100" 
              onClick={createAccount}
            >
              Set Up Payment Account with {email}
            </button>
          </div>
        )}
        
        {accountCreatePending && (
          <div className="mt-4 text-center">
            <p>Creating your Stripe connected account...</p>
          </div>
        )}
        
        {stripeConnectInstance && (
          <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
            <ConnectAccountOnboarding onExit={() => setOnboardingExited(true)} />
          </ConnectComponentsProvider>
        )}

        {(connectedAccountId || onboardingExited) && (
          <div className="mt-4 text-center">
            {onboardingExited && <p>Onboarding complete! You're ready to go.</p>}
          </div>
        )}
        {/* Return to Dashboard button */}
        <div className="mt-4 text-center">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}