import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import VendorListWithFilters from '../components/VendorList/VendorListWithFilters';
import { Helmet } from 'react-helmet';
import '../styles/LocationBasedVendors.css';
import { supabase } from '../supabaseClient';
import Ads from '../components/Ads/Ads';

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
    { id: 'salt-lake', name: 'Salt Lake County' },
    { id: 'utah', name: 'Utah County' },
    { id: 'davis', name: 'Davis County' },
    { id: 'weber', name: 'Weber County' },
    { id: 'washington', name: 'Washington County' },
    { id: 'cache', name: 'Cache County' },
    { id: 'summit', name: 'Summit County' },
    { id: 'tooele', name: 'Tooele County' },
    { id: 'iron', name: 'Iron County' },
    { id: 'box-elder', name: 'Box Elder County' },
    { id: 'beaver', name: 'Beaver County' },
    { id: 'carbon', name: 'Carbon County' },
    { id: 'daggett', name: 'Daggett County' },
    { id: 'duchesne', name: 'Duchesne County' },
    { id: 'emery', name: 'Emery County' },
    { id: 'garfield', name: 'Garfield County' },
    { id: 'grand', name: 'Grand County' },
    { id: 'juab', name: 'Juab County' },
    { id: 'kane', name: 'Kane County' },
    { id: 'millard', name: 'Millard County' },
    { id: 'morgan', name: 'Morgan County' },
    { id: 'piute', name: 'Piute County' },
    { id: 'rich', name: 'Rich County' },
    { id: 'san-juan', name: 'San Juan County' },
    { id: 'sanpete', name: 'Sanpete County' },
    { id: 'sevier', name: 'Sevier County' },
    { id: 'uintah', name: 'Uintah County' },
    { id: 'wasatch', name: 'Wasatch County' },
    { id: 'wayne', name: 'Wayne County' }
];

