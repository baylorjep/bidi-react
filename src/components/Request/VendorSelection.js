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
                const { requestId, table, categories } = location.state || {};
                
                const categoryMap = {
                    'weddingplanning': 'wedding planner/coordinator',
                    'beauty': 'beauty'
                };

                const searchCategory = categoryMap[category] || category;
                console.log('Using search category:', searchCategory);

                if (!requestId || !table) {
                    navigate('/success-request');
                    return;
                }

                if (categories && Array.isArray(categories)) {
                    setRemainingCategories(categories.slice(1));
                }

                // First get the vendors
                const { data: vendorsData, error: vendorsError } = await supabase
                    .from('business_profiles')
                    .select('*')
                    .filter('business_category', 'cs', `{${searchCategory}}`);

                if (vendorsError) throw vendorsError;

                if (!vendorsData?.length) {
                    setVendors([]);
                    setTotalCount(0);
                    return;
                }

                // Then get their photos
                const { data: photosData, error: photosError } = await supabase
                    .from('profile_photos')
                    .select('*')
                    .in('user_id', vendorsData.map(v => v.id));

                if (photosError) throw photosError;

                // Combine vendors with their photos
                const vendorsWithPhotos = vendorsData.map(vendor => {
                    const vendorPhotos = photosData?.filter(photo => photo.user_id === vendor.id) || [];
                    const profilePhoto = vendorPhotos.find(photo => photo.photo_type === 'profile');
                    const portfolioPhotos = vendorPhotos
                        .filter(photo => photo.photo_type === 'portfolio' || photo.photo_type === 'video')
                        .map(photo => photo.photo_url);

                    return {
                        ...vendor,
                        profile_photo_url: profilePhoto?.photo_url || '/images/default.jpg',
                        portfolio_photos: portfolioPhotos,
                        has_more_photos: portfolioPhotos.length > 10
                    };
                });

                console.log('Vendors with photos:', vendorsWithPhotos);
                setVendors(vendorsWithPhotos);
                setTotalCount(vendorsWithPhotos.length);
            } catch (err) {
                console.error('Error:', err);
                setError(err.message);
                setVendors([]);
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
            
            console.log('HandleDone called with:', {
                requestId,
                table,
                category,
                selectedVendors,
                locationState: location.state
            });
            
            if (selectedVendors.length > 0) {
                // First verify the current state
                const { data: beforeUpdate } = await supabase
                    .from(table)
                    .select('*')
                    .eq('id', requestId)
                    .single();
                
                console.log('Before update:', beforeUpdate);

                // Prepare vendor IDs array and try both array and stringified formats
                const vendorIds = selectedVendors.map(vendor => vendor.id);
                console.log('Attempting to save vendor IDs:', vendorIds);

                // Try update with direct array first
                const { data: updateData, error: updateError } = await supabase
                    .from(table)
                    .update({ 
                        vendor_id: vendorIds
                    })
                    .eq('id', requestId)
                    .select();

                if (updateError) {
                    console.error('Error with array update, trying stringified:', updateError);
                    // If array update fails, try stringified
                    const { data: stringUpdate, error: stringError } = await supabase
                        .from(table)
                        .update({ 
                            vendor_id: JSON.stringify(vendorIds)
                        })
                        .eq('id', requestId)
                        .select();

                    if (stringError) throw stringError;
                    console.log('Stringified update successful:', stringUpdate);
                } else {
                    console.log('Array update successful:', updateData);
                }

                // Final verification
                const { data: afterUpdate, error: verifyError } = await supabase
                    .from(table)
                    .select('*')
                    .eq('id', requestId)
                    .single();

                if (verifyError) {
                    throw verifyError;
                }

                console.log('Final verification:', afterUpdate);
                
                if (!afterUpdate.vendor_id) {
                    throw new Error('Vendor IDs missing after update');
                }
            }

            // Continue with navigation
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
                navigate('/bids');
            }
        } catch (err) {
            console.error('Error in handleDone:', err);
            setError(`Failed to save vendors: ${err.message}`);
            // Show error to user but don't navigate away
            alert('There was an error saving your vendor selection. Please try again.');
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
                    <button
                    onClick={() => navigate(-1)}
                    className="back-button"
                    >
                        Go Back
                    </button>
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
            
            {!loading && vendors.length === 0 ? (
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
                    vendors={vendors || []}  // Ensure we always pass an array
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