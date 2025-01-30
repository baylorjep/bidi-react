import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Ensure this path is correct
import { Link } from 'react-router-dom';
import videoSrc from '../assets/images/Landing Page Video 3.mov'; // Import the video
import quoteIcon from '../assets/images/Icons/“.png';
import jennaferIcon from '../assets/images/Jennafer Profile.png';
import jaronIcon from '../assets/images/Jaron Anderson.jpg';
import starIcon from '../assets/images/Star.svg'
import scrollBtn from '../assets/images/Icons/scroll button.png';
import IphoneFrame from '../assets/images/Iphone 14 - 1.png';
import statusBar from '../assets/images/iPhone 13.png';
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

// Initialize PostHog for client-side tracking
posthog.init('phc_I6vGPSJc5Uj1qZwGyizwTLCqZyRqgMzAg0HIjUHULSh', {
    api_host: 'https://us.i.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
  });
  
  function Homepage() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const reviewSliderRef = useRef(null);
    const [scrollAmount, setScrollAmount] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
  
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
  

    // Add refs for each section
    const [mastheadRef, mastheadVisible] = useIntersectionObserver();
    const [connectRef, connectVisible] = useIntersectionObserver();
    const [whyBidiRef, whyBidiVisible] = useIntersectionObserver();
    const [howToRef, howToVisible] = useIntersectionObserver();
    const [reviewsRef, reviewsVisible] = useIntersectionObserver(); // Add this line
    const [newsletterRef, newsletterVisible] = useIntersectionObserver();
    const [tryNowRef, tryNowVisible] = useIntersectionObserver();

  return (
        <>
            
            <div ref={mastheadRef} className={`masthead-index fade-in-section ${mastheadVisible ? 'is-visible' : ''}`}>
                <div className='text-section' >
                    <div className='landing-page-title'>
                        Tired of Looking for the Perfect <RotatingText />
                    </div>
                    <div className='landing-page-subtitle' style={{marginTop:'20px'}}>
                    With Bidi, you don’t have to waste time searching for the perfect businesses to help you with your event. 
                    All you do is tell us what you need, and we’ll find the right business for you. 
                    No more hours and hours of searching. 
                    </div>
                       <div className='landing-page-button-container'>
                            {user ? (
                                // Conditionally render different routes based on the role
                                role === 'individual' ? (
                                <Link to="/my-bids" onClick={() => posthog.capture('client_dashboard')}>
                                    <button className='landing-page-button'>See Your Bids</button>
                                </Link>
                                ) : role === 'business' ? (
                                <Link to="/dashboard" onClick={() => posthog.capture('vendor_dashboard')}>
                                    <button className='landing-page-button'>See Open Requests</button>
                                </Link>
                                ) : (
                                // Default route if no role is found or unhandled role
                                <Link to="/dashboard">
                                    <button className='landing-page-button'>Get Started</button>
                                </Link>
                                )
                            ) : (
                                <Link to="/signup" onClick={() => posthog.capture('signup_button_click')}>
                                <button className='landing-page-button'>Start Now</button>
                                </Link>
                            )}
                        </div>
                    <div className='stat-container'>
                            <div className='stat-box' >
                                <div className='stat-title'>Requests</div>
                                <div className='stat'>100+</div>
                            </div>
                            <div className='stat-box'>
                                <div className='stat-title'>Users</div>
                                <div className='stat'>330+</div>
                            </div>
                            <div className='stat-box final'>
                                <div className='stat-title'>Bids</div>
                                <div className='stat'>750+</div>
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
                    <div className='connect-text'>Our platform simplifies the process of finding local services. Say goodbye to endless forms and hello to instant connections.</div>
                    <button className='connect-button'>Try Now</button>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:'20px'}}> 
                    <div className='connect-sub-title'>Personalized</div>
                    <div className='connect-title'>Bids Tailored to <br></br><span className='connect-highlight'>Your Wedding</span></div>
                    <div className='connect-text'>Every bid is focused on you. Get real pricing tailored to your specific situation. No more general quotes, just bids, made for you.</div>
                    <button className='connect-button'>Try Now</button>
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
                        <div className='reason-box'>We hate spending time looking for the perfect fit, and we think you do too. With Bidi, all you do is tell us what you want and we’ll find the right service for you. </div>
                    </div>
                    <div className='reason'>
                        <img className='reason-photo'src={WhyBidiPhoto2}></img>
                        <div className='reason-title'>Competitive Pricing</div>
                        <div className='reason-box'>Our revolutionary bidding system forces companies to directly compete with each other for your business. Meaning you get the best price, every time. </div>
                    </div>
                    <div className='reason'>
                        <img className='reason-photo'src={WhyBidiPhoto3}></img>
                        <div className='reason-title'>Reliable Experts</div>
                        <div className='reason-box'>With our Bidi verified program. We connect you with local service providers that have been verified to be reliable, communicative, and professional</div>
                    </div>
                </div>
            </div>

            <div ref={howToRef} className={`how-to-use-section fade-in-section ${howToVisible ? 'is-visible' : ''}`}>
                <div className='how-to-text'>
                    <div className='how-to-sub-title'>Simple and hassle-free.</div>
                    <div className='how-to-title'>How It Works</div>
                    <div className='how-to-number'>1</div>
                    <div className='step-container'>
                        <div className='step-title'>Sign Up and Create Your Profile</div>
                        <div className='step-sub-title'>Connect with local service providers effortlessly, without lengthy forms.</div>
                    </div>
                    <div className='how-to-number'>2</div>
                    <div className='step-container'>
                        <div className='step-title'>Post Your Wedding Needs</div>
                        <div className='step-sub-title'>Get tailored bids from wedding professionals that match your preferences.</div>
                    </div>
                    <div className='how-to-number'>3</div>
                    <div className='step-container'>
                        <div className='step-title'>Receive and Compare Bids</div>
                        <div className='step-sub-title'>Relax as bids come in, and easily compare them to find the perfect match.</div>
                    </div>
                    <div className='landing-page-button-container'>
                        <Link  to="/signin">
                            <button className="landing-page-button" style={{ width: "150px", textDecoration:'none', alignItems:'center', justifyContent:'center', marginLeft:'0' }}>Try Now</button>
                        </Link>
                    </div>
                </div>
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
            <div className='try-now-subtitle'>Over 270 users are already finding their perfect wedding vendors. Don't miss out on stress-free hiring.</div>
            <button className='try-now-button'>Get Started Free</button>
          </div>
        </div>

        <div ref={newsletterRef} className={`newsletter-section fade-in-section ${newsletterVisible ? 'is-visible' : ''}`}>
            <div style={{display:'flex', flexDirection:'column', gap:'20px', alignItems:'center'}}>
            <div className='newsletter-title'>Are You A Wedding Vendor?</div>
            <div className="newsletter-subtitle">Join Bidi to access hundreds of clients and grow your business—only pay for the bids you win!</div>
            </div>
 
            <div className='newsletter-button-container'>
                <Link className="newsletter-button"to="/signin">
                    <div>Sign Up</div>
                </Link>
            </div>

        </div>
    </>
  );
}

export default Homepage;