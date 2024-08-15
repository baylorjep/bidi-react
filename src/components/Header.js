import React from 'react';
import '../App.css';
import { Link } from 'react-router-dom';

function Header() {
//search stuff below, restore this when ready to use search
    //const searchInput = document.getElementById('search');

    //const search = () => {
        //const searchValue = searchInput.value;
        //console.log(`Searched: ${searchValue}`);
    //}

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
