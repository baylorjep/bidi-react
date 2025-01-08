import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import scrollBtn from '../../assets/images/Icons/scroll button.png';
import '../../App.css';

function PhotoRequestDisplay({ photoRequest, hideBidButton }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');

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

    const getTimeDifference = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);
        
        if (diffInDays < 7) return 'New';
        return `${diffInDays}d ago`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const isNew = (createdAt) => {
        console.log('Checking if photo request is new:', createdAt); // Add logging
        if (!createdAt) {
            console.log('No created_at timestamp for photo request');
            return false;
        }
        const now = new Date();
        const created = new Date(createdAt);
        const diffInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        console.log('Days difference for photo request:', diffInDays);
        return diffInDays < 7;
    };

    const checkPromotion = (createdAt) => {
        if (!createdAt) return null;

        // Parse PostgreSQL timestamp string to get UTC milliseconds
        const createdParts = createdAt.split(/[^0-9]/);
        const created = Date.UTC(
            parseInt(createdParts[0]),
            parseInt(createdParts[1]) - 1,
            parseInt(createdParts[2]),
            parseInt(createdParts[3]),
            parseInt(createdParts[4]),
            parseInt(createdParts[5]),
            parseInt(createdParts[6].substr(0, 3))
        );
        const now = Date.now();

        // Date comparison in local time
        const localCreated = new Date(createdAt);
        const createdDate = localCreated.toLocaleDateString('en-CA');
        const specialDates = ['2025-01-08', '2025-01-25'];

        if (!specialDates.includes(createdDate)) return null;

        // Get milliseconds since creation
        const msSinceCreation = now - created;
        const minutesSinceCreation = msSinceCreation / (1000 * 60);

        if (minutesSinceCreation < 30) {
            return {
                message: "⚡Save 2%",  // Removed space after emoji
                endTime: new Date(created + (30 * 60 * 1000))
            };
        }
        if (minutesSinceCreation < 60) {
            return {
                message: "⏳Save 1%",  // Removed space after emoji
                endTime: new Date(created + (60 * 60 * 1000))
            };
        }

        return null;
    };

    useEffect(() => {
        const timer = setInterval(() => {
            const promotion = checkPromotion(photoRequest.created_at);
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
    }, [photoRequest.created_at]);

    return (
        <div className="request-display-mini text-center mb-4">
            <div className="request-content p-3 ">
                <div style={{textAlign:'left', width: '100%', padding: '0 20px', marginBottom: '20px'}}>
                    <h2 className="request-title">{photoRequest.event_title || 'Untitled Event'}</h2>
                    <div style={{display: 'flex', gap: '10px'}}>
                        {isNew(photoRequest.created_at) && (
                            <div className="request-status">New</div>
                        )}
                        {checkPromotion(photoRequest.created_at) && (
                            <div className="promotion-status">
                                {checkPromotion(photoRequest.created_at).message}
                                {timeLeft && <span> ({timeLeft})</span>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="details-grid">
                   
                    <div className='detail-item'>
                        <div className="request-subtype">Event Type</div>
                        <div className="detail-value">{photoRequest.event_type || 'Not specified'}</div>
                    </div>

                    <div className='detail-item'>
                        <div className="request-subtype"> {photoRequest.date_type === 'range' ? 'Start Date ' : 'Date '}</div>
                        <div className="detail-value">{formatDate(photoRequest.start_date)}</div>
                        
                    </div>
                    {photoRequest.date_type === 'range' && (
                            <div className='detail-item'>
                            <div className="request-subtype">End Date</div>
                            <div className="detail-value">{formatDate(photoRequest.end_date)}</div>
                            
                        </div>
                    )}

                    <div className='detail-item'>
                        <div className="request-subtype">Location</div>
                        <div className="detail-value">{photoRequest.location || 'Not specified'}</div>
                    </div>
                
                </div>

                
                {!hideBidButton && (
                    <div style={{marginTop: '20px'}}>
                        <Link className="btn btn-secondary rounded-pill bid-button" to={`/submit-bid/${photoRequest.id}`}>
                            <span className="bid-button-text">
                                <span>View More</span>
                            </span>
                        </Link>
                    </div>

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
