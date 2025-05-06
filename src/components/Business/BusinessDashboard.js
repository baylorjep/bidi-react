import React, { useState, useEffect } from "react";
// import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../../App.css";
import "../../styles/BusinessDashboard.css";
// import DashboardBanner from "./DashboardBanner.js";
import verifiedCheckIcon from "../../assets/images/Icons/verified-check.svg";
import dashboardIcon from "../../assets/images/Icons/dashboard.svg";
import bidsIcon from "../../assets/images/Icons/bids.svg";
import messageIcon from "../../assets/images/Icons/message.svg";
// import paymentIcon from "../../assets/images/Icons/payment.svg";
import settingsIcon from "../../assets/images/Icons/settings.svg";
import profileIcon from "../../assets/images/Icons/profile.svg";
// import bidiLogo from "../../assets/images/bidi check.png";
// import MessagingView from "../Messaging/MessagingView";
// import PlacedBidDisplay from "./PlacedBids.js";
import BusinessBids from "./BusinessBids.js";
// import ProfilePage from "../Profile/Profile.js";
import BusinessSettings from "./BusinessSettings.js";
import PortfolioPage from "../Business/Portfolio/Portfolio.js";
import Onboarding from "../../components/Stripe/Onboarding.js";
import OpenRequests from "../../components/Request/OpenRequests.js";
import LoadingSpinner from "../LoadingSpinner.js";
import ChatInterface from "../Messaging/ChatInterface.js";
import MobileChatList from "../Messaging/MobileChatList.js";
import MessagingView from "../Messaging/MessagingView.js";

