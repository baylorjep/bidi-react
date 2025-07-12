import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import posthog from 'posthog-js';
import CorporateRotatingText from './Layout/CorporateRotatingText';
import LandingPagePhoto from '../../src/assets/images/pexels-bertellifotografia-17057017.jpg';
import LandingPagePhoto2 from '../../src/assets/images/pexels-edotommo99-3249760.jpg';
import LandingPagePhoto3 from '../../src/assets/images/pexels-jibarofoto-2774556.jpg';
import LandingPagePhoto4 from '../../src/assets/images/pexels-bertellifotografia-2608517.jpg';
import LandingPagePhoto5 from '../../src/assets/images/pexels-thatguycraig000-2306281.jpg';
import LandingPagePhoto6 from '../../src/assets/images/pexels-mat-brown-150387-1395964.jpg';
import WhyBidiPhoto from '../../src/assets/images/Icons/input-search.svg';
import WhyBidiPhoto2 from '../../src/assets/images/Icons/people.svg';
import WhyBidiPhoto3 from '../../src/assets/images/Icons/cash-coin.svg';
import UserReviews from './UserReviews';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import '../styles/animations.css';
import '../styles/demo.css';
import '../styles/CorporateHomepage.css';
import { Helmet } from 'react-helmet';
import AnimatedNumber from './AnimatedNumber';
import VendorManager from './WeddingPlanner/VendorManager';

// Initialize PostHog for client-side tracking
posthog.init('phc_I6vGPSJc5Uj1qZwGyizwTLCqZyRqgMzAg0HIjUHULSh', {
    api_host: 'https://us.i.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
  });

// Demo component with fake corporate event data
function VendorManagerDemo() {
  const fakeCorporateData = {
    id: 'demo-corporate-123',
    user_id: 'demo-corporate-456',
    wedding_date: '2024-06-15',
    budget: 50000,
    guest_count: 200,
    venue: 'Downtown Conference Center',
    wedding_title: 'Corporate Conference 2024',
    created_at: '2024-01-15T10:00:00Z'
  };

  const fakeVendors = [
    {
      id: 'vendor-1',
      wedding_id: 'demo-corporate-123',
      name: 'Elite Corporate Catering',
      category: 'catering',
      contact_info: 'email: info@elitecatering.com, phone: (555) 123-4567, website: www.elitecatering.com',
      notes: 'Specializes in corporate events and conferences. Excellent track record with Fortune 500 companies.',
      pricing: '$45 - $65 per person',
      rating: 5,
      is_booked: false,
      status: 'confirmed',
      created_at: '2024-01-20T14:30:00Z',
      updated_at: '2024-01-25T09:15:00Z'
    }
  ];

  const fakeBids = [
    {
      id: 'bid-1',
      request_id: 'catering-request-1',
      user_id: 'business-1',
      bid_amount: 12000,
      description: 'Premium corporate catering package for 200 guests. Includes appetizers, main course, dessert, and beverage service. Professional staff included.',
      status: 'approved',
      interest_rating: 5,
      client_notes: 'Excellent reputation in corporate events. Great portfolio with similar company sizes.',
      viewed: true,
      created_at: '2024-01-25T10:30:00Z',
      business_profiles: {
        id: 'business-1',
        business_name: 'Elite Corporate Catering',
        membership_tier: 'premium',
        google_calendar_connected: true,
        profile_image: '/images/default.jpg'
      },
      service_requests: {
        category: 'catering',
        table: 'catering_requests'
      }
    },
    {
      id: 'bid-2',
      request_id: 'catering-request-1',
      user_id: 'business-2',
      bid_amount: 15000,
      description: 'Luxury corporate catering with custom menu options, premium bar service, and dedicated event coordinator. Includes setup and cleanup.',
      status: 'interested',
      interest_rating: 4,
      client_notes: 'High-end service but over budget. Great for executive events.',
      viewed: false,
      created_at: '2024-01-26T14:20:00Z',
      business_profiles: {
        id: 'business-2',
        business_name: 'Premier Corporate Events',
        membership_tier: 'premium',
        google_calendar_connected: true,
        profile_image: '/images/default.jpg'
      },
      service_requests: {
        category: 'catering',
        table: 'catering_requests'
      }
    },
    {
      id: 'bid-3',
      request_id: 'catering-request-1',
      user_id: 'business-3',
      bid_amount: 9000,
      description: 'Standard corporate catering package with buffet service, coffee/tea station, and basic beverage service. Perfect for budget-conscious companies.',
      status: 'pending',
      interest_rating: 3,
      client_notes: 'Good value, need to see more corporate event examples.',
      viewed: false,
      created_at: '2024-01-27T09:15:00Z',
      business_profiles: {
        id: 'business-3',
        business_name: 'Corporate Catering Solutions',
        membership_tier: 'standard',
        google_calendar_connected: false,
        profile_image: '/images/default.jpg'
      },
      service_requests: {
        category: 'catering',
        table: 'catering_requests'
      }
    }
  ];

  const fakeRequests = [
    {
      id: 'catering-request-1',
      type: 'catering',
      event_type: 'corporate',
      event_date: '2024-06-15',
      price_range: '8,000-15,000',
      status: 'open',
      isOpen: true,
      isNew: true,
      viewCount: 8,
      totalBusinessCount: 25,
      created_at: '2024-01-20T08:00:00Z',
      user_id: 'demo-corporate-456'
    }
  ];

  // Mock the VendorManager with fake data
  return (
    <div className="vendor-manager-demo">
      <div className="demo-header-bar">
        <div className="demo-status">
          <span className="demo-badge">DEMO</span>
          <span className="demo-text">This is a preview of your actual dashboard</span>
        </div>
      </div>
      
      <div className="demo-vendor-manager-content">
        <VendorManager 
          weddingData={fakeCorporateData}
          onUpdate={() => {}} // No-op for demo
          compact={false}
          demoMode={true}
          demoVendors={fakeVendors}
          demoBids={fakeBids}
          demoRequests={fakeRequests}
        />
      </div>
    </div>
  );
}
  
