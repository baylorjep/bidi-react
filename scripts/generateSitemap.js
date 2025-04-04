// filepath: c:\Users\westo\OneDrive\Desktop\Bidi\bidi-react\scripts\generateSitemap.js
const fs = require('fs');
const path = require('path');

const categories = [
    { id: 'photography', name: 'Photographer' },
    { id: 'videography', name: 'Videographer' },
    { id: 'florist', name: 'Florist' },
    { id: 'catering', name: 'Caterer' },
    { id: 'dj', name: 'DJ' },
    { id: 'beauty', name: 'Hair and Makeup Artist' },
];

const categoryTypes = {
    photography: ['wedding', 'engagement', 'event', 'family', 'portrait'],
    videography: ['wedding', 'engagement', 'event', 'commercial'],
    florist: ['wedding', 'event', 'arrangement'],
    catering: ['wedding', 'corporate', 'event', 'private'],
    dj: ['wedding', 'party', 'corporate', 'event'],
    beauty: ['wedding', 'event', 'photoshoot'],
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

const baseUrl = 'https://www.savewithbidi.com';

const generateSitemap = () => {
    let urls = [];

    categories.forEach(category => {
        urls.push(`${baseUrl}/${category.id}`);
        categoryTypes[category.id].forEach(type => {
            urls.push(`${baseUrl}/${type}/${category.id}`);
            counties.forEach(county => {
                urls.push(`${baseUrl}/${type}/${category.id}/${county.id}`);
                cities.filter(city => city.county === county.id).forEach(city => {
                    urls.push(`${baseUrl}/${type}/${category.id}/${county.id}/${city.id}`);
                });
            });
        });
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls.map(url => `
            <url>
                <loc>${url}</loc>
                <changefreq>weekly</changefreq>
                <priority>0.8</priority>
            </url>
        `).join('')}
    </urlset>`;

    fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), sitemap);
};

generateSitemap();