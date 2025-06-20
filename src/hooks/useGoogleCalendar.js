import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { googleCalendarService } from '../services/googleCalendarService';

export const useGoogleCalendar = () => {
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [calendarError, setCalendarError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkCalendarConnection();
  }, []);

  const checkCalendarConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        throw new Error('No user found');
      }

      console.log('Checking calendar connection for user:', user.id);
      
      const { data, error } = await supabase
        .from('business_profiles')
        .select('google_calendar_connected')
        .eq('id', user.id)
        .single();

      console.log('Calendar connection data:', data);
      console.log('Calendar connection error:', error);

      if (error) throw error;
      
      const isConnected = data?.google_calendar_connected || false;
      console.log('Is calendar connected:', isConnected);
      
      setIsCalendarConnected(isConnected);
    } catch (error) {
      console.error('Error checking calendar connection:', error);
      setCalendarError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const connectCalendar = async () => {
    try {
      setCalendarError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log('Connecting calendar for user:', user.id);

      // Use the correct API endpoint
      const authUrl = `https://bidi-express.vercel.app/api/google-calendar/auth?businessId=${user.id}`;
      console.log('Redirecting to:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting calendar:', error);
      setCalendarError(error.message);
      throw error;
    }
  };

  const disconnectCalendar = async () => {
    try {
      setCalendarError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log('Disconnecting calendar for user:', user.id);
      
      const { error } = await supabase
        .from('business_profiles')
        .update({ 
          google_calendar_connected: false, 
          google_calendar_token: null,
          google_calendar_refresh_token: null 
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating database:', error);
        throw error;
      }

      setIsCalendarConnected(false);
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      setCalendarError(error.message);
      throw error;
    }
  };

  return {
    isCalendarConnected,
    calendarError,
    isLoading,
    connectCalendar,
    disconnectCalendar,
  };
};