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
    } else if (category.toLowerCase() === 'florist') {
      // Initialize insights array for Florist
      const insights = [];
      
      // Base prices for floral arrangements
      const floralArrangements = formData.requests.Florist?.floralArrangements || {};
      
      // Bridal bouquet
      if (floralArrangements.bridalBouquet) {
        basePrice += 200;
      }
      
      // Bridesmaid bouquets
      if (floralArrangements.bridesmaidBouquets) {
        const quantity = floralArrangements.bridesmaidBouquetsQuantity || 1;
        basePrice += quantity * 100;
      }
      
      // Boutonnieres
      if (floralArrangements.boutonnieres) {
        const quantity = floralArrangements.boutonnieresQuantity || 1;
        basePrice += quantity * 25;
      }
      
      // Corsages
      if (floralArrangements.corsages) {
        const quantity = floralArrangements.corsagesQuantity || 1;
        basePrice += quantity * 40;
      }
      
      // Centerpieces
      if (floralArrangements.centerpieces) {
        const quantity = floralArrangements.centerpiecesQuantity || 1;
        basePrice += quantity * 75;
      }
      
      // Ceremony arch flowers
      if (floralArrangements.ceremonyArchFlowers) {
        basePrice += 500;
      }
      
      // Aisle decorations
      if (floralArrangements.aisleDecorations) {
        basePrice += 300;
      }
      
      // Floral installations
      if (floralArrangements.floralInstallations) {
        basePrice += 800;
      }
      
      // Cake flowers
      if (floralArrangements.cakeFlowers) {
        basePrice += 150;
      }
      
      // Loose petals
      if (floralArrangements.loosePetals) {
        basePrice += 100;
      }

      // Additional services
      const additionalServices = formData.requests.Florist?.additionalServices || {};
      if (additionalServices.setup) basePrice += 200;
      if (additionalServices.delivery) basePrice += 150;
      if (additionalServices.cleanup) basePrice += 100;
      if (additionalServices.consultation) basePrice += 150;

      // Debug log to check the calculation
      console.log('Florist Budget Calculation:', {
        floralArrangements,
        additionalServices,
        basePrice,
        finalPrice: basePrice
      });

      // Add budget insights for Florist
      if (floralArrangements.bridalBouquet) {
        insights.push({
          icon: '💐',
          text: 'Bridal bouquet',
          type: 'info'
        });
      }
      if (floralArrangements.bridesmaidBouquets) {
        const quantity = floralArrangements.bridesmaidBouquetsQuantity || 1;
        insights.push({
          icon: '💐',
          text: `${quantity} bridesmaid bouquet(s)`,
          type: 'info'
        });
      }
      if (floralArrangements.boutonnieres) {
        const quantity = floralArrangements.boutonnieresQuantity || 1;
        insights.push({
          icon: '💐',
          text: `${quantity} boutonniere(s)`,
          type: 'info'
        });
      }
      if (floralArrangements.corsages) {
        const quantity = floralArrangements.corsagesQuantity || 1;
        insights.push({
          icon: '💐',
          text: `${quantity} corsage(s)`,
          type: 'info'
        });
      }
      if (floralArrangements.centerpieces) {
        const quantity = floralArrangements.centerpiecesQuantity || 1;
        insights.push({
          icon: '💐',
          text: `${quantity} centerpiece(s)`,
          type: 'info'
        });
      }
      if (floralArrangements.ceremonyArchFlowers) {
        insights.push({
          icon: '💐',
          text: 'Ceremony arch flowers',
          type: 'info'
        });
      }
      if (floralArrangements.aisleDecorations) {
        insights.push({
          icon: '💐',
          text: 'Aisle decorations',
          type: 'info'
        });
      }
      if (floralArrangements.floralInstallations) {
        insights.push({
          icon: '💐',
          text: 'Floral installations',
          type: 'info'
        });
      }
      if (floralArrangements.cakeFlowers) {
        insights.push({
          icon: '💐',
          text: 'Cake flowers',
          type: 'info'
        });
      }
      if (floralArrangements.loosePetals) {
        insights.push({
          icon: '💐',
          text: 'Loose petals',
          type: 'info'
        });
      }
      if (additionalServices.setup) {
        insights.push({
          icon: '⚙️',
          text: 'Setup & installation service',
          type: 'info'
        });
      }
      if (additionalServices.delivery) {
        insights.push({
          icon: '🚚',
          text: 'Delivery service',
          type: 'info'
        });
      }
      if (additionalServices.cleanup) {
        insights.push({
          icon: '🧹',
          text: 'Cleanup service',
          type: 'info'
        });
      }
      if (additionalServices.consultation) {
        insights.push({
          icon: '💬',
          text: 'In-person consultation',
          type: 'info'
        });
      }

      // Set the insights for display
      setBudgetInsights(insights);
    } else if (category.toLowerCase() === 'catering') {
      // Base price based on number of guests
      const numGuests = parseInt(formData.commonDetails?.numGuests) || 0;
      if (numGuests > 0) {
        basePrice = numGuests * 35; // Reduced from $50 to $35 per person base rate
      }

      // Add for food style
      const foodStyle = formData.eventDetails?.foodStyle;
      if (foodStyle === 'plated') {
        basePrice *= 1.15; // Reduced from 1.2 to 1.15 (15% increase for plated service)
      } else if (foodStyle === 'stations') {
        basePrice *= 1.2; // Reduced from 1.3 to 1.2 (20% increase for food stations)
      }

      // Add for dietary restrictions
      const dietaryRestrictions = formData.eventDetails?.dietaryRestrictions || [];
      if (dietaryRestrictions.length > 0) {
        basePrice *= 1.05; // Reduced from 1.1 to 1.05 (5% increase for dietary restrictions)
      }

      // Add for setup and cleanup
      const setupCleanup = formData.eventDetails?.setupCleanup;
      if (setupCleanup === 'both') {
        basePrice += 300; // Reduced from $500 to $300 for full setup and cleanup
      } else if (setupCleanup === 'setupOnly' || setupCleanup === 'cleanupOnly') {
        basePrice += 150; // Reduced from $250 to $150 for partial service
      }

      // Add for serving staff
      const servingStaff = formData.eventDetails?.servingStaff;
      if (servingStaff === 'fullService') {
        basePrice += numGuests * 8; // Reduced from $10 to $8 per person for full service staff
      } else if (servingStaff === 'partialService') {
        basePrice += numGuests * 4; // Reduced from $5 to $4 per person for partial service
      }

      // Add for dining items
      const diningItems = formData.eventDetails?.diningItems;
      if (diningItems === 'provided') {
        basePrice += numGuests * 12; // Reduced from $15 to $12 per person for full dining items
      } else if (diningItems === 'partial') {
        basePrice += numGuests * 6; // Reduced from $8 to $6 per person for partial items
      }

      // Adjust based on price quality preference
      const priceQualityPreference = formData.requests.Catering?.priceQualityPreference || "2";
      if (priceQualityPreference === "1") {
        basePrice *= 0.85; // Increased from 0.8 to 0.85 (15% reduction for budget-conscious)
      } else if (priceQualityPreference === "3") {
        basePrice *= 1.2; // Reduced from 1.3 to 1.2 (20% increase for quality-focused)
      }

      // Calculate range based on price quality preference
      const qualityMultiplier = 1 + (priceQualityPreference / 100);
      const minPrice = Math.round(basePrice * (qualityMultiplier - 0.15)); // Reduced from 0.2 to 0.15
      const maxPrice = Math.round(basePrice * (qualityMultiplier + 0.15)); // Reduced from 0.2 to 0.15

      setRecommendedBudget({ min: minPrice, max: maxPrice });

      // Add budget insights based on the calculated price
      const insights = [];
      if (numGuests > 0) {
        insights.push(`${numGuests} guests`);
      }
      if (foodStyle) {
        insights.push(`${foodStyle.charAt(0).toUpperCase() + foodStyle.slice(1)} service`);
      }
      if (dietaryRestrictions.length > 0) {
        insights.push(`${dietaryRestrictions.length} dietary restrictions`);
      }
      if (setupCleanup) {
        insights.push(`${setupCleanup === 'both' ? 'Full' : 'Partial'} setup/cleanup`);
      }
      if (servingStaff) {
        insights.push(`${servingStaff === 'fullService' ? 'Full' : 'Partial'} service staff`);
      }
      if (diningItems) {
        insights.push(`${diningItems === 'provided' ? 'Full' : 'Partial'} dining items`);
      }

      setBudgetInsights(insights);
    }
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
    
    // Return empty insights if range is undefined
    if (!range) {
      return insights;
    }

    const [min, max] = range.split('-').map(Number);

    if (category.toLowerCase() === 'catering') {
      if (min < 1000) {
        insights.push(
          'Limited menu options',
          'Basic service with minimal staff',
          'Self-service or minimal staff assistance',
          'Standard dinnerware and utensils',
          'Limited customization options'
        );
      } else if (min < 2000) {
        insights.push(
          'Moderate menu selection',
          'Basic staff service',
          'Standard dinnerware and utensils',
          'Some customization options available',
          'Basic setup and cleanup included'
        );
      } else if (min < 3000) {
        insights.push(
          'Good variety of menu options',
          'Professional staff service',
          'Quality dinnerware and utensils',
          'More customization options',
          'Full setup and cleanup service'
        );
      } else if (min < 4000) {
        insights.push(
          'Extensive menu selection',
          'Professional full-service staff',
          'Premium dinnerware and utensils',
          'High level of customization',
          'Comprehensive setup and cleanup'
        );
      } else if (min < 5000) {
        insights.push(
          'Premium menu options',
          'Experienced professional staff',
          'Luxury dinnerware and utensils',
          'Extensive customization options',
          'Premium setup and cleanup service'
        );
      } else if (min < 6000) {
        insights.push(
          'Gourmet menu selection',
          'Highly experienced staff',
          'Luxury dinnerware and utensils',
          'Full customization capabilities',
          'Premium setup and cleanup service'
        );
      } else if (min < 8000) {
        insights.push(
          'Executive chef services',
          'Premium staff service',
          'Luxury dinnerware and utensils',
          'Complete customization options',
          'Premium setup and cleanup service'
        );
      } else if (min < 10000) {
        insights.push(
          'Celebrity chef options',
          'Elite staff service',
          'Luxury dinnerware and utensils',
          'Complete customization options',
          'Premium setup and cleanup service'
        );
      } else {
        insights.push(
          'Custom menu design by executive chef',
          'Elite staff service',
          'Luxury dinnerware and utensils',
          'Complete customization options',
          'Premium setup and cleanup service'
        );
      }
    } else if (category.toLowerCase() === 'photography') {
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
    } else if (category.toLowerCase() === 'florist') {
      // ... existing florist insights ...
    } else if (category.toLowerCase() === 'hairandmakeup') {
      // ... existing hairandmakeup insights ...
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
    
    // Update the form data with the new price quality preference
    if (category.toLowerCase() === 'catering') {
      setFormData(prev => ({
        ...prev,
        requests: {
          ...prev.requests,
          Catering: {
            ...prev.requests.Catering,
            priceQualityPreference: value.toString()
          }
        }
      }));
    } else if (category.toLowerCase() === 'photography') {
      setFormData(prev => ({
        ...prev,
        requests: {
          ...prev.requests,
          Photography: {
            ...prev.requests.Photography,
            priceQualityPreference: value.toString()
          }
        }
      }));
    } else if (category.toLowerCase() === 'videography') {
      setFormData(prev => ({
        ...prev,
        requests: {
          ...prev.requests,
          Videography: {
            ...prev.requests.Videography,
            priceQualityPreference: value.toString()
          }
        }
      }));
    } else if (category.toLowerCase() === 'dj') {
      setFormData(prev => ({
        ...prev,
        eventDetails: {
          ...prev.eventDetails,
          priceQualityPreference: value.toString()
        }
      }));
    } else if (category.toLowerCase() === 'florist') {
      setFormData(prev => ({
        ...prev,
        requests: {
          ...prev.requests,
          Florist: {
            ...prev.requests.Florist,
            priceQualityPreference: value.toString()
          }
        }
      }));
    } else if (category.toLowerCase() === 'hairandmakeup') {
      setFormData(prev => ({
        ...prev,
        requests: {
          ...prev.requests,
          HairAndMakeup: {
            ...prev.requests.HairAndMakeup,
            priceQualityPreference: value.toString()
          }
        }
      }));
    }
  };

  const handleBudgetRangeChange = (e) => {
    if (category.toLowerCase() === 'catering') {
      setFormData(prev => ({
        ...prev,
        eventDetails: {
          ...prev.eventDetails,
          priceRange: e.target.value
        }
      }));
    } else if (category.toLowerCase() === 'dj') {
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
        <span className="explanation-label">Based on: </span>
        <div className="budget-explanation">

          <div className="explanation-items">
            {category.toLowerCase() === 'catering' && (
              <>
                {formData.commonDetails?.numGuests && (
                  <span className="explanation-item">{formData.commonDetails.numGuests} guests</span>
                )}
                {formData.eventDetails?.foodStyle && (
                  <span className="explanation-item">{formData.eventDetails.foodStyle.charAt(0).toUpperCase() + formData.eventDetails.foodStyle.slice(1)} service</span>
                )}
                {formData.eventDetails?.dietaryRestrictions?.length > 0 && (
                  <span className="explanation-item">{formData.eventDetails.dietaryRestrictions.length} dietary restrictions</span>
                )}
                {formData.eventDetails?.setupCleanup && (
                  <span className="explanation-item">{formData.eventDetails.setupCleanup === 'both' ? 'Full' : 'Partial'} setup/cleanup</span>
                )}
                {formData.eventDetails?.servingStaff && (
                  <span className="explanation-item">{formData.eventDetails.servingStaff === 'fullService' ? 'Full' : 'Partial'} service staff</span>
                )}
                {formData.eventDetails?.diningItems && (
                  <span className="explanation-item">{formData.eventDetails.diningItems === 'provided' ? 'Full' : 'Partial'} dining items</span>
                )}
                {formData.requests.Catering?.priceQualityPreference && (
                  <span className="explanation-item">{formData.requests.Catering.priceQualityPreference === "1" ? "Budget-conscious" : formData.requests.Catering.priceQualityPreference === "3" ? "Quality-focused" : "Balanced"} quality preference</span>
                )}
              </>
            )}
            {category.toLowerCase() === 'photography' && (
              <>
                {formData.requests.Photography?.duration && (
                  <span className="explanation-item">{formData.requests.Photography.duration} hours of coverage</span>
                )}
                {formData.requests.Photography?.secondPhotographer === 'yes' && (
                  <span className="explanation-item">Second photographer</span>
                )}
                {formData.commonDetails.eventType === 'Wedding' && (
                  <span className="explanation-item">Wedding coverage points</span>
                )}
                {formData.requests.Photography?.deliverables?.weddingAlbum && (
                  <span className="explanation-item">Wedding album</span>
                )}
                {formData.requests.Photography?.deliverables?.rawFiles && (
                  <span className="explanation-item">RAW files</span>
                )}
                {formData.requests.Photography?.deliverables?.engagement && (
                  <span className="explanation-item">Engagement session</span>
                )}
              </>
            )}
            {category.toLowerCase() === 'videography' && (
              <>
                {formData.requests.Videography?.duration && (
                  <span className="explanation-item">{formData.requests.Videography.duration} hours of coverage</span>
                )}
                {formData.requests.Videography?.secondVideographer === 'yes' && (
                  <span className="explanation-item">Second videographer</span>
                )}
                {formData.commonDetails.eventType === 'Wedding' && (
                  <span className="explanation-item">Wedding coverage points</span>
                )}
                {formData.requests.Videography?.deliverables?.highlightReel && (
                  <span className="explanation-item">Highlight reel</span>
                )}
                {formData.requests.Videography?.deliverables?.fullCeremony && (
                  <span className="explanation-item">Full ceremony</span>
                )}
                {formData.requests.Videography?.deliverables?.fullReception && (
                  <span className="explanation-item">Full reception</span>
                )}
                {formData.requests.Videography?.deliverables?.rawFootage && (
                  <span className="explanation-item">Raw footage</span>
                )}
                {formData.requests.Videography?.deliverables?.droneFootage && (
                  <span className="explanation-item">Drone footage</span>
                )}
                {formData.requests.Videography?.deliverables?.sameDayEdit && (
                  <span className="explanation-item">Same day edit</span>
                )}
              </>
            )}
            {category.toLowerCase() === 'dj' && (
              <>
                <span className="explanation-item">Standard DJ service</span>
                {formData.eventDetails?.additionalServices?.mcServices && (
                  <span className="explanation-item">MC Services</span>
                )}
                {formData.eventDetails?.additionalServices?.liveMixing && (
                  <span className="explanation-item">Live Mixing / Scratching</span>
                )}
                {formData.eventDetails?.additionalServices?.uplighting && (
                  <span className="explanation-item">Uplighting Package</span>
                )}
                {formData.eventDetails?.additionalServices?.fogMachine && (
                  <span className="explanation-item">Fog Machine</span>
                )}
                {formData.eventDetails?.additionalServices?.specialFx && (
                  <span className="explanation-item">Special FX</span>
                )}
                {formData.eventDetails?.additionalServices?.photoBooth && (
                  <span className="explanation-item">Photo Booth Service</span>
                )}
                {formData.eventDetails?.additionalServices?.eventRecording && (
                  <span className="explanation-item">Event Recording</span>
                )}
                {formData.eventDetails?.additionalServices?.karaoke && (
                  <span className="explanation-item">Karaoke Setup</span>
                )}
                {formData.eventDetails?.equipmentNeeded === 'djBringsAll' && (
                  <span className="explanation-item">DJ brings all equipment</span>
                )}
                {formData.eventDetails?.equipmentNeeded === 'djBringsSome' && (
                  <span className="explanation-item">DJ brings some equipment</span>
                )}
                {formData.commonDetails?.eventType === 'Wedding' && (
                  <>
                    {formData.eventDetails?.weddingDetails?.ceremony && (
                      <span className="explanation-item">Ceremony coverage</span>
                    )}
                    {formData.eventDetails?.weddingDetails?.cocktailHour && (
                      <span className="explanation-item">Cocktail hour coverage</span>
                    )}
                    {formData.eventDetails?.weddingDetails?.reception && (
                      <span className="explanation-item">Reception coverage</span>
                    )}
                    {formData.eventDetails?.weddingDetails?.afterParty && (
                      <span className="explanation-item">After party coverage</span>
                    )}
                  </>
                )}
              </>
            )}
            {category.toLowerCase() === 'florist' && (
              <>
                {formData.requests.Florist?.floralArrangements?.bridalBouquet && (
                  <span className="explanation-item">Bridal bouquet</span>
                )}
                {formData.requests.Florist?.floralArrangements?.bridesmaidBouquets && (
                  <span className="explanation-item">{formData.requests.Florist?.floralArrangements?.bridesmaidBouquetsQuantity || 1} bridesmaid bouquet(s)</span>
                )}
                {formData.requests.Florist?.floralArrangements?.boutonnieres && (
                  <span className="explanation-item">{formData.requests.Florist?.floralArrangements?.boutonnieresQuantity || 1} boutonniere(s)</span>
                )}
                {formData.requests.Florist?.floralArrangements?.corsages && (
                  <span className="explanation-item">{formData.requests.Florist?.floralArrangements?.corsagesQuantity || 1} corsage(s)</span>
                )}
                {formData.requests.Florist?.floralArrangements?.centerpieces && (
                  <span className="explanation-item">{formData.requests.Florist?.floralArrangements?.centerpiecesQuantity || 1} centerpiece(s)</span>
                )}
                {formData.requests.Florist?.floralArrangements?.ceremonyArchFlowers && (
                  <span className="explanation-item">Ceremony arch flowers</span>
                )}
                {formData.requests.Florist?.floralArrangements?.aisleDecorations && (
                  <span className="explanation-item">Aisle decorations</span>
                )}
                {formData.requests.Florist?.floralArrangements?.floralInstallations && (
                  <span className="explanation-item">Floral installations</span>
                )}
                {formData.requests.Florist?.floralArrangements?.cakeFlowers && (
                  <span className="explanation-item">Cake flowers</span>
                )}
                {formData.requests.Florist?.floralArrangements?.loosePetals && (
                  <span className="explanation-item">Loose petals</span>
                )}
                {formData.requests.Florist?.additionalServices?.setup && (
                  <span className="explanation-item">Setup & installation service</span>
                )}
                {formData.requests.Florist?.additionalServices?.delivery && (
                  <span className="explanation-item">Delivery service</span>
                )}
                {formData.requests.Florist?.additionalServices?.cleanup && (
                  <span className="explanation-item">Cleanup service</span>
                )}
                {formData.requests.Florist?.additionalServices?.consultation && (
                  <span className="explanation-item">In-person consultation</span>
                )}
              </>
            )}
            {category.toLowerCase() === 'hairandmakeup' && (
              <>
                {formData.requests.HairAndMakeup?.numPeople && (
                  <span className="explanation-item">{formData.requests.HairAndMakeup.numPeople} people needing services</span>
                )}
                {formData.requests.HairAndMakeup?.serviceType && (
                  <span className="explanation-item">{formData.requests.HairAndMakeup.serviceType === 'both' ? 'Hair & Makeup' : formData.requests.HairAndMakeup.serviceType === 'hair' ? 'Hair Only' : 'Makeup Only'} services</span>
                )}
                {formData.requests.HairAndMakeup?.extensionsNeeded === 'yes' && (
                  <span className="explanation-item">Hair extensions</span>
                )}
                {formData.requests.HairAndMakeup?.trialSessionHair === 'yes' && (
                  <span className="explanation-item">Hair trial session</span>
                )}
                {formData.requests.HairAndMakeup?.lashesIncluded === 'yes' && (
                  <span className="explanation-item">Lashes included</span>
                )}
                {formData.requests.HairAndMakeup?.trialSessionMakeup === 'yes' && (
                  <span className="explanation-item">Makeup trial session</span>
                )}
                {formData.requests.HairAndMakeup?.serviceLocation?.toLowerCase().includes('hotel') && (
                  <span className="explanation-item">Hotel service location</span>
                )}
              </>
            )}
          </div>
        </div>
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
            value={category.toLowerCase() === 'catering' || category.toLowerCase() === 'dj'
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
    </div>
  );
};

export default BudgetForm; 