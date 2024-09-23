import React, { useState, useEffect } from "react";
import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import '../../App.css'; // Include this for custom styles

const BusinessDashboard = () => {
  const [connectedAccountId, setConnectedAccountId] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('business_profiles')
          .select('business_name, stripe_account_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          setBusinessName(profile.business_name);
          if (profile.stripe_account_id) {
            setConnectedAccountId(profile.stripe_account_id);
          }
        }
      }
    };

    fetchBusinessDetails();
  }, []);

  return (
    <div className="business-dashboard text-center">
      <h1>Welcome, {businessName}!</h1>
      
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-6 col-sm-12">
            <button 
              className="btn btn-secondary btn-lg w-100 mb-3" 
              onClick={() => navigate("/open-requests")}
            >
              View Requests
            </button>
          </div>
          <div className="col-lg-5 col-md-6 col-sm-12">
            {connectedAccountId ? (
              <StripeDashboardButton accountId={connectedAccountId} />
            ) : (
              <button 
                className="btn btn-secondary btn-lg w-100 mb-3" 
                onClick={() => navigate("/onboarding")}
              >
                Set Up Payment Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;