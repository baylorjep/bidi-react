import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { formatBusinessName } from '../../utils/formatBusinessName';
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
import { toast } from 'react-toastify';

export default function BidsPage({ onOpenChat }) {
    const [requests, setRequests] = useState([]);
    const [currentRequestIndex, setCurrentRequestIndex] = useState(0);
    const [bids, setBids] = useState([]);
    const [user, setUser] = useState(null);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [selectedBidForAccept, setSelectedBidForAccept] = useState(null);
    const [showBidNotes, setShowBidNotes] = useState(false);
    const [selectedBid, setSelectedBid] = useState(null);
    const [bidNotes, setBidNotes] = useState('');
    const [bidInterestRating, setBidInterestRating] = useState(0);
    
    // Accordion state for bid status sections
    const [openBidSections, setOpenBidSections] = useState({});

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
    const [showMobileBids, setShowMobileBids] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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

    // Helper: Group bids by status for the current request
    const getBidsByStatus = () => {
        const currentRequest = requests[currentRequestIndex];
        if (!currentRequest) return {};
        
        const requestBids = bids.filter(bid => bid.request_id === currentRequest.id);
        
        // Sort bids by interest rating first (highest to lowest), then by creation date (newest first)
        const sortBids = (bids) => {
            return bids.sort((a, b) => {
                // First sort by viewed status (new bids first)
                if (!a.viewed && b.viewed) return -1;
                if (a.viewed && !b.viewed) return 1;
                
                // If both have same viewed status, sort by interest rating (highest first)
                const ratingA = a.interest_rating || 0;
                const ratingB = b.interest_rating || 0;
                if (ratingA !== ratingB) {
                    return ratingB - ratingA;
                }
                
                // If ratings are equal, sort by creation date (newest first)
                return new Date(b.created_at) - new Date(a.created_at);
            });
        };
        
        return {
            approved: sortBids(requestBids.filter(bid => (bid.status === 'approved' || bid.status === 'accepted') && !bid.isExpired)),
            interested: sortBids(requestBids.filter(bid => bid.status === 'interested' && !bid.isExpired)),
            pending: sortBids(requestBids.filter(bid => bid.status === 'pending' && !bid.isExpired)),
            denied: sortBids(requestBids.filter(bid => bid.status === 'denied' && !bid.isExpired)),
            expired: sortBids(requestBids.filter(bid => bid.isExpired)),
        };
    };

    // Helper: Toggle accordion section
    const toggleBidSection = (statusKey) => {
        setOpenBidSections(prev => ({
            ...prev,
            [statusKey]: !prev[statusKey]
        }));
    };

    // Helper: Get count of new bids for a status
    const getNewBidsCount = (statusKey) => {
        const bidsByStatus = getBidsByStatus();
        const statusBids = bidsByStatus[statusKey] || [];
        return statusBids.filter(bid => !bid.viewed).length;
    };

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }
        };
        fetchCurrentUser();
    }, []);

    const isNew = (createdAt) => {
        if (!createdAt) return false;
        const now = new Date();
        const created = new Date(createdAt);
        const diffInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        return diffInDays < 7;
    };

    useEffect(() => {
        const getUser = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('Error checking session:', error);
                    navigate('/login');
                    return;
                }
                
                if (session) {
                    console.log('User session found:', session.user.id);
                    setUser(session.user);
                    await loadRequests(session.user.id);
                } else {
                    console.log('No user session found');
                    navigate('/login');
                }
            } catch (err) {
                console.error('Error in authentication:', err);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        getUser();
    }, [navigate]);

    useEffect(() => {
        if (user && requests.length > 0) {
            loadBids();
        }
    }, [user, currentRequestIndex, requests]);

    const loadRequests = async (userId) => {
        try {
            // Get all requests from different tables
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
                supabase.from('requests').select('*').eq('user_id', userId),
                supabase.from('photography_requests').select('*').eq('profile_id', userId),
                supabase.from('dj_requests').select('*').eq('user_id', userId),
                supabase.from('catering_requests').select('*').eq('user_id', userId),
                supabase.from('beauty_requests').select('*').eq('user_id', userId),
                supabase.from('videography_requests').select('*').eq('user_id', userId),
                supabase.from('florist_requests').select('*').eq('user_id', userId),
                supabase.from('wedding_planning_requests').select('*').eq('user_id', userId)
            ]);

            // Map of request types to their corresponding business categories
            const categoryMap = {
                'photography': 'photography',
                'videography': 'videography',
                'dj': 'dj',
                'catering': 'catering',
                'beauty': 'beauty',
                'florist': 'florist',
                'wedding_planning': 'wedding_planning'
            };

            // Get total business counts for each category
            const totalBusinessCounts = {};
            for (const [type, category] of Object.entries(categoryMap)) {
                const { count, error } = await supabase
                    .from('business_profiles')
                    .select('*', { count: 'exact' })
                    .filter('business_category', 'ov', `{${category}}`);

                if (error) {
                    console.error(`Error fetching total ${category} businesses:`, error);
                    totalBusinessCounts[type] = 0;
                } else {
                    totalBusinessCounts[type] = count || 0;
                }
            }

            // Combine all requests with their types
            const allRequests = [
                ...(regularRequests || []).map(r => ({ ...r, type: 'other' })),
                ...(photoRequests || []).map(r => ({ ...r, type: 'photography' })),
                ...(djRequests || []).map(r => ({ ...r, type: 'dj' })),
                ...(cateringRequests || []).map(r => ({ ...r, type: 'catering' })),
                ...(beautyRequests || []).map(r => ({ ...r, type: 'beauty' })),
                ...(videoRequests || []).map(r => ({ ...r, type: 'videography' })),
                ...(floristRequests || []).map(r => ({ ...r, type: 'florist' })),
                ...(weddingPlanningRequests || []).map(r => ({ ...r, type: 'wedding_planning' }))
            ];

            // Get view counts for all requests
            const viewCounts = await Promise.all(
                allRequests.map(async (request) => {
                    // Get views
                    const { data: views, error: viewError } = await supabase
                        .from('request_views')
                        .select('business_id')
                        .eq('request_id', request.id)
                        .eq('request_type', `${request.type}_requests`);

                    if (viewError) {
                        console.error('Error fetching views:', viewError);
                        return { requestId: request.id, count: 0 };
                    }

                    // Get bids
                    const { data: bids, error: bidError } = await supabase
                        .from('bids')
                        .select('user_id')
                        .eq('request_id', request.id);

                    if (bidError) {
                        console.error('Error fetching bids:', bidError);
                        return { requestId: request.id, count: 0 };
                    }

                    // Get hidden status
                    const hiddenByVendor = request.hidden_by_vendor || [];
                    const hiddenBusinessIds = Array.isArray(hiddenByVendor) ? hiddenByVendor : [];

                    // Get total businesses in this category
                    const totalBusinesses = totalBusinessCounts[request.type] || 0;

                    // Get unique business IDs that have viewed or bid
                    const activeBusinessIds = new Set([
                        ...(views?.map(v => v.business_id) || []),
                        ...(bids?.map(b => b.user_id) || [])
                    ]);

                    return { 
                        requestId: request.id, 
                        count: activeBusinessIds.size,
                        total: totalBusinesses
                    };
                })
            );

            // Add view counts and total business counts to requests
            const requestsWithViews = allRequests.map(request => ({
                ...request,
                viewCount: viewCounts.find(v => v.requestId === request.id)?.count || 0,
                totalBusinessCount: viewCounts.find(v => v.requestId === request.id)?.total || 0,
                isNew: isNew(request.created_at),
                isOpen: request.status === "open" || request.status === "pending" || request.open
            }));

            // Sort requests: new and open first, then by creation date
            const sortedRequests = requestsWithViews.sort((a, b) => {
                // First sort by new status
                if (a.isNew && !b.isNew) return -1;
                if (!a.isNew && b.isNew) return 1;
                
                // Then sort by open status
                if (a.isOpen && !b.isOpen) return -1;
                if (!a.isOpen && b.isOpen) return 1;
                
                // Finally sort by creation date (newest first)
                return new Date(b.created_at) - new Date(a.created_at);
            });

            setRequests(sortedRequests);
        } catch (error) {
            console.error('Error loading requests:', error);
        }
    };

    const getViewCountText = (request) => {
        const categoryMap = {
            'photography': 'photographers',
            'videography': 'videographers',
            'dj': 'DJs',
            'catering': 'caterers',
            'beauty': 'HMUAs',
            'florist': 'florists',
            'wedding_planning': 'wedding planners',
            'regular': 'vendors'
        };

        const category = categoryMap[request.type] || 'vendors';
        return {
            count: `${request.viewCount}`,
            category: `${category} viewed`
        };
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
                // Filter out hidden bids but keep expired ones
                const validBids = bidsData.filter(bid => {
                    if (bid.hidden) return false; // Skip hidden bids
                    return true; // Keep all non-hidden bids including expired ones
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

                // Add expiration status to bids
                const now = new Date();
                const bidsWithExpiration = bidsWithProfilePictures.map(bid => ({
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
                    isNew: !bid.viewed, // Add isNew flag for unseen bids
                    isExpired: bid.expiration_date ? new Date(bid.expiration_date) < now : false
                }));

                // Sort bids by interest rating first (highest to lowest), then by creation date (newest first)
                const sortedBids = bidsWithExpiration.sort((a, b) => {
                    // First sort by viewed status (new bids first)
                    if (!a.viewed && b.viewed) return -1;
                    if (a.viewed && !b.viewed) return 1;
                    
                    // If both have same viewed status, sort by interest rating (highest first)
                    const ratingA = a.interest_rating || 0;
                    const ratingB = b.interest_rating || 0;
                    if (ratingA !== ratingB) {
                        return ratingB - ratingA;
                    }
                    
                    // If ratings are equal, sort by creation date (newest first)
                    return new Date(b.created_at) - new Date(a.created_at);
                });

                setBids(sortedBids);
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

    const handleMoveToNotInterested = async (bid) => {
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

    const handleMoveToInterested = async (bid) => {
        try {
            const { error } = await supabase
                .from('bids')
                .update({ status: 'interested' })
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

    // Bid rating and notes functions
    const handleBidRating = async (bidId, rating) => {
        try {
            const { error } = await supabase
                .from('bids')
                .update({ 
                    interest_rating: rating,
                    updated_at: new Date().toISOString()
                })
                .eq('id', bidId);

            if (error) throw error;
            
            setBids(bids.map(bid => 
                bid.id === bidId ? { ...bid, interest_rating: rating } : bid
            ));
            toast.success('Interest rating updated!');
        } catch (error) {
            console.error('Error updating bid rating:', error);
            toast.error('Failed to update interest rating');
        }
    };

    const handleBidNotes = async (bidId, notes) => {
        try {
            const { error } = await supabase
                .from('bids')
                .update({ 
                    client_notes: notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', bidId);

            if (error) throw error;
            
            setBids(bids.map(bid => 
                bid.id === bidId ? { ...bid, client_notes: notes } : bid
            ));
            toast.success('Notes saved!');
        } catch (error) {
            console.error('Error updating bid notes:', error);
            toast.error('Failed to save notes');
        }
    };

    const getInterestLevelText = (rating) => {
        switch (rating) {
            case 1: return 'Not Interested';
            case 2: return 'Low Interest';
            case 3: return 'Somewhat Interested';
            case 4: return 'Very Interested';
            case 5: return 'Highly Interested';
            default: return 'No Rating';
        }
    };

    // Bid notes functions
    const openBidNotes = (bid) => {
        setSelectedBid(bid);
        setBidNotes(bid.client_notes || '');
        setBidInterestRating(bid.interest_rating || 0);
        setShowBidNotes(true);
    };

    const saveBidNotes = async () => {
        if (!selectedBid) return;
        
        await handleBidNotes(selectedBid.id, bidNotes);
        await handleBidRating(selectedBid.id, bidInterestRating);
        setShowBidNotes(false);
        setSelectedBid(null);
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
        // Use navigate with state to pass the full request object
        navigate(`/edit-request/${request.table_name || 'requests'}/${request.id}`, { state: { request } });
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
        const commonBidProps = {
            bid: {
                ...bid,
                business_profiles: {
                    ...bid.business_profiles,
                    profile_image: profileImage
                }
            },
            showActions: !bid.isExpired, // Hide actions for expired bids
            onViewCoupon: handleViewCoupon,
            onMessage: onOpenChat,
            currentUserId: currentUserId,
            onProfileClick: () => handlePortfolioClick(bid.business_profiles.id, bid.business_profiles.business_name),
            isNew: !bid.viewed // Add isNew prop for new bids
        };

        // Determine which props to show based on bid status
        let statusProps = {};
        
        if (bid.isExpired) {
            statusProps = {
                showExpired: true,
                showActions: false
            };
        } else if (bid.status === 'approved') {
            statusProps = {
                handleApprove: () => handlePayNow(bid),
                handleDeny: () => handleMoveToNotInterested(bid),
                showPaymentOptions: true,
                downPayment: calculateDownPayment(bid),
                onDownPayment: () => handleDownPayNow(bid),
                showApproved: true,
                onPayNow: (paymentType) => {
                    if (paymentType === 'downpayment') {
                        handleDownPayNow(bid);
                    } else {
                        handlePayNow(bid);
                    }
                },
                handlePending: () => handleMoveToPending(bid),
                onMoveToPending: () => handleMoveToPending(bid),
                showPending: false,
                showNotInterested: false,
                handleInterested: () => handleMoveToInterested(bid),
                showInterested: false
            };
        } else if (bid.status === 'interested') {
            statusProps = {
                handleApprove: () => handleAcceptBidClick(bid),
                handleDeny: () => handleMoveToNotInterested(bid),
                handleInterested: () => handleMoveToPending(bid),
                showInterested: true,
                handlePending: () => handleMoveToPending(bid),
                onMoveToPending: () => handleMoveToPending(bid)
            };
        } else if (bid.status === 'denied') {
            statusProps = {
                handleApprove: () => handleMoveToPending(bid),
                handleDeny: () => handleAcceptBidClick(bid),
                handlePending: () => handleMoveToPending(bid),
                onMoveToPending: () => handleMoveToPending(bid),
                showPending: true,
                showNotInterested: true,
                handleInterested: () => handleMoveToInterested(bid)
            };
        } else {
            // pending status
            statusProps = {
                handleApprove: () => handleAcceptBidClick(bid),
                handleDeny: () => handleMoveToNotInterested(bid),
                handleInterested: () => handleMoveToInterested(bid),
                handlePending: () => handleMoveToPending(bid),
                onMoveToPending: () => handleMoveToPending(bid),
                showPending: true
            };
        }

        return (
            <div key={bid.id} className="bid-display-wrapper">
                <div className="bid-client-controls">
                    <div className="bid-interest-rating">
                        <span className="interest-label">Your Interest:</span>
                        <div className="star-rating">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    className={`star-btn ${star <= (bid.interest_rating || 0) ? 'filled' : 'empty'}`}
                                    onClick={() => handleBidRating(bid.id, star)}
                                    title={getInterestLevelText(star)}
                                >
                                    <i className="fas fa-star"></i>
                                </button>
                            ))}
                        </div>
                        <span className="rating-text">
                            {getInterestLevelText(bid.interest_rating || 0)}
                        </span>
                    </div>
                    <button
                        className="bid-notes-btn"
                        onClick={() => openBidNotes(bid)}
                        title={bid.client_notes ? "View and edit notes" : "Add notes"}
                    >
                        <i className="fas fa-sticky-note"></i>
                        {bid.client_notes ? 'Show Notes' : 'Add Notes'}
                    </button>
                </div>
                <BidDisplay
                    {...commonBidProps}
                    {...statusProps}
                />
            </div>
        );
    };

    const renderNoBidsMessage = () => {
        const bidsByStatus = getBidsByStatus();
        const totalBids = Object.values(bidsByStatus).reduce((sum, bids) => sum + bids.length, 0);
        
        if (totalBids === 0) {
            const currentRequest = requests[currentRequestIndex];
            if (!currentRequest) return null;
            
            return (
                <div className="no-bids-message">
                    <div className="no-bids-content">
                        <i className="fas fa-inbox"></i>
                        <h3>No bids received yet</h3>
                        <p>Your request is active and visible to vendors. Bids will appear here once vendors respond.</p>
                        <div className="request-stats">
                            <div className="stat-item">
                                <span className="stat-number">{currentRequest.viewCount || 0}</span>
                                <span className="stat-label">Vendors viewed</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{currentRequest.totalBusinessCount || 0}</span>
                                <span className="stat-label">Total vendors</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const handleOpenChat = (chat) => {
        setActiveSection("messages");
        setSelectedChat(chat);
    };

    const getCategoryIcon = (type) => {
        const typeMap = {
            'photography': 'fa-solid fa-camera',
            'videography': 'fa-solid fa-video',
            'dj': 'fa-solid fa-music',
            'catering': 'fa-solid fa-utensils',
            'beauty': 'fa-solid fa-spa',
            'florist': 'fa-solid fa-leaf',
            'wedding_planning': 'fa-solid fa-ring',
            'regular': 'fa-solid fa-star'
        };
        return typeMap[type] || typeMap.regular;
    };

    const formatCategoryType = (type) => {
        const typeMap = {
            'photography': 'Photography',
            'videography': 'Videography',
            'dj': 'DJ',
            'catering': 'Catering',
            'beauty': 'Hair & Makeup',
            'florist': 'Florist',
            'wedding_planning': 'Wedding Planning',
            'regular': 'General Request'
        };
        return typeMap[type] || type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const renderMobileNav = () => {
        return (
            <div className="mobile-nav" style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                padding: '10px',
                backgroundColor: 'white',
                borderTop: '1px solid #eee',
                zIndex: 1000
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                        Bids Organized by Status
                    </span>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                        Tap sections to expand/collapse
                    </span>
                </div>
            </div>
        );
    };

    const renderMobileBidsView = () => {
        if (!selectedRequest) return null;

        return (
            <>
                <div 
                    className={`mobile-backdrop ${showMobileBids ? 'active' : ''}`}
                    onClick={handleCloseMobileBids}
                />
                <div className={`mobile-bids-view ${showMobileBids ? 'active' : ''}`}>
                    <div className="mobile-bids-header">
                        <button className="mobile-back-button" onClick={handleCloseMobileBids}>
                            <i className="fas fa-arrow-left"></i>
                            <span>Back</span>
                        </button>
                        <h2 className="mobile-bids-title">
                            {selectedRequest.event_title || selectedRequest.title || 'Selected Request'}
                        </h2>
                    </div>
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '10px', 
                        backgroundColor: '#f8f9fa', 
                        borderRadius: '8px',
                        color: '#FF008A',
                        fontWeight: 'bold',
                        margin: '10px',
                        fontSize: '14px'
                    }}>
                        Get 5% off everything when you book through Bidi! Limited time offer.
                    </div>
                    <div className="mobile-bids-content">
                        <div className="bids-container">
                            {/* Show bids grouped by status as accordions */}
                            {(() => {
                                const bidsByStatus = getBidsByStatus();
                                const statusOrder = [
                                    { key: 'approved', label: 'Approved' },
                                    { key: 'interested', label: 'Interested' },
                                    { key: 'pending', label: 'Pending' },
                                    { key: 'denied', label: 'Not Interested' },
                                    { key: 'expired', label: 'Expired' }
                                ];
                                return statusOrder.map(({ key, label }) => {
                                    if (!bidsByStatus[key] || bidsByStatus[key].length === 0) return null;
                                    const isOpen = openBidSections[key] || false;
                                    const newBidsInSection = bidsByStatus[key].filter(bid => !bid.viewed).length;
                                    return (
                                        <div key={key} className={`bids-section bids-section-${key}`} style={{ marginBottom: 24 }}>
                                            <div
                                                className="bids-section-header"
                                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
                                                onClick={() => toggleBidSection(key)}
                                            >
                                                <span style={{ marginRight: 8 }}>
                                                    {isOpen ? '▼' : '▶'}
                                                </span>
                                                <h4 style={{ margin: 0 }}>
                                                    {label} Bids ({bidsByStatus[key].length})
                                                    {newBidsInSection > 0 && (
                                                        <span 
                                                            style={{ 
                                                                marginLeft: 8, 
                                                                background: '#ec4899', 
                                                                color: 'white', 
                                                                borderRadius: '50%', 
                                                                padding: '2px 6px', 
                                                                fontSize: '12px',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            {newBidsInSection}
                                                        </span>
                                                    )}
                                                </h4>
                                            </div>
                                            {isOpen && (
                                                <div className="bids-grid">
                                                    {bidsByStatus[key].map(bid => renderBidCard(bid))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                            {renderNoBidsMessage()}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const handlePortfolioClick = (businessId, businessName) => {
        const formattedName = formatBusinessName(businessName);
        navigate(`/portfolio/${businessId}/${formattedName}`);
    };

    const handleRequestClick = (request, index) => {
        if (window.innerWidth <= 1024) {
            setSelectedRequest(request);
            setCurrentRequestIndex(index);
            setShowMobileBids(true);
        } else {
            setCurrentRequestIndex(index);
        }
    };

    const handleCloseMobileBids = () => {
        setShowMobileBids(false);
        // Add a small delay before clearing the selected request
        setTimeout(() => {
            setSelectedRequest(null);
        }, 300);
    };

    if (loading) {
        return (
            <div className="bids-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="spinner-border" role="status" style={{ width: 48, height: 48, marginBottom: 16, color: '#8000ff', borderColor: '#8000ff', borderRightColor: 'transparent' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <div style={{ fontSize: 18, color: '#555' }}>Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Bids - Bidi</title>
                <meta name="description" content="View and manage your bids on Bidi. Compare offers from various vendors and choose the best for your needs." />
                <meta name="keywords" content="bids, wedding vendors, Bidi, manage bids" />
            </Helmet>
            <div className="bids-page">
                <div>
                </div>
                <h1 className="section-title">Your Service Requests</h1>
 
                <p className="section-description">
                    View all your service requests and manage the bids you've received.
                </p>

                
                <style>
                    {`
                        .request-actions {
                            display: flex;
                            gap: 8px;
                            margin-top: 12px;
                        }
                        .btn-view-bids, .btn-edit, .btn-toggle {
                            padding: 8px 16px;
                            border-radius: 20px;
                            border: none;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            font-size: 14px;
                            transition: all 0.2s ease;
                        }
                        .btn-view-bids {
                            background-color: #9633eb;
                            color: white;
                        }
                        .btn-view-bids:hover {
                            background-color: #7a29c0;
                        }
                        .btn-edit {
                            background-color: #f8f9fa;
                            color: #666;
                            border: 1px solid #ddd;
                        }
                        .btn-edit:hover {
                            background-color: #e9ecef;
                        }
                        .btn-toggle {
                            background-color: #f8f9fa;
                            color: #666;
                            border: 1px solid #ddd;
                        }
                        .btn-toggle:hover {
                            background-color: #e9ecef;
                        }
                    `}
                </style>
                
                {requests.length > 0 ? (
                    <div className="requests-list-container">
                        <div className="requests-list-bids-page">
                            {requests.map((request, index) => (
                                <div 
                                    key={request.id} 
                                    className={`request-card ${currentRequestIndex === index ? 'active' : ''}`}
                                    onClick={() => handleRequestClick(request, index)}
                                >
                                    <div className="request-header">
                                        <div className="request-category">
                                            <div className="category-icon">
                                                <i className={`${getCategoryIcon(request.type)}`}></i>
                                            </div>
                                            <div className="category-info">
                                                <span className="category-name">
                                                    {formatCategoryType(request.type)}
                                                </span>
                                                <div className="request-status-container">
                                                    {isNew(request.created_at) && (
                                                        <div className="request-status new">New</div>
                                                    )}
                                                    <div className={`request-status ${(request.status === "open" || request.status === "pending" || request.open) ? 'open' : 'closed'}`}>
                                                        {(request.status === "open" || request.status === "pending" || request.open) ? 'Open' : 'Closed'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                    </div>
                                    <div className="request-actions">
                                        <button
                                            className="btn-view-bids"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRequestClick(request, index);
                                            }}
                                        >
                                            <i className="fas fa-eye"></i>
                                            View Bids
                                        </button>
                                        <button
                                            className="btn-edit"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(request);
                                            }}
                                        >
                                            <i className="fas fa-edit"></i>
                                            Edit
                                        </button>
                                        <button
                                            className="btn-toggle"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleRequestStatus(request);
                                            }}
                                        >
                                            <i className={`fas ${(request.status === "open" || request.status === "pending" || request.open) ? 'fa-lock' : 'fa-unlock'}`}></i>
                                            {(request.status === "open" || request.status === "pending" || request.open) ? "Close" : "Reopen"}
                                        </button>
                                    </div>
                                    <div className="request-details">
                                        <div className="detail-item">
                                            <i className="fas fa-calendar"></i>
                                            <span className="detail-label">Date:</span>
                                            <span className="detail-value">{getDate(request)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <i className="fas fa-dollar-sign"></i>
                                            <span className="detail-label">Budget:</span>
                                            <span className="detail-value">${request.price_range}</span>
                                        </div>
                                        <div className="detail-item">
                                            <i className="fas fa-eye"></i>
                                            <span className="detail-label">Views:</span>
                                            <div className="detail-value" style={{ 
                                                display: 'flex', 
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                textAlign: 'center'
                                            }}>
                                                <span>{getViewCountText(request).count}</span>
                                                <span style={{ fontSize: '0.9em', color: '#666' }}>{getViewCountText(request).category}</span>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
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

                {/* Desktop bids section */}
                {window.innerWidth > 1024 && currentRequestIndex >= 0 && (
                    <div className={`bids-section ${currentRequestIndex >= 0 ? 'active' : ''}`}>
                        <h2 className="section-title">
                            Bids for {requests[currentRequestIndex]?.event_title || requests[currentRequestIndex]?.title || 'Selected Request'}
                        </h2>
                        <p className="section-description">
                            Manage bids by their status: pending bids awaiting your review, approved bids you've accepted, or denied bids you've rejected.
                        </p>
                        <div style={{ 
                            textAlign: 'center', 
                            marginBottom: '20px', 
                            padding: '10px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '8px',
                            color: '#FF008A',
                            fontWeight: 'bold'
                        }}>
                            Get 5% off everything when you book through Bidi! Limited time offer.
                        </div>

                        <div className="bids-container">
                            {/* Show bids grouped by status as accordions */}
                            {(() => {
                                const bidsByStatus = getBidsByStatus();
                                const statusOrder = [
                                    { key: 'approved', label: 'Approved' },
                                    { key: 'interested', label: 'Interested' },
                                    { key: 'pending', label: 'Pending' },
                                    { key: 'denied', label: 'Not Interested' },
                                    { key: 'expired', label: 'Expired' }
                                ];
                                return statusOrder.map(({ key, label }) => {
                                    if (!bidsByStatus[key] || bidsByStatus[key].length === 0) return null;
                                    const isOpen = openBidSections[key] || false;
                                    const newBidsInSection = bidsByStatus[key].filter(bid => !bid.viewed).length;
                                    return (
                                        <div key={key} className={`bids-section bids-section-${key}`} style={{ marginBottom: 24 }}>
                                            <div
                                                className="bids-section-header"
                                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
                                                onClick={() => toggleBidSection(key)}
                                            >
                                                <span style={{ marginRight: 8 }}>
                                                    {isOpen ? '▼' : '▶'}
                                                </span>
                                                <h4 style={{ margin: 0 }}>
                                                    {label} Bids ({bidsByStatus[key].length})
                                                    {newBidsInSection > 0 && (
                                                        <span 
                                                            style={{ 
                                                                marginLeft: 8, 
                                                                background: '#ec4899', 
                                                                color: 'white', 
                                                                borderRadius: '50%', 
                                                                padding: '2px 6px', 
                                                                fontSize: '12px',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            {newBidsInSection}
                                                        </span>
                                                    )}
                                                </h4>
                                            </div>
                                            {isOpen && (
                                                <div className="bids-grid">
                                                    {bidsByStatus[key].map(bid => renderBidCard(bid))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                            {renderNoBidsMessage()}
                        </div>
                    </div>
                )}

                {/* Mobile bids view */}
                {window.innerWidth <= 1024 && renderMobileBidsView()}



                {/* Add mobile navigation at the bottom */}
                {window.innerWidth <= 1024 && renderMobileNav()}
            </div>

            {showAcceptModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content-bids-page" style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        maxWidth: '500px',
                        width: '90%',
                        margin: '0 auto'
                    }}>
                        <h3 style={{ marginBottom: '16px', color: '#333' }}>Accept Bid Confirmation</h3>
                        <p style={{ marginBottom: '16px', color: '#666' }}>Are you sure you want to accept this bid from {selectedBid?.business_profiles?.business_name}?</p>
                        
                        <div style={{ 
                            marginBottom: '24px', 
                            padding: '16px',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                        }}>
                            <h4 style={{ color: '#9633eb', marginBottom: '12px' }}>Bidi Protection Guarantee</h4>
                            <p style={{ marginBottom: '12px', color: '#666' }}>When you pay through Bidi, you're protected by our 100% Money-Back Guarantee:</p>
                            <ul style={{ 
                                marginBottom: '12px', 
                                color: '#666', 
                                paddingLeft: '20px',
                                listStyleType: 'none'
                            }}>
                                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-shield-alt" style={{ color: '#9633eb' }}></i>
                                    Full refund if the business doesn't deliver the service
                                </li>
                                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-user-shield" style={{ color: '#9633eb' }}></i>
                                    Protection against no-shows or cancellations
                                </li>
                                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-hand-holding-usd" style={{ color: '#9633eb' }}></i>
                                    Secure payment processing through Stripe
                                </li>
                            </ul>
                            <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                                We'll help you get a full refund if anything goes wrong with your booking.
                            </p>
                            <p style={{ marginTop: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-comments" style={{ color: '#9633eb' }}></i>
                                The business will be able to contact you through Bidi's messenger to discuss service details.
                            </p>
                        </div>

                        <div className="modal-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button 
                                className="btn-danger"
                                style={{
                                    borderRadius: '40px',
                                    padding: '8px 24px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: '#dc3545',
                                    color: 'white'
                                }}
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
                                style={{
                                    borderRadius: '40px',
                                    padding: '8px 24px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: '#28a745',
                                    color: 'white'
                                }}
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

            {/* Bid Notes Modal */}
            {showBidNotes && selectedBid && (
                <div className="modal-overlay" onClick={() => setShowBidNotes(false)}>
                    <div className="modal-content bid-notes-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>View & Edit Bid Notes</h3>
                        <div className="bid-notes-content">
                            <div className="business-info-summary">
                                <h4>{selectedBid.business_profiles?.business_name}</h4>
                                <p className="bid-amount">${selectedBid.bid_amount}</p>
                            </div>
                            
                            <div className="interest-rating-section">
                                <label>Your Interest Level:</label>
                                <div className="star-rating-large">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            className={`star-btn-large ${star <= bidInterestRating ? 'filled' : 'empty'}`}
                                            onClick={() => setBidInterestRating(star)}
                                            title={getInterestLevelText(star)}
                                        >
                                            <i className="fas fa-star"></i>
                                        </button>
                                    ))}
                                </div>
                                <span className="rating-description">
                                    {getInterestLevelText(bidInterestRating)}
                                </span>
                            </div>
                            
                            <div className="notes-section">
                                <label htmlFor="bid-notes">Your Notes:</label>
                                <textarea
                                    id="bid-notes"
                                    value={bidNotes}
                                    onChange={(e) => setBidNotes(e.target.value)}
                                    placeholder="Add your thoughts about this bid, questions to ask, pros/cons, etc..."
                                    rows={6}
                                    className="bid-notes-textarea"
                                />
                            </div>
                            
                            <div className="modal-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => setShowBidNotes(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={saveBidNotes}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
