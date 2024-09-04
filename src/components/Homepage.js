import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import RotatingText from './Layout/RotatingText';
import TestimonialSlider from './Layout/Testimonials/TestimonialSlider';
import '../App.css';
import { Link } from 'react-router-dom';
import photoSrc from '../assets/images/Landing Page Photo.png'; // Import the photo

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
                            <h1 className='homepage-title'>Welcome to Bidi!</h1>
                            <p className='homepage-subtitle'>
                                Bidi is a platform that makes it easy to get bids on <RotatingText /> You can start getting bids in 3 easy steps:
                            </p>
                            <div className='homepage-steps'>
                                <p>Step 1: Submit a Request</p>
                                <p>Step 2: Get bids</p>
                                <p>Step 3: Pick the Bid that Works for You</p>
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
                    </div>
                    <div className="video-side">
                        <img src={photoSrc} alt="Photo of Bidi on Phone and Laptop" className="photo" />
                    </div>
                </div>
            </header>
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
