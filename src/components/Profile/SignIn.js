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

    const redirectTo = location.state?.from || '/';

    const handleSignIn = async (e) => {
        e.preventDefault();

        const requestSource = localStorage.getItem('requestSource');
        const requestFormData = JSON.parse(localStorage.getItem('requestFormData') || '{}');

        const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMessage(`Sign in error: ${error.message}`);
            console.log(`Sign in error: ${error.message}`);
            return;
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, has_seen_source_modal')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Fetch profile error:', profileError.message);
            return;
        }

        setCurrentProfile(profile);

        if (!profile.has_seen_source_modal) {
            setCurrentUserId(user.id);
            setShowSourceModal(true);
            return;
        }

        if (profile.role === 'individual') {
            if (onSuccess) {
                onSuccess();
            } else {
                navigate(redirectTo, {
                    state: { 
                        source: requestSource || requestFormData.source || 'general',
                        from: 'signin'
                    }
                });
            }
        } else if (profile.role === 'business') {
            navigate('/dashboard');
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
    };

    return (
        <>
            <Helmet>
                <title>Sign In to Bidi</title>
                <meta name="description" content="Sign in to Bidi for a smart bidding platform that connects you with top professionals. Request services with ease and simplify your search today." />
            </Helmet>

            <div className="pricing-container">
                <div className="pricing-header">
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
                onClose={() => {
                    setShowSourceModal(false);
                    if (currentProfile?.role === 'individual') {
                        if (onSuccess) {
                            onSuccess();
                        } else {
                            navigate(redirectTo, {
                                state: { 
                                    source: localStorage.getItem('requestSource') || 
                                           JSON.parse(localStorage.getItem('requestFormData') || '{}').source || 
                                           'general',
                                    from: 'signin'
                                }
                            });
                        }
                    } else if (currentProfile?.role === 'business') {
                        navigate('/dashboard');
                    }
                }}
                userId={currentUserId}
            />
        </>
    );
}

export default SignIn;
