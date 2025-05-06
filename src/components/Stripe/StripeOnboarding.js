import React, { useState, useEffect } from "react";
import { useStripeConnect } from "../../hooks/useStripeConnect";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../../App.css";

export default function StripeOnboarding() {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const [error, setError] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState();
  const [email, setEmail] = useState(""); // Will be set from Supabase auth
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

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const userId = user.id;

          const { error: supabaseError } = await supabase
            .from("business_profiles")
            .update({ stripe_account_id: json.account })
            .eq("id", userId);

          if (supabaseError) {
            console.error(
              "Failed to store connected account ID:",
              supabaseError
            );
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
          <h1 className="OnboardingPageHeader">Set Up Your Payment Account</h1>
          <p>
            To receive payments for the jobs you win, you’ll need to set up a payment account. Bidi will never charge you to talk to users or place bids — a small service fee is only deducted after you’ve been paid.
            <br />
            You can skip this step for now and set it up later from your dashboard.
          </p>
        </div>

        {/* If no connected account */}
        {!accountCreatePending && !connectedAccountId && (
          <div>
            <button
              className="btn btn-secondary btn-lg w-100 mb-3"
              onClick={createAccount}
            >
              Set Up Payment Account with {email}
            </button>
            <button
              className="btn btn-outline-secondary btn-lg w-100"
              onClick={() => navigate("/dashboard")}
            >
              Skip for Now
            </button>
          </div>
        )}

        {/* Account creation pending */}
        {accountCreatePending && (
          <div className="text-center">
            <p>Creating your Stripe connected account...</p>
          </div>
        )}

        {/* Stripe onboarding flow */}
        {stripeConnectInstance && (
          <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
            <ConnectAccountOnboarding
              onExit={() => setOnboardingExited(true)}
            />
          </ConnectComponentsProvider>
        )}

        {/* Onboarding completion */}
        {(connectedAccountId || onboardingExited) && (
          <div className="text-center mt-4">
            {onboardingExited && (
              <p>Onboarding complete! You're ready to go.</p>
            )}
            <button
              className="btn btn-primary"
              onClick={() => navigate("/dashboard")}
            >
              Proceed to Dashboard
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="text-center mt-4">
            <p className="text-danger">
              Something went wrong! Please try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
