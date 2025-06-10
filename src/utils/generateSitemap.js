import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const categories = [
    { id: 'photography', name: 'Photographer' },
    { id: 'videography', name: 'Videographer' },
    { id: 'florist', name: 'Florist' },
    { id: 'catering', name: 'Caterer' },
    { id: 'dj', name: 'DJ' },
    { id: 'beauty', name: 'Hair and Makeup Artist' },
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

// Helper function to generate SEO-friendly URL
const generateSeoFriendlyUrl = (businessName, businessId, category) => {
    // Convert business name to URL-friendly format
    const seoFriendlyName = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    // Convert category to URL-friendly format
    const seoFriendlyCategory = category
        ? category
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        : '';

    // Construct the URL
    return `/vendor/${businessId}/${seoFriendlyName}${seoFriendlyCategory ? `/${seoFriendlyCategory}` : ''}`;
};

// Function to generate sitemap XML
const generateSitemapXML = (urls) => {
    const baseUrl = 'https://bidi.com'; // Replace with your actual domain
    const today = new Date().toISOString().split('T')[0];

    const xmlUrls = urls.map(url => `
        <url>
            <loc>${baseUrl}${url}</loc>
            <lastmod>${today}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
        </url>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${xmlUrls}
</urlset>`;
};

// Function to generate sitemap index
const generateSitemapIndex = (sitemaps) => {
    const baseUrl = 'https://bidi.com'; // Replace with your actual domain
    const today = new Date().toISOString().split('T')[0];

    const sitemapUrls = sitemaps.map(sitemap => `
        <sitemap>
            <loc>${baseUrl}/${sitemap.filename}</loc>
            <lastmod>${sitemap.lastmod || today}</lastmod>
        </sitemap>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${sitemapUrls}
</sitemapindex>`;
};

// Main function to generate vendor sitemap
export const generateVendorSitemap = async () => {
    try {
        console.log('Fetching business profiles from Supabase...');
        
        // First, let's check how many total businesses we have
        const { count, error: countError } = await supabase
            .from('business_profiles')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error getting total count:', countError);
        } else {
            console.log(`Total businesses in database: ${count}`);
        }

        // Fetch all business profiles with less restrictive filters
        const { data: businesses, error } = await supabase
            .from('business_profiles')
            .select('id, business_name, business_category')
            .eq('is_admin', false); // Only exclude admin accounts

        if (error) {
            console.error('Supabase error:', error);
            return null;
        }

        if (!businesses || businesses.length === 0) {
            console.log('No businesses found in the database');
            return null;
        }

        console.log(`Found ${businesses.length} businesses`);
        console.log('Sample business:', businesses[0]); // Log first business for debugging

        // Generate URLs for each business
        const urls = businesses.map(business => {
            // Get the primary category (first one in the array)
            const primaryCategory = Array.isArray(business.business_category) 
                ? business.business_category[0] 
                : business.business_category;

            const url = generateSeoFriendlyUrl(
                business.business_name,
                business.id,
                primaryCategory
            );

            console.log(`Generated URL for ${business.business_name}: ${url}`);
            return url;
        });

        // Generate the sitemap XML
        const sitemapXML = generateSitemapXML(urls);

        return {
            filename: 'sitemap-vendors.xml',
            content: sitemapXML
        };
    } catch (error) {
        console.error('Error generating vendor sitemap:', error);
        return null;
    }
};

// Function to save all sitemaps
export const saveSitemaps = async () => {
    try {
        // Generate vendor sitemap
        const vendorSitemap = await generateVendorSitemap();
        if (!vendorSitemap) {
            throw new Error('Failed to generate vendor sitemap');
        }

        // Create array of all sitemaps
        const sitemaps = [
            {
                filename: 'sitemap-vendors.xml',
                content: vendorSitemap.content,
                lastmod: new Date().toISOString().split('T')[0]
            }
            // Add other sitemaps here as needed
        ];

        // Generate sitemap index
        const sitemapIndex = generateSitemapIndex(sitemaps);

        return {
            sitemaps,
            sitemapIndex
        };
    } catch (error) {
        console.error('Error saving sitemaps:', error);
        return null;
    }
}; 