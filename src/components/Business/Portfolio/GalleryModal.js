import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import Gallery from './Gallery';
import './GalleryModal.css';

const GalleryModal = ({ 
  isOpen, 
  onClose, 
  businessId, 
  businessName,
  onBackToPortfolio = null 
}) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="gallery-modal-backdrop" onClick={onClose}>
      <div 
        className="gallery-modal-container" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="gallery-modal-header">
          <h2 className="gallery-modal-title">
            {businessName ? `${businessName} - Gallery` : 'Business Gallery'}
          </h2>
          <button 
            className="gallery-modal-close" 
            onClick={onClose}
            aria-label="Close Gallery"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Content */}
        <div className="gallery-modal-content">
          <Gallery 
            businessId={businessId} 
            businessName={businessName} 
            isModal={true} 
            onModalClose={onClose}
            onBackToPortfolio={onBackToPortfolio}
          />
        </div>
      </div>
    </div>
  );
};

export default GalleryModal;
