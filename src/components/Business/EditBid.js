import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import RequestDisplay from "../Request/RequestDisplay";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const EditBid = () => {
  const { bidId, requestId } = useParams();
  const [bidDetails, setBidDetails] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidDescription, setBidDescription] = useState("");
  const navigate = useNavigate();
  const [requestDetails, setRequestDetails] = useState(null);
  const [requestType, setRequestType] = useState('');
  const [error, setError] = useState('');

  // Fetch bid details and request details
  useEffect(() => {
    const fetchDetails = async () => {
      // Fetch bid details
      const { data: bidData, error: bidError } = await supabase
        .from("bids")
        .select("*")
        .eq("id", bidId)
        .single();

      if (bidError) {
        console.error("Error fetching bid details:", bidError);
        return;
      }

      setBidDetails(bidData);
      setBidAmount(bidData.bid_amount);
      setBidDescription(bidData.bid_description);

      // Try to fetch from each request table
      const tables = [
        { name: 'dj_requests', type: 'dj_requests' },
        { name: 'catering_requests', type: 'catering_requests' },
        { name: 'beauty_requests', type: 'beauty_requests' },
        { name: 'florist_requests', type: 'florist_requests' },
        { name: 'photography_requests', type: 'photography_requests' },
        { name: 'videography_requests', type: 'videography_requests' },
        { name: 'requests', type: 'regular' }
      ];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .eq('id', requestId)
          .single();

        if (data) {
          setRequestDetails(data);
          setRequestType(table.type);
          break;
        }
      }
    };

    fetchDetails();
  }, [bidId, requestId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bidAmount || !bidDescription) {
      alert("Please fill in all the fields.");
      return;
    }

    const { error } = await supabase
      .from("bids")
      .update({ bid_amount: bidAmount, bid_description: bidDescription })
      .eq("id", bidId);

    if (error) {
      console.error("Error updating bid:", error);
      alert("An error occurred while updating the bid.");
    } else {
      alert("Bid updated successfully!");
      navigate(`/dashboard`);
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link'
  ];

  return (
    <div className="container">
      <h2 className="dashboard-title">Edit Bid</h2>
      {requestDetails && (
        <RequestDisplay 
          request={requestDetails} 
          requestType={requestType}
          hideBidButton={true} 
        />
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
              min="0"
            />
            <label className='custom-label' htmlFor="bidAmount">Bid Amount</label>
          </div>

          <div className="custom-input-container" style={{ marginTop: '20px' }}>
            <label className="custom-label" style={{ marginBottom: '10px' }}>Bid Description</label>
            <ReactQuill
              theme="snow"
              value={bidDescription}
              onChange={setBidDescription}
              modules={modules}
              formats={formats}
              style={{ height: '200px', marginBottom: '50px' }}
            />
          </div>

          <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
            <button
              className="btn-primary"
              style={{ marginTop: "20px", textAlign: "center", width: '100%' }}
              onClick={(e) => {
                e.preventDefault();
                handleBackClick();
              }}
            >
              Back
            </button>
            <button 
              type="submit" 
              className="btn-secondary" 
              style={{ marginTop: "20px", textAlign: "center" }}
            >
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
