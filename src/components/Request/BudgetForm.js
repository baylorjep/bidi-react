import React, { useState, useEffect } from 'react';
import './BudgetForm.css';

const BudgetForm = ({ formData, setFormData, category }) => {
  const [priceQualityPreference, setPriceQualityPreference] = useState(50);
  const [budgetInsights, setBudgetInsights] = useState([]);
  const [recommendedBudget, setRecommendedBudget] = useState({ min: 0, max: 0 });
  const normalizedCategory = Object.keys(formData.requests).find(
    key => key.toLowerCase() === category.toLowerCase().replace(/\s/g, '')
  ) || category;
  const initialManualBudgetRange = formData.requests[normalizedCategory]?.manualBudgetRange;
  const [budgetRange, setBudgetRange] = useState(
    initialManualBudgetRange || { min: 0, max: 10000 }
  );
  const [isDragging, setIsDragging] = useState(null);
  const initialIsAutoMode =
    formData.requests[normalizedCategory]?.isAutoMode;
  const [isAutoMode, setIsAutoMode] = useState(
    typeof initialIsAutoMode === 'boolean' ? initialIsAutoMode : true
  );
  const sliderRef = React.useRef(null);
  const initialPriceQuality = Number(
    formData.requests[normalizedCategory]?.priceQualityPreference
  );

  useEffect(() => {
    updateBudgetInsights();
    const rec = calculateRecommendedBudget();
    setRecommendedBudget(rec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedCategory, priceQualityPreference, budgetRange, isAutoMode, formData]);

  useEffect(() => {
    const initialPriceQuality = Number(
      formData.requests[normalizedCategory]?.priceQualityPreference
    );
    setPriceQualityPreference(!isNaN(initialPriceQuality) ? initialPriceQuality : 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedCategory]);

  // Restore isAutoMode when category changes
  useEffect(() => {
    const initialIsAutoMode = formData.requests[normalizedCategory]?.isAutoMode;
    setIsAutoMode(typeof initialIsAutoMode === 'boolean' ? initialIsAutoMode : true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedCategory]);

  const getBudgetRanges = () => {
    switch (normalizedCategory.toLowerCase()) {
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
    // Debug log to help diagnose missing info
    console.log('BudgetForm DEBUG:', {
      category: normalizedCategory,
      requestData: formData.requests[normalizedCategory],
      priceQualityPreference,
      formData
    });
    let basePrice = 0;
    const requestData = formData.requests[normalizedCategory] || {};
    const commonDetails = formData.commonDetails || {};
    const eventType = commonDetails.eventType?.toLowerCase();

    // Add calculation debug logs for HairAndMakeup
    if (normalizedCategory.toLowerCase() === 'hairandmakeup' || normalizedCategory.toLowerCase() === 'beauty') {
      const serviceType = requestData.serviceType;
      const numPeople = parseInt(requestData.numPeople) || 0;
      console.log('BudgetForm CALC DEBUG:', { serviceType, numPeople });
      if (!serviceType || numPeople <= 0) {
        console.log('BudgetForm CALC DEBUG: Not enough info, returning 0-0');
        return { min: 0, max: 0 };
      }
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
      // Calculate range based on price quality preference
      const qualityMultiplier = 1 + (priceQualityPreference / 100);
      const minPrice = Math.round(basePrice * (qualityMultiplier - 0.2));
      const maxPrice = Math.round(basePrice * (qualityMultiplier + 0.2));
      console.log('BudgetForm CALC DEBUG:', { basePrice, minPrice, maxPrice });
      return { min: minPrice, max: maxPrice };
    }

    // Get base price from the appropriate stepper component
    switch (normalizedCategory.toLowerCase()) {
      case 'photography':
        if (requestData.duration) {
          basePrice = requestData.duration * 200;
          if (requestData.secondPhotographer === 'yes') {
            basePrice *= 1.5;
          }
        } else {
          return { min: 0, max: 0 };
        }
        break;
      case 'videography':
        if (requestData.duration) {
          basePrice = requestData.duration * 300;
          if (requestData.secondVideographer === 'yes') {
            basePrice *= 1.5;
          }
        } else {
          return { min: 0, max: 0 };
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
        if (numGuests === 0) {
          return { min: 0, max: 0 };
        }
        // Use $10 per person as the balanced base
        basePrice = numGuests * 10;
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
        let hasAnyArrangement = false;
        if (floralArrangements.bridalBouquet) { basePrice += 200; hasAnyArrangement = true; }
        if (floralArrangements.bridesmaidBouquets) {
          const quantity = floralArrangements.bridesmaidBouquetsQuantity || 1;
          basePrice += quantity * 100; hasAnyArrangement = true;
        }
        if (floralArrangements.boutonnieres) {
          const quantity = floralArrangements.boutonnieresQuantity || 1;
          basePrice += quantity * 25; hasAnyArrangement = true;
        }
        if (floralArrangements.centerpieces) {
          const quantity = floralArrangements.centerpiecesQuantity || 1;
          basePrice += quantity * 75; hasAnyArrangement = true;
        }
        if (floralArrangements.ceremonyArch) { basePrice += 500; hasAnyArrangement = true; }
        if (floralArrangements.aisleMarkers) { basePrice += 300; hasAnyArrangement = true; }
        if (floralArrangements.altarArrangements) { basePrice += 400; hasAnyArrangement = true; }
        if (floralArrangements.welcomeSign) { basePrice += 150; hasAnyArrangement = true; }
        if (floralArrangements.cakeFlowers) { basePrice += 150; hasAnyArrangement = true; }
        if (floralArrangements.tossBouquet) { basePrice += 100; hasAnyArrangement = true; }
        if (floralArrangements.flowerCrown) { basePrice += 150; hasAnyArrangement = true; }
        if (floralArrangements.flowerGirlBasket) { basePrice += 100; hasAnyArrangement = true; }
        if (floralArrangements.petalConfetti) { basePrice += 100; hasAnyArrangement = true; }
        if (!hasAnyArrangement) {
          return { min: 0, max: 0 };
        }
        break;
      case 'beauty':
        const serviceType = requestData.serviceType;
        const numPeople = parseInt(requestData.numPeople) || 0;
        if (!serviceType || numPeople <= 0) {
          return { min: 0, max: 0 };
        }
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
      default:
        // If category is not recognized, return 0-0
        return { min: 0, max: 0 };
    }

    // Calculate range based on price quality preference
    const qualityMultiplier = 1 + (priceQualityPreference / 100);
    const minPrice = Math.round(basePrice * (qualityMultiplier - 0.2) / 100) * 100;
    const maxPrice = Math.round(basePrice * (qualityMultiplier + 0.2) / 100) * 100;

    setRecommendedBudget({ min: minPrice, max: maxPrice });
    
    if (isAutoMode) {
      const rangeValue = `${minPrice}-${maxPrice}`;
      if (budgetRange.min !== minPrice || budgetRange.max !== maxPrice) {
        setBudgetRange({ min: minPrice, max: maxPrice });
      }
      // Always update formData so review screen gets the correct value
      console.log('BudgetForm: About to set priceRange', {
        normalizedCategory,
        rangeValue,
        isAutoMode,
        budgetRange: { min: minPrice, max: maxPrice },
        prevRequests: formData.requests
      });
      setFormData(prev => {
        const updated = {
          ...prev,
          requests: {
            ...prev.requests,
            [normalizedCategory]: {
              ...prev.requests[normalizedCategory],
              priceRange: rangeValue
            }
          }
        };
        // Always set HairAndMakeup priceRange if present
        if (prev.requests.HairAndMakeup) {
          updated.requests.HairAndMakeup = {
            ...prev.requests.HairAndMakeup,
            priceRange: rangeValue
          };
        }
        // Always set Beauty priceRange if present
        if (prev.requests.Beauty) {
          updated.requests.Beauty = {
            ...prev.requests.Beauty,
            priceRange: rangeValue
          };
        }
        // Also update eventDetails for beauty
        if (normalizedCategory.toLowerCase() === 'beauty') {
          updated.eventDetails = {
            ...prev.eventDetails,
            priceRange: rangeValue
          };
        }
        // Debug log after updating
        console.log('BudgetForm: updated.requests after setting priceRange', updated.requests);
        return updated;
      });
    }

    // Always return a valid object
    return { min: minPrice, max: maxPrice };
  };

  const updateBudgetInsights = () => {
    const insights = getBudgetInsights(budgetRange, normalizedCategory);
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
      case 'hairandmakeup':
      case 'beauty': {
        const serviceType = requestData.serviceType;
        const numPeople = parseInt(requestData.numPeople) || 0;
        if (serviceType && numPeople > 0) {
          insights.push({
            icon: '💇‍♀️',
            text: `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} service for ${numPeople} people`,
            type: 'info'
          });
        }
        if (requestData.extensionsNeeded === 'yes') {
          insights.push({
            icon: '🧩',
            text: 'Extensions needed',
            type: 'info'
          });
        }
        if (requestData.trialSessionHair === 'yes') {
          insights.push({
            icon: '🧑‍🔬',
            text: 'Hair trial session requested',
            type: 'info'
          });
        }
        if (requestData.lashesIncluded === 'yes') {
          insights.push({
            icon: '👁️',
            text: 'Lashes included',
            type: 'info'
          });
        }
        if (requestData.trialSessionMakeup === 'yes') {
          insights.push({
            icon: '🧑‍🔬',
            text: 'Makeup trial session requested',
            type: 'info'
          });
        }
        break;
      }
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
        [normalizedCategory]: {
          ...prev.requests[normalizedCategory],
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
      setBudgetRange(prev => {
        const newRange = {
          ...prev,
          min: Math.min(value, prev.max - 100)
        };
        // Persist manual slider position in formData
        setFormData(prevForm => ({
          ...prevForm,
          requests: {
            ...prevForm.requests,
            [normalizedCategory]: {
              ...prevForm.requests[normalizedCategory],
              manualBudgetRange: newRange
            }
          }
        }));
        return newRange;
      });
    } else {
      setBudgetRange(prev => {
        const newRange = {
          ...prev,
          max: Math.max(value, prev.min + 100)
        };
        // Persist manual slider position in formData
        setFormData(prevForm => ({
          ...prevForm,
          requests: {
            ...prevForm.requests,
            [normalizedCategory]: {
              ...prevForm.requests[normalizedCategory],
              manualBudgetRange: newRange
            }
          }
        }));
        return newRange;
      });
    }
  };

  const handleBudgetSliderMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(null);
  
    // Update form data with new budget range
    const rangeValue = `${budgetRange.min}-${budgetRange.max}`;
    console.log('BudgetForm setFormData called for category:', normalizedCategory, 'with value:', rangeValue);
    setFormData(prev => {
      const updated = {
        ...prev,
        requests: {
          ...prev.requests,
          [normalizedCategory]: {
            ...prev.requests[normalizedCategory],
            priceRange: rangeValue
          }
        }
      };
      if (normalizedCategory !== 'HairAndMakeup' && prev.requests.HairAndMakeup) {
        updated.requests.HairAndMakeup = {
          ...prev.requests.HairAndMakeup,
          priceRange: rangeValue
        };
      }
      return updated;
    });
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
      setBudgetRange(prev => {
        const newRange = {
          ...prev,
          min: Math.min(value, prev.max - 100)
        };
        setFormData(prevForm => ({
          ...prevForm,
          requests: {
            ...prevForm.requests,
            [normalizedCategory]: {
              ...prevForm.requests[normalizedCategory],
              manualBudgetRange: newRange
            }
          }
        }));
        return newRange;
      });
    } else {
      setBudgetRange(prev => {
        const newRange = {
          ...prev,
          max: Math.max(value, prev.min + 100)
        };
        setFormData(prevForm => ({
          ...prevForm,
          requests: {
            ...prevForm.requests,
            [normalizedCategory]: {
              ...prevForm.requests[normalizedCategory],
              manualBudgetRange: newRange
            }
          }
        }));
        return newRange;
      });
    }
  };

  const handleBudgetSliderTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(null);
  
    const rangeValue = `${budgetRange.min}-${budgetRange.max}`;
    console.log('BudgetForm setFormData called for category:', normalizedCategory, 'with value:', rangeValue);
    setFormData(prev => {
      const updated = {
        ...prev,
        requests: {
          ...prev.requests,
          [normalizedCategory]: {
            ...prev.requests[normalizedCategory],
            priceRange: rangeValue
          }
        }
      };
      if (normalizedCategory !== 'HairAndMakeup' && prev.requests.HairAndMakeup) {
        updated.requests.HairAndMakeup = {
          ...prev.requests.HairAndMakeup,
          priceRange: rangeValue
        };
      }
      return updated;
    });
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

// Restore slider position only when category or mode changes
useEffect(() => {
  if (isAutoMode) {
    // Only set if different, to avoid slider jump during drag
    if (
      budgetRange.min !== recommendedBudget.min ||
      budgetRange.max !== recommendedBudget.max
    ) {
      setBudgetRange({ min: recommendedBudget.min, max: recommendedBudget.max });
    }
  } else {
    const manual = formData.requests[normalizedCategory]?.manualBudgetRange;
    if (
      manual &&
      (budgetRange.min !== manual.min || budgetRange.max !== manual.max)
    ) {
      setBudgetRange(manual);
    } else if (!manual && (budgetRange.min !== 0 || budgetRange.max !== 10000)) {
      // If no manualBudgetRange exists, save the current budgetRange as manualBudgetRange
      setFormData(prevForm => ({
        ...prevForm,
        requests: {
          ...prevForm.requests,
          [normalizedCategory]: {
            ...prevForm.requests[normalizedCategory],
            manualBudgetRange: budgetRange
          }
        }
      }));
    }
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [normalizedCategory, isAutoMode, recommendedBudget.min, recommendedBudget.max]);

  // Add debug log before rendering
  const safeRecommendedBudget =
    recommendedBudget && typeof recommendedBudget.min === 'number' && typeof recommendedBudget.max === 'number'
      ? recommendedBudget
      : { min: 0, max: 0 };
  console.log('BudgetForm RENDER:', { recommendedBudget: safeRecommendedBudget });
  return (
    <div className="budget-form-container">
      <div className="budget-recommendation-container">
        <div className="budget-recommendation-header">
          {(isAutoMode && safeRecommendedBudget.min === 0 && safeRecommendedBudget.max === 0) ? (
            <>
              <h3>Budget Range Unavailable</h3>
              <div className="budget-amount" style={{ color: '#d84888', fontWeight: 500 }}>
                Not enough info to recommend a budget range.<br />
                You can set your own range using the toggle below.
              </div>
            </>
          ) : isAutoMode ? (
            <>
              <h3>Recommended Budget Range</h3>
              <div className="budget-amount">
                ${safeRecommendedBudget.min.toLocaleString()} - ${safeRecommendedBudget.max.toLocaleString()}
              </div>
            </>
          ) : (
            <>
              <h3>Your Budget Range</h3>
              <div className="budget-amount">
                ${budgetRange.min.toLocaleString()} - ${budgetRange.max.toLocaleString()}
              </div>
              <div className="budget-recommendation-note">
                <span style={{ color: '#888', fontSize: '0.95em' }}>
                  (Recommended: {safeRecommendedBudget.min === 0 && safeRecommendedBudget.max === 0
                    ? 'Not enough info'
                    : `$${safeRecommendedBudget.min.toLocaleString()} - $${safeRecommendedBudget.max.toLocaleString()}`})
                </span>
              </div>
            </>
          )}
        </div>

        <div className="budget-mode-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isAutoMode}
              onChange={(e) => {
                const newMode = e.target.checked;
                setIsAutoMode(newMode);
                setFormData(prevForm => {
                  const updated = {
                    ...prevForm,
                    requests: {
                      ...prevForm.requests,
                      [normalizedCategory]: {
                        ...prevForm.requests[normalizedCategory],
                        isAutoMode: newMode
                      }
                    }
                  };
                  // If switching to manual, save the current budgetRange as manualBudgetRange
                  if (!newMode) {
                    updated.requests[normalizedCategory].manualBudgetRange = budgetRange;
                  }
                  return updated;
                });
              }}
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
                {budgetInsights.length > 0 ? (
                  budgetInsights.map((insight, index) => (
                    <div key={index} className="explanation-item">
                      {insight.icon && <span className="insight-icon">{insight.icon}</span>}
                      <span className="insight-text">{insight.text}</span>
                    </div>
                  ))
                ) : (
                  <div className="explanation-item" style={{ color: '#888' }}>
                    No details provided yet.
                  </div>
                )}
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