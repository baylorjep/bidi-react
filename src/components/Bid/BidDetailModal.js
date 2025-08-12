import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaArrowLeft, FaCreditCard } from 'react-icons/fa';
import StarIcon from "../../assets/star-duotone.svg";
import Verified from "../../assets/Frame 1162.svg";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import './BidDetailModal.css';

const BidDetailModal = ({
  isOpen,
  onClose,
  bid,
  currentUserId,
  onPayClick,
  onMessageClick,
  onConsultationClick,
  onApprove,
  onDeny,
  showActions = true,
  onOpenPortfolio = null
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);
  const modalRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  // Payment status state
  const [downPaymentMade, setDownPaymentMade] = useState(false);
  const [downPaymentAmount, setDownPaymentAmount] = useState(0);
  const [downPaymentDate, setDownPaymentDate] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentTranslateY(0);
      setIsDragging(false);
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Check payment status when bid changes
  useEffect(() => {
    if (bid) {
      // Check if down payment has been made
      const hasDownPayment = bid.payment_amount && parseFloat(bid.payment_amount) > 0 &&
        (bid.payment_type === 'down_payment' || bid.payment_status === 'down_payment_paid' || bid.status === 'paid');
      
      if (hasDownPayment) {
        setDownPaymentMade(true);
        setDownPaymentAmount(parseFloat(bid.payment_amount));
        if (bid.paid_at) {
          setDownPaymentDate(new Date(bid.paid_at));
        }
      } else {
        setDownPaymentMade(false);
        setDownPaymentAmount(0);
        setDownPaymentDate(null);
      }
    }
  }, [bid]);

  if (!bid || !isOpen) return null;

  const { business_profiles, bid_amount, bid_description, status, created_at, line_items, subtotal, tax, tax_rate } = bid;

  // Calculate remaining amount
  const getRemainingAmount = () => {
    if (downPaymentMade && downPaymentAmount > 0) {
      return Math.max(0, bid_amount - downPaymentAmount);
    }
    return bid_amount;
  };

  // Get database remaining amount if available
  const getDatabaseRemainingAmount = () => {
    if (bid.remaining_amount !== null && bid.remaining_amount !== undefined) {
      return parseFloat(bid.remaining_amount);
    }
    return getRemainingAmount();
  };

  // Calculate time since created
  const getTimeSinceCreated = () => {
    const now = new Date();
    const created = new Date(created_at);
    const diffInMs = now - created;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Get status badge
  const renderStatusBadge = () => {
    switch (status) {
      case 'approved':
        return (
          <div className="bdm-status-badge approved">
            <CheckCircleIcon />
            <span>Approved</span>
          </div>
        );
      case 'pending':
        return (
          <div className="bdm-status-badge pending">
            <AccessTimeIcon />
            <span>Pending</span>
          </div>
        );
      case 'denied':
        return (
          <div className="bdm-status-badge denied">
            <CancelIcon />
            <span>Denied</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Touch handlers for mobile drag
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    
    const target = e.target;
    const headerArea = target.closest('.bdm-header');
    if (!headerArea && !target.classList.contains('bdm-drag-handle')) return;
    
    if (target.classList.contains('bdm-close-btn')) return;
    
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
    setCurrentTranslateY(0);
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !isMobile) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY;
    const modalHeight = window.innerHeight;
    const threshold = modalHeight * 0.3;
    
    if (diff > 0) {
      let dampedDiff;
      if (diff > threshold) {
        const extraDiff = diff - threshold;
        dampedDiff = threshold + (extraDiff * 0.5);
      } else {
        dampedDiff = diff;
      }
      dampedDiff = Math.min(dampedDiff, modalHeight);
      setCurrentTranslateY(dampedDiff);
    }
    
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    if (!isDragging || !isMobile) return;
    
    setIsDragging(false);
    const modalHeight = window.innerHeight;
    const threshold = modalHeight * 0.3;
    
    const modal = document.querySelector('.bdm-modal');
    if (modal) {
      modal.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
    
    if (currentTranslateY > threshold) {
      const finalTranslate = modalHeight * 1.1;
      setCurrentTranslateY(finalTranslate);
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setCurrentTranslateY(0);
    }
  };

  const profileImage = business_profiles?.profile_image || 'https://via.placeholder.com/60x60?text=Profile';

  // Handle profile click - open portfolio modal if available, otherwise navigate
  const handleProfileClick = (e) => {
    e.stopPropagation();
    if (onOpenPortfolio) {
      onClose();
      onOpenPortfolio(business_profiles);
    } else {
      onClose();
      navigate(`/portfolio/${business_profiles.id}/${business_profiles.business_name}`);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="bdm-backdrop" onClick={onClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        className="bdm-modal"
        style={{
          transform: isMobile 
            ? `translateY(${isOpen ? 0 : '100%'}) translateY(${currentTranslateY}px)`
            : `translateX(-50%) translateY(-50%) ${isOpen ? 'scale(1)' : 'scale(0.9) translateY(-60%)'}`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isOpen ? 1 : 0
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="bdm-header">
          {isMobile && <div className="bdm-drag-handle" />}
          
          <div className="bdm-header-content">
            <div className="bdm-header-left">
              {isMobile && (
                <button className="bdm-back-btn" onClick={onClose}>
                  <FaArrowLeft />
                </button>
              )}
              <h3>Bid Details</h3>
            </div>
            
            <div className="bdm-header-right">
              {renderStatusBadge()}
              <button className="bdm-close-btn" onClick={onClose}>
                <FaTimes />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bdm-content">
          {/* Business Profile Section */}
          <div className="bdm-section">
            <div className="bdm-business-profile">
              <img
                src={profileImage}
                alt={`${business_profiles.business_name} profile`}
                className="bdm-business-avatar bdm-business-avatar-clickable"
                onClick={handleProfileClick}
              />
              <div className="bdm-business-info">
                <h4 className="bdm-business-name">
                  {business_profiles.business_name}
                  {business_profiles.is_verified && (
                    <div className="bdm-verified-badge">
                      <img src={Verified} alt="Verified" />
                      <span>Verified</span>
                    </div>
                  )}
                </h4>
                <div className="bdm-business-time">{getTimeSinceCreated()}</div>
              </div>
              <div className="bdm-bid-amount">
                <span className="bdm-amount">${bid_amount}</span>
                {downPaymentMade && (
                  <div className="bdm-payment-status-indicator">
                    <CheckCircleIcon />
                    <span>Down Payment Paid</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Status Section */}
          <div className="bdm-section">
            <h4>Payment Status</h4>
            <div className="bdm-payment-status">
              {downPaymentMade ? (
                <div className="bdm-payment-status-row">
                  <div className="bdm-payment-status-item">
                    <span className="bdm-payment-label">Down Payment Made:</span>
                    <span className="bdm-payment-amount paid">${downPaymentAmount.toFixed(2)}</span>
                  </div>
                  {downPaymentDate && (
                    <div className="bdm-payment-status-item">
                      <span className="bdm-payment-label">Paid On:</span>
                      <span className="bdm-payment-date">{downPaymentDate.toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="bdm-payment-status-item">
                    <span className="bdm-payment-label">Remaining Balance:</span>
                    <span className="bdm-payment-remaining">${getDatabaseRemainingAmount().toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="bdm-payment-status-row">
                  <div className="bdm-payment-status-item">
                    <span className="bdm-payment-label">Payment Required:</span>
                    <span className="bdm-payment-amount">${bid_amount}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bid Description */}
          {bid_description && (
            <div className="bdm-section">
              <h4>Description</h4>
              <div 
                className="bdm-description"
                dangerouslySetInnerHTML={{ __html: bid_description }}
              />
            </div>
          )}

          {/* Itemized Breakdown */}
          {line_items && line_items.length > 0 && (
            <div className="bdm-section">
              <h4>Service Breakdown</h4>
              <div className="bdm-breakdown">
                {line_items.map((item, index) => (
                  <div key={index} className="bdm-line-item">
                    <div className="bdm-line-item-description">
                      <span className="bdm-item-name">{item.description}</span>
                      <span className="bdm-item-details">
                        {item.quantity} × ${item.rate}
                      </span>
                    </div>
                    <div className="bdm-line-item-amount">
                      ${item.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
                
                {/* Subtotal */}
                <div className="bdm-line-item bdm-subtotal">
                  <div className="bdm-line-item-description">
                    <span className="bdm-item-name">Subtotal</span>
                  </div>
                  <div className="bdm-line-item-amount">
                    ${(subtotal || line_items.reduce((sum, item) => sum + item.amount, 0)).toFixed(2)}
                  </div>
                </div>

                {/* Tax */}
                {tax_rate > 0 && (
                  <div className="bdm-line-item bdm-tax">
                    <div className="bdm-line-item-description">
                      <span className="bdm-item-name">Tax ({tax_rate}%)</span>
                    </div>
                    <div className="bdm-line-item-amount">
                      ${(tax || 0).toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="bdm-line-item bdm-total">
                  <div className="bdm-line-item-description">
                    <span className="bdm-item-name">Total</span>
                  </div>
                  <div className="bdm-line-item-amount">
                    ${bid_amount}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="bdm-actions">
              {status === 'pending' && (
                <>
                  <button
                    className="bdm-btn bdm-btn-success"
                    onClick={() => onApprove && onApprove(bid.id)}
                  >
                    <CheckCircleIcon />
                    Approve
                  </button>
                  <button
                    className="bdm-btn bdm-btn-danger"
                    onClick={() => onDeny && onDeny(bid.id)}
                  >
                    <CancelIcon />
                    Deny
                  </button>
                </>
              )}
              
              {(status === 'approved' || status === 'accepted' || status === 'interested') && (
                <button
                  className="bdm-btn bdm-btn-pay"
                  onClick={() => onPayClick && onPayClick()}
                >
                  <FaCreditCard />
                  {downPaymentMade ? 'Pay Remaining' : 'Pay'}
                </button>
              )}
              
              <button
                className="bdm-btn bdm-btn-secondary"
                onClick={() => onMessageClick && onMessageClick()}
              >
                Message
              </button>
              
              {business_profiles?.google_calendar_connected && (status === 'approved' || status === 'accepted') && (
                <button
                  className="bdm-btn bdm-btn-secondary"
                  onClick={() => onConsultationClick && onConsultationClick()}
                >
                  Schedule Consultation
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BidDetailModal;
