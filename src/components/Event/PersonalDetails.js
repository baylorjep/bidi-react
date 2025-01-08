import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';

function PersonalDetails({ formData, nextStep, prevStep, source: propSource }) {
    

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const currentStep = 2;
    const location = useLocation();
    const serviceType = localStorage.getItem('serviceType');
    const isFromPhotographyRequest = location.pathname === '/personal-details' && location.state?.from === 'event-details';
    const [userInfo, setUserInfo] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: ''
    });


    const isFromAdditionalComments = location.state?.from === 'additionalComments';
    const [source] = useState(() => {
        return propSource || location.state?.source || localStorage.getItem('requestSource');
    });

    useEffect(() => {
        // Store source in localStorage when it changes
        if (source) {
            localStorage.setItem('requestSource', source);
        }
    }, [source]);

    // Fetch user info when the component mounts
    useEffect(() => {
        const fetchUserInfo = async () => {
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError) {
                setError('Error fetching user information.');
                setLoading(false);
                return;
            }

            if (user) {
                try {
                    // Fetch additional info from the individual_profiles table
                    const { data: userData, error: userError } = await supabase
                        .from('individual_profiles') // Ensure the table name matches
                        .select('first_name, last_name, phone')
                        .eq('id', user.id)  // Use user.id here
                        .single();

                    if (userError) {
                        throw new Error(userError.message);
                    }

                    setUserInfo({
                        firstName: userData.first_name,
                        lastName: userData.last_name,
                        phoneNumber: userData.phone,
                    });
                    setLoading(false);
                } catch (err) {
                    setError('Error loading user information.');
                    setLoading(false);
                }
            } else {
                setError('User not logged in.');
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, []);

    // Handle form input changes
    const handleChange = (e) => {
        const newInfo = { ...userInfo, [e.target.name]: e.target.value };
        setUserInfo(newInfo);
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        localStorage.setItem('photographyRequest', JSON.stringify({
            ...savedForm,
            personalDetails: newInfo
        }));
    };

    useEffect(() => {
        if (typeof nextStep !== 'function' || typeof prevStep !== 'function') {
            console.error('Required props nextStep or prevStep not provided to PersonalDetails');
        }
    }, [nextStep, prevStep]);

    // Handle form submission to update user info
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error: updateError } = await supabase
                    .from('individual_profiles')
                    .update({
                        first_name: userInfo.firstName,
                        last_name: userInfo.lastName,
                        phone: userInfo.phoneNumber
                    })
                    .eq('id', user.id);

                if (updateError) throw new Error(updateError.message);

                // Use the source to determine navigation
                if (source === 'photography') {
                    navigate('/event-photos');
                } else if (typeof nextStep === 'function') {
                    nextStep();
                } else {
                    // Default navigation if no specific route
                    navigate('/upload-photos');
                }
            }
        } catch (err) {
            console.error('Submission error:', err);
            setError(err.message || 'Error updating information.');
        }
    };

    

    if (loading) {
        return <div style={{display:'flex', justifyContent:'center',alignItems:'center', height:"80vh"}}>
                <div>
                    <Spinner />
                </div>
        </div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const handleBack = () => {
        if (serviceType === 'photography') {
            navigate('/event-details');
        } else if (typeof prevStep === 'function') {
            prevStep();
        } else {
            navigate(-1);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '64px', justifyContent: 'center', alignItems: 'center', height: '85vh' }}>
            <div className="request-form-status-container">
                <div className="status-bar-container">
                    {Array.from({ length: 5 }, (_, index) => (
                        <React.Fragment key={index}>
                            <div
                                className={`status-check-container ${
                                    index + 1 === currentStep
                                        ? 'active'
                                        : index + 1 < currentStep
                                        ? 'completed'
                                        : ''
                                }`}
                            >
                                {index + 1 < currentStep ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="32"
                                        height="32"
                                        viewBox="0 0 24 25"
                                        fill="none"
                                        style={{ transform: 'rotate(-90deg)' }} // Rotating to vertical
                                    >
                                        <path
                                            d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z"
                                            fill="white"
                                        />
                                    </svg>
                                ) : (
                                    `0${index + 1}`
                                )}
                            </div>
                            {index < 4 && (
                                <div
                                    className={`status-line ${
                                        index + 1 < currentStep ? 'completed' : ''
                                    }`}
                                ></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className="status-text-container">
                    {['Service Details', 'Personal Details', 'Add Photos', 'Review', 'Submit'].map(
                        (text, index) => (
                            <div
                                className={`status-text ${
                                    index + 1 === currentStep ? 'active' : ''
                                }`}
                                key={index}
                            >
                                {text}
                            </div>
                        )
                    )}
                </div>
            </div>
            <div className='request-form-container-details' style={{alignItems:"normal"}}>
            <h2 className="request-form-header" style={{textAlign:'left', marginBottom:'8px',marginLeft:"40px", marginTop:'20px'}}>Personal Details</h2>
            <p className="Sign-Up-Page-Subheader" style={{textAlign:'left',marginLeft:"20px", marginBottom:'40px'}}>We just want to make sure we have the correct information for you.
                </p>
                <div style={{justifyContent:'center',alignItems:'center',display:'flex', height:"45vh"}}>
                    <form onSubmit={handleSubmit} >
                    <div className='custom-input-container'>
                        <input
                            type="text"
                            name="firstName"
                            value={userInfo.firstName}
                            onChange={handleChange}
                            className='custom-input'
                        />
                        <label htmlFor="firstName" className="custom-label">
                                First Name
                        </label>
                    </div>
                    <div className='custom-input-container'>
                        <input
                            type="text"
                            name="lastName"
                            value={userInfo.lastName}
                            onChange={handleChange}
                            className='custom-input'
                        />
                        <label htmlFor="lastName" className="custom-label">
                                Last Name
                        </label>
                    </div>
                    <div className='custom-input-container'>
                        <input
                            type="text"
                            name="phone"
                            value={userInfo.phoneNumber}
                            onChange={handleChange}
                            className='custom-input'
                        />
                        <label htmlFor="phone" className="custom-label">
                                Phone Number
                        </label>
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
                onClick={handleSubmit} // Call the handleSubmit function
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
