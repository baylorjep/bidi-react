import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient'; // Import your Supabase client
import bidiCheck from '../../assets/images/Bidi-Favicon.png'

function BidDisplay({ bid, handleApprove, handleDeny }) {
    const [hasBidiPlus, setHasBidiPlus] = useState(false);
    const [loading, setLoading] = useState(true);  // Loading state
    const [error, setError] = useState(null);  // Error state

    useEffect(() => {
        const fetchBidiPlusStatus = async () => {
            try {
                // Log to ensure bid ID is valid
                console.log('Fetching Bidi Plus status for business profile ID:', bid.business_profiles.id);

                // Fetch Bidi_Plus status for this bid's associated business profile
                const { data, error } = await supabase
                    .from('business_profiles') // Replace with your actual table name
                    .select('Bidi_Plus')
                    .eq('id', bid.business_profiles.id) // Match the business profile ID
                    .single();

                // Log the response to check the data
                console.log('Supabase response:', data, error);

                if (error) {
                    throw error;
                }

                // If data exists and Bidi_Plus is true, update state
                setHasBidiPlus(data?.Bidi_Plus || false); // Update the state
            } catch (error) {
                console.error('Error fetching Bidi Plus status:', error.message);
                setError('Failed to fetch Bidi Plus status'); // Set a friendly error message
            } finally {
                setLoading(false);  // Set loading to false once the fetch is complete
            }
        };

        fetchBidiPlusStatus();
    }, [bid.business_profiles.id]);

    return (
        <div className="request-display">
            <div className="d-flex justify-content-between align-items-center">
                {/* Left Aligned: Business Name */}
                <div className="request-title" style={{ marginBottom: '0', textAlign: 'left' }}>
                {hasBidiPlus && (<img src={bidiCheck} style={{height:'40px', widht:'auto'}}></img>)}{bid.business_profiles.business_name} 
                    {loading ? (
                        <p>Loading...</p>  // Show loading text while fetching
                    ) : error ? (
                        <p></p>
                    ) : (
                        hasBidiPlus && (
                            <p style={{ fontSize: '0.9rem', margin: '0', fontWeight: 'bold', textAlign:'left' }}>
                                Bidi Verified
                            </p>
                        )
                    )}
                </div>
                {/* Right Aligned: Price within a button */}
                <button
                    className="bid-button"
                    disabled
                >
                    ${bid.bid_amount}
                </button>
            </div>
            <hr />
            <div className="request-content">
                <p className="request-category" style={{ textAlign: 'left' }}>
                    <strong>Category:</strong> {bid.business_profiles.business_category}
                </p>
                <p className="request-description" style={{ textAlign: 'left' }}>
                    <strong>Description:</strong> {bid.bid_description}
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
                    className="btn-success"
                    onClick={() => handleApprove(bid.id, bid.request_id)} // Pass both bidId and requestId
                >
                    Accept
                </button>
                <button
                    className="btn-danger"
                    onClick={() => handleDeny(bid.id)}
                >
                    Deny
                </button>
            </div>
        </div>
    );
}

export default BidDisplay;
