import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import VendorList from '../VendorList/VendorList';
import './VendorSelection.css';

function VendorSelection() {
    const { category } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedVendors, setSelectedVendors] = useState([]);
    const [remainingCategories, setRemainingCategories] = useState([]);

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                setLoading(true);
                console.log('VendorSelection location state:', location.state);
                const { requestId, table, categories } = location.state || {};
                
                if (!requestId || !table) {
                    console.error('Missing required state:', { requestId, table, state: location.state });
                    navigate('/success-request');
                    return;
                }

                // Debug: Fetch all videography requests
                const { data: videographyRequests, error: videographyError } = await supabase
                    .from('videography_requests')
                    .select('*');
                
                if (videographyError) {
                    console.error('Error fetching videography requests:', videographyError);
                } else {
                    console.log('All videography requests:', videographyRequests);
                }

                // Set up remaining categories for navigation
                if (categories && Array.isArray(categories)) {
                    // The first category in the array is the current one, so we take the rest
                    setRemainingCategories(categories.slice(1));
                }

                console.log('Searching for category:', category);

                const { data: vendorsData, error: vendorsError } = await supabase
                    .from('business_profiles')
                    .select('*')
                    .contains('business_category', [category]);

                if (vendorsError) throw vendorsError;

                console.log('Vendors found:', vendorsData?.length);
                setVendors(vendorsData || []);
                setTotalCount(vendorsData?.length || 0);
            } catch (err) {
                console.error('Error fetching vendors:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchVendors();
    }, [category, location.state, navigate]);

    const handleVendorSelect = (vendor) => {
        setSelectedVendors(prev => [...prev, vendor]);
    };

    const handleVendorDeselect = (vendor) => {
        setSelectedVendors(prev => prev.filter(v => v.id !== vendor.id));
    };

    const handleDone = async () => {
        try {
            const { requestId, table, categories, requestData } = location.state || {};
            
            // Add debug logging
            console.log('Saving vendors for:', {
                requestId,
                table,
                selectedVendors: selectedVendors.map(v => v.id),
                category
            });
            
            // Save selected vendor IDs to the database as a UUID array
            if (selectedVendors.length > 0) {
                // First, let's check if the record exists and our permissions
                const { data: existingRecord, error: fetchError } = await supabase
                    .from(table)
                    .select('*')
                    .eq('id', requestId)
                    .single();

                if (fetchError) {
                    console.error('Error fetching existing record:', fetchError);
                    if (fetchError.code === 'PGRST301') {
                        console.error('RLS policy error - permission denied');
                        throw new Error('You do not have permission to access this record');
                    }
                    throw fetchError;
                }

                console.log('Existing record:', existingRecord);

                // Ensure vendor_id is an array
                const vendorIds = selectedVendors.map(vendor => vendor.id);
                console.log('Saving vendor IDs:', vendorIds);

                const { data: updateData, error } = await supabase
                    .from(table)
                    .update({ 
                        vendor_id: vendorIds
                    })
                    .eq('id', requestId)
                    .select();

                if (error) {
                    console.error('Error saving selected vendors:', error);
                    if (error.code === 'PGRST301') {
                        console.error('RLS policy error - permission denied');
                        throw new Error('You do not have permission to update this record');
                    }
                    throw error;
                }
                
                console.log('Update response:', updateData);
                console.log('Successfully saved vendors for', table);
            }

            // If there are more categories, navigate to the next one
            if (remainingCategories.length > 0) {
                const nextCategory = remainingCategories[0];
                navigate(`/vendor-selection/${nextCategory.id}`, {
                    state: {
                        requestId: requestData[nextCategory.id],
                        table: nextCategory.table,
                        categories: remainingCategories,
                        requestData: requestData
                    }
                });
            } else {
                // If no more categories, navigate to the bids page
                navigate('/bids');
            }
        } catch (err) {
            console.error('Error in handleDone:', err);
            setError('Failed to save selected vendors. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    <div className="loading-spinner-animation"></div>
                    <p className="loading-text">Loading vendors...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message">
                    <p className="error-text">Error: {error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="back-button"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="vendor-selection-container">
            <div className="vendor-selection-header">
                <div className="vendor-selection-title-row">
                    <h1 className="vendor-selection-title">
                        {category.charAt(0).toUpperCase() + category.slice(1)} Vendors
                    </h1>
                    {selectedVendors.length > 0 && (
                        <div className="vendor-selection-count">
                            {selectedVendors.length} vendor{selectedVendors.length !== 1 ? 's' : ''} selected
                        </div>
                    )}
                </div>
                <div className="done-button-container">
                    <button
                        onClick={handleDone}
                        className="done-button"
                    >
                        <i className="fas fa-check"></i>
                        <span>
                            {remainingCategories.length > 0 
                                ? `Next Category (${remainingCategories.length} remaining)`
                                : 'Done Selecting Vendors'
                            }
                        </span>
                    </button>
                </div>
            </div>
            
            {vendors.length === 0 ? (
                <div className="no-vendors-container">
                    <p className="no-vendors-message">No vendors found for this category.</p>
                    <button
                        onClick={handleDone}
                        className="back-button"
                    >
                        {remainingCategories.length > 0 ? 'Next Category' : 'Go Back'}
                    </button>
                </div>
            ) : (
                <VendorList
                    selectedCategory={category}
                    sortOrder="rating"
                    preferredLocation={null}
                    categoryType={category}
                    currentPage={currentPage}
                    vendorsPerPage={5}
                    setCurrentPage={setCurrentPage}
                    setTotalCount={setTotalCount}
                    preferredType={null}
                    selectedVendors={selectedVendors}
                    onVendorSelect={handleVendorSelect}
                    onVendorDeselect={handleVendorDeselect}
                    customButtonText="Add to Vendor List"
                    showSelectionButton={true}
                />
            )}
        </div>
    );
}

export default VendorSelection; 