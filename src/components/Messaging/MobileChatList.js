// src/components/Messaging/MobileChatList.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import dashboardIcon from "../../assets/images/Icons/dashboard.svg";
import bidsIcon from "../../assets/images/Icons/bids.svg";
import messageIcon from "../../assets/images/Icons/message.svg";
import profileIcon from "../../assets/images/Icons/profile.svg";
import settingsIcon from "../../assets/images/Icons/settings.svg";

export default function MobileChatList({ currentUserId, userType }) {
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      if (!currentUserId || !userType) return;

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
        const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        if (!latestMap[otherId]) latestMap[otherId] = msg;
      });

      const otherIds = Object.keys(latestMap);
      if (otherIds.length === 0) return setChats([]);

      const otherTable = userType === "individual" ? "business_profiles" : "individual_profiles";

      const { data: profiles = [], error: profilesError } = await supabase
        .from(otherTable)
        .select(userType === "individual" ? "id, business_name" : "id, first_name, last_name")
        .in("id", otherIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      const formatted = profiles.map((p) => ({
        id: p.id,
        name:
          userType === "individual"
            ? p.business_name || "Business"
            : `${p.first_name || ""} ${p.last_name || ""}`.trim() || "User",
        last_message: latestMap[p.id]?.message || "",
      }));

      setChats(formatted);
    };

    fetchChats();
  }, [currentUserId, userType]);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Messages</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
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
            onClick={() => navigate(`/messages/${chat.id}`)}
          >
            <strong>{chat.name}</strong>
            <div style={{ color: "#666", fontSize: "0.85rem" }}>
              {chat.last_message}
            </div>
          </li>
        ))}
      </ul>
    {/* Bottom Navigation Bar */}
    <nav className="bottom-nav">
  <button onClick={() => { localStorage.setItem("activeSection", "dashboard"); navigate("/dashboard"); }}>
    <div className="nav-item">
      <img src={dashboardIcon} alt="Dashboard" />
      <span className="nav-label">Requests</span>
    </div>
  </button>
  <button onClick={() => { localStorage.setItem("activeSection", "bids"); navigate("/dashboard"); }}>
    <div className="nav-item">
      <img src={bidsIcon} alt="Bids" />
      <span className="nav-label">Bids</span>
    </div>
  </button>
  <button onClick={() => { localStorage.setItem("activeSection", "messages"); navigate("/dashboard"); }}>
    <div className="nav-item">
      <img src={messageIcon} alt="Message" />
      <span className="nav-label">Messages</span>
    </div>
  </button>
  <button onClick={() => { localStorage.setItem("activeSection", "portfolio"); navigate("/dashboard"); }}>
    <div className="nav-item profile-nav-item">
      <img src={profileIcon} alt="Portfolio" className="profile-icon" />
      <span className="nav-label">Portfolio</span>
    </div>
  </button>
  <button onClick={() => { localStorage.setItem("activeSection", "settings"); navigate("/dashboard"); }}>
    <div className="nav-item">
      <img src={settingsIcon} alt="Settings" className="settings-icon" />
      <span className="nav-label">Settings</span>
    </div>
  </button>
</nav>
    </div>
  );
}