import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import '../../App.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './ChoosePricingPlan.css';

const Signup = ({ onSuccess, initialUserType }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        businessName: '',
        businessCategory: '',
        otherBusinessCategory: '',
        businessAddress: '',
        website: '',
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [userType, setUserType] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoogleSignUp = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
    
            if (error) {
                setErrorMessage(`Google sign-up error: ${error.message}`);
                console.error('Google sign-up error:', error);
            } else {
                console.log('Google sign-up successful:', data);
            }
        } catch (err) {
            setErrorMessage(`Unexpected error during Google sign-up: ${err.message}`);
            console.error('Unexpected error during Google sign-up:', err);
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

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
            ...(e.target.name === 'businessCategory' && e.target.value !== 'other' ? { otherBusinessCategory: '' } : {}),
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Passwords do not match");
            return;
        }

        const { email, password, firstName, lastName, phone, businessName, businessCategory, otherBusinessCategory, businessAddress, website } = formData;
        const finalUserType = businessCategory === 'wedding planner/coordinator' ? 'both' : userType;

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

        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

        if (loginError) {
            setErrorMessage(`Login error after sign up: ${loginError.message}`);
            console.error('Login error:', loginError);
            return;
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: user.id,
                email: email,
                role: finalUserType,
            }]);

        if (profileError) {
            setErrorMessage(`Profile insertion error: ${profileError.message}`);
            console.error('Profile insertion error:', profileError);
            return;
        }

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

            if (onSuccess) {
                onSuccess();
                return;
            }
        }

        if (finalUserType === 'business' || finalUserType === 'both') {
            const params = new URLSearchParams(location.search);
            const membershipTier = params.get('membership-tier') || 'free';

            const { error: businessError } = await supabase
                .from('business_profiles')
                .insert([{
                    id: user.id,
                    business_name: businessName,
                    business_category: businessCategory === 'other' ? otherBusinessCategory : businessCategory,
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

            if (businessCategory === 'other' && otherBusinessCategory) {
                const { error: otherCategoryError } = await supabase
                    .from('other_service_categories')
                    .insert([{
                        user_id: user.id,
                        category_name: otherBusinessCategory,
                    }]);

                if (otherCategoryError) {
                    setErrorMessage(`Error submitting custom category: ${otherCategoryError.message}`);
                    console.error('Detailed error:', otherCategoryError);
                    return;
                }
            }
        }

        if (!onSuccess) {
            navigate(redirectUrl || '/success-signup');
        }
    };

    return (
        <>
            <Helmet>
                <title>Sign Up - Bidi</title>
                <meta name="description" content="Create an account on Bidi to connect with top wedding vendors and services." />
                <meta name="keywords" content="sign up, create account, wedding vendors, Bidi" />
            </Helmet>
            
            <div className="pricing-container">
                <div className="pricing-header">
                    <h1 className="pricing-title landing-page-title heading-reset">
                        Create Your Account
                    </h1>
                </div>

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    marginTop: '20px'
                }}>
                    <div className="plan-card" style={{
                        maxWidth: '800px',
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
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '1rem'
                                            }}
                                            placeholder="Enter your business name"
                                        />
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontWeight: '500'
                                        }}>Business Category</label>
                                        <select
                                            name="businessCategory"
                                            value={formData.businessCategory}
                                            onChange={handleChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '1rem',
                                                backgroundColor: '#fff'
                                            }}
                                        >
                                            <option value="">Select a category...</option>
                                            <option value="photography">Photography</option>
                                            <option value="videography">Videography</option>
                                            <option value="dj">DJ</option>
                                            <option value="cake">Cake Making</option>
                                            <option value="catering">Catering</option>
                                            <option value="hair and makeup artist">Hair and Makeup Artist</option>
                                            <option value="wedding planner/coordinator">Wedding/Event Planner</option>
                                            <option value="florist">Florist</option>
                                            <option value="rental">Rentals</option>
                                            <option value="venue">Venue</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    {formData.businessCategory === 'other' && (
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

                                    {formData.businessCategory === 'wedding planner/coordinator' && (
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
                                            marginBottom: '8px',
                                            fontWeight: '500'
                                        }}>Business Location</label>
                                        <input
                                            type="text"
                                            name="businessAddress"
                                            value={formData.businessAddress}
                                            onChange={handleChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '1rem'
                                            }}
                                            placeholder="State, city, or county (e.g., Utah, Salt Lake City)"
                                        />
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            fontWeight: '500'
                                        }}>Website (Optional)</label>
                                        <input
                                            type="url"
                                            name="website"
                                            value={formData.website}
                                            onChange={handleChange}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '1rem'
                                            }}
                                            placeholder="Enter your website URL"
                                        />
                                    </div>

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
                                    <div>
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

                                    <div>
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
                                </div>
                            )}

                            <div style={{
                                backgroundColor: '#f9f9f9',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '15px',
                                marginBottom: '20px',
                                fontSize: '0.9rem',
                                color: '#666',
                                textAlign: 'center'
                            }}>
                                By signing up, you agree to receive notifications related to your account.
                            </div>

                            <button 
                                type="submit" 
                                className="plan-button"
                                style={{
                                    width: '100%',
                                    marginBottom: '20px'
                                }}
                            >
                                Create Account
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
