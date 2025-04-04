import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { supabase } from "../../supabaseClient";
import "../../styles/messaging.css";

// Connect to your deployed Socket.IO server
// (if hosted on the same domain in production, you can simply call io())
const socket = io("https://bidi-express.vercel.app");

const MessagingView = () => {
  const [currentUserId, setCurrentUserId] = useState("");
  const [chatPartnerId, setChatPartnerId] = useState("");
  const [allUsers, setAllUsers] = useState([]); // List of users for testing
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Retrieve current user from Supabase on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        // Join the room corresponding to this user
        socket.emit("join", user.id);
      } else {
        console.error("No user found", error);
      }
    };

    getCurrentUser();
  }, []);

  // Fetch a list of all users from the "profiles" table for beta testing
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email");
      if (error) {
        console.error("Error fetching users:", error);
      } else if (data) {
        setAllUsers(data);
      }
    };

    fetchUsers();
  }, []);

  // Listen for incoming messages
  useEffect(() => {
    socket.on("receive_message", (data) => {
      // Only add messages that involve the current user
      if (
        data.senderId === currentUserId ||
        data.receiverId === currentUserId
      ) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [currentUserId]);

  const sendMessage = () => {
    if (newMessage.trim() === "" || chatPartnerId === "") return;

    const messageData = {
      senderId: currentUserId,
      receiverId: chatPartnerId,
      message: newMessage,
    };

    // Emit the message to the server
    socket.emit("send_message", messageData);

    // Optionally update UI immediately (optimistic update)
    setMessages((prev) => [...prev, messageData]);
    setNewMessage("");
  };

  return (
    <div className="messaging-container">
      <h2>Messaging</h2>
      <div style={{ marginBottom: "1rem" }}>
        <label>Select Chat Partner: </label>
        <select
          value={chatPartnerId}
          onChange={(e) => setChatPartnerId(e.target.value)}
        >
          <option value="">Select a user</option>
          {allUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.email} ({user.id})
            </option>
          ))}
        </select>
      </div>

      <div className="messages-list">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.senderId === currentUserId ? "sent" : "received"
            }`}
          >
            <span className="message-text">{msg.message}</span>
          </div>
        ))}
      </div>
      <div className="message-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="input-field"
        />
        <button onClick={sendMessage} className="send-button">
          Send
        </button>
      </div>
    </div>
  );
};

export default MessagingView;
