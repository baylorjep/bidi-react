import React, { useState, useEffect } from 'react';
// Update these import paths to be relative to the AuthModal location
import SignIn from '../../../components/Profile/SignIn';
import Signup from '../../../components/Profile/Signup';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';

// Helper function to get pending request context
const getPendingRequestContext = () => {
  try {
    const context = sessionStorage.getItem('pendingRequestContext');
    return context ? JSON.parse(context) : null;
  } catch (error) {
    console.error('Error parsing pending request context:', error);
    return null;
  }
};

const AuthModal = ({ setIsModalOpen, onSuccess }) => {
    const [currentView, setCurrentView] = useState('options'); // 'options', 'signin', or 'signup'
    const navigate = useNavigate();
    const location = useLocation();
    const partnershipInfo = location.state?.partnershipInfo;

    const handleClose = () => {
        setIsModalOpen(false);
        // Only navigate to homepage if we're on the sign-in page without any other context
        if (location.pathname === '/signin' && !location.state?.from) {
            navigate('/');
        }
    };

    // Handle close event from Signup component
    useEffect(() => {
        const handleCloseEvent = () => {
            handleClose();
        };

        const modal = document.querySelector('.sign-up-modal');
        if (modal) {
            modal.addEventListener('closeModal', handleCloseEvent);
        }

        return () => {
            if (modal) {
                modal.removeEventListener('closeModal', handleCloseEvent);
            }
        };
    }, [location.pathname, location.state?.from]);

    const handleSignupSuccess = async (userData) => {
        try {
            if (partnershipInfo && userData?.id) {
                // Store the partnership referral in Supabase
                const { error } = await supabase
                    .from('partnership_referrals')
                    .insert({
                        user_id: userData.id,
                        partner_id: partnershipInfo.partnerId,
                        partner_name: partnershipInfo.partnerName,
                        created_at: new Date().toISOString()
                    });

                if (error) {
                    console.error('Error storing partnership referral:', error);
                }
            }
            
            // Always call onSuccess with the user data
            // Let the RequestModal handle checking for pending request context
            if (onSuccess) {
                onSuccess(userData);
            }
        } catch (error) {
            console.error('Error in handleSignupSuccess:', error);
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case 'signin':
                console.log('Rendering SignIn component with isModal=true');
                return <SignIn onSuccess={handleSignupSuccess} isModal={true} />;
            case 'signup':
                return (
                    <Signup 
                        onSuccess={handleSignupSuccess} 
                        initialUserType="individual"
                        partnershipInfo={partnershipInfo}
                        isModal={true}
                    />
                );
            default:
                return (
                    <div className='sign-up-modal-content'>
                        <button className="sign-up-modal-X" onClick={handleClose}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 10 10" fill="none">
                                <path d="M5 3.88906L8.88906 0L10 1.11094L6.11094 5L10 8.88906L8.88906 10L5 6.11094L1.11094 10L0 8.88906L3.88906 5L0 1.11094L1.11094 0L5 3.88906Z" fill="#4F4F4F"/>
                            </svg>
                        </button>
                        <div className="sign-up-modal-title">Sign In to Continue</div>
                        <div className="sign-up-modal-subtitle">*You must have an account to continue</div>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
                            <button className="sign-up-modal-button-primary" onClick={() => setCurrentView('signin')}>
                                Sign In
                            </button>
                            <button className="sign-up-modal-button-secondary" onClick={() => setCurrentView('signup')}>
                                Create an Account
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className='sign-up-modal'>
            {renderContent()}
        </div>
    );
};

export default AuthModal;
