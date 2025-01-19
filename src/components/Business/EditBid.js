import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import RequestDisplay from "../Request/RequestDisplay";
import PhotoRequestDisplay from "../Request/PhotoRequestDisplay";

const EditBid = () => {
  const { bidId, requestId } = useParams(); // Get the bidId and requestId from the URL
  const [bidDetails, setBidDetails] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidDescription, setBidDescription] = useState("");
  const navigate = useNavigate();
  const [requestDetails, setRequestDetails] = useState(null);
  const [requestType, setRequestType] = useState(''); // To track the request type
  const [error, setError] = useState('');

  // Fetch bid details
  useEffect(() => {
    const fetchBidDetails = async () => {
      const { data: bidData, error } = await supabase
        .from("bids")
        .select("bid_amount, bid_description")
        .eq("id", bidId)
        .single();

      if (error) {
        console.error("Error fetching bid details:", error);
        return;
      }

      setBidDetails(bidData);
      setBidAmount(bidData.bid_amount);
      setBidDescription(bidData.bid_description);
    };

    fetchBidDetails();
  }, [bidId]);

  // Fetch request details
  useEffect(() => {
    if (!requestId) return; // Don't fetch if no requestId
    const fetchRequestDetails = async () => {
      let { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        const { data: photoData, error: photoError } = await supabase
          .from('photography_requests')
          .select('*')
          .eq('id', requestId)
          .single();

        if (photoError) {
          setError('Error fetching request details');
          return;
        }

        setRequestDetails(photoData);
        setRequestType('photography_requests');
      } else {
        setRequestDetails(data);
        setRequestType('requests');
      }
    };

    fetchRequestDetails();
  }, [requestId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bidAmount || !bidDescription) {
      alert("Please fill in all the fields.");
      return;
    }

    // Update the bid in the database
    const { error } = await supabase
      .from("bids")
      .update({ bid_amount: bidAmount, bid_description: bidDescription })
      .eq("id", bidId);

    if (error) {
      console.error("Error updating bid:", error);
      alert("An error occurred while updating the bid.");
    } else {
      alert("Bid updated successfully!");
      navigate(`/dashboard`); // Redirect to the business dashboard after update
    }
  };

  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="container">
      <h2 className="dashboard-title">Edit Bid</h2>
      {requestDetails ? (
        <>
          {requestType === 'requests' && <RequestDisplay request={requestDetails} hideBidButton={true} />}
          {requestType === 'photography_requests' && <PhotoRequestDisplay photoRequest={requestDetails} hideBidButton={true} />}
        </>
      ) : (
        <p>Loading request details...</p>
      )}

      {bidDetails ? (
        <form onSubmit={handleSubmit}>
          <div className="custom-input-container">
            <input
                type="number"
                id="bidAmount"
                className="custom-input"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                min="0" // Optional: Ensure no negative numbers are input
            />
            <label className='custom-label'htmlFor="bidAmount">Bid Amount</label>
            </div>

          <div className="custom-input-container">
            
            <textarea
              id="bidDescription"
              className="custom-input"
              value={bidDescription}
              style={{ height: "120px" }}
              onChange={(e) => setBidDescription(e.target.value)}
            />
            <label className="custom-label"htmlFor="bidDescription">Bid Description</label>
          </div>

          <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
          <button
                className="btn-primary"
                style={{ marginTop: "20px", textAlign: "center" }}
                onClick={(e) => {
                    e.preventDefault(); // Prevent form submission
                    handleBackClick();
                }}
                >
                Back
                </button>
            <button type="submit" className="btn-secondary" style={{ marginTop: "20px", textAlign: "center" }}>
              Update Bid
            </button>
          </div>
        </form>
      ) : (
        <p>Loading bid details...</p>
      )}
    </div>
  );
};

export default EditBid;
