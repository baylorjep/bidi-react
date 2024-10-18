import React from 'react';
import { Link } from 'react-router-dom';
import '../../App.css';

function RequestDisplay({ request, hideBidButton }) {
    return (
        <div className="request-display text-center mb-4">
            <div className="request-content p-3">
                <h2 className="request-title">{request.service_title}</h2>
                <p className="request-location"><strong>Location:</strong> {request.location}</p>
                <p className="request-category"><strong>Category:</strong> {request.service_category}</p>
                <p className="request-description"><strong>Description:</strong> {request.service_description}</p>
                <p className="request-date"><strong>Date of Service:</strong> {new Date(request.service_date).toLocaleDateString()}</p>
                <p className="request-budget"><strong>Budget:</strong> {request.price_range}</p>
                
                {request.additional_comments && <p className="request-comments"><strong>Additional Comments:</strong> {request.additional_comments}</p>}
                
                {!hideBidButton && (
                    <Link className="btn btn-secondary rounded-pill bid-button" to={`/submit-bid/${request.id}`}>
                        <span className="bid-button-text">
                            <span>Bid</span>
                        </span>
                    </Link>
                )}
            </div>
        </div>
    );
}

export default RequestDisplay;
