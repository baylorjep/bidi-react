import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import '../../App.css';
import UnviewedBids from './UnviewedBids';

function AdminDashboard() {
    const [requestsWithBids, setRequestsWithBids] = useState([]);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unviewed'

    useEffect(() => {
        if (activeTab === 'all') {
            fetchAllRequestsWithBids();
        }
    }, [activeTab]);

    const fetchAllRequestsWithBids = async () => {
        try {
            // Fetch all bids along with their associated request data manually
            const { data: bids, error: bidsError } = await supabase
                .from('bids')
                .select('id, bid_amount, bid_description, status, created_at, request_id, category');

            if (bidsError) throw bidsError;

            // Now manually fetch the related request titles
            const requestPromises = bids.map(async (bid) => {
                let requestTitle = 'Unknown Request';
                if (bid.category === 'generic') {
                    const { data: requestData, error: requestError } = await supabase
                        .from('requests')
                        .select('service_title')
                        .eq('id', bid.request_id)
                        .single();

                    if (!requestError && requestData) {
                        requestTitle = requestData.service_title;
                    }
                } else if (bid.category === 'photography') {
                    const { data: photoData, error: photoError } = await supabase
                        .from('photography_requests')
                        .select('event_title')
                        .eq('id', bid.request_id)
                        .single();

                    if (!photoError && photoData) {
                        requestTitle = photoData.event_title;
                    }
                }

                return {
                    ...bid,
                    request_title: requestTitle,
                };
            });

            // Resolve all promises to get request titles and format them together with bids
            const results = await Promise.all(requestPromises);
            setRequestsWithBids(results);
        } catch (error) {
            setError(`Error fetching requests: ${error.message}`);
            console.error(error);
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center grey-bg content">
            <div className="col-lg-10 remaining-space">
                <h2>Admin Dashboard</h2>
                
                <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            All Bids
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'unviewed' ? 'active' : ''}`}
                            onClick={() => setActiveTab('unviewed')}
                        >
                            Unviewed Bids
                        </button>
                    </li>
                </ul>

                {error && <p className="text-danger">{error}</p>}
                
                {activeTab === 'all' ? (
                    <>
                        {requestsWithBids.length > 0 && requestsWithBids.map((request) => (
                            <div className="request-card mb-4" key={request.id}>
                                <h4>{request.request_title || "Unknown Request"}</h4>
                                <p><strong>Request ID:</strong> {request.request_id}</p>

                                <div>
                                    <h5>Bid Details:</h5>
                                    <p><strong>Bid ID:</strong> {request.id}</p>
                                    <p><strong>Bid Amount:</strong> ${request.bid_amount}</p>
                                    <p><strong>Description:</strong> {request.bid_description}</p>
                                    <p><strong>Status:</strong> {request.status}</p>
                                    <p><strong>Bid Created At:</strong> {new Date(request.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}

                        {requestsWithBids.length === 0 && !error && (
                            <div>
                                <h4>No requests or bids found.</h4>
                                <p>Please check back later.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <UnviewedBids />
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;