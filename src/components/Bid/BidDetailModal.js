import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaArrowLeft, FaCreditCard, FaEdit } from 'react-icons/fa';
import StarIcon from "../../assets/star-duotone.svg";
import Verified from "../../assets/Frame 1162.svg";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import './BidDetailModal.css';
import { supabase } from '../../supabaseClient';

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
  onMoveToPending,
  onMoveToInterested,
  showActions = true,
  onOpenPortfolio = null,
  isCurrentUserBusiness = false,
  onEditBid = null
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);
  const modalRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  // Add-ons selection state
  const [selectedAddOns, setSelectedAddOns] = useState(new Set());
  const [addOnsTotal, setAddOnsTotal] = useState(0);
  const [isSavingSelections, setIsSavingSelections] = useState(false);

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
      
      // Load existing selected add-ons
      loadSelectedAddOns();
    }
  }, [bid]);

  // Load existing selected add-ons from the database
  const loadSelectedAddOns = async () => {
    if (!bid?.id || !bid?.selected_add_ons) return;
    
    try {
      const existingSelections = bid.selected_add_ons;
      if (Array.isArray(existingSelections)) {
        const selectionSet = new Set(existingSelections);
        setSelectedAddOns(selectionSet);
        console.log('Loaded existing add-on selections:', existingSelections);
      }
    } catch (error) {
      console.error('Error loading selected add-ons:', error);
    }
  };

  // Save selected add-ons to the database
  const saveSelectedAddOns = async (newSelections) => {
    if (!bid?.id) return;
    
    setIsSavingSelections(true);
    try {
      const selectedArray = Array.from(newSelections);
      
      const { error } = await supabase
        .from('bids')
        .update({ 
          selected_add_ons: selectedArray,
          last_updated: new Date().toISOString()
        })
        .eq('id', bid.id);
      
      if (error) throw error;
      
      console.log('Saved add-on selections:', selectedArray);
    } catch (error) {
      console.error('Error saving add-on selections:', error);
    } finally {
      setIsSavingSelections(false);
    }
  };

  if (!bid || !isOpen) return null;

  const { business_profiles, bid_amount, bid_description, status, created_at, line_items, add_ons, subtotal, tax, tax_rate, discount_type, discount_value, discount_deadline } = bid;

  // Calculate remaining amount
  const getRemainingAmount = () => {
    if (downPaymentMade && downPaymentAmount > 0) {
      return Math.max(0, bid_amount - downPaymentAmount);
    }
    return bid_amount;
  };

  // Add-ons selection functions
  const toggleAddOn = async (addonId) => {
    const newSelected = new Set(selectedAddOns);
    if (newSelected.has(addonId)) {
      newSelected.delete(addonId);
    } else {
      newSelected.add(addonId);
    }
    setSelectedAddOns(newSelected);
    
    // Save selections to database
    await saveSelectedAddOns(newSelected);
  };

  const getSelectedAddOnsTotal = () => {
    if (!add_ons) return 0;
    return add_ons
      .filter(addon => selectedAddOns.has(addon.id))
      .reduce((sum, addon) => sum + addon.amount, 0);
  };

  const getUpdatedTotal = () => {
    const baseSubtotal = subtotal || line_items.reduce((sum, item) => sum + item.amount, 0);
    const selectedAddOnsAmount = getSelectedAddOnsTotal();
    const totalWithAddOns = baseSubtotal + selectedAddOnsAmount;
    
    // Apply tax if applicable
    const taxAmount = tax_rate > 0 ? (totalWithAddOns * tax_rate) / 100 : 0;
    const totalWithTax = totalWithAddOns + taxAmount;
    
    // Apply discount if applicable
    let finalTotal = totalWithTax;
    if (discount_type && discount_value && isDiscountActive()) {
      if (discount_type === 'percentage') {
        finalTotal = totalWithTax - (totalWithTax * parseFloat(discount_value)) / 100;
      } else {
        finalTotal = totalWithTax - parseFloat(discount_value);
      }
    }
    
    return Math.max(0, finalTotal);
  };

  const getOriginalTotal = () => {
    const baseSubtotal = subtotal || line_items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = tax_rate > 0 ? (baseSubtotal * tax_rate) / 100 : 0;
    const totalWithTax = baseSubtotal + taxAmount;
    
    // Apply discount if applicable
    let finalTotal = totalWithTax;
    if (discount_type && discount_value && isDiscountActive()) {
      if (discount_type === 'percentage') {
        finalTotal = totalWithTax - (totalWithTax * parseFloat(discount_value)) / 100;
      } else {
        finalTotal = totalWithTax - parseFloat(discount_value);
      }
    }
    
    return Math.max(0, finalTotal);
  };

  // Get the final bid amount that should be charged (including selected add-ons)
  const getFinalBidAmount = () => {
    return getUpdatedTotal();
  };

  // Get database remaining amount if available
  const getDatabaseRemainingAmount = () => {
    if (bid.remaining_amount !== null && bid.remaining_amount !== undefined) {
      return parseFloat(bid.remaining_amount);
    }
    return getRemainingAmount();
  };

  // Discount calculation functions
  const calculateDiscountAmount = () => {
    if (!discount_type || !discount_value) return 0;
    
    const totalAmount = parseFloat(bid_amount) || 0;
    if (discount_type === 'percentage') {
      return ((totalAmount+tax) * parseFloat(discount_value)) / 100;
    } else {
      return parseFloat(discount_value) || 0;
    }
  };

  const getDiscountedAmount = () => {
    const discountAmount = calculateDiscountAmount();
    const totalAmount = parseFloat(bid_amount) || 0;
    return Math.max(0, totalAmount - discountAmount);
  };

  const isDiscountActive = () => {
    if (!discount_deadline) return false;
    const now = new Date();
    const deadline = new Date(discount_deadline);
    return now <= deadline;
  };

  const getDiscountTimeRemaining = () => {
    if (!discount_deadline || !isDiscountActive()) return null;
    
    const now = new Date();
    const deadline = new Date(discount_deadline);
    const diffInMs = deadline - now;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} left`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} left`;
    } else {
      return 'Expires soon!';
    }
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
          {downPaymentMade && (
            <div className="bdm-section">
              <h4>Payment Status</h4>
              <div className="bdm-payment-status">
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
              </div>
            </div>
          )}

          {/* Combined Special Offer & Service Breakdown */}
          <div className="bdm-section">
            <h4>Special Offer & Service Breakdown</h4>
            
            {/* Discount Information - Only show if discount is active */}
            {discount_type && discount_value && isDiscountActive() && (
              <div className="bdm-discount-info">
                <div className="bdm-discount-header">
                  <span className="bdm-discount-badge">
                    {discount_type === 'percentage' 
                      ? `${discount_value}% OFF`
                      : `$${discount_value} OFF`
                    }
                  </span>
                  {discount_deadline && (
                    <span className="bdm-discount-deadline active">
                      {getDiscountTimeRemaining()}
                    </span>
                  )}
                </div>
                <div className="bdm-discount-note">
                  <span>💡 Special offer! See breakdown below for final pricing.</span>
                </div>
              </div>
            )}

            {/* Bid Description */}
            {bid_description && (
              <div className="bdm-description">
                <h5>Description</h5>
                <div 
                  dangerouslySetInnerHTML={{ __html: bid_description }}
                />
              </div>
            )}

            {/* Itemized Breakdown with Discount Integration */}
            {line_items && line_items.length > 0 && (
              <div className="bdm-breakdown">
                <h5>Service Details</h5>
                
                {/* Core Services */}
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
                
                {/* Optional Add-ons */}
                {add_ons && add_ons.length > 0 && (
                  <>
                    <div style={{
                      background: '#f0f9ff',
                      border: '1px solid #3b82f6',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      marginBottom: '16px'
                    }}>
                      <p style={{ margin: 0, fontSize: '14px', color: '#1e40af', lineHeight: '1.5' }}>
                        💡 <strong>Customize Your Package:</strong> Select the add-ons you want to include. 
                        Your total will update automatically based on your selections.
                      </p>
                    </div>
                    
                    <div className="bdm-line-item bdm-addons-header" style={{
                      borderTop: '2px solid #e5e7eb',
                      marginTop: '16px',
                      paddingTop: '16px'
                    }}>
                      <div className="bdm-line-item-description">
                        <span className="bdm-item-name" style={{ fontWeight: '600', color: '#7c3aed' }}>
                          ✨ Optional Add-ons (Choose what you want)
                        </span>
                        {isSavingSelections && (
                          <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                            💾 Saving...
                          </span>
                        )}
                      </div>
                      <div className="bdm-line-item-amount" style={{ color: '#7c3aed' }}>
                        Select
                      </div>
                    </div>
                    
                    {add_ons.map((addon, index) => (
                      <div key={index} className="bdm-line-item bdm-addon-item" style={{
                        background: selectedAddOns.has(addon.id) ? '#f0f9ff' : '#f8fafc',
                        borderRadius: '8px',
                        margin: '8px 0',
                        border: selectedAddOns.has(addon.id) ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        transition: 'all 0.2s ease'
                      }}>
                        <div className="bdm-line-item-description" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={selectedAddOns.has(addon.id)}
                            onChange={() => toggleAddOn(addon.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#7c3aed'
                            }}
                          />
                          <div>
                            <span className="bdm-item-name">{addon.description}</span>
                            <span className="bdm-item-details">
                              {addon.quantity} × ${addon.rate}
                            </span>
                          </div>
                        </div>
                        <div className="bdm-line-item-amount" style={{
                          color: selectedAddOns.has(addon.id) ? '#3b82f6' : '#6b7280',
                          fontWeight: selectedAddOns.has(addon.id) ? '600' : '400'
                        }}>
                          ${addon.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                    
                    {/* Selected Add-ons Summary */}
                    {selectedAddOns.size > 0 && (
                      <div className="bdm-line-item bdm-selected-addons" style={{
                        background: '#f0f9ff',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        margin: '16px 0',
                        padding: '12px 16px'
                      }}>
                        <div className="bdm-line-item-description">
                          <span className="bdm-item-name" style={{ color: '#3b82f6', fontWeight: '600' }}>
                            Selected Add-ons
                          </span>
                        </div>
                        <div className="bdm-line-item-amount" style={{ color: '#3b82f6', fontWeight: '600' }}>
                          +${getSelectedAddOnsTotal().toFixed(2)}
                        </div>
                      </div>
                    )}
                    
                    {/* Price Comparison */}
                    {selectedAddOns.size > 0 && (
                      <div style={{
                        background: '#fef3c7',
                        border: '1px solid #f59e0b',
                        borderRadius: '8px',
                        padding: '16px',
                        margin: '16px 0'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', color: '#92400e', fontWeight: '500' }}>
                            Original Package:
                          </span>
                          <span style={{ fontSize: '16px', color: '#92400e', fontWeight: '600' }}>
                            ${getOriginalTotal().toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#92400e', fontWeight: '500' }}>
                            With Selected Add-ons:
                          </span>
                          <span style={{ fontSize: '18px', color: '#059669', fontWeight: '700' }}>
                            ${getUpdatedTotal().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Final Payment Summary */}
                    <div style={{
                      background: '#ecfdf5',
                      border: '2px solid #059669',
                      borderRadius: '12px',
                      padding: '20px',
                      margin: '20px 0',
                      textAlign: 'center'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#059669', fontSize: '18px', fontWeight: '600' }}>
                        💳 Your Final Payment
                      </h4>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669', marginBottom: '8px' }}>
                        ${getFinalBidAmount().toFixed(2)}
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', color: '#047857' }}>
                        {selectedAddOns.size > 0 
                          ? `Includes ${selectedAddOns.size} selected add-on${selectedAddOns.size > 1 ? 's' : ''}`
                          : 'Base package only'
                        }
                      </p>
                    </div>
                  </>
                )}
                
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

                {/* Original Total (before discount) */}
                <div className="bdm-line-item bdm-original-total">
                  <div className="bdm-line-item-description">
                    <span className="bdm-item-name">Original Total</span>
                  </div>
                  <div className="bdm-line-item-amount">
                    ${(bid_amount+tax).toFixed(2)}
                  </div>
                </div>

                {/* Discount Applied (if applicable) */}
                {discount_type && discount_value && isDiscountActive() && (
                  <>
                    <div className="bdm-line-item bdm-discount-applied">
                      <div className="bdm-line-item-description">
                        <span className="bdm-item-name">Discount Applied</span>
                        <span className="bdm-item-details">
                          {discount_type === 'percentage' ? `${discount_value}% OFF` : `$${discount_value} OFF`}
                        </span>
                      </div>
                      <div className="bdm-line-item-amount discount-amount">
                        -${calculateDiscountAmount().toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Final Total (after discount) */}
                    <div className="bdm-line-item bdm-final-total">
                      <div className="bdm-line-item-description">
                        <span className="bdm-item-name">Final Total</span>
                        {selectedAddOns.size > 0 && (
                          <span className="bdm-item-details" style={{ color: '#3b82f6', fontSize: '12px' }}>
                            (includes selected add-ons)
                          </span>
                        )}
                      </div>
                      <div className="bdm-line-item-amount final-amount">
                        ${getUpdatedTotal().toFixed(2)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="bdm-actions">
              {isCurrentUserBusiness ? (
                // Business user actions - only show edit bid button
                <button
                  className="bdm-btn bdm-btn-primary"
                  onClick={() => onEditBid && onEditBid()}
                >
                  <FaEdit />
                  Edit Bid
                </button>
              ) : (
                // Individual user actions
                <>
                  {status === 'pending' && (
                    <>
                      <button
                        className="bdm-btn bdm-btn-success"
                        onClick={() => onApprove && onApprove()}
                      >
                        <CheckCircleIcon />
                        Approve
                      </button>
                      <button
                        className="bdm-btn bdm-btn-danger"
                        onClick={() => onDeny && onDeny()}
                      >
                        <CancelIcon />
                        Deny
                      </button>
                    </>
                  )}
                  
                  {status === 'new' && (
                    <>
                      <button
                        className="bdm-btn bdm-btn-success"
                        onClick={() => onMoveToInterested && onMoveToInterested()}
                      >
                        <CheckCircleIcon />
                        Mark as Interested
                      </button>
                      <button
                        className="bdm-btn bdm-btn-secondary"
                        onClick={() => onMoveToPending && onMoveToPending()}
                      >
                        <AccessTimeIcon />
                        Move to Pending
                      </button>
                      <button
                        className="bdm-btn bdm-btn-danger"
                        onClick={() => onDeny && onDeny()}
                      >
                        <CancelIcon />
                        Not Interested
                      </button>
                    </>
                  )}
                  
                  {status === 'interested' && (
                    <>
                      <button
                        className="bdm-btn bdm-btn-success"
                        onClick={() => onApprove && onApprove()}
                      >
                        <CheckCircleIcon />
                        Approve
                      </button>
                      <button
                        className="bdm-btn bdm-btn-secondary"
                        onClick={() => onMoveToPending && onMoveToPending()}
                      >
                        <AccessTimeIcon />
                        Move to Pending
                      </button>
                      <button
                        className="bdm-btn bdm-btn-danger"
                        onClick={() => onDeny && onDeny()}
                      >
                        <CancelIcon />
                        Not Interested
                      </button>
                    </>
                  )}
                  
                  {(status === 'approved' || status === 'accepted') && (
                    <button
                      className="bdm-btn bdm-btn-pay"
                      onClick={() => onPayClick && onPayClick()}
                    >
                      <FaCreditCard />
                      {downPaymentMade ? 'Pay Remaining' : 'Pay'}
                    </button>
                  )}
                  
                  {business_profiles?.google_calendar_connected && (status === 'approved' || status === 'accepted') && (
                    <button
                      className="bdm-btn bdm-btn-secondary"
                      onClick={() => onConsultationClick && onConsultationClick()}
                    >
                      Schedule Consultation
                    </button>
                  )}
                </>
              )}
              
              <button
                className="bdm-btn bdm-btn-secondary"
                onClick={() => onMessageClick && onMessageClick()}
              >
                Message
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BidDetailModal;
