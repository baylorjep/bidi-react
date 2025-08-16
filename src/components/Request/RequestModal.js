import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiArrowLeft, FiArrowRight, FiEdit3, FiCheck, FiUsers, FiMapPin, FiCalendar, FiClock, FiDollarSign, FiUpload, FiCamera, FiVideo, FiMusic, FiHeart, FiHome, FiStar } from 'react-icons/fi';
import { BiRestaurant } from 'react-icons/bi';
import { colors } from '../../config/theme';
import { supabase } from '../../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import AuthModal from './Authentication/AuthModal';

// Photo Upload Components
const PhotoGrid = ({ photos, removePhoto, openModal }) => {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
      gap: '10px',
      marginTop: '15px'
    }}>
      {photos.map((photo, index) => (
        <div key={index} style={{ position: 'relative', aspectRatio: '1' }}>
          <img
            src={photo.url}
            alt={`Uploaded ${index}`}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={() => openModal(photo)}
          />
          <button
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              removePhoto(index);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

const PhotoModal = ({ photo, onClose }) => {
  if (!photo) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div 
        style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer'
          }}
          onClick={onClose}
        >
          ✕
        </button>
        <img 
          src={photo.url} 
          alt="Full size" 
          style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }}
        />
      </div>
    </div>
  );
};

