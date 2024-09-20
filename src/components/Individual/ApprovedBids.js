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
                .select('*, business_profiles(business_name, business_category, phone, website)')
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

    return (
        <div className="container px-5">
            <header className="masthead">
                <h2>Approved Bids</h2>
                {error ? (
                    <p className="text-danger">{error}</p>
                ) : approvedBids.length > 0 ? (
                    approvedBids.map((bid) => (
                        <div key={bid.id} className="approved-bid-card">
                            <h3>{bid.business_profiles.business_name}</h3>
                            <p><strong>Bid Amount:</strong> ${bid.bid_amount / 100}</p>
                            <p><strong>Description:</strong> {bid.bid_description}</p>
                            <button
                                className="btn btn-secondary"
                                onClick={() => handlePayNow(bid)}
                            >
                                Pay Now
                            </button>
                        </div>
                    ))
                ) : (
                    <p>You don't have any approved bids at the moment.</p>
                )}
            </header>
        </div>
    );
}

export default ApprovedBids;