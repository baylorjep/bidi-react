import React, { useState } from "react";
import "../../App.css"; // Ensure this matches your styling

const MessagingView = () => {
  const [conversations, setConversations] = useState([
    { id: 1, name: "Bidi", lastMessage: "You sent an attachment.", time: "17m" },
    { id: 2, name: "Mati González", lastMessage: "Active 37m ago", time: "37m" },
    { id: 3, name: "Slade Jeppsen", lastMessage: "Slade sent an attachment.", time: "5h" },
  ]);
  const [activeChat, setActiveChat] = useState(null);

  return (
    <div className="messaging-container">
      {/* Sidebar - List of Messages */}
      <div className="messages-sidebar">
        <h2 className="messages-header">Messages</h2>
        <div className="messages-list">
          {conversations.map((chat) => (
            <div
              key={chat.id}
              className={`message-item ${activeChat === chat.id ? "active" : ""}`}
              onClick={() => setActiveChat(chat.id)}
            >
              <div className="message-name">{chat.name}</div>
              <div className="message-preview">{chat.lastMessage}</div>
              <div className="message-time">{chat.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {activeChat ? (
          <div className="chat-content">
            <h2>{conversations.find((chat) => chat.id === activeChat)?.name}</h2>
            <div className="chat-messages">
              <p className="chat-message">This is the beginning of your chat.</p>
            </div>
            <div className="chat-input">
              <input type="text" placeholder="Type a message..." />
              <button>Send</button>
            </div>
          </div>
        ) : (
          <div className="no-chat-selected">Select a conversation to start messaging</div>
        )}
      </div>
    </div>
  );
};

export default MessagingView;
