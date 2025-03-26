import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import './AcceptedBids.css';

function AcceptedBids() {
    const [acceptedBids, setAcceptedBids] = useState([]);
    const [userContacts, setUserContacts] = useState({});
    const [newBidsCount, setNewBidsCount] = useState(0);
    const [notification] = useState(new Audio('/notification.mp3')); // Add a notification sound file to your public folder

    const fetchBids = async () => {
        try {
            const { data, error } = await supabase
                .from('bids')
                .select('*')
                .eq('status', 'accepted')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAcceptedBids(data);
            
            // Fetch user contact info
            const userIds = data.map(bid => bid.user_id);
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, email')
                .in('id', userIds);

            if (profilesError) throw profilesError;
            const contacts = profiles.reduce((acc, contact) => {
                acc[contact.id] = contact;
                return acc;
            }, {});
            setUserContacts(contacts);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        fetchBids();

        // Subscribe to changes in the bids table
        const subscription = supabase
            .channel('accepted-bids-channel')
            .on('postgres_changes', 
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bids',
                    filter: 'status=eq.accepted'
                },
                (payload) => {
                    // Play notification sound
                    notification.play().catch(e => console.log('Error playing sound:', e));
                    
                    // Increment new bids counter
                    setNewBidsCount(prev => prev + 1);
                    
                    // Update bids list
                    setAcceptedBids(prevBids => [payload.new, ...prevBids]);
                }
            )
            .subscribe();

        // Cleanup subscription
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const clearNewBidsNotification = () => {
        setNewBidsCount(0);
    };

    return (
        <div className="accepted-bids-container">
            <h3 className="section-title">
                Accepted Bids
                {newBidsCount > 0 && (
                    <span className="new-bids-badge" onClick={clearNewBidsNotification}>
                        {newBidsCount} new
                    </span>
                )}
            </h3>
            
            {/* Desktop view */}
            <div className="desktop-view">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Bid ID</th>
                            <th>Bid Amount</th>
                            <th>User ID</th>
                            <th>Business Contact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {acceptedBids.map(bid => (
                            <tr key={bid.id}>
                                <td>{bid.id}</td>
                                <td>${bid.bid_amount}</td>
                                <td>{bid.user_id}</td>
                                <td>
                                    {userContacts[bid.user_id] ? (
                                        <div>{userContacts[bid.user_id].email}</div>
                                    ) : (
                                        <p>Loading...</p>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile view */}
            <div className="mobile-view">
                {acceptedBids.map(bid => (
                    <div key={bid.id} className="bid-card">
                        <div className="bid-header">
                            <span className="bid-label">Bid ID:</span>
                            <span className="bid-value">{bid.id}</span>
                        </div>
                        <div className="bid-detail">
                            <span className="bid-label">Amount:</span>
                            <span className="bid-value">${bid.bid_amount}</span>
                        </div>
                        <div className="bid-detail">
                            <span className="bid-label">User ID:</span>
                            <span className="bid-value">{bid.user_id}</span>
                        </div>
                        <div className="bid-detail">
                            <span className="bid-label">Contact:</span>
                            <span className="bid-value">
                                {userContacts[bid.user_id] ? (
                                    userContacts[bid.user_id].email
                                ) : (
                                    'Loading...'
                                )}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AcceptedBids;