import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import RequestDisplay from './RequestDisplay';

function OpenRequests() {
    const [openRequests, setOpenRequests] = useState([]); // Initialize as an empty array
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRequests = async () => {
            const { data, error } = await supabase
                .from('requests')
                .select('*')
                .eq('open', true);

            if (error) {
                setError(`Error fetching requests: ${error.message}`);
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
                        <RequestDisplay request={request}/>
                    ))
                ) : (
                    <p>No open requests found.</p>
                )}
            </div>
        </div>
    );
}

export default OpenRequests;
