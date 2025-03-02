import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';

function RequestDisplayMini({ request, hideBidButton, isPhotoRequest = false }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const isNew = (createdAt) => {
        if (!createdAt) return false;
        const now = new Date();
        const created = new Date(createdAt);
        const diffInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        return diffInDays < 7;
    };

    const checkPromotion = (createdAt) => {
        if (!createdAt) return null;

        const localCreated = new Date(createdAt);
        const createdDate = localCreated.toLocaleDateString('en-CA');
        const specialDates = ['2025-01-11', '2025-01-25'];

        if (!specialDates.includes(createdDate)) return null;

        const now = Date.now();
        const created = new Date(createdAt).getTime();
        const minutesSinceCreation = (now - created) / (1000 * 60);

        if (minutesSinceCreation < 30) {
            return {
                message: "⚡Save 2%",
                endTime: new Date(created + (30 * 60 * 1000))
            };
        }
        if (minutesSinceCreation < 60) {
            return {
                message: "⏳Save 1%",
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

    const handleCloseModal = () => {
        setSelectedPhoto(null);
    };

    const getTitle = () => {
        if (isPhotoRequest) {
            return request.event_title || 'Untitled Event';
        }
        return request.service_title || request.title || request.event_title || 'Untitled Service';
    };

    const getDate = () => {
        // For beauty requests, use start_date
        if (request.table_name === 'beauty_requests') {
            return request.start_date ? new Date(request.start_date).toLocaleDateString() : 'Date not specified';
        }

        // Try all possible date field names
        const startDate = isPhotoRequest 
            ? request.start_date 
            : request.service_date || request.date || request.event_date || request.start_date;

        if (request.date_flexibility === 'specific') {
            return startDate ? new Date(startDate).toLocaleDateString() : 'Date not specified';
        } else if (request.date_flexibility === 'range') {
            const endDate = request.end_date || request.event_end_date;
            return startDate && endDate 
                ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                : startDate 
                    ? new Date(startDate).toLocaleDateString()
                    : 'Date not specified';
        } else if (request.date_flexibility === 'flexible') {
            return `Flexible within ${request.date_timeframe || request.timeframe || 'specified timeframe'}`;
        }
        // Handle legacy requests without date_flexibility
        return startDate ? new Date(startDate).toLocaleDateString() : 'Date not specified';
    };

    return (
        <div className="request-display-mini text-center mb-4">
            <div className="request-content p-3">
                <div style={{textAlign:'left', width: '100%', padding: '0 20px', marginBottom: '20px'}}>
                    <h2 className="request-title">{getTitle()}</h2>
                    <div style={{display: 'flex', gap: '10px'}}>
                        {isNew(request.created_at) && (
                            <div className="request-status">New</div>
                        )}
                        {checkPromotion(request.created_at) && (
                            <div className="promotion-status">
                                {checkPromotion(request.created_at).message}
                                {timeLeft && <span> ({timeLeft})</span>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="details-grid">
                    <div className="detail-item">
                        <span className="detail-label">Event Type</span>
                        <span className="detail-value">{request.event_type || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Location</span>
                        <span className="detail-value">{request.location || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Date of Service</span>
                        <span className="detail-value-long">{getDate()}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Budget</span>
                        <span className="detail-value">${request.price_range || request.budget_range}</span>
                    </div>
                </div>

                {!hideBidButton && (
                    <div style={{marginTop: '20px', display: 'flex', justifyContent: 'center'}}>
                        <Link 
                            className="submit-bid-button" 
                            to={`/submit-bid/${request.id}`} 
                            style={{textDecoration:'none'}}
                        >
                            <span className="bid-button-text">
                                <span>View More</span>
                            </span>
                        </Link>
                    </div>
                )}
            </div>

            {selectedPhoto && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content">
                        <img 
                            src={selectedPhoto.url} 
                            onClick={(e) => e.stopPropagation()} 
                            alt="Selected" 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default RequestDisplayMini;
