import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import RotatingText from './Layout/RotatingText';
import TestimonialSlider from './Layout/Testimonials/TestimonialSlider';
import '../App.css';
import { Link } from 'react-router-dom';
import videoSrc from '../assets/images/Landing Page Video 3.mp4'; // Import the video
import bidiLogoWhite from '../assets/images/bidi logo white.png';
import bidiCheck from '../assets/images/bidi check.png';
import cakeIcon from '../assets/images/Icons/cake icon.png'
import cameraIcon from '../assets/images/Icons/camera icon.png'
import floristIcon from '../assets/images/Icons/Florist icon.png'
import hairIcon from '../assets/images/Icons/hair stylist icon.png'
import homeIcon from '../assets/images/Icons/home icon.png'
import paintIcon from '../assets/images/Icons/paint icon.png'
import renchIcon from '../assets/images/Icons/rench icon.png'
import scissorsIcon from '../assets/images/Icons/scissors icon.png'
import quoteicon from '../assets/images/Icons/“.png'
import icongroup from '../assets/images/Icons/Group 2.png'
function Homepage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                setUser(session.user);
            }
        };

        fetchSession();
    }, []);

    return (
        <>
        <div className="masthead-index">
            <div className='text-section'>
                <div className='landing-page-title'>
                    Tired of looking for the Perfect Business?
                </div>
                <div className='landing-page-subtitle'>
                With bidi, you don’t have to waste time searching for the perfect businesses to help you with your event. All you do is tell us what you need, and we’ll find the right business for you. No more hours and hours of searching.
                </div>
                <div className='landing-page-button-container'>
                    <Link to="/signup">
                        <button className='landing-page-button'>Get Started</button>
                    </Link>
                </div>
            </div>
            <div class="icon-section">
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
                    <div className='reason-title'>Reliable Experts</div>
                    <div className='reason-box'>With our Bidi verified program. We connect you with local service providers that have been verified to be reliable, communicative, and professional</div>
                </div>
                <div className='reason'>
                    <div className='reason-title'>Competitive Pricing</div>
                    <div className='reason-box'>Our revolutionary bidding system forces companies to directly compete with each other for your business. Meaning you get the best price, every time. </div>
                </div>
            </div>
        </div>

        <div className="how-to-use-section"> 
            <div className='how-to-phone'>
                <div class="phone-frame">
                    <div className='phone-screen'>
                        <video src={videoSrc} type="video/mp4"autoPlay muted loop playsInline/>
                    </div>
                </div>
            </div>
            <div className='how-to-text'>
                <div className='how-to-title'>How do I use Bidi?</div>
                <div className='how-to-steps'>1. Tells us what you are looking for</div>
                <div className='how-to-steps'>2. We will notify local businesses and they will send in bids</div>
                <div className='how-to-steps' style={{borderBottom: "none"}}>3. Find the best fit for you</div>
                <div className='try-now-button-container'>
                    <Link className="btn btn-secondary rounded-pill" style={{width:"150px"}} to="/signin">
                        <span style={{font:"Roboto", }}>Try Now</span>
                    </Link>
                </div>
            </div>
        </div>
        <div className="user-reviews-section">
            <div className='user-reviews-title'>Here is what our users say about Bidi</div>
            <div className='review-slider-container'>
                <div className='review'>
                    <img className='quote-icon' src={quoteicon} alt="Quote Icon" />
                    I love how automated it all is.
                    <br />
                    <br />
                    <span>- olivia J.</span>
                </div>
                <div className='review'>
                    <img className='quote-icon' src={quoteicon} alt="Quote Icon" />
                    I love how automated it all is.
                    <br />
                    <br />
                    <span>- olivia J.</span>
                </div>
                <div className='review'>
                    <img className='quote-icon' src={quoteicon} alt="Quote Icon" />
                    I love how automated it all is.
                    <br />
                    <br />
                    <span>- olivia J.</span>
                </div>
            </div>
        </div>
        <div className='newsletter-section'>
            <div className='newsletter-title'>Want More? Subscribe to our Newsletter</div>
            <div className="newsletter-subtitle">Bidi’s newsletter posts updates on new features, new available services, updates, and more! </div>
            <div className='newsletter-input-container'>
                <input
                    className='newsletter-input'
                    id="email-input"
                    type="text" // or "email", "password", etc.
                    placeholder="Email"
                />
                <div className='newsletter-button-container'>
                    <Link className="btn btn-secondary rounded-pill" style={{width:"150px", height:"60px"}} to="/signin">
                    <div style={{ font: "Roboto", marginTop:"10px"}}>Sign Up</div>
                    </Link>
                </div>
            </div>
        </div>
        </>
    );
}

export default Homepage;
