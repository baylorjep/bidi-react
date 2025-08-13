import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../../App.css';
import RequestDisplay from './RequestDisplay'; // Regular request display component
import PhotoRequestDisplay from './PhotoRequestDisplay'; // Photography request display component
import { Modal, Button } from 'react-bootstrap'; // Make sure to install react-bootstrap
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import BidDisplay from '../Bid/BidDisplay';
import LoadingSpinner from '../LoadingSpinner';


const sendEmailNotification = async (recipientEmail, subject, htmlContent) => {
    try {
        await fetch('https://bidi-express.vercel.app/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recipientEmail, subject, htmlContent }),
        });
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

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
const isMobile = window.innerWidth <= 600;


function SubmitBid({ onClose }) { // Remove request from props since we're fetching it
    const { requestId } = useParams();
    const [requestDetails, setRequestDetails] = useState(null);
    const [requestType, setRequestType] = useState(''); // To track the request type
    const [bidAmount, setBidAmount] = useState('');
    const [bidDescription, setBidDescription] = useState('');
    const [bidExpirationDate, setBidExpirationDate] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [eventPhotos, setEventPhotos] = useState([]);
    const [servicePhotos, setServicePhotos] = useState([]);
    const [connectedAccountId, setConnectedAccountId] = useState(null); // To track Stripe account status
    const [Bidi_Plus, setBidiPlus] = useState(null);
    const [showModal, setShowModal] = useState(false); // For showing modal
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [bidTemplate, setBidTemplate] = useState('');
    const [bidDescriptionError, setBidDescriptionError] = useState('');
    const [defaultExpirationDays, setDefaultExpirationDays] = useState(null);
    const [discountType, setDiscountType] = useState(''); // 'percentage' or 'flat'
    const [discountValue, setDiscountValue] = useState('');
    const [discountDeadline, setDiscountDeadline] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [businessProfile, setBusinessProfile] = useState(null);
    const [profileImage, setProfileImage] = useState("/images/default.jpg");
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
    const [bidStats, setBidStats] = useState({ min: null, max: null, avg: null });

useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth <= 600);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

useEffect(() => {
  const fetchBidStats = async () => {
    try {
      const { data: bids, error } = await supabase
        .from('bids')
        .select('bid_amount')
        .eq('request_id', requestId);

      if (error) throw error;

      if (bids && bids.length > 0) {
        const amounts = bids.map(bid => parseFloat(bid.bid_amount));
        setBidStats({
          min: Math.min(...amounts),
          max: Math.max(...amounts),
          avg: amounts.reduce((a, b) => a + b, 0) / amounts.length
        });
      }
    } catch (error) {
      console.error('Error fetching bid statistics:', error);
    }
  };

  fetchBidStats();
}, [requestId]);

    useEffect(() => {
        const fetchRequestDetails = async () => {
            // Get current business user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Array of all possible request tables
            const requestTables = [
                { name: 'beauty_requests', type: 'beauty' },
                { name: 'requests', type: 'regular' },
                { name: 'photography_requests', type: 'photography' },
                { name: 'dj_requests', type: 'dj' },
                { name: 'catering_requests', type: 'catering' },
                { name: 'videography_requests', type: 'videography' },
                { name: 'florist_requests', type: 'florist' },
                { name: 'wedding_planning_requests', type: 'wedding planning' }
            ];

            let foundTable = null;
            let foundData = null;

            // Try each table until we find the request
            for (const table of requestTables) {
                const { data, error } = await supabase
                    .from(table.name)
                    .select('*')
                    .eq('id', requestId)
                    .single();

                if (data && !error) {
                    console.log('Found request in table:', table.name);
                    console.log('Request data:', data);
                    foundTable = table.name;
                    foundData = data;
                    break;
                }
            }

            if (foundTable && foundData) {
                // Add table_name to the request data
                setRequestDetails({ ...foundData, table_name: foundTable });
                setRequestType(foundTable);

                // Check if view already exists
                const { data: existingView } = await supabase
                    .from('request_views')
                    .select('id')
                    .eq('request_id', requestId)
                    .eq('request_type', foundTable)
                    .eq('business_id', user.id)
                    .single();

                // Only record view if it doesn't exist
                if (!existingView) {
                    const { error: viewError } = await supabase
                        .from('request_views')
                        .insert([{
                            request_id: requestId,
                            request_type: foundTable,
                            business_id: user.id
                        }]);

                    if (viewError) {
                        console.error('Error recording view:', viewError);
                    }
                }

                // Add photo fetching for videography and wedding planning requests
                if (foundTable === 'videography_requests' || foundTable === 'wedding_planning_requests') {
                    const photoTable = foundTable === 'videography_requests' ? 'videography_photos' : 'wedding_planning_photos';
                    const { data: photos, error } = await supabase
                        .from(photoTable)
                        .select('*')
                        .eq('request_id', requestId);

                    if (photos && !error) {
                        setServicePhotos(photos);
                    } else {
                        console.error(`Error fetching ${foundTable} photos:`, error);
                    }
                }
            }
        };
        

        const fetchStripeStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('business_profiles')
                    .select('stripe_account_id, Bidi_Plus, default_expiration_days')
                    .eq('id', user.id)
                    .single();

                if (profile?.stripe_account_id) {
                    setConnectedAccountId(profile.stripe_account_id);
                }
                if (profile?.Bidi_Plus) {
                    setBidiPlus(true);
                }
                if (profile?.default_expiration_days) {
                    setDefaultExpirationDays(profile.default_expiration_days);
                    // Set the default expiration date based on the number of days
                    const expirationDate = new Date();
                    expirationDate.setDate(expirationDate.getDate() + profile.default_expiration_days);
                    setBidExpirationDate(expirationDate.toISOString().split('T')[0]);
                }
                // Show modal immediately if no Stripe account and no Bidi Plus
                if (!profile?.stripe_account_id && !profile?.Bidi_Plus) {
                    setShowModal(true);
                }
            }
        };

        const fetchBidTemplate = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('business_profiles')
                    .select('bid_template')
                    .eq('id', user.id)
                    .single();

                if (profile?.bid_template) {
                    setBidTemplate(profile.bid_template);
                    setBidDescription(profile.bid_template); // Pre-fill the description with the template
                }
            }
        };

        fetchRequestDetails();
        fetchStripeStatus();
        fetchBidTemplate();
    }, [requestId]);

    useEffect(() => {
        const fetchBusinessProfile = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
      
          // Fetch business profile
          const { data: profile } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
      
          if (profile) setBusinessProfile(profile);
      
          // Fetch profile image
          const { data: photo } = await supabase
            .from('profile_photos')
            .select('photo_url')
            .eq('user_id', user.id)
            .eq('photo_type', 'profile')
            .single();
      
          if (photo && photo.photo_url) setProfileImage(photo.photo_url);
        };
      
        fetchBusinessProfile();
      }, [requestId]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if user has stripe account or Bidi Plus
        if (!connectedAccountId && !Bidi_Plus) {
            setShowModal(true);
            return;
        }

        // Validate bid description
        if (!validateBidDescription(bidDescription)) {
            return;
        }

        setIsLoading(true);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) {
                setError('You need to be signed in to place a bid.');
                setIsLoading(false);
                return;
            }

            // Map request type to category
            const categoryMap = {
                'requests': 'General',
                'photography_requests': 'Photography',
                'dj_requests': 'DJ',
                'catering_requests': 'Catering',
                'videography_requests': 'Videography',
                'florist_requests': 'Florist',
                'beauty_requests': 'Beauty',
                'wedding_planning_requests': 'Wedding Planning'
            };

            const category = categoryMap[requestType] || 'General';

            // First, insert the bid
            const { data: bidData, error: insertError } = await supabase
                .from('bids')
                .insert([{
                    request_id: requestId,
                    user_id: user.id,
                    bid_amount: bidAmount,
                    bid_description: bidDescription,
                    category: category,
                    ...(bidExpirationDate && { expiration_date: bidExpirationDate }),
                    discount_type: discountType || null,
                    discount_value: discountType ? discountValue : null,
                    discount_deadline: discountType ? discountDeadline : null,
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            // Get the request details to find the user who made the request
            const requestUserId = requestDetails.user_id || requestDetails.profile_id;
            
            if (requestUserId) {
                // Create an initial message from the bid description
                const { error: messageError } = await supabase
                    .from('messages')
                    .insert([{
                        sender_id: user.id,
                        receiver_id: requestUserId,
                        message: `💼 **New Bid: $${bidAmount}**\n\n${bidDescription}`,
                        type: 'text',
                        seen: false,
                        bid_id: bidData.id, // Link message to the bid
                        is_bid_message: true // Flag to identify bid-related messages
                    }]);

                if (messageError) {
                    console.error('Error creating bid message:', messageError);
                    // Don't throw here as the bid was already created successfully
                }
            }

            const subject = 'New Bid Received';
            const htmlContent = `<p>A new bid has been placed on your request.</p>
                                  <p><strong>Bid Amount:</strong> ${bidAmount}</p>
                                  <p><strong>Description:</strong> ${bidDescription}</p>
                                  <p><strong>Expires:</strong> ${new Date(bidExpirationDate).toLocaleDateString()}</p>`;

            await sendEmailNotification('savewithbidi@gmail.com', subject, htmlContent);
            setSuccess('Bid successfully placed!');
            navigate('/bid-success');
        } catch (err) {
            setError(`Error placing bid: ${err.message}`);
        }

        setIsLoading(false);
    };

    const handleBack = () => {
        navigate(-1); // This takes the user back to the previous page
    };

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
                    <BidDisplay bid={previewBid} showActions={false} isIndividualUser={false} />
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
            <div className="container d-flex align-items-center justify-content-center"
            
            style={{
                marginBottom: "55px",
                flexDirection: 'column', // Add this
                display: 'flex',         // Ensure display is flex
                width: '100%'            // Optional: full width
              }}>
                <div style={{
                    width:'100%', 
                    alignItems:'center', 
                    justifyContent:'center', 
                    display:'flex',
                    flexDirection:'column', 
                    padding:"20px", 
                    maxWidth:'1000px'
                }}>
                    <RequestDisplay
                        request={requestDetails}
                        servicePhotos={servicePhotos}
                        hideBidButton={true}
                        requestType={requestType}
                        loading={isLoading || (!requestDetails && !error)}
                    />
                </div>
                
                <div style={{padding:"20px"}}>
                    {bidStats.min !== null && (
                        <div style={{
                            background: 'white',
                            padding: '20px',
                            borderRadius: '12px',
                            marginBottom: '24px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            border: '1px solid #eee'
                        }}>
                            <h4 style={{ 
                                margin: '0 0 16px 0', 
                                color: '#9633eb',
                                fontSize: '18px',
                                fontWeight: '600'
                            }}>Current Bid Statistics</h4>
                            <div style={{ 
                                display: 'flex', 
                                gap: '32px', 
                                flexWrap: 'wrap',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{
                                    background: '#faf5ff',
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    border: '1px solid #f0e6ff',
                                    flex: '1',
                                    minWidth: '200px'
                                }}>
                                    <div style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>Minimum Bid</div>
                                    <div style={{ color: '#9633eb', fontSize: '20px', fontWeight: '600' }}>${bidStats.min.toFixed(2)}</div>
                                </div>
                                <div style={{
                                    background: '#faf5ff',
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    border: '1px solid #f0e6ff',
                                    flex: '1',
                                    minWidth: '200px'
                                }}>
                                    <div style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>Average Bid</div>
                                    <div style={{ color: '#9633eb', fontSize: '20px', fontWeight: '600' }}>${bidStats.avg.toFixed(2)}</div>
                                </div>
                                <div style={{
                                    background: '#faf5ff',
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    border: '1px solid #f0e6ff',
                                    flex: '1',
                                    minWidth: '200px'
                                }}>
                                    <div style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>Maximum Bid</div>
                                    <div style={{ color: '#9633eb', fontSize: '20px', fontWeight: '600' }}>${bidStats.max.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="custom-input-container">
                            <input
                                className="custom-input"
                                id="bidAmount"
                                name="bidAmount"
                                type="number"
                                placeholder="Bid Price"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                required
                            />
                        <label className="custom-label"htmlFor="bidAmount">Bid Price</label>
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

                        {/* Discount Feature Section */}
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
                        
                        <div className="custom-input-container" style={{ marginBottom: '80px' }}>
                            {bidDescriptionError && (
                                <div className="alert alert-warning" role="alert">
                                    {bidDescriptionError.split('\n').map((line, index) => (
                                        <div key={index}>{line}</div>
                                    ))}
                                </div>
                            )}
                            <div style={{ marginBottom: '12px' }}>
                                <label className="custom-label">Bid Description & Initial Message</label>
                                <small style={{ color: '#888', display: 'block', marginTop: 4 }}>
                                    This will be your first message to the client. Be detailed and engaging to start a great conversation!
                                </small>
                            </div>
                            <ReactQuill
                                theme="snow"
                                value={bidDescription}
                                onChange={handleBidDescriptionChange}
                                modules={modules}
                                formats={formats}
                                style={{ 
                                    height: '400px',
                                    marginBottom: '20px',
                                    backgroundColor: 'white'
                                }}
                                placeholder="Write a detailed message introducing your services, experience, and why you're the perfect fit for this project. This will start the conversation with the client..."
                            />
                        </div>
                    </form>

                    <div style={{ 
                        display: "flex", 
                        flexDirection: "row", 
                        justifyContent: 'space-between', 
                        gap: "12px",
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '15px',
                        backgroundColor: 'white',
                        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
                        zIndex: 1000,
                        '@media (max-width: 350px)': {
                            flexDirection: 'column',
                            gap: '8px',
                            padding: '10px'
                        }
                    }}>
                        <div className="submit-bid-btn-container" style={{ 
                            flex: 1,
                            '@media (max-width: 350px)': {
                                width: '100%'
                            }
                        }}>
                            <button 
                                onClick={handleBack} 
                                className="submit-bid-button secondary"
                                style={{
                                    padding: '8px 12px',
                                    fontSize: '14px',
                                    '@media (max-width: 350px)': {
                                        padding: '10px',
                                        fontSize: '13px'
                                    }
                                }}
                            >
                                Back
                            </button>
                        </div>
                        <div className="submit-bid-btn-container" style={{ 
                            flex: 1,
                            '@media (max-width: 350px)': {
                                width: '100%'
                            }
                        }}>
                            <button 
                                type="submit" 
                                className="submit-bid-button"
                                disabled={isLoading}
                                onClick={handleSubmit}
                                style={{
                                    padding: '8px 12px',
                                    fontSize: '14px',
                                    '@media (max-width: 350px)': {
                                        padding: '10px',
                                        fontSize: '13px'
                                    }
                                }}
                            >
                                {isLoading ? (
                                    <div className="d-flex align-items-center">
                                        <LoadingSpinner variant="clip" color="white" size={16} />
                                        <span className="ms-2">Submitting...</span>
                                    </div>
                                ) : (
                                    'Submit Bid'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                {/* Modal for Stripe Account Setup */}
                <Modal show={showModal} onHide={() => setShowModal(false)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <Modal.Header closeButton>
                        <Modal.Title>Stripe Account Setup Required</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="d-flex flex-column align-items-center justify-content-center">
                    <p className="text-center">
                    To place bids and get paid for jobs you win, you'll need to set up a payment account. Bidi won't charge you to talk to users or bid — a small fee is only deducted after you've been paid.
                    </p>
                        <Button className="btn-secondary" onClick={() => navigate("/stripe-setup")}>
                            Set Up Account
                        </Button>
                    </Modal.Body>
                </Modal>
            </div>
        </>
    );
}

export default SubmitBid;
