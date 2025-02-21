import React, { useState, useEffect } from "react";
import StripeDashboardButton from "../Stripe/StripeDashboardButton";
import { supabase } from "../../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import '../../App.css'; // Include this for custom styles
import { Modal, Button } from 'react-bootstrap'; // Make sure to install react-bootstrap
import dashboardIcon from '../../assets/images/Icons/dashboard.svg';
import thumbsUpIcon from '../../assets/images/Icons/thumbs-up.svg';
import thumbsDownIcon from '../../assets/images/Icons/thumbs-down.svg';
import clockIcon from '../../assets/images/Icons/clock.svg';
import profilePic from '../../assets/images/Profile-Picture.svg'; // This will need to be changed to pull actual profile picture!
import verifiedCheckIcon from '../../assets/images/Icons/verified-check.svg';
import bidsIcon from '../../assets/images/Icons/bids.svg';
import messageIcon from '../../assets/images/Icons/message.svg';
import paymentIcon from '../../assets/images/Icons/payment.svg';
import settingsIcon from '../../assets/images/Icons/settings.svg';
import { format } from "date-fns";
import MessagingView from "../Messaging/MessagingView";

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
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [deniedCount, setDeniedCount] = useState(0);
  const [requests, setRequests] = useState([]); // Stores service requests
  const [BidiPlus, setBidiPlus] = useState(null);  // New state for storing profile
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    const fetchBusinessDetailsRequestsAndBids = async () => {
        console.log("Fetching Business Details, Requests, and Bids...");

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
            console.error("Error fetching user:", userError);
            return;
        }

        if (!user) {
            console.error("No user found.");
            return;
        }

        // Fetch business profile details
        const { data: profile, error: profileError } = await supabase
            .from('business_profiles')
            .select('business_name, business_category, stripe_account_id, id, down_payment_type, amount, Bidi_Plus')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error("Error fetching profile:", profileError);
            return;
        }

        if (profile) {
            setBusinessName(profile.business_name || "Business Name Not Found");

            if (profile.stripe_account_id) {
                setConnectedAccountId(profile.stripe_account_id);
            }

            setBidiPlus(profile.Bidi_Plus ? true : false);

            // Fetch bids and count Pending, Approved, Denied
            const { data: bidsData, error: bidsError } = await supabase
                .from('bids')
                .select('bid_amount, id, status, bid_description, request_id, hidden') // Get the request_id for each bid
                .eq('user_id', profile.id) // Only fetch bids for the current business
                .or('hidden.is.false,hidden.is.null'); // This will check for both false and null

            if (bidsError) {
                console.error("Error fetching bids:", bidsError);
                return;
            }

            // Count bid statuses dynamically
            const counts = { pending: 0, approved: 0, denied: 0 };
            bidsData.forEach((bid) => {
                if (bid.status === "pending") counts.pending += 1;
                else if (bid.status === "accepted") counts.approved += 1;
                else if (bid.status === "denied") counts.denied += 1;
            });
            console.log(counts)

            setPendingCount(counts.pending);
            setApprovedCount(counts.approved);
            setDeniedCount(counts.denied);

            // Fetch service requests including time_of_day
            if (profile.business_category) {
                const { data: requestsData, error: requestsError } = await supabase
                    .from("requests")
                    .select("*")
                    .eq('service_category', profile.business_category);

                if (requestsError) {
                    console.error("Error fetching requests:", requestsError);
                    return;
                }

                setRequests(requestsData); // Store requests in state
            } else {
                console.warn("No business category found for this profile.");
                setRequests([]); // Ensure no stale requests remain
            }
        }
    };

    fetchBusinessDetailsRequestsAndBids();
}, []);



