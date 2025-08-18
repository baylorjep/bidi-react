import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import UserTypeSelectionModal from './UserTypeSelectionModal';

const MissingProfileModal = ({ isOpen, onClose, user }) => {
    const [showUserTypeModal, setShowUserTypeModal] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && user) {
            setUserEmail(user.email || '');
            setUserName(user.user_metadata?.full_name || user.user_metadata?.name || '');
            setShowUserTypeModal(true);
        }
    }, [isOpen, user]);

    const handleModalClose = () => {
        setShowUserTypeModal(false);
        onClose();
        // If user closes modal without completing setup, sign them out
        supabase.auth.signOut();
        navigate('/');
    };

    const handleProfileCreated = () => {
        setShowUserTypeModal(false);
        onClose();
        // Refresh the page to ensure all components pick up the new profile
        window.location.reload();
    };

    if (!isOpen) return null;

    return (
        <div className="missing-profile-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
        }}>
            <div className="missing-profile-modal" style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <h2 style={{ marginBottom: '16px', color: '#1f2937' }}>
                    Complete Your Profile Setup
                </h2>
                <p style={{ marginBottom: '24px', color: '#6b7280', lineHeight: '1.5' }}>
                    We noticed you don't have a complete profile yet. Let's set up your account so you can start using Bidi.
                </p>
                
                {showUserTypeModal && (
                    <UserTypeSelectionModal
                        isOpen={showUserTypeModal}
                        onClose={handleModalClose}
                        user={user}
                        userEmail={userEmail}
                        userName={userName}
                        onProfileCreated={handleProfileCreated}
                    />
                )}
            </div>
        </div>
    );
};

export default MissingProfileModal;
