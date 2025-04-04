import React from "react";
import "../../../styles/ImageModal.css";

const ImageModal = ({ isOpen, imageUrl, mediaType, onClose }) => {
  if (!isOpen) return null;

  const isVideo = mediaType === 'video';

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <video controls autoPlay className="image-modal-img">
            <source src={imageUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img src={imageUrl} alt="Enlarged Portfolio" className="image-modal-img" />
        )}
        <button className="image-modal-close" onClick={onClose}>✖</button>
      </div>
    </div>
  );
};

export default ImageModal;
