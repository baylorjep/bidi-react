// filepath: c:\Users\westo\OneDrive\Desktop\Bidi\bidi-react\scripts\generateSitemap.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveSitemaps } from '../src/utils/generateSitemap.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase
      .from('business_profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }

    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return false;
  }
}

async function generateAndSaveSitemaps() {
  try {
    // Test Supabase connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to Supabase');
    }

    console.log('Generating sitemaps...');
    const result = await saveSitemaps();
    
    if (!result) {
      throw new Error('Failed to generate sitemaps');
    }

    // Ensure the public directory exists
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Save individual sitemaps
    for (const sitemap of result.sitemaps) {
      const sitemapPath = path.join(publicDir, sitemap.filename);
      fs.writeFileSync(sitemapPath, sitemap.content);
      console.log(`Generated ${sitemap.filename} at:`, sitemapPath);
    }

    // Save sitemap index
    const indexPath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(indexPath, result.sitemapIndex);
    console.log('Generated sitemap index at:', indexPath);
    
    console.log('All sitemaps generated successfully!');
  } catch (error) {
    console.error('Error generating sitemaps:', error);
    process.exit(1);
  }
}

// Run the script
generateAndSaveSitemaps();