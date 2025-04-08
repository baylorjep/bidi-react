import React, { useState, useEffect } from "react";
// import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../../App.css"; // Include this for custom styles
// import { Modal, Button } from "react-bootstrap"; // Make sure to install react-bootstrap
// import Verification from "../../assets/Frame 1162.svg";
import "../../styles/BusinessDashboard.css";
import DashboardBanner from "./DashboardBanner.js";
import verifiedCheckIcon from "../../assets/images/Icons/verified-check.svg";
import dashboardIcon from "../../assets/images/Icons/dashboard.svg";
import bidsIcon from "../../assets/images/Icons/bids.svg";
import messageIcon from "../../assets/images/Icons/message.svg";
// import paymentIcon from "../../assets/images/Icons/payment.svg";
import settingsIcon from "../../assets/images/Icons/settings.svg";
import profileIcon from "../../assets/images/Icons/profile.svg";
import bidiLogo from "../../assets/images/bidi check.png";
// import MessagingView from "../Messaging/MessagingView";
import PlacedBidDisplay from "./PlacedBids.js";
import BusinessBids from "./BusinessBids.js";
// import ProfilePage from "../Profile/Profile.js";
import BusinessSettings from "./BusinessSettings.js";
import PortfolioPage from "../Business/Portfolio/Portfolio.js";
import Onboarding from "../../components/Stripe/Onboarding.js";

const BusinessDashSidebar = () => {
  const [connectedAccountId, setConnectedAccountId] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [BidiPlus, setBidiPlus] = useState(false);
  const [requests, setRequests] = useState([]); // Stores service requests
  const [activeSection, setActiveSection] = useState(
    localStorage.getItem("activeSection") || "dashboard"
  );
  const [profileImage, setProfileImage] = useState("/images/default.jpg");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bids, setBids] = useState([]);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the logged-in user
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
        const [profileRes, profilePicRes, bidsRes] = await Promise.all([
          supabase
            .from("business_profiles")
            .select(
              "business_name, stripe_account_id, Bidi_Plus, business_category, is_admin"
            )
            .eq("id", user.id)
            .single(),
          supabase
            .from("profile_photos")
            .select("photo_url")
            .eq("user_id", user.id)
            .eq("photo_type", "profile")
            .single(),
          supabase.from("bids").select("*").eq("user_id", user.id), // Fetch all bids for this business
        ]);

        if (profileRes.error) {
          console.error("Error fetching business profile:", profileRes.error);
          return;
        }

        // Set business profile data
        if (profileRes.data) {
          setBusinessName(
            profileRes.data.business_name || "Business Name Not Found"
          );
          setConnectedAccountId(profileRes.data.stripe_account_id || null);
          setBidiPlus(!!profileRes.data.Bidi_Plus);
          setIsAdmin(!!profileRes.data.is_admin);
          setProfile(profileRes.data);
        }

        // Set profile picture
        if (profilePicRes.data) {
          setProfileImage(profilePicRes.data.photo_url);
        } else if (profilePicRes.error) {
          console.error("Error fetching profile picture:", profilePicRes.error);
        }

        if (profilePicRes.data) {
          setProfileImage(profilePicRes.data.photo_url);
        } else if (profilePicRes.error) {
          console.error("Error fetching profile picture:", profilePicRes.error);
        }

        if (bidsRes.error) {
          console.error("Error fetching bids:", bidsRes.error);
        } else {
          setBids(bidsRes.data);
        }
      } catch (error) {
        console.error("An error occurred while fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Save the active section to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("activeSection", activeSection);
  }, [activeSection]);

  const handleViewPortfolio = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileDetails, error } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile details:", error);
      return;
    }

    // Set the active section to "portfolio" and pass the profile ID
    setProfile(profileDetails.id); // Store the profile ID in state
    setActiveSection("portfolio");
  };

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
            <li
              onClick={() => {
                handleViewPortfolio(); // Trigger the function when clicking the button
              }}
            >
              <img src={profileIcon} alt="Portfolio" />
              <span>Portfolio</span>
            </li>
            <li onClick={() => setActiveSection("settings")}>
              <img src={settingsIcon} alt="Settings" />
              <span>Settings</span>
            </li>
            {isAdmin && (
              <li onClick={() => navigate("/admin-dashboard")}>
                <img src={bidiLogo} alt="Admin" />
                <span>Admin</span>
              </li>
            )}
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
                <br />
              </div>

              {/* Job Cards Grid */}
              <div className="all-job-cards">
                {requests.length > 0 ? (
                  <PlacedBidDisplay requests={requests} />
                ) : (
                  <p className="no-jobs">No available jobs at this time.</p>
                )}
              </div>
            </section>
          ) : activeSection === "messages" ? (
            // <MessagingView />
            <div
              className="text-gray-700 mt-4"
              style={{
                fontSize: "2vw",
                fontWeight: "bold",
              }}
            >
              Coming Soon!
            </div>
          ) : activeSection === "bids" ? (
            <BusinessBids bids={bids} />
          ) : activeSection === "onboarding" ? (
            <Onboarding setActiveSection={setActiveSection} />
          ) : activeSection === "portfolio" ? (
            <PortfolioPage profileId={profile} /> // Pass profileId as a prop
          ) : activeSection === "settings" ? (
            <BusinessSettings
              setActiveSection={setActiveSection}
              connectedAccountId={connectedAccountId}
            />
          ) : (
            // ) : activeSection === "admin" ? (
            //   <AdminDashboard
            //     connectedAccountId={connectedAccountId}
            //     setUnviewedBidCount={setUnviewedBidCount}
            //   />
            <div>An error occurred</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BusinessDashSidebar;