const formatDate = (dateString) => {
  if (!dateString) return "TBD"; // Handle missing date
  try {
    return format(new Date(dateString), "MMM d, yyyy"); // "MMM" gives short month
  } catch (error) {
    console.error("Invalid date format:", dateString);
    return "Invalid Date";
  }
};
  
  
  // Shorten description to a certain length
  const truncateText = (text, maxLength, linelength) => {
    if (!text) return "N/A";

    if (text.length <= maxLength) return text;

    // Find the last space within the linelength limit
    let spaceIndex = text.lastIndexOf(' ', linelength);

    // If there's no space within linelength, cut at linelength
    if (spaceIndex === -1) {
        return text.substring(0, linelength) + "...";
    }

    return text.substring(0, maxLength) + "...";
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
      }
    } else {
      alert("Business profile not found. Please make sure your account is set up correctly.");
    }
  };

  const formatBusinessName = (name) => {
    if (!name) return "Your Business";

    const maxLength = 20;
    if (name.length > maxLength) {
        const words = name.split(" ");
        let currentLine = "";
        let formattedName = [];

        words.forEach((word) => {
            if ((currentLine + word).length > maxLength) {
                formattedName.push(currentLine.trim());
                currentLine = word + " ";
            } else {
                currentLine += word + " ";
            }
        });

        formattedName.push(currentLine.trim());
        let sVisible = ""
        if (!BidiPlus) {
          sVisible = "hidden"; // Hide if false or null
        }
        return (
          <span>
          {formattedName.map((line, index) => (
            <span key={index}>
              {line} {index === formattedName.length - 1 && BidiPlus && (
                <img src={verifiedCheckIcon} alt="Verified Check" className="verified-icon" />
              )}
              <br />
            </span>
          ))}
        </span>
        );
    }

    return name;
};



  return (
    <div className="business-dashboard text-left">
      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="profile-section">
            <img src={profilePic} alt="Profile" className="profile-pic" />
            {BidiPlus && <div className="verified-badge">Verified</div>}
            <h4 className="profile-name">
              <span className="business-name-under-picture">{formatBusinessName(businessName)}</span>
            </h4>
          </div>
          <ul className="sidebar-links">
            <li onClick={() => navigate("/Dashboard")} style={{ cursor: "pointer" }}>
              <img src={dashboardIcon} alt="Dashboard" />
              <span>Dashboard</span>
            </li>
            <li onClick={() => navigate("/Open-Requests")} style={{ cursor: "pointer" }}>
              <img src={bidsIcon} alt="Bids" />
              <span>Bids</span>
            </li>
            <li onClick={() => setActiveSection("messages")} style={{ cursor: "pointer" }}>
              <img src={messageIcon} alt="Message" />
              <span>Message</span>
            </li>
            <li style={{ cursor: connectedAccountId ? "default" : "pointer" }}>
              {connectedAccountId ? (
                <StripeDashboardButton accountId={connectedAccountId} />
              ) : (
                <button onClick={() => navigate("/onboarding")} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <img src={paymentIcon} alt="Payment" />
                  <span>Payment</span>
                </button>
              )}
            </li>
            <li onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
              <img src={settingsIcon} alt="Settings" />
              <span>Settings</span>
            </li>
          </ul>
          <br></br><br></br>
          {!BidiPlus && <div className="upgrade-box">
            <p>Upgrade to <strong>PRO</strong> to get access to all features!</p>
          </div>}
        </aside>

        {/* Main Dashboard */}
        <main className="dashboard-main">
        
          {activeSection === "messages" ? <MessagingView /> : (
            <>
            
        
          <section className="dashboard-header">
            {/* Left Section */}
            <div className="dashboard-header-left">
              <span className="dashboard-title">My Dashboard</span>
              <span className="dashboard-subtext">
                Welcome! Manage your bids and track your business performance all in one place
              </span>
              <button className="see-all-btn" onClick={() => navigate("/Open-Requests")}>See All ↗</button>
            </div>

            {/* Right Section (Stats) */}
            <div className="dashboard-stats">
              <div className="stat">
                  <span>
                      <img src={clockIcon} alt="Pending" className="status-icon" />
                      <span className="stat-number">{pendingCount}</span>  
                  </span>
                  <span className="stat-subtext">Pending</span>
              </div>
              <div className="stat">
                  <span>
                      <img src={thumbsUpIcon} alt="Approved" className="status-icon" />
                      <span className="stat-number">{approvedCount}</span>  
                  </span>
                  <span className="stat-subtext">Approved</span>
              </div>
              <div className="stat">
                  <span>
                      <img src={thumbsDownIcon} alt="Denied" className="status-icon" />
                      <span className="stat-number">{deniedCount}</span>  
                  </span>
                  <span className="stat-subtext">Denied</span>
              </div>
          </div>
          </section>

          {/* Job Listings */}
          <section className="job-listings">
            {/* Section Header */}
            <div className="job-listings-header">
              <span className="job-title">Jobs for you</span>
              <span className="job-subtext">See the requests that you haven't bid on!</span>
            </div>

            {/* Job Cards Grid */}
            <div className="job-cards">
              {requests.length > 0 ? (
                requests.map((request, index) => (
                  <div key={index} className="job-card">
                    <h3 className="truncate">{truncateText(request.service_title, 20)}</h3>

                    {/* Price, Date, Time */}
                      <div className="job-info-row">
                        <div className="job-info-container price-range">
                          <span className="job-label">Price Range</span>
                          <span className="job-value">{truncateText(request.price_range, 20)}</span>
                        </div>
                        <div className="job-info-container date">
                          <span className="job-label">Date</span>
                          <span className="job-value">{formatDate(request.service_date)}</span>
                        </div>
                        <div className="job-info-container time">
                          <span className="job-label">Time</span>
                          <span className="job-value">{truncateText(request.time_of_day, 15)}</span>
                        </div>
                      </div>

                      {/* Location & Hours Needed */}
                      <div className="job-location-hours">
                        <div className="job-info-container">
                          <span className="job-label">Location</span>
                          <span className="job-value">{truncateText(request.location, 30, 6)}</span>
                        </div>
                        <div className="job-info-container">
                          <span className="job-label">Hours Needed</span>
                          <span className="job-value">{request.hours_needed || "Unknown"}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="job-description">
                        <span className="job-label">Description</span>
                        <p className="job-value">{truncateText(request.additional_comments, 50, 15)}</p>
                      </div>
                                            <Link to={`/submit-bid/${request.id}`} style={{textDecoration:'none'}}>
                                              <button className="view-btn">View</button>
                                            </Link>
                  </div>
                  ))
              ) : (
                <p className="no-jobs">No available jobs at this time.</p>
              )}
            </div>

          </section>
          
          </>
        )}
        </main>
      </div>

{/* 
    
      <h1 className="dashboard-title">Your Business Hub {businessName}!</h1>

      <div className="edit-profile-container">
          Manage your Bids, track performance, and connect with clients seamlessly in one powerful Dashboard
      </div>

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
        </div>
      </div>

      {/* Bids Section */}
      {/* <div className="container">
  <h3>Your Active Bids</h3>
  <div className="row">
    {bids.length > 0 ? (
      bids.map((bid, index) => (
        <div key={bid.id} className="col-lg-4 col-md-6 col-sm-12 mb-3">
          <div className="card">
            <div className="card-body"> */}
              {/* Request Details */}
              {/* <h5 className="card-title">
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
                      truncateText(bid.request_data?.service_description || bid.request_data?.additional_comments, 80)
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
                  <p><strong>{bid.request_data?.end_date ? 'Start Date' : 'Date'}:</strong> {bid.request_data?.start_date}</p> */}
                   {/* Conditionally render End Date */}
                  {/* {bid.request_data?.end_date && (
                    <p><strong>End Date: </strong>{bid.request_data?.end_date}</p>
                  )}
                  <p><strong>Location: </strong>{bid.request_data?.location}</p>
                  <p><strong>Number of People:</strong> {bid.request_data?.num_people}</p>
                  <p><strong>Duration: </strong>{bid.request_data?.duration}</p>
                  <p className="card-text">
                    {bid.isDescriptionExpanded ? (
                      bid.request_data?.service_description || bid.request_data?.additional_comments
                    ) : (
                      truncateText(bid.request_data?.service_description || bid.request_data?.additional_comments, 80)
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
              )} */}

              {/* Bid Details */}
              {/* <div className="bid-details-dashboard">
                <h4 className="mb-2">Your Bid:</h4>
                <p className="card-text">Amount: ${bid.bid_amount}</p>
                <p className="card-text">Description: {bid.bid_description}</p>
                <p className="card-text">Status: {bid.status}</p>
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
</div> */}


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
          <button  style={{maxHeight:'32px'}}className="btn-primary"onClick={() => setShowModal(false)}>Close</button>
          <button  style={{maxHeight:'32px'}}className="btn-secondary" onClick={handleDownPaymentSubmit}>Submit</button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BusinessDashboard;