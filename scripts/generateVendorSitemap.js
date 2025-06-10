import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data from LocationBasedVendors.js
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
    { id: 'layton', name: 'Layton', county: 'davis-county' },
    { id: 'kaysville', name: 'Kaysville', county: 'davis-county' },
    { id: 'bountiful', name: 'Bountiful', county: 'davis-county' },
    { id: 'farmington', name: 'Farmington', county: 'davis-county' },
    { id: 'centerville', name: 'Centerville', county: 'davis-county' },
    { id: 'north-salt-lake', name: 'North Salt Lake', county: 'davis-county' },
    { id: 'syracuse', name: 'Syracuse', county: 'davis-county' },
    { id: 'clearfield', name: 'Clearfield', county: 'davis-county' },
    { id: 'clinton', name: 'Clinton', county: 'davis-county' },
    { id: 'south-weber', name: 'South Weber', county: 'davis-county' },
    { id: 'woods-cross', name: 'Woods Cross', county: 'davis-county' },
    { id: 'west-point', name: 'West Point', county: 'davis-county' },
    { id: 'sunset', name: 'Sunset', county: 'davis-county' },
    { id: 'roy', name: 'Roy', county: 'davis-county' },
    { id: 'ogden', name: 'Ogden', county: 'weber-county' },
    { id: 'south-ogden', name: 'South Ogden', county: 'weber-county' },
    { id: 'north-ogden', name: 'North Ogden', county: 'weber-county' },
    { id: 'riverdale', name: 'Riverdale', county: 'weber-county' },
    { id: 'washington-terrace', name: 'Washington Terrace', county: 'weber-county' },
    { id: 'farr-west', name: 'Farr West', county: 'weber-county' },
    { id: 'harrisville', name: 'Harrisville', county: 'weber-county' },
    { id: 'plain-city', name: 'Plain City', county: 'weber-county' },
    { id: 'hooper', name: 'Hooper', county: 'weber-county' },
    { id: 'west-haven', name: 'West Haven', county: 'weber-county' },
    { id: 'uintah', name: 'Uintah', county: 'weber-county' },
    { id: 'huntsville', name: 'Huntsville', county: 'weber-county' },
    { id: 'eden', name: 'Eden', county: 'weber-county' },
    { id: 'liberty', name: 'Liberty', county: 'weber-county' },
    { id: 'st-george', name: 'St. George', county: 'washington-county' },
    { id: 'washington', name: 'Washington', county: 'washington-county' },
    { id: 'hurricane', name: 'Hurricane', county: 'washington-county' },
    { id: 'ivins', name: 'Ivins', county: 'washington-county' },
    { id: 'santa-clara', name: 'Santa Clara', county: 'washington-county' },
    { id: 'la-verkin', name: 'La Verkin', county: 'washington-county' },
    { id: 'toquerville', name: 'Toquerville', county: 'washington-county' },
    { id: 'virgin', name: 'Virgin', county: 'washington-county' },
    { id: 'springdale', name: 'Springdale', county: 'washington-county' },
    { id: 'rockville', name: 'Rockville', county: 'washington-county' },
    { id: 'logan', name: 'Logan', county: 'cache-county' },
    { id: 'north-logan', name: 'North Logan', county: 'cache-county' },
    { id: 'hyrum', name: 'Hyrum', county: 'cache-county' },
    { id: 'smithfield', name: 'Smithfield', county: 'cache-county' },
    { id: 'providence', name: 'Providence', county: 'cache-county' },
    { id: 'millville', name: 'Millville', county: 'cache-county' },
    { id: 'nibley', name: 'Nibley', county: 'cache-county' },
    { id: 'richmond', name: 'Richmond', county: 'cache-county' },
    { id: 'lewiston', name: 'Lewiston', county: 'cache-county' },
    { id: 'tremonton', name: 'Tremonton', county: 'cache-county' },
    { id: 'park-city', name: 'Park City', county: 'summit-county' },
    { id: 'kamas', name: 'Kamas', county: 'summit-county' },
    { id: 'coalville', name: 'Coalville', county: 'summit-county' },
    { id: 'oakley', name: 'Oakley', county: 'summit-county' },
    { id: 'heber-city', name: 'Heber City', county: 'summit-county' },
    { id: 'midway', name: 'Midway', county: 'summit-county' },
    { id: 'francis', name: 'Francis', county: 'summit-county' },
    { id: 'tooele', name: 'Tooele', county: 'tooele-county' },
    { id: 'grantsville', name: 'Grantsville', county: 'tooele-county' },
    { id: 'stansbury-park', name: 'Stansbury Park', county: 'tooele-county' },
    { id: 'stockton', name: 'Stockton', county: 'tooele-county' },
    { id: 'wendover', name: 'Wendover', county: 'tooele-county' },
    { id: 'cedar-city', name: 'Cedar City', county: 'iron-county' },
    { id: 'enoch', name: 'Enoch', county: 'iron-county' },
    { id: 'kanarraville', name: 'Kanarraville', county: 'iron-county' },
    { id: 'parowan', name: 'Parowan', county: 'iron-county' },
    { id: 'brian-head', name: 'Brian Head', county: 'iron-county' },
    { id: 'brigham-city', name: 'Brigham City', county: 'box-elder-county' },
    { id: 'tremonton', name: 'Tremonton', county: 'box-elder-county' },
    { id: 'willard', name: 'Willard', county: 'box-elder-county' },
    { id: 'perry', name: 'Perry', county: 'box-elder-county' },
    { id: 'mantua', name: 'Mantua', county: 'box-elder-county' },
    { id: 'honeyville', name: 'Honeyville', county: 'box-elder-county' },
    { id: 'garland', name: 'Garland', county: 'box-elder-county' },
    { id: 'corinne', name: 'Corinne', county: 'box-elder-county' },
    { id: 'bear-river-city', name: 'Bear River City', county: 'box-elder-county' },
    { id: 'fielding', name: 'Fielding', county: 'box-elder-county' },
    { id: 'howell', name: 'Howell', county: 'box-elder-county' },
    { id: 'deweyville', name: 'Deweyville', county: 'box-elder-county' },
    { id: 'elwood', name: 'Elwood', county: 'box-elder-county' },
    { id: 'plymouth', name: 'Plymouth', county: 'box-elder-county' },
    { id: 'portage', name: 'Portage', county: 'box-elder-county' },
    { id: 'riverside', name: 'Riverside', county: 'box-elder-county' },
    { id: 'snowville', name: 'Snowville', county: 'box-elder-county' },
    { id: 'bothwell', name: 'Bothwell', county: 'box-elder-county' },
    { id: 'collinston', name: 'Collinston', county: 'box-elder-county' },
    { id: 'grouse-creek', name: 'Grouse Creek', county: 'box-elder-county' },
    { id: 'park-valley', name: 'Park Valley', county: 'box-elder-county' },
    { id: 'penrose', name: 'Penrose', county: 'box-elder-county' },
    { id: 'promontory', name: 'Promontory', county: 'box-elder-county' },
    { id: 'rosby', name: 'Rosby', county: 'box-elder-county' },
    { id: 'thatcher', name: 'Thatcher', county: 'box-elder-county' },
    { id: 'trenton', name: 'Trenton', county: 'box-elder-county' },
    { id: 'west-portage', name: 'West Portage', county: 'box-elder-county' },
    { id: 'willard', name: 'Willard', county: 'box-elder-county' }
];

