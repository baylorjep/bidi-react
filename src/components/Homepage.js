import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import RotatingText from './Layout/RotatingText';
import TestimonialSlider from './Layout/Testimonials/TestimonialSlider';
import '../App.css';
import { Link } from 'react-router-dom';
import videoSrc from '../assets/images/Landing Page Video 2.mp4'; // Import the video
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
        </>
    );
}

export default Homepage;
