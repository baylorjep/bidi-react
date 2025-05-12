import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VendorList from '../components/VendorList/VendorList';
import { Helmet } from 'react-helmet';
import '../styles/LocationBasedVendors.css';
import { supabase } from '../supabaseClient';

const categories = [
    { id: 'photography', name: 'Photographer' },
    { id: 'videography', name: 'Videographer' },
    { id: 'florist', name: 'Florist' },
    { id: 'catering', name: 'Caterer' },
    { id: 'dj', name: 'DJ' },
    { id: 'beauty', name: 'Hair and Makeup Artist' },
    { id: 'wedding planner/coordinator', name: 'Wedding Planner' }
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
    ],
    'wedding planner/coordinator': [
        { id: 'full-service', name: 'Full Service' },
        { id: 'partial-planning', name: 'Partial Planning' },
        { id: 'day-of', name: 'Day of Coordination' },
        { id: 'month-of', name: 'Month of Coordination' }
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
    // Salt Lake County
    { id: 'salt-lake-city', name: 'Salt Lake City', county: 'salt-lake-county' },
    { id: 'west-valley-city', name: 'West Valley City', county: 'salt-lake-county' },
    { id: 'west-jordan', name: 'West Jordan', county: 'salt-lake-county' },
    { id: 'sandy', name: 'Sandy', county: 'salt-lake-county' },
    { id: 'south-jordan', name: 'South Jordan', county: 'salt-lake-county' },
    { id: 'taylorsville', name: 'Taylorsville', county: 'salt-lake-county' },
    { id: 'murray', name: 'Murray', county: 'salt-lake-county' },
    { id: 'millcreek', name: 'Millcreek', county: 'salt-lake-county' },
    { id: 'cottonwood-heights', name: 'Cottonwood Heights', county: 'salt-lake-county' },
    { id: 'holladay', name: 'Holladay', county: 'salt-lake-county' },
    { id: 'herriman', name: 'Herriman', county: 'salt-lake-county' },
    { id: 'riverton', name: 'Riverton', county: 'salt-lake-county' },
    { id: 'draper', name: 'Draper', county: 'salt-lake-county' },
    { id: 'midvale', name: 'Midvale', county: 'salt-lake-county' },
    { id: 'south-salt-lake', name: 'South Salt Lake', county: 'salt-lake-county' },

    // Utah County
    { id: 'provo', name: 'Provo', county: 'utah-county' },
    { id: 'orem', name: 'Orem', county: 'utah-county' },
    { id: 'lehi', name: 'Lehi', county: 'utah-county' },
    { id: 'spanish-fork', name: 'Spanish Fork', county: 'utah-county' },
    { id: 'pleasant-grove', name: 'Pleasant Grove', county: 'utah-county' },
    { id: 'american-fork', name: 'American Fork', county: 'utah-county' },
    { id: 'springville', name: 'Springville', county: 'utah-county' },
    { id: 'payson', name: 'Payson', county: 'utah-county' },
    { id: 'saratoga-springs', name: 'Saratoga Springs', county: 'utah-county' },
    { id: 'eagle-mountain', name: 'Eagle Mountain', county: 'utah-county' },
    { id: 'highland', name: 'Highland', county: 'utah-county' },
    { id: 'lindon', name: 'Lindon', county: 'utah-county' },
    { id: 'mapleton', name: 'Mapleton', county: 'utah-county' },
    { id: 'vineyard', name: 'Vineyard', county: 'utah-county' },
    { id: 'cedar-hills', name: 'Cedar Hills', county: 'utah-county' },

    // Davis County
    { id: 'layton', name: 'Layton', county: 'davis-county' },
    { id: 'bountiful', name: 'Bountiful', county: 'davis-county' },
    { id: 'clearfield', name: 'Clearfield', county: 'davis-county' },
    { id: 'syracuse', name: 'Syracuse', county: 'davis-county' },
    { id: 'kaysville', name: 'Kaysville', county: 'davis-county' },
    { id: 'farmington', name: 'Farmington', county: 'davis-county' },
    { id: 'centerville', name: 'Centerville', county: 'davis-county' },
    { id: 'north-salt-lake', name: 'North Salt Lake', county: 'davis-county' },
    { id: 'woods-cross', name: 'Woods Cross', county: 'davis-county' },
    { id: 'clinton', name: 'Clinton', county: 'davis-county' },
    { id: 'fruit-heights', name: 'Fruit Heights', county: 'davis-county' },
    { id: 'west-bountiful', name: 'West Bountiful', county: 'davis-county' },
    { id: 'sunset', name: 'Sunset', county: 'davis-county' },

    // Weber County
    { id: 'ogden', name: 'Ogden', county: 'weber-county' },
    { id: 'roy', name: 'Roy', county: 'weber-county' },
    { id: 'south-ogden', name: 'South Ogden', county: 'weber-county' },
    { id: 'north-ogden', name: 'North Ogden', county: 'weber-county' },
    { id: 'washington-terrace', name: 'Washington Terrace', county: 'weber-county' },
    { id: 'riverdale', name: 'Riverdale', county: 'weber-county' },
    { id: 'west-haven', name: 'West Haven', county: 'weber-county' },
    { id: 'pleasant-view', name: 'Pleasant View', county: 'weber-county' },
    { id: 'harrisville', name: 'Harrisville', county: 'weber-county' },

    // Washington County
    { id: 'st-george', name: 'St. George', county: 'washington-county' },
    { id: 'washington-city', name: 'Washington City', county: 'washington-county' },
    { id: 'hurricane', name: 'Hurricane', county: 'washington-county' },
    { id: 'santa-clara', name: 'Santa Clara', county: 'washington-county' },
    { id: 'ivins', name: 'Ivins', county: 'washington-county' },
    { id: 'la-verkin', name: 'La Verkin', county: 'washington-county' },

    // Cache County
    { id: 'logan', name: 'Logan', county: 'cache-county' },
    { id: 'north-logan', name: 'North Logan', county: 'cache-county' },
    { id: 'smithfield', name: 'Smithfield', county: 'cache-county' },
    { id: 'hyrum', name: 'Hyrum', county: 'cache-county' },
    { id: 'providence', name: 'Providence', county: 'cache-county' },
    { id: 'nibley', name: 'Nibley', county: 'cache-county' },

    // Box Elder County
    { id: 'brigham-city', name: 'Brigham City', county: 'box-elder-county' },
    { id: 'tremonton', name: 'Tremonton', county: 'box-elder-county' },
    { id: 'perry', name: 'Perry', county: 'box-elder-county' },

    // Tooele County
    { id: 'tooele', name: 'Tooele', county: 'tooele-county' },
    { id: 'grantsville', name: 'Grantsville', county: 'tooele-county' },
    { id: 'stansbury-park', name: 'Stansbury Park', county: 'tooele-county' },

    // Summit County
    { id: 'park-city', name: 'Park City', county: 'summit-county' },
    { id: 'snyderville', name: 'Snyderville', county: 'summit-county' },
    { id: 'kimball-junction', name: 'Kimball Junction', county: 'summit-county' },

    // Iron County
    { id: 'cedar-city', name: 'Cedar City', county: 'iron-county' },
    { id: 'enoch', name: 'Enoch', county: 'iron-county' },

    // Other Notable Cities
    { id: 'vernal', name: 'Vernal', county: 'uintah-county' },
    { id: 'moab', name: 'Moab', county: 'grand-county' },
    { id: 'price', name: 'Price', county: 'carbon-county' },
    { id: 'richfield', name: 'Richfield', county: 'sevier-county' },
    { id: 'heber-city', name: 'Heber City', county: 'wasatch-county' },
    { id: 'midway', name: 'Midway', county: 'wasatch-county' },
    { id: 'roosevelt', name: 'Roosevelt', county: 'duchesne-county' },
    { id: 'ephraim', name: 'Ephraim', county: 'sanpete-county' },
    { id: 'nephi', name: 'Nephi', county: 'juab-county' },
    { id: 'delta', name: 'Delta', county: 'millard-county' },
    { id: 'kanab', name: 'Kanab', county: 'kane-county' },
    { id: 'blanding', name: 'Blanding', county: 'san-juan-county' },
    { id: 'monticello', name: 'Monticello', county: 'san-juan-county' }
];

