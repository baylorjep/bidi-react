import React from 'react';
import { Link } from 'react-router-dom';

function SuccessRequest() {
    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6 text-center">
                <br/>
                <h1>Submitted!</h1>
                <p>We will notify you whenever your bids start coming in.</p>
                <Link to="/my-bids" className="btn btn-secondary btn-lg">Go to My Bids</Link>
            </div>
        </div>
    );
}

export default SuccessRequest;
