const express = require('express');
const router = express.Router();
const axios = require('axios');
const { supabase } = require('../lib/supabase');

// Google Reviews endpoint
router.get('/google-reviews', async (req, res) => {
  console.log('Route hit: /google-reviews');
  console.log('Request query:', req.query);
  
  try {
    const { placeId } = req.query;
    console.log('Received request for placeId:', placeId);

    if (!placeId) {
      console.log('No placeId provided');
      return res.status(400).json({ message: 'Place ID is required' });
    }

    if (!process.env.GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY is not set in environment variables');
      return res.status(500).json({ 
        message: 'Server configuration error: Google API key is missing',
        error: 'Missing API key'
      });
    }

    console.log('Making request to Google Places API...');
    // Make request to Google Places API
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          place_id: placeId,
          fields: 'reviews,rating,user_ratings_total',
          key: process.env.GOOGLE_API_KEY
        }
      }
    );

    console.log('Google Places API response:', JSON.stringify(response.data, null, 2));

    if (response.data.status !== 'OK') {
      console.error('Google Places API error:', response.data.error_message);
      return res.status(400).json({ 
        message: response.data.error_message || 'Failed to fetch Google reviews',
        status: response.data.status
      });
    }

    // Check if result exists
    if (!response.data.result) {
      console.error('No result in Google Places API response');
      return res.status(400).json({ 
        message: 'No business data found for the provided Place ID',
        status: 'NO_RESULT'
      });
    }

    // Get reviews array, defaulting to empty array if undefined
    const reviews = response.data.result.reviews || [];
    console.log(`Found ${reviews.length} reviews`);

    // Format the reviews to match our schema
    const formattedReviews = reviews.map(review => ({
      author_name: review.author_name || 'Anonymous',
      rating: review.rating || 0,
      text: review.text || '',
      time: review.time ? new Date(review.time * 1000).toISOString() : new Date().toISOString(),
      review_id: review.review_id || `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));

    // Include overall rating and total reviews count
    const result = {
      reviews: formattedReviews,
      overall_rating: response.data.result.rating || 0,
      total_reviews: response.data.result.user_ratings_total || 0
    };

    console.log('Sending response:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    
    res.status(500).json({ 
      message: 'Failed to fetch Google reviews',
      error: error.message,
      details: error.response?.data || 'No additional details available'
    });
  }
});

// Google Business Profile Auth endpoint
router.get('/business-profile/auth', async (req, res) => {
  console.log('Route hit: /business-profile/auth');
  console.log('Request query:', req.query);
  
  try {
    const { businessProfileId } = req.query;
    console.log('Received request for businessProfileId:', businessProfileId);

    if (!businessProfileId) {
      console.log('No businessProfileId provided');
      return res.status(400).json({ message: 'Business Profile ID is required' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID is not set in environment variables');
      return res.status(500).json({ 
        message: 'Server configuration error: Google Client ID is missing',
        error: 'Missing Client ID'
      });
    }

    // Generate the OAuth URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent('https://bidi-express.vercel.app/google-business-callback')}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('https://www.googleapis.com/auth/business.manage')}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${businessProfileId}`;

    console.log('Generated auth URL:', authUrl);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      message: 'Failed to generate authorization URL',
      error: error.message
    });
  }
});

// Add this new route handler
router.get('/business-profile/status', async (req, res) => {
  try {
    const { businessProfileId } = req.query;
    
    console.log('Checking status for businessProfileId:', businessProfileId);
    
    if (!businessProfileId) {
      console.log('Missing businessProfileId');
      return res.status(400).json({ 
        error: 'Missing businessProfileId',
        connected: false 
      });
    }

    // Check if we have valid tokens for this business profile
    const { data: tokens, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('business_profile_id', businessProfileId)
      .single();

    console.log('Token query result:', { tokens, tokenError });

    if (tokenError) {
      console.log('Token error:', tokenError);
      return res.json({ connected: false });
    }

    if (!tokens) {
      console.log('No tokens found');
      return res.json({ connected: false });
    }

    // Check if tokens are expired
    const now = new Date();
    const tokenExpiry = new Date(tokens.expires_at);
    
    // Add a 5-minute buffer to account for timezone differences and clock skew
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    const isExpired = now.getTime() + bufferTime > tokenExpiry.getTime();
    
    console.log('Token expiry check:', { 
      now: now.toISOString(), 
      tokenExpiry: tokenExpiry.toISOString(), 
      isExpired,
      bufferTime
    });
    
    if (isExpired) {
      console.log('Tokens are expired');
      return res.json({ connected: false });
    }

    console.log('Connection is valid');
    return res.json({ connected: true });
  } catch (error) {
    console.error('Error checking connection status:', error);
    return res.status(500).json({ 
      error: 'Failed to check connection status',
      connected: false 
    });
  }
});

// Add this helper function at the top of the file
const getOneYearFromNow = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString();
};

// Update the token storage in the callback route
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    console.log('Received callback with code and state:', { code, state });

    if (!code || !state) {
      console.error('Missing code or state in callback');
      return res.redirect('/google-business-error?error=missing_parameters');
    }

    // Parse the state parameter to get the business profile ID
    const businessProfileId = state;
    console.log('Business Profile ID from state:', businessProfileId);

    // Exchange the code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'https://bidi-express.vercel.app/google-business-callback',
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token } = tokenResponse.data;

    // Store the tokens in the database
    const { error: tokenError } = await supabase
      .from('oauth_tokens')
      .upsert({
        business_profile_id: businessProfileId,
        access_token,
        refresh_token,
        expires_at: getOneYearFromNow(),
        created_at: new Date().toISOString()
      });

    if (tokenError) {
      console.error('Error storing tokens:', tokenError);
      return res.redirect('/google-business-error?error=token_storage_failed');
    }

    // Get business profile information
    const profileResponse = await axios.get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const account = profileResponse.data.accounts[0];
    const accountId = account.name.split('/')[1];

    // Get location information
    const locationResponse = await axios.get(`https://mybusinessaccountmanagement.googleapis.com/v1/accounts/${accountId}/locations`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const location = locationResponse.data.locations[0];
    const locationId = location.name.split('/')[3];

    // Send success message to opener window
    const successMessage = {
      type: 'GOOGLE_BUSINESS_AUTH_SUCCESS',
      accountId,
      locationId,
      businessName: location.locationName,
      location: location.address.addressLines.join(', ')
    };

    // Return HTML that sends the message and redirects
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage(${JSON.stringify(successMessage)}, 'https://bidi-express.vercel.app');
              window.location.href = '/google-business-success';
            } else {
              window.location.href = '/google-business-error?error=no_opener';
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in callback:', error);
    const errorMessage = {
      type: 'GOOGLE_BUSINESS_AUTH_ERROR',
      error: error.message || 'Failed to complete authentication'
    };
    
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage(${JSON.stringify(errorMessage)}, 'https://bidi-express.vercel.app');
              window.location.href = '/google-business-error?error=${encodeURIComponent(error.message)}';
            } else {
              window.location.href = '/google-business-error?error=no_opener';
            }
          </script>
        </body>
      </html>
    `);
  }
});

module.exports = router; 