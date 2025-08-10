import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import RequestModal from './RequestModal';
import "../../styles/RequestCategories.css";

function RequestCategories() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventDetails, setEventDetails] = useState({
    eventType: '',
    date: '',
    time: '',
    location: '',
    guestCount: ''
  });
  const partnershipInfo = location.state?.fromPartnership ? {
    partnerId: location.state.partnerId,
    partnerName: location.state.partnerName
  } : null;
  const vendorData = location.state?.vendor ? location.state.vendor : null;

  const categories = [
    {
      id: "photographer",
      name: "Photography",
      icon: "fa-camera",
      description: "Professional photography services for your special day"
    },
    {
      id: "videographer",
      name: "Videography",
      icon: "fa-video",
      description: "Capture your memories in motion"
    },
    {
      id: "dj",
      name: "DJ Services",
      icon: "fa-music",
      description: "Keep your celebration moving with great music"
    },
    {
      id: "beauty",
      name: "Hair and Makeup",
      icon: "fa-spa",
      description: "Look your best on your special day"
    },
    {
      id: "florist",
      name: "Florist",
      icon: "fa-leaf",
      description: "Beautiful floral arrangements for your event"
    },
    {
      id: "caterer",
      name: "Catering",
      icon: "fa-utensils",
      description: "Delicious food and beverage services"
    },
    {
      id: "planner",
      name: "Wedding Planning",
      icon: "fa-calendar-check",
      description: "Professional planning and coordination"
    }
  ];

  const toggleCategory = (category) => {
    setSelectedCategories(
      (prev) =>
        prev.includes(category)
          ? prev.filter((c) => c !== category)
          : [...prev, category]
    );
  };

  const handleNext = () => {
    if (selectedCategories.length > 0) {
      // Check if event details are filled, if not show modal
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="request-categories-container">
      <div className="request-categories-form-container-details">
        <div className="request-form-header">
          What would you like to get done today?
        </div>

        {/* Event Details Form - Always Visible */}
        <div className="event-details-section" style={{ 
          margin: '2rem 0',
          padding: '2rem',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '1rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <div className="request-form-subheader" style={{ 
            marginBottom: '1.5rem',
            color: '#1e293b',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            Tell us about your event
          </div>
          
          <div className="event-details-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1.5rem'
          }}>
            {/* Event Type */}
            <div className="form-field">
              <label className="form-label" style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
                letterSpacing: '0.025em'
              }}>Event Type</label>
              <select 
                value={eventDetails.eventType}
                onChange={(e) => setEventDetails({...eventDetails, eventType: e.target.value})}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  backgroundColor: '#ffffff',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#a855f7';
                  e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                }}
              >
                <option value="">Select Event Type</option>
                <option value="Wedding">Wedding</option>
                <option value="Corporate Event">Corporate Event</option>
                <option value="Birthday Party">Birthday Party</option>
                <option value="Anniversary">Anniversary</option>
                <option value="Baby Shower">Baby Shower</option>
                <option value="Graduation">Graduation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Event Date */}
            <div className="form-field">
              <label className="form-label" style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
                letterSpacing: '0.025em'
              }}>Event Date</label>
              <input 
                type="date"
                value={eventDetails.date}
                onChange={(e) => setEventDetails({...eventDetails, date: e.target.value})}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  backgroundColor: '#ffffff',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#a855f7';
                  e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                }}
              />
            </div>

            {/* Start Time */}
            <div className="form-field">
              <label className="form-label" style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
                letterSpacing: '0.025em'
              }}>Start Time</label>
              <input 
                type="time"
                value={eventDetails.time}
                onChange={(e) => setEventDetails({...eventDetails, time: e.target.value})}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  backgroundColor: '#ffffff',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#a855f7';
                  e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                }}
              />
            </div>

            {/* Location */}
            <div className="form-field">
              <label className="form-label" style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
                letterSpacing: '0.025em'
              }}>Location</label>
              <input 
                type="text"
                placeholder="City, State or Venue"
                value={eventDetails.location}
                onChange={(e) => setEventDetails({...eventDetails, location: e.target.value})}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  backgroundColor: '#ffffff',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#a855f7';
                  e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                }}
              />
            </div>

            {/* Guest Count */}
            <div className="form-field">
              <label className="form-label" style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
                letterSpacing: '0.025em'
              }}>Guest Count</label>
              <input 
                type="number"
                placeholder="Number of guests"
                value={eventDetails.guestCount}
                onChange={(e) => setEventDetails({...eventDetails, guestCount: e.target.value})}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  backgroundColor: '#ffffff',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#a855f7';
                  e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                }}
              />
            </div>
          </div>
        </div>

        <div className="request-form-subheader" style={{ marginBottom: '1.5rem' }}>
          Please select one or more services
        </div>

        <div className="request-categories-grid">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`request-category-card ${
                selectedCategories.includes(category.id) ? "selected" : ""
              }`}
              onClick={() => toggleCategory(category.id)}
            >
              <div className="category-icon">
                <i className={`fas ${category.icon}`}></i>
              </div>
              <div className="category-content-request-categories">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
              {selectedCategories.includes(category.id) && (
                <div className="selected-indicator">
                  <i className="fas fa-check"></i>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="form-button-container">
          <button
            className="request-form-back-and-foward-btn"
            onClick={() => navigate("/")}
          >
            Back
          </button>
          <button
            className={`request-form-back-and-foward-btn ${
              selectedCategories.length > 0 ? "selected-border" : ""
            }`}
            onClick={handleNext}
            disabled={selectedCategories.length === 0}
            style={{
              backgroundColor:
                selectedCategories.length === 0 ? "#9F8AB3" : "#a328f4",
              cursor: selectedCategories.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Get Quotes
          </button>
        </div>
      </div>

      {/* Request Modal */}
      {isModalOpen && (
        <RequestModal 
          isOpen={isModalOpen}
          onClose={handleModalClose}
          selectedVendors={selectedCategories}
          searchFormData={eventDetails}
        />
      )}
    </div>
  );
}

export default RequestCategories;
