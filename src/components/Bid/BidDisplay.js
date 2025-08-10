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
  onMobileModalToggle = null // Callback to notify parent of modal state changes
}) {
  const navigate = useNavigate();
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBidDetailModal, setShowBidDetailModal] = useState(false);
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
  
  // Chat integration state
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false); // New state for chat collapse/expand
  const typingTimeoutRef = useRef(null);
  
  // File upload and payment state
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState("");

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

  // Handle mobile row click
  const handleMobileRowClick = () => {
    handleMobileModalOpen();
  };

  // Handle mobile back navigation
  const handleMobileBack = () => {
    handleMobileModalClose();
  };

  // Toggle chat expansion
  const toggleChatExpansion = () => {
    setIsChatExpanded(!isChatExpanded);
  };

  // Enhanced modal close handler
  const handleModalClose = () => {
    setShowBidDetailModal(false);
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

    if (mobileDetailView || showBidDetailModal) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mobileDetailView, showBidDetailModal]);

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

  // Refresh reviews when bid detail modal opens
  useEffect(() => {
    if ((showBidDetailModal || mobileDetailView) && business_profiles?.id) {
      loadReviews();
    }
  }, [showBidDetailModal, mobileDetailView, business_profiles?.id]);

  // Load chat history when modal opens
  useEffect(() => {
    if (showBidDetailModal || mobileDetailView) {
      loadChatHistory();
    }
  }, [showBidDetailModal, mobileDetailView]);

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

  // Socket connection for real-time messaging
  useEffect(() => {
    if (!currentUserId || !business_profiles?.id) return;

    const handleReceive = (msg) => {
      if (
        (msg.senderId === business_profiles.id && msg.receiverId === currentUserId) ||
        (msg.senderId === currentUserId && msg.receiverId === business_profiles.id)
      ) {
        setChatMessages((prev) => {
          const exists = prev.some(m =>
            m.sender_id === msg.senderId &&
            m.receiver_id === msg.receiverId &&
            m.message === msg.message &&
            Math.abs(new Date(m.created_at) - new Date(msg.createdAt)) < 1000
          );
          return exists ? prev : [...prev, {
            id: msg.id,
            sender_id: msg.senderId,
            receiver_id: msg.receiverId,
            message: msg.message,
            created_at: msg.createdAt,
            seen: msg.seen || false,
            type: msg.type || 'text'
          }];
        });
      }
    };

    const handleTyping = (fromId) => {
      if (fromId === business_profiles.id) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (fromId) => {
      if (fromId === business_profiles.id) {
        setIsTyping(false);
      }
    };

    socket.on("receive_message", handleReceive);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
    };
  }, [currentUserId, business_profiles?.id]);

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
    if (showApproved || status === 'approved' || status === 'accepted' || status === 'interested') return 'approved';
    if (showPaymentOptions) return 'payment';
    if (showPending) return 'pending';
    return 'default';
  };

  const getRemainingAmount = () => {
    if (payment_type === 'down_payment' && payment_amount) {
      return bid_amount - payment_amount;
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

  const handleRowClick = () => {
    setShowBidDetailModal(true);
  };

  // Load chat history when modal opens
  const loadChatHistory = async () => {
    if (!currentUserId || !business_profiles?.id) return;
    
    setIsLoadingChat(true);
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${business_profiles.id}),and(sender_id.eq.${business_profiles.id},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }

      setChatMessages(messages || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSendMessage = async (message) => {
    if (!currentUserId || !business_profiles?.id || (!message.trim() && !pendingFile)) return;
    
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
          toast.error('Failed to upload image');
          return;
        }

        const { publicUrl } = supabase
          .storage
          .from('chat-images')
          .getPublicUrl(fileName).data;

        imageUrl = publicUrl;
      } catch (err) {
        console.error("Image send failed:", err);
        toast.error('Failed to upload image');
        return;
      }
    }

    if (imageUrl) {
      const newMsg = {
        sender_id: currentUserId,
        receiver_id: business_profiles.id,
        message: imageUrl,
        type: 'image',
        created_at: new Date().toISOString()
      };

      // Add message to local state immediately for optimistic update
      setChatMessages(prev => [...prev, newMsg]);

      // Save to database
      const { error } = await supabase
        .from('messages')
        .insert([newMsg]);

      if (error) {
        console.error('Error sending image:', error);
        setChatMessages(prev => prev.filter(msg => msg !== newMsg));
        toast.error('Failed to send image');
      } else {
        // Emit to socket for real-time delivery
        socket.emit("send_message", {
          senderId: currentUserId,
          receiverId: business_profiles.id,
          message: imageUrl,
          type: "image",
          seen: false,
        });
      }
    }

    if (message && message.trim()) {
      const newMsg = {
        sender_id: currentUserId,
        receiver_id: business_profiles.id,
        message: message.trim(),
        type: 'text',
        created_at: new Date().toISOString()
      };

      // Add message to local state immediately for optimistic update
      setChatMessages(prev => [...prev, newMsg]);
      setNewMessage('');

      // Save to database
      const { error } = await supabase
        .from('messages')
        .insert([newMsg]);

      if (error) {
        console.error('Error sending message:', error);
        // Remove from local state if database save failed
        setChatMessages(prev => prev.filter(msg => msg !== newMsg));
        toast.error('Failed to send message');
      } else {
        // Emit to socket for real-time delivery
        socket.emit("send_message", {
          senderId: currentUserId,
          receiverId: business_profiles.id,
          message: message.trim(),
          type: "text",
          seen: false,
        });
      }
    }
    
    // Cleanup
    setPreviewImageUrl(null);
    setPendingFile(null);
    
    // Stop typing indicator
    socket.emit("stop_typing", { senderId: currentUserId, receiverId: business_profiles.id });
  };

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    const messagesContainer = document.querySelector('.bid-detail-modal .chat-body');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [chatMessages]);

  // File upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    setPendingFile(file);
    const localPreview = URL.createObjectURL(file);
    setPreviewImageUrl(localPreview);

    e.target.value = null;
  };

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

  const handleSendPaymentRequest = (paymentData) => {
    if (!stripeAccountId) {
      console.error('No Stripe account ID found for business');
      toast.error('Business does not have payment processing set up');
      return;
    }

    const total = calculateTotal();
    if (total <= 0) {
      toast.error('Please add at least one line item with a valid amount');
      return;
    }

    const messageData = {
      senderId: currentUserId,
      receiverId: business_profiles.id,
      message: JSON.stringify({
        type: 'payment_request',
        amount: total,
        description: 'Service Payment',
        paymentData: {
          amount: total,
          stripe_account_id: stripeAccountId,
          payment_type: 'custom',
          business_name: business_profiles.business_name,
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
        business_name: business_profiles.business_name,
        description: 'Service Payment'
      },
      seen: false
    };

    // Add message to local state immediately for optimistic update
    const newMsg = {
      id: Date.now(),
      sender_id: currentUserId,
      receiver_id: business_profiles.id,
      message: messageData.message,
      type: 'payment_request',
      created_at: new Date().toISOString(),
      payment_amount: total,
      payment_status: 'pending',
      payment_data: messageData.payment_data
    };

    setChatMessages(prev => [...prev, newMsg]);

    // Save to database
    supabase
      .from('messages')
      .insert([newMsg])
      .then(({ error }) => {
        if (error) {
          console.error('Error sending payment request:', error);
          setChatMessages(prev => prev.filter(msg => msg !== newMsg));
          toast.error('Failed to send payment request');
        } else {
          // Emit to socket for real-time delivery
          socket.emit("send_message", messageData);
          setShowPaymentModal(false);
          toast.success('Payment request sent successfully');
        }
      });
  };

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
    navigate(`/portfolio/${business_profiles.id}/${business_profiles.business_name}`);
  };

  const handleMessageClick = () => {
    navigate(`/messaging/${bid.id}`);
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
            {down_payment && (
              <button
                className="bid-row-btn bid-row-btn-primary"
                onClick={() => setShowPaymentModal(true)}
              >
                Pay Down Payment
              </button>
            )}
            <button
              className="bid-row-btn bid-row-btn-success"
              onClick={() => setShowContractModal(true)}
            >
              Sign Contract
            </button>
          </div>
        );
        
      case 'payment':
        return (
          <div className="bid-row-actions">
            <button
              className="bid-row-btn bid-row-btn-primary"
              onClick={() => setShowPaymentModal(true)}
            >
              Pay Now
            </button>
          </div>
        );
        
      case 'pending':
        return (
          <div className="bid-row-actions">
            <button
              className="bid-row-btn bid-row-btn-success"
              onClick={() => handleApprove && handleApprove(bid.id)}
            >
              Approve
            </button>
            <button
              className="bid-row-btn bid-row-btn-danger"
              onClick={handleDenyClick}
            >
              Deny
            </button>
          </div>
        );
        
      default:
        return (
          <div className="bid-row-actions">
            <button
              className="bid-row-btn bid-row-btn-secondary"
              onClick={handleMessageClick}
            >
              <ChatIcon />
              Message
            </button>
            <button
              className="bid-row-btn bid-row-btn-primary"
              onClick={handleConsultationClick}
            >
              Schedule Consultation
            </button>
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

  const renderPaymentInfo = () => {
    if (!payment_amount || payment_type !== 'down_payment') return null;
    
    return (
      <div className="bid-row-payment-info">
        <span className="payment-label">Down Payment:</span>
        <span className="payment-amount">${payment_amount}</span>
        <span className="payment-remaining">Remaining: ${getRemainingAmount()}</span>
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
    } else {
      setShowBidDetailModal(true);
    }
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
    if (showBidDetailModal) {
      setShowBidDetailModal(false);
    }
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
                {getBidStatus() === 'approved' && (
                  <>
                    {down_payment && (
                      <button
                        className="mobile-action-btn primary"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        Pay Down Payment
                      </button>
                    )}
                  </>
                )}
                
                {getBidStatus() === 'payment' && (
                  <button
                    className="mobile-action-btn primary"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    Pay Now
                  </button>
                )}
                
                {getBidStatus() === 'pending' && (
                  <>
                    <button
                      className="mobile-action-btn success"
                      onClick={() => handleApprove && handleApprove(bid.id)}
                    >
                      Approve
                    </button>
                    <button
                      className="mobile-action-btn danger"
                      onClick={handleDenyClick}
                    >
                      Deny
                    </button>
                  </>
                )}
                
                {getBidStatus() === 'default' && (
                  <>
                    <button
                      className="mobile-action-btn secondary"
                      onClick={handleMessageClick}
                    >
                      <ChatIcon />
                      Message
                    </button>
                    <button
                      className="mobile-action-btn primary"
                      onClick={handleConsultationClick}
                    >
                      Schedule Consultation
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Chat Section */}
            <div className="mobile-bid-detail-section">
              <div className="mobile-chat-header" onClick={toggleChatExpansion}>
                <h4 className="mobile-section-title">Chat with Vendor</h4>
                <div className={`mobile-chat-chevron ${isChatExpanded ? 'expanded' : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              
              {isChatExpanded && (
                <div className="mobile-chat-container">
                  <div className="mobile-chat-body">
                    {isLoadingChat ? (
                      <div className="mobile-loading-chat">Loading chat...</div>
                    ) : (
                      <>
                        {/* Bid description as first message */}
                        <div className="mobile-message received">
                          <div className="mobile-message-content">
                            {description ? (
                              <div 
                                dangerouslySetInnerHTML={{ __html: description }}
                                className="mobile-message-text"
                              />
                            ) : (
                              "Thank you for your request! I'd love to help with your event. Here's what I'm offering:"
                            )}
                          </div>
                        </div>
                        
                        {/* Existing chat messages */}
                        {chatMessages.map((msg, index) => (
                          <div
                            key={index}
                            className={`mobile-message ${msg.sender_id === currentUserId ? "sent" : "received"}`}
                          >
                            <div className="mobile-message-content">
                              {msg.type === 'image' ? (
                                <img 
                                  src={msg.message} 
                                  alt="Chat image" 
                                  className="mobile-message-image"
                                  onClick={() => {
                                    setModalImageSrc(msg.message);
                                    setShowImageModal(true);
                                  }}
                                />
                              ) : msg.type === 'payment_request' ? (
                                <div className="mobile-payment-request">
                                  <div className="mobile-payment-request-header">
                                    <FaCreditCard />
                                    <span>Payment Request</span>
                                  </div>
                                  <div className="mobile-payment-request-amount">
                                    ${msg.payment_amount || JSON.parse(msg.message).amount}
                                  </div>
                                </div>
                              ) : (
                                msg.message
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {isTyping && (
                      <div className="mobile-typing-indicator">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile Message Input */}
                  <div className="mobile-chat-input">
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      id="mobile-file-upload"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="mobile-file-upload" className="mobile-file-upload">
                      <FaPlus />
                    </label>
                    
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        if (currentUserId && business_profiles?.id) {
                          socket.emit("typing", { senderId: currentUserId, receiverId: business_profiles.id });
                          
                          if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current);
                          }
                          
                          typingTimeoutRef.current = setTimeout(() => {
                            socket.emit("stop_typing", { senderId: currentUserId, receiverId: business_profiles.id });
                          }, 1000);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newMessage.trim()) {
                          handleSendMessage(newMessage.trim());
                        }
                      }}
                      className="mobile-message-input"
                    />
                    
                    <button
                      onClick={() => {
                        if (newMessage.trim()) {
                          handleSendMessage(newMessage.trim());
                        }
                      }}
                      disabled={!newMessage.trim()}
                      className="mobile-send-button"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>


          </div>
        </div>
      )}

      {/* Desktop Bid Row */}
      {!mobileDetailView && (
        <div className="bid-row" onClick={handleMobileRowClick}>
          {/* New Tag */}
          {isNew && (
            <div className="bid-new-tag">
              <span>New</span>
            </div>
          )}
          
          {/* Main Row Content */}
          <div className="bid-row-content">
            {/* Left side - Business info */}
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
              
              <div className="bid-row-description">
                {description ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: description }}
                    style={{ 
                      lineHeight: '1.4',
                      fontSize: '14px'
                    }}
                  />
                ) : (
                  <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
                    No description provided
                  </span>
                )}
              </div>
              
              {renderPaymentInfo()}
            </div>
            
            {/* Right side - Status and pricing */}
            <div className="bid-row-right">
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
        </div>
      )}

      {/* Bid Detail Modal - Desktop Only */}
      {showBidDetailModal && !mobileDetailView && (
        <div className="bid-detail-modal-overlay" onClick={handleModalClose}>
          <div className="bid-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bid-detail-modal-header">
              <div className="bid-detail-header-left">
                <div className="bid-amount-display">
                  <span className="bid-amount-number">${bid_amount}</span>
                </div>
                <h3 style={{ marginBottom: '0px', paddingBottom: '0px', fontFamily:"Outfit", fontWeight: "600" }}>Bid Details</h3>
              </div>
              <div className="bid-detail-header-right">
                {showActions && status === 'pending' && (
                  <div className="bid-detail-header-actions">
                    <button
                      className="bid-row-btn bid-row-btn-success"
                      onClick={() => handleApprove && handleApprove(bid.id)}
                    >
                      Approve
                    </button>
                    <button
                      className="bid-row-btn bid-row-btn-danger"
                      onClick={handleDenyClick}
                    >
                      Deny
                    </button>
                  </div>
                )}
                
                {/* Show payment options for approved/accepted bids or bids with payment info */}
                {showActions && (status === 'approved' || status === 'accepted' || payment_type || payment_amount) && (
                  <div className="bid-detail-header-actions">
                    {payment_type === 'down_payment' && payment_amount ? (
                      <>
                        <button
                          className="bid-row-btn bid-row-btn-primary"
                          onClick={() => setShowPaymentModal(true)}
                          style={{ marginRight: '8px' }}
                        >
                          Pay Down Payment (${payment_amount})
                        </button>
                        <button
                          className="bid-row-btn bid-row-btn-success"
                          onClick={() => setShowPaymentModal(true)}
                        >
                          Pay Full Amount (${bid_amount})
                        </button>
                      </>
                    ) : (
                      <button
                        className="bid-row-btn bid-row-btn-success"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        Pay Full Amount (${bid_amount})
                      </button>
                    )}
                  </div>
                )}
                
                {/* Always show payment options if we have payment info, regardless of status */}
                {showActions && !status && (payment_type || payment_amount) && (
                  <div className="bid-detail-header-actions">
                    <button
                      className="bid-row-btn bid-row-btn-success"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      Payment Options
                    </button>
                  </div>
                )}
                
                <button 
                  className="bid-detail-modal-close"
                  onClick={handleModalClose}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="bid-detail-modal-content">
              {/* Business Profile Section */}
              <div className="bid-detail-section">
                <h4>Business Information</h4>
                <div className="business-profile-detail">
                  <img
                    src={profileImage}
                    alt={`${business_profiles.business_name} profile`}
                    className="business-profile-img"
                    onClick={handleProfileClick}
                  />
                  <div className="business-info">
                    <h5 style={{ marginBottom: '0px', paddingBottom: '0px' }}>
                      {business_profiles.business_name}
                      {/* Debug: {JSON.stringify({ is_verified: business_profiles.is_verified, business_id: business_profiles.id })} */}
                      {business_profiles.is_verified && (
                        <div className="verified-check-container" style={{ display: 'inline-block', marginLeft: '8px' }}> 
                          <img src={Verified} alt="Verified" style={{ width: '16px', height: '16px', marginBottom: '4px' }} />
                          <span className="verified-tooltip">
                            This business is verified by Bidi. You will have a 100% money back guarantee if you pay through Bidi.
                          </span>
                        </div>
                      )}
                    </h5>
                    {averageRating > 0 && (
                      <div className="business-rating">
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
                  </div>
                  <div className="business-profile-actions">
                    <button
                      className="bid-row-btn bid-row-btn-secondary"
                      onClick={handleProfileClick}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>



              {/* Payment Information */}
              {payment_amount && payment_type === 'down_payment' && (
                <div className="bid-detail-section">
                  <h4>Payment Information</h4>
                  <div className="payment-details">
                    <div className="payment-item">
                      <span>Down Payment Required:</span>
                      <span className="payment-amount">${payment_amount}</span>
                    </div>
                    <div className="payment-item">
                      <span>Remaining Balance:</span>
                      <span className="payment-remaining">${getRemainingAmount()}</span>
                    </div>
                  </div>
                </div>
              )}



              {/* Messenger Section */}
              <div className="bid-detail-section">
                <div className="chat-header" onClick={toggleChatExpansion}>
                  <h4>Chat with Vendor</h4>
                  <div className={`chat-chevron ${isChatExpanded ? 'expanded' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                {isChatExpanded && (
                  <>
                    <div className="chat-window" style={{ height: '400px', overflowY: 'auto' }}>
                      <div className="chat-body" style={{ height: '400px', overflowY: 'auto' }}>
                        {isLoadingChat ? (
                          <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                            Loading chat...
                          </div>
                        ) : (
                          <>
                            {/* Always show bid description as first message */}
                            <div className="message-bubble received">
                              <div>
                                {description ? (
                                  <div 
                                    dangerouslySetInnerHTML={{ __html: description }}
                                    style={{ 
                                      lineHeight: '1.5',
                                      fontSize: '14px'
                                    }}
                                  />
                                ) : (
                                  "Thank you for your request! I'd love to help with your event. Here's what I'm offering:"
                                )}
                              </div>
                              <div className="message-time">
                                {new Date().toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                  timeZone: 'America/Denver'
                                })}
                              </div>
                            </div>
                            
                            {/* Show existing chat messages after bid description */}
                            {chatMessages.map((msg, index) => (
                              <div
                                key={index}
                                className={`message-bubble ${msg.sender_id === currentUserId ? "sent" : "received"}`}
                              >
                                <div>
                                  {msg.type === 'image' ? (
                                    <img 
                                      src={msg.message} 
                                      alt="Chat image" 
                                      className="chat-image"
                                      onClick={() => {
                                        setModalImageSrc(msg.message);
                                        setShowImageModal(true);
                                      }}
                                      style={{ 
                                        maxWidth: '200px', 
                                        maxHeight: '200px', 
                                        cursor: 'pointer',
                                        borderRadius: '8px'
                                      }} 
                                    />
                                  ) : msg.type === 'payment_request' ? (
                                    <div className="payment-request-message">
                                          <div className="payment-request-header">
                                            <FaCreditCard />
                                            <span>Payment Request</span>
                                          </div>
                                          <div className="payment-request-amount">
                                            ${msg.payment_amount || JSON.parse(msg.message).amount}
                                          </div>
                                          <div className="payment-request-description">
                                            {msg.payment_data?.description || JSON.parse(msg.message).description}
                                          </div>
                                          {msg.payment_data?.lineItems && (
                                            <div className="payment-request-line-items">
                                              {msg.payment_data.lineItems.map((item, idx) => (
                                                <div key={idx} className="payment-line-item">
                                                  <span>{item.description}</span>
                                                  <span>${item.amount}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {msg.payment_data?.tax > 0 && (
                                            <div className="payment-request-tax">
                                              Tax ({msg.payment_data.taxRate}%): ${msg.payment_data.tax}
                                            </div>
                                          )}
                                          <div className="payment-request-total">
                                            Total: ${msg.payment_amount || JSON.parse(msg.message).amount}
                                          </div>
                                      </div>
                                  ) : (
                                    msg.message
                                  )}
                                </div>
                                <div className="message-time">
                                  {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                    timeZone: 'America/Denver'
                                  })}
                                  {msg.sender_id === currentUserId && (
                                    <span className="seen-indicator">
                                      {msg.seen ? "✓✓" : "✓"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        {isTyping && (
                          <div className="typing-indicator">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Message Input */}
                    <footer className="chat-footer" style={{ marginTop: 16, marginBottom: '0px' }}>
                  <div className="chat-upload-container">
                    <label htmlFor="file-upload" className="chat-upload-btn">
                      <span>＋</span>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleFileUpload}
                      />
                    </label>
                    {stripeAccountId && (
                      <button 
                        className="chat-payment-btn"
                        onClick={() => setShowPaymentModal(true)}
                        title="Send Payment Request"
                      >
                        <FaCreditCard />
                      </button>
                    )}
                  </div>

                  <div className="chat-input-wrapper">
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
                      className="chat-input"
                      placeholder="Add a message…"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        // Auto-resize the textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        
                        // Emit typing indicator
                        if (currentUserId && business_profiles?.id) {
                          socket.emit("typing", { senderId: currentUserId, receiverId: business_profiles.id });
                          
                          if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current);
                          }
                          
                          typingTimeoutRef.current = setTimeout(() => {
                            socket.emit("stop_typing", { senderId: currentUserId, receiverId: business_profiles.id });
                          }, 1500);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(newMessage);
                          // Reset textarea height after sending
                          e.target.style.height = 'auto';
                        }
                      }}
                      rows={1}
                      style={{ resize: 'none', overflow: 'hidden' }}
                    />
                  </div>

                  <button 
                    className="chat-send-btn" 
                    onClick={() => {
                      if (newMessage.trim() || pendingFile) {
                        handleSendMessage(newMessage);
                      }
                    }}
                  >
                    Send
                  </button>
                </footer>
                  </>
                )}
              </div>
            </div>
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
                {payment_type === 'down_payment' && payment_amount ? (
                  <>
                    <div className="payment-option">
                      <h4>Down Payment</h4>
                      <p className="payment-amount">${payment_amount}</p>
                      <p className="payment-description">Secure your booking with a partial payment</p>
                      <button 
                        className="payment-option-btn primary"
                        onClick={() => {
                          toast.info(`Processing down payment of $${payment_amount}...`);
                          setShowPaymentModal(false);
                        }}
                      >
                        Pay Down Payment
                      </button>
                    </div>
                    <div className="payment-option">
                      <h4>Full Payment</h4>
                      <p className="payment-amount">${bid_amount}</p>
                      <p className="payment-description">Pay the complete amount upfront</p>
                      <button 
                        className="payment-option-btn success"
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
