import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import StarIcon from '../../../assets/star-duotone.svg';
import EmptyStarIcon from '../../../assets/userpov-vendor-profile-star.svg';

const GoogleReviews = ({ businessId }) => {
  const [googleReviews, setGoogleReviews] = useState([]);
  const [googleRating, setGoogleRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGoogleReviews = async () => {
      try {
        // First, get the business's Google Place ID
        const { data: businessData, error: businessError } = await supabase
          .from('business_profiles')
          .select('google_place_id')
          .eq('id', businessId)
          .single();

        if (businessError) {
          console.error('Error fetching business data:', businessError);
          setLoading(false);
          return;
        }

        if (!businessData?.google_place_id) {
          setLoading(false);
          return;
        }

        // Fetch reviews from Google Places API
        const response = await fetch(`/api/google-reviews?placeId=${businessData.google_place_id}`);
        if (!response.ok) throw new Error('Failed to fetch Google reviews');

        const data = await response.json();
        setGoogleReviews(data.reviews || []);
        setGoogleRating(data.rating);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching Google reviews:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchGoogleReviews();
  }, [businessId]);

  if (loading) return <div className="loading-reviews">Loading Google reviews...</div>;
  if (error) return null; // Don't show anything if there's an error
  if (!googleReviews.length) return null; // Don't show anything if there are no reviews

  return (
    <div className="google-reviews-section">
      <div className="google-reviews-header">
        <h3>Google Reviews</h3>
        {googleRating && (
          <div className="google-rating">
            <span className="rating-value">{googleRating}</span>
            <div className="rating-stars">
              {[...Array(5)].map((_, i) => (
                <img
                  key={i}
                  src={i < Math.round(googleRating) ? StarIcon : EmptyStarIcon}
                  alt="Star"
                  className="star-icon-portfolio"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="google-reviews-grid">
        {googleReviews.map((review, index) => (
          <div key={index} className="google-review-card">
            <div className="review-header">
              <div className="reviewer-info">
                <div className="reviewer-avatar">
                  {review.author_name?.[0] || '?'}
                </div>
                <div className="reviewer-details">
                  <span className="reviewer-name">{review.author_name}</span>
                  <span className="review-date">
                    {new Date(review.time * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="review-rating">
                {[...Array(5)].map((_, i) => (
                  <img
                    key={i}
                    src={i < review.rating ? StarIcon : EmptyStarIcon}
                    alt="Star"
                    className="review-star"
                  />
                ))}
              </div>
            </div>
            <div className="review-content">
              {review.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoogleReviews; 