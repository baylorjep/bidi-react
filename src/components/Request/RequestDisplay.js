import React from 'react';
import { Link } from 'react-router-dom';

function RequestDisplay({ request }) {
    return (
        <div className="request-display text-center">
            <div className="request-content">
                <h2 className="request-title">{request.service_title}</h2>
                <p className="request-location"><strong>Location:</strong> {request.location}</p>
                <p className="request-category"><strong>Category:</strong> {request.service_category}</p>
                <p className="request-description"><strong>Description:</strong> {request.service_description}</p>
                <p className="request-date"><strong>Date of Service:</strong> {new Date(request.service_date).toLocaleDateString()}</p>
                
                {/* Only show additional comments if they exist */}
                { request.additional_comments && <p className="request-comments"><strong>Additional Comments:</strong> {request.additional_comments}</p> }

                <Link className="btn btn-secondary rounded-pill px-3 mb-2 mb-lg-0 bid-button" to={`/submit-bid/${request.id}`}>
                    <span className="d-flex align-items-center">
                        <span className="small">Bid</span>
                    </span>
                </Link>
            </div>
        </div>
    );
}

export default RequestDisplay;