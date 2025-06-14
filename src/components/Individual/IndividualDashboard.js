import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import "../../App.css";
import "../../styles/IndividualDashboard.css";
import "../../styles/Sidebar.css";
import verifiedCheckIcon from "../../assets/images/Icons/verified-check.svg";
import bidsIcon from "../../assets/images/Icons/bids.svg";
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
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isPinned, setIsPinned] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const sidebarRef = React.useRef(null);
  const location = useLocation();
  const [showShareSection, setShowShareSection] = useState(() => {
    const savedState = localStorage.getItem('bidiShareNotificationDismissed');
    return savedState !== 'true';
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

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

        if (profileError) throw profileError;

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
    setActiveSection("messages");
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

    window.addEventListener('popstate', handleBackButton);
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [activeSection]);

  // Add authentication state listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
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
            console.error('Error fetching profile:', profileError);
            setError('Error loading profile data');
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
        setUser(null);
        setProfile(null);
        navigate('/');
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
              <span>Messages</span>
            </li>
            <li 
              onClick={() => setActiveSection("request")}
              className={activeSection === "request" ? "active" : ""}
            >
              <img src={bidsIcon} alt="Request Bid" />
              <span>Request Bid</span>
            </li>
            <li 
              onClick={() => setActiveSection("vendors")}
              className={activeSection === "vendors" ? "active" : ""}
            >
              <img src={profileIcon} alt="Vendors" />
              <span>Find Vendors</span>
            </li>
            <li 
              onClick={() => setActiveSection("profile")}
              className={activeSection === "profile" ? "active" : ""}
            >
              <img src={settingsIcon} alt="Profile" />
              <span>Profile</span>
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
          {activeSection === "bids" ? (
            <BidsPage onOpenChat={handleOpenChat} />
          ) : activeSection === "messages" ? (
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
          ) : activeSection === "request" ? (
            location.state?.showRequestFlow ? (
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
            )
          ) : activeSection === "vendors" ? (
            <VendorListWithFilters />
          ) : activeSection === "profile" ? (
            <div className="profile-content">
              <h2>My Profile</h2>
              {showShareSection && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  color: '#FF008A',
                  fontWeight: 'bold',
                  marginBottom: '20px',
                  fontSize: '14px',
                  position: 'relative',
                  border: '1px solid #FF008A',
                  boxShadow: '0 2px 8px rgba(255,0,138,0.1)'
                }}>
                  <button 
                    onClick={handleDismissShareNotification}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '16px',
                      zIndex: 1
                    }}
                  >
                    ×
                  </button>
                  <h3 style={{ marginBottom: '15px', color: '#333' }}>
                    Share Bidi & Earn
                  </h3>
                  <p style={{ marginBottom: '20px', color: '#666' }}>
                    Share Bidi with your friends! They get $50 off their vendor, and you get $50 when they book!
                  </p>
                  <div style={{display: 'flex', justifyContent: 'center'}}>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        // Add your share functionality here
                        console.log('Share clicked');
                      }}
                      style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        background: '#9633eb',
                        color:'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '40px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fas fa-share-alt" style={{ marginRight: '8px' }}></i>
                      Get Your Referral Code
                    </button>
                  </div>
                </div>
              )}
              <div className="profile-form">
                {editMode ? (
                  <form onSubmit={handleProfileUpdate}>
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">Save Changes</button>
                      <button type="button" className="btn-secondary" onClick={() => setEditMode(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-info">
                    <div className="info-group">
                      <label>First Name</label>
                      <p>{profile?.first_name || "Not set"}</p>
                    </div>
                    <div className="info-group">
                      <label>Last Name</label>
                      <p>{profile?.last_name || "Not set"}</p>
                    </div>
                    <div className="info-group">
                      <label>Phone Number</label>
                      <p>{profile?.phone || "Not set"}</p>
                    </div>
                    <button className="btn-primary" onClick={() => setEditMode(true)}>
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>An error occurred</div>
          )}
        </main>

        {/* Bottom Navigation Bar */}
        {isMobile && (
          <nav className="bottom-nav">
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
              onClick={() => setActiveSection("request")}
              className={activeSection === "request" ? "active" : ""}
            >
              <div className="nav-item">
                <img src={bidsIcon} alt="Request" />
                <span className="nav-label">Request</span>
              </div>
            </button>
            <button 
              onClick={() => setActiveSection("vendors")}
              className={activeSection === "vendors" ? "active" : ""}
            >
              <div className="nav-item">
                <img src={profileIcon} alt="Vendors" />
                <span className="nav-label">Vendors</span>
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
        )}

        {/* Profile Menu */}
        {isMobile && showProfileMenu && (
          <div className="profile-menu" ref={profileMenuRef}>
            <button 
              onClick={() => {
                setActiveSection("profile");
                setShowProfileMenu(false);
              }}
              className="profile-menu-item"
            >
              <i className="fas fa-user"></i>
              <span>My Profile</span>
            </button>
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
      </div>
    </div>
  );
};

// Ensure proper export
export default React.memo(IndividualDashboard); 