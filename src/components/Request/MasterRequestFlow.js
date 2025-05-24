import React, { useState, useEffect } from "react";
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
import WeddingPlanningStepper from './WeddingPlanning/WeddingPlanningStepper';
import { supabase } from "../../supabaseClient";
import AuthModal from "./Authentication/AuthModal";
import SignInModal from "./Event/SignInModal";
import { v4 as uuidv4 } from 'uuid';
import { saveFormData, loadFormData, clearFormData } from '../../utils/localStorage';
import { toast } from 'react-toastify';

function MasterRequestFlow() {
  const location = useLocation();
  const navigate = useNavigate();

  // Accept both new and legacy vendor info structure
  const vendorData = location.state?.vendor?.vendor
    ? location.state.vendor
    : location.state?.vendor
      ? { vendor: location.state.vendor, image: location.state.vendor.profile_photo_url }
      : null;
  const selectedCategories = location.state?.selectedCategories || [];
  const [completedCategories, setCompletedCategories] = useState([]);
  const [showReview, setShowReview] = useState(false);

  // Debug log for selected categories and vendor data
  console.log("Selected Categories:", selectedCategories);
  console.log("Vendor Data:", vendorData);

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
    vendor: vendorData // Add vendor data to form state
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
  const [weddingPlanningSubStep, setWeddingPlanningSubStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState(new Set([0]));
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [error, setError] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Add state for request IDs
  const [requestIds, setRequestIds] = useState({
    photography: null,
    videography: null,
    catering: null,
    dj: null,
    florist: null,
    beauty: null,
    weddingPlanning: null
  });

  // Helper function to check request type case-insensitively
  const isRequestType = (request, type) => {
    if (type === "DJ") {
      return request?.toLowerCase().includes("dj");
    }
    if (type === "WeddingPlanning") {
      return request?.toLowerCase().includes("wedding") && request?.toLowerCase().includes("planning");
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
          "Catering - Food & Special Requests",
          "Catering - Logistics & Setup",
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
        if (serviceType === 'hair') {
          steps.push(
            "Hair and Makeup - Basic Details",
            "Hair and Makeup - Hair Services",
            "Hair and Makeup - Inspiration",
            "Hair and Makeup - Budget"
          );
        } else if (serviceType === 'makeup') {
          steps.push(
            "Hair and Makeup - Basic Details",
            "Hair and Makeup - Makeup Services",
            "Hair and Makeup - Inspiration",
            "Hair and Makeup - Budget"
          );
        } else {
          steps.push(
            "Hair and Makeup - Basic Details",
            "Hair and Makeup - Hair Services",
            "Hair and Makeup - Makeup Services",
            "Hair and Makeup - Inspiration",
            "Hair and Makeup - Budget"
          );
        }
      } else if (isRequestType(request, "WeddingPlanning")) {
        steps.push(
          "Wedding Planning - Basic Details",
          "Wedding Planning - Services",
          "Wedding Planning - Inspiration",
          "Wedding Planning - Preferences"
        );
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
          const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
          if (serviceType === 'hair') {
            index += hairAndMakeupSubStep;
          } else if (serviceType === 'makeup') {
            index += hairAndMakeupSubStep;
          }
          return index;
        } else if (isRequestType(request, "WeddingPlanning")) {
          index += weddingPlanningSubStep;
          return index;
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
        index += 5;
      } else if (isRequestType(request, "HairAndMakeup")) {
        const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
        if (serviceType === 'hair' || serviceType === 'makeup') {
          index += 4;
        } else {
          index += 5;
        }
      } else if (isRequestType(request, "WeddingPlanning")) {
        index += 4;
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
          return floristSubStep === 4;
        } else if (isRequestType(currentRequest, "HairAndMakeup")) {
          const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
          if (serviceType === 'hair') {
            return hairAndMakeupSubStep === 3; // Basic -> Hair -> Inspiration -> Budget
          } else if (serviceType === 'makeup') {
            return hairAndMakeupSubStep === 3; // Basic -> Makeup -> Inspiration -> Budget
          }
          return hairAndMakeupSubStep === 4; // Basic -> Hair -> Makeup -> Inspiration -> Budget
        } else if (isRequestType(currentRequest, "WeddingPlanning")) {
          return weddingPlanningSubStep === 3; // Basic -> Services -> Inspiration -> Preferences
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
          if (serviceType === 'hair') {
            // For hair only: Basic -> Hair -> Inspiration -> Budget
            setHairAndMakeupSubStep(hairAndMakeupSubStep + 1);
          } else if (serviceType === 'makeup') {
            // For makeup only: Basic -> Makeup -> Inspiration -> Budget
            setHairAndMakeupSubStep(hairAndMakeupSubStep + 1);
          } else {
            // For both: Basic -> Hair -> Makeup -> Inspiration -> Budget
            setHairAndMakeupSubStep(hairAndMakeupSubStep + 1);
          }
        } else if (isRequestType(currentRequest, "WeddingPlanning")) {
          setWeddingPlanningSubStep(weddingPlanningSubStep + 1);
        }
        setVisitedSteps(prev => new Set([...prev, getCurrentStepIndex() + 1]));
      }
    }
  };

  const handleContinueToNextCategory = () => {
    setShowReview(false);
    // Add current category to completed categories
    setCompletedCategories(prev => [...prev, selectedCategories[currentStep - 1]]);
    
    // Find the next category that hasn't been completed
    const remainingCategories = formData.selectedRequests.filter(
      cat => !completedCategories.includes(cat) && cat !== selectedCategories[currentStep - 1]
    );
    
    if (remainingCategories.length > 0) {
      const nextCategoryIndex = formData.selectedRequests.indexOf(remainingCategories[0]);
      setCurrentStep(nextCategoryIndex + 1);
      // Reset sub-steps for the new category
      setPhotographySubStep(0);
      setVideographySubStep(0);
      setCateringSubStep(0);
      setDjSubStep(0);
      setFloristSubStep(0);
      setHairAndMakeupSubStep(0);
      setWeddingPlanningSubStep(0);
      // Preserve vendorData in the state
      setFormData(prev => ({
        ...prev,
        vendor: vendorData
      }));
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
    setWeddingPlanningSubStep(0);
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
    } else if (isRequestType(currentRequest, "WeddingPlanning")) {
      if (weddingPlanningSubStep > 0) {
        setWeddingPlanningSubStep(weddingPlanningSubStep - 1);
      } else {
        setCurrentStep(currentStep - 1);
        setWeddingPlanningSubStep(0);
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

  // Add email notification function
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

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      let submissionSuccess = false;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthModalOpen(true);
        return;
      }

      // Get user's first name from individual_profiles and email from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('individual_profiles')
        .select('first_name')
        .eq('id', user.id)
        .single();

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (profileError || userError) {
        console.error('Error fetching user data:', profileError || userError);
        toast.error('Failed to fetch user data');
        return;
      }

      const firstName = profileData?.first_name || 'User';
      const userEmail = userData?.email;

      // Format request title
      const requestTitle = `${firstName}'s ${selectedCategories[currentStep - 1]} Request`;

      // Process each request type
      if (isRequestType(selectedCategories[currentStep - 1], "Photography")) {
        const request = formData.requests.Photography || {};
        const photographyRequestData = {
          profile_id: user.id,
          vendor_id: formData.vendor?.id || vendorData?.id || null, // Try both sources for vendor ID
          event_title: requestTitle,
          status: 'open',
          event_type: formData.commonDetails.eventType,
          location: formData.commonDetails.location,
          date_flexibility: formData.commonDetails.dateFlexibility,
          start_date: formData.commonDetails.startDate,
          end_date: formData.commonDetails.endDate,
          date_timeframe: formData.commonDetails.dateTimeframe,
          start_time: formData.commonDetails.startTime,
          end_time: formData.commonDetails.endTime,
          duration: request.duration ? request.duration.toString() : null,
          duration_unknown: request.durationUnknown || false,
          second_photographer: request.secondPhotographer || 'no',
          style_preferences: JSON.stringify(request.stylePreferences || {}),
          deliverables: JSON.stringify(request.deliverables || {}),
          additional_info: request.additionalInfo || '',
          price_range: request.priceRange || 'Not specified',
          pinterest_link: request.pinterestBoard || '',
          wedding_details: formData.commonDetails.eventType === 'Wedding' ? JSON.stringify(request.weddingDetails || {}) : null,
          num_people: formData.commonDetails.numGuests ? parseInt(formData.commonDetails.numGuests, 10) : null,
          date_type: formData.commonDetails.dateFlexibility || null,
          indoor_outdoor: formData.commonDetails.indoorOutdoor || null,
          coupon_code: appliedCoupon?.code || null,
          start_time_unknown: formData.commonDetails.startTimeUnknown || false,
          end_time_unknown: formData.commonDetails.endTimeUnknown || false,
          second_photographer_unknown: request.secondPhotographerUnknown || false,
          num_people_unknown: request.numPeopleUnknown || false,
          time_of_day: request.timeOfDay || null,
          additional_comments: request.additionalComments || null
        };

        // Insert into photography_requests table
        const { data: newPhotographyRequest, error: photographyRequestError } = await supabase
          .from('photography_requests')
          .insert([photographyRequestData])
          .select()
          .single();

        if (photographyRequestError) {
          console.error('Photography request error:', photographyRequestError);
          throw photographyRequestError;
        }

        // Handle photo uploads if any
        if (request.photos && request.photos.length > 0) {
          console.log(`Processing ${request.photos.length} photos for Photography`);
          const uploadPromises = request.photos.map(async (photo) => {
            try {
              // Ensure we have the file object
              if (!photo.file) {
                console.error('Photo object missing file property:', photo);
                throw new Error('Invalid photo object');
              }

              const fileExt = photo.file.name.split('.').pop();
              const fileName = `${uuidv4()}.${fileExt}`;
              const filePath = `photography/${user.id}/${newPhotographyRequest.id}/${fileName}`;
              
              console.log('Starting photo upload process:', {
                filePath,
                fileName,
                fileType: photo.file.type,
                fileSize: photo.file.size,
                bucket: 'request-media',
                fullPath: `request-media/${filePath}`
              });

              // Upload the file
              const { error: uploadError, data: uploadData } = await supabase.storage
                .from('request-media')
                .upload(filePath, photo.file, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (uploadError) {
                console.error('Photo upload error details:', {
                  error: uploadError,
                  filePath,
                  fileName,
                  fileType: photo.file.type,
                  fileSize: photo.file.size
                });
                throw uploadError;
              }

              console.log('Photo upload successful:', uploadData);

              const { data: { publicUrl } } = supabase.storage
                .from('request-media')
                .getPublicUrl(filePath);

              console.log('Generated public URL:', publicUrl);

              // Determine the correct photo table based on category
              let photoTable;
              switch('photography') {
                case 'photography':
                  photoTable = 'photography_photos';
                  break;
                case 'beauty':
                  photoTable = 'beauty_photos';
                  break;
                case 'weddingplanning':
                  photoTable = 'wedding_planning_photos';
                  break;
                default:
                  throw new Error(`Unknown category for photo upload: photography`);
              }

              console.log('Inserting photo record into table:', photoTable);

              const { error: photoInsertError, data: insertData } = await supabase
                .from(photoTable)
                .insert([{
                  request_id: newPhotographyRequest.id,
                  user_id: user.id,
                  photo_url: publicUrl,
                  file_path: filePath
                }])
                .select();

              if (photoInsertError) {
                console.error('Photo insert error details:', {
                  error: photoInsertError,
                  data: {
                    request_id: newPhotographyRequest.id,
                    user_id: user.id,
                    photo_url: publicUrl,
                    file_path: filePath
                  }
                });
                throw photoInsertError;
              }

              console.log('Photo record inserted successfully:', insertData);
            } catch (err) {
              console.error('Error in photo upload process:', err);
              throw err;
            }
          });

          try {
            await Promise.all(uploadPromises);
            console.log(`All photo uploads completed successfully for Photography`);
          } catch (err) {
            console.error('Error in photo upload batch:', err);
            throw err;
          }
        } else {
          console.log(`No photos to upload for Photography`);
        }

        submissionSuccess = true;
        setRequestIds(prev => ({ ...prev, photography: newPhotographyRequest.id }));
        
        // Check if there are more categories to complete
        const remainingCategories = formData.selectedRequests.filter(
          cat => !completedCategories.includes(cat) && cat !== selectedCategories[currentStep - 1]
        );

        if (remainingCategories.length > 0) {
          // Move to the next category
          handleContinueToNextCategory();
        } else {
          // All categories completed, show success message
          toast.success('All requests submitted successfully!');
          
          // Send email notification to the user
          if (userEmail) {
            const emailContent = `
              <h2>Your Bidi Request Has Been Submitted</h2>
              <p>Dear ${firstName},</p>
              <p>Your request has been successfully submitted. Here are the details:</p>
              <ul>
                <li>Event Type: ${selectedCategories[currentStep - 1]}</li>
                <li>Location: ${formData.location || 'Not specified'}</li>
                <li>Date: ${formData.date || 'Not specified'}</li>
                <li>Number of Guests: ${formData.guests || 'Not specified'}</li>
              </ul>
              <p>You can now:</p>
              <ul>
                <li>Browse and select vendors for your request</li>
                <li>Wait for vendors to find your request and send bids</li>
              </ul>
              <p>Best regards,<br>The Bidi Team</p>
            `;

            await sendEmailNotification(
              userEmail,
              'Your Bidi Request Has Been Submitted',
              emailContent
            );
          }

          // Clear form data and navigate to success page
          setFormData({});
          navigate('/success-request', {
            state: {
              message: 'Your request has been submitted successfully!',
              photographyId: newPhotographyRequest.id,
              videographyId: requestIds.videography,
              cateringId: requestIds.catering,
              djId: requestIds.dj,
              floristId: requestIds.florist,
              beautyId: requestIds.beauty,
              weddingPlanningId: requestIds.weddingPlanning,
              selectedCategories: formData.selectedRequests,
              vendor: vendorData
            }
          });
        }
      } else if (isRequestType(selectedCategories[currentStep - 1], "Videography")) {
        console.log('Starting videography request submission...');
        const request = formData.requests.Videography || {};
        console.log('Videography request data:', request);
        
        const videographyRequestData = {
          user_id: user.id,
          vendor_id: formData.vendor?.id || vendorData?.id || null, // Try both sources for vendor ID
          event_title: requestTitle,
          status: 'open',
          event_type: formData.commonDetails.eventType,
          location: formData.commonDetails.location,
          date_flexibility: formData.commonDetails.dateFlexibility,
          start_date: formData.commonDetails.startDate,
          end_date: formData.commonDetails.endDate,
          date_timeframe: formData.commonDetails.dateTimeframe,
          start_time: formData.commonDetails.startTime,
          end_time: formData.commonDetails.endTime,
          duration: request.duration ? parseInt(request.duration, 10) : null,
          duration_unknown: request.durationUnknown || false,
          second_photographer: request.secondPhotographer || 'no',
          style_preferences: JSON.stringify(request.stylePreferences || {}),
          deliverables: JSON.stringify(request.deliverables || {}),
          additional_info: request.additionalInfo || '',
          price_range: request.priceRange || 'Not specified',
          pinterest_link: request.pinterestBoard || '',
          wedding_details: formData.commonDetails.eventType === 'Wedding' ? JSON.stringify(request.weddingDetails || {}) : null,
          num_people: formData.commonDetails.numGuests ? parseInt(formData.commonDetails.numGuests, 10) : null,
          date_type: formData.commonDetails.dateFlexibility || null,
          indoor_outdoor: formData.commonDetails.indoorOutdoor || null,
          coupon_code: appliedCoupon?.code || null,
          start_time_unknown: formData.commonDetails.startTimeUnknown || false,
          end_time_unknown: formData.commonDetails.endTimeUnknown || false,
          num_people_unknown: request.numPeopleUnknown || false,
          coverage: JSON.stringify(request.coverage || {}),
          additional_comments: request.additionalComments || null
        };

        console.log('Preparing to insert videography request:', videographyRequestData);

        // Insert into videography_requests table
        const { data: newVideographyRequest, error: videographyRequestError } = await supabase
          .from('videography_requests')
          .insert([videographyRequestData])
          .select()
          .single();

        if (videographyRequestError) {
          console.error('Videography request error:', videographyRequestError);
          throw videographyRequestError;
        }

        console.log('Videography request inserted successfully:', newVideographyRequest);

        // Update request IDs state immediately
        setRequestIds(prev => ({ ...prev, videography: newVideographyRequest.id }));

        // Handle photo uploads if any
        if (request.photos && request.photos.length > 0) {
          console.log(`Processing ${request.photos.length} photos for Videography`);
          const uploadPromises = request.photos.map(async (photo) => {
            try {
              // Ensure we have the file object
              if (!photo.file) {
                console.error('Photo object missing file property:', photo);
                throw new Error('Invalid photo object');
              }

              const fileExt = photo.file.name.split('.').pop();
              const fileName = `${uuidv4()}.${fileExt}`;
              const filePath = `videography/${user.id}/${newVideographyRequest.id}/${fileName}`;
              
              console.log('Starting photo upload process:', {
                filePath,
                fileName,
                fileType: photo.file.type,
                fileSize: photo.file.size,
                bucket: 'request-media',
                fullPath: `request-media/${filePath}`
              });

              // Upload the file
              const { error: uploadError, data: uploadData } = await supabase.storage
                .from('request-media')
                .upload(filePath, photo.file, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (uploadError) {
                console.error('Photo upload error details:', {
                  error: uploadError,
                  filePath,
                  fileName,
                  fileType: photo.file.type,
                  fileSize: photo.file.size
                });
                throw uploadError;
              }

              console.log('Photo upload successful:', uploadData);

              const { data: { publicUrl } } = supabase.storage
                .from('request-media')
                .getPublicUrl(filePath);

              console.log('Generated public URL:', publicUrl);

              console.log('Inserting photo record into videography_photos table');

              const { error: photoInsertError, data: insertData } = await supabase
                .from('videography_photos')
                .insert([{
                  request_id: newVideographyRequest.id,
                  user_id: user.id,
                  photo_url: publicUrl,
                  file_path: filePath
                }])
                .select();

              if (photoInsertError) {
                console.error('Photo insert error details:', {
                  error: photoInsertError,
                  data: {
                    request_id: newVideographyRequest.id,
                    user_id: user.id,
                    photo_url: publicUrl,
                    file_path: filePath
                  }
                });
                throw photoInsertError;
              }

              console.log('Photo record inserted successfully:', insertData);
            } catch (err) {
              console.error('Error in photo upload process:', err);
              throw err;
            }
          });

          try {
            await Promise.all(uploadPromises);
            console.log(`All photo uploads completed successfully for Videography`);
          } catch (err) {
            console.error('Error in photo upload batch:', err);
            throw err;
          }
        } else {
          console.log(`No photos to upload for Videography`);
        }

        submissionSuccess = true;
        setRequestIds(prev => ({ ...prev, videography: newVideographyRequest.id }));
        
        // Check if there are more categories to complete
        const remainingCategories = formData.selectedRequests.filter(
          cat => !completedCategories.includes(cat) && cat !== selectedCategories[currentStep - 1]
        );

        if (remainingCategories.length > 0) {
          // Move to the next category
          handleContinueToNextCategory();
        } else {
          // All categories completed, show success message
          toast.success('All requests submitted successfully!');
          
          // Send email notification to the user
          if (userEmail) {
            const emailContent = `
              <h2>Your Bidi Request Has Been Submitted</h2>
              <p>Dear ${firstName},</p>
              <p>Your request has been successfully submitted. Here are the details:</p>
              <ul>
                <li>Event Type: ${selectedCategories[currentStep - 1]}</li>
                <li>Location: ${formData.location || 'Not specified'}</li>
                <li>Date: ${formData.date || 'Not specified'}</li>
                <li>Number of Guests: ${formData.guests || 'Not specified'}</li>
              </ul>
              <p>You can now:</p>
              <ul>
                <li>Browse and select vendors for your request</li>
                <li>Wait for vendors to find your request and send bids</li>
              </ul>
              <p>Best regards,<br>The Bidi Team</p>
            `;

            await sendEmailNotification(
              userEmail,
              'Your Bidi Request Has Been Submitted',
              emailContent
            );
          }

          // Clear form data and navigate to success page
          setFormData({});
          navigate('/success-request', {
            state: {
              message: 'Your request has been submitted successfully!',
              photographyId: requestIds.photography,
              videographyId: newVideographyRequest.id,
              cateringId: requestIds.catering,
              djId: requestIds.dj,
              floristId: requestIds.florist,
              beautyId: requestIds.beauty,
              weddingPlanningId: requestIds.weddingPlanning,
              selectedCategories: formData.selectedRequests,
              vendor: vendorData
            }
          });
        }
      } else if (isRequestType(selectedCategories[currentStep - 1], "Florist")) {
        const request = formData.requests.Florist || {};
        const floristRequestData = {
          user_id: user.id,
          vendor_id: formData.vendor?.id || vendorData?.id || null, // Try both sources for vendor ID
          event_title: requestTitle,
          status: 'pending',
          event_type: formData.commonDetails.eventType,
          location: formData.commonDetails.location,
          date_flexibility: formData.commonDetails.dateFlexibility,
          start_date: formData.commonDetails.startDate,
          end_date: formData.commonDetails.endDate,
          date_timeframe: formData.commonDetails.dateTimeframe,
          indoor_outdoor: formData.commonDetails.indoorOutdoor,
          specific_time_needed: request.specificTimeNeeded === 'yes',
          specific_time: request.specificTimeNeeded === 'yes' ? request.specificTime : null,
          colors: request.colorPreferences,
          pinterest_link: request.pinterestBoard,
          additional_comments: request.additionalInfo || '',
          price_range: request.priceRange || 'Not specified',
          flower_preferences_text: request.flowerPreferences?.text || '',
          floral_arrangements: request.floralArrangements || {},
          coupon_code: appliedCoupon?.code || null
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
          console.log(`Processing ${request.photos.length} photos for Florist`);
          const uploadPromises = request.photos.map(async (photo) => {
            try {
              // Ensure we have the file object
              if (!photo.file) {
                console.error('Photo object missing file property:', photo);
                throw new Error('Invalid photo object');
              }

              const fileExt = photo.file.name.split('.').pop();
              const fileName = `${uuidv4()}.${fileExt}`;
              const filePath = `florist/${user.id}/${newFloristRequest.id}/${fileName}`;
              
              console.log('Starting photo upload process:', {
                filePath,
                fileName,
                fileType: photo.file.type,
                fileSize: photo.file.size,
                bucket: 'request-media',
                fullPath: `request-media/${filePath}`
              });

              // Upload the file
              const { error: uploadError, data: uploadData } = await supabase.storage
                .from('request-media')
                .upload(filePath, photo.file, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (uploadError) {
                console.error('Photo upload error details:', {
                  error: uploadError,
                  filePath,
                  fileName,
                  fileType: photo.file.type,
                  fileSize: photo.file.size
                });
                throw uploadError;
              }

              console.log('Photo upload successful:', uploadData);

              const { data: { publicUrl } } = supabase.storage
                .from('request-media')
                .getPublicUrl(filePath);

              console.log('Generated public URL:', publicUrl);

              console.log('Inserting photo record into florist_photos table');

              const { error: photoInsertError, data: insertData } = await supabase
                .from('florist_photos')
                .insert([{
                  request_id: newFloristRequest.id,
                  user_id: user.id,
                  photo_url: publicUrl,
                  file_path: filePath
                }])
                .select();

              if (photoInsertError) {
                console.error('Photo insert error details:', {
                  error: photoInsertError,
                  data: {
                    request_id: newFloristRequest.id,
                    user_id: user.id,
                    photo_url: publicUrl,
                    file_path: filePath
                  }
                });
                throw photoInsertError;
              }

              console.log('Photo record inserted successfully:', insertData);
            } catch (err) {
              console.error('Error in photo upload process:', err);
              throw err;
            }
          });

          try {
            await Promise.all(uploadPromises);
            console.log('All photo uploads completed successfully for Florist');
          } catch (err) {
            console.error('Error in photo upload batch:', err);
            throw err;
          }
        } else {
          console.log('No photos to upload for Florist');
        }

        submissionSuccess = true;
        setRequestIds(prev => ({ ...prev, florist: newFloristRequest.id }));
        
        // Check if there are more categories to complete
        const remainingCategories = formData.selectedRequests.filter(
          cat => !completedCategories.includes(cat) && cat !== selectedCategories[currentStep - 1]
        );

        if (remainingCategories.length > 0) {
          // Move to the next category
          handleContinueToNextCategory();
        } else {
          // All categories completed, show success message
          toast.success('All requests submitted successfully!');
          
          // Send email notification to the user
          if (userEmail) {
            const emailContent = `
              <h2>Your Bidi Request Has Been Submitted</h2>
              <p>Dear ${firstName},</p>
              <p>Your request has been successfully submitted. Here are the details:</p>
              <ul>
                <li>Event Type: ${selectedCategories[currentStep - 1]}</li>
                <li>Location: ${formData.location || 'Not specified'}</li>
                <li>Date: ${formData.date || 'Not specified'}</li>
                <li>Number of Guests: ${formData.guests || 'Not specified'}</li>
              </ul>
              <p>You can now:</p>
              <ul>
                <li>Browse and select vendors for your request</li>
                <li>Wait for vendors to find your request and send bids</li>
              </ul>
              <p>Best regards,<br>The Bidi Team</p>
            `;

            await sendEmailNotification(
              userEmail,
              'Your Bidi Request Has Been Submitted',
              emailContent
            );
          }

          // Clear form data and navigate to success page
          setFormData({});
          navigate('/success-request', {
            state: {
              message: 'Your request has been submitted successfully!',
              photographyId: requestIds.photography,
              videographyId: requestIds.videography,
              cateringId: newFloristRequest.id,
              djId: requestIds.dj,
              floristId: newFloristRequest.id,
              beautyId: requestIds.beauty,
              weddingPlanningId: requestIds.weddingPlanning,
              selectedCategories: formData.selectedRequests,
              vendor: vendorData
            }
          });
        }
      } else if (isRequestType(selectedCategories[currentStep - 1], "HairAndMakeup")) {
        const request = formData.requests.HairAndMakeup || {};
        const hairAndMakeupRequestData = {
          user_id: user.id,
          vendor_id: formData.vendor?.id || vendorData?.id || null, // Try both sources for vendor ID
          event_title: requestTitle,
          status: 'pending',
          event_type: formData.commonDetails.eventType,
          location: formData.commonDetails.location,
          date_flexibility: formData.commonDetails.dateFlexibility,
          start_date: formData.commonDetails.startDate,
          end_date: formData.commonDetails.endDate,
          date_timeframe: formData.commonDetails.dateTimeframe,
          specific_time_needed: request.specificTimeNeeded === 'yes',
          specific_time: request.specificTimeNeeded === 'yes' ? request.specificTime : null,
          num_people: request.numPeopleUnknown ? null : 
                    request.numPeople ? parseInt(request.numPeople) : null,
          price_range: request.priceRange,
          additional_comments: request.additionalInfo || null,
          pinterest_link: request.pinterestBoard || null,
          service_type: request.serviceType,
          hairstyle_preferences: request.hairstylePreferences || '',
          hair_length_type: request.hairLengthType || '',
          extensions_needed: request.extensionsNeeded || '',
          trial_session_hair: request.trialSessionHair || '',
          makeup_style_preferences: request.makeupStylePreferences || {},
          skin_type_concerns: request.skinTypeConcerns || '',
          preferred_products_allergies: request.preferredProductsAllergies || '',
          lashes_included: request.lashesIncluded || '',
          trial_session_makeup: request.trialSessionMakeup || '',
          group_discount_inquiry: request.groupDiscountInquiry || '',
          on_site_service_needed: request.onSiteServiceNeeded || '',
          coupon_code: appliedCoupon?.code || null
        };

        // Insert into beauty_requests table
        const { data: newBeautyRequest, error: beautyRequestError } = await supabase
          .from('beauty_requests')
          .insert([hairAndMakeupRequestData])
          .select()
          .single();

        if (beautyRequestError) throw beautyRequestError;

        // Handle photo uploads for beauty
        if (request.photos && request.photos.length > 0) {
          console.log(`Processing ${request.photos.length} photos for Beauty`);
          const uploadPromises = request.photos.map(async (photo) => {
            const fileExt = photo.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `${user.id}/${newBeautyRequest.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('request-media')
              .upload(filePath, photo.file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('request-media')
              .getPublicUrl(filePath);

            const { error: photoInsertError } = await supabase
              .from('beauty_photos')
              .insert([{
                request_id: newBeautyRequest.id,
                user_id: user.id,
                photo_url: publicUrl,
                file_path: filePath
              }]);

            if (photoInsertError) throw photoInsertError;
          });

          await Promise.all(uploadPromises);
        }

        submissionSuccess = true;
        setRequestIds(prev => ({ ...prev, beauty: newBeautyRequest.id }));
        
        // Check if there are more categories to complete
        const remainingCategories = formData.selectedRequests.filter(
          cat => !completedCategories.includes(cat) && cat !== selectedCategories[currentStep - 1]
        );

        if (remainingCategories.length > 0) {
          // Move to the next category
          handleContinueToNextCategory();
        } else {
          // All categories completed, show success message
          toast.success('All requests submitted successfully!');
          
          // Send email notification to the user
          if (userEmail) {
            const emailContent = `
              <h2>Your Bidi Request Has Been Submitted</h2>
              <p>Dear ${firstName},</p>
              <p>Your request has been successfully submitted. Here are the details:</p>
              <ul>
                <li>Event Type: ${selectedCategories[currentStep - 1]}</li>
                <li>Location: ${formData.location || 'Not specified'}</li>
                <li>Date: ${formData.date || 'Not specified'}</li>
                <li>Number of Guests: ${formData.guests || 'Not specified'}</li>
              </ul>
              <p>You can now:</p>
              <ul>
                <li>Browse and select vendors for your request</li>
                <li>Wait for vendors to find your request and send bids</li>
              </ul>
              <p>Best regards,<br>The Bidi Team</p>
            `;

            await sendEmailNotification(
              userEmail,
              'Your Bidi Request Has Been Submitted',
              emailContent
            );
          }

          // Clear form data and navigate to success page
          setFormData({});
          navigate('/success-request', {
            state: {
              message: 'Your request has been submitted successfully!',
              photographyId: requestIds.photography,
              videographyId: requestIds.videography,
              cateringId: requestIds.catering,
              djId: requestIds.dj,
              floristId: requestIds.florist,
              beautyId: newBeautyRequest.id,
              weddingPlanningId: requestIds.weddingPlanning,
              selectedCategories: formData.selectedRequests,
              vendor: vendorData
            }
          });
        }
      } else if (isRequestType(selectedCategories[currentStep - 1], "DJ")) {
        console.log('Starting DJ request submission...');
        const request = formData.requests.DJ || {};
        console.log('DJ request data:', request);
        console.log('Special requests data:', request.specialRequests);

        const djRequestData = {
          user_id: user.id,
          vendor_id: formData.vendor?.id || vendorData?.id || null, // Try both sources for vendor ID
          title: requestTitle,
          status: 'open',
          event_type: formData.commonDetails.eventType,
          location: formData.commonDetails.location,
          date_flexibility: formData.commonDetails.dateFlexibility,
          start_date: formData.commonDetails.startDate,
          end_date: formData.commonDetails.endDate,
          date_timeframe: formData.commonDetails.dateTimeframe,
          event_duration: formData.commonDetails.duration ? parseInt(formData.commonDetails.duration, 10) : null,
          equipment_needed: request.equipmentNeeded || '',
          equipment_notes: request.equipmentNotes || '',
          additional_services: Object.entries(request.additionalServices || {}).map(([key, value]) => key),
          music_preferences: JSON.stringify(
            Object.fromEntries(
              Object.entries(request.musicPreferences || {}).map(([key, value]) => [key, true])
            )
          ),
          special_songs: JSON.stringify({
            playlist: request.playlist || null,
            requests: request.specialSongs || null
          }),
          budget_range: request.priceRange || 'Not specified',
          estimated_guests: formData.commonDetails.numGuests ? parseInt(formData.commonDetails.numGuests, 10) : null,
          date_flexibility: formData.commonDetails.dateFlexibility || null,
          indoor_outdoor: formData.commonDetails.indoorOutdoor || null,
          special_requests: request.additionalInfo || null,
          coupon_code: appliedCoupon?.code || null
        };

        console.log('Preparing to insert DJ request:', djRequestData);

        // Insert into dj_requests table
        const { data: newDjRequest, error: djRequestError } = await supabase
          .from('dj_requests')
          .insert([djRequestData])
          .select()
          .single();

        if (djRequestError) {
          console.error('DJ request error:', djRequestError);
          throw djRequestError;
        }

        console.log('DJ request inserted successfully:', newDjRequest);
        submissionSuccess = true;
        setRequestIds(prev => ({ ...prev, dj: newDjRequest.id }));
        
        // Check if there are more categories to complete
        const remainingCategories = formData.selectedRequests.filter(
          cat => !completedCategories.includes(cat) && cat !== selectedCategories[currentStep - 1]
        );

        if (remainingCategories.length > 0) {
          // Move to the next category
          handleContinueToNextCategory();
        } else {
          // All categories completed, show success message
          toast.success('All requests submitted successfully!');
          
          // Send email notification to the user
          if (userEmail) {
            const emailContent = `
              <h2>Your Bidi Request Has Been Submitted</h2>
              <p>Dear ${firstName},</p>
              <p>Your request has been successfully submitted. Here are the details:</p>
              <ul>
                <li>Event Type: ${selectedCategories[currentStep - 1]}</li>
                <li>Location: ${formData.location || 'Not specified'}</li>
                <li>Date: ${formData.date || 'Not specified'}</li>
                <li>Number of Guests: ${formData.guests || 'Not specified'}</li>
              </ul>
              <p>You can now:</p>
              <ul>
                <li>Browse and select vendors for your request</li>
                <li>Wait for vendors to find your request and send bids</li>
              </ul>
              <p>Best regards,<br>The Bidi Team</p>
            `;

            await sendEmailNotification(
              userEmail,
              'Your Bidi Request Has Been Submitted',
              emailContent
            );
          }

          // Clear form data and navigate to success page
          setFormData({});
          navigate('/success-request', {
            state: {
              message: 'Your request has been submitted successfully!',
              photographyId: requestIds.photography,
              videographyId: requestIds.videography,
              cateringId: requestIds.catering,
              djId: newDjRequest.id,
              floristId: requestIds.florist,
              beautyId: requestIds.beauty,
              weddingPlanningId: requestIds.weddingPlanning,
              selectedCategories: formData.selectedRequests,
              vendor: vendorData
            }
          });
        }
      } else if (isRequestType(selectedCategories[currentStep - 1], "Catering")) {
        const request = formData.requests.Catering || {};
        const cateringRequestData = {
          user_id: user.id,
          vendor_id: formData.vendor?.id || vendorData?.id || null, // Try both sources for vendor ID
          title: requestTitle,
          status: 'pending',
          event_type: formData.commonDetails.eventType,
          location: formData.commonDetails.location,
          date_flexibility: formData.commonDetails.dateFlexibility,
          start_date: formData.commonDetails.startDate,
          end_date: formData.commonDetails.endDate,
          date_timeframe: formData.commonDetails.dateTimeframe,
          estimated_guests: formData.commonDetails.numGuests ? parseInt(formData.commonDetails.numGuests, 10) : null,
          food_service_type: request.foodStyle || null,
          food_preferences: request.cuisineTypes || [],
          dietary_restrictions: request.dietaryRestrictions || [],
          setup_cleanup: request.setupCleanup || null,
          serving_staff: request.servingStaff || null,
          dining_items: request.diningItems || null,
          dining_items_notes: request.diningItemsNotes || null,
          equipment_needed: request.equipmentNeeded || null,
          equipment_notes: request.equipmentNotes || null,
          special_requests: request.specialRequests || null,
          additional_info: request.additionalInfo || null,
          budget_range: request.priceRange || 'Not specified',
          indoor_outdoor: formData.commonDetails.indoorOutdoor || null,
          coupon_code: appliedCoupon?.code || null
        };

        console.log('Inserting catering request:', cateringRequestData);

        const { data: newCateringRequest, error: cateringError } = await supabase
          .from('catering_requests')
          .insert([cateringRequestData])
          .select()
          .single();

        if (cateringError) {
          console.error('Error inserting catering request:', cateringError);
          throw cateringError;
        }

        console.log('Successfully inserted catering request:', newCateringRequest);
        submissionSuccess = true;
        setRequestIds(prev => ({ ...prev, catering: newCateringRequest.id }));
        
        // Check if there are more categories to complete
        const remainingCategories = formData.selectedRequests.filter(
          cat => !completedCategories.includes(cat) && cat !== selectedCategories[currentStep - 1]
        );

        if (remainingCategories.length > 0) {
          // Move to the next category
          handleContinueToNextCategory();
        } else {
          // All categories completed, show success message
          toast.success('All requests submitted successfully!');
          
          // Send email notification to the user
          if (userEmail) {
            const emailContent = `
              <h2>Your Bidi Request Has Been Submitted</h2>
              <p>Dear ${firstName},</p>
              <p>Your request has been successfully submitted. Here are the details:</p>
              <ul>
                <li>Event Type: ${selectedCategories[currentStep - 1]}</li>
                <li>Location: ${formData.location || 'Not specified'}</li>
                <li>Date: ${formData.date || 'Not specified'}</li>
                <li>Number of Guests: ${formData.guests || 'Not specified'}</li>
              </ul>
              <p>You can now:</p>
              <ul>
                <li>Browse and select vendors for your request</li>
                <li>Wait for vendors to find your request and send bids</li>
              </ul>
              <p>Best regards,<br>The Bidi Team</p>
            `;

            await sendEmailNotification(
              userEmail,
              'Your Bidi Request Has Been Submitted',
              emailContent
            );
          }

          // Clear form data and navigate to success page
          setFormData({});
          navigate('/success-request', {
            state: {
              message: 'Your request has been submitted successfully!',
              photographyId: requestIds.photography,
              videographyId: requestIds.videography,
              cateringId: newCateringRequest.id,
              djId: requestIds.dj,
              floristId: requestIds.florist,
              beautyId: requestIds.beauty,
              weddingPlanningId: requestIds.weddingPlanning,
              selectedCategories: formData.selectedRequests,
              vendor: vendorData
            }
          });
        }
      } else if (isRequestType(selectedCategories[currentStep - 1], "WeddingPlanning")) {
        const request = formData.requests.WeddingPlanning || {};
        const weddingPlanningRequestData = {
          user_id: user.id,
          vendor_id: formData.vendor?.id || vendorData?.id || null, // Try both sources for vendor ID
          event_title: requestTitle,
          status: 'pending',
          event_type: formData.commonDetails.eventType,
          location: formData.commonDetails.location,
          start_date: formData.commonDetails.startDate,
          end_date: formData.commonDetails.endDate,
          date_flexibility: formData.commonDetails.dateFlexibility,
          date_timeframe: formData.commonDetails.dateTimeframe,
          start_time: formData.commonDetails.startTime,
          end_time: formData.commonDetails.endTime,
          indoor_outdoor: formData.commonDetails.indoorOutdoor,
          budget_range: request.budgetRange || 'Not specified',
          guest_count: formData.commonDetails.numGuests ? parseInt(formData.commonDetails.numGuests, 10) : null,
          venue_status: request.venueStatus || null,
          vendor_preferences: {
            preference: request.vendorPreference || null,
            existing_vendors: request.existingVendors || null
          },
          additional_events: request.additionalEvents || {},
          wedding_style: request.weddingType || null,
          color_scheme: request.theme || null,
          theme_preferences: request.theme || null,
          additional_comments: request.additionalInfo || null,
          pinterest_link: request.pinterestBoard || null,
          coupon_code: appliedCoupon?.code || null,
          planning_level: request.planningLevel || null,
          experience_level: request.experienceLevel || null,
          communication_style: request.communicationStyle || null,
          planner_budget: request.plannerBudget || null
        };

        // Insert into wedding_planning_requests table
        const { data: newWeddingPlanningRequest, error: weddingPlanningRequestError } = await supabase
          .from('wedding_planning_requests')
          .insert([weddingPlanningRequestData])
          .select()
          .single();

        if (weddingPlanningRequestError) throw weddingPlanningRequestError;

        // Handle photo uploads for wedding planning
        if (request.photos && request.photos.length > 0) {
          console.log(`Processing ${request.photos.length} photos for Wedding Planning`);
          const uploadPromises = request.photos.map(async (photo) => {
            try {
              // Ensure we have the file object
              if (!photo.file) {
                console.error('Photo object missing file property:', photo);
                throw new Error('Invalid photo object');
              }

              const fileExt = photo.file.name.split('.').pop();
              const fileName = `${uuidv4()}.${fileExt}`;
              const filePath = `wedding_planning/${user.id}/${newWeddingPlanningRequest.id}/${fileName}`;
              
              console.log('Starting photo upload process:', {
                filePath,
                fileName,
                fileType: photo.file.type,
                fileSize: photo.file.size,
                bucket: 'request-media',
                fullPath: `request-media/${filePath}`
              });

              // Upload the file
              const { error: uploadError, data: uploadData } = await supabase.storage
                .from('request-media')
                .upload(filePath, photo.file, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (uploadError) {
                console.error('Photo upload error details:', {
                  error: uploadError,
                  filePath,
                  fileName,
                  fileType: photo.file.type,
                  fileSize: photo.file.size
                });
                throw uploadError;
              }

              console.log('Photo upload successful:', uploadData);

              const { data: { publicUrl } } = supabase.storage
                .from('request-media')
                .getPublicUrl(filePath);

              console.log('Generated public URL:', publicUrl);

              const { error: photoInsertError, data: insertData } = await supabase
                .from('wedding_planning_photos')
                .insert([{
                  request_id: newWeddingPlanningRequest.id,
                  user_id: user.id,
                  photo_url: publicUrl,
                  file_path: filePath
                }])
                .select();

              if (photoInsertError) {
                console.error('Photo insert error details:', {
                  error: photoInsertError,
                  data: {
                    request_id: newWeddingPlanningRequest.id,
                    user_id: user.id,
                    photo_url: publicUrl,
                    file_path: filePath
                  }
                });
                throw photoInsertError;
              }

              console.log('Photo record inserted successfully:', insertData);
            } catch (err) {
              console.error('Error in photo upload process:', err);
              throw err;
            }
          });

          try {
            await Promise.all(uploadPromises);
            console.log(`All photo uploads completed successfully for Wedding Planning`);
          } catch (err) {
            console.error('Error in photo upload batch:', err);
            throw err;
          }
        } else {
          console.log(`No photos to upload for Wedding Planning`);
        }

        submissionSuccess = true;
        setRequestIds(prev => ({ ...prev, weddingPlanning: newWeddingPlanningRequest.id }));
        
        // Check if there are more categories to complete
        const remainingCategories = formData.selectedRequests.filter(
          cat => !completedCategories.includes(cat) && cat !== selectedCategories[currentStep - 1]
        );

        if (remainingCategories.length > 0) {
          // Move to the next category
          handleContinueToNextCategory();
        } else {
          // All categories completed, show success message
          toast.success('All requests submitted successfully!');
          
          // Send email notification to the user
          if (userEmail) {
            const emailContent = `
              <h2>Your Bidi Request Has Been Submitted</h2>
              <p>Dear ${firstName},</p>
              <p>Your request has been successfully submitted. Here are the details:</p>
              <ul>
                <li>Event Type: ${selectedCategories[currentStep - 1]}</li>
                <li>Location: ${formData.location || 'Not specified'}</li>
                <li>Date: ${formData.date || 'Not specified'}</li>
                <li>Number of Guests: ${formData.guests || 'Not specified'}</li>
              </ul>
              <p>You can now:</p>
              <ul>
                <li>Browse and select vendors for your request</li>
                <li>Wait for vendors to find your request and send bids</li>
              </ul>
              <p>Best regards,<br>The Bidi Team</p>
            `;

            await sendEmailNotification(
              userEmail,
              'Your Bidi Request Has Been Submitted',
              emailContent
            );
          }

          // Clear form data and navigate to success page
          setFormData({});
          navigate('/success-request', {
            state: {
              message: 'Your request has been submitted successfully!',
              photographyId: requestIds.photography,
              videographyId: requestIds.videography,
              cateringId: requestIds.catering,
              djId: requestIds.dj,
              floristId: requestIds.florist,
              beautyId: requestIds.beauty,
              weddingPlanningId: newWeddingPlanningRequest.id,
              selectedCategories: formData.selectedRequests,
              vendor: vendorData
            }
          });
        }
      }

      // Only proceed if submission was successful
      if (submissionSuccess) {
        // Add the current request type to completed categories
        setCompletedCategories(prev => [...prev, selectedCategories[currentStep - 1]]);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error('Failed to submit request. Please try again.');
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
        const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
        let maxSteps;
        if (serviceType === 'hair') {
          maxSteps = 4; // Basic -> Hair -> Inspiration -> Budget
        } else if (serviceType === 'makeup') {
          maxSteps = 4; // Basic -> Makeup -> Inspiration -> Budget
        } else {
          maxSteps = 5; // Basic -> Hair -> Makeup -> Inspiration -> Budget
        }
        
        if (stepIndex < currentIndex + maxSteps) {
          setCurrentStep(i + 1);
          setHairAndMakeupSubStep(stepIndex - currentIndex);
          return;
        }
        currentIndex += maxSteps;
      } else if (isRequestType(request, "WeddingPlanning")) {
        if (stepIndex < currentIndex + 4) {
          setCurrentStep(i + 1);
          setWeddingPlanningSubStep(stepIndex - currentIndex);
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
      } else if (isRequestType(request, "WeddingPlanning")) {
        requestOffset += 4;
      } else {
        requestOffset += 1;
      }
    }

    // Check if we're on the makeup services step for HairAndMakeup
    if (isRequestType(currentRequest, "HairAndMakeup")) {
      const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
      if (serviceType === 'makeup' && stepIndex === requestOffset + 1) {
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
    }
    
    // Check if we're on the budget step for any request type
    const isBudgetStep = (requestType) => {
      if (isRequestType(requestType, "Photography") || isRequestType(requestType, "Videography")) {
        return stepIndex === requestOffset + 3;
      } else if (isRequestType(requestType, "Catering")) {
        return stepIndex === requestOffset + 2;
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
        } else {
          return stepIndex === requestOffset + 4;
        }
      }
      return false;
    };

    // Check if we're on the inspiration step for Florist or HairAndMakeup
    const isInspirationStep = (requestType) => {
      if (isRequestType(requestType, "Florist")) {
        return stepIndex === requestOffset + 3;
      } else if (isRequestType(requestType, "HairAndMakeup")) {
        const serviceType = formData.requests.HairAndMakeup?.serviceType || 'both';
        if (serviceType === 'hair') {
          return stepIndex === requestOffset + 2;
        } else if (serviceType === 'makeup') {
          return stepIndex === requestOffset + 2;
        } else {
          return stepIndex === requestOffset + 3;
        }
      }
      return false;
    };

    // First check if we're on the inspiration step
    if (isInspirationStep(currentRequest)) {
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
      } else if (isRequestType(currentRequest, "Florist")) {
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
    }

    // Then check if we're on the budget step
    if (isBudgetStep(currentRequest)) {
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
      } else {
        const normalizedCategory = Object.keys(formData.requests).find(
          key => key.toLowerCase() === currentRequest.toLowerCase().replace(/\s/g, '')
        ) || currentRequest;
        return (
          <div className="form-scrollable-content">
            <BudgetForm
              formData={formData}
              setFormData={setFormData}
              category={normalizedCategory}
            />
          </div>
        );
      }
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

    if (isRequestType(currentRequest, "WeddingPlanning")) {
      return (
        <div className="form-scrollable-content">
          <WeddingPlanningStepper
            formData={formData}
            setFormData={setFormData}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            subStep={weddingPlanningSubStep}
            setSubStep={setWeddingPlanningSubStep}
          />
        </div>
      );
    }

    return null;
  };

// Helper to format YYYY-MM-DD as MM/DD/YYYY
function formatDateString(dateString) {
  if (!dateString) return 'Not specified';
  const [year, month, day] = dateString.split('-');
  return `${month}/${day}/${year}`;
}


  const renderReviewScreen = () => {
    // Debug logs to help diagnose budget issue
    const category = formData.selectedRequests[currentStep - 1];
    const normalizedCategory = Object.keys(formData.requests).find(
      key => key.toLowerCase() === category.toLowerCase().replace(/\s/g, '')
    ) || category;
    console.log('formData.requests:', formData.requests);
    console.log('selectedRequests:', formData.selectedRequests);
    console.log('currentStep:', currentStep);
    console.log('category used in review:', category);
    console.log('normalizedCategory used in review:', normalizedCategory);
    console.log('categoryData:', formData.requests[normalizedCategory]);
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
        return value ? formatDateString(value) : 'Not specified';
      }

      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length === 0) return 'Not specified';
        // Special handling for cuisine types and dietary restrictions
        if (key === 'cuisineTypes' || key === 'dietaryRestrictions') {
          return value.map(item => item.charAt(0).toUpperCase() + item.slice(1)).join(', ');
        }
        return value.join(', ');
      }

      // Handle objects with boolean values (like style preferences)
      if (typeof value === 'object' && value !== null) {
        // Special handling for food style
        if (key === 'foodStyle') {
          if (!value) return 'Not specified';
          return value.charAt(0).toUpperCase() + value.slice(1);
        }

        // Special handling for setup and cleanup
        if (key === 'setupCleanup') {
          if (!value) return 'Not specified';
          const labels = {
            'setupOnly': 'Setup Only',
            'cleanupOnly': 'Cleanup Only',
            'both': 'Both Setup & Cleanup',
            'neither': 'Neither'
          };
          return labels[value] || 'Not specified';
        }

        // Special handling for serving staff
        if (key === 'servingStaff') {
          if (!value) return 'Not specified';
          const labels = {
            'fullService': 'Full Service Staff',
            'partialService': 'Partial Service',
            'noService': 'No Staff Needed',
            'unsure': 'Not Sure'
          };
          return labels[value] || 'Not specified';
        }

        // Special handling for dining items
        if (key === 'diningItems') {
          if (!value) return 'Not specified';
          const labels = {
            'provided': 'Provided by Caterer',
            'notProvided': 'Not Needed',
            'partial': 'Partial'
          };
          return labels[value] || 'Not specified';
        }

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
      const normalizedCategory = Object.keys(formData.requests).find(
        key => key.toLowerCase() === category.toLowerCase().replace(/\s/g, '')
      ) || category;
      const categoryData = formData.requests[normalizedCategory] || {};
      const commonDetails = formData.commonDetails || {};
      const eventDetails = formData.eventDetails || {};

      // Get event details
      const eventDetailsDisplay = {
        'Event Type': formatArrayValue(commonDetails.eventType, 'eventType'),
        'Location': formatArrayValue(commonDetails.location, 'location'),
        'Number of Guests': formatArrayValue(commonDetails.numGuests, 'numGuests'),
        'Date': commonDetails.dateFlexibility === 'specific' 
          ? formatArrayValue(commonDetails.startDate, 'startDate')
          : commonDetails.dateFlexibility === 'range'
            ? `${formatArrayValue(commonDetails.startDate, 'startDate')} to ${formatArrayValue(commonDetails.endDate, 'endDate')}`
            : formatArrayValue(commonDetails.dateTimeframe, 'dateTimeframe'),
        'Indoor/Outdoor': formatArrayValue(commonDetails.indoorOutdoor, 'indoorOutdoor')
      };

      // Get category-specific details
      let categoryDetails = {};
      const currentRequest = formData.selectedRequests[currentStep - 1];
      
      if (isRequestType(currentRequest, "Photography")) {
        categoryDetails = {
          'Coverage Duration': formatArrayValue(categoryData.duration, 'duration'),
          'Second Photographer': formatArrayValue(categoryData.secondPhotographer, 'secondPhotographer'),
          'Style': formatArrayValue(categoryData.stylePreferences, 'stylePreferences'),
          'Deliverables': formatArrayValue(categoryData.deliverables, 'deliverables'),
          'Budget Range': formatArrayValue(categoryData.priceRange, 'priceRange')
        };
      } else if (isRequestType(currentRequest, "Videography")) {
        categoryDetails = {
          'Coverage Duration': formatArrayValue(categoryData.duration, 'duration'),
          'Style': formatArrayValue(categoryData.stylePreferences, 'stylePreferences'),
          'Deliverables': formatArrayValue(categoryData.deliverables, 'deliverables'),
          'Budget Range': formatArrayValue(categoryData.priceRange, 'priceRange')
        };
      } else if (isRequestType(currentRequest, "Catering")) {
        categoryDetails = {
          'Food Style': formatArrayValue(eventDetails.foodStyle, 'foodStyle'),
          'Cuisine Types': formatArrayValue(eventDetails.cuisineTypes, 'cuisineTypes'),
          'Dietary Restrictions': formatArrayValue(eventDetails.dietaryRestrictions, 'dietaryRestrictions'),
          'Setup & Cleanup': formatArrayValue(eventDetails.setupCleanup, 'setupCleanup'),
          'Serving Staff': formatArrayValue(eventDetails.servingStaff, 'servingStaff'),
          'Dining Items': formatArrayValue(eventDetails.diningItems, 'diningItems'),
          'Budget Range': formatArrayValue(categoryData.priceRange, 'priceRange')
        };
      } else if (isRequestType(currentRequest, "DJ")) {
        categoryDetails = {
          'Performance Duration': formatArrayValue(commonDetails.duration, 'duration'),
          'Equipment Needed': formatArrayValue(categoryData.equipmentNeeded, 'equipmentNeeded'),
          'Music Style': formatArrayValue(categoryData.musicPreferences, 'musicPreferences'),
          'Budget Range': formatArrayValue(categoryData.priceRange, 'priceRange')
        };
      } else if (isRequestType(currentRequest, "Florist")) {
        categoryDetails = {
          'Arrangement Types': formatArrayValue(categoryData.floralArrangements, 'floralArrangements'),
          'Color Preferences': formatArrayValue(categoryData.colorPreferences, 'colorPreferences'),
          'Flower Preferences': formatArrayValue(categoryData.flowerPreferences?.text || categoryData.flowerPreferences, 'flowerPreferences'),
          'Additional Services': formatArrayValue(categoryData.additionalServices, 'additionalServices'),
          'Budget Range': formatArrayValue(categoryData.priceRange, 'priceRange')
        };
      } else if (isRequestType(currentRequest, "HairAndMakeup")) {
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
          'Budget Range': formatArrayValue(
            categoryData.priceRange ||
            formData.requests.HairAndMakeup?.priceRange ||
            formData.requests.Beauty?.priceRange,
            'priceRange'
          )
        };
      } else if (isRequestType(currentRequest, "WeddingPlanning")) {
        categoryDetails = {
          'Planning Level': formatArrayValue(categoryData.planningLevel, 'planningLevel'),
          'Wedding Type': formatArrayValue(categoryData.weddingType, 'weddingType'),
          'Theme': formatArrayValue(categoryData.theme, 'theme'),
          'Additional Events': formatArrayValue(
            Object.entries(categoryData.additionalEvents || {})
              .filter(([_, val]) => val === true)
              .map(([key]) => {
                const labels = {
                  'rehearsalDinner': 'Rehearsal Dinner',
                  'dayAfterBrunch': 'Day After Brunch',
                  'bachelorParty': 'Bachelor Party',
                  'bridalParty': 'Bridal Party'
                };
                return labels[key] || key;
              })
              .join(', '),
            'additionalEvents'
          ),
          'Vendor Preference': formatArrayValue(categoryData.vendorPreference, 'vendorPreference'),
          'Existing Vendors': formatArrayValue(categoryData.existingVendors, 'existingVendors'),
          'Overall Budget': formatArrayValue(categoryData.budgetRange, 'budgetRange'),
          'Planner Budget': formatArrayValue(categoryData.plannerBudget, 'plannerBudget'),
          'Experience Level': formatArrayValue(categoryData.experienceLevel, 'experienceLevel'),
          'Communication Style': formatArrayValue(categoryData.communicationStyle, 'communicationStyle'),
          'Additional Information': formatArrayValue(categoryData.additionalInfo, 'additionalInfo')
        };
      }

      return {
        ...eventDetailsDisplay,
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
            {Object.entries(getCategoryDetails(formData.selectedRequests[currentStep - 1])).map(([key, value]) => (
              <div key={key} className="detail-item">
                <span className="detail-label" style={{ color: '#666', display: 'block', marginBottom: '5px' }}>{key}</span>
                <span className="detail-value" style={{ color: '#333', fontWeight: '500' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="coupon-section" style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
            Apply Coupon
          </h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexDirection: 'column' }}>
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

  const handleFormDataChange = (newData) => {
    setFormData(newData);
    saveFormData(newData);
  };

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedData = loadFormData();
    if (savedData) {
      setFormData(savedData);
    }
  }, []);

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
          style={{ height: "80vh" }}
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

          {/* Display selected vendor information */}
          {vendorData && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginTop: '20px' 
            }}>
              <img 
                src={vendorData.image || vendorData.vendor.profile_photo_url} 
                alt={vendorData.vendor.business_name} 
                className="vendor-profile-image" 
                style={{ marginRight: '8px' }}
              />
              <h3 className="selected-vendor-info">
                {vendorData.vendor.business_name} will be notified
              </h3>
            </div>
          )}

          {showReview ? (
            renderReviewScreen()
          ) : currentStep === 0 ? (
            <div className="form-scrollable-content">
              <MasterRequestForm
                formData={formData}
                setFormData={handleFormDataChange}
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
