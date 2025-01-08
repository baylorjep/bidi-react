import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../App.css';
import { supabase } from '../../supabaseClient';

function RequestDisplay({ request, servicePhotos, hideBidButton }) {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');

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

    const getTimeDifference = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);
        
        if (diffInDays < 7) return 'New';
        return `${diffInDays}d ago`;
    };

    const getServiceDateDistance = (serviceDate) => {
        const now = new Date();
        const service = new Date(serviceDate);
        const diffInDays = Math.floor((service - now) / (1000 * 60 * 60 * 24));
        
        if (diffInDays < 0) return 'Past event';
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Tomorrow';
        return `In ${diffInDays} days`;
    };

    const checkPromotion = (createdAt) => {
        if (!createdAt) return null;

        // Parse PostgreSQL timestamp string to get UTC milliseconds
        const createdParts = createdAt.split(/[^0-9]/);
        const year = parseInt(createdParts[0]);
        const month = parseInt(createdParts[1]) - 1; // months are 0-based
        const day = parseInt(createdParts[2]);
        const hour = parseInt(createdParts[3]);
        const minute = parseInt(createdParts[4]);
        const second = parseInt(createdParts[5]);
        const millisecond = parseInt(createdParts[6].substr(0, 3));

        const created = Date.UTC(year, month, day, hour, minute, second, millisecond);
        const now = Date.now();

        // Date comparison in local time (this part works fine)
        const localCreated = new Date(createdAt);
        const createdDate = localCreated.toLocaleDateString('en-CA');
        const specialDates = ['2025-01-08', '2025-01-25'];

        // Debug logging
        console.log('Raw createdAt:', createdAt);
        console.log('Parsed created UTC:', new Date(created).toISOString());
        console.log('Now:', new Date(now).toISOString());
        console.log('Created parts:', { year, month, day, hour, minute, second, millisecond });

        if (!specialDates.includes(createdDate)) {
            return null;
        }

        // Get milliseconds since creation
        const msSinceCreation = now - created;
        const minutesSinceCreation = msSinceCreation / (1000 * 60);

        console.log('Milliseconds since creation:', msSinceCreation);
        console.log('Minutes since creation:', minutesSinceCreation);

        // Check time windows
        if (minutesSinceCreation < 30) {
            return {
                message: "⚡ Save 2% (Now 6% vs. 8%)",
                endTime: new Date(created + (30 * 60 * 1000))
            };
        }
        if (minutesSinceCreation < 60) {
            return {
                message: "⏳ Save 1% (Now 7% vs. 8%)",
                endTime: new Date(created + (60 * 60 * 1000))
            };
        }

        return null;
    };

    useEffect(() => {
        const timer = setInterval(() => {
            const promotion = checkPromotion(request.created_at);
            if (promotion && promotion.endTime) {
                const now = new Date();
                const timeRemaining = promotion.endTime.getTime() - now.getTime();
                
                if (timeRemaining > 0) {
                    const totalSeconds = Math.floor(timeRemaining / 1000);
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds % 60;
                    setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
                } else {
                    setTimeLeft('');
                }
            } else {
                setTimeLeft('');
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [request.created_at]);

    return (
        <div className="request-display text-center mb-4">
            <div className="request-content p-3">
                <h2 className="request-title">{request.service_title}</h2>
                <div className='status-request-container'>
                    <div className="request-status">
                        {getServiceDateDistance(request.service_date)}
                    </div>
                    {checkPromotion(request.created_at) && (
                        <div className="promotion-status">
                            {checkPromotion(request.created_at).message}
                            {timeLeft && <span> ({timeLeft})</span>}
                        </div>
                    )}
                </div>
                
                
                <div className="details-grid">
                    <div className="detail-item">
                        <span className="detail-label">Location</span>
                        <span className="detail-value-long">{request.location}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Category</span>
                        <span className="detail-value-long">{request.service_category}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Date of Service</span>
                        <span className="detail-value-long">{new Date(request.service_date).toLocaleDateString()}</span>
                    </div>
                </div>
    
                <div className="request-description">
                    <span className="detail-label">Description</span>
                    <div className="detail-value-long">{request.service_description}</div>
                </div>



                {servicePhotos && servicePhotos.length > 0 ? (
                    <>
                        <div className="request-subtype">
                            Photos
                        </div>
                        <div className="photo-grid scroll-container">
                            {servicePhotos.map((photo, index) => {
                                const publicUrl = getPublicUrl(photo.file_path);
                                return (
                                    <div className="photo-grid-item" key={index} onClick={() => handlePhotoClick(photo)}>
                                        <img
                                            src={publicUrl || photo.photo_url}
                                            className="photo"
                                            alt={`Photo ${index + 1}`}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/150?text=Image+Failed';
                                            }}
                                            loading="lazy"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : null}
                
                {request.additional_comments && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '20px'}}>
                        <div className="request-subtype">Additional Comments</div>
                        <div className="request-info">
                            <ReactQuill 
                                value={request.additional_comments}
                                readOnly={true}
                                theme="snow"
                                modules={{ toolbar: false }}
                            />
                        </div>
                    </div>
                )}
                


                {selectedPhoto && (
                    <div className="modal-overlay" onClick={handleCloseModal}>
                        <div className="modal-content">
                            <img src={selectedPhoto.photo_url} onClick={(e) => e.stopPropagation()} alt="Selected" />
                        </div>
                    </div>
                )}
                
                {!hideBidButton && (
                    <div style={{marginTop: '20px'}}>
                        <Link className="btn btn-secondary rounded-pill bid-button" to={`/submit-bid/${request.id}`}>
                            <span className="bid-button-text">
                                <span>View More</span>
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RequestDisplay;