const cities = [
    // Salt Lake County
    { id: 'salt-lake-city', name: 'Salt Lake City', county: 'salt-lake' },
    { id: 'west-valley-city', name: 'West Valley City', county: 'salt-lake' },
    { id: 'west-jordan', name: 'West Jordan', county: 'salt-lake' },
    { id: 'sandy', name: 'Sandy', county: 'salt-lake' },
    { id: 'south-jordan', name: 'South Jordan', county: 'salt-lake' },
    { id: 'taylorsville', name: 'Taylorsville', county: 'salt-lake' },
    { id: 'murray', name: 'Murray', county: 'salt-lake' },
    { id: 'millcreek', name: 'Millcreek', county: 'salt-lake' },
    { id: 'cottonwood-heights', name: 'Cottonwood Heights', county: 'salt-lake' },
    { id: 'holladay', name: 'Holladay', county: 'salt-lake' },
    { id: 'herriman', name: 'Herriman', county: 'salt-lake' },
    { id: 'riverton', name: 'Riverton', county: 'salt-lake' },
    { id: 'draper', name: 'Draper', county: 'salt-lake' },
    { id: 'midvale', name: 'Midvale', county: 'salt-lake' },
    { id: 'south-salt-lake', name: 'South Salt Lake', county: 'salt-lake' },

    // Utah County
    { id: 'provo', name: 'Provo', county: 'utah' },
    { id: 'orem', name: 'Orem', county: 'utah' },
    { id: 'lehi', name: 'Lehi', county: 'utah' },
    { id: 'spanish-fork', name: 'Spanish Fork', county: 'utah' },
    { id: 'pleasant-grove', name: 'Pleasant Grove', county: 'utah' },
    { id: 'american-fork', name: 'American Fork', county: 'utah' },
    { id: 'springville', name: 'Springville', county: 'utah' },
    { id: 'payson', name: 'Payson', county: 'utah' },
    { id: 'saratoga-springs', name: 'Saratoga Springs', county: 'utah' },
    { id: 'eagle-mountain', name: 'Eagle Mountain', county: 'utah' },
    { id: 'highland', name: 'Highland', county: 'utah' },
    { id: 'lindon', name: 'Lindon', county: 'utah' },
    { id: 'mapleton', name: 'Mapleton', county: 'utah' },
    { id: 'vineyard', name: 'Vineyard', county: 'utah' },
    { id: 'cedar-hills', name: 'Cedar Hills', county: 'utah' },

    // Davis County
    { id: 'layton', name: 'Layton', county: 'davis' },
    { id: 'bountiful', name: 'Bountiful', county: 'davis' },
    { id: 'clearfield', name: 'Clearfield', county: 'davis' },
    { id: 'syracuse', name: 'Syracuse', county: 'davis' },
    { id: 'kaysville', name: 'Kaysville', county: 'davis' },
    { id: 'farmington', name: 'Farmington', county: 'davis' },
    { id: 'centerville', name: 'Centerville', county: 'davis' },
    { id: 'north-salt-lake', name: 'North Salt Lake', county: 'davis' },
    { id: 'woods-cross', name: 'Woods Cross', county: 'davis' },
    { id: 'clinton', name: 'Clinton', county: 'davis' },
    { id: 'fruit-heights', name: 'Fruit Heights', county: 'davis' },
    { id: 'west-bountiful', name: 'West Bountiful', county: 'davis' },
    { id: 'sunset', name: 'Sunset', county: 'davis' },

    // Weber County
    { id: 'ogden', name: 'Ogden', county: 'weber' },
    { id: 'roy', name: 'Roy', county: 'weber' },
    { id: 'south-ogden', name: 'South Ogden', county: 'weber' },
    { id: 'north-ogden', name: 'North Ogden', county: 'weber' },
    { id: 'washington-terrace', name: 'Washington Terrace', county: 'weber' },
    { id: 'riverdale', name: 'Riverdale', county: 'weber' },
    { id: 'west-haven', name: 'West Haven', county: 'weber' },
    { id: 'pleasant-view', name: 'Pleasant View', county: 'weber' },
    { id: 'harrisville', name: 'Harrisville', county: 'weber' },

    // Washington County
    { id: 'st-george', name: 'St. George', county: 'washington' },
    { id: 'washington-city', name: 'Washington City', county: 'washington' },
    { id: 'hurricane', name: 'Hurricane', county: 'washington' },
    { id: 'santa-clara', name: 'Santa Clara', county: 'washington' },
    { id: 'ivins', name: 'Ivins', county: 'washington' },
    { id: 'la-verkin', name: 'La Verkin', county: 'washington' },

    // Cache County
    { id: 'logan', name: 'Logan', county: 'cache' },
    { id: 'north-logan', name: 'North Logan', county: 'cache' },
    { id: 'smithfield', name: 'Smithfield', county: 'cache' },
    { id: 'hyrum', name: 'Hyrum', county: 'cache' },
    { id: 'providence', name: 'Providence', county: 'cache' },
    { id: 'nibley', name: 'Nibley', county: 'cache' },

    // Box Elder County
    { id: 'brigham-city', name: 'Brigham City', county: 'box-elder' },
    { id: 'tremonton', name: 'Tremonton', county: 'box-elder' },
    { id: 'perry', name: 'Perry', county: 'box-elder' },

    // Tooele County
    { id: 'tooele', name: 'Tooele', county: 'tooele' },
    { id: 'grantsville', name: 'Grantsville', county: 'tooele' },
    { id: 'stansbury-park', name: 'Stansbury Park', county: 'tooele' },

    // Summit County
    { id: 'park-city', name: 'Park City', county: 'summit' },
    { id: 'snyderville', name: 'Snyderville', county: 'summit' },
    { id: 'kimball-junction', name: 'Kimball Junction', county: 'summit' },

    // Iron County
    { id: 'cedar-city', name: 'Cedar City', county: 'iron' },
    { id: 'enoch', name: 'Enoch', county: 'iron' },

    // Other Notable Cities
    { id: 'vernal', name: 'Vernal', county: 'uintah' },
    { id: 'moab', name: 'Moab', county: 'grand' },
    { id: 'price', name: 'Price', county: 'carbon' },
    { id: 'richfield', name: 'Richfield', county: 'sevier' },
    { id: 'heber-city', name: 'Heber City', county: 'wasatch' },
    { id: 'midway', name: 'Midway', county: 'wasatch' },
    { id: 'roosevelt', name: 'Roosevelt', county: 'duchesne' },
    { id: 'ephraim', name: 'Ephraim', county: 'sanpete' },
    { id: 'nephi', name: 'Nephi', county: 'juab' },
    { id: 'delta', name: 'Delta', county: 'millard' },
    { id: 'kanab', name: 'Kanab', county: 'kane' },
    { id: 'blanding', name: 'Blanding', county: 'san-juan' },
    { id: 'monticello', name: 'Monticello', county: 'san-juan' }
];

