import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function SignInModal({ setIsModalOpen }) {
    const [isOpen, setIsOpen] = useState(false); // Internal state to trigger transitions
    const navigate = useNavigate(); // useNavigate hook for navigation

    // Open the modal when the component mounts
    useEffect(() => {
        setIsOpen(true); // Modal will be shown
    }, []);

    const closeModal = () => {
        setIsOpen(false); // Close modal on button click
        setIsModalOpen(false); // Notify parent to close the modal
    };

    // Function to navigate to the request form after the user completes sign-in or account creation
    const handleRedirect = () => {
        // Replace '/request-form' with your actual request form route
        navigate('/personal-details');
    };

    return (
        <div className='sign-up-modal'>
            <div className='sign-up-modal-content'>
                <button className="sign-up-modal-X" onClick={closeModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 10 10" fill="none">
                        <path d="M5 3.88906L8.88906 0L10 1.11094L6.11094 5L10 8.88906L8.88906 10L5 6.11094L1.11094 10L0 8.88906L3.88906 5L0 1.11094L1.11094 0L5 3.88906Z" fill="#4F4F4F"/>
                    </svg>
                </button>
                <div className="sign-up-modal-title">Sign In to Continue</div>
                <div className="sign-up-modal-subtitle">*You must have an account to complete the form</div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
                    {/* Pass the type 'individual' as a query parameter */}
                    <Link to={`/signup?type=individual&redirect=${encodeURIComponent('/personal-details')}`}>
                        <button className="sign-up-modal-button-primary">Create an Account</button>
                    </Link>
                    <Link to="/signin" state={{ from: '/personal-details' }}>
                        <button className="sign-up-modal-button-secondary">Sign In</button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default SignInModal;
