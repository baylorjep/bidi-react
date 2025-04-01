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
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [selectedBid, setSelectedBid] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setError] = useState(null);
    const [couponSuccess, setCouponSuccess] = useState(false);
    const [showCouponDetailsModal, setShowCouponDetailsModal] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [showShareCouponModal, setShowShareCouponModal] = useState(false);
    const [newCouponCode, setNewCouponCode] = useState('');
    const [activeCoupon, setActiveCoupon] = useState(null);
    const [calculatorAmount, setCalculatorAmount] = useState('');
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
                // Fetch profile pictures for each business profile
                const profilePicturePromises = bidsData.map(async (bid) => {
                    const { data: profilePhoto, error: profilePhotoError } = await supabase
                        .from('profile_photos')
                        .select('photo_url')
                        .eq('user_id', bid.business_profiles.id)
                        .eq('photo_type', 'profile')
                        .single();

                    if (profilePhotoError) {
                        console.error('Error fetching profile photo:', profilePhotoError);
                        return { ...bid, business_profiles: { ...bid.business_profiles, profile_image: '/images/default.jpg' } };
                    }

                    return { ...bid, business_profiles: { ...bid.business_profiles, profile_image: profilePhoto.photo_url } };
                });

                const bidsWithProfilePictures = await Promise.all(profilePicturePromises);

                // Mark bids as viewed when they're loaded
                const unviewedBids = bidsWithProfilePictures.filter(bid => !bid.viewed);
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
                const filteredBids = bidsWithProfilePictures
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

    const handleAcceptBidClick = (bid) => {
        setSelectedBid(bid);
        setShowAcceptModal(true);
    };

    const validateCoupon = async (businessId) => {
        if (!couponCode) return false;

        try {
            // Check if coupon exists and is valid
            const { data: coupon, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', couponCode.toUpperCase())
                .eq('valid', true)
                .single();

            if (error) {
                setError('Invalid coupon code');
                setCouponSuccess(false);
                return false;
            }

            // Check if coupon is expired
            if (new Date(coupon.expiration_date) < new Date()) {
                setError('This coupon has expired');
                setCouponSuccess(false);
                return false;
            }

            // Check if coupon belongs to the business
            if (coupon.business_id !== businessId) {
                setError('This coupon is not valid for this business');
                setCouponSuccess(false);
                return false;
            }

            setCouponSuccess(true);
            setError(null);
            return true;

        } catch (err) {
            console.error('Error validating coupon:', err);
            setError('Error validating coupon');
            setCouponSuccess(false);
            return false;
        }
    };

    const handleConfirmAccept = async () => {
        if (selectedBid) {
            // Validate coupon if one was entered
            if (couponCode) {
                const isValid = await validateCoupon(selectedBid.business_profiles.id);
                if (!isValid) {
                    return; // Don't proceed if coupon is invalid
                }
            }

            // Update the bid with the coupon code if valid
            const updateData = {
                status: 'accepted',
                coupon_code: couponSuccess ? couponCode.toUpperCase() : null
            };

            const { error } = await supabase
                .from('bids')
                .update(updateData)
                .eq('id', selectedBid.id);

            if (error) {
                console.error('Error updating bid:', error);
                return;
            }

            await handleMoveToAccepted(selectedBid);
            setShowAcceptModal(false);
            setSelectedBid(null);
            setCouponCode('');
            setError(null);
            setCouponSuccess(false);
            setActiveTab('approved');
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

    const handleViewCoupon = async (bid) => {
        if (!bid.coupon_code) return;

        try {
            const { data: coupon, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', bid.coupon_code)
                .single();

            if (error) {
                console.error('Error fetching coupon:', error);
                return;
            }

            setSelectedCoupon(coupon);
            setShowCouponDetailsModal(true);
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const generateCouponCode = () => {
        // Generate a random 8-character code
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
    };

    const handleGenerateCoupon = async (businessId) => {
        try {
            // First check for existing valid coupons
            const { data: existingCoupons, error: fetchError } = await supabase
                .from('coupons')
                .select('*')
                .eq(businessId ? 'business_id' : 'created_by', businessId || user.id)
                .eq('valid', true);

            if (fetchError) {
                console.error('Error checking existing coupons:', fetchError);
                return;
            }

            // Find if there's a non-expired coupon
            const now = new Date();
            const validCoupon = existingCoupons?.find(coupon => 
                new Date(coupon.expiration_date) > now
            );

            if (validCoupon) {
                setActiveCoupon(validCoupon);
                setNewCouponCode(validCoupon.code);
                setShowShareCouponModal(true);
                return;
            }

            // If no valid coupon exists, generate a new one
            const code = generateCouponCode();
            const expirationDate = new Date();
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);

            // Create new coupon
            const { data: newCoupon, error: insertError } = await supabase
                .from('coupons')
                .insert([{
                    business_id: businessId || null,
                    code: code,
                    discount_amount: 50,
                    expiration_date: expirationDate.toISOString(),
                    valid: true,
                    created_by: user.id
                }])
                .select()
                .single();

            if (insertError) {
                console.error('Error generating coupon:', insertError);
                alert('Error generating coupon. Please try again.');
            } else {
                setNewCouponCode(code);
                setActiveCoupon(newCoupon);
                setShowShareCouponModal(true);
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const handleShareAndEarn = () => {
        // Show a modal explaining the referral program
        setShowShareCouponModal(true);
        // Generate a generic coupon that's not tied to a specific business
        handleGenerateCoupon(null);
    };

    const renderBidCard = (bid) => {
        const handleProfileClick = () => {
            navigate(`/portfolio/${bid.business_profiles.id}`);
        };

        const profileImage = bid.business_profiles.profile_image || '/images/default.jpg'; // Default image if none

        if (activeTab === 'pending') {
            return (
                <BidDisplay
                    key={bid.id}
                    bid={bid}
                    handleApprove={() => handleAcceptBidClick(bid)}
                    handleDeny={() => handleMoveToDenied(bid)} // Direct denial without modal
                    showActions={true}
                >
                    <img 
                        src={profileImage} 
                        alt={`${bid.business_profiles.business_name} profile`} 
                        className="vendor-profile-image" 
                        onClick={handleProfileClick} 
                        style={{ cursor: 'pointer', width: '50px', height: '50px', borderRadius: '50%' }}
                    />
                </BidDisplay>
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
                                <img 
                                    src={profileImage} 
                                    alt={`${bid.business_profiles.business_name} profile`} 
                                    className="vendor-profile-image" 
                                    onClick={handleProfileClick} 
                                    style={{ cursor: 'pointer', width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }}
                                />
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

                    {bid.coupon_code && (
                        <div style={{ textAlign: 'left', marginTop: '8px' }}>
                            <button
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '14px' }}
                                onClick={() => handleViewCoupon(bid)}
                            >
                                <i className="fas fa-ticket-alt" style={{ marginRight: '8px' }}></i>
                                View Applied Coupon
                            </button>
                        </div>
                    )}

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
                        <button
                            className="btn-primary flex-fill"
                            onClick={() => handleGenerateCoupon(bid.business_profiles.id)}
                            style={{fontSize:'14px'}}
                        >
                            <i className="fas fa-share-alt" style={{ marginRight: '8px' }}></i>
                            Share & Earn
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
                                <img 
                                    src={profileImage} 
                                    alt={`${bid.business_profiles.business_name} profile`} 
                                    className="vendor-profile-image" 
                                    onClick={handleProfileClick} 
                                    style={{ cursor: 'pointer', width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }}
                                />
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
                            onClick={() => handleAcceptBidClick(bid)} // Use the modal when accepting from denied tab
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
            >
                <img 
                    src={profileImage} 
                    alt={`${bid.business_profiles.business_name} profile`} 
                    className="vendor-profile-image" 
                    onClick={handleProfileClick} 
                    style={{ cursor: 'pointer', width: '50px', height: '50px', borderRadius: '50%' }}
                />
            </BidDisplay>
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
                <div className="share-earn-section" style={{ 
                    padding: '20px',
                    marginBottom: '20px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <h2 style={{ marginBottom: '15px', color: '#333' }}>
                        Share Bidi & Earn
                    </h2>
                    <p style={{ marginBottom: '20px', color: '#666' }}>
                        Share Bidi with your friends! They get $50 off their vendor, and you get $50 when they book!
                    </p>
                    <div style={{display: 'flex', justifyContent: 'center'}}>
                        <button
                        className="btn-primary"
                        onClick={handleShareAndEarn}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#9633eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <i className="fas fa-share-alt" style={{ marginRight: '8px' }}></i>
                        Get Your Referral Code
                    </button>
                    </div>

                </div>

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

            {showAcceptModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Accept Bid Confirmation</h3>
                        <p>Are you sure you want to accept this bid from {selectedBid?.business_profiles?.business_name}?</p>
                        
                        <div className="coupon-section" style={{ marginBottom: '20px' }}>
                            <label htmlFor="coupon-input" style={{ display: 'block', marginBottom: '8px' }}>
                                Have a coupon code? Enter it here:
                            </label>
                            <input
                                id="coupon-input"
                                type="text"
                                value={couponCode}
                                onChange={(e) => {
                                    setCouponCode(e.target.value);
                                    setError(null);
                                    setCouponSuccess(false);
                                }}
                                placeholder="Enter coupon code"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    marginBottom: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                }}
                            />
                            {couponCode && (
                                <button
                                    onClick={() => validateCoupon(selectedBid?.business_profiles?.id)}
                                    style={{
                                        padding: '8px 16px',
                                        marginBottom: '8px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Validate Coupon
                                </button>
                            )}
                            {couponError && (
                                <p style={{ color: 'red', margin: '8px 0' }}>{couponError}</p>
                            )}
                            {couponSuccess && (
                                <p style={{ color: 'green', margin: '8px 0' }}>Coupon code is valid!</p>
                            )}
                        </div>

                        <p>By accepting this bid:</p>
                        <ul>
                            <li>Your contact information will be shared with the business</li>
                            <li>The business will be notified and can reach out to you directly</li>
                        </ul>
                        <div className="modal-buttons">
                            <button 
                                className="btn-danger"
                                style={{borderRadius:'40px'}}
                                onClick={() => {
                                    setShowAcceptModal(false);
                                    setSelectedBid(null);
                                    setCouponCode('');
                                    setError(null);
                                    setCouponSuccess(false);
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-success"
                                style={{borderRadius:'40px'}}
                                onClick={handleConfirmAccept}
                            >
                                Accept Bid
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCouponDetailsModal && selectedCoupon && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Coupon Details</h3>
                        <div style={{ margin: '20px 0' }}>
                            <p><strong>Code:</strong> {selectedCoupon.code}</p>
                            <p><strong>Discount Amount:</strong> ${selectedCoupon.discount_amount}</p>
                            <p><strong>Valid Until:</strong> {new Date(selectedCoupon.expiration_date).toLocaleDateString()}</p>
                        </div>
                        <div className="modal-buttons">
                            <button 
                                className="btn-primary"
                                onClick={() => setShowCouponDetailsModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showShareCouponModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{activeCoupon ? 'Your Referral Coupon' : 'New Referral Coupon Generated'}</h3>
                        <div style={{ textAlign: 'center' }}>
                            <h4>Your coupon code is:</h4>
                            <div style={{ padding: '15px', margin: '15px 0', background: '#f5f5f5', borderRadius: '4px' }}>
                                <strong>{newCouponCode}</strong>
                            </div>
                            <p>Share this code with your friends!</p>
                            <div style={{ margin: '20px 0', padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
                                <h5>How it works:</h5>
                                <p style={{ marginBottom: '10px' }}>
                                    1. Your friend gets $50 off their vendor booking
                                </p>
                                <p style={{ marginBottom: '10px' }}>
                                    2. You get $50 when they complete their booking
                                </p>
                                <p>
                                    Valid until: {activeCoupon ? new Date(activeCoupon.expiration_date).toLocaleDateString() : ''}
                                </p>
                            </div>
                        </div>
                        <div className="modal-buttons">
                            <button 
                                className="btn-danger"
                                style={{borderRadius:'40px', width: '80%'}} 
                                onClick={() => {
                                    setShowShareCouponModal(false);
                                }}
                            >
                                Close
                            </button>
                            <button 
                                className="btn-success"
                                style={{borderRadius:'40px', width: '80%'}} 
                                onClick={() => {
                                    navigator.clipboard.writeText(newCouponCode);
                                    alert('Coupon code copied to clipboard!');
                                }}
                            >
                                Copy Code
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
