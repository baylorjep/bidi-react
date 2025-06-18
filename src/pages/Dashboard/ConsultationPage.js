import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConsultation } from '../../hooks/useConsultation';
import ConsultationModal from '../../components/Consultation/ConsultationModal';
import { toast } from 'react-toastify';
import { supabase } from '../../supabaseClient';

const ConsultationPage = ({ businessId, businessName, bidId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  
  const {
    selectedDate,
    selectedTimeSlot,
    availableTimeSlots,
    isLoading,
    error,
    handleDateSelect,
    handleTimeSlotSelect,
    fetchTimeSlots,
    scheduleConsultation
  } = useConsultation();

  const handleSchedule = async (data) => {
    try {
      // Get current user information
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user profile information
      const { data: profile, error: profileError } = await supabase
        .from('individual_profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to get user profile');
      }

      const customerName = `${profile.first_name} ${profile.last_name}`.trim();
      const customerEmail = user.email;

      await scheduleConsultation({
        businessId,
        bidId,
        startTime: data.selectedTimeSlot,
        customerEmail,
        customerName
      });
      
      toast.success('Consultation scheduled successfully!');
      setIsModalOpen(false);
      // Navigate to the consultations list or dashboard
      navigate('/dashboard/consultations');
    } catch (error) {
      toast.error('Failed to schedule consultation. Please try again.');
      console.error('Scheduling error:', error);
    }
  };

  return (
    <div>
      <button
        className="btn-primary"
        onClick={() => setIsModalOpen(true)}
      >
        Schedule Consultation
      </button>
      
      <ConsultationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSchedule={handleSchedule}
        businessName={businessName}
        businessId={businessId}
        bidId={bidId}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
        availableTimeSlots={availableTimeSlots}
        isLoading={isLoading}
        error={error}
        onDateSelect={handleDateSelect}
        onTimeSlotSelect={handleTimeSlotSelect}
        onFetchTimeSlots={fetchTimeSlots}
      />
    </div>
  );
};

export default ConsultationPage;
