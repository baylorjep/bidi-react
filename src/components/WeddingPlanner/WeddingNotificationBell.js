import React, { useState, useEffect, useRef } from 'react';
import '../../styles/WeddingNotificationBell.css';

const WeddingNotificationBell = ({ notifications, onDismissNotification }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
      >
        <i className="fas fa-bell" style={{ color: '#d84888' }}></i>
        {unreadCount > 0 && (
          <span className="wedding-notification-badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="wedding-notification-dropdown">
          <div className="wedding-notification-header">
            <h3>Wedding Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="clear-all-notifications" 
                onClick={() => {
                  notifications.forEach(notification => {
                    onDismissNotification(notification.id);
                  });
                  setShowDropdown(false);
                }}
              >
                Clear all
              </button>
            )}
          </div>
          <div className="wedding-notification-list">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`wedding-notification-item wedding-notification-${notification.type}`}
                >
                  <i 
                    className={`fas ${getNotificationIcon(notification.type)}`}
                    style={{ color: getNotificationColor(notification.type) }}
                  ></i>
                  <div className="wedding-notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                  </div>
                  <button 
                    className="wedding-notification-dismiss"
                    onClick={() => onDismissNotification(notification.id)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))
            ) : (
              <div className="no-wedding-notifications">
                No notifications at the moment
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeddingNotificationBell; 