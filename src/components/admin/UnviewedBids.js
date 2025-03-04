import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Alert, Badge, Accordion } from 'react-bootstrap';
import './UnviewedBids.css';


function UnviewedBids() {
    const [unviewedBids, setUnviewedBids] = useState([]);
    const [groupedBids, setGroupedBids] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [lastMarkedBids, setLastMarkedBids] = useState([]);
    const [debugInfo, setDebugInfo] = useState(null);

    useEffect(() => {
        fetchUnviewedBids();
    }, []);

    const fetchUnviewedBids = async () => {
        try {
            setLoading(true);
            setDebugInfo(null);
            console.log("Fetching unviewed bids...");
            
            // First query to get all bids for debugging
            let { data: allBids, error: allBidsError } = await supabase
                .from('bids')
                .select('id, contacted')
                .limit(50);
                
            if (allBidsError) {
                console.error("Error with debugging query:", allBidsError);
            }
                
            console.log("All bids (first 50):", allBids);
            
            // Count bids by contacted status to see distribution
            if (allBids) {
                const contactedCounts = {
                    'true': allBids.filter(b => b.contacted === true).length,
                    'false': allBids.filter(b => b.contacted === false).length,
                    'null': allBids.filter(b => b.contacted === null).length,
                    'undefined': allBids.filter(b => b.contacted === undefined).length,
                    'total': allBids.length
                };
                console.log("Contacted status counts:", contactedCounts);
                setDebugInfo(contactedCounts);
            }
            
            // This is the updated query to exclude bids with "denied" or "accepted" status
            console.log("Using query to get uncontacted bids that aren't denied or accepted");
            let { data: bids, error: bidsError } = await supabase
                .from('bids')
                .select('id, bid_amount, bid_description, status, created_at, request_id, category, viewed, contacted, user_id')
                .or('contacted.is.null, contacted.eq.false')  // This gets both null and false values
                .not('status', 'in', '("denied","accepted")')  // Exclude denied or accepted bids
                .order('created_at', { ascending: false });

            if (bidsError) {
                console.error("Error with main query:", bidsError);
                throw bidsError;
            }
            
            console.log(`Retrieved ${bids?.length || 0} uncontacted bids (excluding denied/accepted)`);

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
                    // Add support for the legacy "general" category
                    else if (category === 'general') {
                        const { data: requestData, error: requestError } = await supabase
                            .from('requests')
                            .select('service_title, user_id')
                            .eq('id', bid.request_id)
                            .single();
                        
                        console.log("Legacy general request data:", requestData);
                        
                        if (!requestError && requestData) {
                            requestTitle = requestData.service_title;
                            userId = requestData.user_id;
                            console.log(`Legacy general request user_id: ${userId}`);
                        }
                    }
                    else if (category === 'photography') {
                        console.log(`Fetching photography request with id: ${bid.request_id}`);
                        
                        // Debug the bid itself more thoroughly
                        console.log("Bid details:", {
                            id: bid.id,
                            amount: bid.bid_amount,
                            category: bid.category,
                            request_id: bid.request_id,
                            user_id: bid.user_id
                        });
                        
                        // Only try approaches that look in the photography_requests table
                        let foundRequest = false;
                        
                        // Using the correct field names from the photography_requests table:
                        // - profile_id instead of user_id
                        // - event_title and/or event_type instead of title
                        
                        // First try: Standard approach
                        const { data: photoData, error: photoError } = await supabase
                            .from('photography_requests')
                            .select('id, event_title, event_type, profile_id')
                            .eq('id', bid.request_id)
                            .single();
                            
                        console.log("Photography request (standard approach):", {
                            data: photoData,
                            error: photoError
                        });
                        
                        if (!photoError && photoData) {
                            foundRequest = true;
                            // Use event_title if available, fallback to event_type
                            requestTitle = photoData.event_title || photoData.event_type || 'Photography Event';
                            // Use profile_id instead of user_id
                            userId = photoData.profile_id;
                            console.log(`Found photography request: title="${requestTitle}", profile_id=${userId}`);
                        }
                        
                        // Second try: Without single(), getting array
                        if (!foundRequest) {
                            const { data: photoArrayData, error: photoArrayError } = await supabase
                                .from('photography_requests')
                                .select('id, event_title, event_type, profile_id')
                                .eq('id', bid.request_id);
                                
                            console.log("Photography request (array approach):", {
                                data: photoArrayData,
                                count: photoArrayData?.length,
                                error: photoArrayError
                            });
                            
                            if (!photoArrayError && photoArrayData && photoArrayData.length > 0) {
                                foundRequest = true;
                                const requestData = photoArrayData[0];
                                requestTitle = requestData.event_title || requestData.event_type || 'Photography Event';
                                userId = requestData.profile_id;
                                console.log(`Found photography request (array): title="${requestTitle}", profile_id=${userId}`);
                            }
                        }
                        
                        // Final try: Show sample of available photography requests
                        if (!foundRequest) {
                            const { data: sampleRequests, error: sampleError } = await supabase
                                .from('photography_requests')
                                .select('id, event_title, event_type, profile_id')
                                .limit(5);
                                
                            console.log("Sample photography requests:", {
                                count: sampleRequests?.length,
                                samples: sampleRequests,
                                error: sampleError,
                                bidRequestId: bid.request_id
                            });
                        }
                        
                        if (!foundRequest) {
                            console.log("⚠️ CRITICAL: Could not find photography request for bid", {
                                bid_id: bid.id,
                                request_id: bid.request_id
                            });
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
                    request_title: requestTitle || `Request (${bid.category})`,
                    customer_email: customerEmail,
                    customer_phone: customerPhone,
                    user_id_debug: userId || bid.user_id, // Fallback to the bid's user_id if available
                    debug_info: {
                        category: bid.category,
                        request_id: bid.request_id
                    }
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

    // Updated to ensure contacted status is properly set without automatic refresh
    const markBidsAsContacted = async (bids) => {
        try {
            const now = new Date().toISOString();
            const bidIds = bids.map(bid => bid.id);
            
            console.log("Marking bids as contacted:", bidIds);
            
            // Store the bid IDs that we're marking
            setLastMarkedBids(bidIds);
            
            // Make sure to explicitly set contacted to true (not null)
            const { data, error } = await supabase
                .from('bids')
                .update({ 
                    contacted: true,    // This needs to be explicitly set to true
                    contacted_at: now   
                })
                .in('id', bidIds);
            
            if (error) {
                console.error("Error updating bids:", error);
                throw error;
            }
            
            console.log("Update response:", data);
            
            // Verify the update
            const { data: verifyData, error: verifyError } = await supabase
                .from('bids')
                .select('id, contacted')
                .in('id', bidIds);
                
            if (verifyError) {
                console.error("Error verifying update:", verifyError);
            } else {
                console.log("Verification of update:", verifyData);
            }

            // Update local state
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
            
            // Remove the auto-refresh code
            // setTimeout(() => {
            //     fetchUnviewedBids();
            // }, 1000);
            
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

    // Add refresh button
    const handleRefresh = () => {
        fetchUnviewedBids();
    };

    // Format number for badge display - only show 99+ if actually over 99
    const formatBidCount = (count) => {
        if (count > 99) return '99+';
        return count;
    };

    // Calculate the total number of bids across all users
    const getTotalBidCount = () => {
        return Object.values(groupedBids).reduce((total, userGroup) => {
            return total + userGroup.bids.length;
        }, 0);
    };

    if (loading) return <div>Loading unviewed bids...</div>;

    // Get the total count for the badge
    const totalBidCount = getTotalBidCount();

    return (
        <div className="unviewed-bids-container">
            <div className="header-actions">
                <h3 className="section-title">
                    Uncontacted Bids by Customer 
                    <Badge bg="danger" className="count-badge">
                        {formatBidCount(totalBidCount)}
                    </Badge>
                </h3>
                <button 
                    className="refresh-button" 
                    onClick={handleRefresh}
                >
                    <i className="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
            <p className="section-description">These bids are grouped by customer for more efficient communication.</p>
        
            
            {successMessage && <Alert variant="success" className="mobile-alert">{successMessage}</Alert>}
            {error && <Alert variant="danger" className="mobile-alert">{error}</Alert>}
            
            {Object.keys(groupedBids).length === 0 && !loading && (
                <div className="alert alert-info mobile-alert">
                    No uncontacted bids at the moment.
                </div>
            )}
            
            {Object.entries(groupedBids).map(([userId, userGroup]) => (
                <div className="customer-card" key={userId}>
                    <div className="customer-header">
                        <h5 className="customer-email">{userGroup.userData.email}</h5>
                        <Badge bg="primary" className="bid-count">{userGroup.bids.length} Bid{userGroup.bids.length > 1 ? 's' : ''}</Badge>
                    </div>
                    <div className="customer-body">
                        <div className="customer-info">
                            <h6 className="info-title">Customer Contact:</h6>
                            <p className="contact-detail"><strong>Email:</strong> {userGroup.userData.email}</p>
                            <p className="contact-detail"><strong>Phone:</strong> {userGroup.userData.phone}</p>
                        </div>
                        <div className="action-buttons">
                            <button 
                                className="sms-button"
                                onClick={() => handleSendGroupSMS(userGroup.userData, userGroup.bids)}
                                disabled={!userGroup.userData.phone || userGroup.userData.phone === 'Not provided' || userGroup.userData.phone === 'Unknown'}
                            >
                                <i className="fas fa-sms icon-space"></i> Send Text ({userGroup.bids.length})
                            </button>
                            
                            <button 
                                className="mark-button"
                                onClick={() => markBidsAsContacted(userGroup.bids)}
                            >
                                Mark as Contacted
                            </button>
                            <small className="help-text">
                                Click after sending the text to customer
                            </small>
                        </div>
                        
                        <Accordion defaultActiveKey="0" className="bids-accordion">
                            <Accordion.Item eventKey="0">
                                <Accordion.Header className="accordion-header">
                                    <span className="view-text">View All {userGroup.bids.length} Bids</span>
                                </Accordion.Header>
                                <Accordion.Body className="accordion-body">
                                    {userGroup.bids.map((bid, index) => (
                                        <div className="bid-item" key={bid.id}>
                                            <div className="bid-header">
                                                <h6 className="bid-title">{bid.request_title}</h6>
                                                <span className="bid-amount">${bid.bid_amount}</span>
                                            </div>
                                            <p className="bid-description"><strong>Description:</strong> {bid.bid_description}</p>
                                            <p className="bid-detail"><strong>Category:</strong> {bid.category}</p>
                                            <p className="bid-detail"><strong>Date:</strong> {new Date(bid.created_at).toLocaleString()}</p>
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