import React, { useState } from "react";
import "../../styles/messaging.css"; // Ensure this contains necessary styles

const MessagingView = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: "You", text: "Hey, how's the project going?" },
    {
      id: 2,
      sender: "Baylor's Boudoir",
      text: "Great! Almost done with the first phase.",
    },
    { id: 3, sender: "You", text: "Nice! Let me know if you need anything." },
  ]);

  const [newMessage, setNewMessage] = useState("");

  const sendMessage = () => {
    if (newMessage.trim() !== "") {
      setMessages([
        ...messages,
        { id: messages.length + 1, sender: "You", text: newMessage },
      ]);
      setNewMessage("");
    }
  };

  return (
    <div className="messaging-container">
      <div className="messages-header">Messages</div>
      <div className="messages-list">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.sender === "You" ? "sent" : "received"}`}
          >
            <span className="message-text">{msg.text}</span>
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
