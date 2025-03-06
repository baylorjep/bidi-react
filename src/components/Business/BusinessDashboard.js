import React, { useState, useEffect } from "react";
import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../../App.css"; // Include this for custom styles
import "../../styles/BusinessDashboard.css";
import DashboardBanner from "./DashboardBanner.js";
import verifiedCheckIcon from "../../assets/images/Icons/verified-check.svg";
import dashboardIcon from "../../assets/images/Icons/dashboard.svg";
import bidsIcon from "../../assets/images/Icons/bids.svg";
import messageIcon from "../../assets/images/Icons/message.svg";
import paymentIcon from "../../assets/images/Icons/payment.svg";
import settingsIcon from "../../assets/images/Icons/settings.svg";

const BusinessDashSidebar = () => {
  const [connectedAccountId, setConnectedAccountId] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [BidiPlus, setBidiPlus] = useState(false);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [profileImage, setProfileImage] = useState("/images/default.jpg");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      setUser(user);

      if (userError || !user) {
        console.error("Error fetching user:", userError || "No user found.");
        return;
      }

      // Only fetch business details if user is valid
      const { data: profile, error: profileError } = await supabase
        .from("business_profiles")
        .select("business_name, stripe_account_id, Bidi_Plus")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      if (profile) {
        setBusinessName(profile.business_name || "Business Name Not Found");
        setConnectedAccountId(profile.stripe_account_id || null);
        setBidiPlus(!!profile.Bidi_Plus);
      }
    };

    // Fetch profile picture only if user is available
    const fetchProfilePic = async () => {
      if (user && user.id) {
        const { data: profilePicData, error: profilePicError } = await supabase
          .from("profile_photos")
          .select("photo_url")
          .eq("user_id", user.id)
          .eq("photo_type", "profile")
          .single();

        if (profilePicData) {
          setProfileImage(profilePicData.photo_url);
        } else if (profilePicError) {
          console.error("Error fetching profile picture:", profilePicError);
        }
      }
    };

    fetchBusinessDetails();
    fetchProfilePic();
  }, [user]);

  const formatBusinessName = (name) => {
    if (!name) return "Your Business";
    const maxLength = 20;

    if (name.length > maxLength) {
      const words = name.split(" ");
      let formattedName = [];
      let currentLine = "";

      words.forEach((word) => {
        if ((currentLine + word).length > maxLength) {
          formattedName.push(currentLine.trim());
          currentLine = word + " ";
        } else {
          currentLine += word + " ";
        }
      });

      formattedName.push(currentLine.trim());

      return (
        <span>
          {formattedName.map((line, index) => (
            <span key={index}>
              {line}{" "}
              {index === formattedName.length - 1 && BidiPlus && (
                <img
                  src={verifiedCheckIcon}
                  alt="Verified Check"
                  className="verified-icon"
                />
              )}
              <br />
            </span>
          ))}
        </span>
      );
    }

    return (
      <span>
        {name}{" "}
        {BidiPlus && (
          <img
            src={verifiedCheckIcon}
            alt="Verified Check"
            className="verified-icon"
          />
        )}
      </span>
    );
  };

  return (
    <div className="business-dashboard text-left">
      <div className="dashboard-container">
        <aside className="sidebar">
          {/* Profile Section */}
          <div className="profile-section">
            <img src={profileImage} alt="Vendor" className="profile-pic" />
            {BidiPlus && <div className="verified-badge">Verified</div>}
            <h4 className="profile-name">
              <span className="business-name-under-picture">
                {formatBusinessName(businessName)}
              </span>
            </h4>
          </div>

          {/* Sidebar Links */}
          <ul className="sidebar-links">
            <li onClick={() => setActiveSection("dashboard")}>
              <img src={dashboardIcon} alt="Dashboard" />
              <span>Dashboard</span>
            </li>
            <li onClick={() => setActiveSection("bids")}>
              {" "}
              {/* open-requests */}
              <img src={bidsIcon} alt="Bids" />
              <span>Bids</span>
            </li>
            <li onClick={() => setActiveSection("messages")}>
              <img src={messageIcon} alt="Message" />
              <span>Message</span>
            </li>
            <li>
              {connectedAccountId ? (
                <StripeDashboardButton accountId={connectedAccountId} />
              ) : (
                <button onClick={() => setActiveSection("onboarding")}>
                  <img src={paymentIcon} alt="Payment" />
                  <span>Payment</span>
                </button>
              )}
            </li>
            <li onClick={() => setActiveSection("profile")}>
              <img src={settingsIcon} alt="Settings" />
              <span>Settings</span>
            </li>
          </ul>

          {/* Upgrade Prompt */}
          {!BidiPlus && (
            <div className="upgrade-box">
              <p>
                Upgrade to <strong>PRO</strong> to get access to all features!
              </p>
            </div>
          )}
        </aside>
        {/* Main Dashboard */}
        <main className="dashboard-main">
          <DashboardBanner />
        </main>

        {/* If it is the main dashbaord */}
      </div>
    </div>
  );
};

export default BusinessDashSidebar;
