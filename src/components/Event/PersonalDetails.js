import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';

function PersonalDetails({ formData, setPersonalDetails, nextStep, prevStep, source: propSource }) {
    const [userInfo, setUserInfo] = useState(() => {
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        return savedForm.personalDetails || {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            email: ''
        };
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const isFromAdditionalComments = location.state?.from === 'additionalComments';
    const source = isFromAdditionalComments ? 'additionalComments' : propSource;

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

    // Handle form submission to update user info
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            try {
                const { error } = await supabase
                    .from('individual_profiles')
                    .update({
                        first_name: userInfo.firstName,
                        last_name: userInfo.lastName,
                        phone: userInfo.phoneNumber
                    })
                    .eq('id', user.id);  // Use user.id here

                if (error) throw new Error(error.message);

                // Navigation logic
                if (source === 'additionalComments') {
                    navigate('/event-photos', { 
                        state: { from: 'additional-comments' } 
                    });
                } else {
                    navigate('/event-photos');
                }
            } catch (err) {
                setError('Error updating information.');
            }
        } else {
            setError('User not logged in.');
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
        if (source === 'additionalComments') {
            navigate('/additional-comments');
        } else {
            navigate('/event-details');
        } 
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '64px', justifyContent: 'center', alignItems: 'center', height: '85vh' }}>
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

                    <div className='status-check-container' style={{ background: "transparent", border: "2px solid gray" }}>
                        02
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{ background: "transparent", border: "2px solid gray" }}>
                        03
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{ background: "transparent", border: "2px solid gray" }}>
                        04
                    </div>
                    <svg width="25px" height="120px" xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{ background: "transparent", border: "2px solid gray" }}>
                        05
                    </div>

                </div>
                <div className='status-text-container'>
                    <div className='status-text'>Service Details</div>
                    <div className='status-text'>Personal Details</div>
                    <div className='status-text'>Add Photos</div>
                    <div className='status-text'>Review</div>
                    <div className='status-text'>Submit</div>
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
