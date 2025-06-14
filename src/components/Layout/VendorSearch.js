import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

const VendorSearch = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

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

    const handleLocationSearch = () => {
        navigate('/location-based-vendors');
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
                    {/* Search Buttons */}
                    <button className="search-submit" onClick={handleLocationSearch}>
                        <i className="fas fa-map-marker-alt"></i> Search by Location
                    </button>
                    <button 
                        className="search-submit" 
                        style={{
                            marginTop: '8px',
                            backgroundColor: '#9633eb'
                        }} 
                        onClick={handleViewAll}
                    >
                        <i className="fas fa-th-list"></i> View All Vendors
                    </button>
                </div>
            )}
        </div>
    );
};

export default VendorSearch;
