import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Link } from 'react-router-dom';

function PersonalDetails({ onUpdate }) {
    const [userDetails, setUserDetails] = useState(null); // State for user details
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setErrorMessage] = useState('');
    const [hasAccount, setHasAccount] = useState(null); // State to manage account status
    const [userType, setUserType] = useState('');
    const [loading, setLoading] = useState(true); // Loading state
    
    const navigate = useNavigate();
    const location = useLocation();

    // Check if user is authenticated
    const checkUserIsAuthenticated = async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
            console.error('Error fetching user:', error.message);
            return false;
        }
        return !!data.user;
    };

    useEffect(() => {
        const checkAuthentication = async () => {
            const isAuthenticated = await checkUserIsAuthenticated();
            console.log('User authenticated:', isAuthenticated); // true or false
        };
        checkAuthentication();
    }, []);

    // Get user type from URL parameters
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const type = params.get('type');
        if (type) {
            setUserType(type);
        } 
    }, [location, navigate]);

    // Fetch complete user details from both tables
    useEffect(() => {
        const fetchUserDetails = async () => {
            setLoading(true); // Start loading
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw new Error(sessionError.message);

                if (session) {
                    setIsAuthenticated(true);
                    // Fetch user profile data from both tables
                    const { data: individualData, error: individualError } = await supabase
                        .from('individual_profiles')
                        .select('first_name, last_name, phone')
                        .eq('id', session.user.id)
                        .single();
                    if (individualError) throw new Error(individualError.message);

                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('email')
                        .eq('id', session.user.id)
                        .single();
                    if (profileError) throw new Error(profileError.message);

                    setUserDetails({ ...individualData, email: profileData.email });
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                console.error('Error fetching user details:', err);
                setErrorMessage('Failed to fetch user details.');
                setIsAuthenticated(false);
            } finally {
                setLoading(false); // End loading
            }
        };

        fetchUserDetails();
    }, [navigate]);

    // Spinner Component for loading state
    const Spinner = () => <div className="spinner"></div>;

    // Display loading spinner if userDetails is null
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '80vh',
                textAlign: 'center'
            }}>
                Loading... <Spinner />
            </div>
        );
    }

    // Update form data on input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle sign-up submission
    const handleSubmitSignUp = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Passwords do not match");
            return;
        }
        const { email, password, firstName, lastName, phone, businessName, businessCategory, otherBusinessCategory, businessAddress, website } = formData;
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            setErrorMessage(`Sign up error: ${error.message}`);
            console.error('Sign up error:', error);
            return;
        }
        const { user } = data;
        console.log('User signed up:', user);

        // Insert user profile
        const { error: profileError } = await supabase.from('profiles').insert([{ id: user.id, email, role: 'individual' }]);
        if (profileError) {
            setErrorMessage(`Profile insertion error: ${profileError.message}`);
            console.error('Profile insertion error:', profileError);
            return;
        }

        // Insert individual or business profile based on user type
        if (userType === 'individual') {
            const { error: individualError } = await supabase
                .from('individual_profiles')
                .insert([{ id: user.id, first_name: firstName, last_name: lastName, phone }]);
            if (individualError) {
                setErrorMessage(`Individual profile insertion error: ${individualError.message}`);
                console.error('Individual profile insertion error:', individualError);
                return;
            }
        } else if (userType === 'business') {
            const { error: businessError } = await supabase
                .from('business_profiles')
                .insert([{ id: user.id, business_name: businessName, business_category: businessCategory === 'other' ? otherBusinessCategory : businessCategory, business_address: businessAddress, phone, website }]);
            if (businessError) {
                setErrorMessage(`Business profile insertion error: ${businessError.message}`);
                console.error('Business profile insertion error:', businessError);
                return;
            }
            if (businessCategory === 'other' && otherBusinessCategory) {
                const { error: otherCategoryError } = await supabase
                    .from('other_service_categories')
                    .insert([{ user_id: user.id, category_name: otherBusinessCategory }]);
                if (otherCategoryError) {
                    setErrorMessage(`Error submitting custom category: ${otherCategoryError.message}`);
                    console.error('Detailed error:', otherCategoryError);
                    return;
                } else {
                    console.log('Custom category inserted successfully');
                }
            }
        }
        navigate('/event-summary'); // Redirect to success page
    };

    // Handle sign-in submission
    const handleSignIn = async (e) => {
        e.preventDefault();
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setErrorMessage(`Sign in error: ${error.message}`);
            console.log(`Sign in error: ${error.message}`);
            return;
        }
        const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profileError) {
            console.error('Fetch profile error:', profileError.message);
            return;
        }
        profile.role === 'individual' ? navigate('/event-summary') : navigate('/dashboard');
    };

    // Toggle edit mode
    const handleEditClick = () => setIsEditing(!isEditing);

    // Update form data on edit input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    // Handle profile update
    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(formData); // Call update function with new data
        setIsEditing(false);
        navigate('/event-summary');
    };

    // Handle navigation back
    const handleBack = () => navigate('/event-photos');


    if (isAuthenticated === true) {
        return (
                       
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                       <div style={{display:'flex', flexDirection:'row', gap:'64px', justifyContent:'center', alignItems:'center',height:'85vh'}}>
            <div className='request-form-status-container'>
                <div className='status-bar-container'>
                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="300" stroke="black" strokeWidth="2" />
                    </svg>
                    
                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="black" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                    04
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                    05
                    </div>
                    
                </div>
                <div className='status-text-container'>
                    <div className='status-text'>Type of Service</div>
                    <div className='status-text'>Service Details</div>
                    <div className='status-text'>Add Photos</div>
                    <div className='status-text'>Personal Details</div>
                    <div className='status-text'>Submit</div>
                </div>
            </div>
            <div className='request-form-container-details' style={{alignItems:"normal"}}>
                <h2 className="request-form-header" style={{textAlign:'left', marginBottom:'40px',marginLeft:"20px"}}>Personal Details</h2>
                <div style={{ textAlign: 'center', marginTop: '20px', fontFamily:'Inter' }}>
                {!isEditing ? (
                    <>
                        <p style={{fontSize:'40px'}}>First Name: {userDetails.first_name}</p>
                        <p style={{fontSize:'40px'}}>Last Name: {userDetails.last_name}</p>
                        <p style={{fontSize:'40px'}}>Phone: {userDetails.phone}</p>
                        <p style={{fontSize:'40px'}}>Email: {userDetails.email}</p>
                        <button className="landing-page-button"onClick={handleEditClick}>Edit</button>
                    </>
                ) : (
                    <form onSubmit={handleSubmit} style={{width:'100%'}}>
                        <div style={{marginRight:'100px'}}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', }}>
                            <p style={{ fontFamily: 'Inter' }}>First Name</p>
                            <label className="form-floating create-account-form mb-3">
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    style={{ width: '300px', padding: '8px' }} // Set width and padding
                                />
                            </label>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
                            <p style={{ fontFamily: 'Inter' }}>Last Name</p>
                            <label className="form-floating create-account-form mb-3">
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    style={{ width: '300px', padding: '8px' }} // Set width and padding
                                />
                            </label>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginLeft:'40px' }}>
                            <p style={{ fontFamily: 'Inter' }}>Phone</p>
                            <label className="form-floating create-account-form mb-3">
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    style={{ width: '300px', padding: '8px' }} // Set width and padding
                                />
                            </label>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginLeft:'45px'  }}>
                            <p style={{ fontFamily: 'Inter' }}>Email</p>
                            <label className="form-floating create-account-form mb-3">
                                <input
                                    type="text"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    style={{ width: '300px', padding: '8px' }} // Set width and padding
                                />
                            </label>
                        </div>
                        </div>
                        
                        <div style={{display:'flex', justifyContent:'center', gap:'12px'}}>
                            <button className="landing-page-button" type="submit">Save</button>
                            <button className="landing-page-button" type="button" onClick={handleEditClick}>Cancel</button>
                        </div>
                        
                    </form>

                )}
                </div>
                <div className="form-button-container" style={{width:"100%"}}>
                    <button className="request-form-back-and-foward-btn" onClick={handleBack} style={{color:"black"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z" fill="black"/>
                        </svg>
                        Back
                    </button>
                    <button
                    type='submit'
                    className='request-form-back-and-foward-btn'
                    style={{color:'black'}}
                    onClick={handleSubmit}
                    >
                        Next
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"

                        >
                            <path d="M3.99984 13L3.99984 11L15.9998 11L10.4998 5.50004L11.9198 4.08004L19.8398 12L11.9198 19.92L10.4998 18.5L15.9998 13L3.99984 13Z" />
                        </svg>
                    </button>
                </div>
                </div>
                
            </div>
                
            
            </div>
        
        );
    }

    if (isAuthenticated === false) {
        return (
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                       <div style={{display:'flex', flexDirection:'row', gap:'64px', justifyContent:'center', alignItems:'center',height:'85vh'}}>
            <div className='request-form-status-container'>
                <div className='status-bar-container'>
                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="300" stroke="black" strokeWidth="2" />
                    </svg>
                    
                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="black" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                    04
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                    05
                    </div>
                    
                </div>
                <div className='status-text-container'>
                    <div className='status-text'>Type of Service</div>
                    <div className='status-text'>Service Details</div>
                    <div className='status-text'>Add Photos</div>
                    <div className='status-text'>Personal Details</div>
                    <div className='status-text'>Submit</div>
                </div>
            </div>
            <div className='request-form-container-details' style={{alignItems:"normal"}}>
                <h2 className="request-form-header" style={{textAlign:'left', marginBottom:'40px',marginLeft:"20px"}}>Personal Details</h2>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <h2>You need to be signed in to provide event details.</h2>
                
                <h2>Do you already have an account?</h2>
                <button className='landing-page-button'onClick={() => setHasAccount(true)} style={{ marginRight: '10px' }}>Yes</button>
                <button className='landing-page-button'onClick={() => setHasAccount(false)}>No</button>    
                
            </div>
            <div className="form-button-container">
                    <button className="request-form-back-and-foward-btn" onClick={handleBack} style={{color:"black"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z" fill="black"/>
                        </svg>
                        Back
                    </button>
                    <button
                    type='submit'
                    className='request-form-back-and-foward-btn'
                    style={{color:'black'}}
                    >
                        Next
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"

                        >
                            <path d="M3.99984 13L3.99984 11L15.9998 11L10.4998 5.50004L11.9198 4.08004L19.8398 12L11.9198 19.92L10.4998 18.5L15.9998 13L3.99984 13Z" />
                        </svg>
                    </button>
                </div>
            </div>
                
            </div>

            </div>
        );
    }

    if (hasAccount=== false) {
        return (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                
                <div style={{display:'flex', flexDirection:'row', gap:'64px', justifyContent:'center', alignItems:'center',height:'85vh'}}>
            <div className='request-form-status-container'>
                <div className='status-bar-container'>
                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="300" stroke="black" strokeWidth="2" />
                    </svg>
                    
                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="black" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                    04
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                    05
                    </div>
                    
                </div>
                <div className='status-text-container'>
                    <div className='status-text'>Type of Service</div>
                    <div className='status-text'>Service Details</div>
                    <div className='status-text'>Add Photos</div>
                    <div className='status-text'>Personal Details</div>
                    <div className='status-text'>Submit</div>
                </div>
            </div>
            <div className='request-form-container-details' style={{alignItems:"normal"}}>
                <h2 className="request-form-header" style={{textAlign:'left', marginBottom:'40px',marginLeft:"20px"}}>Personal Details</h2>
                <h2>{hasAccount ? "Sign In" : "Create an Account"}</h2>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <h2>You need to sign up so we can track your bids</h2>
                <form onSubmit={handleSubmitSignUp}>
                    <div className="form-floating create-account-form mb-3">
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
                        <label htmlFor="firstName"> First Name</label>
                    </div>
                    <div className="form-floating create-account-form mb-3">
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
                      
                    <div className="form-floating create-account-form mb-3">
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
                
                    <div className="form-floating create-account-form mb-3">
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
                        <label htmlFor="email">Email</label>
                    </div>
                    <div className="form-floating create-account-form mb-3">
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
                    <div className="form-floating create-account-form mb-3">
                        <input
                            className="form-control"
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="confirmPassword">Confirm Password</label>
                    </div>

                    <div className="d-grid">
                        <button type="submit" className="sign-up-button">Sign Up</button>
                    </div>

                </form>
            </div>
            <div className="form-button-container">
                    <button className="request-form-back-and-foward-btn" onClick={handleBack} style={{color:"black"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z" fill="black"/>
                        </svg>
                        Back
                    </button>
                    <button
                    type='submit'
                    className='request-form-back-and-foward-btn'
                    style={{color:'black'}}
                    >
                        Next
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"

                        >
                            <path d="M3.99984 13L3.99984 11L15.9998 11L10.4998 5.50004L11.9198 4.08004L19.8398 12L11.9198 19.92L10.4998 18.5L15.9998 13L3.99984 13Z" />
                        </svg>
                    </button>
                </div>
            </div>
                
            </div>
            </div>
        );
    }



    if (hasAccount === true) return (
        <div style={{display:'flex', flexDirection:'row', gap:'64px', justifyContent:'center', alignItems:'center',height:'85vh'}}>
            <div className='request-form-status-container'>
                <div className='status-bar-container'>
                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="300" stroke="black" strokeWidth="2" />
                    </svg>
                    
                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="black" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                    04
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                    05
                    </div>
                    
                </div>
                <div className='status-text-container'>
                    <div className='status-text'>Type of Service</div>
                    <div className='status-text'>Service Details</div>
                    <div className='status-text'>Add Photos</div>
                    <div className='status-text'>Personal Details</div>
                    <div className='status-text'>Submit</div>
                </div>
            </div>
            <div className='request-form-container-details' style={{alignItems:"normal"}}>
                <h2 className="request-form-header" style={{textAlign:'left', marginBottom:'40px',marginLeft:"20px"}}>Personal Details</h2>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <h2>You need to be signed in to provide event details.</h2>
                <form onSubmit={handleSignIn}>
                    <div className="form-floating create-account-form mb-3">
                        <input
                            className="form-control"
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <label htmlFor="email">Email Address</label>
                    </div>
                    <div className="form-floating create-account-form mb-3">
                        <input
                            className="form-control"
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <label htmlFor="password">Password</label>
                    </div>
                    <div className="forgot-your-password">
                        <Link to="/request-password-reset" className="btn btn-link">
                            Forgot your password?
                        </Link>
                    </div>
                    <div className="sign-in-container">
                        <button type="submit" className="sign-up-button" style={{width:'160px'}}>Sign In</button>
                    </div>
                    <br/>
                    <div className="forgot-your-password"align='center' style={{textDecoration:'none'}}>Don't Have an Account?
                            <a href='/Signup' > Sign Up Here.</a> 
                    </div>
                    
                </form>
            </div>
            <div className="form-button-container">
                    <button className="request-form-back-and-foward-btn" onClick={handleBack} style={{color:"black"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z" fill="black"/>
                        </svg>
                        Back
                    </button>
                    <button
                    type='submit'
                    className='request-form-back-and-foward-btn'
                    style={{color:'black'}}
                    >
                        Next
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"

                        >
                            <path d="M3.99984 13L3.99984 11L15.9998 11L10.4998 5.50004L11.9198 4.08004L19.8398 12L11.9198 19.92L10.4998 18.5L15.9998 13L3.99984 13Z" />
                        </svg>
                    </button>
                </div>
            </div>
                
            </div>
    
        
    );
}

export default PersonalDetails;
