import React from "react";
import "../../../styles/ImageModal.css";

const ImageModal = ({ isOpen, imageUrl, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Enlarged Portfolio" className="image-modal-img" />
        <button className="image-modal-close" onClick={onClose}>✖</button>
      </div>
    </div>
  );
};

export default ImageModal;
