import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../../App.css';
import RequestDisplay from './RequestDisplay'; // Regular request display component
import PhotoRequestDisplay from './PhotoRequestDisplay'; // Photography request display component

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

function SubmitBid() {
    const { requestId } = useParams();
    const [requestDetails, setRequestDetails] = useState(null);
    const [requestType, setRequestType] = useState(''); // To track the request type
    const [bidAmount, setBidAmount] = useState('');
    const [bidDescription, setBidDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

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

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            setError('You need to be signed in to place a bid.');
            return;
        }

        let insertError;
        const subject = 'New Bid Received';
        const htmlContent = `<p>A new bid has been placed on your request.</p>
                            <p><strong>Bid Amount:</strong> ${bidAmount}</p>
                            <p><strong>Description:</strong> ${bidDescription}</p>`;

        if (requestType === 'requests') {
            // Insert into the regular bids table
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
            // Insert into the photography bids table
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
                {requestDetails && (
                    <>
                        {requestType === 'requests' && <RequestDisplay request={requestDetails} hideBidButton={true} />}
                        {requestType === 'photography_requests' && <PhotoRequestDisplay photoRequest={requestDetails} hideBidButton={true} />}
                    </>
                )}
                <form onSubmit={handleSubmit}>
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

                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "16px" }}>
                        <div className="submit-bid-btn-container">
                            <button onClick={handleBack} className="submit-bid-button btn btn-primary rounded-pill">
                                Back
                            </button>
                        </div>
                        <div className="submit-bid-btn-container">
                            <button type="submit" className="submit-bid-button btn btn-secondary rounded-pill">
                                Submit Bid
                            </button>
                        </div>
                    </div>
                    
                    <br/>
                </form>
            </div>
        </div>
    );
}

export default SubmitBid;
