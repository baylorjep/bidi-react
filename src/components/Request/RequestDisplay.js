import React from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';

function RequestDisplay({ request, hideBidButton }) {
    return (
        <div className="request-display text-center mb-4">
            <div className="request-content p-3">
                <h2 className="request-title">{request.service_title}</h2>
                
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
    
                <div className="request-description">
                    <span className="detail-label">Description</span>
                    <p className="detail-value">{request.service_description}</p>
                </div>
                
                {request.additional_comments && (
                    <div className="request-additional-comments">
                        <span className="detail-label">Additional Comments</span>
                        <p className="detail-value">{request.additional_comments}</p>
                    </div>
                )}
                
                {!hideBidButton && (
                    <Link className="btn btn-secondary rounded-pill bid-button" to={`/submit-bid/${request.id}`}>
                        <span className="bid-button-text">
                            <span>View More</span>
                        </span>
                    </Link>
                )}
            </div>
        </div>
    );
}

export default RequestDisplay;
