// src/components/MessagingView.js
import React, { useState, useEffect } from "react";
import { socket } from "../../socket.js";
import { supabase } from "../../supabaseClient";
import "../../styles/messaging.css";

const MessagingView = () => {
  const [currentUserId, setCurrentUserId] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Retrieve the current user (bride/groom) from Supabase
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        // Join the room for the current user
        socket.emit("join", user.id);
      } else {
        console.error("No user found", error);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch businesses from Supabase for selection
  useEffect(() => {
    const fetchBusinesses = async () => {
      // Adjust table name/columns as needed
      const { data, error } = await supabase.from("business_profiles").select("id, business_name");
      if (error) {
        console.error("Error fetching businesses:", error);
      } else if (data) {
        setBusinesses(data);
      }
    };
    fetchBusinesses();
  }, []);

  // Listen for incoming messages
  useEffect(() => {
    socket.on("receive_message", (data) => {
      // Only add the message if it involves the current conversation
      if (
        (data.senderId === selectedBusiness && data.receiverId === currentUserId) ||
        (data.senderId === currentUserId && data.receiverId === selectedBusiness)
      ) {
        setMessages((prev) => [...prev, data]);
      }
    });
    return () => {
      socket.off("receive_message");
    };
  }, [selectedBusiness, currentUserId]);

  const sendMessage = () => {
    if (newMessage.trim() === "" || selectedBusiness === "") return;
    const messageData = {
      senderId: currentUserId,
      receiverId: selectedBusiness,
      message: newMessage,
    };
    // Emit the message to the backend via Socket.IO
    socket.emit("send_message", messageData);

    // Optimistic update: add it locally
    setMessages((prev) => [...prev, messageData]);
    setNewMessage("");
  };

  return (
    <div className="messaging-container">
      <h2>Chat with a Business</h2>
      <div style={{ marginBottom: "1rem" }}>
        <label>Select Business: </label>
        <select value={selectedBusiness} onChange={(e) => setSelectedBusiness(e.target.value)}>
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
          {messages.map((msg, index) => (
            <li key={index}>
              <strong>{msg.senderId === currentUserId ? "You" : "Business"}: </strong>
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
