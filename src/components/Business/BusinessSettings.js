import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    setActiveSection("onboarding");
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
    // Regular expressions to detect contact information
    const phoneRegex = /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const websiteRegex =
      /(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?/g;
    const socialMediaRegex =
      /(?:@|(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|facebook\.com|linkedin\.com|twitter\.com)\/)[a-zA-Z0-9._-]+/g;

    // Check for any matches
    const hasPhone = phoneRegex.test(template);
    const hasEmail = emailRegex.test(template);
    const hasWebsite = websiteRegex.test(template);
    const hasSocialMedia = socialMediaRegex.test(template);

    if (hasPhone || hasEmail || hasWebsite || hasSocialMedia) {
      let errorMessage =
        "Please remove the following contact information from your template:";
      if (hasPhone) errorMessage += "\n- Phone numbers";
      if (hasEmail) errorMessage += "\n- Email addresses";
      if (hasWebsite) errorMessage += "\n- Website URLs";
      if (hasSocialMedia) errorMessage += "\n- Social media handles/links";
      errorMessage +=
        "\n\nAll contact information should be managed through your Bidi profile. The user can see your work on your profile and will get your contact information after accepting your bid.";
      setBidTemplateError(errorMessage);
      return { isValid: false, message: errorMessage };
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

  if (isLoading) {
    return <LoadingSpinner color="#9633eb" size={50} />;
  }

  return (
    <div className="business-settings-container">
      {/* Setup Progress Box */}
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
                    <button
                      className="btn-link"
                      onClick={() => setActiveSection("onboarding")}
                    >
                      Set up now
                    </button>
                  </div>
                )}
                {!setupProgress.downPayment && (
                  <div className="setup-item">
                    <i className="fas fa-times-circle text-danger"></i>
                    <span>Down Payment Setup</span>
                    <button
                      className="btn-link"
                      onClick={() => setShowDownPaymentModal(true)}
                    >
                      Set up now
                    </button>
                  </div>
                )}
                {!setupProgress.minimumPrice && (
                  <div className="setup-item">
                    <i className="fas fa-times-circle text-danger"></i>
                    <span>Minimum Price Set</span>
                    <button
                      className="btn-link"
                      onClick={() => setShowMinPriceModal(true)}
                    >
                      Set now
                    </button>
                  </div>
                )}
                {!setupProgress.affiliateCoupon && (
                  <div className="setup-item">
                    <i className="fas fa-times-circle text-danger"></i>
                    <span>Affiliate Coupon Generated</span>
                    <button className="btn-link" onClick={handleGenerateCoupon}>
                      Generate now
                    </button>
                  </div>
                )}
                {!setupProgress.bidTemplate && (
                  <div className="setup-item">
                    <i className="fas fa-times-circle text-danger"></i>
                    <span>Bid Template</span>
                    <button
                      className="btn-link"
                      onClick={() => setShowBidTemplateModal(true)}
                    >
                      Set up now
                    </button>
                  </div>
                )}
                {!setupProgress.verification && (
                  <div className="setup-item">
                    <i className="fas fa-times-circle text-danger"></i>
                    <span>Bidi Verification</span>
                    <button
                      className="btn-link"
                      onClick={() => navigate("/verification-application")}
                    >
                      Apply now
                    </button>
                  </div>
                )}
                {!setupProgress.story && profileDetails && (
                  <div className="setup-item">
                    <i className="fas fa-times-circle text-danger"></i>
                    <span>Complete Your Profile</span>
                    <button
                      className="btn-link"
                      onClick={() =>
                        navigate(`/portfolio/${profileDetails.id}`)
                      }
                    >
                      Complete now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="row justify-content-center">
        {/* Admin Dashboard */}
        {isAdmin && (
          <div
            className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column"
            style={{ marginTop: "20px" }}
          >
            <button
              style={{ fontWeight: "bold", color: "#9633eb" }}
              className="btn-primary flex-fill"
              onClick={() => navigate("/admin-dashboard")}
            >
              <img src={bidiLogo} className="admin-logo" alt="Admin" />
              Admin Dashboard
            </button>
          </div>
        )}

        {/* Payment Dashboard Button */}
        <div
          className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column"
          style={{ marginTop: "20px" }}
        >
          {connectedAccountId ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <button
                style={{ fontWeight: "bold", color: "#9633eb" }}
                className="btn-primary flex-fill"
                onClick={handleOpenStripeDashboard}
              >
                <i
                  className="fas fa-chart-line"
                  style={{ marginRight: "8px" }}
                ></i>
                Payment Dashboard
              </button>
              {stripeError && ( // Show the reset button only if there's an error
                <div>
                  <p
                    style={{
                      color: "#ff6961",
                      fontWeight: "bold",
                      marginBottom: "10px",
                    }}
                  >
                    An error occurred. Click the Reset button below to reset
                    your account.
                  </p>
                  <button
                    style={{
                      fontWeight: "bold",
                      color: "#9633eb",
                      backgroundColor: "#f8d7da",
                      border: "1px solid #f5c6cb",
                      padding: "10px",
                      borderRadius: "5px",
                      width: "100%",
                    }}
                    className="btn-danger flex-fill"
                    onClick={handleResetStripeAccount}
                  >
                    <i
                      className="fas fa-redo-alt"
                      style={{ marginRight: "8px" }}
                    ></i>
                    Reset Stripe Connection
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              style={{ fontWeight: "bold", color: "#9633eb" }}
              className="btn-primary flex-fill"
              onClick={handleStripeOnboarding}
              disabled={accountCreatePending}
            >
              <i
                className="fas fa-dollar-sign"
                style={{ marginRight: "8px" }}
              ></i>
              {accountCreatePending
                ? "Setting Up Payment Account..."
                : "Set Up Payment Account"}
            </button>
          )}
        </div>

        {/* Apply to Be Bidi Verified Button */}
        {!isVerified && (
          <div
            className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column"
            style={{ marginTop: "20px" }}
          >
            <button
              className="btn-primary flex-fill"
              style={{
                fontWeight: "bold",
                color: "#9633eb",
              }}
              onClick={() => navigate("/verification-application")}
            >
              <img
                src={Verification}
                alt="Bidi Verification Logo"
                style={{ marginRight: "8px", height: "20px" }}
              />
              Apply to be Bidi Verified
            </button>
          </div>
        )}

        {/* Set Up Down Payment Button */}
        <div
          className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column"
          style={{ marginTop: "20px" }}
        >
          <button
            style={{ fontWeight: "bold", color: "#9633eb" }}
            className="btn-primary flex-fill"
            onClick={() => setShowDownPaymentModal(true)}
          >
            <i
              className="fas fa-dollar-sign"
              style={{ marginRight: "8px" }}
            ></i>
            Set Up Down Payment
          </button>
        </div>

        {/* Set Minimum Price Button */}
        <div
          className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column"
          style={{ marginTop: "20px" }}
        >
          <button
            style={{ fontWeight: "bold", color: "#9633eb" }}
            className="btn-primary flex-fill"
            onClick={() => setShowMinPriceModal(true)}
          >
            <i className="fas fa-tag" style={{ marginRight: "8px" }}></i>
            {currentMinPrice !== null
              ? `Set Minimum Price ($${currentMinPrice})`
              : "Set Minimum Price"}
          </button>
        </div>

        {/* View Affiliate Coupon Button */}
        <div
          className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column"
          style={{ marginTop: "20px" }}
        >
          <button
            style={{ fontWeight: "bold", color: "#9633eb" }}
            className="btn-primary flex-fill"
            onClick={() => setShowCouponModal(true)} // Open the coupon modal
          >
            <i className="fas fa-ticket-alt" style={{ marginRight: "8px" }}></i>
            {getButtonText()}
          </button>
        </div>
        <div
          className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column"
          style={{ marginTop: "20px" }}
        >
          <button
            style={{ fontWeight: "bold", color: "#9633eb" }}
            className="btn-primary flex-fill"
            onClick={() => setShowBidTemplateModal(true)}
          >
            <i className="fas fa-file-alt" style={{ marginRight: "8px" }}></i>
            {bidTemplate ? "Edit Bid Template" : "Create Bid Template"}
          </button>
        </div>

        {/* Set Default Bid Expiration Button */}
        <div
          className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column"
          style={{ marginTop: "20px" }}
        >
          <button
            style={{ fontWeight: "bold", color: "#9633eb" }}
            className="btn-primary flex-fill"
            onClick={() => setShowDefaultExpirationModal(true)}
          >
            <i className="fas fa-clock" style={{ marginRight: "8px" }}></i>
            Set Default Bid Expiration
          </button>
        </div>
      </div>

      {/* Modal for Down Payment Setup */}
      <Modal
        show={showDownPaymentModal}
        onHide={() => setShowDownPaymentModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="text-center">
            Enter What You Charge For a Down Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            style={{
              textAlign: "center",
              marginBottom: "20px",
              wordBreak: "break-word",
            }}
          >
            Do you charge a percentage or a flat fee up front?
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <button
              style={{ width: "50%", maxHeight: "48px" }}
              className={`btn-${
                paymentType === "percentage" ? "secondary" : "primary"
              }`}
              onClick={() => handlePaymentTypeChange("percentage")}
            >
              Percentage
            </button>
            <button
              style={{ width: "50%", maxHeight: "48px" }}
              className={`btn-${
                paymentType === "flat fee" ? "secondary" : "primary"
              }`}
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
                onChange={handleChangeDownPaymentPercentage}
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
                value={downPaymentNumber}
                onChange={handleChangeDownPaymentNumber}
                placeholder="Enter Flat Fee"
                className="form-control"
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "20px",
              justifyContent: "center",
            }}
          >
            <button
              style={{ maxHeight: "32px" }}
              className="btn-danger"
              onClick={() => setShowDownPaymentModal(false)}
            >
              Close
            </button>
            <button
              style={{ maxHeight: "32px" }}
              className="btn-success"
              onClick={handleDownPaymentSubmit}
            >
              Submit
            </button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Minimum Price Modal */}
      <Modal
        show={showMinPriceModal}
        onHide={() => setShowMinPriceModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Set Minimum Price</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="minimumPrice" className="form-label">
              Enter your minimum price:
            </label>
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
          <button
            className="btn-danger"
            onClick={() => setShowMinPriceModal(false)}
          >
            Close
          </button>
          <button className="btn-success" onClick={handleMinPriceSubmit}>
            Save
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal for Coupon Generation */}
      <Modal
        show={showCouponModal}
        onHide={() => setShowCouponModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {activeCoupon
              ? "Your Affiliate Coupon"
              : "New Affiliate Coupon Generated"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <h4>Your coupon code is:</h4>
            <div className="p-3 mb-3 bg-light rounded">
              {newCouponCode || (activeCoupon && activeCoupon.code)}
            </div>
            <p>This coupon gives customers $10 off their purchase</p>
            <p>
              Valid until:{" "}
              {activeCoupon
                ? new Date(activeCoupon.expiration_date).toLocaleDateString()
                : ""}
            </p>
            <p>
              Share this code with your network to earn 5% of the bid amount
              when your lead pays through Bidi
            </p>

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
                You would earn:{" "}
                <strong>${calculateEarnings(calculatorAmount)}</strong>
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn-danger"
            onClick={() => setShowCouponModal(false)}
          >
            Close
          </button>
          <button
            className="btn-success"
            onClick={() => {
              navigator.clipboard.writeText(newCouponCode);
            }}
          >
            Copy
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal for Bid Template Editing */}
      <Modal
        show={showBidTemplateModal}
        onHide={() => {
          setShowBidTemplateModal(false);
          setBidTemplateError("");
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Bid Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="bidTemplate" className="form-label">
              Your bid template:
            </label>
            {bidTemplateError && (
              <div className="alert alert-warning" role="alert">
                {bidTemplateError.split("\n").map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            )}
            <ReactQuill
              theme="snow"
              value={bidTemplate}
              onChange={handleBidTemplateChange}
              modules={modules}
              formats={formats}
              style={{ height: "300px", marginBottom: "50px" }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn-danger"
            onClick={() => {
              setShowBidTemplateModal(false);
              setBidTemplateError("");
            }}
          >
            Close
          </button>
          <button className="btn-success" onClick={handleBidTemplateSubmit}>
            Save
          </button>
        </Modal.Footer>
      </Modal>

      {/* Default Expiration Modal */}
      <Modal
        show={showDefaultExpirationModal}
        onHide={() => setShowDefaultExpirationModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Set Default Bid Expiration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="defaultExpiration" className="form-label">
              Enter default number of days until bid expiration:
            </label>
            <input
              type="number"
              className="form-control"
              id="defaultExpiration"
              value={defaultExpirationDays}
              onChange={(e) => setDefaultExpirationDays(e.target.value)}
              placeholder="Enter number of days"
              min="1"
            />
          </div>
          <p className="text-muted">
            This will be the default number of days until a bid expires when you create new bids.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn-danger"
            onClick={() => setShowDefaultExpirationModal(false)}
          >
            Close
          </button>
          <button className="btn-success" onClick={handleDefaultExpirationSubmit}>
            Save
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BusinessSettings;
