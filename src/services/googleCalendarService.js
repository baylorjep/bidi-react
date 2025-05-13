import { supabase } from '../supabaseClient';

export const googleCalendarService = {
  async connectCalendar(userId) {
    // Fetch the OAuth URL from your backend
    const response = await fetch(`${process.env.REACT_APP_API_URL}/calendar/auth?businessId=${userId}`);
    if (!response.ok) throw new Error('Failed to get Google OAuth URL');
    const { authUrl } = await response.json();
    window.location.href = authUrl;
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