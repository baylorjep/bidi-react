const express = require('express');
const router = express.Router();
const axios = require('axios');

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

module.exports = router; 