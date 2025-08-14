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
                if (!context) {
                    console.error('No pending request context found');
                    setError('No pending request found');
                    setLoading(false);
                    return;
                }

                // Verify user is authenticated
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                    console.error('User not authenticated:', userError);
                    setError('Please sign in to continue');
                    setLoading(false);
                    return;
                }

                // Set request context and show modal
                setRequestContext(context);
                setShowRequestModal(true);
                setLoading(false);

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
        return null;
    }

    return (
        <>
            {showRequestModal && (
                <RequestModal
                    isOpen={showRequestModal}
                    onClose={handleRequestModalClose}
                    selectedVendors={requestContext.selectedVendors}
                    searchFormData={requestContext.formData}
                    vendor={requestContext.vendor}
                    isEditMode={requestContext.isEditMode}
                    existingRequestData={requestContext.existingRequestData}
                    onSuccess={handleRequestSubmit}
                />
            )}
        </>
    );
};

export default RestoreRequest;
