import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';

function RequestDisplayMini({ request, hideBidButton }) {
    const [timeLeft, setTimeLeft] = useState('');

    const isNew = (createdAt) => {
        console.log('Checking if new:', createdAt); // Add logging
        if (!createdAt) {
            console.log('No created_at timestamp');
            return false;
        }
        const now = new Date();
        const created = new Date(createdAt);
        const diffInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        console.log('Days difference:', diffInDays);
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
        <div className="request-display-mini text-center mb-4">
            <div className="request-content p-3">
                <div style={{textAlign:'left', width: '100%', padding: '0 20px', marginBottom: '20px'}}>
                    <h2 className="request-title">{request.service_title}</h2>
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
                        <span className="detail-label">Location</span>
                        <span className="detail-value">{request.location}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Category</span>
                        <span className="detail-value">{request.service_category}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Date of Service</span>
                        <span className="detail-value">{new Date(request.service_date).toLocaleDateString()}</span>
                    </div>
                </div>

                
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

export default RequestDisplayMini;
