import React, { useState, useEffect } from 'react';
import VendorList from './VendorList';
import '../../styles/VendorList.css';
import { useNavigate } from 'react-router-dom';

const VendorListWithFilters = ({
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
    showSelectionButton
}) => {
    const [sortType, setSortType] = useState(sortOrder || 'recommended');
    const navigate = useNavigate();

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
                state: { fromVendorSelection: true }
            });
        }
    };

    const handleSortChange = (e) => {
        const newSortType = e.target.value;
        setSortType(newSortType);
        // Reset to first page when sort changes
        setCurrentPage(1);
    };

    return (
        <div className="vendor-list-with-filters">
            <div className="sort-controls">
                <select 
                    value={sortType} 
                    onChange={handleSortChange}
                    className="sort-select"
                >
                    <option value="recommended">Recommended</option>
                    <option value="rating">Highest Rated</option>
                    <option value="base_price_low">Starting at: Low to High</option>
                    <option value="base_price_high">Starting at: High to Low</option>
                </select>
            </div>

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
            />
        </div>
    );
};

export default VendorListWithFilters;