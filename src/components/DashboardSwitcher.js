import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import './DashboardSwitcher.css';

const DashboardSwitcher = ({ currentDashboard, onSwitch }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUserPreferences();
  }, []);

  const checkUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Check if user has seen the wedding planner intro
        const { data: profile } = await supabase
          .from('individual_profiles')
          .select('has_seen_wedding_planner_intro, preferred_dashboard')
          .eq('id', user.id)
          .single();

        if (profile) {
          setHasSeenIntro(!!profile.has_seen_wedding_planner_intro);
          
          // If user hasn't seen intro and is on individual dashboard, show modal
          if (!profile.has_seen_wedding_planner_intro && currentDashboard === 'individual') {
            setShowFirstTimeModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking user preferences:', error);
    }
  };

  const handleSwitch = (dashboard) => {
    setShowDropdown(false);
    if (onSwitch) {
      onSwitch(dashboard);
    } else {
      if (dashboard === 'individual') {
        navigate('/individual-dashboard');
      } else if (dashboard === 'wedding-planner') {
        navigate('/wedding-planner');
      }
    }
  };

  const handleFirstTimeChoice = async (choice) => {
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

      setShowFirstTimeModal(false);
      setHasSeenIntro(true);

      // Navigate to chosen dashboard
      if (choice === 'individual') {
        // Stay on current dashboard
        setShowDropdown(false);
      } else if (choice === 'wedding-planner') {
        navigate('/wedding-planner');
      }
    } catch (error) {
      console.error('Error handling first time choice:', error);
    }
  };

  const getCurrentDashboardName = () => {
    switch (currentDashboard) {
      case 'individual':
        return 'Individual Dashboard';
      case 'wedding-planner':
        return 'Wedding Planner';
      default:
        return 'Dashboard';
    }
  };

  const getCurrentDashboardIcon = () => {
    switch (currentDashboard) {
      case 'individual':
        return 'fas fa-search';
      case 'wedding-planner':
        return 'fas fa-heart';
      default:
        return 'fas fa-tachometer-alt';
    }
  };

  // First Time Modal Component
  const FirstTimeModal = () => {
    if (!showFirstTimeModal) return null;

    return createPortal(
      <div className="first-time-modal-overlay">
        <div className="first-time-modal">
          <div className="modal-header">
            <div className="new-badge">NEW</div>
            <button className="close-btn" onClick={() => setShowFirstTimeModal(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="modal-content">
            <div className="welcome-icon">
              <i className="fas fa-heart"></i>
            </div>
            
            <h2>Welcome to Bidi's New Wedding Planner! 🎉</h2>
            <p className="intro-text">
              We've created a comprehensive wedding planning dashboard that includes everything from the individual dashboard, plus powerful new features to help you plan your entire wedding from start to finish.
            </p>

            <div className="feature-highlights">
              <div className="feature-item">
                <i className="fas fa-search"></i>
                <span>All individual dashboard features</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-calendar-alt"></i>
                <span>Complete wedding timeline</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-dollar-sign"></i>
                <span>Budget tracking & management</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-user-friends"></i>
                <span>Guest list & RSVP management</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-users"></i>
                <span>Vendor coordination</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-tasks"></i>
                <span>Wedding checklist & tasks</span>
              </div>
            </div>

            <div className="choice-section">
              <p className="choice-question">Which dashboard would you like to use?</p>
              
              <div className="choice-buttons">
                <button 
                  className="choice-btn continue-current"
                  onClick={() => handleFirstTimeChoice('individual')}
                >
                  <div className="choice-header">
                    <i className="fas fa-search"></i>
                    <span>Continue with Individual Dashboard</span>
                  </div>
                  <p>Keep using the individual dashboard for specific vendor requests and bids</p>
                </button>
                
                <button 
                  className="choice-btn try-new"
                  onClick={() => handleFirstTimeChoice('wedding-planner')}
                >
                  <div className="choice-header">
                    <i className="fas fa-heart"></i>
                    <span>Upgrade to Wedding Planner</span>
                  </div>
                  <p>Get everything from the individual dashboard plus comprehensive wedding planning tools</p>
                </button>
              </div>

              <p className="note">
                You can always change your preference later in your dashboard settings.
              </p>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className="dashboard-switcher">
        <button 
          className="switcher-button"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <i className={getCurrentDashboardIcon()}></i>
          <span>{getCurrentDashboardName()}</span>
          <i className={`fas fa-chevron-down ${showDropdown ? 'rotated' : ''}`}></i>
        </button>
        
        {showDropdown && (
          <div className="switcher-dropdown">
            <div className="dropdown-header">
              <span>Switch Dashboard</span>
            </div>
            
            <button 
              className={`dropdown-item ${currentDashboard === 'individual' ? 'active' : ''}`}
              onClick={() => handleSwitch('individual')}
            >
              <i className="fas fa-search"></i>
              <div className="item-content">
                <span className="item-title">Individual Dashboard</span>
                <span className="item-description">Request bids for specific services</span>
              </div>
            </button>
            
            <button 
              className={`dropdown-item ${currentDashboard === 'wedding-planner' ? 'active' : ''}`}
              onClick={() => handleSwitch('wedding-planner')}
            >
              <i className="fas fa-heart"></i>
              <div className="item-content">
                <span className="item-title">Wedding Planner</span>
                <span className="item-description">Plan your entire wedding</span>
              </div>
            </button>
            
            <div className="dropdown-footer">
              <button 
                className="selector-link"
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/individual-dashboard/profile');
                }}
              >
                <i className="fas fa-cog"></i>
                Dashboard Settings
              </button>
            </div>
          </div>
        )}
        
        {showDropdown && (
          <div 
            className="dropdown-overlay"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>

      {/* First Time Modal - Rendered via Portal */}
      <FirstTimeModal />
    </>
  );
};

export default DashboardSwitcher; 