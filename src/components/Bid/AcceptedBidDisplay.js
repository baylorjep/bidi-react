import React from 'react';

function AcceptedBidDisplay({ bid }) {
    const handleMessageClick = () => {
        // Construct mailto link with business email and default message template
        const subject = encodeURIComponent('Regarding Your Bid');
        const body = encodeURIComponent(
            `Hi ${bid.business_profiles.business_name},\n\n` +
            `I have accepted your bid for the project and would like to discuss further details. ` +
            `Please let me know if there's anything I need to prepare on my end.\n\n` +
            `Best regards,\n[Your Name]`
        );
        const mailtoLink = `mailto:${bid.business_profiles.email || ''}?subject=${subject}&body=${body}`;
        window.location.href = mailtoLink;
    };

    return (
        <div className="request-display">
            <div className="d-flex justify-content-between align-items-center">
                {/* Left Aligned: Business Name */}
                <h2 className="request-title" style={{ marginBottom: '0', textAlign: 'left' }}>{bid.business_profiles.business_name}</h2>
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
                <p className="request-category"><strong>Category:</strong> {bid.business_profiles.business_category}</p>
                <p className="request-description"><strong>Description:</strong> {bid.bid_description}</p>
                <p className="request-date"><strong>Phone:</strong> {bid.business_profiles.phone}</p>

                {/* If there's a website, display it */}
                {bid.business_profiles.website && (
                    <p className="request-comments">
                        <strong>Website:</strong> <a href={bid.business_profiles.website} target="_blank" rel="noopener noreferrer">{bid.business_profiles.website}</a>
                    </p>
                )}

                {/* Adding space between the last line of content and the buttons */}
                <div style={{ marginBottom: '30px' }}></div>

                {/* Message Button */}
                <div className="business-actions" style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={handleMessageClick}
                        style={{ marginRight: '10px' }}
                    >
                        Message
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AcceptedBidDisplay;
