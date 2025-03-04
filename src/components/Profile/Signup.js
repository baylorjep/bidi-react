import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import '../../App.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';


const Signup = ({ onSuccess, initialUserType }) => { // Changed userType prop name to initialUserType
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        businessName: '',
        businessCategory: '',
        otherBusinessCategory: '', // Field for custom business category
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
        if (initialUserType) {  // Use initialUserType instead
            setUserType(initialUserType);
        } else {
            const params = new URLSearchParams(location.search);
            const type = params.get('type');
            if (type) {
                setUserType(type);
            } else {
                navigate('/createaccount'); // Redirect if no user type is selected
            }
        }
    }, [location, navigate, initialUserType]);  // Updated dependency

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const redirect = params.get('redirect');
        if (redirect) {
            // Store this value to navigate after successful signup
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

        // Step 2: Log the user in immediately after sign up
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

        if (loginError) {
            setErrorMessage(`Login error after sign up: ${loginError.message}`);
            console.error('Login error:', loginError);
            return;
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: user.id,
                    email: email,
                    role: userType,
                },
            ]);

        if (profileError) {
            setErrorMessage(`Profile insertion error: ${profileError.message}`);
            console.error('Profile insertion error:', profileError);
            return;
        }

        if (userType === 'individual') {
            const { error: individualError } = await supabase
                .from('individual_profiles')
                .insert([
                    {
                        id: user.id,
                        first_name: firstName,
                        last_name: lastName,
                        phone: phone,
                    },
                ]);

            if (individualError) {
                setErrorMessage(`Individual profile insertion error: ${individualError.message}`);
                console.error('Individual profile insertion error:', individualError);
                return;
            }

            if (onSuccess) {
                onSuccess(); // Call onSuccess callback if provided
                return; // Add return to prevent additional navigation
            }
        } else if (userType === 'business') {
            const { error: businessError } = await supabase
                .from('business_profiles')
                .insert([
                    {
                        id: user.id,
                        business_name: businessName,
                        business_category: businessCategory === 'other' ? otherBusinessCategory : businessCategory,
                        business_address: businessAddress,
                        phone: phone,
                        website: website,
                    },
                ]);

            if (businessError) {
                setErrorMessage(`Business profile insertion error: ${businessError.message}`);
                console.error('Business profile insertion error:', businessError);
                return;
            }

            if (businessCategory === 'other' && otherBusinessCategory) {
                const { error: otherCategoryError } = await supabase
                    .from('other_service_categories')
                    .insert([
                        {
                            user_id: user.id,
                            category_name: otherBusinessCategory,
                        },
                    ]);

                if (otherCategoryError) {
                    setErrorMessage(`Error submitting custom category: ${otherCategoryError.message}`);
                    console.error('Detailed error:', otherCategoryError);
                    return;
                } else {
                    console.log('Custom category inserted successfully');
                }
            }
        }

        // Only navigate to success page if onSuccess wasn't called
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
            <div className="sign-in-container" style={{marginBottom:'20px '}}>
                <div className="sign-in-form-container" style={{height:'auto', padding:'20px'}}>

                    <h1 className="Sign-Up-Page-Header" style={{marginTop:'20px'}}>Create an Account</h1>
                    {errorMessage && <p className="text-danger">{errorMessage}</p>}
                    <form onSubmit={handleSubmit}>
                    {/*<div className="mt-3 text-center">
                        <button
                            type="button"
                            className="btn btn-google-signin"
                            onClick={handleGoogleSignUp}
                            
                        >
                            Sign Up with Google
                        </button>
                    </div>

                    <div className="divider" style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ccc', margin: '0 10px' }} />
                        <span style={{ fontSize: '14px', color: '#666' }}>OR</span>
                        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ccc', margin: '0 10px' }} />
                    </div>*/}

                    {userType === 'business' && (
                        <div className='sign-up-single-column'>
                            <div className="sign-in-input-container">
                                <label htmlFor="businessName">Business Name</label>
                                <input
                                    className="sign-in-form"
                                    id="businessName"
                                    name="businessName"
                                    type="text"
                                    placeholder="Business Name"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="sign-in-input-container">
                                <label htmlFor="businessCategory">Business Category</label>
                                <select
                                    className="sign-in-form"
                                    id="businessCategory"
                                    name="businessCategory"
                                    value={formData.businessCategory}
                                    onChange={handleChange}
                                    required
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
                                <div className="sign-in-input-container">
                                    <label htmlFor="otherBusinessCategory">Please specify your business category</label>
                                    <input
                                        className="sign-in-form"
                                        id="otherBusinessCategory"
                                        name="otherBusinessCategory"
                                        type="text"
                                        placeholder="Specify your business category"
                                        value={formData.otherBusinessCategory}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            )}
                            <div className="sign-in-input-container">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    className="sign-in-form"
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="sign-in-input-container">
                                <label htmlFor="businessAddress">Business Address</label>
                                <input
                                    className="sign-in-form"
                                    id="businessAddress"
                                    name="businessAddress"
                                    type="text"
                                    placeholder="Business Address"
                                    value={formData.businessAddress}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="sign-in-input-container">
                                <label htmlFor="website">Website (Optional)</label>
                                <input
                                    className="sign-in-form"
                                    id="website"
                                    name="website"
                                    type="url"
                                    placeholder="Business Website"
                                    value={formData.website}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="sign-in-input-container">
                                <label htmlFor="email">Email</label>
                                <input
                                    className="sign-in-form"
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="sign-in-input-container">
                                <label htmlFor="password">Password</label>
                                <input
                                    className="sign-in-form"
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="sign-in-input-container">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    className="sign-in-form"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    )}
                {userType === 'individual' && (
                    <div className='sign-up-grid-container'>
                        <div>
                            <div className="sign-in-input-container">
                                <label htmlFor="firstName">First Name</label>
                                <input
                                    className="sign-in-form"
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="sign-in-input-container">
                                <label htmlFor="lastName">Last Name</label>
                                <input
                                    className="sign-in-form"
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="sign-in-input-container">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    className="sign-in-form"
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <div className="sign-in-input-container">
                                <label htmlFor="email">Email</label>
                                <input
                                    className="sign-in-form"
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="sign-in-input-container">
                                <label htmlFor="password">Password</label>
                                <input
                                    className="sign-in-form"
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="sign-in-input-container">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    className="sign-in-form"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                )}

                    <div 
    className="notification-bar" 
    style={{
        backgroundColor: '#f9f9f9', 
        border: '1px solid #ddd', 
        borderRadius: '5px', 
        padding: '10px', 
        marginBottom: '20px',
        fontSize: '14px',
        color: '#555',
        textAlign: 'center'
    }}
>
    By signing up, you consent to receive notifications related to your account. 
</div>

                        <div className="d-grid">
                            <button type="submit" className="sign-up-button">Sign Up</button>
                        </div>

                        <div className='forgot-your-password' style={{marginTop:'20px'}}>
                            <div>Already have an account? <a href="/signin" className='forgot-your-password-highlight'>Log In</a></div>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}

export default Signup;
