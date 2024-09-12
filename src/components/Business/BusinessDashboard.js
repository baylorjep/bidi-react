import React, { useState, useEffect } from "react";
import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import '../../App.css'; // Include this for custom styles

const BusinessDashboard = () => {
  const [connectedAccountId, setConnectedAccountId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStripeAccountId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('business_profiles')
          .select('stripe_account_id')
          .eq('id', user.id)
          .single();

        if (profile && profile.stripe_account_id) {
          setConnectedAccountId(profile.stripe_account_id);
        }
      }
    };

    fetchStripeAccountId();
  }, []);

  return (
    <div className="business-dashboard">
      <h1>Welcome to your Business Dashboard</h1>
      
      {connectedAccountId ? (
        <StripeDashboardButton accountId={connectedAccountId} />
      ) : (
        <>
          <p>You haven't set up a Stripe account yet.</p>
          <button 
            className="onboarding-button" 
            onClick={() => navigate("/onboarding")}
          >
            Set Up Payment Account
          </button>
        </>
      )}
      
      <div className="dashboard-section">
        <h2>Overview</h2>
        <div className="overview-box">
          <div className="overview-item">
            <h3>Total Earnings</h3>
            <p>$5,000</p>
          </div>
          <div className="overview-item">
            <h3>Upcoming Jobs</h3>
            <p>3</p>
          </div>
          <div className="overview-item">
            <h3>Pending Payments</h3>
            <p>$1,200</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-section">
        <h2>Bid Management</h2>
        <p>You have 2 active bids</p>
        <button className="action-button">View Bids</button>
      </div>
      
      <div className="dashboard-section">
        <h2>Profile Settings</h2>
        <button className="action-button">Update Profile</button>
        <button className="action-button">Manage Portfolio</button>
      </div>
      
      <div className="dashboard-section">
        <h2>Payout History</h2>
        <button className="action-button">View Payout History</button>
      </div>

      <div className="dashboard-section">
        <h2>Notifications</h2>
        <p>No new notifications</p>
      </div>
    </div>
  );
};

export default BusinessDashboard;