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
            // First, try fetching from the `requests` table
            let { data, error } = await supabase    
                .from('requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (error) {
                // If not found, try the `photography_requests` table
                const { data: photoData, error: photoError } = await supabase
                    .from('photography_requests')
                    .select('*')
                    .eq('id', requestId)
                    .single();

                if (photoError) {
                    setError('Error fetching request details');
                    return;
                }

                // Fetch associated event photos
                const { data: photos, error: photosError } = await supabase
                    .from('event_photos')
                    .select('*')
                    .eq('request_id', photoData.id); // Use the photo request's ID directly

                if (!photosError) {
                    console.log("Fetched photos:", photos);
                    console.log("Request ID:", requestId);
                    setEventPhotos(photos);
                } else {
                    console.error("Error fetching photos:", photosError);
                }

                setRequestDetails(photoData);
                setRequestType('photography_requests');
            } else {
                // Fetch associated service photos
                const { data: photos, error: photosError } = await supabase
                    .from('service_photos')
                    .select('*')
                    .eq('request_id', data.id);

                if (!photosError) {
                    console.log("Fetched service photos:", photos);
                    setServicePhotos(photos);
                } else {
                    console.error("Error fetching service photos:", photosError);
                }

                setRequestDetails(data);
                setRequestType('requests');
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
                if (profile.Bidi_Plus) {
                    setBidiPlus(true);
                }
            }
        };

        fetchRequestDetails();
        fetchStripeStatus();
    }, [requestId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!connectedAccountId && !Bidi_Plus) {
            setShowModal(true); // Show modal if no Stripe account is connected
            return;
        }
    
        setIsLoading(true); // Start loading
    
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
    
        if (userError || !user) {
            setError('You need to be signed in to place a bid.');
            setIsLoading(false);
            return;
        }
    
        let insertError;
        const subject = 'New Bid Received';
        const htmlContent = `<p>A new bid has been placed on your request.</p>
                              <p><strong>Bid Amount:</strong> ${bidAmount}</p>
                              <p><strong>Description:</strong> ${bidDescription}</p>`;
    
        if (requestType === 'requests') {
            const { error } = await supabase
                .from('bids')
                .insert([
                    {
                        request_id: requestId,
                        user_id: user.id,
                        bid_amount: bidAmount,
                        bid_description: bidDescription,
                        category: 'General',
                    },
                ]);
            insertError = error;
        } else if (requestType === 'photography_requests') {
            const { error } = await supabase
                .from('bids')
                .insert([
                    {
                        request_id: requestId,
                        user_id: user.id,
                        bid_amount: bidAmount,
                        bid_description: bidDescription,
                        category: 'Photography',
                    },
                ]);
            insertError = error;
        }
    
        if (!insertError) {
            await sendEmailNotification('savewithbidi@gmail.com', subject, htmlContent); // Send to user email
            setSuccess('Bid successfully placed!');
            navigate('/bid-success');
        } else {
            setError(`Error placing bid: ${insertError.message}`);
        }
    
        setIsLoading(false); // End loading
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
                    <>
                        {requestType === 'requests' && <RequestDisplay request={requestDetails} servicePhotos={servicePhotos} hideBidButton={true} created_at={requestDetails.created_at} />}
                        {requestType === 'photography_requests' && (
                            <PhotoRequestDisplay 
                                photoRequest={requestDetails} 
                                event_photos={eventPhotos}
                                hideBidButton={true} 
                            />
                        )}
                    </>
                )}
            </div>
                
                <form onSubmit={handleSubmit} style={{padding:"20px"}}>
                    <div className="form-floating request-form mb-3">
                        <input
                            className="form-control"
                            id="bidAmount"
                            name="bidAmount"
                            type="number"
                            placeholder="Bid Price"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            required
                        />
                        <label htmlFor="bidAmount">Bid Price</label>
                    </div>
                    <div className="form-floating request-form mb-3">
                        <textarea
                            className="form-control"
                            id="bidDescription"
                            name="bidDescription"
                            placeholder="Bid Description"
                            value={bidDescription}
                            onChange={(e) => setBidDescription(e.target.value)}
                            required
                            style={{ height: "160px" }} // Adjust the height as needed
                        />
                        <label htmlFor="bidDescription">Bid Description</label>
                    </div>

                    <div style={{ display: "flex", flexDirection: "row", justifyContent:'space-between', gap: "12px" }}>
                        <div className="submit-bid-btn-container">
                            <button onClick={handleBack} className="submit-bid-button btn btn-primary rounded-pill">
                                Back
                            </button>
                        </div>
                        <div className="submit-bid-btn-container">
                            <button 
                                type="submit" 
                                className="submit-bid-button btn btn-secondary rounded-pill d-flex align-items-center justify-content-center gap-2"
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

        </div>
    );
}

export default SubmitBid;
