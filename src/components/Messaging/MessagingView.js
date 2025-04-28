import React, { useState, useEffect, useRef } from "react";
import { socket } from "../../socket";
import { supabase } from "../../supabaseClient";
import "../../styles/chat.css";

export default function MessagingView({
  currentUserId,
  businessId,
  businessName = "Business",
  userType, // NEW
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

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

  // 2) Listen for live messages
  useEffect(() => {
    const handler = (msg) => {
      if (
        (msg.senderId === businessId && msg.receiverId === currentUserId) ||
        (msg.senderId === currentUserId && msg.receiverId === businessId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, [currentUserId, businessId]);

  // Auto-scroll when new messages come in
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3) Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
  
    const { data, error } = await supabase.from("messages").insert([
      {
        sender_id: currentUserId,
        receiver_id: businessId,
        message: newMessage.trim(),
      },
    ]).select("*").single(); // 👈 Get the inserted message back immediately
  
    if (error) {
      console.error("Error saving message:", error);
      return;
    }
  
    const sentMessage = {
      id: data.id,
      senderId: data.sender_id,
      receiverId: data.receiver_id,
      message: data.message,
      createdAt: data.created_at,
    };
  
    // Emit the real database message
    socket.emit("send_message", sentMessage);
  
    // Add to UI
    setMessages((prev) => [...prev, sentMessage]);
  
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
        <div ref={chatEndRef} />
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