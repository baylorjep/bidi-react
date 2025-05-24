import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Define all possible categories
const categories = [
    { id: 'photography', name: 'Photographer' },
    { id: 'videography', name: 'Videographer' },
    { id: 'florist', name: 'Florist' },
    { id: 'catering', name: 'Caterer' },
    { id: 'dj', name: 'DJ' },
    { id: 'beauty', name: 'Hair and Makeup Artist' },
    { id: 'wedding planner/coordinator', name: 'Wedding Planner' }
];

// Define types for each category
const categoryTypes = {
    photography: [
        { id: 'wedding', name: 'Wedding' },
        { id: 'engagement', name: 'Engagement' },
        { id: 'event', name: 'Event' },
        { id: 'family', name: 'Family' },
        { id: 'portrait', name: 'Portrait' }
    ],
    videography: [
        { id: 'wedding', name: 'Wedding' },
        { id: 'engagement', name: 'Engagement' },
        { id: 'event', name: 'Event' },
        { id: 'commercial', name: 'Commercial' }
    ],
    florist: [
        { id: 'wedding', name: 'Wedding' },
        { id: 'event', name: 'Event' },
        { id: 'arrangement', name: 'Arrangement' }
    ],
    catering: [
        { id: 'wedding', name: 'Wedding' },
        { id: 'corporate', name: 'Corporate' },
        { id: 'event', name: 'Event' },
        { id: 'private', name: 'Private Chef' }
    ],
    dj: [
        { id: 'wedding', name: 'Wedding' },
        { id: 'party', name: 'Party' },
        { id: 'corporate', name: 'Corporate' },
        { id: 'event', name: 'Event' }
    ],
    beauty: [
        { id: 'wedding', name: 'Wedding' },
        { id: 'event', name: 'Event' },
        { id: 'photoshoot', name: 'Photoshoot' }
    ],
    'wedding-planner-coordinator': [
        { id: 'full-service', name: 'Full Service' },
        { id: 'partial-planning', name: 'Partial Planning' },
        { id: 'day-of', name: 'Day of Coordination' },
        { id: 'month-of', name: 'Month of Coordination' }
    ]
};

// Define counties
const counties = [
    { id: 'salt-lake-county', name: 'Salt Lake County' },
    { id: 'utah-county', name: 'Utah County' },
    { id: 'davis-county', name: 'Davis County' },
    { id: 'weber-county', name: 'Weber County' },
    { id: 'washington-county', name: 'Washington County' },
    { id: 'cache-county', name: 'Cache County' },
    { id: 'summit-county', name: 'Summit County' },
    { id: 'tooele-county', name: 'Tooele County' },
    { id: 'iron-county', name: 'Iron County' },
    { id: 'box-elder-county', name: 'Box Elder County' }
];

// Define cities with their corresponding counties
const cities = [
    // Salt Lake County
    { id: 'salt-lake-city', name: 'Salt Lake City', county: 'salt-lake-county' },
    { id: 'west-valley-city', name: 'West Valley City', county: 'salt-lake-county' },
    { id: 'west-jordan', name: 'West Jordan', county: 'salt-lake-county' },
    { id: 'sandy', name: 'Sandy', county: 'salt-lake-county' },
    { id: 'south-jordan', name: 'South Jordan', county: 'salt-lake-county' },
    { id: 'draper', name: 'Draper', county: 'salt-lake-county' },
    { id: 'herriman', name: 'Herriman', county: 'salt-lake-county' },
    { id: 'riverton', name: 'Riverton', county: 'salt-lake-county' },
    { id: 'murray', name: 'Murray', county: 'salt-lake-county' },
    { id: 'holladay', name: 'Holladay', county: 'salt-lake-county' },
    { id: 'cottonwood-heights', name: 'Cottonwood Heights', county: 'salt-lake-county' },
    { id: 'millcreek', name: 'Millcreek', county: 'salt-lake-county' },
    { id: 'taylorsville', name: 'Taylorsville', county: 'salt-lake-county' },
    
    // Utah County
    { id: 'provo', name: 'Provo', county: 'utah-county' },
    { id: 'orem', name: 'Orem', county: 'utah-county' },
    { id: 'lehi', name: 'Lehi', county: 'utah-county' },
    { id: 'pleasant-grove', name: 'Pleasant Grove', county: 'utah-county' },
    { id: 'spanish-fork', name: 'Spanish Fork', county: 'utah-county' },
    { id: 'springville', name: 'Springville', county: 'utah-county' },
    { id: 'american-fork', name: 'American Fork', county: 'utah-county' },
    { id: 'payson', name: 'Payson', county: 'utah-county' },
    { id: 'saratoga-springs', name: 'Saratoga Springs', county: 'utah-county' },
    
    // Davis County
    { id: 'layton', name: 'Layton', county: 'davis-county' },
    { id: 'bountiful', name: 'Bountiful', county: 'davis-county' },
    { id: 'clearfield', name: 'Clearfield', county: 'davis-county' },
    { id: 'kaysville', name: 'Kaysville', county: 'davis-county' },
    { id: 'farmington', name: 'Farmington', county: 'davis-county' },
    { id: 'centerville', name: 'Centerville', county: 'davis-county' },
    
    // Weber County
    { id: 'ogden', name: 'Ogden', county: 'weber-county' },
    { id: 'roy', name: 'Roy', county: 'weber-county' },
    { id: 'north-ogden', name: 'North Ogden', county: 'weber-county' },
    
    // Washington County
    { id: 'st-george', name: 'St. George', county: 'washington-county' },
    { id: 'washington-city', name: 'Washington City', county: 'washington-county' },
    { id: 'hurricane', name: 'Hurricane', county: 'washington-county' },
    
    // Cache County
    { id: 'logan', name: 'Logan', county: 'cache-county' },
    { id: 'north-logan', name: 'North Logan', county: 'cache-county' },
    { id: 'providence', name: 'Providence', county: 'cache-county' },
    
    // Summit County
    { id: 'park-city', name: 'Park City', county: 'summit-county' },
    
    // Tooele County
    { id: 'tooele', name: 'Tooele', county: 'tooele-county' },
    { id: 'grantsville', name: 'Grantsville', county: 'tooele-county' },
    
    // Iron County
    { id: 'cedar-city', name: 'Cedar City', county: 'iron-county' },
    
    // Box Elder County
    { id: 'brigham-city', name: 'Brigham City', county: 'box-elder-county' },
    { id: 'tremonton', name: 'Tremonton', county: 'box-elder-county' }
];

