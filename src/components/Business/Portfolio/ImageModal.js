import React, { useEffect, useState } from "react";
// import Modal from "react-modal";
import { Modal } from "react-bootstrap";
import { convertHeicToJpeg } from "../../../utils/imageUtils";

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
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Media Preview</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isVideo ? (
          <video src={mediaUrl} controls autoPlay className="modal-media">
            Your browser does not support the video tag.
          </video>
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
