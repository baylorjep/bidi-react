import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import HearAboutUsModal from '../Modals/HearAboutUsModal';
import './ChoosePricingPlan.css';

const SignIn = ({ onSuccess, isModal = false }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentProfile, setCurrentProfile] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const redirectTo = location.state?.from || '/';

    // Check if user is already authenticated and redirect to appropriate dashboard
    useEffect(() => {
        const checkAuthAndRedirect = async () => {
            // Check for access token in URL hash (Google OAuth redirect)
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                console.log('Access token found in URL hash, processing OAuth redirect');
                
                // Wait a moment for Supabase to process the session
                setTimeout(async () => {
                    try {
                        const { data, error } = await supabase.auth.getSession();
                        if (error) {
                            console.error('Error getting session from hash:', error);
                            return;
                        }
                        
                        if (data.session?.user) {
                            console.log('OAuth session established, redirecting to auth-callback');
                            // Redirect to auth-callback to handle profile creation
                            navigate('/auth-callback');
                            return;
                        }
                    } catch (error) {
                        console.error('Error processing OAuth redirect:', error);
                    }
                }, 1000);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                console.log('User already authenticated, redirecting to dashboard');
                
                // Check user's profile to determine where to redirect
                const { data: individualProfile } = await supabase
                    .from('individual_profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                const { data: businessProfile } = await supabase
                    .from('business_profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                // Handle individual user
                if (individualProfile && !businessProfile) {
                    const preferredDashboard = individualProfile.preferred_dashboard;
                    
                    if (preferredDashboard === 'event-planner') {
                        navigate('/event-planner');
                    } else {
                        navigate('/individual-dashboard/bids');
                    }
                }
                // Handle business user
                else if (businessProfile && !individualProfile) {
                    navigate('/business-dashboard/dashboard');
                }
                // Handle user with both profiles (event planner)
                else if (businessProfile && individualProfile) {
                    navigate('/event-planner-dashboard/home');
                }
                // Handle new user with no profiles (should be handled by MissingProfileModal)
                else {
                    // User has no profile, MissingProfileModal will handle this
                    console.log('User authenticated but no profile found - MissingProfileModal will handle');
                }
            }
        };

        checkAuthAndRedirect();

        // Also listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                console.log('Auth state change: SIGNED_IN, redirecting to auth-callback');
                navigate('/auth-callback');
            }
        });

        return () => {
            if (authListener?.subscription) {
                authListener.subscription.unsubscribe();
            }
        };
    }, [navigate]);

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

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
                return;
            }

            if (data.user) {
                // Check if user has an individual profile
                const { data: individualProfile, error: individualError } = await supabase
                    .from('individual_profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                // Check if user has a business profile
                const { data: businessProfile, error: businessError } = await supabase
                    .from('business_profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                // If we have an onSuccess callback (from AuthModal), use it
                if (onSuccess) {
                    // Check if there's a pending request context
                    const pendingContext = sessionStorage.getItem('pendingRequestContext');
                    if (pendingContext) {
                        try {
                            const requestData = JSON.parse(pendingContext);
                            const now = Date.now();
                            const timeDiff = now - requestData.timestamp;
                            
                            // Only restore if request context is less than 10 minutes old
                            if (timeDiff < 10 * 60 * 1000) {
                                console.log('Found pending request context, calling onSuccess with user data');
                                sessionStorage.removeItem('pendingRequestContext');
                                onSuccess(data.user);
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
                    
                    // No pending request context, just call onSuccess
                    onSuccess(data.user);
                    return;
                }

                // Otherwise, handle navigation based on user type
                // Handle individual user
                if (individualProfile && !businessProfile) {
                    // Check user's preferred dashboard
                    const preferredDashboard = individualProfile.preferred_dashboard;
                    
                    if (preferredDashboard === 'event-planner') {
                        // User prefers event planner dashboard
                        navigate('/event-planner');
                    } else {
                        // User prefers individual dashboard or no preference set
                        navigate('/individual-dashboard/bids');
                    }
                }
                // Handle business user
                else if (businessProfile && !individualProfile) {
                    navigate('/business-dashboard/dashboard');
                }
                // Handle user with both profiles (event planner)
                else if (businessProfile && individualProfile) {
                    navigate('/event-planner-dashboard/home');
                }
                // Handle new user with no profiles
                else {
                    // New user, redirect to individual dashboard
                    navigate('/individual-dashboard/bids');
                }
            }
        } catch (error) {
            console.error('Sign in error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setErrorMessage('');
        
        try {
            // Check if there's already a pending request context in sessionStorage
            const existingContext = sessionStorage.getItem('pendingRequestContext');
            if (existingContext) {
                console.log('Using existing pending request context from sessionStorage');
            } else {
                console.log('No pending request context found in sessionStorage');
            }
            
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth-callback`
                }
            });

            if (error) {
                setErrorMessage(`Google sign-in error: ${error.message}`);
                console.error('Google sign-in error:', error);
            }
            // Google OAuth will redirect to /auth-callback where we handle profile creation
        } catch (error) {
            setErrorMessage(`Unexpected error during Google sign-in: ${error.message}`);
            console.error('Unexpected error during Google sign-in:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {!isModal && (
                <Helmet>
                    <title>Sign In to Bidi</title>
                    <meta name="description" content="Sign in to Bidi for a smart bidding platform that connects you with top professionals. Request services with ease and simplify your search today." />
                </Helmet>
            )}

            <div className={`pricing-container ${isModal ? 'modal-signin' : ''}`} style={{ 
                height: isModal ? 'auto' : '70vh', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexDirection: 'column',
                width: isModal ? '100%' : 'auto',
                maxWidth: isModal ? '100%' : 'none',
                position: isModal ? 'relative' : 'static'
            }}>
                {console.log('SignIn component - isModal:', isModal)}
                {isModal && (
                    <button 
                                                onClick={() => {
                            console.log('Close button clicked in SignIn modal');
                            // Find the parent modal and close it
                            const modal = document.querySelector('.sign-up-modal');
                            if (modal) {
                                const closeEvent = new Event('closeModal');
                                modal.dispatchEvent(closeEvent);
                            }
                        }}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: '#ff0000',
                            border: '2px solid #fff',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            width: '32px',
                            height: '32px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                            color: '#fff'
                        }}
                        title="Close modal"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                )}
                <div className="pricing-header" style={{ marginBottom:'20px' }}>
                    <h1 className={`pricing-title landing-page-title heading-reset ${isModal ? 'modal-title' : ''}`}>
                        Welcome Back to Bidi
                    </h1>
                </div>

                

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    marginTop: '20px'
                }}>
                    <div className="plan-card" style={{
                        maxWidth: isModal ? '100%' : '400px',
                        width: '100%',
                        padding: isModal ? '20px' : '40px'
                    }}>
                        {(error || errorMessage) && (
                            <div style={{
                                color: '#dc3545',
                                marginBottom: '20px',
                                textAlign: 'center',
                                padding: '10px',
                                borderRadius: '8px',
                                backgroundColor: '#fff3f3',
                                border: '1px solid #dc3545'
                            }}>
                                {error === 'Invalid login credentials' ? 'Incorrect email or password' : (error || errorMessage)}
                            </div>
                        )}

<button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    color: '#374151',
                                    fontSize: '1rem',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    marginBottom: '20px',
                                    opacity: loading ? 0.6 : 1
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                {loading ? 'Signing in...' : 'Continue with Google'}
                            </button>

                            <div style={{
                                textAlign: 'center',
                                marginBottom: '20px',
                                position: 'relative'
                            }}>
                                <div style={{
                                    borderTop: '1px solid #e5e7eb',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '0',
                                    right: '0',
                                    zIndex: 1
                                }}></div>
                                <span style={{
                                    backgroundColor: 'white',
                                    padding: '0 16px',
                                    color: '#6b7280',
                                    fontSize: '14px',
                                    position: 'relative',
                                    zIndex: 2
                                }}>
                                    or
                                </span>
                            </div>

                        <form onSubmit={handleSignIn}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '500'
                                }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="name@example.com"
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '500'
                                }}>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '1rem'
                                    }}
                                    placeholder="Enter your password"
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="plan-button"
                                style={{
                                    width: '100%',
                                    marginBottom: '20px'
                                }}
                                disabled={loading}
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>





                            <div style={{
                                textAlign: 'center',
                                marginBottom: '20px'
                            }}>
                                <Link 
                                    to="/request-password-reset"
                                    style={{
                                        color: 'var(--primary-color, #A328F4)',
                                        textDecoration: 'none',
                                        fontWeight: '500'
                                    }}
                                >
                                    Forgot your password?
                                </Link>
                            </div>

                            <div style={{
                                textAlign: 'center',
                                color: '#666'
                            }}>
                                Don't have an account?{' '}
                                <Link 
                                    to="/createaccount"
                                    style={{
                                        color: 'var(--primary-color, #A328F4)',
                                        textDecoration: 'none',
                                        fontWeight: '500'
                                    }}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <HearAboutUsModal 
                isOpen={showSourceModal}
                onClose={async () => {
                    setShowSourceModal(false);
                    if (currentProfile?.role === 'individual') {
                        if (onSuccess) {
                            onSuccess();
                        } else {
                            // Check if user has existing data to determine best dashboard
                            const hasWeddingPlan = await checkForWeddingPlan(currentUserId);
                            const hasIndividualRequests = await checkForIndividualRequests(currentUserId);
                            
                            if (hasWeddingPlan || hasIndividualRequests) {
                                // User has existing data, go to dashboard selector
                                navigate('/dashboard-selector');
                            } else {
                                // New user, go to individual dashboard
                                navigate('/individual-dashboard', {
                                    state: { 
                                        source: localStorage.getItem('requestSource') || 
                                               JSON.parse(localStorage.getItem('requestFormData') || '{}').source || 
                                               'general',
                                        from: 'signin',
                                        activeSection: 'bids'
                                    }
                                });
                            }
                        }
                    } else if (currentProfile?.role === 'business') {
                        navigate('/business-dashboard');
                    } else if (currentProfile?.role === 'both') {
                        navigate('/wedding-planner-dashboard/home');
                    }
                }}
                userId={currentUserId}
            />
        </>
    );
}

export default SignIn;
