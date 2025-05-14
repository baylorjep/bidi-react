import { supabase } from '../supabaseClient';

export const googleCalendarService = {
  async connectCalendar(userId) {
    try {
      console.log('API URL:', process.env.REACT_APP_API_URL);
      
      // Fetch the OAuth URL from your backend
      const response = await fetch(`${process.env.REACT_APP_API_URL}/calendar/auth?businessId=${userId}`);
      
      // Check if the response is OK
      if (!response.ok) {
        console.error('Failed to fetch Google OAuth URL:', response.status, response.statusText);
        throw new Error('Failed to get Google OAuth URL');
      }

      // Parse the response as JSON
      const data = await response.json();
      if (!data.authUrl) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      // Redirect to the OAuth URL
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error in connectCalendar:', error);
      throw error;
    }
  },

  async disconnectCalendar(userId) {
    const { error } = await supabase
      .from('business_profiles')
      .update({ google_calendar_connected: false, google_calendar_token: null })
      .eq('id', userId);

    if (error) throw error;
  },

  async checkCalendarConnection(userId) {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('google_calendar_connected')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.google_calendar_connected || false;
  },

  async getAvailableTimeSlots(businessId, date) {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/calendar/availability?businessId=${businessId}&date=${date}`
    );
    if (!response.ok) throw new Error('Failed to fetch available time slots');
    return response.json();
  },

  async scheduleConsultation({ businessId, bidId, startTime }) {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/calendar/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, bidId, startTime }),
    });
    if (!response.ok) throw new Error('Failed to schedule consultation');
    return response.json();
  },
};