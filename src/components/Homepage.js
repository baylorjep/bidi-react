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
  
    const scrollReviews = (direction) => {
      if (reviewSliderRef.current) {
        reviewSliderRef.current.scrollBy({
          left: direction === 'right' ? scrollAmount : -scrollAmount,
          behavior: 'smooth',
        });
      }
    };

  return (
        <>
            
            <div className="masthead-index">
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
                    <div style={{marginTop:'40px', display:'flex', justifyContent:'left', gap:'40px'}}>
                            <div style={{display:'flex', flexDirection:'column', borderRight:'2px solid black', paddingRight:'20px', alignItems:'center'}} >
                                <div className='stat-title'>Requests</div>
                                <div className='stat'>70+</div>
                            </div>
                            <div style={{display:'flex', flexDirection:'column', borderRight:'2px solid black', paddingRight:'20px', alignItems:'center'}} >
                                <div className='stat-title'>Users</div>
                                <div className='stat'>270+</div>
                            </div>
                            <div style={{display:'flex', flexDirection:'column', alignItems:'center'}} >
                                <div className='stat-title'>Bids</div>
                                <div className='stat'>550+</div>
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

            <div className='connect-section'>
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

            <div className="why-bidi-section">
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

            <div className="how-to-use-section">
                <div className='how-to-text'>
                    <div className='how-to-title'>How it Works</div>
                    <div className='how-to-steps'>1. Tell us what you are looking for</div>
                    <div className='how-to-steps'>2. We will notify local businesses and they will send in bids</div>
                    <div className='how-to-steps' style={{ borderBottom: "none" }}>3. We'll send those bids to you, find the one you like and press "accept"</div>
                    <div className='try-now-button-container'>
                        <Link className="btn btn-secondary rounded-pill" style={{ width: "150px" }} to="/signin">
                            <span style={{ font: "Roboto" }}>Try Now</span>
                        </Link>
                    </div>
                </div>
        </div>




                <div className="user-reviews-section">
            <div className='user-reviews-title'>Here is what our users say about Bidi</div>
            <div className='review-slider-container'>
                <button className="scroll-btn left" onClick={() => scrollReviews('left')}>
                <img src={scrollBtn} alt="Scroll Left" />
                </button>
                <div className='review-slider' ref={reviewSliderRef}>
                <div className='large-review'>
                    <img className='quote-icon' src={quoteIcon} alt="Quote Icon" />
                    <div className='review-text'>I was looking for a roofer to fix a leak on the roof of my cabin. I put my job request on bidi when they first launched. Because bidi was brand new there were not any roofers yet. 
                        Within a day the bidi founders personally made tons of calls to find me a handful of roofers who could bid on my job. I was blown away! My 2nd experience was even better. 
                        I needed a fast turnaround for family pictures (one week). I submitted my request for a photographer to take a family photos. Within an hour of my request, I had 12 photographers post bids. 
                        Since my first experience with bidi, it has only gotten better and better. This company is going to be a game changer in the way I shop for services!</div>
        
                    <div className='star-container'>
                    <img src={starIcon}></img><img src={starIcon}></img><img src={starIcon}></img><img src={starIcon}></img><img src={starIcon}></img>
                    </div>
                    
                    <img className='profile-icon' src={jennaferIcon} alt="Jennafer's profile" /><span>  - Jennafer J.</span>
                </div>
                <div className='large-review'>
                    <img className='quote-icon' src={quoteIcon} alt="Quote Icon" />
                    <div className='review-text'>We recently used Bidi to find a cleaning service, and it was a total game-changer. 
                        With a new baby on the way, we needed all the help we could get, and Bidi made it super easy. 
                        After I submitted a quick request, I got lots of bids from different cleaning services right away. 
                        Bidi took care of all the details, saving us tons of time, and it ended up being way more affordable. 
                        If you’re looking for a quick, budget-friendly way to find a reliable service, I’d definitely recommend Bidi!</div>
                    <div className='star-container'>
                    <img src={starIcon}></img><img src={starIcon}></img><img src={starIcon}></img><img src={starIcon}></img><img src={starIcon}></img>
                    </div>
                    <img className='profile-icon' src={jaronIcon} alt="Jaron's profile" /><span>  - Jaron A.</span>
                </div>
                </div>
                <button className="scroll-btn right" onClick={() => scrollReviews('right')}>
                <img src={scrollBtn} alt="Scroll Right" />
                </button>
            </div>
            </div>

            <div className='newsletter-section'>
                <div className='newsletter-title'>Want More? Subscribe to our Newsletter</div>
                <div className="newsletter-subtitle">Bidi’s newsletter posts updates on new features, new available services, updates, and more!</div>
                <div className='newsletter-input-container'>
                    <input
                        className='newsletter-input'
                        id="email-input"
                        type="text" // or "email", "password", etc.
                        placeholder="Email"
                    />
                    <div className='newsletter-button-container'>
                        <Link className="btn btn-secondary rounded-pill" style={{ width: "150px", height: "60px" }} to="/signin">
                            <div style={{ font: "Roboto", marginTop: "10px" }}>Sign Up</div>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Homepage;
