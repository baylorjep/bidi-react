import React from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';
import logo from '../../assets/images/Bidi Logo.png';
import BYU from '../../assets/images/BYU.png'
import Sandbox from '../../assets/images/Sandbox.png';
import Facebook from '../../assets/images/Icons/footer-1-icon-facebook.svg'
import Instagram from '../../assets/images/Icons/footer-1-icon-instagram.svg'
import LinkedIn from '../../assets/images/Icons/footer-1-icon-linked-in.svg'

const Footer = () => {
    let year = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className='footer-container'>

                <div className='footer-left'>
                    <div className='bidi-logo'>Bidi</div>
                    <div className='bidi-description-footer'>A bidding platform where you request services, and businesses come to you. Stop searching and start finding with Bidi.</div>
                </div>

                <div className='footer-right'>
                    <div className='contact-title'>Contact Us</div>
                    <div className='contact-text'>385-216-9587</div>
                    <div className='contact-text'>savewithbidi@gmail.com</div>
                </div>
                <div className="footer-right">
                    <div className='contact-title'>Quick Links</div>
                    <div className='contact-text'><Link to="/">Home</Link></div>
                    <div className='contact-text'><Link to="createaccount">Sign Up</Link></div>
                    <div className='contact-text'><Link to="signin">Log In</Link></div>
                    <div className='contact-text'><Link to="about-us">About Us</Link></div>
                </div>
                <div className="footer-right">
                    <div className='contact-title'>Find Us On</div>
                    <Link 
                        to="https://www.facebook.com/profile.php?id=61564452265355" 
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{display:'flex', flexDirection:'row', alignItems:'center', gap:'8px'}}
                    >
                        <img src={Facebook} alt="Facebook" />
                        <div className='contact-text'>Facebook</div>
                    </Link>
                    <Link 
                        to="https://www.instagram.com/bidiweddings/" 
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{display:'flex', flexDirection:'row', alignItems:'center', gap:'8px'}}
                    >
                        <img src={Instagram} alt="Instagram" />
                        <div className='contact-text'>Instagram</div>
                    </Link>
                    <Link 
                        to="https://www.linkedin.com/company/savewithbidi/" 
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{display:'flex', flexDirection:'row', alignItems:'center', gap:'8px'}}
                    >
                        <img src={LinkedIn} alt="LinkedIn" />
                        <div className='contact-text'>LinkedIn</div>
                    </Link>
                </div>
            </div>
            
            <div className="footer-bottom">
                <p>&copy; {year} Bidi. All rights reserved.</p>
                <div style={{display:'flex', flexDirection:'row', alignItems:'center', gap:'8px', marginRight:'20px'}}>
                <div className='contact-text'><Link to="/privacy-policy">Privacy Policy</Link></div>
                <div className='contact-text'><Link to="/terms-of-use">Terms of Use</Link></div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
