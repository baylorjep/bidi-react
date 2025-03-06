import React, { useState, useEffect } from "react";
import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../../App.css";
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
        <li
          onClick={() => navigate("/Dashboard")}
          style={{ cursor: "pointer" }}
        >
          <img src={dashboardIcon} alt="Dashboard" />
          <span>Dashboard</span>
        </li>
        <li
          onClick={() => navigate("/Open-Requests")}
          style={{ cursor: "pointer" }}
        >
          <img src={bidsIcon} alt="Bids" />
          <span>Bids</span>
        </li>
        <li
          onClick={() => setActiveSection("messages")}
          style={{ cursor: "pointer" }}
        >
          <img src={messageIcon} alt="Message" />
          <span>Message</span>
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
        <li onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
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
  );
};

export default BusinessDashSidebar;
