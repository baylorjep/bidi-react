import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const categories = [
    { id: 'photography', name: 'Photographer' },
    { id: 'videography', name: 'Videographer' },
    { id: 'florist', name: 'Florist' },
    { id: 'catering', name: 'Caterer' },
    { id: 'dj', name: 'DJ' },
    { id: 'beauty', name: 'Hair and Makeup Artist' }, // Updated category name
];

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
    ]
};

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
    { id: 'box-elder-county', name: 'Box Elder County' },
];

const cities = [
    { id: 'salt-lake-city', name: 'Salt Lake City', county: 'salt-lake-county' },
    { id: 'provo', name: 'Provo', county: 'utah-county' },
    { id: 'ogden', name: 'Ogden', county: 'weber-county' },
    { id: 'st-george', name: 'St. George', county: 'washington-county' },
    { id: 'logan', name: 'Logan', county: 'cache-county' },
    { id: 'layton', name: 'Layton', county: 'davis-county' },
    { id: 'orem', name: 'Orem', county: 'utah-county' },
    { id: 'sandy', name: 'Sandy', county: 'salt-lake-county' },
    { id: 'west-valley-city', name: 'West Valley City', county: 'salt-lake-county' },
    { id: 'lehi', name: 'Lehi', county: 'utah-county' },
    { id: 'herriman', name: 'Herriman', county: 'salt-lake-county' },
    { id: 'draper', name: 'Draper', county: 'salt-lake-county' },
    { id: 'bountiful', name: 'Bountiful', county: 'davis-county' },
    { id: 'riverton', name: 'Riverton', county: 'salt-lake-county' },
    { id: 'south-jordan', name: 'South Jordan', county: 'salt-lake-county' },
    { id: 'tooele', name: 'Tooele', county: 'tooele-county' },
    { id: 'eagle-mountain', name: 'Eagle Mountain', county: 'utah-county' },
    { id: 'pleasant-grove', name: 'Pleasant Grove', county: 'utah-county' },
    { id: 'springville', name: 'Springville', county: 'utah-county' },
    { id: 'spanish-fork', name: 'Spanish Fork', county: 'utah-county' },
    { id: 'american-fork', name: 'American Fork', county: 'utah-county' },
    { id: 'kaysville', name: 'Kaysville', county: 'davis-county' },
    { id: 'centerville', name: 'Centerville', county: 'davis-county' },
    { id: 'farmington', name: 'Farmington', county: 'davis-county' },
    { id: 'heber-city', name: 'Heber City', county: 'wasatch-county' },
    { id: 'midway', name: 'Midway', county: 'wasatch-county' },
    { id: 'park-city', name: 'Park City', county: 'summit-county' },
    { id: 'saratoga-springs', name: 'Saratoga Springs', county: 'utah-county' },
    { id: 'holladay', name: 'Holladay', county: 'salt-lake-county' },
    { id: 'cottonwood-heights', name: 'Cottonwood Heights', county: 'salt-lake-county' },
    { id: 'murray', name: 'Murray', county: 'salt-lake-county' },
    { id: 'west-jordan', name: 'West Jordan', county: 'salt-lake-county' },
    { id: 'kearns', name: 'Kearns', county: 'salt-lake-county' },
    { id: 'taylorsville', name: 'Taylorsville', county: 'salt-lake-county' },
    { id: 'hurricane', name: 'Hurricane', county: 'washington-county' },
    { id: 'cedar-city', name: 'Cedar City', county: 'iron-county' },
    { id: 'moab', name: 'Moab', county: 'grand-county' },
    { id: 'brigham-city', name: 'Brigham City', county: 'box-elder-county' },
    { id: 'tremonton', name: 'Tremonton', county: 'box-elder-county' },
    { id: 'roosevelt', name: 'Roosevelt', county: 'duchesne-county' },
    { id: 'vernal', name: 'Vernal', county: 'uintah-county' },
    { id: 'price', name: 'Price', county: 'carbon-county' },
    { id: 'richfield', name: 'Richfield', county: 'sevier-county' },
    { id: 'monticello', name: 'Monticello', county: 'san-juan-county' },
    { id: 'kanab', name: 'Kanab', county: 'kane-county' },
];

const VendorSearch = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedCounty, setSelectedCounty] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = () => {
        let path = '';
        
        // Build URL in the format that LocationBasedVendors expects
        if (selectedCategory || selectedType || selectedCounty || selectedCity) {
            const segments = [];
            
            if (selectedType) segments.push(selectedType);
            if (selectedCategory) segments.push(selectedCategory);
            if (selectedCounty) segments.push(selectedCounty);
            if (selectedCity) segments.push(selectedCity);
            
            path = `/${segments.join('/')}`;
        }
        
        navigate(path);
        setIsOpen(false);
    };

    const handleViewAll = () => {
        navigate('/vendors');
        setIsOpen(false);
    };

    const getTypesForCategory = () => {
        return selectedCategory ? (categoryTypes[selectedCategory] || []) : [];
    };

    return (
        <div className="vendor-search" ref={dropdownRef}>
            <button className="search-button" onClick={() => setIsOpen(!isOpen)}>
                <i className="fas fa-search"></i> Browse Vendors
            </button>

            {isOpen && (
                <div className="search-dropdown">
                    <div className="search-section">
                        <label>Category</label>
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedCategory && (
                        <div className="search-section">
                            <label>Type</label>
                            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                                <option value="">Select Type</option>
                                {getTypesForCategory().map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="search-section">
                        <label>County</label>
                        <select value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}>
                            <option value="">Select County</option>
                            {counties.map(county => (
                                <option key={county.id} value={county.id}>{county.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedCounty && (
                        <div className="search-section">
                            <label>City</label>
                            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                                <option value="">Select City</option>
                                {filteredCities.map(city => (
                                    <option key={city.id} value={city.id}>{city.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button className="search-submit" onClick={handleSearch}>
                        Search Vendors
                    </button>
                    <button 
                        className="search-submit" 
                        style={{marginTop   :'8px', backgroundColor:'#9633eb'}} 
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
