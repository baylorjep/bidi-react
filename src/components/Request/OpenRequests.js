import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import RequestDisplayMini from './RequestDisplayMini';
import '../../App.css';
import SearchBar from '../SearchBar/SearchBar';

function OpenRequests() {
    const [openRequests, setOpenRequests] = useState([]);
    const [openPhotoRequests, setOpenPhotoRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [userBids, setUserBids] = useState(new Set()); // Add this new state

    // Add this new function to fetch user's bids
    const fetchUserBids = async (userId) => {
        const { data: bids, error } = await supabase
            .from('bids')
            .select('request_id')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching user bids:', error);
            return;
        }

        // Create a Set of request_ids that the user has already bid on
        return new Set(bids.map(bid => bid.request_id));
    };

    useEffect(() => {
        const fetchUserBusinessType = async () => {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData) {
                setError('Error fetching user information.');
                console.error(userError);
                return;
            }

            // Fetch user's bids first
            const userBidsSet = await fetchUserBids(userData.user.id);
            setUserBids(userBidsSet);

            const { data: profileData, error: profileError } = await supabase
                .from('business_profiles')
                .select('business_category')
                .eq('id', userData.user.id)
                .single();

            if (profileError || !profileData) {
                setError('Error fetching business profile.');
                console.error(profileError);
                return;
            }

            setBusinessType(profileData.business_category);
        };

        fetchUserBusinessType();
    }, []);

    const isNew = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        return diffInDays < 7;
    };

    const checkPromotion = (createdAt) => {
        if (!createdAt) return null;
        
        const created = new Date(createdAt);
        const specialDates = [
            new Date('2025-01-11'),
            new Date('2025-01-25')
        ];
        
        const isSpecialDate = specialDates.some(date => 
            created.getFullYear() === date.getFullYear() &&
            created.getMonth() === date.getMonth() &&
            created.getDate() === date.getDate()
        );

        if (!isSpecialDate) return null;

        const now = new Date();
        const diffInMinutes = Math.floor((now - created) / (1000 * 60));
        
        if (diffInMinutes <= 30) return "Only Pay 6%";
        if (diffInMinutes <= 60) return "Only Pay 7%";
        return null;
    };

    useEffect(() => {
        if (!businessType) return;

        const fetchRequests = async () => {
            try {
                console.log('Fetching requests for business type:', businessType);
                
                const [
                    { data: photoRequests, error: photoError },
                    { data: djRequests, error: djError },
                    { data: cateringRequests, error: cateringError },
                    { data: beautyRequests, error: beautyError },
                    { data: videoRequests, error: videoError },
                    { data: floristRequests, error: floristError },
                    { data: legacyRequests, error: legacyError }
                ] = await Promise.all([
                    supabase
                        .from('photography_requests')
                        .select('*, created_at, date_flexibility, date_timeframe, start_date, end_date')
                        .in('status', ['pending', 'open'])
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('dj_requests')
                        .select('*, created_at, date_flexibility, date_timeframe, start_date, end_date')
                        .in('status', ['pending', 'open']) // Ensure status filter is correct
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('catering_requests')
                        .select('*, created_at, date_flexibility, date_timeframe, start_date, end_date')
                        .in('status', ['pending', 'open'])
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('beauty_requests')
                        .select('*, created_at, date_flexibility, date_timeframe, start_date, end_date')
                        .in('status', ['pending', 'open'])
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('videography_requests')
                        .select('*, created_at, date_flexibility, date_timeframe, start_date, end_date')
                        .in('status', ['pending', 'open'])
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('florist_requests')
                        .select('*, created_at, date_flexibility, date_timeframe, start_date, end_date')
                        .in('status', ['pending', 'open'])
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('requests')
                        .select('*, created_at, service_date as start_date, service_date as end_date')
                        .eq('open', true)
                        .order('created_at', { ascending: false })
                ]);

                // Add error logging for new tables
                if (photoError) console.error('Photo request error:', photoError);
                if (djError) console.error('DJ request error:', djError);
                if (cateringError) console.error('Catering request error:', cateringError);
                if (beautyError) console.error('Beauty request error:', beautyError);
                if (videoError) console.error('Video request error:', videoError);
                if (floristError) console.error('Florist request error:', floristError);
                if (legacyError) console.error('Legacy request error:', legacyError);

                // Log the fetched data
                console.log('Fetched DJ Requests:', djRequests);
                console.log('Fetched Catering Requests:', cateringRequests);
                console.log('Fetched Photo Requests:', photoRequests);

                // Process requests based on business type
                const processedRequests = {
                    'dj': djRequests?.map(req => ({
                        ...req,
                        table_name: 'dj_requests',
                        service_title: req.title || `${req.event_type} DJ Request`, // title is the correct field
                        price_range: req.budget_range, // budget_range is the correct field
                        service_date: req.start_date // start_date is the correct field
                    })) || [],
                    'catering': cateringRequests?.map(req => ({
                        ...req,
                        table_name: 'catering_requests',
                        service_title: req.title || req.event_title || `${req.event_type} Catering Request`, // Handle both title formats
                        price_range: req.budget_range || req.price_range, // Handle both price field names
                        service_date: req.start_date || req.date // Handle both date field names
                    })) || [],
                    'beauty': beautyRequests?.map(req => ({
                        ...req,
                        table_name: 'beauty_requests',
                        service_title: req.event_title || `${req.event_type} Beauty Request`,
                        price_range: req.price_range,
                        service_date: req.start_date
                    })) || [],
                    'videography': videoRequests?.map(req => ({
                        ...req,
                        table_name: 'videography_requests',
                        service_title: req.event_title || `${req.event_type} Video Request`,
                        price_range: req.price_range,
                        service_date: req.start_date
                    })) || [],
                    'florist': floristRequests?.map(req => ({
                        ...req,
                        table_name: 'florist_requests',
                        service_title: req.event_title || `${req.event_type} Florist Request`,
                        price_range: req.price_range,
                        service_date: req.start_date
                    })) || [],
                    'photography': photoRequests || [],
                    'legacy': legacyRequests || []
                };

                console.log('Processed requests:', processedRequests);

                // Add debug logging for business type
                console.log('Current business type:', businessType);
                console.log('Lowercase business type:', businessType?.toLowerCase());
                console.log('Available DJ requests:', processedRequests.dj);
                console.log('Available Catering requests:', processedRequests.catering);

                // Update state based on business type (case-insensitive)
                const businessTypeLC = businessType?.toLowerCase() || '';
                switch(true) {
                    case businessTypeLC.includes('photography'):
                        console.log('Setting photography requests:', processedRequests.photography);
                        setOpenPhotoRequests(processedRequests.photography);
                        setOpenRequests([]);
                        break;
                    case businessTypeLC.includes('dj'):
                        console.log('Setting DJ requests:', processedRequests.dj);
                        setOpenRequests(processedRequests.dj);
                        setOpenPhotoRequests([]);
                        break;
                    case businessTypeLC.includes('catering'):
                        console.log('Setting Catering requests:', processedRequests.catering);
                        setOpenRequests(processedRequests.catering);
                        setOpenPhotoRequests([]);
                        break;
                    case businessTypeLC.includes('videography'):
                        setOpenRequests(processedRequests.videography);
                        setOpenPhotoRequests([]);
                        break;
                    case businessTypeLC.includes('beauty'):
                        setOpenRequests(processedRequests.beauty);
                        setOpenPhotoRequests([]);
                        break;
                    case businessTypeLC.includes('florist'):
                        setOpenRequests(processedRequests.florist);
                        setOpenPhotoRequests([]);
                        break;
                    default:
                        // Combine all requests
                        const allRequests = [
                            ...processedRequests.legacy,
                            ...processedRequests.dj,
                            ...processedRequests.catering,
                            ...processedRequests.beauty,
                            ...processedRequests.videography,
                            ...processedRequests.florist
                        ].map(req => ({
                            ...req,
                            requestType: 'regular'
                        }));

                        setOpenRequests(allRequests);
                        setOpenPhotoRequests(processedRequests.photography);
                }

            } catch (error) {
                console.error('Error in fetchRequests:', error);
                setError(`Error fetching requests: ${error.message}`);
            }
        };

        fetchRequests();
    }, [businessType]);

    return (
        <div className="request-grid-container">
            <div className="request-grid">
                {error && <p>Error: {error}</p>}

                {/* Update the rendering logic */}
                {businessType?.toLowerCase() === 'photography' ? (
                    openPhotoRequests
                        .filter(request => !userBids.has(request.id))
                        .map(request => (
                            <RequestDisplayMini 
                                key={`photo-${request.id}`}
                                request={request}
                                isPhotoRequest={true}
                            />
                        ))
                ) : businessType && ['cake', 'catering'].includes(businessType.toLowerCase()) ? (
                    openRequests
                        .filter(request => !userBids.has(request.id))
                        .map(request => (
                            <RequestDisplayMini 
                                key={`regular-${request.id}`}
                                request={request}
                                isPhotoRequest={false}
                            />
                        ))
                ) : (
                    [...openRequests, ...openPhotoRequests]
                        .filter(request => !userBids.has(request.id))
                        .sort((a, b) => {
                            const aIsNew = isNew(a.created_at);
                            const bIsNew = isNew(b.created_at);
                            if (aIsNew && !bIsNew) return -1;
                            if (!aIsNew && bIsNew) return 1;
                            return new Date(b.created_at) - new Date(a.created_at);
                        })
                        .map((request) => (
                            <RequestDisplayMini 
                                key={`${request.event_title ? 'photo' : 'regular'}-${request.id}`}
                                request={request}
                                isPhotoRequest={Boolean(request.event_title)}
                            />
                        ))
                )}

                {openRequests.length === 0 && openPhotoRequests.length === 0 && (
                    <div>
                        <h2>No open requests found.</h2>
                        <p>Please check again later.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OpenRequests;