import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import RequestDisplay from './RequestDisplay';
import '../../App.css';

function OpenRequests() {
    const [openRequests, setOpenRequests] = useState([]); // Initialize as an empty array
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

        fetchRequests();
    }, []);

    return (
        <div className="container px-5 d-flex align-items-center justify-content-center grey-bg content">
            <div className="col-lg-6 remaining-space">
                {error && <p>Error: {error}</p>}
                {openRequests.length > 0 ? (
                    openRequests.map((request) => (
                        <RequestDisplay key={request.id} request={request}/>
                    ))
                ) : (
                    <>
                        <h1>No open requests found.</h1>
                        <p>Please check back later.</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default OpenRequests;
