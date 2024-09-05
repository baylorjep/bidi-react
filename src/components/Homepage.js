import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import RotatingText from './Layout/RotatingText';
import TestimonialSlider from './Layout/Testimonials/TestimonialSlider';
import '../App.css';
import { Link } from 'react-router-dom';
import videoSrc from '../assets/images/Landing Page Video 2.mp4'; // Import the video


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
            <header className="masthead-index">
                <div className="container flex-container">
                    <div className="text-side">
                        <div className="text-container">
                            <div className='homepage-title'>
                                Bidi is a platform that makes it easy to get bids on 
                            </div>
                            <div className='rotating-text'><RotatingText /></div>
                            
                        </div>
                    </div>
                </div>
            </header>
            <div className="video-container">
                {/* iPhone Frame with Video inside */}
                <div className="iphone-container">
                    <video src={videoSrc} className="iphone-video" autoPlay loop muted playsInline />
                </div>
                <div className='homepage-subtitle'>
                                You can start getting bids in 3 easy steps:
                            </div>
                            <div className='homepage-steps'>
                                <p>1: Submit a Request</p>
                                <p>2: Get bids</p>
                                <p>3: Pick the Bid that Works for You</p>
                            </div>
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
