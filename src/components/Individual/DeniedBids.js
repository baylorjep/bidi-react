import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import BidDisplay from '../Bid/BidDisplay';

function DeniedBids() {
    const [deniedBids, setDeniedBids] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserAndDeniedBids = async () => {
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

            // Fetch denied bids related to the user's requests and join with business_profiles
            const { data: bidsData, error: bidsError } = await supabase
                .from('bids')
                .select('*, business_profiles(business_name, business_category, phone, website, id, membership_tier)')
                .in('request_id', requestIds)
                .eq('status', 'denied'); // Filter by the 'denied' status

            if (bidsError) {
                setError('Failed to fetch denied bids.');
                console.error(bidsError);
                return;
            }

            // Sort bids to prioritize verified or plus-tier businesses
            const sortedBids = bidsData.sort((a, b) => {
                const aIsVerified = a.business_profiles?.membership_tier === "Plus" || a.business_profiles?.membership_tier === "Verified";
                const bIsVerified = b.business_profiles?.membership_tier === "Plus" || b.business_profiles?.membership_tier === "Verified";
                return bIsVerified - aIsVerified; // Verified bids will appear first
            });

            setDeniedBids(sortedBids);
        };

        fetchUserAndDeniedBids();
    }, []);

    return (
        <div className="container">
            <h1>Denied Bids</h1>
            {error && <p className="text-danger">{error}</p>}
            {deniedBids.length > 0 ? (
                deniedBids.map((bid) => (
                    <BidDisplay key={bid.id} bid={bid} />
                ))
            ) : (
                <p>No denied bids available.</p>
            )}
        </div>
    );
}

export default DeniedBids;
