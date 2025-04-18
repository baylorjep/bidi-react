// src/components/MessagingView.js
import React, { useState, useEffect } from "react";
import { socket } from "../../socket";
import { supabase } from "../../supabaseClient";
import "../../styles/messaging.css";

const MessagingView = () => {
  const [currentUserId, setCurrentUserId]     = useState("");
  const [businesses, setBusinesses]           = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [messages, setMessages]               = useState([]);
  const [newMessage, setNewMessage]           = useState("");

  // Fetch the current user and join their room
  useEffect(() => {
    (async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        socket.emit("join", user.id);
      } else {
        console.error("No user found", error);
      }
    })();
  }, []);

  // Fetch the list of businesses for selection
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("id, business_name");
      if (error) {
        console.error("Error fetching businesses:", error);
      } else {
        setBusinesses(data);
      }
    })();
  }, []);

  // Fetch persisted messages for the selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUserId || !selectedBusiness) return;

      // 1) Messages I sent
      const { data: outRows = [], error: outErr } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_id", currentUserId)
        .eq("receiver_id", selectedBusiness);

      // 2) Messages the business sent me
      const { data: inRows = [], error: inErr } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_id", selectedBusiness)
        .eq("receiver_id", currentUserId);

      if (outErr || inErr) {
        console.error("Error fetching messages:", outErr || inErr);
        return;
      }

      // Normalize and merge
      const allRows = [...outRows, ...inRows].map((r) => ({
        id:         r.id,
        senderId:   r.sender_id,
        receiverId: r.receiver_id,
        message:    r.message,
        createdAt:  r.created_at,
      }));

      // Sort oldest→newest
      allRows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      setMessages(allRows);
    };

    fetchMessages();
  }, [currentUserId, selectedBusiness]);

  // Listen for incoming socket messages
  useEffect(() => {
    const handleReceive = (data) => {
      if (
        (data.senderId === selectedBusiness && data.receiverId === currentUserId) ||
        (data.senderId === currentUserId && data.receiverId === selectedBusiness)
      ) {
        setMessages((prev) => [...prev, data]);
      }
    };
    socket.on("receive_message", handleReceive);
    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, [currentUserId, selectedBusiness]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedBusiness) return;
    const payload = {
      senderId:   currentUserId,
      receiverId: selectedBusiness,
      message:    newMessage,
    };
    socket.emit("send_message", payload);
    setNewMessage("");
  };

  return (
    <div className="messaging-container">
      <h2>Chat with a Business</h2>

      <div style={{ marginBottom: "1rem" }}>
        <label>Select Business: </label>
        <select
          value={selectedBusiness}
          onChange={(e) => setSelectedBusiness(e.target.value)}
        >
          <option value="">-- Select a Business --</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.business_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3>Messages:</h3>
        <ul>
          {messages.map((msg) => (
            <li key={msg.id}>
              <strong>
                {msg.senderId === currentUserId ? "You" : "Business"}:
              </strong>{" "}
              {msg.message}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default MessagingView;