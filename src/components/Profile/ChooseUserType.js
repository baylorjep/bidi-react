import React from 'react';
import { useNavigate } from 'react-router-dom';

function ChooseUserType() {
    const navigate = useNavigate();

    const handleSelection = (userType) => {
        navigate(`/signup?type=${userType}`);
    };

    return (
        
        <div className="text-center">
            <div className="Sign-Up-Page-Header" style={{ marginTop: '40px' }}>Create Account</div>
            <div className="choose-type-button-container">
                <button 
                    onClick={() => handleSelection('individual')} 
                    className="choose-type-button">
                    Hire someone to help me
                </button>
                <div className='choose-type-or'>OR</div>
                <button 
                    onClick={() => handleSelection('business')} 
                    className="choose-type-button">
                    Offer my skills to others
                </button>
            </div>
        </div>
          
    );
}

export default ChooseUserType;