const BusinessDashSidebar = () => {
  const [connectedAccountId, setConnectedAccountId] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [BidiPlus, setBidiPlus] = useState(false);
  const [requests, setRequests] = useState([]); // Stores service requests
  const [activeSection, setActiveSection] = useState("dashboard");
  const [profileImage, setProfileImage] = useState("/images/default.jpg");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bids, setBids] = useState([]);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unviewedBidCount, setUnviewedBidCount] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [stripeError, setStripeError] = useState(false);
  const [portfolioPhotos, setPortfolioPhotos] = useState([]);
  const [setupProgress, setSetupProgress] = useState({
    paymentAccount: false,
    downPayment: false,
    minimumPrice: false,
    affiliateCoupon: false,
    verification: false,
    story: false,
    bidTemplate: false,
  });
  const [profileDetails, setProfileDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);
  const sidebarRef = React.useRef(null);
  const [selectedChat, setSelectedChat] = useState(null);

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

        const { data: profile, error: profileError } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        // Check for profile photos
        const { data: photos, error: photosError } = await supabase
          .from("profile_photos")
          .select("*")
          .eq("user_id", user.id)
          .eq("photo_type", "profile")
          .limit(1);

        if (photosError) throw photosError;

        // Update setupProgress state with accurate photo count
        setPortfolioPhotos(photos || []);
        setSetupProgress((prev) => ({
          ...prev,
          portfolio: photos && photos.length > 0,
        }));

        setError(null);

        // Set business profile data
        if (profile) {
          setBusinessName(profile.business_name || "Business Name Not Found");
          setConnectedAccountId(profile.stripe_account_id || null);
          setBidiPlus(!!profile.Bidi_Plus);
          setIsAdmin(!!profile.is_admin);
          setProfile(profile);
        }

        // Set profile picture
        if (photos && photos.length > 0) {
          setProfileImage(photos[0].photo_url); // Use the first photo as the profile picture
        } else {
          console.error("No profile picture found.");
        }

        const { data: bids, error: bidsError } = await supabase
          .from("bids")
          .select("*")
          .eq("user_id", user.id);

        if (bidsError) {
          console.error("Error fetching bids:", bidsError);
        } else {
          setBids(bids);
        }
      } catch (error) {
        console.error("An error occurred while fetching data:", error);
      } finally {
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem("activeSection", activeSection);
  }, [activeSection]);

  const handleMessagesClick = () => {
    if (isMobile) {
      setActiveSection("messages");
      setSelectedChat(null);
    } else {
      setActiveSection("messages");
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Check if the screen width is 768px or less
    };

    handleResize(); // Check on initial render
    window.addEventListener("resize", handleResize); // Listen for window resize

    return () => {
      window.removeEventListener("resize", handleResize); // Cleanup
    };
  }, []);

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

  // Add mouse move event listener to detect when mouse is near sidebar
  useEffect(() => {
    if (isMobile) return; // Only apply on desktop

    const handleMouseMove = (e) => {
      if (!sidebarRef.current) return;
      
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      const mouseX = e.clientX;
      
      // Show sidebar when mouse is within 50px of the left edge
      if (mouseX <= 50) {
        setIsSidebarVisible(true);
      } else if (!isHoveringSidebar && mouseX > sidebarRect.right) {
        setIsSidebarVisible(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile, isHoveringSidebar]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  const handleBackFromChat = () => {
    setSelectedChat(null);
  };

  return (
    <div className="business-dashboard text-left">
      <div className="dashboard-container">
        <aside 
          className={`sidebar ${isSidebarVisible ? 'visible' : 'hidden'}`}
          ref={sidebarRef}
          onMouseEnter={() => setIsHoveringSidebar(true)}
          onMouseLeave={() => setIsHoveringSidebar(false)}
        >
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
              onClick={() => setActiveSection("dashboard")}
              className={activeSection === "dashboard" ? "active" : ""}
            >
              <img src={dashboardIcon} alt="Requests" />
              <span>Requests</span>
            </li>
            <li 
              onClick={() => setActiveSection("bids")}
              className={activeSection === "bids" ? "active" : ""}
            >
              <img src={bidsIcon} alt="Bids" />
              <span>Bids</span>
            </li>
            <li 
              onClick={handleMessagesClick}
              className={activeSection === "messages" ? "active" : ""}
            >
              <img src={messageIcon} alt="Message" />
              <span>Message</span>
            </li>
            <li
              onClick={() => {
                handleViewPortfolio();
              }}
              className={activeSection === "portfolio" ? "active" : ""}
            >
              <img src={profileIcon} alt="Portfolio" />
              <span>Portfolio</span>
            </li>
            <li 
              onClick={() => setActiveSection("settings")}
              className={activeSection === "settings" ? "active" : ""}
            >
              <img src={settingsIcon} alt="Settings" />
              <span>Settings</span>
            </li>
          </ul>

          {/* Upgrade Prompt */}
          {/* {!BidiPlus && (
            <div className="upgrade-box">
              <p>
                Upgrade to <strong>PRO</strong> to get access to all features!
              </p>
            </div>
          )} */}
        </aside>
        {/* Main Dashboard */}
        <main className="dashboard-main">
          {activeSection === "dashboard" && <OpenRequests />}
          {activeSection === "messages" ? (
            isMobile ? (
              selectedChat ? (
                <MessagingView
                  currentUserId={user?.id}
                  businessId={selectedChat.id}
                  businessName={selectedChat.name}
                  profileImage={selectedChat.profileImage}
                  onBack={handleBackFromChat}
                />
              ) : (
                <MobileChatList 
                  currentUserId={user?.id} 
                  userType="business"
                  onChatSelect={handleChatSelect}
                />
              )
            ) : (
              <ChatInterface 
                currentUserId={user?.id}
                userType="business"
                initialChat={selectedChat}
              />
            )
          ) : activeSection === "bids" ? (
            <BusinessBids bids={bids} />
          ) : activeSection === "onboarding" ? (
            <Onboarding setActiveSection={setActiveSection} />
          ) : activeSection === "portfolio" ? (
            <PortfolioPage profileId={profile} />
          ) : activeSection === "settings" ? (
            <BusinessSettings
              setActiveSection={setActiveSection}
              connectedAccountId={connectedAccountId}
            />
          ) : null}
        </main>

        {/* Bottom Navigation Bar */}
        {isMobile && (
          <nav className="bottom-nav">
            <button 
              onClick={() => setActiveSection("dashboard")}
              className={activeSection === "dashboard" ? "active" : ""}
            >
              <div className="nav-item">
                <img src={dashboardIcon} alt="Dashboard" />
                <span className="nav-label">Requests</span>
              </div>
            </button>
            <button 
              onClick={() => setActiveSection("bids")}
              className={activeSection === "bids" ? "active" : ""}
            >
              <div className="nav-item">
                <img src={bidsIcon} alt="Bids" />
                <span className="nav-label">Bids</span>
              </div>
            </button>
            <button 
              onClick={handleMessagesClick}
              className={activeSection === "messages" ? "active" : ""}
            >
              <div className="nav-item">
                <img src={messageIcon} alt="Message" />
                <span className="nav-label">Messages</span>
              </div>
            </button>
            <button 
              onClick={() => handleViewPortfolio()}
              className={activeSection === "portfolio" ? "active" : ""}
            >
              <div className="nav-item profile-nav-item">
                <img src={profileIcon} alt="Portfolio" className="profile-icon" />
                <span className="nav-label">Portfolio</span>
              </div>
            </button>
            <button 
              onClick={() => setActiveSection("settings")}
              className={activeSection === "settings" ? "active" : ""}
            >
              <div className="nav-item">
                <img
                  src={settingsIcon}
                  alt="Settings"
                  className="settings-icon"
                />
                <span className="nav-label">Settings</span>
              </div>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};

export default BusinessDashSidebar;
