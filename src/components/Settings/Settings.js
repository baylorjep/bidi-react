import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';
import '../../styles/Settings.css';

function Settings({ currentDashboard }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [dashboardPreference, setDashboardPreference] = useState('individual');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }
      setUser(user);

      // Fetch individual profile
      const { data: individualProfile } = await supabase
        .from('individual_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Fetch general profile for email
      const { data: generalProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      // Combine profiles
      setProfile({
        ...individualProfile,
        email: generalProfile?.email
      });

      // Set dashboard preference from individual profile
      if (individualProfile?.preferred_dashboard) {
        setDashboardPreference(individualProfile.preferred_dashboard);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load profile data');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    try {
      // Update individual profile
      const { error: individualError } = await supabase
        .from('individual_profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          preferred_dashboard: dashboardPreference,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (individualError) throw individualError;

      setSuccessMessage('Profile updated successfully');
      
      // Check if dashboard preference changed and navigate if different
      const currentDashboardType = currentDashboard === 'individual' ? 'individual' : 'wedding-planner';
      if (dashboardPreference !== currentDashboardType) {
        // Navigate to the selected dashboard
        if (dashboardPreference === 'individual') {
          navigate('/individual-dashboard');
        } else if (dashboardPreference === 'wedding-planner') {
          navigate('/wedding-planner');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDashboardPreferenceChange = (preference) => {
    // Just update the local state, don't save to database yet
    setDashboardPreference(preference);
  };

  if (isLoading) {
    return <LoadingSpinner variant="ring" color="#ff008a" text="Loading settings..." />;
  }

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <form onSubmit={handleUpdateProfile} className="settings-form">
        {/* Dashboard Preference Section */}
        <div className="form-section">
          <h3>Dashboard Preference</h3>
          <div className="dashboard-preference-section">
            <p className="preference-description">
              Choose which dashboard you'd like to use as your default:
            </p>
            
            <div className="dashboard-options">
              <div 
                className={`dashboard-option-settings ${dashboardPreference === 'individual' ? 'selected' : ''}`}
                onClick={() => handleDashboardPreferenceChange('individual')}
              >
                <div className="option-icon-settings">
                  <i className="fas fa-search"></i>
                </div>
                <div className="option-content-settings">
                  <h4>Individual Dashboard</h4>
                  <p>Request bids for specific services and manage individual vendor requests</p>
                  {currentDashboard === 'individual' && (
                    <span className="current-badge">Currently Active</span>
                  )}
                </div>
              </div>
              
              <div 
                className={`dashboard-option-settings ${dashboardPreference === 'wedding-planner' ? 'selected' : ''}`}
                onClick={() => handleDashboardPreferenceChange('wedding-planner')}
              >
                <div className="option-icon-settings">
                  <i className="fas fa-heart"></i>
                </div>
                <div className="option-content-settings">
                  <h4>Wedding Planner</h4>
                  <p>Comprehensive wedding planning with timeline, budget, and vendor management</p>
                  {currentDashboard === 'wedding-planner' && (
                    <span className="current-badge">Currently Active</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-group">
            <label htmlFor="first_name">First Name</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={profile?.first_name || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Last Name</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={profile?.last_name || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile?.email || ''}
              disabled
              className="disabled-input"
            />
            <small className="form-text text-muted">Email cannot be changed from settings</small>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={profile?.phone || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-actions-settings">
          <button type="submit" className="btn-primary" style={{maxWidth:'100px'}}>Save Changes</button>
          <button type="button" className="btn-secondary" style={{width:'130px',borderRadius:'30px', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings; 