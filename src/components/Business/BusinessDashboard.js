import React, { useState, useEffect, useRef } from "react";
// import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import { supabase } from "../../supabaseClient";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../../App.css";
import "../../styles/BusinessDashboard.css";
import "../../styles/Sidebar.css";
// import DashboardBanner from "./DashboardBanner.js";
import verifiedCheckIcon from "../../assets/images/Icons/verified-check.svg";
import dashboardIcon from "../../assets/images/Icons/dashboard.svg";
import bidsIcon from "../../assets/images/Icons/bids.svg";
import messageIcon from "../../assets/images/Icons/message.svg";
// import paymentIcon from "../../assets/images/Icons/payment.svg";
import settingsIcon from "../../assets/images/Icons/settings.svg";
import profileIcon from "../../assets/images/Icons/profile.svg";
import bidiLogo from "../../assets/images/bidi check.png";
import logo from "../../assets/images/Bidi-Logo.svg";
// import MessagingView from "../Messaging/MessagingView";
// import PlacedBidDisplay from "./PlacedBids.js";
import BusinessBids from "./BusinessBids.js";
// import ProfilePage from "../Profile/Profile.js";
import BusinessSettings from "./BusinessSettings.js";
import PortfolioPage from "../Business/Portfolio/Portfolio.js";
import Onboarding from "../../components/Stripe/EnhancedStripeOnboarding.js";
import OpenRequests from "../../components/Request/OpenRequests.js";
import LoadingSpinner from "../LoadingSpinner.js";
import ChatInterface from "../Messaging/ChatInterface.js";
import MobileChatList from "../Messaging/MobileChatList.js";
import MessagingView from "../Messaging/MessagingView.js";
import AdminDashboard from "../admin/AdminDashboard.js";
import ContractTemplateEditor from "./ContractTemplateEditor.js";
import NewFeaturesModal from "./NewFeaturesModal";
import NotificationBell from '../Notifications/NotificationBell';
import TrainingVideos from './TrainingVideos.js';
import SetupProgressPopup from './SetupProgressPopup.js';

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
  const params = useParams();
  const location = useLocation();
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
  const [isPinned, setIsPinned] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);
  const sidebarRef = React.useRef(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showNewFeatures, setShowNewFeatures] = useState(false);
  const [hasSeenNewFeatures, setHasSeenNewFeatures] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const [scrollToSection, setScrollToSection] = useState(null);

  // Initialize activeSection from URL path
  useEffect(() => {
    const path = location.pathname;
    console.log('Current path:', path);
    const match = path.match(/\/business-dashboard\/(.+)/);
    if (match) {
      const section = match[1];
      console.log('Setting activeSection to:', section);
      setActiveSection(section);
    }
  }, [location.pathname]);

  // Reset scrollToSection when activeSection changes
  useEffect(() => {
    if (activeSection !== 'settings') {
      setScrollToSection(null);
    }
  }, [activeSection]);

  // Handle location state changes (from SetupProgressPopup navigation)
  useEffect(() => {
    console.log('Location state changed:', location.state);
    if (location.state && location.state.scrollToSection) {
      console.log('Received scrollToSection from location state:', location.state.scrollToSection);
      setScrollToSection(location.state.scrollToSection);
      // Clear the state to prevent re-triggering on re-renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Function to update section and URL
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setScrollToSection(null); // Reset scrollToSection when manually changing sections
    // Update URL to reflect the active section
    navigate(`/business-dashboard/${section}`, { replace: true });
  };

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
          setProfile({ ...profile, business_category: getCategories(profile.business_category) });
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

        // Check if user has seen the new features
        try {
          // First check localStorage as a fallback
          const localStorageKey = `newFeaturesSeen_${user.id}`;
          const hasSeenInLocalStorage = localStorage.getItem(localStorageKey);
          
          if (hasSeenInLocalStorage === 'true') {
            console.log("User has seen new features (localStorage)");
            setShowNewFeatures(false);
            return;
          }

          const { data: userPrefs, error: userPreferencesError } = await supabase
            .from("user_preferences")
            .select("has_seen")
            .eq("user_id", user.id)
            .maybeSingle();

          console.log("New Features Modal Check:", {
            userId: user.id,
            userPrefs,
            userPreferencesError,
            hasSeenNewFeatures: userPrefs?.has_seen
          });

          // Only show modal if user has explicitly not seen it (false) or no record exists
          if (userPreferencesError) {
            console.error("Error fetching user preferences:", userPreferencesError);
            // Don't show modal on error - assume user has seen it to avoid repeated shows
            setShowNewFeatures(false);
          } else if (userPrefs && userPrefs.has_seen === false) {
            console.log("Showing new features modal - user hasn't seen it yet");
            setShowNewFeatures(true);
          } else if (!userPrefs) {
            console.log("Showing new features modal - no record for user");
            setShowNewFeatures(true);
          } else {
            console.log("Not showing new features modal - user has already seen it or no preference set");
            setShowNewFeatures(false);
          }
        } catch (error) {
          console.error("Unexpected error checking new features preference:", error);
          // Don't show modal on unexpected errors
          setShowNewFeatures(false);
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
      handleSectionChange("messages");
      setSelectedChat(null);
    } else {
      handleSectionChange("messages");
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

  const handleViewPortfolio = async (targetSection = null) => {
    try {
      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("business_name")
        .eq("id", user.id)
        .single();

      if (businessProfile) {
        handleSectionChange("portfolio");
        // Set profile to user.id for the portfolio component
        setProfile(user.id);
        // Set scroll target for specific sections
        if (targetSection) {
          setScrollToSection(targetSection);
        }
      }
    } catch (error) {
      console.error("Error loading portfolio:", error);
    }
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

  useEffect(() => {
    if (isMobile) return;
    setIsSidebarVisible(isPinned);
  }, [isPinned, isMobile]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  const handleBackFromChat = () => {
    setSelectedChat(null);
  };

  const handleShowSidebar = () => {
    setIsSidebarVisible(true);
    setShowOverlay(true);
  };

  const handleOverlayClick = () => {
    if (!isPinned) {
      setIsSidebarVisible(false);
      setShowOverlay(false);
    }
  };

  const handleMessageFromRequest = (userId, preset = null) => {
    console.log("Message clicked for user:", userId);
    setActiveSection("messages");
    
    // Add delay to ensure state updates
    setTimeout(() => {
      console.log("Setting selected chat for user:", userId);
      setSelectedChat({
        id: userId,
        type: "client",
        presetMessage: preset
      });
    }, 100);
  };

  // Helper function to normalize business_category
  const getCategories = (category) => Array.isArray(category) ? category : [category].filter(Boolean);

  useEffect(() => {
    // Add global handler for messaging
    window.handleMessageFromRequest = handleMessageFromRequest;
    return () => {
      delete window.handleMessageFromRequest;
    };
  }, []);

  const handleCloseNewFeatures = async () => {
    setShowNewFeatures(false);
    setHasSeenNewFeatures(true);

    // Update user preferences in the database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Save to localStorage as backup
        const localStorageKey = `newFeaturesSeen_${user.id}`;
        localStorage.setItem(localStorageKey, 'true');
        
        const { error } = await supabase
          .from("user_preferences")
          .upsert({
            user_id: user.id,
            has_seen: true
          });
        
        if (error) {
          console.error("Error updating user preferences:", error);
          // Even if the database update fails, we still close the modal locally
          // to prevent it from showing repeatedly
        } else {
          console.log("Successfully updated user preferences - new features modal will not show again");
        }
      }
    } catch (error) {
      console.error("Error updating user preferences:", error);
      // Even if there's an error, we still close the modal locally
      // to prevent it from showing repeatedly
    }
  };

  // Handle setup step navigation
  const handleSetupStepNavigation = (stepKey) => {
    switch (stepKey) {
      case 'stripe':
        handleSectionChange('onboarding');
        break;
      case 'profile':
        handleViewPortfolio('profile');
        break;
      case 'photos':
        handleViewPortfolio('photos');
        break;
      case 'paymentSettings':
      case 'businessSettings':
      case 'calendar':
      case 'bidTemplate':
      case 'aiBidder':
        // Navigate to settings with scroll information in state
        console.log('Navigating to settings with stepKey:', stepKey);
        navigate('/business-dashboard/settings', { 
          replace: true,
          state: { scrollToSection: stepKey }
        });
        break;
      default:
        console.log('Unknown setup step:', stepKey);
        break;
    }
  };

  // Function to reset new features modal for all users (admin only)
  const resetNewFeaturesForAllUsers = async () => {
    try {
      const { error } = await supabase
        .from("user_preferences")
        .update({ has_seen: false })
        .neq('user_id', null); // Update all records

      if (error) {
        console.error("Error resetting new features for all users:", error);
        alert("Failed to reset new features modal for all users.");
      } else {
        console.log("Successfully reset new features modal for all users.");
        alert("New features modal has been reset for all users!");
      }
    } catch (error) {
      console.error("Error in resetNewFeaturesForAllUsers:", error);
      alert("An error occurred while resetting the new features modal.");
    }
  };

  // Function to reset new features modal for current user (for testing)
  const resetNewFeaturesForCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from("user_preferences")
          .upsert({
            user_id: user.id,
            has_seen: false
          });

        if (error) {
          console.error("Error resetting new features for current user:", error);
          alert("Failed to reset new features modal for current user.");
        } else {
          console.log("Successfully reset new features modal for current user.");
          setShowNewFeatures(true);
          setHasSeenNewFeatures(false);
          alert("New features modal has been reset for current user!");
        }
      }
    } catch (error) {
      console.error("Error in resetNewFeaturesForCurrentUser:", error);
      alert("An error occurred while resetting the new features modal.");
    }
  };

  // Add click outside handler for profile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleBackButton = (event) => {
      if (activeSection !== "portfolio") {
        event.preventDefault();
        setActiveSection("portfolio");
      }
    };

    window.addEventListener('popstate', handleBackButton);
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [activeSection]);

  return (
    <div className="business-dashboard text-left">
      <div className="dashboard-container">
        
        <aside 
          className={`sidebar ${isSidebarVisible ? 'visible' : 'hidden'}`}
          ref={sidebarRef}
        >
          {/* Add pin button at the top of sidebar */}
          <button 
            className="pin-button"
            onClick={() => {
              setIsPinned(!isPinned);
              if (!isPinned) {
                setIsSidebarVisible(true);
                setShowOverlay(true);
              } else {
                setShowOverlay(false);
              }
            }}
            title={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
          >
            <i className={`fas fa-thumbtack ${isPinned ? 'pinned' : ''}`}></i>
          </button>

          {/* Profile Section */}
          <div className="profile-section">
            <img src={logo} alt="Bidi Logo" className="bidi-logo" style={{ width: '120px', marginBottom: '20px' }} />
            <div className="profile-header">
              <img src={profileImage} alt="Vendor" className="profile-pic" />
              {BidiPlus && <div className="verified-badge">Verified</div>}
            </div>
            <h4 className="profile-name">
              <span className="business-name-under-picture sidebar-link-text">
                {formatBusinessName(businessName)}
              </span>
            </h4>
          </div>

          {/* Sidebar Links */}
          <ul className="sidebar-links">
            <li 
              onClick={() => handleSectionChange("dashboard")}
              className={activeSection === "dashboard" ? "active" : ""}
            >
              <img src={dashboardIcon} alt="Requests" />
              <span className="sidebar-link-text">Requests</span>
            </li>
            <li 
              onClick={() => handleSectionChange("bids")}
              className={activeSection === "bids" ? "active" : ""}
            >
              <img src={bidsIcon} alt="Bids" />
              <span className="sidebar-link-text">Bids</span>
            </li>
            <li 
              onClick={handleMessagesClick}
              className={activeSection === "messages" ? "active" : ""}
            >
              <img src={messageIcon} alt="Message" />
              <span className="sidebar-link-text">Message</span>
            </li>
            <li
              onClick={() => {
                handleViewPortfolio();
              }}
              className={activeSection === "portfolio" ? "active" : ""}
            >
              <img src={profileIcon} alt="Portfolio" />
              <span className="sidebar-link-text">Portfolio</span>
            </li>
            <li 
              onClick={() => handleSectionChange("training")}
              className={activeSection === "training" ? "active" : ""}
            >
              <i className="fas fa-play-circle" style={{ width: '24px', height: '24px', marginRight: '12px', fontSize: '20px', color: '#9633eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></i>
              <span className="sidebar-link-text">Training</span>
            </li>
            <li 
              onClick={() => handleSectionChange("settings")}
              className={activeSection === "settings" ? "active" : ""}
            >
              <img src={settingsIcon} alt="Settings" />
              <span className="sidebar-link-text">Settings</span>
            </li>
            {isAdmin && (
              <li 
                onClick={() => handleSectionChange("admin")}
                className={activeSection === "admin" ? "active" : ""}
              >
                <i className="fas fa-shield-alt" style={{ width: '24px', height: '24px', marginRight: '12px', fontSize: '20px', color: '#9633eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></i>
                <span className="sidebar-link-text">Admin</span>
              </li>
            )}
          </ul>

          {/* Logout Button */}
          <div className="sidebar-footer">
            <button 
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  console.error('Error signing out:', error.message);
                } else {
                  navigate('/');
                }
              }}
              className="logout-button"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span className="sidebar-link-text">Log Out</span>
            </button>
          </div>
        </aside>

        {/* Overlay for click-away behavior */}
        {showOverlay && !isPinned && (
          <div 
            className={`sidebar-overlay ${showOverlay ? 'visible' : ''}`}
            onClick={handleOverlayClick}
          />
        )}

        {/* Show Sidebar Button */}
        {!isSidebarVisible && !isMobile && (
          <button 
            className="show-sidebar-button"
            onClick={handleShowSidebar}
            title="Show Sidebar"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        )}

        {/* Main Dashboard */}
        <main className="dashboard-main">
          {console.log('Current activeSection:', activeSection)}
          {activeSection === "dashboard" && (
            <OpenRequests 
              onMessageClick={handleMessageFromRequest}
            />
          )}
          {activeSection === "messages" ? (
            isMobile ? (
              selectedChat ? (
                <MessagingView
                  currentUserId={user?.id}
                  businessId={selectedChat.id}
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
            <BusinessBids 
              setActiveSection={setActiveSection} 
              bids={bids}
            />
          ) : activeSection === "onboarding" ? (
            <Onboarding 
              setActiveSection={setActiveSection} 
              onOnboardingComplete={() => {
                // Refresh setup progress when onboarding is completed
                if (user) {
                  // Force a re-render of the SetupProgressPopup
                  setUser({ ...user });
                }
              }}
            />
          ) : activeSection === "portfolio" ? (
            <PortfolioPage 
              businessId={profile}
              scrollToSection={scrollToSection}
              onScrollComplete={() => setScrollToSection(null)}
            />
          ) : activeSection === "training" ? (
            <TrainingVideos />
          ) : activeSection === "settings" ? (
            <BusinessSettings
              setActiveSection={setActiveSection}
              connectedAccountId={connectedAccountId}
              scrollToSection={scrollToSection}
              onScrollComplete={() => setScrollToSection(null)}
            />
          ) : activeSection === "contract-template" ? (
            <ContractTemplateEditor setActiveSection={setActiveSection} />
          ) : activeSection === "admin" ? (
            <AdminDashboard />
          ) : null}
        </main>

        {/* Bottom Navigation Bar */}
        {isMobile && (
          <>
            <nav className="bottom-nav">
              <button 
                onClick={() => handleSectionChange("dashboard")}
                className={activeSection === "dashboard" ? "active" : ""}
              >
                <div className="nav-item">
                  <img src={dashboardIcon} alt="Dashboard" />
                  <span className="nav-label">Requests</span>
                </div>
              </button>
              <button 
                onClick={() => handleSectionChange("bids")}
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
                onClick={handleViewPortfolio}
                className={activeSection === "portfolio" ? "active" : ""}
              >
                <div className="nav-item profile-nav-item">
                  <img src={profileIcon} alt="Portfolio" className="profile-icon" />
                  <span className="nav-label">Portfolio</span>
                </div>
              </button>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`mobile-settings-button ${showProfileMenu ? 'active' : ''}`}
              >
                <div className="nav-item">
                  <img src={profileImage} alt="Profile" className="profile-nav-image-settings" />
                  <span className="nav-label">Settings</span>
                </div>
              </button>
            </nav>

            {/* Profile Menu */}
            {showProfileMenu && (
              <div className="profile-menu" ref={profileMenuRef}>
                <button 
                  onClick={() => {
                    handleSectionChange("training");
                    setShowProfileMenu(false);
                  }}
                  className="profile-menu-item"
                >
                  <i className="fas fa-play-circle"></i>
                  <span>Training</span>
                </button>
                <button 
                  onClick={() => {
                    handleSectionChange("settings");
                    setShowProfileMenu(false);
                  }}
                  className="profile-menu-item"
                >
                  <i className="fas fa-cog"></i>
                  <span>Settings</span>
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => {
                      handleSectionChange("admin");
                      setShowProfileMenu(false);
                    }}
                    className="profile-menu-item"
                  >
                    <i className="fas fa-shield-alt"></i>
                    <span>Admin</span>
                  </button>
                )}
                <button 
                  onClick={async () => {
                    const { error } = await supabase.auth.signOut();
                    if (error) {
                      console.error('Error signing out:', error.message);
                    } else {
                      navigate('/');
                    }
                  }}
                  className="profile-menu-item"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <NewFeaturesModal
        isOpen={showNewFeatures}
        onClose={handleCloseNewFeatures}
        loomVideoUrl="YOUR_LOOM_VIDEO_URL_HERE"
      />

      {/* Setup Progress Popup */}
      {user && (
        <SetupProgressPopup
          userId={user.id}
          onNavigateToSection={handleSetupStepNavigation}
        />
      )}
    </div>
  );
};

export default BusinessDashSidebar;
