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
  }, [location.state]);

  // Fetch business/individual information
  useEffect(() => {
    const fetchUserInfo = async () => {
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

    if (businessId) {
      fetchUserInfo();
    }
  }, [businessId]);

  // 1) Fetch & normalize persisted messages
  useEffect(() => {
    if (!currentUserId || !businessId) return;

    const fetchMessages = async () => {
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
          seen: r.seen || false
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

  useEffect(() => {
    if (!currentUserId) return;
    socket.emit("join", currentUserId);
  }, [currentUserId]);

  // 2) Listen for live messages & typing indicators
  useEffect(() => {
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

  // 3) Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const payload = {
      senderId: currentUserId,
      receiverId: businessId,
      message: newMessage.trim(),
      seen: false
    };

    socket.emit("send_message", payload);
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
    if (onBack) {
      onBack();
    } else {
      navigate('/messages');
    }
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
            {formatMessageText(msg.message)}
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
        <input
          className="chat-input"
          type="text"
          placeholder="Type your message…"
          value={newMessage}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="chat-send-btn" onClick={sendMessage}>
          Send
        </button>
      </footer>
    </div>
  );
}