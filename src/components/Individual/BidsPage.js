import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import '../../styles/BidsPage.css';
import BidDisplay from '../Bid/BidDisplay';
import RequestDisplay from '../Request/RequestDisplay';
import PhotoRequestDisplay from '../Request/PhotoRequestDisplay';  // Add this import
import { useNavigate } from 'react-router-dom';
import bidiCheck from '../../assets/images/Bidi-Favicon.png';
// Import Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { Helmet } from 'react-helmet';

export default function BidsPage() {
    const [requests, setRequests] = useState([]);
    const [currentRequestIndex, setCurrentRequestIndex] = useState(0);
    const [bids, setBids] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const isNew = (createdAt) => {
        if (!createdAt) return false;
        const now = new Date();
        const created = new Date(createdAt);
        const diffInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        return diffInDays < 7;
    };

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                console.log('User session found:', session.user.id);
                setUser(session.user);
                await loadRequests(session.user.id);
            } else {
                console.log('No user session found');
            }
        };
        getUser();
    }, []);

    useEffect(() => {
        if (user && requests.length > 0) {
            loadBids();
        }
    }, [activeTab, user, currentRequestIndex, requests]);

    const loadRequests = async (userId) => {
        try {
            console.log('Loading requests for user:', userId);

            // Fetch requests from all tables
            const [
                { data: regularRequests, error: regularError },
                { data: photoRequests, error: photoError },
                { data: djRequests, error: djError },
                { data: cateringRequests, error: cateringError },
                { data: beautyRequests, error: beautyError },
                { data: videoRequests, error: videoError },
                { data: floristRequests, error: floristError }
            ] = await Promise.all([
                supabase
                    .from('requests')
                    .select('*, service_photos(*)')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('photography_requests')
                    .select('*, event_photos(*)')
                    .eq('profile_id', userId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('dj_requests')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('catering_requests')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('beauty_requests')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('videography_requests')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('florist_requests')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
            ]);

            if (regularError) throw regularError;
            if (photoError) throw photoError;
            if (djError) throw djError;
            if (cateringError) throw cateringError;
            if (beautyError) throw beautyError;
            if (videoError) throw videoError;
            if (floristError) throw floristError;

            // Transform requests to match the same structure
            const transformedPhotoRequests = (photoRequests || []).map(request => ({
                ...request,
                service_photos: request.event_photos // Map event_photos to service_photos for consistency
            }));

            const allRequests = [
                ...(regularRequests || []),
                ...transformedPhotoRequests,
                ...(djRequests || []).map(req => ({
                    ...req,
                    service_title: req.title || req.event_title || `${req.event_type} DJ Request`,
                    price_range: req.budget_range,
                    service_date: req.start_date
                })),
                ...(cateringRequests || []).map(req => ({
                    ...req,
                    service_title: req.title || req.event_title || `${req.event_type} Catering Request`,
                    price_range: req.budget_range || req.price_range,
                    service_date: req.start_date || req.date
                })),
                ...(beautyRequests || []),
                ...(videoRequests || []),
                ...(floristRequests || [])
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            console.log('All requests loaded:', allRequests);
            setRequests(allRequests);
        } catch (error) {
            console.error('Error loading requests:', error);
        }
    };

    const loadBids = async () => {
        if (!user) {
            console.log('No user found');
            return;
        }

        console.log('Loading bids for user:', user.id);

        try {
            // First fetch the user's requests
            const [
                { data: requests, error: requestError },
                { data: photoRequests, error: photoRequestError },
                { data: djRequests, error: djRequestError },
                { data: cateringRequests, error: cateringRequestError },
                { data: beautyRequests, error: beautyRequestError },
                { data: videoRequests, error: videoRequestError },
                { data: floristRequests, error: floristRequestError }
            ] = await Promise.all([
                supabase
                    .from('requests')
                    .select('id, coupon_code')
                    .eq('user_id', user.id),
                supabase
                    .from('photography_requests')
                    .select('id, coupon_code')
                    .eq('profile_id', user.id),
                supabase
                    .from('dj_requests')
                    .select('id, coupon_code')
                    .eq('user_id', user.id),
                supabase
                    .from('catering_requests')
                    .select('id, coupon_code')
                    .eq('user_id', user.id),
                supabase
                    .from('beauty_requests')
                    .select('id, coupon_code')
                    .eq('user_id', user.id),
                supabase
                    .from('videography_requests')
                    .select('id, coupon_code')
                    .eq('user_id', user.id),
                supabase
                    .from('florist_requests')
                    .select('id, coupon_code')
                    .eq('user_id', user.id)
            ]);

            if (requestError) throw requestError;
            if (photoRequestError) throw photoRequestError;
            if (djRequestError) throw djRequestError;
            if (cateringRequestError) throw cateringRequestError;
            if (beautyRequestError) throw beautyRequestError;
            if (videoRequestError) throw videoRequestError;
            if (floristRequestError) throw floristRequestError;

            // Get all request IDs
            const requestIds = [
                ...(requests || []).map(r => r.id),
                ...(photoRequests || []).map(r => r.id),
                ...(djRequests || []).map(r => r.id),
                ...(cateringRequests || []).map(r => r.id),
                ...(beautyRequests || []).map(r => r.id),
                ...(videoRequests || []).map(r => r.id),
                ...(floristRequests || []).map(r => r.id)
            ];

            // Fetch all bids for these requests
            const { data: bidsData, error: bidsError } = await supabase
                .from('bids')
                .select(`
                    *,
                    business_profiles(
                        business_name, 
                        business_category, 
                        phone, 
                        website, 
                        id, 
                        membership_tier,
                        down_payment_type,
                        amount,
                        stripe_account_id
                    )
                `)
                .in('request_id', requestIds);

            if (bidsError) {
                console.error('Failed to fetch bids:', bidsError);
                return;
            }

            if (bidsData) {
                // Mark bids as viewed when they're loaded
                const unviewedBids = bidsData.filter(bid => !bid.viewed);
                if (unviewedBids.length > 0) {
                    const { error } = await supabase
                        .from('bids')
                        .update({ 
                            viewed: true,
                            viewed_at: new Date().toISOString()
                        })
                        .in('id', unviewedBids.map(bid => bid.id));

                    if (error) {
                        console.error('Error marking bids as viewed:', error);
                    }
                }

                // Continue with existing bid filtering and processing
                const filteredBids = bidsData
                    .filter(bid => {
                        if (activeTab === 'pending') {
                            return bid.status?.toLowerCase() === 'pending';
                        } else if (activeTab === 'approved') {
                            return bid.status?.toLowerCase() === 'accepted'; // Note: 'accepted' not 'approved'
                        } else if (activeTab === 'denied') {
                            return bid.status?.toLowerCase() === 'denied';
                        }
                        return false;
                    })
                    .map(bid => ({
                        ...bid,
                        id: bid.id,
                        bid_amount: bid.bid_amount || bid.amount, // Handle both field names
                        message: bid.message || bid.bid_description, // Handle both field names
                        business_profiles: {
                            ...bid.business_profiles,
                            business_name: bid.business_profiles?.business_name || 'Unknown Business',
                            down_payment_type: bid.business_profiles?.down_payment_type,
                            amount: bid.business_profiles?.amount
                        },
                        viewed: bid.viewed,
                        viewed_at: bid.viewed_at
                    }));

                setBids(filteredBids);
            }
        } catch (error) {
            console.error("Error loading bids:", error);
        }
    };

    const handlePayNow = (bid) => {
        try {
            if (!bid.business_profiles.stripe_account_id) {
                alert('This business is not yet set up to receive payments. Please contact them directly.');
                return;
            }

            const paymentData = {
                bid_id: bid.id,
                amount: bid.bid_amount,
                stripe_account_id: bid.business_profiles.stripe_account_id,
                payment_type: 'full',
                business_name: bid.business_profiles.business_name,
                description: bid.message || 'Service payment'
            };
            navigate('/checkout', { state: { paymentData } });
        } catch (error) {
            console.error('Error preparing payment:', error);
            alert('There was an error processing your payment. Please try again.');
        }
    };

    const handleDownPayNow = (bid) => {
        try {
            if (!bid.business_profiles.stripe_account_id) {
                alert('This business is not yet set up to receive payments. Please contact them directly.');
                return;
            }

            const downPayment = calculateDownPayment(bid);
            if (!downPayment) {
                throw new Error('Down payment calculation failed');
            }

            const paymentData = {
                bid_id: bid.id,
                amount: downPayment.amount,
                stripe_account_id: bid.business_profiles.stripe_account_id,
                payment_type: 'down_payment',
                business_name: bid.business_profiles.business_name,
                description: `Down payment for ${bid.message || 'service'}`
            };
            navigate('/checkout', { state: { paymentData } });
        } catch (error) {
            console.error('Error preparing down payment:', error);
            alert('There was an error processing your down payment. Please try again.');
        }
    };

    const handleMessageText = async (bid) => {
        const { data: userProfile, error: userProfileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', bid.user_id)
            .single();
        
        if (userProfileError) {
            console.error(userProfileError);
            alert('Failed to fetch user profile.');
            return;
        }
    
        const { data: businessProfile, error: businessProfileError } = await supabase
            .from('business_profiles')
            .select('phone')
            .eq('id', bid.user_id)
            .single();
        
        if (businessProfileError) {
            console.error(businessProfileError);
            alert('Failed to fetch business profile.');
            return;
        }
    
        const phoneNumber = businessProfile.phone;
        const email = userProfile.email || '';
        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
        if (isMobile) {
            window.location.href = `sms:${phoneNumber}`;
        } else {
            if (email) {
                const subject = encodeURIComponent('Your Bid');
                const body = encodeURIComponent(
                    `Hi ${bid.business_profiles.business_name},\n\n` +
                    `I have accepted your bid and would like to discuss the next steps.\n\n` +
                    `Looking forward to your response.\n\nBest regards,\n[Your Name]`
                );
                const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
                const mailClientCheck = window.open(mailtoLink, '_blank');
                
                if (!mailClientCheck) {
                    alert("No email client detected. Please use an email service like Gmail or Outlook.");
                }
            } else {
                alert("This user does not have an email address.");
            }
        }
    };

    const handleMoveToPending = async (bid) => {
        try {
            const { error } = await supabase
                .from('bids')
                .update({ status: 'pending' })
                .eq('id', bid.id);
            
            if (error) throw error;
            
            await loadBids();
        } catch (error) {
            console.error('Error updating bid status:', error);
        }
    };

    const handleMoveToAccepted = async (bid) => {
        try {
            const { error } = await supabase
                .from('bids')
                .update({ status: 'accepted' })
                .eq('id', bid.id);
            
            if (error) throw error;
            
            await loadBids();
        } catch (error) {
            console.error('Error updating bid status:', error);
        }
    };

    const handleMoveToDenied = async (bid) => {
        try {
            const { error } = await supabase
                .from('bids')
                .update({ status: 'denied' })
                .eq('id', bid.id);
            
            if (error) throw error;
            
            await loadBids();
        } catch (error) {
            console.error('Error updating bid status:', error);
        }
    };

    const calculateDownPayment = (bid) => {
        if (!bid.business_profiles.down_payment_type || bid.business_profiles.amount === null) {
            return null;
        }
    
        if (bid.business_profiles.down_payment_type === 'percentage') {
            const amount = bid.bid_amount * bid.business_profiles.amount;
            return {
                amount,
                display: `$${amount.toFixed(2)} (${(bid.business_profiles.amount * 100).toFixed(0)}%)`
            };
        } else {
            // Flat fee
            return {
                amount: bid.business_profiles.amount,
                display: `$${bid.business_profiles.amount.toFixed(2)}`
            };
        }
    };

    const renderBidCard = (bid) => {
        if (activeTab === 'pending') {
            return (
                <BidDisplay
                    key={bid.id}
                    bid={bid}
                    handleApprove={() => handleMoveToAccepted(bid)}
                    handleDeny={() => handleMoveToDenied(bid)}
                    showActions={true}
                />
            );
        }

        if (activeTab === 'approved') {
            const isBidiVerified = ["Plus", "Verified"].includes(bid.business_profiles.membership_tier);
            const downPayment = calculateDownPayment(bid);
            
            return (
                <div key={bid.id} className="approved-bid-card" style={{ width: '100%', maxWidth: '1000px' }}>
                    <div className="title-and-price">
                        <div>
                            <div className="request-title" style={{ marginBottom: '0', textAlign: 'left', wordBreak: 'break-word' }}>
                                {bid.business_profiles.business_name}
                                {isBidiVerified && (
                                    <img
                                        src={bidiCheck}
                                        style={{ height: '40px', width: 'auto', padding: '0px', marginLeft: '4px' }}
                                        alt="Bidi Verified Icon"
                                    />
                                )}
                                {isBidiVerified && (
                                    <div style={{ textAlign: 'left', padding: '0px 0px' }}>
                                        <div style={{ fontSize: '0.9rem', margin: '0', fontWeight: 'bold' }}>
                                            Bidi Verified
                                        </div>
                                        <div style={{ fontSize: '0.8rem', margin: '5px 0 0', fontStyle: 'italic' }}>
                                            100% Money-Back Guarantee When You Pay Through Bidi
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button className="bid-button" disabled>
                            ${bid.bid_amount || 0}
                        </button>
                    </div>

                    <p style={{ marginTop: '16px', textAlign: 'left' }}>
                        <strong>Description:</strong> {bid.message}
                    </p>
                    <p style={{ textAlign: 'left' }}>
                        <strong>Phone:</strong> {bid.business_profiles.phone}
                    </p>

                    {downPayment && (
                        <p style={{ marginTop: '8px', textAlign: 'left' }}>
                            <strong>Down Payment:</strong>{' '}
                            {downPayment.display}
                        </p>
                    )}

                    <div className="pay-and-message-container">
                        <button 
                            className="btn-danger flex-fill"
                            onClick={() => handleMoveToPending(bid)}
                            style={{fontSize:'14px'}}
                        > 
                            Move to Pending
                        </button>
                        {downPayment && (
                            <button
                                className="btn-success flex-fill"
                                onClick={() => handleDownPayNow(bid)}
                                style={{fontSize:'14px'}}
                            >
                                Pay {downPayment.display}
                            </button>
                        )}
                        <button
                            className="btn-success flex-fill"
                            onClick={() => handlePayNow(bid)}
                            style={{fontSize:'14px'}}
                        >
                            {downPayment ? 'Pay In Full' : 'Pay'}
                        </button>
                        <button
                            className="btn-success flex-fill"
                            onClick={() => handleMessageText(bid)}
                            style={{fontSize:'14px'}}
                        >
                            Message
                        </button>
                    </div>
                </div>
            );
        }

        if (activeTab === 'denied') {
            return (
                <div key={bid.id} className="approved-bid-card" style={{ width: '100%', maxWidth: '1000px' }}>
                    <div className="title-and-price">
                        <div>
                            <div className="request-title" style={{ marginBottom: '0', textAlign: 'left', wordBreak: 'break-word' }}>
                                {bid.business_profiles.business_name}
                            </div>
                        </div>
                        <button className="bid-button" disabled>
                            ${bid.bid_amount || 0}
                        </button>
                    </div>

                    <p style={{ marginTop: '16px', textAlign: 'left' }}>
                        <strong>Description:</strong> {bid.message}
                    </p>
                    <p style={{ textAlign: 'left' }}>
                        <strong>Phone:</strong> {bid.business_profiles.phone}
                    </p>

                    <div className="pay-and-message-container">
                        <button 
                            className="btn-danger flex-fill"
                            style={{width: '100%', marginBottom: '10px', fontSize:'14px'}}
                            onClick={() => handleMoveToPending(bid)}
                        >
                            Move to Pending
                        </button>
                        <button 
                            className="btn-success flex-fill"
                            style={{width: '100%'}}
                            onClick={() => handleMoveToAccepted(bid)}
                        >
                            Accept
                        </button>
                    </div>
                </div>
            );
        }

        // For pending and denied bids, use the original BidDisplay
        return (
            <BidDisplay
                key={bid.id}
                bid={{
                    ...bid,
                    requestTitle: bid.title,
                    bidAmount: bid.amount,
                    createdAt: new Date(bid.created_at),
                    requestType: bid.requestType
                }}
                showActions={false}
            />
        );
    };

    const getDate = (request) => {
        const startDate = request.start_date || request.service_date;
        if (request.date_flexibility === 'specific') {
            return startDate ? new Date(startDate).toLocaleDateString() : 'Date not specified';
        } else if (request.date_flexibility === 'range') {
            return `${new Date(startDate).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`;
        } else if (request.date_flexibility === 'flexible') {
            return `Flexible within ${request.date_timeframe}`;
        }
        return startDate ? new Date(startDate).toLocaleDateString() : 'Date not specified';
    };

    const renderRequestCard = (request) => {
        const requestTitle = request.event_title || request.title || 'Untitled Request';
        if (request.event_type) {
            // Photo request card
            return (
                <div className="request-card">
                    <div className="request-header">
                        <h2 className="request-title">{requestTitle}</h2>
                        {isNew(request.created_at) && (
                            <div className="request-status">New</div>
                        )}
                    </div>
                    <div className="request-details">
                        <div className="detail-row">
                            <span className="detail-label">Event Type:</span>
                            <span className="detail-value">{request.event_type}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Date:</span>
                            <span className="detail-value">{getDate(request)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Location:</span>
                            <span className="detail-value">{request.location}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Budget:</span>
                            <span className="detail-value">${request.price_range}</span>
                        </div>
                    </div>
                </div>
            );
        }

        // Regular service request card
        return (
            <div className="request-card">
                <div className="request-header">
                    <h2 className="request-title">{requestTitle}</h2>
                    {isNew(request.created_at) && (
                        <div className="request-status">New</div>
                    )}
                </div>
                <div className="request-details">
                    <div className="detail-row">
                        <span className="detail-label">Category:</span>
                        <span className="detail-value">{request.service_category}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{getDate(request)}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{request.location}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Budget:</span>
                        <span className="detail-value">${request.price_range}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderNoBidsMessage = () => {
        const currentRequestBids = bids.filter(bid => bid.request_id === requests[currentRequestIndex]?.id);
        
        switch (activeTab) {
            case 'pending':
                return currentRequestBids.length === 0 ? (
                    <div className="no-bids-message">
                        <p>No pending bids yet for this request.</p>
                        <p>Check back soon - businesses are reviewing your request!</p>
                    </div>
                ) : null;
            case 'approved':
                return currentRequestBids.length === 0 ? (
                    <div className="no-bids-message">
                        <p>No approved bids for this request.</p>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => setActiveTab('pending')}
                        >
                            Check Pending Bids
                        </button>
                    </div>
                ) : null;
            case 'denied':
                return currentRequestBids.length === 0 ? (
                    <div className="no-bids-message">
                        <p>No denied bids for this request.</p>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => setActiveTab('pending')}
                        >
                            View Pending Bids
                        </button>
                    </div>
                ) : null;
            default:
                return null;
        }
    };

    return (
        <>
            <Helmet>
                <title>Bids - Bidi</title>
                <meta name="description" content="View and manage your bids on Bidi. Compare offers from various vendors and choose the best for your needs." />
                <meta name="keywords" content="bids, wedding vendors, Bidi, manage bids" />
            </Helmet>
            <div className="bids-page">
                <h1 className="section-title">Your Service Requests</h1>
                <p className="section-description">
                    Browse through your service requests using the arrows. Below, you'll find all bids received for the currently displayed request.
                </p>

                {requests.length > 0 ? (
                    <>
                        <div className="request-swiper-container">
                            <div className="swipe-indicator">
                                Swipe to view more requests
                            </div>
                            <Swiper
                                modules={[Navigation]}
                                navigation={true}
                                onSlideChange={(swiper) => setCurrentRequestIndex(swiper.activeIndex)}
                                spaceBetween={30}
                                slidesPerView={1}
                            >
                                {requests.map((request, index) => (
                                    <SwiperSlide key={request.id}>
                                        <div className="request-slide">
                                            {renderRequestCard(request)}
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>

                    </>
                ) : (
                    <div className="no-requests">
                        No active requests found
                    </div>
                )}

                <h2 className="section-title" style={{ marginTop: '40px', textAlign:'center' }}>Bids for Selected Request</h2>
                <p className="section-description">
                    Manage bids by their status: pending bids awaiting your review, approved bids you've accepted, or denied bids you've rejected.
                </p>

                <div className="tabs">
                    <button 
                        className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending Bids
                    </button>
                    <button 
                        className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
                        onClick={() => setActiveTab('approved')}
                    >
                        Approved Bids
                    </button>
                    <button 
                        className={`tab ${activeTab === 'denied' ? 'active' : ''}`}
                        onClick={() => setActiveTab('denied')}
                    >
                        Denied Bids
                    </button>
                </div>

                <div className="bids-container">
                    {requests.length > 0 && currentRequestIndex >= 0 ? (
                        <>
                            {bids.filter(bid => bid.request_id === requests[currentRequestIndex].id)
                                .map(bid => renderBidCard(bid))}
                            {renderNoBidsMessage()}
                        </>
                    ) : (
                        <p className="no-bids">No bids to display</p>
                    )}
                </div>
            </div>
        </>
    );
}
