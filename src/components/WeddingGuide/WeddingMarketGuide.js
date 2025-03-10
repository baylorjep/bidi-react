import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '../../supabaseClient';
import './WeddingMarketGuide.css';
import GuideDownloadImage from '../../assets/images/State of the Utah Wedding Markets.png';

const WeddingMarketGuide = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Check if user has already submitted their email
  useEffect(() => {
    const hasSubscribed = localStorage.getItem('weddingGuideSubscribed');
    if (hasSubscribed) {
      setIsSubmitted(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Add email to subscribers table with the correct column structure
      const { error } = await supabase
        .from('email_subscribers')
        .insert([{ 
          email,
          article_id: 'state_of_utah_wedding_markets_2024',
          subscribed: true,
          is_waitlist: false
        }]);

      if (error) {
        if (error.code === '23505') {
          // Email already exists - still allow download
          console.log('Email already subscribed');
          setIsSubmitted(true);
          localStorage.setItem('weddingGuideSubscribed', 'true');
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
        localStorage.setItem('weddingGuideSubscribed', 'true');
      }
    } catch (error) {
      console.error('Error saving email:', error);
      setError('There was an error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Improved download function with fallbacks
  const handleDownload = () => {
    // Path to your PDF file in the public folder
    const pdfUrl = '/guides/State_of_Utah_Wedding_Markets_2024.pdf';
    
    try {
      // Primary method - programmatic download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'State_of_Utah_Wedding_Markets_2024.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Add analytics tracking if needed
      console.log('PDF download initiated');
    } catch (error) {
      console.error('Download error:', error);
      // Fallback - open in new tab
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="wedding-guide-container">
      <Helmet>
        <title>State of Utah Wedding Markets Guide 2024 | Bidi</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <meta 
          name="description" 
          content="Download our free 2024 State of Utah Wedding Markets Guide. Get exclusive data on vendor pricing, wedding trends, and budget insights for Utah couples." 
        />
        <meta name="keywords" content="Utah wedding costs, wedding market prices, Utah wedding budget, wedding vendor pricing, Utah wedding guide, wedding planning Utah" />
        <meta property="og:title" content="2024 State of Utah Wedding Markets Guide | Bidi" />
        <meta property="og:description" content="Free guide with exclusive data on Utah wedding costs, vendor pricing, and spending trends to help you plan your perfect wedding within budget." />
        <meta property="og:image" content={GuideDownloadImage} />
        <meta property="og:url" content="https://www.savewithbidi.com/wedding-market-guide" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="2024 State of Utah Wedding Markets Guide | Bidi" />
        <meta name="twitter:description" content="Free guide with exclusive data on Utah wedding costs, vendor pricing, and spending trends to help you plan your perfect wedding within budget." />
        <meta name="twitter:image" content={GuideDownloadImage} />
        <link rel="canonical" href="https://www.savewithbidi.com/wedding-market-guide" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "2024 State of Utah Wedding Markets Guide",
              "description": "Comprehensive guide to wedding vendor pricing in Utah based on real data",
              "image": "${GuideDownloadImage}",
              "author": {
                "@type": "Organization",
                "name": "Bidi"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Bidi",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://www.savewithbidi.com/logo.png"
                }
              },
              "datePublished": "${new Date().toISOString().split('T')[0]}"
            }
          `}
        </script>
      </Helmet>

      <div className="guide-content">
        <div className="guide-header">
          <h1>2024 State of Utah <span className="highlight">Wedding Markets</span></h1>
          <p className="guide-subtitle">
            Exclusive industry insights, trends, and data for wedding vendors and couples
          </p>
        </div>

        <div className="guide-sections">
          <div className="guide-info">
            <h2>What You'll Learn:</h2>
            <ul className="guide-benefits">
              <li>✓ Latest wedding spending trends by category</li>
              <li>✓ Regional price comparisons across Utah</li>
              <li>✓ What vendors will cost for you based on real bid data</li>
            </ul>

            <div className="guide-cta">
              {!isSubmitted ? (
                <div className="email-form-container">
                  <h3>Get Instant Access</h3>
                  <p>Enter your email to download the free guide</p>
                  
                  {error && <p className="error-message">{error}</p>}
                  
                  <form onSubmit={handleSubmit} className="email-form">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      required
                      className="email-input"
                      disabled={isLoading}
                    />
                    <button 
                      type="submit" 
                      className="submit-button"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Get My Free Guide'}
                    </button>
                  </form>
                  <p className="privacy-note">
                    We respect your privacy. Unsubscribe anytime.
                  </p>
                </div>
              ) : (
                <div className="download-section">
                  <h3>Your Guide Is Ready!</h3>
                  <p>Thank you for subscribing to our newsletter!</p>
                  <button 
                    onClick={handleDownload} 
                    className="download-button"
                  >
                    Download Guide Now
                  </button>
                  <p className="thank-you-note">
                    Check your inbox for more wedding insights and exclusive offers from Bidi.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="guide-preview">
            <img 
              src={GuideDownloadImage} 
              alt="State of Wedding Markets Guide Preview" 
              className="guide-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeddingMarketGuide;
