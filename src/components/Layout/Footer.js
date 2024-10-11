import React from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';
import logo from '../../assets/images/Bidi Logo.png';
import BYU from '../../assets/images/BYU.png'
import Sandbox from '../../assets/images/Sandbox.png'

const Footer = () => {
    let year = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className='footer-container'>

                <div className='footer-left'>
                    <img className='footer-left-img'src={logo} alt="Bidi Logo"/>
                    <div className='bidi-description-footer'>A bidding platform where you request services, and businesses come to you. Stop searching and start finding with Bidi.</div>
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
                <div className="quick-links">
                    <div className='contact-title'>Supported By</div>
                    <div className="supported-by">
                        <div className='support-logo'><Link to="https://www.byu.edu/"><img src={BYU}></img></Link></div>
                        <div className='support-logo'><Link to="https://sandbox.ing/"><img src={Sandbox}  style={{paddingTop:'10px'}}></img></Link></div>
                    </div>
                </div>
            </div>
            
            <div className="footer-bottom">
                <p>&copy; {year} Bidi. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
