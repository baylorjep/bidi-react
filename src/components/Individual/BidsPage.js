import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { formatBusinessName } from '../../utils/formatBusinessName';
import '../../styles/BidsPage.css';
import BidDisplay from '../Bid/BidDisplay';
import BidDetailModal from '../Bid/BidDetailModal';
import BidMessaging from '../Bid/BidMessaging';
import PortfolioModal from '../Business/Portfolio/PortfolioModal';
import GalleryModal from '../Business/Portfolio/GalleryModal';
import RequestDisplay from '../Request/RequestDisplay';
import PhotoRequestDisplay from '../Request/PhotoRequestDisplay';  // Add this import
import RequestModal from '../Request/RequestModal';
import { useNavigate } from 'react-router-dom';
import bidiCheck from '../../assets/images/Bidi-Favicon.png';
// Import Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';

// Skeleton components for loading states
const RequestCardSkeleton = () => (
  <div className="request-card skeleton-request-card">
    <div className="request-header">
      <div className="request-category">
        <div className="category-icon skeleton-category-icon"></div>
        <div className="category-info">
          <div className="skeleton-category-name"></div>
          <div className="request-status-container">
            <div className="skeleton-status-badge"></div>
            <div className="skeleton-status-badge"></div>
          </div>
        </div>
      </div>
    </div>
    <div className="request-actions">
      <div className="skeleton-action-btn"></div>
      <div className="skeleton-action-btn"></div>
      <div className="skeleton-action-btn"></div>
    </div>
    <div className="request-details">
      <div className="detail-item">
        <div className="skeleton-detail-icon"></div>
        <div className="skeleton-detail-label"></div>
        <div className="skeleton-detail-value"></div>
      </div>
      <div className="detail-item">
        <div className="skeleton-detail-icon"></div>
        <div className="skeleton-detail-label"></div>
        <div className="skeleton-detail-value"></div>
      </div>
      <div className="detail-item">
        <div className="skeleton-detail-icon"></div>
        <div className="skeleton-detail-label"></div>
        <div className="skeleton-detail-value"></div>
      </div>
    </div>
  </div>
);

const BidCardSkeleton = () => (
  <div className="bid-display-wrapper skeleton-bid-card">
    <div className="skeleton-bid-header">
      <div className="skeleton-profile-image"></div>
      <div className="skeleton-business-info">
        <div className="skeleton-business-name"></div>
        <div className="skeleton-business-category"></div>
      </div>
    </div>
    <div className="skeleton-bid-content">
      <div className="skeleton-bid-amount"></div>
      <div className="skeleton-bid-message"></div>
      <div className="skeleton-bid-message"></div>
    </div>
    <div className="skeleton-bid-actions">
      <div className="skeleton-action-btn"></div>
      <div className="skeleton-action-btn"></div>
    </div>
  </div>
);

