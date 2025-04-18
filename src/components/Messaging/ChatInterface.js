// src/components/ChatInterface.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import MessagingView from "./MessagingView";
import StartNewChatModal from "./StartNewChatModal";
import "../../styles/chat.css";

export default function ChatInterface() {
  const [currentUserId, setCurrentUserId] = useState("");
  const [chats, setChats] = useState([]); // [{ business_id, business_name, last_message }]
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // 1) Load current user
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    })();
  }, []);

  // 2) Fetch all businesses I’ve messaged
  useEffect(() => {
    if (!currentUserId) return;

    (async () => {
      const { data = [] } = await supabase
        .from("messages")
        .select("receiver_id, sender_id, message, created_at")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });

      const latestMap = {};
      data.forEach((msg) => {
        const otherId = msg.sender_id === currentUserId
          ? msg.receiver_id
          : msg.sender_id;
        if (!latestMap[otherId]) latestMap[otherId] = msg;
      });

      const businessIds = Object.keys(latestMap);
      if (businessIds.length === 0) return setChats([]);

      const { data: profiles = [] } = await supabase
        .from("business_profiles")
        .select("id, business_name")
        .in("id", businessIds);

      const formatted = profiles.map((p) => ({
        business_id: p.id,
        business_name: p.business_name,
        last_message: latestMap[p.id]?.message || "",
      }));

      setChats(formatted);
    })();
  }, [currentUserId]);

  return (
    <div className="chat-app">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <header>
          <span>Your Chats</span>
          <button onClick={() => setShowModal(true)}>＋</button>
        </header>

        <ul>
          {chats.map((c) => (
            <li
              key={c.business_id}
              className={activeBusiness === c.business_id ? "active" : ""}
              onClick={() => setActiveBusiness(c.business_id)}
            >
              <div>{c.business_name}</div>
              <div className="message-time">{c.last_message}</div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main chat window */}
      <main className="chat-main">
        {activeBusiness ? (
          <MessagingView
            currentUserId={currentUserId}
            businessId={activeBusiness}
            businessName={
              chats.find((c) => c.business_id === activeBusiness)?.business_name
            }
          />
        ) : (
          <div style={{ padding: "2rem", color: "var(--bidi-muted)" }}>
            Select a chat to start messaging
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <StartNewChatModal
          currentUserId={currentUserId}
          onClose={() => setShowModal(false)}
          onStartChat={(bizId) => setActiveBusiness(bizId)}
        />
      )}
    </div>
  );
}