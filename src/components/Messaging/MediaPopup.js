// src/components/MediaPopup.js
import React, { useState } from "react";
import "../../styles/chat.css";
import { FaTimes } from "react-icons/fa";

export default function MediaPopup({ messages, onClose }) {
  const [previewImage, setPreviewImage] = useState(null);

  const imageMessages = messages.filter((msg) => msg.type === "image");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="media-popup" onClick={(e) => e.stopPropagation()}>
        <div className="media-popup-header">
          <h3 className="media-title">Shared Media</h3>
          <button className="close-media-button" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="media-grid">
          {imageMessages.map((msg, index) => (
            <img
              key={index}
              src={msg.message}
              alt={`media-${index}`}
              className="media-thumb"
              onClick={() => setPreviewImage(msg.message)}
            />
          ))}
        </div>

        {previewImage && (
          <div className="modal-backdrop" onClick={() => setPreviewImage(null)}>
            <img
              src={previewImage}
              alt="Full Size"
              className="full-image"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