const BidsPageSkeleton = () => (
  <div className="bids-page">

    
    <div className="requests-list-container">
      <div className="requests-list-bids-page">
        {Array.from({ length: 4 }).map((_, index) => (
          <RequestCardSkeleton key={index} />
        ))}
      </div>
    </div>
    
    <div className="bids-section active">
      <h2 className="section-title">Bids for Selected Request</h2>
      <p className="section-description">
        Manage bids by their status: pending bids awaiting your review, approved bids you've accepted, or denied bids you've rejected.
      </p>
      
      <div className="bids-container-bids-page">
        {/* Status Tabs Skeleton */}
        <div className="status-tabs" style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          overflowX: 'auto',
          padding: '8px 0'
        }}>
          {["All", "Pending", "Interested", "Approved", "Paid", "Denied", "Expired"].map((status) => (
            <div
              key={status}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                background: '#f8f9fa',
                width: status === 'All' ? '80px' : '120px',
                height: '36px',
                animation: 'pulse 1.5s infinite'
              }}
            />
          ))}
        </div>

        {/* Bids Grid Skeleton */}
        <div className="bids-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <BidCardSkeleton key={index} />
          ))}
        </div>

        <style>
          {`
            @keyframes pulse {
              0% { opacity: 0.6; }
              50% { opacity: 0.8; }
              100% { opacity: 0.6; }
            }
          `}
        </style>
      </div>
    </div>
  </div>
);

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
    
    // Tab state for bid status sections
    const [activeTab, setActiveTab] = useState('all');
    
    // Sorting state
    const [sortBy, setSortBy] = useState('recommended'); // 'recommended', 'high-price', 'low-price', 'newest'

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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editRequestData, setEditRequestData] = useState(null);
    const navigate = useNavigate();
    const [bidDisplayModalOpen, setBidDisplayModalOpen] = useState(false); // New state to track BidDisplay modal
    const [showBidDetailModal, setShowBidDetailModal] = useState(false);
    const [selectedBidForDetail, setSelectedBidForDetail] = useState(null);
    const [showBidMessagingFromDetail, setShowBidMessagingFromDetail] = useState(false);
    const [selectedBidForMessagingFromDetail, setSelectedBidForMessagingFromDetail] = useState(null);
    const [showBidMessagingFromList, setShowBidMessagingFromList] = useState(false);
    const [selectedBidForMessagingFromList, setSelectedBidForMessagingFromList] = useState(null);
    const [showPortfolioModal, setShowPortfolioModal] = useState(false);
    const [selectedBusinessForPortfolio, setSelectedBusinessForPortfolio] = useState(null);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [selectedBusinessForGallery, setSelectedBusinessForGallery] = useState(null);
    
    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBidForPayment, setSelectedBidForPayment] = useState(null);

    // Add new state for better UX
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [showRequestSummary, setShowRequestSummary] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Memoize the loading skeleton at the top level to avoid conditional hook calls
    const loadingSkeleton = useMemo(() => <BidsPageSkeleton />, []);

    const getDate = (request) => {
        const formatDateWithTimezone = (dateString) => {
            if (!dateString) return null;
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
        };

        const startDate = request.start_date || request.service_date;
        if (request.date_flexibility === 'specific') {
            return startDate ? formatDateWithTimezone(startDate) : 'Date not specified';
        } else if (request.date_flexibility === 'range') {
            return `${formatDateWithTimezone(startDate)} - ${formatDateWithTimezone(request.end_date)}`;
        } else if (request.date_flexibility === 'flexible') {
            return `Flexible within ${request.date_timeframe}`;
        }
        return startDate ? formatDateWithTimezone(startDate) : 'Date not specified';
    };

    // Helper: Group bids by status for the current request
    const getBidsByStatus = () => {
        const currentRequest = requests[currentRequestIndex];
        if (!currentRequest) return {};
        
        const requestBids = bids.filter(bid => bid.request_id === currentRequest.id);
        
        // Calculate recommendation score for a bid
        const calculateRecommendationScore = (bid) => {
            let score = 0;
            
            // Bidi verification bonus (highest priority)
            if (bid.business_profiles?.is_verified) {
                score += 1000;
            }
            
            // Interest rating bonus
            const interestRating = bid.interest_rating || 0;
            score += interestRating * 100;
            
            // Viewed status bonus (new bids get priority)
            if (!bid.viewed) {
                score += 50;
            }
            
            // Business membership tier bonus
            const membershipTier = bid.business_profiles?.membership_tier;
            if (membershipTier === 'premium') {
                score += 200;
            } else if (membershipTier === 'standard') {
                score += 100;
            }
            
            return score;
        };
        
        // Sort bids based on selected sorting option
        const sortBids = (bids) => {
            return bids.sort((a, b) => {
                switch (sortBy) {
                    case 'recommended':
                        // Sort by recommendation score (highest first)
                        const scoreA = calculateRecommendationScore(a);
                        const scoreB = calculateRecommendationScore(b);
                        if (scoreA !== scoreB) {
                            return scoreB - scoreA;
                        }
                        // If scores are equal, sort by creation date (newest first)
                        return new Date(b.created_at) - new Date(a.created_at);
                        
                    case 'high-price':
                        // Sort by bid amount (highest first)
                        const amountA = parseFloat(a.bid_amount || 0);
                        const amountB = parseFloat(b.bid_amount || 0);
                        if (amountA !== amountB) {
                            return amountB - amountA;
                        }
                        // If amounts are equal, sort by creation date (newest first)
                        return new Date(b.created_at) - new Date(a.created_at);
                        
                    case 'low-price':
                        // Sort by bid amount (lowest first)
                        const amountLowA = parseFloat(a.bid_amount || 0);
                        const amountLowB = parseFloat(b.bid_amount || 0);
                        if (amountLowA !== amountLowB) {
                            return amountLowA - amountLowB;
                        }
                        // If amounts are equal, sort by creation date (newest first)
                        return new Date(b.created_at) - new Date(a.created_at);
                        
                    case 'newest':
                        // Sort by creation date (newest first)
                        return new Date(b.created_at) - new Date(a.created_at);
                        
                    default:
                        // Default sorting (original logic)
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
                }
            });
        };
        
        return {
            paid: sortBids(requestBids.filter(bid => bid.status === 'paid' && !bid.isExpired)),
            approved: sortBids(requestBids.filter(bid => (bid.status === 'approved' || bid.status === 'accepted') && !bid.isExpired)),
            interested: sortBids(requestBids.filter(bid => bid.status === 'interested' && !bid.isExpired)),
            pending: sortBids(requestBids.filter(bid => bid.status === 'pending' && !bid.isExpired)),
            denied: sortBids(requestBids.filter(bid => bid.status === 'denied' && !bid.isExpired)),
            expired: sortBids(requestBids.filter(bid => bid.isExpired)),
        };
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

    // Reload bids when sorting changes
    useEffect(() => {
        if (user && requests.length > 0 && bids.length > 0) {
            // Re-sort existing bids without fetching from database
            const sortedBids = [...bids].sort((a, b) => {
                switch (sortBy) {
                    case 'recommended':
                        const scoreA = (a.business_profiles?.is_verified ? 1000 : 0) + 
                                     ((a.interest_rating || 0) * 100) + 
                                     (!a.viewed ? 50 : 0) +
                                     (a.business_profiles?.membership_tier === 'premium' ? 200 : 
                                      a.business_profiles?.membership_tier === 'standard' ? 100 : 0);
                        const scoreB = (b.business_profiles?.is_verified ? 1000 : 0) + 
                                     ((b.interest_rating || 0) * 100) + 
                                     (!b.viewed ? 50 : 0) +
                                     (b.business_profiles?.membership_tier === 'premium' ? 200 : 
                                      b.business_profiles?.membership_tier === 'standard' ? 100 : 0);
                        if (scoreA !== scoreB) {
                            return scoreB - scoreA;
                        }
                        break;
                        
                    case 'high-price':
                        const amountA = parseFloat(a.bid_amount || 0);
                        const amountB = parseFloat(b.bid_amount || 0);
                        if (amountA !== amountB) {
                            return amountB - amountA;
                        }
                        break;
                        
                    case 'low-price':
                        const amountLowA = parseFloat(a.bid_amount || 0);
                        const amountLowB = parseFloat(b.bid_amount || 0);
                        if (amountLowA !== amountLowB) {
                            return amountLowA - amountLowB;
                        }
                        break;
                        
                    default:
                        if (!a.viewed && b.viewed) return -1;
                        if (a.viewed && !b.viewed) return 1;
                        
                        const ratingA = a.interest_rating || 0;
                        const ratingB = b.interest_rating || 0;
                        if (ratingA !== ratingB) {
                            return ratingB - ratingA;
                        }
                        break;
                }
                
                return new Date(b.created_at) - new Date(a.created_at);
            });
            
            setBids(sortedBids);
        }
    }, [sortBy]);

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
                        stripe_account_id,
                        is_verified
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

                // Sort bids using the new sorting system
                const sortedBids = bidsWithExpiration.sort((a, b) => {
                    // Use the same sorting logic as in getBidsByStatus
                    switch (sortBy) {
                        case 'recommended':
                            // Calculate recommendation scores
                            const scoreA = (a.business_profiles?.is_verified ? 1000 : 0) + 
                                         ((a.interest_rating || 0) * 100) + 
                                         (!a.viewed ? 50 : 0) +
                                         (a.business_profiles?.membership_tier === 'premium' ? 200 : 
                                          a.business_profiles?.membership_tier === 'standard' ? 100 : 0);
                            const scoreB = (b.business_profiles?.is_verified ? 1000 : 0) + 
                                         ((b.interest_rating || 0) * 100) + 
                                         (!b.viewed ? 50 : 0) +
                                         (b.business_profiles?.membership_tier === 'premium' ? 200 : 
                                          b.business_profiles?.membership_tier === 'standard' ? 100 : 0);
                            if (scoreA !== scoreB) {
                                return scoreB - scoreA;
                            }
                            break;
                            
                        case 'high-price':
                            const amountA = parseFloat(a.bid_amount || 0);
                            const amountB = parseFloat(b.bid_amount || 0);
                            if (amountA !== amountB) {
                                return amountB - amountA;
                            }
                            break;
                            
                        case 'low-price':
                            const amountLowA = parseFloat(a.bid_amount || 0);
                            const amountLowB = parseFloat(b.bid_amount || 0);
                            if (amountLowA !== amountLowB) {
                                return amountLowA - amountLowB;
                            }
                            break;
                            
                        default:
                            // Default sorting (original logic)
                            if (!a.viewed && b.viewed) return -1;
                            if (a.viewed && !b.viewed) return 1;
                            
                            const ratingA = a.interest_rating || 0;
                            const ratingB = b.interest_rating || 0;
                            if (ratingA !== ratingB) {
                                return ratingB - ratingA;
                            }
                            break;
                    }
                    
                    // If all else is equal, sort by creation date (newest first)
                    return new Date(b.created_at) - new Date(a.created_at);
                });

                setBids(sortedBids);
            }
        } catch (error) {
            console.error("Error loading bids:", error);
        }
    };

    const handlePayNow = (bid) => {
        console.log('BidsPage: handlePayNow called with bid:', bid);
        try {
            // Use Bidi's Stripe account if business doesn't have one
            const stripeAccountId = bid.business_profiles?.stripe_account_id || 'acct_1RqCsQJwWKKQQDV2';
            const isUsingBidiStripe = !bid.business_profiles?.stripe_account_id;

            const paymentData = {
                bid_id: bid.id,
                amount: bid.bid_amount,
                stripe_account_id: stripeAccountId,
                payment_type: 'full',
                business_name: bid.business_profiles?.business_name || 'Unknown Business',
                description: isUsingBidiStripe ? 'Service payment (Processed by Bidi)' : (bid.message || 'Service payment'),
                lineItems: bid.line_items || [],
                taxRate: bid.tax_rate || 0
            };
            console.log('BidsPage: Navigating to checkout with payment data:', paymentData);
            navigate('/checkout', { state: { paymentData } });
        } catch (error) {
            console.error('Error preparing payment:', error);
            toast.error('There was an error processing your payment. Please try again.');
        }
    };

    const handleDownPayNow = (bid) => {
        console.log('BidsPage: handleDownPayNow called with bid:', bid);
        try {
            const downPayment = calculateDownPayment(bid);
            if (!downPayment) {
                console.error('Down payment calculation returned null. Business profile:', bid.business_profiles);
                toast.error('Unable to calculate down payment. Please contact support.');
                return;
            }

            // Add line items to the payment data
            let lineItems = [];
            const description = bid.bid_description || bid.message || 'Service payment';
            lineItems.push({
                description: description,
                quantity: 1,
                rate: downPayment.amount
            });

            // Use Bidi's Stripe account if business doesn't have one
            const stripeAccountId = bid.business_profiles?.stripe_account_id || 'acct_1RqCsQJwWKKQQDV2';
            const isUsingBidiStripe = !bid.business_profiles?.stripe_account_id;

            const paymentData = {
                bid_id: bid.id,
                amount: downPayment.amount,
                stripe_account_id: stripeAccountId,
                payment_type: 'down_payment',
                business_name: bid.business_profiles?.business_name || 'Unknown Business',
                description: isUsingBidiStripe ? `${description} (Processed by Bidi)` : description,
                lineItems: lineItems,
                taxRate: 0
            };
            console.log('BidsPage: Navigating to checkout with down payment data:', paymentData);
            navigate('/checkout', { state: { paymentData } });
        } catch (error) {
            console.error('Error preparing down payment:', error);
            toast.error('There was an error processing your down payment. Please try again.');
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
            try {
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
                    toast.error('Failed to accept bid. Please try again.');
                    return;
                }

                // Reload bids to reflect the change
                await loadBids();
                
                // Close modal and reset state
                setShowAcceptModal(false);
                setSelectedBid(null);
                
                toast.success('Bid accepted successfully!');
            } catch (error) {
                console.error('Error accepting bid:', error);
                toast.error('Failed to accept bid. Please try again.');
            }
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
        // Map request types to the categories that RequestModal expects
        const getCategoryFromType = (requestType) => {
            const categoryMap = {
                'photography': 'photographer',
                'videography': 'videographer',
                'catering': 'caterer',
                'dj': 'dj',
                'florist': 'florist',
                'beauty': 'beauty',
                'wedding_planning': 'planner',
                'venue': 'venue',
                'other': 'photographer' // Default fallback for regular requests
            };
            return categoryMap[requestType] || 'photographer';
        };

        // Open the RequestModal in edit mode instead of navigating to a separate page
        setEditRequestData({
            isEditMode: true,
            existingRequestData: request,
            selectedVendors: [getCategoryFromType(request.type || 'other')],
            searchFormData: {
                eventType: request.event_type || request.service_category || 'Wedding',
                date: request.service_date || request.start_date || request.eventDate,
                time: request.service_time || request.start_time || request.eventTime,
                location: request.location,
                guestCount: request.guest_count || request.guestCount
            }
        });
        setIsEditModalOpen(true);
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
                },
                // Ensure payment information is properly passed
                payment_type: bid.payment_type || null,
                payment_amount: bid.payment_amount || null,
                down_payment: bid.down_payment || null
            },
            showActions: !bid.isExpired, // Hide actions for expired bids
            onViewCoupon: handleViewCoupon,
            onMessage: onOpenChat,
            currentUserId: currentUserId,
            onProfileClick: () => handlePortfolioClick(bid.business_profiles.id, bid.business_profiles.business_name),
            isNew: !bid.viewed, // Add isNew prop for new bids
            onMobileModalToggle: handleBidDisplayModalToggle, // Add callback for modal state changes
            onOpenBidDetail: handleOpenBidDetail, // Add callback for opening bid detail modal
            onOpenBidMessaging: handleOpenBidMessagingFromList, // Add callback for opening bid messaging modal
            onOpenPortfolio: handleOpenPortfolio, // Add callback for opening portfolio modal
            onOpenPaymentModal: handleOpenPaymentModal // Add callback for opening payment modal
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
                onMoveToPending: () => handleMoveToPending(bid),
                downPayment: calculateDownPayment(bid),
                onPayNow: (paymentType) => {
                    if (paymentType === 'downpayment') {
                        handleDownPayNow(bid);
                    } else {
                        handlePayNow(bid);
                    }
                }
            };
        } else if (bid.status === 'denied') {
            statusProps = {
                handleApprove: () => handleMoveToPending(bid),
                handleDeny: () => handleAcceptBidClick(bid),
                handlePending: () => handleMoveToPending(bid),
                onMoveToPending: () => handleMoveToPending(bid),
                showPending: true,
                showNotInterested: true,
                handleInterested: () => handleMoveToInterested(bid),
                downPayment: calculateDownPayment(bid),
                onPayNow: (paymentType) => {
                    if (paymentType === 'downpayment') {
                        handleDownPayNow(bid);
                    } else {
                        handlePayNow(bid);
                    }
                }
            };
        } else if (bid.status === 'paid' && bid.payment_type === 'down_payment') {
            statusProps = {
                showPaymentOptions: true,
                downPayment: calculateDownPayment(bid),
                onPayNow: (paymentType) => {
                    if (paymentType === 'downpayment') {
                        handleDownPayNow(bid);
                    } else {
                        handlePayNow(bid);
                    }
                },
                showPending: false,
                showNotInterested: false,
                showInterested: false
            };
        } else {
            // pending status
            statusProps = {
                handleApprove: () => handleAcceptBidClick(bid),
                handleDeny: () => handleMoveToNotInterested(bid),
                handleInterested: () => handleMoveToInterested(bid),
                handlePending: () => handleMoveToPending(bid),
                onMoveToPending: () => handleMoveToPending(bid),
                showPending: true,
                downPayment: calculateDownPayment(bid),
                onPayNow: (paymentType) => {
                    if (paymentType === 'downpayment') {
                        handleDownPayNow(bid);
                    } else {
                        handlePayNow(bid);
                    }
                }
            };
        }

        return (
            <div key={bid.id}>
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
                    {/* Only show header when BidDisplay modal is not open */}
                    {!bidDisplayModalOpen && (
                        <div className="mobile-bids-header">
                            <button className="mobile-back-button" onClick={handleCloseMobileBids}>
                                <i className="fas fa-arrow-left"></i>
                                <span>Back</span>
                            </button>
                            <h2 className="mobile-bids-title">
                                {selectedRequest.event_title || selectedRequest.title || 'Selected Request'}
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: '400',
                                    color: '#666',
                                    display: 'block',
                                    marginTop: '4px'
                                }}>
                                                                    {sortBy === 'recommended' && '⭐ Sorted by recommendation'}
                                {sortBy === 'high-price' && '💰 Sorted by highest price'}
                                {sortBy === 'low-price' && '💸 Sorted by lowest price'}
                                {sortBy === 'newest' && '🕒 Sorted by newest bid'}
                                </span>
                            </h2>
                        </div>
                    )}
                    <div className="mobile-bids-content">
                    <div className="bids-container-bids-page">
                        {/* Only show sorting controls and tabs when BidDisplay modal is not open */}
                        {!bidDisplayModalOpen && (
                            <>
                                {/* Mobile Sorting Controls */}
                                <div className="mobile-sorting-controls" style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    marginBottom: '16px',
                                    padding: '0 16px'
                                }}>
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#666',
                                        textAlign: 'center'
                                    }}>
                                        Sort by:
                                    </span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            border: '2px solid #9633eb',
                                            background: 'white',
                                            color: '#374151',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            width: '100%',
                                            maxWidth: '200px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <option value="recommended">⭐ Recommended</option>
                                        <option value="high-price">💰 High Price</option>
                                        <option value="low-price">💸 Low Price</option>
                                        <option value="newest">🕒 Newest Bid</option>
                                    </select>
                                </div>
                                
                                {/* Mobile Status Dropdown - styled like desktop */}
                                <div className="mobile-status-dropdown-container" style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    marginBottom: '24px',
                                    padding: '0 16px'
                                }}>
                                    <label htmlFor="mobile-status-select" style={{
                                        fontWeight: '600',
                                        color: '#374151',
                                        fontSize: '14px',
                                        marginBottom: '4px',
                                        textAlign: 'center'
                                    }}>
                                        Filter by Status:
                                    </label>
                                    <select
                                        id="mobile-status-select"
                                        value={activeTab}
                                        onChange={(e) => setActiveTab(e.target.value)}
                                        style={{
                                            padding: '12px 16px',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '8px',
                                            backgroundColor: 'white',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#374151',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            width: '100%',
                                            maxWidth: '300px',
                                            alignSelf: 'center'
                                        }}
                                    >
                                        {[
                                            { key: 'all', label: 'All Bids', description: 'View all bids for this request' },
                                            { key: 'pending', label: 'Pending', description: 'Bids awaiting your review' },
                                            { key: 'interested', label: 'Interested', description: 'Bids you\'re interested in' },
                                            { key: 'approved', label: 'Approved', description: 'Bids you\'ve accepted' },
                                            { key: 'paid', label: 'Paid', description: 'Bids with completed payments' },
                                            { key: 'denied', label: 'Denied', description: 'Bids you\'ve rejected' },
                                            { key: 'expired', label: 'Expired', description: 'Bids that have expired' }
                                        ].map(({ key, label, description }) => {
                                            const bidsByStatus = getBidsByStatus();
                                            const count = key === 'all' 
                                                ? Object.values(bidsByStatus).reduce((sum, bids) => sum + bids.length, 0)
                                                : (bidsByStatus[key]?.length || 0);
                                            
                                            const newBidsCount = key !== 'all' ? getNewBidsCount(key) : 0;
                                            
                                            return (
                                                <option key={key} value={key} title={description}>
                                                    {label} ({count}){newBidsCount > 0 ? ` - ${newBidsCount} new` : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </>
                        )}
                        <div className="tw-flex tw-flex-col tw-gap-0">
                            {(() => {
                                const bidsByStatus = getBidsByStatus();
                                if (activeTab === 'all') {
                                    return Object.values(bidsByStatus)
                                        .flat()
                                        .map(bid => renderBidCard(bid));
                                }
                                return (bidsByStatus[activeTab] || []).map(bid => renderBidCard(bid));
                            })()}
                            {renderNoBidsMessage()}
                        </div>
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

    // Enhanced request selection with better visual feedback
    const handleRequestClick = (request, index) => {
        setSelectedRequestId(request.id);
        setCurrentRequestIndex(index);
        
        if (window.innerWidth <= 1024) {
            setSelectedRequest(request);
            setShowMobileBids(true);
        }
        
        // Scroll to bids section on desktop
        if (window.innerWidth > 1024) {
            const bidsSection = document.querySelector('.bids-section');
            if (bidsSection) {
                bidsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    const handleCloseMobileBids = () => {
        setShowMobileBids(false);
        // Add a small delay before clearing the selected request
        setTimeout(() => {
            setSelectedRequest(null);
        }, 300);
    };

    const handleBidDisplayModalToggle = (isOpen) => {
        setBidDisplayModalOpen(isOpen);
    };

    const handleOpenBidDetail = (bid) => {
        setSelectedBidForDetail(bid);
        setShowBidDetailModal(true);
    };

    const handleCloseBidDetail = () => {
        setShowBidDetailModal(false);
        setSelectedBidForDetail(null);
    };

    const handleOpenBidMessaging = (bid) => {
        setSelectedBidForMessagingFromDetail(bid);
        setShowBidMessagingFromDetail(true);
    };

    const handleCloseBidMessaging = () => {
        setShowBidMessagingFromDetail(false);
        setSelectedBidForMessagingFromDetail(null);
    };

    const handleOpenBidMessagingFromList = (bid) => {
        setSelectedBidForMessagingFromList(bid);
        setShowBidMessagingFromList(true);
    };

    const handleCloseBidMessagingFromList = () => {
        setShowBidMessagingFromList(false);
        setSelectedBidForMessagingFromList(null);
    };

    const handleOpenPortfolio = (business) => {
        setSelectedBusinessForPortfolio(business);
        setShowPortfolioModal(true);
    };

    const handleClosePortfolio = () => {
        setShowPortfolioModal(false);
        setSelectedBusinessForPortfolio(null);
    };

    const handleOpenGallery = (business) => {
        setSelectedBusinessForGallery(business);
        setShowGalleryModal(true);
    };

    const handleCloseGallery = () => {
        setShowGalleryModal(false);
        setSelectedBusinessForGallery(null);
    };

    const handleBackToPortfolio = () => {
        // Close gallery modal
        setShowGalleryModal(false);
        setSelectedBusinessForGallery(null);
        
        // Reopen portfolio modal with the same business
        if (selectedBusinessForGallery) {
            setShowPortfolioModal(true);
        }
    };
    
    // Payment Modal Handlers
    const handleOpenPaymentModal = (bid) => {
        setSelectedBidForPayment(bid);
        setShowPaymentModal(true);
    };
    
    const handleClosePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedBidForPayment(null);
    };
    


    // Enhanced request card with better visual feedback
    const renderRequestCard = (request, index) => {
        const isSelected = selectedRequestId === request.id;
        const hasBids = bids.some(bid => bid.request_id === request.id);
        const bidCount = bids.filter(bid => bid.request_id === request.id).length;
        
        return (
            <div 
                key={request.id} 
                className={`request-card ${isSelected ? 'selected' : ''} ${hasBids ? 'has-bids' : ''}`}
                onClick={() => handleRequestClick(request, index)}
            >
                <div className="request-header">
                    <div className="request-category">
                        <div className="category-icon-wrapper">
                            <i className={`${getCategoryIcon(request.type)} category-icon`}></i>
                            {hasBids && (
                                <div className="bid-count-badge">
                                    {bidCount}
                                </div>
                            )}
                        </div>
                        <div className="category-info">
                            <h4 className="category-name">
                                {formatCategoryType(request.type)}
                            </h4>
                            <div className="request-status-container">
                                {isNew(request.created_at) && (
                                    <span className="status-badge new">New</span>
                                )}
                                <span className={`status-badge ${(request.status === "open" || request.status === "pending" || request.open) ? 'open' : 'closed'}`}>
                                    {(request.status === "open" || request.status === "pending" || request.open) ? 'Active' : 'Closed'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="request-actions">
                        <button
                            className="action-btn secondary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(request);
                            }}
                            title="Edit Request"
                        >
                            <i className="fas fa-edit"></i>
                        </button>
                        <button
                            className="action-btn secondary"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleRequestStatus(request);
                            }}
                            title={`${(request.status === "open" || request.status === "pending" || request.open) ? 'Close' : 'Open'} Request`}
                        >
                            <i className={`fas ${(request.status === "open" || request.status === "pending" || request.open) ? 'fa-lock' : 'fa-unlock'}`}></i>
                        </button>
                    </div>
                </div>

                {hasBids && (
                    <div className="request-bids-summary">
                        <div className="bids-status-summary">
                            {(() => {
                                const requestBids = bids.filter(bid => bid.request_id === request.id);
                                const pendingCount = requestBids.filter(bid => bid.status === 'pending').length;
                                const approvedCount = requestBids.filter(bid => bid.status === 'approved' || bid.status === 'accepted').length;
                                const interestedCount = requestBids.filter(bid => bid.status === 'interested').length;
                                
                                return (
                                    <>
                                        {pendingCount > 0 && (
                                            <span className="status-indicator pending">
                                                {pendingCount} Pending
                                            </span>
                                        )}
                                        {approvedCount > 0 && (
                                            <span className="status-indicator approved">
                                                {approvedCount} Approved
                                            </span>
                                        )}
                                        {interestedCount > 0 && (
                                            <span className="status-indicator interested">
                                                {interestedCount} Interested
                                            </span>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Enhanced bids section with better organization
    const renderBidsSection = () => {
        if (!requests[currentRequestIndex]) return null;
        
        const currentRequest = requests[currentRequestIndex];
        const bidsByStatus = getBidsByStatus();
        const totalBids = Object.values(bidsByStatus).reduce((sum, bids) => sum + bids.length, 0);
        
        return (
            <div className="bids-section active">
                <div className="bids-header">
                    <div className="request-summary">
                        <h2 className="section-title">
                            {currentRequest.event_title || currentRequest.title || 'Selected Request'}
                        </h2>
                        <div className="request-meta">
                            <span className="meta-item">
                                <i className="fas fa-calendar-alt"></i>
                                {getDate(currentRequest)}
                            </span>
                            <span className="meta-item">
                                <i className="fas fa-dollar-sign"></i>
                                ${currentRequest.price_range}
                            </span>
                            <span className="meta-item">
                                <i className="fas fa-eye"></i>
                                {currentRequest.viewCount || 0} vendors viewed
                            </span>
                        </div>
                    </div>
                    
                    <div className="bids-overview">
                        <div className="sorting-controls">
                            <span className="sort-label">Sort by:</span>
                            <select
                                className="sort-dropdown"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="recommended">⭐ Recommended</option>
                                <option value="high-price">💰 High Price</option>
                                <option value="low-price">💸 Low Price</option>
                                <option value="newest">🕒 Newest Bid</option>
                            </select>
                        </div>
                    </div>
                </div>

                                        <div className="bids-container">
                            {/* Status Dropdown */}
                            <div className="status-dropdown-container">
                                <label htmlFor="status-select" className="status-dropdown-label">
                                    Filter by Status:
                                </label>
                                <select
                                    id="status-select"
                                    className="status-dropdown"
                                    value={activeTab}
                                    onChange={(e) => setActiveTab(e.target.value)}
                                >
                                    {[
                                        { key: 'all', label: 'All Bids', description: 'View all bids for this request' },
                                        { key: 'pending', label: 'Pending', description: 'Bids awaiting your review' },
                                        { key: 'approved', label: 'Approved', description: 'Bids you\'ve accepted' },
                                        { key: 'paid', label: 'Paid', description: 'Bids with completed payments' },
                                        { key: 'denied', label: 'Denied', description: 'Bids you\'ve rejected' },
                                        { key: 'expired', label: 'Expired', description: 'Bids that have expired' }
                                    ].map(({ key, label, description }) => {
                                        const count = key === 'all' 
                                            ? totalBids
                                            : (bidsByStatus[key]?.length || 0);
                                        
                                        const newBidsCount = key !== 'all' ? getNewBidsCount(key) : 0;
                                        
                                        return (
                                            <option key={key} value={key} title={description}>
                                                {label} ({count}){newBidsCount > 0 ? ` - ${newBidsCount} new` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                    <div className="bids-content">
                        {(() => {
                            if (activeTab === 'all') {
                                return Object.values(bidsByStatus)
                                    .flat()
                                    .map(bid => renderBidCard(bid));
                            }
                            return (bidsByStatus[activeTab] || []).map(bid => renderBidCard(bid));
                        })()}
                        {renderNoBidsMessage()}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return loadingSkeleton;
    }

    return (
        <>
            <Helmet>
                <title>Bids - Bidi</title>
                <meta name="description" content="View and manage your bids on Bidi. Compare offers from various vendors and choose the best for your needs." />
                <meta name="keywords" content="bids, wedding vendors, Bidi, manage bids" />
            </Helmet>
            <div className="bids-page">
                <style>
                    {`
                        /* Enhanced Visual Hierarchy */
                        .requests-header {
                            text-align: center;
                            margin-bottom: 32px;
                            padding: 24px;
                            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                            border-radius: 16px;
                            border: 1px solid #dee2e6;
                        }
                        
                        .requests-title {
                            font-size: 28px;
                            font-weight: 700;
                            color: #2c3e50;
                            margin-bottom: 8px;
                        }
                        
                        .requests-subtitle {
                            font-size: 16px;
                            color: #6c757d;
                            margin: 0;
                        }
                        
                        /* Enhanced Request Cards */
                        .request-card {
                            background: white;
                            border: 2px solid #e9ecef;
                            border-radius: 16px;
                            padding: 24px;
                            margin-bottom: 20px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            position: relative;
                            overflow: hidden;
                        }
                        
                        .request-card:hover {
                            border-color: #9633eb;
                            transform: translateY(-2px);
                            box-shadow: 0 8px 25px rgba(150, 51, 235, 0.15);
                        }
                        
                        .request-card.selected {
                            border-color: #9633eb;
                            background: linear-gradient(135deg, #f8f5ff 0%, #f0ebff 100%);
                            box-shadow: 0 8px 25px rgba(150, 51, 235, 0.2);
                        }
                        
                        .request-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            margin-bottom: 20px;
                        }
                        
                        .request-category {
                            display: flex;
                            align-items: center;
                            gap: 16px;
                        }
                        
                        
                        .bid-count-badge {
                            position: absolute;
                            top: -8px;
                            right: -8px;
                            background: #ec4899;
                            color: white;
                            border-radius: 50%;
                            width: 24px;
                            height: 24px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 12px;
                            font-weight: bold;
                        }
                        
                        .category-info {
                            flex: 1;
                            margin:0px
                        }
                        
                        .category-name {
                            font-size: 20px;
                            font-weight: 600;
                            color: #2c3e50;
                            margin: 0 0 8px 0;
                        }
                        
                        /* Mobile Status Dropdown Styles */
                        .mobile-status-dropdown-container select:hover {
                            border-color: #9633eb;
                        }
                        
                        .mobile-status-dropdown-container select:focus {
                            outline: none;
                            border-color: #9633eb;
                            box-shadow: 0 0 0 3px rgba(150, 51, 235, 0.1);
                        }
                        
                        .mobile-status-dropdown-container select option {
                            padding: 8px 12px;
                            font-size: 14px;
                        }
                        
                        .request-status-container {
                            display: flex;
                            gap: 8px;
                            flex-wrap: wrap;
                        }
                        
                        .status-badge {
                            padding: 6px 12px;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        
                        .status-badge.new {
                            background: #28a745;
                            color: white;
                        }
                        
                        .status-badge.open {
                            background: #17a2b8;
                            color: white;
                        }
                        
                        .status-badge.closed {
                            background: #6c757d;
                            color: white;
                        }
                        
                        .request-actions {
                            display: flex;
                            gap: 8px;
                        }
                        
                        .action-btn {
                            padding: 10px 16px;
                            border-radius: 12px;
                            border: none;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            font-size: 14px;
                            font-weight: 500;
                            transition: all 0.2s ease;
                            min-width: fit-content;
                        }
                        
                        .action-btn.primary {
                            background: linear-gradient(135deg, #9633eb 0%, #7a29c0 100%);
                            color: white;
                        }
                        
                        .action-btn.primary:hover {
                            transform: translateY(-1px);
                            box-shadow: 0 4px 12px rgba(150, 51, 235, 0.3);
                        }
                        
                        .action-btn.secondary {
                            background: #f8f9fa;
                            color: #6c757d;
                            border: 1px solid #dee2e6;
                        }
                        
                        .action-btn.secondary:hover {
                            background: #e9ecef;
                            border-color: #adb5bd;
                        }
                        
                        .request-details {
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                            gap: 16px;
                            margin-bottom: 20px;
                        }
                        
                        .detail-item {
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            padding: 16px;
                            background: #f8f9fa;
                            border-radius: 12px;
                            border: 1px solid #e9ecef;
                        }
                        
                        .detail-item i {
                            color: #9633eb;
                            font-size: 18px;
                            width: 20px;
                            text-align: center;
                        }
                        
                        .detail-label {
                            font-weight: 600;
                            color: #495057;
                            font-size: 14px;
                        }
                        
                        .detail-value {
                            margin-left: auto;
                            font-weight: 500;
                            color: #2c3e50;
                        }
                        
                        .view-count {
                            font-size: 18px;
                            font-weight: 700;
                            color: #9633eb;
                            display: block;
                        }
                        
                        .view-label {
                            font-size: 12px;
                            color: #6c757d;
                        }
                        
                        .request-bids-summary {
                            border-top: 1px solid #e9ecef;
                            padding-top: 16px;
                        }
                        
                        .bids-status-summary {
                            display: flex;
                            gap: 8px;
                            flex-wrap: wrap;
                        }
                        
                        .status-indicator {
                            padding: 6px 12px;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        
                        .status-indicator.pending {
                            background: #ffc107;
                            color: #212529;
                        }
                        
                        .status-indicator.approved {
                            background: #28a745;
                            color: white;
                        }
                        
                        .status-indicator.interested {
                            background: #17a2b8;
                            color: white;
                        }
                        
                        /* Enhanced Bids Section */
                        .bids-section {
                            background: white;
                            border-radius: 20px;
                            padding: 32px;
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                            border: 1px solid #e9ecef;
                        }
                        
                        .bids-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            margin-bottom: 32px;
                            padding-bottom: 24px;
                            border-bottom: 2px solid #f8f9fa;
                        }
                        
                        .request-summary {
                            flex: 1;
                        }
                        
                        .section-title {
                            font-size: 32px;
                            font-weight: 700;
                            color: #2c3e50;
                            margin: 0 0 16px 0;
                        }
                        
                        .request-meta {
                            display: flex;
                            gap: 24px;
                            flex-wrap: wrap;
                        }
                        
                        .meta-item {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            color: #6c757d;
                            font-size: 14px;
                        }
                        
                        .meta-item i {
                            color: #9633eb;
                        }
                        
                        .bids-overview {
                            text-align: right;
                        }
                        
                        .total-bids {
                            margin-bottom: 20px;
                        }
                        
                        .bids-count {
                            display: block;
                            font-size: 36px;
                            font-weight: 700;
                            color: #9633eb;
                            line-height: 1;
                        }
                        
                        .bids-label {
                            font-size: 14px;
                            color: #6c757d;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        
                        .sorting-controls {
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            flex-wrap: wrap;
                        }
                        
                        .sort-label {
                            font-size: 14px;
                            font-weight: 600;
                            color: #495057;
                        }
                        
                        .sort-btn {
                            padding: 8px 16px;
                            border-radius: 20px;
                            border: 2px solid #9633eb;
                            background: white;
                            color: #9633eb;
                            cursor: pointer;
                            font-size: 13px;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            transition: all 0.2s ease;
                        }
                        
                        .sort-btn:hover {
                            transform: translateY(-1px);
                            box-shadow: 0 4px 12px rgba(150, 51, 235, 0.2);
                        }
                        
                        .sort-btn.active {
                            background: #9633eb;
                            color: white;
                        }
                        
                        /* Enhanced Status Tabs */
                        .status-tabs {
                            display: flex;
                            gap: 12px;
                            margin-bottom: 32px;
                            overflow-x: auto;
                            padding: 8px 0;
                            border-bottom: 2px solid #f8f9fa;
                        }
                        
                        .tab-button {
                            padding: 12px 20px;
                            border-radius: 25px;
                            border: 2px solid #e9ecef;
                            background: white;
                            color: #6c757d;
                            cursor: pointer;
                            font-weight: 600;
                            white-space: nowrap;
                            position: relative;
                            transition: all 0.3s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                        
                        .tab-button:hover {
                            border-color: #9633eb;
                            color: #9633eb;
                            transform: translateY(-1px);
                        }
                        
                        .tab-button.active {
                            background: linear-gradient(135deg, #9633eb 0%, #7a29c0 100%);
                            color: white;
                            border-color: #9633eb;
                            box-shadow: 0 4px 15px rgba(150, 51, 235, 0.3);
                        }
                        
                        .tab-count {
                            background: rgba(255, 255, 255, 0.2);
                            padding: 2px 8px;
                            border-radius: 12px;
                            font-size: 12px;
                            font-weight: 700;
                        }
                        
                        .new-bids-badge {
                            position: absolute;
                            top: -8px;
                            right: -8px;
                            background: #ec4899;
                            color: white;
                            border-radius: 50%;
                            padding: 4px 8px;
                            font-size: 11px;
                            font-weight: bold;
                            min-width: 20px;
                            text-align: center;
                        }
                        
                        /* Responsive Design */
                        @media (max-width: 1024px) {
                            .bids-header {
                                flex-direction: column;
                                gap: 24px;
                            }
                            
                            .bids-overview {
                                text-align: left;
                            }
                            
                            .request-meta {
                                gap: 16px;
                            }
                        }
                        
                        @media (max-width: 768px) {
                            .request-details {
                                grid-template-columns: 1fr;
                            }
                            
                            .request-header {
                                flex-direction: column;
                                gap: 16px;
                            }
                            
                            .request-actions {
                                justify-content: center;
                            }
                        }
                        
                        /* Animation for new bids */
                        @keyframes pulse {
                            0% { transform: scale(1); }
                            50% { transform: scale(1.05); }
                            100% { transform: scale(1); }
                        }
                        
                        .new-bids-badge {
                            animation: pulse 2s infinite;
                        }
                        
                        /* Enhanced focus states for accessibility */
                        .request-card:focus,
                        .action-btn:focus,
                        .tab-button:focus,
                        .sort-btn:focus {
                            outline: 2px solid #9633eb;
                            outline-offset: 2px;
                        }
                        
                        /* Loading states */
                        .skeleton-request-card {
                            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                            background-size: 200% 100%;
                            animation: loading 1.5s infinite;
                        }
                        
                        @keyframes loading {
                            0% { background-position: 200% 0; }
                            100% { background-position: -200% 0; }
                        }
                        
                        /* Empty State Styling */
                        .empty-state {
                            text-align: center;
                            padding: 60px 20px;
                            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                            border-radius: 20px;
                            margin: 40px 0;
                            border: 2px dashed #dee2e6;
                        }
                        
                        .empty-state-icon {
                            width: 80px;
                            height: 80px;
                            background: linear-gradient(135deg, #9633eb 0%, #7a29c0 100%);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 24px;
                            color: white;
                            font-size: 32px;
                        }
                        
                        .empty-state-title {
                            font-size: 28px;
                            font-weight: 700;
                            color: #2c3e50;
                            margin: 0 0 16px 0;
                        }
                        
                        .empty-state-description {
                            font-size: 16px;
                            color: #6c757d;
                            margin: 0 0 32px 0;
                            max-width: 500px;
                            margin-left: auto;
                            margin-right: auto;
                        }
                        
                        .empty-state-features {
                            display: flex;
                            flex-direction: column;
                            gap: 12px;
                            margin-bottom: 32px;
                            max-width: 400px;
                            margin-left: auto;
                            margin-right: auto;
                        }
                        
                        .feature-item {
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            color: #495057;
                            font-size: 14px;
                        }
                        
                        .feature-item i {
                            color: #28a745;
                            font-size: 16px;
                        }
                        
                        .empty-state-cta {
                            padding: 16px 32px;
                            font-size: 18px;
                            font-weight: 700;
                            background: linear-gradient(135deg, #9633eb 0%, #7a29c0 100%);
                            color: white;
                            border: none;
                            border-radius: 50px;
                            cursor: pointer;
                            display: inline-flex;
                            align-items: center;
                            gap: 12px;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 15px rgba(150, 51, 235, 0.3);
                        }
                        
                        .empty-state-cta:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 8px 25px rgba(150, 51, 235, 0.4);
                        }
                        
                        /* Enhanced Mobile Experience */
                        .mobile-bids-view {
                            background: white;
                            border-radius: 20px 20px 0 0;
                            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
                        }
                        
                        .mobile-bids-header {
                            padding: 24px;
                            border-bottom: 2px solid #f8f9fa;
                            background: linear-gradient(135deg, #f8f5ff 0%, #f0ebff 100%);
                        }
                        
                        .mobile-back-button {
                            background: none;
                            border: none;
                            color: #9633eb;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            margin-bottom: 16px;
                            padding: 0;
                        }
                        
                        .mobile-bids-title {
                            font-size: 24px;
                            font-weight: 700;
                            color: #2c3e50;
                            margin: 0;
                        }
                        
                        /* Quick Actions Bar */
                        .quick-actions {
                            display: flex;
                            gap: 12px;
                            margin-bottom: 24px;
                            padding: 16px;
                            background: #f8f9fa;
                            border-radius: 16px;
                            border: 1px solid #e9ecef;
                        }
                        
                        .quick-action-btn {
                            padding: 8px 16px;
                            border-radius: 20px;
                            border: 1px solid #dee2e6;
                            background: white;
                            color: #495057;
                            cursor: pointer;
                            font-size: 13px;
                            font-weight: 500;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        }
                        
                        .quick-action-btn:hover {
                            border-color: #9633eb;
                            color: #9633eb;
                            background: #f8f5ff;
                        }
                        
                        .quick-action-btn.active {
                            background: #9633eb;
                            color: white;
                            border-color: #9633eb;
                        }
                        
                        .quick-actions-divider {
                            width: 1px;
                            height: 24px;
                            background: #dee2e6;
                            margin: 0 8px;
                        }
                        
                        /* Enhanced Request List Layout */
                        .requests-list-bids-page {
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                            gap: 24px;
                            margin-top: 24px;
                        }
                        
                        @media (max-width: 768px) {
                            .requests-list-bids-page {
                                grid-template-columns: 1fr;
                                gap: 16px;
                            }
                        }
                        
                        /* Enhanced Loading States */
                        .skeleton-request-card {
                            background: white;
                            border: 1px solid #e9ecef;
                            border-radius: 16px;
                            padding: 24px;
                            margin-bottom: 20px;
                        }
                        
                        .skeleton-category-icon {
                            width: 60px;
                            height: 60px;
                            background: #e9ecef;
                            border-radius: 16px;
                            animation: pulse 1.5s infinite;
                        }
                        
                        .skeleton-category-name {
                            width: 120px;
                            height: 20px;
                            background: #e9ecef;
                            border-radius: 4px;
                            margin-bottom: 8px;
                            animation: pulse 1.5s infinite;
                        }
                        
                        .skeleton-status-badge {
                            width: 60px;
                            height: 16px;
                            background: #e9ecef;
                            border-radius: 20px;
                            animation: pulse 1.5s infinite;
                        }
                        
                        .skeleton-action-btn {
                            width: 40px;
                            height: 40px;
                            background: #e9ecef;
                            border-radius: 12px;
                            animation: pulse 1.5s infinite;
                        }
                        
                        .skeleton-detail-icon {
                            width: 20px;
                            height: 20px;
                            background: #e9ecef;
                            border-radius: 4px;
                            animation: pulse 1.5s infinite;
                        }
                        
                        .skeleton-detail-label {
                            width: 60px;
                            height: 16px;
                            background: #e9ecef;
                            border-radius: 4px;
                            animation: pulse 1.5s infinite;
                        }
                        
                        .skeleton-detail-value {
                            width: 80px;
                            height: 16px;
                            background: #e9ecef;
                            border-radius: 4px;
                            animation: pulse 1.5s infinite;
                        }
                    `}
                </style>
                
                {requests.length > 0 ? (
                    <div className="requests-list-container">
                        <div className="requests-header">
                            <h2 className="requests-title">Your Service Requests</h2>
                            <p className="requests-subtitle">
                                Select a request to view and manage bids from vendors
                            </p>
                            
                            {/* Quick Actions Bar */}
                            <div className="quick-actions" style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'10px'}}>
                                <button 
                                    className="quick-action-btn"
                                    onClick={() => navigate('/request-categories')}
                                    title="Create New Request"
                                >
                                    <i className="fas fa-plus"></i>
                                    New Request
                                </button>
                                <button 
                                    className="quick-action-btn"
                                    onClick={() => window.location.reload()}
                                    title="Refresh Page"
                                >
                                    <i className="fas fa-sync-alt"></i>
                                    Refresh
                                </button>
                            </div>
                        </div>
                        <div className="requests-list-bids-page">
                            {requests.map((request, index) => renderRequestCard(request, index))}
                        </div>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <i className="fas fa-clipboard-list"></i>
                        </div>
                        <h3 className="empty-state-title">No Active Requests Yet</h3>
                        <p className="empty-state-description">
                            Start your journey by creating your first service request. 
                            Get matched with the perfect vendors for your event!
                        </p>
                        <div className="empty-state-features">
                            <div className="feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Get multiple quotes from verified vendors</span>
                            </div>
                            <div className="feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Compare prices and services easily</span>
                            </div>
                            <div className="feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Secure payment processing</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/request-categories')}
                            className="empty-state-cta"
                        >
                            <i className="fas fa-plus"></i>
                            Create Your First Request
                        </button>
                    </div>
                )}

                {/* Desktop bids section */}
                {window.innerWidth > 1024 && currentRequestIndex >= 0 && renderBidsSection()}

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
                        maxWidth: '600px',
                        margin: '0 auto',
                        overflowY: 'auto',
                        height: window.innerWidth > 1024 ? 'auto' : '80vh',
                        marginBottom: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap:'2px'
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
                                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-comments" style={{ color: '#9633eb' }}></i>
                                    The business will be able to contact you through Bidi's messenger to discuss service details.
                                </li>
                            </ul>

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

            {/* Edit Request Modal */}
            {isEditModalOpen && editRequestData && (
                <RequestModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditRequestData(null);
                    }}
                    selectedVendors={editRequestData.selectedVendors}
                    searchFormData={editRequestData.searchFormData}
                    isEditMode={editRequestData.isEditMode}
                    existingRequestData={editRequestData.existingRequestData}
                />
            )}

            {/* Bid Detail Modal - Rendered at top level to overlay entire page */}
            {showBidDetailModal && selectedBidForDetail && (
                <BidDetailModal
                    isOpen={showBidDetailModal}
                    onClose={handleCloseBidDetail}
                    bid={selectedBidForDetail}
                    currentUserId={currentUserId}
                    onPayClick={() => handlePayNow(selectedBidForDetail)}
                    onMessageClick={() => {
                        handleCloseBidDetail();
                        handleOpenBidMessaging(selectedBidForDetail);
                    }}
                    onConsultationClick={() => {
                        handleCloseBidDetail();
                        // Handle consultation scheduling
                    }}
                    onApprove={(bidId) => handleAcceptBidClick(selectedBidForDetail)}
                    onDeny={(bidId) => handleMoveToNotInterested(selectedBidForDetail)}
                    showActions={!selectedBidForDetail.isExpired}
                    onOpenPortfolio={handleOpenPortfolio}
                />
            )}

            {/* Bid Messaging Modal from Detail - Rendered at top level to overlay entire page */}
            {showBidMessagingFromDetail && selectedBidForMessagingFromDetail && (
                <BidMessaging
                    bid={selectedBidForMessagingFromDetail}
                    currentUserId={currentUserId}
                    onClose={handleCloseBidMessaging}
                    isOpen={showBidMessagingFromDetail}
                    businessName={selectedBidForMessagingFromDetail.business_profiles?.business_name}
                    profileImage={selectedBidForMessagingFromDetail.business_profiles?.profile_image || '/images/default.jpg'}
                />
            )}

            {/* Bid Messaging Modal from List - Rendered at top level to overlay entire page */}
            {showBidMessagingFromList && selectedBidForMessagingFromList && (
                <BidMessaging
                    bid={selectedBidForMessagingFromList}
                    currentUserId={currentUserId}
                    onClose={handleCloseBidMessagingFromList}
                    isOpen={showBidMessagingFromList}
                    businessName={selectedBidForMessagingFromList.business_profiles?.business_name}
                    profileImage={selectedBidForMessagingFromList.business_profiles?.profile_image || '/images/default.jpg'}
                />
            )}

            {/* Portfolio Modal - Rendered at top level to overlay entire page */}
            {showPortfolioModal && selectedBusinessForPortfolio && (
                <PortfolioModal
                    isOpen={showPortfolioModal}
                    onClose={handleClosePortfolio}
                    businessId={selectedBusinessForPortfolio.id}
                    businessName={selectedBusinessForPortfolio.business_name}
                    onOpenGallery={handleOpenGallery}
                />
            )}

            {/* Gallery Modal - Rendered at top level to overlay entire page */}
            {showGalleryModal && selectedBusinessForGallery && (
                <GalleryModal
                    isOpen={showGalleryModal}
                    onClose={handleCloseGallery}
                    businessId={selectedBusinessForGallery.id}
                    businessName={selectedBusinessForGallery.business_name}
                    onBackToPortfolio={handleBackToPortfolio}
                />
            )}
            
            {/* Payment Modal - Rendered at top level to overlay entire page */}
            {showPaymentModal && selectedBidForPayment && (
                <div className="payment-modal-overlay" onClick={handleClosePaymentModal}>
                    <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="payment-modal-header">
                            <h3>Payment Options</h3>
                            <button 
                                className="payment-modal-close"
                                onClick={handleClosePaymentModal}
                            >
                                ×
                            </button>
                        </div>
                        <div className="payment-modal-content">
                            <div className="payment-options">
                                {selectedBidForPayment.business_profiles?.amount && selectedBidForPayment.business_profiles?.down_payment_type ? (
                                    <>
                                        <div className="payment-option">
                                            <h4>Down Payment</h4>
                                            <p className="payment-amount">
                                                {selectedBidForPayment.business_profiles.down_payment_type === 'percentage' 
                                                    ? `${selectedBidForPayment.business_profiles.amount*100}% ($${calculateDownPayment(selectedBidForPayment)?.amount?.toFixed(2) || '0.00'})`
                                                    : `$${selectedBidForPayment.business_profiles.amount || '0.00'}`
                                                }
                                            </p>
                                            <p className="payment-description">
                                                Secure your booking with a partial payment
                                            </p>
                                            <button 
                                                className="payment-option-btn primary"
                                                onClick={() => {
                                                    toast.info('Preparing payment...');
                                                    handleDownPayNow(selectedBidForPayment);
                                                    handleClosePaymentModal();
                                                }}
                                            >
                                                Pay Down Payment
                                            </button>
                                        </div>
                                        <div className="payment-option">
                                            <h4>Full Payment</h4>
                                            <p className="payment-amount">${selectedBidForPayment.bid_amount}</p>
                                            <p className="payment-description">Pay the complete amount upfront</p>
                                            <button 
                                                className="payment-option-btn success"
                                                onClick={() => {
                                                    toast.info('Preparing payment...');
                                                    handlePayNow(selectedBidForPayment);
                                                    handleClosePaymentModal();
                                                }}
                                            >
                                                Pay Full Amount
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="payment-option">
                                        <h4>Full Payment</h4>
                                        <p className="payment-amount">${selectedBidForPayment.bid_amount}</p>
                                        <p className="payment-description">Complete payment for this service</p>
                                        <button 
                                            className="payment-option-btn success"
                                            onClick={() => {
                                                toast.info('Preparing payment...');
                                                handlePayNow(selectedBidForPayment);
                                                handleClosePaymentModal();
                                            }}
                                        >
                                            Pay Now
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="payment-modal-actions">
                            <button 
                                className="cancel-btn"
                                onClick={handleClosePaymentModal}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
