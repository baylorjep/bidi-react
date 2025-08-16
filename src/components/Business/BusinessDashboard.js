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

  // Notification counts for sidebar tabs
  const [notificationCounts, setNotificationCounts] = useState({
    dashboard: 0,    // New requests
    bids: 0,         // Bids needing follow-up
    messages: 0,     // Unread messages
    portfolio: 0,    // Portfolio updates
    training: 0,     // New training content
    settings: 0,     // Settings updates
    admin: 0         // Admin notifications
  });

  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

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

  // Handle location state changes (from navigation)
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
    
    // Clear notifications for the visited section
    clearSectionNotifications(section);
    
    // If navigating to dashboard, also refresh notifications to get latest counts
    if (section === 'dashboard') {
      setTimeout(() => {
        fetchNotificationCounts();
      }, 500);
    }
    
    // Update URL to reflect the active section
    navigate(`/business-dashboard/${section}`, { replace: true });
  };

  // Function to clear notifications for a specific section
  const clearSectionNotifications = async (section) => {
    if (!user) return;

    try {
      switch (section) {
        case 'dashboard':
          // Mark all open requests as seen for this user
          const requestTypes = ['beauty_requests', 'catering_requests', 'dj_requests', 'florist_requests', 'photography_requests', 'videography_requests', 'wedding_planning_requests'];
          
          for (const requestType of requestTypes) {
            try {
              // Update has_seen to include current user's ID
              await supabase
                .from(requestType)
                .update({ 
                  has_seen: supabase.sql`COALESCE(has_seen, '[]'::jsonb) || '["${user.id}"]'::jsonb` 
                })
                .not("hidden_by_vendor", "cs.{${user.id}}")
                .or(`has_seen.is.null,not(has_seen.cs.{${user.id}})`)
                .eq("status", "open");
            } catch (error) {
              console.error(`Error updating ${requestType} has_seen:`, error);
            }
          }
          break;

        case 'bids':
          // Mark bids as followed up
          await supabase
            .from("bids")
            .update({ followed_up: true })
            .eq("user_id", user.id)
            .eq("followed_up", false);
          break;

        case 'messages':
          // Mark messages as seen
          const { error: messagesError } = await supabase
            .from("messages")
            .update({ seen: true })
            .eq("receiver_id", user.id)
            .eq("seen", false);
          
          if (messagesError) {
            console.error("Error marking messages as seen:", messagesError);
          } else {
            console.log("Messages marked as seen successfully");
          }
          break;

        default:
          break;
      }

      // Refresh notification counts immediately after clearing
      await fetchNotificationCounts();
      
      // Also refresh again after a short delay to ensure database updates are reflected
      setTimeout(() => {
        fetchNotificationCounts();
      }, 500);
    } catch (error) {
      console.error("Error clearing section notifications:", error);
    }
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
    // Clear notifications for messages section
    clearSectionNotifications("messages");
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
        // Clear notifications for portfolio section
        clearSectionNotifications("portfolio");
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

  // Function to fetch notification counts for all sections
  const fetchNotificationCounts = async () => {
    if (!user) return;

    setIsLoadingNotifications(true);
    
    try {
      // 1. Fetch new requests count (dashboard) - check all request types
      const requestTypes = ['beauty_requests', 'catering_requests', 'dj_requests', 'florist_requests', 'photography_requests', 'videography_requests', 'wedding_planning_requests'];
      
      let totalNewRequests = 0;
      
      for (const requestType of requestTypes) {
        try {
          const { count } = await supabase
            .from(requestType)
            .select("*", { count: "exact", head: true })
            .not("hidden_by_vendor", "cs.{${user.id}}")
            .or(`has_seen.is.null,not(has_seen.cs.{${user.id}})`)
            .eq("status", "open");
          
          totalNewRequests += count || 0;
        } catch (error) {
          console.error(`Error fetching ${requestType}:`, error);
        }
      }

      // 2. Fetch bids needing follow-up (bids that haven't been followed up on)
      const { count: bidsNeedingFollowUp } = await supabase
        .from("bids")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("followed_up", false)
        .not("status", "in", ["accepted", "rejected", "expired"]);

      // 3. Fetch unread messages count
      const { count: unreadMessages } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("seen", false);

      console.log('Notification counts:', {
        requests: totalNewRequests,
        bids: bidsNeedingFollowUp,
        messages: unreadMessages
      });

      // Update notification counts
      setNotificationCounts({
        dashboard: totalNewRequests,
        bids: bidsNeedingFollowUp || 0,
        messages: unreadMessages || 0,
        portfolio: 0, // No portfolio notifications for now
        training: 0,  // No training notifications for now
        settings: 0,  // No settings notifications for now
        admin: 0      // No admin notifications for now
      });

    } catch (error) {
      console.error("Error fetching notification counts:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Manual refresh function for notifications
  const refreshNotifications = () => {
    fetchNotificationCounts();
  };

  // Function to manually dismiss a specific notification type
  const dismissNotification = async (section) => {
    if (!user) return;

    try {
      switch (section) {
        case 'dashboard':
          // Mark all open requests as seen for this user
          await clearSectionNotifications('dashboard');
          break;
        case 'bids':
          // Mark all bids as followed up
          await clearSectionNotifications('bids');
          break;
        case 'messages':
          // Mark all messages as seen
          await clearSectionNotifications('messages');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  // Fetch notification counts when user changes or setup progress changes
  useEffect(() => {
    if (user) {
      fetchNotificationCounts();
    }
  }, [user, setupProgress]);

  // Set up interval to refresh notification counts
  useEffect(() => {
    if (user) {
      const interval = setInterval(fetchNotificationCounts, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  // Set up real-time subscriptions for notifications
  useEffect(() => {
    if (!user) return;

    const subscriptions = [];

    // Subscribe to new requests
    const requestTypes = ['beauty_requests', 'catering_requests', 'dj_requests', 'florist_requests', 'photography_requests', 'videography_requests', 'wedding_planning_requests'];
    
    requestTypes.forEach(requestType => {
      const subscription = supabase
        .channel(`${requestType}_notifications`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: requestType 
          }, 
          () => {
            // Refresh notification counts when requests change
            fetchNotificationCounts();
          }
        )
        .subscribe();
      
      subscriptions.push(subscription);
    });

    // Subscribe to messages
    const messagesSubscription = supabase
      .channel('messages_notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages' 
        }, 
        () => {
          fetchNotificationCounts();
        }
      )
      .subscribe();
    
    subscriptions.push(messagesSubscription);

    // Subscribe to bids
    const bidsSubscription = supabase
      .channel('bids_notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bids' 
        }, 
        () => {
          fetchNotificationCounts();
        }
      )
      .subscribe();
    
    subscriptions.push(bidsSubscription);

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach(sub => {
        supabase.removeChannel(sub);
      });
    };
  }, [user]);

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
              {notificationCounts.dashboard > 0 && (
                <div 
                  className="notification-badge"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification('dashboard');
                  }}
                  title="Click to dismiss"
                >
                  {notificationCounts.dashboard > 99 ? '99+' : notificationCounts.dashboard}
                </div>
              )}
            </li>
            <li 
              onClick={() => handleSectionChange("bids")}
              className={activeSection === "bids" ? "active" : ""}
            >
              <img src={bidsIcon} alt="Bids" />
              <span className="sidebar-link-text">Bids</span>
              {notificationCounts.bids > 0 && (
                <div 
                  className="notification-badge"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification('bids');
                  }}
                  title="Click to dismiss"
                >
                  {notificationCounts.bids > 99 ? '99+' : notificationCounts.bids}
                </div>
              )}
            </li>
            <li 
              onClick={handleMessagesClick}
              className={activeSection === "messages" ? "active" : ""}
            >
              <img src={messageIcon} alt="Message" />
              <span className="sidebar-link-text">Message</span>
              {notificationCounts.messages > 0 && (
                <div 
                  className="notification-badge"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification('messages');
                  }}
                  title="Click to dismiss"
                >
                  {notificationCounts.messages > 99 ? '99+' : notificationCounts.messages}
                </div>
              )}
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
            {/* Settings Tab */}
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
                  // Force a re-render
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
                {notificationCounts.dashboard > 0 && (
                  <div 
                    className="notification-badge"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification('dashboard');
                    }}
                    title="Click to dismiss"
                  >
                    {notificationCounts.dashboard > 99 ? '99+' : notificationCounts.dashboard}
                  </div>
                )}
              </button>
              <button 
                onClick={() => handleSectionChange("bids")}
                className={activeSection === "bids" ? "active" : ""}
              >
                <div className="nav-item">
                  <img src={bidsIcon} alt="Bids" />
                  <span className="nav-label">Bids</span>
                </div>
                {notificationCounts.bids > 0 && (
                  <div 
                    className="notification-badge"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification('bids');
                    }}
                    title="Click to dismiss"
                  >
                    {notificationCounts.bids > 99 ? '99+' : notificationCounts.bids}
                  </div>
                )}
              </button>
              <button 
                onClick={handleMessagesClick}
                className={activeSection === "messages" ? "active" : ""}
              >
                <div className="nav-item">
                  <img src={messageIcon} alt="Message" />
                  <span className="nav-label">Messages</span>
                </div>
                {notificationCounts.messages > 0 && (
                  <div 
                    className="notification-badge"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification('messages');
                    }}
                    title="Click to dismiss"
                  >
                    {notificationCounts.messages > 99 ? '99+' : notificationCounts.messages}
                  </div>
                )}
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

      {/* Setup Progress Popup - Removed duplicate, handled by App.js */}
    </div>
  );
};

export default BusinessDashSidebar;
