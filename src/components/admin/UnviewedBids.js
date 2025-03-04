import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Alert, Badge, Accordion } from 'react-bootstrap';

function UnviewedBids() {
    const [unviewedBids, setUnviewedBids] = useState([]);
    const [groupedBids, setGroupedBids] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchUnviewedBids();
    }, []);

    const fetchUnviewedBids = async () => {
        try {
            setLoading(true);
            console.log("Fetching unviewed bids...");
            
            // First, try to fetch bids with both viewed=false and contacted=false
            let { data: bids, error: bidsError } = await supabase
                .from('bids')
                .select('id, bid_amount, bid_description, status, created_at, request_id, category, viewed, contacted, user_id')
                .eq('viewed', false)
                .eq('contacted', false)
                .order('created_at', { ascending: false });

            // If we didn't get any bids, the contacted field might not exist or be null
            // Try again with just viewed=false
            if (!bidsError && (!bids || bids.length === 0)) {
                console.log("No bids found with both viewed=false and contacted=false. Trying with just viewed=false...");
                
                const { data: viewedOnlyBids, error: viewedOnlyError } = await supabase
                    .from('bids')
                    .select('id, bid_amount, bid_description, status, created_at, request_id, category, viewed, contacted, user_id')
                    .eq('viewed', false)
                    .order('created_at', { ascending: false });
                
                if (!viewedOnlyError) {
                    bids = viewedOnlyBids;
                    bidsError = viewedOnlyError;
                }
            }

            if (bidsError) throw bidsError;
            console.log(`Retrieved ${bids?.length || 0} unviewed bids`);

            // Get associated request details
            const bidsWithDetails = await Promise.all(bids.map(async (bid) => { 
                let requestTitle = 'Unknown Request';
                let customerEmail = 'Unknown';
                let customerPhone = 'Unknown';
                let userId = null;
                
                console.log(`Processing bid ${bid.id}, category: ${bid.category}, request_id: ${bid.request_id}`);
                
                try {
                    // Convert category to lowercase for case-insensitive comparison
                    const category = bid.category ? bid.category.toLowerCase() : '';
                    
                    // Based on category, get request details including user_id
                    if (category === 'generic') {
                        const { data: requestData, error: requestError } = await supabase
                            .from('requests')
                            .select('service_title, user_id')
                            .eq('id', bid.request_id)
                            .single();
                        
                        console.log("Generic request data:", requestData);
                        
                        if (!requestError && requestData) {
                            requestTitle = requestData.service_title;
                            userId = requestData.user_id;
                            console.log(`Generic request user_id: ${userId}`);
                        }
                    } 
                    else if (category === 'photography') {
                        const { data: photoData, error: photoError } = await supabase
                            .from('photography_requests')
                            .select('event_title, user_id')
                            .eq('id', bid.request_id)
                            .single();
                        
                        console.log("Photography request data:", photoData);
                        
                        if (!photoError && photoData) {
                            requestTitle = photoData.event_title;
                            userId = photoData.user_id;
                            console.log(`Photography request user_id: ${userId}`);
                        }
                    } 
                    else if (category === 'videography') {
                        const { data: videoData, error: videoError } = await supabase
                            .from('videography_requests')
                            .select('event_title, user_id')
                            .eq('id', bid.request_id)
                            .single();
                        
                        console.log("Videography request data:", videoData);
                        
                        if (!videoError && videoData) {
                            requestTitle = videoData.event_title;
                            userId = videoData.user_id;
                            console.log(`Videography request user_id: ${userId}`);
                        }
                    } 
                    else if (category === 'dj') {
                        const { data: djData, error: djError } = await supabase
                            .from('dj_requests')
                            .select('title, user_id')
                            .eq('id', bid.request_id)
                            .single();
                        
                        console.log("DJ request data:", djData);
                        
                        if (!djError && djData) {
                            requestTitle = djData.title;
                            userId = djData.user_id;
                            console.log(`DJ request user_id: ${userId}`);
                        }
                    } 
                    else if (category === 'beauty') {
                        const { data: beautyData, error: beautyError } = await supabase
                            .from('beauty_requests')
                            .select('event_title, user_id')
                            .eq('id', bid.request_id)
                            .single();
                        
                        console.log("Beauty request data:", beautyData);
                        
                        if (!beautyError && beautyData) {
                            requestTitle = beautyData.event_title;
                            userId = beautyData.user_id;
                            console.log(`Beauty request user_id: ${userId}`);
                        }
                    } 
                    else if (category === 'florist') {
                        const { data: floristData, error: floristError } = await supabase
                            .from('florist_requests')
                            .select('event_title, user_id')
                            .eq('id', bid.request_id)
                            .single();
                        
                        console.log("Florist request data:", floristData);
                        
                        if (!floristError && floristData) {
                            requestTitle = floristData.event_title;
                            userId = floristData.user_id;
                            console.log(`Florist request user_id: ${userId}`);
                        }
                    } 
                    else if (category === 'catering') {
                        const { data: cateringData, error: cateringError } = await supabase
                            .from('catering_requests')
                            .select('title, user_id')
                            .eq('id', bid.request_id)
                            .single();
                        
                        console.log("Catering request data:", cateringData);
                        
                        if (!cateringError && cateringData) {
                            requestTitle = cateringData.title;
                            userId = cateringData.user_id;
                            console.log(`Catering request user_id: ${userId}`);
                        }
                    } 
                    else {
                        console.log(`Unknown category: ${bid.category} (lowercased: ${category})`);
                    }

                    // If we found a userId, get contact details
                    if (userId) {
                        console.log(`Fetching contact info for user_id: ${userId}`);
                        
                        // Get email from profiles table
                        const { data: profileData, error: profileError } = await supabase
                            .from('profiles')
                            .select('email')
                            .eq('id', userId)
                            .single();
                            
                        console.log("Profile data:", profileData);
                        
                        if (!profileError && profileData) {
                            customerEmail = profileData.email;
                        } else {
                            console.log("Error fetching profile:", profileError);
                        }
                        
                        // Get phone from individual_profiles table
                        const { data: individualData, error: individualError } = await supabase
                            .from('individual_profiles')
                            .select('phone')
                            .eq('id', userId)
                            .single();
                            
                        console.log("Individual profile data:", individualData);
                        
                        if (!individualError && individualData) {
                            customerPhone = individualData.phone || 'Not provided';
                        } else {
                            console.log("Error fetching individual profile:", individualError);
                        }
                    } else {
                        console.log("No user_id found for this request");
                    }
                } catch (error) {
                    console.error("Error processing bid details:", error);
                }

                return {
                    ...bid,
                    request_title: requestTitle,
                    customer_email: customerEmail,
                    customer_phone: customerPhone,
                    user_id_debug: userId // Add this for debugging
                };
            }));

            console.log("Final bids with details:", bidsWithDetails);
            setUnviewedBids(bidsWithDetails);
            
            // Group bids by user_id
            const groupedByUser = bidsWithDetails.reduce((acc, bid) => {
                const userId = bid.user_id_debug;
                if (!userId) return acc;
                
                if (!acc[userId]) {
                    acc[userId] = {
                        bids: [],
                        userData: {
                            email: bid.customer_email,
                            phone: bid.customer_phone
                        }
                    };
                }
                
                acc[userId].bids.push(bid);
                return acc;
            }, {});
            
            console.log("Grouped bids by user:", groupedByUser);
            setGroupedBids(groupedByUser);
        } catch (err) {
            setError(`Error fetching unviewed bids: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Updated to mark multiple bids as contacted only (not viewed)
    const markBidsAsContacted = async (bids) => {
        try {
            const now = new Date().toISOString();
            
            // Update all bids for this user - only set contacted fields, not viewed
            const updatePromises = bids.map(bid => 
                supabase
                    .from('bids')
                    .update({ 
                        contacted: true,    // Set contacted to true
                        contacted_at: now   // Set contacted_at timestamp
                        // No longer setting viewed or viewed_at
                    })
                    .eq('id', bid.id)
            );
            
            await Promise.all(updatePromises);
            
            // Update local state - remove all marked bids
            const bidIds = bids.map(bid => bid.id);
            setUnviewedBids(unviewedBids.filter(bid => !bidIds.includes(bid.id)));
            
            // Update grouped bids
            const updatedGroupedBids = {...groupedBids};
            bids.forEach(bid => {
                if (bid.user_id_debug && updatedGroupedBids[bid.user_id_debug]) {
                    updatedGroupedBids[bid.user_id_debug].bids = 
                        updatedGroupedBids[bid.user_id_debug].bids.filter(b => b.id !== bid.id);
                    
                    // If no more bids for this user, remove the user
                    if (updatedGroupedBids[bid.user_id_debug].bids.length === 0) {
                        delete updatedGroupedBids[bid.user_id_debug];
                    }
                }
            });
            
            setGroupedBids(updatedGroupedBids);
            setSuccessMessage('Bids marked as contacted successfully!');
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (err) {
            setError(`Error marking bids as contacted: ${err.message}`);
            console.error(err);
        }
    };

    // Updated SMS template to include the number of bids
    const getSmsTemplate = (userData, bids) => {
        const bidCount = bids.length;
        return `You have ${bidCount} new bid${bidCount > 1 ? 's' : ''} to view on Bidi! Click here to sign in and view: https://www.savewithbidi.com/`;
    };

    // Handle SMS button click for multiple bids
    const handleSendGroupSMS = (userData, bids) => {
        // Format phone number - remove any non-numeric characters
        const formattedPhone = userData.phone.replace(/\D/g, '');
        
        // If there's no phone number, show an alert
        if (!formattedPhone || formattedPhone === 'Not provided' || formattedPhone === 'Unknown') {
            alert('No phone number available for this customer');
            return;
        }
        
        // Generate message template with bid count
        const message = getSmsTemplate(userData, bids);
        
        // Create the sms link
        const smsLink = `sms:${formattedPhone}?body=${encodeURIComponent(message)}`;
        
        // Open the link
        window.open(smsLink, '_blank');
    };

    if (loading) return <div>Loading unviewed bids...</div>;

    return (
        <div>
            <h3>Uncontacted Bids by Customer <Badge bg="danger">{unviewedBids.length}</Badge></h3>
            <p>These bids are grouped by customer for more efficient communication.</p>
            
            {successMessage && <Alert variant="success">{successMessage}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}
            
            {Object.keys(groupedBids).length === 0 && !loading && (
                <div className="alert alert-info">
                    No uncontacted bids at the moment.
                </div>
            )}
            
            {Object.entries(groupedBids).map(([userId, userGroup]) => (
                <div className="card mb-4 shadow-sm" key={userId}>
                    <div className="card-header d-flex justify-content-between align-items-center bg-light">
                        <h5 className="mb-0">Customer: {userGroup.userData.email}</h5>
                        <Badge bg="primary">{userGroup.bids.length} Bid{userGroup.bids.length > 1 ? 's' : ''}</Badge>
                    </div>
                    <div className="card-body">
                        <div className="row mb-3">
                            <div className="col-md-8">
                                <h6>Customer Contact:</h6>
                                <p><strong>Email:</strong> {userGroup.userData.email}</p>
                                <p><strong>Phone:</strong> {userGroup.userData.phone}</p>
                            </div>
                            <div className="col-md-4 d-flex flex-column justify-content-center align-items-center">
                                <button 
                                    className="btn btn-primary btn-lg mb-2 w-100"
                                    onClick={() => handleSendGroupSMS(userGroup.userData, userGroup.bids)}
                                    disabled={!userGroup.userData.phone || userGroup.userData.phone === 'Not provided' || userGroup.userData.phone === 'Unknown'}
                                >
                                    <i className="fas fa-sms mr-2"></i> Send Text ({userGroup.bids.length})
                                </button>
                                
                                <button 
                                    className="btn btn-success btn-lg mb-2 w-100"
                                    onClick={() => markBidsAsContacted(userGroup.bids)}
                                >
                                    Mark as Contacted
                                </button>
                                <small className="text-muted text-center">
                                    Click after sending the text to customer
                                </small>
                            </div>
                        </div>
                        
                        <Accordion defaultActiveKey="0">
                            <Accordion.Item eventKey="0">
                                <Accordion.Header>
                                    View All {userGroup.bids.length} Bids
                                </Accordion.Header>
                                <Accordion.Body>
                                    {userGroup.bids.map((bid, index) => (
                                        <div className="bid-item p-3 mb-3 bg-light rounded" key={bid.id}>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h6>{bid.request_title}</h6>
                                                <span className="badge bg-info">${bid.bid_amount}</span>
                                            </div>
                                            <p><strong>Description:</strong> {bid.bid_description}</p>
                                            <p><strong>Category:</strong> {bid.category}</p>
                                            <p><strong>Date:</strong> {new Date(bid.created_at).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default UnviewedBids;