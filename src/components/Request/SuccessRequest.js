import React from 'react';
import { Link } from 'react-router-dom';

function SuccessRequest() {
    return (
        <div className="container px-5 d-flex align-items-center justify-content-center" style={{flexDirection:'column', minHeight:'70vh'}}>
            <div className="col-lg-6 text-center" style={{borderBottom:"1px solid black", paddingBottom:'20px'}}>
                <br/>
                <div className='Sign-Up-Page-Header'>Submitted!</div>
                <div className='submit-form-2nd-header'>We will notify you whenever your bids start coming in.</div>
                <Link to="/my-bids">
                    <button className='landing-page-button' style={{margin:'8px'}}>Go to My Bids</button>
                </Link>
            </div>
            <div style={{marginTop:'20px',justifyContent:'center', textAlign:"center"}}>
                <div className='Sign-Up-Page-Header'>Still Have a Few More Things to Do?</div>
                <Link to="/request-categories">
                    <button className='landing-page-button' style={{marginTop:'40px'}}>Make Another Request</button>
                </Link>
            </div>
        </div>
    );
}

export default SuccessRequest;
