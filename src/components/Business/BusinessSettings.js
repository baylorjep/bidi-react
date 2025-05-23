import React, { useState, useEffect } from "react";
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
  });
  const [profileDetails, setProfileDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
const { 
  isCalendarConnected, 
  calendarError, 
  isLoading: isCalendarLoading, 
  connectCalendar, 
  disconnectCalendar 
} = useGoogleCalendar();

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
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Step 1: Fetch the business profile using the user ID
        const { data: profile, error: profileError } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching business profile:", profileError);
          setIsLoading(false);
          return;
        }

        setIsAdmin(!!profile.is_admin);
        setDefaultExpirationDays(profile.default_expiration_days || "");
        
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
          .eq("business_id", profile.id) // Match the business_id from the profile
          .eq("valid", true) // Ensure the coupon is valid
          .single();

        if (couponError && couponError.code !== "PGRST116") {
          console.error("Error fetching affiliate coupon:", couponError);
        }

        // Step 3: Update the setup progress state
        setSetupProgress({
          paymentAccount: !!profile.stripe_account_id,
          downPayment: !!profile.down_payment_type,
          minimumPrice: !!profile.minimum_price,
          affiliateCoupon: !!existingCoupon, // True if a valid coupon exists
          verification: profile.verified_at,
          story: !!profile.story,
        });

        // Step 4: Update other states
        setIsVerified(!!profile.verified_at);
        setActiveCoupon(existingCoupon || null); // Set the active coupon if it exists
        setProfileDetails(profile);
        setCurrentMinPrice(profile.minimum_price || null); // Use profile.minimum_price directly
        setMinimumPrice(profile.minimum_price || ""); // Set the minimum price for the modal input

        if (profile.down_payment_type) {
          setPaymentType(profile.down_payment_type); // Set the payment type (percentage or flat fee)
          setDownPaymentNumber(
            profile.down_payment_type === "flat fee" ? profile.amount : ""
          ); // Set flat fee amount
          setPercentage(
            profile.down_payment_type === "percentage"
              ? profile.amount * 100
              : ""
          );
        }

        if (profile.bid_template) {
          setBidTemplate(profile.bid_template); // Set the bid template content
          setSetupProgress((prev) => ({ ...prev, bidTemplate: true }));
        }

        if (profile.contract_template) {
          setContractTemplate(profile.contract_template);
        }
      } catch (error) {
        console.error("Error fetching setup progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetupProgress();
  }, []);

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

  const handleGenerateCoupon = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check if an affiliate coupon already exists for the business
      const { data: existingCoupon, error: fetchError } = await supabase
        .from("coupons")
        .select("*")
        .eq("business_id", user.id) // Match the business_id with the logged-in user's ID
        .eq("valid", true) // Ensure the coupon is valid
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // Ignore "No rows found" error (PGRST116), handle other errors
        console.error("Error fetching existing coupon:", fetchError);
        alert(
          "An error occurred while fetching your coupon. Please try again."
        );
        return;
      }

      if (existingCoupon) {
        // If a coupon already exists, set it as the active coupon
        setActiveCoupon(existingCoupon);
        setNewCouponCode(existingCoupon.code); // Update the newCouponCode state
      } else {
        // Generate a new coupon if none exists
        const code = `COUPON${Math.floor(Math.random() * 10000)}`; // Example coupon code
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        const { data: newCoupon, error: insertError } = await supabase
          .from("coupons")
          .insert([
            {
              business_id: user.id,
              code,
              discount_amount: 10,
              expiration_date: expirationDate.toISOString(),
              valid: true,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("Error generating coupon:", insertError);
          alert("Error generating coupon. Please try again.");
          return;
        }

        setActiveCoupon(newCoupon); // Set the newly generated coupon as the active coupon
        setNewCouponCode(newCoupon.code); // Update the newCouponCode state
      }

      // Open the coupon modal
      setShowCouponModal(true);
    } catch (error) {
      console.error("Error handling coupon generation:", error);
      alert("An unexpected error occurred. Please try again.");
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

  // Add at the top of the component, after useState/useEffect:
  const steps = [
    { key: 'paymentAccount', label: 'Payment' },
    { key: 'downPayment', label: 'Down Payment' },
    { key: 'minimumPrice', label: 'Min Price' },
    { key: 'affiliateCoupon', label: 'Coupon' },
    { key: 'bidTemplate', label: 'Bid Template' },
    { key: 'verification', label: 'Verification' },
    { key: 'story', label: 'Profile' },
  ];

  const isBidiVerified = profileDetails && profileDetails.membership_tier === 'Verified';

  if (isLoading) {
    return <LoadingSpinner color="#9633eb" size={50} />;
  }

  return (
    <div className="business-settings-container">
      {/* Setup Progress Stepper */}
      {Object.values(setupProgress).some(v => !v) && (
        <div className="setup-stepper mb-4">
          {steps.map((step, idx) => {
            const complete = !!setupProgress[step.key];
            return (
              <div key={step.key} className={`stepper-step${complete ? ' complete' : ''}`}>
                <div className="stepper-circle">
                  {complete ? <i className="fas fa-check"></i> : idx + 1}
                </div>
                <div className="stepper-label">{step.label}</div>
                {idx < steps.length - 1 && <div className="stepper-line"></div>}
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
                onClick={() => navigate(`/portfolio/${profileDetails?.id}`)}
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
              {isDesktop && showDownPaymentModal && (
                <div className="card-modal-content">
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
                  <div style={{ display: "flex", flexDirection: "row", gap: "20px", justifyContent: "center", marginTop: 20 }}>
                    <button style={{ maxHeight: "32px" }} className="btn-danger" onClick={() => setShowDownPaymentModal(false)}>Close</button>
                    <button style={{ maxHeight: "32px" }} className="btn-success" onClick={handleDownPaymentSubmit}>Submit</button>
                  </div>
                </div>
              )}
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
              {isDesktop && showMinPriceModal && (
                <div className="card-modal-content">
                  <div className="mb-3">
                    <label htmlFor="minimumPrice" className="form-label">Enter your minimum price:</label>
                    <input type="number" className="form-control" id="minimumPrice" value={minimumPrice} onChange={(e) => setMinimumPrice(e.target.value)} placeholder="Enter amount" min="0" />
                  </div>
                  <p className="text-muted">You will only see requests with budgets above this amount.</p>
                  <div>
                    <button className="btn-danger me-2" onClick={() => setShowMinPriceModal(false)}>Close</button>
                    <button className="btn-success" onClick={handleMinPriceSubmit}>Save</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Affiliate Coupon Section */}
        <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
          <div className="card mb-4 h-100">
            <div className="card-header d-flex align-items-center">
              <i className="fas fa-ticket-alt me-2"></i>
              <span>Affiliate Coupon</span>
              { !setupProgress.affiliateCoupon && <span className="badge-new ms-2" title="Generate your affiliate coupon">New</span> }
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">Coupon Code:</span>
                <span className="info-value">
                  {activeCoupon && activeCoupon.code ? activeCoupon.code : <span className="text-muted">No Coupon</span>}
                </span>
              </div>
              <button
                className={`btn-primary flex-fill${!setupProgress.affiliateCoupon ? ' pulse' : ''}`}
                onClick={() => setShowCouponModal(v => !v)}
              >
                {setupProgress.affiliateCoupon ? 'Edit' : 'Add'}
              </button>
              <small className="text-muted d-block mt-2">Share your coupon to earn 5% of the bid amount when your lead pays through Bidi.</small>
              {isDesktop && showCouponModal && (
                <div className="card-modal-content">
                  <div className="text-center">
                    <h4>Your coupon code is:</h4>
                    <div className="p-3 mb-3 bg-light rounded">{newCouponCode || (activeCoupon && activeCoupon.code)}</div>
                    <p>This coupon gives customers $10 off their purchase</p>
                    <p>Valid until: {activeCoupon ? new Date(activeCoupon.expiration_date).toLocaleDateString() : ""}</p>
                    <p>Share this code with your network to earn 5% of the bid amount when your lead pays through Bidi</p>
                    <div className="mt-4 p-3 bg-light rounded">
                      <h5>Earnings Calculator</h5>
                      <div className="input-group mb-3">
                        <span className="input-group-text">$</span>
                        <input type="number" className="form-control" placeholder="Enter bid amount" value={calculatorAmount} onChange={(e) => setCalculatorAmount(e.target.value)} />
                      </div>
                      <p className="mt-2">You would earn: <strong>${calculateEarnings(calculatorAmount)}</strong></p>
                    </div>
                    <div className="mt-3">
                      <button className="btn-danger me-2" onClick={() => setShowCouponModal(false)}>Close</button>
                      <button className="btn-success" onClick={() => { navigator.clipboard.writeText(newCouponCode); }}>Copy</button>
                    </div>
                  </div>
                </div>
              )}
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
              {isDesktop && showCategoryModal && (
                <div className="card-modal-content">
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
                    <div className="category-grid">
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
                  <div style={{ display: "flex", flexDirection: "row", gap: "20px", justifyContent: "center", marginTop: 20 }}>
                    <button className="btn-danger me-2" onClick={() => { setShowCategoryModal(false); setSelectedCategories(currentCategories); setCustomCategory(""); }}>Cancel</button>
                    <button className="btn-success" onClick={handleCategorySubmit} disabled={selectedCategories.length === 0 || (selectedCategories.includes('other') && !customCategory.trim())}>Save Changes</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Calendar Section */}
        <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
          <div className="card mb-4 h-100">
            <div className="card-header d-flex align-items-center">
              <i className="fas fa-calendar me-2"></i>
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
              {isDesktop && showGoogleCalendarModal && (
                <div className="card-modal-content">
                  {calendarError && (<div className="alert alert-danger" role="alert">{calendarError}</div>)}
                  {isCalendarLoading ? (
                    <div className="text-center"><LoadingSpinner color="#9633eb" size={30} /></div>
                  ) : isCalendarConnected ? (
                    <div>
                      <p>Your Google Calendar is connected. You can now manage your availability for consultations.</p>
                      <button className="btn btn-danger" onClick={async () => { try { await disconnectCalendar(); setShowGoogleCalendarModal(false); } catch (error) {} }}>Disconnect Calendar</button>
                    </div>
                  ) : (
                    <div>
                      <p>Connect your Google Calendar to manage your availability for consultations.</p>
                      <p>This will allow you to:</p>
                      <ul>
                        <li>Automatically sync your availability</li>
                        <li>Prevent double bookings</li>
                        <li>Manage your consultation schedule</li>
                      </ul>
                      <button className="btn btn-primary" onClick={async () => { try { await connectCalendar(); } catch (error) {} }}>Connect Google Calendar</button>
                    </div>
                  )}
                </div>
              )}
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
              {isDesktop && showDefaultExpirationModal && (
                <div className="card-modal-content">
                  <div className="mb-3">
                    <label htmlFor="defaultExpiration" className="form-label">Enter default number of days until bid expiration:</label>
                    <input type="number" className="form-control" id="defaultExpiration" value={defaultExpirationDays} onChange={(e) => setDefaultExpirationDays(e.target.value)} placeholder="Enter number of days" min="1" />
                  </div>
                  <p className="text-muted">This will be the default number of days until a bid expires when you create new bids.</p>
                  <div style={{ display: "flex", flexDirection: "row", gap: "20px", justifyContent: "center", marginTop: 20 }}>
                    <button className="btn-danger me-2" onClick={() => setShowDefaultExpirationModal(false)}>Close</button>
                    <button className="btn-success" onClick={handleDefaultExpirationSubmit}>Save</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {!isDesktop && (
      <>
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
        {/* Coupon Modal */}
        <Modal show={showCouponModal} onHide={() => setShowCouponModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{activeCoupon ? "Your Affiliate Coupon" : "New Affiliate Coupon Generated"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="text-center">
              <h4>Your coupon code is:</h4>
              <div className="p-3 mb-3 bg-light rounded">{newCouponCode || (activeCoupon && activeCoupon.code)}</div>
              <p>This coupon gives customers $10 off their purchase</p>
              <p>Valid until: {activeCoupon ? new Date(activeCoupon.expiration_date).toLocaleDateString() : ""}</p>
              <p>Share this code with your network to earn 5% of the bid amount when your lead pays through Bidi</p>
              <div className="mt-4 p-3 bg-light rounded">
                <h5>Earnings Calculator</h5>
                <div className="input-group mb-3">
                  <span className="input-group-text">$</span>
                  <input type="number" className="form-control" placeholder="Enter bid amount" value={calculatorAmount} onChange={(e) => setCalculatorAmount(e.target.value)} />
                </div>
                <p className="mt-2">You would earn: <strong>${calculateEarnings(calculatorAmount)}</strong></p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button className="btn-danger" onClick={() => setShowCouponModal(false)}>Close</button>
            <button className="btn-success" onClick={() => { navigator.clipboard.writeText(newCouponCode); }}>Copy</button>
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
        {/* Categories Modal */}
        <Modal show={showCategoryModal} onHide={() => { setShowCategoryModal(false); setSelectedCategories(currentCategories); setCustomCategory(""); }} centered>
          <Modal.Header closeButton>
            <Modal.Title>Manage Business Categories</Modal.Title>
          </Modal.Header>
          <Modal.Body>
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
              <div className="category-grid">
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
          <Modal.Footer>
            <div style={{ display: "flex", flexDirection: "row", gap: "20px", justifyContent: "center", marginTop: 20 }}>
              <button className="btn-danger" onClick={() => { setShowCategoryModal(false); setSelectedCategories(currentCategories); setCustomCategory(""); }}>Cancel</button>
              <button className="btn-success" onClick={handleCategorySubmit} disabled={selectedCategories.length === 0 || (selectedCategories.includes('other') && !customCategory.trim())}>Save Changes</button>
            </div>
          </Modal.Footer>
        </Modal>
        {/* Calendar Modal */}
        <Modal show={showGoogleCalendarModal} onHide={() => setShowGoogleCalendarModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{isCalendarConnected ? "Manage Google Calendar" : "Connect Google Calendar"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {calendarError && (
              <div className="alert alert-danger" role="alert">{calendarError}</div>
            )}
            {isCalendarLoading ? (
              <div className="text-center"><LoadingSpinner color="#9633eb" size={30} /></div>
            ) : isCalendarConnected ? (
              <div>
                <p>Your Google Calendar is connected. You can now manage your availability for consultations.</p>
                <button className="btn btn-danger" onClick={async () => { try { await disconnectCalendar(); setShowGoogleCalendarModal(false); } catch (error) {} }}>Disconnect Calendar</button>
              </div>
            ) : (
              <div>
                <p>Connect your Google Calendar to manage your availability for consultations.</p>
                <p>This will allow you to:</p>
                <ul>
                  <li>Automatically sync your availability</li>
                  <li>Prevent double bookings</li>
                  <li>Manage your consultation schedule</li>
                </ul>
                <button className="btn btn-primary" onClick={async () => { try { await connectCalendar(); } catch (error) {} }}>Connect Google Calendar</button>
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
      </>
    )}
    </div>
  );
};

export default BusinessSettings;
