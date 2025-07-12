import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Ensure this path is correct
import { Link } from 'react-router-dom';
import posthog from 'posthog-js';
import RotatingText from './Layout/RotatingText';
import LandingPagePhoto from '../../src/assets/images/Landing Page Photo.jpg';
import LandingPagePhoto2 from '../../src/assets/images/Landing Page Photo 2.jpg';
import LandingPagePhoto3 from '../../src/assets/images/Landing Page Photo 3.jpg';
import LandingPagePhoto4 from '../../src/assets/images/Landing Page Photo 4.jpg';
import LandingPagePhoto5 from '../../src/assets/images/Landing Page Photo 5.jpg';
import LandingPagePhoto6 from '../../src/assets/images/Landing Page Photo 6.jpg';
import WhyBidiPhoto from '../../src/assets/images/Icons/input-search.svg';
import WhyBidiPhoto2 from '../../src/assets/images/Icons/people.svg';
import WhyBidiPhoto3 from '../../src/assets/images/Icons/cash-coin.svg';
import UserReviews from './UserReviews';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import '../styles/animations.css';
import '../styles/demo.css';
import { Helmet } from 'react-helmet';
import rusticWedding from '../assets/quiz/rustic/rustic-wedding.jpg';
import AnimatedNumber from './AnimatedNumber';
import VendorManager from './WeddingPlanner/VendorManager';

// Initialize PostHog for client-side tracking
posthog.init('phc_I6vGPSJc5Uj1qZwGyizwTLCqZyRqgMzAg0HIjUHULSh', {
    api_host: 'https://us.i.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
  });

