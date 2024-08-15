import React from 'react';
import { Link } from 'react-router-dom';

function BidSuccess() {
    return (
        <div className="container px-5 d-flex align-items-center justify-content-center grey-bg content">
            <div className="col-lg-6 text-center">
                <br/>
                <h2>Bid Approved!</h2>
                <p>You have approved the job. We will notify the business.</p>
                <Link className="btn btn-secondary" to="/my-bids">Back to Bids</Link>
            </div>
        </div>
    );
}

export default BidSuccess;