// Function to generate all possible URL combinations
function generateUrls() {
    const urls = new Set();
    const baseUrl = 'https://bidi.com';

    // Generate category-only pages
    categories.forEach(category => {
        urls.add(`${baseUrl}/vendors/${category.id}`);
    });

    // Generate category + type pages
    categories.forEach(category => {
        const types = categoryTypes[category.id] || [];
        types.forEach(type => {
            urls.add(`${baseUrl}/vendors/${category.id}/${type.id}`);
        });
    });

    // Generate category + location pages (counties)
    categories.forEach(category => {
        counties.forEach(county => {
            urls.add(`${baseUrl}/vendors/${category.id}/${county.id}`);
        });
    });

    // Generate category + location pages (cities)
    categories.forEach(category => {
        cities.forEach(city => {
            urls.add(`${baseUrl}/vendors/${category.id}/${city.id}`);
        });
    });

    // Generate category + type + location pages (counties)
    categories.forEach(category => {
        const types = categoryTypes[category.id] || [];
        types.forEach(type => {
            counties.forEach(county => {
                urls.add(`${baseUrl}/vendors/${category.id}/${type.id}/${county.id}`);
            });
        });
    });

    // Generate category + type + location pages (cities)
    categories.forEach(category => {
        const types = categoryTypes[category.id] || [];
        types.forEach(type => {
            cities.forEach(city => {
                urls.add(`${baseUrl}/vendors/${category.id}/${type.id}/${city.id}`);
            });
        });
    });

    return Array.from(urls);
}

// Function to generate sitemap XML
function generateSitemapXml(urls) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;
    return xml;
}

// Main function to generate sitemap
function generateSitemap() {
    const urls = generateUrls();
    const sitemapXml = generateSitemapXml(urls);
    
    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write sitemap to file
    const sitemapPath = path.join(publicDir, 'vendor-sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapXml);
    
    console.log(`Generated sitemap with ${urls.length} URLs at ${sitemapPath}`);
}

// Run the generator
generateSitemap(); 