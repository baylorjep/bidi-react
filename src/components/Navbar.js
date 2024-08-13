import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import logo from '../assets/images/Bidi Logo.png'

function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-light fixed-top shadow-sm" id="mainNav">
            <div className="container px-5">
                <Link className="navbar-brand fw-bold" to="/"><img src={logo} alt="Bidi Logo" style={{ height: '100px', width: 'auto'}} /></Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
                    Menu
                    <i className="bi-list"></i>
                </button>
                <div className="collapse navbar-collapse" id="navbarResponsive">
                    <ul className="navbar-nav ms-auto me-4 my-3 my-lg-0">
                        <li className="nav-item"><Link className="nav-link me-lg-3" to="/request">Request a Service</Link></li>
                        <li className="nav-item"><Link className="nav-link me-lg-3" to="/bids">My Bids</Link></li>
                        <li className="nav-item"><Link className="nav-link me-lg-3" to="/dashboard">My Dashboard</Link></li>
                    </ul>
                    <Link className="btn btn-primary rounded-pill px-3 mb-2 mb-lg-0" to="/signin">
                        <span className="d-flex align-items-center">
                            <span className="small">Sign In</span>
                        </span>
                    </Link>

                </div>
            </div>
        </nav>
    );
}

export default Navbar;
