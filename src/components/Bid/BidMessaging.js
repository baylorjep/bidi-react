import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { socket } from '../../socket';
import { formatMessageText } from '../../utils/formatMessageText';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { FaCreditCard, FaPlus, FaTrash } from 'react-icons/fa';
import PaymentCard from '../Messaging/PaymentCard';
import './BidMessaging.css';

const BidMessaging = ({ 
  bid, 
  currentUserId, 
  onClose, 
  isOpen = false,
  businessName,
  profileImage 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Payment request state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState(null);
  const [isCurrentUserBusiness, setIsCurrentUserBusiness] = useState(false);
  const [modalLineItems, setModalLineItems] = useState([
    { id: 1, description: '', quantity: 1, rate: '', amount: 0 }
  ]);
  const [modalTaxRate, setModalTaxRate] = useState(0);
  
  // Image upload state
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);

  // Get the other user's ID (the one we're chatting with)
  const otherUserId = currentUserId === bid.user_id ? bid.business_profiles?.id : bid.user_id;

  // Fetch messages related to this bid
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUserId || !otherUserId || !bid.id) return;

      try {
        // Fetch messages that are linked to this bid
        const { data: bidMessages, error: bidMessagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('bid_id', bid.id)
          .order('created_at', { ascending: true });

        if (bidMessagesError) {
          console.error('Error fetching bid messages:', bidMessagesError);
          return;
        }

        // Also fetch general messages between these users
        const { data: generalMessages, error: generalMessagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
          .is('bid_id', null)
          .order('created_at', { ascending: true });

        if (generalMessagesError) {
          console.error('Error fetching general messages:', generalMessagesError);
          return;
        }

        // Combine and sort all messages
        let allMessages = [...(bidMessages || []), ...(generalMessages || [])];
        allMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        // Handle legacy bids - if no bid messages exist but bid has description, create a virtual message
        if ((!bidMessages || bidMessages.length === 0) && bid.bid_description) {
          // Create a virtual message object from the bid description
          const virtualMessage = {
            id: `virtual-${bid.id}`,
            sender_id: bid.user_id,
            receiver_id: otherUserId,
            message: `💼 **Bid: $${bid.bid_amount}**\n\n${bid.bid_description}`,
            created_at: bid.created_at || new Date().toISOString(),
            seen: false,
            type: 'text',
            is_bid_message: true,
            is_virtual: true // Flag to identify this as a virtual message
          };
          
          // Add the virtual message to the beginning of the messages array
          allMessages = [virtualMessage, ...allMessages];
        }

        // Format messages for display
        const formattedMessages = allMessages.map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          message: msg.message,
          createdAt: msg.created_at,
          seen: msg.seen || false,
          type: msg.type || 'text',
          isBidMessage: msg.is_bid_message || false,
          isVirtual: msg.is_virtual || false
        }));

        setMessages(formattedMessages);

        // Mark incoming messages as seen
        const unreadMessages = generalMessages?.filter(msg => 
          msg.receiver_id === currentUserId && !msg.seen
        ) || [];
        
        if (unreadMessages.length > 0) {
          const messageIds = unreadMessages.map(msg => msg.id);
          await supabase
            .from('messages')
            .update({ seen: true })
            .in('id', messageIds);
        }
      } catch (error) {
        console.error('Error in fetchMessages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [currentUserId, otherUserId, bid.id]);

  // Socket connection for real-time messaging
  useEffect(() => {
    if (!currentUserId) return;

    socket.emit("join", currentUserId);

    const handleReceive = (msg) => {
      console.log('Received message via socket:', msg);
      
      // Handle both field naming conventions
      const senderId = msg.senderId || msg.sender_id;
      const receiverId = msg.receiverId || msg.receiver_id;
      const createdAt = msg.createdAt || msg.created_at;
      
      if (
        (senderId === otherUserId && receiverId === currentUserId) ||
        (senderId === currentUserId && receiverId === otherUserId)
      ) {
        // Format the message to match our display format
        const formattedMsg = {
          id: msg.id,
          senderId: senderId,
          receiverId: receiverId,
          message: msg.message,
          createdAt: createdAt,
          seen: msg.seen || false,
          type: msg.type || 'text',
          isBidMessage: msg.is_bid_message || false,
          isVirtual: msg.is_virtual || false,
          // Add payment-specific fields if they exist
          payment_amount: msg.payment_amount,
          payment_data: msg.payment_data,
          payment_status: msg.payment_status
        };
        
        setMessages((prev) => {
          const exists = prev.some(m =>
            m.senderId === formattedMsg.senderId &&
            m.receiverId === formattedMsg.receiverId &&
            m.message === formattedMsg.message &&
            Math.abs(new Date(m.createdAt) - new Date(formattedMsg.createdAt)) < 1000
          );
          return exists ? prev : [...prev, formattedMsg];
        });
      }
    };

    const handleTyping = (fromId) => {
      if (fromId === otherUserId) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (fromId) => {
      if (fromId === otherUserId) {
        setIsTyping(false);
      }
    };

    socket.on("receive_message", handleReceive);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
    };
  }, [currentUserId, otherUserId]);

  // Check if current user is a business and get Stripe account ID
  useEffect(() => {
    const checkBusinessProfile = async () => {
      if (!currentUserId) return;
      
      try {
        const { data, error } = await supabase
          .from('business_profiles')
          .select('id, stripe_account_id')
          .eq('id', currentUserId)
          .single();
        
        console.log('Business profile check:', { data, error });
        console.log('Current user ID:', currentUserId);
        setIsCurrentUserBusiness(!!data);
        setStripeAccountId(data?.stripe_account_id || null);
        console.log('Is business user:', !!data, 'Stripe account ID:', data?.stripe_account_id);
      } catch (error) {
        console.error('Error checking business profile:', error);
        setIsCurrentUserBusiness(false);
        setStripeAccountId(null);
      }
    };

    checkBusinessProfile();
  }, [currentUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isTyping]);

  // Handle body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      
      // Add escape key handler
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.classList.remove('modal-open');
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, onClose]);

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.trim()) {
      socket.emit("typing", { sender_id: currentUserId, receiver_id: otherUserId });
    } else {
      socket.emit("stop_typing", { sender_id: currentUserId, receiver_id: otherUserId });
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { sender_id: currentUserId, receiver_id: otherUserId });
    }, 1000);
  };

  // Payment calculation functions
  const calculateSubtotal = () => {
    return modalLineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() * modalTaxRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const addLineItem = () => {
    const newId = Math.max(...modalLineItems.map(item => item.id), 0) + 1;
    setModalLineItems([...modalLineItems, { id: newId, description: '', quantity: 1, rate: '', amount: 0 }]);
  };

  const removeLineItem = (id) => {
    if (modalLineItems.length > 1) {
      setModalLineItems(modalLineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id, field, value) => {
    setModalLineItems(modalLineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
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

  const handleSendPaymentRequest = (paymentData) => {
    if (!stripeAccountId) {
      console.error('No Stripe account ID found for business');
      return;
    }

    const total = calculateTotal();
    if (total <= 0) {
      alert('Please add at least one line item with a valid amount');
      return;
    }

    const messageData = {
      sender_id: currentUserId,
      receiver_id: otherUserId,
      message: JSON.stringify({
        type: 'payment_request',
        amount: total,
        description: 'Service Payment',
        paymentData: {
          amount: total,
          stripe_account_id: stripeAccountId,
          payment_type: 'custom',
          business_name: businessName,
          description: 'Service Payment',
          lineItems: modalLineItems.filter(item => item.amount > 0),
          subtotal: calculateSubtotal(),
          tax: calculateTax(),
          taxRate: modalTaxRate
        }
      }),
      type: 'payment_request',
      payment_amount: total,
      payment_status: 'pending',
      payment_data: {
        lineItems: modalLineItems.filter(item => item.amount > 0),
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        taxRate: modalTaxRate,
        stripe_account_id: stripeAccountId,
        business_name: businessName,
          description: 'Service Payment'
      },
      seen: false
    };

    console.log('Sending payment request message:', messageData);
    socket.emit("send_message", messageData);
    setShowPaymentModal(false);
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    setPendingFile(file);
    const localPreview = URL.createObjectURL(file);
    setPreviewImageUrl(localPreview);

    e.target.value = null;
  };

  // Send message
  const sendMessage = async () => {
    if (!pendingFile && !newMessage.trim()) return;
  
    let imageUrl = null;
  
    if (pendingFile && previewImageUrl) {
      try {
        const cleanFileName = pendingFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const fileName = `${Date.now()}_${cleanFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, pendingFile);
  
        if (uploadError) {
          console.error("Image upload failed:", uploadError);
          return;
        }
  
        const { publicUrl } = supabase
          .storage
          .from('chat-images')
          .getPublicUrl(fileName).data;
  
        imageUrl = publicUrl;
      } catch (err) {
        console.error("Image send failed:", err);
        return;
      }
    }
  
    if (imageUrl) {
      socket.emit("send_message", {
        sender_id: currentUserId,
        receiver_id: otherUserId,
        message: imageUrl,
        type: "image",
        seen: false,
      });
    }
  
    if (newMessage.trim()) {
      socket.emit("send_message", {
        sender_id: currentUserId,
        receiver_id: otherUserId,
        message: newMessage.trim(),
        type: "text",
        seen: false,
      });
    }
  
    // Cleanup
    setNewMessage("");
    setPreviewImageUrl(null);
    setPendingFile(null);
    socket.emit("stop_typing", { sender_id: currentUserId, receiver_id: otherUserId });
  };

  // Handle message expansion
  const toggleMessageExpansion = (messageId) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Check if message should be truncated
  const shouldTruncateMessage = (message) => {
    // Strip HTML tags for length calculation
    const textContent = message.replace(/<[^>]*>/g, '');
    return textContent.length > 200; // Show "read more" after 200 characters
  };

  // Get truncated message text
  const getTruncatedMessage = (message) => {
    // Strip HTML tags for length calculation
    const textContent = message.replace(/<[^>]*>/g, '');
    if (textContent.length <= 200) return message;
    
    // Find the last complete word within 200 characters
    const truncatedText = textContent.substring(0, 200).split(' ').slice(0, -1).join(' ');
    
    // Find the position of this truncated text in the original HTML
    let currentPos = 0;
    let textPos = 0;
    let result = '';
    
    while (currentPos < message.length && textPos < truncatedText.length) {
      if (message[currentPos] === '<') {
        // Skip HTML tag
        while (currentPos < message.length && message[currentPos] !== '>') {
          result += message[currentPos];
          currentPos++;
        }
        if (currentPos < message.length) {
          result += message[currentPos];
          currentPos++;
        }
      } else {
        result += message[currentPos];
        textPos++;
        currentPos++;
      }
    }
    
    return result + '...';
  };

  if (!isOpen) return null;

  return (
    <div className="bid-messaging-overlay" onClick={onClose}>
      <div className="bid-messaging-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bid-messaging-header">
          <div className="bid-messaging-user-info">
            <img 
              src={profileImage || "/images/default.jpg"} 
              alt={businessName}
              className="bid-messaging-avatar"
            />
            <div className="bid-messaging-user-details">
              <h4 className="bid-messaging-business-name">{businessName}</h4>
              <p className="bid-messaging-bid-info">Bid: ${bid.bid_amount}</p>
            </div>
          </div>
          <button className="bid-messaging-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Messages */}
        <div className="bid-messaging-messages">
          {isLoading ? (
            <div className="bid-messaging-loading">
              <div className="loading-spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-bubble ${msg.senderId === currentUserId ? "sent" : "received"} ${!msg.seen && msg.senderId === currentUserId ? "unseen" : ""}`}
                >
                  {msg.type === 'image' ? (
                    <img
                      src={msg.message}
                      alt="Sent"
                      style={{ maxWidth: "200px", borderRadius: "8px", cursor: "pointer" }}
                    />
                  ) : msg.type === 'payment_request' ? (
                    (() => {
                      console.log('Rendering payment request message:', msg);
                      try {
                        const parsedMessage = typeof msg.message === 'string' ? JSON.parse(msg.message) : msg.message;
                        return (
                          <PaymentCard
                            amount={msg.payment_amount || parsedMessage.amount}
                            businessName={businessName}
                            stripeAccountId={msg.payment_data?.stripe_account_id || parsedMessage.paymentData?.stripe_account_id}
                            description={msg.payment_data?.description || parsedMessage.description}
                            lineItems={msg.payment_data?.lineItems || parsedMessage.paymentData?.lineItems}
                            subtotal={msg.payment_data?.subtotal || parsedMessage.paymentData?.subtotal}
                            tax={msg.payment_data?.tax || parsedMessage.paymentData?.tax}
                            taxRate={msg.payment_data?.taxRate || parsedMessage.paymentData?.taxRate}
                            paymentStatus={msg.payment_status}
                          />
                        );
                      } catch (error) {
                        console.error('Error parsing payment request message:', error, msg);
                        return <div>Error displaying payment request</div>;
                      }
                    })()
                  ) : (
                    <div>
                      {shouldTruncateMessage(msg.message) && !expandedMessages.has(msg.id) ? (
                        <div>
                          {msg.isVirtual || msg.message.includes('<p>') ? (
                            <div 
                              className="message-html-content"
                              dangerouslySetInnerHTML={{ __html: getTruncatedMessage(msg.message) }}
                            />
                          ) : (
                            formatMessageText(getTruncatedMessage(msg.message))
                          )}
                          <button 
                            className="read-more-btn"
                            onClick={() => toggleMessageExpansion(msg.id)}
                          >
                            Read more
                          </button>
                        </div>
                      ) : (
                        <div>
                          {msg.isVirtual || msg.message.includes('<p>') ? (
                            <div 
                              className="message-html-content"
                              dangerouslySetInnerHTML={{ __html: msg.message }}
                            />
                          ) : (
                            formatMessageText(msg.message)
                          )}
                          {shouldTruncateMessage(msg.message) && expandedMessages.has(msg.id) && (
                            <button 
                              className="read-less-btn"
                              onClick={() => toggleMessageExpansion(msg.id)}
                            >
                              Show less
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'America/Denver'
                    })}
                    {msg.senderId === currentUserId && !msg.isVirtual && (
                      <span className="seen-indicator">
                        {msg.seen ? "✓✓" : "✓"}
                      </span>
                    )}
                    {msg.isVirtual && (
                      <span className="virtual-indicator">Original Bid</span>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="typing-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="chat-footer">
          <div className="chat-upload-container">
            <label htmlFor="file-upload" className="chat-upload-btn">
              <span>＋</span>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
            </label>
            {(() => {
              console.log('Payment button visibility check:', { 
                isCurrentUserBusiness, 
                stripeAccountId, 
                shouldShow: isCurrentUserBusiness && stripeAccountId 
              });
              return isCurrentUserBusiness && stripeAccountId ? (
                <button 
                  className="chat-payment-btn"
                  onClick={() => setShowPaymentModal(true)}
                  title="Send Payment Request"
                >
                  <FaCreditCard />
                </button>
              ) : null;
            })()}
          </div>

          <div className="chat-input-wrapper">
            {previewImageUrl && (
              <div className="inline-image-preview">
                <img src={previewImageUrl} alt="Preview" />
                <button className="inline-remove-button" onClick={() => {
                  setPreviewImageUrl(null);
                  setPendingFile(null);
                }}>×</button>
              </div>
            )}
            <input
              className="chat-input"
              type="text"
              placeholder="Add a message…"
              value={newMessage}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
          </div>

          <button className="chat-send-btn" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>

      {/* Payment Request Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-header">
              <h3>Send Payment Request</h3>
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
                  {modalLineItems.map((item) => (
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
                            disabled={modalLineItems.length === 1}
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
                    value={modalTaxRate}
                    onChange={(e) => setModalTaxRate(parseFloat(e.target.value) || 0)}
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
                {modalTaxRate > 0 && (
                  <div className="summary-row">
                    <span>Tax ({modalTaxRate}%):</span>
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
                onClick={() => {
                  const total = calculateTotal();
                  if (total <= 0) {
                    alert('Please add at least one line item with a valid amount');
                    return;
                  }

                  handleSendPaymentRequest({
                    amount: total,
                    description: 'Service Payment',
                    paymentData: {
                      amount: total,
                      stripe_account_id: stripeAccountId,
                      payment_type: 'custom',
                      business_name: businessName,
                      description: 'Service Payment',
                      lineItems: modalLineItems.filter(item => item.amount > 0),
                      subtotal: calculateSubtotal(),
                      tax: calculateTax(),
                      taxRate: modalTaxRate
                    }
                  });
                }}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidMessaging; 