import { useState, useCallback } from 'react';
import { fetchAvailableTimeSlots, createCalendarEvent } from '../utils/calendarUtils';

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

  const scheduleConsultation = async ({ businessId, bidId, startTime }) => {
    setIsLoading(true);
    setError(null);
    try {
      const eventData = {
        businessId,
        bidId,
        startTime,
        duration: 30 // 30-minute consultation
      };
      const result = await createCalendarEvent(eventData);
      return result;
    } catch (err) {
      setError('Failed to schedule consultation');
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