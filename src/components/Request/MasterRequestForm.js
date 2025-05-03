import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { v4 as uuidv4 } from 'uuid';
import { saveFormData, loadFormData, clearFormData } from '../../utils/localStorage';

function MasterRequestForm({ formData, setFormData, onNext }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hairAndMakeupSubStep, setHairAndMakeupSubStep] = useState(0);
  const [photographySubStep, setPhotographySubStep] = useState(0);
  const [videographySubStep, setVideographySubStep] = useState(0);
  const [cateringSubStep, setCateringSubStep] = useState(0);
  const [djSubStep, setDjSubStep] = useState(0);
  const [floristSubStep, setFloristSubStep] = useState(0);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedData = loadFormData();
    if (savedData) {
      setFormData(prev => ({
        ...prev,
        ...savedData
      }));
    }
  }, [setFormData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        commonDetails: {
          ...prev.commonDetails,
          [field]: value,
        },
      };
      
      // Save to localStorage whenever data changes
      saveFormData(newData);
      
      return newData;
    });
  };

  const handleSubmit = async () => {
    try {
      // Get user authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsModalOpen(true);
        return;
      }

      // Process each request type
      for (const [category, request] of Object.entries(formData.requests)) {
        if (!request) continue;

        // Create request data
        const requestData = {
          user_id: user.id,
          category: category,
          status: 'pending',
          ...request
        };

        // Insert request into database
        const { data: newRequest, error: requestError } = await supabase
          .from('requests')
          .insert([requestData])
          .select()
          .single();

        if (requestError) throw requestError;

        // Handle photo uploads if any
        if (request.photos && request.photos.length > 0) {
          const uploadPromises = request.photos.map(async (photo) => {
            const fileExt = photo.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `${user.id}/${newRequest.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('request-media')
              .upload(filePath, photo.file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('request-media')
              .getPublicUrl(filePath);

            // Store photo information in appropriate table based on category
            const photoTable = category === 'Florist' ? 'florist_photos' : 'event_photos';
            return supabase
              .from(photoTable)
              .insert([{
                request_id: newRequest.id,
                user_id: user.id,
                photo_url: publicUrl,
                file_path: filePath
              }]);
          });

          await Promise.all(uploadPromises);
        }
      }

      // Clear form data after successful submission
      clearFormData();
      onNext();

    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit form. Please try again.');
    }
  };

  // Helper function to check request type case-insensitively
  const isRequestType = (request, type) => {
    if (type === "DJ") {
      return request?.toLowerCase().includes("dj");
    }
    return request?.toLowerCase() === type.toLowerCase();
  };

  const validateLogisticsForm = () => {
    const requiredFields = [];
    const { commonDetails } = formData;

    // Validate required logistics fields
    if (!commonDetails.eventType) requiredFields.push("Event Type");
    if (!commonDetails.location) requiredFields.push("Location");
    if (!commonDetails.numGuests) requiredFields.push("Number of Guests");
    if (commonDetails.dateFlexibility === "specific" && !commonDetails.startDate) {
      requiredFields.push("Event Date");
    }
    if (commonDetails.dateFlexibility === "range" && (!commonDetails.startDate || !commonDetails.endDate)) {
      requiredFields.push("Date Range");
    }
    if (commonDetails.dateFlexibility === "flexible" && !commonDetails.dateTimeframe) {
      requiredFields.push("Preferred Timeframe");
    }

    return requiredFields.length === 0;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // Validate event logistics form
      if (!validateLogisticsForm()) {
        return;
      }
      setCurrentStep(1);
    } else {
      const currentRequest = formData.selectedRequests[currentStep - 1];
      
      if (isRequestType(currentRequest, "HairAndMakeup")) {
        const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
        if (serviceType === 'hair' && hairAndMakeupSubStep === 1) {
          setHairAndMakeupSubStep(hairAndMakeupSubStep + 2);
        } else if (serviceType === 'makeup' && hairAndMakeupSubStep === 0) {
          setHairAndMakeupSubStep(hairAndMakeupSubStep + 2);
        } else {
          setHairAndMakeupSubStep(hairAndMakeupSubStep + 1);
        }
      } else if (isRequestType(currentRequest, "Photography")) {
        setPhotographySubStep(photographySubStep + 1);
      } else if (isRequestType(currentRequest, "Videography")) {
        setVideographySubStep(videographySubStep + 1);
      } else if (isRequestType(currentRequest, "Catering")) {
        if (cateringSubStep < 2) {
          setCateringSubStep(cateringSubStep + 1);
        } else {
          setCateringSubStep(0);
          setCurrentStep(currentStep + 1);
        }
      } else if (isRequestType(currentRequest, "DJ")) {
        setDjSubStep(djSubStep + 1);
      } else if (isRequestType(currentRequest, "Florist")) {
        setFloristSubStep(floristSubStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      return;
    }
    
    const currentRequest = formData.selectedRequests[currentStep - 1];
    
    if (isRequestType(currentRequest, "HairAndMakeup")) {
      const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
      if (serviceType === 'hair' && hairAndMakeupSubStep === 3) {
        setHairAndMakeupSubStep(hairAndMakeupSubStep - 2);
      } else if (serviceType === 'makeup' && hairAndMakeupSubStep === 2) {
        setHairAndMakeupSubStep(hairAndMakeupSubStep - 2);
      } else {
        setHairAndMakeupSubStep(hairAndMakeupSubStep - 1);
      }
    } else if (isRequestType(currentRequest, "Photography")) {
      setPhotographySubStep(photographySubStep - 1);
    } else if (isRequestType(currentRequest, "Videography")) {
      setVideographySubStep(videographySubStep - 1);
    } else if (isRequestType(currentRequest, "Catering")) {
      if (cateringSubStep > 0) {
        setCateringSubStep(cateringSubStep - 1);
      } else {
        setCurrentStep(currentStep - 1);
        setCateringSubStep(2);
      }
    } else if (isRequestType(currentRequest, "DJ")) {
      setDjSubStep(djSubStep - 1);
    } else if (isRequestType(currentRequest, "Florist")) {
      setFloristSubStep(floristSubStep - 1);
    }
  };

  return (
    <div className="form-grid">
      {/* Event Type */}
      <div className="custom-input-container required">
        <select
          name="eventType"
          value={formData.commonDetails.eventType || ""}
          onChange={(e) => handleInputChange("eventType", e.target.value)}
          className="custom-input"
        >
          <option value="">Select Event Type</option>
          <option value="Wedding">Wedding</option>
          <option value="Corporate Event">Corporate Event</option>
          <option value="Birthday">Birthday</option>
          <option value="Engagement">Engagement</option>
          <option value="Prom">Prom</option>
          <option value="School Event">School Event</option>
          <option value="Photo Shoot">Photo Shoot</option>
          <option value="Religious Ceremony">Religious Ceremony</option>
          <option value="Quinceñera">Quinceñera</option>
          <option value="Club Event">Club Event</option>
          <option value="Private Party">Private Party</option>
          <option value="Other">Other</option>
        </select>
        <label htmlFor="eventType" className="custom-label">
          Event Type
        </label>
      </div>

      {/* Location */}
      <div className="custom-input-container required">
        <input
          type="text"
          placeholder="Location (City, Venue, etc.)"
          value={formData.commonDetails.location || ""}
          onChange={(e) => handleInputChange("location", e.target.value)}
          className="custom-input"
        />
        <label htmlFor="location" className="custom-label">
          Location
        </label>
      </div>

      {/* Number of Guests */}
      <div className="custom-input-container required">
        <input
          type="number"
          placeholder="Number of Guests"
          value={formData.commonDetails.numGuests || ""}
          onChange={(e) => handleInputChange("numGuests", e.target.value)}
          className="custom-input"
          min="1"
        />
        <label htmlFor="numGuests" className="custom-label">
          Number of Guests
        </label>
      </div>

      {/* Date Flexibility */}
      <div className="custom-input-container required">
        <select
          name="dateFlexibility"
          value={formData.commonDetails.dateFlexibility || ""}
          onChange={(e) => handleInputChange("dateFlexibility", e.target.value)}
          className="custom-input"
        >
          <option value="">Select</option>
          <option value="specific">Specific Date</option>
          <option value="range">Date Range</option>
          <option value="flexible">I'm Flexible</option>
        </select>
        <label htmlFor="dateFlexibility" className="custom-label">
          Date Flexibility
        </label>
      </div>

      {/* Specific Date */}
      {formData.commonDetails.dateFlexibility === "specific" && (
        <div className="custom-input-container">
          <input
            type="date"
            name="startDate"
            value={formData.commonDetails.startDate || ""}
            onChange={(e) => handleInputChange("startDate", e.target.value)}
            className="custom-input"
          />
          <label htmlFor="startDate" className="custom-label">
            Event Date
          </label>
        </div>
      )}

      {/* Date Range */}
      {formData.commonDetails.dateFlexibility === "range" && (
        <>
          <div className="custom-input-container">
            <input
              type="date"
              name="startDate"
              value={formData.commonDetails.startDate || ""}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              className="custom-input"
            />
            <label htmlFor="startDate" className="custom-label">
              Earliest Date
            </label>
          </div>

          <div className="custom-input-container">
            <input
              type="date"
              name="endDate"
              value={formData.commonDetails.endDate || ""}
              onChange={(e) => handleInputChange("endDate", e.target.value)}
              className="custom-input"
            />
            <label htmlFor="endDate" className="custom-label">
              Latest Date
            </label>
          </div>
        </>
      )}

      {/* Flexible Timeframe */}
      {formData.commonDetails.dateFlexibility === "flexible" && (
        <div className="custom-input-container">
          <select
            name="dateTimeframe"
            value={formData.commonDetails.dateTimeframe || ""}
            onChange={(e) => handleInputChange("dateTimeframe", e.target.value)}
            className="custom-input"
          >
            <option value="">Select Timeframe</option>
            <option value="3months">Within 3 months</option>
            <option value="6months">Within 6 months</option>
            <option value="1year">Within 1 year</option>
            <option value="more">More than 1 year</option>
          </select>
          <label htmlFor="dateTimeframe" className="custom-label">
            Preferred Timeframe
          </label>
        </div>
      )}

      {/* Event Time */}
      <div className="start-end-time">
        <div className="custom-input-container">
          <div className="input-with-unknown">
            <input
              type="time"
              name="startTime"
              value={formData.commonDetails.startTime || ""}
              onChange={(e) => handleInputChange("startTime", e.target.value)}
              className="custom-input"
              disabled={formData.commonDetails.startTimeUnknown}
            />
            <label className="unknown-checkbox-container">
              <input
                type="checkbox"
                checked={formData.commonDetails.startTimeUnknown || false}
                onChange={(e) =>
                  handleInputChange("startTimeUnknown", e.target.checked)
                }
              />
              <span className="unknown-checkbox-label">Not sure</span>
            </label>
          </div>
          <label htmlFor="startTime" className="custom-label">
            Start Time
          </label>
        </div>

        <div className="custom-input-container">
          <div className="input-with-unknown">
            <input
              type="time"
              name="endTime"
              value={formData.commonDetails.endTime || ""}
              onChange={(e) => handleInputChange("endTime", e.target.value)}
              className="custom-input"
              disabled={formData.commonDetails.endTimeUnknown}
            />
            <label className="unknown-checkbox-container">
              <input
                type="checkbox"
                checked={formData.commonDetails.endTimeUnknown || false}
                onChange={(e) =>
                  handleInputChange("endTimeUnknown", e.target.checked)
                }
              />
              <span className="unknown-checkbox-label">Not sure</span>
            </label>
          </div>
          <label htmlFor="endTime" className="custom-label">
            End Time
          </label>
        </div>
      </div>

      {/* Indoor/Outdoor */}
      <div className="custom-input-container">
        <select
          name="indoorOutdoor"
          value={formData.commonDetails.indoorOutdoor || ""}
          onChange={(e) => handleInputChange("indoorOutdoor", e.target.value)}
          className="custom-input"
        >
          <option value="">Select</option>
          <option value="indoor">Indoor</option>
          <option value="outdoor">Outdoor</option>
          <option value="both">Both</option>
        </select>
        <label htmlFor="indoorOutdoor" className="custom-label">
          Indoor or Outdoor
        </label>
      </div>
    </div>
  );
}

export default MasterRequestForm;
