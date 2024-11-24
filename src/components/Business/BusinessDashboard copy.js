import React, { useState, useEffect } from "react";
import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import '../../App.css'; // Include this for custom styles
import { Modal, Button } from 'react-bootstrap'; // Make sure to install react-bootstrap

const BusinessDashboard = () => {
  const [connectedAccountId, setConnectedAccountId] = useState(null);
  const [businessName, setBusinessName] = useState("Business Owner");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [percentage, setPercentage] = useState("");
  const [number, setNumber] = useState("");
  const [paymentType, setPaymentType] = useState(""); // "percentage" or "flat fee"
  const [downPaymentType, setDownPaymentType] = useState("");
  const [downPaymentAmount, setDownPaymentAmount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = await supabase.auth.getSession();
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("business_name, stripe_account_id, id")
          .eq("id", user.id)
          .single();
  
        if (!error && data) {
          setBusinessName(data.business_name || "Business Owner");
          setConnectedAccountId(data.stripe_account_id);
          setUserId(data.id); // Store the user ID for later use
        }
      }
    };
    fetchUserData();
  }, []);

  const [userId, setUserId] = useState("");  // State to store user ID

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

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type); // Set the selected type (percentage or flat fee)
    setPercentage(""); // Reset percentage input when toggling
    setNumber(""); // Reset number input when toggling
  };

  // Function to handle the "View Requests" button click
  const handleViewRequests = () => {
    navigate("/open-requests");
  };

  const handleDownPaymentSubmit = async () => {
    if (downPaymentType && downPaymentAmount) {
      const { data, error } = await supabase
        .from("down_payments")
        .upsert([
          {
            user_id: userId,
            down_payment_type: downPaymentType,
            amount: downPaymentAmount,
          },
        ]);
      if (error) {
        console.error("Error inserting down payment:", error);
      } else {
        setShowModal(false); // Close modal on successful submission
      }
    } else {
      alert("Please fill in all fields.");
    }
  };
  
  

  return (
    <div className="business-dashboard text-center">
      <h1 className="dashboard-title">Welcome, {businessName}!</h1>

      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
            <button
              className="btn btn-secondary btn-lg w-100 mb-3 flex-fill"
              onClick={handleViewRequests}
            >
              View Requests
            </button>
          </div>
          <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
            {connectedAccountId ? (
              <StripeDashboardButton accountId={connectedAccountId} />
            ) : (
              <button
                className="btn btn-secondary btn-lg w-100 mb-3 flex-fill"
                onClick={() => navigate("/onboarding")}
              >
                Set Up Payment Account
              </button>
            )}
          </div>
          <div className="col-lg-5 col-md-6 col-sm-12 d-flex flex-column">
            <button
              className="btn btn-secondary btn-lg w-100 mb-3 flex-fill"
              onClick={() => setShowModal(true)}
            >
              Set Up Down Payment
            </button>
          </div>
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
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>Do you charge a percentage or a flat fee up front?</div>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '20px', marginBottom:'20px'}}>
            <button
              className={`btn btn-${paymentType === "percentage" ? "primary" : "secondary"} `}
              onClick={() => handlePaymentTypeChange("percentage")}
            >
              Percentage
            </button>
            <button
              className={`btn btn-${paymentType === "flat fee" ? "primary" : "secondary"}`}
              onClick={() => handlePaymentTypeChange("flat fee")}
            >
              Flat Fee
            </button>
          </div>

          {/* Conditionally render based on payment type */}
          {paymentType === "percentage" && (
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="percentage">Percentage:</label>
              <div className="input-group">
                <input
                  id="percentage"
                  type="number"
                  value={percentage}
                  onChange={handleChangePercentage}
                  className="form-control"
                  placeholder="Enter percentage"
                />
                <span className="input-group-text">%</span>
              </div>
            </div>
          )}

          {paymentType === "flat fee" && (
            <div>
              <label htmlFor="number">Enter a Number:</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  id="number"
                  type="number"
                  value={number}
                  onChange={handleChangeNumber}
                  className="form-control"
                  placeholder="Enter a number"
                />
              </div>
            </div>
          )}

          <div className="down-payment-modal-body">
            <Button
              variant="primary"
              onClick={() => setShowModal(false)}
              className="me-2"
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleDownPaymentSubmit}
            >
              Submit
            </Button>
          </div>
        </Modal.Body>
      </Modal>

    </div>
  );
};

export default BusinessDashboard;
