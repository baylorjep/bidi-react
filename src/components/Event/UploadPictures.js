import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../src/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { Spinner } from 'react-bootstrap';

function UploadPictures() {
    const [photo, setPhoto] = useState(null);
    const [details, setDetails] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();
    const requestId = uuidv4(); // Generate a new request ID

    useEffect(() => {
        // Fetch authenticated user's ID
        const fetchUserId = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setUserId(user?.id);
        };
        fetchUserId();
    }, []);

    const handleFileSelect = async (file) => {
        if (!file) {
            setError("No file selected");
            return;
        }

        if (!userId) {
            setError("User not authenticated");
            return;
        }

        if (!requestId) {
            setError("Request ID is missing");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const filePath = `${userId}/${requestId}/${file.name}`;

            // Upload the file
            const { data, error } = await supabase.storage
                .from('request-media')
                .upload(filePath, file, { upsert: true });

            if (error) {
                console.error("Upload error:", error);
                setError(`Error uploading image: ${error.message}`);
                return;
            }

            // Retrieve the public URL
            const { data: publicData, error: publicError } = await supabase.storage
                .from('request-media')
                .getPublicUrl(filePath);

            if (publicError || !publicData) {
                console.error("Public URL error:", publicError);
                setError("Failed to retrieve public URL");
                return;
            }

            const publicURL = publicData.publicUrl;
            setPhoto(publicURL);

            // Save metadata to the database
            const { error: dbError } = await supabase
                .from('event_photos')
                .insert([{
                    user_id: userId,
                    request_id: requestId,
                    photo_url: publicURL,
                    file_path: filePath,
                }]);

            if (dbError) {
                console.error("Database error:", dbError.message);
                setError(`Error saving photo info: ${dbError.message}`);
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            setError(`Unexpected error occurred: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const removePhoto = async () => {
        if (!photo || !userId || !requestId) return;

        setLoading(true);
        setError(null);

        try {
            const fileName = photo.split('/').pop(); // Get the file name
            const filePath = `${userId}/${requestId}/${fileName}`;

            console.log("Attempting to delete file at:", filePath); // Debug log

            // Attempt to remove file from Supabase storage
            const { error: storageError } = await supabase
                .storage
                .from('request-media')
                .remove([filePath]);

            if (storageError) {
                console.error("Storage error:", storageError.message);
                setError(`Error deleting image: ${storageError.message}`);
                return;
            }

            // Delete metadata from the database
            const { error: dbError } = await supabase
                .from('event_photos')
                .delete()
                .eq('request_id', requestId)
                .eq('user_id', userId)
                .eq('photo_url', photo);

            if (dbError) {
                console.error("Database error:", dbError.message);
                setError(`Error removing photo metadata: ${dbError.message}`);
                return;
            }

            setPhoto(null); // Clear photo if deletion succeeds
        } catch (error) {
            console.error("General error:", error);
            setError(`Error removing photo: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClick = () => {
        document.getElementById('file-input').click();  // Trigger file input
    };
    

    const handleSubmit = (e) => {
        e.preventDefault();
        const formDetails = { ...details, photoUrl: photo };
        navigate('/personal-details');  // Go to the next page
    };

    const handleBack = () => {
        navigate('/personal-details');  // Navigate back
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
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

                    <div className='status-check-container' style={{background:"transparent", border:"2px solid gray"}}>
                    03
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
                    <div className='status-text'>Service Details</div>
                    <div className='status-text'>Personal Details</div>
                    <div className='status-text'>Add Photos</div>
                    <div className='status-text'>Review</div>
                    <div className='status-text'>Submit</div>
                </div>
            </div>
            <div className='request-form-container-details' style={{alignItems:"normal", justifyContent:"flex-start",alignItems:"flex-start"}}>
                <h2 className="request-form-header" style={{textAlign:'left', marginBottom:"0",marginLeft:"20px"}}>Inspiration Photos</h2>
                <p style={{textAlign:'left',marginLeft:"20px", marginTop:"0",marginBottom:"0"}}>You can upload inspo (inspiration) photos here. If you aren't sure what you are looking for, just press next.
                </p>
                <div className="photo-uploads-container">
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={handleClick}
                    
                    className='photo-upload-box'
                >
                    <input
                        type="file"
                        id="file-input"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" width="54" height="45" viewBox="0 0 54 45" fill="none">
                        <path d="M40.6939 15.6916C40.7126 15.6915 40.7313 15.6915 40.75 15.6915C46.9632 15.6915 52 20.2889 52 25.9601C52 31.2456 47.6249 35.5984 42 36.166M40.6939 15.6916C40.731 15.3158 40.75 14.9352 40.75 14.5505C40.75 7.61906 34.5939 2 27 2C19.8081 2 13.9058 7.03987 13.3011 13.4614M40.6939 15.6916C40.4383 18.2803 39.3216 20.6423 37.6071 22.5372M13.3011 13.4614C6.95995 14.0121 2 18.8869 2 24.8191C2 30.339 6.2944 34.9433 12 36.0004M13.3011 13.4614C13.6956 13.4271 14.0956 13.4096 14.5 13.4096C17.3146 13.4096 19.9119 14.2586 22.0012 15.6915" stroke="#141B34" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M27 24.7783L27 43.0002M27 24.7783C25.2494 24.7783 21.9788 29.3208 20.75 30.4727M27 24.7783C28.7506 24.7783 32.0212 29.3208 33.25 30.4727" stroke="#141B34" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <div className='photo-upload-btn-text'>Drag & Drop to Upload or Click to Browse</div>
                    <div className='photo-upload-btn-text-pink'>or click to browse</div>
                </div>
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
