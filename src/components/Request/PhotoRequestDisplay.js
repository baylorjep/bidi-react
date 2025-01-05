import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import scrollBtn from '../../assets/images/Icons/scroll button.png';
import '../../App.css';

function PhotoRequestDisplay({ photoRequest, hideBidButton }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Add debugging log
    useEffect(() => {
        console.log("PhotoRequest photos:", photoRequest.photos);
    }, [photoRequest]);

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % photoRequest.photos.length);
    };

    const handlePrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? photoRequest.photos.length - 1 : prevIndex - 1
        );
    };

    const handlePhotoClick = (photo) => {
        setSelectedPhoto(photo);
    };

    const handleCloseModal = () => {
        setSelectedPhoto(null);
    };

    return (
        <div className="request-display text-center mb-4">
            <div className="request-content p-3">
                <div style={{textAlign:'left', width: '100%', padding: '0 20px', marginBottom: '20px'}}>
                    <div className="request-title">{photoRequest.event_title}</div>
                    <div className="request-status">Pending</div>
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

                {photoRequest.additional_comments && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div className="request-subtype">Additional Comments</div>
                        <div className="request-info">{photoRequest.additional_comments}</div>
                    </div>
                )}

                {photoRequest.photos && photoRequest.photos.length > 0 ? (
                    <>
                        <div className="request-subtype">
                            Inspiration Photos
                        </div>
                        <div className="photo-grid scroll-container">
                            {/* Replace carousel with grid layout */}
                            {photoRequest.photos.map((photo, index) => (
                                <div className="photo-grid-item" key={index} onClick={() => handlePhotoClick(photo)}>
                                    <img
                                        src={photo.url}
                                        className="photo"
                                        alt={`Photo ${index + 1}`}
                                        onError={(e) => {
                                            console.error('Image failed to load:', photo);
                                            e.target.alt = 'Failed to load image';
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                ) : null}
                
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
                        <img src={selectedPhoto.url} onClick={(e) => e.stopPropagation()} alt="Selected" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default PhotoRequestDisplay;
