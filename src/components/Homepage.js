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


// Initialize PostHog for client-side tracking
posthog.init('phc_I6vGPSJc5Uj1qZwGyizwTLCqZyRqgMzAg0HIjUHULSh', {
  api_host: 'https://us.i.posthog.com',
  loaded: (posthog) => {
    if (process.env.NODE_ENV === 'development') posthog.debug();
  },
});



function Homepage() {
    const [user, setUser] = useState(null);
    const reviewSliderRef = useRef(null);
    const reviewCardRef = useRef(null); // Ref for measuring the full width of a review card
    const [scrollAmount, setScrollAmount] = useState(0);
  
    useEffect(() => {
      const fetchSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
        }
      };
  
      fetchSession();
  
      // Capture a page view when the component mounts
      posthog.capture('page_view', {
        distinctId: user?.id || 'anonymous',
        url: window.location.href,
        page_title: document.title,
      });
  
    // Calculate exact scroll width for each card
    if (reviewSliderRef.current) {
        const reviewCards = reviewSliderRef.current.children;
        if (reviewCards.length > 0) {
          // Calculate the width of one review card (including margins)
          const totalWidth = reviewSliderRef.current.scrollWidth;
          const cardCount = reviewCards.length;
          setScrollAmount(totalWidth / cardCount);
        }
      }
    }, [user]);
  
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
                    <div className='landing-page-title'>Make a Request For a</div>
                        <RotatingText />
                    <div className='landing-page-title' >And Get Bids</div>
                    
                    
                    <div className='landing-page-subtitle' style={{marginTop:'20px'}}>
                        Bidi is a platform where customers make requests for services and local businesses bid on those services. With Bidi, you don’t have to waste time searching for the perfect businesses to help you. All you do is tell us what you need, and we’ll find the right business for you. No more hours and hours of searching.
                    </div>
                    <div className='landing-page-button-container'>
                        <Link to="/signup" onClick={() => posthog.capture('signup_button_click')}>
                            <button className='landing-page-button'>Get Started</button>
                        </Link>
                
                    </div>
                </div>
   
            </div>

            <div className="how-to-use-section">
            <div className='how-to-phone'>
                <div className="phone-frame">
                    <img src={IphoneFrame} alt="iPhone frame" className="iphone-frame-img" />
                    <img src={statusBar} alt="Status bar" className="status-bar-img" />
                    <div className='phone-screen'>
                        <video src={videoSrc} type="video/mp4" autoPlay muted loop playsInline />
                    </div>
                </div>
            </div>

                <div className='how-to-text'>
                    <div className='how-to-title'>How do I use Bidi?</div>
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

            <div className="why-bidi-section">
            <div className='why-bidi'>
                Why Choose Bidi?
            </div>
            <div className='reasons-why'>
                <div className='reason'>
                    <div className='reason-title'>Convenient & Easy</div>
                    <div className='reason-box'>We hate spending time looking for the perfect fit, and we think you do too. With Bidi, all you do is tell us what you want and we’ll find the right service for you. </div>
                </div>
                <div className='reason'>
                    <div className='reason-title'>Competitive Pricing</div>
                    <div className='reason-box'>Our revolutionary bidding system forces companies to directly compete with each other for your business. Meaning you get the best price, every time. </div>
                </div>
                <div className='reason'>
                    <div className='reason-title'>Reliable Experts</div>
                    <div className='reason-box'>At Bidi, we connect you with local service providers that have been verified to be reliable, communicative, and professional. That way, you only get the best.</div>
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
