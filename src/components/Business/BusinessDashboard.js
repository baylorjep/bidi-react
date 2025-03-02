import React, { useState, useEffect } from "react";
import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import { supabase } from "../../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import '../../App.css'; // Include this for custom styles
import { Modal, Button } from 'react-bootstrap'; // Make sure to install react-bootstrap

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

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch business profile details
        const { data: profile, error: profileError } = await supabase
          .from('business_profiles')
          .select('business_name, stripe_account_id, id, down_payment_type, amount, minimum_price')
          .eq('id', user.id)
          .single();
  
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }
  
        if (profile) {
          setBusinessName(profile.business_name);
          if (profile.stripe_account_id) {
            setConnectedAccountId(profile.stripe_account_id);
          } 
          
          // Only show modal automatically if down payment has never been set
          if (profile.down_payment_type === null && profile.amount === null) {
            setShowModal(true);
          }
  
          // Fetch current bids for this business
          const { data: bidsData, error: bidsError } = await supabase
            .from('bids')
            .select(`
              *,
              viewed,
              viewed_at
            `)
            .eq('user_id', profile.id)
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
          setCurrentMinPrice(profile.minimum_price);
        }
      }
    };
  
    fetchBusinessDetails();
    fetchAffiliateCoupons();
  }, []);
  
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

  return (
    <div className="business-dashboard text-center">
      <h1 className="dashboard-title">Welcome, {businessName}!</h1>

      <div className="edit-profile-container">
          <Link to="/profile" className="edit-profile">
              Edit Profile
          </Link>
      </div>

      <div className="container mt-4">
        <div className="row justify-content-center">
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
            {connectedAccountId ? (
              <StripeDashboardButton accountId={connectedAccountId} />
            ) : (
              <button
              style={{fontWeight:'bold'}}
                className="btn-secondary flex-fill"
                onClick={() => navigate("/onboarding")}
              >
                Set Up Payment Account
              </button>
            )}
          </div>
          <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column" style={{marginTop:'20px'}}>
            <button
            style={{fontWeight:'bold'}}
              className="btn-secondary flex-fill"
              onClick={() => setShowModal(true)}
            >
              Set Up Down Payment
            </button>
          </div>
          <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column" style={{marginTop:'20px'}}>
            <button
              style={{fontWeight:'bold'}}
              className="btn-secondary flex-fill"
              onClick={() => setShowMinPriceModal(true)}
            >
              Set Minimum Price {currentMinPrice ? `($${currentMinPrice})` : ''}
            </button>
          </div>
          <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column" style={{marginTop:'20px'}}>
            <button
              style={{fontWeight:'bold'}}
              className="btn-secondary flex-fill"
              onClick={handleGenerateCoupon}
            >
              {getButtonText()}
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
                  <p><strong>Flower Types: </strong>{Array.isArray(bid.request_data?.flower_preferences) ? bid.request_data?.flower_preferences.join(', ') : bid.request_data?.flower_preferences}</p>
                  <p><strong>Color Scheme: </strong>{Array.isArray(bid.request_data?.colors) ? bid.request_data?.colors.join(', ') : bid.request_data?.colors}</p>
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
                  <p><strong>Music Genre: </strong>{typeof bid.request_data?.music_preferences === 'object' ? Object.keys(bid.request_data?.music_preferences).join(', ') : bid.request_data?.music_preferences}</p>
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
      
    </div>
  );
};

export default BusinessDashboard;
