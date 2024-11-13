import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {supabase} from '../../../src/supabaseClient'
import { v4 as uuidv4 } from 'uuid';




function UploadPictures({ }) {  // Pass userId as a prop to the component
    const [photo, setPhoto] = useState(null);
    const [details, setDetails] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null); // New state for user ID
    const navigate = useNavigate();
    const requestId = uuidv4(); // Call this when you create a new request

    useEffect(() => {
        // Retrieve the authenticated user's ID
        const fetchUserId = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setUserId(user?.id);
        };
        fetchUserId();
    }, []);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file && userId) {
            setLoading(true);
            setError(null);

            try {
                const filePath = `${userId}/${requestId}/${file.name}`;
                
                // Upload the file to Supabase
                const { data, error } = await supabase.storage
                    .from('request-media')
                    .upload(filePath, file, { upsert: true });

                if (error) {
                    setError("Error uploading image: " + error.message);
                    setLoading(false);
                    return;
                }

                // Retrieve the public URL of the uploaded file
                const { data: publicData, error: publicError } = supabase.storage
                    .from('request-media')
                    .getPublicUrl(data.path);

                if (publicError || !publicData) {
                    setError("Failed to retrieve public URL");
                    setLoading(false);
                    return;
                }

                const publicURL = publicData.publicUrl;
                setPhoto(publicURL);

                // Save metadata to the database
                const { error: dbError } = await supabase
                    .from('event_photos')
                    .insert([
                        {
                            user_id: userId,
                            request_id: requestId,
                            photo_url: publicURL,
                            file_path: filePath
                        }
                    ]);

                if (dbError) {
                    setError("Error saving photo info: " + dbError.message);
                }
            } catch (error) {
                setError("Error uploading photo: " + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const removePhoto = async () => {
        if (!photo || !userId || !requestId) return;
    
        setLoading(true);
        setError(null);
    
        try {
            const fileName = photo.split('/').pop(); // Get the file name from the photo URL
            const filePath = `${userId}/${requestId}/${fileName}`;
            console.log("Attempting to delete file at:", filePath); // Log the file path for confirmation
    
            // Attempt to remove the file from Supabase storage
            const { error: storageError } = await supabase
                .storage
                .from('request-media')
                .remove([filePath]);
    
            if (storageError) {
                console.error("Storage error:", storageError.message); // Log storage error
                setError("Error deleting image: " + storageError.message);
                setLoading(false);
                return;
            }
    
            // Attempt to delete metadata from the database
            const { error: dbError } = await supabase
                .from('event_photos')
                .delete()
                .eq('request_id', requestId)
                .eq('user_id', userId)
                .eq('photo_url', photo);
    
            if (dbError) {
                console.error("Database error:", dbError.message); // Log database error
                setError("Error removing photo metadata: " + dbError.message);
                setLoading(false);
                return;
            }
    
            setPhoto(null); // Clear photo if deletion succeeds
        } catch (error) {
            console.error("General error:", error.message); // Log any general error
            setError("Error removing photo: " + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    
    
    
    

    const handleClick = () => {
        document.getElementById('file-input').click();  // Trigger the file input click event
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formDetails = { ...details, photoUrl: photo }; // Store photo URL with other details
        navigate('/personal-details');  // Navigate to the summary stage
    };

    const handleBack = () => {
        navigate('/event-details');  // Adjust the route for going back
    };

    const Spinner = () => {
        return <div className="spinner"></div>;
    };
    return (
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
            <div className='request-form-container-details' style={{alignItems:"normal", justifyContent:"flex-start",alignItems:"flex-start"}}>
                <h2 className="request-form-header" style={{textAlign:'left', marginBottom:"0",marginLeft:"20px"}}>Upload Photos</h2>
                <p style={{textAlign:'left',marginLeft:"20px", marginTop:"0",marginBottom:"0"}}>You can upload inspo (inspiration) photos here. If you aren't sure what you are looking for, just press next.
                </p>
                <div className="photo-uploads-container">
                    {loading ? (
                        <div className="uploading-container">
                            <p>Uploading...</p>
                            <Spinner />
                        </div>
                    ) : error ? (
                        <p style={{ color: 'red' }}>{error}</p>
                    ) : (
                        photo && (
                            <div className="photo-preview-container">
                                <img src={photo} alt="Uploaded preview" height={300} className="photo-preview-image" />
                                <button className="remove-photo-button" onClick={removePhoto}>Remove</button>

                            </div>
                        )
                    )}
                </div>


                <div className="container-container"style={{display:"flex", justifyContent:"center", width:"100%",alignItems:'center',flexDirection:"row",height:"120px", marginTop:"0"}}>
                    <div className='photo-upload-btn-container'>
                        <div className='photo-upload-btn-text'>Add Photo</div>
                        <button className='photo-upload-btn' onClick={handleClick}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="72" viewBox="0 0 41 41" fill="none">
                                <g filter="url(#filter0_d_967_1103)">
                                    <circle cx="20.5" cy="16.5" r="16.5" fill="#191717"/>
                                    <circle cx="20.5" cy="16.5" r="16" stroke="black"/>
                                </g>
                                <text x="14" y="25.5" fontSize="24" fill="white" fontFamily="Arial">+</text>
                                <defs>
                                    <filter id="filter0_d_967_1103" x="0" y="0" width="41" height="41" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                        <feOffset dy="4"/>
                                        <feGaussianBlur stdDeviation="2"/>
                                        <feComposite in2="hardAlpha" operator="out"/>
                                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_967_1103"/>
                                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_967_1103" result="shape"/>
                                    </filter>
                                </defs>
                            </svg>
                        </button>
                        <input
                            id="file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}  // Hide the actual file input
                        />
                    </div>               
                </div>

                <div className="form-button-container" style={{margin:"0"}}>
                <button className="request-form-back-and-foward-btn" onClick={handleBack} style={{color:"black"}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M20.0002 11V13L8.00016 13L13.5002 18.5L12.0802 19.92L4.16016 12L12.0802 4.07996L13.5002 5.49996L8.00016 11L20.0002 11Z" fill="black"/>
                    </svg>
                    Back
                </button>
                <button
                type='submit'
                className='request-form-back-and-foward-btn'
                style={{color:'black'}} onClick={handleSubmit}
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

export default UploadPictures;
