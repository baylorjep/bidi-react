import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VendorList from '../components/VendorList/VendorList';
import { Helmet } from 'react-helmet';
import '../styles/LocationBasedVendors.css';

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

const LocationBasedVendors = () => {
    const { category, county, city, type } = useParams();
    const navigate = useNavigate();

    const [selectedCategory, setSelectedCategory] = useState(category || '');
    const [selectedType, setSelectedType] = useState(type || 'all');
    const [selectedCounty, setSelectedCounty] = useState(county || '');
    const [selectedCity, setSelectedCity] = useState(city || '');
    const [filteredCities, setFilteredCities] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const vendorsPerPage = 10;

    useEffect(() => {
        if (selectedCounty) {
            setFilteredCities(cities.filter(city => city.county === selectedCounty));
        } else {
            setFilteredCities(cities);
        }
    }, [selectedCounty]);

    useEffect(() => {
        // Reset page when filters change
        setCurrentPage(1);
    }, [selectedCategory, selectedType, selectedCounty, selectedCity]);

    const formatLocation = () => {
        if (!county && !city) return 'Utah';
        
        const countyObj = county ? counties.find(c => c.id === county) : null;
        const cityObj = city ? cities.find(c => c.id === city) : null;
        
        if (cityObj && countyObj) {
            return `${cityObj.name}, ${countyObj.name}`;
        } else if (cityObj) {
            return cityObj.name;
        } else if (countyObj) {
            return countyObj.name;
        }
        return 'Utah';
    };

    const formatTitle = () => {
        // Get the category and type from URL parameters
        const categoryObj = categories.find(cat => cat.id === category);
        const typeObj = type && categoryObj ? categoryTypes[categoryObj.id]?.find(t => t.id === type) : null;
        const locationText = formatLocation();
        
        let titleParts = [];
        
        // Handle the category and type combination
        if (categoryObj) {
            if (typeObj) {
                if (categoryObj.id === 'photography') {
                    titleParts.push(`${typeObj.name} ${categoryObj.name}s`);
                } else {
                    titleParts.push(`${typeObj.name} ${categoryObj.name}s`);
                }
            } else {
                titleParts.push(`${categoryObj.name}s`);
            }
        } else {
            titleParts.push('Wedding Vendors');
        }
        
        titleParts.push(`in ${locationText}`);
        
        return `${titleParts.join(' ')} | Bidi`;
    };

    const formatHeading = () => {
        // Get the category and type from URL parameters
        const categoryObj = categories.find(cat => cat.id === category);
        const typeObj = type && categoryObj ? categoryTypes[categoryObj.id]?.find(t => t.id === type) : null;
        const locationText = formatLocation();
        
        let headingParts = [];
        headingParts.push('Find');
        
        // Handle the category and type combination
        if (categoryObj) {
            if (typeObj) {
                if (categoryObj.id === 'photography') {
                    headingParts.push(`${typeObj.name} ${categoryObj.name}s`);
                } else {
                    headingParts.push(`${typeObj.name} ${categoryObj.name}s`);
                }
            } else {
                headingParts.push(`${categoryObj.name}s`);
            }
        } else {
            headingParts.push('Wedding Vendors');
        }
        
        headingParts.push(`in ${locationText}`);
        
        return headingParts.join(' ');
    };

    const formatDescription = () => {
        const categoryName = category 
            ? categories.find(cat => cat.id === category)?.name || ''
            : 'Wedding Vendors';

        const typeString = (type && type !== 'all')
            ? (categoryTypes[category]?.find(t => t.id === type)?.name || '') + ' '
            : '';
        
        const formattedCounty = county ? counties.find(c => c.id === county)?.name || '' : '';
        const formattedCity = city ? cities.find(c => c.id === city)?.name || '' : '';
        
        let locationString = '';
        if (formattedCity && formattedCounty) {
            locationString = `${formattedCity}, ${formattedCounty}`;
        } else if (formattedCity) {
            locationString = formattedCity;
        } else if (formattedCounty) {
            locationString = formattedCounty;
        } else {
            locationString = 'Utah';
        }

        const serviceParts = [typeString, categoryName].filter(Boolean).join('');
        return `Find and compare the best ${serviceParts}s in ${locationString}. Read verified reviews, check prices, and book instantly with Bidi.`;
    };

    const handleCategoryChange = (newCategory) => {
        setSelectedCategory(newCategory);
        let path = '/';
        const segments = [];
        
        if (newCategory) segments.push(newCategory);
        if (selectedType && selectedType !== 'all') segments.unshift(selectedType);
        if (selectedCounty) segments.push(selectedCounty);
        if (selectedCity) segments.push(selectedCity);
        
        path += segments.join('/');
        navigate(path || '/');
    };

    const handleTypeChange = (newType) => {
        setSelectedType(newType);
        let path = '/';
        const segments = [];
        
        if (selectedCategory) segments.push(selectedCategory);
        if (newType && newType !== 'all') segments.unshift(newType);
        if (selectedCounty) segments.push(selectedCounty);
        if (selectedCity) segments.push(selectedCity);
        
        path += segments.join('/');
        navigate(path || '/');
    };

    const handleCountyChange = (newCounty) => {
        setSelectedCounty(newCounty);
        setSelectedCity(''); // Reset city when county changes
        let path = '/';
        const segments = [];
        
        if (selectedCategory) segments.push(selectedCategory);
        if (selectedType && selectedType !== 'all') segments.unshift(selectedType);
        if (newCounty) segments.push(newCounty);
        
        path += segments.join('/');
        navigate(path || '/');
    };

    const handleCityChange = (newCity) => {
        setSelectedCity(newCity);
        let path = '/';
        const segments = [];
        
        if (selectedCategory) segments.push(selectedCategory);
        if (selectedType && selectedType !== 'all') segments.unshift(selectedType);
        if (selectedCounty) segments.push(selectedCounty);
        if (newCity) segments.push(newCity);
        
        path += segments.join('/');
        navigate(path || '/');
    };

    // Get the types for the selected category
    const getTypesForCategory = () => {
        return selectedCategory ? (categoryTypes[selectedCategory] || []) : [];
    };

    // Add these new handler functions after the existing handle*Change functions
    const handleResetCategory = () => {
        setSelectedCategory('');
        setSelectedType(''); // Reset type when category is reset
        let path = '/';
        const segments = [];
        
        if (selectedCounty) segments.push(selectedCounty);
        if (selectedCity) segments.push(selectedCity);
        
        path += segments.join('/');
        navigate(path || '/');
    };

    const handleResetType = () => {
        setSelectedType('');
        let path = '/';
        const segments = [];
        
        if (selectedCategory) segments.push(selectedCategory);
        if (selectedCounty) segments.push(selectedCounty);
        if (selectedCity) segments.push(selectedCity);
        
        path += segments.join('/');
        navigate(path || '/');
    };

    const handleResetCounty = () => {
        setSelectedCounty('');
        setSelectedCity(''); // Reset city when county is reset
        let path = '/';
        const segments = [];
        
        if (selectedCategory) segments.push(selectedCategory);
        if (selectedType && selectedType !== 'all') segments.unshift(selectedType);
        
        path += segments.join('/');
        navigate(path || '/');
    };

    const handleResetCity = () => {
        setSelectedCity('');
        let path = '/';
        const segments = [];
        
        if (selectedCategory) segments.push(selectedCategory);
        if (selectedType && selectedType !== 'all') segments.unshift(selectedType);
        if (selectedCounty) segments.push(selectedCounty);
        
        path += segments.join('/');
        navigate(path || '/');
    };

    return (
        <div className="location-based-vendors" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <Helmet>
                <title>{formatTitle()}</title>
                <meta name="description" content={formatDescription()} />
                <meta property="og:title" content={formatTitle()} />
                <meta property="og:description" content={formatDescription()} />
            </Helmet>
            
            <h1 style={{fontFamily:'Outfit', fontWeight:"bold"}}>
                {formatHeading()}
            </h1>
            
            <div className="filters-container-SEO">
                <div className="filter-group">
                    <div className="filter-header">
                        <h3 className='filter-title'>Find Wedding Services in {formatLocation() || 'Utah'}</h3>
                        {selectedCategory && (
                            <button 
                                className="reset-filter-button"
                                onClick={handleResetCategory}
                                aria-label="Reset category filter"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`filter-button-SEO ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => handleCategoryChange(cat.id)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {selectedCategory && (
                    <div className="filter-group">
                        <div className="filter-header">
                            <h3 className='filter-title'>
                                Find {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Services By Type
                            </h3>
                            {selectedType && selectedType !== 'all' && (
                                <button 
                                    className="reset-filter-button"
                                    onClick={handleResetType}
                                    aria-label="Reset type filter"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        {getTypesForCategory().map(t => (
                            <button
                                key={t.id}
                                className={`filter-button-SEO ${selectedType === t.id ? 'active' : ''}`}
                                onClick={() => handleTypeChange(t.id)}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="filter-group">
                    <div className="filter-header">
                        <h3 className='filter-title'>
                            Find {selectedCategory ? 
                                `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}s` : 
                                'Wedding Vendors'} in a Different County
                        </h3>
                        {selectedCounty && (
                            <button 
                                className="reset-filter-button"
                                onClick={handleResetCounty}
                                aria-label="Reset county filter"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {counties.map(county => (
                        <button
                            key={county.id}
                            className={`filter-button-SEO ${selectedCounty === county.id ? 'active' : ''}`}
                            onClick={() => handleCountyChange(county.id)}
                        >
                            {county.name}
                        </button>
                    ))}
                </div>
                <div className="filter-group">
                    <div className="filter-header">
                        <h3 className='filter-title'>
                            Find {selectedCategory ? 
                                `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}s` : 
                                'Wedding Vendors'} in a Different City
                        </h3>
                        {selectedCity && (
                            <button 
                                className="reset-filter-button"
                                onClick={handleResetCity}
                                aria-label="Reset city filter"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {filteredCities.map(city => (
                        <button
                            key={city.id}
                            className={`filter-button-SEO ${selectedCity === city.id ? 'active' : ''}`}
                            onClick={() => handleCityChange(city.id)}
                        >
                            {city.name}
                        </button>
                    ))}
                </div>
            </div>

            <VendorList 
                selectedCategory={selectedCategory}
                sortOrder="recommended"
                location={selectedCity || selectedCounty} // Changed to use selected values
                categoryType={selectedType === 'all' ? '' : selectedType}
                currentPage={currentPage}
                vendorsPerPage={vendorsPerPage}
                setCurrentPage={setCurrentPage}
                totalCount={totalCount}
                setTotalCount={setTotalCount}
                preferredLocation={selectedCity || selectedCounty} // Changed to use selected values
                preferredType={selectedType}
            />
        </div>
    );
};

export default LocationBasedVendors;
