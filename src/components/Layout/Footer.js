import React from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';

const Footer = () => {
    let year = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-left">
                <p>&copy; {year} Bidi. All rights reserved.</p>
            </div>
            <div className="footer-right">
                <p><Link to="/inicio">Cambie pagina al Español</Link></p>
                <p><Link to="/privacy-policy">Privacy Policy</Link></p>
                <p><Link to="/terms-of-use">Terms of Use</Link></p>
            </div>
        </footer>
    );
};

export default Footer;
