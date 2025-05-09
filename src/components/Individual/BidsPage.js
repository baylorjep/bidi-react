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

export default function BidsPage({ onOpenChat }) {
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
    const [showShareSection, setShowShareSection] = useState(true);
    const [activeSection, setActiveSection] = useState("messages");
    const [selectedChat, setSelectedChat] = useState(null);
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
                { data: floristRequests, error: floristError },
                { data: weddingPlanningRequests, error: weddingPlanningError }
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
                    .order('created_at', { ascending: false }),
                supabase
                    .from('wedding_planning_requests')
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
            if (weddingPlanningError) throw weddingPlanningError;

            // Transform requests to match the same structure
            const transformedPhotoRequests = (photoRequests || []).map(request => ({
                ...request,
                service_photos: request.event_photos // Map event_photos to service_photos for consistency
            }));

            const allRequests = [
                ...(regularRequests || []).map(req => ({
                    ...req,
                    type: 'regular'
                })),
                ...transformedPhotoRequests.map(req => ({
                    ...req,
                    type: 'photography'
                })),
                ...(djRequests || []).map(req => ({
                    ...req,
                    type: 'dj',
                    service_title: req.title || req.event_title || `${req.event_type} DJ Request`,
                    price_range: req.budget_range,
                    service_date: req.start_date
                })),
                ...(cateringRequests || []).map(req => ({
                    ...req,
                    type: 'catering',
                    service_title: req.title || req.event_title || `${req.event_type} Catering Request`,
                    price_range: req.budget_range || req.price_range,
                    service_date: req.start_date || req.date
                })),
                ...(beautyRequests || []).map(req => ({
                    ...req,
                    type: 'beauty'
                })),
                ...(videoRequests || []).map(req => ({
                    ...req,
                    type: 'videography'
                })),
                ...(floristRequests || []).map(req => ({
                    ...req,
                    type: 'florist'
                })),
                ...(weddingPlanningRequests || []).map(req => ({
                    ...req,
                    type: 'wedding_planning',
                    service_title: req.event_title || 'Wedding Planning Request',
                    price_range: req.budget_range,
                    service_date: req.start_date
                }))
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
                { data: floristRequests, error: floristRequestError },
                { data: weddingPlanningRequests, error: weddingPlanningRequestError }
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
                    .eq('user_id', user.id),
                supabase
                    .from('wedding_planning_requests')
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
            if (weddingPlanningRequestError) throw weddingPlanningRequestError;

            // Get all request IDs
            const requestIds = [
                ...(requests || []).map(r => r.id),
                ...(photoRequests || []).map(r => r.id),
                ...(djRequests || []).map(r => r.id),
                ...(cateringRequests || []).map(r => r.id),
                ...(beautyRequests || []).map(r => r.id),
                ...(videoRequests || []).map(r => r.id),
                ...(floristRequests || []).map(r => r.id),
                ...(weddingPlanningRequests || []).map(r => r.id)
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
                .in('request_id', requestIds)
                .order('created_at', { ascending: false }); // Sort by creation date, newest first

            if (bidsError) {
                console.error('Failed to fetch bids:', bidsError);
                return;
            }

            if (bidsData) {
                // Filter out expired and hidden bids
                const now = new Date();
                const validBids = bidsData.filter(bid => {
                    if (bid.hidden) return false; // Skip hidden bids
                    if (!bid.expiration_date) return true; // Keep bids with no expiration
                    return new Date(bid.expiration_date) > now; // Only keep non-expired bids
                });

                // Fetch profile pictures for each business profile
                const profilePicturePromises = validBids.map(async (bid) => {
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
                            return bid.status?.toLowerCase() === 'accepted';
                        } else if (activeTab === 'denied') {
                            return bid.status?.toLowerCase() === 'denied';
                        }
                        return false;
                    })
                    .map(bid => ({
                        ...bid,
                        id: bid.id,
                        bid_amount: bid.bid_amount || bid.amount,
                        message: bid.message || bid.bid_description,
                        business_profiles: {
                            ...bid.business_profiles,
                            business_name: bid.business_profiles?.business_name || 'Unknown Business',
                            down_payment_type: bid.business_profiles?.down_payment_type,
                            amount: bid.business_profiles?.amount
                        },
                        viewed: bid.viewed,
                        viewed_at: bid.viewed_at,
                        isNew: !bid.viewed // Add isNew flag for unseen bids
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
            // Update the bid status and add acceptance timestamp
            const updateData = {
                status: 'accepted',
                accepted_at: new Date().toISOString()
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

    const handleShareToContacts = async () => {
        try {
            // Check if the Contact Picker API is available
            if ('contacts' in navigator && 'ContactsManager' in window) {
                const props = ['email', 'tel'];
                const opts = { multiple: true };
                
                try {
                    const contacts = await navigator.contacts.select(props, opts);
                    if (contacts.length > 0) {
                        // Prepare share message
                        const shareMessage = `Hey! I found this great wedding vendor platform called Bidi. Use my code ${newCouponCode} to get $50 off your booking! Check it out at https://savewithbidi.com`;
                        
                        // Share via SMS or email based on available contact info
                        contacts.forEach(contact => {
                            if (contact.tel && contact.tel.length > 0) {
                                window.open(`sms:${contact.tel[0]}?body=${encodeURIComponent(shareMessage)}`);
                            } else if (contact.email && contact.email.length > 0) {
                                window.open(`mailto:${contact.email[0]}?subject=Get $50 off on Bidi&body=${encodeURIComponent(shareMessage)}`);
                            }
                        });
                    }
                } catch (err) {
                    // Fall back to Web Share API
                    handleWebShare();
                }
            } else {
                // Fall back to Web Share API
                handleWebShare();
            }
        } catch (error) {
            console.error('Error sharing:', error);
            // Fall back to copying to clipboard
            navigator.clipboard.writeText(
                `Hey! I found this great wedding vendor platform called Bidi. Use my code ${newCouponCode} to get $50 off your booking! Check it out at https://savewithbidi.com`
            );
            alert('Share message copied to clipboard!');
        }
    };

    const handleWebShare = async () => {
        const shareData = {
            title: 'Get $50 off on Bidi',
            text: `Hey! I found this great wedding vendor platform called Bidi. Use my code ${newCouponCode} to get $50 off your booking!`,
            url: 'https://savewithbidi.com'
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                throw new Error('Web Share API not supported');
            }
        } catch (err) {
            console.error('Error sharing:', err);
            // Fall back to copying to clipboard
            navigator.clipboard.writeText(
                `${shareData.text} ${shareData.url}`
            );
            alert('Share message copied to clipboard!');
        }
    };

    const handleEdit = (request) => {
        navigate(`/edit-request/${request.type}/${request.id}`);
    };

    const toggleRequestStatus = async (request) => {
        try {
            // Determine the request type based on request properties
            let requestType;
            if (request.event_type) {
                requestType = "photography";
            } else if (request.service_category === "dj") {
                requestType = "dj";
            } else if (request.service_category === "catering") {
                requestType = "catering";
            } else if (request.service_category === "beauty") {
                requestType = "beauty";
            } else if (request.service_category === "videography") {
                requestType = "videography";
            } else if (request.service_category === "florist") {
                requestType = "florist";
            } else if (request.service_category === "wedding planning") {
                requestType = "wedding_planning";
            } else {
                requestType = "regular";
            }

            const tableMap = {
                regular: "requests",
                photography: "photography_requests",
                dj: "dj_requests",
                catering: "catering_requests",
                beauty: "beauty_requests",
                videography: "videography_requests",
                florist: "florist_requests",
                wedding_planning: "wedding_planning_requests"
            };

            const tableName = tableMap[requestType];
            
            if (!tableName) {
                console.error("Invalid request type:", requestType);
                setError("Invalid request type");
                return;
            }

            // Handle both legacy and new request formats
            let updateData;
            if (request.hasOwnProperty("open")) {
                // Legacy request using 'open' column
                updateData = { open: !request.open };
            } else {
                // New request using 'status' column
                const newStatus = request.status === "open" ? "closed" : "open";
                updateData = { status: newStatus };
            }

            console.log("Updating table:", tableName, "with data:", updateData);

            const { error } = await supabase
                .from(tableName)
                .update(updateData)
                .eq("id", request.id);

            if (error) {
                console.error("Supabase error:", error);
                throw error;
            }

            // Update local state
            setRequests(requests.map(req => {
                if (req.id === request.id) {
                    if (req.hasOwnProperty("open")) {
                        return {
                            ...req,
                            open: !req.open,
                            status: !req.open ? "open" : "closed" // Update status for UI consistency
                        };
                    } else {
                        return {
                            ...req,
                            status: req.status === "open" ? "closed" : "open"
                        };
                    }
                }
                return req;
            }));
        } catch (error) {
            console.error("Error toggling request status:", error);
            setError("Failed to update request status");
        }
    };

    const renderBidCard = (bid) => {
        const handleProfileClick = () => {
            navigate(`/portfolio/${bid.business_profiles.id}`);
        };

        const profileImage = bid.business_profiles.profile_image || '/images/default.jpg'; // Default image if none

        // Common props for all states
        const commonProps = {
            key: bid.id,
            bid: {
                ...bid,
                business_profiles: {
                    ...bid.business_profiles,
                    profile_image: profileImage
                }
            },
            showActions: true,
            onViewCoupon: handleViewCoupon,
            onMessage: onOpenChat
        };

        // State-specific props
        if (activeTab === 'pending') {
            return (
                <BidDisplay
                    {...commonProps}
                    handleApprove={() => handleAcceptBidClick(bid)}
                    handleDeny={() => handleMoveToDenied(bid)}
                />
            );
        }

        if (activeTab === 'approved') {
            return (
                <BidDisplay
                    {...commonProps}
                    handleApprove={() => handleMoveToPending(bid)}
                    handleDeny={() => handlePayNow(bid)}
                    showPaymentOptions={true}
                    downPayment={calculateDownPayment(bid)}
                    onDownPayment={() => handleDownPayNow(bid)}
                />
            );
        }

        if (activeTab === 'denied') {
            return (
                <BidDisplay
                    {...commonProps}
                    handleApprove={() => handleAcceptBidClick(bid)}
                    handleDeny={() => handleMoveToPending(bid)}
                    showReopen={true}
                />
            );
        }

        return null;
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
        const isOpen = request.status === "open" || request.status === "pending" || request.open;
        
        if (request.event_type) {
            // Photo request card
            return (
                <div className="request-card">
                    <div className="request-header">
                        <h2 className="request-title">{requestTitle}</h2>
                        <div className="request-status-container" style={{ display: 'flex', gap: '10px' }}>
                            {isNew(request.created_at) && (
                                <div className="request-status" style={{ 
                                    backgroundColor: '#9633eb',
                                    color: 'white'
                                }}>New</div>
                            )}
                            <div className="request-status" style={{ 
                                backgroundColor: isOpen ? '#9633eb' : 'white',
                                color: isOpen ? 'white' : '#9633eb',
                                border: isOpen ? 'none' : '1px solid #9633eb',
                                marginLeft: isNew(request.created_at) ? '0' : 'auto'
                            }}>
                                {isOpen ? 'Open' : 'Closed'}
                            </div>
                        </div>
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
                    <div className="request-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center' }}>
                        <button
                            className="btn-danger"
                            onClick={() => handleEdit(request)}
                            style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                            Edit
                        </button>
                        <button
                            className="btn-success"
                            onClick={() => toggleRequestStatus(request)}
                            style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                            {isOpen ? "Close" : "Reopen"}
                        </button>
                    </div>
                </div>
            );
        }

        // Regular service request card
        return (
            <div className="request-card">
                <div className="request-header">
                    <h2 className="request-title">{requestTitle}</h2>
                    <div className="request-status-container" style={{ display: 'flex', gap: '10px' }}>
                        {isNew(request.created_at) && (
                            <div className="request-status" style={{ 
                                backgroundColor: '#9633eb',
                                color: 'white'
                            }}>New</div>
                        )}
                        <div className="request-status" style={{ 
                            backgroundColor: isOpen ? '#9633eb' : 'white',
                            color: isOpen ? 'white' : '#9633eb',
                            border: isOpen ? 'none' : '1px solid #9633eb',
                            marginLeft: isNew(request.created_at) ? '0' : 'auto'
                        }}>
                            {isOpen ? 'Open' : 'Closed'}
                        </div>
                    </div>
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
                <div className="request-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center' }}>
                    <button
                        className="btn-danger"
                        onClick={() => handleEdit(request)}
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                        Edit
                    </button>
                    <button
                        className="btn-success"
                        onClick={() => toggleRequestStatus(request)}
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                        {isOpen ? "Close" : "Reopen"}
                    </button>
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

    const handleOpenChat = (chat) => {
        setActiveSection("messages");
        setSelectedChat(chat);
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
                    <div className="no-requests" style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        margin: '20px 0'
                    }}>
                        <h3 style={{ marginBottom: '15px', color: '#333' }}>No Active Requests Yet</h3>
                        <p style={{ marginBottom: '20px', color: '#666' }}>
                            Start your journey by creating your first service request. 
                            Get matched with the perfect vendors for your event!
                        </p>
                        <button 
                            onClick={() => navigate('/request-categories')}
                            className="btn-primary"
                            style={{
                                padding: '12px 24px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                backgroundColor: '#9633eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '40px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <i className="fas fa-plus"></i>
                            Create Your First Request
                        </button>
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

                {showShareSection && (
                    <div className="share-earn-section" style={{ 
                        padding: '20px',
                        marginTop: '40px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        <button 
                            onClick={() => setShowShareSection(false)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '10px',
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: '#666'
                            }}
                        >
                            ×
                        </button>
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
                                background: '#9633eb',
                                color:'white',
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
                )}
            </div>

            {showAcceptModal && (
                <div className="modal-overlay">
                    <div className="modal-content-bids-page">
                        <h3>Accept Bid Confirmation</h3>
                        <p>Are you sure you want to accept this bid from {selectedBid?.business_profiles?.business_name}?</p>
                        

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
                        <button 
                                className="btn-primary"
                                style={{
                                    borderRadius: '40px',
                                    width: '80%',
                                    backgroundColor: '#9633eb',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontFamily:'Inter',
                                    fontWeight:'600',
                                    fontSize:'16px'
                                }}
                                onClick={handleShareToContacts}
                            >
                                <i className="fas fa-address-book"></i>
                                Share with Contacts
                            </button>
                        <div className="modal-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>

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
                            <button 
                                className="btn-danger"
                                style={{borderRadius:'40px', width: '80%'}} 
                                onClick={() => {
                                    setShowShareCouponModal(false);
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
