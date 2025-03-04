import React, { useState } from 'react';
import './EmailCaptureModal.css';
import BidiLogo from '../../assets/images/Bidi Logo2.jpg'

const EmailCaptureModal = ({ isOpen, onClose, onSubmit, isWaitlist }) => {
  const [email, setEmail] = useState('');
  
  if (!isOpen) return null;

  const content = isWaitlist ? {
    title: "Join Our Waitlist",
    mainOffer: "Be First to Know When We Launch in Your Area",
    benefits: [
      "✓ Priority access in your region",
      "✓ Early-bird promotional offers",
      "✓ Exclusive expansion updates"
    ],
    buttonText: "Join Waitlist",
    trustSignal: "Join couples nationwide eager for Bidi's expansion",
  } : {
    title: "Save Thousands on Your Wedding",
    mainOffer: "Get Our FREE Wedding Budget Guide",
    benefits: [
      "✓ Save up to 30% on your wedding",
      "✓ Hidden fees to watch out for",
      "✓ Exclusive vendor discounts"
    ],
    buttonText: "Get My Free Guide",
    trustSignal: "Join 2,000+ Utah couples who saved using our guides",
  };

  return (
    <div className="email-modal-overlay">
      <div className="email-modal-content">
        <button className="email-modal-close" onClick={onClose}>×</button>
        <div className="modal-icon">
          <img 
            style={{width:'200px', height:'auto'}}
            src={BidiLogo} 
            alt="Bidi Logo" 
          />
        </div>
        <h3>{content.title}</h3>
        <div className="value-props">
          <p className="main-offer">{content.mainOffer}</p>
          <ul className="benefits-list">
            {content.benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
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
            placeholder="Enter your email address"
            required
          />
          <button type="submit" className="cta-button">
            {content.buttonText}
          </button>
        </form>
        <p className="trust-signal">
          {content.trustSignal}
          <br />
          <small>We respect your privacy. Unsubscribe anytime.</small>
        </p>
      </div>
    </div>
  );
};

export default EmailCaptureModal;