import React from 'react';
import '../App.css';

function BidDisplay({ bid, handleApprove }) {
    return (
        <div className="request-display text-center">
            <div className="request-content">
                <h2 className="request-title">Business: {bid.business_profiles.business_name}</h2>
                <p className="request-category"><strong>Category:</strong> {bid.business_profiles.business_category}</p>
                <p className="request-description"><strong>Description:</strong> {bid.bid_description}</p>
                <p className="request-date"><strong>Phone:</strong> {bid.business_profiles.phone}</p>

                {/* If there's a website, display it */}
                {bid.business_profiles.website && (
                    <p className="request-comments">
                        <strong>Website:</strong> <a href={bid.business_profiles.website} target="_blank" rel="noopener noreferrer">{bid.business_profiles.website}</a>
                    </p>
                )}

                {/* Approve/Deny Buttons */}
                <div className="business-actions" style={{ display: 'flex' }}>
                    <button className="btn-approve" onClick={() => handleApprove(bid.request_id)}>Approve</button>
                    <button className="btn-deny">Deny</button>
                </div>
            </div>
        </div>
    );
}

export default BidDisplay;