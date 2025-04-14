// filepath: c:\Users\westo\OneDrive\Desktop\Bidi\bidi-react\scripts\generateSitemap.js
const fs = require('fs');
const path = require('path');
const generateSitemap = require('../src/utils/generateSitemap');

// Generate the sitemap
const sitemap = generateSitemap();

// Ensure the public directory exists
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

// Write the sitemap to public/sitemap.xml
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);

console.log('Sitemap generated successfully!');