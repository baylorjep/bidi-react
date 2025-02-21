import React from "react";
import { useNavigate } from "react-router-dom";
import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import dashboardIcon from "../../assets/images/Icons/dashboard.svg";
import bidsIcon from "../../assets/images/Icons/bids.svg";
import messageIcon from "../../assets/images/Icons/message.svg";
import paymentIcon from "../../assets/images/Icons/payment.svg";
import settingsIcon from "../../assets/images/Icons/settings.svg";
import profilePic from "../../assets/images/Profile-Picture.svg";

const Sidebar = ({ setActiveSection, connectedAccountId }) => {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="profile-section">
        <img src={profilePic} alt="Profile" className="profile-pic" />
      </div>
      <ul className="sidebar-links">
        <li onClick={() => setActiveSection("dashboard")}>
          <img src={dashboardIcon} alt="Dashboard" />
          <span>Dashboard</span>
        </li>
        <li onClick={() => navigate("/Open-Requests")}>
          <img src={bidsIcon} alt="Bids" />
          <span>Bids</span>
        </li>
        <li onClick={() => setActiveSection("messages")}>
          <img src={messageIcon} alt="Message" />
          <span>Messages</span>
        </li>
        <li style={{ cursor: connectedAccountId ? "default" : "pointer" }}>
          {connectedAccountId ? (
            <StripeDashboardButton accountId={connectedAccountId} />
          ) : (
            <button
              onClick={() => navigate("/onboarding")}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <img src={paymentIcon} alt="Payment" />
              <span>Payment</span>
            </button>
          )}
        </li>
        <li onClick={() => navigate("/profile")}>
          <img src={settingsIcon} alt="Settings" />
          <span>Settings</span>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;