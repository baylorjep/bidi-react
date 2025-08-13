  // src/components/Messaging/MobileChatList.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import dashboardIcon from "../../assets/images/Icons/dashboard.svg";
import bidsIcon from "../../assets/images/Icons/bids.svg";
import messageIcon from "../../assets/images/Icons/message.svg";
import profileIcon from "../../assets/images/Icons/profile.svg";
import settingsIcon from "../../assets/images/Icons/settings.svg";
import { FaArrowLeft } from "react-icons/fa";
import { formatTimestamp } from "../../utils/dateTimeUtils";

// Skeleton components for loading states
const MobileChatItemSkeleton = () => (
  <li
    style={{
      background: "#f6eafe",
      padding: "1rem",
      borderRadius: "1rem",
      marginBottom: "1rem",
      pointerEvents: "none"
    }}
  >
    <div style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center",
      marginBottom: "0.5rem"
    }}>
      <div className="skeleton-chat-name-mobile"></div>
      <div className="skeleton-unseen-badge-mobile"></div>
    </div>
    <div style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center",
      fontSize: "0.85rem"
    }}>
      <div className="skeleton-message-preview-mobile"></div>
      <div className="skeleton-message-time-mobile"></div>
    </div>
  </li>
);

const MobileChatListSkeleton = () => (
  <div style={{ padding: "1rem" }}>
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      marginBottom: "1rem",
      gap: "1rem"
    }}>
      <h2 style={{ margin: 0 }}>Messages</h2>
    </div>
    <ul style={{ listStyle: "none", padding: 0 }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <MobileChatItemSkeleton key={index} />
      ))}
    </ul>
  </div>
);

export default function MobileChatList({ currentUserId, userType, onChatSelect }) {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Memoize the loading skeleton at the top level to avoid conditional hook calls
  const loadingSkeleton = useMemo(() => <MobileChatListSkeleton />, []);

  console.log('MobileChatList - userType:', userType); // Debug log

  useEffect(() => {
    console.log('MobileChatList useEffect - userType:', userType); // Debug log
    const fetchChats = async () => {
      if (!currentUserId || !userType) {
        console.log('Missing required props:', { currentUserId, userType }); // Debug log
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { data: messages = [], error: messagesError } = await supabase
        .from("messages")
        .select("receiver_id, sender_id, message, created_at, seen, type")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        setIsLoading(false);
        return;
      }

      const latestMap = {};
      const unseenCountMap = {};

      messages.forEach((msg) => {
        const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        
        // Track latest message
        if (!latestMap[otherId]) {
          latestMap[otherId] = msg;
        }

        // Count unseen messages - messages received by current user that haven't been seen
        if (msg.receiver_id === currentUserId && !msg.seen) {
          unseenCountMap[otherId] = (unseenCountMap[otherId] || 0) + 1;
        }
      });

      const otherIds = Object.keys(latestMap);
      if (otherIds.length === 0) {
        setChats([]);
        setIsLoading(false);
        return;
      }

      const otherTable = userType === "individual" ? "business_profiles" : "individual_profiles";

      const { data: profiles = [], error: profilesError } = await supabase
        .from(otherTable)
        .select(userType === "individual" ? "id, business_name" : "id, first_name, last_name")
        .in("id", otherIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        setIsLoading(false);
        return;
      }

      const formatted = profiles.map((p) => ({
        id: p.id,
        name:
          userType === "individual"
            ? p.business_name || "Business"
            : `${p.first_name || ""} ${p.last_name || ""}`.trim() || "User",
        last_message: latestMap[p.id]?.type === 'image'
            ? (latestMap[p.id]?.sender_id === currentUserId ? "You sent an image" : "Image")
            : latestMap[p.id]?.type === 'payment_request'
            ? (latestMap[p.id]?.sender_id === currentUserId ? "You sent a payment request" : "Payment request")
            : latestMap[p.id]?.message || "",
        unseen_count: unseenCountMap[p.id] || 0,
        last_message_time: latestMap[p.id]?.created_at
      }));

      // Sort chats by most recent message time (newest first)
      const sortedChats = formatted.sort((a, b) => {
        if (!a.last_message_time && !b.last_message_time) return 0;
        if (!a.last_message_time) return 1;
        if (!b.last_message_time) return -1;
        return new Date(b.last_message_time) - new Date(a.last_message_time);
      });

      setChats(sortedChats);
      setIsLoading(false);
    };

    fetchChats();
  }, [currentUserId, userType]);

  // Show skeleton loading while fetching data
  if (!currentUserId || !userType || isLoading) {
    return loadingSkeleton;
  }

  const handleChatSelect = async (chat) => {
    // Mark messages as seen when chat is opened
    const { error: updateError } = await supabase
      .from('messages')
      .update({ seen: true })
      .eq('sender_id', currentUserId)
      .eq('receiver_id', chat.id)
      .eq('seen', false);

    if (updateError) {
      console.error('Error marking messages as seen:', updateError);
    }

    // Update the chats list to reflect seen status
    setChats(prevChats => 
      prevChats.map(c => 
        c.id === chat.id 
          ? { ...c, unseen_count: 0 }
          : c
      )
    );

    if (onChatSelect) {
      onChatSelect(chat);
    } else {
      navigate(`/messages/${chat.id}`, {
        state: { businessName: chat.name }
      });
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        marginBottom: "1rem",
        gap: "1rem"
      }}>

        <h2 style={{ margin: 0 }}>Messages</h2>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {chats.length === 0 && (
          <div style={{ textAlign: "center", color: "#777", marginTop: "2rem" }}>
            <p style={{ fontSize: "1.1rem" }}>📨 No messages yet.</p>
            <p style={{ fontSize: "0.9rem" }}>
              You can message a vendor from your{" "}
              <span
                style={{ color: "#A328F4", textDecoration: "underline", cursor: "pointer" }}
                onClick={() => navigate("/bids")}
              >
                Bids page
              </span>
              .
            </p>
          </div>
        )}
        {chats.map((chat) => (
          <li
            key={chat.id}
            style={{
              background: "#f6eafe",
              padding: "1rem",
              borderRadius: "1rem",
              marginBottom: "1rem",
              cursor: "pointer"
            }}
            onClick={() => handleChatSelect(chat)}
          >
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "0.5rem"
            }}>
              <strong>{chat.name}</strong>
              {chat.unseen_count > 0 && (
                <span style={{
                  background: "#A328F4",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "0.8em",
                  minWidth: "20px",
                  textAlign: "center"
                }}>
                  {chat.unseen_count}
                </span>
              )}
            </div>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              color: "#666",
              fontSize: "0.85rem"
            }}>
              <div style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "70%"
              }}>
                {chat.last_message}
              </div>
              <div style={{ 
                fontSize: "0.75rem",
                color: "#888",
                marginLeft: "0.5rem"
              }}>
                {formatTimestamp(chat.last_message_time, 'datetime')}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Remove the bottom navigation since it's handled by the dashboard */}
    </div>
  );
}