const LocationBasedVendors = () => {
    const { category, county, city, type } = useParams();
    const navigate = useNavigate();

    // Helper function to check if a string is a valid type for a specific category
    const isValidTypeForCategory = (typeStr, categoryStr) => {
        console.log('Checking type validity:', { typeStr, categoryStr }); // Debug log
        if (!categoryStr || !categoryTypes[categoryStr]) {
            console.log('Invalid category or no types found for category'); // Debug log
            return false;
        }
        const isValid = categoryTypes[categoryStr].some(t => t.id === typeStr);
        console.log('Type validity result:', isValid); // Debug log
        return isValid;
    };

    // Helper function to check if a string is a valid category
    const isValidCategory = (str) => {
        console.log('Checking category validity:', str); // Debug log
        const isValid = categories.some(cat => cat.id === str);
        console.log('Category validity result:', isValid); // Debug log
        return isValid;
    };

    // Helper function to check if a string is a valid type for any category
    const isValidType = (typeStr) => {
        console.log('Checking if type is valid for any category:', typeStr); // Debug log
        const isValid = Object.values(categoryTypes).some(types => 
            types.some(t => t.id === typeStr)
        );
        console.log('Type validity result:', isValid); // Debug log
        return isValid;
    };

    // Helper function to check if a string is a valid city
    const isValidCity = (str) => cities.some(c => c.id === str);

    // Helper function to check if a string is a valid county
    const isValidCounty = (str) => counties.some(c => c.id === str);

    // Helper function to check if a string is a valid location (city or county)
    const isValidLocation = (str) => isValidCity(str) || isValidCounty(str);

    // Determine the correct category, type, and location from URL parameters
    const determineInitialValues = () => {
        console.log('URL Parameters:', { type, category, city, county }); // Debug log

        // Decode the category parameter to handle spaces and slashes
        const decodedCategory = category ? decodeURIComponent(category) : '';
        const decodedType = type ? decodeURIComponent(type) : '';

        console.log('Decoded parameters:', { decodedType, decodedCategory, city, county }); // Debug log

        // Special handling for wedding planner/coordinator category
        if (decodedCategory === 'wedding planner/coordinator' || decodedCategory === 'wedding planner') {
            if (decodedType && (city || county)) {
                const location = city || county;
                if (isValidTypeForCategory(decodedType, 'wedding planner/coordinator') && isValidLocation(location)) {
                    return {
                        category: 'wedding planner/coordinator', // Use the full category name for database queries
                        type: decodedType,
                        location: location
                    };
                }
            } else if (decodedType) {
                if (isValidTypeForCategory(decodedType, 'wedding planner/coordinator')) {
                    return {
                        category: 'wedding planner/coordinator', // Use the full category name for database queries
                        type: decodedType,
                        location: ''
                    };
                }
            }
        }

        // Case 1: /type/category/location (city or county)
        if (decodedType && decodedCategory && (city || county)) {
            const location = city || county;
            console.log('Checking Case 1:', { decodedType, decodedCategory, location }); // Debug log
            
            // First check if the category is valid
            const isCategoryValid = isValidCategory(decodedCategory);
            console.log('Category valid:', isCategoryValid); // Debug log
            
            if (isCategoryValid) {
                // Then check if the type is valid for this category
                const isTypeValid = isValidTypeForCategory(decodedType, decodedCategory);
                console.log('Type valid for category:', isTypeValid); // Debug log
                
                if (isTypeValid) {
                    // Finally check if the location is valid
                    const isLocationValid = isValidLocation(location);
                    console.log('Location valid:', isLocationValid); // Debug log
                    
                    if (isLocationValid) {
                        console.log('Case 1 matched:', { category: decodedCategory, type: decodedType, location }); // Debug log
                        return {
                            category: decodedCategory,
                            type: decodedType,
                            location: location
                        };
                    }
                }
            }
        }

        // Case 2: /type/category
        if (decodedType && decodedCategory && !city && !county) {
            if (isValidCategory(decodedCategory) && isValidTypeForCategory(decodedType, decodedCategory)) {
                console.log('Case 2 matched:', { category: decodedCategory, type: decodedType }); // Debug log
                return {
                    category: decodedCategory,
                    type: decodedType,
                    location: ''
                };
            }
        }

        // Case 3: /category/location
        if (decodedCategory && !decodedType && (city || county)) {
            const location = city || county;
            if (isValidCategory(decodedCategory) && isValidLocation(location)) {
                console.log('Case 3 matched:', { category: decodedCategory, location }); // Debug log
                return {
                    category: decodedCategory,
                    type: '',
                    location: location
                };
            }
        }

        // Case 4: /category
        if (decodedCategory && !decodedType && !city && !county) {
            if (isValidCategory(decodedCategory)) {
                console.log('Case 4 matched:', { category: decodedCategory }); // Debug log
                return {
                    category: decodedCategory,
                    type: '',
                    location: ''
                };
            }
        }

        // Default case: empty values if no valid pattern is matched
        console.log('No case matched, using default values'); // Debug log
        return {
            category: '',
            type: '',
            location: ''
        };
    };

    const initialValues = determineInitialValues();
    const [selectedCategory, setSelectedCategory] = useState(initialValues.category);
    const [selectedType, setSelectedType] = useState(initialValues.type);
    const [selectedCounty, setSelectedCounty] = useState(county || '');
    const [selectedCity, setSelectedCity] = useState(city || initialValues.location);
    const [openFilter, setOpenFilter] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const vendorsPerPage = 10;

    // Add search states for each filter
    const [categorySearch, setCategorySearch] = useState('');
    const [typeSearch, setTypeSearch] = useState('');
    const [citySearch, setCitySearch] = useState('');

    // Add filter functions
    const getFilteredCategories = () => {
        return categories.filter(cat => 
            cat.name.toLowerCase().includes(categorySearch.toLowerCase())
        );
    };

    const getFilteredTypes = () => {
        const types = getTypesForCategory();
        return types.filter(type => 
            type.name.toLowerCase().includes(typeSearch.toLowerCase())
        );
    };

    const getFilteredCities = () => {
        let filteredCities = cities;
        
        // First filter by selected county if one is selected
        if (selectedCounty) {
            filteredCities = cities.filter(city => city.county === selectedCounty);
        }
        
        // Then filter by search term if one exists
        if (citySearch) {
            filteredCities = filteredCities.filter(city => 
                city.name.toLowerCase().includes(citySearch.toLowerCase())
            );
        }
        
        return filteredCities;
    };

    // Reset search when closing filters
    const toggleFilter = (filterName) => {
        if (openFilter === filterName) {
            setOpenFilter(null);
        } else {
            if (openFilter) {
                document.querySelector(`.filter-accordion[data-filter="${openFilter}"]`)?.classList.remove('active');
            }
            setOpenFilter(filterName);
        }
    };

    // Add cleanup effect
    useEffect(() => {
        return () => {
            // No cleanup needed anymore
        };
    }, []);

    useEffect(() => {
        // Reset page when filters change
        setCurrentPage(1);
    }, [selectedCategory, selectedType, selectedCounty, selectedCity]);

    useEffect(() => {
        const fetchVendorCount = async () => {
            let query = supabase
                .from('business_profiles')
                .select('*', { count: 'exact' })
                .or('stripe_account_id.not.is.null,Bidi_Plus.eq.true');

            if (selectedCategory) {
                // For wedding planner/coordinator category, ensure we're using the correct category name
                const categoryToQuery = selectedCategory === 'wedding planner/coordinator' ? 
                    'wedding planner/coordinator' : selectedCategory;
                query = query.ov('business_category', [categoryToQuery]);
            }

            if (selectedCity) {
                query = query.ilike('business_address', `%${selectedCity.replace(/-/g, ' ')}%`);
            }

            const { count, error } = await query;

            if (error) {
                console.error('Error fetching vendor count:', error);
                return;
            }

            setTotalCount(count);
        };

        fetchVendorCount();
    }, [selectedCategory, selectedCity]);

    const formatLocation = () => {
        if (selectedCity) {
            const cityObj = cities.find(c => c.id === selectedCity);
            return cityObj ? cityObj.name : 'Utah';
        } else if (selectedCounty) {
            const countyObj = counties.find(c => c.id === selectedCounty);
            return countyObj ? countyObj.name : 'Utah';
        }
        return 'Utah';
    };

    const formatTitle = () => {
        const categoryObj = categories.find(cat => cat.id === selectedCategory);
        const typeObj = selectedType && categoryObj ? categoryTypes[categoryObj.id]?.find(t => t.id === selectedType) : null;
        const locationText = formatLocation();
        
        let titleParts = [];
        
        // Handle the category and type combination
        if (categoryObj) {
            if (typeObj) {
                titleParts.push(`${typeObj.name} ${categoryObj.name}s`);
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
        const categoryObj = categories.find(cat => cat.id === selectedCategory);
        const typeObj = selectedType && categoryObj ? categoryTypes[categoryObj.id]?.find(t => t.id === selectedType) : null;
        const locationText = formatLocation();
        
        let headingParts = [];
        headingParts.push('Find');
        
        // Handle the category and type combination
        if (categoryObj) {
            if (typeObj) {
                headingParts.push(`${typeObj.name} ${categoryObj.name}s`);
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
        const categoryName = selectedCategory 
            ? categories.find(cat => cat.id === selectedCategory)?.name || ''
            : 'Wedding Vendors';

        const typeString = (selectedType && selectedType !== 'all')
            ? (categoryTypes[selectedCategory]?.find(t => t.id === selectedType)?.name || '') + ' '
            : '';
        
        let locationString = '';
        if (selectedCity) {
            locationString = cities.find(c => c.id === selectedCity)?.name || '';
        } else if (selectedCounty) {
            locationString = counties.find(c => c.id === selectedCounty)?.name || '';
        } else {
            locationString = 'Utah';
        }

        const serviceParts = [typeString, categoryName].filter(Boolean).join('');
        return `Find and compare the best ${serviceParts}s in ${locationString}. Read verified reviews, check prices, and book instantly with Bidi.`;
    };

    const handleCategoryChange = (newCategory) => {
        if (!isValidCategory(newCategory)) return;
        
        setSelectedCategory(newCategory);
        setSelectedType(''); // Reset type when category changes
        
        let path = `/${newCategory}`;
        
        // Add location if exists and is valid
        if (selectedCity && isValidCity(selectedCity)) {
            path += `/${selectedCity}`;
        } else if (selectedCounty && isValidCounty(selectedCounty)) {
            path += `/${selectedCounty}`;
        }
        
        navigate(path);
    };

    const handleTypeChange = (newType) => {
        console.log('Type changed to:', newType);
        setSelectedType(newType);
        
        // Special handling for wedding planner/coordinator category
        if (selectedCategory === 'wedding planner/coordinator') {
            // For wedding planners, we want to keep the full category name
            const path = `/${newType}/${encodeURIComponent('wedding planner/coordinator')}`;
            const locationPath = selectedCity ? `/${encodeURIComponent(selectedCity)}` : '';
            navigate(path + locationPath);
        } else {
            const path = `/${newType}/${encodeURIComponent(selectedCategory)}`;
            const locationPath = selectedCity ? `/${encodeURIComponent(selectedCity)}` : '';
            navigate(path + locationPath);
        }
    };

    const handleCountyChange = (newCounty) => {
        if (!isValidCounty(newCounty)) return;
        
        setSelectedCounty(newCounty);
        setSelectedCity(''); // Reset city when county changes
        
        let path = '/';
        
        // Add type and category if they exist
        if (selectedType && selectedCategory && isValidTypeForCategory(selectedType, selectedCategory)) {
            path += `${selectedType}/${selectedCategory}/`;
        } else if (selectedCategory && isValidCategory(selectedCategory)) {
            path += `${selectedCategory}/`;
        }
        
        path += newCounty;
        navigate(path);
    };

    const handleCityChange = (newCity) => {
        if (!isValidCity(newCity)) return;
        
        setSelectedCity(newCity);
        
        let path = '/';
        
        // Add type and category if they exist
        if (selectedType && selectedCategory && isValidTypeForCategory(selectedType, selectedCategory)) {
            path += `${selectedType}/${selectedCategory}/`;
        } else if (selectedCategory && isValidCategory(selectedCategory)) {
            path += `${selectedCategory}/`;
        }
        
        path += newCity;
        navigate(path);
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

    // Generate structured data for the page
    const generateStructuredData = () => {
        const categoryObj = categories.find(cat => cat.id === selectedCategory);
        const typeObj = selectedType && categoryObj ? categoryTypes[categoryObj.id]?.find(t => t.id === selectedType) : null;
        const locationText = formatLocation();

        return {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": formatTitle().replace(" | Bidi", ""),
            "description": formatDescription(),
            "areaServed": {
                "@type": "State",
                "name": "Utah",
                "containsPlace": {
                    "@type": selectedCity ? "City" : "County",
                    "name": locationText
                }
            },
            "serviceType": categoryObj ? `${typeObj ? typeObj.name + ' ' : ''}${categoryObj.name}` : "Wedding Vendor",
            "url": window.location.href
        };
    };

    return (
        <div className="location-based-vendors">
            <Helmet>
                <title>{formatTitle()}</title>
                <meta name="description" content={formatDescription()} />
                <meta property="og:title" content={formatTitle()} />
                <meta property="og:description" content={formatDescription()} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={window.location.href} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={formatTitle()} />
                <meta name="twitter:description" content={formatDescription()} />
                <link rel="canonical" href={window.location.href} />
                <meta name="robots" content="index, follow" />
                <script type="application/ld+json">
                    {JSON.stringify(generateStructuredData())}
                </script>
            </Helmet>
            
            {/* Breadcrumb Navigation */}
            <nav aria-label="breadcrumb" className="breadcrumb-container">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a href="/">Home</a></li>
                    {selectedCategory && (
                        <li className="breadcrumb-item">
                            <a href={`/${selectedCategory}`}>
                                {categories.find(cat => cat.id === selectedCategory)?.name}s
                            </a>
                        </li>
                    )}
                    {selectedType && selectedType !== 'all' && (
                        <li className="breadcrumb-item">
                            <a href={`/${selectedCategory}/${selectedType}`}>
                                {categoryTypes[selectedCategory]?.find(t => t.id === selectedType)?.name}
                            </a>
                        </li>
                    )}
                    {selectedCity && (
                        <li className="breadcrumb-item active" aria-current="page">
                            {cities.find(c => c.id === selectedCity)?.name}
                        </li>
                    )}
                </ol>
            </nav>
            
            <header>
                <h1 style={{fontFamily:'Outfit', fontWeight:"bold"}} className="page-title">
                    {formatHeading()}
                </h1>
                <p className="lead text-center location-description">
                    {formatDescription()}
                </p>
            </header>
            
            <main style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
                <section className="filters-section">
                    <h2 className="visually-hidden">Search Filters</h2>
                    <div className="filters-container-SEO">
                        <div className="filter-accordion" data-filter="category">
                            <div 
                                className={`filter-header ${openFilter === 'category' ? 'open' : ''}`}
                                onClick={() => toggleFilter('category')}
                            >
                                <h3 className='filter-title'>
                                    {selectedCategory ? 
                                        `Selected: ${categories.find(cat => cat.id === selectedCategory)?.name}` : 
                                        'Select Service Type'}
                                    <span className="dropdown-arrow">▼</span>
                                </h3>
                                {selectedCategory && (
                                    <button 
                                        className="reset-filter-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleResetCategory();
                                        }}
                                        aria-label="Reset category filter"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <div className={`filter-content ${openFilter === 'category' ? 'open' : ''}`}>
                                <input
                                    type="text"
                                    className="filter-search"
                                    placeholder="Search services..."
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className="filter-content-grid">
                                    {getFilteredCategories().map(cat => (
                                        <button
                                            key={cat.id}
                                            className={`filter-button-SEO ${selectedCategory === cat.id ? 'active' : ''}`}
                                            onClick={() => {
                                                handleCategoryChange(cat.id);
                                                toggleFilter(null);
                                            }}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {selectedCategory && (
                            <div className="filter-accordion" data-filter="type">
                                <div 
                                    className={`filter-header ${openFilter === 'type' ? 'open' : ''}`}
                                    onClick={() => toggleFilter('type')}
                                >
                                    <h3 className='filter-title'>
                                        {selectedType && selectedType !== 'all' ? 
                                            `Selected: ${categoryTypes[selectedCategory]?.find(t => t.id === selectedType)?.name}` : 
                                            'Pick a specialization'}
                                        <span className="dropdown-arrow">▼</span>
                                    </h3>
                                    {selectedType && selectedType !== 'all' && (
                                        <button 
                                            className="reset-filter-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleResetType();
                                            }}
                                            aria-label="Reset type filter"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <div className={`filter-content ${openFilter === 'type' ? 'open' : ''}`}>
                                    <input
                                        type="text"
                                        className="filter-search"
                                        placeholder="Search specializations..."
                                        value={typeSearch}
                                        onChange={(e) => setTypeSearch(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="filter-content-grid">
                                        {getFilteredTypes().map(t => (
                                            <button
                                                key={t.id}
                                                className={`filter-button-SEO ${selectedType === t.id ? 'active' : ''}`}
                                                onClick={() => {
                                                    handleTypeChange(t.id);
                                                    toggleFilter(null);
                                                }}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="filter-accordion" data-filter="county">
                            <div 
                                className={`filter-header ${openFilter === 'county' ? 'open' : ''}`}
                                onClick={() => toggleFilter('county')}
                            >
                                <h3 className='filter-title'>
                                    {selectedCounty ? 
                                        `Selected: ${counties.find(c => c.id === selectedCounty)?.name}` : 
                                        'Select County'}
                                    <span className="dropdown-arrow">▼</span>
                                </h3>
                                {selectedCounty && (
                                    <button 
                                        className="reset-filter-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleResetCounty();
                                        }}
                                        aria-label="Reset county filter"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <div className={`filter-content ${openFilter === 'county' ? 'open' : ''}`}>
                                {counties.map(county => (
                                    <button
                                        key={county.id}
                                        className={`filter-button-SEO ${selectedCounty === county.id ? 'active' : ''}`}
                                        onClick={() => {
                                            handleCountyChange(county.id);
                                            toggleFilter(null);
                                        }}
                                    >
                                        {county.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-accordion" data-filter="city">
                            <div 
                                className={`filter-header ${openFilter === 'city' ? 'open' : ''}`}
                                onClick={() => toggleFilter('city')}
                            >
                                <h3 className='filter-title'>
                                    {selectedCity ? 
                                        `Selected: ${cities.find(c => c.id === selectedCity)?.name}` : 
                                        'Select City'}
                                    <span className="dropdown-arrow">▼</span>
                                </h3>
                                {selectedCity && (
                                    <button 
                                        className="reset-filter-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleResetCity();
                                        }}
                                        aria-label="Reset city filter"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <div className={`filter-content ${openFilter === 'city' ? 'open' : ''}`}>
                                <input
                                    type="text"
                                    className="filter-search"
                                    placeholder="Search cities..."
                                    value={citySearch}
                                    onChange={(e) => setCitySearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className="filter-content-grid">
                                    {getFilteredCities().map(city => (
                                        <button
                                            key={city.id}
                                            className={`filter-button-SEO ${selectedCity === city.id ? 'active' : ''}`}
                                            onClick={() => {
                                                handleCityChange(city.id);
                                                toggleFilter(null);
                                            }}
                                        >
                                            {city.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="vendors-section">
                    <h2 className="visually-hidden">Vendor Results</h2>
                    <VendorList 
                        selectedCategory={selectedCategory}
                        sortOrder="recommended"
                        location={selectedCity}
                        categoryType={selectedType === 'all' ? '' : selectedType}
                        currentPage={currentPage}
                        vendorsPerPage={vendorsPerPage}
                        setCurrentPage={setCurrentPage}
                        totalCount={totalCount}
                        setTotalCount={setTotalCount}
                        preferredLocation={selectedCity}
                        preferredType={selectedType}
                    />
                </section>
            </main>
        </div>
    );
};

export default LocationBasedVendors;
