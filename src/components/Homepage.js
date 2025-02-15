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
    const [activeIndex, setActiveIndex] = useState(null);
  
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
    const [reviewsRef, reviewsVisible] = useIntersectionObserver();
    const [newsletterRef, newsletterVisible] = useIntersectionObserver();
    const [tryNowRef, tryNowVisible] = useIntersectionObserver();
    const [faqRef, faqVisible] = useIntersectionObserver();

    const toggleAnswer = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

  return (
        <>
            
            <div ref={mastheadRef} className={`masthead-index fade-in-section ${mastheadVisible ? 'is-visible' : ''}`}>
                <div className='text-section' >
                    <h1 className='landing-page-title heading-reset'>
                        Tired of Looking for the Perfect <RotatingText />
                    </h1>
                    <h2 className='landing-page-subtitle heading-reset' style={{marginTop:'20px'}}>
                        With Bidi, you don't have to waste time searching for the perfect businesses to help you with your wedding. 
                        All you do is tell us what you need, and we'll find the right wedding vendors for you. 
                        No more hours and hours of searching through endless listings or playing phone tag with vendors. 
                        Our platform connects you directly with pre-screened, professional wedding vendors who are ready to bring your vision to life.
                    </h2>
                       <div className='landing-page-button-container'>
                            {user ? (
                                // Conditionally render different routes based on the role
                                role === 'individual' ? (
                                <Link to="/bids" onClick={() => posthog.capture('client_dashboard')}>
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
                                <div className='stat'>115+</div>
                            </div>
                            <div className='stat-box'>
                                <div className='stat-title'>Users</div>
                                <div className='stat'>350+</div>
                            </div>
                            <div className='stat-box final'>
                                <div className='stat-title'>Bids</div>
                                <div className='stat'>800+</div>
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
                    Simply post your wedding needs, and Bidi does the work—matching you with the best local vendors in minutes.</div>
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
                    <div className='connect-sub-title'>Unique</div>
                    <div className='connect-title'>Try Something <br></br><span className='connect-highlight'>New</span></div>
                    <div className='connect-text'>
                        Traditional wedding planning can take weeks of research, back-and-forth emails, and uncertainty about pricing.  
                        Bidi changes that. Our platform brings vendors to you—so you can find the right match in less time, with less stress, and more confidence.
                    </div>
                    <Link to="/request-categories" style={{textDecoration:'none'}}>
                        <button className='connect-button'>Try Now</button>
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
                        <div className='reason-title'>Competitive Pricing</div>
                        <div className='reason-box'>Our revolutionary bidding system forces companies to directly compete with each other for your business. This transparent competition means you get the best price, every time. Wedding vendors submit detailed proposals tailored to your specific needs, allowing you to compare services and prices easily.</div>
                    </div>
                    <div className='reason'>
                        <img className='reason-photo'src={WhyBidiPhoto3}></img>
                        <div className='reason-title'>Reliable Experts</div>
                        <div className='reason-box'>With our Bidi verified program, we connect you with local service providers that have been thoroughly vetted for reliability, professionalism, and quality of service. Each vendor undergoes a comprehensive verification process, including review of their portfolio, business credentials, and past client testimonials. You can trust that you're working with experienced professionals who will deliver on their promises.</div>
                    </div>
                </div>
            </div>

            <div ref={howToRef} className={`how-to-use-section fade-in-section ${howToVisible ? 'is-visible' : ''}`}>
    <div className='how-to-text'>
        <div className='how-to-sub-title'>Simple and hassle-free.</div>
        <div className='how-to-title'>How It Works</div>
        
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

        {/* New Step 4 */}
        <div className='how-to-number'>4</div>
        <div className='step-container'>
            <div className='step-title'>Book and Celebrate</div>
            <div className='step-sub-title'>
                Choose your perfect vendor, confirm the booking, and enjoy a stress-free wedding experience.
            </div>
        </div>


        {/* Call to Action Button */}
        <div className='landing-page-button-container'>
            <Link to="/signin">
                <button className="landing-page-button" style={{ width: "150px", textDecoration:'none', alignItems:'center', justifyContent:'center', marginLeft:'0' }}>
                    Try Now
                </button>
            </Link>
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
            <div className='try-now-subtitle'>Over 330 users are already finding their perfect wedding vendors. Don't miss out on stress-free hiring.</div>
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
                <Link className="newsletter-button"to="/signin">
                    <div>Sign Up</div>
                </Link>
            </div>

        </div>
    </>
  );
}

export default Homepage;