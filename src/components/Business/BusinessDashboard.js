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
        {/* Main Dashboard */}
        <main className="dashboard-main">
          <DashboardBanner />
        </main>
      </div>
    </div>
  );
};

export default BusinessDashboard;
