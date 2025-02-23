import React, { useState } from 'react';
import './EmailCaptureModal.css';
import BidiLogo from '../../assets/images/Bidi Logo2.jpg'

const EmailCaptureModal = ({ isOpen, onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  
  if (!isOpen) return null;

  return (
    <div className="email-modal-overlay">
      <div className="email-modal-content">
        <button className="email-modal-close" onClick={onClose}>×</button>
        <div className="modal-icon">
          <img style={{width:'200px', height:'auto'}}src={BidiLogo} alt="Wedding Tips" />
        </div>
        <h3>Save Thousands on Your Wedding</h3>
        <div className="value-props">
          <p className="main-offer">Get Our FREE Wedding Budget Guide</p>
          <ul className="benefits-list">
            <li>✓ Real pricing from 1000+ Utah weddings</li>
            <li>✓ Money-saving negotiation scripts</li>
            <li>✓ Hidden fees to watch out for</li>
            <li>✓ Exclusive vendor discounts</li>
          </ul>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(email);
          setEmail('');
        }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email for instant access"
            required
          />
          <button type="submit" className="cta-button">
            Get My Free Guide
          </button>
        </form>
        <p className="trust-signal">
          Join 2,000+ Utah couples who saved using our guides
          <br />
          <small>We respect your privacy. Unsubscribe anytime.</small>
        </p>
      </div>
    </div>
  );
};

export default EmailCaptureModal;