import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import logo from "../../assets/images/Bidi-Logo.svg";
import "../../App.css";
import "../../styles/Navbar.css";
import VendorSearch from "./VendorSearch";

function Navbar() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const navbarRef = useRef(null); // Create a ref for the navbar

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
        fetchUserRole(session.user.id);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setUser(session.user);
          fetchUserRole(session.user.id);
        } else {
          setUser(null);
          setUserRole(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
      navigate("/"); // Redirect to the home page after signing out
    }
  };

  // Function to close the navbar menu
  const closeMenu = () => {
    const navbarCollapse = document.getElementById("navbarResponsive");
    if (navbarCollapse) {
      navbarCollapse.classList.remove("show");
    }
  };

  // Event listener for clicks outside the navbar
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

  return (
    <nav className="navbar navbar-expand-lg" id="mainNav" ref={navbarRef}>
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <img src={logo} alt="Bidi Logo" className="bidi-img-logo" />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarResponsive"
          aria-controls="navbarResponsive"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <i className="bi-list"></i>
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
            
            {(userRole === "individual" || userRole === "both") && (
              <li className="nav-item">
                <Link className="nav-link me-lg-3" to="/bids">
                  Your Bids
                </Link>
              </li>
            )}

            {(userRole === "business" || userRole === "both") && (
              <li className="nav-item">
                <Link className="nav-link me-lg-3" to="/dashboard">
                  Business Dashboard
                </Link>
              </li>
            )}

            <li className="nav-item">
              <Link className="nav-link me-lg-3" to="/articles">
                Wedding Guides
              </Link>
            </li>

            {(!user || (userRole !== "business" && userRole !== "individual")) && (
              <li className="nav-item">
                <Link className="nav-link me-lg-3" to="/for-vendors">
                  For Vendors
                </Link>
              </li>
            )}

            <li className="nav-item">
              <Link className="nav-link me-lg-3" to="/about">
                About & Contact
              </Link>
            </li>
          </ul>

          {user ? (
            <button className="btn-nav-primary" onClick={handleSignOut}>
              <span className="btn-text">
                <span className="small">Log Out</span>
              </span>
            </button>
          ) : (
            <Link
              style={{ textDecoration: "none" }}
              className="btn-nav-primary"
              to="/signin"
            >
              <span className="btn-text">
                <span className="small">Log In</span>
              </span>
            </Link>
          )}

          {!user && (
            <Link
              className="btn-nav-secondary"
              style={{ textDecoration: "none" }}
              to="/createaccount"
            >
              <span className="btn-text-secondary">
                <span className="small">Sign Up</span>
              </span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
