import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import BidDisplay from '../Bid/BidDisplay';
import '../../App.css';
import { useNavigate } from 'react-router-dom';

function MyBids() {
    const [bids, setBids] = useState([]);
    const [error, setError] = useState('');
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

    const handleApprove = async (bidId, requestId, category) => {
        console.log('Bid ID:', bidId); // Confirm the Bid ID
        console.log('Request ID:', requestId); // Confirm the Request ID
        console.log('Category:', category); // Confirm the Category
    
        // Attempt to update the status of the bid to 'accepted'
        const { error: bidError } = await supabase
            .from('bids')
            .update({ status: 'accepted' })
            .eq('id', bidId);
    
        if (bidError) {
            console.error('Error approving bid:', bidError.message); // Log the actual error
            setError(`Error approving bid: ${bidError.message}`);
            return;
        }
    
        let requestError;
    
        if (category === 'requests') {
            // Attempt to update the open status of the request in the 'requests' table to false
            const { error } = await supabase
                .from('requests')
                .update({ open: false })
                .eq('id', requestId);
            requestError = error;
        } else if (category === 'photography_requests') {
            // Attempt to update the status of the photography request in the 'photography_requests' table to 'closed'
            const { error } = await supabase
                .from('photography_requests')
                .update({ status: 'closed' })
                .eq('id', requestId);
            requestError = error;
        }
    
        if (requestError) {
            console.error('Error updating request status:', requestError.message); // Log the actual error
            setError(`Error updating request status: ${requestError.message}`);
            return;
        }
    
        console.log('Bid approved and request status updated successfully.');
        navigate('/bid-accepted');
    };
    
    
    
    
    const handleDeny = async (bidId) => {
        // Update the status of the bid to 'denied'
        const { error: bidError } = await supabase
            .from('bids')
            .update({ status: 'denied' })
            .eq('id', bidId);
    
        if (bidError) {
            setError(`Error denying bid: ${bidError.message}`);
            console.error('Error denying bid:', bidError);
            return;
        }
    
        // Remove the bid from the state so it no longer shows on the page
        setBids(bids.filter(bid => bid.id !== bidId));
    };
    
    const pendingBids = bids.filter(bid => bid.status === 'pending');

    return (
        <div className="container px-5">
            <header className="masthead">
                <h2>My Bids</h2>
                {error ? (
                    <p className="text-danger">{error}</p>
                ) : pendingBids.length > 0 ? (
                    pendingBids.map((bid) => (
                        <BidDisplay key={bid.id} bid={bid} handleApprove={handleApprove} handleDeny={handleDeny} />
                    ))
                ) : (
                    <p>You don't have any pending bids at the moment. <br ></br> Please check back later, or look out for notifications.</p>
                )}
            </header>
        </div>
    );
}

export default MyBids;