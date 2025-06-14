import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from "../supabaseClient";
import '../styles/PartnershipLanding.css';
import bidiLogo from '../assets/images/Bidi-Logo.svg';
import Verified from '../assets/Frame 1162.svg';

const PartnershipLanding = () => {
  const { partnerName } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [partnerLogo, setPartnerLogo] = useState(null);

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .eq('id', partnerName)
          .single();

        if (error) {
          console.error('Error fetching partner:', error);
          navigate('/');
          return;
        }

        if (!data) {
          console.error('Partner not found:', partnerName);
          navigate('/');
          return;
        }

        // Set the partner data and store the ID for tracking
        setPartner(data);
        sessionStorage.setItem('referralPartnerId', data.id);

        // Increment the visit counter
        const { error: updateError } = await supabase
          .from('partners')
          .update({ 
            visit_count: (data.visit_count || 0) + 1 
          })
          .eq('id', partnerName);

        if (updateError) {
          console.error('Error updating visit count:', updateError);
        }

        // Handle the logo URL
        if (data.logo_url) {
          // If it's a Supabase URL, use it directly
          if (data.logo_url.startsWith('http')) {
            setPartnerLogo(data.logo_url);
          } else {
            // Try to load as a local asset
            try {
              const logoModule = await import(`../assets/Partnership Logos/${data.logo_url.split('/').pop()}`);
              setPartnerLogo(logoModule.default);
            } catch (error) {
              console.error('Error loading partner logo:', error);
              // Fallback to a default logo or null
              setPartnerLogo(null);
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error in partner fetch:', error);
        navigate('/');
      }
    };

    fetchPartner();
  }, [partnerName, navigate]);

  const handleCreateAccount = () => {
    navigate("/request-categories", {
      state: {
        fromPartnership: true,
        partnerId: partner.id,
        partnerName: partner.name
      }
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!partner) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Welcome to Bidi - {partner.name}</title>
        <meta name="description" content={`Plan your perfect wedding with Bidi. Connect with top wedding vendors and get exclusive discounts as a ${partner.name} customer. `} />
      </Helmet>

      <div className="partnership-landing">
        <div className="partnership-header">
          <div className="partnership-header-content">
            <div className="partnership-logos">
              <div className="logo-container">
                <img src={bidiLogo} alt="Bidi Logo" className="bidi-logo" />
              </div>
              <div className="logo-divider">×</div>
              <div className="logo-container">
                {partnerLogo ? (
                  <img 
                    src={partnerLogo} 
                    alt={`${partner.name} Logo`} 
                    className="partner-logo"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                ) : (
                  <div className="partner-logo-placeholder">
                    {partner.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <div className="landing-page-subtitle">
              {partner.description}
            </div>

            <div className="vendor-categories">
              <h3 style={{color:'black', fontWeight:'700', fontFamily:'Outfit'}}>Find Your Perfect Wedding Vendors</h3>
              <div className="vendor-scroll-container">
                <div className="vendor-list-partnership">
                  <div className="vendor-item">
                    <i className="fas fa-camera"></i>
                    <span>Photography</span>
                  </div>
                  <div className="vendor-item">
                    <i className="fas fa-video"></i>
                    <span>Videography</span>
                  </div>
                  <div className="vendor-item">
                    <i className="fas fa-music"></i>
                    <span>DJ</span>
                  </div>
                  <div className="vendor-item">
                    <i className="fas fa-cut"></i>
                    <span>Hair & Makeup</span>
                  </div>
                  <div className="vendor-item">
                    <i className="fas fa-leaf"></i>
                    <span>Florist</span>
                  </div>
                  <div className="vendor-item">
                    <i className="fas fa-utensils"></i>
                    <span>Catering</span>
                  </div>
                  <div className="vendor-item">
                    <i className="fas fa-calendar-check"></i>
                    <span>Wedding Planning</span>
                  </div>
                  {/* Duplicate items for seamless scrolling */}
                  <div className="vendor-item">
                    <i className="fas fa-camera"></i>
                    <span>Photography</span>
                  </div>
                  <div className="vendor-item">
                    <i className="fas fa-video"></i>
                    <span>Videography</span>
                  </div>
                  <div className="vendor-item">
                    <i className="fas fa-music"></i>
                    <span>DJ</span>
                  </div>
                  <div className="vendor-item">
                    <i className="fas fa-cut"></i>
                    <span>Hair & Makeup</span>
                  </div>
                  <div className="vendor-item">
                    <i className="fas fa-leaf"></i>
                    <span>Florist</span>
                  </div>
                  <div className="vendor-item">
                    <i className="fas fa-utensils"></i>
                    <span>Catering</span>
                  </div>
                  <div className="vendor-item">
                    <i className="fas fa-calendar-check"></i>
                    <span>Wedding Planning</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="special-offer-banner">
              <div className="offer-content">
                <div className="offer-amount">$50 OFF</div>
                <h3 style={{color:'white', fontWeight:'700'}}>Your First Vendor Booking</h3>
                <p style={{color:'white', fontWeight:'700'}}>Book any vendor through Bidi and get $50 off</p>
              </div>
              <div className="offer-icon">
                <i className="fas fa-gift"></i>
              </div>
            </div>

            <div className="cta-buttons">
              <button 
                className="cta-button secondary" 
                onClick={handleCreateAccount}
              >
                Get Started
              </button>
            </div>
            <div style={{display:'flex', justifyContent:'center', marginTop:'20px'}}>
              <button 
                className="learn-more-btn"
                onClick={() => {
                  document.getElementById('what-is-bidi').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
              >
                Learn More
                <span className="arrow-down">
                  <i className="fas fa-chevron-down"></i>
                </span>
              </button>
              </div>
          </div>
        </div>

        <div id="what-is-bidi" className="what-is-bidi">
          <div className="bidi-explanation">
            <h2 style={{color:'black', fontWeight:'700', fontFamily:'Outfit', marginBottom:'40px', fontSize:'2rem'}}>What is Bidi?</h2>
            <p>Bidi is a free platform where you can post requests for wedding services and receive bids from verified vendors. It's that simple!</p>
          </div>
          <div className="process-flow">
            <div className="process-step">
              <div className="process-icon">
                <i className="fas fa-pen-to-square"></i>
              </div>
              <h3>Post Request</h3>
              <p>Tell us what you need</p>
            </div>
            <div className="process-arrow">
              <i className="fas fa-chevron-right"></i>
            </div>
            <div className="process-step">
              <div className="process-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h3>Get Bids</h3>
              <p>Vendors send you offers</p>
            </div>
            <div className="process-arrow">
              <i className="fas fa-chevron-right"></i>
            </div>
            <div className="process-step">
              <div className="process-icon">
                <i className="fas fa-comments"></i>
              </div>
              <h3>Chat & Compare</h3>
              <p>Message vendors you like</p>
            </div>
            <div className="process-arrow">
              <i className="fas fa-chevron-right"></i>
            </div>
            <div className="process-step">
              <div className="process-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3>Book</h3>
              <p>Choose your vendor</p>
            </div>
          </div>
        </div>

        <div className="why-bidi-section-partnership">
          <h3>Why Bidi?</h3>
          <div className="why-bidi-grid">
            <div className="why-bidi-card">
              <i className="fas fa-clock"></i>
              <h4>Save Time</h4>
              <p>Get multiple quotes quickly without the hassle of searching or phone tag.</p>
            </div>
            <div className="why-bidi-card">
              <i className="fas fa-shield-alt"></i>
              <h4>No Ghosting Guarantee</h4>
              <p>If a vendor becomes unresponsive, we'll refund your booking fee.</p>
            </div>
            <div className="why-bidi-card">
              <img src={Verified} alt="Verified" style={{ width: '40px', height: '40px', marginBottom: '1.5rem' }} />
              <h4>Verified Vendors</h4>
              <p>Our verified vendors are thoroughly vetted - registered with the state, properly insured, and have proven track records of excellent service.</p>
            </div>
            <div className="why-bidi-card">
              <i className="fas fa-hand-holding-usd"></i>
              <h4>$300 in Savings</h4>
              <p>On average, couples save $300 when booking vendors through Bidi compared to traditional vendor searches.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PartnershipLanding; 

<style>
{`
  .partner-logo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    border-radius: 8px;
    font-size: 2rem;
    font-weight: bold;
    color: #666;
  }
`}
</style> 