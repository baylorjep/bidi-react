import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import WeddingTimeline from './WeddingTimeline';
import BudgetTracker from './BudgetTracker';
import VendorManager from './VendorManager';
import GuestListManager from './GuestListManager';
import EventDetails from './EventDetails';
import WeddingChecklist from './WeddingChecklist';
import './WeddingPlanningDashboard.css';

function WeddingPlanningDashboard() {
  const [user, setUser] = useState(null);
  const [weddingData, setWeddingData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isCreatingWedding, setIsCreatingWedding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUserAndLoadWedding();
  }, []);

  useEffect(() => {
    console.log('activeTab changed to:', activeTab);
  }, [activeTab]);

  const checkUserAndLoadWedding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User from auth:', user);
      if (!user) {
        navigate('/signin');
        return;
      }
      setUser(user);
      
      // Check if user has an existing wedding plan
      const { data: existingWedding } = await supabase
        .from('wedding_plans')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Existing wedding data:', existingWedding);
      if (existingWedding) {
        setWeddingData(existingWedding);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading wedding data:', error);
      setLoading(false);
    }
  };

  const createNewWedding = async (weddingDetails) => {
    try {
      console.log('Creating wedding with details:', weddingDetails);
      console.log('Current user:', user);
      
      if (!user) {
        console.error('No user available for creating wedding');
        toast.error('User not authenticated. Please sign in again.');
        return;
      }
      
      setIsCreatingWedding(true);
      
      const { data, error } = await supabase
        .from('wedding_plans')
        .insert([{
          user_id: user.id,
          ...weddingDetails,
          created_at: new Date().toISOString(),
          status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Wedding created successfully:', data);
      setWeddingData(data);
      setIsCreatingWedding(false);
      toast.success('Wedding plan created successfully!');
    } catch (error) {
      console.error('Error creating wedding plan:', error);
      setIsCreatingWedding(false);
      
      // Check if it's a table doesn't exist error
      if (error.message && error.message.includes('relation "wedding_plans" does not exist')) {
        toast.error('Database table not found. Please contact support.');
      } else {
        toast.error('Failed to create wedding plan: ' + error.message);
      }
    }
  };

  const updateWeddingData = async (updates) => {
    try {
      const { data, error } = await supabase
        .from('wedding_plans')
        .update(updates)
        .eq('id', weddingData.id)
        .select()
        .single();

      if (error) throw error;

      setWeddingData(data);
      toast.success('Wedding plan updated successfully!');
    } catch (error) {
      console.error('Error updating wedding plan:', error);
      toast.error('Failed to update wedding plan');
    }
  };

  const renderTabContent = () => {
    console.log('renderTabContent called, activeTab:', activeTab, 'weddingData:', weddingData);
    
    // Handle setup tab first
    if (activeTab === 'setup') {
      console.log('Rendering setup form');
      return (
        <div className="wedding-setup-form">
          <h2>Create Your Wedding Plan</h2>
          <WeddingSetupForm onSubmit={createNewWedding} loading={isCreatingWedding} />
        </div>
      );
    }
    
    if (!weddingData) {
      console.log('No wedding data, showing setup container');
      return (
        <div className="wedding-setup-container">
          <h2>Let's Start Planning Your Wedding!</h2>
          <p>Create your wedding plan to get started with timeline, budget tracking, and vendor management.</p>
          <button 
            className="create-wedding-btn"
            onClick={() => {
              alert('Button clicked!');
              console.log('Create wedding button clicked');
              console.log('Current activeTab before:', activeTab);
              setActiveTab('setup');
              console.log('ActiveTab set to setup');
            }}
          >
            Create Wedding Plan
          </button>
        </div>
      );
    }

    console.log('Wedding data exists, rendering tab content for:', activeTab);
    switch (activeTab) {
      case 'overview':
        return (
          <div className="overview-container">
            <div className="overview-header">
              <h2>Wedding Overview</h2>
              <div className="wedding-date-badge">
                {new Date(weddingData.wedding_date).toLocaleDateString()}
              </div>
            </div>
            
            <div className="overview-grid">
              <div className="overview-card">
                <h3>Timeline Progress</h3>
                <WeddingTimeline weddingData={weddingData} compact={true} />
              </div>
              
              <div className="overview-card">
                <h3>Budget Summary</h3>
                <BudgetTracker weddingData={weddingData} compact={true} />
              </div>
              
              <div className="overview-card">
                <h3>Vendor Status</h3>
                <VendorManager weddingData={weddingData} compact={true} />
              </div>
              
              <div className="overview-card">
                <h3>Guest List</h3>
                <GuestListManager weddingData={weddingData} compact={true} />
              </div>
            </div>
          </div>
        );
      
      case 'timeline':
        return <WeddingTimeline weddingData={weddingData} onUpdate={updateWeddingData} />;
      
      case 'budget':
        return <BudgetTracker weddingData={weddingData} onUpdate={updateWeddingData} />;
      
      case 'vendors':
        return <VendorManager weddingData={weddingData} onUpdate={updateWeddingData} />;
      
      case 'guests':
        return <GuestListManager weddingData={weddingData} onUpdate={updateWeddingData} />;
      
      case 'details':
        return <EventDetails weddingData={weddingData} onUpdate={updateWeddingData} />;
      
      case 'checklist':
        return <WeddingChecklist weddingData={weddingData} onUpdate={updateWeddingData} />;
      
      default:
        console.log('Default case, activeTab:', activeTab);
        return <div>Select a tab to get started</div>;
    }
  };

  if (loading) {
    return (
      <div className="wedding-planning-loading">
        <div className="loading-spinner"></div>
        <p>Loading your wedding plan...</p>
      </div>
    );
  }

  return (
    <div className="wedding-planning-dashboard">
      <div className="dashboard-header">
        {weddingData ? (
          <h1>
            <span className="cute-title">✨ {weddingData.wedding_title} ✨</span>
            <div className="cute-subtitle">Your Perfect Day Awaits</div>
          </h1>
        ) : (
          <h1>
            <span className="cute-title">💕 Let's Plan Your Dream Wedding 💕</span>
            <div className="cute-subtitle">Every love story deserves a beautiful beginning</div>
          </h1>
        )}
        {weddingData && (
          <div className="wedding-info">
            <span className="wedding-date">
              {new Date(weddingData.wedding_date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-home"></i>
          Overview
        </button>
        
        {!weddingData && (
          <button 
            className={`tab ${activeTab === 'setup' ? 'active' : ''}`}
            onClick={() => setActiveTab('setup')}
          >
            <i className="fas fa-plus-circle"></i>
            Setup
          </button>
        )}
        
        {weddingData && (
          <>
            <button 
              className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              <i className="fas fa-calendar-alt"></i>
              Timeline
            </button>
            
            <button 
              className={`tab ${activeTab === 'budget' ? 'active' : ''}`}
              onClick={() => setActiveTab('budget')}
            >
              <i className="fas fa-dollar-sign"></i>
              Budget
            </button>
            
            <button 
              className={`tab ${activeTab === 'vendors' ? 'active' : ''}`}
              onClick={() => setActiveTab('vendors')}
            >
              <i className="fas fa-users"></i>
              Vendors
            </button>
            
            <button 
              className={`tab ${activeTab === 'guests' ? 'active' : ''}`}
              onClick={() => setActiveTab('guests')}
            >
              <i className="fas fa-user-friends"></i>
              Guests
            </button>
            
            <button 
              className={`tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <i className="fas fa-info-circle"></i>
              Details
            </button>
            
            <button 
              className={`tab ${activeTab === 'checklist' ? 'active' : ''}`}
              onClick={() => setActiveTab('checklist')}
            >
              <i className="fas fa-tasks"></i>
              Checklist
            </button>
          </>
        )}
      </div>

      <div className="dashboard-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

// Wedding Setup Form Component
function WeddingSetupForm({ onSubmit, loading }) {
  console.log('WeddingSetupForm rendered, loading:', loading);
  
  const [formData, setFormData] = useState({
    wedding_title: '',
    wedding_date: '',
    wedding_location: '',
    budget: '',
    guest_count: '',
    wedding_style: '',
    color_scheme: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    console.log('Calling onSubmit function...');
    onSubmit(formData);
  };

  const handleChange = (e) => {
    console.log('Form field changed:', e.target.name, e.target.value);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  console.log('WeddingSetupForm about to render form with data:', formData);

  return (
    <form onSubmit={handleSubmit} className="wedding-setup-form-content">
      <div className="form-group">
        <label htmlFor="wedding_title">Wedding Title</label>
        <input
          type="text"
          id="wedding_title"
          name="wedding_title"
          value={formData.wedding_title}
          onChange={handleChange}
          placeholder="e.g., Sarah & Michael's Wedding"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="wedding_date">Wedding Date</label>
        <input
          type="date"
          id="wedding_date"
          name="wedding_date"
          value={formData.wedding_date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="wedding_location">Wedding Location</label>
        <input
          type="text"
          id="wedding_location"
          name="wedding_location"
          value={formData.wedding_location}
          onChange={handleChange}
          placeholder="You can enter a city, venue, state or address"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="budget">Total Budget</label>
          <input
            type="number"
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            placeholder="50000"
          />
        </div>

        <div className="form-group">
          <label htmlFor="guest_count">Expected Guest Count</label>
          <input
            type="number"
            id="guest_count"
            name="guest_count"
            value={formData.guest_count}
            onChange={handleChange}
            placeholder="150"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="wedding_style">Wedding Style</label>
          <select
            id="wedding_style"
            name="wedding_style"
            value={formData.wedding_style}
            onChange={handleChange}
          >
            <option value="">Select Style</option>
            <option value="traditional">Traditional</option>
            <option value="modern">Modern</option>
            <option value="rustic">Rustic</option>
            <option value="elegant">Elegant</option>
            <option value="bohemian">Bohemian</option>
            <option value="vintage">Vintage</option>
            <option value="destination">Destination</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="color_scheme">Color Scheme</label>
          <input
            type="text"
            id="color_scheme"
            name="color_scheme"
            value={formData.color_scheme}
            onChange={handleChange}
            placeholder="e.g., Navy & Gold"
          />
        </div>
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Creating...' : 'Create Wedding Plan'}
      </button>
    </form>
  );
}

export default WeddingPlanningDashboard; 