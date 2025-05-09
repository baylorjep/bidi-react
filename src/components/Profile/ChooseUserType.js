import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function ChooseUserType() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const source = searchParams.get('source');

    const handleSelection = (userType) => {
        const fromNavbar = searchParams.get('source') === 'navbar';
        
        if(userType === 'business') {
            navigate('/signup?type=business');
        } else {
            if(fromNavbar) {
                navigate('/signup?type=individual');
            } else {
                navigate('/request-categories');
            }
        }
    };

    return (
        
        <div style={{display:'flex', alignItems:'center',justifyContent:'center', height:'85vh'}} >
            <div className='signup-form-container'>
            <div className="Sign-Up-Page-Header" style={{marginTop:'60px'}}>Create Account</div>
            <div className='Sign-Up-Page-Subheader' style={{marginTop:'4px'}}>Join Bidi Today!</div>
            <div className="choose-type-button-container" style={{marginTop:'84px'}}>
                <div>
                   <button 
                    onClick={() => handleSelection('individual')} 
                    className="choose-type-button">
                    Hire someone to help me
                </button> 
                </div>
                
                <div className='choose-type-or'>Or</div>
                <div><button 
                    onClick={() => handleSelection('business')} 
                    className="choose-type-button">
                    Offer my skills to others
                </button>
                </div>
                
            </div>
            </div>
            
        </div>
          
    );
}

export default ChooseUserType;
