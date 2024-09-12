import React, { useState, useEffect } from "react";
import StripeDashboardButton from "../Stripe/StripeDashboardButton"; // Import the button component for viewing Stripe dashboard
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom"; // To navigate to the onboarding page

const BusinessDashboard = () => {
  const [connectedAccountId, setConnectedAccountId] = useState(null);
  const navigate = useNavigate(); // For navigating to the onboarding page

  useEffect(() => {
    const fetchStripeAccountId = async () => {
      const { data: { user } } = await supabase.auth.getUser(); // Get the current logged-in user
      if (user) {
        const { data: profile } = await supabase
          .from('business_profiles')
          .select('stripe_account_id')
          .eq('id', user.id)
          .single();

        if (profile && profile.stripe_account_id) {
          setConnectedAccountId(profile.stripe_account_id); // Set the connected account ID
        }
      }
    };

    fetchStripeAccountId();
  }, []);

  return (
    <div className="business-dashboard">
      <br></br>
      <h1>Welcome to your Business Dashboard</h1>
      
      {/* Show the Stripe Dashboard button if there's a connected account */}
      {connectedAccountId ? (
        <StripeDashboardButton accountId={connectedAccountId} />
      ) : (
        <>
          <p>You haven't set up a Stripe account yet.</p>
          <button className="btn btn-secondary btn-lg w-100"
    
            onClick={() => navigate("/onboarding")}
          >
            Set Up Payment Account
          </button>
        </>
      )}
      
      {/* Other dashboard elements */}
      <div className="other-dashboard-elements">
        {/* Add your other dashboard features here */}
      </div>
    </div>
  );
};

export default BusinessDashboard;