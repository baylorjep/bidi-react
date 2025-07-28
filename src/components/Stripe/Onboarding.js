import React, { useState, useEffect } from "react";
import { useStripeConnect } from "../../hooks/useStripeConnect";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../../App.css";

export default function Onboarding({ setActiveSection }) {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const [error, setError] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState();
  const [email, setEmail] = useState("");
  const stripeConnectInstance = useStripeConnect(connectedAccountId);
  const navigate = useNavigate();

  // Fetch email when component loads
  useEffect(() => {
    const fetchEmail = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email);
      }
    };
    fetchEmail();
  }, []);

  // Add new function to verify account status
  const verifyStripeAccount = async (accountId) => {
    try {
      const response = await fetch("https://bidi-express.vercel.app/verify-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountId }),
      });

      const data = await response.json();
      return data.isValid;
    } catch (error) {
      console.error("Error verifying Stripe account:", error);
      return false;
    }
  };

  const createAccount = async () => {
    setAccountCreatePending(true);
    setError(false);

    try {
      const response = await fetch("https://bidi-express.vercel.app/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const json = await response.json();
      setAccountCreatePending(false);

      if (json.account) {
        setConnectedAccountId(json.account);
      } else if (json.error) {
        setError(true);
      }
    } catch (err) {
      console.error("Error during account creation:", err);
      setError(true);
      setAccountCreatePending(false);
    }
  };

  // Handle onboarding completion
  const handleOnboardingExit = async () => {
    setOnboardingExited(true);
    
    if (connectedAccountId) {
      // Verify the account is properly set up
      const isValid = await verifyStripeAccount(connectedAccountId);
      
      if (isValid) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Store the connected account ID only after verification
            const { error: supabaseError } = await supabase
              .from("business_profiles")
              .update({ stripe_account_id: connectedAccountId })
              .eq("id", user.id);

            if (supabaseError) {
              console.error("Failed to store connected account ID:", supabaseError);
              setError(true);
            }
          }
        } catch (err) {
          console.error("Error saving account ID:", err);
          setError(true);
        }
      } else {
        // If account is not valid, show error and clean up
        setError(true);
        setConnectedAccountId(null);
        // Optionally delete the incomplete account
        try {
          await fetch("https://bidi-express.vercel.app/delete-account", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ accountId: connectedAccountId }),
          });
        } catch (err) {
          console.error("Error deleting incomplete account:", err);
        }
      }
    }
  };

  return (
    <div className="container px-5 d-flex align-items-center justify-content-center">
      <div className="col-lg-6">
        <div className="mb-5 text-center">
          <br></br>
          <h1 className="dashboard-title color: black">Stripe Onboarding</h1>
          {!connectedAccountId && (
            <p>
              To receive payments for the jobs you win, you'll need to set up a payment account. Bidi will never charge you to talk to users or place bids — a small service fee is only deducted after you've been paid.
              <br />
              You can skip this step for now and set it up later from your dashboard.
            </p>
          )}
          {connectedAccountId && !stripeConnectInstance && (
            <h2>Add your information to start accepting payments</h2>
          )}
          {error && (
            <p className="text-danger">
              Something went wrong with the account setup. Please try again or contact support if the issue persists.
            </p>
          )}
        </div>

        {!accountCreatePending && !connectedAccountId && (
          <div className="d-grid">
            <button className="btn-secondary" onClick={createAccount}>
              Connect {email} with Stripe
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
            <ConnectAccountOnboarding
              onExit={handleOnboardingExit}
            />
          </ConnectComponentsProvider>
        )}

        {(connectedAccountId || onboardingExited) && (
          <div className="mt-4 text-center">
            {onboardingExited && !error && (
              <p>Onboarding complete! You're ready to go.</p>
            )}
          </div>
        )}
        
        <div className="mt-4 text-center">
          <button
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={() => navigate("/business-dashboard")}
          >
            Return
          </button>
        </div>
      </div>
    </div>
  );
}
