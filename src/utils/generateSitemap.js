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

function generateSitemap() {
    const baseUrl = 'https://savewithbidi.com';
    const urls = [];
    const today = new Date().toISOString().split('T')[0];

    // Add homepage
    urls.push({
        loc: baseUrl,
        lastmod: today,
        priority: '1.0',
        changefreq: 'daily'
    });

    // Add articles
    const articles = [
        '/wedding-market-guide',
        '/wedding-vibe-quiz',
        '/articles/utah-wedding-planning-guide',
        '/articles/utah-photography-cost-guide',
        '/articles/wedding-photographer-cost-guide',
        '/articles/wedding-videographer-cost-guide',
        '/articles/wedding-catering-cost-guide',
        '/articles/wedding-florist-cost-guide',
        '/articles/wedding-dj-cost-guide',
        '/articles/wedding-hair-makeup-cost-guide',
        '/articles/utah-wedding-videographer-guide'
    ];

    // Add article pages with high priority
    articles.forEach(article => {
        urls.push({
            loc: `${baseUrl}${article}`,
            lastmod: today,
            priority: '0.9',
            changefreq: 'weekly'
        });
    });

    // Generate URLs for each category
    categories.forEach(category => {
        // Category only URL
        urls.push({
            loc: `${baseUrl}/${category.id}`,
            lastmod: today,
            priority: '0.8',
            changefreq: 'daily'
        });

        // Category + Type combinations
        const types = categoryTypes[category.id] || [];
        types.forEach(type => {
            urls.push({
                loc: `${baseUrl}/${category.id}/${type.id}`,
                lastmod: today,
                priority: '0.8',
                changefreq: 'daily'
            });
        });

        // Category + County combinations
        counties.forEach(county => {
            urls.push({
                loc: `${baseUrl}/${category.id}/${county.id}`,
                lastmod: today,
                priority: '0.8',
                changefreq: 'daily'
            });

            // Category + Type + County combinations
            types.forEach(type => {
                urls.push({
                    loc: `${baseUrl}/${category.id}/${type.id}/${county.id}`,
                    lastmod: today,
                    priority: '0.7',
                    changefreq: 'daily'
                });
            });
        });

        // Category + City combinations
        cities.forEach(city => {
            urls.push({
                loc: `${baseUrl}/${category.id}/${city.id}`,
                lastmod: today,
                priority: '0.8',
                changefreq: 'daily'
            });

            // Category + Type + City combinations
            types.forEach(type => {
                urls.push({
                    loc: `${baseUrl}/${category.id}/${type.id}/${city.id}`,
                    lastmod: today,
                    priority: '0.7',
                    changefreq: 'daily'
                });
            });
        });
    });

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `    <url>
        <loc>${url.loc}</loc>
        <lastmod>${url.lastmod}</lastmod>
        <changefreq>${url.changefreq}</changefreq>
        <priority>${url.priority}</priority>
    </url>`).join('\n')}
</urlset>`;

    return xml;
}

module.exports = generateSitemap; 