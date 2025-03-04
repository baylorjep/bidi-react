import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import '../../App.css';

function MyRequests() {
    const [requests, setRequests] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequests = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                setError('User not found');
                return;
            }

            // Fetch both regular requests and photography requests
            const [regularRequests, photoRequests] = await Promise.all([
                supabase
                    .from('requests')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('photography_requests')
                    .select('*')
                    .eq('profile_id', user.id)
                    .order('created_at', { ascending: false })
            ]);

            if (regularRequests.error) {
                console.error('Error fetching regular requests:', regularRequests.error);
                setError(regularRequests.error.message);
                return;
            }

            if (photoRequests.error) {
                console.error('Error fetching photo requests:', photoRequests.error);
                setError(photoRequests.error.message);
                return;
            }

            // Combine and format the requests
            const formattedRequests = [
                ...regularRequests.data.map(req => ({
                    ...req,
                    type: 'regular',
                    status: req.open ? 'open' : 'closed',
                    date: new Date(req.created_at).toLocaleDateString()
                })),
                ...photoRequests.data.map(req => ({
                    ...req,
                    type: 'photography',
                    date: new Date(req.created_at).toLocaleDateString()
                }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setRequests(formattedRequests);
        };

        fetchRequests();
    }, []);

    const toggleRequestStatus = async (request) => {
        try {
            if (request.type === 'photography') {
                const newStatus = request.status === 'open' ? 'closed' : 'open';
                const { error } = await supabase
                    .from('photography_requests')
                    .update({ status: newStatus })
                    .eq('id', request.id);
                
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('requests')
                    .update({ open: !request.open })
                    .eq('id', request.id);
                
                if (error) throw error;
            }

            // Update local state
            setRequests(requests.map(req => {
                if (req.id === request.id) {
                    return {
                        ...req,
                        status: req.status === 'open' ? 'closed' : 'open',
                        open: !req.open
                    };
                }
                return req;
            }));

        } catch (error) {
            console.error('Error toggling request status:', error);
            setError('Failed to update request status');
        }
    };

    const handleEdit = (request) => {
        // Navigate to edit page with request data
        navigate(`/edit-request/${request.type}/${request.id}`);
    };

    const getRequestStatus = (request) => {
        const now = new Date();
        const createdDate = new Date(request.created_at);
        const diffInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        
        if (request.status === 'closed' || !request.open) {
            return 'closed';
        }
        
        if (diffInDays <= 7) {
            return 'receiving-bids';
        }
        
        return 'open';
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'receiving-bids':
                return 'gradient-badge';  // New custom class
            case 'open':
                return 'bg-success';
            case 'closed':
                return 'bg-secondary';
            default:
                return 'bg-primary';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'receiving-bids':
                return 'Receiving Bids';
            case 'open':
                return 'Open';
            case 'closed':
                return 'Closed';
            default:
                return status;
        }
    };

    return (
        <div className="container px-5 d-flex align-items-center " style={{flexDirection: 'column', minHeight: '80vh'}}>
            <div className='Sign-Up-Page-Header'>My Requests</div>
            {error && <p className="text-danger">{error}</p>}
            
            {requests.length > 0 ? (
                <div className="w-100">
                    {requests.map((request, index) => {
                        const requestStatus = getRequestStatus(request);
                        return (
                            <div key={index} className="card mb-3">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="card-title">
                                            {request.type === 'photography' ? request.event_title : request.service_title}
                                        </h5>
                                        <span className={`badge ${getStatusBadgeClass(requestStatus)}`} style={{height: '56px', width: '120px', display:'flex', alignItems:'center',justifyContent:'center', fontSize:'14px',fontWeight:'bold', borderRadius:'30px'}} >
                                            {getStatusText(requestStatus)}
                                        </span>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <p className="mb-1">
                                                <strong>Type:</strong> {request.type === 'photography' ? 'Photography Request' : request.service_type}
                                            </p>
                                            <p className="mb-1">
                                                <strong>Location:</strong> {request.location}
                                            </p>
                                            <p className="mb-1">
                                                <strong>Budget:</strong> {request.price_range}
                                            </p>
                                        </div>
                                        <div className="col-md-6">
                                            <p className="mb-1">
                                                <strong>Date:</strong> {
                                                    request.type === 'photography' 
                                                        ? new Date(request.start_date).toLocaleDateString()
                                                        : new Date(request.service_date).toLocaleDateString()
                                                }
                                            </p>
                                            {request.end_date && (
                                                <p className="mb-1">
                                                    <strong>End Date:</strong> {new Date(request.end_date).toLocaleDateString()}
                                                </p>
                                            )}
                                            <p className="mb-1">
                                                <strong>Time:</strong> {request.time_of_day}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <strong>Description:</strong>
                                        <p className="card-text">
                                            {request.type === 'photography' ? request.event_description : request.service_description}
                                        </p>
                                    </div>
                                    <div className="text-muted mb-3">
                                        Requested on: {request.date}
                                    </div>
                                    <div className="d-flex gap-2">

                                        <button 
                                            className="btn-danger flex-fill"
                                            onClick={() => handleEdit(request)}
            
                                        >
                                            Edit Request
                                        </button>
                                        <button 
                                            className="btn-success flex-fill"
                                            onClick={() => toggleRequestStatus(request)}
                                        >
                                            {request.status === 'open' ? 'Close Request' : 'Reopen Request'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className='submit-form-2nd-header' style={{padding: "20px"}}>
                    <div style={{borderBottom: "1px solid black", padding: "20px"}}>
                        You haven't made any requests yet.
                    </div>
                    <div className='Sign-Up-Page-Header' style={{padding: "32px"}}>Ready to get started?</div>
                    <Link to="/request-categories">
                        <button className='landing-page-button'>Make a Request</button>
                    </Link>
                </div>
            )}
        </div>
    );
}

export default MyRequests;
