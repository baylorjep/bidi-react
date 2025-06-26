import React, { useState, useEffect, useRef } from 'react';
import '../../styles/WeddingNotificationBell.css';

const WeddingNotificationBell = ({ notifications, onDismissNotification, onClearAllNotifications }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [swipeStart, setSwipeStart] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Touch event handlers for swipe-to-dismiss
  const handleTouchStart = (e, notificationId) => {
    setSwipeStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      notificationId
    });
    setSwipeOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!swipeStart) return;
    
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - swipeStart.x;
    
    // Only allow horizontal swipes
    if (Math.abs(deltaX) > 10) {
      e.preventDefault();
      setSwipeOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!swipeStart) return;
    
    // If swiped more than 100px to the left, dismiss the notification
    if (swipeOffset < -100) {
      onDismissNotification(swipeStart.notificationId);
    }
    
    setSwipeStart(null);
    setSwipeOffset(0);
  };

  // Close dropdown when pressing escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showDropdown) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showDropdown]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'celebration':
        return 'fa-birthday-cake';
      case 'warning':
        return 'fa-exclamation-triangle';
      case 'info':
        return 'fa-info-circle';
      default:
        return 'fa-bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'celebration':
        return '#f59e0b';
      case 'warning':
        return '#ef4444';
      case 'info':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="wedding-notification-bell" ref={dropdownRef}>
      <button
        className="wedding-notification-bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label={`${unreadCount} wedding notifications`}
        aria-expanded={showDropdown}
      >
        <i className="fas fa-bell" style={{ color: '#d84888' }}></i>
        {unreadCount > 0 && (
          <span className="wedding-notification-badge" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="wedding-notification-dropdown" role="dialog" aria-label="Wedding notifications">
          <div className="wedding-notification-header">
            <h3>Wedding Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="clear-all-notifications" 
                onClick={() => {
                  onClearAllNotifications();
                  setShowDropdown(false);
                }}
                aria-label="Clear all notifications"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="wedding-notification-list" ref={listRef}>
            {notifications.length > 0 ? (
              notifications.map(notification => {
                const isSwiping = swipeStart?.notificationId === notification.id;
                const transform = isSwiping ? `translateX(${swipeOffset}px)` : 'translateX(0)';
                const opacity = isSwiping && swipeOffset < -50 ? Math.max(0.3, 1 + swipeOffset / 100) : 1;
                
                return (
                  <div
                    key={notification.id}
                    className={`wedding-notification-item wedding-notification-${notification.type}`}
                    style={{
                      transform,
                      opacity,
                      transition: isSwiping ? 'none' : 'all 0.3s ease'
                    }}
                    onTouchStart={(e) => handleTouchStart(e, notification.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    role="button"
                    tabIndex={0}
                    aria-label={`${notification.title}: ${notification.message}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onDismissNotification(notification.id);
                      }
                    }}
                  >
                    <i 
                      className={`fas ${getNotificationIcon(notification.type)}`}
                      style={{ color: getNotificationColor(notification.type) }}
                      aria-hidden="true"
                    ></i>
                    <div className="wedding-notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                    </div>
                    <button 
                      className="wedding-notification-dismiss"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismissNotification(notification.id);
                      }}
                      aria-label={`Dismiss ${notification.title} notification`}
                    >
                      <i className="fas fa-times" aria-hidden="true"></i>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="no-wedding-notifications">
                <i className="fas fa-bell-slash" style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.5 }}></i>
                <p>No notifications at the moment</p>
                <small>We'll notify you about important wedding updates here</small>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeddingNotificationBell; 