// Demo component with fake data
function VendorManagerDemo() {
  const fakeWeddingData = {
    id: 'demo-wedding-123',
    user_id: 'demo-user-456',
    wedding_date: '2024-06-15',
    budget: 25000,
    guest_count: 150,
    venue: 'The Grand Ballroom',
    created_at: '2024-01-15T10:00:00Z'
  };

  const fakeVendors = [
    {
      id: 'vendor-1',
      wedding_id: 'demo-wedding-123',
      name: 'Sarah Johnson Photography',
      category: 'photography',
      contact_info: 'email: sarah@johnsonphoto.com, phone: (555) 123-4567, website: www.johnsonphoto.com',
      notes: 'Beautiful portfolio, specializes in natural light photography. Very responsive to messages.',
      pricing: '$2,500 - $3,200',
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
      request_id: 'photo-request-1',
      user_id: 'business-1',
      bid_amount: 2800,
      description: 'Full day coverage including engagement session, wedding day photography, and beautiful album. I specialize in natural light and candid moments.',
      status: 'approved',
      interest_rating: 5,
      client_notes: 'Love her style! Great portfolio with similar venues.',
      viewed: true,
      created_at: '2024-01-25T10:30:00Z',
      business_profiles: {
        id: 'business-1',
        business_name: 'Sarah Johnson Photography',
        membership_tier: 'premium',
        google_calendar_connected: true,
        profile_image: '/images/default.jpg'
      },
      service_requests: {
        category: 'photography',
        table: 'photography_requests'
      }
    },
    {
      id: 'bid-2',
      request_id: 'photo-request-1',
      user_id: 'business-2',
      bid_amount: 3200,
      description: 'Premium wedding photography package with drone coverage, 8 hours of shooting, and luxury album. Includes engagement session.',
      status: 'interested',
      interest_rating: 4,
      client_notes: 'Great quality but a bit over budget. Love the drone option.',
      viewed: false,
      created_at: '2024-01-26T14:20:00Z',
      business_profiles: {
        id: 'business-2',
        business_name: 'Elite Photography Studio',
        membership_tier: 'premium',
        google_calendar_connected: true,
        profile_image: '/images/default.jpg'
      },
      service_requests: {
        category: 'photography',
        table: 'photography_requests'
      }
    },
    {
      id: 'bid-3',
      request_id: 'photo-request-1',
      user_id: 'business-3',
      bid_amount: 2400,
      description: 'Complete wedding photography coverage with 6 hours of shooting, engagement session, and digital gallery. Perfect for your budget!',
      status: 'pending',
      interest_rating: 3,
      client_notes: 'Good price point, need to see more portfolio samples.',
      viewed: false,
      created_at: '2024-01-27T09:15:00Z',
      business_profiles: {
        id: 'business-3',
        business_name: 'Capture Moments Photography',
        membership_tier: 'standard',
        google_calendar_connected: false,
        profile_image: '/images/default.jpg'
      },
      service_requests: {
        category: 'photography',
        table: 'photography_requests'
      }
    },
    {
      id: 'bid-4',
      request_id: 'photo-request-1',
      user_id: 'business-4',
      bid_amount: 3800,
      description: 'Luxury wedding photography experience with 10 hours coverage, engagement session, wedding album, and parent albums. Premium service.',
      status: 'denied',
      interest_rating: 2,
      client_notes: 'Too expensive for our budget.',
      viewed: true,
      created_at: '2024-01-26T16:45:00Z',
      business_profiles: {
        id: 'business-4',
        business_name: 'Luxury Lens Photography',
        membership_tier: 'premium',
        google_calendar_connected: true,
        profile_image: '/images/default.jpg'
      },
      service_requests: {
        category: 'photography',
        table: 'photography_requests'
      }
    }
  ];

  const fakeRequests = [
    {
      id: 'photo-request-1',
      type: 'photography',
      event_type: 'wedding',
      event_date: '2024-06-15',
      price_range: '2,000-3,500',
      status: 'open',
      isOpen: true,
      isNew: true,
      viewCount: 12,
      totalBusinessCount: 45,
      created_at: '2024-01-20T08:00:00Z'
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
          weddingData={fakeWeddingData}
          onUpdate={() => {}} // No-op for demo
          compact={false}
          demoMode={true} // Add this prop to VendorManager
          demoVendors={fakeVendors}
          demoBids={fakeBids}
          demoRequests={fakeRequests}
        />
      </div>
    </div>
  );
}
  
  function Homepage() {
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
    const [quizRef, quizVisible] = useIntersectionObserver();

    const toggleAnswer = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

  return (
        <>
            <Helmet>
                <title>Affordable Wedding Vendors for Stress-Free Planning | Bidi</title>
                <meta name="description" content="Bidi simplifies wedding planning with vetted wedding vendors. Post your needs and receive tailored bids from trusted pros. Start planning your perfect day!" />
                <meta name="keywords" content="wedding services, wedding vendors, affordable weddings, wedding photography, wedding DJ, catering services, florist, wedding planning" />
                <script type="application/ld+json">
                    {`
                    
                        "@context": "https://schema.org",
                        "@graph": [
                            {
                                "@type": "WebSite",
                                "url": "https://www.savewithbidi.com/",
                                "name": "Bidi",
                                "description": "Bidi is a bidding platform where you request wedding and local services, and pre-screened professionals bid to provide personalized service. It simplifies finding the perfect wedding vendors, saving you time and effort."
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
                                "description": "Bidi connects users with pre-screened, professional wedding vendors and other service providers through a smart bidding system that ensures competitive pricing and reliable service."
                            }
                        ]
                    
                    `}
                </script>
                <meta name="p:domain_verify" content="a66ee7dfca93ec32807ee19ea2319dca"/>
            </Helmet>
            
            <div ref={mastheadRef} className={`masthead-index fade-in-section ${mastheadVisible ? 'is-visible' : ''}`}>
                <div className='text-section' >
                    <h1 className='landing-page-title heading-reset'>
                        Tired of Looking for the Perfect <br></br><RotatingText />
                    </h1>
                    <h2 className='landing-page-subtitle heading-reset' style={{marginTop:'20px'}}>
                        With Bidi, you don't have to waste time searching for the perfect businesses to help you with your wedding. 
                        All you do is tell us what you need, and we'll find the right wedding vendors for you. 
                        No more hours and hours of searching through endless listings or playing phone tag with vendors. 
                        Our platform connects you directly with pre-screened, professional wedding vendors who are ready to bring your vision to life.
                        <span style={{ display: 'block', marginTop: '15px', color: '#FF008A', fontWeight: 'bold' }}>
                            Plus, get 5% off everything when you book through Bidi! Limited time offer.
                        </span>
                    </h2>
                       <div className='landing-page-button-container'>
                            {user ? (
                                // Conditionally render different routes based on the role
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
                                // Default route if no role is found or unhandled role
                                <Link to="/signin">
                                    <button className='landing-page-button'>Get Started</button>
                                </Link>
                                )
                            ) : (
                                <Link to="/request-categories" onClick={() => posthog.capture('signup_button_click')}>
                                <button className='landing-page-button'>Start Getting Bids</button>
                                </Link>
                            )}
                        </div>
                    <div className='stat-container'>
                        {/*
                        
                        
                            <div className='stat-box' >
                                <div className='stat-title'>Users</div>
                                <div className='stat'>{stats.users}</div>
                            </div>
                        */}
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

                <div className="pink-splotch"></div> {/* Add this line */}

                <div className='photo-section'>
                    <img src={LandingPagePhoto} className='photo-item'></img>
                    <img src={LandingPagePhoto2} className='photo-item offset'></img>
                    <img src={LandingPagePhoto3} className='photo-item'></img>
                    <img src={LandingPagePhoto4} className='photo-item'></img>
                    <img src={LandingPagePhoto5} className='photo-item offset'></img>
                    <img src={LandingPagePhoto6} className='photo-item'></img>
                </div>
   
            </div>


            <div ref={connectRef} className={`connect-section fade-in-section ${connectVisible ? 'is-visible' : ''}`}>
                <div style={{display:'flex', flexDirection:'column', gap:'20px'}}> 
                    <div className='connect-sub-title'>Connect</div>
                    <div className='connect-title'>Discover Wedding Vendors <br></br><span className='connect-highlight'>Effortlessly</span></div>
                    <div className='connect-text'>Our platform simplifies the process of finding local services. Say goodbye to endless forms and hello to instant connections.  
                    Simply post your wedding needs, and Bidi does the work—matching you with the best local vendors in minutes. Plus, get 5% off everything when you book through Bidi - limited time offer!</div>
                    <Link to="/request-categories" style={{textDecoration:'none'}}>
                    <button className='connect-button'>Try Now</button>
                    </Link>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:'20px'}}> 
                    <div className='connect-sub-title'>Personalized</div>
                    <div className='connect-title'>Bids Tailored to <br></br><span className='connect-highlight'>Your Wedding</span></div>
                    <div className='connect-text'>Every bid is focused on you. Get real pricing tailored to your specific situation—no more guessing or generic quotes.  
                    With Bidi, vendors compete to give you their best offer, ensuring you get top-quality service at a price that fits your budget.</div>
                    <Link to="/request-categories" style={{textDecoration:'none'}}>
                    <button className='connect-button'>Try Now</button>
                    </Link>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:'20px'}}> 
                    <div className='connect-sub-title'>Interactive</div>
                    <div className='connect-title'>Find Your Perfect <br></br><span className='connect-highlight'>Wedding Style</span></div>
                    <div className='connect-text'>
                        Take our quick style quiz to discover your wedding aesthetic and get matched with vendors who share your vision. 
                        From classic elegance to modern chic, find your unique style in minutes!
                    </div>
                    <Link to="/wedding-vibe-quiz" style={{textDecoration:'none'}}>
                        <button className='connect-button'>Take the Quiz</button>
                    </Link>
                </div>

                
            </div>

            <div ref={whyBidiRef} className={`why-bidi-section fade-in-section ${whyBidiVisible ? 'is-visible' : ''}`}>
                <div className='why-bidi'>
                    Simplifying Your Search for Local Sercvices
                </div>
                <div className='reasons-why'>
                    <div className='reason'>
                        <img className='reason-photo'src={WhyBidiPhoto}></img>
                        <div className='reason-title'>Convenient & Easy</div>
                        <div className='reason-box'>We hate spending time looking for the perfect fit, and we think you do too. With Bidi, all you do is tell us what you want and we'll find the right service for you. Our smart matching system considers your budget, style preferences, and specific requirements to connect you with vendors who match your needs perfectly.</div>
                    </div>
                    <div className='reason'>
                        <img className='reason-photo'src={WhyBidiPhoto2}></img>
                        <div className='reason-title'>Transparent Pricing</div>
                        <div className='reason-box'>Our transparent pricing system ensures you always know exactly what you're paying for—no hidden fees, no surprises. Wedding vendors provide detailed proposals tailored to your specific needs, allowing you to compare services and prices with confidence.</div>
                    </div>
                    <div className='reason'>
                        <img className='reason-photo'src={WhyBidiPhoto3}></img>
                        <div className='reason-title'>Reliable Experts</div>
                        <div className='reason-box'>With our Bidi verified program, we connect you with local service providers that have been thoroughly vetted for reliability, professionalism, and quality of service. Each vendor undergoes a comprehensive verification process, including review of their portfolio, business credentials, and past client testimonials. You can trust that you're working with experienced professionals who will deliver on their promises.</div>
                    </div>
                </div>
            </div>

            {/* Combined How It Works + Demo Section */}
            <div ref={howToRef} className={`how-to-use-section fade-in-section ${howToVisible ? 'is-visible' : ''}`}>
                <div className='how-to-text'>
                    <div className='how-to-sub-title'>Simple and hassle-free.</div>
                    <div className='how-to-title'>How It Works</div>
                    <div className='how-to-description'>
                        See how Bidi connects you with photographers who bid on your wedding needs. 
                        Compare bids, rate your interest, and manage everything in one place!
                    </div>
                    
                    {/* Step 1 */}
                    <div className='how-to-number'>1</div>
                    <div className='step-container'>
                        <div className='step-title'>Sign Up and Create Your Profile</div>
                        <div className='step-sub-title'>
                            Connect with local service providers effortlessly, without lengthy forms.
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className='how-to-number'>2</div>
                    <div className='step-container'>
                        <div className='step-title'>Post Your Wedding Needs</div>
                        <div className='step-sub-title'>
                            Get tailored bids from wedding professionals that match your preferences.
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className='how-to-number'>3</div>
                    <div className='step-container'>
                        <div className='step-title'>Receive and Compare Bids</div>
                        <div className='step-sub-title'>
                            Relax as bids come in, and easily compare them to find the perfect match.
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className='how-to-number'>4</div>
                    <div className='step-container'>
                        <div className='step-title'>Book and Celebrate</div>
                        <div className='step-sub-title'>
                            Choose your perfect vendor, confirm the booking, and enjoy a stress-free wedding experience.
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
                            <h3>Ready to Experience This Yourself?</h3>
                            <p>Join thousands of couples who are already planning their perfect wedding with Bidi.</p>
                            <Link to="/request-categories" style={{textDecoration:'none'}}>
                                <button className='demo-cta-button'>Start Planning Now</button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

