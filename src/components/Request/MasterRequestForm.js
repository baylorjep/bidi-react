import React, { useState } from "react";

function MasterRequestForm({ formData, setFormData, onNext }) {
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      commonDetails: {
        ...prev.commonDetails,
        [field]: value,
      },
    }));
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
