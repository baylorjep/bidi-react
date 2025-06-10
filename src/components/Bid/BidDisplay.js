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
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
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

    let discounted = Number(bid.bid_amount);
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
    if (bid.vendor_name) {
      const formattedName = formatBusinessName(bid.vendor_name);
      navigate(`/portfolio/${bid.vendor_id}/${formattedName}`, {
        state: {
          fromBid: true,
          bidData: bid,
          bidId: bid.id
        }
      });
    }
  };

  const profileImage =
    bid.business_profiles.profile_image || "/images/default.jpg"; // Default image if none

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
    if (typeof action === 'function') {
      setIsAnimating(true);
      setTimeout(() => {
        action(id);
      }, 300); // Match this with the CSS animation duration
    }
  };

  const handleChatClick = () => {
    if (window.innerWidth <= 768) {
      // On mobile, call the onMessage prop to trigger dashboard state change
      if (onMessage) {
        onMessage({
          id: bid.business_profiles.id,
          name: bid.business_profiles.business_name,
          profileImage: bid.business_profiles.profile_image,
        });
      }
    } else {
      // On desktop, flip the card to show messaging
      setIsFlipped(true);
      setShowMessagingView(true);
    }
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
}, [navigate]);

  return (
    <div className={`bid-display${isAnimating ? ' fade-out' : ''}`}> 
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
              {showEditNotification && (
                <div style={{
                  background: "#9633eb",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  textAlign: "center",
                  fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                }}>
                  This bid was recently updated by the business.
                </div>
              )}
              <div className="bid-display-head">
                <div className="profile-image-container-bid-display">
                  <img
                    src={profileImage}
                    alt={`${bid.business_profiles.business_name} profile`}
                    className="vendor-profile-image-bid-display"
                    onClick={handleProfileClick}
                  />
                </div>
                <div className="business-info">
                  <div className="business-name-container">
                  <button
                      onClick={handleProfileClick}
                      style={{
                        padding: '6px 12px',
                        background: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#666',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#e0e0e0'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#f0f0f0'}
                    >
                      <i className="fas fa-user"></i>
                      View Profile
                    </button>
                    <Link
                      to={`/portfolio/${bid.business_profiles.id}`}
                      className="business-name-bid-display"
                    >
                      {bid.business_profiles.business_name}
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isBidiVerified && (
                        <div 
                          className="bidi-verified-compact"
                          onMouseEnter={() => setShowVerifiedTooltip(true)}
                          onMouseLeave={() => setShowVerifiedTooltip(false)}
                          onClick={() => setShowVerifiedTooltip(!showVerifiedTooltip)}
                        >
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M5.68638 8.5104C6.06546 8.13132 6.68203 8.13329 7.06354 8.5148L7.79373 9.24498L9.93117 7.10754C10.3102 6.72847 10.9268 6.73044 11.3083 7.11195C11.6898 7.49345 11.6918 8.11003 11.3127 8.48911L8.48891 11.3129C8.10983 11.692 7.49326 11.69 7.11175 11.3085L5.69078 9.88756C5.30927 9.50605 5.3073 8.88947 5.68638 8.5104Z" fill="#A328F4"/>
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M6.3585 1.15414C7.77571 -0.384714 10.2243 -0.384714 11.6415 1.15414C11.904 1.43921 12.2814 1.59377 12.6709 1.57577C14.7734 1.4786 16.5048 3.19075 16.4065 5.26985C16.3883 5.655 16.5446 6.02814 16.8329 6.28775C18.389 7.68919 18.389 10.1105 16.8329 11.512C16.5446 11.7716 16.3883 12.1447 16.4065 12.5299C16.5048 14.609 14.7734 16.3211 12.6709 16.2239C12.2814 16.2059 11.904 16.3605 11.6415 16.6456C10.2243 18.1844 7.77571 18.1844 6.3585 16.6456C6.09596 16.3605 5.71863 16.2059 5.32915 16.2239C3.22665 16.3211 1.49524 14.609 1.5935 12.5299C1.6117 12.1447 1.4554 11.7716 1.16713 11.512C-0.389043 10.1105 -0.389043 7.68919 1.16713 6.28775C1.4554 6.02814 1.6117 5.655 1.5935 5.26985C1.49524 3.19075 3.22665 1.4786 5.32915 1.57577C5.71863 1.59377 6.09596 1.43921 6.3585 1.15414ZM9.96822 2.66105C9.44875 2.097 8.55125 2.097 8.03178 2.66105C7.31553 3.43878 6.28608 3.86045 5.22349 3.81134C4.45284 3.77572 3.81821 4.40329 3.85422 5.16537C3.90388 6.21614 3.47747 7.23413 2.69099 7.94241C2.12059 8.4561 2.12059 9.34362 2.69099 9.8573C3.47747 10.5656 3.90388 11.5836 3.85422 12.6343C3.81821 13.3964 4.45284 14.024 5.22349 13.9884C6.28608 13.9393 7.31553 14.3609 8.03178 15.1387C8.55125 15.7027 9.44875 15.7027 9.96822 15.1387C10.6845 14.3609 11.7139 13.9393 12.7765 13.9884C13.5472 14.024 14.1818 13.3964 14.1458 12.6343C14.0961 11.5836 14.5225 10.5656 15.309 9.8573C15.8794 9.34362 15.8794 8.4561 15.309 7.94241C14.5225 7.23414 14.0961 6.21614 14.1458 5.16537C14.1818 4.40329 13.5472 3.77572 12.7765 3.81134C11.7139 3.86045 10.6845 3.43878 9.96822 2.66105Z" fill="#A328F4"/>
                          </svg>
                          <span>Verified</span>
                          <div className={`verified-tooltip ${showVerifiedTooltip ? 'show' : ''}`}>
                            <p className="verified-tooltip-title">Bidi Verified</p>
                            <p className="verified-tooltip-subtitle">100% Money-Back Guarantee When You Pay Through Bidi</p>
                          </div>
                        </div>
                      )}
                      {averageRating && (
                        <span className="vendor-rating">
                          <img src={StarIcon} alt="Star" className="star-icon" />
                          {averageRating}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bid-amount-section">
                    <div className="bid-amount-container">
                      {discountedPrice ? (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: '1em', marginBottom: 2 }}>
                            ${bid.bid_amount}
                          </span>
                          <span style={{ color: '#9633eb', fontWeight: 700, fontSize: '1.6em', marginBottom: 2 }}>
                            ${discountedPrice}
                          </span>
                          <div style={{
                            fontSize: '1em',
                            color: '#9633eb',
                            background: 'rgba(150,51,235,0.08)',
                            borderRadius: 8,
                            padding: '4px 12px',
                            marginTop: 4,
                            fontWeight: 500,
                            textAlign: 'center',
                            width: '80%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>
                            {daysLeft > 0
                              ? `Book within ${daysLeft} day${daysLeft === 1 ? '' : 's'} to get this price!`
                              : 'Discount ends today!'}
                          </div>
                        </div>
                      ) : (
                        <button className="bid-display-button" disabled>
                          ${bid.bid_amount}
                          <div className="tag-hole"></div>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="business-badges">
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
                {(() => {
                  console.log('Contract button conditions:', {
                    hasContractUrl: !!bid.contract_url,
                    isPdf: bid.contract_url?.endsWith('.pdf'),
                    businessSigned: !!bid.business_signed_at,
                    clientSigned: !!bid.client_signed_at,
                    isBusiness: bid.business_id === currentUserId,
                    currentUserId,
                    businessId: bid.business_id
                  });

                  // Show sign button if business has signed but client hasn't
                  if (bid.business_signed_at && !bid.client_signed_at && bid.business_id !== currentUserId) {
                    return (
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
                    );
                  }

                  // Show sign button for business if they haven't signed yet
                  if (!bid.business_signed_at && bid.business_id === currentUserId) {
                    return (
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
                        Sign Contract as Business
                      </button>
                    );
                  }

                  // Show waiting message if business hasn't signed yet
                  if (!bid.business_signed_at && bid.business_id !== currentUserId) {
                    return (
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
                    );
                  }

                  return null;
                })()}

                {/* Contract Upload Section for Business */}
                {bid.business_id === currentUserId && !bid.contract_url && (
                  <div style={{ margin: '16px 0' }}>
                    <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                      {hasTemplate && (
                        <button
                          className={`template-toggle ${useTemplate ? 'active' : ''}`}
                          onClick={() => setUseTemplate(!useTemplate)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: '1px solid #9633eb',
                            background: useTemplate ? '#9633eb' : 'white',
                            color: useTemplate ? 'white' : '#9633eb',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <i className="fas fa-file-alt me-2"></i>
                          Use Template
                        </button>
                      )}
                      {!useTemplate && (
                        <label className="file-upload-label">
                          <span>
                            <i className="fas fa-upload"></i> Upload Contract
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleContractChange}
                            className="file-upload-input"
                          />
                        </label>
                      )}
                    </div>
                    {selectedFileName && !useTemplate && (
                      <span className="file-upload-filename">{selectedFileName}</span>
                    )}
                    {useTemplate && (
                      <div style={{ 
                        padding: '10px', 
                        background: '#f8f4ff', 
                        borderRadius: '8px',
                        border: '1px solid #e0d4ff',
                        color: '#666'
                      }}>
                        Using your saved contract template. Click "Sign Contract" to proceed.
                      </div>
                    )}
                  </div>
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
              {isCalendarConnected && (
                <button
                  className="consultation-button"
                  onClick={() => setShowConsultationModal(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '12px',
                    background: '#fff',
                    color: '#9633eb',
                    border: '1px solid #9633eb',
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
                  <CalendarMonthIcon style={{ fontSize: 20 }} />
                  Schedule Consultation
                </button>
              )}
              <p className="request-description" style={{ marginBottom: '8px' }}>
                <strong>Description:</strong>{" "}
                <div 
                  className={`bid-description-content ${!isDescriptionExpanded ? 'description-collapsed' : ''}`}
                  dangerouslySetInnerHTML={{ __html: bid.bid_description?.replace(/\n/g, '<br>') }}
                />
                <button 
                  className="read-more-btn"
                  onClick={handleDescriptionToggle}
                >
                  {isDescriptionExpanded ? 'Show Less' : 'Read More'}
                </button>
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
      <ContractSignatureModal
        isOpen={showContractModal}
        onClose={() => {
          console.log('BidDisplay modal closing');
          setShowContractModal(false);
        }}
        bid={bid}
        userRole={bid.business_id === currentUserId ? 'business' : 'individual'}
        useTemplate={useTemplate}
        onContractSigned={() => setShowViewContractButton(true)}
      />

      {/* Preview Contract Button */}
      {bid.business_signed_at && bid.client_signed_at && bid.contract_url && (
        <button
          className="view-contract-btn"
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
            marginTop: '16px'
          }}
          onClick={() => window.open(bid.contract_url, '_blank')}
        >
          <i className="fas fa-file-pdf" style={{ marginRight: 8 }}></i>
          Preview Contract
        </button>
      )}
    </div>
  );
}

export default BidDisplay;