const VendorSearch = ({ onLocationPage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedCounty, setSelectedCounty] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const location = window.location.pathname;

    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update filtered cities when county changes
    useEffect(() => {
        if (selectedCounty) {
            setFilteredCities(cities.filter(city => city.county === selectedCounty));
            setSelectedCity(''); // Reset city when county changes
        } else {
            setFilteredCities([]);
            setSelectedCity('');
        }
    }, [selectedCounty]);

    // Reset type when category changes
    const handleCategoryChange = (e) => {
        const newCategory = e.target.value;
        setSelectedCategory(newCategory);
        setSelectedType(''); // Reset type when category changes
    };

    const handleSearch = () => {
        const segments = [];

        // Build URL path based on selected filters
        if (selectedType && selectedCategory) {
            // If both type and category are selected, type comes first
            segments.push(selectedType);
            // Replace spaces and slashes with hyphens for the category
            segments.push(selectedCategory.replace(/[\s\/]/g, '-'));
        } else if (selectedCategory) {
            // If only category is selected
            segments.push(selectedCategory.replace(/[\s\/]/g, '-'));
        }

        // Add location (city takes precedence over county)
        if (selectedCity) {
            segments.push(selectedCity);
        } else if (selectedCounty) {
            segments.push(selectedCounty);
        }

        // Construct the URL
        const path = segments.length > 0 ? `/${segments.join('/')}` : '/vendors';
        
        // Navigate with state information
        navigate(path, {
            state: {
                requestId: selectedCategory,
                table: `${selectedCategory}_requests`,
                categories: [{
                    id: selectedCategory,
                    name: categories.find(cat => cat.id === selectedCategory)?.name || selectedCategory,
                    table: `${selectedCategory}_requests`
                }]
            }
        });
        
        setIsOpen(false);
    };

    const handleViewAll = () => {
        navigate('/vendors');
        setIsOpen(false);
    };

    return (
        <div className="vendor-search" ref={dropdownRef}>
            <button className="search-button" onClick={() => setIsOpen(!isOpen)}>
                <i className="fas fa-search"></i> Browse Vendors
            </button>

            {isOpen && (
                <div className="search-dropdown">
                    {/* Category Selection */}
                    <div className="search-section">
                        <label>Category</label>
                        <select 
                            value={selectedCategory} 
                            onChange={handleCategoryChange}
                            className="search-select"
                        >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Type Selection - Only show if category is selected */}
                    {selectedCategory && (
                        <div className="search-section">
                            <label>Type</label>
                            <select 
                                value={selectedType} 
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="search-select"
                            >
                                <option value="">Select Type</option>
                                {categoryTypes[selectedCategory]?.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* County Selection */}
                    <div className="search-section">
                        <label>County</label>
                        <select 
                            value={selectedCounty} 
                            onChange={(e) => setSelectedCounty(e.target.value)}
                            className="search-select"
                        >
                            <option value="">Select County</option>
                            {counties.map(county => (
                                <option key={county.id} value={county.id}>
                                    {county.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* City Selection - Only show if county is selected */}
                    {selectedCounty && (
                        <div className="search-section">
                            <label>City</label>
                            <select 
                                value={selectedCity} 
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="search-select"
                            >
                                <option value="">Select City</option>
                                {filteredCities.map(city => (
                                    <option key={city.id} value={city.id}>
                                        {city.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Search Buttons */}
                    <button className="search-submit" onClick={handleSearch}>
                        Search Vendors
                    </button>
                    <button 
                        className="search-submit" 
                        style={{
                            marginTop: '8px',
                            backgroundColor: '#9633eb'
                        }} 
                        onClick={handleViewAll}
                    >
                        View All Vendors
                    </button>
                </div>
            )}
        </div>
    );
};

export default VendorSearch;
