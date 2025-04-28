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
    requests: {},
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
          "Catering - Basic Details",
          "Catering - Logistics & Extra",
          "Catering - Budget & Additional Info"
        );
      } else if (isRequestType(request, "DJ")) {
        steps.push(
          "DJ Services - Basic Details",
          "DJ Services - Equipment & Setup",
          "DJ Services - Music & Special Requests"
        );
      } else if (isRequestType(request, "Florist")) {
        steps.push(
          "Florist - Floral Arrangements",
          "Florist - Color & Flower Preferences",
          "Florist - Services & Budget"
        );
      } else if (isRequestType(request, "HairAndMakeup")) {
        steps.push("Hair and Makeup - Basic Details", "Hair and Makeup - Style & Deliverables");
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
          index += 2; // Assuming Hair and Makeup is always the last two steps
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
        index += 3;
      } else if (isRequestType(request, "HairAndMakeup")) {
        index += 2;
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
    if (commonDetails.dateFlexibility === "specific" && !commonDetails.startDate) {
      requiredFields.push("Event Date");
    }
    if (commonDetails.dateFlexibility === "range" && (!commonDetails.startDate || !commonDetails.endDate)) {
      requiredFields.push("Date Range");
    }
    if (commonDetails.dateFlexibility === "flexible" && !commonDetails.dateTimeframe) {
      requiredFields.push("Preferred Timeframe");
    }

    setMissingFields(requiredFields);
    return requiredFields.length === 0;
  };

  const validateCurrentStep = () => {
    const requiredFields = [];
    const currentRequest = formData.selectedRequests[currentStep - 1];

    if (currentRequest === "Photography") {
      const photographyData = formData.requests.Photography || {};
      
      // Only validate the current sub-step
      if (currentStep === 1) { // First step of photography
        if (!photographyData.duration && !photographyData.durationUnknown) {
          requiredFields.push("Hours of Coverage");
        }
        if (!photographyData.secondPhotographer) {
          requiredFields.push("Second Photographer Preference");
        }
      } else if (currentStep === 2) { // Second step of photography
        if (!photographyData.stylePreferences || Object.keys(photographyData.stylePreferences).length === 0) {
          requiredFields.push("Style Preferences");
        }
        if (!photographyData.deliverables || Object.keys(photographyData.deliverables).length === 0) {
          requiredFields.push("Deliverables");
        }
      }
      // Third step (additional info and photos) doesn't have required fields
    } else if (currentRequest === "Videography") {
      const videographyData = formData.requests.Videography || {};
      
      // Only validate the current sub-step
      if (currentStep === 1) { // First step of videography
        if (!videographyData.duration && !videographyData.durationUnknown) {
          requiredFields.push("Hours of Coverage");
        }
        if (!videographyData.stylePreferences || Object.keys(videographyData.stylePreferences).length === 0) {
          requiredFields.push("Style Preferences");
        }
      } else if (currentStep === 2) { // Second step of videography
        if (!videographyData.deliverables || Object.keys(videographyData.deliverables).length === 0) {
          requiredFields.push("Deliverables");
        }
      }
      // Third step (additional info and videos) doesn't have required fields
    } else if (currentRequest === "Catering") {
      // Validation for catering
      // ... existing validation logic ...
    } else if (currentRequest === "DJ") {
      // Validation for DJ
      // ... existing validation logic ...
    } else if (currentRequest === "Florist") {
      // Validation for florist
      // ... existing validation logic ...
    } else if (currentRequest === "HairAndMakeup") {
      // Validation for hair and makeup
      // ... existing validation logic ...
    } else {
      // Validation for other request types
      // ... existing validation logic ...
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
          return floristSubStep === 2;
        } else if (isRequestType(currentRequest, "HairAndMakeup")) {
          return hairAndMakeupSubStep === 3;
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
          setHairAndMakeupSubStep(hairAndMakeupSubStep + 1);
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
    console.log("Starting submission...");
    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("User:", user);
      
      if (!user) {
        console.log("No user found, showing auth modal");
        setIsAuthModalOpen(true);
        return;
      }

      // Get the user's profile data
      const { data: userData, error: userError } = await supabase
        .from("individual_profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("Error fetching user profile:", userError);
        throw userError;
      }

      console.log("User profile:", userData);

      // Generate event title
      const firstName = userData.first_name || "Unknown";
      const generatedEventTitle = `${firstName}'s ${formData.commonDetails.eventType} Event`;

      console.log("Form data:", formData);
      console.log("Completed categories:", completedCategories);

      // Create request data for each category
      const requests = await Promise.all(
        completedCategories.map(async (category) => {
          console.log(`Processing category: ${category}`);
          const categoryData = formData.requests[category] || {};
          const commonDetails = formData.commonDetails || {};

          console.log("Date debugging:", {
            dateFlexibility: commonDetails.dateFlexibility,
            startDate: commonDetails.startDate,
            endDate: commonDetails.endDate,
            dateTimeframe: commonDetails.dateTimeframe
          });

          const requestData = {
            profile_id: user.id,
            event_type: commonDetails.eventType,
            event_title: generatedEventTitle,
            date_type: commonDetails.dateType || commonDetails.dateFlexibility,
            date_flexibility: commonDetails.dateFlexibility,
            start_date: commonDetails.dateFlexibility === "specific" ? commonDetails.startDate : 
                       commonDetails.dateFlexibility === "range" ? commonDetails.startDate : null,
            end_date: commonDetails.dateFlexibility === "range" ? commonDetails.endDate : null,
            time_of_day: commonDetails.timeOfDay || null,
            location: commonDetails.location,
            duration: categoryData.duration || null,
            indoor_outdoor: commonDetails.indoorOutdoor || null,
            status: "open",
            price_range: categoryData.priceRange,
            coupon_code: appliedCoupon?.code || null,
            second_photographer: categoryData.secondPhotographer || null,
            num_people: commonDetails.numGuests,
            style_preferences: categoryData.stylePreferences || {},
            deliverables: categoryData.deliverables || {},
            additional_comments: categoryData.additionalInfo || null,
            pinterest_link: categoryData.pinterestBoard || null,
            start_time: commonDetails.startTime || null,
            end_time: commonDetails.endTime || null
          };

          console.log("Request data being sent:", requestData);

          // Insert into appropriate table based on category
          const requestPayload = category.toLowerCase() === 'videography' ? {
            ...Object.fromEntries(
              Object.entries(requestData).filter(([key]) => key !== 'profile_id')
            ),
            user_id: user.id, // Use user_id instead of profile_id for videography
            coverage: commonDetails.eventType?.toLowerCase() === "wedding" ? {
              duration: categoryData.durationUnknown ? null : categoryData.duration ? parseInt(categoryData.duration) : null,
              numPeople: commonDetails.numGuests ? parseInt(commonDetails.numGuests) : null,
              ...categoryData.weddingDetails
            } : {
              duration: categoryData.durationUnknown ? null : categoryData.duration ? parseInt(categoryData.duration) : null,
              numPeople: commonDetails.numGuests ? parseInt(commonDetails.numGuests) : null
            },
            status: "pending" // Videography uses "pending" instead of "open"
          } : requestData;

          // Debug logging for videography requests
          if (category.toLowerCase() === 'videography') {
            console.log('Videography request payload:', {
              eventType: commonDetails.eventType,
              categoryData: categoryData,
              coverage: requestPayload.coverage,
              duration: categoryData.duration,
              numGuests: commonDetails.numGuests,
              weddingDetails: categoryData.weddingDetails
            });
          }

          const { data: request, error: requestError } = await supabase
            .from(`${category.toLowerCase()}_requests`)
            .insert([requestPayload])
            .select()
            .single();

          if (requestError) {
            console.error(`Error submitting ${category} request:`, requestError);
            throw requestError;
          }

          // Handle photo uploads for photography and videography requests
          if ((category.toLowerCase() === 'photography' || category.toLowerCase() === 'videography') && categoryData.photos?.length > 0) {
            // First, upload all photos and get their URLs
            const photoUploadPromises = categoryData.photos.map(async (photo) => {
              const fileExt = photo.name.split('.').pop();
              const fileName = `${uuidv4()}.${fileExt}`;
              const filePath = `${user.id}/${request.id}/${fileName}`;

              const { error: uploadError } = await supabase.storage
                .from('request-media')
                .upload(filePath, photo.file);

              if (uploadError) {
                console.error('Error uploading photo:', uploadError);
                throw uploadError;
              }

              const { data: { publicUrl } } = supabase.storage
                .from('request-media')
                .getPublicUrl(filePath);

              return {
                publicUrl,
                filePath
              };
            });

            // Wait for all photo uploads to complete
            const uploadedPhotos = await Promise.all(photoUploadPromises);

            // Then insert all photo records in a single batch
            const photoRecords = uploadedPhotos.map(({ publicUrl, filePath }) => ({
              request_id: request.id,
              user_id: user.id,
              photo_url: publicUrl,
              file_path: filePath
            }));

            const { error: batchPhotoError } = await supabase
              .from(category.toLowerCase() === 'photography' ? 'event_photos' : 'videography_photos')
              .insert(photoRecords);

            if (batchPhotoError) {
              console.error('Error saving photo records:', batchPhotoError);
              throw batchPhotoError;
            }
          }

          console.log(`Successfully submitted ${category} request:`, request);
          return request;
        })
      );

      console.log("All requests submitted successfully:", requests);

      // Send email notification
      try {
        const emailPayload = { 
          category: completedCategories[0].toLowerCase(),
          requestIds: requests.map(r => r.id)
        };
        const response = await fetch('https://bidi-express.vercel.app/send-resend-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload),
        });

        if (!response.ok) {
          console.error('Failed to send email:', await response.json());
        } else {
          console.log('Emails sent successfully!');
        }
      } catch (error) {
        console.error('Error sending email:', error);
      }

      // Check if there are more categories to complete
      const remainingCategories = selectedCategories.filter(
        cat => !completedCategories.includes(cat)
      );

      console.log("Remaining categories:", remainingCategories);

      if (remainingCategories.length > 0) {
        console.log("Continuing to next category");
        handleContinueToNextCategory();
      } else {
        console.log("All categories completed, navigating to success page");
        navigate("/success-request", {
          state: {
            requestIds: requests.map(r => r.id),
            category: completedCategories[0].toLowerCase(),
            message: "Your requests have been submitted successfully!"
          }
        });
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError("Failed to submit request. Please try again.");
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
        if (stepIndex < currentIndex + 3) {
          setCurrentStep(i + 1);
          setFloristSubStep(stepIndex - currentIndex);
          return;
        }
        currentIndex += 3;
      } else if (isRequestType(request, "HairAndMakeup")) {
        if (stepIndex < currentIndex + 4) {
          setCurrentStep(i + 1);
          setHairAndMakeupSubStep(stepIndex - currentIndex);
          return;
        }
        currentIndex += 4;
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
        requestOffset += 3;
      } else if (isRequestType(request, "DJ")) {
        requestOffset += 3;
      } else if (isRequestType(request, "Florist")) {
        requestOffset += 3;
      } else if (isRequestType(request, "HairAndMakeup")) {
        requestOffset += 4;
      } else {
        requestOffset += 1;
      }
    }
    
    // Check if we're on the budget step for any request type
    const isBudgetStep = (requestType) => {
      if (isRequestType(requestType, "Photography") || isRequestType(requestType, "Videography") || isRequestType(requestType, "HairAndMakeup")) {
        return stepIndex === requestOffset + 3;
      } else if (isRequestType(requestType, "Catering") || isRequestType(requestType, "DJ") || isRequestType(requestType, "Florist")) {
        return stepIndex === requestOffset + 2;
      }
      return false;
    };

    if (isBudgetStep(currentRequest)) {
      return (
        <div className="form-scrollable-content">
          <BudgetForm
            formData={formData}
            setFormData={setFormData}
            category={currentRequest.toLowerCase()}
          />
        </div>
      );
    }

    // Render the appropriate stepper for non-budget steps
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
      return (
        <div className="form-scrollable-content">
          <HairAndMakeupStepper
            formData={formData}
            setFormData={setFormData}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            subStep={hairAndMakeupSubStep}
            setSubStep={setHairAndMakeupSubStep}
          />
        </div>
      );
    }

    return null;
  };

  const renderReviewScreen = () => {
    const getCategoryDetails = (category) => {
      const categoryData = formData.requests[category] || {};
      const commonDetails = formData.commonDetails || {};

      // Debug log to see what data we have
      console.log(`Review data for ${category}:`, {
        categoryData,
        priceRange: categoryData.priceRange,
        fullFormData: formData
      });

      const formatArrayValue = (value, key) => {
        if (value === null || value === undefined) {
          return 'Not specified';
        }

        // Handle budget ranges
        if (key === 'priceRange') {
          console.log('Formatting price range:', value);
          if (value && value.includes('-')) {
            const [min, max] = value.split('-');
            if (max === '+') {
              return `$${min}+`;
            }
            return `$${min} - $${max}`;
          }
          return value ? `$${value}` : 'Not specified';
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
          const selectedOptions = Object.entries(value)
            .filter(([_, val]) => val === true)
            .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
          return selectedOptions.length > 0 ? selectedOptions.join(', ') : 'Not specified';
        }

        // Handle boolean values
        if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No';
        }

        return value || 'Not specified';
      };

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
            'Budget Range': formatArrayValue(formData.requests[category]?.budget?.priceRange || categoryData.priceRange, 'priceRange')
          };
          console.log('Photography details with budget:', {
            categoryDetails,
            budget: formData.requests[category]?.budget,
            rawPriceRange: formData.requests[category]?.budget?.priceRange
          });
          break;
        case 'videography':
          categoryDetails = {
            'Coverage Duration': formatArrayValue(categoryData.duration, 'duration'),
            'Style': formatArrayValue(categoryData.stylePreferences, 'stylePreferences'),
            'Deliverables': formatArrayValue(categoryData.deliverables, 'deliverables'),
            'Budget Range': formatArrayValue(formData.requests[category]?.budget?.priceRange || categoryData.priceRange, 'priceRange')
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
            'Arrangement Types': formatArrayValue(categoryData.arrangementTypes, 'arrangementTypes'),
            'Color Preferences': formatArrayValue(categoryData.colorPreferences, 'colorPreferences'),
            'Flower Preferences': formatArrayValue(categoryData.flowerPreferences, 'flowerPreferences'),
            'Budget Range': formatArrayValue(categoryData.priceRange, 'priceRange')
          };
          break;
        case 'hairandmakeup':
          categoryDetails = {
            'Number of People': formatArrayValue(categoryData.numPeople, 'numPeople'),
            'Hair Style': formatArrayValue(categoryData.hairStyle, 'hairStyle'),
            'Makeup Style': formatArrayValue(categoryData.makeupStyle, 'makeupStyle'),
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
            onClick={handleSubmit}
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
