import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import RequestDisplay from "../Request/RequestDisplay";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import BidDisplay from '../Bid/BidDisplay';

const EditBid = () => {
  const { bidId, requestId } = useParams();
  const [bidDetails, setBidDetails] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidDescription, setBidDescription] = useState("");
  const navigate = useNavigate();
  const [requestDetails, setRequestDetails] = useState(null);
  const [requestType, setRequestType] = useState('');
  const [error, setError] = useState('');
  const [bidDescriptionError, setBidDescriptionError] = useState('');
  const [bidExpirationDate, setBidExpirationDate] = useState('');
  const [discountType, setDiscountType] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountDeadline, setDiscountDeadline] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [profileImage, setProfileImage] = useState('/images/default.jpg');

  const validateBidDescription = (content) => {
    // Simple regex patterns for basic contact info
    const phoneRegex = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const linkRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g;
    
    // Check for specific social media terms
    const socialMediaTerms = /\b(?:IG|instagram|FB|facebook)\b/i;

    // Check if the content contains any of these
    const hasPhone = phoneRegex.test(content);
    const hasEmail = emailRegex.test(content);
    const hasLink = linkRegex.test(content);
    const hasSocialMedia = socialMediaTerms.test(content);

    // If we found any of these, show an error
    if (hasPhone || hasEmail || hasLink || hasSocialMedia) {
      let errorMessage = "Please remove the following from your bid:";
      if (hasPhone) errorMessage += "\n- Phone numbers";
      if (hasEmail) errorMessage += "\n- Email addresses";
      if (hasLink) errorMessage += "\n- Website links";
      if (hasSocialMedia) errorMessage += "\n- Social media references (IG, Instagram, FB, Facebook)";
      errorMessage += "\n\nAll contact information should be managed through your Bidi profile.";
      setBidDescriptionError(errorMessage);
      return false;
    }

    setBidDescriptionError('');
    return true;
  };

  const handleBidDescriptionChange = (content) => {
    setBidDescription(content);
    validateBidDescription(content);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch business profile and image for preview
  useEffect(() => {
    const fetchBusinessProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profile) setBusinessProfile(profile);
      const { data: photo } = await supabase
        .from('profile_photos')
        .select('photo_url')
        .eq('user_id', user.id)
        .eq('photo_type', 'profile')
        .single();
      if (photo && photo.photo_url) setProfileImage(photo.photo_url);
    };
    fetchBusinessProfile();
  }, []);

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
      setBidExpirationDate(bidData.expiration_date || '');
      setDiscountType(bidData.discount_type || '');
      setDiscountValue(bidData.discount_value || '');
      setDiscountDeadline(bidData.discount_deadline || '');
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

  const previewBid = {
    bid_amount: bidAmount || 0,
    discount_type: discountType || null,
    discount_value: discountType ? discountValue : null,
    discount_deadline: discountType ? discountDeadline : null,
    bid_description: bidDescription || '',
    expiration_date: bidExpirationDate || null,
    business_profiles: businessProfile
      ? { ...businessProfile, profile_image: profileImage }
      : {
          business_name: "Your Business Name",
          profile_image: "/images/default.jpg",
          id: "preview-business-id"
        },
    status: "pending"
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bidAmount || !bidDescription) {
      alert("Please fill in all the fields.");
      return;
    }
    if (!validateBidDescription(bidDescription)) {
      return;
    }
    const { error } = await supabase
    .from("bids")
    .update({
      bid_amount: bidAmount,
      bid_description: bidDescription,
      expiration_date: bidExpirationDate || null,
      discount_type: discountType || null,
      discount_value: discountType ? discountValue : null,
      discount_deadline: discountType ? discountDeadline : null,
      last_edited_at: new Date().toISOString(), // <-- add this line
    })
    .eq("id", bidId);
    if (error) {
      console.error("Error updating bid:", error);
      alert("An error occurred while updating the bid.");
    } else {
      alert("Bid updated successfully!");
      navigate(`/business-dashboard`);
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
    <>
      {showPreview && (
        <div
          onClick={() => setShowPreview(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.15)',
            zIndex: 1999
          }}
        />
      )}
      <div
        style={{
          position: 'fixed',
          top: isMobile ? (showPreview ? 0 : '100vh') : 0,
          right: isMobile ? 0 : (showPreview ? 0 : '-420px'),
          left: isMobile ? 0 : 'auto',
          width: isMobile ? '100vw' : 400,
          height: '100vh',
          background: '#fff',
          boxShadow: isMobile ? '0 -2px 12px rgba(0,0,0,0.12)' : '-2px 0 12px rgba(0,0,0,0.12)',
          zIndex: 2000,
          transition: isMobile
            ? 'top 0.3s cubic-bezier(.4,0,.2,1)'
            : 'right 0.3s cubic-bezier(.4,0,.2,1)',
          padding: isMobile ? '16px 8px' : '32px 24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: isMobile ? '16px 16px 0 0' : 0,
        }}
      >
        <button
          onClick={() => setShowPreview(false)}
          style={{
            position: 'absolute',
            top: isMobile ? 8 : 12,
            right: isMobile ? 12 : 16,
            background: 'none',
            border: 'none',
            fontSize: isMobile ? 32 : 24,
            color: '#9633eb',
            cursor: 'pointer',
            zIndex: 2101
          }}
          aria-label="Close Preview"
        >
          ×
        </button>
        <h4 style={{ textAlign: 'center', color: '#9633eb', marginBottom: 24 }}>Bid Preview</h4>
        <div className="request-display" style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
          <BidDisplay bid={previewBid} showActions={false} />
        </div>
      </div>
      {!showPreview && (
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          style={{
            position: 'fixed',
            top: isMobile ? 20 : '40%',
            left: isMobile ? '50%' : 'unset',
            transform: isMobile ? 'translateX(-50%)' : 'none',
            right: isMobile ? 'unset' : 0,
            bottom: isMobile ? 'unset' : undefined,
            width: isMobile ? '90vw' : 'auto',
            maxWidth: isMobile ? 400 : undefined,
            zIndex: 2100,
            background: '#9633eb',
            color: '#fff',
            border: 'none',
            borderRadius: isMobile ? 12 : '20px',
            padding: isMobile ? '18px' : '12px 18px',
            fontWeight: 600,
            fontSize: isMobile ? 18 : 16,
            boxShadow: '-2px 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            margin: isMobile ? '0 auto' : undefined
          }}
        >
          Preview Bid
        </button>
      )}
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
            <div className="custom-input-container">
              <input
                className="custom-input"
                id="bidExpirationDate"
                name="bidExpirationDate"
                type="date"
                value={bidExpirationDate}
                onChange={(e) => setBidExpirationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <label className="custom-label" htmlFor="bidExpirationDate">Bid Expiration Date</label>
            </div>
            <div className="custom-input-container" style={{ marginBottom: 12 }}>
              <label className="custom-label" htmlFor="discountType">Optional: Limited-Time Discount</label>
              <small style={{ color: '#888', display: 'block', marginBottom: 6 }}>
                You can offer a special discount if the client books within a certain number of days. This will show a slashed price and a message to the client, encouraging them to book quickly.
              </small>
              <select
                className="custom-input"
                id="discountType"
                value={discountType}
                onChange={e => setDiscountType(e.target.value)}
              >
                <option value="">No Discount</option>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat ($)</option>
              </select>
            </div>
            {discountType && (
              <div className="custom-input-container">
                <input
                  className="custom-input"
                  id="discountValue"
                  name="discountValue"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={discountType === 'percentage' ? "Discount (%)" : "Discount ($)"}
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  required
                />
                <label className="custom-label" htmlFor="discountValue">
                  {discountType === 'percentage' ? "Discount Percentage" : "Discount Amount"}
                </label>
                <small style={{ color: '#888', display: 'block', marginTop: 4 }}>
                  {discountType === 'percentage'
                    ? 'Enter the percent off (e.g. 10 for 10% off the price)'
                    : 'Enter the dollar amount off (e.g. 50 for $50 off the price)'}
                </small>
              </div>
            )}
            {discountType && (
              <div className="custom-input-container">
                <input
                  className="custom-input"
                  id="discountDeadline"
                  name="discountDeadline"
                  type="date"
                  value={discountDeadline}
                  onChange={e => setDiscountDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                <label className="custom-label" htmlFor="discountDeadline">Discount Deadline</label>
                <small style={{ color: '#888', display: 'block', marginTop: 4 }}>
                  The last day this discount is available if the client books. After this date, the regular price will apply.
                </small>
              </div>
            )}
            <div className="custom-input-container" style={{ marginTop: '20px', marginBottom: '80px' }}>
              <label className="custom-label" style={{ marginBottom: '10px' }}>Bid Description</label>
              {bidDescriptionError && (
                <div className="alert alert-warning" role="alert">
                  {bidDescriptionError.split('\n').map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              )}
              <ReactQuill
                theme="snow"
                value={bidDescription}
                onChange={handleBidDescriptionChange}
                modules={modules}
                formats={formats}
                style={{ height: '200px', marginBottom: '50px', backgroundColor: 'white' }}
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
    </>
  );
};

export default EditBid;
