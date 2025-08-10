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
import BusinessSettingsSidebar from './BusinessSettingsSidebar';
import AdminDashboard from '../admin/AdminDashboard';
import ChangePlanModal from './ChangePlanModal';
import Select from 'react-select';
import StripeDashboardSummary from '../Stripe/StripeDashboardSummary';

const BusinessSettings = ({ connectedAccountId }) => {
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
  const [stripeErrorMessage, setStripeErrorMessage] = useState('');
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
const [autobidStatus, setAutobidStatus] = useState(null); // null, 'live', or 'paused'

  // Function to enable autobid
  const handleEnableAutobid = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('User not found. Please log in again.');
        return;
      }

      const { error } = await supabase
        .from('business_profiles')
        .update({ autobid_enabled: true })
        .eq('id', user.id);

      if (error) {
        console.error('Error enabling autobid:', error);
        alert('Failed to enable autobid. Please try again.');
        return;
      }

      setAutobidEnabled(true);
      alert('Autobid has been enabled for your account!');
    } catch (error) {
      console.error('Error enabling autobid:', error);
      alert('An error occurred while enabling autobid. Please try again.');
    }
  };

  // Function to toggle autobid status (live/paused)
  const handleToggleAutobidStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('User not found. Please log in again.');
        return;
      }

      // Only allow toggling if status is already 'live' or 'paused'
      if (autobidStatus === null) {
        alert('Please complete AI training first before activating autobid.');
        return;
      }

      const newStatus = autobidStatus === 'live' ? 'paused' : 'live';
      
      const { error } = await supabase
        .from('business_profiles')
        .update({ autobid_status: newStatus })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating autobid status:', error);
        alert('Failed to update autobid status. Please try again.');
        return;
      }

      setAutobidStatus(newStatus);
      alert(`Autobid has been ${newStatus === 'live' ? 'activated' : 'paused'}!`);
    } catch (error) {
      console.error('Error updating autobid status:', error);
      alert('An error occurred while updating autobid status. Please try again.');
    }
  };

  // Function to activate autobid when training is completed
  const activateAutobidAfterTraining = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not found when activating autobid');
        return;
      }

      const { error } = await supabase
        .from('business_profiles')
        .update({ autobid_status: 'live' })
        .eq('id', user.id);

      if (error) {
        console.error('Error activating autobid after training:', error);
        return;
      }

      setAutobidStatus('live');
      console.log('Autobid activated after training completion');
    } catch (error) {
      console.error('Error activating autobid after training:', error);
    }
  };

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

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching partnership data:", error);
        return;
      }
      setPartnershipData(data || null);
    } catch (error) {
      console.error("Error fetching partnership data:", error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchPartnershipData();
    }
  }, [user?.id]);

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

  // Move fetchSetupProgress to top level
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
      setAutobidEnabled(!!profile.autobid_enabled);
      setAutobidStatus(profile.autobid_status || null);
      if (profile.business_category) {
        const categories = Array.isArray(profile.business_category)
          ? profile.business_category
          : [profile.business_category];
        setSelectedCategories(categories);
        setCurrentCategories(categories);
      }
      const { data: existingCoupon, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("business_id", profile.id)
        .eq("valid", true)
        .single();
      if (couponError && couponError.code !== "PGRST116") {
        console.error("Error fetching affiliate coupon:", couponError);
      }
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
      if (profile.consultation_hours) {
        let consultationHoursData;
        if (profile.consultation_hours.consultation_hours) {
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

  // In useEffect, just call fetchSetupProgress
  useEffect(() => {
    fetchSetupProgress();
  }, [isCalendarConnected]);

  useEffect(() => {
    const fetchGoogleReviewsStatus = async () => {
      try {
        const { data: businessData, error } = await supabase
          .from('business_profiles')
          .select('google_place_id, google_business_name, google_business_address, google_business_account_id')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching Google reviews status:', error);
          return;
        }

        if (businessData && businessData.google_place_id) {
          setGoogleBusinessProfile({
            isConnected: true,
            businessName: businessData.google_business_name || businessData.name,
            location: businessData.google_business_address || businessData.address,
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

  const handleStripeError = (error, defaultMessage) => {
    console.error(error);
    setStripeError(true);
    setStripeErrorMessage(error.message || defaultMessage);
    
    // Clear error after 5 seconds
    setTimeout(() => {
      setStripeError(false);
      setStripeErrorMessage('');
    }, 5000);
  };

  // Removed fetchStripeAccountStatus - not needed for simple logic

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
        // Open Stripe dashboard in a new tab with popup blocker handling
        const newWindow = window.open(data.url, '_blank');
        
        // Check if popup was blocked
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Popup was blocked, show user-friendly message
          setStripeError(true);
          setStripeErrorMessage('Popup blocked! Please allow popups for this site and try again, or click the link below to open your Stripe dashboard.');
          
          // Add a fallback link that users can click
          setTimeout(() => {
            const fallbackLink = document.createElement('a');
            fallbackLink.href = data.url;
            fallbackLink.target = '_blank';
            fallbackLink.textContent = 'Open Stripe Dashboard';
            fallbackLink.className = 'btn btn-primary mt-2';
            fallbackLink.style.display = 'block';
            fallbackLink.style.marginTop = '10px';
            
            // Find the error message container and add the link
            const errorContainer = document.querySelector('.alert-danger');
            if (errorContainer) {
              errorContainer.appendChild(fallbackLink);
            }
          }, 100);
        } else {
          setStripeError(false);
          setStripeErrorMessage('');
          
          // Show a brief success message
          const successMessage = document.createElement('div');
          successMessage.className = 'alert alert-success mt-2';
          successMessage.style.fontSize = '0.9rem';
          successMessage.innerHTML = '✅ Stripe dashboard opened in new tab!';
          
          // Find the button container and add the success message
          const buttonContainer = document.querySelector('.settings-control');
          if (buttonContainer) {
            buttonContainer.appendChild(successMessage);
            
            // Remove the success message after 3 seconds
            setTimeout(() => {
              if (successMessage.parentNode) {
                successMessage.parentNode.removeChild(successMessage);
              }
            }, 3000);
          }
        }
      } else {
        // If the endpoint fails, try to create a login link directly
        console.log("Backend endpoint failed, trying alternative approach...");
        try {
          // This is a fallback - you might need to implement this on your backend
          const fallbackResponse = await fetch(
            "https://bidi-express.vercel.app/account_session",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ account: connectedAccountId }),
            }
          );
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            // Redirect to Stripe Connect onboarding to create login link
            window.location.href = `https://connect.stripe.com/express/oauth/authorize?client_id=${process.env.REACT_APP_STRIPE_CLIENT_ID}&state=${connectedAccountId}`;
          } else {
            handleStripeError(
              new Error("Failed to access Stripe dashboard. Please try again later."),
              "Could not access Stripe dashboard"
            );
          }
        } catch (fallbackError) {
          handleStripeError(
            new Error("Stripe dashboard temporarily unavailable. Please try again later."),
            "Could not access Stripe dashboard"
          );
        }
      }
    } catch (error) {
      handleStripeError(
        error,
        "An error occurred while connecting to Stripe"
      );
    }
  };

  const handleStripeOnboarding = async () => {
    navigate('/stripe-setup');
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
      return; // Don't show error, just return silently
    }

    if (
      paymentType === "percentage" &&
      (percentage === "" || percentage <= 0)
    ) {
      return; // Don't show error if value is empty, just return silently
    }

    if (
      paymentType === "flat fee" &&
      (downPaymentNumber === "" || downPaymentNumber <= 0)
    ) {
      return; // Don't show error if value is empty, just return silently
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
  const handleCategorySubmit = async (categoriesToSave) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("User not found. Please log in again.");
      return;
    }

    // If "other" is selected and there's a custom category, add it to the array
    let finalCategoriesToSave = [...categoriesToSave];
    if (categoriesToSave.includes('other') && customCategory.trim()) {
      finalCategoriesToSave = finalCategoriesToSave.filter(cat => cat !== 'other');
      finalCategoriesToSave.push(customCategory.trim());
    }

    const { error } = await supabase
      .from("business_profiles")
      .update({ business_category: finalCategoriesToSave })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating business categories:", error);
      alert("An error occurred while updating your business categories.");
    } else {
      setCurrentCategories(finalCategoriesToSave);
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

  const isBidiVerified = profileDetails && profileDetails.is_verified;

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
                    className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500 tw-focus:border-blue-500 tw-disabled:bg-gray-100 tw-disabled:text-gray-500 tw-disabled:cursor-not-allowed"
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

  const [activeSection, setActiveSection] = useState('profile');
  const [profileEdit, setProfileEdit] = useState({
    business_name: '',
    phone: '',
    categories: [],
  });
  const [profileChanged, setProfileChanged] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Add this for the Change Plan modal
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  // Payments save state
  const [paymentsChanged, setPaymentsChanged] = useState(false);
  const [paymentsSaving, setPaymentsSaving] = useState(false);
  const [paymentsSaved, setPaymentsSaved] = useState(false);

  useEffect(() => {
    if (profileDetails) {
      setProfileEdit({
        business_name: profileDetails.business_name || '',
        phone: profileDetails.phone || '',
        categories: selectedCategories || [],
      });
      setProfileChanged(false);
      setProfileSaved(false);
    }
  }, [profileDetails, selectedCategories]);

  const handleProfileEditChange = (field, value) => {
    setProfileEdit(prev => ({ ...prev, [field]: value }));
    setProfileChanged(true);
    setProfileSaved(false);
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileSaved(false);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert('User not found. Please log in again.');
      setProfileSaving(false);
      return;
    }
    const updates = {
      business_name: profileEdit.business_name,
      phone: profileEdit.phone,
      business_category: profileEdit.categories,
    };
    const { error } = await supabase
      .from('business_profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) {
      alert('Failed to save profile changes.');
    } else {
      setProfileChanged(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    }
    setProfileSaving(false);
  };

  const handlePaymentsSave = async () => {
    setPaymentsSaving(true);
    setPaymentsSaved(false);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert('User not found. Please log in again.');
      setPaymentsSaving(false);
      return;
    }

    const updates = {};
    
    // Add down payment if type is selected
    if (paymentType) {
      let downPaymentAmount = 0;
      if (paymentType === "percentage") {
        downPaymentAmount = parseFloat(percentage) / 100;
      } else if (paymentType === "flat fee") {
        downPaymentAmount = parseFloat(downPaymentNumber);
      }
      if (downPaymentAmount > 0) {
        updates.down_payment_type = paymentType;
        updates.amount = downPaymentAmount;
      }
    }

    // Add minimum price if set
    if (minimumPrice && minimumPrice > 0) {
      updates.minimum_price = parseFloat(minimumPrice);
    }

    // Add default expiration if set
    if (defaultExpirationDays && defaultExpirationDays > 0) {
      updates.default_expiration_days = parseInt(defaultExpirationDays);
    }

    const { error } = await supabase
      .from('business_profiles')
      .update(updates)
      .eq('id', user.id);
    
    if (error) {
      alert('Failed to save payment settings.');
    } else {
      setPaymentsChanged(false);
      setPaymentsSaved(true);
      setTimeout(() => setPaymentsSaved(false), 2000);
    }
    setPaymentsSaving(false);
  };

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Add Instagram banner component
  const InstagramBanner = () => {
    if (!showSupportBanner) return null;

    return (
      <div style={{
        backgroundColor: '#f3eafe',
        borderBottom: '1px solid #e9ecef',
        padding: isDesktop ? '12px 35px 12px 20px' : '10px 20px 10px 15px',
        position: 'relative',
        textAlign: 'center',
        fontFamily: 'Outfit',
        width: '100%',
        zIndex: 1000,
        boxSizing: 'border-box',
        marginBottom: isDesktop ? '20px' : '15px'
      }}>
        <button
          onClick={handleDismissBanner}
          style={{
            position: 'absolute',
            right: isDesktop ? '10px' : '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: isDesktop ? '18px' : '16px',
            color: '#666',
            padding: '5px',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Close banner"
        >
          ×
        </button>
        <p style={{ 
          margin: 0,
          fontSize: isDesktop ? '14px' : '13px',
          color: '#495057',
          lineHeight: '1.4',
          paddingRight: isDesktop ? '40px' : '35px'
        }}>
          📸 Join our Instagram group for vendors! 
          <a 
            href="https://ig.me/j/Abb0JL3q_V3kfBS9/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#9633eb',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              margin: '0 5px',
              font: 'inherit',
              fontWeight: '600'
            }}
          >
            Click here to join
          </a>
          and connect with other vendors in your area.
        </p>
      </div>
    );
  };

  // Add this after the other useEffect hooks
  // Removed unnecessary status tracking - simple connectedAccountId check is sufficient

  return (
    <div className="business-settings-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa', position: 'relative' }}>
      {/* Sidebar (desktop) */}
      {isDesktop && (
        <div style={{ minWidth: 220, borderRight: '1px solid #eee', background: '#fff', padding: '32px 0' }}>
          <BusinessSettingsSidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            isAdmin={isAdmin}
          />
        </div>
      )}
      {/* Sidebar (mobile modal/drawer) */}
      {!isDesktop && showMobileSidebar && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(30,20,60,0.13)',
            zIndex: 12000,
            display: 'flex',
          }}
          onClick={() => setShowMobileSidebar(false)}
        >
          <div
            style={{
              width: 260,
              maxWidth: '80vw',
              height: '100%',
              background: '#fff',
              boxShadow: '2px 0 16px rgba(80,60,120,0.13)',
              padding: '32px 0',
              position: 'relative',
              zIndex: 12001,
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888', fontWeight: 700, zIndex: 12002 }}
              onClick={() => setShowMobileSidebar(false)}
            >
              &times;
            </button>
            <BusinessSettingsSidebar
              activeSection={activeSection}
              setActiveSection={section => {
                setActiveSection(section);
                setShowMobileSidebar(false);
              }}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}
      {/* Content */}
      <div className="business-settings-content" style={{ flex: 1, padding: isDesktop ? '0px 40px' : '24px 0 0 0', width: '100vw', minHeight: '100vh' }}>
        {/* Instagram Banner */}
        <InstagramBanner />
        {/* Mobile: Show Menu button at top of content */}
        {!isDesktop && (
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0 20px 18px 20px' }}>
            <button
              className="mobile-menu-btn"
              style={{ background: '#fff', border: '1.5px solid #ececf0', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 18, boxShadow: '0 2px 8px rgba(80,60,120,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => setShowMobileSidebar(true)}
            >
              <i className="fas fa-bars" style={{ fontSize: 20 }}></i> Menu
            </button>
          </div>
        )}
        {isLoading ? (
          <LoadingSpinner color="#9633eb" size={50} />
        ) : (
          <>
            {activeSection === 'profile' && (
              <div className="settings-section">
                <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Profile</span>
                  <button
                    className="btn-primary-business-settings"
                    onClick={handleProfileSave}
                    disabled={!profileChanged || profileSaving}
                    style={{ minWidth: 120 }}
                  >
                    {profileSaving ? 'Saving...' : profileSaved ? 'Saved!' : 'Save'}
                  </button>
                </div>
                <div className="settings-section-content">
                  {/* Current Plan */}
                  <div className="settings-row">
                    <div>
                      <div className="settings-label">Current Plan</div>
                      <div className="settings-desc">Your current Bidi pricing plan.</div>
                    </div>
                    <div className="settings-control">
                      <span style={{ fontWeight: 600, fontSize: '1.08rem', marginRight: 16 }}>
                        {profileDetails?.membership_tier === 'pro' ? 'Pro' : profileDetails?.membership_tier === 'free' ? 'Basic' : (profileDetails?.membership_tier || 'Basic')}
                      </span>
                      <button
                        className="btn-primary-business-settings"
                        onClick={() => setShowChangePlanModal(true)}
                        style={{ minWidth: 120 }}
                      >
                        Change Plan
                      </button>
                    </div>
                  </div>
                  <div className="settings-row">
                    <div>
                      <div className="settings-label">Business Name</div>
                      <div className="settings-desc">Your public business name as shown to clients.</div>
                    </div>
                    <div className="settings-control">
                      <input
                        type="text"
                        value={profileEdit.business_name}
                        onChange={e => handleProfileEditChange('business_name', e.target.value)}
                        placeholder="Business Name"
                        className="tw-w-64 tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500 tw-focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="settings-row">
                    <div>
                      <div className="settings-label">Phone Number</div>
                      <div className="settings-desc">Your business contact phone number.</div>
                    </div>
                    <div className="settings-control">
                      <input
                        type="text"
                        value={profileEdit.phone}
                        onChange={e => handleProfileEditChange('phone', e.target.value)}
                        placeholder="Phone Number"
                        className="tw-w-44 tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500 tw-focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="settings-row">
                    <div>
                      <div className="settings-label">Email</div>
                      <div className="settings-desc">Your account email address.</div>
                    </div>
                    <div className="settings-control">{user?.email}</div>
                  </div>
                  <div className="settings-row">
                    <div>
                      <div className="settings-label">Categories</div>
                      <div className="settings-desc">Select your business categories to help clients find you.</div>
                    </div>
                    <div className="settings-control" >
                      <Select
                        isMulti
                        isSearchable
                        options={businessCategories.map(cat => ({ value: cat.id, label: cat.label }))}
                        value={businessCategories.filter(cat => profileEdit.categories.includes(cat.id)).map(cat => ({ value: cat.id, label: cat.label }))}
                        onChange={selected => {
                          const newCategories = selected ? selected.map(opt => opt.value) : [];
                          handleProfileEditChange('categories', newCategories);
                        }}
                        placeholder="Select categories..."
                        styles={{
                          control: (base) => ({ ...base, minHeight: 44, borderRadius: 8, borderColor: '#ececf0', boxShadow: 'none', fontSize: '1.05rem', background: '#f9f9fb' }),
                          menu: (base) => ({ ...base, zIndex: 9999, borderRadius: 8 }),
                          multiValue: (base) => ({ ...base, background: '#f3eafe', borderRadius: 6, fontWeight: 500 }),
                          multiValueLabel: (base) => ({ ...base, color: '#9633eb', fontWeight: 500 }),
                          option: (base, state) => ({ ...base, background: state.isSelected ? '#f3eafe' : state.isFocused ? '#f8f3ff' : '#fff', color: '#23232a', fontWeight: state.isSelected ? 600 : 500, borderRadius: 6 }),
                        }}
                        menuPortalTarget={document.body}
                      />
                    </div>
                  </div>
                  <div className="settings-row">
                    <div>
                      <div className="settings-label">Bidi Verified</div>
                      <div className="settings-desc">Get verified to build trust with potential clients.</div>
                    </div>
                    <div className="settings-control">
                      {isBidiVerified
                        ? <><i className="fas fa-check-circle text-success" aria-label="Verified"></i>Verified</>
                        : <><i className="fas fa-exclamation-circle text-muted" aria-label="Not Verified"></i>Not Verified</>}
                      {!isBidiVerified && (
                        <button
                          className="btn-primary flex-fill"
                          onClick={() => navigate("/verification-application")}
                        >
                          Apply to be Bidi Verified
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Calendar */}
                  <div className="settings-row">
                    <div>
                      <div className="settings-label">Google Calendar</div>
                      <div className="settings-desc">Sync your availability and prevent double bookings by connecting your calendar.</div>
                    </div>
                    <div className="settings-control" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                      {isCalendarConnected ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div className="settings-calendar-group">
                            <div className="settings-calendar-row">
                              <label>Start:</label>
                              <input
                                type="time"
                                value={consultationHours.startTime}
                                onChange={e => setConsultationHours(prev => ({ ...prev, startTime: e.target.value }))}
                                onBlur={handleConsultationHoursSubmit}
                                className="tw-px-2 tw-py-1 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500 tw-focus:border-blue-500"
                              />
                              <label>End:</label>
                              <input
                                type="time"
                                value={consultationHours.endTime}
                                onChange={e => setConsultationHours(prev => ({ ...prev, endTime: e.target.value }))}
                                onBlur={handleConsultationHoursSubmit}
                                className="tw-px-2 tw-py-1 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500 tw-focus:border-blue-500"
                              />
                            </div>
                            <div className="settings-calendar-row settings-calendar-days">
                              <label>Days:</label>
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                <label key={day} className="settings-category-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={consultationHours.daysAvailable.includes(day)}
                                    onChange={e => {
                                      let newDays;
                                      if (e.target.checked) {
                                        newDays = [...consultationHours.daysAvailable, day];
                                      } else {
                                        newDays = consultationHours.daysAvailable.filter(d => d !== day);
                                      }
                                      setConsultationHours(prev => ({ ...prev, daysAvailable: newDays }));
                                      setTimeout(handleConsultationHoursSubmit, 100);
                                    }}
                                    className="tw-w-4 tw-h-4 tw-text-blue-600 tw-bg-gray-100 tw-border-gray-300 tw-rounded tw-focus:ring-blue-500 tw-focus:ring-2"
                                  />
                                  {day.slice(0, 3)}
                                </label>
                              ))}
                            </div>
                            <div className="settings-calendar-row">
                              <label>Timezone:</label>
                              <select
                                value={timezone}
                                onChange={e => setTimezone(e.target.value)}
                                onBlur={handleConsultationHoursSubmit}
                                className="tw-px-2 tw-py-1 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500 tw-focus:border-blue-500 tw-bg-white"
                              >
                                <option value="America/Denver">Mountain Time (MT)</option>
                                <option value="America/New_York">Eastern Time (ET)</option>
                                <option value="America/Chicago">Central Time (CT)</option>
                                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                <option value="America/Anchorage">Alaska Time (AKT)</option>
                                <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: '0.9rem' }}>
                              <i className="fas fa-check-circle" aria-label="Connected"></i>
                              Calendar Connected
                            </span>
                            <button
                              className="btn-danger-business-settings"
                              onClick={disconnectCalendar}
                              style={{ minWidth: 120 }}
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            className="btn-primary"
                            onClick={connectCalendar}
                            style={{ marginTop: 8 }}
                          >
                            Connect Google Calendar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Templates */}
                  <div className="settings-row">
                    <div>
                      <div className="settings-label">Bid Template</div>
                      <div className="settings-desc">Create a reusable bid template to save time when responding to requests.</div>
                    </div>
                    <div className="settings-control" style={{ width: '100%' }}>
                      <ReactQuill
                        theme="snow"
                        value={bidTemplate}
                        onChange={content => {
                          setBidTemplate(content);
                        }}
                        onBlur={handleBidTemplateSubmit}
                        modules={modules}
                        formats={formats}
                        style={{ height: "120px", marginBottom: "10px", width: '100%' }}
                      />
                      {bidTemplateError && (
                        <div className="alert alert-warning" role="alert">{bidTemplateError.split("\n").map((line, index) => (<div key={index}>{line}</div>))}</div>
                      )}
                    </div>
                  </div>
                  {/* Partnership Link */}
                  <div className="settings-row">
                    <div>
                      <div className="settings-label">Partnership Link</div>
                      <div className="settings-desc">Share your partnership link to connect with potential clients and grow your business.</div>
                    </div>
                    <div className="settings-control" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                      {partnershipData ? (
                        <>
                          <input
                            type="text"
                            value={`https://savewithbidi.com/partnership/${partnershipData.id}`}
                            readOnly
                            className="tw-w-80 tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm tw-bg-gray-50 tw-text-gray-600 tw-mr-2"
                          />
                          <button
                            className={`btn-success ${isCopied ? 'copied' : ''}`}
                            onClick={() => {
                              navigator.clipboard.writeText(`https://savewithbidi.com/partnership/${partnershipData.id}`);
                              setIsCopied(true);
                              setTimeout(() => setIsCopied(false), 2000);
                            }}
                          >
                            {isCopied ? '✓ Copied!' : 'Copy Link'}
                          </button>
                        </>
                      ) : (
                        <button className="btn-primary-business-settings" onClick={handleGeneratePartnershipLink}>
                          Generate Partnership Link
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeSection === 'payments' && (
              <div className="settings-section">
                <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Payments</span>
                  <button
                    className="btn-primary-business-settings"
                    onClick={handlePaymentsSave}
                    disabled={!paymentsChanged || paymentsSaving}
                    style={{ minWidth: 120 }}
                  >
                    {paymentsSaving ? 'Saving...' : paymentsSaved ? 'Saved!' : 'Save'}
                  </button>
                </div>
                <div className="settings-section-content">
                  <div className="settings-row">
                    <div>
                      <div className="settings-label">Payment Account</div>
                      <div className="settings-desc">Connect your payment account to receive payouts from Bidi.</div>
                    </div>
                    <div className="settings-control" style={{ gap: 16 }}>
                      {connectedAccountId ? (
                        <>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="fas fa-check-circle text-success" aria-label="Connected"></i>
                            Connected
                          </span>
                          <button
                            className="btn-primary-business-settings"
                            onClick={handleOpenStripeDashboard}
                          >
                            View
                          </button>
                          <button
                            className="btn-danger-business-settings"
                            onClick={handleResetStripeAccount}
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn-primary-business-settings"
                          style={{ fontWeight: "bold", minWidth: 140 }}
                          onClick={handleStripeOnboarding}
                          disabled={accountCreatePending}
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Stripe Error Display */}
                  {stripeError && (
                    <div className="settings-row">
                      <div className="alert alert-warning" style={{ margin: 0 }}>
                        <i className="fas fa-exclamation-triangle"></i>
                        {stripeErrorMessage}
                      </div>
                    </div>
                  )}
                  
                  {/* Stripe Dashboard Summary */}
                  {connectedAccountId && (
                    <div className="settings-row">
                      <StripeDashboardSummary accountId={connectedAccountId} />
                    </div>
                  )}

                  <div className="settings-row">
                    <div>
                      <div className="settings-label">Down Payment</div>
                      <div className="settings-desc">Specify if you require a percentage or flat fee up front for bookings.</div>
                    </div>
                    <div className="settings-control">
                      <select
                        value={paymentType}
                        onChange={e => {
                          setPaymentType(e.target.value);
                          setPercentage("");
                          setDownPaymentNumber("");
                          setPaymentsChanged(true);
                          setPaymentsSaved(false);
                        }}
                        className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500 tw-focus:border-blue-500 tw-bg-white tw-mb-2"
                      >
                        <option value="">Select Type</option>
                        <option value="percentage">Percentage</option>
                        <option value="flat fee">Flat Fee</option>
                      </select>
                      {paymentType === "percentage" && (
                        <input
                          type="number"
                          value={percentage}
                          min={0}
                          max={100}
                          onChange={e => {
                            handleChangeDownPaymentPercentage(e);
                            setPaymentsChanged(true);
                            setPaymentsSaved(false);
                          }}
                          placeholder="Enter Percentage"
                          className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500 tw-focus:border-blue-500"
                        />
                      )}
                      {paymentType === "flat fee" && (
                        <input
                          type="number"
                          value={downPaymentNumber}
                          onChange={e => {
                            handleChangeDownPaymentNumber(e);
                            setPaymentsChanged(true);
                            setPaymentsSaved(false);
                          }}
                          placeholder="Enter Flat Fee"
                          className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500 tw-focus:border-blue-500"
                        />
                      )}
                    </div>
                  </div>
                  <div className="settings-row">
                    <div>
                      <div className="settings-label">Minimum Price</div>
                      <div className="settings-desc">You will only see requests with budgets above this amount.</div>
                    </div>
                    <div className="settings-control">
                      <input
                        type="number"
                        value={minimumPrice}
                        onChange={e => {
                          setMinimumPrice(e.target.value);
                          setPaymentsChanged(true);
                          setPaymentsSaved(false);
                        }}
                        placeholder="Enter minimum price"
                        className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500 tw-focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="settings-row">
                    <div>
                      <div className="settings-label">Default Bid Expiration</div>
                      <div className="settings-desc">Number of days before a bid expires by default.</div>
                    </div>
                    <div className="settings-control">
                      <input
                        type="number"
                        min={1}
                        value={defaultExpirationDays}
                        onChange={e => {
                          setDefaultExpirationDays(e.target.value);
                          setPaymentsChanged(true);
                          setPaymentsSaved(false);
                        }}
                        placeholder="Enter days"
                        className="tw-w-32 tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-shadow-sm tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500 tw-focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeSection === 'ai' && (
              <div className="settings-section">
                <div className="settings-section-title">AI Bid Trainer</div>
                <div className="settings-section-content">
                  {autobidEnabled ? (
                    <>
                      {/* Autobid Status Toggle */}
                      <div className="settings-row">
                        <div>
                          <div className="settings-label">Autobid Status</div>
                          <div className="settings-desc">Control whether your AI autobidder is actively responding to requests or paused.</div>
                        </div>
                        <div className="settings-control">
                          {autobidStatus === null ? (
                            <div className="d-flex align-items-center gap-3">
                              <span className="badge bg-secondary">
                                <i className="fas fa-clock me-1"></i>
                                Not Ready
                              </span>
                              <button
                                className="btn btn-secondary"
                                disabled
                              >
                                <i className="fas fa-lock me-2"></i>
                                Complete Training First
                              </button>
                            </div>
                          ) : (
                            <div className="d-flex align-items-center gap-3">
                              <span className={`badge ${autobidStatus === 'live' ? 'bg-success' : 'bg-warning'}`}>
                                <i className={`fas ${autobidStatus === 'live' ? 'fa-play' : 'fa-pause'} me-1`}></i>
                                {autobidStatus === 'live' ? 'Live' : 'Paused'}
                              </span>
                              <button
                                className={`btn ${autobidStatus === 'live' ? 'btn-warning' : 'btn-success'}`}
                                onClick={handleToggleAutobidStatus}
                              >
                                <i className={`fas ${autobidStatus === 'live' ? 'fa-pause' : 'fa-play'} me-2`}></i>
                                {autobidStatus === 'live' ? 'Pause' : 'Activate'}
                              </button>
                            </div>
                          )}
                          <small className="text-muted d-block mt-2">
                            {autobidStatus === null
                              ? "Complete AI training to activate your autobidder and start responding to requests automatically."
                              : autobidStatus === 'live' 
                              ? "Your AI autobidder is actively responding to requests and generating bids automatically."
                              : "Your AI autobidder is paused and will not respond to new requests until activated."
                            }
                          </small>
                        </div>
                      </div>

                      {/* AI Training Section */}
                      <div className="settings-row">
                        <div>
                          <div className="settings-label">AI Bid Trainer</div>
                          <div className="settings-desc">Help our AI learn your pricing strategy by providing sample bids for training scenarios.</div>
                        </div>
                        <div className="settings-control">
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
                    </>
                  ) : (
                    <div className="settings-row">
                      <div>
                        <div className="settings-label">AI Bid Trainer</div>
                        <div className="settings-desc">AI Bid Trainer is not enabled for your account. Enable it to start training your AI with sample bids.</div>
                      </div>
                      <div className="settings-control">
                        <button
                          className="btn-primary flex-fill"
                          onClick={handleEnableAutobid}
                        >
                          <i className="fas fa-toggle-on me-2"></i>
                          Enable Autobid
                        </button>
                        <small className="text-muted d-block mt-2">
                          Enable autobid to access the AI training features and help our AI learn your pricing strategy.
                        </small>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeSection === 'admin' && isAdmin && (
              <div className="settings-section">
                <div className="settings-section-title">Admin</div>
                <div className="settings-section-content">
                  <AdminDashboard />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <ChangePlanModal
        isOpen={showChangePlanModal}
        onClose={() => setShowChangePlanModal(false)}
        currentPlan={profileDetails?.membership_tier}
        onPlanChange={fetchSetupProgress}
      />
      {stripeError && (
        <div className="alert alert-danger mt-3">
          {stripeErrorMessage || "An error occurred."} {" "}
          <button className="btn-link" onClick={handleResetStripeAccount}>
            Reset Stripe Connection
          </button>
        </div>
      )}
    </div>
  );
};

export default BusinessSettings;
