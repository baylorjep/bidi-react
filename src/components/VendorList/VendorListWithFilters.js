import React, { useState, useEffect } from 'react';
import VendorList from './VendorList';
import '../../styles/VendorList.css';
import { useNavigate } from 'react-router-dom';

const VendorListWithFilters = ({
    selectedCategory,
    sortOrder,
    preferredLocation,
    categoryType,
    currentPage =1,
    vendorsPerPage =5,
    setCurrentPage,
    setTotalCount,
    preferredType,
    onVendorSelect,
    onVendorDeselect,
    selectedVendors = [],
    customButtonText = "Get a Tailored Bid",
    showSelectionButton =false,
    selectedCity,
    selectedCounty
}) => {
    const [sortType, setSortType] = useState(sortOrder || 'recommended');
    const navigate = useNavigate();

    // Debug logging
    console.log('VendorListWithFilters props:', {
        selectedCategory,
        sortOrder,
        preferredLocation,
        categoryType,
        currentPage,
        vendorsPerPage,
        setCurrentPage,
        setTotalCount,
        preferredType,
        onVendorSelect,
        onVendorDeselect,
        selectedVendors,
        customButtonText,
        showSelectionButton,
        selectedCity,
        selectedCounty
    });

    // Update sortType when sortOrder prop changes
    useEffect(() => {
        if (sortOrder && sortOrder !== sortType) {
            setSortType(sortOrder);
        }
    }, [sortOrder]);

    const formatBusinessName = (name) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleVendorClick = (vendor) => {
        if (vendor.business_name) {
            const formattedName = formatBusinessName(vendor.business_name);
            navigate(`/portfolio/${vendor.id}/${formattedName}`, {
                state: { 
                    fromVendorSelection: true,
                    fromVendorList: true,
                    returnUrl: window.location.href // Preserve the current URL with all filters
                }
            });
        }
    };

    return (
        <div className="vendor-list-with-filters">
            <VendorList
                selectedCategory={selectedCategory}
                sortOrder={sortType}
                preferredLocation={preferredLocation}
                categoryType={categoryType}
                currentPage={currentPage}
                vendorsPerPage={vendorsPerPage}
                setCurrentPage={setCurrentPage}
                setTotalCount={setTotalCount}
                preferredType={preferredType}
                onVendorSelect={onVendorSelect}
                onVendorDeselect={onVendorDeselect}
                selectedVendors={selectedVendors}
                customButtonText={customButtonText}
                showSelectionButton={showSelectionButton}
                selectedCity={selectedCity}
                selectedCounty={selectedCounty}
            />
        </div>
    );
};

export default VendorListWithFilters;