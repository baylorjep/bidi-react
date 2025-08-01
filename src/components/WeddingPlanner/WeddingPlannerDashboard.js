import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "../../App.css";
import "../../styles/WeddingPlannerDashboard.css";
import "../../styles/Sidebar.css";
import verifiedCheckIcon from "../../assets/images/Icons/verified-check.svg";
import dashboardIcon from "../../assets/images/Icons/dashboard.svg";
import bidsIcon from "../../assets/images/Icons/bids.svg";
import messageIcon from "../../assets/images/Icons/message.svg";
import profileIcon from "../../assets/images/Icons/profile.svg";
import settingsIcon from "../../assets/images/Icons/settings.svg";
import logo from "../../assets/images/Bidi-Logo.svg";
import ChatInterface from "../Messaging/ChatInterface.js";
import BidsPage from "../Individual/BidsPage.js";
import LoadingSpinner from "../LoadingSpinner.js";
import MobileChatList from "../Messaging/MobileChatList.js";
import MessagingView from "../Messaging/MessagingView.js";
import RequestCategories from "../Request/RequestCategories.js";
import VendorListWithFilters from "../VendorList/VendorListWithFilters.js";
import OpenRequests from "../Request/OpenRequests.js";
import BusinessBids from "../Business/BusinessBids.js";
import PortfolioPage from "../Business/Portfolio/Portfolio.js";
import BusinessSettings from "../Business/BusinessSettings.js";
import TrainingVideos from "../Business/TrainingVideos.js";
import AdminDashboard from "../admin/AdminDashboard.js";