const RequestModal = ({ isOpen, onClose, selectedVendors, searchFormData, isEditMode = false, existingRequestData = null, vendor = null }) => {
  console.log('RequestModal: Props received:', { isOpen, selectedVendors, searchFormData, isEditMode, existingRequestData, vendor });
  const [currentStep, setCurrentStep] = useState(0);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isReviewStep, setIsReviewStep] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false); // New state for event details step
  const navigate = useNavigate();

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('RequestModal: Modal opened, checking for pending context...');
      
      // Google Ads Conversion Tracking - Track modal open/engagement start
      try {
        // Check if gtag is available (Google Ads conversion tracking)
        if (typeof window !== 'undefined' && window.gtag) {
          // Track engagement for modal open
          window.gtag('event', 'begin_checkout', {
            'send_to': 'AW-16690782587/request_modal_open',
            'value': 1.0,
            'currency': 'USD',
            'custom_parameters': {
              'event_category': 'engagement',
              'event_label': 'request_modal_open',
              'vendor_count': selectedVendors?.length || 0,
              'is_edit_mode': isEditMode,
              'has_vendor': !!vendor
            }
          });
          
          console.log('Google Ads conversion tracking fired for request modal open');
        }
        
        // Also track with Google Tag Manager if available
        if (typeof window !== 'undefined' && window.dataLayer) {
          window.dataLayer.push({
            'event': 'request_modal_open',
            'event_category': 'engagement',
            'event_action': 'begin_checkout',
            'event_label': 'request_modal_open',
            'vendor_count': selectedVendors?.length || 0,
            'is_edit_mode': isEditMode,
            'has_vendor': !!vendor,
            'timestamp': new Date().toISOString()
          });
          
          console.log('Google Tag Manager event pushed for request modal open');
        }
      } catch (trackingError) {
        console.error('Error tracking modal open conversion:', trackingError);
        // Don't fail the modal opening if tracking fails
      }
      
      // Check if we're restoring from a pending request context
      const pendingContext = sessionStorage.getItem('pendingRequestContext');
      if (pendingContext) {
        try {
          const requestData = JSON.parse(pendingContext);
          console.log('RequestModal: Restoring from pending request context:', requestData);
          
          // Restore the form data from the pending context
          if (requestData.formData) {
            console.log('RequestModal: Restoring form data:', requestData.formData);
            setFormData(requestData.formData);
            // Also restore the responses if they exist
            if (requestData.formData.responses) {
              setFormData(prev => ({
                ...prev,
                responses: requestData.formData.responses
              }));
            }
          }
          
          // Determine if we should show event details
          if (requestData.vendor && !requestData.searchFormData) {
            setShowEventDetails(true);
          } else {
            setShowEventDetails(false);
          }
          
          // Clear the pending context since we've restored it
          sessionStorage.removeItem('pendingRequestContext');
          console.log('RequestModal: Successfully restored from pending context');
          return;
        } catch (error) {
          console.error('Error parsing pending request context:', error);
          sessionStorage.removeItem('pendingRequestContext');
        }
      }
      
      if (isEditMode && existingRequestData) {
        // Edit mode: populate with existing request data
        setFormData({
          eventType: existingRequestData.event_type || existingRequestData.eventType || 'Event',
          eventDate: existingRequestData.service_date || existingRequestData.eventDate || '',
          eventTime: existingRequestData.service_time || existingRequestData.eventTime || '',
          location: existingRequestData.location || '',
          guestCount: existingRequestData.guest_count || existingRequestData.guestCount || '',
          responses: existingRequestData.responses || existingRequestData.additional_info || {}
        });
        setShowEventDetails(false); // Skip event details in edit mode
      } else if (searchFormData) {
        // New request mode: populate with search form data
        setFormData({
          eventType: 'Event', // Always set to "Event" for new requests
          eventDate: searchFormData.date || '',
          eventTime: searchFormData.time || '',
          location: searchFormData.location || '',
          guestCount: searchFormData.guestCount || '',
          responses: {}
        });
        // Show event details if vendor is provided (from Portfolio.js)
        setShowEventDetails(!!vendor);
      } else if (vendor) {
        // Portfolio.js flow: no search form data, but vendor provided
        setFormData({
          eventType: 'Event', // Default value
          eventDate: '',
          eventTime: '',
          location: '',
          guestCount: '',
          responses: {}
        });
        setShowEventDetails(true); // Always show event details for Portfolio.js flow
      } else {
        // Fallback: no data provided
        setFormData({
          eventType: 'Event',
          eventDate: '',
          eventTime: '',
          location: '',
          guestCount: '',
          responses: {}
        });
        setShowEventDetails(false);
      }
    }
  }, [isOpen, searchFormData, isEditMode, existingRequestData, vendor]);

  // Expose modal state globally for Google OAuth context preservation
  useEffect(() => {
    if (isOpen) {
      // Store modal state in window object for Google OAuth to access
      window.requestModalFormData = formData;
      window.requestModalSelectedVendors = selectedVendors;
      window.requestModalVendor = vendor;
      window.requestModalIsEditMode = isEditMode;
      window.requestModalExistingRequestData = existingRequestData;
      
      // Cleanup function to remove global references when modal closes
      return () => {
        delete window.requestModalFormData;
        delete window.requestModalSelectedVendors;
        delete window.requestModalVendor;
        delete window.requestModalIsEditMode;
        delete window.requestModalExistingRequestData;
      };
    }
  }, [isOpen, formData, selectedVendors, vendor, isEditMode, existingRequestData]);

  // Check for authenticated user when modal opens
  useEffect(() => {
    if (isOpen) {
      const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user || null;
        console.log('RequestModal: Checking user authentication:', currentUser?.id);
        setUser(currentUser);
        
        // If user is authenticated and we have pending context, we can proceed
        if (currentUser) {
          const pendingContext = sessionStorage.getItem('pendingRequestContext');
          if (pendingContext) {
            console.log('RequestModal: User authenticated, pending context exists');
          }
        }
      };
      checkUser();
      // Reset success state when modal opens
      setIsSuccess(false);
    }
  }, [isOpen]);

  // Event detail questions for Portfolio.js flow
  const eventDetailQuestions = [
    {
      id: 'eventType',
      type: 'select',
      question: 'What type of event are you planning?',
      options: ['Event', 'Wedding', 'Corporate Event', 'Birthday Party', 'Anniversary', 'Graduation', 'Other']
    },
    {
      id: 'eventDate',
      type: 'date',
      question: 'When is your event?',
      placeholder: 'Select date'
    },
    {
      id: 'eventTime',
      type: 'select',
      question: 'What time will your event start?',
      options: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 5 PM)', 'Evening (5 PM - 9 PM)', 'Night (9 PM - 12 AM)', 'Late Night (12 AM - 4 AM)', 'All Day Event']
    },
    {
      id: 'location',
      type: 'text',
      question: 'Where will your event take place?',
      placeholder: 'Enter venue name, city, or address'
    },
    {
      id: 'guestCount',
      type: 'select',
      question: 'How many guests are you expecting?',
      options: ['Under 25', '25-50', '50-100', '100-150', '150-200', '200+', 'Not sure yet']
    }
  ];

  // Check if we should show event details step
  const shouldShowEventDetails = vendor && !searchFormData;

  // Handle event detail answers
  const handleEventDetailAnswer = (questionId, answer) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Handle next step for event details
  const handleEventDetailsNext = () => {
    setShowEventDetails(false);
    setCurrentCategoryIndex(0); // Reset category index to start with first category
    setCurrentQuestionIndex(0); // Reset question index for category questions
  };

  // Handle back from category questions to event details
  const handleBackToEventDetails = () => {
    setShowEventDetails(true);
    setCurrentCategoryIndex(0);
    setCurrentQuestionIndex(0);
  };

  // Define category-specific questions
  const getCategoryQuestions = (category) => {
    // Map vendor values to question set keys
    const categoryMapping = {
      'photographer': 'photography',
      'videographer': 'videography', 
      'caterer': 'catering',
      'planner': 'weddingplanning',
      'dj': 'dj',
      'florist': 'florist',
      'beauty': 'beauty',
      'venue': 'venue'
    };
    
    const mappedCategory = categoryMapping[category] || category;
    
    const questionSets = {
      'photography': [
        {
          id: 'coverageHours',
          type: 'select',
          question: 'How many hours of photography coverage do you need?',
          options: ['4-6 hours', '6-8 hours', '8-10 hours', '10+ hours', 'Full day coverage']
        },
        {
          id: 'budget',
          type: 'budget',
          question: 'What\'s your photography budget range?',
          options: ['Under $1,500', '$1,500 - $3,000', '$3,000 - $5,000', '$5,000 - $8,000', '$8,000+', 'Open to options']
        },
        {
          id: 'photos',
          type: 'photo',
          question: 'Share inspiration photos to help photographers understand your vision'
        },
        {
          id: 'description',
          type: 'text',
          question: 'Tell us more about your photography needs and any special requests'
        }
      ],
      'videography': [
        {
          id: 'coverageHours',
          type: 'select',
          question: 'How many hours of videography coverage do you need?',
          options: ['2-4 hours', '4-6 hours', '6-8 hours', '8-10 hours', '10+ hours', 'Full day coverage', 'Not sure - need recommendations']
        },
        {
          id: 'budget',
          type: 'budget',
          question: 'What\'s your videography budget range?',
          options: ['Under $2,000', '$2,000 - $4,000', '$4,000 - $7,000', '$7,000 - $10,000', '$10,000+', 'Open to options']
        },
        {
          id: 'photos',
          type: 'photo',
          question: 'Share inspiration photos or videos to help videographers understand your vision'
        },
        {
          id: 'description',
          type: 'text',
          question: 'Tell us more about your videography needs and any special requests'
        }
      ],
      'dj': [
        {
          id: 'services',
          type: 'multiple',
          question: 'What DJ services do you need?',
          options: ['Ceremony music', 'Cocktail hour', 'Reception dancing', 'MC services', 'Lighting']
        },
        {
          id: 'musicStyle',
          type: 'text',
          question: 'What music genres or specific songs are must-haves for your event?'
        },
        {
          id: 'budget',
          type: 'budget',
          question: 'What\'s your DJ budget range?',
          options: ['Under $800', '$800 - $1,500', '$1,500 - $2,500', '$2,500 - $4,000', '$4,000+', 'Open to options']
        },
        {
          id: 'description',
          type: 'text',
          question: 'Tell us more about your DJ needs and any special requests'
        }
      ],
      'catering': [
        {
          id: 'serviceStyle',
          type: 'select',
          question: 'What catering service style do you prefer?',
          options: ['Plated dinner', 'Buffet style', 'Family style', 'Cocktail reception', 'Food stations', 'Open to Options']
        },
        {
          id: 'cuisineType',
          type: 'text',
          question: 'Do you have a specific cuisine or style of food in mind? (Optional - leave blank if open to suggestions)'
        },
        {
          id: 'wantsDessert',
          type: 'select',
          question: 'Would you like dessert/sweets included in your catering?',
          options: ['Yes', 'No', 'Maybe - depends on options']
        },
        {
          id: 'dessertPreferences',
          type: 'text',
          question: 'What dessert or sweets would you like? (Optional - leave blank if you want suggestions)',
          conditional: true,
          showWhen: 'wantsDessert',
          showValue: 'Yes'
        },
        {
          id: 'budget',
          type: 'budget',
          question: 'What\'s your total catering budget?',
          options: ['Under $1,000', '$1,000 - $2,500', '$2,500 - $5,000', '$5,000 - $7,500', '$7,500 - $10,000', '$10,000+', 'Open to options']
        },
        {
          id: 'description',
          type: 'text',
          question: 'Tell us more about your catering needs and any special requests'
        }
      ],
      'florist': [
        {
          id: 'arrangements',
          type: 'quantity',
          question: 'What floral arrangements do you need and how many?',
          options: [
            'Bridal bouquet', 
            'Bridesmaids bouquets', 
            'Boutonnieres', 
            'Centerpieces', 
            'Ceremony arch/backdrop', 
            'Aisle petals/runner', 
            'Corsages',
            'Altar arrangements',
            'Reception arrangements',
            'Welcome sign florals',
            'Other (specify on next page)'
          ]
        },
        {
          id: 'customArrangements',
          type: 'text',
          question: 'Please specify any other floral arrangements you need (one per line)',
          conditional: true,
          showWhen: 'arrangements',
          showValue: 'Other (specify on next page)'
        },
        {
          id: 'colorScheme',
          type: 'text',
          question: 'What colors or theme do you have in mind for your flowers?'
        },
        {
          id: 'budget',
          type: 'budget',
          question: 'What\'s your floral budget range?',
          options: ['Under $500', '$500 - $1,000', '$1,000 - $2,000', '$2,000 - $3,500', '$3,500+', 'Open to options']
        },
        {
          id: 'photos',
          type: 'photo',
          question: 'Share inspiration photos to help florists understand your style and vision'
        },
        {
          id: 'description',
          type: 'text',
          question: 'Tell us more about your floral needs and any special requests'
        }
      ],
      'venue': [
        {
          id: 'venueType',
          type: 'multiple',
          question: 'What type of venue are you looking for?',
          options: ['Indoor', 'Outdoor', 'Historic', 'Modern', 'Rustic', 'Garden', 'Ballroom']
        },
        {
          id: 'capacity',
          type: 'select',
          question: 'What guest capacity do you need?',
          options: ['Under 50', '50-100', '100-150', '150-200', '200+']
        },
        {
          id: 'budget',
          type: 'budget',
          question: 'What\'s your venue budget range?',
          options: ['Under $2,000', '$2,000 - $5,000', '$5,000 - $8,000', '$8,000 - $12,000', '$12,000+', 'Open to options']
        },
        {
          id: 'description',
          type: 'text',
          question: 'Tell us more about your venue needs and any special requests'
        }
      ],
      'beauty': [
        {
          id: 'services',
          type: 'multiple',
          question: 'What beauty services do you need?',
          options: ['Bridal makeup', 'Bridal hair', 'Bridesmaids makeup', 'Bridesmaids hair', 'Trial session']
        },
        {
          id: 'style',
          type: 'select',
          question: 'What makeup style do you prefer?',
          options: ['Natural/Romantic', 'Glamorous', 'Classic', 'Bold/Dramatic', 'Vintage']
        },
        {
          id: 'budget',
          type: 'budget',
          question: 'What\'s your beauty services budget?',
          options: ['Under $300', '$300 - $600', '$600 - $1,000', '$1,000 - $1,500', '$1,500+', 'Open to options']
        },
        {
          id: 'photos',
          type: 'photo',
          question: 'Share inspiration photos for your desired hair and makeup look'
        },
        {
          id: 'description',
          type: 'text',
          question: 'Tell us more about your beauty needs and any special requests'
        }
      ],
      'weddingplanning': [
        {
          id: 'serviceLevel',
          type: 'select',
          question: 'What level of planning assistance do you need?',
          options: ['Full planning', 'Partial planning', 'Day-of coordination', 'Month-of coordination']
        },
        {
          id: 'planningStage',
          type: 'select',
          question: 'What stage are you in your planning?',
          options: ['Just engaged', 'Early planning (6+ months out)', 'Mid planning (3-6 months)', 'Final details (1-3 months)', 'Last minute (under 1 month)']
        },
        {
          id: 'totalEventBudget',
          type: 'select',
          question: 'What\'s your total wedding/event budget?',
          options: ['Under $10,000', '$10,000 - $20,000', '$20,000 - $35,000', '$35,000 - $50,000', '$50,000 - $75,000', '$75,000+', 'Prefer not to say']
        },
        {
          id: 'plannerBudget',
          type: 'select',
          question: 'What\'s your budget for wedding planning services?',
          options: ['Under $1,500', '$1,500 - $3,000', '$3,000 - $6,000', '$6,000 - $10,000', '$10,000+', 'Open to options']
        },
        {
          id: 'description',
          type: 'text',
          question: 'Tell us more about your wedding planning needs and any special requests'
        }
      ]
    };
    
    const questions = questionSets[mappedCategory] || [];
    
    // Filter conditional questions based on current responses
    return questions.filter(question => {
      if (!question.conditional) return true;
      
      // Use the original category name for responses, not the mapped one
      const currentCategoryResponses = formData.responses?.[category] || {};
      const triggerAnswer = currentCategoryResponses[question.showWhen];
      
      if (question.showWhen === 'arrangements' && question.showValue === 'Other (specify on next page)') {
        // Show if "Other (specify on next page)" is selected in arrangements
        return triggerAnswer && typeof triggerAnswer === 'object' && triggerAnswer['Other (specify on next page)'] === 'selected';
      }
      
      if (question.showWhen === 'wantsDessert' && question.showValue === 'Yes') {
        // Show dessert preferences if user wants dessert
        return triggerAnswer === 'Yes';
      }
      

      
      return false;
    });
  };

  const handleAnswer = (questionId, answer) => {
    const currentCategory = selectedVendors[currentCategoryIndex];
    setFormData(prev => {
      const newFormData = {
      ...prev,
      responses: {
        ...prev.responses,
        [currentCategory]: {
          ...prev.responses[currentCategory],
          [questionId]: answer
        }
      }
      };
      return newFormData;
    });
  };

  const handleFileSelect = async (event, category) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const newPhotos = files.map((file) => ({
      file: file,
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
    }));

    const currentAnswer = formData.responses?.[category]?.photos || [];
    handleAnswer('photos', [...currentAnswer, ...newPhotos]);
  };

  const handleRemovePhoto = (index, category) => {
    const currentPhotos = formData.responses?.[category]?.photos || [];
    const updatedPhotos = currentPhotos.filter((_, i) => i !== index);
    handleAnswer('photos', updatedPhotos);
  };

  const handleNext = () => {
    if (showEventDetails) {
      // Handle navigation within event details
      if (currentQuestionIndex < eventDetailQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Move from event details to category questions or back to review
        if (shouldShowEventDetails) {
          // Portfolio.js flow: move to category questions
          handleEventDetailsNext();
        } else {
          // Edit flow: go back to review
          setIsReviewStep(true);
        }
      }
    } else {
      // Handle navigation within category questions (existing logic)
      const currentCategory = selectedVendors[currentCategoryIndex];
      const categoryQuestions = getCategoryQuestions(currentCategory);
      
      // Check if we're at the last question of current category
      if (currentQuestionIndex < categoryQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Move to next category or review
        if (currentCategoryIndex < selectedVendors.length - 1) {
          setCurrentCategoryIndex(currentCategoryIndex + 1);
          setCurrentQuestionIndex(0);
        } else {
          setIsReviewStep(true);
        }
      }
    }
  };

  const handleBack = () => {
    if (isReviewStep) {
      setIsReviewStep(false);
      // Go back to last question of last category
      setCurrentCategoryIndex(selectedVendors.length - 1);
      const lastCategory = selectedVendors[selectedVendors.length - 1];
      const lastCategoryQuestions = getCategoryQuestions(lastCategory);
      setCurrentQuestionIndex(lastCategoryQuestions.length - 1);
    } else if (showEventDetails) {
      // Handle navigation within event details
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      } else {
        // Can't go back from first event question
        return;
      }
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
      const prevCategory = selectedVendors[currentCategoryIndex - 1];
      const prevCategoryQuestions = getCategoryQuestions(prevCategory);
      setCurrentQuestionIndex(prevCategoryQuestions.length - 1);
    } else if (vendor && shouldShowEventDetails) {
      // Go back to event details from first category question (Portfolio.js flow only)
      handleBackToEventDetails();
    }
  };

  // Helper function to send email notifications
  const sendEmailNotification = async (recipientEmail, subject, htmlContent) => {
    try {
      await fetch('https://bidi-express.vercel.app/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientEmail, subject, htmlContent }),
      });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  // Helper to notify all businesses in a category with a personalized, branded email
  const notifyBusinessesOfRequest = async (category, requestFormData) => {
    // Extract request details for the email (Budget, Location, Date)
    const categoryResponses = requestFormData.responses?.[category] || {};
    
    // Budget logic
    let budget = 'Not specified';
    let budgetAmount = 0; // For comparison with minimum budget requirements
    if (categoryResponses.budget) {
      if (typeof categoryResponses.budget === 'object' && categoryResponses.budget?.type === 'custom') {
        budget = `$${categoryResponses.budget.min} - $${categoryResponses.budget.max}`;
        budgetAmount = categoryResponses.budget.min; // Use minimum for comparison
      } else {
        budget = categoryResponses.budget;
        // Extract numeric value from budget string if possible
        const budgetMatch = budget.toString().match(/\$?(\d+)/);
        if (budgetMatch) {
          budgetAmount = parseInt(budgetMatch[1]);
        }
      }
    }
    
    // Location
    const location = requestFormData.location || 'Not specified';

    // Date logic
    function formatDateString(dateString) {
      if (!dateString) return 'Not specified';
      const [year, month, day] = dateString.split('-');
      return `${month}/${day}/${year}`;
    }
    let date = 'Not specified';
    if (requestFormData.eventDate) {
      date = formatDateString(requestFormData.eventDate);
    }

    // Map category names for business profile lookup
    const categoryMapping = {
      'photographer': 'photography',
      'videographer': 'videography', 
      'caterer': 'catering',
      'planner': 'wedding planner/coordinator',
      'dj': 'dj',
      'florist': 'florist',
      'beauty': 'beauty',
      'venue': 'venue'
    };
    
    const businessCategory = categoryMapping[category] || category;

    // Fetch all businesses in the category, including their notification preferences
    const { data: businesses, error } = await supabase
      .from('business_profiles')
      .select('business_name, business_category, id, profiles(email), notification_preferences')
      .contains('business_category', [businessCategory]);

    if (error) {
      console.error('Error fetching businesses:', error);
      return;
    }

    // Filter businesses based on notification preferences
    const eligibleBusinesses = businesses.filter(business => {
      // Must have an email
      if (!business.profiles?.email) {
        return false;
      }

      // Get notification preferences (default to enabled if not set)
      const preferences = business.notification_preferences || {};
      const emailEnabled = preferences.emailNotifications !== false; // Default to true if not specified
      const notifyOnNewRequests = preferences.notifyOnNewRequests !== false; // Default to true if not specified
      const minimumBudget = preferences.minimumBudgetForNotifications || 0;

      // Check if email notifications are enabled and they want new request notifications
      if (!emailEnabled || !notifyOnNewRequests) {
        return false;
      }

      // Check if budget meets minimum requirement
      if (budgetAmount > 0 && budgetAmount < minimumBudget) {
        return false;
      }

      return true;
    });

    console.log(`Found ${businesses.length} businesses in category, ${eligibleBusinesses.length} eligible for notifications`);

    // Build the businesses array for the API (only eligible businesses)
    const businessPayload = eligibleBusinesses.map(business => ({
      email: business.profiles.email,
      businessName: business.business_name,
      budget,
      location,
      date
    }));

    // Only send emails if there are eligible businesses
    if (businessPayload.length > 0) {
      // POST to the new API contract
      await fetch('https://bidi-express.vercel.app/api/send-resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: businessCategory,
          businesses: businessPayload
        })
      });
    } else {
      console.log('No businesses eligible for email notifications based on preferences');
    }
  };

  // Helper to trigger autobids for a specific request
  const triggerAutobids = async (requestId, category) => {
    try {
      console.log(`Triggering autobids for ${category} request: ${requestId}`);
      
      const response = await fetch('https://bidi-express.vercel.app/trigger-autobid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Autobid trigger result for ${category}:`, result);
      
    } catch (error) {
      console.error(`Error triggering autobids for ${category}:`, error);
    }
  };

  const submitRequest = async (authenticatedUser) => {
    setIsSubmitting(true);
    try {
      // Process each selected vendor category
      for (const category of selectedVendors) {
        const categoryResponses = formData.responses[category] || {};
        
        // Map category names first (needed for table and field mapping)
        const categoryMapping = {
          'photographer': 'photography',
          'videographer': 'videography', 
          'caterer': 'catering',
          'planner': 'weddingplanning',
          'dj': 'dj',
          'florist': 'florist',
          'beauty': 'beauty',
          'venue': 'venue'
        };
        
        const mappedCategory = categoryMapping[category] || category.toLowerCase().replace(/\s+/g, '');
        
        // Create base request data common to all categories
        // Note: photography_requests uses profile_id instead of user_id
        // Note: catering_requests uses title instead of event_title
        const baseRequestData = {
          user_id: authenticatedUser.id,
          status: 'pending',
          event_type: 'Event', // Always set to "Event"
          event_title: `Event - ${category.charAt(0).toUpperCase() + category.slice(1)} Request`,
          location: formData.location,
          date_flexibility: formData.dateFlexibility,
          date_timeframe: formData.dateTimeframe,
          start_date: formData.eventDate || null, // Handle empty string as null
          // indoor_outdoor: Only include for tables that have this column
          ...(['photography', 'videography', 'dj'].includes(mappedCategory) ? { indoor_outdoor: formData.indoorOutdoor } : {}),
          price_range: typeof categoryResponses.budget === 'object' && categoryResponses.budget?.type === 'custom' 
            ? `$${categoryResponses.budget.min} - $${categoryResponses.budget.max}`
            : categoryResponses.budget,
          additional_comments: categoryResponses.description,
          coupon_code: formData.couponCode
        };

        // Add category-specific fields based on the schema
        let categorySpecificData = {};
        
        console.log(`Processing category: ${category} -> mapped: ${mappedCategory}`);
        console.log('Category responses:', categoryResponses);
        
        switch(mappedCategory) {
          case 'photography':
            categorySpecificData = {
              profile_id: authenticatedUser.id, // photography_requests uses profile_id instead of user_id
              date_type: formData.dateFlexibility,
              time_of_day: formData.eventTime,
              num_people: parseInt(formData.guestCount) || null,
              duration: categoryResponses.coverageHours, // Maps to coverage hours question
              extras: categoryResponses.extras ? JSON.stringify(categoryResponses.extras) : null,
              style_preferences: null, // Removed photoStyle question - using inspiration photos instead
              deliverables: categoryResponses.deliverables ? JSON.stringify(categoryResponses.deliverables) : null,
              wedding_details: categoryResponses.weddingDetails ? JSON.stringify(categoryResponses.weddingDetails) : null,
              start_time: formData.eventTime,
              end_time: formData.endTime,
              start_time_unknown: !formData.eventTime,
              end_time_unknown: !formData.endTime,
              duration_unknown: !categoryResponses.coverageHours,
              num_people_unknown: !formData.guestCount,
              second_photographer: categoryResponses.secondPhotographer,
              second_photographer_unknown: !categoryResponses.secondPhotographer,
              additional_info: categoryResponses.description
            };
            break;

          case 'videography':
            categorySpecificData = {
              time_of_day: formData.eventTime,
              num_people: parseInt(formData.guestCount) || null,
              duration: parseInt(categoryResponses.coverageHours?.replace(/[^\d]/g, '')) || null, // Extract hours from coverage hours
              style_preferences: null, // Removed videoStyle question - using inspiration photos instead
              deliverables: categoryResponses.deliverables ? JSON.stringify(categoryResponses.deliverables) : null,
              wedding_details: categoryResponses.weddingDetails ? JSON.stringify(categoryResponses.weddingDetails) : null,
              coverage: categoryResponses.coverage ? JSON.stringify(categoryResponses.coverage) : null,
              start_time: formData.eventTime,
              end_time: formData.endTime,
              start_time_unknown: !formData.eventTime,
              end_time_unknown: !formData.endTime,
              duration_unknown: !categoryResponses.coverageHours,
              num_people_unknown: !formData.guestCount,
              additional_info: categoryResponses.description,
              date_type: formData.dateFlexibility
            };
            break;

          case 'beauty':
            categorySpecificData = {
              service_type: categoryResponses.services ? JSON.stringify(categoryResponses.services) : null, // Maps to services question
              hairstyle_preferences: categoryResponses.hairstylePreferences,
              hair_length_type: categoryResponses.hairLengthType,
              extensions_needed: categoryResponses.extensionsNeeded,
              trial_session_hair: categoryResponses.trialSessionHair,
              makeup_style_preferences: categoryResponses.style, // Maps to style question
              skin_type_concerns: categoryResponses.skinTypeConcerns,
              preferred_products_allergies: categoryResponses.preferredProductsAllergies,
              lashes_included: categoryResponses.lashesIncluded,
              trial_session_makeup: categoryResponses.trialSessionMakeup,
              group_discount_inquiry: categoryResponses.groupDiscountInquiry,
              on_site_service_needed: categoryResponses.onSiteServiceNeeded,
              num_people: parseInt(formData.guestCount) || null,
              specific_time_needed: !!formData.eventTime,
              specific_time: formData.eventTime,
              start_date: formData.eventDate ? new Date(formData.eventDate).toISOString() : null,
              end_date: formData.endDate ? new Date(formData.endDate).toISOString() : null
            };
            break;

          case 'florist':
            categorySpecificData = {
              flower_preferences: categoryResponses.flowerPreferences ? JSON.stringify(categoryResponses.flowerPreferences) : null,
              floral_arrangements: categoryResponses.arrangements ? JSON.stringify(categoryResponses.arrangements) : null, // Maps to arrangements quantity question
              additional_services: categoryResponses.additionalServices ? JSON.stringify(categoryResponses.additionalServices) : null,
              colors: categoryResponses.colorScheme ? JSON.stringify([categoryResponses.colorScheme]) : null, // Maps to colorScheme question
              flower_preferences_text: categoryResponses.customArrangements, // Maps to customArrangements question
              specific_time_needed: !!formData.eventTime,
              specific_time: formData.eventTime,
              start_date: formData.eventDate || null,
              end_date: formData.endDate || null
            };
            break;

          case 'catering':
            categorySpecificData = {
              event_duration: parseInt(categoryResponses.duration) || null,
              estimated_guests: parseInt(formData.guestCount) || null,
              food_preferences: categoryResponses.cuisineType ? JSON.stringify([categoryResponses.cuisineType]) : null, // Maps to cuisineType question
              special_requests: (() => {
                const requests = [];
                if (categoryResponses.wantsDessert === 'Yes') {
                  requests.push('WANTS_DESSERT: true');
                  if (categoryResponses.dessertPreferences) {
                    requests.push(`Dessert preferences: ${categoryResponses.dessertPreferences}`);
                  }
                } else if (categoryResponses.wantsDessert === 'No') {
                  requests.push('WANTS_DESSERT: false');
                }
                return requests.length > 0 ? JSON.stringify(requests) : null;
              })(),
              equipment_needed: categoryResponses.equipmentNeeded,
              setup_cleanup: categoryResponses.setupCleanup,
              food_service_type: categoryResponses.serviceStyle, // Maps to serviceStyle question
              serving_staff: categoryResponses.servingStaff,
              dining_items: categoryResponses.diningItems,
              dining_items_notes: categoryResponses.diningItemsNotes,
              additional_comments: categoryResponses.description, // Changed from additional_info to additional_comments to match schema
              additional_services: categoryResponses.additionalServices ? JSON.stringify(categoryResponses.additionalServices) : null,
              dietary_restrictions: categoryResponses.dietaryRestrictions,
              equipment_notes: categoryResponses.equipmentNotes,
              other_dietary_details: categoryResponses.otherDietaryDetails,
              start_date: formData.eventDate || null,
              end_date: formData.endDate || null
            };
            break;

          case 'dj':
            categorySpecificData = {
              title: `Event - DJ Request`,
              event_duration: parseInt(categoryResponses.duration) || null,
              estimated_guests: parseInt(formData.guestCount) || null,
              music_preferences: categoryResponses.musicStyle ? JSON.stringify([categoryResponses.musicStyle]) : null, // Maps to musicStyle question
              special_songs: categoryResponses.specialSongs ? JSON.stringify(categoryResponses.specialSongs) : null,
              additional_services: categoryResponses.services || [], // Maps to services question
              equipment_needed: categoryResponses.equipmentNeeded,
              equipment_notes: categoryResponses.equipmentNotes,
              special_requests: categoryResponses.description,
              budget_range: typeof categoryResponses.budget === 'object' && categoryResponses.budget?.type === 'custom' 
                ? `$${categoryResponses.budget.min} - $${categoryResponses.budget.max}`
                : categoryResponses.budget,
              start_date: formData.eventDate || null,
              end_date: formData.endDate || null
            };
            break;

          case 'weddingplanning':
            categorySpecificData = {
              planning_level: categoryResponses.serviceLevel,
              experience_level: categoryResponses.planningStage,
              budget_range: categoryResponses.totalEventBudget,
              planner_budget: categoryResponses.plannerBudget,
              guest_count: parseInt(formData.guestCount) || null,
              venue_status: categoryResponses.venueStatus,
              vendor_preferences: categoryResponses.vendorPreferences ? JSON.stringify(categoryResponses.vendorPreferences) : null,
              additional_events: categoryResponses.additionalEvents ? JSON.stringify(categoryResponses.additionalEvents) : null,
              wedding_style: categoryResponses.weddingStyle,
              color_scheme: categoryResponses.colorScheme,
              theme_preferences: categoryResponses.themePreferences,
              communication_style: categoryResponses.communicationStyle,
              start_date: formData.eventDate || null,
              end_date: formData.endDate || null,
              start_time: formData.startTime,
              end_time: formData.endTime
            };
            break;
        }

        // Combine base and category-specific data
        // Special handling for different table schemas
        let requestData;
        
        if (mappedCategory === 'photography') {
          // Photography uses profile_id instead of user_id and has pinterest_link
          const { user_id, ...baseDataWithoutUserId } = baseRequestData;
          requestData = {
            ...baseDataWithoutUserId,
            pinterest_link: formData.pinterestLink, // Photography table has pinterest_link
            ...categorySpecificData
          };
        } else if (mappedCategory === 'catering' || mappedCategory === 'dj') {
          // Catering and DJ use title instead of event_title, and budget_range instead of price_range
          const { event_title, price_range, ...baseDataWithoutSpecialFields } = baseRequestData;
          requestData = {
            ...baseDataWithoutSpecialFields,
            title: event_title, // Map event_title to title for catering and dj
            budget_range: price_range, // Map price_range to budget_range for both catering and dj
            ...categorySpecificData
          };
        } else {
          // Standard mapping - check if table has pinterest_link
          const hasCustomFields = ['videography', 'beauty', 'florist'].includes(mappedCategory);
          requestData = {
            ...baseRequestData,
            ...(hasCustomFields && formData.pinterestLink ? { pinterest_link: formData.pinterestLink } : {}),
            ...categorySpecificData
          };
        }

        // Insert request into appropriate table
        let tableName;
        if (mappedCategory === 'weddingplanning') {
          tableName = 'wedding_planning_requests';
        } else if (mappedCategory === 'photography') {
          tableName = 'photography_requests';
        } else if (mappedCategory === 'videography') {
          tableName = 'videography_requests';
        } else if (mappedCategory === 'beauty') {
          tableName = 'beauty_requests';
        } else if (mappedCategory === 'florist') {
          tableName = 'florist_requests';
        } else if (mappedCategory === 'catering') {
          tableName = 'catering_requests';
        } else if (mappedCategory === 'dj') {
          tableName = 'dj_requests';
        } else {
          tableName = `${mappedCategory}_requests`;
        }

        let newRequest;
        let requestError;

        if (isEditMode && existingRequestData) {
          // Update existing request
          console.log(`Updating ${category} request in ${tableName}:`, requestData);
          const { data, error } = await supabase
            .from(tableName)
            .update(requestData)
            .eq('id', existingRequestData.id)
            .select()
            .single();
          
          newRequest = data;
          requestError = error;
        } else {
          // Insert new request
          console.log(`Inserting ${category} request into ${tableName}:`, requestData);
          const { data, error } = await supabase
            .from(tableName)
            .insert([requestData])
            .select()
            .single();
          
          newRequest = data;
          requestError = error;
        }

        if (requestError) {
          console.error(`Error inserting ${category} request:`, requestError);
          console.error('Request data that failed:', requestData);
          throw requestError;
        }

        console.log(`Successfully inserted ${category} request:`, newRequest);

        // Trigger autobids for the request
        await triggerAutobids(newRequest.id, mappedCategory);

        // Notify businesses in the category with personalized email
        await notifyBusinessesOfRequest(category, formData);

        // Handle photo uploads if any exist for this category
        const categoryPhotos = categoryResponses.photos || [];
        console.log(`Found ${categoryPhotos.length} photos for ${category}:`, categoryPhotos);
        
        if (categoryPhotos.length > 0) {
          console.log('Starting photo upload process...');
          
          const uploadPromises = categoryPhotos.map(async (photo, index) => {
            try {
              console.log(`Processing photo ${index + 1}:`, photo);
              
              // Check if photo has required properties
              if (!photo.file || !photo.name) {
                console.error('Photo missing file or name:', photo);
                throw new Error('Photo missing required properties');
              }
              
              const fileExt = photo.name.split('.').pop();
              const fileName = `${uuidv4()}.${fileExt}`;
              const filePath = `${authenticatedUser.id}/${newRequest.id}/${fileName}`;

              console.log(`Uploading to path: ${filePath}`);
              
              // Check if bucket exists and is accessible
              const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
              if (bucketsError) {
                console.error('Error listing buckets:', bucketsError);
              } else {
                console.log('Available buckets:', buckets);
                const requestMediaBucket = buckets.find(bucket => bucket.name === 'request-media');
                if (!requestMediaBucket) {
                  console.error('request-media bucket not found!');
                }
              }

              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('request-media')
                .upload(filePath, photo.file);

              if (uploadError) {
                console.error('Photo upload error:', uploadError);
                throw uploadError;
              }

              console.log('Upload successful:', uploadData);

              const { data: { publicUrl } } = supabase.storage
                .from('request-media')
                .getPublicUrl(filePath);

              console.log('Public URL generated:', publicUrl);

              // Store photo information in appropriate table
              let photoTable;
              
              if (mappedCategory === 'photography') {
                photoTable = 'event_photos'; // Correct table for photography photos
              } else {
                photoTable = `${mappedCategory}_photos`;
              }
              
              console.log(`Inserting photo record into ${photoTable}...`);
              
              const { data: photoRecord, error: photoError } = await supabase
                .from(photoTable)
                .insert([{
                  request_id: newRequest.id,
                  user_id: authenticatedUser.id,
                  photo_url: publicUrl,
                  file_path: filePath
                }])
                .select();

              if (photoError) {
                console.error('Photo database insertion error:', photoError);
                throw photoError;
              }

              console.log(`Photo record inserted successfully into ${photoTable}:`, photoRecord);
              return photoRecord;
            } catch (error) {
              console.error(`Error processing photo ${index + 1}:`, error);
              throw error;
            }
          });

          await Promise.all(uploadPromises);
          console.log('All photos processed successfully');
        } else {
          console.log('No photos to upload for this category');
        }
      }

      // Success - show success slide
      setIsSuccess(true);
      
      // Google Ads Conversion Tracking - Track successful request submission
      try {
        // Check if gtag is available (Google Ads conversion tracking)
        if (typeof window !== 'undefined' && window.gtag) {
          // Track conversion for request submission
          window.gtag('event', 'conversion', {
            'send_to': 'AW-16690782587/request_submission',
            'value': 1.0,
            'currency': 'USD',
            'transaction_id': `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            'custom_parameters': {
              'event_category': 'request_submission',
              'event_label': selectedVendors.join(','),
              'vendor_count': selectedVendors.length,
              'event_type': formData.eventType || 'Event',
              'location': formData.location || 'Not specified'
            }
          });
          
          console.log('Google Ads conversion tracking fired for request submission');
        }
        
        // Also track with Google Tag Manager if available
        if (typeof window !== 'undefined' && window.dataLayer) {
          window.dataLayer.push({
            'event': 'request_submission',
            'event_category': 'conversion',
            'event_action': 'submit_request',
            'event_label': selectedVendors.join(','),
            'vendor_count': selectedVendors.length,
            'event_type': formData.eventType || 'Event',
            'location': formData.location || 'Not specified',
            'user_id': authenticatedUser?.id || 'anonymous',
            'timestamp': new Date().toISOString()
          });
          
          console.log('Google Tag Manager event pushed for request submission');
        }
      } catch (trackingError) {
        console.error('Error tracking conversion:', trackingError);
        // Don't fail the request submission if tracking fails
      }
      
      // Don't close modal yet - let user see success slide

    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    // Check if user is authenticated
    if (!user) {
      // Store request context before showing auth modal
      const requestContext = {
        selectedVendors,
        searchFormData,
        vendor,
        isEditMode,
        existingRequestData,
        formData,
        timestamp: Date.now()
      };
      console.log('RequestModal: Storing request context:', requestContext);
      sessionStorage.setItem('pendingRequestContext', JSON.stringify(requestContext));
      setShowAuthModal(true);
      return;
    }

    await submitRequest(user);
  };

  const handleAuthSuccess = async (userData) => {
    setUser(userData);
    setShowAuthModal(false);
    
    // Google Ads Conversion Tracking - Track successful authentication
    try {
      // Check if gtag is available (Google Ads conversion tracking)
      if (typeof window !== 'undefined' && window.gtag) {
        // Track conversion for authentication
        window.gtag('event', 'conversion', {
          'send_to': 'AW-16690782587/auth_success',
          'value': 1.0,
          'currency': 'USD',
          'transaction_id': `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          'custom_parameters': {
            'event_category': 'authentication',
            'event_label': 'request_modal_auth',
            'auth_method': 'google_oauth',
            'user_id': userData?.id || 'unknown'
          }
        });
        
        console.log('Google Ads conversion tracking fired for authentication success');
      }
      
      // Also track with Google Tag Manager if available
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          'event': 'authentication_success',
          'event_category': 'conversion',
          'event_action': 'auth_success',
          'event_label': 'request_modal_auth',
          'auth_method': 'google_oauth',
          'user_id': userData?.id || 'unknown',
          'timestamp': new Date().toISOString()
        });
        
        console.log('Google Tag Manager event pushed for authentication success');
      }
    } catch (trackingError) {
      console.error('Error tracking authentication conversion:', trackingError);
      // Don't fail the authentication if tracking fails
    }
    
    // Automatically submit the request after successful authentication
    setTimeout(async () => {
      await submitRequest(userData);
    }, 500); // Small delay to ensure UI updates smoothly
  };

  // Calculate current question info with useMemo for reactivity
  const currentCategory = selectedVendors?.[currentCategoryIndex];
  const categoryQuestions = useMemo(() => 
    currentCategory ? getCategoryQuestions(currentCategory) : [], 
    [currentCategory, formData.responses]
  );
  const currentQuestion = !isReviewStep && !showEventDetails && categoryQuestions && currentQuestionIndex < categoryQuestions.length ? categoryQuestions[currentQuestionIndex] : null;
  
  // Debug logging
  console.log('RequestModal Debug:', {
    isReviewStep,
    showEventDetails,
    currentCategory,
    currentCategoryIndex,
    currentQuestionIndex,
    categoryQuestions: categoryQuestions?.length || 0,
    selectedVendors,
    currentQuestion: !!currentQuestion
  });
  const totalQuestions = useMemo(() => {
    let total = 0;
    // Only include event detail questions if we're showing them (Portfolio.js flow)
    if (shouldShowEventDetails) {
      total += eventDetailQuestions.length;
    }
    if (selectedVendors) {
      total += selectedVendors.reduce((total, vendor) => total + getCategoryQuestions(vendor).length, 0);
    }
    return total;
  }, [selectedVendors, formData.responses, eventDetailQuestions.length, shouldShowEventDetails]);
  
  const currentQuestionNumber = useMemo(() => {
    let questionNumber = 0;
    
    // If we're showing event details (Portfolio.js flow), count those questions
    if (showEventDetails && shouldShowEventDetails) {
      questionNumber = currentQuestionIndex + 1;
    } else if (selectedVendors) {
      // If we're past event details, add the completed event details to the count
      if (shouldShowEventDetails) {
        questionNumber += eventDetailQuestions.length;
      }
      
      // Add completed vendor categories
      questionNumber += selectedVendors.slice(0, currentCategoryIndex).reduce((total, vendor) => total + getCategoryQuestions(vendor).length, 0);
      
      // Add current question within current category
      questionNumber += currentQuestionIndex + 1;
    }
    
    return questionNumber;
  }, [selectedVendors, currentCategoryIndex, currentQuestionIndex, formData.responses, showEventDetails, shouldShowEventDetails, eventDetailQuestions.length]);

  if (!isOpen) {
    console.log('RequestModal: Modal not open, returning null');
    return null;
  }

  // Handle case where no vendors are selected
  if (!selectedVendors || selectedVendors.length === 0) {
    return (
      <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50 tw-p-4">
        <div className="tw-bg-white tw-rounded-lg tw-w-full tw-max-w-md tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
            <h2 className="tw-text-xl tw-font-bold" style={{ color: colors.gray[800] }}>
              No Services Selected
            </h2>
            <button
              onClick={onClose}
              className="tw-p-2 tw-rounded-full tw-bg-gray-100 hover:tw-bg-gray-200 tw-transition-colors tw-border-none"
            >
              <FiX size={20} />
            </button>
          </div>
          <p className="tw-text-gray-600 tw-mb-4">
            Please select at least one vendor service from the search bar before requesting quotes.
          </p>
          <button
            onClick={onClose}
            className="tw-w-full tw-py-2 tw-px-4 tw-rounded-lg tw-text-white tw-font-medium tw-border-none"
            style={{ backgroundColor: colors.primary }}
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  const renderQuestion = () => {
    if (!currentQuestion) {
      return (
        <div className="tw-text-center tw-py-8">
          <p className="tw-text-gray-600">
            No questions available for {currentCategory}. 
            <br />
            <small className="tw-text-xs">Debug: Selected vendors: {JSON.stringify(selectedVendors)}</small>
            <br />
            <small className="tw-text-xs">Debug: currentCategoryIndex: {currentCategoryIndex}, currentQuestionIndex: {currentQuestionIndex}</small>
            <br />
            <small className="tw-text-xs">Debug: categoryQuestions length: {categoryQuestions?.length || 0}</small>
            <br />
            <small className="tw-text-xs">Debug: showEventDetails: {showEventDetails.toString()}</small>
          </p>
        </div>
      );
    }

    const currentAnswer = formData.responses?.[currentCategory]?.[currentQuestion.id] || '';

    const handleSelectAnswer = (value) => {
      handleAnswer(currentQuestion.id, value);
    };

    const handleMultipleAnswer = (value) => {
      const currentAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
      const newAnswers = currentAnswers.includes(value) 
        ? currentAnswers.filter(item => item !== value)
        : [...currentAnswers, value];
      handleAnswer(currentQuestion.id, newAnswers);
    };

    const handleTextAnswer = (e) => {
      handleAnswer(currentQuestion.id, e.target.value);
    };

    return (
      <div className="tw-space-y-6">
          <div>
          <h3 className="tw-text-xl tw-font-semibold tw-mb-2" style={{ color: colors.gray[800] }}>
            {currentQuestion.question}
          </h3>
          <p className="tw-text-sm tw-text-gray-600">
            {currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} • Question {currentQuestionNumber} of {totalQuestions} • Optional
          </p>
          </div>

        {currentQuestion.type === 'select' && (
          <div className="tw-space-y-3">
            {currentQuestion.options.map((option) => (
              <label key={option} className="tw-flex tw-items-center tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg tw-cursor-pointer hover:tw-bg-gray-50 tw-transition-colors">
            <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={() => handleSelectAnswer(option)}
                  className="tw-mr-3 tw-w-4 tw-h-4"
                  style={{ accentColor: colors.primary }}
                />
                <span className="tw-text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}

        {currentQuestion.type === 'multiple' && (
          <div className="tw-space-y-3">
            {currentQuestion.options.map((option) => (
              <label key={option} className="tw-flex tw-items-center tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg tw-cursor-pointer hover:tw-bg-gray-50 tw-transition-colors">
            <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(currentAnswer) ? currentAnswer.includes(option) : false}
                  onChange={() => handleMultipleAnswer(option)}
                  className="tw-mr-3 tw-w-4 tw-h-4"
                  style={{ accentColor: colors.primary }}
                />
                <span className="tw-text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}

        {currentQuestion.type === 'budget' && (
          <div className="tw-space-y-4">
            {/* Budget requirement notice */}
            <div className="tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-mb-4">
              <div className="tw-flex tw-items-center tw-text-blue-800">
                <FiDollarSign className="tw-mr-2" size={16} />
                <span className="tw-text-sm tw-font-medium">Budget information is required to help vendors provide accurate quotes</span>
              </div>
            </div>
            
            {/* Predefined budget options */}
            <div className="tw-space-y-3">
              {currentQuestion.options.map((option) => (
                <label key={option} className="tw-flex tw-items-center tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg tw-cursor-pointer hover:tw-bg-gray-50 tw-transition-colors">
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option}
                    checked={currentAnswer === option}
                    onChange={() => handleSelectAnswer(option)}
                    className="tw-mr-3 tw-w-4 tw-h-4"
                    style={{ accentColor: colors.primary }}
                  />
                  <span className="tw-text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            
            {/* Custom range option */}
            <div className="tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-bg-gray-50">
              <label className="tw-flex tw-items-center tw-mb-3 tw-cursor-pointer">
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value="custom"
                  checked={typeof currentAnswer === 'object' && currentAnswer?.type === 'custom'}
                  onChange={() => handleSelectAnswer({ type: 'custom', min: '', max: '' })}
                  className="tw-mr-3 tw-w-4 tw-h-4"
                  style={{ accentColor: colors.primary }}
                />
                <span className="tw-text-gray-700 tw-font-medium">Enter your own range</span>
              </label>
              
              {typeof currentAnswer === 'object' && currentAnswer?.type === 'custom' && (
                <div className="tw-flex tw-items-center tw-space-x-3 tw-ml-7">
                  <span className="tw-text-gray-600">$</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={currentAnswer.min}
                    onChange={(e) => handleSelectAnswer({ 
                      type: 'custom', 
                      min: e.target.value, 
                      max: currentAnswer.max 
                    })}
                    className="tw-w-24 tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded focus:tw-outline-none focus:tw-ring-2"
                    style={{ focusRingColor: colors.primary }}
                    min="1"
                    required
                  />
                  <span className="tw-text-gray-600">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={currentAnswer.max}
                    onChange={(e) => handleSelectAnswer({ 
                      type: 'custom', 
                      min: currentAnswer.min, 
                      max: e.target.value 
                    })}
                    className="tw-w-24 tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded focus:tw-outline-none focus:tw-ring-2"
                    style={{ focusRingColor: colors.primary }}
                    min="1"
                    required
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {currentQuestion.type === 'text' && (
          <textarea
            value={currentAnswer}
            onChange={handleTextAnswer}
            placeholder={
              currentQuestion.id === 'customArrangements' 
                ? "e.g.\nFlower crown - 3\nCorsages for mothers - 2\nPew decorations - 8"
                : currentQuestion.id === 'cuisineType'
                ? "e.g. Italian, Mexican fusion, farm-to-table, BBQ, etc."
                : currentQuestion.id === 'dessertPreferences'
                ? "e.g. Wedding cake, cupcakes, chocolate fountain, ice cream bar, etc."
                : currentQuestion.id === 'customBudget'
                ? "e.g. $3,500 or $2,000 - $3,000"
                : "Please share your thoughts..."
            }
            className="tw-w-full tw-p-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 tw-min-h-[100px]"
            style={{ 
              borderColor: colors.gray[300],
              focusRingColor: colors.primary 
            }}
          />
        )}

        {currentQuestion.type === 'photo' && (
          <div className="tw-space-y-4">
            <div className="tw-text-sm tw-text-gray-600 tw-mb-3">
              Upload photos to help vendors understand your vision (optional)
            </div>
            
            {(!currentAnswer || currentAnswer.length === 0) ? (
              <div
                className="tw-border-2 tw-border-dashed tw-border-gray-300 tw-rounded-lg tw-p-8 tw-text-center tw-cursor-pointer hover:tw-border-gray-400 tw-transition-colors"
                onClick={() => document.getElementById(`file-input-${currentCategory}`).click()}
              >
                <input
                  type="file"
                  id={`file-input-${currentCategory}`}
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => handleFileSelect(e, currentCategory)}
                  style={{ display: "none" }}
                />
                <FiUpload size={32} className="tw-mx-auto tw-mb-3 tw-text-gray-400" />
                <div className="tw-text-gray-600">
                  Click to browse or drag & drop files here
                </div>
                <div className="tw-text-sm tw-text-gray-500 tw-mt-1">
                  Support for images and videos
                </div>
              </div>
            ) : (
              <div>
                <PhotoGrid
                  photos={currentAnswer}
                  removePhoto={(index) => handleRemovePhoto(index, currentCategory)}
                  openModal={(photo) => {
                    setSelectedPhoto(photo);
                    setIsPhotoModalOpen(true);
                  }}
                />
                <div className="tw-text-center tw-mt-4">
                  <button
                    onClick={() => document.getElementById(`file-input-more-${currentCategory}`).click()}
                    className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-gray-700 hover:tw-bg-gray-50 tw-transition-colors tw-border-none"
                  >
                    <input
                      type="file"
                      id={`file-input-more-${currentCategory}`}
                      multiple
                      accept="image/*,video/*"
                      onChange={(e) => handleFileSelect(e, currentCategory)}
                      style={{ display: "none" }}
                    />
                    <FiUpload className="tw-inline tw-mr-2" size={16} />
                    'Add More Photos'
                  </button>
                </div>
              </div>
            )}
            
            {/* Pinterest Link Input */}
            <div className="tw-mt-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Pinterest or Inspiration Link (Optional)
              </label>
              <div className="tw-flex tw-items-center tw-space-x-2">
                <input
                  type="url"
                  placeholder="https://pinterest.com/... or any inspiration link"
                  value={formData.pinterestLink || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, pinterestLink: e.target.value }))}
                  className="tw-flex-1 tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, pinterestLink: '' }))}
                  className="tw-px-3 tw-py-2 tw-text-gray-500 hover:tw-text-gray-700 tw-transition-colors tw-border-none tw-rounded-lg"
                  title="Clear link"
                >
                  ✕
                </button>
              </div>
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                Share a Pinterest board, Instagram post, or any other inspiration link to help vendors understand your style
              </p>
            </div>
          </div>
        )}

        {currentQuestion.type === 'quantity' && (
          <div className="tw-space-y-4">
            <div className="tw-text-sm tw-text-gray-600 tw-mb-3">
              Select the items you need and specify quantities
            </div>
            {currentQuestion.options.map((option) => {
              const currentQuantities = currentAnswer || {};
              const quantity = currentQuantities[option] || '';
              const isSelected = option in currentQuantities;
              const isOtherOption = option === 'Other (specify on next page)';
              
              const toggleSelection = () => {
                const newQuantities = { ...currentQuantities };
                if (isSelected) {
                  delete newQuantities[option];
                } else {
                  // For "Other" option, just mark as selected without quantity
                  newQuantities[option] = isOtherOption ? 'selected' : '1';
                }
                handleAnswer(currentQuestion.id, newQuantities);
              };

              return (
                <div key={option} className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg tw-cursor-pointer hover:tw-bg-gray-50 tw-transition-colors"
                     onClick={(e) => {
                       // Don't toggle if clicking on the quantity input
                       if (e.target.type === 'number') return;
                       toggleSelection();
                     }}>
                  <div className="tw-flex tw-items-center tw-flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={toggleSelection}
                      className="tw-mr-3 tw-w-4 tw-h-4 tw-pointer-events-none"
                      style={{ accentColor: colors.primary }}
                    />
                    <span className="tw-text-gray-700 tw-flex-1">{option}</span>
                  </div>
                  {isSelected && !isOtherOption && (
                    <div className="tw-flex tw-items-center tw-ml-4" onClick={(e) => e.stopPropagation()}>
                      <label className="tw-text-sm tw-text-gray-600 tw-mr-2">Qty:</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={quantity}
                        onChange={(e) => {
                          const newQuantities = { ...currentQuantities };
                          // Keep the item selected even if input is temporarily empty
                          // Only set to empty string if input is empty, don't delete the key
                          newQuantities[option] = e.target.value || '';
                          handleAnswer(currentQuestion.id, newQuantities);
                        }}
                        onBlur={(e) => {
                          // If user leaves input empty, set default to 1
                          if (!e.target.value) {
                            const newQuantities = { ...currentQuantities };
                            newQuantities[option] = '1';
                            handleAnswer(currentQuestion.id, newQuantities);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="tw-w-16 tw-px-2 tw-py-1 tw-border tw-border-gray-300 tw-rounded tw-text-center focus:tw-outline-none focus:tw-ring-2"
                        style={{ focusRingColor: colors.primary }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderEventDetails = () => {
    if (!eventDetailQuestions[currentQuestionIndex]) {
      return (
        <div className="tw-text-center tw-py-8">
          <p className="tw-text-gray-600">No event details available.</p>
        </div>
      );
    }

    const currentQuestion = eventDetailQuestions[currentQuestionIndex];
    const currentAnswer = formData[currentQuestion.id] || '';

    const handleEventDetailAnswer = (questionId, answer) => {
      setFormData(prev => ({
        ...prev,
        [questionId]: answer
      }));
    };

    return (
      <div className="tw-space-y-6">
        <div>
          <h3 className="tw-text-xl tw-font-semibold tw-mb-2" style={{ color: colors.gray[800] }}>
            {currentQuestion.question}
          </h3>
          <p className="tw-text-sm tw-text-gray-600">
            Event Details • Question {currentQuestionIndex + 1} of {eventDetailQuestions.length} • Optional
          </p>
        </div>

        {currentQuestion.type === 'select' && (
          <div className="tw-space-y-3">
            {currentQuestion.options.map((option) => (
              <label key={option} className="tw-flex tw-items-center tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg tw-cursor-pointer hover:tw-bg-gray-50 tw-transition-colors">
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={() => handleEventDetailAnswer(currentQuestion.id, option)}
                  className="tw-mr-3 tw-w-4 tw-h-4"
                  style={{ accentColor: colors.primary }}
                />
                <span className="tw-text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}

        {currentQuestion.type === 'date' && (
          <input
            type="date"
            value={currentAnswer}
            onChange={(e) => handleEventDetailAnswer(currentQuestion.id, e.target.value)}
            className="tw-w-full tw-p-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2"
            style={{ 
              borderColor: colors.gray[300],
              focusRingColor: colors.primary 
            }}
          />
        )}

        {currentQuestion.type === 'text' && (
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => handleEventDetailAnswer(currentQuestion.id, e.target.value)}
            placeholder={currentQuestion.placeholder}
            className="tw-w-full tw-p-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2"
            style={{ 
              borderColor: colors.gray[300],
              focusRingColor: colors.primary 
            }}
          />
        )}
      </div>
    );
  };

  const canGoNext = () => {
    if (isReviewStep) return false;
    if (showEventDetails) {
      // For event details, all questions are optional
      return true;
    }
    if (!currentQuestion) return false;
    
    // Make budget questions mandatory
    if (currentQuestion.type === 'budget') {
      const currentAnswer = formData.responses?.[currentCategory]?.[currentQuestion.id];
      if (!currentAnswer) return false;
      
      // If it's a custom budget, both min and max must be filled
      if (typeof currentAnswer === 'object' && currentAnswer?.type === 'custom') {
        return currentAnswer.min && currentAnswer.max && 
               currentAnswer.min !== '' && currentAnswer.max !== '' &&
               parseInt(currentAnswer.min) > 0 && parseInt(currentAnswer.max) > 0;
      }
      
      return true; // Predefined budget option selected
    }
    
    // All other questions are optional - user can always skip
    return true;
  };

  const canGoBack = () => {
    if (isReviewStep) return true;
    if (showEventDetails) {
      return currentQuestionIndex > 0;
    }
    return currentQuestionIndex > 0 || currentCategoryIndex > 0 || (vendor && shouldShowEventDetails);
  };

  // Helper function to get category icon
  const getCategoryIcon = (category) => {
    const iconMap = {
      'photographer': FiCamera,
      'videographer': FiVideo, 
      'dj': FiMusic,
      'caterer': BiRestaurant,
      'florist': FiHeart,
      'venue': FiHome,
      'beauty': FiStar,
      'planner': FiCalendar
    };
    
    return iconMap[category] || FiCalendar;
  };

  const renderSuccessSlide = () => {
    return (
      <div className="tw-text-center tw-py-12">
        <div className="tw-mb-8">
          <div className="tw-w-20 tw-h-20 tw-mx-auto tw-mb-4 tw-bg-green-100 tw-rounded-full tw-flex tw-items-center tw-justify-center">
            <FiCheck className="tw-text-green-600" size={40} />
          </div>
          <h3 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-4">
            {isEditMode ? 'Request Updated Successfully!' : 'Request Submitted Successfully!'}
          </h3>
          <p className="tw-text-gray-600 tw-mb-6 tw-max-w-md tw-mx-auto">
            {isEditMode 
              ? 'Your request has been updated and vendors will be notified of the changes.'
              : `Your request has been sent to ${selectedVendors.length} vendor${selectedVendors.length > 1 ? 's' : ''}. You'll start receiving bids soon!`
            }
          </p>
        </div>
        
        <div className="tw-space-y-4">
          <button
            onClick={() => {
              onClose();
              navigate('/individual-dashboard/bids');
            }}
            className="tw-w-full tw-py-3 tw-px-6 tw-rounded-lg tw-text-white tw-font-medium tw-transition-colors tw-border-none"
            style={{ backgroundColor: colors.primary }}
          >
            {isEditMode ? 'View Updated Request' : 'View My Bids'}
          </button>
          
          <button
            onClick={onClose}
            className="tw-w-full tw-py-3 tw-px-4 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-text-gray-700 tw-font-medium hover:tw-bg-gray-50 tw-transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderReviewScreen = () => {
    return (
      <div className="tw-space-y-6">
        <div>
          <h3 className="tw-text-xl tw-font-semibold tw-mb-2" style={{ color: colors.gray[800] }}>
            Review Your Request
          </h3>
          <p className="tw-text-sm tw-text-gray-600">
            Please review your information before submitting
          </p>
          {!user && (
            <div className="tw-mt-3 tw-p-3 tw-bg-purple-50 tw-border tw-border-purple-500 tw-rounded-lg tw-text-center tw-border-1px">
              <p className="tw-text-sm tw-text-purple-700">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="rgb(126, 34, 206)" className="tw-inline tw-mr-2">
                  <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM13 16h-2v2h2v-2zm0-6h-2v4h2v-4z"/>
                </svg>
                You'll need to sign in or create an account to submit your request and receive quotes from vendors.
              </p>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
          <h4 className="tw-font-medium tw-mb-3 tw-flex tw-items-center tw-justify-between" style={{ color: colors.gray[700] }}>
            <span className="tw-flex tw-items-center">
              <FiCalendar className="tw-mr-2 tw-text-pink-500" />
              Event Details
            </span>
            <button
              onClick={() => {
                setIsReviewStep(false);
                setShowEventDetails(true);
                setCurrentQuestionIndex(0);
              }}
              className="tw-text-sm tw-text-purple-500 hover:tw-text-purple-700 tw-flex tw-items-center tw-border tw-border-purple-500 tw-rounded-full tw-px-2 tw-py-1 tw-bg-white"
            >
              <FiEdit3 className="tw-mr-1" size={14} />
              Edit
            </button>
          </h4>
          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm">
            <div>
              <span className="tw-text-gray-600">Date:</span>
              <span className="tw-ml-2 tw-font-medium">{formData.eventDate || 'Not specified'}</span>
            </div>
            <div>
              <span className="tw-text-gray-600">Time:</span>
              <span className="tw-ml-2 tw-font-medium">{formData.eventTime || 'Not specified'}</span>
            </div>
            <div>
              <span className="tw-text-gray-600">Location:</span>
              <span className="tw-ml-2 tw-font-medium">{formData.location || 'Not specified'}</span>
            </div>
            <div>
              <span className="tw-text-gray-600">Guests:</span>
              <span className="tw-ml-2 tw-font-medium">{formData.guestCount || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {/* Category Responses */}
        {selectedVendors.map((category) => {
          const categoryResponses = formData.responses?.[category] || {};
          const questions = getCategoryQuestions(category);
          
          return (
            <div key={category} className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
              <h4 className="tw-font-medium tw-mb-3 tw-flex tw-items-center tw-justify-between" style={{ color: colors.gray[700] }}>
                <span className="tw-flex tw-items-center">
                  {React.createElement(getCategoryIcon(category), { 
                    className: "tw-mr-2", 
                    size: 18,
                    style: { color: colors.primary }
                  })}
                  {category.charAt(0).toUpperCase() + category.slice(1)} Preferences
                </span>
                <button
                  onClick={() => {
                    setIsReviewStep(false);
                    setCurrentCategoryIndex(selectedVendors.indexOf(category));
                    setCurrentQuestionIndex(0);
                  }}
                  className="tw-text-sm tw-text-purple-500 hover:tw-text-purple-700 tw-flex tw-items-center tw-border tw-border-purple-500 tw-rounded-full tw-px-2 tw-py-1 tw-bg-white"
                >
                  <FiEdit3 className="tw-mr-1" size={14} />
                  Edit
                </button>
              </h4>
              <div className="tw-space-y-2 tw-text-sm">
                {questions.map((question) => {
                  const answer = categoryResponses[question.id];
                  if (!answer) return null;
                  
                  return (
                    <div key={question.id}>
                      <span className="tw-text-gray-600">{question.question}</span>
                      <div className="tw-ml-2 tw-font-medium tw-text-gray-800">
                        {question.type === 'photo' ? (
                          Array.isArray(answer) && answer.length > 0 ? (
                            <div className="tw-mt-2">
                              <PhotoGrid
                                photos={answer}
                                removePhoto={() => {}} // No remove in review
                                openModal={(photo) => {
                                  setSelectedPhoto(photo);
                                  setIsPhotoModalOpen(true);
                                }}
                              />
                            </div>
                          ) : (
                            'No photos uploaded'
                          )
                        ) : question.type === 'quantity' ? (
                          typeof answer === 'object' && answer ? (
                            <div className="tw-mt-1">
                              {Object.entries(answer).map(([item, qty]) => (
                                <div key={item} className="tw-text-sm">
                                  • {item}{qty === 'selected' ? '' : `: ${qty}`}
                                </div>
                              ))}
                            </div>
                          ) : (
                            'No items selected'
                          )
                        ) : question.type === 'budget' && typeof answer === 'object' && answer?.type === 'custom' ? (
                          `$${answer.min} - $${answer.max}`
                        ) : (
                          Array.isArray(answer) ? answer.join(', ') : answer
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const modalContent = (
    <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-[9999] tw-p-4">
      <div className="tw-bg-white tw-rounded-lg tw-w-full tw-max-w-2xl tw-overflow-hidden request-modal">
        {console.log('RequestModal: Rendering modal content, user:', user?.id, 'formData:', formData)}
        {/* Header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-p-6 tw-border-b tw-border-gray-200">
          <h2 className="tw-text-2xl tw-font-bold" style={{ color: colors.gray[800] }}>
            {isSuccess ? 'Success!' : (isEditMode ? 'Edit Request' : (isReviewStep ? 'Review Request' : (showEventDetails ? 'Event Details' : 'Tell Us More')))}
          </h2>
          <button
            onClick={onClose}
            className="tw-p-2 tw-rounded-full tw-bg-gray-100 hover:tw-bg-gray-200 tw-transition-colors tw-border-none"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Vendor Notification */}
        {vendor && (
          <div className="tw-px-6 tw-py-4 tw-bg-purple-50 tw-border-b tw-border-purple-200">
            {console.log('Vendor object in RequestModal:', vendor)}
            <div className="tw-flex tw-items-center tw-gap-3">
              {vendor.image && (
                <img 
                  src={vendor.image} 
                  alt={vendor.business_name}
                  className="tw-w-10 tw-h-10 tw-rounded-full tw-object-cover"
                />
              )}
              <div>
                <p className="tw-text-sm tw-font-medium tw-text-purple-800">
                  <span className="tw-font-semibold">{vendor.business_name}</span> will be notified of your request
                </p>
                <p className="tw-text-xs tw-text-purple-600">
                  They'll receive your details and can provide a tailored quote
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {!isReviewStep && !isSuccess && (
          <div className="tw-px-6 tw-py-4 tw-bg-gray-50">
            <div className="tw-w-full tw-bg-gray-200 tw-rounded-full tw-h-2">
              <div
                className="tw-h-2 tw-rounded-full tw-transition-all tw-duration-300"
                style={{
                  backgroundColor: colors.primary,
                  width: `${(currentQuestionNumber / totalQuestions) * 100}%`
                }}
              />
            </div>
                         <p className="tw-text-sm tw-text-gray-600 tw-mt-2">
               {showEventDetails
                 ? `Event Details • Question ${currentQuestionIndex + 1} of ${eventDetailQuestions.length}`
                 : `${currentCategory ? currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1) : 'Category'} • Question ${currentQuestionIndex + 1} of ${categoryQuestions?.length || 0}`
               }
               <br />
               <small className="tw-text-xs tw-text-gray-500">
                 {showEventDetails 
                   ? `Overall Progress: ${currentQuestionNumber} of ${totalQuestions} questions`
                   : `Vendor Questions: ${currentQuestionNumber} of ${totalQuestions} questions`
                 }
               </small>
             </p>
          </div>
        )}

                 {/* Content */}
         <div className="tw-relative tw-p-6 tw-overflow-y-auto tw-max-h-[calc(90vh-300px)]">
           {/* Scroll indicator at top */}
           <div className="tw-absolute tw-top-0 tw-left-0 tw-right-0 tw-h-4 tw-bg-gradient-to-b tw-from-white tw-to-transparent tw-pointer-events-none tw-z-10"></div>
           
           {/* Scroll indicator at bottom */}
           <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-4 tw-bg-gradient-to-t tw-from-white tw-to-transparent tw-pointer-events-none tw-z-10"></div>
           
           {/* Scroll hint text */}
           <div className="tw-text-center tw-text-xs tw-text-gray-400 tw-mb-4 tw-italic">
             💡 Scroll down to see more questions
           </div>
           
           {isSuccess ? renderSuccessSlide() : (isReviewStep ? renderReviewScreen() : (showEventDetails ? renderEventDetails() : renderQuestion()))}
         </div>

        {/* Footer */}
        {!isSuccess && (
          <div className="tw-flex tw-items-center tw-justify-between tw-p-6 tw-border-t tw-border-gray-200 tw-bg-gray-50">
          <button
            onClick={handleBack}
            disabled={!canGoBack()}
            className="tw-flex tw-items-center tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-text-gray-700 hover:tw-bg-gray-50 tw-transition-colors tw-disabled:opacity-50 tw-disabled:cursor-not-allowed tw-border-none"
          >
            <FiArrowLeft className="tw-mr-2" size={16} />
            Back
          </button>

          {isReviewStep ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="tw-flex tw-items-center tw-px-6 tw-py-2 tw-rounded-lg tw-text-white tw-font-medium tw-transition-colors tw-border-none tw-disabled:opacity-50 tw-disabled:cursor-not-allowed"
              style={{ backgroundColor: isSubmitting ? colors.gray[400] : colors.primary }}
            >
              <FiCheck className="tw-mr-2" size={16} />
              {isSubmitting ? 'Submitting...' : (user ? (isEditMode ? 'Update Request' : 'Submit Request') : 'Sign In & Submit')}
            </button>
          ) : (
                         <button
               onClick={handleNext}
               disabled={!canGoNext()}
               className="tw-flex tw-items-center tw-px-6 tw-py-2 tw-rounded-lg tw-text-white tw-font-medium tw-transition-colors tw-disabled:opacity-50 tw-disabled:cursor-not-allowed tw-border-none"
               style={{ backgroundColor: canGoNext() ? colors.primary : colors.gray[400] }}
             >
               {showEventDetails
                 ? (currentQuestionIndex < eventDetailQuestions.length - 1 ? 'Next' : 'Finish Event Details')
                 : (currentQuestion?.type === 'budget' && !formData.responses?.[currentCategory]?.[currentQuestion?.id] 
                     ? 'Budget Required' 
                     : (formData.responses?.[currentCategory]?.[currentQuestion?.id] ? 'Next' : 'Skip'))
               }
               <FiArrowRight className="tw-ml-2" size={16} />
             </button>
          )}
        </div>
        )}
        
        {/* Photo Modal */}
        {isPhotoModalOpen && (
          <PhotoModal
            photo={selectedPhoto}
            onClose={() => {
              setSelectedPhoto(null);
              setIsPhotoModalOpen(false);
            }}
          />
        )}

        {/* Authentication Modal */}
        {showAuthModal && (
          <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-75 tw-flex tw-items-center tw-justify-center tw-z-[60]">
            <div className="tw-relative tw-w-full tw-max-w-md tw-mx-4">
              <AuthModal 
                setIsModalOpen={setShowAuthModal} 
                onSuccess={handleAuthSuccess}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  console.log('RequestModal: Creating portal with modal content');
  return createPortal(modalContent, document.body);
};

export default RequestModal;
