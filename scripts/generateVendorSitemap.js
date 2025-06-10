const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to slugify business names
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/&/g, '-and-')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-');
}

async function generateVendorSitemap() {
    try {
        // Fetch all business profiles
        const { data: businesses, error } = await supabase
            .from('business_profiles')
            .select('id, business_name, business_category');

        if (error) {
            throw error;
        }

        const baseUrl = 'https://savewithbidi.com';
        const today = new Date().toISOString().split('T')[0];
        const urls = [];

        // Add vendor portfolio URLs
        businesses.forEach(business => {
            // Skip if no business name or category
            if (!business.business_name || !business.business_category) return;

            const businessSlug = slugify(business.business_name);

            // Add the portfolio URL in the correct format
            urls.push({
                loc: `${baseUrl}/portfolio/${business.id}/${businessSlug}`,
                lastmod: today,
                priority: '0.8',
                changefreq: 'daily'
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

        // Ensure the public directory exists
        const publicDir = path.join(__dirname, '..', 'public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir);
        }

        // Write the sitemap to public/vendor-sitemap.xml
        fs.writeFileSync(path.join(publicDir, 'vendor-sitemap.xml'), xml);
        console.log('Vendor sitemap generated successfully!');

    } catch (error) {
        console.error('Error generating vendor sitemap:', error);
    }
}

// Run the script
generateVendorSitemap(); 