import React, { useState, useEffect } from 'react';
import VendorList from '../VendorList/VendorList';
import Ads from '../Ads/Ads';
import LoadingSpinner from '../LoadingSpinner';
import '../../styles/VendorListWithFilters.css';
import { supabase } from '../../supabaseClient';
import { Helmet } from 'react-helmet';
import { useSearchParams, useNavigate } from 'react-router-dom';

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

const VendorListWithFilters = ({ showAds = true }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Initialize state from URL parameters or defaults
    const [selectedCategory, setSelectedCategory] = useState(() => {
        return searchParams.get('category') || 'photography';
    });
    const [sortOrder, setSortOrder] = useState(() => {
        return searchParams.get('sort') || sortOptions[0].id;
    });
    const [currentPage, setCurrentPage] = useState(() => {
        const page = parseInt(searchParams.get('page')) || 1;
        return Math.max(1, page); // Ensure page is at least 1
    });
    const [searchQuery, setSearchQuery] = useState(() => {
        return searchParams.get('search') || '';
    });
    
    const [vendorCount, setVendorCount] = useState(0);
    const [isLoadingCount, setIsLoadingCount] = useState(true);
    const vendorsPerPage = 5;

    // Update URL when state changes
    const updateURL = (updates) => {
        const newSearchParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value && value !== '') {
                newSearchParams.set(key, value);
            } else {
                newSearchParams.delete(key);
            }
        });
        setSearchParams(newSearchParams);
    };

    // Update URL when filter state changes
    useEffect(() => {
        updateURL({
            category: selectedCategory,
            sort: sortOrder,
            page: currentPage.toString(),
            search: searchQuery
        });
    }, [selectedCategory, sortOrder, currentPage, searchQuery]);

    useEffect(() => {
        const fetchVendorCount = async () => {
            setIsLoadingCount(true);
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
            setIsLoadingCount(false);
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

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Calculate total pages
    const totalPages = Math.ceil(vendorCount / vendorsPerPage);

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show pages around current page
            let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let end = Math.min(totalPages, start + maxVisiblePages - 1);
            
            // Adjust start if we're near the end
            if (end === totalPages) {
                start = Math.max(1, end - maxVisiblePages + 1);
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        
        return pages;
    };

    return (
        <div className="vendor-list-with-filters">
            <Helmet>
                <title>Find Event Vendors | Bidi</title>
                <meta name="description" content="Discover and compare top wedding vendors in your area. Browse photographers, videographers, florists, caterers, DJs, and more for your perfect wedding day." />
                <meta name="keywords" content="wedding vendors, wedding photographers, wedding videographers, wedding florists, wedding catering, wedding DJs, wedding beauty services" />
                <meta property="og:title" content="Find Wedding Vendors | Bidi" />
                <meta property="og:description" content="Discover and compare top wedding vendors in your area. Browse photographers, videographers, florists, caterers, DJs, and more for your perfect wedding day." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href={window.location.href} />
            </Helmet>

            <div className="vendor-list-header">
                <h1 className="vendor-list-title">Find Your Perfect Event Vendors</h1>
                <p className="vendor-list-subtitle">Browse and compare top-rated event professionals in your area</p>
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
                        {isLoadingCount ? (
                            <LoadingSpinner variant="dots" color="#ff008a" size={16} />
                        ) : (
                            `${vendorCount} vendors`
                        )}
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
                        setCurrentPage={handlePageChange}
                        totalCount={vendorCount}
                        setTotalCount={setVendorCount}
                        searchQuery={searchQuery}
                    />
                </div>
                {showAds && (
                    <aside className="vendor-list-ads">
                        <Ads />
                    </aside>
                )}
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
                <div className="enhanced-pagination">
                    <div className="pagination-controls">
                        {/* First Page */}
                        {currentPage > 1 && (
                            <button 
                                className="pagination-btn pagination-btn-first"
                                onClick={() => handlePageChange(1)}
                                title="Go to first page"
                            >
                                « First
                            </button>
                        )}
                        
                        {/* Previous Page */}
                        {currentPage > 1 && (
                            <button 
                                className="pagination-btn pagination-btn-prev"
                                onClick={() => handlePageChange(currentPage - 1)}
                                title="Previous page"
                            >
                                ‹ Previous
                            </button>
                        )}
                        
                        {/* Page Numbers */}
                        <div className="page-numbers">
                            {getPageNumbers().map(pageNum => (
                                <button
                                    key={pageNum}
                                    className={`pagination-btn page-number ${currentPage === pageNum ? 'active' : ''}`}
                                    onClick={() => handlePageChange(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            ))}
                        </div>
                        
                        {/* Next Page */}
                        {currentPage < totalPages && (
                            <button 
                                className="pagination-btn pagination-btn-next"
                                onClick={() => handlePageChange(currentPage + 1)}
                                title="Next page"
                            >
                                Next ›
                            </button>
                        )}
                        
                        {/* Last Page */}
                        {currentPage < totalPages && (
                            <button 
                                className="pagination-btn pagination-btn-last"
                                onClick={() => handlePageChange(totalPages)}
                                title="Go to last page"
                            >
                                Last »
                            </button>
                        )}
                    </div>
                    
                    <div className="pagination-info">
                        <span>Page {currentPage} of {totalPages}</span>
                        <span>• {vendorCount} total vendors</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorListWithFilters;
