import React from 'react';
import { Modal } from 'react-bootstrap';
import './NewFeaturesModal.css';

const NewFeaturesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      centered
      size="lg"
      className="new-features-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Exciting New Features at Bidi!</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="video-container" style={{ position: 'relative', paddingBottom: '66.66666666666666%', height: 0 }}>
          <iframe 
            src="https://www.loom.com/embed/d1a17a4a7a4541838409ae0f5a39df0b?sid=74bb8db9-dace-4d42-8c3c-0b5c2d9f4374" 
            frameBorder="0" 
            webkitallowfullscreen 
            mozallowfullscreen 
            allowFullScreen 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </div>
        <div className="features-content">
          <div className="feature-section">
            <h3>🎯 Direct Vendor Selection</h3>
            <p>Couples can now specifically request bids from their preferred vendors!</p>
            <p className="feature-highlight">When a couple selects you directly, you'll automatically get a 1% commission discount on the booking. This is our way of rewarding vendors who build strong relationships with couples.</p>
          </div>

          <div className="feature-section">
            <h3>💬 New Follow-Up Feature</h3>
            <ul>
              <li>Send a follow-up message after 3 days of no response</li>
              <li>Keep the conversation going with potential clients</li>
              <li>Increase your chances of booking</li>
            </ul>
            <p className="feature-tip">Don't let potential clients slip away! Use our new follow-up feature to stay in touch and increase your chances of booking.</p>
          </div>

          <div className="feature-section">
            <h3>📅 Google Calendar Integration</h3>
            <ul>
              <li>Connect your Google Calendar</li>
              <li>Couples can see your availability</li>
              <li>Schedule 30-minute Zoom calls directly</li>
              <li>Streamline your consultation process</li>
            </ul>
          </div>

          <div className="feature-section">
            <h3>⚙️ Redesigned Settings Menu</h3>
            <ul>
              <li>Completely redesigned interface</li>
              <li>Google Calendar integration setup</li>
              <li>Customize your availability</li>
              <li>Set your consultation preferences</li>
              <li>Manage your messaging settings</li>
            </ul>
            <p className="feature-tip">The new settings menu makes it easier than ever to manage your profile and availability. Take a few minutes to set up your preferences!</p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button 
          className="btn btn-primary"
          style={{ color:'white'}}
          onClick={onClose}
        >
          Got it!
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default NewFeaturesModal; 