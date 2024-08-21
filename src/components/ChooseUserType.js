import React from 'react';
import { useNavigate } from 'react-router-dom';

function ChooseUserType() {
    const navigate = useNavigate();

    const handleSelection = (userType) => {
        navigate(`/signup?type=${userType}`);
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6">
                <div className="text-center">
                    <h1 className="SignUpPageHeader" style={{ marginTop: '40px' }}>What do you want to do on Bidi?</h1>
                    <div className="d-grid gap-2 mt-4">
                        <button 
                            onClick={() => handleSelection('individual')} 
                            className="btn btn-secondary btn-lg w-100">
                            Hire someone to help me
                        </button>
                        <button 
                            onClick={() => handleSelection('business')} 
                            className="btn btn-secondary btn-lg w-100">
                            Offer my skills to others
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChooseUserType;
