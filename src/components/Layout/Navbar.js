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
  const [weddingPlannerDropdownOpen, setWeddingPlannerDropdownOpen] = useState(false);
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

      if (profileError) throw profileError;

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
      console.error("Error fetching user role:", error.message);
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
    const navbarCollapse = document.getElementById("navbarResponsive");
    if (navbarCollapse) {
      navbarCollapse.classList.remove("show");
    }
    setWeddingPlannerDropdownOpen(false);
  };

  const toggleWeddingPlannerDropdown = (e) => {
    e.preventDefault();
    setWeddingPlannerDropdownOpen(!weddingPlannerDropdownOpen);
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

        {/* Mobile Auth Buttons - Only visible on mobile */}
        {!user && (
          <div className="d-lg-none mobile-auth-buttons">
            <Link
              style={{ textDecoration: "none" }}
              className="btn-nav-primary"
              to="/signin"
            >
              <span className="btn-text">
                <span className="small">Log In</span>
              </span>
            </Link>
            <Link
              className="btn-nav-secondary"
              style={{ textDecoration: "none" }}
              to="/createaccount"
            >
              <span className="btn-text-secondary">
                <span className="small">Sign Up</span>
              </span>
            </Link>
          </div>
        )}

        <button
          className={`navbar-toggler ${user ? 'profile-toggler' : ''}`}
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarResponsive"
          aria-controls="navbarResponsive"
          aria-expanded="false"
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

        <div className="collapse navbar-collapse" id="navbarResponsive">
          <ul className="navbar-nav ms-auto me-4 my-3 my-lg-0">
            {(!userRole ||
              userRole === "individual" ||
              userRole === "both") && (
              <li className="nav-item d-flex align-items-center mb-2 mb-lg-0 me-lg-3">
                <Link 
                  className="nav-link p-0 w-100" 
                  to="/request-categories"
                  onClick={closeMenu}
                >
                  <button className="bids-button w-100">
                    <i className="bi bi-clipboard-check me-1"></i> Get Bids from Pros
                  </button>
                </Link>
              </li>
            )}
            
            <li className="nav-item d-flex align-items-center mb-2 mb-lg-0">
              <VendorSearch />
            </li>

            {/* Wedding Planner Homepage Link with New Tag */}
            <li className="nav-item me-lg-3">
              <Link 
                className="nav-link position-relative" 
                to="/wedding-planner-homepage"
                onClick={closeMenu}
              >
                Wedding Planner
                <span className="new-tag">New</span>
              </Link>
            </li>

            {/* Main Dropdown */}
            <li className="nav-item dropdown me-lg-3">
              <button
                className={`nav-link custom-dropdown-toggle ${weddingPlannerDropdownOpen ? 'active' : ''}`}
                onClick={toggleWeddingPlannerDropdown}
                style={{ background: 'none', border: 'none', color: 'inherit' }}
              >
                More
                <i className="bi bi-chevron-down ms-1"></i>
              </button>
              {weddingPlannerDropdownOpen && (
                <div className="dropdown-menu show">
                  {userRole === "individual" && (
                    <Link 
                      className="dropdown-item" 
                      to="/individual-dashboard"
                      onClick={closeMenu}
                    >
                      My Dashboard
                    </Link>
                  )}

                  {userRole === "business" && (
                    <Link 
                      className="dropdown-item" 
                      to="/business-dashboard"
                      onClick={closeMenu}
                    >
                      Business Dashboard
                    </Link>
                  )}

                  {userRole === "both" && (
                    <Link 
                      className="dropdown-item" 
                      to="/wedding-planner-dashboard"
                      onClick={closeMenu}
                    >
                      Wedding Dashboard
                    </Link>
                  )}

                  {user && (userRole === "individual" || userRole === "both") && (
                    <Link 
                      className="dropdown-item" 
                      to="/wedding-planner/overview"
                      onClick={closeMenu}
                    >
                      Wedding Planning Tool
                    </Link>
                  )}
                  {(!user || (userRole !== "business" && userRole !== "individual")) && (
                    <Link 
                      className="dropdown-item" 
                      to="/for-vendors"
                      onClick={closeMenu}
                    >
                      For Vendors
                    </Link>
                  )}

                  {(!user || (userRole !== "business" && userRole !== "individual")) && (
                    <Link 
                      className="dropdown-item" 
                      to="/corporate-homepage"
                      onClick={closeMenu}
                    >
                      Corporate Events
                    </Link>
                  )}

                  <Link 
                    className="dropdown-item" 
                    to="/articles"
                    onClick={closeMenu}
                  >
                    Wedding Guides
                  </Link>



                  <Link 
                    className="dropdown-item" 
                    to="/about"
                    onClick={closeMenu}
                  >
                    About & Contact
                  </Link>
                </div>
              )}
            </li>

            {user && (
              <li className="nav-item d-lg-none">
                <button 
                  className="btn-nav-primary w-100" 
                  onClick={() => {
                    handleSignOut();
                    closeMenu();
                  }}
                >
                  <span className="btn-text">
                    <span className="small">Log Out</span>
                  </span>
                </button>
              </li>
            )}
          </ul>

          {/* Desktop Auth Buttons - Only visible on desktop */}
          <div className="d-none d-lg-flex auth-buttons">
            {user ? (
              <button className="btn-nav-primary" onClick={handleSignOut}>
                <span className="btn-text">
                  <span className="small">Log Out</span>
                </span>
              </button>
            ) : (
              <>
                <Link
                  style={{ textDecoration: "none" }}
                  className="btn-nav-primary"
                  to="/signin"
                >
                  <span className="btn-text">
                    <span className="small">Log In</span>
                  </span>
                </Link>
                <Link
                  className="btn-nav-secondary"
                  style={{ textDecoration: "none" }}
                  to="/createaccount"
                >
                  <span className="btn-text-secondary">
                    <span className="small">Sign Up</span>
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
