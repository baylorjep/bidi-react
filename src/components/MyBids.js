import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../App.css';
import { useNavigate } from 'react-router-dom';

function MyBids() {
    const [bids, setBids] = useState([]);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserAndBids = async () => {
            // Fetch the logged-in user
            const { data: userData, error: userError } = await supabase.auth.getUser();

            if (userError) {
                setError('Failed to fetch user.');
                console.error(userError);
                return;
            }

            setUser(userData.user);

            // Fetch requests made by the logged-in user
            const { data: requests, error: requestError } = await supabase
                .from('requests')
                .select('id')
                .eq('user_id', userData.user.id);

            if (requestError) {
                setError('Failed to fetch requests.');
                console.error(requestError);
                return;
            }

            // Extract request IDs
            const requestIds = requests.map(request => request.id);

            // Fetch bids related to the user's requests and join with business_profiles
            const { data: bidsData, error: bidsError } = await supabase
                .from('bids')
                .select('*, business_profiles(business_name, business_category, phone, website)')
                .in('request_id', requestIds);

            if (bidsError) {
                setError('Failed to fetch bids.');
                console.error(bidsError);
                return;
            }

            setBids(bidsData);
        };

        fetchUserAndBids();
    }, []);

    const handleApprove = async (requestId) => {
        // Update the `open` status of the request to false
        const { error } = await supabase
            .from('requests')
            .update({ open: false })
            .eq('id', requestId);

        if (error) {
            setError(`Error approving bid: ${error.message}`);
            console.error('Error approving bid:', error);
            return;
        }

        // Redirect to the BidAccept.js page
        navigate(`/bid-accepted/${requestId}`);
    };

    return (
        <div className="container px-5">
            <header className="masthead">
                <h2>My Bids</h2>
                {error && <p className="text-danger">{error}</p>}
                {bids.length > 0 ? (
                    bids.map((bid) => (
                        <div key={bid.id} className="business-container">
                            <div className="business-info">
                                <div className="business-name">Business: {bid.business_profiles.business_name}</div>
                                <div className="business-category">Category: {bid.business_profiles.business_category}</div>
                                <div className="business-phone">Phone: {bid.business_profiles.phone}</div>
                                {bid.business_profiles.website && (
                                    <div className="business-website">
                                        Website: <a href={bid.business_profiles.website} target="_blank" rel="noopener noreferrer">{bid.business_profiles.website}</a>
                                    </div>
                                )}
                                <div className="business-description">
                                    <span className="short-description">
                                        {bid.bid_description}
                                    </span>
                                </div>
                            </div>
                            <div className="business-price">${bid.bid_amount}</div>
                            <div className="business-actions" style={{ display: 'flex' }}>
                                <button className="btn-approve" onClick={() => handleApprove(bid.request_id)}>Approve</button>
                                <button className="btn-deny">Deny</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>You don't have any bids at the moment. Please check back later, or look out for notifications.</p>
                )}
            </header>
        </div>
    );
}

export default MyBids;
