import React, { useState, useEffect } from 'react';
import VendorList from '../VendorList/VendorList';
import Ads from '../Ads/Ads';
import '../../styles/VendorListWithFilters.css';
import { supabase } from '../../supabaseClient';
import { Helmet } from 'react-helmet';

const categories = [
    { id: 'photography', name: 'Photography' },
    { id: 'videography', name: 'Videography' },
    { id: 'florist', name: 'Florist' },
    { id: 'catering', name: 'Catering' },
    { id: 'dj', name: 'DJ' },
    { id: 'beauty', name: 'Beauty' },
    { id: 'wedding planner/coordinator', name: 'Wedding Planning' }
];

const sortOptions = [
    { id: 'recommended', name: 'Recommended' },
    { id: 'rating', name: 'Rating' },
    { id: 'base_price_low', name: 'Base Price: Low to High' },
    { id: 'base_price_high', name: 'Base Price: High to Low' }
];

const VendorListWithFilters = () => {
    const [selectedCategory, setSelectedCategory] = useState('photography');
    const [sortOrder, setSortOrder] = useState(sortOptions[0].id);
    const [vendorCount, setVendorCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const vendorsPerPage = 5;

    useEffect(() => {
        const fetchVendorCount = async () => {
            let query = supabase
                .from('business_profiles')
                .select('*', { count: 'exact' })
                .or('stripe_account_id.not.is.null,Bidi_Plus.eq.true');

            if (selectedCategory) {
                query = query.filter('business_category', 'ov', `{${selectedCategory}}`);    
            }

            if (searchQuery) {
                query = query.ilike('business_name', `%${searchQuery}%`);
            }

            const { count, error } = await query;

            if (error) {
                console.error('Error fetching vendor count:', error);
                return;
            }

            setVendorCount(count);
        };

        fetchVendorCount();
    }, [selectedCategory, searchQuery]);

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setCurrentPage(1);
        setSortOrder('recommended');
    };

    const handleSortOrderChange = (event) => {
        setSortOrder(event.target.value);
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
        setCurrentPage(1); // Reset to first page when search changes
    };

    return (
        <div className="vendor-list-with-filters">
            <Helmet>
                <title>Find Wedding Vendors | Bidi</title>
                <meta name="description" content="Discover and compare top wedding vendors in your area. Browse photographers, videographers, florists, caterers, DJs, and more for your perfect wedding day." />
                <meta name="keywords" content="wedding vendors, wedding photographers, wedding videographers, wedding florists, wedding catering, wedding DJs, wedding beauty services" />
                <meta property="og:title" content="Find Wedding Vendors | Bidi" />
                <meta property="og:description" content="Discover and compare top wedding vendors in your area. Browse photographers, videographers, florists, caterers, DJs, and more for your perfect wedding day." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href={window.location.href} />
            </Helmet>

            <div className="vendor-list-header">
                <h1 className="vendor-list-title">Find Your Perfect Wedding Vendors</h1>
                <p className="vendor-list-subtitle">Browse and compare top-rated wedding professionals in your area</p>
            </div>

            <div className="filters-container">
                <div className="search-container">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            className="search-input-vendors-with-filters"
                            placeholder="Search vendors..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                        <svg 
                            className="search-icon-vendors-with-filters" 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path 
                                d="M21 21L15.803 15.803M15.803 15.803C17.2096 14.3964 18 12.4887 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18C12.4887 18 14.3964 17.2096 15.803 15.803Z" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>
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
                <div className="vendor-controls">
                    <div className="vendor-count">
                        {vendorCount} vendors
                    </div>
                    <div className="sort-selector">
                        <label htmlFor="sortOrder">Sort by:</label>
                        <select 
                            id="sortOrder" 
                            value={sortOrder} 
                            onChange={handleSortOrderChange}
                            className="sort-select"
                        >
                            {sortOptions.map(option => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="vendor-list-layout">
                <div className="vendor-list-main">
                    <VendorList 
                        selectedCategory={selectedCategory} 
                        sortOrder={sortOrder} 
                        currentPage={currentPage}
                        vendorsPerPage={vendorsPerPage}
                        setCurrentPage={setCurrentPage}
                        totalCount={vendorCount}
                        setTotalCount={setVendorCount}
                        searchQuery={searchQuery}
                    />
                </div>
                <aside className="vendor-list-ads">
                    <Ads />
                </aside>
            </div>
        </div>
    );
};

export default VendorListWithFilters;
