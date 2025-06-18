import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './ConsultationModal.css';

function ConsultationModal({ 
  isOpen, 
  onClose, 
  onSchedule, 
  businessName,
  businessId,
  bidId,
  isLoading,
  error,
  selectedDate,
  selectedTimeSlot,
  availableTimeSlots,
  onDateSelect,
  onTimeSlotSelect,
  onFetchTimeSlots,
  businessTimezone = null
}) {
  useEffect(() => {
    if (isOpen && selectedDate) {
      onFetchTimeSlots(businessId, selectedDate);
    }
  }, [selectedDate, businessId, onFetchTimeSlots, isOpen]);

  if (!isOpen) return null;

  const formatTimeSlot = (timeSlot) => {
    // Ensure we're working with a proper Date object
    const date = new Date(timeSlot);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', timeSlot);
      return 'Invalid time';
    }
    
    // Format in local timezone with explicit options
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  // Modal JSX
  const modalContent = (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Schedule Consultation</h3>
        <p>
          Schedule a video consultation with {businessName} to discuss your event details.
        </p>
        
        <div className="expectations-container">
          <h4>What to Expect</h4>
          <ul>
            <li>
              <i className="fas fa-video"></i>
              30-minute video consultation via Google Meet
            </li>
            <li>
              <i className="fas fa-clock"></i>
              Choose from available time slots
            </li>
            <li>
              <i className="fas fa-comments"></i>
              Discuss your event details and requirements
            </li>
          </ul>
          {businessTimezone && (
            <div className="timezone-info">
              <i className="fas fa-globe"></i>
              <small>Times shown in your local timezone. Business operates in {businessTimezone}.</small>
            </div>
          )}
        </div>

        <div className="scheduling-container">
          <div className="date-picker-container">
            <label>Select Date</label>            <DatePicker
              selected={selectedDate}
              onChange={(date) => onDateSelect(date)}
              minDate={new Date()}
              dateFormat="MMMM d, yyyy"
              placeholderText="Select a date"
              className="date-picker"
            />
          </div>

          {selectedDate && (
            <div className="time-slots-container">
              <label>Select Time</label>              {isLoading ? (
                <div className="loading">Loading available time slots...</div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : availableTimeSlots && availableTimeSlots.length > 0 ? (
                <div className="time-slots-grid">
                  {availableTimeSlots.map((slot) => {
                    const slotTime = new Date(slot);
                    return (
                      <button
                        key={slot}
                        className={`time-slot ${selectedTimeSlot === slot ? 'selected' : ''}`}
                        onClick={() => onTimeSlotSelect(slot)}
                      >
                        {formatTimeSlot(slotTime)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="no-slots">No available time slots for this date</div>
              )}
            </div>
          )}
        </div>

        <div className="modal-buttons">
          <button 
            className="btn-secondary-consultation"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="btn-primary-consultation"
            onClick={() => onSchedule({ selectedDate, selectedTimeSlot })}
            disabled={!selectedDate || !selectedTimeSlot || isLoading}
          >
            {isLoading ? 'Scheduling...' : 'Schedule Now'}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default ConsultationModal;