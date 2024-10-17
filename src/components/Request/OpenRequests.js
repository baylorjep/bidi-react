import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import RequestDisplay from './RequestDisplay';
import PhotoRequestDisplay from './PhotoRequestDisplay';
import '../../App.css';

function OpenRequests() {
    const [openRequests, setOpenRequests] = useState([]);
    const [openPhotoRequests, setOpenPhotoRequests] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRequests = async () => {
            const { data: requests, error } = await supabase
                .from('requests')
                .select('id, user_id, service_title, service_description, service_date, service_category, location, created_at, additional_comments')
                .eq('open', true);  // Filter only open requests with boolean true

            if (error) {
                setError(`Error fetching requests: ${error.message}`);
                console.log(error);
            } else {
                setOpenRequests(requests || []);
            }
        };

        const fetchPhotoRequests = async () => {
            const { data: photoRequests, error } = await supabase
                .from('photography_requests')
                .select('id, event_title, event_type, start_date, end_date, time_of_day, location, num_people, duration, indoor_outdoor, additional_comments, status')
                .eq('status', 'open');  // Filter only open photography requests

            if (error) {
                setError(`Error fetching photo requests: ${error.message}`);
                console.error(error);
            } else {
                setOpenPhotoRequests(photoRequests || []);
            }
        };

        fetchRequests();
        fetchPhotoRequests();
    }, []);

    return (
        <div className=" d-flex align-items-center justify-content-center content">
            <div className="col-lg-6 remaining-space">
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
