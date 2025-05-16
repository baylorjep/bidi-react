import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

const OldRequests = () => {
    const [oldRequests, setOldRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOldRequests();
    }, []);

    const fetchOldRequests = async () => {
        try {
            setLoading(true);
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            // Fetch requests from all tables
            const [
                { data: regularRequests, error: regularError },
                { data: photoRequests, error: photoError },
                { data: djRequests, error: djError },
                { data: cateringRequests, error: cateringError },
                { data: beautyRequests, error: beautyError },
                { data: videoRequests, error: videoError },
                { data: floristRequests, error: floristError },
                { data: weddingPlanningRequests, error: weddingPlanningError }
            ] = await Promise.all([
                supabaseAdmin
                    .from('requests')
                    .select(`
                        *,
                        individual_profiles!user_id (
                            first_name,
                            last_name,
                            phone
                        )
                    `)
                    .lt('created_at', threeDaysAgo.toISOString())
                    .eq('open', true)
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('photography_requests')
                    .select(`
                        *,
                        profiles!profile_id (
                            individual_profiles (
                                first_name,
                                last_name,
                                phone
                            )
                        )
                    `)
                    .lt('created_at', threeDaysAgo.toISOString())
                    .neq('status', 'completed')
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('dj_requests')
                    .select(`
                        *,
                        individual_profiles!user_id (
                            first_name,
                            last_name,
                            phone
                        )
                    `)
                    .lt('created_at', threeDaysAgo.toISOString())
                    .neq('status', 'completed')
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('catering_requests')
                    .select(`
                        *,
                        individual_profiles!user_id (
                            first_name,
                            last_name,
                            phone
                        )
                    `)
                    .lt('created_at', threeDaysAgo.toISOString())
                    .neq('status', 'completed')
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('beauty_requests')
                    .select(`
                        *,
                        profiles!user_id (
                            individual_profiles (
                                first_name,
                                last_name,
                                phone
                            )
                        )
                    `)
                    .lt('created_at', threeDaysAgo.toISOString())
                    .neq('status', 'completed')
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('videography_requests')
                    .select(`
                        *,
                        profiles!user_id (
                            individual_profiles (
                                first_name,
                                last_name,
                                phone
                            )
                        )
                    `)
                    .lt('created_at', threeDaysAgo.toISOString())
                    .neq('status', 'completed')
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('florist_requests')
                    .select(`
                        *,
                        profiles!user_id (
                            individual_profiles (
                                first_name,
                                last_name,
                                phone
                            )
                        )
                    `)
                    .lt('created_at', threeDaysAgo.toISOString())
                    .neq('status', 'completed')
                    .order('created_at', { ascending: false }),
                supabaseAdmin
                    .from('wedding_planning_requests')
                    .select(`
                        *,
                        profiles!user_id (
                            individual_profiles (
                                first_name,
                                last_name,
                                phone
                            )
                        )
                    `)
                    .lt('created_at', threeDaysAgo.toISOString())
                    .neq('status', 'completed')
                    .order('created_at', { ascending: false })
            ]);

            if (regularError) throw regularError;
            if (photoError) throw photoError;
            if (djError) throw djError;
            if (cateringError) throw cateringError;
            if (beautyError) throw beautyError;
            if (videoError) throw videoError;
            if (floristError) throw floristError;
            if (weddingPlanningError) throw weddingPlanningError;

            // Combine and format all requests
            const allRequests = [
                ...(regularRequests || []).map(req => ({ ...req, type: 'regular' })),
                ...(photoRequests || []).map(req => ({ ...req, type: 'photography' })),
                ...(djRequests || []).map(req => ({ ...req, type: 'dj' })),
                ...(cateringRequests || []).map(req => ({ ...req, type: 'catering' })),
                ...(beautyRequests || []).map(req => ({ ...req, type: 'beauty' })),
                ...(videoRequests || []).map(req => ({ ...req, type: 'videography' })),
                ...(floristRequests || []).map(req => ({ ...req, type: 'florist' })),
                ...(weddingPlanningRequests || []).map(req => ({ ...req, type: 'wedding_planning' }))
            ];

            // Group requests by user
            const groupedRequests = allRequests.reduce((acc, request) => {
                const userId = request.user_id || request.profile_id;
                const firstName = ['regular', 'dj', 'catering'].includes(request.type)
                    ? request.individual_profiles?.first_name
                    : request.profiles?.individual_profiles?.first_name;
                const lastName = ['regular', 'dj', 'catering'].includes(request.type)
                    ? request.individual_profiles?.last_name
                    : request.profiles?.individual_profiles?.last_name;
                const phone = ['regular', 'dj', 'catering'].includes(request.type)
                    ? request.individual_profiles?.phone
                    : request.profiles?.individual_profiles?.phone;

                if (!acc[userId]) {
                    acc[userId] = {
                        id: userId,
                        firstName,
                        lastName,
                        phone,
                        requests: [],
                        latestDate: new Date(request.created_at)
                    };
                }

                acc[userId].requests.push(request);
                const requestDate = new Date(request.created_at);
                if (requestDate > acc[userId].latestDate) {
                    acc[userId].latestDate = requestDate;
                }

                return acc;
            }, {});

            // Convert grouped requests to array and sort by latest date
            const sortedRequests = Object.values(groupedRequests)
                .sort((a, b) => b.latestDate - a.latestDate);

            setOldRequests(sortedRequests);
        } catch (error) {
            console.error('Error fetching old requests:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getRequestTitle = (request) => {
        switch (request.type) {
            case 'regular':
                return request.service_title || 'Untitled Request';
            case 'photography':
            case 'videography':
                return request.event_title || 'Untitled Event';
            case 'dj':
                return `DJ Request for ${request.event_type || 'Event'}`;
            case 'catering':
                return `Catering for ${request.event_type || 'Event'}`;
            case 'beauty':
                return `Beauty Services for ${request.event_type || 'Event'}`;
            case 'florist':
                return `Floral Services for ${request.event_type || 'Event'}`;
            case 'wedding_planning':
                return `Wedding Planning for ${request.event_type || 'Event'}`;
            default:
                return 'Untitled Request';
        }
    };

    const handleTextUser = (userGroup) => {
        const phoneNumber = userGroup.phone;
        
        if (!phoneNumber) {
            alert('No phone number available for this user');
            return;
        }

        // Format phone number to remove any non-numeric characters
        const formattedPhone = phoneNumber.replace(/\D/g, '');
        
        // Get user's first name
        const firstName = userGroup.firstName;
        
        // Format request types for the message
        const requestTypes = userGroup.requests.map(req => req.type.replace('_', ' '));
        const requestTypesText = requestTypes.length > 1 
            ? requestTypes.slice(0, -1).join(', ') + ' and ' + requestTypes.slice(-1)
            : requestTypes[0];
        
        // Create a template message with personalized greeting and request types
        const template = `Hi ${firstName || 'there'}! This is Weston from Bidi Weddings. I saw in our records that your ${requestTypesText} request${requestTypes.length > 1 ? 's' : ''} went really well! I hope your experience on our platform was great and that you found what you were looking for! 😄 
I also noticed that you got a few bids on your request${requestTypes.length > 1 ? 's' : ''} so I wanted to check if you decided to go with any of them.

The reason I'm reaching out is that we'd like to close out your request${requestTypes.length > 1 ? 's' : ''} in our system so you don't keep getting notifications about new bids. Would you mind letting me know if you've made a decision? 🙌`;
        
        // Create SMS link with proper encoding
        const smsLink = `sms:${formattedPhone}?body=${encodeURIComponent(template)}`;
        
        // Open SMS app
        window.location.href = smsLink;
    };

    const handleMarkAsFollowedUp = async (userGroup) => {
        try {
            // Update all requests for this user
            const updatePromises = userGroup.requests.map(request => {
                const tableName = `${request.type}_requests`.replace('regular_requests', 'requests');
                return supabaseAdmin
                    .from(tableName)
                    .update({ followed_up: true })
                    .eq('id', request.id);
            });

            const results = await Promise.all(updatePromises);
            const errors = results.filter(result => result.error);

            if (errors.length > 0) {
                throw new Error('Some updates failed');
            }

            // Update local state
            setOldRequests(prevRequests => 
                prevRequests.map(group => 
                    group.id === userGroup.id
                        ? { ...group, requests: group.requests.map(req => ({ ...req, followed_up: true })) }
                        : group
                )
            );
        } catch (error) {
            console.error('Error marking requests as followed up:', error);
            alert('Error marking requests as followed up. Please try again.');
        }
    };

    const handleCloseRequests = async (userGroup) => {
        try {
            // Update all requests for this user
            const updatePromises = userGroup.requests.map(request => {
                const tableName = `${request.type}_requests`.replace('regular_requests', 'requests');
                let updates = {};

                // Handle updates based on request type
                switch (request.type) {
                    case 'regular':
                        updates = {
                            followed_up: true,
                            open: false
                        };
                        break;
                    case 'photography':
                    case 'videography':
                    case 'dj':
                    case 'catering':
                    case 'beauty':
                    case 'florist':
                    case 'wedding_planning':
                        updates = {
                            followed_up: true,
                            status: 'completed'
                        };
                        break;
                    default:
                        updates = {
                            followed_up: true
                        };
                }

                return supabaseAdmin
                    .from(tableName)
                    .update(updates)
                    .eq('id', request.id);
            });

            // Deny all bids for these requests
            const bidUpdatePromises = userGroup.requests.map(request => {
                // First, get all bids for this request
                return supabaseAdmin
                    .from('bids')
                    .select('id')
                    .eq('request_id', request.id)
                    .eq('category', request.type)
                    .then(({ data: bids, error }) => {
                        if (error) throw error;
                        if (!bids || bids.length === 0) return null;

                        // Update each bid individually
                        return Promise.all(bids.map(bid => 
                            supabaseAdmin
                                .from('bids')
                                .update({ status: 'denied' })
                                .eq('id', bid.id)
                        ));
                    });
            });

            // Execute all updates
            const [requestResults, bidResults] = await Promise.all([
                Promise.all(updatePromises),
                Promise.all(bidUpdatePromises.filter(Boolean))
            ]);

            // Check for errors
            const requestErrors = requestResults.filter(result => result.error);
            const bidErrors = bidResults.flat().filter(result => result?.error);

            if (requestErrors.length > 0 || bidErrors.length > 0) {
                console.error('Request update errors:', requestErrors);
                console.error('Bid update errors:', bidErrors);
                throw new Error('Some updates failed');
            }

            // Update local state
            setOldRequests(prevRequests => 
                prevRequests.filter(group => group.id !== userGroup.id)
            );
        } catch (error) {
            console.error('Error closing requests:', error);
            alert('Error closing requests. Please try again.');
        }
    };

    if (loading) {
        return <div className="admin-card">Loading...</div>;
    }

    if (error) {
        return <div className="admin-card">Error: {error}</div>;
    }

    return (
        <div className="admin-card">
            <div className="admin-card-header">
                <h5>Requests Older Than 3 Days</h5>
            </div>
            <div className="admin-card-body">
                {oldRequests.length === 0 ? (
                    <p>No old requests found.</p>
                ) : (
                    <div className="admin-table-container">
                        {/* Desktop Table View */}
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User Name</th>
                                    <th>Phone Number</th>
                                    <th>Requests</th>
                                    <th>Latest Request</th>
                                    <th>Followed Up</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {oldRequests.map(userGroup => (
                                    <tr key={userGroup.id}>
                                        <td>{`${userGroup.firstName || ''} ${userGroup.lastName || ''}`.trim() || 'N/A'}</td>
                                        <td>{userGroup.phone || 'N/A'}</td>
                                        <td>
                                            {userGroup.requests.map(request => (
                                                <div key={`${request.type}-${request.id}`} className="request-item">
                                                    <span className="request-type">{request.type}</span>
                                                    <span className="request-title">{getRequestTitle(request)}</span>
                                                </div>
                                            ))}
                                        </td>
                                        <td>{userGroup.latestDate.toLocaleDateString()}</td>
                                        <td>
                                            {userGroup.requests.every(req => req.followed_up) ? '✅' : '❌'}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => handleTextUser(userGroup)}
                                                    className="text-user-button"
                                                    disabled={!userGroup.phone}
                                                >
                                                    📱 Text User
                                                </button>
                                                <button
                                                    onClick={() => handleMarkAsFollowedUp(userGroup)}
                                                    className="follow-up-button"
                                                    disabled={userGroup.requests.every(req => req.followed_up)}
                                                >
                                                    {userGroup.requests.every(req => req.followed_up) ? '✓ Followed Up' : 'Mark as Followed Up'}
                                                </button>
                                                <button
                                                    onClick={() => handleCloseRequests(userGroup)}
                                                    className="close-request-button"
                                                >
                                                    🔒 Close Requests
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="mobile-requests">
                            {oldRequests.map(userGroup => (
                                <div key={userGroup.id} className="mobile-request-card">
                                    <div className="request-header">
                                        <h3 className="request-title">{`${userGroup.firstName || ''} ${userGroup.lastName || ''}`.trim() || 'N/A'}</h3>
                                        <span className="request-date">
                                            Latest: {userGroup.latestDate.toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="request-details">
                                        <div className="request-detail">
                                            <span className="request-detail-label">Phone:</span>
                                            <span className="request-detail-value">{userGroup.phone || 'N/A'}</span>
                                        </div>
                                        <div className="request-detail">
                                            <span className="request-detail-label">Requests:</span>
                                            <div className="request-detail-value">
                                                {userGroup.requests.map(request => (
                                                    <div key={`${request.type}-${request.id}`} className="request-item">
                                                        <span className="request-type">{request.type}</span>
                                                        <span className="request-title">{getRequestTitle(request)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="request-detail">
                                            <span className="request-detail-label">Status:</span>
                                            <span className="request-detail-value">
                                                {userGroup.requests.every(req => req.followed_up) ? '✅ All Followed Up' : '❌ Needs Follow Up'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="request-actions">
                                        <button
                                            onClick={() => handleTextUser(userGroup)}
                                            className="text-user-button"
                                            disabled={!userGroup.phone}
                                        >
                                            📱 Text User
                                        </button>
                                        <button
                                            onClick={() => handleMarkAsFollowedUp(userGroup)}
                                            className="follow-up-button"
                                            disabled={userGroup.requests.every(req => req.followed_up)}
                                        >
                                            {userGroup.requests.every(req => req.followed_up) ? '✓ All Followed Up' : 'Mark All as Followed Up'}
                                        </button>
                                        <button
                                            onClick={() => handleCloseRequests(userGroup)}
                                            className="close-request-button"
                                        >
                                            🔒 Close Requests & Deny Bids
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OldRequests;