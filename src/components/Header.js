import React from 'react';
import '../App.css';

function Header() {
    return (
        <header className="masthead-index">
            <div className="container px-5">
                <div className="row gx-5 justify-content-center">
                    <div className="col-lg-6 text-center">
                        <div className="text-container">
                            <h1>Real-Time Bids on Your Projects</h1>
                            <p>
                                Our revolutionary bidding system simplifies obtaining real quotes for the services you need, allowing for easy comparison all in one place.
                            </p>
                            <div className="search-container">
                                <input type="text" id="search" className="search-input" placeholder="What are you looking to do?" />
                                <button className="search-button" onClick={() => console.log('Search clicked!')}>Search</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
