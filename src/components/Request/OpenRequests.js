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

    const isNew = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        return diffInDays < 7;
    };

    useEffect(() => {
        const fetchRequests = async () => {
            const { data: requests, error } = await supabase
                .from('requests')
                .select('*')
                .eq('open', true)
                .order('created_at', { ascending: false });

            if (error) {
                setError(`Error fetching requests: ${error.message}`);
                console.log(error);
            } else {
                // Sort requests with new ones at the top
                const sortedRequests = [...(requests || [])].sort((a, b) => {
                    const aIsNew = isNew(a.created_at);
                    const bIsNew = isNew(b.created_at);
                    if (aIsNew && !bIsNew) return -1;
                    if (!aIsNew && bIsNew) return 1;
                    return new Date(b.created_at) - new Date(a.created_at);
                });
                setOpenRequests(sortedRequests);
            }
        };

        const fetchPhotoRequests = async () => {
            const { data: photoRequests, error } = await supabase
                .from('photography_requests')
                .select(`
                    *,
                    event_photos (
                        photo_url,
                        file_path
                    )
                `)
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            if (error) {
                setError(`Error fetching photo requests: ${error.message}`);
                console.error(error);
            } else {
                // Sort photo requests with new ones at the top
                const sortedPhotoRequests = [...(photoRequests || [])].sort((a, b) => {
                    const aIsNew = isNew(a.created_at);
                    const bIsNew = isNew(b.created_at);
                    if (aIsNew && !bIsNew) return -1;
                    if (!aIsNew && bIsNew) return 1;
                    return new Date(b.created_at) - new Date(a.created_at);
                });
                setOpenPhotoRequests(sortedPhotoRequests);
            }
        };

        fetchRequests();
        fetchPhotoRequests();
    }, []);

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

