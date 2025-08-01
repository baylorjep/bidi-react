import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import HearAboutUsModal from '../Modals/HearAboutUsModal';
import './ChoosePricingPlan.css';

const SignIn = ({ onSuccess }) => {
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

            if (error) throw error;

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
                    onSuccess(data.user);
                    return;
                }

                // Otherwise, handle navigation based on user type
                // Handle individual user
                if (individualProfile && !businessProfile) {
                    // Check user's preferred dashboard
                    const preferredDashboard = individualProfile.preferred_dashboard;
                    
                    if (preferredDashboard === 'wedding-planner') {
                        // User prefers wedding planner dashboard
                        navigate('/wedding-planner');
                    } else {
                        // User prefers individual dashboard or no preference set
                        navigate('/individual-dashboard/bids');
                    }
                }
                // Handle business user
                else if (businessProfile && !individualProfile) {
                    navigate('/business-dashboard');
                }
                // Handle user with both profiles (wedding planner)
                else if (businessProfile && individualProfile) {
                    navigate('/wedding-planner-dashboard/home');
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
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });

        if (error) {
            setErrorMessage(`Google sign-in error: ${error.message}`);
            console.error('Google sign-in error:', error);
        }
        // Note: Google OAuth redirects to the app, so the dashboard selection
        // will be handled by the auth state listener in the main app
    };

    return (
        <>
            <Helmet>
                <title>Sign In to Bidi</title>
                <meta name="description" content="Sign in to Bidi for a smart bidding platform that connects you with top professionals. Request services with ease and simplify your search today." />
            </Helmet>

            <div className="pricing-container" style={{ height: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection:'column' }}>
                <div className="pricing-header" style={{ marginBottom:'20px' }}>
                    <h1 className="pricing-title landing-page-title heading-reset">
                        Welcome Back to Bidi
                    </h1>
                </div>

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    marginTop: '20px'
                }}>
                    <div className="plan-card" style={{
                        maxWidth: '400px',
                        width: '100%',
                        padding: '40px'
                    }}>
                        {errorMessage && (
                            <div style={{
                                color: '#dc3545',
                                marginBottom: '20px',
                                textAlign: 'center',
                                padding: '10px',
                                borderRadius: '8px',
                                backgroundColor: '#fff'
                            }}>
                                {errorMessage}
                            </div>
                        )}

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
                            >
                                Sign In
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
