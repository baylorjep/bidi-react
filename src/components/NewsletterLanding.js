import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import EmailCaptureModal from './EmailCaptureModal/EmailCaptureModal';
import { supabase } from '../supabaseClient';
import './NewsletterLanding.css';

const NewsletterLanding = () => {
  const [showModal, setShowModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSubscribed = localStorage.getItem('hasSubscribed');
    if (hasSubscribed) {
      setIsSubscribed(true);
      navigate('/articles');
    } else {
      setShowModal(true);
    }
  }, [navigate]);

  const handleEmailSubmit = async (email) => {
    try {
      const { data, error } = await supabase
        .from('email_subscribers')
        .insert([
          { 
            email,
            article_id: 'newsletter_landing'
          }
        ]);

      if (error) throw error;

      localStorage.setItem('hasSubscribed', 'true');
      setShowModal(false);
      setIsSubscribed(true);
    } catch (error) {
      console.error('Error saving email:', error);
      
      if (error.code === '23505') {
        alert('This email is already subscribed!');
      } else {
        alert('There was an error. Please try again.');
      }
    }
  };

  return (
    <div className="newsletter-landing">
      <Helmet>
        <title>Welcome to Bidi | Thank You for Subscribing</title>
        <meta name="description" content="Thank you for subscribing to Bidi's newsletter. Access exclusive wedding planning resources and vendor insights." />
      </Helmet>

      <EmailCaptureModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          navigate('/articles');
        }}
        onSubmit={handleEmailSubmit}
      />

      {isSubscribed && (
        <div className="landing-content">
          <h1>Welcome to the Bidi Community!</h1>
          <p className="thank-you">Thank you for subscribing to our newsletter</p>
          
          <div className="coupon-section">
            <h2>Your Special Offer</h2>
            <p>Use this code to get $25 off your first vendor booking:</p>
            <div className="coupon-display">
              <span className="coupon-code">NEWSLETTER2025</span>
              <small>Valid until Dec 31, 2025</small>
            </div>
          </div>

          <div className="benefits-section">
            <h2>What's Next?</h2>
            <ul className="benefits-list">
              <li>✓ Exclusive wedding planning guides</li>
              <li>✓ Monthly vendor spotlights</li>
              <li>✓ Special subscriber-only discounts</li>
              <li>✓ Latest wedding trends and tips</li>
            </ul>
          </div>

          <div className="cta-section">
            <h3>Ready to Start Planning?</h3>
            <div className="button-group">
              <Link to="/request-categories" className="cta-button primary">
                Post Your First Request
              </Link>
              <Link to="/articles" className="cta-button secondary">
                Browse Wedding Guides
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsletterLanding;