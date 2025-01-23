import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useIndividualUser } from '../Individual/getIndividualUser';
import PhotoRequestDisplay from '../Request/PhotoRequestDisplay';
import { useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid'; // Add uuid import

function EventSummary({ eventType, eventDetails }) {

    const { user, userError } = useIndividualUser();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Define all state variables
    const [loading, setLoading] = useState(false);
    const [event, setEventType] = useState()
    const [error, setError] = useState(null);
    const [uploadingFiles, setUploadingFiles] = useState(0);
    const currentStep = 4;
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState(null);
    const [isValidCoupon, setIsValidCoupon] = useState(false);
    const [discountAmount, setDiscountAmount] = useState(null);

    const [selectedEvent, setSelectedEvent] = useState(() => {
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        return savedForm.eventType || '';
    });

    // Save to localStorage when event type changes
    const handleSelect = (event) => {
        setSelectedEvent(event);
        setEventType(event);
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        localStorage.setItem('photographyRequest', JSON.stringify({
            ...savedForm,
            eventType: event
        }));
    };

    const [details, setDetails] = useState(() => {
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        return savedForm.eventDetails || {
            eventTitle: '',
            location: '',
            dateType: 'specific',
            // ... rest of initial state
        };
    });

    const handleChange = (e) => {
        const newDetails = { ...details, [e.target.name]: e.target.value };
        setDetails(newDetails);
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        localStorage.setItem('photographyRequest', JSON.stringify({
            ...savedForm,
            eventDetails: newDetails
        }));
    };


function PersonalDetails() {
    const [userInfo, setUserInfo] = useState(() => {
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        return savedForm.personalDetails || {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            email: ''
        };
    });

    const handleChange = (e) => {
        const newInfo = { ...userInfo, [e.target.name]: e.target.value };
        setUserInfo(newInfo);
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        localStorage.setItem('photographyRequest', JSON.stringify({
            ...savedForm,
            personalDetails: newInfo
        }));
    };
}

function UploadPictures() {
    const [photos, setPhotos] = useState(() => {
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        return savedForm.photos || [];
    });

    // Update localStorage when photos change
    useEffect(() => {
        const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
        localStorage.setItem('photographyRequest', JSON.stringify({
            ...savedForm,
            photos: photos
        }));
    }, [photos]);

    const handleFileSelect = async (event) => {
        const files = Array.from(event.target.files);
        if (!files.length) return setError("No file selected");
        
        setLoading(true);
        
        try {
            const newPhotos = files.map(file => ({
                file: file,
                url: URL.createObjectURL(file),
                name: file.name
            }));
            
            setPhotos(prev => [...prev, ...newPhotos]);
            
            // Save to localStorage
            const savedForm = JSON.parse(localStorage.getItem('photographyRequest') || '{}');
            localStorage.setItem('photographyRequest', JSON.stringify({
                ...savedForm,
                photos: [...(savedForm.photos || []), ...newPhotos]
            }));
            
        } catch (err) {
            console.error("Error processing files:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
}



    
    // Get photos from navigation state
    const photos = location.state?.photos || [];

    const sendEmailNotification = async (recipientEmail, subject, htmlContent) => {
        try {
            await fetch('https://bidi-express.vercel.app/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ recipientEmail, subject, htmlContent }),
            });
        } catch (error) {
            console.error('Error sending email:', error);
        }
    };

    const handleBack = () => {
        navigate('/event-photos');  // Adjust the route for going back
    };

    const verifyCouponCode = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('code, discount_amount')  // Explicitly select the fields we need
                .eq('code', couponCode)
                .single();

            if (error) throw error;

            if (data) {
                setIsValidCoupon(true);
                setCouponError(null);
                setDiscountAmount(data.discount_amount);  // Set the discount amount from the coupons table
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
        setLoading(true);
        setError(null);
        
        try {
            const requestData = {
                profile_id: user.id,
                event_title: eventDetails.eventTitle,
                event_type: eventType,
                date_type: eventDetails.dateType,
                start_date: eventDetails.startDate,
                end_date: eventDetails.endDate,
                time_of_day: eventDetails.timeOfDay,
                location: eventDetails.location,
                num_people: eventDetails.numPeople,
                duration: eventDetails.duration,
                indoor_outdoor: eventDetails.indoorOutdoor,
                additional_comments: eventDetails.additionalComments,
                price_range: eventDetails.price_range,
                status: 'open'
            };

            // Only add coupon code if it's verified
            if (isValidCoupon && couponCode) {
                requestData.coupon_code = couponCode;
            }

            const { data: request, error: requestError } = await supabase
                .from('photography_requests')
                .insert([requestData])
                .select()
                .single();

            if (requestError) throw requestError;

            // Then upload photos using the new request ID
            if (photos.length > 0) {
                for (const photo of photos) {
                    const filePath = `${user.id}/${request.id}/${photo.name}`;
                    
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

                    console.log('Attempting to save to event_photos:', {
                        user_id: user.id,
                        request_id: request.id,
                        photo_url: publicData.publicUrl,
                        file_path: filePath,
                        file_type: photo.type || blob.type
                    });

                    // Save photo metadata as a separate operation - removed file_type field
                    const { error: dbError } = await supabase
                        .from('event_photos')
                        .insert({
                            user_id: user.id,
                            request_id: request.id,
                            photo_url: publicData.publicUrl,
                            file_path: filePath
                        });

                    if (dbError) {
                        console.error('Error saving to event_photos:', dbError);
                        throw dbError;
                    }
                }
            }

            

            // Clear localStorage and navigate
            localStorage.removeItem('photographyRequest');
            localStorage.removeItem('requestFormData');
            localStorage.removeItem('eventDetails');
            localStorage.removeItem('personalDetails');
            localStorage.removeItem('additionalComments');
            localStorage.removeItem('serviceType');
            
            navigate('/success-request', { 
                state: { 
                    requestId: request.id,
                    message: 'Your photography request has been submitted successfully!'
                }
            });

        } catch (err) {
            console.error('Error submitting request:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='request-form-overall-container'>
            <div className="request-form-status-container">
                <div className="request-form-box">
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
</div>
            <div className='request-form-container-details' style={{alignItems:"normal"}}>
                <h2 className="request-form-header" style={{textAlign:'left',marginLeft:"20px"}}>Review</h2>
                <div className="Sign-Up-Page-Subheader" style={{textAlign:'left',marginLeft:"20px", marginTop:"0"}}>Please review the details of your event before submitting your request. If you need to change something, you can go back and change it.
                </div>

                <div>

                    {/* Display event details
                    <div className="scroll-container" style={{height:'60%'}}>
                    <PhotoRequestDisplay 
                        photoRequest={{
                        event_title: eventDetails.eventTitle,
                        photos: useLocation().state?.photos || [], // Get photos from navigation state
                        event_type: eventType,
                        date_type: eventDetails.dateType,
                        start_date: eventDetails.startDate,
                        end_date: eventDetails.endDate,
                        time_of_day: eventDetails.timeOfDay,
                        location: eventDetails.location,
                        num_people: eventDetails.numPeople,
                        duration: eventDetails.duration,
                        indoor_outdoor: eventDetails.indoorOutdoor,
                        additional_comments: eventDetails.additionalComments,
                        extras: eventDetails.extras
                        }}
                        hideBidButton={true}
                    />

                    </div>

                    \*/}

            <div className="request-grid">

            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                       <div className="request-subtype">Event Type</div>
                       <div className="request-info">{eventType}</div>  
                   </div>  

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                       <div className="request-subtype">Title</div>
                       <div className="request-info">{eventDetails.eventTitle}</div>  
                   </div>  

                   
                   
                

                   <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                       <div className="request-subtype"> {eventDetails.dateType === 'range' ? 'Start Date ' : 'Date '}</div>
                       <div className="request-info">{new Date(eventDetails.startDate).toLocaleDateString()}</div>
                       
                   </div>
                   {eventDetails.dateType === 'range' && (
                           <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                           <div className="request-subtype">End Date</div>
                           <div className="request-info">{new Date(eventDetails.endDate).toLocaleDateString()}</div>
                           
                       </div>
                   )}

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                       <div className="request-subtype">Location</div>
                       <div className="request-info">{eventDetails.location}</div>
                   </div>
                
                   <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                       <div className="request-subtype">Time of Day</div>
                       <div className="request-info">{eventDetails.timeOfDay}</div>
                   </div>

                   

                   <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                       <div className="request-subtype">Number of People</div>
                       <div className="request-info">{eventDetails.numPeople}</div>
                   </div>

                   <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                       <div className="request-subtype">Duration (in hours)</div>
                       <div className="request-info">{eventDetails.duration}</div>
                   </div>

                   <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                       <div className="request-subtype">Indoor/Outdoor</div>
                       <div className="request-info">{eventDetails.indoorOutdoor}</div>
                   </div>

                   <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                       <div className="request-subtype">Budget</div>
                       <div className="request-info">${eventDetails.price_range}</div>
                   </div>
                    
               </div>
               <div style={{
                        display: 'flex',
                        flexDirection: 'column', 
                        gap: '8px', 
                        alignItems:'flex-start',
                        
                    }}>
                        <div className="request-subtype">Additional Comments</div>
                        <div 
                            className="quill-content"
                            dangerouslySetInnerHTML={{ __html: eventDetails.additionalComments }}
                        />
                    </div>


                {/* Add after additional comments section
                {photos && photos.length > 0 && (
                    <div className="photos-section" style={{overflowY:'auto'}}>
                        <div className="photo-grid">
                            {photos.map((photo, index) => (
                                <div key={index} className="photo-grid-item">
                                    <img
                                        src={photo.url}
                                        alt={`Inspiration ${index + 1}`}
                                        className="photo"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                ?*/}

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
                
                

                {/* Display other details */}
                <div className="form-button-container">
                    <button className="request-form-back-and-foward-btn" onClick={handleBack}>

                        Back
                    </button>
                    <button
                    className='request-form-back-and-foward-btn'
                    onClick={handleSubmit}
                    disabled={loading}
                    >
                        {loading ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
                
            </div>
            </div>
    );
}

export default EventSummary;
