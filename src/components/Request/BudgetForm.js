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
    switch (category.toLowerCase()) {
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
    const requestData = formData.requests[category] || {};

    if (category.toLowerCase() === 'photography') {
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

    } else if (category.toLowerCase() === 'videography') {
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
    } else if (category.toLowerCase() === 'dj') {
      // Base price for DJ services
      basePrice = 1000; // Base rate for a standard DJ service

      // Add for additional services
      const additionalServices = formData.eventDetails?.additionalServices || {};
      if (additionalServices.mcServices) basePrice += 200;
      if (additionalServices.liveMixing) basePrice += 300;
      if (additionalServices.uplighting) basePrice += 400;
      if (additionalServices.fogMachine) basePrice += 150;
      if (additionalServices.specialFx) basePrice += 500;
      if (additionalServices.photoBooth) basePrice += 800;
      if (additionalServices.eventRecording) basePrice += 300;
      if (additionalServices.karaoke) basePrice += 200;

      // Add for equipment needs
      const equipmentNeeded = formData.eventDetails?.equipmentNeeded;
      if (equipmentNeeded === 'djBringsAll') basePrice += 500;
      if (equipmentNeeded === 'djBringsSome') basePrice += 300;

      // Add for wedding coverage
      if (formData.commonDetails?.eventType === 'Wedding') {
        const weddingDetails = formData.eventDetails?.weddingDetails || {};
        const coveragePoints = Object.values(weddingDetails).filter(Boolean).length;
        basePrice += coveragePoints * 200; // $200 per coverage point
      }
    } else if (category.toLowerCase() === 'hairandmakeup') {
      // Base price for number of people
      const numPeople = parseInt(formData.requests.HairAndMakeup?.numPeople) || 1;
      
      // Base rate per person with volume discount
      let basePricePerPerson = 150;
      if (numPeople > 10) {
        basePricePerPerson = 120; // Volume discount for large groups
      } else if (numPeople > 5) {
        basePricePerPerson = 130; // Slight discount for medium groups
      }
      
      basePrice = numPeople * basePricePerPerson;

      // Service type adjustments
      const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
      if (serviceType === 'both') {
        basePrice *= 1.5; // Both services cost more than individual services
      }

      // Hair-specific adjustments
      if (serviceType === 'both' || serviceType === 'hair') {
        if (formData.requests.HairAndMakeup?.extensionsNeeded === 'yes') {
          basePrice += 200 * numPeople; // Additional cost for extensions per person
        }
        if (formData.requests.HairAndMakeup?.trialSessionHair === 'yes') {
          basePrice += 150 * numPeople; // Additional cost for hair trial per person
        }
      }

      // Makeup-specific adjustments
      if (serviceType === 'both' || serviceType === 'makeup') {
        if (formData.requests.HairAndMakeup?.lashesIncluded === 'yes') {
          basePrice += 50 * numPeople; // Additional cost for lashes per person
        }
        if (formData.requests.HairAndMakeup?.trialSessionMakeup === 'yes') {
          basePrice += 150 * numPeople; // Additional cost for makeup trial per person
        }
      }

      // Location adjustment
      if (formData.requests.HairAndMakeup?.serviceLocation?.toLowerCase().includes('hotel')) {
        basePrice += 100 * numPeople; // Additional cost for hotel service per person
      }

      // Minimum base price for large groups
      if (numPeople > 5) {
        basePrice = Math.max(basePrice, numPeople * 200); // Ensure minimum $200 per person for groups
      }

      // Debug log to check the calculation
      console.log('Hair and Makeup Budget Calculation:', {
        numPeople,
        basePricePerPerson,
        serviceType,
        basePrice,
        finalPrice: basePrice
      });
    }

    // Calculate range based on price quality preference
    const qualityMultiplier = 1 + (priceQualityPreference / 100);
    const minPrice = Math.round(basePrice * (qualityMultiplier - 0.2));
    const maxPrice = Math.round(basePrice * (qualityMultiplier + 0.2));

    setRecommendedBudget({ min: minPrice, max: maxPrice });

    // Removed the logic that automatically sets the priceRange based on calculation
    // The priceRange should only be updated by the user's explicit selection
    // in the handleBudgetRangeChange function.

    /* // --- Start of removed block --- 
    // Only update budget range if it hasn't been manually set
    const currentPriceRange = category.toLowerCase() === 'dj' // Use lower case for comparison
      ? formData.eventDetails?.priceRange 
      : formData.requests[category]?.priceRange; // Use category directly

    if (!currentPriceRange) {
      const ranges = getBudgetRanges();
      const matchingRange = ranges.find(range => 
        (minPrice >= range.min && minPrice < range.max) || 
        (maxPrice >= range.min && maxPrice < range.max)
      );

      if (matchingRange) {
        if (category.toLowerCase() === 'dj') { // Use lower case for comparison
          setFormData(prev => ({
            ...prev,
            eventDetails: {
              ...prev.eventDetails,
              priceRange: matchingRange.value
            }
          }));
        } else {
          setFormData(prev => ({ // Use category directly
            ...prev,
            requests: {
              ...prev.requests,
              [category]: {
                ...prev.requests[category],
                priceRange: matchingRange.value
              }
            }
          }));
        }
      }
    }
    // --- End of removed block --- */
  };

  const updateBudgetInsights = () => {
    const insights = getBudgetInsights(
      category.toLowerCase() === 'dj'
        ? formData.eventDetails?.priceRange 
        : formData.requests[category]?.priceRange,
      category
    );
    setBudgetInsights(insights);
  };

  const getBudgetInsights = (range, category) => {
    const insights = [];
    
    if (category.toLowerCase() === 'photography') {
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
    } else if (category.toLowerCase() === 'hairandmakeup') {
      switch (range) {
        case '0-300':
          insights.push({
            icon: '⚠️',
            text: 'Limited options in this range. Consider increasing budget for better quality.',
            type: 'warning'
          });
          break;
        case '300-500':
          insights.push({
            icon: '💇‍♀️',
            text: 'Good range for basic hair and makeup services.',
            type: 'info'
          });
          break;
        case '500-750':
          insights.push({
            icon: '💇‍♀️',
            text: 'Standard range for experienced beauty professionals.',
            type: 'info'
          });
          break;
        case '750-1000':
          insights.push({
            icon: '💇‍♀️',
            text: 'Premium range with experienced artists and additional services.',
            type: 'info'
          });
          break;
        case '1000-1500':
          insights.push({
            icon: '💇‍♀️',
            text: 'High-end range with top-tier beauty professionals.',
            type: 'info'
          });
          break;
        case '1500-2000':
          insights.push({
            icon: '💇‍♀️',
            text: 'Luxury range with renowned artists and full customization.',
            type: 'info'
          });
          break;
        case '2000+':
          insights.push({
            icon: '💇‍♀️',
            text: 'Elite range with celebrity beauty professionals.',
            type: 'info'
          });
          break;
        default:
          break;
      }
    } else if (category.toLowerCase() === 'videography') {
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
    } else if (category.toLowerCase() === 'dj') {
      switch (range) {
        case '0-500':
          insights.push({
            icon: '⚠️',
            text: 'Limited options in this range. Consider increasing budget for better quality.',
            type: 'warning'
          });
          break;
        case '500-1000':
          insights.push({
            icon: '🎵',
            text: 'Good range for entry-level DJs with basic equipment.',
            type: 'info'
          });
          break;
        case '1000-1500':
          insights.push({
            icon: '🎵',
            text: 'Standard range for experienced DJs with good equipment.',
            type: 'info'
          });
          break;
        case '1500-2000':
          insights.push({
            icon: '🎵',
            text: 'Premium range with experienced DJs and professional equipment.',
            type: 'info'
          });
          break;
        case '2000-2500':
          insights.push({
            icon: '🎵',
            text: 'High-end range with top-tier DJs and premium equipment.',
            type: 'info'
          });
          break;
        case '2500-3000':
          insights.push({
            icon: '🎵',
            text: 'Luxury range with renowned DJs and extensive equipment.',
            type: 'info'
          });
          break;
        case '3000+':
          insights.push({
            icon: '🎵',
            text: 'Elite range with celebrity DJs and full production setup.',
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
    if (category.toLowerCase() === 'dj') {
      setFormData(prev => ({
        ...prev,
        eventDetails: {
          ...prev.eventDetails,
          priceRange: e.target.value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        requests: {
          ...prev.requests,
          [category]: {
            ...prev.requests[category],
            priceRange: e.target.value
          }
        }
      }));
    }
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
            {category.toLowerCase() === 'photography' && (
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
            {category.toLowerCase() === 'videography' && (
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
            {category.toLowerCase() === 'dj' && (
              <>
                <li>Standard DJ service</li>
                {formData.eventDetails?.additionalServices?.mcServices && (
                  <li>MC Services</li>
                )}
                {formData.eventDetails?.additionalServices?.liveMixing && (
                  <li>Live Mixing / Scratching</li>
                )}
                {formData.eventDetails?.additionalServices?.uplighting && (
                  <li>Uplighting Package</li>
                )}
                {formData.eventDetails?.additionalServices?.fogMachine && (
                  <li>Fog Machine</li>
                )}
                {formData.eventDetails?.additionalServices?.specialFx && (
                  <li>Special FX</li>
                )}
                {formData.eventDetails?.additionalServices?.photoBooth && (
                  <li>Photo Booth Service</li>
                )}
                {formData.eventDetails?.additionalServices?.eventRecording && (
                  <li>Event Recording</li>
                )}
                {formData.eventDetails?.additionalServices?.karaoke && (
                  <li>Karaoke Setup</li>
                )}
                {formData.eventDetails?.equipmentNeeded === 'djBringsAll' && (
                  <li>DJ brings all equipment</li>
                )}
                {formData.eventDetails?.equipmentNeeded === 'djBringsSome' && (
                  <li>DJ brings some equipment</li>
                )}
                {formData.commonDetails?.eventType === 'Wedding' && (
                  <>
                    {formData.eventDetails?.weddingDetails?.ceremony && (
                      <li>Ceremony coverage</li>
                    )}
                    {formData.eventDetails?.weddingDetails?.cocktailHour && (
                      <li>Cocktail hour coverage</li>
                    )}
                    {formData.eventDetails?.weddingDetails?.reception && (
                      <li>Reception coverage</li>
                    )}
                    {formData.eventDetails?.weddingDetails?.afterParty && (
                      <li>After party coverage</li>
                    )}
                  </>
                )}
              </>
            )}
            {category.toLowerCase() === 'hairandmakeup' && (
              <>
                {formData.requests.HairAndMakeup?.numPeople && (
                  <li>{formData.requests.HairAndMakeup.numPeople} people needing services</li>
                )}
                {formData.requests.HairAndMakeup?.serviceType && (
                  <li>{formData.requests.HairAndMakeup.serviceType === 'both' ? 'Hair & Makeup' : formData.requests.HairAndMakeup.serviceType === 'hair' ? 'Hair Only' : 'Makeup Only'} services</li>
                )}
                {formData.requests.HairAndMakeup?.extensionsNeeded === 'yes' && (
                  <li>Hair extensions</li>
                )}
                {formData.requests.HairAndMakeup?.trialSessionHair === 'yes' && (
                  <li>Hair trial session</li>
                )}
                {formData.requests.HairAndMakeup?.lashesIncluded === 'yes' && (
                  <li>Lashes included</li>
                )}
                {formData.requests.HairAndMakeup?.trialSessionMakeup === 'yes' && (
                  <li>Makeup trial session</li>
                )}
                {formData.requests.HairAndMakeup?.serviceLocation?.toLowerCase().includes('hotel') && (
                  <li>Hotel service location</li>
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
            value={category.toLowerCase() === 'dj'
              ? formData.eventDetails?.priceRange || '' 
              : formData.requests[category]?.priceRange || ''}
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