// Utility functions for timezone-aware date and time formatting

/**
 * Get the user's timezone from browser or default to 'America/Denver'
 */
export const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not detect timezone, defaulting to America/Denver:', error);
    return 'America/Denver';
  }
};

/**
 * Format a timestamp for display in the user's timezone
 * @param {string|Date} timestamp - ISO string or Date object
 * @param {string} format - 'time', 'date', 'datetime', or 'relative'
 * @returns {string} Formatted date/time string
 */
export const formatTimestamp = (timestamp, format = 'time') => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const userTimezone = getUserTimezone();
    
    // Check if date is today, yesterday, or older
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
    const isThisYear = date.getFullYear() === now.getFullYear();
    
    switch (format) {
      case 'time':
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: userTimezone
        });
        
      case 'date':
        if (isToday) {
          return 'Today';
        } else if (isYesterday) {
          return 'Yesterday';
        } else if (isThisYear) {
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: userTimezone
          });
        } else {
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: userTimezone
          });
        }
        
      case 'datetime':
        if (isToday) {
          return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: userTimezone
          });
        } else if (isYesterday) {
          return 'Yesterday ' + date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: userTimezone
          });
        } else if (isThisYear) {
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: userTimezone
          }) + ' ' + date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: userTimezone
          });
        } else {
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: userTimezone
          }) + ' ' + date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: userTimezone
          });
        }
        
      case 'relative':
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
          return 'Just now';
        } else if (diffInSeconds < 3600) {
          const minutes = Math.floor(diffInSeconds / 60);
          return `${minutes}m ago`;
        } else if (diffInSeconds < 86400) {
          const hours = Math.floor(diffInSeconds / 3600);
          return `${hours}h ago`;
        } else if (diffInSeconds < 604800) {
          const days = Math.floor(diffInSeconds / 86400);
          return `${days}d ago`;
        } else if (diffInSeconds < 2592000) {
          const weeks = Math.floor(diffInSeconds / 604800);
          return `${weeks}w ago`;
        } else {
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: isThisYear ? undefined : 'numeric',
            timeZone: userTimezone
          });
        }
        
      default:
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: userTimezone
        });
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
};

/**
 * Check if a timestamp is from today
 */
export const isToday = (timestamp) => {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const now = new Date();
  return date.toDateString() === now.toDateString();
};

/**
 * Check if a timestamp is from yesterday
 */
export const isYesterday = (timestamp) => {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return date.toDateString() === yesterday.toDateString();
};
