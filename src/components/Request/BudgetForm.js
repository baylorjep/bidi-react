import React, { useState, useEffect } from 'react';
import './BudgetForm.css';

const BudgetForm = ({ formData, setFormData, category }) => {
  const [priceQualityPreference, setPriceQualityPreference] = useState(50);
  const [budgetInsights, setBudgetInsights] = useState([]);
  const [recommendedBudget, setRecommendedBudget] = useState({ min: 0, max: 0 });
  const [budgetRange, setBudgetRange] = useState({ min: 0, max: 10000 });
  const [isDragging, setIsDragging] = useState(null);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const sliderRef = React.useRef(null);

  useEffect(() => {
    updateBudgetInsights();
    calculateRecommendedBudget();
  }, [formData, category, priceQualityPreference, budgetRange]);

  const getBudgetRanges = () => {
    switch (category.toLowerCase()) {
      case 'photography':
        return [
          { min: 0, max: 1000, value: '0-1000', label: '$0 - $1,000' },
          { min: 1000, max: 2000, value: '1000-2000', label: '$1,000 - $2,000' },
          { min: 2000, max: 3000, value: '2000-3000', label: '$2,000 - $3,000' },
          { min: 3000, max: 4000, value: '3000-4000', label: '$3,000 - $4,000' },
          { min: 4000, max: 5000, value: '4000-5000', label: '$4,000 - $5,000' },
          { min: 5000, max: Infinity, value: '5000+', label: '$5,000+' }
        ];
      case 'videography':
        return [
          { min: 0, max: 1000, value: '0-1000', label: '$0 - $1,000' },
          { min: 1000, max: 2000, value: '1000-2000', label: '$1,000 - $2,000' },
          { min: 2000, max: 3000, value: '2000-3000', label: '$2,000 - $3,000' },
          { min: 3000, max: 4000, value: '3000-4000', label: '$3,000 - $4,000' },
          { min: 4000, max: 5000, value: '4000-5000', label: '$4,000 - $5,000' },
          { min: 5000, max: Infinity, value: '5000+', label: '$5,000+' }
        ];
      case 'dj':
        return [
          { min: 0, max: 500, value: '0-500', label: '$0 - $500' },
          { min: 500, max: 1000, value: '500-1000', label: '$500 - $1,000' },
          { min: 1000, max: 1500, value: '1000-1500', label: '$1,000 - $1,500' },
          { min: 1500, max: 2000, value: '1500-2000', label: '$1,500 - $2,000' },
          { min: 2000, max: 3000, value: '2000-3000', label: '$2,000 - $3,000' },
          { min: 3000, max: Infinity, value: '3000+', label: '$3,000+' }
        ];
      case 'catering':
        return [
          { min: 0, max: 1000, value: '0-1000', label: '$0 - $1,000' },
          { min: 1000, max: 2000, value: '1000-2000', label: '$1,000 - $2,000' },
          { min: 2000, max: 3000, value: '2000-3000', label: '$2,000 - $3,000' },
          { min: 3000, max: 4000, value: '3000-4000', label: '$3,000 - $4,000' },
          { min: 4000, max: 5000, value: '4000-5000', label: '$4,000 - $5,000' },
          { min: 5000, max: Infinity, value: '5000+', label: '$5,000+' }
        ];
      case 'florist':
        return [
          { min: 0, max: 500, value: '0-500', label: '$0 - $500' },
          { min: 500, max: 1000, value: '500-1000', label: '$500 - $1,000' },
          { min: 1000, max: 1500, value: '1000-1500', label: '$1,000 - $1,500' },
          { min: 1500, max: 2000, value: '1500-2000', label: '$1,500 - $2,000' },
          { min: 2000, max: 3000, value: '2000-3000', label: '$2,000 - $3,000' },
          { min: 3000, max: Infinity, value: '3000+', label: '$3,000+' }
        ];
      case 'beauty':
        return [
          { min: 0, max: 500, value: '0-500', label: '$0 - $500' },
          { min: 500, max: 1000, value: '500-1000', label: '$500 - $1,000' },
          { min: 1000, max: 1500, value: '1000-1500', label: '$1,000 - $1,500' },
          { min: 1500, max: 2000, value: '1500-2000', label: '$1,500 - $2,000' },
          { min: 2000, max: 3000, value: '2000-3000', label: '$2,000 - $3,000' },
          { min: 3000, max: Infinity, value: '3000+', label: '$3,000+' }
        ];
      default:
        return [
          { min: 0, max: 500, value: '0-500', label: '$0 - $500' },
          { min: 500, max: 1000, value: '500-1000', label: '$500 - $1,000' },
          { min: 1000, max: 1500, value: '1000-1500', label: '$1,000 - $1,500' },
          { min: 1500, max: 2000, value: '1500-2000', label: '$1,500 - $2,000' },
          { min: 2000, max: 3000, value: '2000-3000', label: '$2,000 - $3,000' },
          { min: 3000, max: Infinity, value: '3000+', label: '$3,000+' }
        ];
    }
  };

  const calculateRecommendedBudget = () => {
    let basePrice = 0;
    const requestData = formData.requests[category] || {};
    const commonDetails = formData.commonDetails || {};
    const eventType = commonDetails.eventType?.toLowerCase();

    // Get base price from the appropriate stepper component
    switch (category.toLowerCase()) {
      case 'photography':
        if (requestData.duration) {
          basePrice = requestData.duration * 200;
          if (requestData.secondPhotographer === 'yes') {
            basePrice *= 1.5;
          }
        }
        break;
      case 'videography':
        if (requestData.duration) {
          basePrice = requestData.duration * 300;
          if (requestData.secondVideographer === 'yes') {
            basePrice *= 1.5;
          }
        }
        break;
      case 'dj':
        basePrice = 1000;
        if (requestData.additionalServices) {
          if (requestData.additionalServices.mcServices) basePrice += 200;
          if (requestData.additionalServices.liveMixing) basePrice += 300;
          if (requestData.additionalServices.uplighting) basePrice += 400;
          if (requestData.additionalServices.fogMachine) basePrice += 150;
          if (requestData.additionalServices.specialFx) basePrice += 500;
          if (requestData.additionalServices.photoBooth) basePrice += 800;
          if (requestData.additionalServices.eventRecording) basePrice += 300;
          if (requestData.additionalServices.karaoke) basePrice += 200;
        }
        break;
      case 'catering':
        const numGuests = parseInt(commonDetails.numGuests) || 0;
        basePrice = numGuests * 50;
        if (requestData.foodStyle === 'plated') basePrice *= 1.2;
        if (requestData.foodStyle === 'stations') basePrice *= 1.3;
        if (requestData.dietaryRestrictions?.length > 0) basePrice *= 1.1;
        if (requestData.setupCleanup === 'both') basePrice += 500;
        if (requestData.setupCleanup === 'setupOnly' || requestData.setupCleanup === 'cleanupOnly') basePrice += 250;
        if (requestData.servingStaff === 'fullService') basePrice += numGuests * 10;
        if (requestData.servingStaff === 'partialService') basePrice += numGuests * 5;
        break;
      case 'florist':
        const floralArrangements = requestData.floralArrangements || {};
        if (floralArrangements.bridalBouquet) basePrice += 200;
        if (floralArrangements.bridesmaidBouquets) {
          const quantity = floralArrangements.bridesmaidBouquetsQuantity || 1;
          basePrice += quantity * 100;
        }
        if (floralArrangements.boutonnieres) {
          const quantity = floralArrangements.boutonnieresQuantity || 1;
          basePrice += quantity * 25;
        }
        if (floralArrangements.centerpieces) {
          const quantity = floralArrangements.centerpiecesQuantity || 1;
          basePrice += quantity * 75;
        }
        if (floralArrangements.ceremonyArch) basePrice += 500;
        if (floralArrangements.aisleMarkers) basePrice += 300;
        if (floralArrangements.altarArrangements) basePrice += 400;
        if (floralArrangements.welcomeSign) basePrice += 150;
        if (floralArrangements.cakeFlowers) basePrice += 150;
        if (floralArrangements.tossBouquet) basePrice += 100;
        if (floralArrangements.flowerCrown) basePrice += 150;
        if (floralArrangements.flowerGirlBasket) basePrice += 100;
        if (floralArrangements.petalConfetti) basePrice += 100;
        break;
      case 'beauty':
        const serviceType = requestData.serviceType;
        const numPeople = parseInt(requestData.numPeople) || 0;
        const baseRates = {
          'both': 200,
          'hair': 150,
          'makeup': 100
        };
        basePrice = baseRates[serviceType] * numPeople;
        if (requestData.extensionsNeeded === 'yes') basePrice += 100 * numPeople;
        if (requestData.trialSessionHair === 'yes') basePrice += 150 * numPeople;
        if (requestData.lashesIncluded === 'yes') basePrice += 50 * numPeople;
        if (requestData.trialSessionMakeup === 'yes') basePrice += 150 * numPeople;
        break;
    }

    // Calculate range based on price quality preference
    const qualityMultiplier = 1 + (priceQualityPreference / 100);
    const minPrice = Math.round(basePrice * (qualityMultiplier - 0.2) / 100) * 100;
    const maxPrice = Math.round(basePrice * (qualityMultiplier + 0.2) / 100) * 100;

    setRecommendedBudget({ min: minPrice, max: maxPrice });
    
    if (isAutoMode) {
      setBudgetRange({ min: minPrice, max: maxPrice });
    }
  };

  const updateBudgetInsights = () => {
    const insights = getBudgetInsights(budgetRange, category);
    setBudgetInsights(insights);
  };

  const getBudgetInsights = (range, category) => {
    const insights = [];
    const requestData = formData.requests[category] || {};
    const commonDetails = formData.commonDetails || {};

    switch (category.toLowerCase()) {
      case 'photography':
        if (requestData.duration) {
          insights.push({
            icon: '⏱️',
            text: `${requestData.duration} hours of coverage`,
            type: 'info'
          });
        }
        if (requestData.secondPhotographer === 'yes') {
          insights.push({
            icon: '📸',
            text: 'Second photographer included',
            type: 'info'
          });
        }
        break;
      case 'videography':
        if (requestData.duration) {
          insights.push({
            icon: '⏱️',
            text: `${requestData.duration} hours of coverage`,
            type: 'info'
          });
        }
        if (requestData.secondVideographer === 'yes') {
          insights.push({
            icon: '🎥',
            text: 'Second videographer included',
            type: 'info'
          });
        }
        break;
      case 'dj':
        if (requestData.additionalServices) {
          Object.entries(requestData.additionalServices).forEach(([service, included]) => {
            if (included) {
              insights.push({
                icon: '🎵',
                text: service.replace(/([A-Z])/g, ' $1').trim(),
                type: 'info'
              });
            }
          });
        }
        break;
      case 'catering':
        const numGuests = parseInt(commonDetails.numGuests) || 0;
        if (numGuests > 0) {
          insights.push({
            icon: '👥',
            text: `${numGuests} guests`,
            type: 'info'
          });
        }
        if (requestData.foodStyle) {
          insights.push({
            icon: '🍽️',
            text: `${requestData.foodStyle} service`,
            type: 'info'
          });
        }
        break;
      case 'florist':
        const floralArrangements = requestData.floralArrangements || {};
        Object.entries(floralArrangements).forEach(([arrangement, included]) => {
          if (included && !arrangement.endsWith('Quantity')) {
            const quantity = floralArrangements[`${arrangement}Quantity`] || 1;
            insights.push({
              icon: '💐',
              text: `${quantity} ${arrangement.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
              type: 'info'
            });
          }
        });
        break;
      case 'beauty':
        const serviceType = requestData.serviceType;
        const numPeople = parseInt(requestData.numPeople) || 0;
        if (serviceType && numPeople > 0) {
          insights.push({
            icon: '💇‍♀️',
            text: `${serviceType} service for ${numPeople} people`,
            type: 'info'
          });
        }
        break;
    }

    return insights;
  };

  const handlePriceQualityChange = (e) => {
    const value = parseInt(e.target.value);
    setPriceQualityPreference(value);
    
    if (isAutoMode) {
      calculateRecommendedBudget();
    }
    
    // Update the form data with the new price quality preference
    setFormData(prev => ({
      ...prev,
      requests: {
        ...prev.requests,
        [category]: {
          ...prev.requests[category],
          priceQualityPreference: value.toString()
        }
      }
    }));
  };

  const getPriceQualityDescription = (value) => {
    if (value < 25) return 'Budget-friendly';
    if (value < 50) return 'Balanced';
    if (value < 75) return 'Premium';
    return 'Luxury';
  };

  const handleBudgetSliderMouseDown = (e, type) => {
    e.preventDefault();
    setIsDragging(type);
  };

  const handleBudgetSliderMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const maxBudget = 10000; // Maximum budget value
    const value = Math.round(percentage * maxBudget / 100) * 100; // Round to nearest 100

    if (isDragging === 'min') {
      setBudgetRange(prev => ({
        ...prev,
        min: Math.min(value, prev.max - 100)
      }));
    } else {
      setBudgetRange(prev => ({
        ...prev,
        max: Math.max(value, prev.min + 100)
      }));
    }
  };

  const handleBudgetSliderMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(null);
    
    // Update form data with new budget range
    const rangeValue = `${budgetRange.min}-${budgetRange.max}`;
    if (category.toLowerCase() === 'catering' || category.toLowerCase() === 'dj') {
      setFormData(prev => ({
        ...prev,
        eventDetails: {
          ...prev.eventDetails,
          priceRange: rangeValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        requests: {
          ...prev.requests,
          [category]: {
            ...prev.requests[category],
            priceRange: rangeValue
          }
        }
      }));
    }
  };

  const handleBudgetSliderTouchStart = (e, type) => {
    e.preventDefault();
    setIsDragging(type);
  };

  const handleBudgetSliderTouchMove = (e) => {
    if (!isDragging || !sliderRef.current) return;

    const touch = e.touches[0];
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const maxBudget = 10000;
    const value = Math.round(percentage * maxBudget / 100) * 100;

    if (isDragging === 'min') {
      setBudgetRange(prev => ({
        ...prev,
        min: Math.min(value, prev.max - 100)
      }));
    } else {
      setBudgetRange(prev => ({
        ...prev,
        max: Math.max(value, prev.min + 100)
      }));
    }
  };

  const handleBudgetSliderTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(null);
    
    const rangeValue = `${budgetRange.min}-${budgetRange.max}`;
    if (category.toLowerCase() === 'catering' || category.toLowerCase() === 'dj') {
      setFormData(prev => ({
        ...prev,
        eventDetails: {
          ...prev.eventDetails,
          priceRange: rangeValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        requests: {
          ...prev.requests,
          [category]: {
            ...prev.requests[category],
            priceRange: rangeValue
          }
        }
      }));
    }
  };

  // Update useEffect to include touch events
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleBudgetSliderMouseMove);
      document.addEventListener('mouseup', handleBudgetSliderMouseUp);
      document.addEventListener('touchmove', handleBudgetSliderTouchMove);
      document.addEventListener('touchend', handleBudgetSliderTouchEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleBudgetSliderMouseMove);
      document.removeEventListener('mouseup', handleBudgetSliderMouseUp);
      document.removeEventListener('touchmove', handleBudgetSliderTouchMove);
      document.removeEventListener('touchend', handleBudgetSliderTouchEnd);
    };
  }, [isDragging, budgetRange]);

  return (
    <div className="budget-form-container">
      <div className="budget-recommendation-container">
        <div className="budget-recommendation-header">
          <h3>Recommended Budget Range</h3>
          <div className="budget-amount">
            ${recommendedBudget.min.toLocaleString()} - ${recommendedBudget.max.toLocaleString()}
          </div>
        </div>

        <div className="budget-mode-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isAutoMode}
              onChange={(e) => setIsAutoMode(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="toggle-label">
            {isAutoMode ? 'Automatic Budget Range' : 'Manual Budget Range'}
          </span>
        </div>

        {isAutoMode && (
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
              <p className="auto-mode-note">
                Budget range will automatically adjust based on your quality preference
              </p>
            </div>
            <div className="budget-explanation">
              <span className="explanation-label">Based on: </span>
              <div className="explanation-items">
                {budgetInsights.map((insight, index) => (
                  <div key={index} className="explanation-item">
                    {insight.icon && <span className="insight-icon">{insight.icon}</span>}
                    <span className="insight-text">{insight.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="budget-range-slider-container">
          <div className="budget-slider-container" ref={sliderRef}>
            <div className="budget-slider-track">
              <div 
                className="budget-slider-selection"
                style={{
                  left: `${(budgetRange.min / 10000) * 100}%`,
                  width: `${((budgetRange.max - budgetRange.min) / 10000) * 100}%`
                }}
              />
              <div 
                className="budget-slider-handle"
                style={{ left: `${(budgetRange.min / 10000) * 100}%` }}
                onMouseDown={(e) => !isAutoMode && handleBudgetSliderMouseDown(e, 'min')}
                onTouchStart={(e) => !isAutoMode && handleBudgetSliderTouchStart(e, 'min')}
              />
              <div 
                className="budget-slider-handle"
                style={{ left: `${(budgetRange.max / 10000) * 100}%` }}
                onMouseDown={(e) => !isAutoMode && handleBudgetSliderMouseDown(e, 'max')}
                onTouchStart={(e) => !isAutoMode && handleBudgetSliderTouchStart(e, 'max')}
              />
            </div>
            <div className="budget-slider-labels">
              <span>${budgetRange.min.toLocaleString()}</span>
              <span>${budgetRange.max.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetForm; 