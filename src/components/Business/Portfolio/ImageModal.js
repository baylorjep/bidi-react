import React from "react";
import Modal from "react-modal";

const ImageModal = ({ isOpen, mediaUrl, isVideo, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="image-modal"
      overlayClassName="image-modal-overlay"
      ariaHideApp={false}
    >
      <button onClick={onClose} className="close-modal-button">×</button>
      <div className="modal-content">
        {isVideo ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="modal-media"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={mediaUrl}
            alt="Portfolio item"
            className="modal-media"
          />
        )}
      </div>
    </Modal>
  );
};

export default ImageModal;
