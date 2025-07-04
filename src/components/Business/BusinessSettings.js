import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import Verification from "../../assets/Frame 1162.svg";
import { Modal } from "react-bootstrap";
import { supabase } from "../../supabaseClient";
// import StripeOnboarding from "../../components/Stripe/Onboarding.js";
import LoadingSpinner from "../../components/LoadingSpinner";
import bidiLogo from "../../assets/images/bidi check.png";
import "../../styles/BusinessSettings.css";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { sendNotification, notificationTypes } from '../../utils/notifications';
import { useGoogleBusinessReviews } from '../../hooks/useGoogleBusinessReviews.js';
import { formatBusinessName } from '../../utils/formatBusinessName';
import FetchReviewsButton from '../GoogleBusiness/FetchReviewsButton.js';
import { updateConsultationHours } from '../../utils/calendarUtils';

const BusinessSettings = ({ connectedAccountId, setActiveSection }) => {
  const [isVerified, setIsVerified] = useState(false);
  // const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [currentMinPrice, setCurrentMinPrice] = useState(null);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [showDownPaymentModal, setShowDownPaymentModal] = useState(false);
  const [showMinPriceModal, setShowMinPriceModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [calculatorAmount, setCalculatorAmount] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [downPaymentNumber, setDownPaymentNumber] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const location = useLocation();
  const [showCalendarSuccess, setShowCalendarSuccess] = useState(false);
  const [percentage, setPercentage] = useState("");
  const navigate = useNavigate();
  const [stripeError, setStripeError] = useState(false);
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [setupProgress, setSetupProgress] = useState({
    paymentAccount: false,
    downPayment: false,
    minimumPrice: false,
    affiliateCoupon: false,
    verification: false,
    story: false,
    bidTemplate: false,
    calendar: false,
    defaultExpiration: false,
  });
  const [profileDetails, setProfileDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [bidTemplate, setBidTemplate] = useState("");
  const [showBidTemplateModal, setShowBidTemplateModal] = useState(false);
  const [bidTemplateError, setBidTemplateError] = useState("");
  const [showDefaultExpirationModal, setShowDefaultExpirationModal] = useState(false);
  const [defaultExpirationDays, setDefaultExpirationDays] = useState("");
  const [showSupportBanner, setShowSupportBanner] = useState(() => {
    const saved = localStorage.getItem('hideSupportBanner');
    return saved !== 'true';
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [currentCategories, setCurrentCategories] = useState([]);
  const [customCategory, setCustomCategory] = useState("");
  const [showGoogleCalendarModal, setShowGoogleCalendarModal] = useState(false);
  const [contractTemplate, setContractTemplate] = useState("");
  const [showContractTemplateModal, setShowContractTemplateModal] = useState(false);
  const [contractTemplateError, setContractTemplateError] = useState("");
  const [googleBusinessProfile, setGoogleBusinessProfile] = useState({
    isConnected: false,
    businessName: '',
    location: '',
    status: 'disconnected',
    error: null,
    accountId: null,
    locationId: null,
  });
  const [showGoogleBusinessModal, setShowGoogleBusinessModal] = useState(false);
  const [googleReviewsStatus, setGoogleReviewsStatus] = useState('disconnected');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [googleReviewsError, setGoogleReviewsError] = useState(null);
const { 
  isCalendarConnected, 
  calendarError, 
  isLoading: isCalendarLoading, 
  connectCalendar, 
  disconnectCalendar 
} = useGoogleCalendar();

const { 
  reviews,
  totalReviews,
  averageRating,
  loading: reviewsLoading,
  error: reviewsError,
  fetchReviews 
} = useGoogleBusinessReviews(connectedAccountId);

const [partnershipData, setPartnershipData] = useState(null);

// Add this state near the top with other state declarations
const [isCopied, setIsCopied] = useState(false);

const [showConsultationHoursModal, setShowConsultationHoursModal] = useState(false);
const [consultationHours, setConsultationHours] = useState({
  startTime: "09:00",
  endTime: "17:00",
  daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
});
const [timezone, setTimezone] = useState("America/Denver");

// Add training completion state
const [trainingCompleted, setTrainingCompleted] = useState(false);
const [trainingLoading, setTrainingLoading] = useState(true);
const [trainingInProgress, setTrainingInProgress] = useState(false);

// Add autobid enabled state
const [autobidEnabled, setAutobidEnabled] = useState(false);

// Day conversion utilities
const dayNameToNumber = {
  'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
  'Thursday': 4, 'Friday': 5, 'Saturday': 6
};

const dayNumberToName = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday'
};

const fetchPartnershipData = async () => {
  try {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    setPartnershipData(data);
  } catch (error) {
    console.error("Error fetching partnership data:", error);
  }
};

useEffect(() => {
  if (showCouponModal) {
    fetchPartnershipData();
  }
}, [showCouponModal]);

// Add this useEffect to debug the state
useEffect(() => {
  console.log('Calendar state:', {
    isCalendarConnected,
    calendarError,
    isCalendarLoading
  });
}, [isCalendarConnected, calendarError, isCalendarLoading]);

// Add isDesktop state and effect at the top of the component
const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
useEffect(() => {
  const handleResize = () => setIsDesktop(window.innerWidth > 768);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

  // Add these modules for the editor
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
    "image",
  ];

  // Add these business categories
  const businessCategories = [
    { id: 'photography', label: 'Photography' },
    { id: 'videography', label: 'Videography' },
    { id: 'dj', label: 'DJ' },
    { id: 'florist', label: 'Florist' },
    { id: 'venue', label: 'Venue' },
    { id: 'catering', label: 'Catering' },
    { id: 'cake', label: 'Cake' },
    { id: 'beauty', label: 'Hair & Makeup' },
    { id: 'wedding planner/coordinator', label: 'Wedding Planner/Coordinator' },
    { id: 'rental', label: 'Rental' },
    { id: 'photo_booth', label: 'Photo Booth' },
    { id: 'other', label: 'Other' }
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('calendar') === 'connected' && !sessionStorage.getItem('calendarSuccessShown')) {
      setShowCalendarSuccess(true);
      sessionStorage.setItem('calendarSuccessShown', 'true');
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  useEffect(() => {
    console.log("Active Coupon:", activeCoupon);
    console.log("New Coupon Code:", newCouponCode);
  }, [activeCoupon, newCouponCode]);

  useEffect(() => {
    const fetchSetupProgress = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (!currentUser) {
          setIsLoading(false);
          return;
        }
        setUser(currentUser);

        // Step 1: Fetch the business profile using the user ID
        const { data: profile, error: profileError } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (profileError) {
          console.error("Error fetching business profile:", profileError);
          setIsLoading(false);
          return;
        }

        setIsAdmin(!!profile.is_admin);
        setDefaultExpirationDays(profile.default_expiration_days || "");
        
        // Set autobid enabled status
        setAutobidEnabled(!!profile.autobid_enabled);
        
        // Set selected categories from profile
        if (profile.business_category) {
          const categories = Array.isArray(profile.business_category) 
            ? profile.business_category 
            : [profile.business_category];
          setSelectedCategories(categories);
          setCurrentCategories(categories);
        }

        // Step 2: Use the business_id from the profile to fetch related data
        const { data: existingCoupon, error: couponError } = await supabase
          .from("coupons")
          .select("*")
          .eq("business_id", profile.id)
          .eq("valid", true)
          .single();

        if (couponError && couponError.code !== "PGRST116") {
          console.error("Error fetching affiliate coupon:", couponError);
        }

        // Step 3: Update the setup progress state
        const newSetupProgress = {
          paymentAccount: !!profile.stripe_account_id,
          downPayment: !!profile.down_payment_type,
          minimumPrice: !!profile.minimum_price,
          affiliateCoupon: !!existingCoupon,
          verification: profile.verified_at,
          story: !!profile.story,
          bidTemplate: !!profile.bid_template,
          calendar: isCalendarConnected,
          defaultExpiration: !!profile.default_expiration_days,
        };

        setSetupProgress(newSetupProgress);

        // Send notifications for incomplete important items
        if (!newSetupProgress.paymentAccount) {
          sendNotification(
            currentUser.id,
            notificationTypes.SETUP_REMINDER,
            'Complete your payment account setup to start receiving payments'
          );
        }
        if (!newSetupProgress.verification) {
          sendNotification(
            currentUser.id,
            notificationTypes.SETUP_REMINDER,
            'Get verified to build trust with potential clients'
          );
        }
        if (!newSetupProgress.story) {
          sendNotification(
            currentUser.id,
            notificationTypes.SETUP_REMINDER,
            'Set up your profile to showcase your work and attract more clients'
          );
        }

        // Step 4: Update other states
        setIsVerified(!!profile.verified_at);
        setActiveCoupon(existingCoupon || null);
        setProfileDetails(profile);
        setCurrentMinPrice(profile.minimum_price || null);
        setMinimumPrice(profile.minimum_price || "");

        if (profile.down_payment_type) {
          setPaymentType(profile.down_payment_type);
          setDownPaymentNumber(
            profile.down_payment_type === "flat fee" ? profile.amount : ""
          );
          setPercentage(
            profile.down_payment_type === "percentage"
              ? profile.amount * 100
              : ""
          );
        }

        if (profile.bid_template) {
          setBidTemplate(profile.bid_template);
          setSetupProgress((prev) => ({ ...prev, bidTemplate: true }));
        }

        if (profile.contract_template) {
          setContractTemplate(profile.contract_template);
        }

        // Set consultation hours if they exist
        if (profile.consultation_hours) {
          // Handle both old and new formats
          let consultationHoursData;
          
          if (profile.consultation_hours.consultation_hours) {
            // New format with nested consultation_hours
            consultationHoursData = {
              ...profile.consultation_hours.consultation_hours,
              daysAvailable: Array.isArray(profile.consultation_hours.consultation_hours.daysAvailable) 
                ? profile.consultation_hours.consultation_hours.daysAvailable.map(dayNum => dayNumberToName[dayNum] || dayNum)
                : Object.entries(profile.consultation_hours.consultation_hours.daysAvailable || {})
                    .filter(([_, value]) => value)
                    .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
            };
            setTimezone(profile.consultation_hours.timezone || "America/Denver");
          } else {
            // Old format - convert day numbers to names if needed
            const daysAvailable = Array.isArray(profile.consultation_hours.daysAvailable) 
              ? profile.consultation_hours.daysAvailable.map(day => 
                  typeof day === 'number' ? dayNumberToName[day] : day
                )
              : Object.entries(profile.consultation_hours.daysAvailable || {})
                  .filter(([_, value]) => value)
                  .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
            
            consultationHoursData = {
              ...profile.consultation_hours,
              daysAvailable
            };
          }
          
          setConsultationHours(consultationHoursData);
        }
      } catch (error) {
        console.error("Error fetching setup progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetupProgress();
  }, [isCalendarConnected]);

  useEffect(() => {
    const fetchGoogleReviewsStatus = async () => {
      try {
        const { data: businessData, error } = await supabase
          .from('business_profiles')
          .select('google_place_id, google_reviews_status')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (businessData) {
          setGoogleBusinessProfile({
            isConnected: true,
            businessName: businessData.name,
            location: businessData.address,
            status: 'connected',
            error: null,
            accountId: businessData.google_business_account_id,
            locationId: businessData.google_place_id,
          });
        }
      } catch (error) {
        console.error('Error fetching Google reviews status:', error);
      }
    };

    if (user) {
      fetchGoogleReviewsStatus();
    }
  }, [user]);

  const handleResetStripeAccount = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("business_profiles")
      .update({ stripe_account_id: null })
      .eq("id", user.id);

    window.location.reload(); // Reload the page to reflect changes

    if (error) {
      console.error("Error resetting Stripe account:", error);
    } else {
      setStripeError(false); // Clear the error state after resetting
    }
  };

  const handleOpenStripeDashboard = async () => {
    try {
      const response = await fetch(
        "https://bidi-express.vercel.app/create-login-link",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accountId: connectedAccountId }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        window.location.href = data.url; // Redirect to the Stripe dashboard
        setStripeError(false); // Clear the error state if successful
      } else {
        setStripeError(true); // Set the error state if an error occurs
      }
    } catch (error) {
      console.error("Error opening Stripe dashboard:", error);
      setStripeError(true); // Set the error state if an error occurs
    }
  };

  const handleStripeOnboarding = async () => {
    navigate('/onboarding');
  };

  const handleGeneratePartnershipLink = async () => {
    try {
      // Get the current user's business profile
      const { data: businessProfile, error: businessError } = await supabase
        .from("business_profiles")
        .select("business_name")
        .eq("id", user.id)
        .single();

      if (businessError) throw businessError;

      // Get the business's profile photo
      const { data: profilePhoto, error: photoError } = await supabase
        .from("profile_photos")
        .select("photo_url")
        .eq("user_id", user.id)
        .eq("photo_type", "profile")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (photoError && photoError.code !== "PGRST116") throw photoError;

      // Create a hyphenated ID from the business name
      const partnershipId = businessProfile.business_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Check if a partnership already exists
      const { data: existingPartnership, error: checkError } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

      const standardDescription = `Welcome to Bidi, exclusively for ${businessProfile.business_name} customers!`;

      if (existingPartnership) {
        // Update existing partnership
        const { error: updateError } = await supabase
          .from("partners")
          .update({
            name: businessProfile.business_name,
            logo_url: profilePhoto?.photo_url || null,
            description: standardDescription
          })
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      } else {
        // Create new partnership
        const { error: createError } = await supabase
          .from("partners")
          .insert({
            id: partnershipId,
            user_id: user.id,
            name: businessProfile.business_name,
            logo_url: profilePhoto?.photo_url || null,
            description: standardDescription
          });

        if (createError) throw createError;
      }

      // Fetch the updated partnership data
      await fetchPartnershipData();
      setShowCouponModal(true);
    } catch (error) {
      console.error("Error creating partnership:", error);
      alert("Failed to create partnership link. Please try again.");
    }
  };

  const getButtonText = () => {
    if (!activeCoupon) return "Generate Affiliate Coupon";
    return "View Affiliate Coupon";
  };

  const calculateEarnings = (amount) => {
    if (!amount || isNaN(amount)) return 0;
    return (parseFloat(amount) * 0.05).toFixed(2);
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type); // Set the selected type (percentage or flat fee)
    setPercentage(""); // Reset percentage input when toggling
    setDownPaymentNumber(""); // Reset number input when toggling
  };

  const handleChangeDownPaymentPercentage = (e) => {
    let value = e.target.value;
    // Allow only numbers between 0 and 100
    if (value <= 100 && value >= 0) {
      setPercentage(value);
    }
  };

  const handleChangeDownPaymentNumber = (e) => {
    setDownPaymentNumber(e.target.value);
  };

  const handleDownPaymentSubmit = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("User not found. Please log in again.");
      return;
    }

    if (!paymentType) {
      alert("Please select a down payment type (Percentage or Flat Fee).");
      return;
    }

    if (
      paymentType === "percentage" &&
      (percentage === "" || percentage <= 0)
    ) {
      alert("Please enter a valid percentage amount.");
      return;
    }

    if (
      paymentType === "flat fee" &&
      (downPaymentNumber === "" || downPaymentNumber <= 0)
    ) {
      alert("Please enter a valid flat fee amount.");
      return;
    }

    let downPaymentAmount = 0;
    if (paymentType === "percentage") {
      downPaymentAmount = parseFloat(percentage) / 100; // Convert percentage to decimal
    } else if (paymentType === "flat fee") {
      downPaymentAmount = parseFloat(downPaymentNumber); // Flat fee stays as it is
    }

    if (!downPaymentAmount) {
      alert("Please enter a valid down payment amount.");
      return;
    }

    const { data: existingProfile, error: fetchError } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching business profile:", fetchError);
      alert("An error occurred while fetching your profile.");
      return;
    }

    if (existingProfile) {
      const { data, error } = await supabase
        .from("business_profiles")
        .update({
          down_payment_type: paymentType,
          amount: downPaymentAmount, // Store down payment as decimal (percentage/100)
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating down payment:", error);
        alert("An error occurred while updating your down payment details.");
      } else {
        setShowDownPaymentModal(false); // Close modal on successful update
      }
    } else {
      alert(
        "Business profile not found. Please make sure your account is set up correctly."
      );
    }
  };

  // Handle saving the minimum price
  const handleMinPriceSubmit = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("business_profiles")
        .update({ minimum_price: minimumPrice })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating minimum price:", error);
        alert("Failed to update minimum price. Please try again.");
        return;
      }

      // Close the modal and refresh setup progress
      setShowMinPriceModal(false);
      setSetupProgress(); // Refresh the setup progress to reflect the changes
    } catch (error) {
      console.error("Error saving minimum price:", error);
    }
  };

  const validateBidTemplate = (template) => {
    // More precise regex patterns to catch contact information
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?(?:\d{3})\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{10}(?=\D|$)/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9._%+-]+\s*\(?at\)?\s*[a-zA-Z0-9.-]+\s*\(?dot\)?\s*[a-zA-Z]{2,}/gi;
    const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?|(?:my\s+)?website(?:\s+is)?\s*:\s*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/gi;
    const socialMediaRegex = /(?:@|(?:https?:\/\/)?(?:www\.)?(?:instagram|insta|ig|facebook|fb|linkedin|twitter|x|tiktok|tt|snapchat|snap)(?:\.com)?\/)[a-zA-Z0-9._-]+|(?:(?:instagram|insta|ig|facebook|fb|linkedin|twitter|x|tiktok|tt|snapchat|snap)\s*(?::|is|at|handle|profile|account)?:?\s*[@]?[a-zA-Z0-9._-]+)|(?:my\s+(?:instagram|insta|ig|facebook|fb|linkedin|twitter|x|tiktok|tt|snapchat|snap)\s+(?:is|handle|profile|account)?:?\s*[@]?[a-zA-Z0-9._-]+)|(?:find\s+(?:me|us)\s+on\s+(?:instagram|insta|ig|facebook|fb|linkedin|twitter|x|tiktok|tt|snapchat|snap)\s*[@]?[a-zA-Z0-9._-]+)/gi;

    // Remove spaces and special characters for additional checking
    const normalizedTemplate = template.toLowerCase().replace(/[\s\-.()\[\]]/g, '');

    // Additional checks for common obfuscation patterns
    const hasPhone = phoneRegex.test(template) || /\d{10}(?=\D|$)/.test(normalizedTemplate);
    const hasEmail = emailRegex.test(template);
    const hasWebsite = websiteRegex.test(template);
    const hasSocialMedia = socialMediaRegex.test(template);

    // Check if the content contains actual contact information
    const containsContactInfo = hasPhone || hasEmail || hasWebsite || hasSocialMedia;

    // Check for false positives - common phrases that might trigger the regex but aren't actually contact info
    const falsePositives = [
        /phone call/i,
        /call me/i,
        /give me a call/i,
        /reach out/i,
        /contact me/i,
        /get in touch/i,
        /\$?\d+(?:\.\d{2})?(?:\s*(?:dollars|USD))?/i, // Price mentions
        /\d+(?:\s*(?:years|yrs|photos|pictures|hours|hrs|minutes|mins|days))?/i, // Numbers with units
        /second shooter/i,
        /second photographer/i
    ];

    // If we found contact info, check if it's a false positive
    if (containsContactInfo) {
        const isFalsePositive = falsePositives.some(pattern => pattern.test(template));
        if (!isFalsePositive) {
            const errorMessage = [
                "Please remove the following contact information from your template:",
                hasPhone && "- Phone numbers (including spaced or formatted numbers)",
                hasEmail && "- Email addresses (including formatted or spelled out addresses)",
                hasWebsite && "- Website URLs (including spelled out domains)",
                hasSocialMedia && "- Social media handles/links (including profile references and abbreviations like 'IG' or 'FB')",
                "\nAll contact information should be managed through your Bidi profile. The user can see your work on your profile and will get your contact information after accepting your bid."
            ].filter(Boolean).join("\n");

            setBidTemplateError(errorMessage);
            return { isValid: false, message: errorMessage };
        }
    }

    setBidTemplateError("");
    return { isValid: true };
  };

  const handleBidTemplateChange = (content) => {
    // Update the template content
    setBidTemplate(content);

    // Validate the content
    validateBidTemplate(content);
  };

  const handleBidTemplateSubmit = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("User not found. Please log in again.");
      return;
    }

    // Validate the template content
    const validation = validateBidTemplate(bidTemplate);
    if (!validation.isValid) {
      return;
    }

    const { data, error } = await supabase
      .from("business_profiles")
      .update({
        bid_template: bidTemplate,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating bid template:", error);
      alert("An error occurred while updating your bid template.");
    } else {
      setShowBidTemplateModal(false);
      setBidTemplateError("");
    }
  };

  const handleDefaultExpirationSubmit = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("User not found. Please log in again.");
      return;
    }

    if (!defaultExpirationDays || defaultExpirationDays <= 0) {
      alert("Please enter a valid number of days.");
      return;
    }

    const { error } = await supabase
      .from("business_profiles")
      .update({ default_expiration_days: parseInt(defaultExpirationDays) })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating default expiration days:", error);
      alert("An error occurred while updating your default expiration days.");
    } else {
      setShowDefaultExpirationModal(false);
    }
  };

  const handleDismissBanner = () => {
    setShowSupportBanner(false);
    localStorage.setItem('hideSupportBanner', 'true');
  };

  // Add this new function to handle category updates
  const handleCategorySubmit = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("User not found. Please log in again.");
      return;
    }

    // If "other" is selected and there's a custom category, add it to the array
    let categoriesToSave = [...selectedCategories];
    if (selectedCategories.includes('other') && customCategory.trim()) {
      categoriesToSave = categoriesToSave.filter(cat => cat !== 'other');
      categoriesToSave.push(customCategory.trim());
    }

    const { error } = await supabase
      .from("business_profiles")
      .update({ business_category: categoriesToSave })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating business categories:", error);
      alert("An error occurred while updating your business categories.");
    } else {
      setShowCategoryModal(false);
      setCurrentCategories(categoriesToSave);
      setCustomCategory(""); // Reset custom category
    }
  };

  // Update the steps array to include Google Calendar
  const steps = [
    { 
      key: 'paymentAccount', 
      label: 'Payment Account', 
      important: true,
      description: 'Connect your payment account to receive payments from clients'
    },
    { 
      key: 'verification', 
      label: 'Verification', 
      important: true,
      description: 'Get verified to build trust with potential clients'
    },
    { 
      key: 'story', 
      label: 'Set Up Your Profile', 
      important: true,
      description: 'Showcase your work and tell your story to attract more clients'
    },
    { 
      key: 'calendar', 
      label: 'Google Calendar', 
      important: true,
      description: 'Sync your calendar to manage consultations and prevent double bookings'
    },
    { 
      key: 'googleBusiness', 
      label: 'Google Business', 
      important: true,
      description: 'Connect your Google Business Profile to display reviews and build trust'
    },
    { key: 'downPayment', label: 'Down Payment', important: false },
    { key: 'minimumPrice', label: 'Minimum Price', important: false },
    { key: 'affiliateCoupon', label: 'Affiliate Coupon', important: false },
    { key: 'bidTemplate', label: 'Bid Template', important: false },
    { key: 'defaultExpiration', label: 'Default Bid Expiration', important: false },
  ];

  const isBidiVerified = profileDetails && profileDetails.membership_tier === 'Verified';

  const handleFetchReviews = async () => {
    if (!googleBusinessProfile.accountId || !googleBusinessProfile.locationId) {
      setGoogleBusinessProfile(prev => ({
        ...prev,
        error: 'Missing account or location information',
      }));
      return;
    }

    await fetchReviews(googleBusinessProfile.accountId, googleBusinessProfile.locationId);
  };

  // Add Google Business Profile section render function
  const renderGoogleBusinessSection = () => {
    return (
      <div className="settings-section">
        {/* 
        <div className="settings-header">
          <h3>Google Business Profile</h3>
          <div className="settings-status">
            {googleBusinessProfile.isConnected ? (
              <span className="status-badge connected">
                <i className="fas fa-check"></i> Connected
              </span>
            ) : (
              <span className="status-badge disconnected">
                <i className="fas fa-times"></i> Not Connected
              </span>
            )}
          </div>
        </div>
        */}
      </div> 
    );
  };

  // Add back the renderGoogleReviewsSection function
  const renderGoogleReviewsSection = () => {
    const isConnected = googleReviewsStatus === 'connected';
    const isPending = googleReviewsStatus === 'pending';
    const isError = googleReviewsStatus === 'error';

    return (
      <div className="settings-section">
        <div className="settings-header">
          <h3>Google Reviews</h3>
          <div className="settings-status">
            {isConnected && (
              <span className="status-badge connected">
                <i className="fas fa-check"></i> Connected
              </span>
            )}
            {isPending && (
              <span className="status-badge pending">
                <i className="fas fa-clock"></i> Pending Approval
              </span>
            )}
            {isError && (
              <span className="status-badge error">
                <i className="fas fa-exclamation-circle"></i> Error
              </span>
            )}
            {!isConnected && !isPending && !isError && (
              <span className="status-badge disconnected">
                <i className="fas fa-times"></i> Not Connected
              </span>
            )}
          </div>
        </div>

        <div className="settings-content">
          {isConnected ? (
            <div className="connected-content">
              <p>Your Google reviews are connected and visible on your profile.</p>
              <div className="settings-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleResetGoogleReviews}
                  disabled={isProcessing}
                >
                  <i className="fas fa-sync"></i> Refresh Reviews
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleResetGoogleReviews}
                  disabled={isProcessing}
                >
                  <i className="fas fa-unlink"></i> Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="disconnected-content">
              <p>Connect your Google Business reviews to display them on your profile.</p>
              <div className="settings-form">
                <div className="form-group">
                  <label htmlFor="googleMapsUrl">Google Maps URL</label>
                  <input
                    type="text"
                    id="googleMapsUrl"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="form-control"
                    disabled={isProcessing}
                  />
                  {googleReviewsError && (
                    <div className="error-message">{googleReviewsError}</div>
                  )}
                </div>
                <div className="settings-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleGoogleReviewsRequest}
                    disabled={!googleMapsUrl || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-link"></i> Connect Reviews
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Add Google Business Profile functions
  const handleConnectGoogleBusiness = async () => {
    try {
      setGoogleBusinessProfile(prev => ({ ...prev, status: 'connecting', error: null }));
      
      // Get the current user's ID
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Make request to get auth URL with the business profile ID
      const response = await fetch(`http://localhost:5000/api/google-places/business-profile/auth?businessProfileId=${currentUser.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage;
        try {
          const jsonError = JSON.parse(errorData);
          errorMessage = jsonError.message || 'Failed to get authorization URL';
        } catch {
          errorMessage = errorData || 'Failed to get authorization URL';
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data.authUrl) {
        throw new Error('No authorization URL received from server');
      }
      
      // Open auth window
      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        data.authUrl,
        'Google Business Profile Auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Listen for message from popup
      const handleMessage = async (event) => {
        // Allow messages from localhost:5000 and localhost:3000
        const allowedOrigins = ['http://localhost:5000', 'http://localhost:3000'];
        if (!allowedOrigins.includes(event.origin)) {
          console.log('Rejected message from origin:', event.origin);
          return;
        }
        
        if (event.data.type === 'GOOGLE_BUSINESS_AUTH_SUCCESS') {
          const { accountId, locationId, businessName, location } = event.data;
          
          try {
            // Update the business profile in Supabase
            const { error: updateError } = await supabase
              .from('business_profiles')
              .update({
                google_business_name: businessName,
                google_business_address: location,
                google_place_id: locationId,
                google_business_account_id: accountId,
                google_reviews_status: 'connected'
              })
              .eq('id', currentUser.id);

            if (updateError) {
              throw new Error('Failed to save business profile information');
            }

            // Check connection status
            const statusResponse = await fetch(`http://localhost:5000/api/google-places/business-profile/status?businessProfileId=${currentUser.id}`);
            const statusData = await statusResponse.json();

            if (statusData.connected) {
              setGoogleBusinessProfile({
                isConnected: true,
                businessName,
                location,
                status: 'connected',
                error: null,
                accountId,
                locationId,
              });
            } else {
              throw new Error('Connection verification failed');
            }

            window.removeEventListener('message', handleMessage);
          } catch (error) {
            setGoogleBusinessProfile(prev => ({
              ...prev,
              status: 'error',
              error: error.message || 'Failed to save business profile information',
            }));
            window.removeEventListener('message', handleMessage);
          }
        } else if (event.data.type === 'GOOGLE_BUSINESS_AUTH_ERROR') {
          setGoogleBusinessProfile(prev => ({
            ...prev,
            status: 'error',
            error: event.data.error,
          }));
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'GOOGLE_BUSINESS_AUTH_RETRY') {
          // Retry the connection process
          window.removeEventListener('message', handleMessage);
          handleConnectGoogleBusiness();
        }
      };

      window.addEventListener('message', handleMessage);

      // Add a timeout to handle cases where the popup is closed without completing the flow
      setTimeout(() => {
        if (authWindow && !authWindow.closed) {
          authWindow.close();
          setGoogleBusinessProfile(prev => ({
            ...prev,
            status: 'error',
            error: 'Authentication timed out. Please try again.'
          }));
          window.removeEventListener('message', handleMessage);
        }
      }, 300000); // 5 minutes timeout

    } catch (error) {
      console.error('Error connecting Google Business Profile:', error);
      setGoogleBusinessProfile(prev => ({
        ...prev,
        status: 'error',
        error: error.message || 'Failed to connect to Google Business Profile'
      }));
    }
  };

  const handleDisconnectGoogleBusiness = async () => {
    try {
      console.log('Starting disconnect process...');
      setGoogleBusinessProfile(prev => ({
        ...prev,
        status: 'connecting'
      }));

      // First update the database
      const { error: dbUpdateError } = await supabase
        .from('business_profiles')
        .update({
          google_business_name: null,
          google_business_address: null,
          google_place_id: null,
          google_business_account_id: null
        })
        .eq('id', user.id);

      if (dbUpdateError) {
        console.error('Database update error:', dbUpdateError);
        throw new Error('Failed to clear business profile information');
      }

      // Then call the disconnect endpoint
      const response = await fetch('http://localhost:5000/api/google-places/business-profile/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.message || 'Failed to disconnect from Google Business Profile');
      }

      // Update local state
      setGoogleBusinessProfile({
        isConnected: false,
        businessName: '',
        location: '',
        status: 'disconnected',
        error: null,
        accountId: null,
        locationId: null
      });

      // Also update the reviews status
      setGoogleReviewsStatus('disconnected');
      
      console.log('Google Business Profile disconnected successfully');
    } catch (error) {
      console.error('Error in handleDisconnectGoogleBusiness:', error);
      setGoogleBusinessProfile(prev => ({
        ...prev,
        status: 'disconnected',
        error: error.message || 'Failed to disconnect Google Business Profile'
      }));
    }
  };

  const handleResetGoogleReviews = async () => {
    try {
      setIsProcessing(true);
      setGoogleReviewsError(null);

      const { error } = await supabase
        .from('business_profiles')
        .update({
          google_place_id: null,
          google_reviews_status: 'disconnected'
        })
        .eq('id', connectedAccountId);

      if (error) throw error;

      setGoogleReviewsStatus('disconnected');
      setGoogleMapsUrl('');
    } catch (error) {
      console.error('Error resetting Google reviews:', error);
      setGoogleReviewsError(error.message || 'Failed to reset Google reviews');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleReviewsRequest = async () => {
    try {
      setIsProcessing(true);
      setGoogleReviewsError(null);

      const placeId = extractPlaceIdFromUrl(googleMapsUrl);
      if (!placeId) {
        throw new Error('Invalid Google Maps URL');
      }

      const { error } = await supabase
        .from('business_profiles')
        .update({
          google_place_id: placeId,
          google_reviews_status: 'pending'
        })
        .eq('id', connectedAccountId);

      if (error) throw error;

      setGoogleReviewsStatus('pending');
      setGoogleMapsUrl('');
    } catch (error) {
      console.error('Error requesting Google reviews:', error);
      setGoogleReviewsError(error.message || 'Failed to request Google reviews');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractPlaceIdFromUrl = (url) => {
    try {
      // Handle different Google Maps URL formats
      if (!url) return null;

      // Format 1: https://maps.app.goo.gl/...
      if (url.includes('maps.app.goo.gl')) {
        const match = url.match(/[?&]q=([^&]+)/);
        if (match) {
          const decoded = decodeURIComponent(match[1]);
          const placeIdMatch = decoded.match(/place_id=([^&]+)/);
          if (placeIdMatch) return placeIdMatch[1];
        }
      }

      // Format 2: https://www.google.com/maps/place/...
      if (url.includes('google.com/maps/place')) {
        const match = url.match(/place\/([^/]+)/);
        if (match) return match[1];
      }

      // Format 3: https://www.google.com/maps?cid=...
      if (url.includes('cid=')) {
        const match = url.match(/cid=([^&]+)/);
        if (match) return match[1];
      }

      return null;
    } catch (error) {
      console.error('Error extracting place ID:', error);
      return null;
    }
  };

  const handlePortfolioClick = (businessId, businessName) => {
    const formattedName = formatBusinessName(businessName);
    navigate(`/portfolio/${businessId}/${formattedName}`);
  };

  // Add this function to handle consultation hours changes
  const handleConsultationHoursSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("User not found. Please log in again.");
        return;
      }

      // Convert day names to numbers for the API
      const daysAvailableNumbers = consultationHours.daysAvailable.map(dayName => dayNameToNumber[dayName]);

      // Prepare data in new API format
      const consultationHoursData = {
        consultation_hours: {
          startTime: consultationHours.startTime,
          endTime: consultationHours.endTime,
          daysAvailable: daysAvailableNumbers
        },
        timezone: timezone
      };

      // Use the new API function
      await updateConsultationHours(user.id, consultationHoursData);
      
      // Refresh the setup progress to reflect the changes
      setSetupProgress(prev => ({ ...prev }));
      
      setShowConsultationHoursModal(false);
      alert("Consultation hours updated successfully!");
    } catch (error) {
      console.error("Error saving consultation hours:", error);
      alert("Failed to save consultation hours. Please try again.");
    }
  };

  // Add function to check training completion status
  const checkTrainingCompletion = async () => {
    if (!user?.id) return;
    
    try {
      setTrainingLoading(true);
      
      // Get business categories first
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('business_category')
        .eq('id', user.id)
        .single();

      let userCategories = [];
      if (businessProfile?.business_category) {
        if (Array.isArray(businessProfile.business_category)) {
          userCategories = businessProfile.business_category.filter(cat => cat !== 'other');
        } else {
          userCategories = [businessProfile.business_category];
        }
      }

      if (userCategories.length === 0) {
        console.log('No categories found, using photography as default');
        userCategories = ['photography'];
      }

      // Check training progress for all categories
      const { data: progressData, error } = await supabase
        .from('autobid_training_progress')
        .select('category, training_completed, consecutive_approvals, total_scenarios_completed')
        .eq('business_id', user.id)
        .in('category', userCategories);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // Check if any training has been started but not completed
      const hasStartedTraining = progressData?.some(progress => 
        progress.total_scenarios_completed > 0 || progress.consecutive_approvals > 0
      );
      
      // Training is completed if ALL categories have completed training
      const allCategoriesComplete = userCategories.every(category => {
        const categoryProgress = progressData?.find(p => p.category === category);
        return categoryProgress && (categoryProgress.training_completed || categoryProgress.consecutive_approvals >= 2);
      });
      
      setTrainingCompleted(allCategoriesComplete);
      setTrainingInProgress(hasStartedTraining && !allCategoriesComplete);
    } catch (error) {
      console.error('Error checking training completion:', error);
      setTrainingCompleted(false);
      setTrainingInProgress(false);
    } finally {
      setTrainingLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setIsAdmin(user?.email === "baylor@savewithbidi.com");
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  // Add effect to check training completion when user is loaded
  useEffect(() => {
    if (user?.id) {
      checkTrainingCompletion();
    }
  }, [user?.id]);

  if (isLoading) {
    return <LoadingSpinner color="#9633eb" size={50} />;
  }

  const styles = {
    settingsCard: {
      background: '#fff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    settingsCardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    settingsCardHeaderH3: {
      margin: 0,
      fontSize: '18px',
      color: '#333'
    },
    settingsEditButton: {
      background: 'none',
      border: 'none',
      color: '#A328F4',
      cursor: 'pointer',
      fontSize: '14px',
      padding: '4px 8px',
      borderRadius: '4px'
    },
    consultationHoursDisplay: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    timeRange: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    timeLabel: {
      fontWeight: 500,
      color: '#666'
    },
    timeValue: {
      color: '#333'
    },
    daysList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '8px'
    },
    dayTag: {
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: '13px'
    },
    dayTagAvailable: {
      background: '#e8f5e9',
      color: '#2e7d32'
    },
    dayTagUnavailable: {
      background: '#f5f5f5',
      color: '#757575'
    },
    daysCheckboxes: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: '12px',
      marginTop: '8px'
    },
    dayCheckbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      width: '90%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    },
    modalHeaderH2: {
      margin: 0,
      fontSize: '20px',
      color: '#333'
    },
    modalClose: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      color: '#666',
      cursor: 'pointer',
      padding: '4px'
    },
    modalBody: {
      marginBottom: '24px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    formGroupLabel: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: 500,
      color: '#333'
    },
    formGroupInput: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '14px'
    },
    modalFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px'
    },
    modalCancel: {
      padding: '8px 16px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      background: 'white',
      color: '#666',
      cursor: 'pointer'
    },
    modalSave: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      background: '#A328F4',
      color: 'white',
      cursor: 'pointer'
    }
  };

  return (
    <div className="business-settings-container">
      <h1 style={{ fontFamily: "Outfit", fontWeight: "bold" }}>
        Business Settings
      </h1>
      <p className="text-muted mb-4" style={{ fontFamily: "Outfit", fontSize: "1rem", color: "gray", textAlign: "center" }}>Manage your business profile, payment settings, and preferences</p>
      
      {/* Instagram Support Banner */}
      {showSupportBanner && (
        <div className="support-banner mb-4" style={{
          background: 'linear-gradient(135deg, #F247D1 0%, #764ba2 100%)',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="fab fa-instagram" style={{ fontSize: '24px' }}></i>
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                Join Our Instagram Support Group
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                Connect with other vendors and get support from the Bidi team
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a 
              href="https://www.instagram.com/bidiweddings/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              Join Group
            </a>
            <button 
              onClick={handleDismissBanner}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                opacity: 0.7,
                padding: '4px'
              }}
              onMouseOver={(e) => e.target.style.opacity = '1'}
              onMouseOut={(e) => e.target.style.opacity = '0.7'}
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Setup Progress Checklist */}
      {Object.values(setupProgress).some(v => !v) && (
        <div className="setup-checklist">
          <div className="checklist-header">
            <h3>Complete Your Setup</h3>
            <p>Finish these steps to get your business profile fully set up and ready to go!</p>
          </div>
          {steps.map((step, idx) => {
            const complete = !!setupProgress[step.key];
            const getActionButton = () => {
              switch(step.key) {
                case 'paymentAccount':
                  return (
                    <button 
                      className={`checklist-action${complete ? ' complete' : ''}`}
                      onClick={connectedAccountId ? handleOpenStripeDashboard : handleStripeOnboarding}
                    >
                      {complete ? 'Edit Payment' : 'Connect Payment'}
                    </button>
                  );
                case 'downPayment':
                  return (
                    <button 
                      className={`checklist-action${complete ? ' complete' : ''}`}
                      onClick={() => setShowDownPaymentModal(true)}
                    >
                      {complete ? 'Edit Down Payment' : 'Set Down Payment'}
                    </button>
                  );
                case 'minimumPrice':
                  return (
                    <button 
                      className={`checklist-action${complete ? ' complete' : ''}`}
                      onClick={() => setShowMinPriceModal(true)}
                    >
                      {complete ? 'Edit Min Price' : 'Set Min Price'}
                    </button>
                  );
                case 'affiliateCoupon':
                  return (
                    <button 
                      className={`checklist-action${complete ? ' complete' : ''}`}
                      onClick={() => setShowCouponModal(true)}
                    >
                      {complete ? 'Edit Coupon' : 'Create Coupon'}
                    </button>
                  );
                case 'bidTemplate':
                  return (
                    <button 
                      className={`checklist-action${complete ? ' complete' : ''}`}
                      onClick={() => setShowBidTemplateModal(true)}
                    >
                      {complete ? 'Edit Template' : 'Create Template'}
                    </button>
                  );
                case 'verification':
                  return (
                    <button 
                      className={`checklist-action${complete ? ' complete' : ''}`}
                      onClick={() => navigate("/verification-application")}
                    >
                      {complete ? 'View Status' : 'Apply for Verification'}
                    </button>
                  );
                case 'story':
                  return (
                    <button 
                      className={`checklist-action${complete ? ' complete' : ''}`}
                      onClick={() => handlePortfolioClick(profileDetails?.id, profileDetails?.business_name)}
                    >
                      {complete ? 'Edit Profile' : 'Complete Profile'}
                    </button>
                  );
                case 'calendar':
                  return (
                    <button 
                      className={`checklist-action${complete ? ' complete' : ''}`}
                      onClick={() => setShowGoogleCalendarModal(true)}
                    >
                      {complete ? 'Edit Calendar' : 'Connect Calendar'}
                    </button>
                  );
                case 'defaultExpiration':
                  return (
                    <button 
                      className={`checklist-action${complete ? ' complete' : ''}`}
                      onClick={() => setShowDefaultExpirationModal(v => !v)}
                    >
                      {complete ? 'Edit' : 'Add'}
                    </button>
                  );
                default:
                  return null;
              }
            };

            return (
              <div key={step.key} className={`checklist-item${complete ? ' complete' : ''}${step.important ? ' important' : ''}`}>
                <div className="checklist-circle">
                  {complete ? (
                    <i className="fas fa-check-circle"></i>
                  ) : step.important ? (
                    <i className="fas fa-exclamation-circle"></i>
                  ) : (
                    <i className="far fa-circle"></i>
                  )}
                </div>
                <div className="checklist-content">
                  <div className="checklist-label">
                    <div className="checklist-label-header">
                      {step.label}
                      {step.important && <span className="important-badge">Important</span>}
                    </div>
                    {step.important && step.description && (
                      <div className="checklist-description">{step.description}</div>
                    )}
                  </div>
                  <div className="checklist-status">
                    {complete ? 'Complete' : 'Incomplete'}
                  </div>
                </div>
                {getActionButton()}
              </div>
            );
          })}
        </div>
      )}
      {/* Sectioned Cards */}
      <div className="row justify-content-center align-items-stretch">
        {/* Admin Dashboard Section (if admin) */}
        {isAdmin && (
          <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
            <div className="card mb-4 h-100">
              <div className="card-header d-flex align-items-center">
                <img src={bidiLogo} className="admin-logo me-2" alt="Admin" />
                <span>Admin Dashboard</span>
              </div>
              <div className="card-body">
                <button
                  className="btn-primary flex-fill"
                  onClick={() => setActiveSection("admin")}
                >
                  <img src={bidiLogo} className="admin-logo me-2" alt="Admin" />
                  Admin Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Payments Section */}
        <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
          <div className="card mb-4 h-100">
            <div className="card-header d-flex align-items-center">
              <i className="fas fa-dollar-sign me-2"></i>
              <span>Payments</span>
              { !setupProgress.paymentAccount && <span className="badge-new ms-2" title="Set up your payment account to get paid!">New</span> }
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Status:</span>
                <span className="info-value">
                  {connectedAccountId ? <><i className="fas fa-check-circle text-success" aria-label="Connected"></i>Connected</> : <><i className="fas fa-exclamation-circle text-muted" aria-label="Not Connected"></i>Not Connected</>}
                </span>
              </div>
              <button
                style={{ fontWeight: "bold", color: "#9633eb" }}
                className={`btn-primary flex-fill${!setupProgress.paymentAccount ? ' pulse' : ''}`}
                onClick={connectedAccountId ? handleOpenStripeDashboard : handleStripeOnboarding}
                disabled={accountCreatePending}
              >
                {connectedAccountId ? 'Edit' : 'Connect Your Payment Account'}
              </button>
              <small className="text-muted d-block mt-2">
                {connectedAccountId
                  ? 'Connect your payment account to receive payouts from Bidi.'
                  : 'This is how we pay you for your work. You will never pay us.'}
              </small>
              {stripeError && (
                <div className="alert alert-danger mt-3">
                  An error occurred. <button className="btn-link" onClick={handleResetStripeAccount}>Reset Stripe Connection</button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Profile Section */}
        <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
          <div className="card mb-4 h-100">
            <div className="card-header d-flex align-items-center">
              <i className="fas fa-user me-2"></i>
              <span>Profile</span>
              { !setupProgress.story && <span className="badge-new ms-2" title="Complete your profile story">New</span> }
            </div>
            <div className="card-body">
              <button
                className={`btn-primary flex-fill${!setupProgress.story ? ' pulse' : ''}`}
                onClick={() => handlePortfolioClick(profileDetails?.id, profileDetails?.business_name)}
              >
                <i className="fas fa-user-edit me-2"></i>
                {setupProgress.story ? "Edit Profile" : "Complete Profile"}
              </button>
              <small className="text-muted d-block mt-2">Tell your story and showcase your work to attract more clients.</small>
              <div className="info-row info-row-spaced">
                <span className="info-label">Bidi Verified:</span>
                <span className="info-value">
                  {isBidiVerified
                    ? <><i className="fas fa-check-circle text-success" aria-label="Verified"></i>Verified</>
                    : <><i className="fas fa-exclamation-circle text-muted" aria-label="Not Verified"></i>Not Verified</>}
                </span>
              </div>
              {!isBidiVerified && (
                <button
                  className="btn-primary flex-fill mt-3"
                  onClick={() => navigate("/verification-application")}
                >
                  Apply to be Bidi Verified
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Templates Section */}
        <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
          <div className="card mb-4 h-100">
            <div className="card-header d-flex align-items-center">
              <i className="fas fa-file-alt me-2"></i>
              <span>Templates</span>
              { !setupProgress.bidTemplate && <span className="badge-new ms-2" title="Create your bid template">New</span> }
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Bid Template:</span>
                <span className="info-value">
                  {bidTemplate ? <span className="text-success">Template Set</span> : <span className="text-muted">No Template</span>}
                </span>
              </div>
              <button
                className={`btn-primary flex-fill${!setupProgress.bidTemplate ? ' pulse' : ''}`}
                onClick={() => setShowBidTemplateModal(v => !v)}
              >
                {setupProgress.bidTemplate ? 'Edit' : 'Add'}
              </button>
              <small className="text-muted d-block mt-2">Create a reusable bid template to save time when responding to requests.</small>
              {isDesktop && showBidTemplateModal && (
                <div className="card-modal-content">
                  <div className="mb-3">
                    <label htmlFor="bidTemplate" className="form-label">Your bid template:</label>
                    {bidTemplateError && (
                      <div className="alert alert-warning" role="alert">{bidTemplateError.split("\n").map((line, index) => (<div key={index}>{line}</div>))}</div>
                    )}
                    <ReactQuill theme="snow" value={bidTemplate} onChange={handleBidTemplateChange} modules={modules} formats={formats} style={{ height: "300px", marginBottom: "50px" }} />
                  </div>
                  <div>
                    <button className="btn-danger me-2" onClick={() => { setShowBidTemplateModal(false); setBidTemplateError(""); }}>Close</button>
                    <button className="btn-success" onClick={handleBidTemplateSubmit}>Save</button>
                  </div>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Contract Template:</span>
                <span className="info-value">
                  {contractTemplate ? <span className="text-success">Template Set</span> : <span className="text-muted">No Template</span>}
                </span>
              </div>
              <button
                className={`btn-primary flex-fill mt-3${!contractTemplate ? ' pulse' : ''}`}
                onClick={() => setActiveSection("contract-template")}
              >
                {contractTemplate ? 'Edit' : 'Add'}
              </button>
              <small className="text-muted d-block mt-2">Set up your contract template for faster bookings.</small>
            </div>
          </div>
        </div>
        {/* Down Payment Section */}
        <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
          <div className="card mb-4 h-100">
            <div className="card-header d-flex align-items-center">
              <i className="fas fa-dollar-sign me-2"></i>
              <span>Down Payment</span>
              { !setupProgress.downPayment && <span className="badge-new ms-2" title="Set your down payment policy">New</span> }
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Down Payment:</span>
                <span className="info-value">
                  {paymentType
                    ? paymentType === 'percentage'
                      ? `${percentage || (profileDetails && profileDetails.amount ? profileDetails.amount * 100 : '')}%`
                      : `$${downPaymentNumber || (profileDetails && profileDetails.amount ? profileDetails.amount : '')}`
                    : <span className="text-muted">Not Set</span>}
                </span>
              </div>
              <button
                className={`btn-primary flex-fill${!setupProgress.downPayment ? ' pulse' : ''}`}
                onClick={() => setShowDownPaymentModal(v => !v)}
              >
                {setupProgress.downPayment ? 'Edit' : 'Add'}
              </button>
              <small className="text-muted d-block mt-2">Specify if you require a percentage or flat fee up front for bookings.</small>
            </div>
          </div>
        </div>
        {/* Minimum Price Section */}
        <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
          <div className="card mb-4 h-100">
            <div className="card-header d-flex align-items-center">
              <i className="fas fa-tag me-2"></i>
              <span>Minimum Price</span>
              { !setupProgress.minimumPrice && <span className="badge-new ms-2" title="Set your minimum price to filter requests">New</span> }
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Minimum Price:</span>
                <span className="info-value">
                  {currentMinPrice !== null ? `$${currentMinPrice}` : <span className="text-muted">Not Set</span>}
                </span>
              </div>
              <button
                className={`btn-primary flex-fill${!setupProgress.minimumPrice ? ' pulse' : ''}`}
                onClick={() => setShowMinPriceModal(v => !v)}
              >
                {setupProgress.minimumPrice ? 'Edit' : 'Add'}
              </button>
              <small className="text-muted d-block mt-2">You will only see requests with budgets above this amount.</small>
            </div>
          </div>
        </div>
        {/* Partnership Link Section */}
        <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
          <div className="card mb-4 h-100">
            <div className="card-header d-flex align-items-center">
              <i className="fas fa-link me-2"></i>
              <span>Partnership Link</span>
              { !activeCoupon && <span className="badge-new ms-2" title="Create your partnership link">New</span> }
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Status:</span>
                <span className="info-value">
                  {activeCoupon ? 
                    <span className="text-success">Active</span> : 
                    <span className="text-muted">No Partnership Link</span>
                  }
                </span>
              </div>
              <button
                className="btn-primary flex-fill"
                onClick={() => setShowCouponModal(true)}
              >
                {activeCoupon ? 'View Partnership Link' : 'Create Partnership Link'}
              </button>
              <small className="text-muted d-block mt-2">
                {activeCoupon ? 
                  "Share your partnership link to connect with potential clients and grow your business." :
                  "Create a partnership link to start connecting with potential clients and grow your business."
                }
              </small>
            </div>
          </div>
        </div>
        {/* Categories Section */}
        <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
          <div className="card mb-4 h-100">
            <div className="card-header d-flex align-items-center">
              <i className="fas fa-tags me-2"></i>
              <span>Business Categories</span>
              {/* No setupProgress for categories, but you can add a badge if not set */}
              { (!currentCategories || currentCategories.length === 0) && <span className="badge-new ms-2" title="Add your business categories">New</span> }
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Categories:</span>
                <span className="info-value">
                  {currentCategories && currentCategories.length > 0
                    ? currentCategories.map(categoryId => {
                        const category = businessCategories.find(c => c.id === categoryId);
                        return category ? category.label : categoryId;
                      }).join(', ')
                    : <span className="text-muted">Not Set</span>}
                </span>
              </div>
              <button
                className={`btn-primary flex-fill${(!currentCategories || currentCategories.length === 0) ? ' pulse' : ''}`}
                onClick={() => setShowCategoryModal(v => !v)}
              >
                {currentCategories && currentCategories.length > 0 ? 'Edit' : 'Add'}
              </button>
              <small className="text-muted d-block mt-2">Select your business categories to help clients find you.</small>
            </div>
          </div>
        </div>
        {/* Calendar Section */}
        <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
          <div className="card mb-4 h-100">
            <div className="card-header d-flex align-items-center">
              <i className="fas fa-calendar me-2" style={{ color: "#9633eb" }}></i>
              <span>Google Calendar</span>
              {/* No setupProgress for calendar, but show badge if not connected */}
              { !isCalendarConnected && <span className="badge-new ms-2" title="Connect your Google Calendar">New</span> }
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Google Calendar:</span>
                <span className="info-value">
                  {isCalendarConnected ? <span className="text-success">Connected</span> : <span className="text-muted">Not Connected</span>}
                </span>
              </div>
              <button
                className={`btn-primary flex-fill${!isCalendarConnected ? ' pulse' : ''}`}
                onClick={() => setShowGoogleCalendarModal(v => !v)}
                disabled={isCalendarLoading}
              >
                {isCalendarConnected ? 'Edit' : 'Add'}
              </button>
              <small className="text-muted d-block mt-2">Sync your availability and prevent double bookings by connecting your calendar.</small>
            </div>
          </div>
        </div>
        {/* Default Expiration Section */}
        <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
          <div className="card mb-4 h-100">
            <div className="card-header d-flex align-items-center">
              <i className="fas fa-clock me-2"></i>
              <span>Default Bid Expiration</span>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Default Expiration:</span>
                <span className="info-value">
                  {defaultExpirationDays ? `${defaultExpirationDays} days` : <span className="text-muted">Not Set</span>}
                </span>
              </div>
              <button
                className="btn-primary flex-fill"
                onClick={() => setShowDefaultExpirationModal(v => !v)}
              >
                {defaultExpirationDays ? 'Edit' : 'Add'}
              </button>
              <small className="text-muted d-block mt-2">Set the default number of days until a bid expires when you create new bids.</small>
            </div>
          </div>
        </div>
        {/* AI Bid Trainer Section */}
        {user && autobidEnabled && (
          <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
            <div className="card mb-4 h-100">
              <div className="card-header d-flex align-items-center">
                <i className="fas fa-robot me-2" style={{ color: "#9633eb" }}></i>
                <span>AI Bid Trainer</span>
                <span className="badge-new ms-2" title="Train our AI to generate better bids for your business">New</span>
              </div>
              <div className="card-body">
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className="info-value">
                    {trainingLoading ? (
                      <span className="text-muted">Loading...</span>
                    ) : trainingCompleted ? (
                      <span className="text-success">
                        <i className="fas fa-check-circle me-1"></i>
                        Completed
                      </span>
                    ) : trainingInProgress ? (
                      <span className="text-warning">
                        <i className="fas fa-clock me-1"></i>
                        In Progress
                      </span>
                    ) : (
                      <span className="text-muted">Not Started</span>
                    )}
                  </span>
                </div>
                {trainingLoading ? (
                  <button className="btn-secondary flex-fill" disabled>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Loading...
                  </button>
                ) : trainingCompleted ? (
                  <div className="d-flex gap-2">
                    <button
                      className="btn-success flex-fill"
                      disabled
                    >
                      <i className="fas fa-check me-2"></i>
                      Training Complete
                    </button>
                    <button
                      className="btn-outline-primary"
                      onClick={() => navigate('/autobid-trainer')}
                      title="Retrain AI with new scenarios"
                    >
                      <i className="fas fa-redo"></i>
                    </button>
                  </div>
                ) : trainingInProgress ? (
                  <button
                    className="btn-warning flex-fill pulse"
                    onClick={() => navigate('/autobid-trainer')}
                  >
                    <i className="fas fa-play me-2"></i>
                    Resume Training
                  </button>
                ) : (
                  <button
                    className="btn-primary flex-fill pulse"
                    onClick={() => navigate('/autobid-trainer')}
                  >
                    <i className="fas fa-graduation-cap me-2"></i>
                    Start Training
                  </button>
                )}
                <small className="text-muted d-block mt-2">
                  {trainingCompleted 
                    ? "Your AI has been trained! Use the refresh button to retrain with new scenarios."
                    : trainingInProgress
                    ? "Continue where you left off to complete your AI training."
                    : "Help our AI learn your pricing strategy by providing sample bids for training scenarios."
                  }
                </small>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Move modals outside of mobile-only condition */}
      {/* Down Payment Modal */}
      <Modal show={showDownPaymentModal} onHide={() => setShowDownPaymentModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="text-center">Enter What You Charge For a Down Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ textAlign: "center", marginBottom: "20px", wordBreak: "break-word" }}>
            Do you charge a percentage or a flat fee up front?
          </div>
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "20px", marginBottom: "20px" }}>
            <button style={{ width: "50%", maxHeight: "48px" }} className={`btn-${paymentType === "percentage" ? "secondary" : "primary"}`} onClick={() => handlePaymentTypeChange("percentage")}>Percentage</button>
            <button style={{ width: "50%", maxHeight: "48px" }} className={`btn-${paymentType === "flat fee" ? "secondary" : "primary"}`} onClick={() => handlePaymentTypeChange("flat fee")}>Flat Fee</button>
          </div>
          {paymentType === "percentage" && (
            <div>
              <input type="number" value={percentage} onChange={handleChangeDownPaymentPercentage} placeholder="Enter Percentage" className="form-control" min="0" max="100" />
            </div>
          )}
          {paymentType === "flat fee" && (
            <div>
              <input type="number" value={downPaymentNumber} onChange={handleChangeDownPaymentNumber} placeholder="Enter Flat Fee" className="form-control" />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn-danger" onClick={() => setShowDownPaymentModal(false)}>Close</button>
          <button className="btn-success" onClick={handleDownPaymentSubmit}>Submit</button>
        </Modal.Footer>
      </Modal>

      {/* Minimum Price Modal */}
      <Modal show={showMinPriceModal} onHide={() => setShowMinPriceModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Set Minimum Price</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="minimumPrice" className="form-label">Enter your minimum price:</label>
            <input type="number" className="form-control" id="minimumPrice" value={minimumPrice} onChange={(e) => setMinimumPrice(e.target.value)} placeholder="Enter amount" min="0" />
          </div>
          <p className="text-muted">You will only see requests with budgets above this amount.</p>
        </Modal.Body>
        <Modal.Footer>
          <div style={{ display: "flex", flexDirection: "row", gap: "20px", justifyContent: "center", marginTop: 20 }}>   
            <button className="btn-danger" onClick={() => setShowMinPriceModal(false)}>Close</button>
            <button className="btn-success" onClick={handleMinPriceSubmit}>Save</button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Partnership Link Modal */}
      <Modal show={showCouponModal} onHide={() => setShowCouponModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Your Partnership Link</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            {partnershipData ? (
              <>
                <h4>Share this link with potential clients:</h4>
                <div className="p-3 mb-3 bg-light rounded">
                  https://savewithbidi.com/partnership/{partnershipData.id}
                </div>
                <p>When clients use your partnership link:</p>
                <ul className="text-start">
                  <li>They'll see your business name and logo</li>
                  <li>They can easily request your services</li>
                  <li>You'll be notified of new requests</li>
                </ul>
              </>
            ) : (
              <>
                <h4>Create Your Partnership Link</h4>
                <p className="mb-4">Generate a unique partnership link to start connecting with potential clients.</p>
                <button 
                  className="btn-primary"
                  onClick={handleGeneratePartnershipLink}
                >
                  Generate Partnership Link
                </button>
              </>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn-danger" onClick={() => setShowCouponModal(false)}>Close</button>
          {partnershipData && (
            <button 
              className={`btn-success ${isCopied ? 'copied' : ''}`}
              onClick={() => {
                navigator.clipboard.writeText(`https://savewithbidi.com/partnership/${partnershipData.id}`);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
              }}
            >
              {isCopied ? '✓ Copied!' : 'Copy Link'}
            </button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Bid Template Modal */}
      <Modal show={showBidTemplateModal} onHide={() => { setShowBidTemplateModal(false); setBidTemplateError(""); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Bid Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="bidTemplate" className="form-label">Your bid template:</label>
            {bidTemplateError && (
              <div className="alert alert-warning" role="alert">{bidTemplateError.split("\n").map((line, index) => (<div key={index}>{line}</div>))}</div>
            )}
            <ReactQuill theme="snow" value={bidTemplate} onChange={handleBidTemplateChange} modules={modules} formats={formats} style={{ height: "300px", marginBottom: "50px" }} />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn-danger" onClick={() => { setShowBidTemplateModal(false); setBidTemplateError(""); }}>Close</button>
          <button className="btn-success" onClick={handleBidTemplateSubmit}>Save</button>
        </Modal.Footer>
      </Modal>

      {/* Calendar Modal */}
      <Modal 
        show={showGoogleCalendarModal} 
        onHide={() => setShowGoogleCalendarModal(false)} 
        centered 
        dialogClassName="calendar-modal-mobile"
        style={{ margin: '10px' }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{isCalendarConnected ? "Manage Google Calendar" : "Connect Google Calendar"}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {calendarError && (
            <div className="alert alert-danger" role="alert">{calendarError}</div>
          )}
          {isCalendarLoading ? (
            <div className="text-center"><LoadingSpinner color="#9633eb" size={30} /></div>
          ) : isCalendarConnected ? (
            <div className="calendar-settings">
              <div className="consultation-hours-section">
                <h4 className="section-title" style={{marginBottom:"0px"}}>Consultation Hours</h4>
                <div className="status-badge connected">
                  <i className="fas fa-check-circle me-2"></i>
                  Google Calendar Connected
                </div>
                <p className="text-muted mb-3">Set your available hours for consultations.</p>
                
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={consultationHours.startTime}
                        onChange={(e) => setConsultationHours(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={consultationHours.endTime}
                        onChange={(e) => setConsultationHours(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group mt-3">
                  <label className="form-label">Available Days</label>
                  <div className="days-grid">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <label key={day} className="day-checkbox">
                        <input
                          type="checkbox"
                          checked={consultationHours.daysAvailable.includes(day)}
                          onChange={(e) => {
                            setConsultationHours(prev => ({
                              ...prev,
                              daysAvailable: e.target.checked
                                ? [...prev.daysAvailable, day]
                                : prev.daysAvailable.filter(d => d !== day)
                            }));
                          }}
                        />
                        <span className="day-label">{" "}{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group mt-3">
                  <label className="form-label">Timezone</label>
                  <select 
                    className="form-control"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Anchorage">Alaska Time (AKT)</option>
                    <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                  </select>
                  <small className="text-muted">Select your local timezone for consultation hours</small>
                </div>
              </div>

              <div className="calendar-actions">
                <button 
                  className="btn btn-danger me-2" 
                  onClick={async () => { 
                    try { 
                      await disconnectCalendar(); 
                      setShowGoogleCalendarModal(false); 
                    } catch (error) {} 
                  }}
                >
                  <i className="fas fa-unlink me-2"></i>
                  Disconnect Calendar
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={handleConsultationHoursSubmit}
                >
                  <i className="fas fa-save me-2"></i>
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="calendar-connect">
              <div className="connect-content text-center">
                <i className="fas fa-calendar-plus fa-3x mb-3" style={{ color: "#9633eb" }}></i>
                <h4>Connect Your Google Calendar</h4>
                <p className="text-muted mb-4">Sync your calendar to manage consultations and prevent double bookings.</p>
                
                <div className="benefits-list mb-4">
                  <div className="benefit-item">
                    <i className="fas fa-sync text-success"></i>
                    <span>Automatically sync your availability</span>
                  </div>
                  <div className="benefit-item">
                    <i className="fas fa-calendar-check text-success"></i>
                    <span>Prevent double bookings</span>
                  </div>
                  <div className="benefit-item">
                    <i className="fas fa-clock text-success"></i>
                    <span>Manage your consultation schedule</span>
                  </div>
                </div>

                <button 
                  className="btn btn-primary btn-lg"
                  style={{ backgroundColor: "#9633eb", borderColor: "#9633eb" }}
                  onClick={async () => { 
                    try { 
                      await connectCalendar(); 
                    } catch (error) {} 
                  }}
                >
                  <i className="fab fa-google me-2"></i>
                  Connect Google Calendar
                </button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Calendar Success Modal */}
      <Modal show={showCalendarSuccess} onHide={() => { setShowCalendarSuccess(false); sessionStorage.removeItem('calendarSuccessShown'); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Success!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Google Calendar connected successfully!
        </Modal.Body>
        <Modal.Footer>
          <button className="btn-success" onClick={() => { setShowCalendarSuccess(false); sessionStorage.removeItem('calendarSuccessShown'); }}>Close</button>
        </Modal.Footer>
      </Modal>

      {/* Categories Modal */}
      <Modal show={showCategoryModal} onHide={() => { setShowCategoryModal(false); setSelectedCategories(currentCategories); setCustomCategory(""); }} centered size="lg" dialogClassName="category-modal">
        <Modal.Header closeButton>
          <Modal.Title>Manage Business Categories</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <div className="mb-3">
            <label className="form-label">Select your business categories:</label>
            {currentCategories.length > 0 && (
              <div className="current-categories mb-3">
                <h6>Current Categories:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {currentCategories.map(categoryId => {
                    const category = businessCategories.find(c => c.id === categoryId);
                    return category ? (
                      <span key={categoryId} className="badge ">{category.label}</span>
                    ) : (
                      <span key={categoryId} className="badge ">{categoryId}</span>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="category-grid" style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
              gap: "10px",
              maxHeight: "40vh",
              overflowY: "auto"
            }}>
              {businessCategories.map((category) => (
                <div key={category.id} className="category-item" onClick={() => {
                  if (selectedCategories.includes(category.id)) {
                    setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                    if (category.id === 'other') { setCustomCategory(""); }
                  } else {
                    setSelectedCategories([...selectedCategories, category.id]);
                  }
                }} style={{ cursor: 'pointer' }}>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id={category.id} checked={selectedCategories.includes(category.id)} onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                        if (category.id === 'other') { setCustomCategory(""); }
                      }
                    }} />
                    <label className="form-check-label" htmlFor={category.id}>{category.label}</label>
                  </div>
                </div>
              ))}
            </div>
            {selectedCategories.includes('other') && (
              <div className="mt-3">
                <label htmlFor="customCategory" className="form-label">Please specify your business category:</label>
                <input type="text" className="form-control" id="customCategory" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Enter your business category" />
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #dee2e6" }}>
          <div style={{ display: "flex", flexDirection: "row", gap: "20px", justifyContent: "center", width: "100%" }}>
            <button className="btn-danger" onClick={() => { setShowCategoryModal(false); setSelectedCategories(currentCategories); setCustomCategory(""); }}>Cancel</button>
            <button className="btn-success" onClick={handleCategorySubmit} disabled={selectedCategories.length === 0 || (selectedCategories.includes('other') && !customCategory.trim())}>Save Changes</button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Default Expiration Modal */}
      <Modal show={showDefaultExpirationModal} onHide={() => setShowDefaultExpirationModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Set Default Bid Expiration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="defaultExpiration" className="form-label">Enter default number of days until bid expiration:</label>
            <input type="number" className="form-control" id="defaultExpiration" value={defaultExpirationDays} onChange={(e) => setDefaultExpirationDays(e.target.value)} placeholder="Enter number of days" min="1" />
          </div>
          <p className="text-muted">This will be the default number of days until a bid expires when you create new bids.</p>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn-danger" onClick={() => setShowDefaultExpirationModal(false)}>Close</button>
          <button className="btn-success" onClick={handleDefaultExpirationSubmit}>Save</button>
        </Modal.Footer>
      </Modal>

      {/* Google Business Profile Section */}
      {renderGoogleBusinessSection()}

      {/* Google Business Profile Modal */}
      <Modal show={showGoogleBusinessModal} onHide={() => setShowGoogleBusinessModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Google Business Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="google-business-modal-content">
            {googleBusinessProfile.isConnected ? (
              <>
                <div className="business-info">
                  <p><strong>Business Name:</strong> {googleBusinessProfile.businessName}</p>
                  <p><strong>Location:</strong> {googleBusinessProfile.location}</p>
                  <div className="reviews-summary">
                    <p><strong>Reviews Status:</strong> {googleReviewsStatus}</p>
                    {averageRating && (
                      <p><strong>Average Rating:</strong> {averageRating.toFixed(1)} ({totalReviews} reviews)</p>
                    )}
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    className="btn btn-secondary"
                    onClick={handleFetchReviews}
                    disabled={isProcessing}
                  >
                    <i className="fas fa-sync"></i> Refresh Reviews
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDisconnectGoogleBusiness}
                    disabled={isProcessing}
                  >
                    <i className="fas fa-unlink"></i> Disconnect
                  </button>
                </div>
              </>
            ) : (
              <div className="disconnected-content">
                <p>Connect your Google Business Profile to display reviews and build trust with potential clients.</p>
                <button
                  className="btn btn-primary"
                  onClick={handleConnectGoogleBusiness}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-link"></i> Connect Google Business Profile
                    </>
                  )}
                </button>
              </div>
            )}
            {googleBusinessProfile.error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i>
                {googleBusinessProfile.error}
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default BusinessSettings;
