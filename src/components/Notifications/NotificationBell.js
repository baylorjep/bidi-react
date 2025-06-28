import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabaseClient';
import '../../styles/Notifications.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unviewedBids, setUnviewedBids] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnviewedBids();

    // Subscribe to new notifications
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, payload => {
          setNotifications(prev => [payload.new, ...prev]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, []);

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

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data || []);
    }
  };

  const fetchUnviewedBids = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Get all request IDs for this user from all request tables
      const requestTables = [
        'photography_requests',
        'videography_requests', 
        'catering_requests',
        'dj_requests',
        'florist_requests',
        'beauty_requests',
        'wedding_planning_requests'
      ];

      let allRequestIds = [];
      
      // Query each request table to get IDs for this user
      for (const table of requestTables) {
        let query = supabase.from(table).select('id, event_type');
        
        // Handle different user ID column names
        if (table === 'photography_requests') {
          query = query.eq('profile_id', user.id);
        } else {
          query = query.eq('user_id', user.id);
        }

        const { data: requests, error } = await query;

        if (error) {
          console.error(`Error fetching from ${table}:`, error);
          continue;
        }

        if (requests && requests.length > 0) {
          allRequestIds.push(...requests.map(req => ({ id: req.id, table, event_type: req.event_type })));
        }
      }

      if (allRequestIds.length === 0) {
        setUnviewedBids([]);
        return;
      }

      // Get bids for all these request IDs
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select(`
          *,
          business_profiles (
            id,
            business_name,
            membership_tier,
            google_calendar_connected
          )
        `)
        .in('request_id', allRequestIds.map(req => req.id))
        .order('created_at', { ascending: false });

      if (bidsError) {
        console.error('Error fetching bids:', bidsError);
        return;
      }
      
      // Filter to only unviewed bids using the viewed field from database
      const unviewed = (bidsData || []).filter(bid => !bid.viewed);
      setUnviewedBids(unviewed);
    } catch (error) {
      console.error('Error fetching unviewed bids:', error);
    }
  };

  const markBidAsViewed = async (bidId) => {
    try {
      // Update the bid as viewed in the database
      const { error } = await supabase
        .from('bids')
        .update({ 
          viewed: true,
          viewed_at: new Date().toISOString()
        })
        .eq('id', bidId);

      if (error) {
        console.error('Error marking bid as viewed:', error);
        return;
      }

      // Update local state
      setUnviewedBids(prev => prev.filter(bid => bid.id !== bidId));
    } catch (error) {
      console.error('Error marking bid as viewed:', error);
    }
  };

  const markAllBidsAsViewed = async () => {
    if (unviewedBids.length === 0) return;

    try {
      // Update all unviewed bids as viewed in the database
      const { error } = await supabase
        .from('bids')
        .update({ 
          viewed: true,
          viewed_at: new Date().toISOString()
        })
        .in('id', unviewedBids.map(bid => bid.id));

      if (error) {
        console.error('Error marking all bids as viewed:', error);
        return;
      }

      // Update local state
      setUnviewedBids([]);
    } catch (error) {
      console.error('Error marking all bids as viewed:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    } else {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.read)
      .map(n => n.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    } else {
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    }
  };

  const clearAllNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const notificationIds = notifications.map(n => n.id);
    
    if (notificationIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds);

    if (error) {
      console.error('Error clearing notifications:', error);
    } else {
      setNotifications([]);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_request':
        return 'fa-bell';
      case 'setup_reminder':
        return 'fa-exclamation-circle';
      case 'bid_response':
        return 'fa-comment';
      default:
        return 'fa-bell';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalNotificationCount = unreadCount + unviewedBids.length;

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <i className="fas fa-bell"></i>
        {totalNotificationCount > 0 && (
          <span className="notification-badge">{totalNotificationCount}</span>
        )}
      </button>

      {showDropdown && (
        createPortal(
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              <div className="notification-actions">
                {(unreadCount > 0 || unviewedBids.length > 0) && (
                  <button className="mark-all-read" onClick={() => {
                    markAllAsRead();
                    markAllBidsAsViewed();
                  }}>
                    Mark all as read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button className="clear-all-notifications" onClick={clearAllNotifications}>
                    Clear all
                  </button>
                )}
              </div>
            </div>
            <div className="notification-list">
              {/* Unviewed Bids */}
              {unviewedBids.length > 0 && (
                <>
                  <div className="notification-section-header">
                    <h4>New Bids ({unviewedBids.length})</h4>
                  </div>
                  {unviewedBids.map(bid => (
                    <div
                      key={`bid-${bid.id}`}
                      className="notification-item unread bid-notification"
                      onClick={() => markBidAsViewed(bid.id)}
                    >
                      <i className="fas fa-gavel"></i>
                      <div className="notification-content">
                        <p>New bid from {bid.business_profiles?.business_name} - ${bid.bid_amount}</p>
                        <small>
                          {new Date(bid.created_at).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Regular Notifications */}
              {notifications.length > 0 && (
                <>
                  {unviewedBids.length > 0 && (
                    <div className="notification-section-header">
                      <h4>Other Notifications</h4>
                    </div>
                  )}
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
                      <div className="notification-content">
                        <p>{notification.message}</p>
                        <small>
                          {new Date(notification.created_at).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* No notifications */}
              {notifications.length === 0 && unviewedBids.length === 0 && (
                <div className="no-notifications">
                  No notifications yet
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
};

export default NotificationBell; 