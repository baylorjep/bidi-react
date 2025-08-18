import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "../../App.css";
import "../../styles/IndividualDashboard.css";
import "../../styles/Sidebar.css";
import "./WeddingPlannerModal.css";
import verifiedCheckIcon from "../../assets/images/Icons/verified-check.svg";
import HomeIcon from "../../assets/images/Icons/dashboard.svg";
import BidsIcon from "../../assets/images/Icons/bids.svg";
import messageIcon from "../../assets/images/Icons/message.svg";
import profileIcon from "../../assets/images/Icons/profile.svg";
import settingsIcon from "../../assets/images/Icons/settings.svg";
import logo from "../../assets/images/Bidi-Logo.svg";
import ChatInterface from "../Messaging/ChatInterface.js";
import BidsPage from "./BidsPage.js";
import LoadingSpinner from "../LoadingSpinner.js";
import MobileChatList from "../Messaging/MobileChatList.js";
import MessagingView from "../Messaging/MessagingView.js";
import RequestCategories from "../Request/RequestCategories.js";
import VendorListWithFilters from "../VendorListWithFilters/VendorListWithFilters.js";
import MasterRequestFlow from "../Request/MasterRequestFlow.js";
import Settings from "../Settings/Settings.js";


const IndividualDashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeSection, setActiveSection] = useState(() => {
    // Check if we're coming from a sign-in
    const fromSignIn = sessionStorage.getItem('fromSignIn');
    if (fromSignIn) {
      sessionStorage.removeItem('fromSignIn');
      return 'bids';
    }
    // Otherwise use the stored section or default to bids
    return localStorage.getItem("activeSection") || "bids";
  });
  const [profileImage, setProfileImage] = useState("/images/default.jpg");
  const [isMobile, setIsMobile] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [selectedChat, setSelectedChat] = useState(null);
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isPinned, setIsPinned] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const sidebarRef = React.useRef(null);
  const [showShareSection, setShowShareSection] = useState(() => {
    const savedState = localStorage.getItem('bidiShareNotificationDismissed');
    return savedState !== 'true';
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const [showWeddingPlannerModal, setShowWeddingPlannerModal] = useState(false);

  // Initialize activeSection from URL parameter
  useEffect(() => {
    if (params.activeSection) {
      setActiveSection(params.activeSection);
    } else {
      // If no section specified in URL, default to bids
      setActiveSection("bids");
    }
  }, [params.activeSection]);

  // Function to update section and URL
  const handleSectionChange = (newSection) => {
    setActiveSection(newSection);
    // Update URL to reflect the active section
    navigate(`/individual-dashboard/${newSection}`, { replace: true });
  };

  useEffect(() => {
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
      localStorage.setItem("activeSection", location.state.activeSection);
    } else if (location.pathname === '/bids') {
      setActiveSection('bids');
      localStorage.setItem("activeSection", 'bids');
    }
    if (location.state?.selectedChat) {
      setSelectedChat(location.state.selectedChat);
    }
  }, [location.state, location.pathname]);

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

        const { data: profile, error: profileError } = await supabase
          .from("individual_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // No profile found - this is expected for users who signed in but haven't completed profile setup
            console.log("User has no individual profile yet - profile setup will be handled by MissingProfileModal");
            setError("Profile not found. Please complete your profile setup.");
            return;
          }
          throw profileError;
        }

        // Check for profile photos
        const { data: photos, error: photosError } = await supabase
          .from("profile_photos")
          .select("*")
          .eq("user_id", user.id)
          .eq("photo_type", "profile")
          .limit(1);

        if (photosError) throw photosError;

        setError(null);

        // Set individual profile data
        if (profile) {
          setProfile(profile);
          setFormData({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            phone: profile.phone || "",
          });
          setIsVerified(!!profile.is_verified);

        }

        // Set profile picture
        if (photos && photos.length > 0) {
          setProfileImage(photos[0].photo_url);
        } else {
          console.error("No profile picture found.");
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

  const handleMessagesClick = () => {
    handleSectionChange("messages");
    setSelectedChat(null);
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  const handleBackFromChat = () => {
    setSelectedChat(null);
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

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `profile_photos/${fileName}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile_photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_photos')
        .getPublicUrl(filePath);

      // Update the profile photo in the database
      const { error: photoError } = await supabase
        .from('profile_photos')
        .upsert({
          user_id: user.id,
          photo_url: publicUrl,
          photo_type: 'profile'
        });

      if (photoError) throw photoError;

      setProfileImage(publicUrl);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError('Failed to upload profile picture');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('individual_profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({
        ...prev,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone
      }));
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const formatName = (firstName, lastName) => {
    if (!firstName && !lastName) return "Your Name";
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    const maxLength = 20;

    if (fullName.length > maxLength) {
      const words = fullName.split(" ");
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
              {index === formattedName.length - 1 && isVerified && (
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
        {fullName}{" "}
        {isVerified && (
          <img
            src={verifiedCheckIcon}
            alt="Verified Check"
            className="verified-icon"
          />
        )}
      </span>
    );
  };

  const handleOpenChat = (chat) => {
    if (chat.business_name) {
      const formattedName = formatName(chat.business_name);
      navigate(`/portfolio/${chat.id}/${formattedName}`, {
        state: {
          fromBid: true,
          bidData: chat.bidData,
          bidId: chat.bidId
        }
      });
    }
  };

  useEffect(() => {
    if (isMobile) return;
    setIsSidebarVisible(isPinned);
  }, [isPinned, isMobile]);

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

  const handleDismissShareNotification = () => {
    setShowShareSection(false);
    localStorage.setItem('bidiShareNotificationDismissed', 'true');
  };

  const handleWeddingPlannerChoice = async (choice) => {
    try {
      // Save user's preference
      const { error } = await supabase
        .from('individual_profiles')
        .update({
          has_seen_wedding_planner_intro: true,
          preferred_dashboard: choice
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving preference:', error);
      }

      setShowWeddingPlannerModal(false);

      // Navigate to chosen dashboard
      if (choice === 'wedding-planner') {
        navigate('/wedding-planner');
      }
    } catch (error) {
      console.error('Error handling wedding planner choice:', error);
    }
  };

  // Add dedicated logout handler
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error.message);
        setError('Failed to sign out');
      } else {
        console.log('Sign out successful, auth state listener will handle navigation');
      }
      // Don't navigate here - let the auth state listener handle it
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    } finally {
      setIsLoading(false);
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
      if (activeSection !== "profile") {
        event.preventDefault();
        setActiveSection("profile");
      }
    };

    const handleNavigateToVendors = () => {
      handleSectionChange("vendors");
    };

    window.addEventListener('popstate', handleBackButton);
    window.addEventListener('navigateToVendors', handleNavigateToVendors);
    
    return () => {
      window.removeEventListener('popstate', handleBackButton);
      window.removeEventListener('navigateToVendors', handleNavigateToVendors);
    };
  }, [activeSection]);

  // Add authentication state listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Set flag for sign-in
          sessionStorage.setItem('fromSignIn', 'true');
          // Set active section to bids
          setActiveSection('bids');
          localStorage.setItem('activeSection', 'bids');
          
          // Fetch user profile data
          const { data: profileData, error: profileError } = await supabase
            .from('individual_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            if (profileError.code === 'PGRST116') {
              // No profile found - this is expected for users who signed in but haven't completed profile setup
              console.log("User has no individual profile yet - profile setup will be handled by MissingProfileModal");
              setError("Profile not found. Please complete your profile setup.");
            } else {
              console.error('Error fetching profile:', profileError);
              setError('Error loading profile data');
            }
          } else {
            setProfile(profileData);
            setFormData({
              first_name: profileData.first_name || '',
              last_name: profileData.last_name || '',
              phone: profileData.phone || '',
            });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing state and navigating...');
        // Clear all state
        setUser(null);
        setProfile(null);
        setSelectedChat(null);
        setActiveSection('bids');
        setError(null);
        
        // Clear localStorage and sessionStorage
        localStorage.removeItem('activeSection');
        sessionStorage.removeItem('fromSignIn');
        
        // Force a full page reload to ensure clean logout
        window.location.href = '/';
      }
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  // Add error boundary
  if (!React.isValidElement(<div>test</div>)) {
    console.error('Invalid JSX detected');
    return <div>Error: Invalid component structure</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="individual-dashboard text-left">
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
            {isVerified && <div className="verified-badge">Verified</div>}
            <h4 className="profile-name">
              <span className="name-under-picture">
                {formatName(profile?.first_name, profile?.last_name)}
              </span>
            </h4>
          </div>

          {/* Sidebar Links */}
          <ul className="sidebar-links">
            <li 
              onClick={() => handleSectionChange("bids")}
              className={activeSection === "bids" ? "active" : ""}
            >
              <img src={HomeIcon} alt="Bids" />
              <span className="sidebar-link-text">Bids</span>
            </li>
            <li 
              onClick={handleMessagesClick}
              className={activeSection === "messages" ? "active" : ""}
            >
              <img src={messageIcon} alt="Message" />
              <span className="sidebar-link-text">Messages</span>
            </li>
            <li 
              onClick={() => handleSectionChange("request")}
              className={activeSection === "request" ? "active" : ""}
            >
              <img src={BidsIcon} alt="Request Bid" />
              <span className="sidebar-link-text">Request Bid</span>
            </li>
            <li 
              onClick={() => handleSectionChange("vendors")}
              className={activeSection === "vendors" ? "active" : ""}
            >
              <img src={profileIcon} alt="Vendors" />
              <span className="sidebar-link-text">Find Vendors</span>
            </li>
            <li 
              onClick={() => handleSectionChange("profile")}
              className={activeSection === "profile" ? "active" : ""}
            >
              <img src={settingsIcon} alt="Profile" />
              <span className="sidebar-link-text">Profile</span>
            </li>
          </ul>

          {/* Logout Button */}
          <div className="sidebar-footer">
            <button 
              onClick={handleLogout}
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
          {(() => {
            console.log('Current activeSection:', activeSection);
            switch(activeSection) {
              case "bids":
                return <BidsPage onOpenChat={handleOpenChat} />;
              case "messages":
                return isMobile ? (
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
                );
              case "request":
                return location.state?.showRequestFlow ? (
                  <MasterRequestFlow 
                    selectedCategories={location.state.selectedCategories}
                    onComplete={() => {
                      navigate("/individual-dashboard", { 
                        state: { 
                          activeSection: "request",
                          showRequestFlow: false
                        }
                      });
                    }}
                  />
                ) : (
                  <RequestCategories />
                );
              case "vendors":
                return <VendorListWithFilters showAds={false} />;
              case "profile":
                return <Settings currentDashboard="individual" />;
              default:
                console.error('Invalid activeSection:', activeSection);
                return <BidsPage onOpenChat={handleOpenChat} />;
            }
          })()}}
        </main>

        {/* Bottom Navigation Bar */}
        {isMobile && (
          <nav className="bottom-nav">
            <button 
              onClick={() => handleSectionChange("bids")}
              className={activeSection === "bids" ? "active" : ""}
            >
              <div className="nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={HomeIcon} alt="Bids" />
                    <span className="sidebar-link-text">Bids</span>
              </div>
            </button>
            <button 
              onClick={handleMessagesClick}
              className={activeSection === "messages" ? "active" : ""}
            >
              <div className="nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={messageIcon} alt="Message" />
                <span className="sidebar-link-text">Messages</span>
              </div>
            </button>
            <button 
              onClick={() => handleSectionChange("request")}
              className={activeSection === "request" ? "active" : ""}
            >
              <div className="nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={BidsIcon} alt="Request" />
                <span className="sidebar-link-text">Request</span>
              </div>
            </button>
            <button 
              onClick={() => handleSectionChange("vendors")}
              className={activeSection === "vendors" ? "active" : ""}
            >
              <div className="nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={profileIcon} alt="Vendors" />
                <span className="sidebar-link-text">Vendors</span>
              </div>
            </button>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`mobile-settings-button ${showProfileMenu ? 'active' : ''}`}
            >
              <div className="nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={profileImage} alt="Profile" className="profile-nav-image-settings" />
                <span className="sidebar-link-text" >Profile</span>
              </div>
            </button>
          </nav>
        )}

        {/* Profile Menu */}
        {isMobile && showProfileMenu && (
          <div className="profile-menu" ref={profileMenuRef}>
            <button 
              onClick={() => {
                handleSectionChange("profile");
                setShowProfileMenu(false);
              }}
              className="profile-menu-item"
            >
              <i className="fas fa-user"></i>
              <span>My Profile</span>
            </button>
            <button 
              onClick={handleLogout}
              className="profile-menu-item"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* Wedding Planner Intro Modal */}
        {showWeddingPlannerModal && (
          <div className="wedding-planner-modal-overlay">
            <div className="wedding-planner-modal">
              <div className="wp-modal-header">
                <div className="wp-new-badge">NEW</div>
                <button 
                  className="wp-close-btn" 
                  onClick={() => handleWeddingPlannerChoice('individual')}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="wp-modal-content">
                <div className="wp-welcome-icon">
                  <i className="fas fa-heart"></i>
                </div>
                
                <h2>Welcome to Bidi's New Wedding Planner! 🎉</h2>
                <p className="wp-intro-text">
                  We've created a comprehensive wedding planning dashboard that includes everything from the individual dashboard, plus powerful new features to help you plan your entire wedding from start to finish.
                </p>

                <div className="wp-feature-highlights">
                  <div className="wp-feature-item">
                    <i className="fas fa-search"></i>
                    <span>All individual dashboard features</span>
                  </div>
                  <div className="wp-feature-item">
                    <i className="fas fa-calendar-alt"></i>
                    <span>Complete wedding timeline</span>
                  </div>
                  <div className="wp-feature-item">
                    <i className="fas fa-dollar-sign"></i>
                    <span>Budget tracking & management</span>
                  </div>
                  <div className="wp-feature-item">
                    <i className="fas fa-user-friends"></i>
                    <span>Guest list & RSVP management</span>
                  </div>
                  <div className="wp-feature-item">
                    <i className="fas fa-users"></i>
                    <span>Vendor coordination</span>
                  </div>
                  <div className="wp-feature-item">
                    <i className="fas fa-tasks"></i>
                    <span>Wedding checklist & tasks</span>
                  </div>
                </div>

                <div className="wp-choice-section">
                  <p className="wp-choice-question">Which dashboard would you like to use?</p>
                  
                  <div className="wp-choice-buttons">
                    <button 
                      className="wp-choice-btn wp-continue-current"
                      onClick={() => handleWeddingPlannerChoice('individual')}
                    >
                      <div className="wp-choice-header">
                        <i className="fas fa-search"></i>
                        <span>Continue with Individual Dashboard</span>
                      </div>
                      <p>Keep using the individual dashboard for specific vendor requests and bids</p>
                    </button>
                    
                    <button 
                      className="wp-choice-btn wp-try-new"
                      onClick={() => handleWeddingPlannerChoice('wedding-planner')}
                    >
                      <div className="wp-choice-header">
                        <i className="fas fa-heart"></i>
                        <span>Upgrade to Wedding Planner</span>
                      </div>
                      <p>Get everything from the individual dashboard plus comprehensive wedding planning tools</p>
                    </button>
                  </div>

                  <p className="wp-note">
                    You can always change your preference later in your dashboard settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Ensure proper export
export default React.memo(IndividualDashboard); 