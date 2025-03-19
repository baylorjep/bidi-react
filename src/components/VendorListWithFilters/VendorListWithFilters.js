import React, { useState, useEffect } from 'react';
import VendorList from '../VendorList/VendorList';
import '../../styles/VendorListWithFilters.css';
import { supabase } from '../../supabaseClient';

const categories = [
    { id: 'photography', name: 'Photography' },
    { id: 'videography', name: 'Videography' },
    { id: 'florist', name: 'Florist' },
    { id: 'catering', name: 'Catering' },
    { id: 'dj', name: 'DJ' },
    { id: 'beauty', name: 'Beauty' },
    { id: 'admin', name: 'Admin' }
];

const sortOptions = [
    { id: 'recommended', name: 'Recommended' },
    { id: 'base_price_low', name: 'Base Price: Low to High' },
    { id: 'base_price_high', name: 'Base Price: High to Low' }
];

const VendorListWithFilters = () => {
    const [selectedCategory, setSelectedCategory] = useState('photography'); // Default to 'photography'
    const [sortOrder, setSortOrder] = useState(sortOptions[0].id);
    const [vendorCount, setVendorCount] = useState(0);

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    const handleSortOrderChange = (event) => {
        setSortOrder(event.target.value);
    };

    useEffect(() => {
        const fetchVendorCount = async () => {
            let query = supabase
                .from('business_profiles')
                .select('*', { count: 'exact' });

            if (selectedCategory) {
                query = query.eq('business_category', selectedCategory);
            }

            const { count, error } = await query;

            if (error) {
                console.error('Error fetching vendor count:', error);
                return;
            }

            setVendorCount(count);
        };

        fetchVendorCount();
    }, [selectedCategory]);

    return (
        <div className="vendor-list-with-filters">
            <div className="filters-container">
                <div className="filters">
                    {categories.map(category => (
                        <button
                            key={category.id}
                            className={`filter-button ${selectedCategory === category.id ? 'active' : ''}`}
                            onClick={() => handleCategoryChange(category.id)}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '20px' }}>
                <div className="vendor-count">
                {vendorCount} businesses found
                </div>
            <div className="sort-selector">
                    <label htmlFor="sortOrder">Sort:</label>
                    <select id="sortOrder" value={sortOrder} onChange={handleSortOrderChange}>
                        {sortOptions.map(option => (
                            <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                    </select>
                </div>
                </div>

            </div>

            <VendorList selectedCategory={selectedCategory} sortOrder={sortOrder} />
        </div>
    );
};

export default VendorListWithFilters;
