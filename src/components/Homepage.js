import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Ensure this path is correct
import { Link } from 'react-router-dom';
import videoSrc from '../assets/images//Landing Page Video 3.mov'; // Import the video
import cakeIcon from '../assets/images/Icons/cake icon.png';
import cameraIcon from '../assets/images/Icons/camera icon.png';
import floristIcon from '../assets/images/Icons/Florist icon.png';
import hairIcon from '../assets/images/Icons/hair stylist icon.png';
import homeIcon from '../assets/images/Icons/home icon.png';
import paintIcon from '../assets/images/Icons/paint icon.png';
import renchIcon from '../assets/images/Icons/rench icon.png';
import scissorsIcon from '../assets/images/Icons/scissors icon.png';
import quoteIcon from '../assets/images/Icons/“.png';
import jennaferIcon from '../assets/images/Jennafer Profile.png'
import scrollBtn from '../assets/images/Icons/scroll button.png'
import IphoneFrame from '../assets/images/Iphone 14 - 1.png'
import statusBar from '../assets/images/iPhone 13.png'
function Homepage() {
    const [user, setUser] = useState(null);
    const reviewSliderRef = useRef(null);

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                setUser(session.user);
            }
        };

        fetchSession();
    }, []);

    const scrollReviews = (direction) => {
        if (reviewSliderRef.current) {
            const scrollAmount = 400; // Adjust based on review card width
            reviewSliderRef.current.scrollBy({
                left: direction === 'right' ? scrollAmount : -scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <>
            <div className="masthead-index">
                <div className='text-section'>
                    <div className='landing-page-title'>
                        Tired of looking for the Perfect Business?
                    </div>
                    <div className="icon-section-mobile">
                        <div className="icon"><img src={cakeIcon} alt="Cake Icon" /></div>
                        <div className="icon"><img src={cameraIcon} alt="Camera Icon" /></div>
                        <div className="icon"><img src={floristIcon} alt="Florist Icon" /></div>
                        <div className="icon"><img src={hairIcon} alt="Hair Icon" /></div>
                        <div className="icon"><img src={homeIcon} alt="Home Icon" /></div>
                        <div className="icon"><img src={paintIcon} alt="Paint Icon" /></div>
                        <div className="icon"><img src={renchIcon} alt="Rench Icon" /></div>
                        <div className="icon"><img src={scissorsIcon} alt="Scissors Icon" /></div>
                    </div>
                    <div className='landing-page-subtitle'>
                        Bidi is a service request platform for local services. With Bidi, you don’t have to waste time searching for the perfect businesses to help you. All you do is tell us what you need, and we’ll find the right business for you. No more hours and hours of searching.
                    </div>
                    <div className='landing-page-button-container'>
                        <Link to="/signup">
                            <button className='landing-page-button'>Get Started</button>
                        </Link>
                
                    </div>
                </div>
                <div className='icon-section'>
                <div className="icon-section">
                        <div className="icon"><img src={cakeIcon} alt="Cake Icon" /></div>
                        <div className="icon"><img src={cameraIcon} alt="Camera Icon" /></div>
                        <div className="icon"><img src={floristIcon} alt="Florist Icon" /></div>
                        <div className="icon"><img src={hairIcon} alt="Hair Icon" /></div>
                        <div className="icon"><img src={homeIcon} alt="Home Icon" /></div>
                        <div className="icon"><img src={paintIcon} alt="Paint Icon" /></div>
                        <div className="icon"><img src={renchIcon} alt="Rench Icon" /></div>
                        <div className="icon"><img src={scissorsIcon} alt="Scissors Icon" /></div>
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
                    <div className='how-to-steps' style={{ borderBottom: "none" }}>3. Find the best fit for you</div>
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
                    <button className="scroll-btn left" onClick={() => scrollReviews('left')}><img src={scrollBtn}></img></button>
                    <div className='review-slider' ref={reviewSliderRef}>
                        <div className='large-review'>
                            <img className='quote-icon' src={quoteIcon} alt="Quote Icon" />
                            I was looking for a roofer to fix a leak on the roof of my cabin in Eden. I only found 2 options and neither of them would call me back. I put my job request on bidi when they first launched. Because bidi was brand new there were not any roofers in their network yet. Within a day the bidi founders personally made tons of calls to find me a handful of roofers who could bid on my job. I was blown away! My 2nd experience was even better. I needed a fast turnaround for family pictures (one week). I submitted my request for a photographer to take a family photos. Within an hour of my request, I had 12 photographers post bids. The prices were competitive because they know they have to be. Since my first experience with my roofing request, bidi has only gotten better and better. I've noticed more and more updates. This company is going to be a game changer in the way I shop for services!
                            <br />
                            <br />
                            <img className='profile-icon' src={jennaferIcon}></img><span>- Jennafer J.</span>
                        </div>
                        <div className='review'>
                            <img className='quote-icon' src={quoteIcon} alt="Quote Icon" />
                            I love how automated it all is.
                            <br />
                            <br />
                            <span>- Olivia J.</span>
                        </div>
                        <div className='review'>
                            <img className='quote-icon' src={quoteIcon} alt="Quote Icon" />
                            You guys are kicking butt btw!.
                            <br />
                            <br />
                            <span>- Savannah O.</span>
                        </div>
                        <div className='review'>
                            <img className='quote-icon' src={quoteIcon} alt="Quote Icon" />
                            This is incredible! Super excited!
                            <br />
                            <br />
                            <span>- Josh B.</span>
                        </div>
                    </div>
                    <button className="scroll-btn right" onClick={() => scrollReviews('right')}><img src={scrollBtn}></img></button>
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
