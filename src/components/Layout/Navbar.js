import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import logo from "../../assets/images/Bidi-Logo.svg";
import "../../App.css";
import "../../styles/Navbar.css";
import VendorSearch from "./VendorSearch";
import defaultAvatar from "../../assets/images/Icons/default-avatar.svg";

function Navbar() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const navbarRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
        fetchUserRole(session.user.id);
        fetchProfilePhoto(session.user.id);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setUser(session.user);
          fetchUserRole(session.user.id);
          fetchProfilePhoto(session.user.id);
        } else {
          setUser(null);
          setUserRole(null);
          setProfilePhoto(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfilePhoto = async (userId) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found - this is expected for users who signed in but haven't completed profile setup
          console.log("User has no profile yet - skipping profile photo fetch");
          return;
        }
        throw profileError;
      }

      if (profileData.role === 'business') {
        const { data: photoData, error: photoError } = await supabase
          .from('profile_photos')
          .select('photo_url')
          .eq('user_id', userId)
          .eq('photo_type', 'profile')
          .single();

        if (photoError) throw photoError;
        if (photoData) {
          setProfilePhoto(photoData.photo_url);
        }
      }
    } catch (error) {
      console.error('Error fetching profile photo:', error);
      setProfilePhoto(null);
    }
  };

  const fetchUserRole = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found - this is expected for users who signed in but haven't completed profile setup
        console.log("User has no profile yet - profile setup will be handled by MissingProfileModal");
        setUserRole(null);
      } else {
        console.error("Error fetching user role:", error.message);
      }
    } else {
      setUserRole(data.role);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    } else {
      navigate("/");
    }
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const toggleMenu = (e) => {
    e.preventDefault();
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navbarRef]);

  // Check if we're in a dashboard route or portfolio route with signed in user
  const isDashboardRoute = location.pathname.includes('-dashboard');
  const isPortfolioRoute = location.pathname.includes('/portfolio/');
  const isPartnershipRoute = location.pathname.includes('/partnership/');
  const isWeddingPlannerDashboardRoute = location.pathname.includes('/wedding-planner/') && !location.pathname.includes('/wedding-planner-homepage');
  const shouldHideNavbar = isDashboardRoute || (isPortfolioRoute && user) || isPartnershipRoute || isWeddingPlannerDashboardRoute;

  // Debug logging
  console.log('Navbar Debug:', {
    pathname: location.pathname,
    isDashboardRoute,
    isPortfolioRoute,
    isPartnershipRoute,
    isWeddingPlannerDashboardRoute,
    shouldHideNavbar,
    user
  });

  // If we're in a dashboard route or portfolio route with signed in user, don't render the navbar
  if (shouldHideNavbar) {
    console.log('Navbar hidden due to route conditions');
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg" id="mainNav" ref={navbarRef}>
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <img src={logo} alt="Bidi Logo" className="bidi-img-logo mobile-logo" />
        </Link>

        {/* Desktop CTAs - Always visible */}
        <div className="navbar-ctas d-none d-lg-flex">
          {(!userRole || userRole === "individual" || userRole === "both") && (
            <Link 
              className="nav-cta-link" 
              to="/request-categories"
            >
              <button className="bids-button">
                <i className="bi bi-clipboard-check me-1"></i> Get Bids from Pros
              </button>
            </Link>
          )}
          
          <Link className="nav-cta-link" to="/vendors">
            <button className="search-button">
              <i className="bi bi-search me-1"></i> Browse Vendors
            </button>
          </Link>
        </div>

        {/* Desktop Auth Buttons - Positioned left of menu */}
        <div className="navbar-auth d-none d-lg-flex tw-gap-2" style={{ marginRight: '16px' }}>
          {!user ? (
            <>
              <Link className="nav-cta-link" to="/signin">
                <button className="btn btn-outline-primary">
                  Log In
                </button>
              </Link>
              <Link className="nav-cta-link" to="/createaccount">
                <button className="btn btn-primary">
                  Sign Up
                </button>
              </Link>
            </>
          ) : (
            <button
              className="btn btn-outline-secondary"
              onClick={handleSignOut}
            >
              Log Out
            </button>
          )}
        </div>

        <button
          className={`navbar-toggler ${user ? 'profile-toggler' : ''}`}
          type="button"
          onClick={toggleMenu}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          {user ? (
            <img 
              src={profilePhoto || defaultAvatar} 
              alt="Profile" 
              className="profile-toggle-img"
            />
          ) : (
            <i className="bi-list"></i>
          )}
        </button>

        {/* Beautiful Popout Menu */}
        {menuOpen && (
          <div className="menu-overlay" onClick={closeMenu}>
            <div className="menu-popout" onClick={(e) => e.stopPropagation()}>
              <div className="menu-header">
                <h3>Menu</h3>
                <button className="menu-close" onClick={closeMenu}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              
              <div className="menu-content">
                {/* Mobile CTAs */}
                <div className="menu-section d-lg-none">
                  <div className="menu-ctas">
                    {(!userRole || userRole === "individual" || userRole === "both") && (
                      <Link 
                        className="menu-cta-item" 
                        to="/request-categories"
                        onClick={closeMenu}
                      >
                        <button className="bids-button w-100">
                          <i className="bi bi-clipboard-check me-2"></i> Get Bids from Pros
                        </button>
                      </Link>
                    )}
                    
                    <Link className="menu-cta-item" to="/vendors" onClick={closeMenu}>
                      <button className="search-button w-100">
                        <i className="bi bi-search me-2"></i> Browse Vendors
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Main Navigation */}
                <div className="menu-section">

                  {/* Dashboard Links */}
                  {userRole === "individual" && (
                    <Link 
                      className="menu-item" 
                      to="/individual-dashboard"
                      onClick={closeMenu}
                    >
                      <i className="bi bi-person me-3"></i>
                      <span>My Dashboard</span>
                    </Link>
                  )}

                  {userRole === "business" && (
                    <Link 
                      className="menu-item" 
                      to="/business-dashboard"
                      onClick={closeMenu}
                    >
                      <i className="bi bi-briefcase me-3"></i>
                      <span>Business Dashboard</span>
                    </Link>
                  )}

                  {userRole === "both" && (
                    <Link 
                      className="menu-item" 
                      to="/wedding-planner-dashboard"
                      onClick={closeMenu}
                    >
                      <i className="bi bi-calendar-event me-3"></i>
                      <span>Wedding Dashboard</span>
                    </Link>
                  )}

                  {(!user || (userRole !== "business" && userRole !== "individual")) && (
                    <Link 
                      className="menu-item" 
                      to="/for-vendors"
                      onClick={closeMenu}
                    >
                      <i className="bi bi-shop me-3"></i>
                      <span>For Vendors</span>
                    </Link>
                  )}

                  {(!user || (userRole !== "business" && userRole !== "individual")) && (
                    <Link 
                      className="menu-item" 
                      to="/corporate-homepage"
                      onClick={closeMenu}
                    >
                      <i className="bi bi-briefcase me-3"></i>
                      <span>Corporate Events</span>
                    </Link>
                  )}

                  <Link 
                    className="menu-item" 
                    to="/articles"
                    onClick={closeMenu}
                  >
                    <i className="bi bi-book me-3"></i>
                    <span>Articles</span>
                  </Link>

                  <Link 
                    className="menu-item" 
                    to="/about"
                    onClick={closeMenu}
                  >
                    <i className="bi bi-info-circle me-3"></i>
                    <span>About & Contact</span>
                  </Link>
                </div>

                {/* Auth Section */}
                <div className="menu-section menu-auth">
                  {!user ? (
                    <>
                      <Link
                        className="menu-auth-btn primary"
                        to="/signin"
                        onClick={closeMenu}
                      >
                        Log In
                      </Link>
                      <Link
                        className="menu-auth-btn secondary"
                        to="/createaccount"
                        onClick={closeMenu}
                      >
                        Sign Up
                      </Link>
                    </>
                  ) : (
                    <button
                      className="menu-auth-btn primary"
                      onClick={() => {
                        handleSignOut();
                        closeMenu();
                      }}
                    >
                      Log Out
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
