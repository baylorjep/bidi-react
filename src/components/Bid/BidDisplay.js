import React from 'react';

function BidDisplay({ bid, handleApprove, handleDeny }) {
    return (
        <div className="request-display">
            <div className="d-flex justify-content-between align-items-center">
                {/* Left Aligned: Business Name */}
                <h2 className="request-title" style={{ marginBottom: '0', textAlign: 'left' }}>
                    {bid.business_profiles.business_name}
                </h2>
                {/* Right Aligned: Price within a button */}
                <button
                    className="btn btn-secondary"
                    style={{ fontSize: '16px', fontWeight: 'bold' }}
                    disabled
                >
                    ${bid.bid_amount}
                </button>
            </div>
            <hr />
            <div className="request-content">
                <p className="request-category">
                    <strong>Category:</strong> {bid.business_profiles.business_category}
                </p>
                <p className="request-description">
                    <strong>Description:</strong> {bid.bid_description}
                </p>
                <p className="request-date">
                    <strong>Phone:</strong> {bid.business_profiles.phone}
                </p>

                {/* If there's a website, display it */}
                {bid.business_profiles.website && (
                    <p className="request-comments">
                        <strong>Website:</strong> <a href={bid.business_profiles.website} target="_blank" rel="noopener noreferrer">{bid.business_profiles.website}</a>
                    </p>
                )}
            </div>

            {/* Adding space between the last line of content and the buttons */}
            <div style={{ marginBottom: '30px' }}></div>

            {/* Approve/Deny Buttons, separated from the main content */}
            <div className="business-actions">
                <button
                    className="btn btn-success"
                    onClick={() => handleApprove(bid.id, bid.request_id)} // Pass both bidId and requestId
                >
                    Approve
                </button>
                <button
                    className="btn btn-danger"
                    onClick={() => handleDeny(bid.id)}
                >
                    Deny
                </button>
            </div>
        </div>
    );
}

export default BidDisplay;
