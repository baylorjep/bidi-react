import React from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';
import logo from '../../assets/images/Bidi Logo.png';

const Footer = () => {
    let year = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className='footer-container'>

                <div className='footer-left'>
                    <img className='footer-left-img'src={logo} alt="Bidi Logo"/>
                    <div className='bidi-description-footer'>Help you with professionals who have been checked out and have been shown to be reliable, whether you need help with any tasks or planning an unforgettable event. </div>
                </div>

                <div className='contact-us'>
                    <div className='contact-title'>Contact Us</div>
                    <div className='contact-text'>385-216-9587</div>
                    <div className='contact-text'>savewithbidi@gmail.com</div>
                </div>
                <div className="quick-links">
                    <div className='contact-title'>Quick Links</div>
                    <div className='contact-text'><Link to="/">Home</Link></div>
                    <div className='contact-text'><Link to="signin">Sign In/Sign Up</Link></div>
                    <div className='contact-text'><Link to="/privacy-policy">Privacy Policy</Link></div>
                    <div className='contact-text'><Link to="/terms-of-use">Terms of Use</Link></div>
                </div>
            </div>
            
            <div className="footer-bottom">
                <p>&copy; {year} Bidi. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
