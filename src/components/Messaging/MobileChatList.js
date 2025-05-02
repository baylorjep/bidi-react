// src/components/MobileChatList.js
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import "../../styles/chat.css";
import { useNavigate } from "react-router-dom";

export default function MobileChatList({ currentUserId, userType }) {
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUserId || !userType) return;

    (async () => {
      const { data: messages = [], error: messagesError } = await supabase
        .from("messages")
        .select("receiver_id, sender_id, message, created_at")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        return;
      }

      const latestMap = {};
      messages.forEach((msg) => {
        const otherId = msg.sender_id === currentUserId
          ? msg.receiver_id
          : msg.sender_id;
        if (!latestMap[otherId]) latestMap[otherId] = msg;
      });

      const otherIds = Object.keys(latestMap);
      if (otherIds.length === 0) return setChats([]);

      const otherTable = userType === "individual"
        ? "business_profiles"
        : "individual_profiles";

      const { data: profiles = [], error: profilesError } = await supabase
        .from(otherTable)
        .select(userType === "individual" ? "id, business_name, profile_photo" : "id, first_name, last_name, profile_photo")
        .in("id", otherIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      const formatted = profiles.map((p) => ({
        id: p.id,
        name: userType === "individual" ? p.business_name : `${p.first_name} ${p.last_name}`,
        profile_photo: p.profile_photo,
        last_message: latestMap[p.id]?.message || "",
        last_time: latestMap[p.id]?.created_at || "",
      }));

      setChats(formatted);
    })();
  }, [currentUserId, userType]);

  return (
    <div className="mobile-chat-list">
      <h2>Messages</h2>
      {chats.map((chat) => (
        <div 
          key={chat.id} 
          className="chat-list-item" 
          onClick={() => navigate(`/messages/${chat.id}`)}
        >
          <img src={chat.profile_photo || "/default-profile.png"} alt="Profile" className="chat-list-avatar" />
          <div className="chat-list-info">
            <div className="chat-list-name">{chat.name}</div>
            <div className="chat-list-preview">{chat.last_message}</div>
          </div>
          <div className="chat-list-time">
            {new Date(chat.last_time).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}