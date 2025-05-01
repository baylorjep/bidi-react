import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MasterRequestForm from "./MasterRequestForm";
import RequestStepper from "./RequestStepper";
import StatusBar from "./StatusBar";
import { Spinner } from "react-bootstrap";
import "../../styles/Requests.css";
import PhotographyStepper from "./Photography/PhotographyStepper";
import VideographyStepper from "./Videography/VideographyStepper";
import BudgetForm from './BudgetForm';
import CateringStepper from './Catering/CateringStepper';
import DjStepper from './DJ/DjStepper';
import FloristStepper from './Florist/FloristStepper';
import HairAndMakeupStepper from './Beauty/HairAndMakeupStepper';
import { supabase } from "../../supabaseClient";
import AuthModal from "./Authentication/AuthModal";
import SignInModal from "./Event/SignInModal";
import { v4 as uuidv4 } from 'uuid';

function MasterRequestFlow() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedCategories = location.state?.selectedCategories || [];
  const [completedCategories, setCompletedCategories] = useState([]);
  const [showReview, setShowReview] = useState(false);

  // Debug log for selected categories
  console.log("Selected Categories:", selectedCategories);

  const [formData, setFormData] = useState({
    commonDetails: {},
    requests: {
      DJ: {
        equipmentNeeded: '',
        equipmentNotes: '',
        additionalServices: {},
        musicPreferences: {},
        playlist: '',
        specialSongs: '',
        priceQualityPreference: '2',
        priceRange: '',
        additionalInfo: '',
        weddingDetails: {
          ceremony: false,
          cocktailHour: false,
          reception: false,
          afterParty: false
        }
      },
      HairAndMakeup: {
        location: '',
        dateFlexibility: '',
        startDate: '',
        endDate: '',
        dateTimeframe: '',
        startTime: '',
        endTime: '',
        startTimeUnknown: false,
        endTimeUnknown: false,
        numPeople: '',
        numPeopleUnknown: false,
        specificTimeNeeded: '',
        specificTime: '',
        hairstylePreferences: '',
        hairLengthType: '',
        extensionsNeeded: '',
        trialSessionHair: '',
        makeupStylePreferences: {},
        skinTypeConcerns: '',
        preferredProductsAllergies: '',
        lashesIncluded: '',
        trialSessionMakeup: '',
        groupDiscountInquiry: '',
        onSiteServiceNeeded: '',
        priceQualityPreference: '2',
        priceRange: '',
        additionalInfo: '',
        pinterestBoard: '',
        serviceLocation: '',
        serviceTime: '',
        serviceTimeUnknown: false,
        serviceType: 'both'
      }
    },
    selectedRequests: selectedCategories,
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [missingFields, setMissingFields] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photographySubStep, setPhotographySubStep] = useState(0);
  const [videographySubStep, setVideographySubStep] = useState(0);
  const [cateringSubStep, setCateringSubStep] = useState(0);
  const [djSubStep, setDjSubStep] = useState(0);
  const [floristSubStep, setFloristSubStep] = useState(0);
  const [hairAndMakeupSubStep, setHairAndMakeupSubStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState(new Set([0]));
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [error, setError] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper function to check request type case-insensitively
  const isRequestType = (request, type) => {
    if (type === "DJ") {
      return request?.toLowerCase().includes("dj");
    }
    return request?.toLowerCase() === type.toLowerCase();
  };

  const getSteps = () => {
    const steps = ["Event Logistics"];
    formData.selectedRequests.forEach((request, index) => {
      if (isRequestType(request, "Photography")) {
        steps.push(
          "Photography - Coverage & Details",
          "Photography - Style & Deliverables",
          "Photography - Inspo",
          "Photography - Budget"
        );
      } else if (isRequestType(request, "Videography")) {
        steps.push(
          "Videography - Coverage & Details",
          "Videography - Style & Deliverables",
          "Videography - Inspo",
          "Videography - Budget"
        );
      } else if (isRequestType(request, "Catering")) {
        steps.push(
          "Catering - Logistics & Extra",
          "Catering - Budget & Additional Info"
        );
      } else if (isRequestType(request, "DJ")) {
        steps.push(
          "DJ Services - Basic Details",
          "DJ Services - Equipment & Setup",
          "DJ Services - Budget & Special Requests"
        );
      } else if (isRequestType(request, "Florist")) {
        steps.push(
          "Florist - Floral Arrangements",
          "Florist - Color & Flower Preferences",
          "Florist - Services",
          "Florist - Inspiration",
          "Florist - Budget"
        );
      } else if (isRequestType(request, "HairAndMakeup")) {
        const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
        steps.push("Hair and Makeup - Basic Details");
        if (serviceType === 'both' || serviceType === 'hair') {
          steps.push("Hair and Makeup - Hair Services");
        }
        if (serviceType === 'both' || serviceType === 'makeup') {
          steps.push("Hair and Makeup - Makeup Services");
        }
        steps.push("Hair and Makeup - Inspiration");
        steps.push("Hair and Makeup - Budget");
      } else {
        steps.push(`${request} Details`);
      }
    });
    return steps;
  };

  const getCurrentStepIndex = () => {
    if (currentStep === 0) return 0; // Event Logistics is always step 0
    
    let index = 1; // Start after Event Logistics
    let foundCurrent = false;
    
    for (let i = 0; i < formData.selectedRequests.length; i++) {
      const request = formData.selectedRequests[i];
      
      if (i === currentStep - 1) {
        // We've reached the current request
        if (isRequestType(request, "Photography")) {
          index += photographySubStep;
        } else if (isRequestType(request, "Videography")) {
          index += videographySubStep;
        } else if (isRequestType(request, "Catering")) {
          index += cateringSubStep;
        } else if (isRequestType(request, "DJ")) {
          index += djSubStep;
        } else if (isRequestType(request, "Florist")) {
          index += floristSubStep;
        } else if (isRequestType(request, "HairAndMakeup")) {
          index += hairAndMakeupSubStep;
        }
        foundCurrent = true;
        break;
      }
      
      // Add to the index based on the request type
      if (isRequestType(request, "Photography")) {
        index += 4;
      } else if (isRequestType(request, "Videography")) {
        index += 4;
      } else if (isRequestType(request, "Catering")) {
        index += 3;
      } else if (isRequestType(request, "DJ")) {
        index += 3;
      } else if (isRequestType(request, "Florist")) {
        index += 5; // Changed from 4 to 5 to account for the inspiration step
      } else if (isRequestType(request, "HairAndMakeup")) {
        index += 5;
      } else {
        index += 1;
      }
    }
    
    return foundCurrent ? index : index - 1;
  };

  const validateLogisticsForm = () => {
    const requiredFields = [];
    const { commonDetails } = formData;

    // Validate required logistics fields
    if (!commonDetails.eventType) requiredFields.push("Event Type");
    if (!commonDetails.location) requiredFields.push("Location");
    if (!commonDetails.numGuests) requiredFields.push("Number of Guests");
    if (!commonDetails.dateFlexibility) {
      requiredFields.push("Date Flexibility (Event Logistics)");
    } else {
      if (commonDetails.dateFlexibility === "specific" && !commonDetails.startDate) {
        requiredFields.push("Event Date");
      }
      if (commonDetails.dateFlexibility === "range" && (!commonDetails.startDate || !commonDetails.endDate)) {
        requiredFields.push("Date Range");
      }
      if (commonDetails.dateFlexibility === "flexible" && !commonDetails.dateTimeframe) {
        requiredFields.push("Preferred Timeframe");
      }
    }

    setMissingFields(requiredFields);
    return requiredFields.length === 0;
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      if (!validateLogisticsForm()) {
        return;
      }
      
      // Check authentication before proceeding
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAuthModalOpen(true);
        return;
      }
      
      setCurrentStep(1);
      setVisitedSteps(prev => new Set([...prev, 1]));
    } else {
      const currentRequest = formData.selectedRequests[currentStep - 1];
      
      // Check if we're on the last step of the current category
      const isLastStepOfCategory = () => {
        if (isRequestType(currentRequest, "Photography")) {
          return photographySubStep === 3;
        } else if (isRequestType(currentRequest, "Videography")) {
          return videographySubStep === 3;
        } else if (isRequestType(currentRequest, "Catering")) {
          return cateringSubStep === 2;
        } else if (isRequestType(currentRequest, "DJ")) {
          return djSubStep === 2;
        } else if (isRequestType(currentRequest, "Florist")) {
          return floristSubStep === 4; // Changed from 3 to 4 to account for the inspiration step
        } else if (isRequestType(currentRequest, "HairAndMakeup")) {
          const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
          if (serviceType === 'hair') {
            return hairAndMakeupSubStep === 3; // Basic -> Hair -> Inspiration -> Budget
          } else if (serviceType === 'makeup') {
            return hairAndMakeupSubStep === 3; // Basic -> Makeup -> Inspiration -> Budget
          }
          return hairAndMakeupSubStep === 4; // Basic -> Hair -> Makeup -> Inspiration -> Budget
        }
        return true;
      };

      if (isLastStepOfCategory()) {
        // Add current category to completed categories only if it's not already there
        setCompletedCategories(prev => {
          if (!prev.includes(currentRequest)) {
            return [...prev, currentRequest];
          }
          return prev;
        });
        
        // Check if there are more categories to complete
        const remainingCategories = selectedCategories.filter(
          cat => !completedCategories.includes(cat) && cat !== currentRequest
        );

        if (remainingCategories.length > 0) {
          // Show review screen before moving to next category
          setShowReview(true);
        } else {
          // All categories completed, proceed to final review
          setShowReview(true);
        }
      } else {
        // Continue with current category's sub-steps
        if (isRequestType(currentRequest, "Photography")) {
          setPhotographySubStep(photographySubStep + 1);
        } else if (isRequestType(currentRequest, "Videography")) {
          setVideographySubStep(videographySubStep + 1);
        } else if (isRequestType(currentRequest, "Catering")) {
          setCateringSubStep(cateringSubStep + 1);
        } else if (isRequestType(currentRequest, "DJ")) {
          setDjSubStep(djSubStep + 1);
        } else if (isRequestType(currentRequest, "Florist")) {
          setFloristSubStep(floristSubStep + 1);
        } else if (isRequestType(currentRequest, "HairAndMakeup")) {
          const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
          if (serviceType === 'hair' && hairAndMakeupSubStep === 1) {
            // Skip makeup step when hair only is selected
            setHairAndMakeupSubStep(hairAndMakeupSubStep + 1);
          } else if (serviceType === 'makeup' && hairAndMakeupSubStep === 0) {
            // Skip hair step when makeup only is selected
            setHairAndMakeupSubStep(hairAndMakeupSubStep + 1);
          } else {
            setHairAndMakeupSubStep(hairAndMakeupSubStep + 1);
          }
        }
        setVisitedSteps(prev => new Set([...prev, getCurrentStepIndex() + 1]));
      }
    }
  };

  const handleContinueToNextCategory = () => {
    setShowReview(false);
    const remainingCategories = selectedCategories.filter(
      cat => !completedCategories.includes(cat)
    );
    
    if (remainingCategories.length > 0) {
      const nextCategoryIndex = selectedCategories.indexOf(remainingCategories[0]);
      setCurrentStep(nextCategoryIndex + 1);
      // Reset sub-steps for the new category
      setPhotographySubStep(0);
      setVideographySubStep(0);
      setCateringSubStep(0);
      setDjSubStep(0);
      setFloristSubStep(0);
      setHairAndMakeupSubStep(0);
    }
  };

  const handleEditCategory = (category) => {
    setShowReview(false);
    const categoryIndex = selectedCategories.indexOf(category);
    setCurrentStep(categoryIndex + 1);
    // Reset sub-steps for the category being edited
    setPhotographySubStep(0);
    setVideographySubStep(0);
    setCateringSubStep(0);
    setDjSubStep(0);
    setFloristSubStep(0);
    setHairAndMakeupSubStep(0);
  };

  const handleBack = () => {
    if (currentStep === 0) {
      navigate("/request-categories");
      return;
    }
    const currentRequest = formData.selectedRequests[currentStep - 1];
    if (isRequestType(currentRequest, "Photography")) {
      if (photographySubStep > 0) {
        setPhotographySubStep(photographySubStep - 1);
      } else {
        setCurrentStep(currentStep - 1);
        setPhotographySubStep(0);
      }
    } else if (isRequestType(currentRequest, "Videography")) {
      if (videographySubStep > 0) {
        setVideographySubStep(videographySubStep - 1);
      } else {
        setCurrentStep(currentStep - 1);
        setVideographySubStep(0);
      }
    } else if (isRequestType(currentRequest, "Catering")) {
      if (cateringSubStep > 0) {
        setCateringSubStep(cateringSubStep - 1);
      } else {
        setCurrentStep(currentStep - 1);
        setCateringSubStep(0);
      }
    } else if (isRequestType(currentRequest, "DJ")) {
      if (djSubStep > 0) {
        setDjSubStep(djSubStep - 1);
      } else {
        setCurrentStep(currentStep - 1);
        setDjSubStep(0);
      }
    } else if (isRequestType(currentRequest, "Florist")) {
      if (floristSubStep > 0) {
        setFloristSubStep(floristSubStep - 1);
      } else {
        setCurrentStep(currentStep - 1);
        setFloristSubStep(0);
      }
    } else if (isRequestType(currentRequest, "HairAndMakeup")) {
      if (hairAndMakeupSubStep > 0) {
        setHairAndMakeupSubStep(hairAndMakeupSubStep - 1);
      } else {
        setCurrentStep(currentStep - 1);
        setHairAndMakeupSubStep(0);
      }
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("valid", true)
        .single();

      if (error) throw error;

      if (data) {
        const expirationDate = new Date(data.expiration_date);
        const now = new Date();

        if (now > expirationDate) {
          setCouponMessage("This coupon has expired");
          setAppliedCoupon(null);
          return;
        }

        setAppliedCoupon(data);
        setCouponMessage(`Coupon applied: $${data.discount_amount} off`);
      } else {
        setCouponMessage("Invalid coupon code");
        setAppliedCoupon(null);
      }
    } catch (err) {
      console.error("Error applying coupon:", err);
      setCouponMessage("Invalid coupon code");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        // Get the current request type from the selectedRequests array
        const currentRequestType = formData.selectedRequests[currentStep - 1];

        // Handle each request type based on the current stepper
        for (const [category, request] of Object.entries(formData.requests)) {
            if (!request) continue;

            // Only process the request type that matches the current stepper
            if (category === currentRequestType) {
                if (category === 'Florist') {
                    // Create florist request data
                    const floristRequestData = {
                        user_id: user.id,
                        event_type: formData.commonDetails.eventType,
                        event_title: formData.commonDetails.eventName || 'Floral Arrangement Request',
                        location: formData.commonDetails.location,
                        date_flexibility: formData.commonDetails.dateFlexibility,
                        start_date: formData.commonDetails.startDate,
                        end_date: formData.commonDetails.endDate,
                        date_timeframe: formData.commonDetails.dateTimeframe,
                        indoor_outdoor: formData.commonDetails.indoorOutdoor,
                        specific_time_needed: formData.requests?.Florist?.specificTimeNeeded || false,
                        specific_time: formData.requests?.Florist?.specificTime || null,
                        colors: request.colorPreferences,
                        pinterest_link: request.pinterestBoard,
                        additional_comments: request.additionalInfo || '',
                        price_range: request.priceRange || 'Not specified',
                        flower_preferences_text: request.flowerPreferences?.text || '',
                        status: 'pending'
                    };

                    // Insert into florist_requests table
                    const { data: newFloristRequest, error: floristRequestError } = await supabase
                        .from('florist_requests')
                        .insert([floristRequestData])
                        .select()
                        .single();

                    if (floristRequestError) throw floristRequestError;

                    // Handle photo uploads for florist
                    if (request.photos && request.photos.length > 0) {
                        const uploadPromises = request.photos.map(async (photo) => {
                            const fileExt = photo.name.split('.').pop();
                            const fileName = `${uuidv4()}.${fileExt}`;
                            const filePath = `${user.id}/${newFloristRequest.id}/${fileName}`;

                            const { error: uploadError } = await supabase.storage
                                .from('request-media')
                                .upload(filePath, photo.file);

                            if (uploadError) throw uploadError;

                            const { data: { publicUrl } } = supabase.storage
                                .from('request-media')
                                .getPublicUrl(filePath);

                            // Store photo information in florist_photos table
                            return supabase
                                .from('florist_photos')
                                .insert([{
                                    request_id: newFloristRequest.id,
                                    user_id: user.id,
                                    photo_url: publicUrl,
                                    file_path: filePath
                                }]);
                        });

                        await Promise.all(uploadPromises);
                    }
                } else if (category === 'DJ') {
                    // Handle DJ requests
                    const djRequestData = {
                        user_id: user.id,
                        status: 'pending',
                        equipment_needed: request.equipmentNeeded,
                        equipment_notes: request.equipmentNotes,
                        additional_services: request.additionalServices,
                        music_preferences: request.musicPreferences,
                        playlist: request.playlist,
                        special_songs: request.specialSongs,
                        price_range: request.priceRange,
                        additional_comments: request.additionalInfo,
                        wedding_details: request.weddingDetails
                    };

                    const { data: newDjRequest, error: djRequestError } = await supabase
                        .from('dj_requests')
                        .insert([djRequestData])
                        .select()
                        .single();

                    if (djRequestError) throw djRequestError;

                    // Handle photo uploads for DJ
                    if (request.photos && request.photos.length > 0) {
                        const uploadPromises = request.photos.map(async (photo) => {
                            const fileExt = photo.name.split('.').pop();
                            const fileName = `${uuidv4()}.${fileExt}`;
                            const filePath = `${user.id}/${newDjRequest.id}/${fileName}`;

                            const { error: uploadError } = await supabase.storage
                                .from('request-media')
                                .upload(filePath, photo.file);

                            if (uploadError) throw uploadError;

                            const { data: { publicUrl } } = supabase.storage
                                .from('request-media')
                                .getPublicUrl(filePath);

                            return supabase
                                .from('event_photos')
                                .insert([{
                                    request_id: newDjRequest.id,
                                    user_id: user.id,
                                    photo_url: publicUrl,
                                    file_path: filePath
                                }]);
                        });

                        await Promise.all(uploadPromises);
                    }
                }
                // Add other request type handlers here as needed
            }
        }

        // Clear form data and navigate to success page
        localStorage.removeItem('masterRequest');
        navigate('/success-request', { 
            state: { 
                message: 'Your requests have been submitted successfully!'
            }
        });

    } catch (err) {
        setError('Failed to submit requests. Please try again.');
        console.error('Error submitting requests:', err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleStepClick = (stepIndex) => {
    if (stepIndex === 0) {
      setCurrentStep(0);
      return;
    }

    let currentIndex = 1;
    for (let i = 0; i < formData.selectedRequests.length; i++) {
      const request = formData.selectedRequests[i];
      if (isRequestType(request, "Photography")) {
        if (stepIndex < currentIndex + 4) {
          setCurrentStep(i + 1);
          setPhotographySubStep(stepIndex - currentIndex);
          return;
        }
        currentIndex += 4;
      } else if (isRequestType(request, "Videography")) {
        if (stepIndex < currentIndex + 4) {
          setCurrentStep(i + 1);
          setVideographySubStep(stepIndex - currentIndex);
          return;
        }
        currentIndex += 4;
      } else if (isRequestType(request, "Catering")) {
        if (stepIndex < currentIndex + 3) {
          setCurrentStep(i + 1);
          setCateringSubStep(stepIndex - currentIndex);
          return;
        }
        currentIndex += 3;
      } else if (isRequestType(request, "DJ")) {
        if (stepIndex < currentIndex + 3) {
          setCurrentStep(i + 1);
          setDjSubStep(stepIndex - currentIndex);
          return;
        }
        currentIndex += 3;
      } else if (isRequestType(request, "Florist")) {
        if (stepIndex < currentIndex + 4) {
          setCurrentStep(i + 1);
          setFloristSubStep(stepIndex - currentIndex);
          return;
        }
        currentIndex += 4;
      } else if (isRequestType(request, "HairAndMakeup")) {
        if (stepIndex < currentIndex + 5) {
          setCurrentStep(i + 1);
          setHairAndMakeupSubStep(stepIndex - currentIndex);
          return;
        }
        currentIndex += 5;
      } else {
        if (stepIndex === currentIndex) {
          setCurrentStep(i + 1);
          return;
        }
        currentIndex += 1;
      }
    }
  };

  const renderRequestForm = () => {
    const currentRequest = formData.selectedRequests[currentStep - 1];
    const stepIndex = getCurrentStepIndex();
    
    // Calculate the offset for the current request
    let requestOffset = 1; // Start after Event Logistics
    for (let i = 0; i < currentStep - 1; i++) {
      const request = formData.selectedRequests[i];
      if (isRequestType(request, "Photography")) {
        requestOffset += 4;
      } else if (isRequestType(request, "Videography")) {
        requestOffset += 4;
      } else if (isRequestType(request, "Catering")) {
        requestOffset += 2; // Changed from 3 to 2 since we now have 2 steps
      } else if (isRequestType(request, "DJ")) {
        requestOffset += 3;
      } else if (isRequestType(request, "Florist")) {
        requestOffset += 5;
      } else if (isRequestType(request, "HairAndMakeup")) {
        const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
        if (serviceType === 'hair') {
          requestOffset += 4;
        } else if (serviceType === 'makeup') {
          requestOffset += 4;
        } else {
          requestOffset += 5;
        }
      } else {
        requestOffset += 1;
      }
    }
    
    // Check if we're on the budget step for any request type
    const isBudgetStep = (requestType) => {
      if (isRequestType(requestType, "Photography") || isRequestType(requestType, "Videography")) {
        return stepIndex === requestOffset + 3;
      } else if (isRequestType(requestType, "Catering")) {
        return stepIndex === requestOffset + 1; // Changed from +2 to +1 since budget is now the second step
      } else if (isRequestType(requestType, "DJ")) {
        return stepIndex === requestOffset + 2;
      } else if (isRequestType(requestType, "Florist")) {
        return stepIndex === requestOffset + 4;
      } else if (isRequestType(requestType, "HairAndMakeup")) {
        const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
        if (serviceType === 'hair') {
          return stepIndex === requestOffset + 3;
        } else if (serviceType === 'makeup') {
          return stepIndex === requestOffset + 3;
        }
        return stepIndex === requestOffset + 4;
      }
      return false;
    };

    // Check if we're on the inspiration step for Florist
    const isInspirationStep = (requestType) => {
      if (isRequestType(requestType, "Florist")) {
        return stepIndex === requestOffset + 3; // Inspiration is the 4th step (after offset)
      }
      return false;
    };

    // First check if we're on the inspiration step
    if (isInspirationStep(currentRequest)) {
      return (
        <div className="form-scrollable-content">
          <FloristStepper
            formData={formData}
            setFormData={setFormData}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            subStep={floristSubStep}
            setSubStep={setFloristSubStep}
          />
        </div>
      );
    }

    // Then check if we're on the budget step
    if (isBudgetStep(currentRequest)) {
      return (
        <div className="form-scrollable-content">
          <BudgetForm
            formData={formData}
            setFormData={setFormData}
            category={currentRequest}
          />
        </div>
      );
    }

    // Render the appropriate stepper for other steps
    if (isRequestType(currentRequest, "Photography")) {
      return (
        <div className="form-scrollable-content">
          <PhotographyStepper
            formData={formData}
            setFormData={setFormData}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            subStep={photographySubStep}
            setSubStep={setPhotographySubStep}
          />
        </div>
      );
    }

    if (isRequestType(currentRequest, "Videography")) {
      return (
        <div className="form-scrollable-content">
          <VideographyStepper
            formData={formData}
            setFormData={setFormData}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            subStep={videographySubStep}
            setSubStep={setVideographySubStep}
          />
        </div>
      );
    }

    if (isRequestType(currentRequest, "Catering")) {
      return (
        <div className="form-scrollable-content">
          <CateringStepper
            formData={formData}
            setFormData={setFormData}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            subStep={cateringSubStep}
            setSubStep={setCateringSubStep}
          />
        </div>
      );
    }

    if (isRequestType(currentRequest, "DJ")) {
      return (
        <div className="form-scrollable-content">
          <DjStepper
            formData={formData}
            setFormData={setFormData}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            subStep={djSubStep}
            setSubStep={setDjSubStep}
          />
        </div>
      );
    }

    if (isRequestType(currentRequest, "Florist")) {
      return (
        <div className="form-scrollable-content">
          <FloristStepper
            formData={formData}
            setFormData={setFormData}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            subStep={floristSubStep}
            setSubStep={setFloristSubStep}
          />
        </div>
      );
    }

    if (isRequestType(currentRequest, "HairAndMakeup")) {
      const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
      let adjustedSubStep = hairAndMakeupSubStep;
      
      // Adjust the subStep for HairAndMakeup based on service type
      if (serviceType === 'hair' && hairAndMakeupSubStep >= 2) {
        adjustedSubStep = hairAndMakeupSubStep + 1; // Skip makeup step
      } else if (serviceType === 'makeup' && hairAndMakeupSubStep >= 1) {
        adjustedSubStep = hairAndMakeupSubStep + 1; // Skip hair step
      }

      return (
        <div className="form-scrollable-content">
          <HairAndMakeupStepper
            formData={formData}
            setFormData={setFormData}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            subStep={adjustedSubStep}
            setSubStep={setHairAndMakeupSubStep}
          />
        </div>
      );
    }

    return null;
  };

  const renderReviewScreen = () => {
    const formatArrayValue = (value, key) => {
      if (value === null || value === undefined) {
        return 'Not specified';
      }

      // Handle budget ranges
      if (key === 'priceRange') {
        if (!value) return 'Not specified';
        if (value.includes('-')) {
          const [min, max] = value.split('-');
          if (max === '+') {
            return `$${min}+`;
          }
          return `$${min} - $${max}`;
        }
        return `$${value}`;
      }

      // Handle dates
      if (key === 'startDate' || key === 'endDate') {
        return value ? new Date(value).toLocaleDateString() : 'Not specified';
      }

      // Handle arrays
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : 'Not specified';
      }

      // Handle objects with boolean values (like style preferences)
      if (typeof value === 'object' && value !== null) {
        // Special handling for makeup style preferences
        if (key === 'makeupStylePreferences') {
          if (typeof value === 'string') {
            return value;
          }
          const selectedOptions = Object.entries(value)
            .filter(([_, val]) => val === true)
            .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
          return selectedOptions.length > 0 ? selectedOptions.join(', ') : 'Not specified';
        }
        
        // Special handling for floral arrangements
        if (key === 'floralArrangements') {
          const arrangements = [];
          if (value.bridalBouquet) arrangements.push('Bridal Bouquet');
          if (value.bridesmaidBouquets) arrangements.push(`${value.bridesmaidBouquetsQuantity || 1} Bridesmaid Bouquet(s)`);
          if (value.boutonnieres) arrangements.push(`${value.boutonnieresQuantity || 1} Boutonniere(s)`);
          if (value.corsages) arrangements.push(`${value.corsagesQuantity || 1} Corsage(s)`);
          if (value.centerpieces) arrangements.push(`${value.centerpiecesQuantity || 1} Centerpiece(s)`);
          if (value.ceremonyArchFlowers) arrangements.push('Ceremony Arch Flowers');
          if (value.aisleDecorations) arrangements.push('Aisle Decorations');
          if (value.floralInstallations) arrangements.push('Floral Installations');
          if (value.cakeFlowers) arrangements.push('Cake Flowers');
          if (value.loosePetals) arrangements.push('Loose Petals');
          return arrangements.length > 0 ? arrangements.join(', ') : 'Not specified';
        }

        // Special handling for flower preferences
        if (key === 'flowerPreferences') {
          // If it's a ReactQuill object with text property
          if (value && typeof value === 'object' && value.text) {
            // Strip HTML tags and trim whitespace
            const strippedText = value.text.replace(/<[^>]*>/g, '').trim();
            // Check if the content is just empty HTML tags
            if (strippedText === '' || strippedText === '<p><br></p>') {
              return 'Not specified';
            }
            return strippedText;
          }
          // If it's a direct string
          if (typeof value === 'string') {
            const strippedText = value.replace(/<[^>]*>/g, '').trim();
            if (strippedText === '' || strippedText === '<p><br></p>') {
              return 'Not specified';
            }
            return strippedText;
          }
          return 'Not specified';
        }
        
        // Handle other object types
        const selectedOptions = Object.entries(value)
          .filter(([_, val]) => val === true)
          .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
        return selectedOptions.length > 0 ? selectedOptions.join(', ') : 'Not specified';
      }

      // Handle boolean values
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }

      // Handle strings
      if (typeof value === 'string') {
        return value.trim() || 'Not specified';
      }

      return 'Not specified';
    };

    const getCategoryDetails = (category) => {
      const categoryData = formData.requests[category] || {};
      const commonDetails = formData.commonDetails || {};

      // Debug log to see what data we have
      console.log(`Review data for ${category}:`, {
        categoryData,
        priceRange: categoryData.priceRange,
        fullFormData: formData,
        hairAndMakeupData: category === 'HairAndMakeup' ? formData.requests.HairAndMakeup : null
      });

      // Additional debug for HairAndMakeup
      if (category === 'HairAndMakeup') {
        console.log('HairAndMakeup specific debug:', {
          rawPriceRange: formData.requests.HairAndMakeup?.priceRange,
          formattedPriceRange: formatArrayValue(formData.requests.HairAndMakeup?.priceRange, 'priceRange')
        });
      }

      // Get event details
      const eventDetails = {
        'Event Type': formatArrayValue(commonDetails.eventType, 'eventType'),
        'Location': formatArrayValue(commonDetails.location, 'location'),
        'Number of Guests': formatArrayValue(commonDetails.numGuests, 'numGuests'),
        'Date': commonDetails.dateFlexibility === 'specific' 
          ? formatArrayValue(commonDetails.startDate, 'startDate')
          : commonDetails.dateFlexibility === 'range'
            ? `${formatArrayValue(commonDetails.startDate, 'startDate')} to ${formatArrayValue(commonDetails.endDate, 'endDate')}`
            : formatArrayValue(commonDetails.dateTimeframe, 'dateTimeframe')
      };

      // Get category-specific details
      let categoryDetails = {};
      switch (category.toLowerCase()) {
        case 'photography':
          categoryDetails = {
            'Coverage Duration': formatArrayValue(categoryData.duration, 'duration'),
            'Second Photographer': formatArrayValue(categoryData.secondPhotographer, 'secondPhotographer'),
            'Style': formatArrayValue(categoryData.stylePreferences, 'stylePreferences'),
            'Deliverables': formatArrayValue(categoryData.deliverables, 'deliverables'),
            'Budget Range': formatArrayValue(categoryData.priceRange, 'priceRange')
          };
          break;
        case 'videography':
          categoryDetails = {
            'Coverage Duration': formatArrayValue(categoryData.duration, 'duration'),
            'Style': formatArrayValue(categoryData.stylePreferences, 'stylePreferences'),
            'Deliverables': formatArrayValue(categoryData.deliverables, 'deliverables'),
            'Budget Range': formatArrayValue(categoryData.priceRange, 'priceRange')
          };
          break;
        case 'catering':
          categoryDetails = {
            'Food Style': formatArrayValue(categoryData.foodStyle, 'foodStyle'),
            'Cuisine Types': formatArrayValue(categoryData.cuisineTypes, 'cuisineTypes'),
            'Dietary Restrictions': formatArrayValue(categoryData.dietaryRestrictions, 'dietaryRestrictions'),
            'Budget Range': formatArrayValue(categoryData.priceRange, 'priceRange')
          };
          break;
        case 'dj':
          categoryDetails = {
            'Performance Duration': formatArrayValue(categoryData.performanceDuration, 'performanceDuration'),
            'Equipment Needed': formatArrayValue(categoryData.equipmentNeeded, 'equipmentNeeded'),
            'Music Style': formatArrayValue(categoryData.musicStyle, 'musicStyle'),
            'Budget Range': formatArrayValue(categoryData.priceRange, 'priceRange')
          };
          break;
        case 'florist':
          categoryDetails = {
            'Arrangement Types': formatArrayValue(categoryData.floralArrangements, 'floralArrangements'),
            'Color Preferences': formatArrayValue(categoryData.colorPreferences, 'colorPreferences'),
            'Flower Preferences': formatArrayValue(categoryData.flowerPreferences?.text || categoryData.flowerPreferences, 'flowerPreferences'),
            'Additional Services': formatArrayValue(categoryData.additionalServices, 'additionalServices'),
            'Budget Range': formatArrayValue(categoryData.priceRange, 'priceRange')
          };
          break;
        case 'hairandmakeup':
          categoryDetails = {
            'Number of People': formatArrayValue(categoryData.numPeople, 'numPeople'),
            'Hair Style': formatArrayValue(
              typeof categoryData.hairstylePreferences === 'string' 
                ? categoryData.hairstylePreferences 
                : Object.entries(categoryData.hairstylePreferences || {})
                    .filter(([_, val]) => val === true)
                    .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                    .join(', '),
              'hairstylePreferences'
            ),
            'Makeup Style': formatArrayValue(
              typeof categoryData.makeupStylePreferences === 'string' 
                ? categoryData.makeupStylePreferences 
                : Object.entries(categoryData.makeupStylePreferences || {})
                    .filter(([_, val]) => val === true)
                    .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                    .join(', '),
              'makeupStylePreferences'
            ),
            'Budget Range': formatArrayValue(categoryData.priceRange, 'priceRange')
          };
          break;
        default:
          categoryDetails = {};
      }

      return {
        ...eventDetails,
        ...categoryDetails
      };
    };

    return (
      <div className="review-screen" style={{ 
        padding: '0px 20px',
        maxHeight: '70vh',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#888 #f1f1f1'
      }}>
        <div className="review-header" style={{ marginBottom: '30px' }}>
          <p style={{ color: '#666' }}>Please review your selections before proceeding to the next category or submitting all requests.</p>
        </div>

        <div className="event-details-section" style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
            Event Details
          </h3>
          <div className="event-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div className="detail-item">
              <span className="detail-label" style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Event Type</span>
              <span className="detail-value" style={{ color: '#333', fontWeight: '500' }}>{formData.commonDetails.eventType || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label" style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Location</span>
              <span className="detail-value" style={{ color: '#333', fontWeight: '500' }}>{formData.commonDetails.location || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label" style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Number of Guests</span>
              <span className="detail-value" style={{ color: '#333', fontWeight: '500' }}>{formData.commonDetails.numGuests || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label" style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Date</span>
              <span className="detail-value" style={{ color: '#333', fontWeight: '500' }}>
                {formData.commonDetails.dateFlexibility === 'specific' 
                  ? new Date(formData.commonDetails.startDate).toLocaleDateString()
                  : formData.commonDetails.dateFlexibility === 'range'
                    ? `${new Date(formData.commonDetails.startDate).toLocaleDateString()} to ${new Date(formData.commonDetails.endDate).toLocaleDateString()}`
                    : formData.commonDetails.dateTimeframe || 'Not specified'}
              </span>
            </div>
          </div>
        </div>

        <div className="completed-categories" style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
            Completed Categories
          </h3>
          {completedCategories.map((category, index) => {
            const details = getCategoryDetails(category);
            return (
              <div 
                key={index} 
                className="category-review" 
                style={{ 
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ color: '#333', margin: '0' }}>{category}</h4>
                  <button 
                    className="edit-category-btn"
                    onClick={() => handleEditCategory(category)}
                    style={{
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #ddd',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#333',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#e9ecef'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  >
                    Edit
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="category-detail">
                      <span className="detail-label" style={{ color: '#666', display: 'block', marginBottom: '5px' }}>{key}</span>
                      <span className="detail-value" style={{ color: '#333', fontWeight: '500' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="coupon-section" style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
            Apply Coupon
          </h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code"
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                flex: 1
              }}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={couponLoading}
              style={{
                backgroundColor: '#d84888',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {couponLoading ? <Spinner size="sm" /> : "Apply"}
            </button>
          </div>
          {couponMessage && (
            <p style={{ 
              color: appliedCoupon ? '#28a745' : '#dc3545',
              marginTop: '10px',
              fontSize: '14px'
            }}>
              {couponMessage}
            </p>
          )}
        </div>

        <div className="review-actions" style={{ 
          display: 'flex', 
          justifyContent: 'center',
          gap: '20px', 
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#fff',
          padding: '20px 0',
          borderTop: '1px solid #eee'
        }}>
          <button 
            className="request-form-back-btn"
            onClick={() => setShowReview(false)}
            style={{
              backgroundColor: '#f8f9fa',
              color: '#333',
              border: '1px solid #ddd',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '16px',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#e9ecef'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#f8f9fa'}
          >
            Back
          </button>
          <button
            className="submit-continue-btn"
            onClick={() => {
              console.log('Submit button clicked!');
              handleSubmit();
            }}
            style={{
              backgroundColor: '#d84888',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '16px',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c73d7a'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#d84888'}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Spinner size="sm" /> : "Submit and Continue"}
          </button>
        </div>
      </div>
    );
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    setCurrentStep(1);
  };

  return (
    <div>
      {isAuthModalOpen && (
        <AuthModal
          setIsModalOpen={setIsAuthModalOpen}
          onSuccess={handleAuthSuccess}
        />
      )}
      {isModalOpen && <SignInModal setIsModalOpen={setIsModalOpen} />}
      
      <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
        {/* Missing Fields Message */}
        {missingFields.length > 0 && (
          <div className="missing-fields" style={{ marginBottom: "20px", color: "red" }}>
            <h4>Missing Required Fields:</h4>
            <ul>
              {missingFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="request-form-overall-container">
        {/* Status Bar */}
        <div
          className="request-form-status-container desktop-only"
          style={{ height: "80vh", padding: "40px" }}
        >
          <div className="request-form-box">
            <StatusBar 
              steps={getSteps()} 
              currentStep={getCurrentStepIndex()} 
              onStepClick={handleStepClick}
              visitedSteps={visitedSteps}
            />
          </div>
        </div>
        <div
          className="request-form-container-details"
          style={{ alignItems: "normal" }}
        >
          <div className="request-form-status-container mobile-only">
            <div className="request-form-box">
              <StatusBar 
                steps={getSteps()} 
                currentStep={getCurrentStepIndex()} 
                onStepClick={handleStepClick}
                visitedSteps={visitedSteps}
              />
            </div>
          </div>

          <div className="form-header-section">
            <h2 className="request-form-header">
              {showReview ? "Review Your Request" : getSteps()[getCurrentStepIndex()]}
            </h2>
          </div>

          {showReview ? (
            renderReviewScreen()
          ) : currentStep === 0 ? (
            <div className="form-scrollable-content">
              <MasterRequestForm
                formData={formData}
                setFormData={setFormData}
                onNext={handleNext}
              />
            </div>
          ) : (
            <div className="request-stepper-content">
              {renderRequestForm()}
            </div>
          )}

          {/* Navigation Buttons */}
          {!showReview && (
            <div className="form-button-container">
              {currentStep === 0 && (
                <button
                  className="request-form-back-btn"
                  onClick={() => navigate("/request-categories")}
                  disabled={isSubmitting}
                >
                  Back
                </button>
              )}
              {currentStep > 0 && (
                <button
                  className="request-form-back-btn"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  Back
                </button>
              )}
              {currentStep < getSteps().length - 1 && (
                <button
                  className="request-form-back-and-foward-btn"
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  Next
                </button>
              )}
              {currentStep === getSteps().length - 1 && (
                <button
                  className="request-form-back-and-foward-btn"
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Spinner size="sm" /> : "Next"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MasterRequestFlow;
