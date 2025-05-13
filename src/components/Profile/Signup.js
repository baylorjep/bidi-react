import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import '../../App.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './ChoosePricingPlan.css';
import './Signup.css';

const Signup = ({ onSuccess, initialUserType }) => {
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
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [userType, setUserType] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const businessCategories = [
        { id: 'photography', label: 'Photography' },
        { id: 'videography', label: 'Videography' },
        { id: 'dj', label: 'DJ' },
        { id: 'florist', label: 'Florist' },
        { id: 'venue', label: 'Venue' },
        { id: 'catering', label: 'Catering' },
        { id: 'cake', label: 'Cake' },
        { id: 'beauty', label: 'Hair & Makeup' },
        { id: 'wedding planner/coordinator', label: 'Wedding Planner/Coordinator' },
        { id: 'rental', label: 'Rental' },
        { id: 'photo_booth', label: 'Photo Booth' },
        { id: 'other', label: 'Other' }
    ];

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
        if (e.target.type === 'checkbox') {
            const categoryId = e.target.value;
            if (e.target.checked) {
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

        const { email, password, firstName, lastName, phone, businessName, businessCategory, otherBusinessCategory, businessAddress, website } = formData;
        
        let finalCategories = [...businessCategory];
        if (businessCategory.includes('other') && otherBusinessCategory) {
            finalCategories = finalCategories.filter(cat => cat !== 'other');
            finalCategories.push(otherBusinessCategory);
        }

        const finalUserType = businessCategory.includes('wedding planner/coordinator') ? 'both' : userType;

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
                                        }}>Business Categories</label>
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
