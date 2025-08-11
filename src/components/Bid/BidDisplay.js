import React, { useState, useRef, useEffect } from "react";
import { toast } from 'react-toastify';
import { supabase } from "../../supabaseClient";
import { socket } from "../../socket";
import StarIcon from "../../assets/star-duotone.svg";
import Verified from "../../assets/Frame 1162.svg";
import { Link, useNavigate } from "react-router-dom";
import { FiStar } from "react-icons/fi";
import "./BidDisplay.css";
import "../../styles/chat.css";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { FaCreditCard, FaPlus, FaTrash, FaArrowLeft, FaTimes } from "react-icons/fa";
import ConsultationModal from '../Consultation/ConsultationModal';
import ContractSignatureModal from './ContractSignatureModal';
import { colors } from "../../config/theme";

function BidDisplay({ 
  bid, 
  currentUserId, 
  isNew = false,
  showActions = true,
  handleApprove,
  handleDeny,
  handlePending,
  showPending = false,
  showApproved = false,
  showExpired = false,
  showPaymentOptions = false,
  isCalendarConnected = false,
  stripeAccountId = null,
  // Mobile-specific props
  isMobile = false,
  onMobileBack = null,
  mobileViewMode = 'list', // 'list' or 'detail'
  hideMobileHeader = false, // New prop to hide mobile header from BidsPage
  onMobileModalToggle = null, // Callback to notify parent of modal state changes
  onOpenBidDetail = null, // Callback to open bid detail modal at parent level
  onOpenBidMessaging = null, // Callback to open bid messaging modal at parent level
  onOpenPortfolio = null // Callback to open portfolio modal at parent level
}) {
  const navigate = useNavigate();
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [modalLineItems, setModalLineItems] = useState([{ id: 1, description: '', quantity: 1, rate: 0, amount: 0 }]);
  const [modalTaxRate, setModalTaxRate] = useState(0);
  const [useTemplate, setUseTemplate] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);
  
  // Mobile state
  const [mobileDetailView, setMobileDetailView] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  
  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState("");
  
  // Description expansion state removed - now opens messaging modal

  const {
    business_profiles,
    bid_amount,
    bid_description: description,
    status,
    created_at,
    payment_type,
    payment_amount,
    down_payment,
    tax_rate,
    line_items
  } = bid;

  // Detect mobile device
  const isMobileDevice = () => {
    return window.innerWidth <= 768 || isMobile;
  };

  // Handle row click to open bid detail modal
  const handleRowClick = () => {
    if (onOpenBidDetail) {
      onOpenBidDetail(bid);
    }
  };

  // Handle mobile back navigation
  const handleMobileBack = () => {
    handleMobileModalClose();
  };

  // Chat expansion now handled by BidMessaging component

  // Enhanced modal close handler
  const handleModalClose = () => {
    setShowPaymentModal(false);
    setShowImageModal(false);
    setShowConsultationModal(false);
    setShowContractModal(false);
    // Restore body scroll
    document.body.style.overflow = 'auto';
  };

  // Handle escape key and click outside for mobile
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleModalClose();
        if (mobileDetailView) {
          setMobileDetailView(false);
          document.body.style.overflow = 'auto';
        }
      }
    };

    const handleClickOutside = (e) => {
      if (isMobileDevice() && mobileDetailView) {
        // On mobile, only close if clicking on the overlay
        if (e.target.classList.contains('mobile-bid-detail-view')) {
          setMobileDetailView(false);
          document.body.style.overflow = 'auto';
        }
      }
    };

    if (mobileDetailView) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mobileDetailView]);

  // Cleanup body scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Load reviews when component mounts
  useEffect(() => {
    console.log('useEffect triggered - business_profiles:', business_profiles);
    if (business_profiles?.id) {
      console.log('Business profile ID found:', business_profiles.id);
      console.log('Business is_verified status:', business_profiles.is_verified);
      console.log('Business is_verified type:', typeof business_profiles.is_verified);
      console.log('Full business_profiles object:', business_profiles);
      loadReviews();
    } else {
      console.log('No business profile ID found, cannot load reviews');
      console.log('Full business_profiles object:', business_profiles);
    }
  }, [business_profiles?.id]);

  // Refresh reviews when mobile detail view opens
  useEffect(() => {
    if (mobileDetailView && business_profiles?.id) {
      loadReviews();
    }
  }, [mobileDetailView, business_profiles?.id]);

  // Load reviews from database
  const loadReviews = async () => {
    if (!business_profiles?.id) return;
    
    setIsLoadingReviews(true);
    try {
      console.log('Loading reviews for vendor:', business_profiles.id);
      console.log('Business profile data:', business_profiles);
      
      // First, let's check what's in the reviews table without filters
      const { data: allReviews, error: allError } = await supabase
        .from('reviews')
        .select('*')
        .limit(10);
      
      if (allError) {
        console.error('Error loading all reviews:', allError);
      } else {
        console.log('Sample of all reviews in table:', allReviews);
      }
      
      // Now try the specific vendor query
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('vendor_id', business_profiles.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading vendor reviews:', error);
        toast.error('Failed to load reviews');
        return;
      }

      console.log('Vendor-specific reviews loaded:', reviewsData);
      
      // If no reviews found with vendor_id, try alternative approaches
      if (!reviewsData || reviewsData.length === 0) {
        console.log('No reviews found with vendor_id, trying alternative queries...');
        
        // Try without is_approved filter first
        const { data: reviewsWithoutApproval, error: error2 } = await supabase
          .from('reviews')
          .select('*')
          .eq('vendor_id', business_profiles.id);
        
        if (error2) {
          console.error('Error loading reviews without approval filter:', error2);
        } else {
          console.log('Reviews without approval filter:', reviewsWithoutApproval);
        }
        
        // Try with business_name as alternative identifier
        if (business_profiles.business_name) {
          const { data: reviewsByName, error: error3 } = await supabase
            .from('reviews')
            .select('*')
            .ilike('comment', `%${business_profiles.business_name}%`);
          
          if (error3) {
            console.error('Error searching reviews by business name:', error3);
          } else {
            console.log('Reviews found by business name:', reviewsByName);
          }
        }
        
        // Check if there are any reviews at all and what vendor_ids they have
        const { data: allVendorIds, error: vendorError } = await supabase
          .from('reviews')
          .select('vendor_id')
          .not('vendor_id', 'is', null);
        
        if (vendorError) {
          console.error('Error getting vendor IDs:', vendorError);
        } else {
          console.log('All vendor_ids in reviews table:', allVendorIds);
          const uniqueVendorIds = [...new Set(allVendorIds.map(r => r.vendor_id))];
          console.log('Unique vendor_ids:', uniqueVendorIds);
          console.log('Looking for business_profiles.id:', business_profiles.id);
          console.log('Type of business_profiles.id:', typeof business_profiles.id);
          console.log('Is business_profiles.id in unique vendor_ids?', uniqueVendorIds.includes(business_profiles.id));
        }
      }
      
      setReviews(reviewsData || []);
      
      // Calculate average rating
      if (reviewsData && reviewsData.length > 0) {
        const validReviews = reviewsData.filter(review => {
          const rating = review.review_rating || review.rating || 0;
          return parseFloat(rating) > 0;
        });
        
        console.log('Valid reviews for rating calculation:', validReviews);
        
        if (validReviews.length > 0) {
          const totalRating = validReviews.reduce((sum, review) => {
            const rating = review.review_rating || review.rating || 0;
            return sum + parseFloat(rating);
          }, 0);
          
          const avgRating = totalRating / validReviews.length;
          const roundedRating = Math.round(avgRating * 10) / 10;
          setAverageRating(roundedRating);
          setReviewCount(validReviews.length);
          console.log('Calculated rating:', roundedRating, 'from', validReviews.length, 'reviews');
        } else {
          setAverageRating(0);
          setReviewCount(0);
          console.log('No valid reviews found for rating calculation');
        }
      } else {
        setAverageRating(0);
        setReviewCount(0);
        console.log('No reviews data found');
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Refresh reviews manually
  const refreshReviews = () => {
    loadReviews();
  };

  // Debug function to check database schema
  const debugDatabaseSchema = async () => {
    try {
      console.log('=== DATABASE SCHEMA DEBUG ===');
      
      // Check reviews table structure
      const { data: reviewsSample, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .limit(5);
      
      if (reviewsError) {
        console.error('Error accessing reviews table:', reviewsError);
      } else {
        console.log('Reviews table sample data:', reviewsSample);
        if (reviewsSample && reviewsSample.length > 0) {
          console.log('Reviews table columns:', Object.keys(reviewsSample[0]));
        }
      }
      
      // Check business_profiles table structure
      const { data: businessSample, error: businessError } = await supabase
        .from('business_profiles')
        .select('*')
        .limit(5);
      
      if (businessError) {
        console.error('Error accessing business_profiles table:', businessError);
      } else {
        console.log('Business profiles table sample data:', businessSample);
        if (businessSample && businessSample.length > 0) {
          console.log('Business profiles table columns:', Object.keys(businessSample[0]));
        }
      }
      
      console.log('=== END DEBUG ===');
    } catch (error) {
      console.error('Error in debug function:', error);
    }
  };

  // Removed socket connection - now handled by BidMessaging component

  // Signature state for client
  const [clientSignature, setClientSignature] = useState(null);
  const [clientSigning, setClientSigning] = useState(false);
  const [clientSignError, setClientSignError] = useState(null);
  const [clientSigned, setClientSigned] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  const [signaturePos, setSignaturePos] = useState({ x: 0, y: 0 });
  const [pdfData, setPdfData] = useState(null);
  const [placingSignature, setPlacingSignature] = useState(false);
  const pdfWrapperRef = useRef(null);

  // State to track if down payment has been made
  const [downPaymentMade, setDownPaymentMade] = useState(false);
  const [downPaymentAmount, setDownPaymentAmount] = useState(0);

  // Check if down payment has been made
  useEffect(() => {
    const checkDownPaymentStatus = async () => {
      if (!bid.id || !business_profiles?.amount) return;
      
      try {
        // Check if there's a payment record for this bid
        const { data: paymentRecords, error } = await supabase
          .from('bids')
          .select('down_payment, payment_paid_at, remaining')
          .eq('id', bid.id);
        
        if (error) {
          console.error('Error checking payment status:', error);
          return;
        }
        
        if (paymentRecords && paymentRecords.length > 0) {
          const record = paymentRecords[0];
          if (record.down_payment && record.payment_paid_at) {
            setDownPaymentMade(true);
            setDownPaymentAmount(parseFloat(record.down_payment) || 0);
          }
        }
      } catch (error) {
        console.error('Error checking down payment status:', error);
      }
    };
    
    checkDownPaymentStatus();
  }, [bid.id, business_profiles?.amount]);

  // Get profile image
  const profileImage = business_profiles?.profile_image || 'https://via.placeholder.com/60x60?text=Profile';

  // Calculate time since bid was created
  const getTimeSinceCreated = () => {
    const now = new Date();
    const created = new Date(created_at);
    const diffInMs = now - created;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getBidStatus = () => {
    if (showExpired) return 'expired';
    if (status === 'denied') return 'denied';
    if (showApproved || status === 'approved' || status === 'accepted' || status === 'interested') return 'approved';
    if (showPaymentOptions) return 'payment';
    if (showPending || status === 'pending') return 'pending';
    return 'default';
  };

  const getDownPaymentAmount = () => {
    if (!business_profiles?.amount || !business_profiles?.down_payment_type) return 0;
    
    if (business_profiles.down_payment_type === 'percentage') {
      // Calculate down payment as percentage of total bid amount
      const percentage = parseFloat(business_profiles.amount*100) || 0;
      const totalBidAmount = parseFloat(bid_amount) || 0;
      return (totalBidAmount * percentage) / 100;
    } else {
      // Fixed amount
      return parseFloat(business_profiles.amount) || 0;
    }
  };

  const getRemainingAmount = () => {
    // Check if business has down payment configured
    if (business_profiles?.amount && business_profiles?.down_payment_type) {
      const totalBidAmount = parseFloat(bid_amount) || 0;
      
      if (downPaymentMade) {
        // If down payment has been made, calculate remaining from actual payment
        return totalBidAmount - downPaymentAmount;
      } else {
        // Show potential remaining amount if no down payment made yet
        const downPaymentAmount = getDownPaymentAmount();
        return totalBidAmount - downPaymentAmount;
      }
    }
    return bid_amount;
  };

  // Phone demo styling components
  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: colors.white,
    borderBottom: `1px solid ${colors.gray?.[200] || '#e5e7eb'}`,
    position: 'sticky',
    top: 0,
    zIndex: 1,
  };

  const Button = ({ children, onClick, variant = 'primary', disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: variant === 'primary' ? colors.primary : (colors.gray?.[200] || '#e5e7eb'),
        color: variant === 'primary' ? colors.white : (colors.gray?.[700] || '#374151'),
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );

  const Section = ({ title, children }) => (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );

  const renderStars = (count) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <FiStar key={i} size={14} color={i < count ? '#fbbf24' : '#d1d5db'} />
      ))}
    </div>
  );

  // Description helper functions
  const shouldTruncateDescription = (description) => {
    if (!description) return false;
    // Strip HTML tags for length calculation
    const textContent = description.replace(/<[^>]*>/g, '');
    return textContent.length > 150; // Truncate after 150 characters
  };

  const getTruncatedDescription = (description) => {
    if (!description) return '';
    // Strip HTML tags for length calculation
    const textContent = description.replace(/<[^>]*>/g, '');
    if (textContent.length <= 150) return description;
    
    // Find the last complete word within 150 characters
    const truncatedText = textContent.substring(0, 150).split(' ').slice(0, -1).join(' ');
    
    // Find the position of this truncated text in the original HTML
    let currentPos = 0;
    let textPos = 0;
    let result = '';
    
    while (currentPos < description.length && textPos < truncatedText.length) {
      if (description[currentPos] === '<') {
        // Skip HTML tag
        while (currentPos < description.length && description[currentPos] !== '>') {
          result += description[currentPos];
          currentPos++;
        }
        if (currentPos < description.length) {
          result += description[currentPos];
          currentPos++;
        }
      } else {
        result += description[currentPos];
        textPos++;
        currentPos++;
      }
    }
    
    return result + '...';
  };

  // Description expansion toggle removed - now opens messaging modal instead

  // Remove the handleRowClick function since we're not using the detail modal anymore

  // Chat history loading now handled by BidMessaging component

  // Message handling now done by BidMessaging component

  // Payment request functions
  const calculateSubtotal = () => {
    return modalLineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() * modalTaxRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const addLineItem = () => {
    const newId = Math.max(...modalLineItems.map(item => item.id), 0) + 1;
    setModalLineItems([...modalLineItems, { id: newId, description: '', quantity: 1, rate: '', amount: 0 }]);
  };

  const removeLineItem = (id) => {
    if (modalLineItems.length > 1) {
      setModalLineItems(modalLineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id, field, value) => {
    setModalLineItems(modalLineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          const quantity = field === 'quantity' ? parseFloat(value) || 0 : item.quantity;
          const rate = field === 'rate' ? parseFloat(value) || 0 : item.rate;
          updatedItem.amount = quantity * rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  // Payment request handling is now done by BidMessaging component

  const handleDenyClick = () => {
    console.log('handleDenyClick called');
    console.log('handleDeny function:', handleDeny);
    console.log('bid.id:', bid.id);
    if (handleDeny) {
      console.log('Calling handleDeny');
      handleDeny(bid.id);
    } else {
      console.log('handleDeny is not defined');
    }
  };

  const handleProfileClick = (e) => {
    e.stopPropagation(); // Prevent row click
    if (onOpenPortfolio) {
      onOpenPortfolio(business_profiles);
    } else {
      navigate(`/portfolio/${business_profiles.id}/${business_profiles.business_name}`);
    }
  };

  const handleMessageClick = (e) => {
    e.stopPropagation(); // Prevent row click
    if (onOpenBidMessaging) {
      onOpenBidMessaging(bid);
    }
  };

  const handleConsultationClick = () => {
    setShowConsultationModal(true);
  };

  const handleContractClick = () => {
    setShowContractModal(true);
  };

  const handlePaymentClick = () => {
    setShowPaymentModal(true);
  };

  const handleHeartClick = () => {
    // Handle heart/favorite click
    console.log('Heart clicked for bid:', bid.id);
  };

  const renderStatusBadge = () => {
    const bidStatus = getBidStatus();
    
    switch (bidStatus) {
      case 'approved':
        return (
          <div className="bid-row-status approved">
            <CheckCircleIcon />
            <span>Approved</span>
          </div>
        );
      case 'pending':
        return (
          <div className="bid-row-status pending">
            <AccessTimeIcon />
            <span>Pending</span>
          </div>
        );
      case 'denied':
        return (
          <div className="bid-row-status denied">
            <CancelIcon />
            <span>Denied</span>
          </div>
        );
      case 'expired':
        return (
          <div className="bid-row-status expired">
            <CancelIcon />
            <span>Expired</span>
          </div>
        );
      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    const bidStatus = getBidStatus();
    
    switch (bidStatus) {
      case 'approved':
        return (
          <div className="bid-row-actions">
            <button
              className="bid-row-btn bid-row-btn-pay"
              onClick={handlePaymentClick}
            >
              Pay
            </button>
            <button
              className="bid-row-btn bid-row-btn-secondary"
              onClick={handleMessageClick}
            >
              <ChatIcon />
            </button>
            {business_profiles?.google_calendar_connected && (
            <button
              className="bid-row-btn bid-row-btn-secondary"
              onClick={handleConsultationClick}
            >
              Schedule Consultation
            </button>
            )}
             <button
              className="bid-row-btn bid-row-btn-secondary"
              onClick={() => handlePending && handlePending(bid.id)}
            >
              Move Back to Pending
            </button>
          </div>
        );
        
      case 'payment':
        return (
          <div className="bid-row-actions">
            <button
              className="bid-row-btn bid-row-btn-pay"
              onClick={handlePaymentClick}
            >
              Pay
            </button>
            <button
              className="bid-row-btn bid-row-btn-secondary"
              onClick={handleMessageClick}
            >
              <ChatIcon />
            </button>
            {business_profiles?.google_calendar_connected && (
            <button
              className="bid-row-btn bid-row-btn-secondary"
              onClick={handleConsultationClick}
            >
              Schedule Consultation
            </button>
            )}
          </div>
        );
        
      case 'pending':
        return (
          <div className="bid-row-actions">
            <button
              className="bid-row-btn bid-row-btn-success"
              onClick={() => handleApprove && handleApprove(bid.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <button
              className="bid-row-btn bid-row-btn-danger"
              onClick={handleDenyClick}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="bid-row-btn bid-row-btn-secondary"
              onClick={handleMessageClick}
            >
              <ChatIcon />
            </button>
            <button className="bid-row-btn bid-row-btn-secondary" onClick={handleProfileClick}>
              View Profile
            </button>
          </div>
        );

      case 'denied':
        return (
          <div className="bid-row-actions">
            <button
              className="bid-row-btn bid-row-btn-secondary"
              onClick={() => handlePending && handlePending(bid.id)}
            >
              Move Back to Pending
            </button>
          </div>
        );
        
      default:
        // For 'interested', 'accepted', or any other status that should show payment options
        if (status === 'interested' || status === 'accepted' || status === 'approved') {
          return (
            <div className="bid-row-actions">
              <button
                className="bid-row-btn bid-row-btn-pay"
                onClick={() => setShowPaymentModal(true)}
              >
                Pay
              </button>
            </div>
          );
        }
        
        return (
          <div className="bid-row-actions">
            <button
              className="bid-row-btn bid-row-btn-secondary"
              onClick={handleMessageClick}
            >
              <ChatIcon />
              
            </button>
            {business_profiles?.google_calendar_connected && (
            <button
              className="bid-row-btn bid-row-btn-primary"
              onClick={handleConsultationClick}
            >
              Schedule Consultation
            </button>
            )}
          </div>
        );
    }
  };

  const renderExpirationInfo = () => {
    if (!showExpired) return null;
    
    return (
      <div className="bid-row-expiration">
        <AccessTimeIcon />
        <span>Bid expired</span>
      </div>
    );
  };



  // Mobile swipe-to-close functionality
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > 50;
    
    if (isUpSwipe && mobileDetailView) {
      // Swipe up to close mobile detail view
      setMobileDetailView(false);
      document.body.style.overflow = 'auto';
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Enhanced mobile modal behavior
  const handleMobileModalOpen = () => {
    if (isMobileDevice()) {
      setMobileDetailView(true);
      document.body.style.overflow = 'hidden';
      // Add touch event listeners for swipe gestures
      const modalElement = document.querySelector('.mobile-bid-detail-view');
      if (modalElement) {
        modalElement.addEventListener('touchstart', handleTouchStart, { passive: true });
        modalElement.addEventListener('touchmove', handleTouchMove, { passive: true });
        modalElement.addEventListener('touchend', handleTouchEnd, { passive: true });
      }
      // Notify parent component that mobile modal is open
      if (onMobileModalToggle) {
        onMobileModalToggle(true);
      }
    }
    // No desktop modal needed anymore
  };

  const handleMobileModalClose = () => {
    if (mobileDetailView) {
      setMobileDetailView(false);
      document.body.style.overflow = 'auto';
      // Remove touch event listeners
      const modalElement = document.querySelector('.mobile-bid-detail-view');
      if (modalElement) {
        modalElement.removeEventListener('touchstart', handleTouchStart);
        modalElement.removeEventListener('touchmove', handleTouchMove);
        modalElement.removeEventListener('touchend', handleTouchEnd);
      }
      // Notify parent component that mobile modal is closed
      if (onMobileModalToggle) {
        onMobileModalToggle(false);
      }
    }
    // No desktop modal to close anymore
  };

  return (
    <>
      {/* Mobile Detail View */}
      {mobileDetailView && (
        <div 
          className="mobile-bid-detail-view"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mobile-bid-detail-header">
            <button className="mobile-back-btn" onClick={handleMobileBack}>
              <FaArrowLeft />
              <span>Back</span>
            </button>
            <h3 className="mobile-bid-detail-title">Bid Details</h3>
            <button className="mobile-close-btn" onClick={handleMobileBack} aria-label="Close">
              <FaTimes />
            </button>
          </div>
          
          <div className="mobile-bid-detail-content">
            {/* Business Profile Section */}
            <div className="mobile-bid-detail-section">
              <div className="mobile-business-profile">
                <img
                  src={profileImage}
                  alt={`${business_profiles.business_name} profile`}
                  className="mobile-business-avatar"
                  onClick={handleProfileClick}
                />
                <div className="mobile-business-info">
                  <h4 className="mobile-business-name">
                    {business_profiles.business_name}
                    {business_profiles.is_verified && (
                      <div className="mobile-verified-badge">
                        <img src={Verified} alt="Verified" />
                        <span>Verified</span>
                      </div>
                    )}
                  </h4>
                  {averageRating > 0 && (
                    <div className="mobile-business-rating">
                      <img src={StarIcon} alt="Star" className="star-icon" />
                      <span>{averageRating} ({reviewCount} reviews)</span>
                    </div>
                  )}
                  <div className="mobile-business-location">{getTimeSinceCreated()}</div>
                </div>
              </div>
            </div>



            {/* Action Buttons */}
            <div className="mobile-bid-detail-section">
              <div className="mobile-action-buttons" style={{display: 'flex', flexDirection: 'row', gap: '10px'}}>
                {getBidStatus() === 'pending' && (
                  <>
                    <button
                      className="mobile-action-btn success"
                      onClick={() => handleApprove && handleApprove(bid.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Approve
                    </button>
                    <button
                      className="mobile-action-btn danger"
                      onClick={handleDenyClick}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Deny
                    </button>
                  </>
                )}

                {getBidStatus() === 'denied' && (
                  <button
                    className="mobile-action-btn secondary"
                    onClick={() => handlePending && handlePending(bid.id)}
                  >
                    Move Back to Pending
                  </button>
                )}
                
                {/* Payment button moved above for better organization */}
                
                {/* Message button - Always show for communication */}
                    <button
                      className="mobile-action-btn primary"
                      onClick={handleMessageClick}
                    >
                      <ChatIcon />
                      
                    </button>

                                {/* Pay button for approved/accepted/interested bids */}
                {(getBidStatus() === 'approved' || status === 'approved' || status === 'accepted' || status === 'interested') && (
                  <button
                    className="mobile-action-btn pay"
                    onClick={handlePaymentClick}
                  >
                    Pay
                  </button>
                )}

                {/* Consultation button for approved bids - only if Google Calendar is connected */}
                {(getBidStatus() === 'approved' || status === 'approved' || status === 'accepted') && business_profiles?.google_calendar_connected && (
                  <button
                    className="mobile-action-btn secondary"
                    onClick={handleConsultationClick}
                  >
                    Schedule Consultation
                  </button>
                )}
              </div>
            </div>
            
            {/* Payment Information - Only show for accepted, approved, or interested bids */}
            {(status === 'accepted' || status === 'approved' || status === 'interested') && business_profiles?.amount && business_profiles?.down_payment_type && (
              <div className="mobile-bid-detail-section">
                <h4 className="mobile-section-title">Payment Information</h4>
                <div className="mobile-payment-details">
                  <div className="mobile-payment-item">
                    <span>Down Payment Required:</span>
                    <span className="mobile-payment-amount">
                      {business_profiles.down_payment_type === 'percentage' 
                        ? `${business_profiles.amount}% ($${getDownPaymentAmount().toFixed(2)})`
                        : `$${business_profiles.amount}`
                      }
                    </span>
                  </div>
                  <div className="mobile-payment-item">
                    <span>Remaining Balance:</span>
                    <span className="mobile-payment-remaining">${getRemainingAmount()}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Chat handled by separate messaging modal */}


                                  </div>
                                  </div>
      )}

      {/* Desktop Bid Row */}
      {!mobileDetailView && (
        <div className="bid-row" onClick={handleRowClick}>
          {/* New Tag */}
          {isNew && (
            <div className="bid-new-tag">
              <span>New</span>
            </div>
          )}
          
          {/* Main Row Content */}
          <div className="bid-row-content">
            {/* Top Row - Business Info + Status & Price */}
            <div className="bid-row-header">
              <div className="bid-row-left">
                <div className="bid-row-profile">
                  <img
                    src={profileImage}
                    alt={`${business_profiles.business_name} profile`}
                    className="bid-row-profile-img"
                    onClick={handleProfileClick}
                  />
                  <div className="bid-row-info">
                    <div className="bid-row-name">
                      {business_profiles.business_name}
                      {business_profiles.is_verified && (
                        <div className="verified-check-container" style={{ display: 'inline-block', marginLeft: '8px', position:'unset'}}>
                          <img src={Verified} alt="Verified" style={{ width: '16px', height: '16px', marginBottom: '4px' }} />
                          <span className="verified-tooltip">
                            This business is verified by Bidi. You will have a 100% money back guarantee if you pay through Bidi.
                          </span>
                        </div>
                      )}
                    </div>
                    {averageRating > 0 && (
                      <div className="bid-row-rating">
                        <img src={StarIcon} alt="Star" className="star-icon" />
                        <span>
                          {isLoadingReviews ? (
                            <span style={{ color: '#9ca3af' }}>Loading...</span>
                          ) : (
                            `${averageRating} (${reviewCount} review${reviewCount !== 1 ? 's' : ''})`
                          )}
                        </span>
                      </div>
                    )}
                    <div className="bid-row-time">{getTimeSinceCreated()}</div>
                  </div>
                </div>
              </div>
              
              {/* Right side - Status and pricing in top right */}
              <div className="bid-row-right-mobile">
                <div className="bid-row-status-section">
                  {renderStatusBadge()}
                  {renderExpirationInfo()}
                </div>
                
                <div className="bid-row-price">
                  <span className="price-amount">${bid_amount}</span>
                  {tax_rate > 0 && (
                    <span className="tax-info">+ {tax_rate}% tax</span>
                  )}
                </div>
              </div>
            </div>

            {/* Description Row */}
            <div className="bid-row-description">
              {description ? (
                <div>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: shouldTruncateDescription(description) 
                        ? getTruncatedDescription(description) 
                        : description 
                    }}
                    style={{ 
                      lineHeight: '1.4',
                      fontSize: '14px'
                    }}
                  />
                  {shouldTruncateDescription(description) && (
                    <button 
                      className="description-toggle-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMessageClick(e);
                      }}
                    >
                      View more
                    </button>
                  )}
                </div>
              ) : (
                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  No description provided
                </span>
              )}
            </div>

            {/* Action Buttons */}
            {showActions && (
              <div className="bid-row-actions">
                {renderActionButtons()}
              </div>
            )}
          </div>
                        </div>
                      )}







      {/* Other Modals */}
      {showConsultationModal && (
        <ConsultationModal
          isOpen={showConsultationModal}
          onClose={() => setShowConsultationModal(false)}
          bid={bid}
        />
      )}
      
      {showContractModal && (
        <ContractSignatureModal
          isOpen={showContractModal}
          onClose={() => setShowContractModal(false)}
          bid={bid}
          currentUserId={currentUserId}
        />
      )}
      
      {/* Enhanced Payment Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay" onClick={handleModalClose}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-header">
              <h3>Payment Options</h3>
              <button 
                className="payment-modal-close"
                onClick={handleModalClose}
              >
                ×
              </button>
            </div>
            <div className="payment-modal-content">
              <div className="payment-options">
                {business_profiles?.amount && business_profiles?.down_payment_type ? (
                  <>
                                 <div className="payment-option">
               <h4>Down Payment</h4>
               <p className="payment-amount">
                 {business_profiles.down_payment_type === 'percentage' 
                   ? `${business_profiles.amount*100}% ($${getDownPaymentAmount().toFixed(2)})`
                   : `$${business_profiles.amount}`
                 }
               </p>
               <p className="payment-description">
                 {downPaymentMade
                   ? "Down payment has already been made"
                   : "Secure your booking with a partial payment"
                 }
               </p>
                      <button 
                        className="payment-option-btn primary"
                        style={{backgroundColor: '#9633eb'}}
                        disabled={downPaymentMade}
                        onClick={() => {
                          if (!downPaymentMade) {
                            toast.info(`Processing down payment of ${business_profiles.down_payment_type === 'percentage' 
                              ? `${business_profiles.amount}% ($${getDownPaymentAmount().toFixed(2)})`
                              : `$${business_profiles.amount}`
                            }...`);
                            setShowPaymentModal(false);
                          }
                        }}
                      >
                        {downPaymentMade ? "Already Paid" : "Pay Down Payment"}
                      </button>
                    </div>
                    <div className="payment-option">
                      <h4>Full Payment</h4>
                      <p className="payment-amount">${bid_amount}</p>
                      <p className="payment-description">Pay the complete amount upfront</p>
                      <button 
                        className="payment-option-btn success"
                        style={{backgroundColor: '#ec4899'}}
                        onClick={() => {
                          toast.info(`Processing full payment of $${bid_amount}...`);
                          setShowPaymentModal(false);
                        }}
                      >
                        Pay Full Amount
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="payment-option">
                    <h4>Full Payment</h4>
                    <p className="payment-amount">${bid_amount}</p>
                    <p className="payment-description">Complete payment for this service</p>
                    <button 
                      className="payment-option-btn success"
                      onClick={() => {
                        toast.info(`Processing payment of $${bid_amount}...`);
                        setShowPaymentModal(false);
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
                onClick={handleModalClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="image-modal-overlay" onClick={handleModalClose}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <button 
                className="image-modal-close"
                onClick={handleModalClose}
              >
                <FaTimes />
              </button>
            </div>
            <img 
              src={modalImageSrc} 
              alt="Full size" 
              className="image-modal-content"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default BidDisplay;
