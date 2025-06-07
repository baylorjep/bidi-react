import { google } from 'googleapis';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { placeId } = req.query;

  if (!placeId) {
    return res.status(400).json({ message: 'Place ID is required' });
  }

  try {
    // Initialize the Places API client
    const places = google.places({
      version: 'v1',
      auth: process.env.GOOGLE_API_KEY
    });

    // Fetch place details including reviews
    const response = await places.places.details({
      place_id: placeId,
      fields: ['reviews']
    });

    const reviews = response.data.result.reviews || [];

    // Format the reviews to match our schema
    const formattedReviews = reviews.map(review => ({
      author_name: review.author_name,
      rating: review.rating,
      text: review.text,
      time: new Date(review.time * 1000).toISOString(), // Convert Unix timestamp to ISO string
      review_id: review.review_id
    }));

    return res.status(200).json({ reviews: formattedReviews });
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch Google reviews',
      error: error.message 
    });
  }
} 