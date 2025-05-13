import { useState } from 'react';
import { consultationService } from '../services/consultationService';

export const useConsultation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  const fetchAvailableTimeSlots = async (businessId, date) => {
    try {
      setIsLoading(true);
      setError(null);
      const slots = await consultationService.getAvailableTimeSlots(businessId, date);
      setAvailableTimeSlots(slots);
      setSelectedDate(date);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleConsultation = async ({ businessId, bidId }) => {
    if (!selectedDate || !selectedTimeSlot) {
      setError('Please select a date and time slot');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await consultationService.scheduleConsultation({
        businessId,
        bidId,
        startTime: selectedTimeSlot
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    selectedDate,
    selectedTimeSlot,
    availableTimeSlots,
    setSelectedDate,
    setSelectedTimeSlot,
    fetchAvailableTimeSlots,
    scheduleConsultation
  };
}; 