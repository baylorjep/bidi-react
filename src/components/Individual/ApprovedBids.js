import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../../App.css';
import bidiCheck from '../../assets/images/Bidi-Favicon.png'

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
                ...photoRequests.map(photoRequest => photoRequest.id),
            ];

            // Fetch approved bids related to the user's requests and join with business_profiles
            const { data: bidsData, error: bidsError } = await supabase
                .from('bids')
                .select('*, business_profiles(business_name, business_category, phone, website, stripe_account_id, membership_tier, down_payment_type,amount)')
                .in('request_id', requestIds)
                .eq('status', 'accepted'); // Only fetch approved bids

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
        navigate('/checkout', { state: { bid } });
    };

    const handleDownPayNow = (bid) => {
        // Calculate the down payment amount
        const amountToPay = bid.business_profiles.down_payment_type && bid.business_profiles.amount !== null
            ? bid.bid_amount * bid.business_profiles.amount // Calculate down payment amount
            : bid.bid_amount; // Use full bid amount if no down payment
    
        // Redirect to the payment component, passing the correct amount and bid information
        navigate('/checkout', { state: { bid, amountToPay } });
    };
    

    

    const handleMessage = (bid) => {
        // Create mailto link with a pre-filled email template
        const subject = encodeURIComponent('Your Bid');
        const body = encodeURIComponent(
            `Hi ${bid.profiles.business_name},\n\n` +
            `I have accepted your bid and would like to discuss the next steps.\n\n` +
            `Looking forward to your response.\n\nBest regards,\n[Your Name]`
        );
        const email = bid.business_profiles.email || ''; // Use business email if available
        const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
        window.location.href = mailtoLink;
    };

    const handleMessageText = async (bid) => {
        // Fetch the profile linked to the user_id from the 'profiles' table (for email)
        const { data: userProfile, error: userProfileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', bid.user_id)  // Assuming 'bid.user_id' links to 'profiles.id'
            .single();  // Fetching a single profile
        
        if (userProfileError) {
            console.error(userProfileError);
            alert('Failed to fetch user profile.');
            return;
        }
    
        // Fetch the business profile linked to the user_id or profile_id (for phone number)
        const { data: businessProfile, error: businessProfileError } = await supabase
            .from('business_profiles')
            .select('phone')
            .eq('id', bid.user_id)  // Assuming 'profile_id' in business_profiles links to 'user_id'
            .single();  // Fetching a single business profile
        
        if (businessProfileError) {
            console.error(businessProfileError);
            alert('Failed to fetch business profile.');
            return;
        }
    
        const phoneNumber = businessProfile.phone;
        const email = userProfile.email || '';  // Use the email from the profile
    
        // Improved device detection method
        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
        if (isMobile) {
            // If on mobile, open the SMS app
            const smsLink = `sms:${phoneNumber}`;
            window.location.href = smsLink;
        } else {
            // If on desktop, open the email client
            if (email) {
                const subject = encodeURIComponent('Your Bid');
                const body = encodeURIComponent(
                    `Hi ${bid.business_profiles.business_name},\n\n` +
                    `I have accepted your bid and would like to discuss the next steps.\n\n` +
                    `Looking forward to your response.\n\nBest regards,\n[Your Name]`
                );
                const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
                
                // Try to open the email client (checks for webmail or desktop client)
                const mailClientCheck = window.open(mailtoLink, '_blank');
                
                if (!mailClientCheck) {
                    alert("No email client detected. Please use an email service like Gmail or Outlook.");
                }
            } else {
                // Fallback if no email address is available
                alert("This user does not have an email address.");
            }
        }
    };

    const handleMoveToPending = async (bid) => {
        try {
            // Update the bid status to "pending"
            const { data, error } = await supabase
                .from('bids')
                .update({ status: 'pending' })  // Set the status to "pending"
                .eq('id', bid.id);  // Only update the bid with the matching ID
            
            if (error) {
                throw error;
            }
    
            // Remove the bid from the state by filtering it out
            setApprovedBids((prevBids) =>
                prevBids.filter((prevBid) => prevBid.id !== bid.id)
            );
    
            
        } catch (error) {
            console.error('Error updating bid status:', error);
            setError('Failed to update bid status.');
        }
    };
    
    
    
    

    return (
        <div className="container" style={{padding:'20px'}}>
            <header className="masthead">
                <div className="Sign-Up-Page-Header" style={{ paddingBottom: '16px' }}>
                    Approved Bids
                </div>
                {error ? (
                    <p className="text-danger">{error}</p>
                ) : approvedBids.length > 0 ? (
                    <div className="d-flex flex-column align-items-center">
                        {approvedBids.map((bid) => {
                            const isBidiVerified = ["Plus", "Verified"].includes(bid.business_profiles.membership_tier);

                            return (
                                <div
                                    key={bid.id}
                                    className="approved-bid-card p-4 mb-4"
                                    style={{ width: '100%', maxWidth: '600px', display:'flex' }}
                                >
                                    <div className="title-and-price" style={{textAlign:'left'}}>
                                        <div>
                                            <div
                                                className="request-title"
                                                style={{ marginBottom: '0', textAlign: 'left', wordBreak:'break-word' }}
                                            >
                                                {bid.business_profiles.business_name}
                                                {isBidiVerified && (
                                                    <img
                                                    src={bidiCheck}
                                                    style={{ height: '40px', width: 'auto', padding: '0px', marginLeft: '4px' }}
                                                    alt="Bidi Verified Icon"
                                                />
                                                ) }
                                                {isBidiVerified && (
                                            <>  
                                                
                                                <div style={{ textAlign: 'left', padding: '0px 0px' }}>
                                                    <div style={{ fontSize: '0.9rem', margin: '0', fontWeight: 'bold' }}>
                                                        Bidi Verified
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', margin: '5px 0 0', fontStyle: 'italic' }}>
                                                        100% Money-Back Guarantee When You Pay Through Bidi
                                                    </div>
                                                </div>

                                          
                                                
                                            </>
                                        )}
                                                
                                            </div>
                                        </div>

                                        
                                        <button className="bid-button" disabled>
                                            ${bid.bid_amount}
                                        </button>
                                    </div>

                                    <p style={{ marginTop: '16px', textAlign:'left' }}>
                                        <strong>Description:</strong> {bid.bid_description}
                                    </p>
                                    <p style={{textAlign:'left'}}>
                                        <strong>Phone:</strong> {bid.business_profiles.phone}
                                    </p>
                                    {/* Display down payment information */}
                                    {bid.business_profiles.down_payment_type && bid.business_profiles.amount !== null && (
                                        <p style={{ marginTop: '8px', textAlign: 'left' }}>
                                            <strong>Down Payment:</strong>{' '}
                                            {bid.business_profiles.down_payment_type === 'percentage'
                                                ? `$${(bid.bid_amount * (bid.business_profiles.amount)).toFixed(2)} (${bid.business_profiles.amount*100}%)`
                                                : `$${bid.business_profiles.amount}`}
                                        </p>
                                    )}


                                    <div className="pay-and-message-container">
                                        <button 
                                            className="btn btn-primary btn-md flex-fill"
                                            onClick={() => handleMoveToPending(bid)}
                                            >
                                            Move to Pending
                                        </button>
                                        {bid.business_profiles.down_payment_type && bid.business_profiles.amount !== null && (
                                                <button
                                                className="btn btn-secondary btn-md flex-fill"
                                                onClick={() => handleDownPayNow(bid)}
                                            >
                                                Pay ${bid.bid_amount * (bid.business_profiles.amount)}
                                            </button>
                                        )}

                                        <br />
                                        <button
                                            className="btn btn-secondary btn-md flex-fill"
                                            onClick={() => handlePayNow(bid)}
                                        >
                                            {bid.business_profiles.down_payment_type && bid.business_profiles.amount !== null ? 'Pay In Full' : 'Pay'}
                                        </button>
                                        <br />
                                        <button
                                            className="btn btn-secondary btn-md flex-fill"
                                            onClick={() => handleMessageText(bid)}
                                        >
                                            Message
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p>You don't have any approved bids at the moment.</p>
                )}
            </header>
        </div>
    );
}

export default ApprovedBids;
