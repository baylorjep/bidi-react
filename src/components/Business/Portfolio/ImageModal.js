import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { convertHeicToJpeg } from "../../../utils/imageUtils";

const ImageModal = ({ isOpen, mediaUrl, isVideo, onClose }) => {
  const [convertedUrl, setConvertedUrl] = useState(mediaUrl);
  const [isConverting, setIsConverting] = useState(false);

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
                className="modal-media"
              />
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ImageModal;
