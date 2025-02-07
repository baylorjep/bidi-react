import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import RequestDisplayMini from './RequestDisplayMini';
import PhotoRequestDisplayMini from './PhotoRequestDisplayMini.js';
import '../../App.css';
import SearchBar from '../SearchBar/SearchBar';

const BUSINESS_TYPE_MAPPING = {
    'cake': ['cake'],
    'wedding planner/coordinator': ['wedding planner', 'rental'],
    'catering': ['catering'],
    'florist': ['florist'],
    'hair and makeup artist': ['hair and makeup artist'],
    'photography': ['photo'],
    'videography': ['photo'],
    'dj': ['dj', 'DJ'], // Add both lowercase and uppercase variations
    'venue': ['venue'],
    'spray tan': ['spray tan'],

};

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
                const isPhotoType = ['photography', 'videography'].includes(businessType.toLowerCase());
                const categories = BUSINESS_TYPE_MAPPING[businessType.toLowerCase()] || [];

                if (isPhotoType) {
                    const { data: photoRequests, error } = await supabase
                        .from('photography_requests')
                        .select('*, created_at')
                        .eq('status', 'open')
                        .order('created_at', { ascending: false });
                    
                    if (error) throw error;
                    setOpenRequests([]);
                    setOpenPhotoRequests(photoRequests || []);
                    return;
                }

                if (categories.length > 0) {
                    const { data: requests, error } = await supabase
                        .from('requests')
                        .select('*, created_at')
                        .eq('open', true)
                        .in('service_category', categories)
                        .order('created_at', { ascending: false });
                    
                    if (error) throw error;
                    setOpenRequests(requests || []);
                    setOpenPhotoRequests([]);
                    return;
                }

                // Default case: fetch all requests
                const { data: allRequests, error: allRequestsError } = await supabase
                    .from('requests')
                    .select('*, created_at')
                    .eq('open', true);

                const { data: allPhotoRequests, error: allPhotoRequestsError } = await supabase
                    .from('photography_requests')
                    .select('*, created_at')
                    .eq('status', 'open');

                if (allRequestsError || allPhotoRequestsError) throw new Error(
                    `Error fetching all requests: ${allRequestsError?.message || ''} ${allPhotoRequestsError?.message || ''}`
                );

                const allRequestsCombined = [
                    ...(allRequests || []).map(req => ({...req, requestType: 'regular'})),
                    ...(allPhotoRequests || []).map(req => ({...req, requestType: 'photo'}))
                ].sort((a, b) => sortByNewAndDate(a, b));

                setOpenRequests(allRequestsCombined.filter(req => req.requestType === 'regular'));
                setOpenPhotoRequests(allRequestsCombined.filter(req => req.requestType === 'photo'));

            } catch (error) {
                setError(`Error fetching requests: ${error.message}`);
                console.error(error);
            }
        };

        fetchRequests();
    }, [businessType]);

    const sortByNewAndDate = (a, b) => {
        const aIsNew = isNew(a.created_at);
        const bIsNew = isNew(b.created_at);
        if (aIsNew && !bIsNew) return -1;
        if (!aIsNew && bIsNew) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
    };

    return (
        <div className="request-grid-container">
            <div className="request-grid">
                {error && <p>Error: {error}</p>}
                {[...openRequests, ...openPhotoRequests]
                    .filter(request => !userBids.has(request.id))
                    .sort(sortByNewAndDate)
                    .map((request) => (
                        request.event_title ? (
                            <PhotoRequestDisplayMini 
                                key={`photo-${request.id}`}
                                photoRequest={request}
                                checkPromotion={checkPromotion}
                            />
                        ) : (
                            <RequestDisplayMini 
                                key={`regular-${request.id}`}
                                request={request}
                                checkPromotion={checkPromotion}
                            />
                        )
                    ))
                }
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