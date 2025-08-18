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

    // Helper function to check if user has a wedding plan
    const checkForWeddingPlan = async (userId) => {
        try {
            const { data: weddingPlan } = await supabase
                .from('wedding_plans')
                .select('id')
                .eq('user_id', userId)
                .single();
            return !!weddingPlan;
        } catch (error) {
            return false;
        }
    };

    // Helper function to check if user has individual requests
    const checkForIndividualRequests = async (userId) => {
        try {
            const requestTables = [
                'photography_requests',
                'videography_requests', 
                'catering_requests',
                'dj_requests',
                'florist_requests',
                'beauty_requests',
                'wedding_planning_requests'
            ];

            for (const table of requestTables) {
                let query = supabase.from(table).select('id');
                
                if (table === 'photography_requests') {
                    query = query.eq('profile_id', userId);
                } else {
                    query = query.eq('user_id', userId);
                }

                const { data: requests } = await query;
                if (requests && requests.length > 0) {
                    return true;
                }
            }
            return false;
        } catch (error) {
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

                // First, check if there's an existing user with the same email (for OAuth linking)
                const { data: existingUsers, error: existingUsersError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('email', currentUser.email);

                if (existingUsersError) {
                    console.error('Error checking for existing users:', existingUsersError);
                }

                // Check if user already has a profile (by ID)
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();

                console.log('Profile check result:', { profile, profileError, currentUser: { id: currentUser.id, email: currentUser.email } });

                if (profileError && profileError.code !== 'PGRST116') {
                    // PGRST116 means no rows returned, which is expected for new users
                    console.error('Error checking profile:', profileError);
                    setError('Failed to check profile status');
                    setLoading(false);
                    return;
                }

                if (profile) {
                    // User already has a profile, redirect to appropriate dashboard
                    console.log('User has profile, redirecting to dashboard');
                    await redirectToDashboard(currentUser.id, profile.role);
                } else if (existingUsers && existingUsers.length > 0) {
                    // User exists with same email but different ID (OAuth linking case)
                    console.log('Existing user found with same email, handling OAuth linking');
                    
                    // Get the existing user's profile
                    const existingProfile = existingUsers[0];
                    
                    // Update the existing profile to link it with the new OAuth user ID
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ 
                            id: currentUser.id, // Update to the new OAuth user ID
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existingProfile.id);
                    
                    if (updateError) {
                        console.error('Error linking accounts:', updateError);
                        setError('Failed to link your Google account. Please try signing in with your original method.');
                        setLoading(false);
                        return;
                    }
                    
                    // Also update individual_profiles and business_profiles if they exist
                    const { error: individualUpdateError } = await supabase
                        .from('individual_profiles')
                        .update({ id: currentUser.id })
                        .eq('id', existingProfile.id);
                    
                    const { error: businessUpdateError } = await supabase
                        .from('business_profiles')
                        .update({ id: currentUser.id })
                        .eq('id', existingProfile.id);
                    
                    if (individualUpdateError && individualUpdateError.code !== 'PGRST116') {
                        console.error('Error updating individual profile:', individualUpdateError);
                    }
                    
                    if (businessUpdateError && businessUpdateError.code !== 'PGRST116') {
                        console.error('Error updating business profile:', businessUpdateError);
                    }
                    
                    console.log('Successfully linked Google account with existing profile');
                    
                    // Redirect to dashboard with the existing profile
                    console.log('Redirecting after account linking to role:', existingProfile.role);
                    await redirectToDashboard(currentUser.id, existingProfile.role);
                } else {
                    // New user, show user type selection modal
                    console.log('No existing profile found, showing user type selection modal');
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
            console.log('AuthCallback: Checking for pending request context:', pendingRequestContext);
            if (pendingRequestContext) {
                try {
                    const requestData = JSON.parse(pendingRequestContext);
                    const now = Date.now();
                    const timeDiff = now - requestData.timestamp;
                    
                    // Only restore if request context is less than 10 minutes old
                    if (timeDiff < 10 * 60 * 1000) {
                        console.log('Found pending request context, redirecting back to request flow:', requestData);
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
            
            // Check if user came from auth pages and should be redirected to dashboard
            const isOnSigninPage = window.location.pathname.includes('/signin');
            const isOnSignupPage = window.location.pathname.includes('/signup');
            const isOnCreateAccountPage = window.location.pathname.includes('/createaccount');
            const isOnAuthCallback = window.location.pathname.includes('/auth-callback');
            const shouldRedirectToDashboard = isOnSigninPage || isOnSignupPage || isOnCreateAccountPage || isOnAuthCallback;
            
            // Determine user type and redirect accordingly
            if (userRole === 'both') {
                // User with both profiles (event planner vendor)
                navigate(shouldRedirectToDashboard ? '/event-planner-dashboard/home' : window.location.pathname);
            } else if (userRole === 'business') {
                // Business user only
                navigate(shouldRedirectToDashboard ? '/business-dashboard/dashboard' : window.location.pathname);
            } else if (userRole === 'individual') {
                // Individual user only - check their preferred dashboard
                const { data: individualProfile } = await supabase
                    .from('individual_profiles')
                    .select('preferred_dashboard')
                    .eq('id', userId)
                    .single();
                
                const preferredDashboard = individualProfile?.preferred_dashboard;
                
                if (preferredDashboard === 'event-planner') {
                    // User prefers event planner dashboard (individual event planning)
                    navigate(shouldRedirectToDashboard ? '/event-planner' : window.location.pathname);
                } else {
                    // User prefers individual dashboard or no preference set
                    navigate(shouldRedirectToDashboard ? '/individual-dashboard/bids' : window.location.pathname);
                }
            } else {
                // New user with no role set, default to individual dashboard
                navigate(shouldRedirectToDashboard ? '/individual-dashboard/bids' : window.location.pathname);
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
