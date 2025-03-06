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
import MessagingView from "../Messaging/MessagingView";
import PlacedBidDisplay from "./PlacedBids.js";

const BusinessDashSidebar = () => {
  const [connectedAccountId, setConnectedAccountId] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [BidiPlus, setBidiPlus] = useState(false);
  const [requests, setRequests] = useState([]); // Stores service requests
  const [activeSection, setActiveSection] = useState("dashboard");
  const [profileImage, setProfileImage] = useState("/images/default.jpg");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error fetching user:", userError || "No user found.");
          return;
        }
        setUser(user);

        // Fetch business details and profile picture concurrently
        const [profileRes, profilePicRes] = await Promise.all([
          supabase
            .from("business_profiles")
            .select(
              "business_name, stripe_account_id, Bidi_Plus, business_category"
            )
            .eq("id", user.id)
            .single(),
          supabase
            .from("profile_photos")
            .select("photo_url")
            .eq("user_id", user.id)
            .eq("photo_type", "profile")
            .single(),
        ]);

        if (profileRes.error) {
          console.error("Error fetching business profile:", profileRes.error);
          return;
        }

        if (profileRes.data) {
          setBusinessName(
            profileRes.data.business_name || "Business Name Not Found"
          );
          setConnectedAccountId(profileRes.data.stripe_account_id || null);
          setBidiPlus(!!profileRes.data.Bidi_Plus);
          setProfile(profileRes.data);
        }

        if (profilePicRes.data) {
          setProfileImage(profilePicRes.data.photo_url);
        } else if (profilePicRes.error) {
          console.error("Error fetching profile picture:", profilePicRes.error);
        }

        // Fetch service requests based on business category
        if (profileRes.data.business_category) {
          const { data: requestsData, error: requestsError } = await supabase
            .from("requests")
            .select("*")
            .eq("service_category", profileRes.data.business_category);

          if (requestsError) {
            console.error("Error fetching requests:", requestsError);
            return;
          }

          setRequests(requestsData); // Store requests in state
        } else {
          console.warn("No business category found for this profile.");
          setRequests([]); // Ensure no stale requests remain
        }
      } catch (error) {
        console.error("An error occurred while fetching data:", error);
      }
    };

    fetchData();
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
          {/* find active sections */}
          {activeSection === "dashboard" ? (
            <section className="job-listings">
              {/* Section Header */}
              <div className="job-listings-header">
                <span className="job-title">Jobs for you</span>
                <span className="job-subtext">
                  See the requests that you haven't bid on!
                </span>
              </div>

              {/* Job Cards Grid */}
              <div className="job-cards">
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <PlacedBidDisplay key={request.id} requestId={request.id} />
                  ))
                ) : (
                  <p className="no-jobs">No available jobs at this time.</p>
                )}
              </div>
            </section>
          ) : activeSection === "messages" ? (
            <MessagingView />
          ) : activeSection === "bids" ? (
            <div>Bids Filler</div>
          ) : activeSection === "onboarding" ? (
            <div>onboarding filler</div>
          ) : (
            <div>onboarding filler</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BusinessDashSidebar;
