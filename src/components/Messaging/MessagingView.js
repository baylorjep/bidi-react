// src/components/MessagingView.js

import React, { useState, useEffect, useRef } from "react";
import { socket } from "../../socket";
import { supabase } from "../../supabaseClient";
import "../../styles/chat.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

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
  const navigate = useNavigate();
  const location = useLocation();

  // Get profile image from navigation state
  useEffect(() => {
    if (location.state?.profileImage) {
      setProfilePhoto(location.state.profileImage);
    }
  }, [location.state]);

  // Fetch business information
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      console.log("Fetching business info for ID:", businessId);
      try {
        // First get the business name
        const { data: businessData, error: businessError } = await supabase
          .from("business_profiles")
          .select("business_name")
          .eq("id", businessId)
          .single();

        if (businessError) throw businessError;

        // Then get the profile photo
        const { data: photoData, error: photoError } = await supabase
          .from("profile_photos")
          .select("photo_url")
          .eq("user_id", businessId)
          .eq("photo_type", "profile")
          .single();

        console.log("Business data:", businessData);
        console.log("Photo data:", photoData);

        setBusinessName(businessData.business_name || "Business");
        setProfilePhoto(photoData?.photo_url || null);
        setInitialLetter(businessData.business_name?.charAt(0)?.toUpperCase() || "");
      } catch (error) {
        console.error("Error fetching business info:", error);
        setBusinessName("Business");
        setProfilePhoto(null);
        setInitialLetter("B");
      }
    };

    if (businessId) {
      fetchBusinessInfo();
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
        }));

        all.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setMessages(all);
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
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const payload = {
      senderId: currentUserId,
      receiverId: businessId,
      message: newMessage.trim(),
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
              onClick={() => navigate(`/portfolio/${businessId}`)}
              style={{ cursor: 'pointer' }}
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
        {messages.map((m) => (
          <div
            key={m.id}
            className={`message-bubble ${
              m.senderId === currentUserId ? "sent" : "received"
            }`}
          >
            {m.message}
            <div className="message-time">
              {new Date(m.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        {isTyping && (
          <div
          className="message-bubble received typing-indicator"
          style={{ marginLeft: 0 }}
        >
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