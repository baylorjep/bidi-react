import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import RequestDisplay from './RequestDisplay';
import PhotoRequestDisplay from './PhotoRequestDisplay';
import '../../App.css';

function OpenRequests() {
    const [openRequests, setOpenRequests] = useState([]);
    const [openPhotoRequests, setOpenPhotoRequests] = useState([]);
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
    
                if (businessType === 'DJ') {
                    const { data: requests, error } = await supabase
                        .from('requests')
                        .select('id, user_id, service_title, service_description, service_date, service_category, location, additional_comments, price_range, time_of_day')
                        .eq('open', true)
                        .eq('service_category', 'dj-services');
                    if (error) throw error;
                    filteredRequests = requests || [];
                }
    
                if (businessType === 'Hair & Makeup Artist') {
                    const { data: requests, error } = await supabase
                        .from('requests')
                        .select('id, user_id, service_title, service_description, service_date, service_category, location, additional_comments, price_range, time_of_day')
                        .eq('open', true)
                        .eq('service_category', 'hair-and-makeup-artist');
                    if (error) throw error;
                    filteredRequests = requests || [];
                }
    
                if (businessType === 'Wedding Planner/Coordinator') {
                    const { data: requests, error } = await supabase
                        .from('requests')
                        .select('id, user_id, service_title, service_description, service_date, service_category, location, additional_comments, price_range, time_of_day')
                        .eq('open', true)
                        .eq('service_category', 'event/wedding-planner');
                    if (error) throw error;
                    filteredRequests = requests || [];
                }
    
                if (businessType === 'Florist') {
                    const { data: requests, error } = await supabase
                        .from('requests')
                        .select('id, user_id, service_title, service_description, service_date, service_category, location, additional_comments, price_range, time_of_day')
                        .eq('open', true)
                        .eq('service_category', 'Florist');
                    if (error) throw error;
                    filteredRequests = requests || [];
                }
    
                // For photography and videography requests
                if (businessType === 'photography' || businessType === 'Videography') {
                    const { data: photoRequests, error } = await supabase
                        .from('photography_requests')
                        .select('id, event_title, event_type, start_date, end_date, time_of_day, location, num_people, duration, indoor_outdoor, additional_comments, status')
                        .eq('status', 'open');
                    if (error) throw error;
                    filteredPhotoRequests = photoRequests || [];
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
                        .select('id, event_title, event_type, start_date, end_date, date_type,time_of_day, location, num_people, duration, indoor_outdoor, additional_comments, status')
                        .eq('status', 'open');
    
                    if (allRequestsError || allPhotoRequestsError) {
                        throw new Error(
                            `Error fetching all requests: ${allRequestsError?.message || ''} ${allPhotoRequestsError?.message || ''}`
                        );
                    }
    
                    filteredRequests = allRequests || [];
                    filteredPhotoRequests = allPhotoRequests || [];
                }
    
                setOpenRequests(filteredRequests);
                setOpenPhotoRequests(filteredPhotoRequests);
            } catch (error) {
                setError(`Error fetching requests: ${error.message}`);
                console.error(error);
            }
        };
    
        fetchRequests();
    }, [businessType]);
    

    return (
        <div className="d-flex align-items-center justify-content-center ">
            <div style={{
                width:'100%', 
                alignItems:'center', 
                justifyContent:'center', 
                display:'flex',
                flexDirection:'column', 
                padding:"20px", 
                maxWidth:'1000px'
            }}>
                {error && <p>Error: {error}</p>}

                {openRequests.length > 0 && openRequests.map((request) => (
                    <RequestDisplay key={request.id} request={request} />
                ))}

                {openPhotoRequests.length > 0 && openPhotoRequests.map((photoRequest) => (
                    <PhotoRequestDisplay key={photoRequest.id} photoRequest={photoRequest} />
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