function CorporateHomepage() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const reviewSliderRef = useRef(null);
  const [scrollAmount, setScrollAmount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(null);
  const [stats, setStats] = useState({
    users: 0,
    vendors: 0,
    bids: 0
  });

  useEffect(() => {
    const fetchSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);

        // Fetch the user's profile to get the role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile) setRole(profile.role);
      }
    };

    fetchSessionAndRole();

    // Capture a page view only once on mount
    posthog.capture('page_view', {
      distinctId: user?.id || 'anonymous',
      url: window.location.href,
      page_title: document.title,
    });
  }, []);

  useEffect(() => {
    if (reviewSliderRef.current) {
      const totalWidth = reviewSliderRef.current.scrollWidth;
      const cardCount = reviewSliderRef.current.children.length;
      setScrollAmount(totalWidth / cardCount);
    }
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get users count (excluding vendors)
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .eq('role', 'individual');

        // Get vendors count
        const { count: vendorsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .eq('role', 'business');

        // Get bids count
        const { count: bidsCount } = await supabase
          .from('bids')
          .select('*', { count: 'exact' });

        setStats({
          users: usersCount || 0,
          vendors: vendorsCount || 0,
          bids: bidsCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    
    // Optional: Set up real-time subscription
    const subscription = supabase
      .channel('stats_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchStats)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Add refs for each section
  const [mastheadRef, mastheadVisible] = useIntersectionObserver();
  const [connectRef, connectVisible] = useIntersectionObserver();
  const [whyBidiRef, whyBidiVisible] = useIntersectionObserver();
  const [howToRef, howToVisible] = useIntersectionObserver();
  const [reviewsRef, reviewsVisible] = useIntersectionObserver();
  const [newsletterRef, newsletterVisible] = useIntersectionObserver();
  const [tryNowRef, tryNowVisible] = useIntersectionObserver();
  const [faqRef, faqVisible] = useIntersectionObserver();
  const [guaranteeRef, guaranteeVisible] = useIntersectionObserver();

  const toggleAnswer = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <>
      <Helmet>
        <title>Corporate Event Planning Made Simple | Bidi</title>
        <meta name="description" content="Bidi streamlines corporate event planning with verified vendors and instant quotes. Get bids within hours, not days. Protected by our No Ghosting Guarantee." />
        <meta name="keywords" content="corporate events, event planning, corporate catering, event vendors, conference planning, business events, corporate services" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "url": "https://www.savewithbidi.com/",
                  "name": "Bidi Corporate Events",
                  "description": "Bidi is a bidding platform for corporate event planning where you request services and pre-screened professionals bid to provide personalized service. Get quotes within hours, not days."
                },
                {
                  "@type": "Organization",
                  "name": "Bidi",
                  "url": "https://www.savewithbidi.com/",
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": "385-216-9587",
                    "contactType": "customer service",
                    "email": "savewithbidi@gmail.com"
                  },
                  "description": "Bidi connects businesses with pre-screened, professional event vendors through a smart bidding system that ensures competitive pricing and reliable service for corporate events."
                }
              ]
            }
          `}
        </script>
        <meta name="p:domain_verify" content="a66ee7dfca93ec32807ee19ea2319dca"/>
      </Helmet>
      
      <div ref={mastheadRef} className={`masthead-index fade-in-section ${mastheadVisible ? 'is-visible' : ''}`}>
        <div className='text-section'>
          <h1 className='landing-page-title heading-reset'>
            <CorporateRotatingText /> <br></br> That Bid On Your Event
          </h1>
          <h2 className='landing-page-subtitle heading-reset' style={{marginTop:'20px'}}>
            Stop wasting time calling vendors and waiting for quotes. With Bidi, you post your corporate event needs 
            and receive competitive bids within hours from verified, professional vendors. 
          </h2>
          <div className='landing-page-button-container'>
            {user ? (
              role === 'individual' ? (
                <Link to="/individual-dashboard" onClick={() => posthog.capture('client_dashboard')}>
                  <button className='landing-page-button'>See Your Bids</button>
                </Link>
              ) : role === 'business' ? (
                <Link to="/business-dashboard" onClick={() => posthog.capture('vendor_dashboard')}>
                  <button className='landing-page-button'>See Requests</button>
                </Link>
              ) : (
                role === 'both' ? (
                  <Link to="/wedding-planner-dashboard">
                    <button className='landing-page-button'>See Dashboard</button>
                  </Link>
                ) :
                <Link to="/signin">
                  <button className='landing-page-button'>Get Started</button>
                </Link>
              )
            ) : (
              <Link to="/request-categories" onClick={() => posthog.capture('corporate_signup_button_click')}>
                <button className='landing-page-button'>Get Corporate Quotes</button>
              </Link>
            )}
          </div>
          <div className='stat-container'>
            <div className='stat-box'>
              <div className='stat-title-homepage'>Vendors</div>
              <div className='stat-homepage'>
                <AnimatedNumber value={stats.vendors} />
              </div>
            </div>
            <div className='stat-box final'>
              <div className='stat-title-homepage'>Bids</div>
              <div className='stat-homepage'>
                <AnimatedNumber value={stats.bids} />
              </div>
            </div>
          </div>
        </div>

        <div className="pink-splotch"></div>

        <div className='photo-section'>
          <img src={LandingPagePhoto} className='photo-item' style={{objectFit:'cover'}}></img>
          <img src={LandingPagePhoto2} className='photo-item offset' style={{objectFit:'cover'}}></img>
          <img src={LandingPagePhoto3} className='photo-item' style={{objectFit:'cover'}}></img>
          <img src={LandingPagePhoto4} className='photo-item' style={{objectFit:'cover'}}></img>
          <img src={LandingPagePhoto5} className='photo-item offset' style={{objectFit:'cover'}}></img>
          <img src={LandingPagePhoto6} className='photo-item' style={{objectFit:'cover'}}></img>
        </div>
      </div>

      <div ref={connectRef} className={`connect-section fade-in-section ${connectVisible ? 'is-visible' : ''}`}>
        <div style={{display:'flex', flexDirection:'column', gap:'20px'}}> 
          <div className='connect-sub-title'>Fast Quotes</div>
          <div className='connect-title'>Get Bids Within <br></br><span className='connect-highlight'>Hours, Not Days</span></div>
          <div className='connect-text'>Stop waiting for vendor responses. Post your corporate event needs and receive competitive bids within hours from verified professionals. No more endless phone calls or waiting days for quotes.</div>
          <Link to="/request-categories" style={{textDecoration:'none'}}>
            <button className='connect-button'>Get Quotes Now</button>
          </Link>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:'20px'}}> 
          <div className='connect-sub-title'>Verified Program</div>
          <div className='connect-title'>Quality Vendors <br></br><span className='connect-highlight'>You Can Trust</span></div>
          <div className='connect-text'>Our verified vendors have been thoroughly vetted by our team. Look for the verified checkmark to identify vendors who have completed our verification process, including business credentials, insurance verification, and client testimonials.</div>
          <Link to="/request-categories" style={{textDecoration:'none'}}>
            <button className='connect-button'>Find Verified Vendors</button>
          </Link>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:'20px'}}> 
          <div className='connect-sub-title'>Protected</div>
          <div className='connect-title'>No Ghosting <br></br><span className='connect-highlight'>Guarantee</span></div>
          <div className='connect-text'>Your corporate events are protected by our No Ghosting Guarantee. If a vendor becomes unresponsive or cancels without good reason, we'll refund your payment and help you find a replacement vendor quickly.</div>
          <Link to="/no-ghosting-guarantee" style={{textDecoration:'none'}}>
            <button className='connect-button'>Learn More</button>
          </Link>
        </div>
      </div>

      <div ref={whyBidiRef} className={`why-bidi-section fade-in-section ${whyBidiVisible ? 'is-visible' : ''}`}>
        <div className='why-bidi'>
          Streamlining Corporate Event Planning
        </div>
        <div className='reasons-why'>
          <div className='reason'>
            <img className='reason-photo' src={WhyBidiPhoto}></img>
            <div className='reason-title'>Save Time & Resources</div>
            <div className='reason-box'>Stop spending hours calling vendors and waiting for quotes. With Bidi, you post your corporate event requirements once and receive multiple competitive bids within hours. Our streamlined process saves your team valuable time and resources.</div>
          </div>
          <div className='reason'>
            <img className='reason-photo' src={WhyBidiPhoto2}></img>
            <div className='reason-title'>Verified Quality Vendors</div>
            <div className='reason-box'>Our verification program ensures you can identify trusted vendors with the verified checkmark. These vendors have been thoroughly vetted for business credentials, insurance, and proven track record with corporate clients.</div>
          </div>
          <div className='reason'>
            <img className='reason-photo' src={WhyBidiPhoto3}></img>
            <div className='reason-title'>Risk-Free Planning</div>
            <div className='reason-box'>Your corporate events are protected by our No Ghosting Guarantee. If a vendor becomes unresponsive or cancels without good reason, we'll refund your payment and help you find a replacement vendor quickly, ensuring your event stays on track.</div>
          </div>
        </div>
      </div>

      {/* Combined How It Works + Demo Section */}
      <div ref={howToRef} className={`how-to-use-section fade-in-section ${howToVisible ? 'is-visible' : ''}`}>
        <div className='how-to-text'>
          <div className='how-to-sub-title'>Simple and efficient.</div>
          <div className='how-to-title'>How It Works</div>
          <div className='how-to-description'>
            See how Bidi connects you with verified vendors who bid on your corporate event needs. 
            Compare bids, manage everything in one place, and plan with confidence!
          </div>
          
          {/* Step 1 */}
          <div className='how-to-number'>1</div>
          <div className='step-container'>
            <div className='step-title'>Post Your Corporate Event Needs</div>
            <div className='step-sub-title'>
              Describe your event requirements, budget, and timeline in one simple form.
            </div>
          </div>

          {/* Step 2 */}
          <div className='how-to-number'>2</div>
          <div className='step-container'>
            <div className='step-title'>Receive Bids Within Hours</div>
            <div className='step-sub-title'>
              Get competitive quotes from verified vendors who understand corporate requirements.
            </div>
          </div>

          {/* Step 3 */}
          <div className='how-to-number'>3</div>
          <div className='step-container'>
            <div className='step-title'>Compare and Choose</div>
            <div className='step-sub-title'>
              Review detailed proposals, vendor credentials, and choose the best fit for your event.
            </div>
          </div>

          {/* Step 4 */}
          <div className='how-to-number'>4</div>
          <div className='step-container'>
            <div className='step-title'>Book with Confidence</div>
            <div className='step-sub-title'>
              Secure your vendor with our No Ghosting Guarantee protecting your investment.
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className='demo-container'>
          <div className='demo-content'>
            <div className='demo-vendor-manager'>
              <VendorManagerDemo />
            </div>
          </div>
          
          <div className='demo-footer'>
            <div className='demo-cta'>
              <h3>Ready to Streamline Your Event Planning?</h3>
              <p>Join hundreds of companies who are already planning successful corporate events with Bidi.</p>
              <Link to="/request-categories" style={{textDecoration:'none'}}>
                <button className='demo-cta-button'>Start Planning Now</button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* No Ghosting Guarantee Section */}
      <div ref={guaranteeRef} className={`guarantee-section fade-in-section ${guaranteeVisible ? 'is-visible' : ''}`}>
        <div className='guarantee-content'>
          <div className='guarantee-icon'>👻</div>
          <div className='guarantee-title'>No Ghosting Guarantee</div>
          <div className='guarantee-description'>
            Your corporate events are protected. If a vendor becomes unresponsive or cancels without good reason, 
            we'll refund your payment and help you find a replacement vendor quickly.
          </div>
          <Link to="/no-ghosting-guarantee" style={{textDecoration:'none'}}>
            <button className='guarantee-button'>Learn More About Our Guarantee</button>
          </Link>
        </div>
      </div>

      <div ref={faqRef} className={`faq-container fade-in-section ${faqVisible ? 'is-visible' : ''}`}>
        <div className='faq-title'>Frequently Asked Questions</div>
        
        {/* FAQ Items */}
        {[
          { question: "Is Bidi free to use for corporate events?", answer: "Yes! Posting requests and receiving bids are completely free for businesses." },
          { question: "How quickly will I get bids?", answer: "Most corporate event requests receive bids within 2-4 hours during business hours." },
          { question: "What types of corporate events can you help with?", answer: "We handle conferences, meetings, corporate parties, training events, product launches, and more." },
          { question: "Are the vendors verified?", answer: "Our verified vendors (marked with a checkmark) have been thoroughly vetted by our team. Look for the verified badge to identify vendors who have completed our verification process." },
          { question: "What if a vendor cancels last minute?", answer: "Our No Ghosting Guarantee protects you. We'll refund your payment and help you find a replacement vendor quickly." },
          { question: "Can I get multiple quotes for the same event?", answer: "Absolutely! You'll receive bids from multiple vendors so you can compare services and pricing." },
        ].map((item, index) => (
          <div className='faq-item' key={index} onClick={() => toggleAnswer(index)}>
            <div className='faq-question'>{item.question}</div>
            {activeIndex === index && <div className='faq-answer'>{item.answer}</div>}
          </div>
        ))}
      </div>

      <section 
        ref={reviewsRef} 
        className={`fade-in-section ${reviewsVisible ? 'is-visible' : ''}`} 
        id="user-reviews"
      >
        <UserReviews />
      </section>

      <div ref={tryNowRef} className={`try-now-container fade-in-section ${tryNowVisible ? 'is-visible' : ''}`}>
        <div className='try-now-box'>
          <div className='try-now-title'>Ready to Streamline Your Event Planning? <span className='try-now-highlight'>Join Bidi Today</span></div>
          <div className='try-now-subtitle'>Hundreds of companies are already planning successful corporate events with Bidi. Don't miss out on stress-free vendor selection.</div>
          <Link to="/request-categories" style={{textDecoration:'none'}}>
            <button className='try-now-button'>Get Started Free</button>
          </Link>
        </div>
      </div>

      <div ref={newsletterRef} className={`newsletter-section fade-in-section ${newsletterVisible ? 'is-visible' : ''}`}>
        <div style={{display:'flex', flexDirection:'column', gap:'20px', alignItems:'center'}}>
          <div className='newsletter-title'>Are You An Event Vendor?</div>
          <div className="newsletter-subtitle">Join Bidi to access corporate clients and grow your business—only pay for the bids you win!</div>
        </div>
 
        <div className='newsletter-button-container'>
          <Link className="newsletter-button" to="/for-vendors">
            <div>Learn More</div>
          </Link>
        </div>
      </div>
    </>
  );
}

export default CorporateHomepage; 