import React, { useEffect, useState, useRef } from "react";
import { toast } from 'react-toastify';
import { supabase } from "../../supabaseClient"; // Import your Supabase client
import { socket } from '../../socket';
import bidiCheck from "../../assets/Frame 1162.svg";
import StarIcon from "../../assets/star-duotone.svg";
import { Link, useNavigate } from "react-router-dom";
import "./BidDisplay.css";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import MessagingView from "../Messaging/MessagingView";
import { FaArrowLeft } from 'react-icons/fa';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ConsultationModal from '../Consultation/ConsultationModal';
import { useConsultation } from '../../hooks/useConsultation';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import ContractSignatureModal from "./ContractSignatureModal";
import CloseIcon from '@mui/icons-material/Close';
import ChatInterface from '../Messaging/ChatInterface';
import BidMessaging from './BidMessaging';
import ReactDOM from 'react-dom';
import { formatMessageText } from '../../utils/formatMessageText';
import { FaCreditCard, FaPlus, FaTrash } from 'react-icons/fa';
import PaymentCard from '../Messaging/PaymentCard';
// Set the workerSrc for pdfjs to use the local public directory for compatibility
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.js`;

function BidDisplay({ 
  bid, 
  handleApprove, 
  handleDeny, 
  handleInterested,
  handlePending,
  showActions = true,
  showPaymentOptions = false,
  showReopen = false,
  showInterested = false,
  showNotInterested = false,
  showPending = false,
  showApproved = false,
  showExpired = false,
  downPayment = null,
  onDownPayment = null,
  onMessage = null,
  onViewCoupon = null,
  currentUserId = null,
  onScheduleConsultation = null,
  onPayNow = null,
  onMoveToPending = null,
  onProfileClick = null,
  isNew = false,
  demoMode = false,
  ...props
}) {
  const [isBidiVerified, setIsBidiVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(null);
  const [showBubble, setShowBubble] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showVerifiedTooltip, setShowVerifiedTooltip] = useState(false);
  const [showMessagingView, setShowMessagingView] = useState(false);
  const [showCouponDetails, setShowCouponDetails] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showShareCouponModal, setShowShareCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [activeSection, setActiveSection] = useState("messages");
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const frontRef = useRef(null);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const backRef = useRef(null);
  const [cardHeight, setCardHeight] = useState('auto');
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [useTemplate, setUseTemplate] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);

  const [bidMessages, setBidMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [expandedPreviewMessages, setExpandedPreviewMessages] = useState(new Set());
  const [newMessage, setNewMessage] = useState('');
  const [showBidMessaging, setShowBidMessaging] = useState(false);
  const [showConversation, setShowConversation] = useState(true);
  
  // Payment request state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState(null);
  const [isCurrentUserBusiness, setIsCurrentUserBusiness] = useState(false);
  const [modalLineItems, setModalLineItems] = useState([
    { id: 1, description: '', quantity: 1, rate: '', amount: 0 }
  ]);
  const [modalTaxRate, setModalTaxRate] = useState(0);
  
  // Image upload state
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  
  // Get the other user's ID (the one we're chatting with)
  const otherUserId = currentUserId === bid.user_id ? bid.business_profiles?.id : bid.user_id;
  
  const {
    selectedDate,
    selectedTimeSlot,
    availableTimeSlots,
    isLoading: isConsultationLoading,
    error: consultationError,
    handleDateSelect,
    handleTimeSlotSelect,
    fetchTimeSlots,
    scheduleConsultation
  } = useConsultation();

  // Signature state for client
  const [clientSignature, setClientSignature] = useState("");
  const [clientSigning, setClientSigning] = useState(false);
  const [clientSignError, setClientSignError] = useState("");
  const [clientSigned, setClientSigned] = useState(!!bid.client_signature);

  // PDF signature placement state
  const [pdfPage, setPdfPage] = useState(1);
  const [signaturePos, setSignaturePos] = useState(null); // {x, y}
  const [placingSignature, setPlacingSignature] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const pdfWrapperRef = useRef(null);

  const [lastViewedAt, setLastViewedAt] = useState(null);
  const [showEditNotification, setShowEditNotification] = useState(false);
  const [showViewContractButton, setShowViewContractButton] = useState(false);

  // Determine bid status based on props and heart state
  const getBidStatus = () => {
    console.log('getBidStatus called with:', {
      showExpired,
      showApproved,
      bidStatus: bid.status,
      showPaymentOptions,
      showInterested,
      showPending
    });
    
    if (bid.status === 'paid') {
      return bid.payment_type === 'down_payment' ? 'down_payment_paid' : 'paid';
    }
    if (showExpired) return 'expired';
    if (showApproved || bid.status === 'approved' || bid.status === 'accepted') return 'approved';
    if (showPaymentOptions) return 'payment';
    if (showInterested) return 'interested';
    if (showPending) return 'pending';
    return 'default';
  };

  // Calculate remaining amount if this was a down payment
  const getRemainingAmount = () => {
    if (bid.status === 'paid' && bid.payment_type === 'down_payment' && bid.payment_amount) {
      const totalAmount = bid.amount || 0;
      const paidAmount = bid.payment_amount || 0;
      return totalAmount - paidAmount;
    }
    return 0;
  };

  const bidStatus = getBidStatus();
  console.log('Final bidStatus:', bidStatus);

  // Handle heart click to toggle interested state
  const handleHeartClick = () => {
    console.log('handleHeartClick called');
    console.log('handleInterested function:', handleInterested);
    console.log('bid.id:', bid.id);
    if (handleInterested) {
      console.log('Calling handleInterested with bid.id:', bid.id);
      handleInterested(bid.id);
    } else {
      console.error('handleInterested is not a function or is undefined');
    }
  };

  // Handle X button click to deny bid
  const handleDenyClick = () => {
    console.log('handleDenyClick called');
    console.log('handleDeny function:', handleDeny);
    console.log('bid.id:', bid.id);
    if (handleDeny) {
      console.log('Calling handleDeny with bid.id:', bid.id);
      handleDeny(bid.id);
    } else {
      console.error('handleDeny is not a function or is undefined');
    }
  };

  const getExpirationStatus = (expirationDate) => {
    if (!expirationDate) return null;
    
    const now = new Date();
    const expiration = new Date(expirationDate);
    const diffTime = expiration - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', text: 'Expired' };
    if (diffDays <= 1) return { status: 'urgent', text: 'Expires today' };
    if (diffDays <= 3) return { status: 'warning', text: `Expires in ${diffDays} days` };
    return { status: 'normal', text: `Expires in ${diffDays} days` };
  };

  console.log('BidDisplay.js: bid.last_edited_at:', bid?.last_edited_at, 'lastViewedAt:', lastViewedAt);

  const expirationStatus = getExpirationStatus(bid.expiration_date);

  const discountedPrice = getDiscountedPrice(bid);
const discountDeadline = bid.discount_deadline ? new Date(bid.discount_deadline) : null;
const now = new Date();
const daysLeft = discountDeadline ? Math.ceil((discountDeadline - now) / (1000 * 60 * 60 * 24)) : null;

  // Helper to calculate discounted price
  function getDiscountedPrice(bid) {
    if (!bid.discount_type || !bid.discount_value || !bid.discount_deadline) return null;
    const now = new Date();
    const deadline = new Date(bid.discount_deadline);
    if (now > deadline) return null;

    // For itemized quotes, use the total amount (which includes tax)
    // For simple bids, use the bid_amount
    let baseAmount = Number(bid.bid_amount);
    
    // If we have line items, the bid_amount should already be the total including tax
    // But we can double-check by calculating from line items if available
    if (bid.line_items && bid.line_items.length > 0) {
      const subtotal = bid.subtotal || 0;
      const tax = bid.tax || 0;
      baseAmount = subtotal + tax;
    }

    let discounted = baseAmount;
    if (bid.discount_type === 'percentage') {
      discounted = discounted * (1 - Number(bid.discount_value) / 100);
    } else if (bid.discount_type === 'flat') {
      discounted = discounted - Number(bid.discount_value);
    }
    return discounted > 0 ? discounted.toFixed(2) : '0.00';
  }

  const formatBusinessName = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleProfileClick = () => {
    if (demoMode) {
      toast.info('This is a demo - profile viewing is disabled');
      return;
    }
    
    if (onProfileClick) {
      onProfileClick();
    } else {
      const formattedName = formatBusinessName(bid.business_profiles.business_name);
      navigate(`/portfolio/${bid.business_profiles.id}/${formattedName}`);
    }
  };

  const profileImage =
    bid.business_profiles.profile_image || "/images/default.jpg"; // Default image if none

  // Status-based rendering functions
  const renderPaymentInfo = () => {
    if (bid.status === 'paid') {
      if (bid.payment_type === 'down_payment') {
        const remainingAmount = bid.remaining_amount || (bid.bid_amount - bid.payment_amount);
        return (
          <div className="payment-info">
            <div className="payment-status down-payment">
              <CheckCircleIcon style={{ color: '#28a745' }} />
              <span>Down Payment Paid (${bid.payment_amount?.toFixed(2)})</span>
            </div>
            <div className="remaining-amount-down-payment">
              <span>Remaining Balance: ${remainingAmount?.toFixed(2)}</span>
              <span className="due-date">Due at event</span>
            </div>
          </div>
        );
      } else {
        return (
          <div className="payment-info">
            <div className="payment-status fully-paid">
              <CheckCircleIcon style={{ color: '#28a745' }} />
              <span>Fully Paid (${bid.payment_amount?.toFixed(2)})</span>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const renderStatusBadge = () => {
    const statusConfig = {
      approved: { text: 'Approved', className: 'status-badge-approved', icon: <CheckCircleIcon /> },
      pending: { text: 'Pending', className: 'status-badge-pending', icon: <AccessTimeIcon /> },
      interested: { text: 'Interested', className: 'status-badge-interested', icon: <FavoriteIcon /> },
      payment: { text: 'Payment Required', className: 'status-badge-payment', icon: <ThumbUpIcon /> },
      expired: { text: 'Expired', className: 'status-badge-expired', icon: <AccessTimeIcon /> },
      paid: { text: bid.payment_type === 'down_payment' ? 'Down Payment Paid' : 'Fully Paid', 
             className: bid.payment_type === 'down_payment' ? 'status-badge-down-payment' : 'status-badge-paid', 
             icon: <CheckCircleIcon /> }
    };

    const config = statusConfig[bidStatus];
    if (!config) return null;

    const remainingAmount = getRemainingAmount();

    return (
      <div className={`bid-status-badge ${config.className}`}>
        {config.icon}
        <span>
          {config.text}
          {remainingAmount > 0 && (
            <span className="remaining-amount">
              {` (Remaining: $${remainingAmount.toFixed(2)})`}
            </span>
          )}
        </span>
      </div>
    );
  };

  const renderStatusActions = () => {
    console.log('renderStatusActions called with:', {
      bidStatus,
      onPayNow,
      showPaymentOptions,
      isDownPaymentPaid: bid.status === 'paid' && bid.payment_type === 'down_payment',
      isFullyPaid: bid.status === 'paid' && bid.payment_type !== 'down_payment',
      remainingAmount: bid.status === 'paid' && bid.payment_type === 'down_payment' ? bid.bid_amount - bid.payment_amount : bid.bid_amount
    });
    
    // Calculate remaining amount if this is a down payment
    const remainingAmount = bid.status === 'paid' && bid.payment_type === 'down_payment' 
      ? bid.bid_amount - bid.payment_amount 
      : bid.bid_amount;

    switch (bidStatus) {
      case 'expired':
        return (
          <div className="bid-status-actions">
            <button className="bid-card-btn bid-card-btn-secondary" onClick={handleProfileClick}>
              View Profile
            </button>
          </div>
        );
      
      case 'approved':
      case 'payment':
      case 'paid':
      case 'down_payment_paid':
        const downPaymentText = downPayment ? `Pay Down Payment (${downPayment.display})` : 'Pay Down Payment';
        const isDownPaymentPaid = bid.status === 'paid' && bid.payment_type === 'down_payment';
        const isFullyPaid = bid.status === 'paid' && bid.payment_type !== 'down_payment';

        return (
          <div className="bid-status-actions">
            {!isFullyPaid && (
              <button 
                className="bid-card-btn bid-card-btn-primary" 
                onClick={() => {
                  console.log('BidDisplay: Pay in Full button clicked');
                  if (onPayNow) {
                    onPayNow('full');
                  } else {
                    console.error('BidDisplay: onPayNow is not defined');
                  }
                }}
              >
                {isDownPaymentPaid 
                  ? `Pay Remaining Balance ($${remainingAmount?.toFixed(2)})` 
                  : `Pay in Full ($${bid.bid_amount})`}
              </button>
            )}
            {!isDownPaymentPaid && !isFullyPaid && (
              <button 
                className="bid-card-btn bid-card-btn-secondary" 
                onClick={() => {
                  console.log('BidDisplay: Pay Down Payment button clicked');
                  if (onPayNow) {
                    onPayNow('downpayment');
                  } else {
                    console.error('BidDisplay: onPayNow is not defined');
                  }
                }}
              >
                {downPaymentText}
              </button>
            )}
            <button className="bid-card-btn bid-card-btn-secondary" onClick={handleProfileClick}>
              View Profile
            </button>
          </div>
        );
      
      case 'interested':
        return (
          <div className="bid-status-actions">
            <button className="bid-card-btn bid-card-btn-primary" onClick={() => handleAction(handleApprove, bid.id)}>
              Approve Bid
            </button>
            <button className="bid-card-btn bid-card-btn-secondary" onClick={handleProfileClick}>
              View Profile
            </button>
          </div>
        );
      
      case 'pending':
        return (
          <div className="bid-status-actions">
            <button className="bid-card-btn bid-card-btn-primary" onClick={() => handleAction(handleApprove, bid.id)}>
              Approve Bid
            </button>
            <button className="bid-card-btn bid-card-btn-secondary" onClick={handleProfileClick}>
              View Profile
            </button>
          </div>
        );
      
      default:
        return (
          <div className="bid-status-actions">
            <button className="bid-card-btn bid-card-btn-filled" onClick={handleProfileClick}>
              View Profile
            </button>
          </div>
        );
    }
  };

  const renderExpirationInfo = () => {
    if (!expirationStatus) return null;

    const statusClass = `expiration-status-${expirationStatus.status}`;
    return (
      <div className={`bid-expiration-info ${statusClass}`}>
        <AccessTimeIcon />
        <span>{expirationStatus.text}</span>
      </div>
    );
  };

  const renderDiscountInfo = () => {
    if (!discountedPrice || !daysLeft || daysLeft <= 0) return null;

    return (
      <div className="bid-discount-info">
        <div className="discount-badge">
          <span className="discount-label">Limited Time Offer!</span>
          <span className="discount-price">${discountedPrice}</span>
          <span className="discount-original">${bid.bid_amount}</span>
          <span className="discount-timer">{daysLeft} days left</span>
        </div>
      </div>
    );
  };

useEffect(() => {
  let timer;
  if (
    bid.last_edited_at &&
    (!lastViewedAt || new Date(bid.last_edited_at) > new Date(lastViewedAt))
  ) {
    setShowEditNotification(true);
    timer = setTimeout(async () => {
      setShowEditNotification(false);
      // Now update last_viewed_at in the DB
      if (bid && bid.id && currentUserId) {
        await supabase
          .from('bid_views')
          .upsert([
            {
              user_id: currentUserId,
              bid_id: bid.id,
              last_viewed_at: new Date().toISOString()
            }
          ], { onConflict: ['user_id', 'bid_id'] });
      }
    }, 10000); // Show for 10 seconds
  }
  return () => clearTimeout(timer);
}, [bid, lastViewedAt, currentUserId]);

    useEffect(() => {
      const fetchMembershipTierAndCalendar = async () => {
        try {
          const { data, error } = await supabase
            .from("business_profiles")
            .select("membership_tier, down_payment_type, amount, google_calendar_connected")
            .eq("id", bid.business_profiles.id)
            .single();
    
          if (error) throw error;
    
          const tier = data?.["membership_tier"];
          setIsBidiVerified(tier === "Plus" || tier === "Verified");
          setIsCalendarConnected(!!data?.google_calendar_connected);
        } catch (error) {
          setError("Failed to fetch membership tier or calendar connection");
        } finally {
          setLoading(false);
        }
      };
    
      fetchMembershipTierAndCalendar();
    }, [bid.business_profiles.id]);

  // Simplified review fetching
  useEffect(() => {
    const fetchRating = async () => {
      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("vendor_id", bid.business_profiles.id);

      if (reviewError) {
        console.error("Error fetching reviews:", reviewError);
      } else {
        const avgRating =
          reviewData.length > 0
            ? (
                reviewData.reduce((acc, review) => acc + review.rating, 0) /
                reviewData.length
              ).toFixed(1)
            : null;
        setAverageRating(avgRating);
      }
    };

    fetchRating();
  }, [bid.business_profiles.id]);

  const handleAction = (action, id) => {
    console.log('handleAction called with:', { action, id, actionType: typeof action });
    if (typeof action === 'function') {
      console.log('Action is a function, calling it with id:', id);
      setIsAnimating(true);
      setTimeout(() => {
        action(id);
      }, 300); // Match this with the CSS animation duration
    } else {
      console.error('Action is not a function:', action);
    }
  };

  const handleMessageClick = () => {
    if (demoMode) {
      toast.info('This is a demo - messaging is disabled');
      return;
    }
    
    // Always show the bid messaging modal for both mobile and desktop
    setShowBidMessaging(true);
  };

  const handleBackFromMessaging = () => {
    setShowMessagingView(false);
    setIsFlipped(false);
  };

  const handleMessage = () => {
    setShowMessaging(true);
    setIsFlipped(true);
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onMessage();
    }, 300);
  };

  const renderActionButtons = () => {
    console.log(
      '>>>> BidDisplay.js: renderActionButtons CALLED FOR BID:', bid.id,
      {
        bidStatus: bid.status,
        showActions,
        showApproved,
        showPaymentOptions,
        showNotInterested,
        showPending,
        showInterested, 
      }
    );
    if (!showActions) return null;

    const buttonStyle = {
      padding: window.innerWidth <= 768 ? '16px' : '12px',
      minWidth: window.innerWidth <= 768 ? '56px' : '48px',
      minHeight: window.innerWidth <= 768 ? '56px' : '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'none',
      border: 'none',
      cursor: 'pointer'
    };

    const iconStyle = {
      fontSize: window.innerWidth <= 768 ? 48 : 36
    };

    const actionButtonsContainer = {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '0 8px'
    };

    const rightButtonsContainer = {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    };

    // For approved tab, only show X and chat icons
    if (showApproved) {
      return (
        <div className="business-actions-bid-display" style={actionButtonsContainer}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={() => {
                console.log('Move to Pending button clicked for approved bid:', bid.id);
                if (typeof handlePending === 'function') handlePending(bid);
              }}
              title="Move to Pending"
            >
              <AccessTimeIcon style={iconStyle} />
            </button>
          </div>
          <div style={rightButtonsContainer}>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={handleMessageClick}
            >
              <ChatIcon style={iconStyle} />
            </button>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={() => {
                console.log('Check mark clicked for approved bid:', bid.id);
                // For approved bids, clicking the check mark could move to pending
                if (typeof handlePending === 'function') handlePending(bid);
              }}
              title="Bid Approved"
            >
              <CheckCircleIcon style={{ ...iconStyle, color: '#10b981' }} />
            </button>
          </div>
        </div>
      );
    }

    // For payment options, show X and chat icons
    if (showPaymentOptions) {
      return (
        <div className="business-actions" style={actionButtonsContainer}>
          <button
            className="btn-icon"
            style={buttonStyle}
            onClick={() => {
              console.log('Move to Pending button clicked for payment bid:', bid.id);
              if (typeof handlePending === 'function') handlePending(bid);
            }}
            title="Move to Pending"
          >
            <AccessTimeIcon style={iconStyle} />
          </button>
          <div style={rightButtonsContainer}>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={handleMessageClick}
            >
              <ChatIcon style={iconStyle} />
            </button>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={() => {
                console.log('Check mark clicked for payment bid:', bid.id);
                // For approved bids, clicking the check mark could move to pending
                if (typeof handlePending === 'function') handlePending(bid);
              }}
              title="Bid Approved"
            >
              <CheckCircleIcon style={{ ...iconStyle, color: '#10b981' }} />
            </button>
          </div>
        </div>
      );
    }

    // For not interested tab, show clock icon and heart/x buttons
    if (showNotInterested) {
      return (
        <div className="business-actions-bid-display" style={actionButtonsContainer}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={() => {
                console.log('Clock button clicked for bid:', bid.id);
                handlePending(bid);
              }}
            >
              <AccessTimeIcon style={iconStyle} />
            </button>
          </div>
          <div style={rightButtonsContainer}>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={handleMessageClick}
            >
              <ChatIcon style={iconStyle} />
            </button>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={() => {
                console.log('Heart button clicked for bid:', bid.id);
                handleAction(handleInterested, bid.id);
              }}
            >
              <FavoriteBorderIcon style={iconStyle} />
            </button>
          </div>
        </div>
      );
    }

    // For pending tab, show heart and x buttons (same as default state)
    if (showPending) {
      return (
        <div className="business-actions-bid-display" style={actionButtonsContainer}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={() => {
                console.log('X button clicked for bid:', bid.id);
                handleAction(handleDeny, bid.id);
              }}
            >
              <CancelIcon style={iconStyle} />
            </button>
          </div>
          <div style={rightButtonsContainer}>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={handleMessageClick}
            >
              <ChatIcon style={iconStyle} />
            </button>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={() => {
                console.log('Heart button clicked for bid:', bid.id);
                handleAction(handleInterested, bid.id);
              }}
            >
              {showInterested ? (
                <FavoriteIcon style={iconStyle} />
              ) : (
                <FavoriteBorderIcon style={iconStyle} />
              )}
            </button>
          </div>
        </div>
      );
    }

    // For all other states, show X icon and heart button
    return (
      <div className="business-actions-bid-display" style={actionButtonsContainer}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {bid.status === 'approved' || bid.status === 'accepted' ? (
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={() => {
                console.log('Move to Pending button clicked for bid:', bid.id);
                if (typeof handlePending === 'function') handlePending(bid);
              }}
              title="Move to Pending"
            >
              <AccessTimeIcon style={iconStyle} />
            </button>
          ) : (
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={() => {
                console.log('X button clicked for bid:', bid.id);
                handleAction(handleDeny, bid.id);
              }}
            >
              <CancelIcon style={iconStyle} />
            </button>
          )}
        </div>
        <div style={rightButtonsContainer}>
          <button
            className="btn-icon"
            style={buttonStyle}
            onClick={handleMessageClick}
          >
            <ChatIcon style={iconStyle} />
          </button>
          <button
            className="btn-icon"
            style={buttonStyle}
            onClick={() => {
              if (bid.status === 'approved' || bid.status === 'accepted') {
                console.log('Check mark clicked for bid:', bid.id);
                if (typeof handlePending === 'function') handlePending(bid);
              } else {
                console.log('Heart button clicked for bid:', bid.id);
                handleAction(handleInterested, bid.id);
              }
            }}
            title={bid.status === 'approved' || bid.status === 'accepted' ? "Bid Approved" : (showInterested ? "Remove from Favorites" : "Add to Favorites")}
          >
            {bid.status === 'approved' || bid.status === 'accepted' ? (
              <CheckCircleIcon style={{ ...iconStyle, color: '#10b981' }} />
            ) : showInterested ? (
              <FavoriteIcon style={iconStyle} />
            ) : (
              <FavoriteBorderIcon style={iconStyle} />
            )}
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    function updateHeight() {
      if (frontRef.current) {
        const frontHeight = frontRef.current.offsetHeight;
        setCardHeight(Math.max(frontHeight, 400)); // Ensure minimum height of 400px
      }
    }
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [showMessagingView, isFlipped, bid, isDescriptionExpanded]);

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  const handleDescriptionToggle = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
    // Add a small delay to allow the content to expand before updating height
    setTimeout(() => {
      if (frontRef.current) {
        const frontHeight = frontRef.current.offsetHeight;
        setCardHeight(Math.max(frontHeight, 400));
      }
    }, 50);
  };

  const handleScheduleConsultation = async (data) => {
    if (demoMode) {
      toast.info('This is a demo - consultation scheduling is disabled');
      return;
    }
    
    console.log('=== handleScheduleConsultation START ===');
    console.log('Function called with data:', data);
    console.log('Function called with data type:', typeof data);
    console.log('Function called with data keys:', data ? Object.keys(data) : 'data is null/undefined');
    
    try {
      console.log('handleScheduleConsultation called with data:', data);
      console.log('bid object:', bid);
      console.log('bid.business_profiles:', bid.business_profiles);
      console.log('currentUserId prop:', currentUserId);
      
      if (!currentUserId) {
        throw new Error('No current user ID available');
      }

      console.log('About to get user profile using currentUserId...');

      // Get user email from auth system
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Failed to get user authentication: ' + authError.message);
      }

      if (!user) {
        console.error('No authenticated user found');
        throw new Error('User not authenticated');
      }

      const customerEmail = user.email;

      // Get user profile information from individual_profiles table
      const { data: profile, error: profileError } = await supabase
        .from('individual_profiles')
        .select('first_name, last_name')
        .eq('id', currentUserId)
        .single();

      console.log('Profile query result:', { profile, profileError });

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Failed to get user profile: ' + profileError.message);
      }

      if (!profile) {
        console.error('No profile found');
        throw new Error('User profile not found');
      }

      const customerName = `${profile.first_name} ${profile.last_name}`.trim();

      console.log('Customer info prepared:', { customerName, customerEmail });

      console.log('About to call scheduleConsultation with:', {
        businessId: bid.business_profiles.id,
        bidId: bid.id,
        startTime: data.selectedTimeSlot,
        customerEmail,
        customerName
      });

      const result = await scheduleConsultation({
        businessId: bid.business_profiles.id,
        bidId: bid.id,
        startTime: data.selectedTimeSlot,
        customerEmail,
        customerName
      });
      
      console.log('scheduleConsultation result:', result);
      
      if (onScheduleConsultation) {
        onScheduleConsultation(result);
      }
      setShowConsultationModal(false);
      toast.success('Consultation scheduled successfully! Please check your email for details.');
    } catch (error) {
      console.error('Error in handleScheduleConsultation:', error);
      console.error('Error stack:', error.stack);
      toast.error('Failed to schedule consultation: ' + error.message);
    }
  };

  const handleClientSignContract = async () => {
    setClientSignError("");
    if (!clientSignature.trim()) {
      setClientSignError("Signature is required.");
      return;
    }
    setClientSigning(true);
    const { error } = await supabase
      .from("bids")
      .update({ client_signature: clientSignature, client_signed_at: new Date().toISOString() })
      .eq("id", bid.id);
    setClientSigning(false);
    if (error) {
      setClientSignError("Failed to sign contract. Please try again.");
    } else {
      setClientSigned(true);
    }
  };

  // Fetch PDF data for react-pdf
  useEffect(() => {
    if (bid.contract_url && bid.contract_url.endsWith('.pdf')) {
      fetch(bid.contract_url)
        .then(res => res.arrayBuffer())
        .then(setPdfData);
    }
  }, [bid.contract_url]);

  // Handle click to place signature
  const handlePdfClick = (e) => {
    if (!placingSignature || !pdfWrapperRef.current) return;
    const rect = pdfWrapperRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSignaturePos({ x, y });
    setPlacingSignature(false);
  };

  // Download PDF with both signatures
  const handleDownloadSignedPdf = async () => {
    if (!bid.contract_url) {
      console.error('No contract URL found');
      return;
    }

    console.log('Starting PDF download process with bid:', {
      contractUrl: bid.contract_url,
      businessSignatureUrl: bid.business_signature_image_url,
      clientSignatureImage: bid.client_signature_image,
      businessPos: bid.business_signature_pos,
      clientPos: bid.client_signature_box_pos
    });

    try {
      const response = await fetch(bid.contract_url);
      const pdfData = await response.arrayBuffer();
      console.log('Fetched PDF data, size:', pdfData.byteLength);
      
      const pdfDoc = await PDFDocument.load(pdfData);
      const pages = pdfDoc.getPages();
      console.log('Loaded PDF with pages:', pages.length);
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Format timestamps
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
      };

      // Get signature positions
      const businessPos = bid.business_signature_pos ? JSON.parse(bid.business_signature_pos) : null;
      const clientPos = bid.client_signature_box_pos ? JSON.parse(bid.client_signature_box_pos) : null;

      console.log('Parsed signature positions:', {
        businessPos,
        clientPos
      });

      // Place business signature
      if (bid.business_signature_image_url && businessPos) {
        try {
          console.log('Fetching business signature image from:', bid.business_signature_image_url);
          const response = await fetch(bid.business_signature_image_url);
          const imageBytes = await response.arrayBuffer();
          console.log('Fetched business signature image, size:', imageBytes.byteLength);
          
          const image = await pdfDoc.embedPng(imageBytes);
          console.log('Embedded business signature image');
          
          // Calculate page dimensions
          const pageHeight = pages[0].getHeight();
          const pageWidth = pages[0].getWidth();
          console.log('Page dimensions:', { pageHeight, pageWidth });
          
          // Calculate which page this Y position falls on
          const pageIndex = Math.floor(businessPos.y / pageHeight);
          const yPosInPage = businessPos.y % pageHeight;
          
          console.log('Business signature placement:', {
            pageIndex,
            yPosInPage,
            originalX: businessPos.x
          });
          
          // Scale the image to fit within reasonable bounds
          const maxWidth = pageWidth * 0.3; // 30% of page width
          const { width: originalWidth, height: originalHeight } = image.scale(1);
          const scale = Math.min(1, maxWidth / originalWidth);
          const { width, height } = image.scale(scale);
          
          console.log('Business signature dimensions:', {
            originalWidth,
            originalHeight,
            scaledWidth: width,
            scaledHeight: height,
            scale
          });
          
          if (pages[pageIndex]) {
            // Center the signature horizontally
            const xPos = businessPos.x - (width / 2);
            
            console.log('Drawing business signature at:', {
              x: xPos,
              y: yPosInPage - (height / 2),
              width,
              height
            });
            
            pages[pageIndex].drawImage(image, {
              x: xPos,
              y: yPosInPage - (height / 2),
              width,
              height
            });

            // Add timestamp below signature
            pages[pageIndex].drawText(`Signed on ${formatDate(bid.business_signed_at)}`, {
              x: xPos,
              y: yPosInPage - (height / 2) - 20,
              size: 10,
              font,
              color: rgb(0.4, 0.4, 0.4),
            });
          } else {
            console.error('Invalid page index for business signature:', pageIndex);
          }
        } catch (error) {
          console.error('Error placing business signature:', error);
          toast.error('Failed to place business signature');
        }
      } else {
        console.log('Skipping business signature:', {
          hasImageUrl: !!bid.business_signature_image_url,
          hasPosition: !!businessPos
        });
      }
      
      // Place client signature
      if (bid.client_signature_image && clientPos) {
        try {
          console.log('Processing client signature image');
          const response = await fetch(bid.client_signature_image);
          const imageBytes = await response.arrayBuffer();
          console.log('Fetched client signature image, size:', imageBytes.byteLength);
          
          const image = await pdfDoc.embedPng(imageBytes);
          console.log('Embedded client signature image');
          
          // Calculate page dimensions
          const pageHeight = pages[0].getHeight();
          const pageWidth = pages[0].getWidth();
          
          // Calculate which page this Y position falls on
          const pageIndex = Math.floor(clientPos.y / pageHeight);
          const yPosInPage = clientPos.y % pageHeight;
          
          console.log('Client signature placement:', {
            pageIndex,
            yPosInPage,
            originalX: clientPos.x
          });
          
          // Scale the image to fit within reasonable bounds
          const maxWidth = pageWidth * 0.3; // 30% of page width
          const { width: originalWidth, height: originalHeight } = image.scale(1);
          const scale = Math.min(1, maxWidth / originalWidth);
          const { width, height } = image.scale(scale);
          
          console.log('Client signature dimensions:', {
            originalWidth,
            originalHeight,
            scaledWidth: width,
            scaledHeight: height,
            scale
          });
          
          if (pages[pageIndex]) {
            // Center the signature horizontally
            const xPos = clientPos.x - (width / 2);
            
            console.log('Drawing client signature at:', {
              x: xPos,
              y: yPosInPage - (height / 2),
              width,
              height
            });
            
            pages[pageIndex].drawImage(image, {
              x: xPos,
              y: yPosInPage - (height / 2),
              width,
              height
            });

            // Add timestamp below signature
            pages[pageIndex].drawText(`Signed on ${formatDate(bid.client_signed_at)}`, {
              x: xPos,
              y: yPosInPage - (height / 2) - 20,
              size: 10,
              font,
              color: rgb(0.4, 0.4, 0.4),
            });
          } else {
            console.error('Invalid page index for client signature:', pageIndex);
          }
        } catch (error) {
          console.error('Error placing client signature:', error);
          toast.error('Failed to place client signature');
        }
      } else {
        console.log('Skipping client signature:', {
          hasImage: !!bid.client_signature_image,
          hasPosition: !!clientPos
        });
      }
      
      console.log('Saving PDF with signatures');
      const pdfBytes = await pdfDoc.save();
      console.log('PDF saved, size:', pdfBytes.byteLength);
      
      saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), 'signed_contract.pdf');
      toast.success('Signed contract downloaded successfully');
    } catch (error) {
      console.error('Error downloading signed PDF:', error);
      toast.error('Failed to download signed contract');
    }
  };

  // Check if business has a template
  useEffect(() => {
    const checkTemplate = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from("business_profiles")
          .select("contract_template")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setHasTemplate(!!profile?.contract_template);
      } catch (error) {
        console.error("Error checking template:", error);
      }
    };

    if (bid.business_id === currentUserId) {
      checkTemplate();
    }
  }, [bid.business_id, currentUserId]);

  const handleContractChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setSelectedFileName(file.name);
    // Here you would typically handle the file upload
    // For now, we'll just set the filename
  };

  useEffect(() => {
    const fetchLastViewed = async () => {
      if (!bid || !bid.id || !currentUserId) return;
      const { data: viewData } = await supabase
        .from('bid_views')
        .select('last_viewed_at')
        .eq('user_id', currentUserId)
        .eq('bid_id', bid.id)
        .single();
      setLastViewedAt(viewData?.last_viewed_at || null);

      console.log('fetchLastViewed: bid.last_edited_at:', bid.last_edited_at, 'viewData.last_viewed_at:', viewData?.last_viewed_at);
      // Show notification if bid was edited after last viewed
      if (
        bid.last_edited_at &&
        (!viewData?.last_viewed_at || new Date(bid.last_edited_at) > new Date(viewData.last_viewed_at))
      ) {
        setShowEditNotification(true);
      } else {
        setShowEditNotification(false);
      }
    };
    fetchLastViewed();
  }, [bid, currentUserId]);

  useEffect(() => {
    if (showEditNotification) {
      const timer = setTimeout(() => setShowEditNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showEditNotification]);

  useEffect(() => {
    // Skip authentication check in demo mode
    if (demoMode) {
      return;
    }

    const checkAuth = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error checking session:', error);
                navigate('/login');
                return;
            }
            
            if (!session) {
                console.log('No user session found');
                navigate('/login');
                return;
            }

            // Set current user profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                return;
            }

            setCurrentUserProfile(profile);
        } catch (err) {
            console.error('Error in authentication:', err);
            navigate('/login');
        }
    };

    checkAuth();
}, [navigate, demoMode]);

  // Fetch bid messages
  const fetchBidMessages = async () => {
    if (!bid.id || !currentUserId) return;
    
    setIsLoadingMessages(true);
    try {
      // Get the other user's ID
      const otherUserId = currentUserId === bid.user_id ? bid.business_profiles?.id : bid.user_id;
      
      if (!otherUserId) return;

      // Fetch messages related to this bid
      const { data: bidMessages, error: bidMessagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('bid_id', bid.id)
        .order('created_at', { ascending: true });

      if (bidMessagesError) {
        console.error('Error fetching bid messages:', bidMessagesError);
        return;
      }

      // Also fetch general messages between these users
      const { data: generalMessages, error: generalMessagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
        .is('bid_id', null)
        .order('created_at', { ascending: true });

      if (generalMessagesError) {
        console.error('Error fetching general messages:', generalMessagesError);
        return;
      }

      // Combine and sort all messages
      let allMessages = [...(bidMessages || []), ...(generalMessages || [])];
      allMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      // Handle legacy bids - if no bid messages exist but bid has description, create a virtual message
      if ((!bidMessages || bidMessages.length === 0) && bid.bid_description) {
        // Create a virtual message object from the bid description
        const virtualMessage = {
          id: `virtual-${bid.id}`,
          sender_id: bid.user_id,
          receiver_id: otherUserId,
          message: `💼 **Bid: $${bid.bid_amount}**\n\n${bid.bid_description}`,
          created_at: bid.created_at || new Date().toISOString(),
          seen: false,
          type: 'text',
          is_bid_message: true,
          is_virtual: true // Flag to identify this as a virtual message
        };
        
        // Add the virtual message to the beginning of the messages array
        allMessages = [virtualMessage, ...allMessages];
      }

      setBidMessages(allMessages);
    } catch (error) {
      console.error('Error fetching bid messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load messages when bid changes
  useEffect(() => {
    if (bid && currentUserId) {
      fetchBidMessages();
    }
  }, [bid.id, currentUserId]);

  // WebSocket connection for real-time messaging
  useEffect(() => {
    if (!currentUserId || !bid) return;

    const otherUserId = currentUserId === bid.user_id ? bid.business_profiles?.id : bid.user_id;

    socket.emit("join", currentUserId);

    const handleReceive = (msg) => {
      if (
        (msg.senderId === otherUserId && msg.receiverId === currentUserId) ||
        (msg.senderId === currentUserId && msg.receiverId === otherUserId)
      ) {
        // Refresh messages to show the new one
        fetchBidMessages();
      }
    };

    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, [currentUserId, bid]);

  // Check if current user is a business and get Stripe account ID
  useEffect(() => {
    const checkBusinessProfile = async () => {
      if (!currentUserId) return;
      
      try {
        const { data, error } = await supabase
          .from('business_profiles')
          .select('id, stripe_account_id')
          .eq('id', currentUserId)
          .single();
        
        console.log('Business profile check:', { data, error });
        setIsCurrentUserBusiness(!!data);
        setStripeAccountId(data?.stripe_account_id || null);
      } catch (error) {
        console.error('Error checking business profile:', error);
      }
    };

    checkBusinessProfile();
  }, [currentUserId]);



  // Helper functions for read more functionality in preview
  const shouldTruncatePreviewMessage = (message) => {
    // Strip HTML tags for length calculation
    const textContent = message.replace(/<[^>]*>/g, '');
    return textContent.length > 80; // Shorter limit for preview
  };

  const getTruncatedPreviewMessage = (message) => {
    // Strip HTML tags for length calculation
    const textContent = message.replace(/<[^>]*>/g, '');
    if (textContent.length <= 80) return message;
    
    // Find the last complete word within 80 characters
    const truncatedText = textContent.substring(0, 80).split(' ').slice(0, -1).join(' ');
    
    // Find the position of this truncated text in the original HTML
    let currentPos = 0;
    let textPos = 0;
    let result = '';
    
    while (currentPos < message.length && textPos < truncatedText.length) {
      if (message[currentPos] === '<') {
        // Skip HTML tag
        while (currentPos < message.length && message[currentPos] !== '>') {
          result += message[currentPos];
          currentPos++;
        }
        if (currentPos < message.length) {
          result += message[currentPos];
          currentPos++;
        }
      } else {
        result += message[currentPos];
        textPos++;
        currentPos++;
      }
    }
    
    return result + '...';
  };

  const togglePreviewMessageExpansion = (messageId) => {
    setExpandedPreviewMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Payment calculation functions
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

  const handleSendPaymentRequest = (paymentData) => {
    if (!stripeAccountId) {
      console.error('No Stripe account ID found for business');
      return;
    }

    const total = calculateTotal();
    if (total <= 0) {
      alert('Please add at least one line item with a valid amount');
      return;
    }

    const messageData = {
      senderId: currentUserId,
      receiverId: otherUserId,
      message: JSON.stringify({
        type: 'payment_request',
        amount: total,
        description: 'Service Payment',
        paymentData: {
          amount: total,
          stripe_account_id: stripeAccountId,
          payment_type: 'custom',
          business_name: bid.business_profiles.business_name,
          description: 'Service Payment',
          lineItems: modalLineItems.filter(item => item.amount > 0),
          subtotal: calculateSubtotal(),
          tax: calculateTax(),
          taxRate: modalTaxRate
        }
      }),
      type: 'payment_request',
      payment_amount: total,
      payment_status: 'pending',
      payment_data: {
        lineItems: modalLineItems.filter(item => item.amount > 0),
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        taxRate: modalTaxRate,
        stripe_account_id: stripeAccountId,
        business_name: bid.business_profiles.business_name,
        description: 'Service Payment'
      },
      seen: false
    };

    socket.emit("send_message", messageData);
    setShowPaymentModal(false);
  };

  // Handle sending messages inline
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const otherUserId = currentUserId === bid.user_id ? bid.business_profiles?.id : bid.user_id;

    const messageData = {
      senderId: currentUserId,
      receiverId: otherUserId,
      message: newMessage.trim(),
      type: 'text',
      seen: false,
      bid_id: bid.id,
      is_bid_message: true
    };

    // Send via socket for real-time
    socket.emit("send_message", messageData);

    // Also save to database
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: currentUserId,
          receiver_id: otherUserId,
          message: newMessage.trim(),
          type: 'text',
          seen: false,
          bid_id: bid.id,
          is_bid_message: true
        }]);

      if (error) {
        console.error('Error saving message:', error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }

    setNewMessage('');
    
    // Refresh messages to show the new one
    await fetchBidMessages();
  };

  const handleOpenBidMessaging = () => {
    setShowBidMessaging(true);
  };

  const handleCloseBidMessaging = () => {
    setShowBidMessaging(false);
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    setPendingFile(file);
    const localPreview = URL.createObjectURL(file);
    setPreviewImageUrl(localPreview);

    e.target.value = null;
  };

  // Send message
  const sendMessage = async () => {
    if (!pendingFile && !newMessage.trim()) return;
  
    let imageUrl = null;
  
    if (pendingFile && previewImageUrl) {
      try {
        const cleanFileName = pendingFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const fileName = `${Date.now()}_${cleanFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, pendingFile);
  
        if (uploadError) {
          console.error("Image upload failed:", uploadError);
          return;
        }
  
        const { publicUrl } = supabase
          .storage
          .from('chat-images')
          .getPublicUrl(fileName).data;
  
        imageUrl = publicUrl;
      } catch (err) {
        console.error("Image send failed:", err);
        return;
      }
    }
  
    if (imageUrl) {
      socket.emit("send_message", {
        senderId: currentUserId,
        receiverId: otherUserId,
        message: imageUrl,
        type: "image",
        seen: false,
      });
    }
  
    if (newMessage.trim()) {
      socket.emit("send_message", {
        senderId: currentUserId,
        receiverId: otherUserId,
        message: newMessage.trim(),
        type: "text",
        seen: false,
      });
    }
  
    // Cleanup
    setNewMessage("");
    setPreviewImageUrl(null);
    setPendingFile(null);
    socket.emit("stop_typing", { senderId: currentUserId, receiverId: otherUserId });
  };

  return (
    <div className="bid-card-modern">
      {console.log('BidDisplay rendering with bid:', bid.id, 'isNew:', isNew, 'bid.viewed:', bid.viewed, 'showInterested:', showInterested, 'handleInterested:', handleInterested, 'handleDeny:', handleDeny)}
      
      {/* New Tag */}
      {isNew && (
        <div className="bid-new-tag">
          <span>New</span>
        </div>
      )}
      
      {/* Top Row: Close, Message, Heart */}
      <div className="bid-card-top-row">
        {bid.status === 'denied' ? (
          <button 
            className="bid-card-move-to-pending-btn" 
            style={{ padding: '0 12px', height: 32, borderRadius: 16, background: '#f3f3f3', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => {
              console.log('Move to Pending button clicked');
              if (typeof handlePending === 'function') handlePending(bid);
            }}
          >
            Move to Pending
          </button>
        ) : bid.status === 'approved' || bid.status === 'accepted' ? (
          <button 
            className="bid-card-move-to-pending-btn" 
            style={{ padding: '0 12px', height: 32, borderRadius: 16, background: '#f3f3f3', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => {
              console.log('Move to Pending button clicked for approved bid');
              if (typeof handlePending === 'function') handlePending(bid);
            }}
          >
            Move to Pending
          </button>
        ) : (
          <button 
            className="bid-card-close-btn" 
            onClick={() => {
              console.log('Close button clicked');
              handleDenyClick();
            }}
          >
            <span>&#10005;</span>
          </button>
        )}
        <div className="bid-card-top-icons">
          {isCalendarConnected && (
            <button className="bid-card-icon-btn" onClick={() => setShowConsultationModal(true)} title="Schedule Consultation" aria-label="Schedule Consultation">
              <CalendarMonthIcon style={{ color: '#9633eb' }} />
            </button>
            )}
          <button className="bid-card-icon-btn" onClick={handleMessageClick} title="Message" aria-label="Message">
            <ChatIcon style={{ color: '#9633eb' }} />
          </button>
          <button
            className="bid-card-icon-btn"
            title={bid.status === 'approved' || bid.status === 'accepted' ? "Bid Approved" : (showInterested ? "Remove from Favorites" : "Add to Favorites")}
            aria-label={bid.status === 'approved' || bid.status === 'accepted' ? "Bid Approved" : (showInterested ? "Remove from Favorites" : "Add to Favorites")}
            onClick={() => {
              console.log('Heart/Check button clicked in JSX');
              if (bid.status === 'approved' || bid.status === 'accepted') {
                // For approved bids, clicking the check mark could move to pending
                if (typeof handlePending === 'function') handlePending(bid);
              } else {
                handleHeartClick();
              }
            }}
          >
            {bid.status === 'approved' || bid.status === 'accepted' ? (
              <CheckCircleIcon style={{ color: '#10b981' }} />
            ) : showInterested ? (
              <FavoriteIcon style={{ color: '#9633eb' }} />
            ) : (
              <FavoriteBorderIcon style={{ color: '#9633eb' }} />
            )}
          </button>
        </div>
      </div>

      {/* Profile and Info */}
      <div className="bid-card-profile-row">
        <img
          src={profileImage}
          alt={`${bid.business_profiles.business_name} profile`}
          className="bid-card-profile-img"
          onClick={handleProfileClick}
        />
        <div className="bid-card-info">
          <div className="bid-card-name-row">
            <span className="bid-card-name">{bid.business_profiles.business_name}</span>
            {isBidiVerified && (
              <div 
                className="bidi-verified-compact"
                onMouseEnter={() => setShowVerifiedTooltip(true)}
                onMouseLeave={() => setShowVerifiedTooltip(false)}
                onClick={() => setShowVerifiedTooltip(!showVerifiedTooltip)}
                style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M5.68638 8.5104C6.06546 8.13132 6.68203 8.13329 7.06354 8.5148L7.79373 9.24498L9.93117 7.10754C10.3102 6.72847 10.9268 6.73044 11.3083 7.11195C11.6898 7.49345 11.6918 8.11003 11.3127 8.48911L8.48891 11.3129C8.10983 11.692 7.49326 11.69 7.11175 11.3085L5.69078 9.88756C5.30927 9.50605 5.3073 8.88947 5.68638 8.5104Z" fill="#A328F4"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M6.3585 1.15414C7.77571 -0.384714 10.2243 -0.384714 11.6415 1.15414C11.904 1.43921 12.2814 1.59377 12.6709 1.57577C14.7734 1.4786 16.5048 3.19075 16.4065 5.26985C16.3883 5.655 16.5446 6.02814 16.8329 6.28775C18.389 7.68919 18.389 10.1105 16.8329 11.512C16.5446 11.7716 16.3883 12.1447 16.4065 12.5299C16.5048 14.609 14.7734 16.3211 12.6709 16.2239C12.2814 16.2059 11.904 16.3605 11.6415 16.6456C10.2243 18.1844 7.77571 18.1844 6.3585 16.6456C6.09596 16.3605 5.71863 16.2059 5.32915 16.2239C3.22665 16.3211 1.49524 14.609 1.5935 12.5299C1.6117 12.1447 1.4554 11.7716 1.16713 11.512C-0.389043 10.1105 -0.389043 7.68919 1.16713 6.28775C1.4554 6.02814 1.6117 5.655 1.5935 5.26985C1.49524 3.19075 3.22665 1.4786 5.32915 1.57577C5.71863 1.59377 6.09596 1.43921 6.3585 1.15414ZM9.96822 2.66105C9.44875 2.097 8.55125 2.097 8.03178 2.66105C7.31553 3.43878 6.28608 3.86045 5.22349 3.81134C4.45284 3.77572 3.81821 4.40329 3.85422 5.16537C3.90388 6.21614 3.47747 7.23413 2.69099 7.94241C2.12059 8.4561 2.12059 9.34362 2.69099 9.8573C3.47747 10.5656 3.90388 11.5836 3.85422 12.6343C3.81821 13.3964 4.45284 14.024 5.22349 13.9884C6.28608 13.9393 7.31553 14.3609 8.03178 15.1387C8.55125 15.7027 9.44875 15.7027 9.96822 15.1387C10.6845 14.3609 11.7139 13.9393 12.7765 13.9884C13.5472 14.024 14.1818 13.3964 14.1458 12.6343C14.0961 11.5836 14.5225 10.5656 15.309 9.8573C15.8794 9.34362 15.8794 8.4561 15.309 7.94241C14.5225 7.23414 14.0961 6.21614 14.1458 5.16537C14.1818 4.40329 13.5472 3.77572 12.7765 3.81134C11.7139 3.86045 10.6845 3.43878 9.96822 2.66105Z" fill="#A328F4"/>
                </svg>
                <div className={`verified-tooltip ${showVerifiedTooltip ? 'show' : ''}`} style={{ position: 'absolute', top: 28, left: 0, zIndex: 10 }}>
                  <p className="verified-tooltip-title">Bidi Verified</p>
                  <p className="verified-tooltip-subtitle">100% Money-Back Guarantee When You Pay Through Bidi</p>
                  <button className="verified-tooltip-btn" onClick={() => navigate('/no-ghosting-guarantee')}>Learn More</button>
                </div>
              </div>
            )}
            {averageRating && (
              <span className="bid-card-rating">
                <img src={StarIcon} alt="Star" className="bid-card-star" />
                {averageRating}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Payment Status */}
      {bid.status === 'paid' && (
        <div className="payment-info">
          {bid.payment_type === 'down_payment' ? (
            <>
              <div className="payment-status down-payment">
                <CheckCircleIcon />
                <span>Down Payment Paid (${bid.payment_amount?.toFixed(2)})</span>
              </div>
              <div className="remaining-amount-down-payment">
                <span>Remaining Balance: ${(bid.bid_amount - bid.payment_amount)?.toFixed(2)}</span>
                <span className="due-date">Due at event</span>
              </div>
            </>
          ) : (
            <div className="payment-status fully-paid">
              <CheckCircleIcon />
              <span>Fully Paid (${bid.payment_amount?.toFixed(2)})</span>
            </div>
          )}
        </div>
      )}

      {/* Price Breakdown - Moved below profile row */}
      <div className="bid-card-price-section">
        {bid.line_items && bid.line_items.length > 0 ? (
          <div className="bid-itemized-breakdown">
            <div className="bid-breakdown-items">
              {bid.line_items.map((item, index) => (
                <div key={index} className="bid-breakdown-item">
                  <span className="item-description">{item.description} - {item.quantity} x ${item.rate}</span>
                  <span className="item-amount">${item.amount.toFixed(2)}</span>
                </div>
              ))}
              {bid.tax_rate > 0 && (
                <div className="bid-breakdown-item">
                  <span className="item-description">Tax ({bid.tax_rate}%)</span>
                  <span className="item-amount">${bid.tax.toFixed(2)}</span>
                </div>
              )}
              {discountedPrice && (
                <div className="bid-breakdown-item bid-discount">
                  <span className="item-description">Discount ({bid.discount_type === 'percentage' ? `${bid.discount_value}%` : `$${bid.discount_value}`})</span>
                  <span className="item-amount">-${(Number(bid.bid_amount) - Number(discountedPrice)).toFixed(2)}</span>
                </div>
              )}
              <div className="bid-breakdown-item bid-total">
                <span className="item-description">Total</span>
                <span className="item-amount">
                  {discountedPrice ? `$${discountedPrice}` : `$${bid.bid_amount}`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bid-simple-price">
            {discountedPrice ? (
              <div className="bid-simple-price-with-discount">
                <span className="bid-original-price">${bid.bid_amount}</span>
                <span className="bid-discounted-price">${discountedPrice}</span>
              </div>
            ) : (
              <span className="bid-amount">${bid.bid_amount}</span>
            )}
          </div>
        )}
      </div>

      {/* Discount Info */}
      {renderDiscountInfo()}

      {/* Expiration Info */}
      {renderExpirationInfo()}

      {/* Messages Section - Show conversation instead of static description */}
      {(bidStatus === 'pending' || bidStatus === 'interested' || bidStatus === 'default') && (
        <div className="bid-card-messages-section">
          <div 
            className="bid-card-messages-header"
            onClick={() => setShowConversation(!showConversation)}
            style={{ cursor: 'pointer' }}
          >
            <span className="bid-card-messages-label">Conversation</span>
            <button 
              className="bid-card-close-conversation-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowConversation(!showConversation);
              }}
              title={showConversation ? "Hide conversation" : "Show conversation"}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  transform: showConversation ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {showConversation && (
            <>
              {isLoadingMessages ? (
                <div className="bid-card-messages-loading">
                  <div className="loading-spinner"></div>
                  <span>Loading messages...</span>
                </div>
              ) : bidMessages.length > 0 ? (
                <div className="bid-card-messages-preview">
                  {bidMessages.slice(-3).map((msg, index) => (
                    <div
                      key={index}
                      className={`bid-message-preview ${msg.sender_id === currentUserId ? 'sent' : 'received'} ${msg.is_virtual ? 'virtual-message' : ''}`}
                    >
                      <div className="bid-message-preview-content">
                        {shouldTruncatePreviewMessage(msg.message) && !expandedPreviewMessages.has(msg.id) ? (
                          <div>
                            {msg.is_virtual || msg.message.includes('<p>') ? (
                              <div 
                                className="message-preview-html-content"
                                dangerouslySetInnerHTML={{ __html: getTruncatedPreviewMessage(msg.message) }}
                              />
                            ) : msg.type === 'payment_request' ? (
                              <PaymentCard
                                amount={msg.payment_amount || JSON.parse(msg.message).amount}
                                businessName={bid.business_profiles.business_name}
                                stripeAccountId={msg.payment_data?.stripe_account_id || JSON.parse(msg.message).paymentData.stripe_account_id}
                                description={msg.payment_data?.description || JSON.parse(msg.message).description}
                                lineItems={msg.payment_data?.lineItems || JSON.parse(msg.message).paymentData.lineItems}
                                subtotal={msg.payment_data?.subtotal || JSON.parse(msg.message).paymentData.subtotal}
                                tax={msg.payment_data?.tax || JSON.parse(msg.message).paymentData.tax}
                                taxRate={msg.payment_data?.taxRate || JSON.parse(msg.message).paymentData.taxRate}
                                paymentStatus={msg.payment_status}
                              />
                            ) : (
                              formatMessageText(getTruncatedPreviewMessage(msg.message))
                            )}
                            <button 
                              className="read-more-preview-btn"
                              onClick={() => togglePreviewMessageExpansion(msg.id)}
                            >
                              Read more
                            </button>
                          </div>
                        ) : (
                          <div>
                            {msg.is_virtual || msg.message.includes('<p>') ? (
                              <div 
                                className="message-preview-html-content"
                                dangerouslySetInnerHTML={{ __html: msg.message }}
                              />
                            ) : msg.type === 'payment_request' ? (
                              <PaymentCard
                                amount={msg.payment_amount || JSON.parse(msg.message).amount}
                                businessName={bid.business_profiles.business_name}
                                stripeAccountId={msg.payment_data?.stripe_account_id || JSON.parse(msg.message).paymentData.stripe_account_id}
                                description={msg.payment_data?.description || JSON.parse(msg.message).description}
                                lineItems={msg.payment_data?.lineItems || JSON.parse(msg.message).paymentData.lineItems}
                                subtotal={msg.payment_data?.subtotal || JSON.parse(msg.message).paymentData.subtotal}
                                tax={msg.payment_data?.tax || JSON.parse(msg.message).paymentData.tax}
                                taxRate={msg.payment_data?.taxRate || JSON.parse(msg.message).paymentData.taxRate}
                                paymentStatus={msg.payment_status}
                              />
                            ) : (
                              formatMessageText(msg.message)
                            )}
                            {shouldTruncatePreviewMessage(msg.message) && expandedPreviewMessages.has(msg.id) && (
                              <button 
                                className="read-less-preview-btn"
                                onClick={() => togglePreviewMessageExpansion(msg.id)}
                              >
                                Show less
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="bid-message-preview-time">
                        {new Date(msg.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'America/Denver'
                        })}
                        {msg.is_virtual && (
                          <span className="virtual-indicator-preview">Original Bid</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {bidMessages.length > 3 && (
                    <div className="bid-messages-more" onClick={() => setShowBidMessaging(true)}>
                      <span>+{bidMessages.length - 3} more messages</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bid-card-no-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}

              {/* Inline messaging interface */}
              <div className="bid-card-messaging-interface">
                <div className="bid-card-input-wrapper">
                  <label htmlFor="file-upload-inline" className="bid-card-upload-btn">
                    <span>＋</span>
                    <input
                      id="file-upload-inline"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                    />
                  </label>
                  {isCurrentUserBusiness && stripeAccountId && (
                    <button 
                      className="bid-card-payment-btn"
                      onClick={() => setShowPaymentModal(true)}
                      title="Send Payment Request"
                    >
                      <FaCreditCard />
                    </button>
                  )}
                  <div className="bid-card-input-container">
                    {previewImageUrl && (
                      <div className="inline-image-preview">
                        <img src={previewImageUrl} alt="Preview" />
                        <button className="inline-remove-button" onClick={() => {
                          setPreviewImageUrl(null);
                          setPendingFile(null);
                        }}>×</button>
                      </div>
                    )}
                    <textarea
                      className="bid-card-input"
                      placeholder="Add a message…"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        // Auto-resize the textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={1}
                      style={{ resize: 'none', overflow: 'hidden' }}
                    />
                  </div>
                </div>
                <button 
                  className="bid-card-send-btn" 
                  onClick={sendMessage}
                  disabled={!newMessage.trim() && !pendingFile}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Status-specific content */}
      {bidStatus === 'approved' && (
        <div className="bid-approved-content">
          <div className="approved-message">
            <CheckCircleIcon className="approved-icon" />
            <p>This vendor is ready to work with you! Complete payment to secure your booking.</p>
          </div>
          {downPayment && (
            <div className="down-payment-info">
              <h4>Down Payment Required</h4>
              <p>{downPayment.display || `$${downPayment.amount}`} to secure this vendor</p>
            </div>
          )}
        </div>
      )}

      {bidStatus === 'payment' && (
        <div className="bid-payment-content">
          <div className="payment-message">
            <ThumbUpIcon className="payment-icon" />
            <p>Payment is required to secure this vendor. Choose your payment option below.</p>
          </div>
        </div>
      )}

      {/* Status Actions */}
      {renderStatusActions()}

      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        onSchedule={handleScheduleConsultation}
        businessName={bid.business_profiles.business_name}
        businessId={bid.business_profiles.id}
        bidId={bid.id}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
        availableTimeSlots={availableTimeSlots}
        isLoading={isConsultationLoading}
        error={consultationError}
        onDateSelect={handleDateSelect}
        onTimeSlotSelect={handleTimeSlotSelect}
        onFetchTimeSlots={fetchTimeSlots}
        businessTimezone={bid.business_profiles.consultation_hours?.timezone || null}
      />



      {/* Bid Messaging Modal */}
      {showBidMessaging && ReactDOM.createPortal(
        <BidMessaging
          bid={bid}
          currentUserId={currentUserId}
          onClose={handleCloseBidMessaging}
          isOpen={showBidMessaging}
          businessName={bid.business_profiles.business_name}
          profileImage={profileImage}
        />,
        document.body
      )}

      {/* Payment Request Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-header">
              <h3>Send Payment Request</h3>
              <button 
                className="close-btn"
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>
            <div className="payment-modal-content">
              <div className="line-items-section">
                <div className="line-items-header">
                  <h4>Service Breakdown</h4>
                  <button 
                    className="add-line-item-btn"
                    onClick={addLineItem}
                    type="button"
                  >
                    <FaPlus /> Add Service
                  </button>
                </div>
                
                <div className="line-items-help">
                  <p><strong>Itemize your services:</strong> List each service or item separately. For example: "Wedding Photography" (8 hours × $150), "Bouquet Design" (1 item × $200), etc.</p>
                </div>
                
                <div className="line-items-list">
                  {modalLineItems.map((item) => (
                    <div key={item.id} className="line-item">
                      <div className="line-item-row">
                        <div className="line-item-description">
                          <input
                            type="text"
                            placeholder="e.g., Wedding Photography, Bouquet Design, DJ Services"
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          />
                        </div>
                        <div className="line-item-quantity">
                          <input
                            type="number"
                            placeholder="Hours/Qty"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="line-item-rate">
                          <input
                            type="number"
                            placeholder="$ per hour/item"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateLineItem(item.id, 'rate', e.target.value)}
                          />
                        </div>
                        <div className="line-item-amount">
                          ${(item.amount || 0).toFixed(2)}
                        </div>
                        <div className="line-item-actions">
                          <button
                            className="remove-line-item-btn"
                            onClick={() => removeLineItem(item.id)}
                            type="button"
                            disabled={modalLineItems.length === 1}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="tax-section">
                <div className="tax-input">
                  <label>Tax Rate (%)</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                    value={modalTaxRate}
                    onChange={(e) => setModalTaxRate(parseFloat(e.target.value) || 0)}
                  />
                  <small>Leave as 0 if no tax applies</small>
                </div>
              </div>

              <div className="payment-summary">
                <h4>Payment Summary</h4>
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                {modalTaxRate > 0 && (
                  <div className="summary-row">
                    <span>Tax ({modalTaxRate}%):</span>
                    <span>${calculateTax().toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="payment-modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="send-btn"
                onClick={() => {
                  const total = calculateTotal();
                  if (total <= 0) {
                    alert('Please add at least one line item with a valid amount');
                    return;
                  }

                  handleSendPaymentRequest({
                    amount: total,
                    description: 'Service Payment',
                    paymentData: {
                      amount: total,
                      stripe_account_id: stripeAccountId,
                      payment_type: 'custom',
                      business_name: bid.business_profiles.business_name,
                      description: 'Service Payment',
                      lineItems: modalLineItems.filter(item => item.amount > 0),
                      subtotal: calculateSubtotal(),
                      tax: calculateTax(),
                      taxRate: modalTaxRate
                    }
                  });
                }}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BidDisplay;
