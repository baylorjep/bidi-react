import React from 'react';
import RotatingText from './RotatingText';
import '../App.css';
import { Link } from 'react-router-dom';

function Header() {
    return (
        <header className="masthead-index">
            <div className="container px-5">
                <div className="row gx-5 justify-content-center">
                    <div className="col-lg-8 text-center">
                        <div className="text-container">
                            <h1>
                                Real-Time Bids on Your Next <RotatingText />
                            </h1>
                            <p>
                                Our revolutionary bidding system simplifies obtaining real quotes for the services you need, allowing for easy comparison all in one place.
                            </p>
                            <div className="search-container">
                                <Link to="Signup">
                                    <button className="search-button">
                                        Get Started
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;

