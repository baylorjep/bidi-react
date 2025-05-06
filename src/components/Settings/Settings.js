import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../../styles/Settings.css';

function Settings() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
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

      // Fetch both business and individual profiles
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: individualProfile } = await supabase
        .from('individual_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Combine profiles
      setProfile({
        ...businessProfile,
        ...individualProfile,
        role: 'both'
      });

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
      // Update business profile
      const { error: businessError } = await supabase
        .from('business_profiles')
        .update({
          business_name: profile.business_name,
          business_type: profile.business_type,
          description: profile.description,
          phone: profile.phone,
          website: profile.website,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          zip_code: profile.zip_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (businessError) throw businessError;

      // Update individual profile
      const { error: individualError } = await supabase
        .from('individual_profiles')
        .update({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          zip_code: profile.zip_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (individualError) throw individualError;

      setSuccessMessage('Profile updated successfully');
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

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <form onSubmit={handleUpdateProfile} className="settings-form">
        <div className="form-section">
          <h3>Business Information</h3>
          <div className="form-group">
            <label htmlFor="business_name">Business Name</label>
            <input
              type="text"
              id="business_name"
              name="business_name"
              value={profile.business_name || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="business_type">Business Type</label>
            <input
              type="text"
              id="business_type"
              name="business_type"
              value={profile.business_type || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={profile.description || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={profile.website || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profile.name || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={profile.phone || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Location</h3>
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={profile.address || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={profile.city || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="state">State</label>
            <input
              type="text"
              id="state"
              name="state"
              value={profile.state || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="zip_code">ZIP Code</label>
            <input
              type="text"
              id="zip_code"
              name="zip_code"
              value={profile.zip_code || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Save Changes</button>
          <button type="button" className="btn-secondary" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings; 