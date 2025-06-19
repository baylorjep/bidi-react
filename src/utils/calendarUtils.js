import axios from 'axios';

export const checkCalendarConnection = async (businessId) => {
  try {
    const API_URL = 'https://bidi-express.vercel.app';
    const response = await axios.get(`${API_URL}/api/business-profiles/${businessId}`);
    return response.data.google_calendar_connected || false;
  } catch (error) {
    console.error('Error checking calendar connection:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const getConsultationHours = async (businessId) => {
  try {
    const API_URL = 'https://bidi-express.vercel.app';
    const response = await axios.get(`${API_URL}/api/google-calendar/consultation-hours/${businessId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching consultation hours:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const updateConsultationHours = async (businessId, consultationHoursData) => {
  try {
    const API_URL = 'https://bidi-express.vercel.app';
    const response = await axios.put(`${API_URL}/api/google-calendar/consultation-hours/${businessId}`, consultationHoursData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating consultation hours:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const fetchAvailableTimeSlots = async (businessId, date) => {
  try {
    // Ensure date is valid
    if (!(date instanceof Date) || isNaN(date)) {
      throw new Error('Invalid date provided');
    }    // Format date as YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];
    const API_URL = 'https://bidi-express.vercel.app';
    console.log('Fetching time slots for:', { businessId, date: formattedDate, API_URL });
    const response = await axios.get(`${API_URL}/api/google-calendar/availability/${businessId}/${formattedDate}`);    console.log('API Response:', response.data);
    
    // Handle both 'slots' and 'events' keys for backwards compatibility
    if (response.data) {
      if (Array.isArray(response.data.events)) {
        return response.data.events;
      }
      if (Array.isArray(response.data.slots)) {
        return response.data.slots;
      }
    }
    
    console.error('Unexpected response format:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching time slots:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw new Error(getErrorMessage(error));
  }
};

export const createCalendarEvent = async (eventData) => {
  try {
    const API_URL = 'https://bidi-express.vercel.app';
    console.log('Creating calendar event with data:', {
      ...eventData,
      API_URL
    });
    console.log('Event data keys:', Object.keys(eventData));
    console.log('Event data values:', {
      businessId: eventData.businessId,
      bidId: eventData.bidId,
      startTime: eventData.startTime,
      duration: eventData.duration || 30,
      customerEmail: eventData.customerEmail,
      customerName: eventData.customerName
    });

    // Add timeout and validate API URL
    if (!API_URL) {
      throw new Error('API URL is not configured');
    }

    // Prepare the data in the format the backend expects
    const requestData = {
      businessId: eventData.businessId,
      bidId: eventData.bidId,
      startTime: eventData.startTime,
      duration: eventData.duration || 30,
      customerEmail: eventData.customerEmail,
      customerName: eventData.customerName
    };

    console.log('Sending request data to API:', requestData);
    console.log('Request data validation:', {
      hasBusinessId: !!requestData.businessId,
      hasStartTime: !!requestData.startTime,
      hasCustomerEmail: !!requestData.customerEmail,
      hasCustomerName: !!requestData.customerName,
      bidId: requestData.bidId
    });

    console.log('Request details:', {
      url: `${API_URL}/api/google-calendar/events`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(requestData)
    });

    // Add a timeout promise to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000);
    });

    const requestPromise = axios.post(`${API_URL}/api/google-calendar/events`, requestData, {
      timeout: 15000, // 15 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Race between the request and timeout
    const response = await Promise.race([requestPromise, timeoutPromise]);

    console.log('Response received:', response.status, response.data);

    if (!response.data) {
      throw new Error('No response data received');
    }

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error message:', error.message);
    
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    }
    
    if (error.message === 'Request timeout after 15 seconds') {
      throw new Error('Request timed out. The server is taking too long to respond. Please try again.');
    }
    
    if (error.response?.status === 400) {
      throw new Error(getErrorMessage(error));
    }
    
    if (error.response?.status === 401) {
      throw new Error('Calendar authorization expired. Please reconnect your Google Calendar.');
    }
    
    if (error.response?.status === 403) {
      throw new Error('Calendar access denied. Please check your calendar permissions.');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Calendar service not found. Please contact support.');
    }
    
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw new Error(getErrorMessage(error));
  }
};

export const connectGoogleCalendar = (businessId) => {
  const API_URL = 'https://bidi-express.vercel.app';
  window.location.href = `${API_URL}/api/google-calendar/auth?businessId=${businessId}`;
};

// Error handling utilities
const errorMessages = {
  'Missing required parameters': 'Please fill in all required fields',
  'Business not found': 'Business profile not available',
  'Invalid time format': 'Please use HH:MM format (e.g., 09:00)',
  'Invalid days': 'Please select at least one available day',
  'Calendar not connected': 'Business calendar is not connected',
  'No available slots': 'No available time slots for the selected date',
  'Network error': 'Unable to connect to the server. Please check your internet connection.',
  'Authentication error': 'Please log in again to continue',
  'Server error': 'Something went wrong. Please try again later.'
};

const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return errorMessages[error.response.data.message] || error.response.data.message;
  }
  if (error.message) {
    return errorMessages[error.message] || error.message;
  }
  return 'An unexpected error occurred';
};

// Add a function to test backend connectivity
export const testBackendConnectivity = async () => {
  try {
    const API_URL = 'https://bidi-express.vercel.app';
    console.log('Testing backend connectivity to:', API_URL);
    
    const response = await axios.get(`${API_URL}/api/health`, {
      timeout: 5000
    });
    
    console.log('Backend connectivity test successful:', response.status);
    return true;
  } catch (error) {
    console.error('Backend connectivity test failed:', error);
    return false;
  }
};