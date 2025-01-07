import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';

function SummaryPage({ formData, prevStep }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Fetch the current user’s session
        const fetchUser = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setUser(data.session.user);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        console.log('Form data received in ServiceSummary:', formData); // Add this
        console.log('Photos in formData:', formData.photos); // Add this
    }, [formData]);

    const handleSubmit = async () => {
        if (isSubmitting) return; // Prevent multiple submissions
        setIsSubmitting(true);
        
        try {
            console.log('Submitting data:', formData);
            
            const { data: request, error } = await supabase
                .from('requests')
                .insert([{
                    user_id: user ? user.id : null,
                    customer_email: user ? user.email : null,
                    service_title: formData.serviceTitle,
                    location: formData.location || 'TBD',
                    service_category: formData.category || 'General',
                    service_description: formData.description,
                    service_date: formData.startDate || 'TBD',
                    end_date: formData.endDate || null,
                    time_of_day: formData.timeOfDay || 'TBD',
                    price_range: formData.budget,
                    additional_comments: formData.additionalComments || '',
                    open: true,
                }])
                .select();

            if (error) throw error;

            // Handle photo uploads if they exist
            if (formData.photos && formData.photos.length > 0) {
                for (const photo of formData.photos) {
                    const filePath = `${user.id}/${request[0].id}/${photo.name}`;
                    
                    // Convert base64 URL to Blob with correct type
                    const response = await fetch(photo.url);
                    const blob = await response.blob();
                    const file = new File([blob], photo.name, { type: photo.type || blob.type });
                    
                    // Upload photo file
                    const { error: uploadError } = await supabase.storage
                        .from('request-media')
                        .upload(filePath, file, {
                            contentType: photo.type || blob.type
                        });
                    if (uploadError) throw uploadError;

                    // Get public URL first
                    const { data: publicData } = await supabase.storage
                        .from('request-media')
                        .getPublicUrl(filePath);

                    // Save to service_photos table
                    const { error: photoError } = await supabase
                        .from('service_photos')
                        .insert({
                            user_id: user.id,
                            request_id: request[0].id,
                            photo_url: publicData.publicUrl,
                            file_path: filePath
                        });

                    if (photoError) throw photoError;
                }
            }

            console.log('Success! Data:', request);
            localStorage.removeItem('requestFormData');
            navigate('/success-request');
        } catch (err) {
            console.error('Submission error:', err);
            setErrorMessage(`Error submitting request: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (

        <div className='request-form-overall-container'>
        <div className='request-form-status-container'>
            <div className='status-bar-container'>
            <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px"  xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="300" stroke="black" strokeWidth="2" />
                    </svg>
                
                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px"  xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="300" stroke="black" strokeWidth="2" />
                    </svg>

                    <div className='status-check-container' style={{ display: 'flex', gap: '10px', transform: "rotate(260deg)"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 25" fill="none">
                            <path d="M8.358 9.57801L18 19.22L16.7198 20.5003L5.7975 9.57801L10.8743 4.49976L12.1545 5.78001L8.358 9.57801Z" fill="white"/>
                        </svg>
                    </div>
                    <svg width="25px"  xmlns="http://www.w3.org/2000/svg">
                        <line x1="12" y1="0" x2="12" y2="300" stroke="black" strokeWidth="2" />
                    </svg>

                <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                04
                </div>
                <svg width="25px" xmlns="http://www.w3.org/2000/svg">
                    <line x1="12" y1="0" x2="12" y2="150" stroke="gray" strokeWidth="2" />
                </svg>

                <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
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
        <div className="request-form-container-details" style={{display:'flex',flexDirection:'column',gap:'20px'}}>
            <div className="request-form-header" style={{marginTop:'40px'}}>Summary of Your Request</div>
            <div className="request-grid">
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Title</div>
                        <div className="request-info">{formData.serviceTitle}</div>  
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Description</div>
                        <div className="request-info">{formData.description}</div>  
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Budget</div>
                        <div className="request-info">{formData.budget}</div>  
                </div>      

                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Start Date</div>
                        <div className="request-info">{formData.startDate}</div>  
                </div>
                {formData.endDate &&
                <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">End Date</div>
                        <div className="request-info">{formData.endDate}</div>  
                </div>
                }    

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                       <div className="request-subtype">Time of Day</div>
                       <div className="request-info">{formData.timeOfDay}</div>  
                   </div> 

                   <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                       <div className="request-subtype">Location</div>
                       <div className="request-info">{formData.location}</div>  
                   </div>  
            </div> 
            <div style={{
                        display: 'flex',
                        flexDirection: 'column', 
                        gap: '8px', 
                        paddingTop:'20px', 
                        alignItems:'flex-start',
                        width:'70%',
                        
                    }}>
                        <div className="request-subtype">Additional Comments</div>
                        <div 
                            style={{width:'100%', height:'100%'}}
                            className="request-info quill-content"
                            dangerouslySetInnerHTML={{ __html: formData.additionalComments }}
                            
                        />
                    </div>

            {errorMessage && <p className="text-danger">{errorMessage}</p>}

        

            <div className="form-button-container">
                <button 
                    type="button" 
                    onClick={prevStep} 
                    className="request-form-back-and-foward-btn"
                    style={{color:"black"}}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z" fill="black"/>
                    </svg>
                    Back
                </button>
                <button
                    className="request-form-back-and-foward-btn"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                        color: 'black',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                >
                    {isSubmitting ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="spinner"></div>
                            Submitting...
                        </div>
                    ) : (
                        'Submit'
                    )}
                </button>
            </div>
        </div>
    </div>

    );
}

export default SummaryPage;