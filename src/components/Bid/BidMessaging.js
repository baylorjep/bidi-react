import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { socket } from '../../socket';
import { formatMessageText } from '../../utils/formatMessageText';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
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
      if (
        (msg.senderId === otherUserId && msg.receiverId === currentUserId) ||
        (msg.senderId === currentUserId && msg.receiverId === otherUserId)
      ) {
        setMessages((prev) => {
          const exists = prev.some(m =>
            m.senderId === msg.senderId &&
            m.receiverId === msg.receiverId &&
            m.message === msg.message &&
            Math.abs(new Date(m.createdAt) - new Date(msg.createdAt)) < 1000
          );
          return exists ? prev : [...prev, msg];
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isTyping]);

  // Handle body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.trim()) {
      socket.emit("typing", { senderId: currentUserId, receiverId: otherUserId });
    } else {
      socket.emit("stop_typing", { senderId: currentUserId, receiverId: otherUserId });
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { senderId: currentUserId, receiverId: otherUserId });
    }, 1000);
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      senderId: currentUserId,
      receiverId: otherUserId,
      message: newMessage.trim(),
      type: 'text',
      seen: false,
      bid_id: bid.id, // Link to the bid
      is_bid_message: true
    };

    // Send via socket for real-time
    socket.emit("send_message", messageData);

    // Also save to database
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: currentUserId,
          receiver_id: otherUserId,
          message: newMessage.trim(),
          type: 'text',
          seen: false,
          bid_id: bid.id,
          is_bid_message: true
        }]);

      if (error) {
        console.error('Error saving message:', error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }

    setNewMessage('');
    socket.emit("stop_typing", { senderId: currentUserId, receiverId: otherUserId });
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
    <div className="bid-messaging-overlay">
      <div className="bid-messaging-container">
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
                      hour12: true
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
          <div className="chat-input-wrapper">
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
    </div>
  );
};

export default BidMessaging; 