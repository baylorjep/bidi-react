import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import '../App.css';
import { useNavigate } from 'react-router-dom';

function Signup() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        category: '',
        businessName: '',
        businessCategory: '',
        businessAddress: '',
        website: '',
    });
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { email, password, firstName, lastName, phone, category, businessName, businessCategory, businessAddress, website } = formData;

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

        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: user.id,
                    email: email,
                    role: category,
                },
            ]);

        if (profileError) {
            setErrorMessage(`Profile insertion error: ${profileError.message}`);
            console.error('Profile insertion error:', profileError);
            return;
        }

        if (category === 'individual') {
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
        } else if (category === 'business') {
            const { error: businessError } = await supabase
                .from('business_profiles')
                .insert([
                    {
                        id: user.id,
                        business_name: businessName,
                        business_category: businessCategory,
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
        }

        navigate('/success-signup'); // Redirect to success page
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center">
            <div className="col-lg-6">
                <div className="mb-5 mb-lg-0 text-center">
                    <h1 className="SignUpPageHeader" style={{ marginTop: '40px' }}>Create an Account</h1>
                    {errorMessage && <p className="text-danger">{errorMessage}</p>}
                </div>
                <form onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                        <select
                            className="form-control"
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="">I am a...</option>
                            <option value="business">Business</option>
                            <option value="individual">Individual</option>
                        </select>
                        <label htmlFor="category">Category</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="email">Email Address</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="password">Password</label>
                    </div>
                    
                    {formData.category !== 'business' && (
                        <>
                            <div className="form-floating mb-3">
                                <input
                                    className="form-control"
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    placeholder="Enter first name..."
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                                <label htmlFor="firstName">First Name</label>
                            </div>
                            <div className="form-floating mb-3">
                                <input
                                    className="form-control"
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    placeholder="Enter last name..."
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                                <label htmlFor="lastName">Last Name</label>
                            </div>
                        </>
                    )}
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="(123) 456-7890"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="phone">Phone Number</label>
                    </div>
                    

                    {formData.category === 'business' && (
                        <>
                            <div className="form-floating mb-3">
                                <input
                                    className="form-control"
                                    id="businessName"
                                    name="businessName"
                                    type="text"
                                    placeholder="Business Name"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    required
                                />
                                <label htmlFor="businessName">Business Name</label>
                            </div>
                            <div className="form-floating mb-3">
                                <select
                                    className="form-control"
                                    id="businessCategory"
                                    name="businessCategory"
                                    value={formData.businessCategory}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select a category...</option>
                                    <option value="cleaning">Home Cleaning</option>
                                    <option value="photography">Photo Shoot</option>
                                    <option value="landscaping">Landscaping</option>
                                    <option value="plumbing">Plumbing</option>
                                    <option value="electrical">Electrical</option>
                                    <option value="moving">Moving</option>
                                    <option value="other">Other</option>
                                </select>
                                <label htmlFor="businessCategory">Business Category</label>
                            </div>
                            <div className="form-floating mb-3">
                                <input
                                    className="form-control"
                                    id="businessAddress"
                                    name="businessAddress"
                                    type="text"
                                    placeholder="Business Address"
                                    value={formData.businessAddress}
                                    onChange={handleChange}
                                    required
                                />
                                <label htmlFor="businessAddress">Business Address</label>
                            </div>
                            <div className="form-floating mb-3">
                                <input
                                    className="form-control"
                                    id="website"
                                    name="website"
                                    type="url"
                                    placeholder="Business Website"
                                    value={formData.website}
                                    onChange={handleChange}
                                />
                                <label htmlFor="website">Website (Optional)</label>
                            </div>
                        </>
                    )}

                    <div className="d-grid">
                        <button type="submit" className="btn btn-secondary btn-lg w-100">Sign Up</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Signup;
