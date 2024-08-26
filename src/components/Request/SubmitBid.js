import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../../App.css';
import RequestDisplay from './RequestDisplay'; // Import the RequestDisplay component

function SubmitBid() {
    const { requestId } = useParams();
    const [requestDetails, setRequestDetails] = useState(null); 
    const [bidAmount, setBidAmount] = useState('');
    const [bidDescription, setBidDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequestDetails = async () => {
            const { data, error } = await supabase
                .from('requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (error) {
                setError('Error fetching request details');
            } else {
                setRequestDetails(data);
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

        const { data, error } = await supabase
            .from('bids')
            .insert([
                {
                    bid_amount: bidAmount,
                    bid_description: bidDescription,
                    request_id: requestId, 
                    user_id: user.id,
                },
            ]);

        if (error) {
            setError(`Error placing bid: ${error.message}`);
        } else {
            setSuccess('Bid successfully placed!');
            navigate('/bid-success');
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center grey-bg content">
            <div className="col-lg-6">
                <br/>
                <h2 style={{ textAlign: 'center' }}>Place Your Bid</h2>
                {error && <p className="text-danger">{error}</p>}
                {success && <p className="text-success">{success}</p>}
                {requestDetails && (
                    <RequestDisplay request={requestDetails} hideBidButton={true} />
                )}
                <form onSubmit={handleSubmit}>
                    <div className="form-floating mb-3">
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
                    <div className="form-floating mb-3">
                        <textarea
                            className="form-control"
                            id="bidDescription"
                            name="bidDescription"
                            placeholder="Bid Description"
                            value={bidDescription}
                            onChange={(e) => setBidDescription(e.target.value)}
                            required
                        />
                        <label htmlFor="bidDescription">Bid Description</label>
                    </div>
                    <div className="d-grid">
                        <button type="submit" className="btn btn-secondary btn-lg w-100">Submit Bid</button>
                    </div>
                    <br/>
                </form>
            </div>
        </div>
    );
}

export default SubmitBid;
