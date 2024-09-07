import React, { useState } from "react";
import { useStripeConnect } from "../../hooks/useStripeConnect";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";

export default function Onboarding() {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const [error, setError] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState();
  const stripeConnectInstance = useStripeConnect(connectedAccountId);

  return (
    <div className="container">
      <div className="banner">
        <h2>BIDI</h2>
      </div>
      <div className="content">
        {!connectedAccountId && <h2>Get ready for take off</h2>}
        {connectedAccountId && !stripeConnectInstance && <h2>Add information to start accepting money</h2>}
        {!connectedAccountId && <p>Bidi is the world's best up and coming photography platform: join our team of photographers to help people capture their.</p>}
        {!accountCreatePending && !connectedAccountId && (
          <div>
            <button
              onClick={async () => {
                setAccountCreatePending(true);
                setError(false);
                fetch("/account", {
                  method: "POST",
                })
                  .then((response) => response.json())
                  .then((json) => {
                    setAccountCreatePending(false);
                    const { account, error } = json;

                    if (account) {
                      setConnectedAccountId(account);
                    }

                    if (error) {
                      setError(true);
                    }
                  });
              }}
            >
              Sign up
            </button>
          </div>
        )}
        {stripeConnectInstance && (
          <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
            <ConnectAccountOnboarding
              onExit={() => setOnboardingExited(true)}
            />
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
            This is a sample app for Connect onboarding using the Account Onboarding embedded component. <a href="https://docs.stripe.com/connect/onboarding/quickstart?connect-onboarding-surface=embedded" target="_blank" rel="noopener noreferrer">View docs</a>
          </p>
        </div>
      </div>
    </div>
  );
}