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

            // Fetch approved bids related to the user's requests
            const { data: bidsData, error: bidsError } = await supabase
                .from('bids')
                .select('*, business_profiles(business_name, business_category, phone, website)')
                .eq('status', 'accepted')
                .eq('user_id', userData.user.id); // Filter by the logged-in user ID

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
        navigate('/pay-now', { state: { bid } });
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