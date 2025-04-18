import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import "../../styles/chat.css";

export default function StartNewChatModal({ currentUserId, onClose, onStartChat }) {
  const [businesses, setBusinesses] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const fetchBusinesses = async () => {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("id, business_name");
      if (!error) setBusinesses(data);
    };
    fetchBusinesses();
  }, []);

  const handleStart = () => {
    if (!selectedId) return;
    onStartChat(selectedId);
    onClose(); // Close modal after starting
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-bids-page">
        <h3>Start a New Chat</h3>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="input-field"
        >
          <option value="">-- Select a Business --</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.business_name}
            </option>
          ))}
        </select>

        <div className="modal-buttons">
          <button className="send-button" onClick={handleStart}>
            Start Chat
          </button>
          <button onClick={onClose} style={{ background: "#ccc", padding: "8px 16px" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}