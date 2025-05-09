import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../../App.css';
import RequestDisplay from './RequestDisplay'; // Regular request display component
import PhotoRequestDisplay from './PhotoRequestDisplay'; // Photography request display component
import { Modal, Button } from 'react-bootstrap'; // Make sure to install react-bootstrap
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';


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

    useEffect(() => {
        const fetchRequestDetails = async () => {
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
                    
                    // Add table_name to the request data
                    setRequestDetails({ ...data, table_name: table.name });
                    setRequestType(table.name);
                    break;
                }
            }

            // Add photo fetching for videography and wedding planning requests
            if (requestType === 'videography_requests' || requestType === 'wedding_planning_requests') {
                const photoTable = requestType === 'videography_requests' ? 'videography_photos' : 'wedding_planning_photos';
                const { data: photos, error } = await supabase
                    .from(photoTable)
                    .select('*')
                    .eq('request_id', requestId);

                if (photos && !error) {
                    setServicePhotos(photos);
                } else {
                    console.error(`Error fetching ${requestType} photos:`, error);
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
    }, [requestId, requestType]);

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

            const { error: insertError } = await supabase
                .from('bids')
                .insert([{
                    request_id: requestId,
                    user_id: user.id,
                    bid_amount: bidAmount,
                    bid_description: bidDescription,
                    category: category,
                    ...(bidExpirationDate && { expiration_date: bidExpirationDate }),
                }]);

            if (insertError) throw insertError;

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

    return (
        <div className="container d-flex align-items-center justify-content-center" style={{marginBottom:"55px"}}>
            <div>
                <br/>
                <div className="Sign-Up-Page-Header" style={{ textAlign: 'center' }}>Place Your Bid</div>
                {error && <p className="text-danger">{error}</p>}
                {success && <p className="text-success">{success}</p>}
                <div style={{
                width:'100%', 
                alignItems:'center', 
                justifyContent:'center', 
                display:'flex',
                flexDirection:'column', 
                padding:"20px", 
                maxWidth:'1000px'
            }}>
                {requestDetails && (
                    <RequestDisplay 
                        request={requestDetails}
                        servicePhotos={servicePhotos}
                        hideBidButton={true}
                        requestType={requestType}
                    />
                )}
            </div>
                
                <div style={{padding:"20px"}}>
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
                        <div className="custom-input-container" style={{ marginBottom: '80px' }}>
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
                                style={{ 
                                    height: '400px',
                                    marginBottom: '20px',
                                    backgroundColor: 'white'
                                }}
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
                                {isLoading && (
                                    <span 
                                        className="spinner-border spinner-border-sm text-light" 
                                        role="status" 
                                        aria-hidden="true"
                                    ></span>
                                )}
                                {isLoading ? 'Submitting...' : 'Submit Bid'}
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
                    To place bids and get paid for jobs you win, you’ll need to set up a payment account. Bidi won’t charge you to talk to users or bid — a small fee is only deducted after you’ve been paid.
                    </p>
                        <Button className="btn-secondary" onClick={() => navigate("/onboarding")}>
                            Set Up Account
                        </Button>
                    </Modal.Body>
                </Modal>
            </div>
        </div>
    );
}

export default SubmitBid;
