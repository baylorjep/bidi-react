// src/components/MessagingView.js
import React, { useState, useEffect } from "react";
import { socket } from "../../socket";
import { supabase } from "../../supabaseClient";
import "../../styles/chat.css";

export default function MessagingView({
  currentUserId,
  businessId,
  businessName = "Business",
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // 1) Fetch & normalize persisted messages
  useEffect(() => {
    if (!currentUserId || !businessId) return;

    const fetchMessages = async () => {
      // outgoing
      const { data: out = [] } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_id", currentUserId)
        .eq("receiver_id", businessId);

      // incoming
      const { data: incoming = [] } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_id", businessId)
        .eq("receiver_id", currentUserId);

      // normalize & merge
      const all = [...out, ...incoming].map((r) => ({
        id: r.id,
        senderId: r.sender_id,
        receiverId: r.receiver_id,
        message: r.message,
        createdAt: r.created_at,
      }));

      // sort by time
      all.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(all);
    };

    fetchMessages();
  }, [currentUserId, businessId]);

  // 2) Listen for live messages
  useEffect(() => {
    const handler = (msg) => {
      // only if this chat
      if (
        (msg.senderId === businessId && msg.receiverId === currentUserId) ||
        (msg.senderId === currentUserId && msg.receiverId === businessId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receive_message", handler);
    return () => void socket.off("receive_message", handler);
  }, [currentUserId, businessId]);

  // 3) Send new message
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const payload = {
      senderId: currentUserId,
      receiverId: businessId,
      message: newMessage.trim(),
    };
    socket.emit("send_message", payload);
    setNewMessage("");
  };

  return (
    <div className="chat-main">
      <header>{businessName}</header>

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
      </div>

      <footer className="chat-footer">
        <input
          className="chat-input"
          type="text"
          placeholder="Type your message…"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="chat-send-btn" onClick={sendMessage}>
          Send
        </button>
      </footer>
    </div>
  );
}