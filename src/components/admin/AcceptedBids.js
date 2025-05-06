import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Alert, Badge } from 'react-bootstrap';
import './AcceptedBids.css';

function AcceptedBids() {
    const [acceptedBids, setAcceptedBids] = useState([]);
    const [userContacts, setUserContacts] = useState({});
    const [newBidsCount, setNewBidsCount] = useState(0);
    const [notification] = useState(new Audio('/notification.mp3'));
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const fetchBids = async () => {
        try {
            const { data, error } = await supabase
                .from('bids')
                .select('*')
                .eq('status', 'accepted');

            if (error) throw error;

            console.log('All accepted bids:', data);

            // Filter out messaged bids
            const unmessagedBids = data.filter(bid => !bid.messaged_vendor);
            console.log('Unmessaged bids:', unmessagedBids);

            // Sort the data to ensure null accepted_at values come last
            const sortedData = unmessagedBids.sort((a, b) => {
                // If a has no accepted_at, it should come after b
                if (!a.accepted_at) return 1;
                // If b has no accepted_at, it should come after a
                if (!b.accepted_at) return -1;
                // Otherwise, sort by accepted_at in descending order
                return new Date(b.accepted_at) - new Date(a.accepted_at);
            });

            console.log('Sorted bids:', sortedData);
            setAcceptedBids(sortedData);
            
            // Fetch user contact info and profile details
            const userIds = data.map(bid => bid.user_id);
            
            // First get the role from profiles table
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, email, role')
                .in('id', userIds);

            if (profilesError) throw profilesError;

            // Create a map of user IDs to their roles
            const userRoles = profiles.reduce((acc, profile) => {
                acc[profile.id] = profile.role;
                return acc;
            }, {});

            // Fetch individual profiles
            const { data: individualProfiles, error: individualError } = await supabase
                .from('individual_profiles')
                .select('id, first_name, last_name, phone')
                .in('id', userIds);

            if (individualError) throw individualError;

            // Fetch business profiles
            const { data: businessProfiles, error: businessError } = await supabase
                .from('business_profiles')
                .select('id, business_name, phone')
                .in('id', userIds);

            if (businessError) throw businessError;

            // Combine all the information
            const contacts = profiles.reduce((acc, profile) => {
                const role = userRoles[profile.id];
                let displayName = '';
                let phone = '';

                if (role === 'individual') {
                    const individualProfile = individualProfiles.find(p => p.id === profile.id);
                    displayName = individualProfile ? `${individualProfile.first_name} ${individualProfile.last_name}` : 'N/A';
                    phone = individualProfile?.phone || 'Not provided';
                } else if (role === 'business') {
                    const businessProfile = businessProfiles.find(p => p.id === profile.id);
                    displayName = businessProfile ? businessProfile.business_name : 'N/A';
                    phone = businessProfile?.phone || 'Not provided';
                }

                acc[profile.id] = {
                    email: profile.email,
                    displayName: displayName,
                    role: role,
                    phone: phone
                };
                return acc;
            }, {});

            setUserContacts(contacts);
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to fetch bids');
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
                    notification.play().catch(e => console.log('Error playing sound:', e));
                    setNewBidsCount(prev => prev + 1);
                    setAcceptedBids(prevBids => [payload.new, ...prevBids]);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const clearNewBidsNotification = () => {
        setNewBidsCount(0);
    };

    const handleSendSMS = (userData) => {
        // Format phone number - remove any non-numeric characters
        const formattedPhone = userData.phone.replace(/\D/g, '');
        
        // If there's no phone number, show an alert
        if (!formattedPhone || formattedPhone === 'Not provided' || formattedPhone === 'Unknown') {
            alert('No phone number available for this vendor');
            return;
        }
        
        // Generate message template
        const message = `Congratulations! Your bid has been accepted on Bidi! Click here to view the details: https://www.savewithbidi.com/dashboard`;
        
        // Create the sms link
        const smsLink = `sms:${formattedPhone}?body=${encodeURIComponent(message)}`;
        
        // Open the link
        window.open(smsLink, '_blank');
    };

    const markBidAsContacted = async (bidId) => {
        try {
            const { error } = await supabase
                .from('bids')
                .update({ messaged_vendor: true })
                .eq('id', bidId);

            if (error) throw error;

            // Update local state
            setAcceptedBids(prevBids => 
                prevBids.map(bid => 
                    bid.id === bidId ? { ...bid, messaged_vendor: true } : bid
                )
            );

            setSuccessMessage('Bid marked as messaged successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error marking bid as messaged:', error);
            setError('Failed to mark bid as messaged');
            setTimeout(() => setError(''), 3000);
        }
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
            
            {successMessage && <Alert variant="success">{successMessage}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}
            
            {/* Desktop view */}
            <div className="desktop-view">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Bid ID</th>
                            <th>Bid Amount</th>
                            <th>Vendor</th>
                            <th>Contact</th>
                            <th>Accepted At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {acceptedBids.map(bid => {
                            const contact = userContacts[bid.user_id];
                            return (
                                <tr key={bid.id}>
                                    <td>{bid.id}</td>
                                    <td>${bid.bid_amount}</td>
                                    <td>
                                        {contact ? (
                                            <div>
                                                {contact.displayName}
                                                <small style={{ color: '#666', marginLeft: '8px' }}>
                                                    ({contact.role})
                                                </small>
                                            </div>
                                        ) : (
                                            <p>Loading...</p>
                                        )}
                                    </td>
                                    <td>
                                        {contact ? (
                                            <div>
                                                <div>{contact.email}</div>
                                                <small style={{ color: '#666' }}>
                                                    {contact.phone}
                                                </small>
                                            </div>
                                        ) : (
                                            <p>Loading...</p>
                                        )}
                                    </td>
                                    <td>
                                        {bid.accepted_at ? (
                                            new Date(bid.accepted_at).toLocaleString()
                                        ) : (
                                            'N/A'
                                        )}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="sms-button"
                                                onClick={() => handleSendSMS(contact)}
                                                disabled={!contact?.phone || contact.phone === 'Not provided'}
                                            >
                                                <i className="fas fa-sms"></i> Send Text
                                            </button>
                                            {!bid.messaged_vendor && (
                                                <button
                                                    className="mark-button"
                                                    onClick={() => markBidAsContacted(bid.id)}
                                                >
                                                    Mark as Messaged
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile view */}
            <div className="mobile-view">
                {acceptedBids.map(bid => {
                    const contact = userContacts[bid.user_id];
                    return (
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
                                <span className="bid-label">Vendor:</span>
                                <span className="bid-value">
                                    {contact ? (
                                        <div>
                                            {contact.displayName}
                                            <small style={{ color: '#666', marginLeft: '8px' }}>
                                                ({contact.role})
                                            </small>
                                        </div>
                                    ) : (
                                        'Loading...'
                                    )}
                                </span>
                            </div>
                            <div className="bid-detail">
                                <span className="bid-label">Contact:</span>
                                <span className="bid-value">
                                    {contact ? (
                                        <div>
                                            <div>{contact.email}</div>
                                            <small style={{ color: '#666' }}>
                                                {contact.phone}
                                            </small>
                                        </div>
                                    ) : (
                                        'Loading...'
                                    )}
                                </span>
                            </div>
                            <div className="bid-detail">
                                <span className="bid-label">Accepted At:</span>
                                <span className="bid-value">
                                    {bid.accepted_at ? (
                                        new Date(bid.accepted_at).toLocaleString()
                                    ) : (
                                        'N/A'
                                    )}
                                </span>
                            </div>
                            <div className="action-buttons">
                                <button
                                    className="sms-button"
                                    onClick={() => handleSendSMS(contact)}
                                    disabled={!contact?.phone || contact.phone === 'Not provided'}
                                >
                                    <i className="fas fa-sms"></i> Send Text
                                </button>
                                {!bid.messaged_vendor && (
                                    <button
                                        className="mark-button"
                                        onClick={() => markBidAsContacted(bid.id)}
                                    >
                                        Mark as Messaged
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AcceptedBids;