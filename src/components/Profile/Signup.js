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
        signature: false,
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [userType, setUserType] = useState('');
    const [termsExpanded, setTermsExpanded] = useState(false);
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
            
            <div className="pricing-container" style={{ backgroundColor: 'white' , borderRadius: '20px', padding: '40px'}}>
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
                    <div style={{
                        maxWidth: '800px',
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
                                            fontWeight: '500',
                                            marginBottom: '0px'
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
                                                fontSize: '1rem',
                                                marginBottom: '0px'
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
                                        <div>
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
                                                    fontSize: '1rem',
                                                    marginBottom:'20px'
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
                                        style={{
                                            marginTop: '3px',
                                            transform: 'scale(1.2)'
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
