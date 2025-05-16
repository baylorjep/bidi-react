import React, { useEffect, useState, useRef } from "react";
import { toast } from 'react-toastify';
import { supabase } from "../../supabaseClient"; // Import your Supabase client
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
import VideoCallIcon from '@mui/icons-material/VideoCall';
import ConsultationModal from '../Consultation/ConsultationModal';
import { useConsultation } from '../../hooks/useConsultation';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import ContractSignatureModal from "./ContractSignatureModal";
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
  downPayment = null,
  onDownPayment = null,
  onMessage = null,
  onViewCoupon = null,
  currentUserId = null,
  onScheduleConsultation = null,
  onPayNow = null,
  onMoveToPending = null
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
  const [showShareSection, setShowShareSection] = useState(true);
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

  const expirationStatus = getExpirationStatus(bid.expiration_date);

  

  const handleProfileClick = () => {
    setShowBubble(false);
    navigate(`/portfolio/${bid.business_profiles.id}`, {
      state: {
        fromBid: true,
        bidId: bid.id,
        bidData: {
          amount: bid.bid_amount,
          description: bid.bid_description,
          expirationDate: bid.expiration_date,
          status: bid.status,
          couponCode: bid.coupon_code,
          couponApplied: bid.coupon_applied,
          originalAmount: bid.original_amount,
          discountAmount: bid.discount_amount
        }
      }
    });
  };

  const profileImage =
    bid.business_profiles.profile_image || "/images/default.jpg"; // Default image if none

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
    if (typeof action === 'function') {
      setIsAnimating(true);
      setTimeout(() => {
        action(id);
      }, 300); // Match this with the CSS animation duration
    }
  };

  const handleChatClick = () => {
    if (!currentUserId) {
      console.error('No currentUserId provided for messaging');
      return;
    }
    setIsFlipped(true);
    setShowMessagingView(true);
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
              onClick={() => handleAction(handleDeny, bid.id)}
            >
              <CancelIcon style={iconStyle} />
            </button>
          </div>
          <div style={rightButtonsContainer}>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={handleChatClick}
            >
              <ChatIcon style={iconStyle} />
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
            onClick={() => handleAction(handleDeny, bid.id)}
          >
            <CancelIcon style={iconStyle} />
          </button>
          <div style={rightButtonsContainer}>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={handleChatClick}
            >
              <ChatIcon style={iconStyle} />
            </button>
          </div>
        </div>
      );
    }

    // For not interested tab, show clock icon
    if (showNotInterested) {
      return (
        <div className="business-actions-bid-display" style={actionButtonsContainer}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={() => handlePending(bid)}
            >
              <AccessTimeIcon style={iconStyle} />
            </button>
          </div>
          <div style={rightButtonsContainer}>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={handleChatClick}
            >
              <ChatIcon style={iconStyle} />
            </button>
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={() => handleAction(handleInterested, bid.id)}
            >
              <FavoriteBorderIcon style={iconStyle} />
            </button>
          </div>
        </div>
      );
    }

    // For all other states, show X icon
    return (
      <div className="business-actions-bid-display" style={actionButtonsContainer}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-icon"
            style={buttonStyle}
            onClick={() => handleAction(handleDeny, bid.id)}
          >
            <CancelIcon style={iconStyle} />
          </button>
        </div>
        <div style={rightButtonsContainer}>
          <button
            className="btn-icon"
            style={buttonStyle}
            onClick={handleChatClick}
          >
            <ChatIcon style={iconStyle} />
          </button>
          <button
            className="btn-icon"
            style={buttonStyle}
            onClick={() => handleAction(handleInterested, bid.id)}
          >
            {showInterested ? (
              <FavoriteIcon style={iconStyle} />
            ) : (
              <FavoriteBorderIcon style={iconStyle} />
            )}
          </button>
          {showInterested && isCalendarConnected && (
            <button
              className="btn-icon"
              style={buttonStyle}
              onClick={() => setShowConsultationModal(true)}
              aria-label="Schedule Consultation"
            >
              <VideoCallIcon style={iconStyle} />
            </button>
          )}
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
    try {
      const result = await scheduleConsultation(data);
      if (onScheduleConsultation) {
        onScheduleConsultation(result);
      }
      setShowConsultationModal(false);
      toast.success('Consultation scheduled successfully! Please check your email for details.');
    } catch (error) {
      toast.error('Failed to schedule consultation');
      console.error('Error scheduling consultation:', error);
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
    if (!pdfData) return;
    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();
    const page = pages[pdfPage - 1];
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

    // Place business signature (bottom left)
    if (bid.business_signature_image_url) {
      // If we have a signature image URL, fetch and embed it
      const response = await fetch(bid.business_signature_image_url);
      const imageBytes = await response.arrayBuffer();
      const image = await pdfDoc.embedPng(imageBytes);
      const { width, height } = image.scale(0.5); // Scale down the image if needed
      
      page.drawImage(image, {
        x: 50,
        y: 70, // Moved up to make room for timestamp
        width,
        height
      });

      // Add timestamp below signature
      page.drawText(`Signed on ${formatDate(bid.business_signed_at)}`, {
        x: 50,
        y: 50,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    } else if (bid.business_signature) {
      // Fallback to text signature
      page.drawText(`Business: ${bid.business_signature}`, {
        x: 50,
        y: 70, // Moved up to make room for timestamp
        size: 16,
        font,
        color: rgb(0, 0.4, 0),
      });

      // Add timestamp below signature
      page.drawText(`Signed on ${formatDate(bid.business_signed_at)}`, {
        x: 50,
        y: 50,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
    
    // Place client signature (bottom right)
    const pageWidth = page.getWidth();
    if (bid.client_signature_image) {
      // If we have a signature image data URL
      const imageBytes = await fetch(bid.client_signature_image).then(res => res.arrayBuffer());
      const image = await pdfDoc.embedPng(imageBytes);
      const { width, height } = image.scale(0.5); // Scale down the image if needed
      
      page.drawImage(image, {
        x: pageWidth - width - 50,
        y: 70, // Moved up to make room for timestamp
        width,
        height
      });

      // Add timestamp below signature
      page.drawText(`Signed on ${formatDate(bid.client_signed_at)}`, {
        x: pageWidth - 250,
        y: 50,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    } else if (bid.client_signature) {
      // Fallback to text signature
      page.drawText(`Client: ${bid.client_signature}`, {
        x: pageWidth - 250,
        y: 70, // Moved up to make room for timestamp
        size: 16,
        font,
        color: rgb(0, 0, 0.6),
      });

      // Add timestamp below signature
      page.drawText(`Signed on ${formatDate(bid.client_signed_at)}`, {
        x: pageWidth - 250,
        y: 50,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
    const pdfBytes = await pdfDoc.save();
    saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), 'signed_contract.pdf');
  };

  return (
    <div className={`request-display bid-display${isAnimating ? ' fade-out' : ''}`}> 
      <div className="card-flip-container" style={{ height: cardHeight }}>
        <div className={`card-flip${isFlipped ? ' flipped' : ''}`}>
          {/* Front of card - Bid Display */}
          <div className="card-front" ref={frontRef}>
            {showActions && (
              <div className="business-actions-bid-display" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {renderActionButtons()}
              </div>
            )}
            <div className="bid-display-head-container">
              <div className="bid-display-head">
                <div className="profile-image-container">
                  <img
                    src={profileImage}
                    alt={`${bid.business_profiles.business_name} profile`}
                    className="vendor-profile-image"
                    onClick={handleProfileClick}
                  />
                  <div
                    className="profile-tooltip"
                    style={{
                      display: showBubble ? "block" : "none",
                    }}
                  >
                    Click to view profile
                  </div>
                </div>
                <div className="business-info">
                  <div className="business-name-container">
                    <Link
                      to={`/portfolio/${bid.business_profiles.id}`}
                      className="business-name-bid-display"
                    >
                      {bid.business_profiles.business_name}
                    </Link>
                    {isBidiVerified && (
                      <div 
                        className="bidi-verified-compact"
                        onMouseEnter={() => setShowVerifiedTooltip(true)}
                        onMouseLeave={() => setShowVerifiedTooltip(false)}
                        onClick={() => setShowVerifiedTooltip(!showVerifiedTooltip)}
                      >
                        <img
                          src={bidiCheck}
                          className="bidi-check-icon"
                          alt="Bidi Verified Icon"
                        />
                        <span>Verified</span>
                        <div className={`verified-tooltip ${showVerifiedTooltip ? 'show' : ''}`}>
                          <p className="verified-tooltip-title">Bidi Verified</p>
                          <p className="verified-tooltip-subtitle">100% Money-Back Guarantee When You Pay Through Bidi</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bid-amount-section">
                    <div className="bid-amount-container">
                      <button className="bid-display-button" disabled>
                        ${bid.bid_amount}
                        <div className="tag-hole"></div>
                      </button>
                    </div>
                  </div>
                  <div className="business-badges">
                    {averageRating && (
                      <span className="vendor-rating">
                        <img src={StarIcon} alt="Star" className="star-icon" />
                        {averageRating}
                      </span>
                    )}
                    {bid.isNew && (
                      <span className="new-badge">New</span>
                    )}
                    {expirationStatus && (
                      <div className={`expiration-badge ${expirationStatus.status}`}>
                        <AccessTimeIcon />
                        {expirationStatus.text}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {showPaymentOptions && (
              <div className="payment-options" style={{ marginBottom: '8px' }}>
                <div style={{ 
                  marginBottom: '16px',
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '8px',
                    color: '#9633eb'
                  }}>
                    <i className="fas fa-shield-alt"></i>
                    <h4 style={{ margin: 0 }}>Bidi Protection Guarantee</h4>
                  </div>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#666',
                    marginBottom: '8px'
                  }}>
                    Your payment is protected by our No-Show Guarantee.
                  </p>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    <i className="fas fa-lock" style={{ color: '#9633eb' }}></i>
                    <span>We'll help you get a full refund if anything goes wrong with your booking.</span>
                  </div>
                </div>

                            {/* Contract signature modal trigger */}
            {bid.contract_url && bid.contract_url.endsWith('.pdf') && (
              <>
                {/* Only show sign button if business has signed but client hasn't */}
                {bid.business_signed_at && !bid.client_signed_at && (
                  <button
                    className="btn-secondary"
                    style={{ 
                      margin: '16px 0', 
                      width: '100%',
                      background: '#9633eb',
                      color: '#fff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onClick={() => setShowContractModal(true)}
                  >
                    <i className="fas fa-signature"></i>
                    Sign Contract
                  </button>
                )}
                {/* Show waiting message if business hasn't signed yet */}
                {!bid.business_signed_at && (
                  <div
                    style={{ 
                      margin: '16px 0', 
                      padding: '12px',
                      background: '#f0f0f0',
                      color: '#666',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}
                  >
                    Waiting for business signature...
                  </div>
                )}
                {/* Show single view button when both have signed */}
                {bid.business_signed_at && bid.client_signed_at && (
                  <button
                    className="btn-secondary"
                    style={{ 
                      margin: '16px 0', 
                      width: '100%',
                      background: '#9633eb',
                      color: '#fff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      fontSize: '15px',
                      boxShadow: '0 2px 4px rgba(150,51,235,0.1)'
                    }}
                    onClick={() => setShowContractModal(true)}
                  >
                    <i className="fas fa-file-contract"></i>
                    View Contract
                  </button>
                )}
              </>
            )}

                {downPayment && (
                  <button
                    className="payment-button deposit"
                    onClick={() => handleAction(onDownPayment, bid)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginBottom: '8px',
                      background: '#9633eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className="fas fa-shield-alt"></i>
                    Pay Deposit (${downPayment.amount})
                  </button>
                )}
                <button
                  className="payment-button full"
                  onClick={() => onPayNow(bid)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#9633eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fas fa-shield-alt"></i>
                  Pay Full Amount (${bid.bid_amount})
                </button>
              </div>
            )}

            <div className="request-content" style={{ fontSize: '14px' }}>
              {showInterested && (
                <button
                  className="approve-pay-button"
                  onClick={() => {
                    if (handleApprove) {
                      handleApprove(bid.id);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '12px',
                    background: '#9633eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <CheckCircleIcon style={{ fontSize: 20 }} />
                  Approve and Pay
                </button>
              )}
              <p className="request-description" style={{ marginBottom: '8px' }}>
                <strong>Description:</strong>{" "}
                <div 
                  className={`bid-description-content ${!isDescriptionExpanded ? 'description-collapsed' : ''}`}
                  dangerouslySetInnerHTML={{ __html: bid.bid_description?.replace(/\n/g, '<br>') }}
                />
                {bid.bid_description && bid.bid_description.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim().length > 100 && (
                  <button 
                    className="read-more-btn"
                    onClick={handleDescriptionToggle}
                  >
                    {isDescriptionExpanded ? 'Show Less' : 'Read More'}
                  </button>
                )}
              </p>
              {downPayment && !showPaymentOptions && (
                <p className="request-comments">
                  <strong>Down Payment:</strong>{" "}
                  {downPayment.display}
                </p>
              )}
              {bid.coupon_code && (
                <div className="coupon-section">
                  <button
                    className="btn-secondary"
                    onClick={() => onViewCoupon(bid)}
                  >
                    <i className="fas fa-ticket-alt"></i>
                    View Applied Coupon
                  </button>
                </div>
              )}
              {bid.coupon_applied && (
                <div className="coupon-applied-info">
                  <strong>Coupon Applied:</strong> {bid.coupon_code}
                  <br />
                  <strong>Original Price:</strong> ${(bid.original_amount || 0).toFixed(2)}
                  <br />
                  <strong>Discount:</strong> ${(bid.discount_amount || 0).toFixed(2)}
                  <br />
                  <strong>Final Price:</strong> ${(bid.bid_amount || 0).toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Back of card - Messaging View */}
          <div className="card-back" ref={backRef}>
            {showMessagingView && currentUserId && (
              <>
                <button 
                  onClick={handleBackFromMessaging}
                  className="back-button-messaging"
                  type="button"
                >
                  <FaArrowLeft />
                  <span>Back to Bid</span>
                </button>
                <MessagingView
                  currentUserId={currentUserId}
                  businessId={bid.business_profiles.id}
                  onBack={handleBackFromMessaging}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        onSchedule={handleScheduleConsultation}
        businessName={bid.business_profiles.name}
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
      />
      {/* Contract Signature Modal */}
      <ContractSignatureModal
        isOpen={showContractModal}
        onClose={() => {
          console.log('BidDisplay modal closing');
          setShowContractModal(false);
        }}
        bid={bid}
        userRole={'individual'}
        testSource="BidDisplay"
      />
      
    </div>
    
  );
}

export default BidDisplay;
