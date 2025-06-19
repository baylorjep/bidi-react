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
        <div className="video-container" style={{ position: 'relative', paddingBottom: '66.66666666666666%', height: 0, marginBottom: '20px' }}>
          <iframe 
            src="https://www.loom.com/embed/f44e4a9991c2442081393d8c448949b2?sid=74bb8db9-dace-4d42-8c3c-0b5c2d9f4374" 
            frameBorder="0" 
            webkitallowfullscreen 
            mozallowfullscreen 
            allowFullScreen 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </div>
        <div className="features-content">
          <div className="feature-section">
            <h3>💰 Affiliate Links Are Live!</h3>
            <p>Generate a link that gives people $50 off their first vendor when they book through Bidi!</p>
            <p className="feature-highlight">
              <strong>We pay half of all the money we make to you!</strong> This is a fantastic way to earn additional income while helping couples find great vendors.
            </p>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src="https://i.imgur.com/FsFrFR5.gif" alt="Affiliate Link Demo" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '10px' }} />
              <img src="https://i.imgur.com/6CYYdEW.png" alt="Affiliate Link Interface" style={{ maxWidth: '100%', borderRadius: '8px' }} />
            </div>
          </div>

          <div className="feature-section">
            <h3>📅 Google Calendar Integration Complete</h3>
            <ul>
              <li>Connect your Google Calendar</li>
              <li>People can book consultation sessions from your bid or profile</li>
              <li><strong>Sessions are recorded for your convenience</strong></li>
              <li>Streamline your consultation process</li>
            </ul>
            <p className="feature-tip">The integration is now fully functional! Make sure your calendar is connected to start receiving direct bookings.</p>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src="https://i.imgur.com/798NrXB.gif" alt="Google Calendar Integration" style={{ maxWidth: '100%', borderRadius: '8px' }} />
            </div>
          </div>

          <div className="feature-section">
            <h3>📍 Enhanced Profile Features</h3>
            <ul>
              <li>Set your service areas and base area</li>
              <li>Receive more targeted notifications</li>
              <li>No more notifications for opportunities outside your service area</li>
              <li><strong>Better matching with potential clients</strong></li>
            </ul>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src="https://i.imgur.com/7LJxcNq.png" alt="Service Areas Feature" style={{ maxWidth: '100%', borderRadius: '8px' }} />
            </div>
          </div>

          <div className="feature-section">
            <h3>📦 Package Showcase</h3>
            <ul>
              <li>Add your packages to Bidi</li>
              <li>Instant messaging buttons for each package</li>
              <li><strong>Payment buttons coming very soon!</strong></li>
              <li>Streamline your booking process</li>
            </ul>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src="https://i.imgur.com/qFKyqZx.png" alt="Package Showcase" style={{ maxWidth: '100%', borderRadius: '8px' }} />
            </div>
          </div>

          <div className="feature-section">
            <h3>🖼️ Redesigned Gallery</h3>
            <ul>
              <li>Top 5 photos featured at the top of your profile</li>
              <li>All other photos organized in your gallery</li>
              <li>Create categories (maternity, wedding, food, flowers, etc.)</li>
              <li><strong>Better showcase your work</strong></li>
            </ul>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src="https://i.imgur.com/MkjaBu3.png" alt="Redesigned Gallery" style={{ maxWidth: '100%', borderRadius: '8px' }} />
            </div>
          </div>

          <div className="feature-section">
            <h3>💡 Quick Tips for Success</h3>
            <ul>
              <li><strong>Generate your affiliate link</strong> and start earning commissions</li>
              <li>Connect your Google Calendar to enable direct booking</li>
              <li>Update your service areas for better-targeted notifications</li>
              <li><strong>Add your packages</strong> with instant messaging buttons</li>
              <li>Organize your gallery with categories to showcase your best work</li>
              <li>Keep your availability up to date for better booking opportunities</li>
            </ul>
          </div>

          <div className="feature-section" style={{ textAlign: 'center', background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
            <h3>Ready to Get Started?</h3>
            <p>These new features are designed to help you grow your business and earn more money. Take advantage of them today!</p>
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