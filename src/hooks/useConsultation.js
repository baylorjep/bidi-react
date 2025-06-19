import { useState, useCallback } from 'react';
import { fetchAvailableTimeSlots, createCalendarEvent, testBackendConnectivity } from '../utils/calendarUtils';

export const useConsultation = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleDateSelect = (date) => {
    console.log('Date selected:', date);
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setError(null);
  };

  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setError(null);
  };

  const fetchTimeSlots = useCallback(async (businessId, date) => {
    setIsLoading(true);
    setError(null);
    try {
      const slots = await fetchAvailableTimeSlots(businessId, date);
      setAvailableTimeSlots(slots);
    } catch (err) {
      setError('Failed to fetch available time slots');
      setAvailableTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scheduleConsultation = async ({ businessId, bidId, startTime, customerEmail, customerName }) => {
    console.log('scheduleConsultation called with:', { businessId, bidId, startTime, customerEmail, customerName });
    
    setIsLoading(true);
    setError(null);
    try {
      // Test backend connectivity first
      console.log('Testing backend connectivity...');
      const isConnected = await testBackendConnectivity();
      if (!isConnected) {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      console.log('Backend connectivity test passed');
      
      const eventData = {
        businessId,
        bidId,
        startTime,
        customerEmail,
        customerName
      };
      
      console.log('eventData being sent to createCalendarEvent:', eventData);
      
      const result = await createCalendarEvent(eventData);
      console.log('createCalendarEvent result:', result);
      return result;
    } catch (err) {
      console.error('Error in scheduleConsultation:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      const errorMessage = err.message || 'Failed to schedule consultation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    selectedDate,
    selectedTimeSlot,
    availableTimeSlots,
    isLoading,
    error,
    handleDateSelect,
    handleTimeSlotSelect,
    fetchTimeSlots,
    scheduleConsultation
  };
};