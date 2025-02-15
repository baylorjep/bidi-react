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
                const validCategories = [
                    'photography', 'videography', 'dj', 'catering', 
                    'florist', 'hair and makeup artist', 'beauty'
                ];

                // Check if current business type is in valid categories
                const isValidCategory = validCategories.includes(businessType.toLowerCase());

                if (isValidCategory) {
                    // Existing logic for specific categories
                    const serviceCategory = {
                        'photography': 'photography',
                        'dj': 'dj',
                        'catering': 'catering',
                        'hair and makeup artist': 'beauty',
                        'beauty': 'beauty',
                        'videography': 'videography',
                        'florist': 'florist'
                    }[businessType?.toLowerCase()];

                    const [specificTableData, legacyRequestsData] = await Promise.all([
                        supabase
                            .from(`${serviceCategory}_requests`)
                            .select('*, created_at, date_flexibility, date_timeframe, start_date, end_date')
                            .in('status', ['pending', 'open'])
                            .order('created_at', { ascending: false }),
                        supabase
                            .from('requests')
                            .select('*, created_at, service_date')
                            .eq('service_category', serviceCategory)
                            .eq('open', true)
                            .order('created_at', { ascending: false })
                    ]);

                    if (specificTableData.error) {
                        console.error(`${serviceCategory} request error:`, specificTableData.error);
                    }
                    if (legacyRequestsData.error) {
                        console.error('Legacy request error:', legacyRequestsData.error);
                    }

                    const combinedRequests = [
                        ...(specificTableData.data?.map(req => ({
                            ...req,
                            table_name: `${serviceCategory}_requests`,
                            service_title: req.title || req.event_title || `${req.event_type} ${businessType} Request`,
                            price_range: req.budget_range || req.price_range,
                            service_date: req.start_date || req.date
                        })) || []),
                        ...(legacyRequestsData.data?.map(req => ({
                            ...req,
                            table_name: 'requests',
                            service_title: req.service_title || req.title || `${businessType} Request`,
                            price_range: req.budget || req.price_range,
                            service_date: req.service_date
                        })) || [])
                    ];

                    if (businessType.toLowerCase() === 'photography') {
                        setOpenPhotoRequests(combinedRequests);
                        setOpenRequests([]);
                    } else {
                        setOpenRequests(combinedRequests);
                        setOpenPhotoRequests([]);
                    }
                } else {
                    // Fetch ALL requests when business type is not in valid categories
                    const [
                        photoData,
                        djData,
                        cateringData,
                        beautyData,
                        videoData,
                        floristData,
                        legacyData
                    ] = await Promise.all([
                        supabase
                            .from('photography_requests')
                            .select('*')
                            .in('status', ['pending', 'open'])
                            .order('created_at', { ascending: false }),
                        supabase
                            .from('dj_requests')
                            .select('*')
                            .in('status', ['pending', 'open'])
                            .order('created_at', { ascending: false }),
                        supabase
                            .from('catering_requests')
                            .select('*')
                            .in('status', ['pending', 'open'])
                            .order('created_at', { ascending: false }),
                        supabase
                            .from('beauty_requests')
                            .select('*')
                            .in('status', ['pending', 'open'])
                            .order('created_at', { ascending: false }),
                        supabase
                            .from('videography_requests')
                            .select('*')
                            .in('status', ['pending', 'open'])
                            .order('created_at', { ascending: false }),
                        supabase
                            .from('florist_requests')
                            .select('*')
                            .in('status', ['pending', 'open'])
                            .order('created_at', { ascending: false }),
                        supabase
                            .from('requests')
                            .select('*')
                            .eq('open', true)
                            .order('created_at', { ascending: false })
                    ]);

                    const allRequests = [
                        ...(photoData.data?.map(req => ({
                            ...req,
                            table_name: 'photography_requests',
                            service_title: req.event_title || 'Photography Request',
                            service_category: 'photography'
                        })) || []),
                        ...(djData.data?.map(req => ({
                            ...req,
                            table_name: 'dj_requests',
                            service_title: req.title || 'DJ Request',
                            service_category: 'dj'
                        })) || []),
                        ...(cateringData.data?.map(req => ({
                            ...req,
                            table_name: 'catering_requests',
                            service_title: req.title || 'Catering Request',
                            service_category: 'catering'
                        })) || []),
                        ...(beautyData.data?.map(req => ({
                            ...req,
                            table_name: 'beauty_requests',
                            service_title: req.title || 'Beauty Request',
                            service_category: 'beauty'
                        })) || []),
                        ...(videoData.data?.map(req => ({
                            ...req,
                            table_name: 'videography_requests',
                            service_title: req.title || 'Videography Request',
                            service_category: 'videography'
                        })) || []),
                        ...(floristData.data?.map(req => ({
                            ...req,
                            table_name: 'florist_requests',
                            service_title: req.title || 'Florist Request',
                            service_category: 'florist'
                        })) || []),
                        ...(legacyData.data || [])
                    ];

                    setOpenRequests(allRequests);
                    setOpenPhotoRequests([]);
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
                ) : (
                    // Show all requests for any business type (including non-matching ones)
                    openRequests
                        .filter(request => !userBids.has(request.id))
                        .map(request => (
                            <RequestDisplayMini 
                                key={`regular-${request.id}`}
                                request={request}
                                isPhotoRequest={false}
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