import React from 'react';
import { Link } from 'react-router-dom';

function SuccessSignup() {
    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6 text-center">
                <br/>
                <h1>Success! Account Created.</h1>
                <p>Check your Email to confirm your Account.</p>
                <Link to="/signin" className="btn btn-secondary btn-lg">Click Here to Sign In</Link>
            </div>
        </div>
    );
}

export default SuccessSignup;
