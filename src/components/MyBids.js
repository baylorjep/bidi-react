import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import BidDisplay from './BidDisplay';
import '../App.css';
import { useNavigate } from 'react-router-dom';

function MyBids() {
    const [bids, setBids] = useState([]);
    const [error, setError] = useState('');
    // Remove user if it's not being used
    // const [user, setUser] = useState(null);
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

            // No need to set user if you're not using it
            // setUser(userData.user);

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

    const handleApprove = async (bidId, requestId) => {
        // Update the `status` of the bid to 'accepted'
        const { error: bidError } = await supabase
            .from('bids')
            .update({ status: 'accepted' })
            .eq('id', bidId);
    
        if (bidError) {
            setError(`Error approving bid: ${bidError.message}`);
            console.error('Error approving bid:', bidError);
            return;
        }
    
        // Update the `open` status of the request to false
        const { error: requestError } = await supabase
            .from('requests')
            .update({ open: false })
            .eq('id', requestId);
    
        if (requestError) {
            setError(`Error updating request status: ${requestError.message}`);
            console.error('Error updating request status:', requestError);
            return;
        }
    
        // Redirect to the BidSuccess page
        navigate('/bid-success');
    };
    
    const handleDeny = async (bidId) => {
        // Update the `status` of the bid to 'denied'
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
    

    return (
        <div className="container px-5">
            <header className="masthead">
                <h2>My Bids</h2>
                {error && <p className="text-danger">{error}</p>}
                {bids.length > 0 ? (
                    bids
                        .filter(bid => bid.status === 'pending')
                        .map((bid) => (
                            <BidDisplay key={bid.id} bid={bid} handleApprove={handleApprove} handleDeny={handleDeny} />
                        ))
                ) : (
                    <p>You don't have any bids at the moment. Please check back later, or look out for notifications.</p>
                )}

            </header>
        </div>
    );
}

export default MyBids;
