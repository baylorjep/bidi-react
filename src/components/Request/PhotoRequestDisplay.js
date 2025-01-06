import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import scrollBtn from '../../assets/images/Icons/scroll button.png';
import '../../App.css';
import { supabase } from '../../supabaseClient';

function PhotoRequestDisplay({ photoRequest, event_photos, hideBidButton }) {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [filteredPhotos, setFilteredPhotos] = useState([]);

    const getTimeDifference = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);
        
        if (diffInDays < 7) return 'New';
        return `${diffInDays}d ago`;
    };

    const getEventDateDistance = (startDate) => {
        const now = new Date();
        const event = new Date(startDate);
        const diffInDays = Math.floor((event - now) / (1000 * 60 * 60 * 24));
        
        if (diffInDays < 0) return 'Past event';
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Tomorrow';
        return `In ${diffInDays} days`;
    };

    useEffect(() => {
        if (event_photos && photoRequest?.id) {
            console.log("PhotoRequest ID:", photoRequest.id);
            console.log("Event Photos:", event_photos);
            const filtered = event_photos.filter(photo => photo.request_id === photoRequest.id.toString());
            console.log("Filtered Photos:", filtered);
            setFilteredPhotos(filtered);
        }
    }, [event_photos, photoRequest]);

    const handlePhotoClick = (photo) => {
        setSelectedPhoto(photo);
    };

    const handleCloseModal = () => {
        setSelectedPhoto(null);
    };

    const getPublicUrl = (filePath) => {
        try {
            const { data } = supabase.storage
                .from('request-media')
                .getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Error getting public URL:', error);
            return null;
        }
    };

    return (
        <div className="request-display text-center mb-4">
            <div className="request-content p-3">
                <div style={{textAlign:'left', width: '100%', padding: '0 20px', marginBottom: '20px'}}>
                    <h2 className="request-title">{photoRequest.event_title}</h2>
                    <div className="request-status">
                        {getEventDateDistance(photoRequest.start_date)}
                    </div>
                </div>

                <div className="request-grid">
                   
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Event Type</div>
                        <div className="request-info">{photoRequest.event_type}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype"> {photoRequest.date_type === 'range' ? 'Start Date ' : 'Date '}</div>
                        <div className="request-info">{new Date(photoRequest.start_date).toLocaleDateString()}</div>
                        
                    </div>
                    {photoRequest.date_type === 'range' && (
                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            <div className="request-subtype">End Date</div>
                            <div className="request-info">{new Date(photoRequest.end_date).toLocaleDateString()}</div>
                            
                        </div>
                    )}

                 
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Time of Day</div>
                        <div className="request-info">{photoRequest.time_of_day}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Location</div>
                        <div className="request-info">{photoRequest.location}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Number of People</div>
                        <div className="request-info">{photoRequest.num_people}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Duration (in hours)</div>
                        <div className="request-info">{photoRequest.duration}</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Indoor/Outdoor</div>
                        <div className="request-info">{photoRequest.indoor_outdoor}</div>
                    </div>
                    
                    {photoRequest.extras && Object.keys(photoRequest.extras).length > 0 && (
                        <div className="request-extras">
                            <strong>Extras:</strong>
                            <ul>
                                {Object.entries(photoRequest.extras).map(([key, value]) => (
                                    <li key={key}>{key}: {value.toString()}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {filteredPhotos && filteredPhotos.length > 0 ? (
                    <>
                        <div className="request-subtype">
                            Inspiration Photos
                        </div>
                        <div className="photo-grid scroll-container">
                            {filteredPhotos.map((photo, index) => {
                                const publicUrl = getPublicUrl(photo.file_path);
                                console.log("Generated public URL:", publicUrl);
                                
                                return (
                                    <div className="photo-grid-item" key={index} onClick={() => handlePhotoClick(photo)}>
                                        <img
                                            src={publicUrl || photo.photo_url}
                                            className="photo"
                                            alt={`Photo ${index + 1}`}
                                            onError={(e) => {
                                                console.error('Image failed to load:', {
                                                    publicUrl,
                                                    originalUrl: photo.photo_url,
                                                    filePath: photo.file_path
                                                });
                                                e.target.src = 'https://via.placeholder.com/150?text=Image+Failed';
                                            }}
                                            loading="lazy"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </> 
                ) : (
                    <div className="request-subtype">No inspiration photos available</div>
                )}

                {photoRequest.additional_comments && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Additional Comments</div>
                        <div className="request-info">
                            <ReactQuill 
                                value={photoRequest.additional_comments}
                                readOnly={true}
                                theme="snow"
                                modules={{ toolbar: false }}
                            />
                        </div>
                    </div>
                )}


                
                {!hideBidButton && (
                    <Link className="btn btn-secondary rounded-pill bid-button" to={`/submit-bid/${photoRequest.id}`}>
                        <span className="bid-button-text">
                            <span>View More</span>
                        </span>
                    </Link>
                )}
            </div>
            {selectedPhoto && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" >
                        <img src={selectedPhoto.photo_url} onClick={(e) => e.stopPropagation()} alt="Selected" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default PhotoRequestDisplay;
