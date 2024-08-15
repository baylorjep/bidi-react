import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import BidDisplay from './BidDisplay';
import '../App.css';

function MyBids() {
    const [bids, setBids] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserAndBids = async () => {
            const { data: userData, error: userError } = await supabase.auth.getUser();

            if (userError) {
                setError('Failed to fetch user.');
                console.error(userError);
                return;
            }

            const user = userData.user;

            const { data: requests, error: requestError } = await supabase
                .from('requests')
                .select('id')
                .eq('user_id', user.id);

            if (requestError) {
                setError('Failed to fetch requests.');
                console.error(requestError);
                return;
            }

            const requestIds = requests.map(request => request.id);

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
        const { error } = await supabase
            .from('requests')
            .update({ open: false })
            .eq('id', requestId);

        if (error) {
            setError(`Error approving bid: ${error.message}`);
            console.error('Error approving bid:', error);
            return;
        }

        navigate(`/bid-accepted/${requestId}`);
    };

    return (
        <div className="container px-5">
            <header className="masthead">
                <h2>My Bids</h2>
                {error && <p className="text-danger">{error}</p>}
                {bids.length > 0 ? (
                    bids.map((bid) => (
                        <BidDisplay key={bid.id} bid={bid} handleApprove={handleApprove} />
                    ))
                ) : (
                    <p>You don't have any bids at the moment. Please check back later, or look out for notifications.</p>
                )}
            </header>
        </div>
    );
}

export default MyBids;