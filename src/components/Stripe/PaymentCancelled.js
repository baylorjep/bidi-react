import React from 'react';
import { Link } from 'react-router-dom';

function PaymentCancelled() {
    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6 text-center">
                <br/>
                <h1>Payment Cancelled</h1>
                <p>Your payment was not completed. Please return to your bids to try again or choose a different payment method.</p>
                <Link to="/approved-bids" className="btn btn-secondary btn-lg">Approved Bids</Link>
            </div>
        </div>
    );
}

export default PaymentCancelled;