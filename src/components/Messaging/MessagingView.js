// src/components/Messaging/MessagingView.js

import React, { useState, useEffect, useRef, useMemo } from "react";
import { socket } from "../../socket";
import { supabase } from "../../supabaseClient";
import "../../styles/chat.css";
import { FaArrowLeft, FaCreditCard, FaPlus, FaTrash, FaImage, FaCheckCircle, FaTimes } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { formatMessageText } from "../../utils/formatMessageText";
import { formatBusinessName } from '../../utils/formatBusinessName';
import { formatTimestamp, isToday } from "../../utils/dateTimeUtils";
import PaymentCard from './PaymentCard';
import BidDetailModal from '../Bid/BidDetailModal';
import SlidingBidModal from '../Request/SlidingBidModal';
import { toast } from 'react-toastify';

// Skeleton components for loading states
const MessageSkeleton = ({ isSent }) => (
  <div className={`message-bubble skeleton-message ${isSent ? "sent" : "received"}`}>
    <div className="skeleton-message-content"></div>
    <div className="skeleton-message-time"></div>
  </div>
);

const ChatHeaderSkeleton = () => (
  <header className="chat-header skeleton-header">
    <div className="skeleton-back-button"></div>
    <div className="header-center-messaging">
      <div className="skeleton-profile-circle"></div>
      <div className="skeleton-business-name"></div>
    </div>
  </header>
);

const BidInfoSkeleton = () => (
  <div className="bid-info-header skeleton-bid-info">
    <div className="skeleton-bid-amount"></div>
    <div className="skeleton-bid-button"></div>
  </div>
);

