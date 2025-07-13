import React, { useState, useEffect } from 'react';
import '../../App.css';
import '../../styles/RequestDisplayMini.css';

function RequestDisplayMini({ 
    request, 
    hideBidButton, 
    isPhotoRequest = false, 
    onHide, 
    isHidden = false, 
    onShow,
    currentVendorId = null,
    onMessageClick = null, // Add this prop
    onViewMore = null // Add this prop
}) {
    const [timeLeft, setTimeLeft] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Helper to parse created_at as UTC if needed
    const parseUTCDate = (dateString) => {
        if (!dateString) return null;
        // If already ISO, just use it
        if (dateString.includes('T')) return new Date(dateString);
        // Convert 'YYYY-MM-DD HH:mm:ss.ssssss' to 'YYYY-MM-DDTHH:mm:ss.sssZ'
        return new Date(dateString.replace(' ', 'T').replace(/([.\d]+)$/, '$1Z'));
    };

    const isNew = (createdAt) => {
        if (!createdAt) return false;
        const now = new Date();
        const created = parseUTCDate(createdAt);
        const diffInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        return diffInDays < 7;
    };

    const checkPromotion = (createdAt) => {
        if (!createdAt) return null;

        const now = Date.now();
        const created = parseUTCDate(createdAt)?.getTime();
        if (!created) return null;
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
                const nowUTC = Date.now();
                const createdUTC = parseUTCDate(request.created_at)?.getTime();
                if (!createdUTC) {
                    setTimeLeft('');
                    return;
                }
                const timeRemaining = promotion.endTime.getTime() - nowUTC;
                const minutesSinceCreation = (nowUTC - createdUTC) / (1000 * 60);

                // Only cap if created_at is in the future (negative minutesSinceCreation)
                if (promotion.message === "⚡Save 2%" && minutesSinceCreation < 0) {
                    setTimeLeft("30:00");
                } else if (promotion.message === "⏳Save 1%" && minutesSinceCreation < 0) {
                    setTimeLeft("60:00");
                } else if (timeRemaining > 0) {
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
        // First check if it's a photo request (legacy check)
        if (isPhotoRequest) {
            return request.event_title || 'Untitled Event';
        }

        // Check all possible title fields in order of preference
        const title = request.event_title || 
                     request.title || 
                     request.service_title || 
                     `${request.event_type || 'Untitled'} Event`;

        // If we have a title but it's too short, add the event type
        if (title.length < 3 && request.event_type) {
            return `${request.event_type} Event`;
        }

        return title;
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

    const isVendorSelected = () => {
        if (!request.vendor_id || !currentVendorId) return false;
        const vendorIds = Array.isArray(request.vendor_id) 
            ? request.vendor_id 
            : JSON.parse(request.vendor_id || '[]');
        return vendorIds.includes(currentVendorId);
    };

    return (
        <div className={`request-display-mini text-center mb-4 
            ${isVendorSelected() ? 'selected-vendor' : ''}
            ${isHidden ? 'hidden-request' : ''}`}
        >
            <div className="header-container">
                {isVendorSelected() && (
                    <div className="selected-badge">
                        <span>⭐ Client Requested You</span>
                        <span className="commission-badge">
                            1% Off Commission
                        </span>
                    </div>
                )}
                <button 
                    onClick={isHidden ? onShow : onHide} 
                    className="hide-button"
                    title={isHidden ? "Show this request" : "Hide this request"}
                >
                    {isHidden ? (
                        <i className="fas fa-eye"></i>
                    ) : (
                        <i className="fas fa-times"></i>
                    )}
                </button>
            </div>

            <div className="request-content p-3">
                <div className="title-section">
                    <h2 className="request-title">{getTitle()}</h2>
                    <div style={{display: 'flex', gap: '10px'}}>
                        {isNew(request.created_at) && (
                            <div className="request-status">New</div>
                        )}
                        {checkPromotion(request.created_at) && (
                            <div className="promotion-status fade-in">
                                {checkPromotion(request.created_at).message}
                                {timeLeft && <span> ({timeLeft})</span>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="details-grid">
                    <div className="detail-item">
                        <span className="detail-label">
                            <i className="fas fa-calendar-alt" style={{ color: '#9633eb', marginRight: '8px' }}></i>
                            Event Type
                        </span>
                        <span className="detail-value detail-chip">
                            {request.event_type || 'Not specified'}
                        </span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">
                            <i className="fas fa-map-marker-alt" style={{ color: '#9633eb', marginRight: '8px' }}></i>
                            Location
                        </span>
                        <span className="detail-value detail-chip">
                            {request.location || 'Not specified'}
                        </span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">
                            <i className="fas fa-clock" style={{ color: '#9633eb', marginRight: '8px' }}></i>
                            Date of Service
                        </span>
                        <span className="detail-value-long detail-chip">
                            {getDate()}
                        </span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">
                            <i className="fas fa-dollar-sign" style={{ color: '#9633eb', marginRight: '8px' }}></i>
                            Budget
                        </span>
                        <span className="detail-value detail-chip">
                            ${request.price_range || request.budget_range}
                        </span>
                    </div>
                </div>

                {!hideBidButton && (
                    <div className="buttons-container" style={{
                        gridTemplateColumns: currentVendorId && isVendorSelected() ? "1fr 1fr" : "minmax(auto, 400px)",
                    }}>
                        <button 
                            className="submit-bid-button" 
                            onClick={() => onViewMore && onViewMore(request.id)}
                        >
                            <i className="fas fa-eye"></i>
                            <span>View More</span>
                        </button>
                        {currentVendorId && isVendorSelected() && (
                            <button 
                                className="message-button" 
                                onClick={() => onMessageClick && onMessageClick(request.user_id)}
                            >
                                <i className="fas fa-comment-dots"></i>
                                <span>Message</span>
                            </button>
                        )}
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
