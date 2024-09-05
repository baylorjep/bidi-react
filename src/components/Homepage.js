import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import RotatingText from './Layout/RotatingText';
import TestimonialSlider from './Layout/Testimonials/TestimonialSlider';
import '../App.css';
import { Link } from 'react-router-dom';
import videoSrc from '../assets/images/Landing Page Video 2.mp4'; // Import the video
import bidiLogoWhite from '../assets/images/bidi logo white.png';

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
                                    {user === null ? (
                                        <Link to="Signup">
                                            <button className="search-button">Get Started</button>
                                        </Link>
                                    ) : (
                                        <Link to="/request-categories">
                                            <button className="search-button">Get Started</button>
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
            You can start getting bids in 3 easy steps
        </div>
        <div className="homepage-steps">
            <p>Submit a Request</p>
            <p>Get bids</p>
            <p>Pick the Bid that Works for You</p>
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
