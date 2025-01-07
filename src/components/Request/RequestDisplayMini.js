import React from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';

function RequestDisplay({ request, hideBidButton }) {
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

    return (
        <div className="request-display-mini text-center mb-4">
            <div className="request-content p-3">
                <div style={{textAlign:'left', width: '100%', padding: '0 20px', marginBottom: '20px'}}>
                    <h2 className="request-title">{request.service_title}</h2>
                    {isNew(request.created_at) && (
                        <div className="request-status">New</div>
                    )}
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

export default RequestDisplay;
