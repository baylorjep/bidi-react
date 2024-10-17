import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

function ApprovedBids() {
    const [approvedBids, setApprovedBids] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchApprovedBids = async () => {
            // Fetch the logged-in user
            const { data: userData, error: userError } = await supabase.auth.getUser();

            if (userError) {
                setError('Failed to fetch user.');
                console.error(userError);
                return;
            }

            // Fetch requests made by the logged-in user from both 'requests' and 'photography_requests'
            const { data: requests, error: requestError } = await supabase
                .from('requests')
                .select('id')
                .eq('user_id', userData.user.id);

            const { data: photoRequests, error: photoRequestError } = await supabase
                .from('photography_requests')
                .select('id')
                .eq('profile_id', userData.user.id);

            if (requestError || photoRequestError) {
                setError('Failed to fetch requests.');
                console.error(requestError || photoRequestError);
                return;
            }

            // Combine request IDs from both tables
            const requestIds = [
                ...requests.map(request => request.id),
                ...photoRequests.map(photoRequest => photoRequest.id)
            ];

            // Fetch approved bids related to the user's requests and join with business_profiles
            const { data: bidsData, error: bidsError } = await supabase
                .from('bids')
                .select('*, business_profiles(business_name, business_category, phone, website, stripe_account_id)')
                .in('request_id', requestIds)
                .eq('status', 'accepted'); // Only fetch approved bids

            if (bidsError) {
                setError('Failed to fetch approved bids.');
                console.error(bidsError);
                return;
            }

            setApprovedBids(bidsData);
        };

        fetchApprovedBids();
    }, []);

    const handlePayNow = (bid) => {
        // Redirect to the payment component, passing the bid information
        navigate('/checkout', { state: { bid } });
    };

    const handleMessage = (bid) => {
        // Create mailto link with a pre-filled email template
        const subject = encodeURIComponent('Your Bid');
        const body = encodeURIComponent(
            `Hi ${bid.business_profiles.business_name},\n\n` +
            `I have accepted your bid and would like to discuss the next steps.\n\n` +
            `Looking forward to your response.\n\nBest regards,\n[Your Name]`
        );
        const email = bid.business_profiles.email || ''; // Use business email if available
        const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
        window.location.href = mailtoLink;
    };

    return (
        <div className="container">
            <header className="masthead">
                <div className='Sign-Up-Page-Header' style={{paddingBottom:'16px'}}>Approved Bids</div>
                {error ? (
                    <p className="text-danger">{error}</p>
                ) : approvedBids.length > 0 ? (
                    <div className="d-flex flex-column align-items-center"> {/* Center the whole card */}
                        {approvedBids.map((bid) => (
                            <div key={bid.id} className="approved-bid-card card p-4 mb-4" style={{ width: '100%', maxWidth: '500px' }}>
                                <div className='request-title' style={{ marginBottom: '0', textAlign: 'left' }}>{bid.business_profiles.business_name}</div>
                                <button
                                    className="bid-button"
                                    
                                    disabled
                                >
                                    ${bid.bid_amount}
                                </button>
                                <p><strong>Description:</strong> {bid.bid_description}</p>
                                <p><strong>Phone:</strong> {bid.business_profiles.phone}</p>
                                <button
                                    className="btn btn-secondary btn-md flex-fill"
                                    onClick={() => handlePayNow(bid)}
                                    
                                >
                                    Pay Now
                                </button>
                                <br></br>
                                <button
                                    className="btn btn-secondary btn-md flex-fill"
                                    onClick={() => handleMessage(bid)}
                                    
                                >
                                    Message
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>You don't have any approved bids at the moment.</p>
                )}
            </header>
        </div>
    );
}

export default ApprovedBids;