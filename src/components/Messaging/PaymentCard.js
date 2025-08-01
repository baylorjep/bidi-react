import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCreditCard, FaDollarSign, FaPlus, FaTrash } from 'react-icons/fa';
import '../../styles/PaymentCard.css';

const PaymentCard = ({ 
  amount, 
  businessName, 
  stripeAccountId, 
  description = 'Service Payment',
  lineItems = [],
  subtotal = 0,
  tax = 0,
  taxRate = 0,
  paymentStatus = 'pending',
  onSend,
  isBusiness = false 
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customAmount, setCustomAmount] = useState(amount || '');
  const [paymentDescription, setPaymentDescription] = useState(description);
  const [paymentLineItems, setPaymentLineItems] = useState([
    { id: 1, description: 'Service or item name', quantity: 1, rate: '', amount: 0 }
  ]);
  const [paymentTaxRate, setPaymentTaxRate] = useState(0);
  const navigate = useNavigate();

  const calculateSubtotal = () => {
    return paymentLineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() * paymentTaxRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const addLineItem = () => {
    const newId = Math.max(...paymentLineItems.map(item => item.id), 0) + 1;
    setPaymentLineItems([...paymentLineItems, { id: newId, description: '', quantity: 1, rate: '', amount: 0 }]);
  };

  const removeLineItem = (id) => {
    if (paymentLineItems.length > 1) {
      setPaymentLineItems(paymentLineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id, field, value) => {
    setPaymentLineItems(paymentLineItems.map(item => {
      if (item.id === id) {
        // If updating description, strip HTML tags
        const sanitizedValue = field === 'description' ? value.replace(/<[^>]*>/g, '') : value;
        const updatedItem = { ...item, [field]: sanitizedValue };
        if (field === 'quantity' || field === 'rate') {
          const quantity = field === 'quantity' ? parseFloat(value) || 0 : item.quantity;
          const rate = field === 'rate' ? parseFloat(value) || 0 : item.rate;
          updatedItem.amount = quantity * rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSendPaymentRequest = () => {
    if (!stripeAccountId) {
      console.error('Missing stripe account ID');
      return;
    }

    const total = calculateTotal();
    if (total <= 0) {
      alert('Please add at least one line item with a valid amount');
      return;
    }

    const paymentData = {
      amount: total,
      stripe_account_id: stripeAccountId,
      payment_type: 'custom',
      business_name: businessName,
      description: paymentDescription,
      lineItems: paymentLineItems.filter(item => item.amount > 0),
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      taxRate: paymentTaxRate
    };

    // Send as a special message type
    if (onSend) {
      onSend({
        type: 'payment_request',
        amount: total,
        description: paymentDescription,
        paymentData
      });
    }

    setShowPaymentModal(false);
  };

  const handlePayNow = () => {
    const paymentData = {
      amount: parseFloat(amount),
      stripe_account_id: stripeAccountId,
      payment_type: 'custom',
      business_name: businessName,
      description: description,
      lineItems: lineItems || [],
      subtotal: subtotal || 0,
      tax: tax || 0,
      taxRate: taxRate || 0
    };
    navigate('/checkout', { state: { paymentData } });
  };

  return (
    <>
      <div className="payment-card">
        <div className="payment-card-header">
          <FaCreditCard className="payment-icon" />
          <span className="payment-title">Payment Request</span>
        </div>
        <div className="payment-card-content">
          <div className="payment-description">
            {description}
          </div>
          <div className="payment-business">
            From: {businessName}
          </div>
          
          {lineItems && lineItems.length > 0 ? (
            <div className="payment-breakdown">
              {lineItems.map((item, index) => (
                <div key={index} className="breakdown-item">
                  <span className="item-description">{item.description}</span>
                  <span className="item-amount">${item.amount.toFixed(2)}</span>
                </div>
              ))}
              {taxRate > 0 && (
                <div className="breakdown-item">
                  <span className="item-description">Tax ({taxRate}%)</span>
                  <span className="item-amount">${tax.toFixed(2)}</span>
                </div>
              )}
              <div className="breakdown-item total">
                <span className="item-description">Total</span>
                <span className="item-amount">${amount || '0.00'}</span>
              </div>
            </div>
          ) : (
            <div className="payment-amount">
              <FaDollarSign className="dollar-icon" />
              <span className="amount-text">${amount || '0.00'}</span>
            </div>
          )}
        </div>
        <div className="payment-card-actions">
          {paymentStatus === 'paid' ? (
            <div className="payment-status paid">
              <span>✓ Paid</span>
            </div>
          ) : paymentStatus === 'cancelled' ? (
            <div className="payment-status cancelled">
              <span>✗ Cancelled</span>
            </div>
          ) : paymentStatus === 'expired' ? (
            <div className="payment-status expired">
              <span>⏰ Expired</span>
            </div>
          ) : (
            <button 
              className="pay-now-btn"
              onClick={handlePayNow}
            >
              Pay Now
            </button>
          )}
        </div>
      </div>

      {/* Payment Request Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-header">
              <h3>Create Payment Request</h3>
              <button 
                className="close-btn"
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>
            <div className="payment-modal-content">
              <div className="line-items-section">
                <div className="line-items-header">
                  <h4>Service Breakdown</h4>
                  <button 
                    className="add-line-item-btn"
                    onClick={addLineItem}
                    type="button"
                  >
                    <FaPlus /> Add Service
                  </button>
                </div>
                
                <div className="line-items-help">
                  <p><strong>Itemize your services:</strong> List each service or item separately. For example: "Wedding Photography" (8 hours × $150), "Bouquet Design" (1 item × $200), etc.</p>
                </div>
                <div className="line-items-list">
                  {paymentLineItems.map((item, index) => (
                    <div key={item.id} className="line-item">
                      <div className="line-item-row">
                        <div className="line-item-description">
                          <input
                            type="text"
                            placeholder="e.g., Wedding Photography, Bouquet Design, DJ Services"
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          />
                        </div>
                        <div className="line-item-quantity">
                          <input
                            type="number"
                            placeholder="Hours/Qty"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="line-item-rate">
                          <input
                            type="number"
                            placeholder="$ per hour/item"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateLineItem(item.id, 'rate', e.target.value)}
                          />
                        </div>
                        <div className="line-item-amount">
                          ${(item.amount || 0).toFixed(2)}
                        </div>
                        <div className="line-item-actions">
                          <button
                            className="remove-line-item-btn"
                            onClick={() => removeLineItem(item.id)}
                            type="button"
                            disabled={paymentLineItems.length === 1}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="tax-section">
                <div className="tax-input">
                  <label>Tax Rate (%)</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                    value={paymentTaxRate}
                    onChange={(e) => setPaymentTaxRate(parseFloat(e.target.value) || 0)}
                  />
                  <small>Leave as 0 if no tax applies</small>
                </div>
              </div>

              <div className="payment-summary">
                <h4>Payment Summary</h4>
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                {paymentTaxRate > 0 && (
                  <div className="summary-row">
                    <span>Tax ({paymentTaxRate}%):</span>
                    <span>${calculateTax().toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="payment-modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="send-btn"
                onClick={handleSendPaymentRequest}
                disabled={calculateTotal() <= 0}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentCard; 