// src/components/ChatInterface.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import MessagingView from "./MessagingView";
import "../../styles/chat.css";

export default function ChatInterface() {
  const [currentUserId, setCurrentUserId] = useState("");
  const [chats, setChats] = useState([]);        // [{ business_id, business_name, last_message }]
  const [activeBusiness, setActiveBusiness] = useState(null);

  // 1) load user
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    })();
  }, []);

  // 2) fetch all chats for sidebar
  useEffect(() => {
    if (!currentUserId) return;
    (async () => {
      // grab distinct business_ids that have messages with me
      const { data } = await supabase
        .from("messages")
        .select("receiver_id, sender_id, message, created_at")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });
      // normalize into one entry per business
      const map = {};
      data.forEach(msg => {
        const other = msg.sender_id === currentUserId
          ? msg.receiver_id
          : msg.sender_id;
        if (!map[other]) map[other] = msg;
      });
      // now fetch business names
      const businessIds = Object.keys(map);
      const { data: profiles } = await supabase
        .from("business_profiles")
        .select("id,business_name")
        .in("id", businessIds);
      setChats(profiles.map(p => ({
        business_id: p.id,
        business_name: p.business_name,
        last_message: map[p.id].message
      })));
    })();
  }, [currentUserId]);

  return (
    <div className="chat-app">
      <aside className="chat-sidebar">
        <header>
          <span>Your Chats</span>
          <button onClick={() => {/* new chat */}}>＋</button>
        </header>
        <ul>
          {chats.map(c => (
            <li
              key={c.business_id}
              className={activeBusiness === c.business_id ? "active" : ""}
              onClick={() => setActiveBusiness(c.business_id)}
            >
              <div>{c.business_name}</div>
              <small className="message-time">{c.last_message}</small>
            </li>
          ))}
        </ul>
      </aside>

      <main className="chat-main">
        {activeBusiness ? (
          <MessagingView
            currentUserId={currentUserId}
            businessId={activeBusiness}
            businessName={
              chats.find(c => c.business_id === activeBusiness)?.business_name
            }
          />
        ) : (
          <div style={{ padding: "2rem", color: "var(--bidi-muted)" }}>
            Select a chat to start messaging
          </div>
        )}
      </main>
    </div>
  );
}