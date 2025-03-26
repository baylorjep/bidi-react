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

    useEffect(() => {
        if (selectedCounty) {
            setFilteredCities(cities.filter(city => city.county === selectedCounty));
        } else {
            setFilteredCities(cities);
        }
    }, [selectedCounty]);

    const formatLocation = () => {
        if (!county && !city) return '';
        const formattedCounty = county ? county.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';
        const formattedCity = city ? city.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';
        return formattedCity ? `${formattedCounty}, ${formattedCity}` : formattedCounty;
    };

    const formatTitle = () => {
        const categoryName = category 
            ? categories.find(cat => cat.id === category)?.name?.toLowerCase() || ''
            : '';

        const typeString = (type && type !== 'all')
            ? (categoryTypes[category]?.find(t => t.id === type)?.name || '') + ' '
            : '';

        const formattedCounty = county ? counties.find(c => c.id === county)?.name || '' : '';
        const formattedCity = city ? cities.find(c => c.id === city)?.name || '' : '';
        const locationString = city && formattedCity ? `${formattedCity}, ${formattedCounty}` : formattedCounty;

        const parts = [typeString, categoryName].filter(Boolean).join('');
        return `${parts}${locationString ? ' in ' : ''}${locationString} | Bidi`;
    };

    const formatHeading = () => {
        const categoryName = category 
            ? categories.find(cat => cat.id === category)?.name?.toLowerCase() || ''
            : '';

        const typeString = (type && type !== 'all')
            ? (categoryTypes[category]?.find(t => t.id === type)?.name || '') + ' '
            : '';
            
        const formattedCounty = county ? counties.find(c => c.id === county)?.name || '' : '';
        const formattedCity = city ? cities.find(c => c.id === city)?.name || '' : '';
        const locationString = city && formattedCity ? `${formattedCity}, ${formattedCounty}` : formattedCounty;
        
        const parts = [typeString, categoryName].filter(Boolean).join('');
        return `${parts}${locationString ? ' in ' : ''}${locationString}`;
    };

    const formatDescription = () => {
        const categoryName = category 
            ? categories.find(cat => cat.id === category)?.name || ''
            : '';

        const typeString = (type && type !== 'all')
            ? (categoryTypes[category]?.find(t => t.id === type)?.name || '') + ' '
            : '';
        
        const formattedCounty = county ? counties.find(c => c.id === county)?.name || '' : '';
        const formattedCity = city ? cities.find(c => c.id === city)?.name || '' : '';
        const locationString = city && formattedCity ? `${formattedCity}, ${formattedCounty}` : formattedCounty;

        const parts = [typeString, categoryName].filter(Boolean).join('');
        return `Find the best ${parts}${locationString ? ' in ' : ''}${locationString}. Compare prices, read reviews, and book instantly with Bidi.`;
    };

    const handleCategoryChange = (newCategory) => {
        setSelectedCategory(newCategory);
        const path = selectedType 
            ? `/${selectedType}/${newCategory}/${selectedCounty || ''}/${selectedCity || ''}`
            : `/${newCategory}/${selectedCounty || ''}/${selectedCity || ''}`;
        navigate(path.replace(/\/+$/, '')); // Remove trailing slashes
    };

    const handleTypeChange = (newType) => {
        setSelectedType(newType);
        const path = `/${newType}/${selectedCategory}/${selectedCounty || ''}/${selectedCity || ''}`;
        navigate(path.replace(/\/+$/, '')); // Remove trailing slashes
    };

    const handleCountyChange = (newCounty) => {
        setSelectedCounty(newCounty);
        setSelectedCity(''); // Reset city when county changes
        const path = selectedType 
            ? `/${selectedType}/${selectedCategory}/${newCounty}`
            : `/${selectedCategory}/${newCounty}`;
        navigate(path);
    };

    const handleCityChange = (newCity) => {
        setSelectedCity(newCity);
        const path = selectedType 
            ? `/${selectedType}/${selectedCategory}/${selectedCounty}/${newCity}`
            : `/${selectedCategory}/${selectedCounty}/${newCity}`;
        navigate(path);
    };

    // Get the types for the selected category
    const getTypesForCategory = () => {
        return selectedCategory ? (categoryTypes[selectedCategory] || []) : [];
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
                    <h3 className='filter-title'>Find Wedding Services in {formatLocation()}</h3>
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
                        <h3 className='filter-title'>Find {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Services By Type</h3>
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
                    <h3 className='filter-title'>Find {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} in a Different County</h3>
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
                    <h3 className='filter-title'>Find {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} in a Different City</h3>
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
                county={selectedCounty}
                city={selectedCity}
                categoryType={selectedType === 'all' ? '' : selectedType}
            />
        </div>
    );
};

export default LocationBasedVendors;
