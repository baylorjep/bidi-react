import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';

function SummaryPage({ formData, prevStep }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const currentStep = 4; // Change this to the current step
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState(null);
    const [isValidCoupon, setIsValidCoupon] = useState(false);
    const [discountAmount, setDiscountAmount] = useState(null);

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

    const verifyCouponCode = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('code, discount_amount')
                .eq('code', couponCode)
                .single();

            if (error) throw error;

            if (data) {
                setIsValidCoupon(true);
                setCouponError(null);
                setDiscountAmount(data.discount_amount);
            } else {
                setIsValidCoupon(false);
                setCouponError('Invalid coupon code');
                setDiscountAmount(null);
            }
        } catch (err) {
            console.error('Error verifying coupon:', err);
            setCouponError('Error verifying coupon code');
            setIsValidCoupon(false);
            setDiscountAmount(null);
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return; // Prevent multiple submissions
        setIsSubmitting(true);
        
        try {
            console.log('Submitting data:', formData);
            
            const requestData = {
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
            };

            // Only add coupon code if it's verified
            if (isValidCoupon && couponCode) {
                requestData.coupon_code = couponCode;
            }

            const { data: request, error } = await supabase
                .from('requests')
                .insert([requestData])
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
                            style={{width:'100%', height:'100%', overflowY:'auto'}}
                            className="request-info quill-content"
                            dangerouslySetInnerHTML={{ __html: formData.additionalComments }}
                            
                        />
                    </div>

            <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '8px',
                marginTop: 'auto',
                marginBottom: '20px',
                alignItems: 'center'
            }}>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px'}}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent:'center'    }}>
                            <div className='custom-input-container' style={{marginBottom:'0'}}>
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => {
                                        setCouponCode(e.target.value);
                                        setIsValidCoupon(false);  // Reset validation when code changes
                                        setDiscountAmount(null);
                                    }}
                                    placeholder="Enter coupon code"
                                    className='custom-input'
                                    style={{
                                        
                                        backgroundColor: isValidCoupon ? '#f0fff0' : 'white'  // Light green background if valid
                                    }}
                                />
                                <label htmlFor="coupon" className="custom-label">
                                        Coupon
                                </label>
                            </div>

                            <button
                                onClick={verifyCouponCode}
                                className="request-form-back-and-foward-btn"
                                style={{ padding: '8px 12px', fontSize: '16px' }}
                            >
                                Verify
                            </button>
                        </div>
                        {couponError && <div style={{color: 'red', fontSize: '14px'}}>{couponError}</div>}
                        {isValidCoupon && <div style={{color: 'green', fontSize: '14px'}}>Coupon code is valid! Discount amount: ${discountAmount}</div>}
                    </div>
                    </div>

            <div className="form-button-container">
                <button 
                    type="button" 
                    onClick={prevStep} 
                    className="request-form-back-and-foward-btn"
                >
                    Back
                </button>
                <button
                    className="request-form-back-and-foward-btn"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
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