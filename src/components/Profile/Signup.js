import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import '../../App.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './ChoosePricingPlan.css';
import './Signup.css';

const Signup = ({ onSuccess, initialUserType, isModal = false }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        businessName: '',
        businessCategory: [],
        otherBusinessCategory: '',
        businessAddress: '',
        website: '',
        signature: false,
        dropdownOpen: false, // Added for custom dropdown
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [userType, setUserType] = useState('');
    const [termsExpanded, setTermsExpanded] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

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

    const businessCategories = [
        { id: 'photography', label: 'Photography' },
        { id: 'videography', label: 'Videography' },
        { id: 'dj', label: 'DJ' },
        { id: 'florist', label: 'Florist' },
        { id: 'venue', label: 'Venue' },
        { id: 'catering', label: 'Catering' },
        { id: 'cake', label: 'Cake' },
        { id: 'beauty', label: 'Hair & Makeup' },
        { id: 'event planner/coordinator', label: 'Event Planner/Coordinator' },
        { id: 'rental', label: 'Rental' },
        { id: 'photo_booth', label: 'Photo Booth' },
        { id: 'entertainment', label: 'Entertainment' },
        { id: 'decor', label: 'Decor' },
        { id: 'transportation', label: 'Transportation' },
        { id: 'other', label: 'Other' }
    ];

    const handleGoogleSignUp = async () => {
        setIsRedirecting(true);
        setErrorMessage('');
        
        try {
            // Check if there's already a pending request context in sessionStorage
            const existingContext = sessionStorage.getItem('pendingRequestContext');
            if (!existingContext) {
                // Try to get context from RequestModal if available
                const requestModal = document.querySelector('.request-modal');
                if (requestModal) {
                    // Get the request data from the modal's state
                    const requestData = {
                        formData: window.requestModalFormData || {},
                        selectedVendors: window.requestModalSelectedVendors || [],
                        vendor: window.requestModalVendor || null,
                        isEditMode: window.requestModalIsEditMode || false,
                        existingRequestData: window.requestModalExistingRequestData || null,
                        timestamp: Date.now()
                    };
                    
                    // Store in sessionStorage for retrieval after OAuth
                    sessionStorage.setItem('pendingRequestContext', JSON.stringify(requestData));
                    console.log('Stored request context before Google OAuth:', requestData);
                }
            } else {
                console.log('Using existing pending request context from sessionStorage');
            }
            
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth-callback`
                }
            });

            if (error) {
                setErrorMessage(`Google sign-up error: ${error.message}`);
                console.error('Google sign-up error:', error);
            }
            // Google OAuth will redirect to /auth-callback where we handle profile creation
        } catch (err) {
            setErrorMessage(`Unexpected error during Google sign-up: ${err.message}`);
            console.error('Unexpected error during Google sign-up:', err);
        } finally {
            setIsRedirecting(false);
        }
    };

    useEffect(() => {
        if (initialUserType) {
            setUserType(initialUserType);
        } else {
            const params = new URLSearchParams(location.search);
            const type = params.get('type');
            if (type) {
                setUserType(type);
            } else {
                navigate('/createaccount');
            }
        }
    }, [location, navigate, initialUserType]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const redirect = params.get('redirect');
        if (redirect) {
            setRedirectUrl(redirect);
        }
    }, [location]);
    
    const [redirectUrl, setRedirectUrl] = useState('');

    // Handle clicking outside dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if the click is outside the dropdown container
            const dropdownContainer = document.querySelector('[data-dropdown-container]');
            if (dropdownContainer && !dropdownContainer.contains(event.target) && formData.dropdownOpen) {
                setFormData(prev => ({ ...prev, dropdownOpen: false }));
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [formData.dropdownOpen]);

    const handleChange = (e) => {
        if (e.target.type === 'checkbox') {
            const categoryId = e.target.value;
            if (e.target.name === 'signature') {
                setFormData({
                    ...formData,
                    signature: e.target.checked
                });
            } else if (e.target.checked) {
                setFormData({
                    ...formData,
                    businessCategory: [...formData.businessCategory, categoryId]
                });
            } else {
                setFormData({
                    ...formData,
                    businessCategory: formData.businessCategory.filter(id => id !== categoryId)
                });
            }
        } else {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value,
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Passwords do not match");
            return;
        }

        if (!formData.signature) {
            setErrorMessage("You must agree to the terms and conditions by checking the signature box");
            return;
        }

        const { email, password, firstName, lastName, phone, businessName, businessCategory, otherBusinessCategory, businessAddress, website } = formData;
        
        let finalCategories = [...businessCategory];
        // Handle "other" category for any business type that selects it
        if (businessCategory.includes('other') && otherBusinessCategory) {
            finalCategories = finalCategories.filter(cat => cat !== 'other');
            finalCategories.push(otherBusinessCategory);
        }

        const finalUserType = businessCategory.includes('wedding planner/coordinator') ? 'both' : userType;

        // Get referral partner ID from session storage
        const referralPartnerId = sessionStorage.getItem('referralPartnerId');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setErrorMessage(`Sign up error: ${error.message}`);
            console.error('Sign up error:', error);
            return;
        }

        const { user } = data;
        console.log('User signed up:', user);

        // Auto-sign in the user after successful signup
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) {
            setErrorMessage(`Auto-login error after sign up: ${loginError.message}`);
            console.error('Auto-login error after sign up:', loginError);
            return;
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: user.id,
                email: email,
                role: finalUserType,
                referral_partner_id: referralPartnerId
            }]);

        if (profileError) {
            setErrorMessage(`Profile insertion error: ${profileError.message}`);
            console.error('Profile insertion error:', profileError);
            return;
        }

        // Clear the referral partner ID from session storage after successful signup
        sessionStorage.removeItem('referralPartnerId');

        if (finalUserType === 'individual' || finalUserType === 'both') {
            const { error: individualError } = await supabase
                .from('individual_profiles')
                .insert([{
                    id: user.id,
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                }]);

            if (individualError) {
                setErrorMessage(`Individual profile insertion error: ${individualError.message}`);
                console.error('Individual profile insertion error:', individualError);
                return;
            }

            // Check if we're in modal mode and have an onSuccess callback
            if (isModal && onSuccess) {
                // In modal mode, call onSuccess instead of redirecting
                setSuccessMessage('Account created successfully!');
                setIsRedirecting(true);
                setTimeout(() => {
                    onSuccess(user);
                }, 1500);
                return;
            }

            // Auto-sign in and redirect to appropriate dashboard (non-modal mode)
            if (finalUserType === 'both') {
                // Wedding planner - redirect to wedding planning dashboard
                setSuccessMessage('Account created successfully! Redirecting to Wedding Planning Dashboard...');
                setIsRedirecting(true);
                setTimeout(() => navigate('/wedding-planner/overview'), 1500);
            } else {
                // Individual user - redirect to individual dashboard
                setSuccessMessage('Account created successfully! Redirecting to Individual Dashboard...');
                setIsRedirecting(true);
                setTimeout(() => navigate('/individual-dashboard/bids'), 1500);
            }
            return;
        }

        if (finalUserType === 'business' || finalUserType === 'both') {
            const params = new URLSearchParams(location.search);
            const membershipTier = params.get('membership-tier') || 'free';

            const { error: businessError } = await supabase
                .from('business_profiles')
                .insert([{
                    id: user.id,
                    business_name: businessName,
                    business_category: finalCategories,
                    business_address: businessAddress,
                    phone: phone,
                    website: website,
                    membership_tier: membershipTier
                }]);

            if (businessError) {
                setErrorMessage(`Business profile insertion error: ${businessError.message}`);
                console.error('Business profile insertion error:', businessError);
                return;
            }

            // Check if we're in modal mode and have an onSuccess callback
            if (isModal && onSuccess) {
                // In modal mode, call onSuccess instead of redirecting
                setSuccessMessage('Account created successfully!');
                setIsRedirecting(true);
                setTimeout(() => {
                    onSuccess(user);
                }, 1500);
                return;
            }

            // Auto-sign in and redirect to business dashboard (non-modal mode)
            setSuccessMessage('Account created successfully! Redirecting to Business Dashboard...');
            setIsRedirecting(true);
            setTimeout(() => navigate('/business-dashboard/dashboard'), 1500);
            return;
        }

        // Fallback redirect (shouldn't reach here)
        if (isModal && onSuccess) {
            // In modal mode, call onSuccess instead of redirecting
            onSuccess(user);
        } else if (!onSuccess) {
            navigate(redirectUrl || '/success-signup');
        }
    };

    return (
        <>
            {!isModal && (
                <Helmet>
                    <title>Sign Up - Bidi</title>
                    <meta name="description" content="Create an account on Bidi to connect with top wedding vendors and services." />
                    <meta name="keywords" content="sign up, create account, wedding vendors, Bidi" />
                </Helmet>
            )}
            
            <div className={`pricing-container ${isModal ? 'modal-signup' : ''}`} style={{ 
                backgroundColor: 'white', 
                borderRadius: isModal ? '8px' : '20px', 
                padding: isModal ? '20px' : '40px', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexDirection: 'column',
                width: isModal ? '100%' : 'auto',
                maxWidth: isModal ? '100%' : 'none',
                position: isModal ? 'relative' : 'static'
            }}>
                {isModal && (
                    <button 
                        className="modal-close-button"
                        onClick={() => {
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
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                )}
                <div className="pricing-header">
                    <h1 className={`pricing-title landing-page-title heading-reset ${isModal ? 'modal-title' : ''}`}>
                        Create Your Account
                    </h1>
                </div>

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    marginTop: '20px'
                }}>
                    <div style={{
                        maxWidth: isModal ? '100%' : '800px',
                        width: '100%',
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

                        {successMessage && (
                            <div style={{
                                color: '#28a745',
                                marginBottom: '20px',
                                textAlign: 'center',
                                padding: '10px',
                                borderRadius: '8px',
                                backgroundColor: '#d4edda',
                                border: '1px solid #c3e6cb'
                            }}>
                                {successMessage}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleGoogleSignUp}
                            disabled={isRedirecting}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                backgroundColor: 'white',
                                color: '#374151',
                                fontSize: '1rem',
                                cursor: isRedirecting ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginBottom: '20px',
                                opacity: isRedirecting ? 0.6 : 1
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.08z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            {isRedirecting ? 'Redirecting...' : 'Continue with Google'}
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

                        <form onSubmit={handleSubmit}>
                            {userType === 'business' && (
                                <div className='sign-up-single-column'>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontWeight: '500'
                                        }}>Business Name</label>
                                        <input
                                            type="text"
                                            name="businessName"
                                            value={formData.businessName}
                                            onChange={handleChange}
                                            required
                                            disabled={isRedirecting}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '1rem',
                                                opacity: isRedirecting ? 0.6 : 1
                                            }}
                                            placeholder="Enter your business name"
                                        />
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontWeight: '500'
                                        }}>Business Categories</label>
                                        {formData.businessCategory.includes('wedding planner/coordinator') ? (
                                            // Show checkboxes for wedding planners who can have multiple categories
                                            <div className="category-grid">
                                                {businessCategories.map((category) => (
                                                    <div 
                                                        key={category.id} 
                                                        className="category-item"
                                                        onClick={() => {
                                                            const checkbox = document.getElementById(category.id);
                                                            checkbox.checked = !checkbox.checked;
                                                            handleChange({ target: checkbox });
                                                        }}
                                                    >
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={category.id}
                                                                value={category.id}
                                                                checked={formData.businessCategory.includes(category.id)}
                                                                onChange={handleChange}
                                                            />
                                                            <label 
                                                                className="form-check-label"
                                                                htmlFor={category.id}
                                                            >
                                                                {category.label}
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // Show custom dropdown with checkboxes for other business types
                                            <div style={{ position: 'relative' }} data-dropdown-container>
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData({
                                                            ...formData,
                                                            dropdownOpen: !formData.dropdownOpen
                                                        });
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #ddd',
                                                        fontSize: '1rem',
                                                        backgroundColor: 'white',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <span style={{ color: formData.businessCategory.length > 0 ? '#333' : '#999' }}>
                                                        {formData.businessCategory.length > 0 
                                                            ? `${formData.businessCategory.length} category${formData.businessCategory.length > 1 ? 'ies' : 'y'} selected`
                                                            : 'Select business categories'
                                                        }
                                                    </span>
                                                    <span style={{ fontSize: '12px' }}>▼</span>
                                                </div>
                                                
                                                {formData.dropdownOpen && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        left: 0,
                                                        right: 0,
                                                        backgroundColor: 'white',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                        zIndex: 1000,
                                                        maxHeight: '200px',
                                                        overflowY: 'auto'
                                                    }}>
                                                        {businessCategories.map((category) => (
                                                            <div 
                                                                key={category.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const isSelected = formData.businessCategory.includes(category.id);
                                                                    if (isSelected) {
                                                                        setFormData({
                                                                            ...formData,
                                                                            businessCategory: formData.businessCategory.filter(id => id !== category.id)
                                                                        });
                                                                    } else {
                                                                        setFormData({
                                                                            ...formData,
                                                                            businessCategory: [...formData.businessCategory, category.id]
                                                                        });
                                                                    }
                                                                }}
                                                                style={{
                                                                    padding: '10px 12px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '10px',
                                                                    borderBottom: '1px solid #f0f0f0',
                                                                    backgroundColor: formData.businessCategory.includes(category.id) ? '#f8f9ff' : 'white'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (!formData.businessCategory.includes(category.id)) {
                                                                        e.target.style.backgroundColor = '#f5f5f5';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (!formData.businessCategory.includes(category.id)) {
                                                                        e.target.style.backgroundColor = 'white';
                                                                    }
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.businessCategory.includes(category.id)}
                                                                    readOnly
                                                                    style={{
                                                                        accentColor: '#A328F4',
                                                                        transform: 'scale(1.2)',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                />
                                                                <span>{category.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {formData.businessCategory.includes('other') && (
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{
                                                display: 'block',
                                                marginBottom: '8px',
                                                fontWeight: '500'
                                            }}>Specify Your Business Category</label>
                                            <input
                                                type="text"
                                                name="otherBusinessCategory"
                                                value={formData.otherBusinessCategory}
                                                onChange={handleChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #ddd',
                                                    fontSize: '1rem'
                                                }}
                                                placeholder="Enter your business category"
                                            />
                                        </div>
                                    )}

                                    {formData.businessCategory.includes('wedding planner/coordinator') && (
                                        <>
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{
                                                    display: 'block',
                                                    marginBottom: '8px',
                                                    fontWeight: '500'
                                                }}>First Name</label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    required
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #ddd',
                                                        fontSize: '1rem'
                                                    }}
                                                    placeholder="Enter your first name"
                                                />
                                            </div>

                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{
                                                    display: 'block',
                                                    marginBottom: '8px',
                                                    fontWeight: '500'
                                                }}>Last Name</label>
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    required
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #ddd',
                                                        fontSize: '1rem'
                                                    }}
                                                    placeholder="Enter your last name"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontWeight: '500'
                                        }}>Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '1rem'
                                            }}
                                            placeholder="Enter your phone number"
                                        />
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{
                                            display: 'block',
                                            fontWeight: '500',
                                            marginBottom: '0px'
                                        }}>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            disabled={isRedirecting}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '1rem',
                                                marginBottom: '0px',
                                                opacity: isRedirecting ? 0.6 : 1
                                            }}
                                            placeholder="name@example.com"
                                        />
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontWeight: '500'
                                        }}>Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '1rem'
                                            }}
                                            placeholder="Create a password"
                                        />
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontWeight: '500'
                                        }}>Confirm Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '1rem'
                                            }}
                                            placeholder="Confirm your password"
                                        />
                                    </div>
                                </div>
                            )}

                            {userType === 'individual' && (
                                <div className='sign-up-grid-container'>
                                    <div className="individual-input-group first-name-group">
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{
                                                display: 'block',
                                                marginBottom: '8px',
                                                fontWeight: '500'
                                            }}>First Name</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required
                                                disabled={isRedirecting}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #ddd',
                                                    fontSize: '1rem',
                                                    opacity: isRedirecting ? 0.6 : 1
                                                }}
                                                placeholder="Enter your first name"
                                            />
                                        </div>
                                    </div>

                                    <div className="individual-input-group last-name-group">
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{
                                                display: 'block',
                                                marginBottom: '8px',
                                                fontWeight: '500'
                                            }}>Last Name</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #ddd',
                                                    fontSize: '1rem'
                                                }}
                                                placeholder="Enter your last name"
                                            />
                                        </div>
                                    </div>

                                    <div className="individual-input-group phone-group">
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{
                                                display: 'block',
                                                marginBottom: '8px',
                                                fontWeight: '500'
                                            }}>Phone Number</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #ddd',
                                                    fontSize: '1rem'
                                                }}
                                                placeholder="Enter your phone number"
                                            />
                                        </div>
                                    </div>

                                    <div className="individual-input-group email-group">
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{
                                                display: 'block',
                                                marginBottom: '8px',
                                                fontWeight: '500'
                                            }}>Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
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
                                    </div>

                                    <div className="individual-input-group password-group">
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{
                                                display: 'block',
                                                marginBottom: '8px',
                                                fontWeight: '500'
                                            }}>Password</label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #ddd',
                                                    fontSize: '1rem'
                                                }}
                                                placeholder="Create a password"
                                            />
                                        </div>
                                    </div>

                                    <div className="individual-input-group confirm-password-group">
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{
                                                display: 'block',
                                                marginBottom: '8px',
                                                fontWeight: '500'
                                            }}>Confirm Password</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #ddd',
                                                    fontSize: '1rem'
                                                }}
                                                placeholder="Confirm your password"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}


                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px'
                                }}>
                                    <input
                                        type="checkbox"
                                        name="signature"
                                        id={userType === 'individual' ? 'signature-individual' : 'signature'}
                                        checked={formData.signature}
                                        onChange={handleChange}
                                        required
                                        disabled={isRedirecting}
                                        style={{
                                            marginTop: '3px',
                                            transform: 'scale(1.2)',
                                            opacity: isRedirecting ? 0.6 : 1
                                        }}
                                    />
                                    <label 
                                        htmlFor={userType === 'individual' ? 'signature-individual' : 'signature'}
                                        style={{
                                            fontSize: '0.9rem',
                                            color: '#666',
                                            lineHeight: '1.4'
                                        }}
                                    >
                                        {userType === 'individual' ? (
                                            <>
                                                I agree to the <a href="/terms" target="_blank" style={{ color: 'var(--primary-color, #A328F4)', textDecoration: 'none' }}>Terms of Service</a> and <a href="/privacy" target="_blank" style={{ color: 'var(--primary-color, #A328F4)', textDecoration: 'none' }}>Privacy Policy</a>, including the{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => setTermsExpanded(!termsExpanded)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--primary-color, #A328F4)',
                                                        textDecoration: 'underline',
                                                        cursor: 'pointer',
                                                        padding: 0,
                                                        font: 'inherit'
                                                    }}
                                                >
                                                    payment terms
                                                </button>
                                                . I understand that by creating an account, I consent to receive communications from Bidi regarding my account and services.
                                                
                                                {termsExpanded && (
                                                    <div style={{
                                                        marginTop: '10px',
                                                        padding: '12px',
                                                        backgroundColor: '#f8f9fa',
                                                        borderRadius: '6px',
                                                        border: '1px solid #e9ecef',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        <strong>📄 Bidi User Agreement — Payment Terms:</strong><br />
                                                        By submitting a request on Bidi, I agree to pay all vendors discovered through Bidi through the Bidi platform. I acknowledge that Bidi provides a marketplace and communication tools at no cost to me and is funded through transaction fees paid by vendors. Circumventing Bidi's payment system by paying vendors directly undermines the platform and is strictly prohibited. If I engage a vendor I discovered on Bidi and do not complete payment through the Bidi platform, I may be held responsible for any resulting damages or losses incurred by Bidi, including the vendor's unpaid referral fees.
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                I agree to the <a href="/terms" target="_blank" style={{ color: 'var(--primary-color, #A328F4)', textDecoration: 'none' }}>Terms of Service</a> and <a href="/privacy" target="_blank" style={{ color: 'var(--primary-color, #A328F4)', textDecoration: 'none' }}>Privacy Policy</a>, including the{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => setTermsExpanded(!termsExpanded)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--primary-color, #A328F4)',
                                                        textDecoration: 'underline',
                                                        cursor: 'pointer',
                                                        padding: 0,
                                                        font: 'inherit'
                                                    }}
                                                >
                                                    vendor agreement terms
                                                </button>
                                                . I understand that by creating an account, I consent to receive communications from Bidi regarding my account and services.
                                                
                                                {termsExpanded && (
                                                    <div style={{
                                                        marginTop: '10px',
                                                        padding: '12px',
                                                        backgroundColor: '#f8f9fa',
                                                        borderRadius: '6px',
                                                        border: '1px solid #e9ecef',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        <strong>📄 Bidi Vendor Agreement — Referral Protection Clause:</strong><br />
                                                        <strong>Referral Fee Obligation</strong><br />
                                                        By registering as a vendor on Bidi, you ("Vendor") agree to the following:<br /><br />
                                                        If a customer ("User") is introduced to you through the Bidi platform—whether by submitting a request, viewing your profile, or otherwise discovering your business through Bidi—and you accept payment outside of Bidi's payment system, you agree to pay Bidi a referral fee equal to ten percent (10%) of all amounts you receive from that User in connection with the booked services.<br /><br />
                                                        You must remit the 10% referral fee to Bidi within seven (7) calendar days of receiving each payment from the User, including any deposits, retainers, installment payments, or final balances.<br /><br />
                                                        Failure to remit the required referral fee may result in suspension or termination of your account and/or additional collection efforts.
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="plan-button"
                                disabled={isRedirecting}
                                style={{
                                    width: '100%',
                                    marginBottom: '20px',
                                    opacity: isRedirecting ? 0.6 : 1,
                                    cursor: isRedirecting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isRedirecting ? 'Redirecting...' : 'Create Account'}
                            </button>



                            <div style={{
                                textAlign: 'center',
                                color: '#666'
                            }}>
                                Already have an account?{' '}
                                <a 
                                    href="/signin" 
                                    style={{
                                        color: 'var(--primary-color, #A328F4)',
                                        textDecoration: 'none',
                                        fontWeight: '500'
                                    }}
                                >
                                    Log In
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Signup;
