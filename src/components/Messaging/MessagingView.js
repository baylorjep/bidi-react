// src/components/MessagingView.js

import React, { useState, useEffect, useRef, useMemo } from "react";
import { socket } from "../../socket";
import { supabase } from "../../supabaseClient";
import "../../styles/chat.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { formatMessageText } from "../../utils/formatMessageText";
import { formatBusinessName } from '../../utils/formatBusinessName';

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
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [bidInfo, setBidInfo] = useState(null);
  const [isCurrentUserBusiness, setIsCurrentUserBusiness] = useState(false);

  // Memoize the loading skeletons at the top level to avoid conditional hook calls
  const loadingSkeletons = useMemo(() => (
    <div className="messaging-view">
      <ChatHeaderSkeleton />
      <BidInfoSkeleton />
      <div className="chat-window">
        <div className="chat-body">
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

            if (businessError) throw businessError;
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

  // Add new useEffect to fetch bid information
  useEffect(() => {
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
          .select('id')
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
            .select('request_id')
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
            // Get the most recent bid
            const { data: bids, error: bidsError } = await supabase
              .from('bids')
              .select('*')
              .in('request_id', allRequestIds)
              .eq('user_id', isCurrentUserBusiness ? currentUserId : businessId)
              .order('created_at', { ascending: false })
              .limit(1);

            console.log('Final bids query result:', { bids, bidsError });
            if (!bidsError && bids && bids.length > 0) {
              console.log('Setting bid info:', bids[0]);
              setBidInfo(bids[0]);
            } else {
              console.log('No bids found or error occurred');
              setBidInfo(null);
            }
          } catch (error) {
            console.error('Error fetching bids:', error);
            setBidInfo(null);
          }
        } else {
          console.log('No request IDs found to check for bids');
          setBidInfo(null);
        }
      } catch (error) {
        console.error('Error in fetchBidInfo:', error);
      }
    };

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

  if (!currentUserId || !businessId) {
    return loadingSkeletons;
  }

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
        receiverId: businessId,
        message: imageUrl,
        type: "image",
        seen: false,
      });
    }
  
    if (newMessage.trim()) {
      socket.emit("send_message", {
        senderId: currentUserId,
        receiverId: businessId,
        message: newMessage.trim(),
        type: "text",
        seen: false,
      });
    }
  
    // Cleanup
    setNewMessage("");
    setPreviewImageUrl(null);
    setPendingFile(null);
    socket.emit("stop_typing", { senderId: currentUserId, receiverId: businessId });
  };

  /*
   commented out til we have a better solution
  const sendMessage = async () => {
    let payload;
  
    if (previewImageUrl) {
      payload = {
        senderId: currentUserId,
        receiverId: businessId,
        message: previewImageUrl,
        type: 'image',
        seen: false
      };
      setPreviewImageUrl(null);
    } else if (newMessage.trim()) {
      payload = {
        senderId: currentUserId,
        receiverId: businessId,
        message: newMessage.trim(),
        type: 'text',
        seen: false
      };
      setNewMessage("");
    } else {
      return;  // Nothing to send
    }
  
    // Just emit to server; let it handle DB and return
    socket.emit('send_message', payload);
    socket.emit("stop_typing", { senderId: currentUserId, receiverId: businessId });
  };
*/
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

  /* // commented out to preserve old functionality until we can upload and sendmessages locally
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);
  
      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        return;
      }
  
      const { publicUrl } = supabase
        .storage
        .from('chat-images')
        .getPublicUrl(fileName).data;
  
      setPreviewImageUrl(publicUrl);  // Set uploaded image URL in input so user can hit Send
      console.log("Image uploaded, preview ready!");
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };
  */

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    setPendingFile(file);
    const localPreview = URL.createObjectURL(file);
    setPreviewImageUrl(localPreview);

    e.target.value = null;
  };

  const handleBusinessClick = (businessId, businessName) => {
    const formattedName = formatBusinessName(businessName);
    navigate(`/portfolio/${businessId}/${formattedName}`);
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
              <span>Back</span>
            </button>
          )}
          <div className="header-center-messaging">
            <div 
              className="profile-circle"
              onClick={isBusinessProfile ? () => handleBusinessClick(businessId, businessName) : undefined}
              style={{ cursor: isBusinessProfile ? 'pointer' : 'default' }}
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="profile-image" />
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
                navigate('/bids');
              }}
            >
              View Bids
            </button>
          </div>
        </div>
      )}

      <div className="chat-window">
        <div className="chat-body">
          {messages.map((msg, index) => (
            <div
              key={index}
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
              ) : (
                formatMessageText(msg.message)
              )}
              <div className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
                {msg.senderId === currentUserId && (
                  <span className="seen-indicator">
                    {msg.seen ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
            </div>
          ))}
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

      <footer className="chat-footer" style={{ marginBottom: '0px' }}>
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

        <button className="chat-send-btn" onClick={sendMessage}>
          Send
        </button>
      </footer>
    </div>
  );
}