export default function MessagingView({
  currentUserId,
  businessId,
  onBack
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [initialLetter, setInitialLetter] = useState("");
  const [isBusinessProfile, setIsBusinessProfile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [bidInfo, setBidInfo] = useState(null);
  const [isCurrentUserBusiness, setIsCurrentUserBusiness] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  
  // New state for enhanced menu system
  const [showMenu, setShowMenu] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [previewImageUrls, setPreviewImageUrls] = useState([]);
  const [showBidInvitationModal, setShowBidInvitationModal] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
  // Combined image preview modal state
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  
  // Bid detail modal state
  const [showBidDetailModal, setShowBidDetailModal] = useState(false);
  
  // Edit bid modal state
  const [showEditBidModal, setShowEditBidModal] = useState(false);
  
  // Approval modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedBidForApproval, setSelectedBidForApproval] = useState(null);

  // Stripe account ID for payment processing
  const [stripeAccountId, setStripeAccountId] = useState(null);

  // Memoize the loading skeletons at the top level to avoid conditional hook calls
  const loadingSkeletons = useMemo(() => (
    <div className="messaging-view">
      <ChatHeaderSkeleton />
      <BidInfoSkeleton />
      <div className="chat-window-messaging-view">
        <div className="chat-body-messaging-view">
          {Array.from({ length: 6 }).map((_, index) => (
            <MessageSkeleton 
              key={index} 
              isSent={index % 2 === 0} 
            />
          ))}
        </div>
      </div>
      <div className="chat-footer skeleton-footer">
        <div className="skeleton-upload-btn"></div>
        <div className="skeleton-input"></div>
        <div className="skeleton-send-btn"></div>
      </div>
    </div>
  ), []);

  // Scroll to top when component mounts
  useEffect(() => {
    // Force scroll to top with multiple methods
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    // Additional mobile-specific scroll
    if (window.innerWidth <= 768) {
      window.scrollTo(0, 0);
      document.body.scrollIntoView({ behavior: 'instant' });
    }
  }, []);

  // Add window resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add click outside handler for menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.chat-plus-menu-container')) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Cleanup URL objects when component unmounts
  useEffect(() => {
    return () => {
      previewImageUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewImageUrls]);

  // Debug payment modal state changes
  useEffect(() => {
    console.log('showPaymentModal state changed to:', showPaymentModal);
    
    // If modal was unexpectedly closed, log additional info
    if (!showPaymentModal) {
      console.log('Payment modal was closed. Stack trace:', new Error().stack);
    }
  }, [showPaymentModal]);

  // Get profile image from navigation state
  useEffect(() => {
    if (location.state?.profileImage) {
      setProfilePhoto(location.state.profileImage);
    }
    
    // Add preset message if coming from follow-up
    if (location.state?.presetMessage && location.state?.fromFollowUp) {
      setNewMessage(location.state.presetMessage);
    }
  }, [location.state]);

  // Fetch business/individual information
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!businessId) return;
      
      console.log("Fetching user info for ID:", businessId);
      try {
        // First get the user info from individual_profiles
        const { data: individualData, error: individualError } = await supabase
          .from("individual_profiles")
          .select("first_name, last_name")
          .eq("id", businessId)
          .single();

        let userData;
        if (!individualError && individualData) {
          // If we found an individual profile, use their name
          setBusinessName(`${individualData.first_name} ${individualData.last_name}`.trim());
          setInitialLetter(individualData.first_name?.charAt(0)?.toUpperCase() || "");
          userData = individualData;
          setIsBusinessProfile(false);
        } else {
          // If not found in individual_profiles, try wedding_planner_profiles
          const { data: weddingPlannerData, error: weddingPlannerError } = await supabase
            .from("wedding_planner_profiles")
            .select("business_name")
            .eq("id", businessId)
            .single();

          if (!weddingPlannerError && weddingPlannerData) {
            setBusinessName(weddingPlannerData.business_name || "Wedding Planner");
            setInitialLetter(weddingPlannerData.business_name?.charAt(0)?.toUpperCase() || "");
            userData = weddingPlannerData;
            setIsBusinessProfile(true);
          } else {
            // If not found in wedding_planner_profiles, try business_profiles
            const { data: businessData, error: businessError } = await supabase
              .from("business_profiles")
              .select("business_name")
              .eq("id", businessId)
              .single();

            if (businessError) {
              if (businessError.code === 'PGRST116') {
                // No profile found - this could be a user who hasn't completed profile setup
                console.log("User has no profile yet - showing generic name");
                setBusinessName("User");
                setInitialLetter("U");
                setIsBusinessProfile(false);
                return;
              }
              throw businessError;
            }
            setBusinessName(businessData.business_name || "Business");
            setInitialLetter(businessData.business_name?.charAt(0)?.toUpperCase() || "");
            userData = businessData;
            setIsBusinessProfile(true);
          }
        }

        // Get the profile photo
        const { data: photoData, error: photoError } = await supabase
          .from("profile_photos")
          .select("photo_url")
          .eq("user_id", businessId)
          .eq("photo_type", "profile")
          .single();

        console.log("User data:", userData);
        console.log("Photo data:", photoData);

        setProfilePhoto(photoData?.photo_url || null);
      } catch (error) {
        console.error("Error fetching user info:", error);
        setBusinessName("User");
        setProfilePhoto(null);
        setInitialLetter("U");
        setIsBusinessProfile(false);
      }
    };

    fetchUserInfo();
  }, [businessId]);

  // Fetch messages when component mounts or when currentUserId/businessId changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUserId || !businessId) {
        console.error('Missing currentUserId or businessId for messaging');
        return;
      }

      try {
        const { data: out, error: outError } = await supabase
          .from("messages")
          .select("*")
          .eq("sender_id", currentUserId)
          .eq("receiver_id", businessId);

        if (outError) {
          console.error("Error fetching outgoing messages:", outError);
          return;
        }

        const { data: incoming, error: incomingError } = await supabase
          .from("messages")
          .select("*")
          .eq("sender_id", businessId)
          .eq("receiver_id", currentUserId);

        if (incomingError) {
          console.error("Error fetching incoming messages:", incomingError);
          return;
        }

        const outgoingMessages = out || [];
        const incomingMessages = incoming || [];

        const all = [...outgoingMessages, ...incomingMessages].map((r) => ({
          id: r.id,
          senderId: r.sender_id,
          receiverId: r.receiver_id,
          message: r.message,
          createdAt: r.created_at,
          seen: r.seen || false,
          type: r.type || 'text'
        }));

        all.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setMessages(all);

        // Mark incoming messages as seen
        const unreadMessages = incomingMessages.filter(msg => !msg.seen);
        if (unreadMessages.length > 0) {
          const messageIds = unreadMessages.map(msg => msg.id);
          const { error: updateError } = await supabase
            .from('messages')
            .update({ seen: true })
            .in('id', messageIds);

          if (updateError) {
            console.error('Error marking messages as seen:', updateError);
          }
        }
      } catch (error) {
        console.error("Error in fetchMessages:", error);
      }
    };

    fetchMessages();
  }, [currentUserId, businessId]);

  // Socket connection
  useEffect(() => {
    if (!currentUserId) return;

    socket.emit("join", currentUserId);

    const handleReceive = (msg) => {
      if (
        (msg.senderId === businessId && msg.receiverId === currentUserId) ||
        (msg.senderId === currentUserId && msg.receiverId === businessId)
      ) {
        setMessages((prev) => {
          const exists = prev.some(m =>
            m.senderId === msg.senderId &&
            m.receiverId === msg.receiverId &&
            m.message === msg.message &&
            Math.abs(new Date(m.createdAt) - new Date(msg.createdAt)) < 1000
          );
          return exists ? prev : [...prev, msg];
        });
      }
    };

    const handleTyping = (fromId) => {
      if (fromId === businessId) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (fromId) => {
      if (fromId === businessId) {
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
  }, [currentUserId, businessId]);

  // Auto-scroll when new messages come in
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isTyping]);

  // Function to fetch bid information
  const fetchBidInfo = async () => {
    console.log('Starting bid fetch with:', { currentUserId, businessId });
    
    if (!currentUserId || !businessId) {
      console.log('Missing required IDs:', { currentUserId, businessId });
      return;
    }

    try {
      // First determine if current user is a business or individual
      console.log('Checking if current user is a business...');
      const { data: businessData, error: businessError } = await supabase
        .from('business_profiles')
        .select('id, stripe_account_id')
        .eq('id', currentUserId)
        .single();

      console.log('Business check result:', { businessData, businessError });
      const isCurrentUserBusiness = !businessError && businessData;
      console.log('Is current user a business?', isCurrentUserBusiness);

      // Get all request IDs from various request tables
      const requestTables = [
        'beauty_requests',
        'catering_requests',
        'dj_requests',
        'florist_requests',
        'photography_requests',
        'videography_requests',
        'wedding_planning_requests'
      ];

      let allRequestIds = [];

      // If current user is a business, get requests they've bid on
      if (isCurrentUserBusiness) {
        console.log('Fetching bids for business user...');
        const { data: bids, error: bidsError } = await supabase
          .from('bids')
          .select('request_id, bid_amount, status, created_at, business_profile:business_profiles(id, business_name)')
          .eq('user_id', currentUserId);

        console.log('Business bids result:', { bids, bidsError });
        if (!bidsError && bids) {
          allRequestIds = bids.map(bid => bid.request_id);
          console.log('Request IDs from business bids:', allRequestIds);
        }
      } else {
        // If current user is an individual, get their requests
        console.log('Fetching requests for individual user...');
        for (const table of requestTables) {
          console.log(`Checking ${table}...`);
          try {
            // Special handling for photography_requests which uses profile_id instead of user_id
            const columnName = table === 'photography_requests' ? 'profile_id' : 'user_id';
           
            const { data: requests, error: requestsError } = await supabase
              .from(table)
              .select('id')
              .eq(columnName, currentUserId)
              .limit(1);  // Add limit to optimize query

            if (requestsError) {
              console.error(`Error querying ${table}:`, requestsError);
              continue;  // Skip this table if there's an error
            }

            console.log(`${table} result:`, { requests, requestsError });
            if (requests && requests.length > 0) {
              // If we found at least one request, get all of them
              const { data: allRequests, error: allRequestsError } = await supabase
                .from(table)
                .select('id')
                .eq(columnName, currentUserId);

              if (!allRequestsError && allRequests) {
                allRequestIds = [...allRequestIds, ...allRequests.map(req => req.id)];
              }
            }
          } catch (error) {
            console.error(`Error fetching ${table}:`, error);
          }
        }
        console.log('All request IDs from individual:', allRequestIds);
      }

      if (allRequestIds.length > 0) {
        console.log('Fetching most recent bid for request IDs:', allRequestIds);
        try {
          // Get the most recent bid with business profile data and photo
          const { data: bids, error: bidsError } = await supabase
            .from('bids')
            .select(`
              *,
              business_profiles (
                id,
                business_name,
                is_verified,
                stripe_account_id
              )
            `)
            .in('request_id', allRequestIds)
            .eq('user_id', isCurrentUserBusiness ? currentUserId : businessId)
            .order('created_at', { ascending: false })
            .limit(1);

          // If we found a bid, get the business profile photo
          if (!bidsError && bids && bids.length > 0) {
            const bid = bids[0];
            if (bid.business_profiles) {
              const businessId = bid.business_profiles.id;
              
              // Fetch the profile photo for this business
              const { data: photoData, error: photoError } = await supabase
                .from('profile_photos')
                .select('photo_url')
                .eq('user_id', businessId)
                .eq('photo_type', 'profile')
                .single();

              if (!photoError && photoData) {
                // Add the profile photo to the bid data
                bid.business_profiles.profile_image = photoData.photo_url;
              }
            }
          }

          console.log('Final bids query result:', { bids, bidsError });
          if (!bidsError && bids && bids.length > 0) {
            console.log('Setting bid info:', bids[0]);
            setBidInfo(bids[0]);
            setStripeAccountId(bids[0].business_profiles?.stripe_account_id);
          } else {
            console.log('No bids found or error occurred');
            setBidInfo(null);
            setStripeAccountId(null);
          }
        } catch (error) {
          console.error('Error fetching bids:', error);
          setBidInfo(null);
          setStripeAccountId(null);
        }
      } else {
        console.log('No request IDs found to check for bids');
        setBidInfo(null);
        setStripeAccountId(null);
      }
    } catch (error) {
      console.error('Error in fetchBidInfo:', error);
    }
  };

  // Function to refresh bid info
  const refreshBidInfo = async () => {
    await fetchBidInfo();
  };

  // Add new useEffect to fetch bid information
  useEffect(() => {
    fetchBidInfo();
  }, [currentUserId, businessId]);

  // Add new useEffect to check if current user is a business
  useEffect(() => {
    const checkBusinessProfile = async () => {
      if (!currentUserId) return;
      
      try {
        const { data, error } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('id', currentUserId)
          .single();
        
        console.log('Business profile check:', { data, error });
        setIsCurrentUserBusiness(!!data);
      } catch (error) {
        console.error('Error checking business profile:', error);
      }
    };

    checkBusinessProfile();
  }, [currentUserId]);

  // Update stripeAccountId whenever bidInfo changes
  useEffect(() => {
    if (bidInfo?.business_profiles?.stripe_account_id) {
      setStripeAccountId(bidInfo.business_profiles.stripe_account_id);
    } else {
      setStripeAccountId(null);
    }
  }, [bidInfo]);

  if (!currentUserId || !businessId) {
    return loadingSkeletons;
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
  
    // Send text message
    socket.emit("send_message", {
      senderId: currentUserId,
      receiverId: businessId,
      message: newMessage.trim(),
      type: "text",
      seen: false,
    });
  
    // Cleanup
    setNewMessage("");
    socket.emit("stop_typing", { senderId: currentUserId, receiverId: businessId });
  };


  // 4) Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    socket.emit("typing", { senderId: currentUserId, receiverId: businessId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { senderId: currentUserId, receiverId: businessId });
    }, 1500);
  };

  const handleBack = () => {
    console.log('Back button clicked');
    if (onBack) {
      console.log('Using onBack prop');
      onBack();
    } else {
      console.log('Navigating to /messages');
      navigate('/messages/0');
    }
  };





  const handleMultipleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Always use the multiple files approach, even for single files
    setPendingFiles(files);
    
    // Create preview URLs for files
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewImageUrls(newPreviewUrls);
    
    // Show the combined image preview modal
    setShowImagePreviewModal(true);

    e.target.value = null;
    setShowMenu(false);
  };

  const removePendingFile = (index) => {
    const newFiles = pendingFiles.filter((_, i) => i !== index);
    const newPreviewUrls = previewImageUrls.filter((_, i) => i !== index);
    
    setPendingFiles(newFiles);
    setPreviewImageUrls(newPreviewUrls);
  };

  const sendMultipleImages = async () => {
    if (pendingFiles.length === 0) return;

    setIsUploadingImages(true);
    try {
      const uploadPromises = pendingFiles.map(async (file) => {
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const fileName = `${Date.now()}_${Math.random()}_${cleanFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error("Image upload failed:", uploadError);
          return null;
        }

        const { publicUrl } = supabase
          .storage
          .from('chat-images')
          .getPublicUrl(fileName).data;

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(url => url !== null);

      // Send each image as a separate message
      validUrls.forEach(url => {
        socket.emit("send_message", {
          senderId: currentUserId,
          receiverId: businessId,
          message: url,
          type: "image",
          seen: false,
        });
      });

      // Cleanup
      setPendingFiles([]);
      setPreviewImageUrls([]);
      pendingFiles.forEach(file => URL.revokeObjectURL(file));
      previewImageUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Close the modal
      setShowImagePreviewModal(false);
    } catch (err) {
      console.error("Multiple image send failed:", err);
    } finally {
      setIsUploadingImages(false);
    }
  };



  // Function to close image preview modal and cleanup
  const closeImagePreviewModal = () => {
    setShowImagePreviewModal(false);
    setPendingFiles([]);
    setPreviewImageUrls([]);
    
    // Cleanup object URLs
    previewImageUrls.forEach(url => URL.revokeObjectURL(url));
  };

  const handleBusinessClick = (businessId, businessName) => {
    const formattedName = formatBusinessName(businessName);
    navigate(`/portfolio/${businessId}/${formattedName}`);
  };





  const handleSendBidInvitation = () => {
    if (!bidInfo) {
      alert('No bid information available to send invitation');
      return;
    }

    // Create a bid invitation message with interactive data
    const invitationData = {
      type: 'bid_invitation',
      bidId: bidInfo.id,
      bidAmount: bidInfo.bid_amount,
      businessName: bidInfo.business_profiles?.business_name || 'Business',
      message: `Hi! I'd like to invite you to accept my bid for $${bidInfo.bid_amount}. Please let me know if you have any questions or if you'd like to proceed with the booking.`
    };

    socket.emit("send_message", {
      senderId: currentUserId,
      receiverId: businessId,
      message: JSON.stringify(invitationData),
      type: "bid_invitation",
      seen: false,
    });

    setShowBidInvitationModal(false);
    setShowMenu(false);
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const closeMenu = () => {
    setShowMenu(false);
  };

  // Bid status management functions
  const handleMoveToPending = async (bid) => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ status: 'pending' })
        .eq('id', bid.id);
      
      if (error) throw error;
      
      // Refresh bid info
      await refreshBidInfo();
      toast.success('Bid moved to pending');
    } catch (error) {
      console.error('Error updating bid status:', error);
      toast.error('Failed to update bid status');
    }
  };

  const handleMoveToAccepted = async (bid) => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', bid.id);
      
      if (error) throw error;
      
      // Refresh bid info
      await refreshBidInfo();
      toast.success('Bid accepted');
    } catch (error) {
      console.error('Error updating bid status:', error);
      toast.error('Failed to accept bid');
    }
  };

  const handleMoveToNotInterested = async (bid) => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ status: 'denied' })
        .eq('id', bid.id);
      
      if (error) throw error;
      
      // Refresh bid info
      await refreshBidInfo();
      toast.success('Bid marked as not interested');
    } catch (error) {
      console.error('Error updating bid status:', error);
      toast.error('Failed to update bid status');
    }
  };

  const handleMoveToInterested = async (bid) => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ status: 'interested' })
        .eq('id', bid.id);
      
      if (error) throw error;
      
      // Refresh bid info
      await refreshBidInfo();
      toast.success('Bid marked as interested');
    } catch (error) {
      console.error('Error updating bid status:', error);
      toast.error('Failed to update bid status');
    }
  };

  const handleApproveBid = async (bid) => {
    try {
      // First, decline all other bids for this request
      const otherBids = await supabase
        .from('bids')
        .select('id')
        .eq('request_id', bid.request_id)
        .neq('id', bid.id)
        .neq('status', 'denied')
        .neq('status', 'expired');

      if (otherBids.data && otherBids.data.length > 0) {
        const { error: declineError } = await supabase
          .from('bids')
          .update({ status: 'denied' })
          .in('id', otherBids.data.map(bid => bid.id));

        if (declineError) {
          console.error('Error declining other bids:', declineError);
          toast.error('Failed to decline other bids. Please try again.');
          return;
        }
      }

      // Close the request (determine table name based on request type)
      const requestTables = [
        'beauty_requests',
        'catering_requests',
        'dj_requests',
        'florist_requests',
        'photography_requests',
        'videography_requests',
        'wedding_planning_requests'
      ];

      for (const table of requestTables) {
        const { data: requestData, error: requestError } = await supabase
          .from(table)
          .select('id')
          .eq('id', bid.request_id)
          .single();

        if (!requestError && requestData) {
          const { error: closeError } = await supabase
            .from(table)
            .update({ 
              status: 'closed',
              closed_at: new Date().toISOString()
            })
            .eq('id', bid.request_id);

          if (closeError) {
            console.error('Error closing request:', closeError);
          }
          break; // Found the table, no need to check others
        }
      }

      // Update the selected bid status and add acceptance timestamp
      const { error } = await supabase
        .from('bids')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', bid.id);

      if (error) {
        console.error('Error updating bid:', error);
        toast.error('Failed to accept bid. Please try again.');
        return;
      }

      // Refresh bid info and show approval modal
      await refreshBidInfo();
      setShowBidDetailModal(false);
      setShowApprovalModal(true);
      setSelectedBidForApproval(bid);
      
      toast.success('Bid accepted successfully! Other bids have been declined and request closed.');
    } catch (error) {
      console.error('Error accepting bid:', error);
      toast.error('Failed to accept bid. Please try again.');
    }
  };

  const handlePostApprovalAction = async (action) => {
    if (action === 'message') {
      // Close approval modal and focus on message input
      setShowApprovalModal(false);
      setSelectedBidForApproval(null);
      
      // Focus on the message input
      const messageInput = document.querySelector('.chat-input');
      if (messageInput) {
        messageInput.focus();
      }
    }
  };

  // Function to handle accepting a bid from invitation
  const handleAcceptBidFromInvitation = async (bidId) => {
    try {
      // First, decline all other bids for this request
      const { data: bidData, error: bidError } = await supabase
        .from('bids')
        .select('request_id')
        .eq('id', bidId)
        .single();

      if (bidError) throw bidError;

      const otherBids = await supabase
        .from('bids')
        .select('id')
        .eq('request_id', bidData.request_id)
        .neq('id', bidId)
        .neq('status', 'denied')
        .neq('status', 'expired');

      if (otherBids.data && otherBids.data.length > 0) {
        const { error: declineError } = await supabase
          .from('bids')
          .update({ status: 'denied' })
          .in('id', otherBids.data.map(bid => bid.id));

        if (declineError) {
          console.error('Error declining other bids:', declineError);
          toast.error('Failed to decline other bids. Please try again.');
          return;
        }
      }

      // Close the request (determine table name based on request type)
      const requestTables = [
        'beauty_requests',
        'catering_requests',
        'dj_requests',
        'florist_requests',
        'photography_requests',
        'videography_requests',
        'wedding_planning_requests'
      ];

      for (const table of requestTables) {
        const { data: requestData, error: requestError } = await supabase
          .from(table)
          .select('id')
          .eq('id', bidData.request_id)
          .single();

        if (!requestError && requestData) {
          const { error: closeError } = await supabase
            .from(table)
            .update({ 
              status: 'closed',
              closed_at: new Date().toISOString()
            })
            .eq('id', bidData.request_id);

          if (closeError) {
            console.error('Error closing request:', closeError);
          }
          break; // Found the table, no need to check others
        }
      }

      // Update the selected bid status and add acceptance timestamp
      const { error } = await supabase
        .from('bids')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', bidId);

      if (error) {
        console.error('Error updating bid:', error);
        toast.error('Failed to accept bid. Please try again.');
        return;
      }

      // Send a confirmation message
      const confirmationMessage = {
        type: 'bid_accepted',
        bidId: bidId,
        message: `Great! I've accepted your bid. Let's proceed with the booking details.`
      };

      socket.emit("send_message", {
        senderId: currentUserId,
        receiverId: businessId,
        message: JSON.stringify(confirmationMessage),
        type: "bid_accepted",
        seen: false,
      });

      // Refresh bid info
      await refreshBidInfo();
      toast.success('Bid accepted successfully! Other bids have been declined and request closed.');
    } catch (error) {
      console.error('Error accepting bid from invitation:', error);
      toast.error('Failed to accept bid. Please try again.');
    }
  };

  return (
    <div className="messaging-view">
      {!location.state?.fromDashboard && (
        <header className="chat-header">
          {isMobile && (
            <button 
              className="back-button-messaging" 
              onClick={handleBack}
              type="button"
              aria-label="Go back"
            >
              <FaArrowLeft />
            </button>
          )}
          <div className="header-center-messaging">
            <div 
              className="profile-circle"
              onClick={isBusinessProfile ? () => handleBusinessClick(businessId, businessName) : undefined}
              style={{ cursor: isBusinessProfile ? 'pointer' : 'default' }}
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="profile-circle" style={{borderRadius:'50%'}} />
              ) : (
                <span className="initial-letter">{initialLetter}</span>
              )}
            </div>
            <div>
              <span className="business-name-messaging">{businessName}</span>
            </div>
          </div>
        </header>
      )}

      {bidInfo && (
        <div className="bid-info-header">
          {console.log('Rendering bid info:', bidInfo)}
          <div className="bid-info-content">
            <div className="bid-info-left">
              <span className="bid-label">Bid Amount:</span>
              <span className="bid-amount-messaging">${bidInfo.bid_amount}</span>
            </div>
            <button 
              className="view-bid-button"
              onClick={() => {
                console.log('Bid button clicked');
                if (isCurrentUserBusiness) {
                  // For business users, open edit bid modal
                  setShowEditBidModal(true);
                } else {
                  // For individual users, open bid detail modal
                  setShowBidDetailModal(true);
                }
              }}
              style={{
                cursor: 'pointer'
              }}
              title={isCurrentUserBusiness ? 'Edit your bid' : 'View bid details'}
            >
              {isCurrentUserBusiness ? 'Edit Bid' : 'View Bid'}
            </button>
          </div>
        </div>
      )}

      <div className="chat-window-messaging-view">
        <div className="chat-body-messaging-view">
          {messages.map((msg, index) => {
            // Check if we need to show a date separator
            const showDateSeparator = index === 0 || 
              !isToday(messages[index - 1].createdAt) || 
              !isToday(msg.createdAt);
            
            return (
              <React.Fragment key={index}>
                {showDateSeparator && (
                  <div className="date-separator">
                    <div className="date-separator-line"></div>
                    <span className="date-separator-text">
                      {formatTimestamp(msg.createdAt, 'date')}
                    </span>
                    <div className="date-separator-line"></div>
                  </div>
                )}
                <div
                  className={`message-bubble ${msg.senderId === currentUserId ? "sent" : "received"} ${!msg.seen && msg.senderId === currentUserId ? "unseen" : ""}`}
                >
              {msg.type === 'image' ? (
                <img
                  src={msg.message}
                  alt="Sent"
                  style={{ maxWidth: "200px", borderRadius: "8px", cursor: "pointer" }}
                  onClick={() => {
                    setModalImageSrc(msg.message);
                    setShowImageModal(true);
                  }}
                />
              ) : msg.type === 'payment_request' ? (
                <PaymentCard
                  amount={msg.payment_amount || JSON.parse(msg.message).amount}
                  businessName={businessName}
                  description={msg.payment_data?.description || JSON.parse(msg.message).description}
                  lineItems={msg.payment_data?.lineItems || JSON.parse(msg.message).paymentData.lineItems}
                  subtotal={msg.payment_data?.subtotal || JSON.parse(msg.message).paymentData.subtotal}
                  tax={msg.payment_data?.tax || JSON.parse(msg.message).paymentData.tax}
                  taxRate={msg.payment_data?.taxRate || JSON.parse(msg.message).paymentData.taxRate}
                  paymentStatus={msg.payment_status}
                />
              ) : msg.type === 'bid_invitation' ? (
                <div className="bid-invitation-message">
                  {(() => {
                    try {
                      const invitationData = JSON.parse(msg.message);
                      return (
                        <>
                          <div className="invitation-text">
                            {formatMessageText(invitationData.message)}
                          </div>
                          {!isCurrentUserBusiness && (
                            <div className="invitation-actions">
                              <button
                                className="accept-bid-btn"
                                onClick={() => handleAcceptBidFromInvitation(invitationData.bidId)}
                                style={{
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '8px 16px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  marginTop: '8px'
                                }}
                              >
                                Accept Bid (${invitationData.bidAmount})
                              </button>
                            </div>
                          )}
                        </>
                      );
                    } catch (error) {
                      console.error('Error parsing bid invitation:', error);
                      return formatMessageText(msg.message);
                    }
                  })()}
                </div>
              ) : msg.type === 'bid_accepted' ? (
                <div className="bid-accepted-message">
                  {(() => {
                    try {
                      const acceptedData = JSON.parse(msg.message);
                      return (
                        <div className="accepted-text" style={{ color: '#10b981', fontWeight: '500' }}>
                          {formatMessageText(acceptedData.message)}
                        </div>
                      );
                    } catch (error) {
                      console.error('Error parsing bid accepted:', error);
                      return formatMessageText(msg.message);
                    }
                  })()}
                </div>
              ) : (
                formatMessageText(msg.message)
              )}
              <div className="message-time">
                {formatTimestamp(msg.createdAt, 'datetime')}
                {msg.senderId === currentUserId && (
                  <span className="seen-indicator">
                    {msg.seen ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
          {isTyping && (
            <div className="typing-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {showImageModal && (
        <div className="modal-backdrop" onClick={() => setShowImageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={modalImageSrc}
              alt="Full Size"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                border: "none",
                boxShadow: "none"
              }}
            />
          </div>
        </div>
      )}

      {/* Combined Image Preview Modal */}
      {showImagePreviewModal && (
        <div className="image-preview-modal-overlay" onClick={closeImagePreviewModal}>
          <div className="image-preview-modal" onClick={(e) => e.stopPropagation()}>
                           <div className="image-preview-modal-header">
                 <h3>
                   {`Images to Send (${pendingFiles.length})`}
                 </h3>
              <button 
                className="close-btn"
                onClick={closeImagePreviewModal}
              >
                ×
              </button>
            </div>
                          <div className="image-preview-modal-content">
                <div className="multiple-images-preview-container">
                  <div className="preview-grid">
                    {previewImageUrls.map((url, index) => (
                      <div key={index} className="preview-item">
                        <img src={url} alt={`Preview ${index + 1}`} />
                        <button 
                          className="remove-preview-btn"
                          onClick={() => removePendingFile(index)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              <div className="image-preview-actions">
                <button 
                  className="cancel-btn"
                  onClick={closeImagePreviewModal}
                >
                  Cancel
                </button>
                <button 
                  className="send-btn"
                  onClick={sendMultipleImages}
                  disabled={isUploadingImages}
                >
                  {isUploadingImages ? "Sending..." : "Send All Images"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="chat-footer" style={{ marginBottom: '0px' }}>
        <div className="chat-upload-container">
          {/* Enhanced Plus Button with Menu */}
          <div className="chat-plus-menu-container">
            <button 
              className="chat-upload-btn tw-border-none"
              onClick={toggleMenu}
              title="Add content"
            >
              <FaPlus />
              {pendingFiles.length > 0 && (
                <span className="pending-count-badge">
                  {pendingFiles.length}
                </span>
              )}
            </button>
            
            {showMenu && (
              <div className="chat-plus-menu">
                <div className="menu-header">
                  <span>Add Content</span>
                  <button className="close-menu-btn" onClick={closeMenu}>
                    <FaTimes />
                  </button>
                </div>
                
                <div className="menu-options">
                  <label className="menu-option">
                    <FaImage />
                    <span>Upload Images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleMultipleFileUpload}
                    />
                  </label>
                  
                  {isCurrentUserBusiness && bidInfo && (
                    <button 
                      className="menu-option"
                      onClick={() => {
                        setShowBidInvitationModal(true);
                        setShowMenu(false);
                      }}
                    >
                      <FaCheckCircle />
                      <span>Send Bid Invitation</span>
                    </button>
                  )}
                  
                                     {isCurrentUserBusiness && stripeAccountId && (
                     <button 
                       className="menu-option"
                       onClick={(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                         console.log('Send Payment Request button clicked');
                         // Navigate to BidsPage for payment processing
                         navigate('/bids');
                         setShowMenu(false);
                       }}
                     >
                       <FaCreditCard />
                       <span>Send Payment Request</span>
                     </button>
                   )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            placeholder="Add a message…"
            value={newMessage}
            onChange={(e) => {
              handleTyping(e);
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

        <button className="chat-send-btn" onClick={sendMessage} disabled={isUploadingImages}>
          Send
        </button>
      </footer>

      {/* Payment Modal - Same as in BidDisplay.js */}
      {showPaymentModal && bidInfo && (
        <div className="payment-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
                         <div className="payment-modal-header">
               <h3>Payment Options</h3>
               <button 
                 className="close-btn"
                 onClick={() => setShowPaymentModal(false)}
               >
                 ×
               </button>
             </div>
            <div className="payment-modal-content">
              <div className="payment-options">
                {(() => {
                  // Check if down payment has already been made
                  const hasDownPayment = bidInfo.payment_amount && parseFloat(bidInfo.payment_amount) > 0;
                  const downPaymentAmount = hasDownPayment ? parseFloat(bidInfo.payment_amount) : 0;
                  const totalBidAmount = parseFloat(bidInfo.bid_amount) || 0;
                  const remainingAmount = Math.max(0, totalBidAmount - downPaymentAmount);
                  
                  // If down payment has already been made, show remaining amount
                  if (hasDownPayment && remainingAmount > 0) {
                    return (
                      <div className="payment-option">
                        <h4>Pay Remaining Balance</h4>
                        <div className="payment-summary">
                          <p className="payment-amount">${remainingAmount.toFixed(2)}</p>
                          <div className="payment-breakdown">
                            <span>Total Bid: ${totalBidAmount.toFixed(2)}</span>
                            <span>Already Paid: ${downPaymentAmount.toFixed(2)}</span>
                            <span className="remaining-amount">Remaining: ${remainingAmount.toFixed(2)}</span>
                          </div>
                        </div>
                        <p className="payment-description">
                          Complete your payment to finalize this booking
                        </p>
                        <button 
                          className="payment-option-btn success"
                          onClick={() => {
                            // Navigate to checkout form with payment data
                            navigate('/checkout', {
                              state: {
                                paymentData: {
                                  amount: remainingAmount,
                                  payment_type: 'remaining_balance',
                                  business_name: bidInfo.business_profiles?.business_name || 'Business',
                                  stripe_account_id: bidInfo.business_profiles?.stripe_account_id,
                                  bid_id: bidInfo.id,
                                  lineItems: bidInfo.line_items || [],
                                  taxRate: bidInfo.tax_rate || 0,
                                  subtotal: remainingAmount,
                                  tax: 0,
                                  description: `Remaining balance for bid #${bidInfo.id}`
                                }
                              }
                            });
                            setShowPaymentModal(false);
                          }}
                        >
                          Pay Remaining Balance (${remainingAmount.toFixed(2)})
                        </button>
                      </div>
                    );
                  }
                  
                  // Check if down payment option is available
                  const hasDownPaymentOption = bidInfo.business_profiles?.amount && bidInfo.business_profiles?.down_payment_type;
                  
                  if (hasDownPaymentOption) {
                    const downPaymentAmount = bidInfo.business_profiles.down_payment_type === 'percentage' 
                      ? (totalBidAmount * parseFloat(bidInfo.business_profiles.amount)) / 100
                      : parseFloat(bidInfo.business_profiles.amount);
                    
                    return (
                      <>
                        <div className="payment-option">
                          <h4>Down Payment</h4>
                          <p className="payment-amount">
                            {bidInfo.business_profiles.down_payment_type === 'percentage' 
                              ? `${bidInfo.business_profiles.amount}% ($${downPaymentAmount.toFixed(2)})`
                              : `$${bidInfo.business_profiles.amount}`
                            }
                          </p>
                          <p className="payment-description">
                            Secure your booking with a partial payment
                          </p>
                          <button 
                            className="payment-option-btn primary"
                            onClick={() => {
                              // Navigate to checkout form with payment data
                              navigate('/checkout', {
                                state: {
                                  paymentData: {
                                    amount: downPaymentAmount,
                                    payment_type: 'down_payment',
                                    business_name: bidInfo.business_profiles?.business_name || 'Business',
                                    stripe_account_id: bidInfo.business_profiles?.stripe_account_id,
                                    bid_id: bidInfo.id,
                                    lineItems: bidInfo.line_items || [],
                                    taxRate: bidInfo.tax_rate || 0,
                                    subtotal: downPaymentAmount,
                                    tax: 0,
                                    description: `Down payment for bid #${bidInfo.id}`
                                  }
                                }
                              });
                              setShowPaymentModal(false);
                            }}
                          >
                            Pay Down Payment
                          </button>
                        </div>
                        <div className="payment-option">
                          <h4>Full Payment</h4>
                          <p className="payment-amount">${totalBidAmount.toFixed(2)}</p>
                          <p className="payment-description">Pay the complete amount upfront</p>
                          <button 
                            className="payment-option-btn success"
                            onClick={() => {
                              // Navigate to checkout form with payment data
                              navigate('/checkout', {
                                state: {
                                  paymentData: {
                                    amount: totalBidAmount,
                                    payment_type: 'full_payment',
                                    business_name: bidInfo.business_profiles?.business_name || 'Business',
                                    stripe_account_id: bidInfo.business_profiles?.stripe_account_id,
                                    bid_id: bidInfo.id,
                                    lineItems: bidInfo.line_items || [],
                                    taxRate: bidInfo.tax_rate || 0,
                                    subtotal: totalBidAmount,
                                    tax: 0,
                                    description: `Full payment for bid #${bidInfo.id}`
                                  }
                                }
                              });
                              setShowPaymentModal(false);
                            }}
                          >
                            Pay Full Amount
                          </button>
                        </div>
                      </>
                    );
                  }
                  
                  // Default: Full payment only
                  return (
                    <div className="payment-option">
                      <h4>Full Payment</h4>
                      <p className="payment-amount">${totalBidAmount.toFixed(2)}</p>
                      <p className="payment-description">Complete payment for this service</p>
                      <button 
                        className="payment-option-btn success"
                        onClick={() => {
                          // Navigate to checkout form with payment data
                          navigate('/checkout', {
                            state: {
                              paymentData: {
                                amount: totalBidAmount,
                                payment_type: 'full_payment',
                                business_name: bidInfo.business_profiles?.business_name || 'Business',
                                stripe_account_id: bidInfo.business_profiles?.stripe_account_id,
                                bid_id: bidInfo.id,
                                lineItems: bidInfo.line_items || [],
                                taxRate: bidInfo.tax_rate || 0,
                                subtotal: totalBidAmount,
                                tax: 0,
                                description: `Full payment for bid #${bidInfo.id}`
                              }
                            }
                          });
                          setShowPaymentModal(false);
                        }}
                      >
                        Pay Now
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="payment-modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bid Invitation Modal */}
      {showBidInvitationModal && (
        <div className="bid-invitation-modal-overlay" onClick={() => setShowBidInvitationModal(false)}>
          <div className="bid-invitation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bid-invitation-modal-header">
              <h3>Send Bid Invitation</h3>
              <button 
                className="close-btn"
                onClick={() => setShowBidInvitationModal(false)}
              >
                ×
              </button>
            </div>
            <div className="bid-invitation-modal-content">
              <div className="bid-info-summary">
                <h4>Bid Details</h4>
                <div className="bid-summary-row">
                  <span>Amount:</span>
                  <span className="bid-amount">${bidInfo?.bid_amount}</span>
                </div>
                <div className="bid-summary-row">
                  <span>Status:</span>
                  <span className="bid-status">{bidInfo?.status}</span>
                </div>
              </div>
              
              <div className="invitation-message">
                <div className="invitation-preview">
                  <h5>Message Preview:</h5>
                  <div className="preview-message">
                    <p>Hi! I'd like to invite you to accept my bid for ${bidInfo?.bid_amount}. Please let me know if you have any questions or if you'd like to proceed with the booking.</p>
                    <button className="preview-accept-btn" disabled>
                      Accept Bid (${bidInfo?.bid_amount})
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bid-invitation-modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowBidInvitationModal(false)}
              >
                Cancel
              </button>
              <button 
                className="send-btn"
                onClick={handleSendBidInvitation}
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

             {/* Bid Detail Modal - Show for both individual and business users */}
       {showBidDetailModal && bidInfo && (
         <BidDetailModal
           isOpen={showBidDetailModal}
           onClose={() => setShowBidDetailModal(false)}
           bid={bidInfo}
           currentUserId={currentUserId}
           isCurrentUserBusiness={isCurrentUserBusiness}
           onEditBid={() => {
             setShowBidDetailModal(false);
             setShowEditBidModal(true);
           }}
           onPayClick={() => {
             setShowBidDetailModal(false);
             setShowPaymentModal(true);
           }}
           onMessageClick={() => {
             setShowBidDetailModal(false);
             // Focus on the message input
             const messageInput = document.querySelector('.chat-input');
             if (messageInput) {
               messageInput.focus();
             }
           }}
           onConsultationClick={() => {
             setShowBidDetailModal(false);
             // You can implement consultation functionality here
             console.log('Consultation requested');
           }}
           onApprove={() => {
             handleApproveBid(bidInfo);
           }}
           onDeny={() => {
             handleMoveToNotInterested(bidInfo);
             setShowBidDetailModal(false);
           }}
           onMoveToPending={() => {
             handleMoveToPending(bidInfo);
           }}
           onMoveToInterested={() => {
             handleMoveToInterested(bidInfo);
           }}
           showActions={true}
         />
       )}

      {/* Approval Modal */}
      {showApprovalModal && selectedBidForApproval && (
        <div className="approval-modal-overlay" onClick={() => handlePostApprovalAction('message')}>
          <div className="approval-modal" onClick={(e) => e.stopPropagation()}>
            <div className="approval-modal-header">
              <h3>Bid Accepted!</h3>
              <button 
                className="tw-position-absolute tw-top-0 tw-right-0 tw-text-2xl tw-font-bold tw-text-gray-500 tw-bg-white tw-rounded-full tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-border-none tw-cursor-pointer"
                onClick={() => handlePostApprovalAction('message')}
              >
                ×
              </button>
            </div>
            <div className="approval-modal-content">
              <p>
                The bid from {bidInfo?.business_profiles?.business_name || 'a business'} for ${bidInfo?.bid_amount} has been accepted. 
                What would you like to do next?
              </p>
              <div className="approval-modal-actions">
                <button 
                  className="send-btn"
                  onClick={() => handlePostApprovalAction('message')}
                >
                  Send Message
                </button>
                <button 
                  className="send-btn"
                  style={{
                    backgroundColor: '#ec4899',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    // Open the payment modal instead of navigating
                    setShowApprovalModal(false);
                    setShowPaymentModal(true);
                  }}
                >
                  Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bid Modal - Only show for business users */}
      {showEditBidModal && bidInfo && (
        <SlidingBidModal
          isOpen={showEditBidModal}
          onClose={() => setShowEditBidModal(false)}
          requestId={bidInfo.request_id}
          editMode={true}
          bidId={bidInfo.id}
        />
      )}


    </div>
  );
}