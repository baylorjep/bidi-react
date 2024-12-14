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


    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Generate request ID
            const requestId = uuidv4();
            let uploadedCount = 0;
            
            // Upload all photos
            const uploadedPictures = await Promise.all(
                photos.map(async (photo) => {
                    const filePath = `${user.id}/${requestId}/${uuidv4()}-${photo.name}`;
                    
                    // Upload file
                    const { error: uploadError } = await supabase.storage
                        .from('request-media')
                        .upload(filePath, photo.file);
                    if (uploadError) throw uploadError;
                    
                    // Get public URL
                    const { data: publicData, error: publicError } = await supabase.storage
                        .from('request-media')
                        .getPublicUrl(filePath);
                    if (publicError) throw publicError;
                    
                    // Save metadata
                    const { error: dbError } = await supabase
                        .from('event_photos')
                        .insert([{ 
                            user_id: user.id, 
                            request_id: requestId, 
                            photo_url: publicData.publicUrl, 
                            file_path: filePath 
                        }]);
                    if (dbError) throw dbError;

                    uploadedCount++;
                    setUploadingFiles(photos.length - uploadedCount);
                    
                    return { url: publicData.publicUrl, filePath };
                })
            );

            // Create photography request
            const { error } = await supabase
                .from('photography_requests')
                .insert([{
                    id: requestId,
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
                    extras: eventDetails.extras,
                    status: 'open'
                }]);

            if (error) throw error;

            // Clear localStorage and navigate on success
            localStorage.removeItem('photographyRequest');
            navigate('/success-request');

        } catch (err) {
            console.error('Error submitting request:', err);
            setError(err.message);
        } finally {
            setLoading(false);
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
                        <line x1="12" y1="0" x2="12" y2="300" stroke="black" strokeWidth="2" />
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
                <h2 className="request-form-header" style={{textAlign:'left',marginLeft:"20px"}}>Review</h2>
                <p style={{textAlign:'left',marginLeft:"20px", marginTop:"0"}}>Please review the details of your event before submitting your request. If you need to change something, you can go back and change it.
                </p>

                <div>
                    {/* Display the event details
                    <div className="review-text"style={{display:'flex', marginTop:'120px', textAlign:'left', flexDirection:'column'}}>
                        <p style={{textAlign:'left'}}><strong>Event Type:</strong> {eventType}</p>
                        <p style={{textAlign:'left'}}><strong>Location:</strong> {eventDetails.location}</p>
                        <p style={{textAlign:'left'}}><strong>{eventDetails.dateType === 'range' && 'Start'} Date:</strong> {String(eventDetails.startDate)}</p>
                        {eventDetails.dateType === 'range' && <p style={{textAlign:'left'}}><strong>End Date:</strong> {String(eventDetails.endDate)}</p>}
                        <p style={{textAlign:'left'}}><strong>Time of Day:</strong> {String(eventDetails.timeOfDay)}</p>
                        <p style={{textAlign:'left'}}><strong>Number of People:</strong> {String(eventDetails.numPeople)}</p>
                        <p style={{textAlign:'left'}}><strong>Duration (in hours):</strong> {String(eventDetails.duration)}</p>
                        <p style={{textAlign:'left'}}><strong>Indoor/Outdoor:</strong> {eventDetails.indoorOutdoor}</p>
                        <p style={{textAlign:'left'}}><strong>Additional Comments:</strong> {eventDetails.additionalComments}</p>
                        
                    </div>
        */}
                    <div className="scroll-container">
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
                    
                </div>
                
                

                {/* Display other details */}
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

export default EventSummary;
