import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../App.css';

function MyBids() {
    const [activeIndex, setActiveIndex] = useState(null);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchBids = async () => {
            setLoading(true);

            const { data: session } = await supabase.auth.getSession();
            const currentUser = session?.user;

            if (currentUser) {
                setUser(currentUser);
                const { data, error } = await supabase
                    .from('bids')
                    .select('*')
                    .eq('user_id', currentUser.id);

                if (error) {
                    console.error('Error fetching bids:', error.message);
                } else {
                    setBids(data);
                }
            }
            setLoading(false);
        };

        fetchBids();
    }, []);

    const toggleDescription = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const handleApprove = (bidId) => {
        // Handle bid approval logic here
        console.log(`Approved bid with id: ${bidId}`);
    };

    const handleDeny = (bidId) => {
        // Handle bid denial logic here
        console.log(`Denied bid with id: ${bidId}`);
    };

    if (loading) {
        return <div className="container px-5">Loading your bids...</div>;
    }

    return (
        <div className="container px-5 py-5">
            <header className="masthead">
                <h2 className="text-center mb-4">My Bids</h2>
                {bids.length > 0 ? (
                    bids.map((bid, index) => (
                        <div className="business-container mb-4 p-4 shadow-sm rounded" key={index} onClick={() => toggleDescription(index)}>
                            <div className="business-info">
                                <div className="business-name h4">{bid.business_name}</div>
                                <div className="business-description">
                                    <span className="short-description">
                                        {bid.short_description || `Hey ${user?.user_metadata?.first_name}, I would love to do a ${bid.service_type} for you...`}
                                    </span>
                                    {activeIndex === index && (
                                        <span className="full-description">
                                            {bid.full_description || `Hey ${user?.user_metadata?.first_name},\n\nI’d love to handle your ${bid.service_type}! My rate is ${bid.rate} per hour.`}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="business-price text-primary h5">${bid.rate}</div>
                            {activeIndex === index && (
                                <div className="business-actions mt-3" style={{ display: 'flex' }}>
                                    <button className="btn btn-success me-2" onClick={() => handleApprove(bid.id)}>Approve</button>
                                    <button className="btn btn-danger" onClick={() => handleDeny(bid.id)}>Deny</button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="no-bids text-center">
                        <h3 className="mb-3">No Current Bids</h3>
                        <p className="lead">You don't have any bids at the moment. Please check back later or look out for notifications.</p>
                        
                    </div>
                )}
            </header>
        </div>
    );
}

export default MyBids;
