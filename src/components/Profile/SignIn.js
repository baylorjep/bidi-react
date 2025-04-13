import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../App.css';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import HearAboutUsModal from '../Modals/HearAboutUsModal';

const SignIn = ({ onSuccess }) => {  // Add onSuccess prop
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentProfile, setCurrentProfile] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Get the 'from' property from the state passed in the Link (SignInModal)
    const redirectTo = location.state?.from || '/'; // Default to home if no redirect

    const handleSignIn = async (e) => {
        e.preventDefault();

        // Get source from localStorage before sign-in
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

        // Fetch the user's profile information
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

        // Only show modal if user hasn't seen it before
        if (!profile.has_seen_source_modal) {
            setCurrentUserId(user.id);
            setShowSourceModal(true);
            return;
        }

        // If user has seen modal, proceed with normal navigation
        if (profile.role === 'individual') {
            if (onSuccess) {
                onSuccess(); // Call the success callback if provided
            } else {
                // Default navigation behavior
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

        <div className="sign-in-container">
                    <Helmet>
        <title>Sign In to Bidi: Request Services with Our Bidding Platform</title>
        <meta name="description" content="Sign in to Bidi for a smart bidding platform that connects you with top professionals. Request services with ease and simplify your search today." />
        <meta name="keywords" content="wedding vendors, wedding services, sign in, Bidi, login, photography, DJs, hair and makeup, florists, catering" />
        <script type="application/ld+json">
                    {`
                        
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "Sign In - Bidi",
                        "url": "https://www.savewithbidi.com/signin",
                        "description": "Sign in to your Bidi account. A bidding platform where you request services, and businesses come to you. Stop searching and start finding with Bidi.",
                        "publisher": {
                        "@type": "Organization",
                        "name": "Bidi",
                        "contactPoint": {
                        "@type": "ContactPoint",
                        "telephone": "385-216-9587",
                        "email": "savewithbidi@gmail.com",
                        "contactType": "customer service"
                        }
                        "sameAs": [
                        "https://www.facebook.com",
                        "https://www.instagram.com",
                        "https://www.linkedin.com"
                        ]
                        }
                        "potentialAction": {
                        "@type": "SignInAction",
                        "name": "Sign In",
                        "target": "https://www.savewithbidi.com/signin"
                        }
                        
                    `}
                </script>
        </Helmet>
                <div className="sign-in-form-container">
                    <br />
                    <h1 className="Sign-Up-Page-Header">Sign In</h1>
                    {errorMessage && <p className="text-danger">{errorMessage}</p>}
           {/* This is a JSX comment 
                    <div className="google-sign-in-container">
                        <p className="google-sign-in-text">Sign in with Google</p>
                 
                        <button
                            type="button"
                            className="btn btn-google-signin"
                            onClick={handleGoogleSignIn}
                        >
                            Sign in with Google
                        </button>
                     
                    </div>
                    
                    <div className="divider">
                        <span>OR</span>
                    </div>
                       */}
                <form style={{width:'100%'}} onSubmit={handleSignIn}>
                <div className='sign-in-input-container'>
                    <label htmlFor="email">Email</label>
                    <input
                        className="sign-in-form"
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    </div>

                    <div>
                    <label htmlFor="password">Password</label>
                        <input
                            className="sign-in-form"
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                    </div>
                    <div className="sign-in-container">
                        <button type="submit" className="sign-up-button">Log In</button>
                    </div>
                    <div className="forgot-your-password" style={{marginTop:'20px'}}>
                        <Link to="/request-password-reset" className="forgot-your-password-highlight">
                            Forgot your password?
                        </Link>
                    </div>

                    <br />
                    <div className="forgot-your-password" align='center' style={{ textDecoration: 'none' }}>
                        Don't Have an Account?
                        <a className='forgot-your-password-highlight' href='/Signup' > Sign Up Here.</a>
                    </div>
                </form>
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
            </div>
    );
}

export default SignIn;  // Make sure this export exists
