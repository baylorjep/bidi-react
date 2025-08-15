import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import UserTypeSelectionModal from './Modals/UserTypeSelectionModal';

const AuthCallback = () => {
    const [user, setUser] = useState(null);
    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [showUserTypeModal, setShowUserTypeModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Helper function to check if user has existing data
    const checkForExistingData = async (userId, tableName) => {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('id')
                .eq('user_id', userId)
                .limit(1);
            
            if (error) {
                console.error(`Error checking ${tableName}:`, error);
                return false;
            }
            
            return data && data.length > 0;
        } catch (error) {
            console.error(`Error checking ${tableName}:`, error);
            return false;
        }
    };

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Get the current user
                const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
                
                if (userError) {
                    console.error('Error getting user:', userError);
                    setError('Failed to get user information');
                    setLoading(false);
                    return;
                }

                if (!currentUser) {
                    console.error('No user found');
                    setError('No user found');
                    setLoading(false);
                    return;
                }

                setUser(currentUser);
                setUserEmail(currentUser.email || '');
                setUserName(currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '');

                // Check if user already has profiles
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') {
                    // PGRST116 means no rows returned, which is expected for new users
                    console.error('Error checking profile:', profileError);
                    setError('Failed to check profile status');
                    setLoading(false);
                    return;
                }

                if (profile) {
                    // User already has a profile, redirect to appropriate dashboard
                    await redirectToDashboard(currentUser.id, profile.role);
                } else {
                    // New user, show user type selection modal
                    setShowUserTypeModal(true);
                }

            } catch (error) {
                console.error('Auth callback error:', error);
                setError('An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        handleAuthCallback();
    }, [navigate]);

    const redirectToDashboard = async (userId, userRole) => {
        try {
            // Check for pending request context before redirecting
            const pendingRequestContext = sessionStorage.getItem('pendingRequestContext');
            if (pendingRequestContext) {
                try {
                    const requestData = JSON.parse(pendingRequestContext);
                    const now = Date.now();
                    const timeDiff = now - requestData.timestamp;
                    
                    // Only restore if request context is less than 10 minutes old
                    if (timeDiff < 10 * 60 * 1000) {
                        console.log('Found pending request context, redirecting back to request flow');
                        sessionStorage.removeItem('pendingRequestContext');
                        
                        // Redirect to a special route that will restore the request modal
                        navigate('/restore-request', { 
                            state: { 
                                pendingRequestContext: requestData,
                                fromOAuth: true 
                            } 
                        });
                        return;
                    } else {
                        console.log('Pending request context expired, removing');
                        sessionStorage.removeItem('pendingRequestContext');
                    }
                } catch (error) {
                    console.error('Error parsing pending request context:', error);
                    sessionStorage.removeItem('pendingRequestContext');
                }
            }
            
            // Normal redirect based on user type
            if (userRole === 'both') {
                navigate('/wedding-planner-dashboard/home');
            } else if (userRole === 'business') {
                navigate('/business-dashboard/dashboard');
            } else {
                // Individual user - check if they have existing data
                const hasWeddingPlan = await checkForExistingData(userId, 'wedding_plans');
                const hasRequests = await checkForExistingData(userId, 'photography_requests') ||
                                   await checkForExistingData(userId, 'catering_requests') ||
                                   await checkForExistingData(userId, 'dj_requests') ||
                                   await checkForExistingData(userId, 'florist_requests') ||
                                   await checkForExistingData(userId, 'beauty_requests') ||
                                   await checkForExistingData(userId, 'wedding_planning_requests');
                
                if (hasWeddingPlan || hasRequests) {
                    navigate('/individual-dashboard/bids');
                } else {
                    navigate('/individual-dashboard/bids');
                }
            }
        } catch (error) {
            console.error('Navigation error:', error);
            setError('Failed to redirect to dashboard');
        }
    };

    const handleModalClose = () => {
        setShowUserTypeModal(false);
        // If user closes modal without completing setup, redirect to home
        navigate('/');
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div className="loading-spinner"></div>
                <p>Setting up your account...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: '20px',
                padding: '20px',
                textAlign: 'center'
            }}>
                <h2>Something went wrong</h2>
                <p style={{ color: '#dc2626' }}>{error}</p>
                <button 
                    onClick={() => navigate('/')}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#a328f4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <>
            {showUserTypeModal && (
                <UserTypeSelectionModal
                    isOpen={showUserTypeModal}
                    onClose={handleModalClose}
                    user={user}
                    userEmail={userEmail}
                    userName={userName}
                />
            )}
        </>
    );
};

export default AuthCallback;
