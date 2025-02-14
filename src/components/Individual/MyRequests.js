import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import '../../App.css';
import RequestDisplayMini from '../Request/RequestDisplayMini';

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

            // Fetch requests from all tables
            const [
                { data: regularRequests, error: regularError },
                { data: photoRequests, error: photoError },
                { data: djRequests, error: djError },
                { data: cateringRequests, error: cateringError },
                { data: beautyRequests, error: beautyError },
                { data: videoRequests, error: videoError },
                { data: floristRequests, error: floristError }
            ] = await Promise.all([
                supabase
                    .from('requests')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('photography_requests')
                    .select('*')
                    .eq('profile_id', user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('dj_requests')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('catering_requests')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('beauty_requests')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('videography_requests')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('florist_requests')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
            ]);

            if (regularError) {
                console.error('Error fetching regular requests:', regularError);
                setError(regularError.message);
                return;
            }

            if (photoError) {
                console.error('Error fetching photo requests:', photoError);
                setError(photoError.message);
                return;
            }

            if (djError) {
                console.error('Error fetching DJ requests:', djError);
                setError(djError.message);
                return;
            }

            if (cateringError) {
                console.error('Error fetching catering requests:', cateringError);
                setError(cateringError.message);
                return;
            }

            if (beautyError) {
                console.error('Error fetching beauty requests:', beautyError);
                setError(beautyError.message);
                return;
            }

            if (videoError) {
                console.error('Error fetching video requests:', videoError);
                setError(videoError.message);
                return;
            }

            if (floristError) {
                console.error('Error fetching florist requests:', floristError);
                setError(floristError.message);
                return;
            }

            // Combine and format the requests
            const formattedRequests = [
                ...regularRequests.map(req => ({
                    ...req,
                    type: 'regular',
                    status: req.status || (req.open ? 'open' : 'closed'),
                    date: new Date(req.created_at).toLocaleDateString()
                })),
                ...photoRequests.map(req => ({
                    ...req,
                    type: 'photography',
                    status: req.status || (req.open ? 'open' : 'closed'),
                    date: new Date(req.created_at).toLocaleDateString()
                })),
                ...djRequests.map(req => ({
                    ...req,
                    type: 'dj',
                    status: req.status || (req.open ? 'open' : 'closed'),
                    date: new Date(req.created_at).toLocaleDateString()
                })),
                ...cateringRequests.map(req => ({
                    ...req,
                    type: 'catering',
                    status: req.status || (req.open ? 'open' : 'closed'),
                    date: new Date(req.created_at).toLocaleDateString()
                })),
                ...beautyRequests.map(req => ({
                    ...req,
                    type: 'beauty',
                    status: req.status || (req.open ? 'open' : 'closed'),
                    date: new Date(req.created_at).toLocaleDateString()
                })),
                ...videoRequests.map(req => ({
                    ...req,
                    type: 'videography',
                    status: req.status || (req.open ? 'open' : 'closed'),
                    date: new Date(req.created_at).toLocaleDateString()
                })),
                ...floristRequests.map(req => ({
                    ...req,
                    type: 'florist',
                    status: req.status || (req.open ? 'open' : 'closed'),
                    date: new Date(req.created_at).toLocaleDateString()
                }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setRequests(formattedRequests);
        };

        fetchRequests();
    }, []);

    const toggleRequestStatus = async (request) => {
        try {
            const tableMap = {
                'regular': 'requests',
                'photography': 'photography_requests',
                'dj': 'dj_requests',
                'catering': 'catering_requests',
                'beauty': 'beauty_requests',
                'videography': 'videography_requests',
                'florist': 'florist_requests'
            };

            const tableName = tableMap[request.type];
            const newStatus = request.status === 'open' ? 'closed' : 'open';

            const { error } = await supabase
                .from(tableName)
                .update({ status: newStatus })
                .eq('id', request.id);

            if (error) throw error;

            // Update local state
            setRequests(requests.map(req => {
                if (req.id === request.id) {
                    return {
                        ...req,
                        status: newStatus,
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

    return (
        <div className="container px-5 d-flex align-items-center " style={{flexDirection: 'column', minHeight: '80vh'}}>
            <div className='Sign-Up-Page-Header'>My Requests</div>
            {error && <p className="text-danger">{error}</p>}
            
            {requests.length > 0 ? (
                <div className="w-100">
                    {requests.map((request, index) => (
                        <div key={index} className="card mb-3">
                            <div className="card-body">
                                <RequestDisplayMini 
                                    request={request} 
                                    hideBidButton={true} 
                                    isPhotoRequest={request.type === 'photography'} 
                                />
                                <div className="d-flex gap-2 mt-3">
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
                    ))}
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
