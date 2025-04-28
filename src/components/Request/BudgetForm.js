import React, { useState, useEffect } from 'react';
import './BudgetForm.css';

const BudgetForm = ({ formData, setFormData, category }) => {
  const [priceQualityPreference, setPriceQualityPreference] = useState(50);
  const [budgetInsights, setBudgetInsights] = useState([]);
  const [recommendedBudget, setRecommendedBudget] = useState({ min: 0, max: 0 });

  useEffect(() => {
    updateBudgetInsights();
    calculateRecommendedBudget();
  }, [formData, category, priceQualityPreference]);

  const getBudgetRanges = () => {
    switch (category) {
      case 'photography':
      case 'videography':
        return [
          { min: 0, max: 500, value: '0-500', label: '$0 - $500' },
          { min: 500, max: 1000, value: '500-1000', label: '$500 - $1,000' },
          { min: 1000, max: 1500, value: '1000-1500', label: '$1,000 - $1,500' },
          { min: 1500, max: 2000, value: '1500-2000', label: '$1,500 - $2,000' },
          { min: 2000, max: 4000, value: '2000-4000', label: '$2,000 - $4,000' },
          { min: 4000, max: 6000, value: '4000-6000', label: '$4,000 - $6,000' },
          { min: 6000, max: 8000, value: '6000-8000', label: '$6,000 - $8,000' },
          { min: 8000, max: Infinity, value: '8000+', label: '$8,000+' }
        ];
      case 'catering':
        return [
          { min: 0, max: 1000, value: '0-1000', label: '$0 - $1,000' },
          { min: 1000, max: 2000, value: '1000-2000', label: '$1,000 - $2,000' },
          { min: 2000, max: 3000, value: '2000-3000', label: '$2,000 - $3,000' },
          { min: 3000, max: 4000, value: '3000-4000', label: '$3,000 - $4,000' },
          { min: 4000, max: 5000, value: '4000-5000', label: '$4,000 - $5,000' },
          { min: 5000, max: 6000, value: '5000-6000', label: '$5,000 - $6,000' },
          { min: 6000, max: 8000, value: '6000-8000', label: '$6,000 - $8,000' },
          { min: 8000, max: 10000, value: '8000-10000', label: '$8,000 - $10,000' },
          { min: 10000, max: Infinity, value: '10000+', label: '$10,000+' }
        ];
      case 'dj':
        return [
          { min: 0, max: 500, value: '0-500', label: '$0 - $500' },
          { min: 500, max: 1000, value: '500-1000', label: '$500 - $1,000' },
          { min: 1000, max: 1500, value: '1000-1500', label: '$1,000 - $1,500' },
          { min: 1500, max: 2000, value: '1500-2000', label: '$1,500 - $2,000' },
          { min: 2000, max: 2500, value: '2000-2500', label: '$2,000 - $2,500' },
          { min: 2500, max: 3000, value: '2500-3000', label: '$2,500 - $3,000' },
          { min: 3000, max: Infinity, value: '3000+', label: '$3,000+' }
        ];
      case 'florist':
        return [
          { min: 0, max: 500, value: '0-500', label: '$0 - $500' },
          { min: 500, max: 1000, value: '500-1000', label: '$500 - $1,000' },
          { min: 1000, max: 1500, value: '1000-1500', label: '$1,000 - $1,500' },
          { min: 1500, max: 2000, value: '1500-2000', label: '$1,500 - $2,000' },
          { min: 2000, max: 2500, value: '2000-2500', label: '$2,000 - $2,500' },
          { min: 2500, max: 3000, value: '2500-3000', label: '$2,500 - $3,000' },
          { min: 3000, max: 3500, value: '3000-3500', label: '$3,000 - $3,500' },
          { min: 3500, max: 4000, value: '3500-4000', label: '$3,500 - $4,000' },
          { min: 4000, max: Infinity, value: '4000+', label: '$4,000+' }
        ];
      case 'hairandmakeup':
        return [
          { min: 0, max: 300, value: '0-300', label: '$0 - $300' },
          { min: 300, max: 500, value: '300-500', label: '$300 - $500' },
          { min: 500, max: 750, value: '500-750', label: '$500 - $750' },
          { min: 750, max: 1000, value: '750-1000', label: '$750 - $1,000' },
          { min: 1000, max: 1500, value: '1000-1500', label: '$1,000 - $1,500' },
          { min: 1500, max: 2000, value: '1500-2000', label: '$1,500 - $2,000' },
          { min: 2000, max: Infinity, value: '2000+', label: '$2,000+' }
        ];
      default:
        return [
          { min: 0, max: 500, value: '0-500', label: '$0 - $500' },
          { min: 500, max: 1000, value: '500-1000', label: '$500 - $1,000' },
          { min: 1000, max: 1500, value: '1000-1500', label: '$1,000 - $1,500' },
          { min: 1500, max: 2000, value: '1500-2000', label: '$1,500 - $2,000' },
          { min: 2000, max: 3000, value: '2000-3000', label: '$2,000 - $3,000' },
          { min: 3000, max: 4000, value: '3000-4000', label: '$3,000 - $4,000' },
          { min: 4000, max: 5000, value: '4000-5000', label: '$4,000 - $5,000' },
          { min: 5000, max: Infinity, value: '5000+', label: '$5,000+' }
        ];
    }
  };

  const calculateRecommendedBudget = () => {
    let basePrice = 0;
    const requestData = formData.requests[category.charAt(0).toUpperCase() + category.slice(1)] || {};

    if (category === 'photography') {
      // Base price based on duration
      if (requestData.duration) {
        basePrice = requestData.duration * 200; // $200 per hour base rate
      }

      // Add for second photographer
      if (requestData.secondPhotographer === 'yes') {
        basePrice *= 1.5; // 50% increase for second photographer
      }

      // Add for wedding specific coverage
      if (formData.commonDetails.eventType === 'Wedding') {
        const weddingDetails = requestData.weddingDetails || {};
        const coveragePoints = Object.values(weddingDetails).filter(Boolean).length;
        basePrice += coveragePoints * 200; // $200 per coverage point
      }

      // Add for deliverables
      const deliverables = requestData.deliverables || {};
      if (deliverables.weddingAlbum) basePrice += 500;
      if (deliverables.rawFiles) basePrice += 300;
      if (deliverables.engagement) basePrice += 500;

    } else if (category === 'videography') {
      // Base price based on duration
      if (requestData.duration) {
        basePrice = requestData.duration * 300; // $300 per hour base rate
      }

      // Add for second videographer
      if (requestData.secondVideographer === 'yes') {
        basePrice *= 1.5; // 50% increase for second videographer
      }

      // Add for wedding specific coverage
      if (formData.commonDetails.eventType === 'Wedding') {
        const weddingDetails = requestData.weddingDetails || {};
        const coveragePoints = Object.values(weddingDetails).filter(Boolean).length;
        basePrice += coveragePoints * 300; // $300 per coverage point
      }

      // Add for deliverables
      const deliverables = requestData.deliverables || {};
      if (deliverables.highlightReel) basePrice += 800;
      if (deliverables.fullCeremony) basePrice += 500;
      if (deliverables.fullReception) basePrice += 500;
      if (deliverables.rawFootage) basePrice += 400;
      if (deliverables.droneFootage) basePrice += 600;
      if (deliverables.sameDayEdit) basePrice += 1000;
    }

    // Calculate range based on price quality preference
    const qualityMultiplier = 1 + (priceQualityPreference / 100);
    const minPrice = Math.round(basePrice * (qualityMultiplier - 0.2));
    const maxPrice = Math.round(basePrice * (qualityMultiplier + 0.2));

    setRecommendedBudget({ min: minPrice, max: maxPrice });

    // Update budget range based on calculated prices
    const ranges = getBudgetRanges();
    const matchingRange = ranges.find(range => 
      (minPrice >= range.min && minPrice < range.max) || 
      (maxPrice >= range.min && maxPrice < range.max)
    );

    if (matchingRange && formData.requests[category.charAt(0).toUpperCase() + category.slice(1)]?.priceRange !== matchingRange.value) {
      setFormData(prev => ({
        ...prev,
        requests: {
          ...prev.requests,
          [category.charAt(0).toUpperCase() + category.slice(1)]: {
            ...prev.requests[category.charAt(0).toUpperCase() + category.slice(1)],
            priceRange: matchingRange.value
          }
        }
      }));
    }
  };

  const updateBudgetInsights = () => {
    const insights = getBudgetInsights(formData.requests[category.charAt(0).toUpperCase() + category.slice(1)]?.priceRange, category);
    setBudgetInsights(insights);
  };

  const getBudgetInsights = (range, category) => {
    const insights = [];
    
    if (category === 'photography') {
      switch (range) {
        case 'under-2000':
          insights.push({
            icon: '⚠️',
            text: 'Limited options in this range. Consider increasing budget for better quality.',
            type: 'warning'
          });
          break;
        case '2000-4000':
          insights.push({
            icon: '📸',
            text: 'Good range for experienced photographers with basic packages.',
            type: 'info'
          });
          break;
        case '4000-6000':
          insights.push({
            icon: '📸',
            text: 'Premium range with experienced photographers and full coverage.',
            type: 'info'
          });
          break;
        case '6000-8000':
          insights.push({
            icon: '📸',
            text: 'Luxury range with top-tier photographers and extensive coverage.',
            type: 'info'
          });
          break;
        case '8000+':
          insights.push({
            icon: '📸',
            text: 'Elite range with renowned photographers and premium services.',
            type: 'info'
          });
          break;
        default:
          break;
      }
    } else if (category === 'videography') {
      switch (range) {
        case 'under-3000':
          insights.push({
            icon: '⚠️',
            text: 'Limited options in this range. Consider increasing budget for better quality.',
            type: 'warning'
          });
          break;
        case '3000-5000':
          insights.push({
            icon: '🎥',
            text: 'Good range for experienced videographers with basic packages.',
            type: 'info'
          });
          break;
        case '5000-7000':
          insights.push({
            icon: '🎥',
            text: 'Premium range with experienced videographers and full coverage.',
            type: 'info'
          });
          break;
        case '7000-9000':
          insights.push({
            icon: '🎥',
            text: 'Luxury range with top-tier videographers and extensive coverage.',
            type: 'info'
          });
          break;
        case '9000+':
          insights.push({
            icon: '🎥',
            text: 'Elite range with renowned videographers and premium services.',
            type: 'info'
          });
          break;
        default:
          break;
      }
    }

    return insights;
  };

  const getPriceQualityDescription = (value) => {
    if (value < 25) return 'Budget-friendly';
    if (value < 50) return 'Balanced';
    if (value < 75) return 'Premium';
    return 'Luxury';
  };

  const handlePriceQualityChange = (e) => {
    const value = parseInt(e.target.value);
    setPriceQualityPreference(value);
    setFormData({
      ...formData,
      priceQualityPreference: value
    });
  };

  const handleBudgetRangeChange = (e) => {
    setFormData(prev => ({
      ...prev,
      requests: {
        ...prev.requests,
        [category.charAt(0).toUpperCase() + category.slice(1)]: {
          ...prev.requests[category.charAt(0).toUpperCase() + category.slice(1)],
          priceRange: e.target.value
        }
      }
    }));
  };

  return (
    <div className="budget-form-container">
      <div className="budget-recommendation-container">
        <h3>Recommended Budget Range</h3>
        <div className="budget-amount">
          ${recommendedBudget.min.toLocaleString()} - ${recommendedBudget.max.toLocaleString()}
        </div>
        <p className="budget-explanation">
          This recommendation is based on:
          <ul>
            {category === 'photography' && (
              <>
                {formData.requests.Photography?.duration && (
                  <li>{formData.requests.Photography.duration} hours of coverage</li>
                )}
                {formData.requests.Photography?.secondPhotographer === 'yes' && (
                  <li>Second photographer</li>
                )}
                {formData.commonDetails.eventType === 'Wedding' && (
                  <li>Wedding coverage points</li>
                )}
                {formData.requests.Photography?.deliverables?.weddingAlbum && (
                  <li>Wedding album</li>
                )}
                {formData.requests.Photography?.deliverables?.rawFiles && (
                  <li>RAW files</li>
                )}
                {formData.requests.Photography?.deliverables?.engagement && (
                  <li>Engagement session</li>
                )}
              </>
            )}
            {category === 'videography' && (
              <>
                {formData.requests.Videography?.duration && (
                  <li>{formData.requests.Videography.duration} hours of coverage</li>
                )}
                {formData.requests.Videography?.secondVideographer === 'yes' && (
                  <li>Second videographer</li>
                )}
                {formData.commonDetails.eventType === 'Wedding' && (
                  <li>Wedding coverage points</li>
                )}
                {formData.requests.Videography?.deliverables?.highlightReel && (
                  <li>Highlight reel</li>
                )}
                {formData.requests.Videography?.deliverables?.fullCeremony && (
                  <li>Full ceremony</li>
                )}
                {formData.requests.Videography?.deliverables?.fullReception && (
                  <li>Full reception</li>
                )}
                {formData.requests.Videography?.deliverables?.rawFootage && (
                  <li>Raw footage</li>
                )}
                {formData.requests.Videography?.deliverables?.droneFootage && (
                  <li>Drone footage</li>
                )}
                {formData.requests.Videography?.deliverables?.sameDayEdit && (
                  <li>Same day edit</li>
                )}
              </>
            )}
          </ul>
        </p>
      </div>

      <div className="price-quality-slider-container">
        <h3 className="slider-header">Price vs. Quality Preference</h3>
        <div className="slider-labels">
          <span>Budget-friendly</span>
          <span>Luxury</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={priceQualityPreference}
          onChange={handlePriceQualityChange}
          className="price-quality-slider"
        />
        <div className="preference-detail">
          <p>Your preference: {getPriceQualityDescription(priceQualityPreference)}</p>
        </div>
      </div>

      <div className="budget-range-selector">
        <div className="custom-input-container">
          <label className="custom-label">Budget Range</label>
          <select
            className="custom-input"
            value={formData.requests[category.charAt(0).toUpperCase() + category.slice(1)]?.priceRange || ''}
            onChange={handleBudgetRangeChange}
          >
            <option value="">Select a budget range</option>
            {getBudgetRanges().map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {budgetInsights.length > 0 && (
        <div className="budget-insights">
          <h4 className="budget-insight-header">Budget Insights</h4>
          <div className="budget-insight-details">
            {budgetInsights.map((insight, index) => (
              <div key={index} className="insight-item">
                <span className="insight-icon">{insight.icon}</span>
                <span className="insight-text">{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetForm; 