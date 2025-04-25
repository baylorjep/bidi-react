import React from 'react';
import { Link } from 'react-router-dom';

function BidSuccess() {
    return (
        <div className="container px-5 d-flex align-items-center justify-content-center content">
            <div className="col-lg-6 text-center">
                <br/>
                <h2>Bid Submitted Successfully!</h2>
                <p>Your bid has been submitted. We will notify you if your bid is selected.</p>
                <Link className="btn btn-secondary" to="/dashboard">Back to Dashboard</Link>
            </div>
        </div>
    );
}

export default BidSuccess;
