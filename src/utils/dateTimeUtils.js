// Utility functions for timezone-aware date and time formatting

/**
 * Get the user's timezone - always returns Mountain Standard Time (America/Denver)
 */
export const getUserTimezone = () => {
  return 'America/Denver';
};

/**
 * Format a timestamp for display in Mountain Standard Time (MST)
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
    
    // Check if date is today, yesterday, or older (in MST)
    const dateMST = date.toLocaleDateString('en-US', { timeZone: 'America/Denver' });
    const nowMST = now.toLocaleDateString('en-US', { timeZone: 'America/Denver' });
    const yesterdayMST = new Date(now.getTime() - 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { timeZone: 'America/Denver' });
    
    const isToday = dateMST === nowMST;
    const isYesterday = dateMST === yesterdayMST;
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
 * Check if a timestamp is from today (in MST)
 */
export const isToday = (timestamp) => {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const now = new Date();
  
  // Convert both dates to MST for comparison
  const dateMST = date.toLocaleDateString('en-US', { timeZone: 'America/Denver' });
  const nowMST = now.toLocaleDateString('en-US', { timeZone: 'America/Denver' });
  
  return dateMST === nowMST;
};

/**
 * Check if a timestamp is from yesterday (in MST)
 */
export const isYesterday = (timestamp) => {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Convert both dates to MST for comparison
  const dateMST = date.toLocaleDateString('en-US', { timeZone: 'America/Denver' });
  const yesterdayMST = yesterday.toLocaleDateString('en-US', { timeZone: 'America/Denver' });
  
  return dateMST === yesterdayMST;
};
