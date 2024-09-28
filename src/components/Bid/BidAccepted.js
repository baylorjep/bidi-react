import React from 'react';
import { Link } from 'react-router-dom';

function BidAccepted() {
    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6 text-center">
                <br/>
                <h2>Bid Approved!</h2>
                <p>You have approved the job. Pay now or reach out to the business here!</p>
                <Link className="btn btn-secondary" to="/approved-bids">My Approved Bids</Link>
                
            </div>
        </div>
    );
}

export default BidAccepted;