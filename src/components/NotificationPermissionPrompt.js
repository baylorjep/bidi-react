import React, { useState, useEffect } from 'react';

const NotificationPermissionPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on mobile
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);

    // Show prompt on mobile if notification permission hasn't been determined
    if (mobileCheck && Notification.permission === 'default') {
      setShowPrompt(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted on mobile');
        setShowPrompt(false);
        // You can call subscribeToPush here if needed
      } else {
        console.log('Notification permission denied on mobile');
      }
    } catch (error) {
      console.log('Error requesting notification permission on mobile:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt || !isMobile) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      fontSize: '14px'
    }}>
      <div style={{ marginBottom: '12px' }}>
        <strong>Enable Notifications</strong>
      </div>
      <div style={{ marginBottom: '16px', color: '#6c757d' }}>
        Get notified about new bids and important updates.
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleEnableNotifications}
          style={{
            backgroundColor: '#9633eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          Enable
        </button>
        <button
          onClick={handleDismiss}
          style={{
            backgroundColor: 'transparent',
            color: '#6c757d',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
};

export default NotificationPermissionPrompt; 