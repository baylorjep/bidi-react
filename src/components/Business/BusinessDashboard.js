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
  const [bids, setBids] = useState([]); // State to store the bids
  const navigate = useNavigate();
  const [percentage, setPercentage] = useState("");
  const [number, setNumber] = useState("");
  const [paymentType, setPaymentType] = useState(""); // "percentage" or "flat fee"
  const [downPaymentAmount, setDownPaymentAmount] = useState(0);
  const [requestData, setRequestData] = useState(null);
  const [photographyRequestData, setPhotographyRequestData] = useState(null);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch business profile details
        const { data: profile, error: profileError } = await supabase
          .from('business_profiles')
          .select('business_name, stripe_account_id, id')
          .eq('id', user.id)
          .single();
  
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return; // Exit early if there is an error fetching the profile
        }
  
        if (profile) {
          setBusinessName(profile.business_name);
          if (profile.stripe_account_id) {
            setConnectedAccountId(profile.stripe_account_id);
          } else {
            setShowModal(true); // Show modal immediately if no Stripe account is connected
          }
  
          // Fetch current bids for this business
          const { data: bidsData, error: bidsError } = await supabase
            .from('bids')
            .select('bid_amount, id, status, bid_description, request_id, hidden') // Get the request_id for each bid
            .eq('user_id', profile.id) // Only fetch bids for the current business
            .or('hidden.is.false,hidden.is.null'); // This will check for both false and null
  
          if (bidsError) {
            console.error('Error fetching bids:', bidsError);
            return;
          }
  
          // Process each bid and fetch its associated request details
          const bidsWithRequestData = await Promise.all(
            bidsData.map(async (bid) => {
              try {
                // Fetch normal request details
                const { data: request, error: requestError } = await supabase
                  .from('requests')
                  .select('service_title, service_description, service_date, location, additional_comments, price_range, end_date')
                  .eq('id', bid.request_id)
                  .single(); // Assuming one-to-one relation
  
                // Fetch photography request details
                const { data: photographyRequest, error: photographyRequestError } = await supabase
                  .from('photography_requests')
                  .select('event_title, event_type, start_date, end_date, location, num_people, duration, indoor_outdoor, additional_comments')
                  .eq('id', bid.request_id) // Assuming the `request_id` is the link
                  .single(); // Assuming one-to-one relation
  
                if (requestError && photographyRequestError) {
                  console.error('Error fetching requests:', requestError, photographyRequestError);
                }
  
                // Add the relevant request data to the bid
                return {
                  ...bid,
                  service_title: request?.service_title || photographyRequest?.event_title || 'No title',
                  request_type: request ? 'Normal Request' : 'Photography Request', // Indicate the type of request
                  request_data: {
                    // All request data from either the normal request or photography request
                    ...(request || photographyRequest), // This merges the fields from either request type
                  },
                  isDescriptionExpanded: false, // Add description expansion state
                };
              } catch (error) {
                console.error('Error processing bid:', error);
                return bid; // Return the bid as is if there is an error
              }
            })
          );
  
          // Update state with the bids that now have associated request data
          setBids(bidsWithRequestData);
        }
      }
    };
  
    fetchBusinessDetails();
  }, []);
  
  
  // Shorten description to a certain length
  const truncateDescription = (description, length) => {
    if (description.length <= length) return description;
    return description.slice(0, length) + "...";
  };

  // Check if there's more content to view
  const hasMoreContent = (description, length) => {
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
        alert("Down payment details updated successfully!");
      }
    } else {
      alert("Business profile not found. Please make sure your account is set up correctly.");
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
                Request Title: {bid.service_title}
              </h5>
              {bid.request_type === "Normal Request" ? (
                <div>
                  <p><strong>Location:</strong> {bid.request_data?.location}</p>
                  <p><strong>{bid.request_data?.end_date ? 'Start Date' : 'Date'}:</strong> {bid.request_data?.service_date}</p>
                  {bid.request_data?.end_date && (
                    <p><strong>End Date:</strong> {bid.request_data?.end_date}</p>
                  )}
                  <p><strong>Price Range: </strong>{bid.request_data?.price_range}</p>
                  <p className="card-text">
                    {bid.isDescriptionExpanded ? (
                      bid.request_data?.service_description || bid.request_data?.additional_comments
                    ) : (
                      truncateDescription(bid.request_data?.service_description || bid.request_data?.additional_comments, 80)
                    )}
                  </p>
                  {hasMoreContent(bid.request_data?.service_description || bid.request_data?.additional_comments, 80) && (
                    <button
                      className="btn"
                      style={{border:'black solid 1px', borderRadius:'20px'}}
                      onClick={() => handleViewMore(index)}
                    >
                      {bid.isDescriptionExpanded ? "View Less" : "View More"}
                    </button>
                  )}
                    
                </div>
              ) : (
                <div>
                  <p><strong>Event Type: </strong>{bid.request_data?.event_type}</p>
                  <p><strong>{bid.request_data?.end_date ? 'Start Date' : 'Date'}:</strong> {bid.request_data?.start_date}</p>
                   {/* Conditionally render End Date */}
                  {bid.request_data?.end_date && (
                    <p><strong>End Date: </strong>{bid.request_data?.end_date}</p>
                  )}
                  <p><strong>Location: </strong>{bid.request_data?.location}</p>
                  <p><strong>Number of People:</strong> {bid.request_data?.num_people}</p>
                  <p><strong>Duration: </strong>{bid.request_data?.duration}</p>
                  <p className="card-text">
                    {bid.isDescriptionExpanded ? (
                      bid.request_data?.service_description || bid.request_data?.additional_comments
                    ) : (
                      truncateDescription(bid.request_data?.service_description || bid.request_data?.additional_comments, 80)
                    )}
                  </p>
                  {hasMoreContent(bid.request_data?.service_description || bid.request_data?.additional_comments, 80) && (
                    <button
                      className="btn"
                      style={{border:'black solid 1px', borderRadius:'20px'}}
                      onClick={() => handleViewMore(index)}
                    >
                      {bid.isDescriptionExpanded ? "View Less" : "View More"}
                    </button>
                  )}
                </div>
              )}

              {/* Bid Details */}
              <div className="bid-details-dashboard">
                <h4 className="mb-2">Your Bid:</h4>
                <p className="card-text">Amount: ${bid.bid_amount}</p>
                <p className="card-text">Description: {bid.bid_description}</p>
                <p className="card-text">Status: {bid.status}</p>
                <div style={{display:'flex',flexDirection:'row',gap:'10px', justifyContent:'center'}}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleRemoveBid(bid.id)}
                    >
                      Remove
                    </button>
                  <button 
                    className="btn btn-secondary" 
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
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>Do you charge a percentage or a flat fee up front?</div>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '20px', marginBottom:'20px'}}>
            <button
              className={`btn btn-${paymentType === "percentage" ? "primary" : "secondary"}`}
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
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleDownPaymentSubmit}>Submit</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BusinessDashboard;
