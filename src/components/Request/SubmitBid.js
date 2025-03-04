import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../../App.css';
import RequestDisplay from './RequestDisplay'; // Regular request display component
import PhotoRequestDisplay from './PhotoRequestDisplay'; // Photography request display component
import { Modal, Button } from 'react-bootstrap'; // Make sure to install react-bootstrap


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

function SubmitBid({ onClose }) { // Remove request from props since we're fetching it
    const { requestId } = useParams();
    const [requestDetails, setRequestDetails] = useState(null);
    const [requestType, setRequestType] = useState(''); // To track the request type
    const [bidAmount, setBidAmount] = useState('');
    const [bidDescription, setBidDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [eventPhotos, setEventPhotos] = useState([]);
    const [servicePhotos, setServicePhotos] = useState([]);
    const [connectedAccountId, setConnectedAccountId] = useState(null); // To track Stripe account status
    const [Bidi_Plus, setBidiPlus] = useState(null);
    const [showModal, setShowModal] = useState(false); // For showing modal
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchRequestDetails = async () => {
            // Array of all possible request tables
            const requestTables = [
                { name: 'beauty_requests', type: 'beauty' },  // Move beauty_requests to the top
                { name: 'requests', type: 'regular' },
                { name: 'photography_requests', type: 'photography' },
                { name: 'dj_requests', type: 'dj' },
                { name: 'catering_requests', type: 'catering' },
                { name: 'videography_requests', type: 'videography' },
                { name: 'florist_requests', type: 'florist' }
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
                    setRequestType(table.name); // Use table.name instead of table.type
                    break;
                }
            }

            // Add photo fetching for videography requests
            if (requestType === 'videography_requests') {
                const { data: photos, error } = await supabase
                    .from('videography_photos')
                    .select('*')
                    .eq('request_id', requestId);

                if (photos && !error) {
                    setServicePhotos(photos);
                } else {
                    console.error('Error fetching videography photos:', error);
                }
            }
        };

        const fetchStripeStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('business_profiles')
                    .select('stripe_account_id, Bidi_Plus')
                    .eq('id', user.id)
                    .single();

                if (profile?.stripe_account_id) {
                    setConnectedAccountId(profile.stripe_account_id);
                }
                if (profile?.Bidi_Plus) {
                    setBidiPlus(true);
                }
                // Show modal immediately if no Stripe account and no Bidi Plus
                if (!profile?.stripe_account_id && !profile?.Bidi_Plus) {
                    setShowModal(true);
                }
            }
        };

        fetchRequestDetails();
        fetchStripeStatus();
    }, [requestId, requestType]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if user has stripe account or Bidi Plus
        if (!connectedAccountId && !Bidi_Plus) {
            setShowModal(true);
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
                'beauty_requests': 'Beauty'
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
                }]);

            if (insertError) throw insertError;

            const subject = 'New Bid Received';
            const htmlContent = `<p>A new bid has been placed on your request.</p>
                                  <p><strong>Bid Amount:</strong> ${bidAmount}</p>
                                  <p><strong>Description:</strong> ${bidDescription}</p>`;

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
        <div className="container d-flex align-items-center justify-content-center content" style={{marginBottom:"55px"}}>
            <div className="col-lg-6">
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
                
                <form onSubmit={handleSubmit} style={{padding:"20px"}}>
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
                        <textarea
                            className="custom-input"
                            id="bidDescription"
                            name="bidDescription"
                            placeholder="Bid Description"
                            value={bidDescription}
                            onChange={(e) => setBidDescription(e.target.value)}
                            required
                            style={{ height: "160px" }} // Adjust the height as needed
                        />
                        <label className="custom-label"htmlFor="bidDescription">Bid Description</label>
                    </div>

                    <div style={{ display: "flex", flexDirection: "row", justifyContent:'space-between', gap: "12px" }}>
                        <div className="submit-bid-btn-container">
                            <button onClick={handleBack} className="submit-bid-button secondary">
                                Back
                            </button>
                        </div>
                        <div className="submit-bid-btn-container">
                            <button 
                                type="submit" 
                                className="submit-bid-button"
                                disabled={isLoading}
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
                    
                    <br/>
                </form>
            </div>
            {/* Modal for Stripe Account Setup */}
                <Modal show={showModal} onHide={() => setShowModal(false)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <Modal.Header closeButton>
                        <Modal.Title>Stripe Account Setup Required</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="d-flex flex-column align-items-center justify-content-center">
                        <p className="text-center">
                        
                                To start making bids, you’ll need to set up a payment account. Bidi will never charge you to talk to users or bid on jobs — you only pay when you win.
                            
                        </p>
                        <Button className="btn-secondary" onClick={() => navigate("/onboarding")}>
                        Set Up Account
                        </Button>
                    </Modal.Body>
                </Modal>

        </div>
    );
}

export default SubmitBid;
