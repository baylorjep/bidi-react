import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import RequestModal from './Request/RequestModal';

const RestoreRequest = () => {
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestContext, setRequestContext] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const restoreRequestContext = async () => {
            try {
                // Get request context from location state
                const context = location.state?.pendingRequestContext;
                console.log('RestoreRequest: Received context from location state:', context);
                console.log('RestoreRequest: Full location state:', location.state);
                
                if (!context) {
                    console.error('No pending request context found');
                    setError('No pending request found');
                    setLoading(false);
                    return;
                }

                // Verify user is authenticated
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                console.log('RestoreRequest: Checking user authentication:', user?.id, userError);
                if (userError || !user) {
                    console.error('User not authenticated:', userError);
                    setError('Please sign in to continue');
                    setLoading(false);
                    return;
                }

                // Set request context and show modal
                console.log('RestoreRequest: Setting request context:', context);
                setRequestContext(context);
                setShowRequestModal(true);
                setLoading(false);
                console.log('RestoreRequest: Modal state set to show:', true);

            } catch (error) {
                console.error('Error restoring request context:', error);
                setError('Failed to restore request');
                setLoading(false);
            }
        };

        restoreRequestContext();
    }, [location.state]);

    const handleRequestModalClose = () => {
        setShowRequestModal(false);
        // Redirect to appropriate dashboard after request completion
        navigate('/individual-dashboard/bids');
    };

    const handleRequestSubmit = async (userData) => {
        // Request was submitted successfully
        console.log('Request submitted successfully:', userData);
        // Modal will handle the success state and navigation
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div className="loading-spinner"></div>
                <p>Restoring your request...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: '20px',
                padding: '20px',
                textAlign: 'center'
            }}>
                <h2>Something went wrong</h2>
                <p style={{ color: '#dc2626' }}>{error}</p>
                <button 
                    onClick={() => navigate('/individual-dashboard/bids')}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#a328f4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    if (!requestContext) {
        console.log('RestoreRequest: No request context, returning null');
        return null;
    }
    
    console.log('RestoreRequest: Rendering RequestModal with context:', requestContext);
    console.log('RestoreRequest: Selected vendors being passed:', requestContext.selectedVendors);
    console.log('RestoreRequest: Form data being passed:', requestContext.formData);

    return (
        <>
            {console.log('RestoreRequest: Rendering, showRequestModal:', showRequestModal)}
            {showRequestModal && (
                <RequestModal
                    isOpen={showRequestModal}
                    onClose={handleRequestModalClose}
                    selectedVendors={requestContext.selectedVendors || []}
                    searchFormData={requestContext.searchFormData || {}}
                    vendor={requestContext.vendor || null}
                    isEditMode={requestContext.isEditMode || false}
                    existingRequestData={requestContext.formData ? { formData: requestContext.formData } : (requestContext.existingRequestData || null)}
                    onSuccess={handleRequestSubmit}
                />
            )}
        </>
    );
};

export default RestoreRequest;
