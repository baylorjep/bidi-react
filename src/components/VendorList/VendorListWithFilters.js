import React, { useState } from 'react';
import VendorList from './VendorList';
import '../../styles/VendorList.css';

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

    return (
        <div className="vendor-list-with-filters">
            <div className="sort-controls">
                <select 
                    value={sortType} 
                    onChange={(e) => setSortType(e.target.value)}
                    className="sort-select"
                >
                    <option value="recommended">Recommended</option>
                    <option value="rating">Highest Rated</option>
                    <option value="base_price_low">Price: Low to High</option>
                    <option value="base_price_high">Price: High to Low</option>
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