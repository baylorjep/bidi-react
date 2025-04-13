import React, { useState, useEffect } from "react";
import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import { supabase } from "../../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import '../../App.css'; // Include this for custom styles
import { Modal, Button } from 'react-bootstrap'; // Make sure to install react-bootstrap
import Verification from '../../assets/Frame 1162.svg'
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Add these modules for the editor
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link', 'image'
];

const BusinessDashboard = () => {
  const [connectedAccountId, setConnectedAccountId] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [showModal, setShowModal] = useState(false); // For showing modal
  const [bids, setBids] = useState([]); // State to store the bids
  const navigate = useNavigate();
  const [percentage, setPercentage] = useState("");
  const [number, setNumber] = useState("");
  const [paymentType, setPaymentType] = useState(""); // "percentage" or "flat fee"
  const [downPaymentAmount, setDownPaymentAmount] = useState(0);
  const [requestData, setRequestData] = useState(null);
  const [photographyRequestData, setPhotographyRequestData] = useState(null);
  const [showMinPriceModal, setShowMinPriceModal] = useState(false);
  const [minimumPrice, setMinimumPrice] = useState("");
  const [currentMinPrice, setCurrentMinPrice] = useState(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [affiliateCoupons, setAffiliateCoupons] = useState([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [calculatorAmount, setCalculatorAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unviewedBidCount, setUnviewedBidCount] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [stripeError, setStripeError] = useState(false);
  const [portfolioPhotos, setPortfolioPhotos] = useState([]);
  const [setupProgress, setSetupProgress] = useState({
    paymentAccount: false,
    downPayment: false,
    minimumPrice: false,
    affiliateCoupon: false,
    verification: false,
    story: false,
    bidTemplate: false
  });
  const [profileDetails, setProfileDetails] = useState(null);
  const [bidTemplate, setBidTemplate] = useState('');
  const [showBidTemplateModal, setShowBidTemplateModal] = useState(false);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("No user found. Please log in again.");
          return;
        }

        // Get both profile and verification application status
        const { data: profile, error: profileError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Check for verification application
        const { data: verificationApp, error: verificationError } = await supabase
          .from('verification_applications')
          .select('id')
          .eq('business_id', user.id)
          .maybeSingle();

        if (verificationError) throw verificationError;

        // Check for profile photos
        const { data: photos, error: photosError } = await supabase
          .from('profile_photos')
          .select('*')
          .eq('user_id', user.id);

        if (photosError) throw photosError;

        // Update setupProgress state with accurate photo count
        setPortfolioPhotos(photos || []);
        setSetupProgress(prev => ({
          ...prev,
          portfolio: photos && photos.length > 0
        }));

        // Set pending status only if membership tier is empty/null AND there's a verification application
        const isPending = (!profile.membership_tier || profile.membership_tier === '') && verificationApp !== null;
        
        setIsVerified(profile.membership_tier === "Plus" || profile.membership_tier === "Verified");
        setIsVerificationPending(isPending);
        setSetupProgress(prev => ({
          ...prev, 
          portfolio: photos && photos.length > 0
        }));

        setIsLoading(true);
        setError(null);

        // Fetch business profile details
        const { data: profileDetails, error: profileDetailsError } = await supabase
          .from('business_profiles')
          .select('business_name, stripe_account_id, id, down_payment_type, amount, minimum_price, business_category, membership_tier, verification_pending, story, bid_template')
          .eq('id', user.id)
          .single();

        if (profileDetailsError) {
          console.error('Error fetching profile:', profileDetailsError);
          setError("Error loading business profile");
          setIsLoading(false);
          return;
        }

        if (!profileDetails) {
          setError("Business profile not found");
          setIsLoading(false);
          return;
        }

        // Store profile details in state
        setProfileDetails(profileDetails);

        if (profileDetails) {
          setBusinessName(profileDetails.business_name);
          setIsAdmin(profileDetails.business_category === "admin");
          if (profileDetails.stripe_account_id) {
            setConnectedAccountId(profileDetails.stripe_account_id);
            setSetupProgress(prev => ({...prev, paymentAccount: true}));
          }
          
          if (profileDetails.down_payment_type !== null && profileDetails.amount !== null) {
            setSetupProgress(prev => ({...prev, downPayment: true}));
          }

          if (profileDetails.minimum_price !== null) {
            setSetupProgress(prev => ({...prev, minimumPrice: true}));
          }

          // Add verification check
          if (profileDetails.membership_tier === "Verified") {
            setSetupProgress(prev => ({...prev, verification: true}));
          }

          // Add story check
          if (profileDetails.story && profileDetails.story.trim() !== '') {
            setSetupProgress(prev => ({...prev, story: true}));
          }

          // Check portfolio photos
          const { data: photos } = await supabase
            .from('portfolio_photos')
            .select('id')
            .eq('business_id', user.id);
          
          setPortfolioPhotos(photos || []);
          setSetupProgress(prev => ({...prev, portfolio: photos && photos.length > 0}));

          // Check affiliate coupon
          const { data: coupons } = await supabase
            .from('coupons')
            .select('*')
            .eq('business_id', user.id)
            .eq('valid', true)
            .single();

          if (coupons) {
            setSetupProgress(prev => ({...prev, affiliateCoupon: true}));
          }

          // Fetch current bids for this business
          const { data: bidsData, error: bidsError } = await supabase
            .from('bids')
            .select(`
              *,
              viewed,
              viewed_at
            `)
            .eq('user_id', profileDetails.id)
            .or('hidden.is.false,hidden.is.null');
  
          if (bidsError) {
            console.error('Error fetching bids:', bidsError);
            return;
          }
  
          // Process each bid and fetch its associated request details
          const bidsWithRequestData = await Promise.all(
            bidsData.map(async (bid) => {
              console.log('Processing bid:', bid); // Debug log
              console.log('Request ID:', bid.request_id); // Debug log

              try {
                // Try DJ requests
                const { data: djRequest, error: djError } = await supabase
                  .from('dj_requests')
                  .select('*')
                  .eq('id', bid.request_id)
                  .single();
                
                console.log('DJ request search result:', { data: djRequest, error: djError }); // Debug log
                
                if (djRequest) {
                  return {
                    ...bid,
                    service_title: djRequest.title || 'No Title',
                    request_type: 'DJ Request',
                    request_data: djRequest,
                    isDescriptionExpanded: false,
                  };
                }

                // Try Catering requests
                const { data: cateringRequest, error: cateringError } = await supabase
                  .from('catering_requests')
                  .select('*')
                  .eq('id', bid.request_id)
                  .single();
                
                if (cateringRequest) {
                  return {
                    ...bid,
                    service_title: cateringRequest.title || 'No Title',
                    request_type: 'Catering Request',
                    request_data: cateringRequest,
                    isDescriptionExpanded: false,
                  };
                }

                // Try Beauty requests
                const { data: beautyRequest, error: beautyError } = await supabase
                  .from('beauty_requests')
                  .select('*')
                  .eq('id', bid.request_id)
                  .single();
                
                if (beautyRequest) {
                  return {
                    ...bid,
                    service_title: beautyRequest.event_title || 'No Title',
                    request_type: 'Hair and Makeup Request',
                    request_data: beautyRequest,
                    isDescriptionExpanded: false,
                  };
                }

                // Try Florist requests
                const { data: floristRequest, error: floristError } = await supabase
                  .from('florist_requests')
                  .select('*')
                  .eq('id', bid.request_id)
                  .single();
                
                if (floristRequest) {
                  return {
                    ...bid,
                    service_title: floristRequest.event_title || 'No Title',
                    request_type: 'Florist Request',
                    request_data: floristRequest,
                    isDescriptionExpanded: false,
                  };
                }

                // Try Photography requests
                const { data: photoRequest, error: photoError } = await supabase
                  .from('photography_requests')
                  .select('*')
                  .eq('id', bid.request_id)
                  .single();
                
                if (photoRequest) {
                  return {
                    ...bid,
                    service_title: photoRequest.event_title || 'No Title',
                    request_type: 'Photography Request',
                    request_data: photoRequest,
                    isDescriptionExpanded: false,
                  };
                }

                // Try Videography requests
                const { data: videoRequest, error: videoError } = await supabase
                  .from('videography_requests')
                  .select('*')
                  .eq('id', bid.request_id)
                  .single();
                
                if (videoRequest) {
                  return {
                    ...bid,
                    service_title: videoRequest.event_title || 'No Title',
                    request_type: 'Videography Request',
                    request_data: videoRequest,
                    isDescriptionExpanded: false,
                  };
                }

                // Try legacy/normal requests
                const { data: normalRequest, error: normalError } = await supabase
                  .from('requests')
                  .select('*')
                  .eq('id', bid.request_id)
                  .single();
                
                if (normalRequest) {
                  return {
                    ...bid,
                    service_title: normalRequest.service_title || 'No Title',
                    request_type: 'Normal Request',
                    request_data: normalRequest,
                    isDescriptionExpanded: false,
                  };
                }

                // If no request found in any table
                console.log('No matching request found for bid:', bid.id);
                console.log('Searched tables: dj_requests, catering_requests, beauty_requests, florist_requests, photography_requests, videography_requests, requests');
                return {
                  ...bid,
                  service_title: 'Unknown Request',
                  request_type: 'Unknown',
                  request_data: {},
                  isDescriptionExpanded: false,
                };

              } catch (error) {
                console.error('Error processing bid:', error);
                return {
                  ...bid,
                  service_title: 'Error Processing Request',
                  request_type: 'Unknown',
                  request_data: {},
                  isDescriptionExpanded: false,
                };
              }
            })
          );
  
          // Update state with the bids that now have associated request data
          setBids(bidsWithRequestData);
          setCurrentMinPrice(profileDetails.minimum_price);

          if (profileDetails.bid_template) {
            setBidTemplate(profileDetails.bid_template);
            setSetupProgress(prev => ({...prev, bidTemplate: true}));
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error in fetchBusinessDetails:", err);
        setError("An unexpected error occurred");
        setIsLoading(false);
      }
    };
  
    fetchBusinessDetails();
    fetchAffiliateCoupons();
  }, []);

  useEffect(() => {
    // Separate this into its own effect to ensure it runs independently
    if (isAdmin) {
      console.log("User is admin, fetching unviewed bid count");
      fetchUnviewedBidCount();
    }
  }, [isAdmin]); // Add isAdmin as a dependency so it runs when isAdmin changes
  
  const fetchAffiliateCoupons = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Get all coupons for this business
      const { data: coupons, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('business_id', user.id)
        .eq('valid', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching coupons:', error);
      } else if (coupons && coupons.length > 0) {
        // Find the most recent non-expired coupon
        const now = new Date();
        const validCoupon = coupons.find(coupon => 
          new Date(coupon.expiration_date) > now
        );

        if (validCoupon) {
          setActiveCoupon(validCoupon);
          setNewCouponCode(validCoupon.code);
        } else {
          setActiveCoupon(null);
          setNewCouponCode('');
        }
      }
    }
  };

  // Updated function to fetch unviewed bid count with more detailed debugging
  const fetchUnviewedBidCount = async () => {
    try {
      console.log("Fetching unviewed bid count...");
      
      // Check if the 'contacted' column exists first
      const { data: columnsData, error: columnsError } = await supabase
        .from('bids')
        .select('contacted')
        .limit(1);
        
      console.log("Column check result:", { columnsData, columnsError });
      
      // Change the query based on whether the contacted field exists
      const hasContactedField = columnsData && columnsData.length > 0 && 'contacted' in columnsData[0];
      console.log("Has 'contacted' field:", hasContactedField);
      
      let query = supabase.from('bids').select('*', { count: 'exact', head: true });
      
      if (hasContactedField) {
        // If the contacted field exists, filter for uncontacted bids
        query = query.eq('contacted', false);
      } else {
        // If the contacted field doesn't exist, just filter for unviewed bids
        query = query.eq('viewed', false);
      }
      
      const { count, error } = await query;
      
      if (error) {
        console.error("Error fetching unviewed bid count:", error);
        return;
      }
      
      console.log("Unviewed bid count:", count);
      setUnviewedBidCount(count || 0);
    } catch (err) {
      console.error("Exception in fetchUnviewedBidCount:", err);
    }
  };

  const generateCouponCode = () => {
    // Remove spaces and take first 6 characters of business name (or pad with X if shorter)
    let prefix = businessName.replace(/\s+/g, '').substring(0, 6).toUpperCase();
    prefix = prefix.padEnd(6, 'X');
    
    // Add the year (25)
    return `${prefix}25`;
  };

  const handleGenerateCoupon = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First check for existing valid coupons
    const { data: existingCoupons, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('business_id', user.id)
      .eq('valid', true);

    if (fetchError) {
      console.error('Error checking existing coupons:', fetchError);
      return;
    }

    // Find if there's a non-expired coupon
    const now = new Date();
    const validCoupon = existingCoupons?.find(coupon => 
      new Date(coupon.expiration_date) > now
    );

    if (validCoupon) {
      setActiveCoupon(validCoupon);
      setNewCouponCode(validCoupon.code);
      setShowCouponModal(true);
      return;
    }

    // If no valid coupon exists, generate a new one
    const code = generateCouponCode();
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    // Invalidate any existing coupons first
    if (existingCoupons?.length > 0) {
      await supabase
        .from('coupons')
        .update({ valid: false })
        .eq('business_id', user.id);
    }

    // Create new coupon
    const { data: newCoupon, error: insertError } = await supabase
      .from('coupons')
      .insert([{
        business_id: user.id,
        code: code,
        discount_amount: 10,
        expiration_date: expirationDate.toISOString(),
        valid: true
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error generating coupon:', insertError);
      alert('Error generating coupon. Please try again.');
    } else {
      setNewCouponCode(code);
      setActiveCoupon(newCoupon);
      setShowCouponModal(true);
    }
  };
  
  // Shorten description to a certain length
  const truncateDescription = (description, length) => {
    if (!description) return ''; // Return empty string if description is null/undefined
    if (description.length <= length) return description;
    return description.slice(0, length) + "...";
  };

  // Check if there's more content to view
  const hasMoreContent = (description, length) => {
    if (!description) return false; // Return false if description is null/undefined
    return description.length > length;
  };

  const handleViewMore = (index) => {
    setBids((prevBids) => {
      const updatedBids = [...prevBids];
      updatedBids[index] = {
        ...updatedBids[index],
        isDescriptionExpanded: !updatedBids[index].isDescriptionExpanded
      };
      return updatedBids;
    });
  };

  
  const handleRemoveBid = async (bidId) => {
    try {
      const { data, error } = await supabase
        .from('bids')
        .update({ hidden: true })
        .eq('id', bidId);
  
      if (error) {
        console.error('Error updating bid:', error);
      } else {
        // Update the local state to reflect the change immediately
        setBids((prevBids) => prevBids.filter((bid) => bid.id !== bidId));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };
  
  

  const handleViewRequests = () => {
    if (!connectedAccountId) {
      navigate("/open-requests");
    } else {
      navigate("/open-requests"); // Navigate to requests if Stripe is set up
    }
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type); // Set the selected type (percentage or flat fee)
    setPercentage(""); // Reset percentage input when toggling
    setNumber(""); // Reset number input when toggling
  };

  const handleChangePercentage = (e) => {
    let value = e.target.value;
    // Allow only numbers between 0 and 100
    if (value <= 100 && value >= 0) {
      setPercentage(value);
    }
  };

  const handleChangeNumber = (e) => {
    setNumber(e.target.value);
  };

  const handleDownPaymentSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("User not found. Please log in again.");
      return;
    }

    if (!paymentType) {
      alert("Please select a down payment type (Percentage or Flat Fee).");
      return;
    }

    if (paymentType === "percentage" && (percentage === "" || percentage <= 0)) {
      alert("Please enter a valid percentage amount.");
      return;
    }

    if (paymentType === "flat fee" && (number === "" || number <= 0)) {
      alert("Please enter a valid flat fee amount.");
      return;
    }

    let downPaymentAmount = 0;
    if (paymentType === "percentage") {
      downPaymentAmount = parseFloat(percentage) / 100; // Convert percentage to decimal
    } else if (paymentType === "flat fee") {
      downPaymentAmount = parseFloat(number); // Flat fee stays as it is
    }

    if (!downPaymentAmount) {
      alert("Please enter a valid down payment amount.");
      return;
    }

    const { data: existingProfile, error: fetchError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching business profile:", fetchError);
      alert("An error occurred while fetching your profile.");
      return;
    }

    if (existingProfile) {
      const { data, error } = await supabase
        .from('business_profiles')
        .update({
          down_payment_type: paymentType,
          amount: downPaymentAmount, // Store down payment as decimal (percentage/100)
        })
        .eq('id', user.id);

      if (error) {
        console.error("Error updating down payment:", error);
        alert("An error occurred while updating your down payment details.");
      } else {
        setShowModal(false); // Close modal on successful update
      }
    } else {
      alert("Business profile not found. Please make sure your account is set up correctly.");
    }
  };

  const handleMinPriceSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("User not found. Please log in again.");
      return;
    }

    if (minimumPrice === "" || isNaN(minimumPrice) || Number(minimumPrice) < 0) {
      alert("Please enter a valid minimum price.");
      return;
    }

    const { data, error } = await supabase
      .from('business_profiles')
      .update({
        minimum_price: Number(minimumPrice)
      })
      .eq('id', user.id);

    if (error) {
      console.error("Error updating minimum price:", error);
      alert("An error occurred while updating your minimum price.");
    } else {
      setCurrentMinPrice(Number(minimumPrice));
      setShowMinPriceModal(false);
      setMinimumPrice("");
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

  const handleAdminDashboard = () => {
    navigate("/admin-dashboard");
  };

  const handleResetStripeAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('business_profiles')
      .update({ stripe_account_id: null })
      .eq('id', user.id);

    if (error) {
      console.error('Error resetting Stripe account:', error);
      alert('Error resetting Stripe account. Please try again.');
    } else {
      setConnectedAccountId(null);
      alert('Stripe account has been reset. You can now try connecting again.');
    }
  };

  const handleViewPortfolio = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
  
    const { data: profileDetails, error } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('id', user.id)
      .single();
  
    if (error) {
      console.error('Error fetching profile details:', error);
      return;
    }
  
    navigate(`/portfolio/${profileDetails.id}`);
  };
  

  const handleBidTemplateSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("User not found. Please log in again.");
      return;
    }

    const { data, error } = await supabase
      .from('business_profiles')
      .update({
        bid_template: bidTemplate
      })
      .eq('id', user.id);

    if (error) {
      console.error("Error updating bid template:", error);
      alert("An error occurred while updating your bid template.");
    } else {
      setShowBidTemplateModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="business-dashboard text-center">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="business-dashboard text-center">
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          className="btn-primary" 
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="business-dashboard text-center">
      <h1 className="dashboard-title">Welcome, {businessName}!</h1>

      {/* Only show setup progress if not everything is completed */}
      {(!setupProgress.paymentAccount || 
        !setupProgress.downPayment || 
        !setupProgress.minimumPrice || 
        !setupProgress.affiliateCoupon ||
        !setupProgress.verification ||
        !setupProgress.story ||
        !setupProgress.bidTemplate) && (
        <div className="setup-progress-container container mt-4 mb-4">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title mb-4">Account Setup Progress</h3>
              <div className="setup-items">
                {!setupProgress.paymentAccount && (
                  <div className="setup-item">
                    <i className="fas fa-times-circle text-danger"></i>
                    <span>Payment Account Setup</span>
                    <button className="btn-link" onClick={() => navigate("/onboarding")}>Set up now</button>
                  </div>
                )}
                {!setupProgress.downPayment && (
                  <div className="setup-item">
                    <i className="fas fa-times-circle text-danger"></i>
                    <span>Down Payment Setup</span>
                    <button className="btn-link" onClick={() => setShowModal(true)}>Set up now</button>
                  </div>
                )}
                {!setupProgress.minimumPrice && (
                  <div className="setup-item">
                    <i className="fas fa-times-circle text-danger"></i>
                    <span>Minimum Price Set</span>
                    <button className="btn-link" onClick={() => setShowMinPriceModal(true)}>Set now</button>
                  </div>
                )}
                {!setupProgress.affiliateCoupon && (
                  <div className="setup-item">
                    <i className="fas fa-times-circle text-danger"></i>
                    <span>Affiliate Coupon Generated</span>
                    <button className="btn-link" onClick={handleGenerateCoupon}>Generate now</button>
                  </div>
                )}
                {!setupProgress.verification && (
                  <div className="setup-item">
                    <i className="fas fa-times-circle text-danger"></i>
                    <span>Bidi Verification</span>
                    <button className="btn-link" onClick={() => navigate("/verification-application")}>Apply now</button>
                  </div>
                )}
                {!setupProgress.story && profileDetails && (
                  <div className="setup-item">
                    <i className="fas fa-times-circle text-danger"></i>
                    <span>Complete Your Profile</span>
                    <button 
                      className="btn-link" 
                      onClick={() => navigate(`/portfolio/${profileDetails.id}`)}
                    >
                      Complete now
                    </button>
                  </div>
                )}
                {!setupProgress.bidTemplate && (
                  <div className="setup-item">
                    <i className="fas fa-times-circle text-danger"></i>
                    <span>Bid Template</span>
                    <button className="btn-link" onClick={() => setShowBidTemplateModal(true)}>Set up now</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/*}
      <div className="edit-profile-container">
          <Link to="/profile" className="edit-profile">
              Edit Profile
          </Link>
      </div>
      */}
      <div className="container mt-4">
        <div className="row justify-content-center">  
          {/* Admin Dashboard Button - Only visible for admin users */}
          {isAdmin && (
            <div className="col-lg-10 col-md-12 col-sm-12 d-flex flex-column" style={{marginTop:'20px'}} >
              <div className="position-relative"> {/* Wrap the button in a div with position-relative */}
                <button
                  className="btn-secondary flex-fill"
                  style={{fontWeight:'bold', backgroundColor: '#d9534f', width: '100%'}}
                  onClick={handleAdminDashboard}
                >
                  Admin Dashboard
                </button>
                
                {/* Enhanced notification badge styling */}
                {unviewedBidCount > 0 && (
                  <div 
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{
                      transform: 'translate(-50%, -50%)',
                      zIndex: 1000
                    }}
                  >
                    <span className="badge rounded-pill bg-danger" 
                      style={{
                        fontSize: '0.9rem',
                        padding: '0.35em 0.65em',
                        fontWeight: 'bold',
                        boxShadow: '0 0 0 2px #fff'
                      }}
                    >
                      {unviewedBidCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column" style={{marginTop:'20px'}} >
            <button
              className="btn-secondary flex-fill"
              style={{fontWeight:'bold'}}
              onClick={handleViewRequests} // Updated to conditionally show modal
            >
              View Requests
            </button>
          </div>
          <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column" style={{marginTop:'20px'}}>
            <button
              style={{fontWeight:'bold', color:'#9633eb'}}
              className="btn-primary flex-fill"
              onClick={handleViewPortfolio}
            >
                      <i className="fas fa-user-circle" style={{ marginRight: '8px' }}></i>
                View/Edit Portfolio
        
            </button>
          </div>
          <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column" style={{marginTop:'20px'}}>
            {connectedAccountId ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <StripeDashboardButton 
                  accountId={connectedAccountId}
                  onError={() => setStripeError(true)}
                  onSuccess={() => setStripeError(false)}
                />
                {stripeError && (
                  <button
                    className="btn-danger"
                    style={{marginTop: '10px', width: '100%'}}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reset your Stripe connection? You will need to set it up again to receive payments.')) {
                         handleResetStripeAccount();
                        setStripeError(false);
                      }
                    }}
                  >
                    Reset Stripe Connection
                  </button>
                )}
              </div>
            ) : (
              <button
              style={{fontWeight:'bold', color:'#9633eb'}}
                className="btn-primary flex-fill"
                onClick={() => navigate("/onboarding")}
              >
              <i className="fas fa-dollar-sign" style={{ marginRight: '8px' }}></i>
                Set Up Payment Account
              </button>
            )}
          </div>
                {!isVerified && (
                <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column" style={{marginTop:'20px'}} >
                  <button
                  className="btn-primary flex-fill"
                  style={{
                    fontWeight: 'bold',
                    opacity: isVerificationPending ? '0.7' : '1',
                    cursor: isVerificationPending ? 'not-allowed' : 'pointer',
                    background: isVerificationPending ? '#6c757d' : undefined, // Grayed out when pending
                    color:'#9633eb'
                  }}
                  onClick={() => !isVerificationPending && navigate("/verification-application")}
                  disabled={isVerificationPending}
                  >
                  {isVerificationPending ? (
                    <span>
                    Verification Pending 
                    <i className="fas fa-spinner fa-spin ml-2" style={{ marginLeft: '8px' }}></i>
                    </span>
                  ) : (
                    <span>
                    <img src={Verification} alt="Bidi Verification Logo" style={{ marginRight: '8px', height: '20px' }} />
                    Apply to be Bidi Verified

                    </span>
                  )}
                  </button>
                </div>
                )}
                <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column" style={{marginTop:'20px'}}>
                <button
                style={{fontWeight:'bold', color:'#9633eb'}}
                  className="btn-primary flex-fill"
                  onClick={() => setShowModal(true)}
                >
                  <i className="fas fa-dollar-sign" style={{ marginRight: '8px' }}></i>
                  Set Up Down Payment
                </button>
                </div>
                <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column" style={{marginTop:'20px'}}>
                <button
                  style={{fontWeight:'bold', color:'#9633eb'}}
                  className="btn-primary flex-fill"
                  onClick={() => setShowMinPriceModal(true)}
                >
                  <i className="fas fa-tag" style={{ marginRight: '8px' }}></i>
                  Set Minimum Price {currentMinPrice ? `($${currentMinPrice})` : ''}
                </button>
                </div>
                <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column" style={{marginTop:'20px'}}>
                <button
                  style={{fontWeight:'bold', color:'#9633eb'}}
                  className="btn-primary flex-fill"
                  onClick={handleGenerateCoupon}
                >
                  <i className="fas fa-ticket-alt" style={{ marginRight: '8px' }}></i>
                  {getButtonText()}
                </button>
                </div>
                <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column" style={{marginTop:'20px'}}>
                  <button
                    style={{fontWeight:'bold', color:'#9633eb'}}
                    className="btn-primary flex-fill"
                    onClick={() => setShowBidTemplateModal(true)}
                  >
                    <i className="fas fa-file-alt" style={{ marginRight: '8px' }}></i>
                    Edit Bid Template
                  </button>
                </div>
              </div>
              </div>

              {/* Bids Section */}
      <div className="container">
        <h3>Your Active Bids</h3>
        <div className="row">
          {bids.length > 0 ? (
            bids.map((bid, index) => (
              <div key={bid.id} className="col-lg-4 col-md-6 col-sm-12 mb-3">
                <div className="card">
                  <div className="card-body">
                    {/* Request Details */}
                    <h5 className="card-title">
                      Request Title: {bid.service_title || bid.request_data?.event_title || bid.title || 'Untitled'}
                    </h5>
                    {bid.request_type === "Normal Request" ? (
                      <div>
                        <p><strong>Location:</strong> {bid.request_data?.location}</p>
                        <p><strong>{bid.request_data?.end_date ? 'Start Date' : 'Date'}:</strong> {bid.request_data?.service_date}</p>
                        {bid.request_data?.end_date && (
                          <p><strong>End Date:</strong> {bid.request_data?.end_date}</p>
                        )}
                        <p><strong>Price Range: </strong>{bid.request_data?.price_range}</p>
                        
                      </div>
                    ) : bid.request_type === "Photography Request" ? (
                      <div>
                        <p><strong>Event Type: </strong>{bid.request_data?.event_type}</p>
                        {bid.request_data?.date_flexibility === 'specific' ? (
                          <p>
                            <strong>Event Date: </strong>
                            {new Date(bid.request_data?.start_date).toLocaleDateString()}
                          </p>
                        ) : bid.request_data?.date_flexibility === 'range' ? (
                          <p>
                            <strong>Date Range: </strong>
                            {`${new Date(bid.request_data?.start_date).toLocaleDateString()} - ${new Date(bid.request_data?.end_date).toLocaleDateString()}`}
                          </p>
                        ) : (
                          <p>
                            <strong>Date Preference: </strong>
                            {bid.request_data?.date_timeframe === '3months' ? 'Within 3 months' :
                             bid.request_data?.date_timeframe === '6months' ? 'Within 6 months' :
                             bid.request_data?.date_timeframe === '1year' ? 'Within 1 year' :
                             bid.request_data?.date_timeframe === 'more' ? 'More than 1 year' :
                             'Not specified'}
                          </p>
                        )}
                        <p><strong>Location: </strong>{bid.request_data?.location}</p>
                        <p><strong>Number of People:</strong> {bid.request_data?.num_people}</p>
                        <p><strong>Duration: </strong>{bid.request_data?.duration}</p>
                      </div>
                    ) : bid.request_type === "Videography Request" ? (
                      <div>
                        <p><strong>Event Type: </strong>{bid.request_data?.event_type}</p>
                        {bid.request_data?.date_flexibility === 'specific' ? (
                          <p>
                            <strong>Event Date: </strong>
                            {new Date(bid.request_data?.start_date).toLocaleDateString()}
                          </p>
                        ) : bid.request_data?.date_flexibility === 'range' ? (
                          <p>
                            <strong>Date Range: </strong>
                            {`${new Date(bid.request_data?.start_date).toLocaleDateString()} - ${new Date(bid.request_data?.end_date).toLocaleDateString()}`}
                          </p>
                        ) : (
                          <p>
                            <strong>Date Preference: </strong>
                            {bid.request_data?.date_timeframe === '3months' ? 'Within 3 months' :
                             bid.request_data?.date_timeframe === '6months' ? 'Within 6 months' :
                             bid.request_data?.date_timeframe === '1year' ? 'Within 1 year' :
                             bid.request_data?.date_timeframe === 'more' ? 'More than 1 year' :
                             'Not specified'}
                          </p>
                        )}
                        <p><strong>Location: </strong>{bid.request_data?.location}</p>
                        <p><strong>Number of People:</strong> {bid.request_data?.num_people}</p>
                        <p><strong>Duration: </strong>{bid.request_data?.duration}</p>
                      </div>
                    ) : bid.request_type === "Florist Request" ? (
                      <div>
                        <p><strong>Event Type: </strong>{bid.request_data?.event_type}</p>
                        <p><strong>Start Date: </strong>{bid.request_data?.start_date}</p>
                        {bid.request_data?.end_date && (
                          <p><strong>End Date: </strong>{bid.request_data?.end_date}</p>
                        )}
                        <p><strong>Location: </strong>{bid.request_data?.location}</p>
                        <p><strong>Flower Types: </strong>
                          {typeof bid.request_data?.flower_preferences === 'object' 
                            ? Object.entries(bid.request_data?.flower_preferences)
                                .filter(([_, value]) => value === true)
                                .map(([key]) => key)
                                .join(', ')
                            : Array.isArray(bid.request_data?.flower_preferences)
                              ? bid.request_data?.flower_preferences.join(', ')
                              : bid.request_data?.flower_preferences}
                        </p>
                        <p><strong>Color Scheme: </strong>
                          {Array.isArray(bid.request_data?.colors) 
                            ? bid.request_data?.colors.join(', ') 
                            : bid.request_data?.colors}
                        </p>
                      </div>
                    ) : bid.request_type === "DJ Request" ? (
                      <div>
                        <p><strong>Event Type: </strong>{bid.request_data?.event_type}</p>
                        {bid.request_data?.date_flexibility === 'specific' ? (
                          <p>
                            <strong>Event Date: </strong>
                            {new Date(bid.request_data?.start_date).toLocaleDateString()}
                          </p>
                        ) : bid.request_data?.date_flexibility === 'range' ? (
                          <p>
                            <strong>Date Range: </strong>
                            {`${new Date(bid.request_data?.start_date).toLocaleDateString()} - ${new Date(bid.request_data?.end_date).toLocaleDateString()}`}
                          </p>
                        ) : (
                          <p>
                            <strong>Date Preference: </strong>
                            {bid.request_data?.date_timeframe === '3months' ? 'Within 3 months' :
                             bid.request_data?.date_timeframe === '6months' ? 'Within 6 months' :
                             bid.request_data?.date_timeframe === '1year' ? 'Within 1 year' :
                             bid.request_data?.date_timeframe === 'more' ? 'More than 1 year' :
                             'Not specified'}
                          </p>
                        )}
                        <p><strong>Location: </strong>{bid.request_data?.location}</p>
                        <p><strong>Music Genre: </strong>
                          {typeof bid.request_data?.music_preferences === 'object'
                            ? Object.entries(bid.request_data?.music_preferences)
                                .filter(([_, value]) => value === true)
                                .map(([key]) => key)
                                .join(', ')
                            : bid.request_data?.music_preferences}
                        </p>
                        <p><strong>Equipment Needed: </strong>{bid.request_data?.equipment_needed ? 'Yes' : 'No'}</p>
                        <p><strong>Duration: </strong>{bid.request_data?.event_duration} hours</p>
                      </div>
                    ) : bid.request_type === "Catering Request" ? (
                      <div>
                        <p><strong>Event Type: </strong>{bid.request_data?.event_type}</p>
                        {bid.request_data?.date_flexibility === 'specific' ? (
                          <p>
                            <strong>Event Date: </strong>
                            {new Date(bid.request_data?.start_date).toLocaleDateString()}
                          </p>
                        ) : bid.request_data?.date_flexibility === 'range' ? (
                          <p>
                            <strong>Date Range: </strong>
                            {`${new Date(bid.request_data?.start_date).toLocaleDateString()} - ${new Date(bid.request_data?.end_date).toLocaleDateString()}`}
                          </p>
                        ) : (
                          <p>
                            <strong>Date Preference: </strong>
                            {bid.request_data?.date_timeframe === '3months' ? 'Within 3 months' :
                             bid.request_data?.date_timeframe === '6months' ? 'Within 6 months' :
                             bid.request_data?.date_timeframe === '1year' ? 'Within 1 year' :
                             bid.request_data?.date_timeframe === 'more' ? 'More than 1 year' :
                             'Not specified'}
                          </p>
                        )}
                        <p><strong>Location: </strong>{bid.request_data?.location}</p>
                        <p><strong>Number of Guests: </strong>{bid.request_data?.estimated_guests}</p>
                        <p><strong>Cuisine Type: </strong>{Array.isArray(bid.request_data?.food_preferences) ? bid.request_data?.food_preferences.join(', ') : typeof bid.request_data?.food_preferences === 'object' ? Object.keys(bid.request_data?.food_preferences).join(', ') : bid.request_data?.food_preferences}</p>
                      </div>
                    ) : bid.request_type === "Hair and Makeup Request" ? (
                      <div>
                        <p><strong>Event Type: </strong>{bid.request_data?.event_type}</p>
                        {bid.request_data?.date_flexibility === 'specific' ? (
                          <p>
                            <strong>Event Date: </strong>
                            {new Date(bid.request_data?.start_date).toLocaleDateString()}
                          </p>
                        ) : bid.request_data?.date_flexibility === 'range' ? (
                          <p>
                            <strong>Date Range: </strong>
                            {`${new Date(bid.request_data?.start_date).toLocaleDateString()} - ${new Date(bid.request_data?.end_date).toLocaleDateString()}`}
                          </p>
                        ) : (
                          <p>
                            <strong>Date Preference: </strong>
                            {bid.request_data?.date_timeframe === '3months' ? 'Within 3 months' :
                             bid.request_data?.date_timeframe === '6months' ? 'Within 6 months' :
                             bid.request_data?.date_timeframe === '1year' ? 'Within 1 year' :
                             bid.request_data?.date_timeframe === 'more' ? 'More than 1 year' :
                             'Not specified'}
                          </p>
                        )}
                        <p><strong>Location: </strong>{bid.request_data?.location}</p>
                        <p><strong>Number of People: </strong>{bid.request_data?.num_people}</p>
                        <p><strong>Service Type: </strong>{bid.request_data?.service_type}</p>
                      </div>
                    ) : null}

                    {/* Bid Details */}
                    <div className="bid-details-dashboard">
                      <h4 className="mb-2">Your Bid:</h4>
                      <p className="card-text">Amount: ${bid.bid_amount}</p>
                      <p className="card-text">Description: {bid.bid_description}</p>
                      <p className="card-text">Status: {bid.status}</p>
                      <p className="card-text">
                        {bid.viewed ? (
                          <span className="viewed-status">
                            Viewed {bid.viewed_at && `on ${new Date(bid.viewed_at).toLocaleDateString()}`}
                            <svg width="16" height="16" viewBox="0 0 16 16" className="check-icon">
                              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" fill="currentColor"/>
                            </svg>
                          </span>
                        ) : (
                          <span className="not-viewed-status">Not viewed yet</span>
                        )}
                      </p>
                      <div style={{display:'flex',flexDirection:'row',gap:'10px', justifyContent:'center'}}>
                          <button
                            className="btn-primary"
                            onClick={() => handleRemoveBid(bid.id)}
                            style={{width:'100%'}}
                          >
                            Remove
                          </button>
                        <button 
                          className="btn-secondary" 
                          onClick={() => navigate(`/edit-bid/${bid.request_id}/${bid.id}`)} // Pass both requestId and bidId
                        >
                          Edit
                        </button>
                      </div>
                      
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No current bids available.</p>
          )}
        </div>
      </div>

      {/* Modal for Down Payment Setup */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="text-center">
            Enter What You Charge For a Down Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ textAlign: 'center', marginBottom: '20px', wordBreak:'break-word' }}>Do you charge a percentage or a flat fee up front?</div>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '20px', marginBottom:'20px'}}>
            <button
            style={{width:'50%', maxHeight:'48px'}}
              className={`btn-${paymentType === "percentage" ? "secondary" : "primary"}`}
              onClick={() => handlePaymentTypeChange("percentage")}
            >
              Percentage
            </button>
            <button
             style={{width:'50%', maxHeight:'48px'}}
              className={`btn-${paymentType === "flat fee" ? "secondary" : "primary"}`}
              onClick={() => handlePaymentTypeChange("flat fee")}
            >
              Flat Fee
            </button>
          </div>

          {paymentType === "percentage" && (
            <div>
              <input
                type="number"
                value={percentage}
                onChange={handleChangePercentage}
                placeholder="Enter Percentage"
                className="form-control"
                min="0"
                max="100"
              />
            </div>
          )}

          {paymentType === "flat fee" && (
            <div>
              <input
                type="number"
                value={number}
                onChange={handleChangeNumber}
                placeholder="Enter Flat Fee"
                className="form-control"
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div style={{display:'flex', flexDirection:'row', gap:'20px', justifyContent:'center'}}>
          <button  style={{maxHeight:'32px'}}className="btn-danger"onClick={() => setShowModal(false)}>Close</button>
          <button  style={{maxHeight:'32px'}}className="btn-success" onClick={handleDownPaymentSubmit}>Submit</button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Modal for Minimum Price Setup */}
      <Modal show={showMinPriceModal} onHide={() => setShowMinPriceModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Set Minimum Price</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="minimumPrice" className="form-label">Enter your minimum price:</label>
            <input
              type="number"
              className="form-control"
              id="minimumPrice"
              value={minimumPrice}
              onChange={(e) => setMinimumPrice(e.target.value)}
              placeholder="Enter amount"
              min="0"
            />
          </div>
          <p className="text-muted">
            You will only see requests with budgets above this amount.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn-danger" onClick={() => setShowMinPriceModal(false)}>
            Close
          </button>
          <button className="btn-success" onClick={handleMinPriceSubmit}>
            Save
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal for Coupon Generation */}
      <Modal show={showCouponModal} onHide={() => setShowCouponModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{activeCoupon ? 'Your Affiliate Coupon' : 'New Affiliate Coupon Generated'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <h4>Your coupon code is:</h4>
            <div className="p-3 mb-3 bg-light rounded">
              <strong>{newCouponCode}</strong>
            </div>
            <p>This coupon gives customers $10 off their purchase</p>
            <p>Valid until: {activeCoupon ? new Date(activeCoupon.expiration_date).toLocaleDateString() : ''}</p>
            <p>Share this code with your network to earn 5% of the bid amount when your lead pays through Bidi</p>
            
            {/* Add Calculator Section */}
            <div className="mt-4 p-3 bg-light rounded">
              <h5>Earnings Calculator</h5>
              <div className="input-group mb-3">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter bid amount"
                  value={calculatorAmount}
                  onChange={(e) => setCalculatorAmount(e.target.value)}
                />
              </div>
              <p className="mt-2">
                You would earn: <strong>${calculateEarnings(calculatorAmount)}</strong>
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn-danger" onClick={() => setShowCouponModal(false)}>
            Close
          </button>
          <button 
            className="btn-success"
            onClick={() => {
              navigator.clipboard.writeText(newCouponCode);
              alert('Coupon code copied to clipboard!');
            }}
          >
            Copy
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal for Bid Template Editing */}
      <Modal show={showBidTemplateModal} onHide={() => setShowBidTemplateModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Bid Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="bidTemplate" className="form-label">Your bid template:</label>
            <ReactQuill
              theme="snow"
              value={bidTemplate}
              onChange={setBidTemplate}
              modules={modules}
              formats={formats}
              style={{ height: '300px', marginBottom: '50px' }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn-danger" onClick={() => setShowBidTemplateModal(false)}>
            Close
          </button>
          <button className="btn-success" onClick={handleBidTemplateSubmit}>
            Save
          </button>
        </Modal.Footer>
      </Modal>
      
    </div>
  );
};

export default BusinessDashboard;
