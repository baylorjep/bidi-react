import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function RequestForm() {
  const [customerName, setCustomerName] = useState('');
  const [serviceTitle, setServiceTitle] = useState('');
  const [location, setLocation] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from('requests')
      .insert([
        {
          customer_name: customerName,
          service_title: serviceTitle,
          location: location,
          service_category: serviceCategory,
          service_description: serviceDescription,
          service_date: serviceDate,
          price_range: priceRange,
          additional_comments: additionalComments,
        },
      ]);

    if (error) {
      console.error('Error submitting request:', error.message);
    } else {
      console.log('Request submitted successfully:', data);
      // Optionally, clear the form fields after successful submission
      setCustomerName('');
      setServiceTitle('');
      setLocation('');
      setServiceCategory('');
      setServiceDescription('');
      setServiceDate('');
      setPriceRange('');
      setAdditionalComments('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-floating mb-3">
        <input
          type="text"
          className="form-control"
          id="customerName"
          name="customerName"
          placeholder="Enter your name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />
        <label htmlFor="customerName">Customer Name</label>
        <div className="invalid-feedback">Customer name is required.</div>
      </div>
      <div className="form-floating mb-3">
        <input
          type="text"
          className="form-control"
          id="serviceTitle"
          name="serviceTitle"
          placeholder="Enter service title"
          value={serviceTitle}
          onChange={(e) => setServiceTitle(e.target.value)}
          required
        />
        <label htmlFor="serviceTitle">Title of Service</label>
        <div className="invalid-feedback">Service title is required.</div>
      </div>
      <div className="form-floating mb-3">
        <input
          type="text"
          className="form-control"
          id="location"
          name="location"
          placeholder="Enter your location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        <label htmlFor="location">Your Location</label>
        <div className="invalid-feedback">A location is required.</div>
      </div>
      <div className="form-floating mb-3">
        <select
          className="form-control"
          id="serviceCategory"
          name="serviceCategory"
          value={serviceCategory}
          onChange={(e) => setServiceCategory(e.target.value)}
          required
        >
          <option value="">Select a category...</option>
          <option value="cleaning">Home Cleaning</option>
          <option value="photography">Photo Shoot</option>
          <option value="landscaping">Landscaping</option>
          <option value="plumbing">Plumbing</option>
          <option value="electrical">Electrical</option>
          <option value="moving">Moving</option>
          <option value="other">Other</option>
        </select>
        <label htmlFor="serviceCategory">Service Category</label>
        <div className="invalid-feedback">Service category is required.</div>
      </div>
      <div className="form-floating mb-3">
        <textarea
          className="form-control"
          id="serviceDescription"
          name="serviceDescription"
          placeholder="Enter a detailed description of the service"
          value={serviceDescription}
          onChange={(e) => setServiceDescription(e.target.value)}
          style={{ height: '10rem' }}
          required
        ></textarea>
        <label htmlFor="serviceDescription">Description of Service</label>
        <div className="invalid-feedback">Description is required.</div>
      </div>
      <div className="form-floating mb-3">
        <input
          type="date"
          className="form-control"
          id="serviceDate"
          name="serviceDate"
          placeholder="Select a date"
          value={serviceDate}
          onChange={(e) => setServiceDate(e.target.value)}
          required
        />
        <label htmlFor="serviceDate">Date of Service</label>
        <div className="invalid-feedback">Date of service is required.</div>
      </div>
      <div className="form-floating mb-3">
        <input
          type="text"
          className="form-control"
          id="priceRange"
          name="priceRange"
          placeholder="Enter expected price range"
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          required
        />
        <label htmlFor="priceRange">Expected Price Range</label>
        <div className="invalid-feedback">Price range is required.</div>
      </div>
      <div className="form-floating mb-3">
        <textarea
          className="form-control"
          id="additionalComments"
          name="additionalComments"
          placeholder="Enter any additional comments"
          value={additionalComments}
          onChange={(e) => setAdditionalComments(e.target.value)}
          style={{ height: '5rem' }}
        ></textarea>
        <label htmlFor="additionalComments">
          Additional Comments (Optional)
        </label>
      </div>
      <div className="d-grid">
        <button type="submit" className="btn btn-secondary">
          Submit Request
        </button>
      </div>
    </form>
  );
}

export default RequestForm;
