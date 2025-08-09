import React, { useState } from 'react';
import { FiX, FiCalendar, FiDollarSign, FiMapPin, FiMessageSquare } from 'react-icons/fi';
import { colors } from '../../config/theme';

const RequestModal = ({ isOpen, onClose, selectedVendors }) => {
  const [formData, setFormData] = useState({
    eventDate: '',
    location: '',
    budget: '',
    details: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categories: selectedVendors,
          ...formData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      onClose();
    } catch (error) {
      console.error('Error submitting request:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50">
      <div className="tw-bg-white tw-rounded-lg tw-p-6 tw-w-full tw-max-w-md tw-relative">
        <button
          onClick={onClose}
          className="tw-absolute tw-right-4 tw-top-4 tw-text-gray-500 hover:tw-text-gray-700"
        >
          <FiX size={24} />
        </button>

        <h2 className="tw-text-2xl tw-font-bold tw-mb-6" style={{ color: colors.gray[800] }}>
          New Request
        </h2>

        <form onSubmit={handleSubmit} className="tw-space-y-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1" style={{ color: colors.gray[700] }}>
              Selected Categories
            </label>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {selectedVendors.map(vendor => (
                <span 
                  key={vendor}
                  className="tw-px-3 tw-py-1 tw-rounded-full tw-text-sm"
                  style={{ 
                    backgroundColor: colors.primary,
                    color: colors.white
                  }}
                >
                  {vendor}
                </span>
              ))}
            </div>
          </div>

          <div className="tw-relative">
            <FiCalendar className="tw-absolute tw-left-3 tw-top-3 tw-text-gray-400" />
            <input
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
              className="tw-pl-10 tw-w-full tw-p-2 tw-border tw-rounded-lg focus:tw-outline-none focus:tw-ring-2"
              style={{ borderColor: colors.gray[300] }}
              required
            />
          </div>

          <div className="tw-relative">
            <FiMapPin className="tw-absolute tw-left-3 tw-top-3 tw-text-gray-400" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="Location"
              className="tw-pl-10 tw-w-full tw-p-2 tw-border tw-rounded-lg focus:tw-outline-none focus:tw-ring-2"
              style={{ borderColor: colors.gray[300] }}
              required
            />
          </div>

          <div className="tw-relative">
            <FiDollarSign className="tw-absolute tw-left-3 tw-top-3 tw-text-gray-400" />
            <input
              type="text"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              placeholder="Budget"
              className="tw-pl-10 tw-w-full tw-p-2 tw-border tw-rounded-lg focus:tw-outline-none focus:tw-ring-2"
              style={{ borderColor: colors.gray[300] }}
              required
            />
          </div>

          <div className="tw-relative">
            <FiMessageSquare className="tw-absolute tw-left-3 tw-top-3 tw-text-gray-400" />
            <textarea
              value={formData.details}
              onChange={(e) => setFormData({...formData, details: e.target.value})}
              placeholder="Additional details"
              className="tw-pl-10 tw-w-full tw-p-2 tw-border tw-rounded-lg focus:tw-outline-none focus:tw-ring-2"
              style={{ borderColor: colors.gray[300] }}
              rows={4}
              required
            />
          </div>

          <button
            type="submit"
            className="tw-w-full tw-py-2 tw-px-4 tw-rounded-lg tw-text-white tw-font-medium"
            style={{ backgroundColor: colors.primary }}
          >
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestModal;
