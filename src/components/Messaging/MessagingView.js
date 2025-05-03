// src/components/MessagingView.js

import React, { useState, useEffect, useRef } from "react";
import { socket } from "../../socket";
import { supabase } from "../../supabaseClient";
import "../../styles/chat.css";
import { FaArrowLeft } from "react-icons/fa";

export default function MessagingView({
  currentUserId,
  businessId,
  businessName = "Business",
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [initialLetter, setInitialLetter] = useState("");

  // 1) Fetch & normalize persisted messages
  useEffect(() => {
    if (!currentUserId || !businessId) return;

    const fetchMessages = async () => {
      const { data: out = [] } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_id", currentUserId)
        .eq("receiver_id", businessId);

      const { data: incoming = [] } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_id", businessId)
        .eq("receiver_id", currentUserId);

      const all = [...out, ...incoming].map((r) => ({
        id: r.id,
        senderId: r.sender_id,
        receiverId: r.receiver_id,
        message: r.message,
        createdAt: r.created_at,
      }));

      all.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(all);
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

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", businessId)
          .single();
  
        if (profileError) throw profileError;
  
        let fetchedPhoto = null;
        let letter = "";
  
        if (profileData.role === "business") {
          const { data: businessData, error: businessError } = await supabase
            .from("business_profiles")
            .select("profile_pic, business_name")
            .eq("id", businessId)
            .single();
  
          if (businessError) throw businessError;
  
          fetchedPhoto = businessData?.profile_pic;
          letter = businessData?.business_name?.charAt(0)?.toUpperCase() || "";
  
        } else {
          const { data: userData, error: userError } = await supabase
            .from("individual_profiles")
            .select("first_name")
            .eq("id", businessId)
            .single();
  
          if (userError) throw userError;
  
          // ⚠️ Only fetch first_name because individual_profiles has no profile_pic
          letter = userData?.first_name?.charAt(0)?.toUpperCase() || "";
        }
  
        setProfilePhoto(fetchedPhoto);  // will be null for individual
        setInitialLetter(letter);
  
      } catch (error) {
        console.error("Error fetching profile info:", error);
  
        // ✅ Still set the fallback letter if available from error context
        setProfilePhoto(null);
        if (!initialLetter) setInitialLetter(businessName?.charAt(0)?.toUpperCase() || "");
      }
    };
  
    fetchProfilePhoto();
  }, [businessId, businessName]);
  

  return (
    <div className="messaging-view chat-main">
      <header className="chat-header">
  <button className="back-button" onClick={() => window.history.back()}>
    <FaArrowLeft />
  </button>
  <div className="header-center">
    <div className="profile-circle">
      {profilePhoto ? (
        <img src={profilePhoto} alt="Profile" className="profile-image" />
      ) : (
        <span className="initial-letter">{initialLetter}</span>
      )}
    </div>
    <span className="business-name">{businessName}</span>
  </div>
</header>

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