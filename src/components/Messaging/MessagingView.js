// src/components/MessagingView.js

import React, { useState, useEffect, useRef } from "react";
import { socket } from "../../socket";
import { supabase } from "../../supabaseClient";
import "../../styles/chat.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { formatMessageText } from "../../utils/formatMessageText";

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

  if (!currentUserId || !businessId) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Loading chat…</div>;
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
    if (onBack) {
      onBack();
    } else {
      navigate('/messages');
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

  return (
    <div className="messaging-view chat-main">
      {!location.state?.fromDashboard && (
        <header className="chat-header">
          {window.innerWidth <= 768 && (
            <button className="back-button-messaging" onClick={handleBack}>
              <FaArrowLeft />
              <span>Back</span>
            </button>
          )}
          <div className="header-center">
            <div 
              className="profile-circle"
              onClick={isBusinessProfile ? () => navigate(`/portfolio/${businessId}`) : undefined}
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

      <footer className="chat-footer">
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
          <input
            className="chat-input"
            type="text"
            placeholder="Add a message…"
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
        </div>

        <button className="chat-send-btn" onClick={sendMessage}>
          Send
        </button>
      </footer>
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
    </div>
  );
}