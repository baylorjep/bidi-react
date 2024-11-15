import React, { useState, useEffect } from "react";
import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import '../../App.css'; // Include this for custom styles
import { Modal, Button } from 'react-bootstrap'; // Make sure to install react-bootstrap

const BusinessDashboard = () => {
  const [connectedAccountId, setConnectedAccountId] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [showModal, setShowModal] = useState(false); // For showing modal
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('business_profiles')
          .select('business_name, stripe_account_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          setBusinessName(profile.business_name);
          if (profile.stripe_account_id) {
            setConnectedAccountId(profile.stripe_account_id);
          } else {
            setShowModal(true); // Show modal immediately if no Stripe account is connected
          }
        }
      }
    };

    fetchBusinessDetails();
  }, []);

  // Function to handle the "View Requests" button click
  const handleViewRequests = () => {
    if (!connectedAccountId) {
      //setShowModal(true); // Show modal if Stripe is not set up
      navigate("/open-requests");
    } else {
      navigate("/open-requests"); // Navigate to requests if Stripe is set up
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
              onClick={handleViewRequests} // Updated to conditionally show modal
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
        </div>
      </div>

      {/* Modal for Stripe Account Setup 
<Modal show={showModal} onHide={() => setShowModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Stripe Account Setup Required</Modal.Title>
  </Modal.Header>
  <Modal.Body className="d-flex flex-column align-items-center justify-content-center">
    <p className="text-center">
    
            To start making bids, you’ll need to set up a payment account. Bidi will never charge you to talk to users or bid on jobs — you only pay when you win.
        
    </p>
    <Button variant="primary" onClick={() => navigate("/onboarding")} className="mt-3">
      Set Up Account
    </Button>
  </Modal.Body>
</Modal>
*/}
    </div>
  );
};

export default BusinessDashboard;
