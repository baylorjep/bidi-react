import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import RotatingText from './Layout/RotatingText';
import TestimonialSlider from './Layout/Testimonials/TestimonialSlider';
import '../App.css';
import { Link } from 'react-router-dom';
import videoSrc from '../assets/images/Landing Page Video 2.mp4'; // Import the video
import bidiLogoWhite from '../assets/images/bidi logo white.png';
import bidiCheck from '../assets/images/bidi check.png';

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
            <div className="header-container">
                <header className="masthead-index">
                    <div className="container flex-container">
                        <div className="text-side">
                            <div className="text-container">
                                <div className='homepage-bidi-logo'>
                                    <img src={bidiLogoWhite} alt="Bidi Logo" />
                                </div>
                                <div className='homepage-title'>
                                    A platform that makes it easy to get bids on 
                                </div>
                                <div className='rotating-text'><RotatingText /></div>
                                <div className="search-container">
                                    {/* If no user is signed in, send them to sign up */}
                                {user === null && (
                                    <Link to="Signup">
                                        <button className="search-button">
                                            Get Started
                                        </button>
                                    </Link>
                                )}
                                {/* If a user is signed in, send them to request categories */}
                                {user != null && (
                                    <Link to="/request-categories">
                                        <button className="search-button">
                                            Get Started
                                        </button>
                                    </Link>
                                )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                {/* Wave container for SVG */}
                <div className="wave-container-top">
                    <svg className="wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" fill="#ffffff">
                    <path d="M0,200 Q80,180 160,200 T320,200 T480,200 T640,200 T800,200 T960,200 T1120,200 T1280,200 T1440,200 V320 H0 Z"/></svg>
                </div>
            </div>
            <div className="video-container">
                <div className="iphone-container">
                    <video src={videoSrc} className="iphone-video" autoPlay loop muted playsInline />
                </div>
                <div className="text-container-2nd-page">
                    <div className="homepage-subtitle">
                    Start getting bids in 3 easy steps
                </div>
        <div className="homepage-steps">
    <div className="step">
        <img src={bidiCheck} alt="Check icon" />
        <p>Submit a Request: Fill out a simple form explaining what you are looking for</p>
    </div>
    <div className="step">
        <img src={bidiCheck} alt="Check icon" />
        <p>Get bids: Watch the bids roll in as companies compete for your business</p>
    </div>
    <div className="step">
        <img src={bidiCheck} alt="Check icon" />
        <p>Pick the Bid that Works for You: Deny the bids you don't like, and approve the one you do</p>
    </div>
</div>
        <div className="try-it-out-container">
                                    {user === null ? (
                                        <Link to="Signup">
                                            <button className="search-button-secondary">Try it out</button>
                                        </Link>
                                    ) : (
                                        <Link to="/request-categories">
                                            <button className="search-button-secondary">Try it out</button>
                                        </Link>
                                    )}
                                </div>
    </div>
</div>
            <div className='testimonials-container'>
                <div className="text-container">
                    <h2 className="testimonial-header">Don't take our word for it. Take theirs.</h2>
                </div>
                <TestimonialSlider />
            </div>
        </>
    );
}

export default Homepage;