<div ref={faqRef} className={`faq-container fade-in-section ${faqVisible ? 'is-visible' : ''}`}>
    <div className='faq-title'>Frequently Asked Questions</div>
    
    {/* FAQ Items */}
    {[
        { question: "Is Bidi free to use?", answer: "Yes! Posting requests and receiving bids are completely free for couples." },
        { question: "How quickly will I get bids?", answer: "Most users start receiving bids within 30 minutes." },
        { question: "Can I choose multiple vendors?", answer: "Absolutely! You can receive bids from multiple vendors and choose the one that best fits your needs." },
        { question: "What types of services can I find on Bidi?", answer: "Bidi connects you with a variety of wedding vendors, including photographers, caterers, florists, and more." },
        { question: "How do I contact a vendor?", answer: "Once you receive bids, you can directly contact the vendors through our platform to discuss your needs." },
        { question: "What if I have more questions?", answer: "Feel free to reach out to our support team for any additional questions or concerns." },
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
            <div className='try-now-title'>Ready to Save Time and Money? <span className='try-now-highlight'>Join Bidi Today</span></div>
            <div className='try-now-subtitle'>Over 390 users are already finding their perfect wedding vendors. Don't miss out on stress-free hiring.</div>
            <Link to="/request-categories" style={{textDecoration:'none'}}>
            <button className='try-now-button'>Get Started Free</button>
            </Link>
          </div>
        </div>

        <div ref={newsletterRef} className={`newsletter-section fade-in-section ${newsletterVisible ? 'is-visible' : ''}`}>
            <div style={{display:'flex', flexDirection:'column', gap:'20px', alignItems:'center'}}>
            <div className='newsletter-title'>Are You A Wedding Vendor?</div>
            <div className="newsletter-subtitle">Join Bidi to access hundreds of clients and grow your business—only pay for the bids you win!</div>
            </div>
 
            <div className='newsletter-button-container'>
                <Link className="newsletter-button"to="/for-vendors">
                    <div>Learn More</div>
                </Link>
            </div>

        </div>
    </>
  );
}

export default Homepage;