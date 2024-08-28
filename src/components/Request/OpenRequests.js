import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import RequestDisplay from './RequestDisplay';
import PhotoRequestDisplay from './PhotoRequestDisplay';
import '../../App.css';

function OpenRequests() {
    const [openRequests, setOpenRequests] = useState([]); // Initialize as an empty array
    const [openPhotoRequests, setOpenPhotoRequests] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRequests = async () => {
            const { data, error } = await supabase
                .from('requests')
                .select('id, user_id, service_title, service_category, service_description, service_date, location, additional_comments') // Specify columns
                .eq('open', true); // Assuming 'open' is still a valid column or condition

            if (error) {
                setError(`Error fetching requests: ${error.message}`);
                console.log(error);
            } else {
                console.log('Fetched data:', data);
                setOpenRequests(data || []); // Ensure data is an array
            }
        };

        const fetchPhotoRequests = async () => {
            const { data, error } = await supabase
                .from('photography_requests')
                .select('id, event_title, event_type, date_type, start_date, end_date, time_of_day, location, num_people, duration, indoor_outdoor, additional_comments, extras')
                .eq('status', 'open'); // Assuming 'open' is a column indicating whether the request is still active
        
            if (error) {
                console.error('Error fetching photo requests:', error.message);
                setError(`Error fetching photo requests: ${error.message}`);
            } else {
                console.log('Fetched photo requests:', data);
                setOpenPhotoRequests(data || []); // Ensure data is an array
            }
        };
        

        fetchRequests();
        fetchPhotoRequests();
    }, []);

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center grey-bg content">
            <div className="col-lg-6 remaining-space">
                {error && <p>Error: {error}</p>}

                {openPhotoRequests.length > 0 && 
                    openPhotoRequests.map((photoRequest) => (
                        <PhotoRequestDisplay key={photoRequest.id} photoRequest={photoRequest}/>
                    ))
                }

                {openRequests.length > 0 && 
                    openRequests.map((request) => (
                        <RequestDisplay key={request.id} request={request}/>
                    ))
                }

                {openPhotoRequests.length === 0 && openRequests.length === 0 && (
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
