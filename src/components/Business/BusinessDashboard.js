import React, { useState, useEffect } from "react";
import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import { supabase } from "../../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import "../../App.css"; // Include this for custom styles
import DashboardBanner from "./DashboardBanner";

const BusinessDashboard = () => {
  return (
    <div className="business-dashboard text-left">
      <div className="dashboard-container">
        {/* Sidebar */}
        {/* <aside className="sidebar">
          <div className="profile-section">
            <img src={profilePic} alt="Profile" className="profile-pic" />
            {BidiPlus && <div className="verified-badge">Verified</div>}
            <h4 className="profile-name">
              <span className="business-name-under-picture">{formatBusinessName(businessName)}</span>
            </h4>
          </div>
          <ul className="sidebar-links">
            <li onClick={() => navigate("/Dashboard")} style={{ cursor: "pointer" }}>
              <img src={dashboardIcon} alt="Dashboard" />
              <span>Dashboard</span>
            </li>
            <li onClick={() => navigate("/Open-Requests")} style={{ cursor: "pointer" }}>
              <img src={bidsIcon} alt="Bids" />
              <span>Bids</span>
            </li>
            <li onClick={() => setActiveSection("messages")} style={{ cursor: "pointer" }}>
              <img src={messageIcon} alt="Message" />
              <span>Message</span>
            </li>
            <li style={{ cursor: connectedAccountId ? "default" : "pointer" }}>
              {connectedAccountId ? (
                <StripeDashboardButton accountId={connectedAccountId} />
              ) : (
                <button onClick={() => navigate("/onboarding")} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <img src={paymentIcon} alt="Payment" />
                  <span>Payment</span>
                </button>
              )}
            </li>
            <li onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
              <img src={settingsIcon} alt="Settings" />
              <span>Settings</span>
            </li>
          </ul>
          <br></br><br></br>
          {!BidiPlus && <div className="upgrade-box">
            <p>Upgrade to <strong>PRO</strong> to get access to all features!</p>
          </div>}
        </aside> */}

        {/* Main Dashboard */}
        <main className="dashboard-main">
          <DashboardBanner />
        </main>
      </div>
    </div>
  );
};

export default BusinessDashboard;