const WeddingPlannerDashboard = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeSection, setActiveSection] = useState(() => params.activeSection || "home");
  const [profileImage, setProfileImage] = useState("/images/default.jpg");
  const [isMobile, setIsMobile] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isPinned, setIsPinned] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const sidebarRef = React.useRef(null);
  const [businessName, setBusinessName] = useState("");
  const [BidiPlus, setBidiPlus] = useState(false);
  const [bids, setBids] = useState([]);
  const [showPlannerMenu, setShowPlannerMenu] = useState(false);
  const [showVendorMenu, setShowVendorMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Sync activeSection with URL param
  useEffect(() => {
    if (params.activeSection && params.activeSection !== activeSection) {
      setActiveSection(params.activeSection);
    } else if (!params.activeSection && activeSection !== "home") {
      setActiveSection("home");
    }
    if (location.state?.selectedChat) {
      setSelectedChat(location.state.selectedChat);
    }
  }, [params.activeSection, location.state]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
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

        // Fetch both business and individual profiles
        const [businessProfile, individualProfile] = await Promise.all([
          supabase
            .from("business_profiles")
            .select("*")
            .eq("id", user.id)
            .single(),
          supabase
            .from("individual_profiles")
            .select("*")
            .eq("id", user.id)
            .single(),
        ]);

        if (businessProfile.error) throw businessProfile.error;
        if (individualProfile.error) throw individualProfile.error;

        // Check for profile photos
        const { data: photos, error: photosError } = await supabase
          .from("profile_photos")
          .select("*")
          .eq("user_id", user.id)
          .eq("photo_type", "profile")
          .limit(1);

        if (photosError) throw photosError;

        setError(null);

        // Helper function to normalize business_category
        const getCategories = (category) => Array.isArray(category) ? category : [category].filter(Boolean);

        // Set profile data
        if (businessProfile.data) {
          setBusinessName(businessProfile.data.business_name || "Business Name Not Found");
          setBidiPlus(!!businessProfile.data.Bidi_Plus);
          setIsAdmin(!!businessProfile.data.is_admin);
          setProfile({ ...businessProfile.data, business_category: getCategories(businessProfile.data.business_category) });
        }

        // Set profile picture
        if (photos && photos.length > 0) {
          setProfileImage(photos[0].photo_url);
        }

        // Fetch bids
        const { data: bidsData, error: bidsError } = await supabase
          .from("bids")
          .select("*")
          .eq("user_id", user.id);

        if (bidsError) {
          console.error("Error fetching bids:", bidsError);
        } else {
          setBids(bidsData);
        }

      } catch (error) {
        console.error("An error occurred while fetching data:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem("activeSection", activeSection);
  }, [activeSection]);

  // When section changes, update the URL if needed
  const handleSectionChange = (newSection) => {
    setActiveSection(newSection);
    if (params.activeSection !== newSection) {
      navigate(`/wedding-planner-dashboard/${newSection}`, { replace: true });
    }
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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

  const handleMessagesClick = () => {
    if (isMobile) {
      handleSectionChange("messages");
      setSelectedChat(null);
    } else {
      handleSectionChange("messages");
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  const handleBackFromChat = () => {
    setSelectedChat(null);
  };

  const handlePlannerMenuClick = () => {
    setShowPlannerMenu(!showPlannerMenu);
    setShowVendorMenu(false);
  };

  const handleVendorMenuClick = () => {
    setShowVendorMenu(!showVendorMenu);
    setShowPlannerMenu(false);
  };

  const handleMenuOptionClick = (section) => {
    handleSectionChange(section);
    setShowPlannerMenu(false);
    setShowVendorMenu(false);
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

  const handleViewPortfolio = async () => {
    try {
      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("business_name")
        .eq("id", user.id)
        .single();

      if (businessProfile) {
        const formattedName = formatBusinessName(businessProfile.business_name);
        navigate(`/portfolio/${user.id}/${formattedName}`);
      }
    } catch (error) {
      console.error("Error navigating to portfolio:", error);
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

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
            <img src={profileImage} alt="Profile" className="profile-pic" />
            {BidiPlus && <div className="verified-badge">Verified</div>}
            <h4 className="profile-name">
              <span className="business-name-under-picture">
                {formatBusinessName(businessName)}
              </span>
            </h4>
          </div>

          {/* Sidebar Links */}
          <ul className="sidebar-links">
            <li className="sidebar-section-title">Wedding Planner Tools</li>
            <li 
              onClick={() => handleSectionChange('received-bids')}
              className={activeSection === 'received-bids' ? 'active' : ''}
            >
              <img src={bidsIcon} alt="Received Bids" />
              <span>Received Bids</span>
            </li>
            <li 
              onClick={() => handleSectionChange('vendor-messages')}
              className={activeSection === 'vendor-messages' ? 'active' : ''}
            >
              <img src={messageIcon} alt="Vendor Messages" />
              <span>Message Vendors</span>
            </li>
            <li 
              onClick={() => handleSectionChange('request')}
              className={activeSection === 'request' ? 'active' : ''}
            >
              <img src={bidsIcon} alt="Request Bid" />
              <span>Request Bid</span>
            </li>
            <li 
              onClick={() => handleSectionChange('vendors')}
              className={activeSection === 'vendors' ? 'active' : ''}
            >
              <img src={profileIcon} alt="Vendors" />
              <span>Find Vendors</span>
            </li>

            <li className="sidebar-section-title">Vendor Tools</li>
            <li 
              onClick={() => handleSectionChange('home')}
              className={activeSection === 'home' ? 'active' : ''}
            >
              <img src={dashboardIcon} alt="Requests" />
              <span>Open Requests</span>
            </li>
            <li 
              onClick={() => handleSectionChange('my-bids')}
              className={activeSection === 'my-bids' ? 'active' : ''}
            >
              <img src={bidsIcon} alt="My Bids" />
              <span>My Bids</span>
            </li>
            <li 
              onClick={() => handleSectionChange('client-messages')}
              className={activeSection === 'client-messages' ? 'active' : ''}
            >
              <img src={messageIcon} alt="Client Messages" />
              <span>Message Clients</span>
            </li>
            <li 
              onClick={() => handleViewPortfolio()}
              className={activeSection === 'portfolio' ? 'active' : ''}
            >
              <img src={profileIcon} alt="Portfolio" />
              <span>My Portfolio</span>
            </li>
            <li 
              onClick={() => handleSectionChange('settings')}
              className={activeSection === 'settings' ? 'active' : ''}
            >
              <img src={settingsIcon} alt="Settings" />
              <span>Settings</span>
            </li>
            <li 
              onClick={() => handleSectionChange('training')}
              className={activeSection === 'training' ? 'active' : ''}
            >
              <i className="fas fa-play-circle" style={{ width: '24px', height: '24px', marginRight: '12px', fontSize: '20px', color: '#9633eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></i>
              <span>Training</span>
            </li>
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
              <span>Log Out</span>
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
          {activeSection === 'home' && <OpenRequests />}
          {activeSection === 'client-messages' && (
            isMobile ? (
              selectedChat ? (
                <MessagingView
                  currentUserId={user?.id}
                  businessId={selectedChat.id}
                  businessName={selectedChat.name}
                  profileImage={selectedChat.profileImage}
                  onBack={handleBackFromChat}
                  userType="business"
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
          )}
          {activeSection === 'vendor-messages' && (
            isMobile ? (
              selectedChat ? (
                <MessagingView
                  currentUserId={user?.id}
                  businessId={selectedChat.id}
                  businessName={selectedChat.name}
                  profileImage={selectedChat.profileImage}
                  onBack={handleBackFromChat}
                  userType="individual"
                />
              ) : (
                <MobileChatList 
                  currentUserId={user?.id} 
                  userType="individual"
                  onChatSelect={handleChatSelect}
                />
              )
            ) : (
              <ChatInterface 
                currentUserId={user?.id}
                userType="individual"
                initialChat={selectedChat}
              />
            )
          )}
          {activeSection === 'received-bids' && <BidsPage />}
          {activeSection === 'my-bids' && <BusinessBids />}
          {activeSection === 'request' && <RequestCategories />}
          {activeSection === 'vendors' && <VendorListWithFilters />}
          {activeSection === 'portfolio' && <PortfolioPage profileId={profile?.id} />}
          {activeSection === 'settings' && <BusinessSettings setActiveSection={setActiveSection} connectedAccountId={profile?.stripe_account_id} />}
          {activeSection === 'training' && <TrainingVideos />}
          {activeSection === 'admin' && <AdminDashboard />}
        </main>

        {/* Bottom Navigation Bar */}
        {isMobile && (
          <>
            <nav className="bottom-nav">
              <button 
                onClick={handlePlannerMenuClick}
                className={showPlannerMenu ? 'active' : ''}
              >
                <div className="nav-item">
                  <img src={profileIcon} alt="Find Vendors" />
                  <span className="nav-label">Find Vendors</span>
                </div>
              </button>
              <button 
                onClick={handleVendorMenuClick}
                className={showVendorMenu ? 'active' : ''}
              >
                <div className="nav-item">
                  <img src={dashboardIcon} alt="Get Clients" />
                  <span className="nav-label">Get Clients</span>
                </div>
              </button>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`profile-nav-button ${showProfileMenu ? 'active' : ''}`}
              >
                <div className="nav-item">
                  <img src={profileImage} alt="Profile" className="profile-nav-image" />
                  <span className="nav-label">Profile</span>
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

            {/* Find Vendors Menu */}
            {showPlannerMenu && (
              <div className="profile-menu" style={{ right: 'auto', left: '16px' }}>
                <button onClick={() => handleMenuOptionClick('received-bids')} className="profile-menu-item">
                  <i className="fas fa-file-invoice"></i>
                  <span>Received Bids</span>
                </button>
                <button onClick={() => handleMenuOptionClick('vendor-messages')} className="profile-menu-item">
                  <i className="fas fa-comments"></i>
                  <span>Message Vendors</span>
                </button>
                <button onClick={() => handleMenuOptionClick('request')} className="profile-menu-item">
                  <i className="fas fa-clipboard-list"></i>
                  <span>Request Bid</span>
                </button>
                <button onClick={() => handleMenuOptionClick('vendors')} className="profile-menu-item">
                  <i className="fas fa-search"></i>
                  <span>Find Vendors</span>
                </button>
              </div>
            )}

            {/* Get Clients Menu */}
            {showVendorMenu && (
              <div className="profile-menu" style={{ right: 'auto', left: '16px' }}>
                <button onClick={() => handleMenuOptionClick('home')} className="profile-menu-item">
                  <i className="fas fa-list"></i>
                  <span>Open Requests</span>
                </button>
                <button onClick={() => handleMenuOptionClick('my-bids')} className="profile-menu-item">
                  <i className="fas fa-file-invoice-dollar"></i>
                  <span>My Bids</span>
                </button>
                <button onClick={() => handleMenuOptionClick('client-messages')} className="profile-menu-item">
                  <i className="fas fa-comments"></i>
                  <span>Message Clients</span>
                </button>
                <button onClick={handleViewPortfolio} className="profile-menu-item">
                  <i className="fas fa-images"></i>
                  <span>My Portfolio</span>
                </button>
                <button onClick={() => handleMenuOptionClick('training')} className="profile-menu-item">
                  <i className="fas fa-play-circle"></i>
                  <span>Training</span>
                </button>
                <button onClick={() => handleMenuOptionClick('settings')} className="profile-menu-item">
                  <i className="fas fa-cog"></i>
                  <span>Settings</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WeddingPlannerDashboard; 