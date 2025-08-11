import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import Portfolio from './Portfolio';
import './PortfolioModal.css';

const PortfolioModal = ({ 
  isOpen, 
  onClose, 
  businessId, 
  businessName,
  onOpenGallery = null 
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
    <div className="portfolio-modal-backdrop" onClick={onClose}>
      <div 
        className="portfolio-modal-container" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="portfolio-modal-header">
          <h2 className="portfolio-modal-title">
            {businessName ? `${businessName} - Portfolio` : 'Business Portfolio'}
          </h2>
          <button 
            className="portfolio-modal-close" 
            onClick={onClose}
            aria-label="Close Portfolio"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Content */}
        <div className="portfolio-modal-content">
          <Portfolio businessId={businessId} onOpenGallery={onOpenGallery} />
        </div>
      </div>
    </div>
  );
};

export default PortfolioModal;
