import axios from 'axios';

export const checkCalendarConnection = async (businessId) => {
  try {
    const API_URL = process.env.REACT_APP_API_URL || 'https://bidi-express.vercel.app';
    const response = await axios.get(`${API_URL}/api/business-profiles/${businessId}`);
    return response.data.google_calendar_connected || false;
  } catch (error) {
    console.error('Error checking calendar connection:', error);
    throw new Error('Failed to check calendar connection');
  }
};

export const fetchAvailableTimeSlots = async (businessId, date) => {
  try {
    // Ensure date is valid
    if (!(date instanceof Date) || isNaN(date)) {
      throw new Error('Invalid date provided');
    }    // Format date as YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];
    const API_URL = process.env.REACT_APP_API_URL || 'https://bidi-express.vercel.app';
    console.log('Fetching time slots for:', { businessId, date: formattedDate, API_URL });
    const response = await axios.get(`${API_URL}/api/calendar/availability?businessId=${businessId}&date=${formattedDate}`);    console.log('API Response:', response.data);
    
    // Handle both 'slots' and 'events' keys for backwards compatibility
    if (response.data) {
      if (Array.isArray(response.data.slots)) {
        return response.data.slots;
      }
      if (Array.isArray(response.data.events)) {
        return response.data.events;
      }
    }
    
    console.error('Unexpected response format:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching time slots:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw new Error('Failed to fetch available time slots');
  }
};

export const createCalendarEvent = async (eventData) => {
  try {
    const API_URL = process.env.REACT_APP_API_URL || 'https://bidi-express.vercel.app';
    console.log('Creating calendar event with data:', {
      ...eventData,
      API_URL
    });

    // Add timeout and validate API URL
    if (!API_URL) {
      throw new Error('API URL is not configured');
    }

    const response = await axios.post(`${API_URL}/api/calendar/events`, eventData, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data) {
      throw new Error('No response data received');
    }

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    console.error('Error response:', error.response?.data);
    
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    }
    
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid request parameters');
    }
    
    if (error.response?.status === 401) {
      throw new Error('Calendar authorization expired. Please reconnect your Google Calendar.');
    }
    
    if (error.response?.status === 403) {
      throw new Error('Calendar access denied. Please check your calendar permissions.');
    }
    
    throw new Error('Failed to schedule consultation. Please try again later.');
  }
};

export const connectGoogleCalendar = (businessId) => {
  const API_URL = process.env.REACT_APP_API_URL || 'https://bidi-express.vercel.app';
  window.location.href = `${API_URL}/api/calendar/auth?businessId=${businessId}`;
};