const LocationBasedVendors = () => {
    const { category, type } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const countyParam = searchParams.get('county');
    const cityParam = searchParams.get('city');

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

    // Add effect to update state when URL parameters change
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const newCounty = searchParams.get('county');
        const newCity = searchParams.get('city');
        
        if (newCounty !== selectedCounty) {
            setSelectedCounty(newCounty || '');
        }
        if (newCity !== selectedCity) {
            setSelectedCity(newCity || '');
        }
    }, [location.search]);

    // Determine the correct category, type, and location from URL parameters
    const determineInitialValues = () => {
        console.log('URL Parameters:', { type, category, city: cityParam, county: countyParam }); // Debug log

        // Decode the category parameter to handle spaces and slashes
        const decodedCategory = category ? decodeURIComponent(category) : '';
        const decodedType = type ? decodeURIComponent(type) : '';
        const decodedCounty = countyParam ? decodeURIComponent(countyParam) : '';

        console.log('Decoded parameters:', { decodedType, decodedCategory, city: cityParam, county: decodedCounty }); // Debug log

        // Special handling for wedding planner/coordinator category
        if (decodedCategory === 'wedding planner/coordinator' || decodedCategory === 'wedding planner') {
            if (decodedType && (cityParam || decodedCounty)) {
                const location = cityParam || decodedCounty;
                if (isValidTypeForCategory(decodedType, 'wedding planner/coordinator') && isValidLocation(location)) {
                    return {
                        category: 'wedding planner/coordinator',
                        type: decodedType,
                        location: location
                    };
                }
            } else if (decodedType) {
                if (isValidTypeForCategory(decodedType, 'wedding planner/coordinator')) {
                    return {
                        category: 'wedding planner/coordinator',
                        type: decodedType,
                        location: ''
                    };
                }
            }
        }

        // Case 1: /type/category?city=city or /type/category?county=county
        if (decodedType && decodedCategory && (cityParam || decodedCounty)) {
            const location = cityParam || decodedCounty;
            console.log('Checking Case 1:', { decodedType, decodedCategory, location }); // Debug log
            
            if (isValidCategory(decodedCategory) && 
                isValidTypeForCategory(decodedType, decodedCategory) && 
                isValidLocation(location)) {
                return {
                    category: decodedCategory,
                    type: decodedType,
                    location: location
                };
            }
        }

        // Case 2: /type/category
        if (decodedType && decodedCategory && !cityParam && !decodedCounty) {
            if (isValidCategory(decodedCategory) && isValidTypeForCategory(decodedType, decodedCategory)) {
                return {
                    category: decodedCategory,
                    type: decodedType,
                    location: ''
                };
            }
        }

        // Case 3: /category?city=city or /category?county=county
        if (decodedCategory && !decodedType && (cityParam || decodedCounty)) {
            const location = cityParam || decodedCounty;
            if (isValidCategory(decodedCategory) && isValidLocation(location)) {
                return {
                    category: decodedCategory,
                    type: '',
                    location: location
                };
            }
        }

        // Case 4: /category
        if (decodedCategory && !decodedType && !cityParam && !decodedCounty) {
            if (isValidCategory(decodedCategory)) {
                return {
                    category: decodedCategory,
                    type: '',
                    location: ''
                };
            }
        }

        // Default case: empty values if no valid pattern is matched
        return {
            category: '',
            type: '',
            location: ''
        };
    };

    const initialValues = determineInitialValues();
    const [selectedCategory, setSelectedCategory] = useState(initialValues.category);
    const [selectedType, setSelectedType] = useState(initialValues.type);
    const [selectedCounty, setSelectedCounty] = useState(countyParam || '');
    const [selectedCity, setSelectedCity] = useState(cityParam || '');
    const [openFilter, setOpenFilter] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [sortType, setSortType] = useState('recommended');
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
                const categoryToQuery = selectedCategory === 'wedding planner/coordinator' ? 
                    'wedding planner/coordinator' : selectedCategory;
                query = query.contains('business_category', [categoryToQuery]);
            }

            if (selectedCity) {
                console.log('Filtering by city:', selectedCity);
                // Check both primary city and service areas
                query = query.or(`city_id.eq.${selectedCity},service_areas.cs.{${selectedCity}}`);
            } else if (selectedCounty) {
                console.log('Selected county from URL:', selectedCounty);
                const countyId = selectedCounty.replace('-county', '');
                console.log('Processed county ID for database query:', countyId);
                
                // Get all cities in the selected county
                const { data: citiesInCounty, error: citiesError } = await supabase
                    .from('cities')
                    .select('id')
                    .eq('county_id', countyId);

                if (citiesError) {
                    console.error('Error fetching cities:', citiesError);
                    throw citiesError;
                }

                if (citiesInCounty && citiesInCounty.length > 0) {
                    const cityIds = citiesInCounty.map(city => city.id);
                    const conditions = [
                        `city_id.in.(${cityIds.join(',')})`,
                        ...cityIds.map(id => `service_areas.cs.{${id}}`)
                    ];
                    query = query.or(conditions.join(','));
                } else {
                    console.log('No cities found for county:', countyId);
                    setTotalCount(0);
                    return;
                }
            }

            const { count, error } = await query;

            if (error) {
                console.error('Error fetching vendor count:', error);
                return;
            }

            setTotalCount(count);
        };

        fetchVendorCount();
    }, [selectedCategory, selectedCity, selectedCounty]);

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
            path += `${selectedType}/${selectedCategory}`;
        } else if (selectedCategory && isValidCategory(selectedCategory)) {
            path += `${selectedCategory}`;
        }
        
        // Add county as a query parameter
        path += `?county=${newCounty}`;
        navigate(path);
    };

    const handleCityChange = (newCity) => {
        if (!isValidCity(newCity)) return;
        
        setSelectedCity(newCity);
        
        let path = '/';
        
        // Add type and category if they exist
        if (selectedType && selectedCategory && isValidTypeForCategory(selectedType, selectedCategory)) {
            path += `${selectedType}/${selectedCategory}`;
        } else if (selectedCategory && isValidCategory(selectedCategory)) {
            path += `${selectedCategory}`;
        }
        
        // Add city as a query parameter
        path += `?city=${newCity}`;
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

    const handleSortChange = (e) => {
        const newSortType = e.target.value;
        setSortType(newSortType);
        // Reset to first page when sort changes
        setCurrentPage(1);
    };

    // Utility to map selector county to short county id
    function getShortCountyId(selectedCounty) {
        console.log('Getting short county ID for:', selectedCounty);
        if (!selectedCounty) {
            console.log('No county selected');
            return '';
        }
        
        // Log the input county
        console.log('Input county:', selectedCounty);
        
        // Handle special cases
        if (selectedCounty === 'salt-lake-county') {
            console.log('Converting salt-lake-county to salt-lake');
            return 'salt-lake';
        }
        if (selectedCounty === 'slc-county') {
            console.log('Converting slc-county to slc');
            return 'slc';
        }
        
        // Remove -county suffix and log the result
        const result = selectedCounty.replace('-county', '');
        console.log('Converted county ID:', result);
        return result;
    }

    const sortVendors = (vendors) => {
        console.log('Vendors before sorting:', vendors.map(v => ({
            id: v.id,
            name: v.business_name,
            photos: v.photo_count,
            videos: v.video_count,
            verified: v.membership_tier === 'Verified' || v.Bidi_Plus === true,
            specializations: v.specializations,
            location: v.business_address,
            hasReviews: v.average_rating !== null,
            rating: v.average_rating
        })));

        const sorted = [...vendors].sort((a, b) => {
            // First priority: Has photos
            const aHasPhotos = a.photo_count > 0;
            const bHasPhotos = b.photo_count > 0;
            if (aHasPhotos !== bHasPhotos) {
                return aHasPhotos ? -1 : 1;
            }

            // If sortOrder is rating, base_price_low, or base_price_high, prioritize that sorting
            if (sortType === 'rating') {
                const aRating = a.average_rating || 0;
                const bRating = b.average_rating || 0;
                if (aRating !== bRating) {
                    return bRating - aRating;
                }
            } else if (sortType === 'base_price_low') {
                const aPrice = a.minimum_price || 0;
                const bPrice = b.minimum_price || 0;
                if (aPrice !== bPrice) {
                    return aPrice - bPrice;
                }
            } else if (sortType === 'base_price_high') {
                const aPrice = a.minimum_price || 0;
                const bPrice = b.minimum_price || 0;
                if (aPrice !== bPrice) {
                    return bPrice - aPrice;
                }
            }

            // Check if vendors are in the selected location (including service areas)
            let aInLocation = false;
            let bInLocation = false;

            if (selectedCity) {
                // Check both primary city and service areas
                aInLocation = a.city_id === selectedCity || (a.service_areas && a.service_areas.includes(selectedCity));
                bInLocation = b.city_id === selectedCity || (b.service_areas && b.service_areas.includes(selectedCity));
            } else if (selectedCounty) {
                // For county, check if the vendor's city or any service area city is in the selected county
                const countyIds = getShortCountyId(selectedCounty);
                aInLocation = countyIds.includes(a.county_id) || 
                             (a.service_areas && a.service_areas.some(area => 
                                 cities.find(c => c.id === area)?.county === selectedCounty
                             ));
                bInLocation = countyIds.includes(b.county_id) || 
                             (b.service_areas && b.service_areas.some(area => 
                                 cities.find(c => c.id === area)?.county === selectedCounty
                             ));
            }

            // Second priority: Location match
            if (aInLocation !== bInLocation) {
                return aInLocation ? -1 : 1;
            }

            // Third priority: Has reviews AND is verified
            const aHasReviews = a.average_rating !== null;
            const bHasReviews = b.average_rating !== null;
            const aIsVerified = a.membership_tier === 'Verified' || a.Bidi_Plus === true;
            const bIsVerified = b.membership_tier === 'Verified' || b.Bidi_Plus === true;

            const aHasReviewsAndVerified = aHasReviews && aIsVerified;
            const bHasReviewsAndVerified = bHasReviews && bIsVerified;

            if (aHasReviewsAndVerified !== bHasReviewsAndVerified) {
                return aHasReviewsAndVerified ? -1 : 1;
            }

            // If both have reviews and are verified, sort by rating
            if (aHasReviewsAndVerified && bHasReviewsAndVerified) {
                return (b.average_rating || 0) - (a.average_rating || 0);
            }

            // Fourth priority: Is verified
            if (aIsVerified !== bIsVerified) {
                return aIsVerified ? -1 : 1;
            }

            // Fifth priority: Has reviews
            if (aHasReviews !== bHasReviews) {
                return aHasReviews ? -1 : 1;
            }

            // If both have reviews but aren't verified, sort by rating
            if (aHasReviews && bHasReviews) {
                return (b.average_rating || 0) - (a.average_rating || 0);
            }

            // Sixth priority: Has the selected specialization
            if (selectedType && selectedType !== 'all') {
                const aHasSpecialization = a.specializations?.includes(selectedType);
                const bHasSpecialization = b.specializations?.includes(selectedType);
                if (aHasSpecialization !== bHasSpecialization) {
                    return aHasSpecialization ? -1 : 1;
                }
            }

            // Seventh priority: Total media count
            const aTotalMedia = a.photo_count;
            const bTotalMedia = b.photo_count;
            if (aTotalMedia !== bTotalMedia) {
                return bTotalMedia - aTotalMedia;
            }

            return 0;
        });

        console.log('Vendors after sorting:', sorted.map(v => ({
            id: v.id,
            name: v.business_name,
            photos: v.photo_count,
            videos: v.video_count,
            verified: v.membership_tier === 'Verified' || v.Bidi_Plus === true,
            specializations: v.specializations,
            location: v.business_address,
            hasReviews: v.average_rating !== null,
            rating: v.average_rating
        })));

        return sorted;
    };

    return (
        <div className="location-based-vendors" style={{margin:'0 auto'}}>
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
            
            <div className="vendors-layout">
                {/* Main Content */}
                <main className="vendors-main">
                    <section className="filters-section" style={{padding:'0px'}}>
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

                    <section className="vendors-section" style={{padding:'0px'}}>
                        <h2 className="visually-hidden">Vendor Results</h2>
                        <div className="sort-controls" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            marginBottom: '20px',
                            padding: '0 16px',
                            gap: '8px'
                        }}>
                            <span style={{
                                fontSize: '14px',
                                color: '#374151',
                                fontWeight: '500'
                            }}>Sort by:</span>
                            <select 
                                value={sortType} 
                                onChange={handleSortChange}
                                className="sort-select"
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #E5E7EB',
                                    backgroundColor: 'white',
                                    fontSize: '14px',
                                    color: '#374151',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    minWidth: '200px'
                                }}
                            >
                                <option value="recommended">Recommended</option>
                                <option value="rating">Highest Rated</option>
                                <option value="base_price_low">Starting at: Low to High</option>
                                <option value="base_price_high">Starting at: High to Low</option>
                            </select>
                        </div>
                        <VendorListWithFilters
                            selectedCategory={selectedCategory}
                            selectedType={selectedType}
                            selectedCounty={selectedCounty}
                            selectedCity={selectedCity}
                            sortOrder={sortType}
                            currentPage={currentPage}
                            vendorsPerPage={vendorsPerPage}
                            setCurrentPage={setCurrentPage}
                            setTotalCount={setTotalCount}
                            onCountyChange={handleCountyChange}
                            onCityChange={handleCityChange}
                        />
                    </section>
                </main>

                {/* Right Ad Space - Will appear at bottom on mobile */}
                <div className="ad-space">
                    <Ads />                    
                </div>
            </div>
        </div>
    );
};

export default LocationBasedVendors;
