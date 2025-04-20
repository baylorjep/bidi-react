import React, { useEffect, useState } from "react";
// import Modal from "react-modal";
import { Modal } from "react-bootstrap";
import { convertHeicToJpeg } from "../../../utils/imageUtils";
import "../../../styles/ImageModal.css";

const ImageModal = ({ isOpen, mediaUrl, isVideo, onClose }) => {
  const [convertedUrl, setConvertedUrl] = useState(mediaUrl);
  const [isConverting, setIsConverting] = useState(false);
  console.log("Modal isOpen:", isOpen);

  useEffect(() => {
    const handleHeicImage = async () => {
      if (!isVideo && mediaUrl && mediaUrl.toLowerCase().match(/\.heic$/)) {
        setIsConverting(true);
        const converted = await convertHeicToJpeg(mediaUrl);
        setConvertedUrl(converted);
        setIsConverting(false);
      } else {
        setConvertedUrl(mediaUrl);
      }
    };

    handleHeicImage();

    // Cleanup function to revoke object URL
    return () => {
      if (convertedUrl && convertedUrl !== mediaUrl) {
        URL.revokeObjectURL(convertedUrl);
      }
    };
  }, [mediaUrl, isVideo]);

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      centered
      size="lg"
      className="image-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Media Preview</Modal.Title>
      </Modal.Header>
      <Modal.Body className="image-modal-body">
        {isVideo ? (
          <div className="video-container">
            <video 
              src={mediaUrl} 
              controls 
              autoPlay 
              className="modal-media video"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <>
            {isConverting ? (
              <div className="converting-overlay">
                <div className="converting-spinner"></div>
                <p>Converting image...</p>
              </div>
            ) : (
              <img
                src={convertedUrl}
                alt="Portfolio item"
                className="modal-media img-fluid"
              />
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ImageModal;
