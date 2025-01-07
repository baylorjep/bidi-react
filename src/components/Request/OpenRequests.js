import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import RequestDisplayMini from './RequestDisplayMini';
import PhotoRequestDisplayMini from './PhotoRequestDisplayMini.js';
import '../../App.css';
import SearchBar from '../SearchBar/SearchBar';

function OpenRequests() {
    const [openRequests, setOpenRequests] = useState([]);
    const [openPhotoRequests, setOpenPhotoRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [businessType, setBusinessType] = useState('');

    useEffect(() => {
        const fetchUserBusinessType = async () => {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData) {
                setError('Error fetching user information.');
                console.error(userError);
                return;
            }

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

    useEffect(() => {
        if (!businessType) return;

        const fetchRequests = async () => {
            let filteredRequests = [];
            let filteredPhotoRequests = [];

            try {
                // For specific business types
                if (businessType === 'Cake') {
                    const { data: requests, error } = await supabase
                        .from('requests')
                        .select('id, user_id, service_title, service_description, service_date, service_category, location, additional_comments, price_range, time_of_day')
                        .eq('open', true)
                        .eq('service_category', 'cakes');
                    if (error) throw error;
                    filteredRequests = requests || [];
                }

                if (businessType === 'Catering') {
                    const { data: requests, error } = await supabase
                        .from('requests')
                        .select('id, user_id, service_title, service_description, service_date, service_category, location, additional_comments, price_range, time_of_day')
                        .eq('open', true)
                        .eq('service_category', 'catering');
                    if (error) throw error;
                    filteredRequests = requests || [];
                }

                if (businessType === 'photography' || businessType === 'Videography') {
                    const { data: allPhotoRequests, error: allPhotoRequestsError } = await supabase
                        .from('photography_requests')
                        .select('id, event_title, event_type, start_date, end_date, date_type, time_of_day, location, num_people, duration, indoor_outdoor, additional_comments, status')
                        .eq('status', 'open');
                    if (allPhotoRequestsError) throw allPhotoRequestsError;
                    filteredPhotoRequests = allPhotoRequests || [];
                }

                // Default case: If no specific business type matches, fetch all requests
                if (
                    businessType !== 'Cake' &&
                    businessType !== 'Catering' &&
                    businessType !== 'DJ' &&
                    businessType !== 'Hair & Makeup Artist' &&
                    businessType !== 'Wedding Planner/Coordinator' &&
                    businessType !== 'Florist' &&
                    businessType !== 'photography' &&
                    businessType !== 'Videography'
                ) {
                    const { data: allRequests, error: allRequestsError } = await supabase
                        .from('requests')
                        .select('id, user_id, service_title, service_description, service_date, service_category, location, additional_comments, price_range, time_of_day')
                        .eq('open', true);

                    const { data: allPhotoRequests, error: allPhotoRequestsError } = await supabase
                        .from('photography_requests')
                        .select('id, event_title, event_type, start_date, end_date, date_type, time_of_day, location, num_people, duration, indoor_outdoor, additional_comments, status')
                        .eq('status', 'open');

                    if (allRequestsError || allPhotoRequestsError) {
                        throw new Error(
                            `Error fetching all requests: ${allRequestsError?.message || ''} ${allPhotoRequestsError?.message || ''}`
                        );
                    }

                    filteredRequests = allRequests || [];
                    filteredPhotoRequests = allPhotoRequests || [];
                }

                // Sort requests
                const sortedRequests = [...(filteredRequests || [])].sort((a, b) => {
                    const aIsNew = isNew(a.created_at);
                    const bIsNew = isNew(b.created_at);
                    if (aIsNew && !bIsNew) return -1;
                    if (!aIsNew && bIsNew) return 1;
                    return new Date(b.created_at) - new Date(a.created_at);
                });

                setOpenRequests(sortedRequests);
                setOpenPhotoRequests(filteredPhotoRequests);
            } catch (error) {
                setError(`Error fetching requests: ${error.message}`);
                console.error(error);
            }
        };

        fetchRequests();
    }, [businessType]);

    return (
        <div className="request-grid-container">
            <div className="request-grid">
                {error && <p>Error: {error}</p>}

                {openRequests.length > 0 && openRequests.map((request) => (
                    <RequestDisplayMini 
                        key={request.id} 
                        request={request}
                    />
                ))}

                {openPhotoRequests.length > 0 && openPhotoRequests.map((photoRequest) => (
                    <PhotoRequestDisplayMini 
                        key={photoRequest.id} 
                        photoRequest={photoRequest} 
                    />
                ))}

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